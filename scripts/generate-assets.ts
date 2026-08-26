import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const OFFICIAL_LOGO = fs.existsSync('public/sk_logo.png') 
  ? 'public/sk_logo.png' 
  : fs.existsSync('public/sk_app_icon.png')
  ? 'public/sk_app_icon.png'
  : 'public/favicon.svg';

async function makeSquare(size: number): Promise<Buffer> {
  return sharp(OFFICIAL_LOGO)
    .resize(size, size, { fit: 'contain', background: { r: 15, g: 23, b: 42, alpha: 1 } })
    .png()
    .toBuffer();
}

async function makeRound(size: number): Promise<Buffer> {
  const circleSvg = Buffer.from(
    `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`
  );
  return sharp(OFFICIAL_LOGO)
    .resize(size, size, { fit: 'cover' })
    .composite([{ input: circleSvg, blend: 'dest-in' }])
    .png()
    .toBuffer();
}

async function makeAdaptiveForeground(size: number): Promise<Buffer> {
  const innerSize = Math.round(size * 0.72);
  const inner = await sharp(OFFICIAL_LOGO)
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
  console.log('Generating Android Mipmap icons with official SK Mission Board crest...');
  const densities = [
    { name: 'mdpi', icon: 48, fg: 108 },
    { name: 'hdpi', icon: 72, fg: 162 },
    { name: 'xhdpi', icon: 96, fg: 216 },
    { name: 'xxhdpi', icon: 144, fg: 324 },
    { name: 'xxxhdpi', icon: 192, fg: 432 }
  ];

  for (const d of densities) {
    const dir = path.join('android/app/src/main/res', `mipmap-${d.name}`);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const squareBuf = await makeSquare(d.icon);
    fs.writeFileSync(path.join(dir, 'ic_launcher.png'), squareBuf);

    const roundBuf = await makeRound(d.icon);
    fs.writeFileSync(path.join(dir, 'ic_launcher_round.png'), roundBuf);

    const fgBuf = await makeAdaptiveForeground(d.fg);
    fs.writeFileSync(path.join(dir, 'ic_launcher_foreground.png'), fgBuf);

    console.log(`✓ Generated mipmap-${d.name}`);
  }

  console.log('Generating Splash Screens with cyberpunk theme...');
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

  for (const s of splashes) {
    const targetDir = path.join('android/app/src/main/res', s.dir);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    const logoSize = Math.min(Math.round(Math.min(s.w, s.h) * 0.4), 256);
    const logoCircle = await makeSquare(logoSize);

    const splashBuf = await sharp({
      create: {
        width: s.w,
        height: s.h,
        channels: 4,
        background: { r: 15, g: 23, b: 42, alpha: 1 } // Slate 900
      }
    })
      .composite([{
        input: logoCircle,
        top: Math.round((s.h - logoSize) / 2),
        left: Math.round((s.w - logoSize) / 2)
      }])
      .png()
      .toBuffer();

    fs.writeFileSync(path.join(targetDir, 'splash.png'), splashBuf);
    console.log(`✓ Generated ${s.dir}/splash.png (${s.w}x${s.h})`);
  }

  console.log('Generating Web & Project Assets...');
  const logoPng = await sharp(SVG_LOGO).resize(512, 512).png().toBuffer();
  fs.writeFileSync('public/sk_logo.png', logoPng);
  fs.writeFileSync('public/sk_app_icon.png', logoPng);
  fs.writeFileSync('src/assets/images/sk_logo.png', logoPng);

  const faviconBuf = await sharp(SVG_LOGO).resize(64, 64).png().toBuffer();
  fs.writeFileSync('public/favicon.png', faviconBuf);

  const favicon192 = await sharp(SVG_LOGO).resize(192, 192).png().toBuffer();
  fs.writeFileSync('public/favicon-192.png', favicon192);

  console.log('ALL ICONS AND ASSETS SUCCESSFULLY GENERATED!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});

