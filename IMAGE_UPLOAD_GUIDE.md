# Image Upload Guide for Wishmasters UI Update

## 📁 Image Storage Location
All images should be stored in: `apps/web/public/images/`

## 🖼️ Images Needed for Hero Section

### 1. **Mobile Version** 
**File name:** `hero-car-mobile.jpg`
**Location:** `apps/web/public/images/hero-car-mobile.jpg`
**Dimensions:** 768px × 1080px (9:16 ratio - portrait)
**Image:** The vertical/portrait version of the Range Rover image (Image 2 from your attachments)
**Specifications:**
- Format: JPG (high quality)
- File size: < 200KB
- Aspect ratio: 9:16 (portrait)
- Content: Range Rover on city street (vertical crop)

### 2. **Desktop Version**
**File name:** `hero-car-desktop.jpg`
**Location:** `apps/web/public/images/hero-car-desktop.jpg`
**Dimensions:** 1920px × 1080px (16:9 ratio - landscape)
**Image:** The wider/landscape street scene (Image 3 from your attachments)
**Specifications:**
- Format: JPG (high quality)
- File size: < 400KB
- Aspect ratio: 16:9 (landscape/widescreen)
- Content: Range Rover with building architecture (horizontal crop)

## 🚀 Implementation Details

### What Changed in Code:
1. **Removed:** Black solid background
2. **Added:** Responsive image switching based on screen size
   - Mobile (< 768px): Uses `hero-car-mobile.jpg`
   - Desktop (≥ 768px): Uses `hero-car-desktop.jpg`
3. **Adjusted:** Overlay opacity for better text readability
   - Mobile: `from-black/70` (lighter overlay)
   - Desktop: `from-black/80` (darker overlay)

### CSS Breakpoint Used:
- `md:hidden` = Hide mobile image on tablets/desktop (screen-width ≥ 768px)
- `hidden md:block` = Show desktop image on tablets/desktop

### Fallback Behavior:
If images fail to load, SVG placeholders automatically display with text

## 📋 Steps to Upload Real Images:

1. **Prepare your images:**
   - Image 2 (Vertical Range Rover) → Save as `hero-car-mobile.jpg`
   - Image 3 (Horizontal street scene) → Save as `hero-car-desktop.jpg`

2. **Upload to folder:**
   ```
   apps/web/public/images/
   ├── hero-car-mobile.jpg ← Portrait version
   └── hero-car-desktop.jpg ← Landscape version
   ```

3. **Test:**
   - View on mobile: Should see Image 2 (portrait)
   - View on desktop: Should see Image 3 (landscape)
   - Responsive transition at 768px breakpoint

## ✅ Benefits:
- ✨ Professional responsive design
- 📱 Optimized for mobile (smaller file size with portrait crop)
- 🖥️ Full widescreen view on desktop
- 🎨 Maintained text readability with overlay
- ⚡ Fallback SVG placeholders if images fail

## 🎯 Quality Checklist:
- [ ] Images are JPG format (compressed)
- [ ] Mobile version is portrait (9:16 or taller)
- [ ] Desktop version is landscape (16:9)
- [ ] Images show Range Rover prominently
- [ ] File sizes optimized (<200KB mobile, <400KB desktop)
- [ ] No red/watermark overlays blocking content
- [ ] Text overlay remains readable with gradient
