"""Minimal dependency-free RGBA PNG read/write."""
import struct
import zlib


def read_rgba(path):
    d = open(path, "rb").read()
    w, h = struct.unpack(">II", d[16:24])
    colortype = d[25]
    if colortype != 6:
        raise ValueError(f"expected RGBA (colortype 6), got {colortype}")

    idat = b""
    i = 8
    while i < len(d):
        ln = struct.unpack(">I", d[i : i + 4])[0]
        typ = d[i + 4 : i + 8]
        if typ == b"IDAT":
            idat += d[i + 8 : i + 8 + ln]
        i += 12 + ln

    raw = zlib.decompress(idat)
    stride = w * 4
    out = bytearray()
    prev = bytearray(stride)
    pos = 0
    for _ in range(h):
        f = raw[pos]
        pos += 1
        line = bytearray(raw[pos : pos + stride])
        pos += stride
        if f == 1:
            for x in range(4, stride):
                line[x] = (line[x] + line[x - 4]) & 255
        elif f == 2:
            for x in range(stride):
                line[x] = (line[x] + prev[x]) & 255
        elif f == 3:
            for x in range(stride):
                a = line[x - 4] if x >= 4 else 0
                line[x] = (line[x] + ((a + prev[x]) >> 1)) & 255
        elif f == 4:
            for x in range(stride):
                a = line[x - 4] if x >= 4 else 0
                b = prev[x]
                c = prev[x - 4] if x >= 4 else 0
                p = a + b - c
                pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                line[x] = (line[x] + pr) & 255
        out += line
        prev = line
    return w, h, out


def write_rgba(path, w, h, px):
    raw = bytearray()
    stride = w * 4
    for y in range(h):
        raw.append(0)  # filter: none
        raw += px[y * stride : (y + 1) * stride]

    def chunk(typ, data):
        return (
            struct.pack(">I", len(data))
            + typ
            + data
            + struct.pack(">I", zlib.crc32(typ + data) & 0xFFFFFFFF)
        )

    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(bytes(raw), 9))
    png += chunk(b"IEND", b"")
    open(path, "wb").write(png)


def crop(w, h, px, x0, y0, x1, y1):
    cw, ch = x1 - x0, y1 - y0
    out = bytearray()
    for y in range(y0, y1):
        out += px[(y * w + x0) * 4 : (y * w + x1) * 4]
    return cw, ch, out


def resize_box(w, h, px, nw, nh):
    """Box-filter downscale, alpha-weighted so transparent pixels do not
    darken the edges of the result."""
    out = bytearray(nw * nh * 4)
    for ny in range(nh):
        sy0, sy1 = ny * h // nh, max(ny * h // nh + 1, (ny + 1) * h // nh)
        for nx in range(nw):
            sx0, sx1 = nx * w // nw, max(nx * w // nw + 1, (nx + 1) * w // nw)
            r = g = b = a = n = 0
            for y in range(sy0, sy1):
                base = y * w * 4
                for x in range(sx0, sx1):
                    i = base + x * 4
                    al = px[i + 3]
                    r += px[i] * al
                    g += px[i + 1] * al
                    b += px[i + 2] * al
                    a += al
                    n += 1
            o = (ny * nw + nx) * 4
            if a:
                out[o] = min(255, r // a)
                out[o + 1] = min(255, g // a)
                out[o + 2] = min(255, b // a)
                out[o + 3] = a // n
            else:
                out[o : o + 4] = b"\x00\x00\x00\x00"
    return out


def pad_square(w, h, px, pad_frac=0.0, bg=(255, 255, 255, 0)):
    side = int(max(w, h) * (1 + pad_frac * 2))
    out = bytearray(bytes(bg) * (side * side))
    ox, oy = (side - w) // 2, (side - h) // 2
    for y in range(h):
        src = y * w * 4
        dst = ((y + oy) * side + ox) * 4
        out[dst : dst + w * 4] = px[src : src + w * 4]
    return side, side, out
