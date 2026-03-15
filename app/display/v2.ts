// epd7in5_V2 — 800×480, 1-bit black/white
import { delay, type Io } from './hardware';
import { pixelsTo1bit } from './pixels';

async function reset(io: Io): Promise<void> {
  io.rst.setValue(1); await delay(20);
  io.rst.setValue(0); await delay(2);
  io.rst.setValue(1); await delay(20);
}

async function readBusy(io: Io): Promise<void> {
  await io.sendCommand(0x71);
  let iter = 0;
  while (io.busy.getValue() === 0) {
    if (iter++ >= 100) throw new Error('readBusy timeout on EPD v2');
    await io.sendCommand(0x71);
    await delay(20);
  }
}

export async function run(
  io: Io,
  pixels: Uint8Array,
  width: number,
  height: number,
): Promise<void> {
  await reset(io);

  await io.sendCommand(0x06);
  await io.sendByte(0x17); await io.sendByte(0x17); await io.sendByte(0x28); await io.sendByte(0x17);
  await io.sendCommand(0x01);
  await io.sendByte(0x07); await io.sendByte(0x07); await io.sendByte(0x3f); await io.sendByte(0x3f);
  await io.sendCommand(0x04);
  await delay(100);
  await readBusy(io);
  await io.sendCommand(0x00); await io.sendByte(0x1F);
  await io.sendCommand(0x61);
  await io.sendByte(0x03); await io.sendByte(0x20); // source 800
  await io.sendByte(0x01); await io.sendByte(0xE0); // gate 480
  await io.sendCommand(0x15); await io.sendByte(0x00);
  await io.sendCommand(0x50); await io.sendByte(0x10); await io.sendByte(0x07);
  await io.sendCommand(0x60); await io.sendByte(0x22);

  await io.sendCommand(0x13);
  await io.sendBuffer(pixelsTo1bit(pixels, width, height));
  await io.sendCommand(0x12);
  await delay(100);
  await readBusy(io);

  await io.sendCommand(0x02); // POWER_OFF
  await readBusy(io);
  await io.sendCommand(0x07); // DEEP_SLEEP
  await io.sendByte(0xA5);
  await delay(2000);
}
