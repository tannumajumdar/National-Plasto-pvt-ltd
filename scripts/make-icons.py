"""
Generate app icons from the client's logo.

Uses the blue arc device on its own — at 32px the "National" wordmark is
illegible, whereas the arc stays recognisable. Nothing is redrawn: the pixels
are cropped straight out of the supplied artwork.
"""
import pnglib  # local, in scripts/

SRC = r"E:/National Plasto Pvt Ltd/public/logo/national-plasto.png"
APP = r"E:/National Plasto Pvt Ltd/src/app/"
PUB = r"E:/National Plasto Pvt Ltd/public/"

w, h, px = pnglib.read_rgba(SRC)

# Blue-arc bounding box, measured from the artwork, with a small margin.
X0, Y0, X1, Y1 = 42, 25, 170, 71
M = 6
cw, ch, cp = pnglib.crop(w, h, px, X0 - M, Y0 - M, X1 + M, Y1 + M)
print(f"cropped device: {cw}x{ch}")

# Square canvas, transparent, with breathing room around the mark.
side, _, sq = pnglib.pad_square(cw, ch, cp, pad_frac=0.16)
print(f"square canvas: {side}x{side}")

# icon.png — Next.js App Router picks this up automatically for <link rel=icon>
out = pnglib.resize_box(side, side, sq, 512, 512)
pnglib.write_rgba(APP + "icon.png", 512, 512, out)
print("wrote src/app/icon.png (512x512)")

# apple-icon: iOS composites transparency onto black, so flatten onto white.
apple = bytearray(out)
for i in range(0, len(apple), 4):
    a = apple[i + 3]
    if a < 255:
        inv = 255 - a
        apple[i] = (apple[i] * a + 255 * inv) // 255
        apple[i + 1] = (apple[i + 1] * a + 255 * inv) // 255
        apple[i + 2] = (apple[i + 2] * a + 255 * inv) // 255
        apple[i + 3] = 255
apple180 = pnglib.resize_box(512, 512, apple, 180, 180)
pnglib.write_rgba(APP + "apple-icon.png", 180, 180, apple180)
print("wrote src/app/apple-icon.png (180x180, flattened onto white)")

# A 512 maskable/PWA-style icon on white, for manifests and link previews.
pnglib.write_rgba(PUB + "icon-512.png", 512, 512, apple)
print("wrote public/icon-512.png (512x512 on white)")
