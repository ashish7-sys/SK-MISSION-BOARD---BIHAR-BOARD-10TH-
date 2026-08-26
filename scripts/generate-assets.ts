import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import https from 'https';

// Exact Google Drive official logo source URL
export const GOOGLE_DRIVE_LOGO_URL = "https://drive.google.com/file/d/1s6JwkkfRlHQMnkP0W5NHS4m6E3QBDSw6/view?usp=drivesdk";

function extractGoogleDriveFileId(url: string): string | null {
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return idMatch ? idMatch[1] : null;
}

function downloadUrlToBuffer(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      // Follow redirects
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadUrlToBuffer(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP status ${res.statusCode}`));
      }
      const chunks: Buffer[] = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function getValidLogoBuffer(): Promise<Buffer> {
  // Check local high-res master file first if already valid
  const localCandidates = [
    'public/sk_logo.png',
    'src/assets/images/sk_logo.png',
    'public/sk_app_icon.png'
  ];

  for (const localPath of localCandidates) {
    if (fs.existsSync(localPath)) {
      try {
        const rawBuf = fs.readFileSync(localPath);
        const metadata = await sharp(rawBuf).metadata();
        if (metadata && metadata.width && metadata.width >= 512) {
          console.log(`✓ Using verified high-res local logo asset: ${localPath} (${metadata.format}, ${metadata.width}x${metadata.height})`);
          return await sharp(rawBuf).png().toBuffer();
        }
      } catch (err: any) {
        console.warn(`Local file ${localPath} is not readable by sharp:`, err?.message);
      }
    }
  }

  const fileId = extractGoogleDriveFileId(GOOGLE_DRIVE_LOGO_URL) || "1s6JwkkfRlHQMnkP0W5NHS4m6E3QBDSw6";
  const downloadEndpoints = [
    `https://lh3.googleusercontent.com/d/${fileId}`,
    `https://drive.google.com/uc?export=download&id=${fileId}`
  ];

  for (const endpoint of downloadEndpoints) {
    try {
      console.log(`Fetching official logo from Google Drive: ${endpoint}`);
      const rawBuf = await downloadUrlToBuffer(endpoint);
      const metadata = await sharp(rawBuf).metadata();
      if (metadata && metadata.width && metadata.height) {
        console.log(`✓ Verified Google Drive image format: ${metadata.format} (${metadata.width}x${metadata.height})`);
        return await sharp(rawBuf).png().toBuffer();
      }
    } catch (e: any) {
      console.warn(`Could not load from ${endpoint}:`, e?.message || e);
    }
  }

  throw new Error("Unable to obtain a valid image buffer for SK MISSION BOARD logo");
}

async function makeSquare(logoBuf: Buffer, size: number): Promise<Buffer> {
  return sharp(logoBuf)
    .resize(size, size, { fit: 'contain', background: { r: 15, g: 23, b: 42, alpha: 1 } })
    .png()
    .toBuffer();
}

async function makeRound(logoBuf: Buffer, size: number): Promise<Buffer> {
  const circleSvg = Buffer.from(
    `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`
  );
  return sharp(logoBuf)
    .resize(size, size, { fit: 'cover' })
    .composite([{ input: circleSvg, blend: 'dest-in' }])
    .png()
    .toBuffer();
}

