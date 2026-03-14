import * as fs from 'fs';
import { consoleDebug } from './utils/env';

const SPI_BUS = 0;
const SPI_DEVICE = 0;
const SPI_SPEED = 4000000;
// Linux spidev default transfer size limit; chunk large buffers to stay under it
const CHUNK_SIZE = 4096;

const RST_PIN = 17;
const DC_PIN = 25;
const CS_PIN = 8;
const BUSY_PIN = 24;
const PWR_PIN = 18;

// On Bookworm (kernel 6.6+), the BCM GPIO chip base is no longer 0.
// Detect it from sysfs so pin numbers are correct regardless of kernel version.
function getGpioBase(): number {
  try {
    for (const entry of fs.readdirSync('/sys/class/gpio')) {
      if (!entry.startsWith('gpiochip')) continue;
      try {
        const label = fs.readFileSync(`/sys/class/gpio/${entry}/label`, 'utf8').trim();
        if (/^pinctrl-bcm/i.test(label)) {
          return parseInt(fs.readFileSync(`/sys/class/gpio/${entry}/base`, 'utf8').trim(), 10);
        }
      } catch { /* skip unreadable entries */ }
    }
  } catch { /* sysfs unavailable */ }
  return 0;
}

type Version = '1' | '2' | '2B';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Convert RGBA pixels to 1-bit packed buffer.
// Result uses e-paper convention: 1 = black, 0 = white.
function pixelsTo1bit(pixels: Uint8Array, width: number, height: number): Buffer {
  const buf = Buffer.alloc(Math.ceil((width * height) / 8), 0);
  for (let i = 0; i < width * height; i++) {
    const r = pixels[i * 4];
    const g = pixels[i * 4 + 1];
    const b = pixels[i * 4 + 2];
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    if (gray < 128) {
      buf[Math.floor(i / 8)] |= 1 << (7 - (i % 8));
    }
  }
  return buf;
}

// Convert RGBA pixels to V1 4bpp packed buffer.
// Each byte holds two pixels: upper nibble = left pixel, lower nibble = right pixel.
// 0x3 = white, 0x0 = black.
function pixelsToV1(pixels: Uint8Array, width: number, height: number): Buffer {
  const buf = Buffer.alloc((width * height) / 2).fill(0x33);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x += 2) {
      const i = y * width + x;
      const gray0 =
        0.299 * pixels[i * 4] +
        0.587 * pixels[i * 4 + 1] +
        0.114 * pixels[i * 4 + 2];
      const gray1 =
        0.299 * pixels[(i + 1) * 4] +
        0.587 * pixels[(i + 1) * 4 + 1] +
        0.114 * pixels[(i + 1) * 4 + 2];
      const nibble0 = gray0 < 128 ? 0x0 : 0x3;
      const nibble1 = gray1 < 128 ? 0x0 : 0x3;
      buf[i / 2] = (nibble0 << 4) | nibble1;
    }
  }
  return buf;
}

