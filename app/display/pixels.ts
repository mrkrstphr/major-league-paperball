// Convert one RGBA pixel to grayscale, composited against white so that
// transparent pixels threshold to white rather than black.
function pixelToGray(pixels: Uint8Array, i: number): number {
  const a = pixels[i * 4 + 3] / 255;
  const r = pixels[i * 4]     * a + 255 * (1 - a);
  const g = pixels[i * 4 + 1] * a + 255 * (1 - a);
  const b = pixels[i * 4 + 2] * a + 255 * (1 - a);
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

// 1-bit packed buffer, e-paper convention: 1 = black, 0 = white.
export function pixelsTo1bit(pixels: Uint8Array, width: number, height: number): Buffer {
  const buf = Buffer.alloc(Math.ceil((width * height) / 8), 0);
  for (let i = 0; i < width * height; i++) {
    if (pixelToGray(pixels, i) < 128) {
      buf[Math.floor(i / 8)] |= 1 << (7 - (i % 8));
    }
  }
  return buf;
}

// V1 4bpp packed buffer: upper nibble = left pixel, lower nibble = right pixel.
// 0x3 = white, 0x0 = black.
export function pixelsToV1(pixels: Uint8Array, width: number, height: number): Buffer {
  const buf = Buffer.alloc((width * height) / 2).fill(0x33);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x += 2) {
      const i = y * width + x;
      const nibble0 = pixelToGray(pixels, i)     < 128 ? 0x0 : 0x3;
      const nibble1 = pixelToGray(pixels, i + 1) < 128 ? 0x0 : 0x3;
      buf[i / 2] = (nibble0 << 4) | nibble1;
    }
  }
  return buf;
}
