import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const svgBuffer = fs.readFileSync(path.resolve('./public/logo.svg'));

async function generate() {
  await sharp(svgBuffer).resize(192, 192).png().toFile('./public/pwa-192x192.png');
  await sharp(svgBuffer).resize(512, 512).png().toFile('./public/pwa-512x512.png');
  await sharp(svgBuffer).resize(512, 512).png().toFile('./public/pwa-512x512-maskable.png');
  console.log('Icons generated');
}

generate().catch(console.error);
