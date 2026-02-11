"""Generate a mock cover photo for development."""

import struct
import zlib
import os

W, H = 800, 1200
OUT = os.path.join(os.path.dirname(__file__), "photo", "cover.jpg")


def create_pixel_row(y):
    row = []
    for x in range(W):
        r = int(240 - (y / H) * 40 + (x / W) * 15)
        g = int(220 - (y / H) * 50 + (x / W) * 10)
        b = int(210 - (y / H) * 50)
        row.extend([max(0, min(255, r)), max(0, min(255, g)), max(0, min(255, b))])
    return row


def make_png(width, height):
    def chunk(ctype, data):
        c = ctype + data
        return (
            struct.pack(">I", len(data))
            + c
            + struct.pack(">I", zlib.crc32(c) & 0xFFFFFFFF)
        )

    header = b"\x89PNG\r\n\x1a\n"
    ihdr = chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0))
    raw = b""
    for y in range(height):
        raw += b"\x00" + bytes(create_pixel_row(y))
    idat = chunk(b"IDAT", zlib.compress(raw, 9))
    iend = chunk(b"IEND", b"")
    return header + ihdr + idat + iend


if __name__ == "__main__":
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "wb") as f:
        f.write(make_png(W, H))
    print(f"Mock cover photo created: {OUT}")
