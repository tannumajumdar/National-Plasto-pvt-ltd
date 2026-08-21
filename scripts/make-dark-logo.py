"""
Generate reversed-out logo variants for dark surfaces.

The client supplied only the light-background artwork: dark ink wordmark, blue
arc, red script. Flattening that to a white silhouette (`brightness-0 invert`)
works but throws the brand colours away.

This recolours instead — the near-black ink becomes the cream used elsewhere on
brand surfaces, while the blue and the red are kept and lifted slightly so they
still read against ink navy. Alpha is preserved untouched, so antialiased edges
stay clean against a dark background rather than fringing.

Regenerate after replacing the source logo:
    python scripts/make-dark-logo.py

Ideally the client sends a real reversed-out file and this becomes unnecessary.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pnglib  # noqa: E402

LOGO_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "logo")

# --brand-foreground: hsl(40 92% 97%) — the cream already used on brand surfaces.
INK_REPLACEMENT = (254, 249, 240)

# How far to lift the chromatic parts toward white so they hold up on navy.
LIFT = 0.22


def lift(channel: int) -> int:
    return round(channel + (255 - channel) * LIFT)


def classify(r: int, g: int, b: int) -> str:
    mx, mn = max(r, g, b), min(r, g, b)
    if mx - mn < 40:
        return "neutral"
    if b > r and b > g:
        return "blue"
    if r > g and r > b:
        return "red"
    return "other"


def convert(src_name: str, out_name: str) -> None:
    src = os.path.join(LOGO_DIR, src_name)
    out = os.path.join(LOGO_DIR, out_name)

    w, h, px = pnglib.read_rgba(src)
    data = bytearray(px)

    counts = {"ink": 0, "kept": 0}
    for i in range(0, len(data), 4):
        a = data[i + 3]
        if a == 0:
            continue

        r, g, b = data[i], data[i + 1], data[i + 2]
        kind = classify(r, g, b)

        if kind == "neutral":
            # Dark ink -> cream. Anything already light stays light.
            if max(r, g, b) < 150:
                data[i], data[i + 1], data[i + 2] = INK_REPLACEMENT
                counts["ink"] += 1
            continue

        data[i] = lift(r)
        data[i + 1] = lift(g)
        data[i + 2] = lift(b)
        counts["kept"] += 1

    pnglib.write_rgba(out, w, h, data)
    size = os.path.getsize(out) / 1024
    print(
        f"{out_name}: {w}x{h}  {size:.0f} KB  "
        f"({counts['ink']} ink pixels recoloured, {counts['kept']} colour pixels lifted)"
    )


convert("national-plasto.png", "national-plasto-dark.png")

# Deliberately NOT generating a dark variant of next-nppl.png: that source is a
# noisy scan (~73 KB for 444px), and lifting its low-alpha compression noise
# leaves a visible haze on a dark background. NextBrandLogo falls back to a CSS
# filter instead. Ask the client for clean vector artwork before changing this.
