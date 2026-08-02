import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const svgLogo = `<svg viewBox="0 0 512 512" width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="512" height="512" rx="100" fill="#050505"/>
  
  <!-- Subtle ambient radial gold glow behind logo -->
  <circle cx="256" cy="256" r="200" fill="url(#bgGlow)" opacity="0.3"/>

  <!-- MUSICAL LINES / PORTÉES -->
  <g stroke="#D4AF37" stroke-width="3" opacity="0.5" stroke-linecap="round">
    <line x1="102" y1="384" x2="410" y2="384" />
    <line x1="76" y1="410" x2="436" y2="410" />
    <line x1="51" y1="435" x2="461" y2="435" />
  </g>

  <!-- EIGHTH NOTES ON THE STAFF -->
  <g fill="#D4AF37" opacity="0.8">
    <circle cx="120" cy="384" r="10" />
    <rect x="126" y="330" width="4" height="54" rx="2" />
    <path d="M130 330 Q150 340 150 360 L146 360 Q146 345 130 336 Z" />

    <circle cx="392" cy="384" r="10" />
    <rect x="398" y="330" width="4" height="54" rx="2" />
    <path d="M402 330 Q422 340 422 360 L418 360 Q418 345 402 336 Z" />
  </g>

  <!-- MAIN LETTER 'A' -->
  <path d="M256 77 L435 461 H358 L256 230 L154 461 H77 L256 77 Z"
        fill="url(#goldGradient)"
        stroke="#D4AF37"
        stroke-width="7.5"
        stroke-linejoin="round"/>
        
  <!-- CROSS BAR OF 'A' -->
  <path d="M195 333 H317"
        stroke="#D4AF37"
        stroke-width="15"
        stroke-linecap="round"/>

  <!-- CROWN AT THE TOP -->
  <g transform="translate(0, 5)">
    <!-- Crown Base -->
    <path d="M205 92 H307 L317 61 L281 77 L256 41 L231 77 L195 61 L205 92 Z" fill="url(#crownGradient)" stroke="#D4AF37" stroke-width="2"/>
    <!-- Jewels -->
    <circle cx="256" cy="48" r="6" fill="#FFF2A3" />
    <circle cx="210" cy="69" r="4.5" fill="#FFF2A3" />
    <circle cx="302" cy="69" r="4.5" fill="#FFF2A3" />
  </g>

  <!-- GRADIENTS -->
  <defs>
    <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#D4AF37" />
      <stop offset="100%" stop-color="#050505" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="goldGradient" x1="256" y1="77" x2="256" y2="461" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FFF2A3" />
      <stop offset="40%" stop-color="#F1C40F" />
      <stop offset="75%" stop-color="#D4AF37" />
      <stop offset="100%" stop-color="#8A6707" />
    </linearGradient>
    <linearGradient id="crownGradient" x1="256" y1="41" x2="256" y2="92" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FFF2A3" />
      <stop offset="100%" stop-color="#D4AF37" />
    </linearGradient>
  </defs>
</svg>`;

// Maskable SVG with safe margin
const svgMaskable = `<svg viewBox="0 0 512 512" width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#050505"/>
  <g transform="translate(51.2, 51.2) scale(0.8)">
    ${svgLogo.replace(/<svg[^>]*>/, '').replace('</svg>', '')}
  </g>
</svg>`;

async function generate() {
  const publicDir = path.join(process.cwd(), 'public');
  
  const svgBuffer = Buffer.from(svgLogo);
  const maskableBuffer = Buffer.from(svgMaskable);

  // Generate 512x512
  await sharp(svgBuffer).resize(512, 512).png().toFile(path.join(publicDir, 'logo.png'));
  await sharp(svgBuffer).resize(512, 512).png().toFile(path.join(publicDir, 'logo-512.png'));
  await sharp(svgBuffer).resize(512, 512).png().toFile(path.join(publicDir, 'logo_afrigombo.png'));
  
  // Generate 192x192
  await sharp(svgBuffer).resize(192, 192).png().toFile(path.join(publicDir, 'logo-192.png'));
  await sharp(svgBuffer).resize(192, 192).png().toFile(path.join(publicDir, 'pwa-192x192.png'));

  // Generate Apple Touch Icon 180x180
  await sharp(svgBuffer).resize(180, 180).png().toFile(path.join(publicDir, 'apple-touch-icon.png'));

  // Generate Favicon 64x64 and 32x32
  await sharp(svgBuffer).resize(64, 64).png().toFile(path.join(publicDir, 'favicon.png'));
  await sharp(svgBuffer).resize(32, 32).png().toFile(path.join(publicDir, 'favicon-32x32.png'));

  // Maskable icon 512x512
  await sharp(maskableBuffer).resize(512, 512).png().toFile(path.join(publicDir, 'maskable-icon.png'));

  // Also save SVG files directly
  fs.writeFileSync(path.join(publicDir, 'logo.svg'), svgLogo);

  console.log('✅ Official AFRIGOMBO "A" Logo icons generated successfully!');
}

generate().catch(console.error);
