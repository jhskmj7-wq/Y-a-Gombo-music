from PIL import Image
import cairosvg
import io

def generate_png(svg_path, png_path, size):
    # Convert SVG to PNG using cairosvg
    png_data = cairosvg.svg2png(url=svg_path, output_width=size, output_height=size)
    
    # Save PNG
    with open(png_path, 'wb') as f:
        f.write(png_data)
    
    print(f'Generated {png_path}')

generate_png('public/logo.svg', 'public/pwa-192x192.png', 192)
generate_png('public/logo.svg', 'public/pwa-512x512.png', 512)
generate_png('public/logo.svg', 'public/pwa-512x512-maskable.png', 512)
