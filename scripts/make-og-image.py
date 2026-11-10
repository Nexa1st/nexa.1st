#!/usr/bin/env python3
"""Generate the default Open Graph image (1200x630 PNG) for NEXA.

Design: dark liquid-glass — deep midnight gradient mesh with soft
blue/violet glows, one frosted glass panel, big NEXA wordmark.
Run with the workspace venv: ~/workspace/tools/venv/bin/python scripts/make-og-image.py
Output: public/og-image.png  (the SVG public/og-default.svg stays as fallback asset)
"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os

W, H = 1200, 630
ROOT = os.path.join(os.path.dirname(__file__), "..")
OUT = os.path.join(ROOT, "public", "og-image.png")

BOLD = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
REG = "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


# --- Base: diagonal gradient mesh (midnight -> deep blue -> violet hint) ---
c1 = (5, 6, 17)      # midnight
c2 = (18, 27, 68)    # deep blue
c3 = (58, 26, 102)   # violet
base = Image.new("RGB", (W, H))
px = base.load()
for y in range(H):
    for x in range(0, W, 4):  # step 4 then resize-smooth below is unnecessary; full loop is fine but slow in py — use small canvas trick
        pass
# Faster: build a small gradient and upscale with bicubic smoothing.
small = Image.new("RGB", (60, 32))
sp = small.load()
for y in range(32):
    for x in range(60):
        t = (x / 59 + y / 31) / 2
        col = lerp(c1, c2, min(t * 1.6, 1.0)) if t < 0.62 else lerp(c2, c3, (t - 0.62) / 0.38)
        sp[x, y] = col
base = small.resize((W, H), Image.BICUBIC)

# --- Aurora glows ---
glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
gd = ImageDraw.Draw(glow)
gd.ellipse([760, -240, 1330, 330], fill=(80, 130, 255, 120))   # top-right blue
gd.ellipse([-220, 330, 350, 900], fill=(150, 80, 255, 90))     # bottom-left violet
gd.ellipse([430, 380, 900, 850], fill=(40, 200, 220, 55))      # teal hint bottom-center
glow = glow.filter(ImageFilter.GaussianBlur(90))
base = Image.alpha_composite(base.convert("RGBA"), glow)

draw = ImageDraw.Draw(base)

# --- Frosted glass panel (rounded, translucent, light border) ---
panel = Image.new("RGBA", (W, H), (0, 0, 0, 0))
pd = ImageDraw.Draw(panel)
pd.rounded_rectangle([64, 84, 1136, 546], radius=44, fill=(255, 255, 255, 26),
                     outline=(255, 255, 255, 90), width=2)
# top highlight line for the glass edge
pd.line([108, 86, 1092, 86], fill=(255, 255, 255, 110), width=2)
panel = panel.filter(ImageFilter.GaussianBlur(0.6))
base = Image.alpha_composite(base, panel)
draw = ImageDraw.Draw(base)

# --- Small glass orbs (decorative, right side) ---
for (cx, cy, r, col) in [(1010, 150, 34, (140, 190, 255, 70)),
                         (1064, 452, 24, (190, 150, 255, 60)),
                         (952, 486, 16, (120, 230, 240, 60))]:
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=col, outline=(255, 255, 255, 70), width=1)

# --- Text ---
def text(x, y, s, font_path, size, fill, tracking=0, anchor_left=True):
    font = ImageFont.truetype(font_path, size)
    if tracking == 0:
        draw.text((x, y), s, font=font, fill=fill)
        return draw.textlength(s, font=font)
    cx = x
    for ch in s:
        draw.text((cx, y), ch, font=font, fill=fill)
        cx += draw.textlength(ch, font=font) + tracking
    return cx - x - tracking

# Eyebrow
text(120, 138, "NEXA.1ST  —  LIQUID GLASS MAGAZINE", REG, 25, (168, 196, 255, 255), tracking=4)
# Wordmark
w = text(114, 178, "NEXA", BOLD, 196, (255, 255, 255, 255), tracking=6)
# Gold accent bar under wordmark
draw.rounded_rectangle([122, 396, 122 + 150, 404], radius=4, fill=(232, 184, 76, 255))
# Tagline
text(120, 428, "AI Tools · Technology · Gaming · Online Business", REG, 40, (207, 224, 255, 255))
# Sub-line
text(120, 486, "Honest guides, tools and stories for creators.", REG, 27, (160, 175, 205, 255))

base.convert("RGB").save(OUT, "PNG", optimize=True)
print("wrote", OUT)
