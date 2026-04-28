# Icons Required

This folder needs 3 PNG files:
- `icon16.png` (16x16px)
- `icon48.png` (48x48px)  
- `icon128.png` (128x128px)

## Quick Fix

Create simple green squares:

```bash
# Using ImageMagick
convert -size 16x16 xc:"#00ff00" icon16.png
convert -size 48x48 xc:"#00ff00" icon48.png
convert -size 128x128 xc:"#00ff00" icon128.png
```

Or download any square image and rename it.
