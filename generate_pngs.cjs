const fs = require('fs');
const sharp = require('sharp');

async function convert() {
  const svgBuffer = fs.readFileSync('public/logo.svg');
  
  const sizes = [
    { name: 'public/logo-192.png', size: 192 },
    { name: 'public/logo-512.png', size: 512 },
    { name: 'public/pwa-192x192.png', size: 192 },
    { name: 'public/pwa-512x512.png', size: 512 },
    { name: 'public/logo_afrigombo.png', size: 512 }
  ];

  for (const item of sizes) {
      console.log(`Generating ${item.name} at ${item.size}x${item.size}...`);
      await sharp(svgBuffer)
        .resize(item.size, item.size)
        .png()
        .toFile(item.name);
  }
  console.log('Done generating PNGs!');
}

convert().catch(console.error);
