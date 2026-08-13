import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function generate() {
  const svgPath = path.resolve('public/logo.svg');
  const svgBuffer = fs.readFileSync(svgPath);

  console.log('Generating PWA icons using sharp from public/logo.svg...');

  // 1. 192x192
  await sharp(svgBuffer, { density: 300 })
    .resize(192, 192)
    .png()
    .toFile(path.resolve('public/pwa-192x192.png'));
  console.log('Generated public/pwa-192x192.png (192x192)');

  // 2. 512x512
  await sharp(svgBuffer, { density: 300 })
    .resize(512, 512)
    .png()
    .toFile(path.resolve('public/pwa-512x512.png'));
  console.log('Generated public/pwa-512x512.png (512x512)');

  // 3. 512x512 maskable (with 20% padding/safe zone for Android icons)
  // We can composite the logo centered on a 512x512 #050505 background with padding (e.g. size 384x384 inside 512x512)
  const resizedLogo = await sharp(svgBuffer, { density: 300 })
    .resize(384, 384)
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 5, g: 5, b: 5, alpha: 1 }
    }
  })
    .composite([
      {
        input: resizedLogo,
        left: 64, // (512 - 384) / 2
        top: 64
      }
    ])
    .png()
    .toFile(path.resolve('public/pwa-512x512-maskable.png'));
  console.log('Generated public/pwa-512x512-maskable.png (512x512 maskable with safe zone)');

  // Also update logo.png and favicon-512x512.png etc to be 100% clean
  await sharp(svgBuffer, { density: 300 })
    .resize(512, 512)
    .png()
    .toFile(path.resolve('public/logo.png'));

  await sharp(svgBuffer, { density: 300 })
    .resize(512, 512)
    .png()
    .toFile(path.resolve('public/logo_afrigombo.png'));

  console.log('All PWA icons successfully generated and verified!');
}

generate().catch(err => {
  console.error('Error generating PWA icons:', err);
  process.exit(1);
});