export async function sendToDisplay(
  pixels: Uint8Array,
  width: number,
  height: number,
): Promise<void> {
  const version = (process.env.WAVESHARE_EPD75_VERSION ?? '2') as Version;

  // Dynamic requires — these native modules only exist on Raspberry Pi.
  // On dev machines, sendToDisplay is never called (WITHOUT_PAPER=true).
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const spiLib = require('spi-device') as {
    open: (
      bus: number,
      device: number,
      options: Record<string, unknown>,
      cb: (err: Error | null) => void,
    ) => {
      transfer: (
        msg: Array<{ sendBuffer: Buffer; byteLength: number; speedHz: number }>,
        cb: (err: Error | null) => void,
      ) => void;
      close: (cb: (err: Error | null) => void) => void;
    };
  };
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Gpio } = require('onoff') as {
    Gpio: new (
      pin: number,
      dir: 'in' | 'out',
    ) => {
      readSync: () => 0 | 1;
      writeSync: (val: 0 | 1) => void;
      unexport: () => void;
    };
  };

  const base = getGpioBase();
  const rst = new Gpio(base + RST_PIN, 'out');
  const dc = new Gpio(base + DC_PIN, 'out');
  const cs = new Gpio(base + CS_PIN, 'out');
  const pwr = new Gpio(base + PWR_PIN, 'out');
  const busy = new Gpio(base + BUSY_PIN, 'in');

  const device = await new Promise<ReturnType<typeof spiLib.open>>(
    (resolve, reject) => {
      const d = spiLib.open(SPI_BUS, SPI_DEVICE, { maxSpeedHz: SPI_SPEED, mode: 0 }, (err) => {
        if (err) reject(err);
        else resolve(d);
      });
    },
  );

  const spiWrite = (buf: Buffer): Promise<void> => {
    const chunks: Promise<void>[] = [];
    for (let offset = 0; offset < buf.length; offset += CHUNK_SIZE) {
      const chunk = buf.subarray(offset, offset + CHUNK_SIZE);
      chunks.push(
        new Promise<void>((resolve, reject) => {
          device.transfer(
            [{ sendBuffer: chunk, byteLength: chunk.length, speedHz: SPI_SPEED }],
            (err) => { if (err) reject(err); else resolve(); },
          );
        }),
      );
    }
    return chunks.reduce((p, next) => p.then(() => next), Promise.resolve());
  };

  const sendCommand = async (cmd: number): Promise<void> => {
    dc.writeSync(0);
    cs.writeSync(0);
    await spiWrite(Buffer.from([cmd]));
    cs.writeSync(1);
  };

  const sendByte = async (data: number): Promise<void> => {
    dc.writeSync(1);
    cs.writeSync(0);
    await spiWrite(Buffer.from([data]));
    cs.writeSync(1);
  };

  const sendBuffer = async (buf: Buffer): Promise<void> => {
    dc.writeSync(1);
    cs.writeSync(0);
    await spiWrite(buf);
    cs.writeSync(1);
  };

  const readBusy = async (): Promise<void> => {
    consoleDebug('e-Paper busy');
    if (version === '1') {
      while (busy.readSync() === 0) {
        await delay(100);
      }
    } else {
      // V2 and V2B: send 0x71 query command, poll until BUSY_PIN goes high
      await sendCommand(0x71);
      let iter = 0;
      const maxIter = version === '2' ? 100 : Infinity;
      while (busy.readSync() === 0 && iter < maxIter) {
        await sendCommand(0x71);
        await delay(20);
        iter++;
      }
      if (version === '2B') await delay(200);
    }
    consoleDebug('e-Paper busy release');
  };

  const reset = async (holdMs: number, lowMs: number): Promise<void> => {
    rst.writeSync(1);
    await delay(holdMs);
    rst.writeSync(0);
    await delay(lowMs);
    rst.writeSync(1);
    await delay(holdMs);
  };

  const cleanup = async (): Promise<void> => {
    rst.writeSync(0);
    dc.writeSync(0);
    pwr.writeSync(0);
    await new Promise<void>((resolve) => device.close(() => resolve()));
    rst.unexport();
    dc.unexport();
    cs.unexport();
    pwr.unexport();
    busy.unexport();
  };

  try {
    pwr.writeSync(1);

    if (version === '1') {
      // V1: epd7in5 — 640×384, 4bpp packed format
      await reset(200, 5);
      await sendCommand(0x01); await sendBuffer(Buffer.from([0x37, 0x00]));
      await sendCommand(0x00); await sendBuffer(Buffer.from([0xCF, 0x08]));
      await sendCommand(0x06); await sendBuffer(Buffer.from([0xc7, 0xcc, 0x28]));
      await sendCommand(0x04);
      await readBusy();
      await sendCommand(0x30); await sendByte(0x3c);
      await sendCommand(0x41); await sendByte(0x00);
      await sendCommand(0x50); await sendByte(0x77);
      await sendCommand(0x60); await sendByte(0x22);
      await sendCommand(0x61);
      await sendByte(0x02); await sendByte(0x80); // source 640
      await sendByte(0x01); await sendByte(0x80); // gate 384
      await sendCommand(0x82); await sendByte(0x1E);
      await sendCommand(0xe5); await sendByte(0x03);

      const buf = pixelsToV1(pixels, width, height);
      await sendCommand(0x10);
      await sendBuffer(buf);
      await sendCommand(0x12);
      await delay(100);
      await readBusy();

    } else if (version === '2B') {
      // V2B: epd7in5b_V2 — 800×480, separate black + red planes
      await reset(200, 4);
      await sendCommand(0x01);
      await sendByte(0x07); await sendByte(0x07); await sendByte(0x3f); await sendByte(0x3f);
      await sendCommand(0x04);
      await delay(100);
      await readBusy();
      await sendCommand(0x00); await sendByte(0x0F);
      await sendCommand(0x61);
      await sendByte(0x03); await sendByte(0x20); // source 800
      await sendByte(0x01); await sendByte(0xE0); // gate 480
      await sendCommand(0x15); await sendByte(0x00);
      await sendCommand(0x50); await sendByte(0x11); await sendByte(0x07);
      await sendCommand(0x60); await sendByte(0x22);
      await sendCommand(0x65);
      await sendByte(0x00); await sendByte(0x00); await sendByte(0x00); await sendByte(0x00);

      // Black channel (0x10): hardware expects 0=black, 1=white.
      // pixelsTo1bit gives 1=black so invert.
      const blackBuf = pixelsTo1bit(pixels, width, height);
      for (let i = 0; i < blackBuf.length; i++) blackBuf[i] ^= 0xFF;
      const redBuf = Buffer.alloc(blackBuf.length, 0x00); // no red pixels
      await sendCommand(0x10);
      await sendBuffer(blackBuf);
      await sendCommand(0x13);
      await sendBuffer(redBuf);
      await sendCommand(0x12);
      await delay(100);
      await readBusy();

    } else {
      // V2: epd7in5_V2 — 800×480, 1-bit black/white
      await reset(20, 2);
      await sendCommand(0x06);
      await sendByte(0x17); await sendByte(0x17); await sendByte(0x28); await sendByte(0x17);
      await sendCommand(0x01);
      await sendByte(0x07); await sendByte(0x07); await sendByte(0x3f); await sendByte(0x3f);
      await sendCommand(0x04);
      await delay(100);
      await readBusy();
      await sendCommand(0x00); await sendByte(0x1F);
      await sendCommand(0x61);
      await sendByte(0x03); await sendByte(0x20); // source 800
      await sendByte(0x01); await sendByte(0xE0); // gate 480
      await sendCommand(0x15); await sendByte(0x00);
      await sendCommand(0x50); await sendByte(0x10); await sendByte(0x07);
      await sendCommand(0x60); await sendByte(0x22);

      const buf = pixelsTo1bit(pixels, width, height);
      await sendCommand(0x13);
      await sendBuffer(buf);
      await sendCommand(0x12);
      await delay(100);
      await readBusy();
    }

    // Sleep — same for all versions
    await sendCommand(0x02); // POWER_OFF
    await readBusy();
    await sendCommand(0x07); // DEEP_SLEEP
    await sendByte(0xA5);
    await delay(2000);
  } finally {
    await cleanup();
  }
}
