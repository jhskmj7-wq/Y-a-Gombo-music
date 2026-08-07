const sharp = require('sharp');
const path = require('path');

async function generateIcons() {
  const logoPath = path.join(__dirname, 'public', 'logo.svg');
  
  await sharp(logoPath)
    .resize(192, 192)
    .toFile(path.join(__dirname, 'public', 'pwa-192x192.png'));
    
  await sharp(logoPath)
    .resize(512, 512)
    .toFile(path.join(__dirname, 'public', 'pwa-512x512.png'));
    
  await sharp(logoPath)
    .resize(512, 512)
    .toFile(path.join(__dirname, 'public', 'pwa-512x512-maskable.png'));
    
  console.log('Icons generated successfully');
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
