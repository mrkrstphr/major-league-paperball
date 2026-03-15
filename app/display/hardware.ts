export const SPI_BUS    = 0;
export const SPI_DEVICE = 0;
export const SPI_SPEED  = 4000000;
// Linux spidev default transfer size limit; chunk large buffers to stay under it.
export const CHUNK_SIZE = 4096;

// GPIO line offsets = BCM pin numbers.
// NOTE: CS (GPIO 8) is owned by the SPI kernel driver on Bookworm —
//       spi-device manages chip-select automatically, do NOT claim it via GPIO.
export const RST_PIN  = 17;
export const DC_PIN   = 25;
export const BUSY_PIN = 24;
export const PWR_PIN  = 18;

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// --- native module types ---------------------------------------------------

export type SpiDevice = {
  transfer: (
    msg: Array<{ sendBuffer: Buffer; byteLength: number; speedHz: number }>,
    cb: (err: Error | null) => void,
  ) => void;
  close: (cb: (err: Error | null) => void) => void;
};

export type GpioLine = {
  getValue: () => 0 | 1;
  setValue: (val: 0 | 1) => void;
  requestInputMode: () => void;
  requestOutputMode: () => void;
  release: () => void;
};

export type GpioChip = { label: string };

// Io bundles everything a version driver needs to talk to the panel.
export type Io = {
  sendCommand: (cmd: number) => Promise<void>;
  sendByte:    (data: number) => Promise<void>;
  sendBuffer:  (buf: Buffer)  => Promise<void>;
  busy: GpioLine;
  rst:  GpioLine;
};

// --- hardware singleton ----------------------------------------------------
// The Chip object must stay alive for the process lifetime — Line objects hold
// raw C pointers into it and segfault if it's GC'd. Lines themselves are
// re-requested each call because libgpiod invalidates the request after the
// display's power-cycle sequence (EPERM on subsequent setValue calls).

type HW = {
  spiLib: {
    open: (
      bus: number,
      device: number,
      options: Record<string, unknown>,
      cb: (err: Error | null) => void,
    ) => SpiDevice;
  };
  LineConstructor: new (chip: GpioChip, offset: number) => GpioLine;
  chip: GpioChip;
  device: SpiDevice;
};

let hwPromise: Promise<HW> | undefined;

export function getHardware(): Promise<HW> {
  if (!hwPromise) hwPromise = openHardware();
  return hwPromise;
}

async function openHardware(): Promise<HW> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const spiLib = require('spi-device') as HW['spiLib'];
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Chip, Line } = require('node-libgpiod') as {
    Chip: new (index: number) => GpioChip;
    Line: new (chip: GpioChip, offset: number) => GpioLine;
  };

  let chip: GpioChip | undefined;
  for (let i = 0; i < 8; i++) {
    try {
      const c = new Chip(i);
      if (/pinctrl-bcm/i.test(c.label)) { chip = c; break; }
    } catch { continue; }
  }
  if (!chip) throw new Error('BCM GPIO chip not found');

  const device = await new Promise<SpiDevice>((resolve, reject) => {
    const d = spiLib.open(SPI_BUS, SPI_DEVICE, { maxSpeedHz: SPI_SPEED, mode: 0 }, (err) => {
      if (err) reject(err);
      else resolve(d);
    });
  });

  return { spiLib, LineConstructor: Line, chip, device };
}

export function makeSpiWrite(device: SpiDevice) {
  return async function spiWrite(buf: Buffer): Promise<void> {
    for (let offset = 0; offset < buf.length; offset += CHUNK_SIZE) {
      const chunk = buf.subarray(offset, offset + CHUNK_SIZE);
      await new Promise<void>((resolve, reject) => {
        device.transfer(
          [{ sendBuffer: chunk, byteLength: chunk.length, speedHz: SPI_SPEED }],
          (err) => { if (err) reject(err); else resolve(); },
        );
      });
    }
  };
}
