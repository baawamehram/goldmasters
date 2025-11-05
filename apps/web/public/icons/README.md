# PWA Icons Guide

## 🚀 EASIEST WAY - Auto-Generate Icons

**Just open `generate-icons.html` in your browser!**

1. Double-click `generate-icons.html` in this folder
2. Icons will auto-generate with professional GM branding
3. Click "⬇️ Download All Icons as ZIP" 
4. Save all PNG files to this folder

Done! No manual editing needed.

---

## Required Icons for Goldmasters PWA

You need to create the following icon sizes and place them in this directory:

- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png (Apple Touch Icon)
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

## Icon Design Guidelines

1. Use the Goldmasters logo with the star symbol
2. Use brand colors: Green (#055F3C) and Gold (#fbbf24)
3. Ensure icons are square with proper padding
4. Use transparent or white background
5. Make sure the icon is recognizable at all sizes

## Quick Generation

You can use online tools like:
- https://www.pwabuilder.com/imageGenerator
- https://realfavicongenerator.net/

Or use ImageMagick to resize a master icon:
```bash
convert icon-master.png -resize 72x72 icon-72x72.png
convert icon-master.png -resize 96x96 icon-96x96.png
convert icon-master.png -resize 128x128 icon-128x128.png
convert icon-master.png -resize 144x144 icon-144x144.png
convert icon-master.png -resize 152x152 icon-152x152.png
convert icon-master.png -resize 192x192 icon-192x192.png
convert icon-master.png -resize 384x384 icon-384x384.png
convert icon-master.png -resize 512x512 icon-512x512.png
```

## Testing

After adding icons, test your PWA:
1. Open Chrome DevTools
2. Go to Application > Manifest
3. Verify all icons are loading correctly
4. Test the install prompt on mobile and desktop
