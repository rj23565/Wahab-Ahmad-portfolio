from PIL import Image, ImageEnhance, ImageFilter
import math, os

src = "/home/user/portfolio/public/profile-original.jpg"
dst = "/home/user/portfolio/public/profile.jpg"

img = Image.open(src).convert("RGB")
w, h = img.size
px = img.load()

# Build a premium midnight gradient background
bg = Image.new("RGB", (w, h), 0)
bgp = bg.load()
cx, cy = w * 0.55, h * 0.25
for y in range(h):
    for x in range(w):
        # radial glow top-right (key light)
        d1 = math.hypot(x - cx, y - cy) / max(w, h)
        glow = max(0.0, 1.0 - d1 * 1.6)
        # vertical gradient
        v = y / h
        r = int(10 + 25 * glow + 5 * (1 - v))
        g = int(12 + 30 * glow + 8 * (1 - v))
        b = int(26 + 60 * glow + 18 * (1 - v))
        bgp[x, y] = (min(r, 60), min(g, 70), min(b, 100))

# Composite: detect near-black (original bg) and blend with new bg
out = Image.new("RGB", (w, h))
op = out.load()
for y in range(h):
    for x in range(w):
        r, g, b = px[x, y]
        lum = 0.299 * r + 0.587 * g + 0.114 * b
        # alpha of subject: how far from pure black
        if lum < 18:
            a = 0.0
        elif lum < 55:
            a = (lum - 18) / 37.0
        else:
            a = 1.0
        # slight vignette on subject edges
        br, bg_, bb = bgp[x, y]
        nr = int(r * a + br * (1 - a))
        ng = int(g * a + bg_ * (1 - a))
        nb = int(b * a + bb * (1 - a))
        op[x, y] = (nr, ng, nb)

# Subtle enhancements on the composed image
out = ImageEnhance.Contrast(out).enhance(1.08)
out = ImageEnhance.Color(out).enhance(1.05)
out = ImageEnhance.Sharpness(out).enhance(1.25)

# Vignette
vignette = Image.new("L", (w, h), 0)
vp = vignette.load()
for y in range(h):
    for x in range(w):
        dx = (x - w/2) / (w/2)
        dy = (y - h/2) / (h/2)
        d = math.sqrt(dx*dx + dy*dy)
        v = max(0, min(255, int(255 * max(0, 1 - d*0.75))))
        vp[x, y] = v
black = Image.new("RGB", (w, h), (5, 7, 13))
out = Image.composite(out, black, vignette)

out.save(dst, "JPEG", quality=92, optimize=True)
print("Saved:", dst, os.path.getsize(dst), "bytes")
