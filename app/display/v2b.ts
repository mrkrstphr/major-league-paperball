// epd7in5b_V2 — 800×480, separate black + red planes
import { delay, type Io } from './hardware';
import { pixelsTo1bit } from './pixels';

async function reset(io: Io): Promise<void> {
  io.rst.setValue(1); await delay(200);
  io.rst.setValue(0); await delay(4);
  io.rst.setValue(1); await delay(200);
}

async function readBusy(io: Io): Promise<void> {
  await io.sendCommand(0x71);
  let iter = 0;
  while (io.busy.getValue() === 0 && iter < 100) {
    await io.sendCommand(0x71);
    await delay(20);
    iter++;
  }
  await delay(200);
}

export async function run(
  io: Io,
  pixels: Uint8Array,
  width: number,
  height: number,
): Promise<void> {
  await reset(io);

  await io.sendCommand(0x01);
  await io.sendByte(0x07); await io.sendByte(0x07); await io.sendByte(0x3f); await io.sendByte(0x3f);
  await io.sendCommand(0x04);
  await delay(100);
  await readBusy(io);
  await io.sendCommand(0x00); await io.sendByte(0x0F);
  await io.sendCommand(0x61);
  await io.sendByte(0x03); await io.sendByte(0x20); // source 800
  await io.sendByte(0x01); await io.sendByte(0xE0); // gate 480
  await io.sendCommand(0x15); await io.sendByte(0x00);
  await io.sendCommand(0x50); await io.sendByte(0x11); await io.sendByte(0x07);
  await io.sendCommand(0x60); await io.sendByte(0x22);
  await io.sendCommand(0x65);
  await io.sendByte(0x00); await io.sendByte(0x00); await io.sendByte(0x00); await io.sendByte(0x00);

  // Black channel (0x10) expects 0=black, 1=white — invert our 1=black buffer.
  const blackBuf = pixelsTo1bit(pixels, width, height);
  for (let i = 0; i < blackBuf.length; i++) blackBuf[i] ^= 0xFF;
  const redBuf = Buffer.alloc(blackBuf.length, 0x00); // no red pixels

  await io.sendCommand(0x10);
  await io.sendBuffer(blackBuf);
  await io.sendCommand(0x13);
  await io.sendBuffer(redBuf);
  await io.sendCommand(0x12);
  await delay(100);
  await readBusy(io);

  await io.sendCommand(0x02); // POWER_OFF
  await readBusy(io);
  await io.sendCommand(0x07); // DEEP_SLEEP
  await io.sendByte(0xA5);
  await delay(2000);
}
