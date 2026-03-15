// epd7in5 — 640×384, 4bpp packed format
import { delay, type Io } from './hardware';
import { pixelsToV1 } from './pixels';

async function reset(io: Io): Promise<void> {
  io.rst.setValue(1); await delay(200);
  io.rst.setValue(0); await delay(5);
  io.rst.setValue(1); await delay(200);
}

async function readBusy(io: Io): Promise<void> {
  while (io.busy.getValue() === 0) await delay(100);
}

export async function run(
  io: Io,
  pixels: Uint8Array,
  width: number,
  height: number,
): Promise<void> {
  await reset(io);

  await io.sendCommand(0x01); await io.sendBuffer(Buffer.from([0x37, 0x00]));
  await io.sendCommand(0x00); await io.sendBuffer(Buffer.from([0xCF, 0x08]));
  await io.sendCommand(0x06); await io.sendBuffer(Buffer.from([0xc7, 0xcc, 0x28]));
  await io.sendCommand(0x04);
  await readBusy(io);
  await io.sendCommand(0x30); await io.sendByte(0x3c);
  await io.sendCommand(0x41); await io.sendByte(0x00);
  await io.sendCommand(0x50); await io.sendByte(0x77);
  await io.sendCommand(0x60); await io.sendByte(0x22);
  await io.sendCommand(0x61);
  await io.sendByte(0x02); await io.sendByte(0x80); // source 640
  await io.sendByte(0x01); await io.sendByte(0x80); // gate 384
  await io.sendCommand(0x82); await io.sendByte(0x1E);
  await io.sendCommand(0xe5); await io.sendByte(0x03);

  await io.sendCommand(0x10);
  await io.sendBuffer(pixelsToV1(pixels, width, height));
  await io.sendCommand(0x12);
  await delay(100);
  await readBusy(io);

  await io.sendCommand(0x02); // POWER_OFF
  await readBusy(io);
  await io.sendCommand(0x07); // DEEP_SLEEP
  await io.sendByte(0xA5);
  await delay(2000);
}