async function makeAdaptiveForeground(logoBuf: Buffer, size: number): Promise<Buffer> {
  const innerSize = Math.round(size * 0.72);
  const inner = await sharp(logoBuf)
    .resize(innerSize, innerSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const pad = Math.round((size - innerSize) / 2);
  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([{ input: inner, top: pad, left: pad }])
    .png()
    .toBuffer();
}

async function run() {
  console.log('=== SK MISSION BOARD: Official Asset Generation ===');
  console.log(`Configured Google Drive URL: ${GOOGLE_DRIVE_LOGO_URL}`);
  
  const masterLogoBuffer = await getValidLogoBuffer();

  // 1. Sync Web & Local Master Assets in parallel
  console.log('Generating web and project logo assets...');
  const [master512, masterJpg, favicon64, favicon192] = await Promise.all([
    sharp(masterLogoBuffer).resize(512, 512).png().toBuffer(),
    sharp(masterLogoBuffer).resize(512, 512).jpeg({ quality: 95 }).toBuffer(),
    sharp(masterLogoBuffer).resize(64, 64).png().toBuffer(),
    sharp(masterLogoBuffer).resize(192, 192).png().toBuffer()
  ]);

  fs.writeFileSync('public/sk_logo.png', master512);
  fs.writeFileSync('public/sk_app_icon.png', master512);
  fs.writeFileSync('src/assets/images/sk_logo.png', master512);
  fs.writeFileSync('public/sk_app_icon.jpg', masterJpg);
  fs.writeFileSync('public/favicon.png', favicon64);
  fs.writeFileSync('public/favicon-192.png', favicon192);
  console.log('✓ Master web assets generated (sk_logo.png, sk_app_icon.png, favicon.png, favicon-192.png)');

  // 2. Generate Android Mipmap Icons in parallel
  console.log('Generating Android Mipmap icons with official SK Mission Board crest...');
  const densities = [
    { name: 'mdpi', icon: 48, fg: 108 },
    { name: 'hdpi', icon: 72, fg: 162 },
    { name: 'xhdpi', icon: 96, fg: 216 },
    { name: 'xxhdpi', icon: 144, fg: 324 },
    { name: 'xxxhdpi', icon: 192, fg: 432 }
  ];

  await Promise.all(densities.map(async (d) => {
    const dir = path.join('android/app/src/main/res', `mipmap-${d.name}`);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const [squareBuf, roundBuf, fgBuf] = await Promise.all([
      makeSquare(masterLogoBuffer, d.icon),
      makeRound(masterLogoBuffer, d.icon),
      makeAdaptiveForeground(masterLogoBuffer, d.fg)
    ]);

    fs.writeFileSync(path.join(dir, 'ic_launcher.png'), squareBuf);
    fs.writeFileSync(path.join(dir, 'ic_launcher_round.png'), roundBuf);
    fs.writeFileSync(path.join(dir, 'ic_launcher_foreground.png'), fgBuf);
    console.log(`✓ Generated android mipmap-${d.name}`);
  }));

  // 3. Generate Android Splash Screens in parallel
  console.log('Generating Android Splash Screens with SK Mission Board theme...');
  const splashes = [
    { dir: 'drawable', w: 480, h: 800 },
    { dir: 'drawable-land-mdpi', w: 480, h: 320 },
    { dir: 'drawable-land-hdpi', w: 800, h: 480 },
    { dir: 'drawable-land-xhdpi', w: 1280, h: 720 },
    { dir: 'drawable-land-xxhdpi', w: 1600, h: 960 },
    { dir: 'drawable-land-xxxhdpi', w: 1920, h: 1080 },
    { dir: 'drawable-port-mdpi', w: 320, h: 480 },
    { dir: 'drawable-port-hdpi', w: 480, h: 800 },
    { dir: 'drawable-port-xhdpi', w: 720, h: 1280 },
    { dir: 'drawable-port-xxhdpi', w: 960, h: 1600 },
    { dir: 'drawable-port-xxxhdpi', w: 1080, h: 1920 }
  ];

  await Promise.all(splashes.map(async (s) => {
    const targetDir = path.join('android/app/src/main/res', s.dir);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    const logoSize = Math.min(Math.round(Math.min(s.w, s.h) * 0.42), 320);
    const logoSquare = await makeSquare(masterLogoBuffer, logoSize);

    const splashBuf = await sharp({
      create: {
        width: s.w,
        height: s.h,
        channels: 4,
        background: { r: 15, g: 23, b: 42, alpha: 1 } // Slate 900
      }
    })
      .composite([{
        input: logoSquare,
        top: Math.round((s.h - logoSize) / 2),
        left: Math.round((s.w - logoSize) / 2)
      }])
      .png()
      .toBuffer();

    fs.writeFileSync(path.join(targetDir, 'splash.png'), splashBuf);
    console.log(`✓ Generated ${s.dir}/splash.png (${s.w}x${s.h})`);
  }));

  console.log('=== ALL ANDROID ICONS & ASSETS SUCCESSFULLY GENERATED! ===');
  process.exit(0);
}

run().catch(err => {
  console.error("Asset generation error:", err);
  process.exit(1);
});
