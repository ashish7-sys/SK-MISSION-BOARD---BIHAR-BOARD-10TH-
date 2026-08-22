import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const LOGO_SRC = 'src/assets/images/sk_logo.png';
const BG_FRAME_SRC = 'src/assets/images/cyber_bg.jpg';

async function makeRound(srcPath: string, size: number): Promise<Buffer> {
  const circleSvg = Buffer.from(
    `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`
  );
  return sharp(srcPath)
    .resize(size, size, { fit: 'cover' })
    .composite([{ input: circleSvg, blend: 'dest-in' }])
    .png()
    .toBuffer();
}

async function makeSquare(srcPath: string, size: number): Promise<Buffer> {
  return sharp(srcPath)
    .resize(size, size, { fit: 'cover' })
    .png()
    .toBuffer();
}

async function makeAdaptiveForeground(srcPath: string, size: number): Promise<Buffer> {
  // Center logo inside adaptive icon canvas (takes ~72% of canvas)
  const innerSize = Math.round(size * 0.72);
  const inner = await sharp(srcPath)
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
  console.log('Generating Android Mipmap icons with user logo...');
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

    const squareBuf = await makeSquare(LOGO_SRC, d.icon);
    fs.writeFileSync(path.join(dir, 'ic_launcher.png'), squareBuf);

    const roundBuf = await makeRound(LOGO_SRC, d.icon);
    fs.writeFileSync(path.join(dir, 'ic_launcher_round.png'), roundBuf);

    const fgBuf = await makeAdaptiveForeground(LOGO_SRC, d.fg);
    fs.writeFileSync(path.join(dir, 'ic_launcher_foreground.png'), fgBuf);

    console.log(`✓ Generated mipmap-${d.name}`);
  }

  console.log('Generating Splash Screens with user theme...');
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

    const bgResized = await sharp(BG_FRAME_SRC)
      .resize(s.w, s.h, { fit: 'cover' })
      .toBuffer();

    const logoSize = Math.min(Math.round(Math.min(s.w, s.h) * 0.4), 256);
    const logoCircle = await makeRound(LOGO_SRC, logoSize);

    const splashBuf = await sharp(bgResized)
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
  const logoPng = await sharp(LOGO_SRC).png().toBuffer();
  fs.writeFileSync('public/sk_logo.png', logoPng);
  fs.writeFileSync('public/sk_app_icon.png', logoPng);

  const faviconBuf = await sharp(LOGO_SRC).resize(64, 64).png().toBuffer();
  fs.writeFileSync('public/favicon.png', faviconBuf);

  const logoJpg = await sharp(LOGO_SRC).jpeg({ quality: 95 }).toBuffer();
  fs.writeFileSync('public/sk_app_icon.jpg', logoJpg);
  fs.writeFileSync('src/assets/images/sk_app_icon_1786687497579.jpg', logoJpg);
  fs.writeFileSync('src/assets/images/sk_app_icon_1786624162772.jpg', logoJpg);

  const bgJpg = await sharp(BG_FRAME_SRC).jpeg({ quality: 90 }).toBuffer();
  fs.writeFileSync('public/cyber_purple_bg.jpg', bgJpg);
  fs.writeFileSync('src/assets/images/cyber_purple_bg_1786704278990.jpg', bgJpg);

  console.log('ALL ICONS AND ASSETS SUCCESSFULLY GENERATED!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
