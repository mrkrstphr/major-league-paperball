import { consoleDebug } from '../utils/env';
import {
  getHardware, makeSpiWrite,
  DC_PIN, RST_PIN, BUSY_PIN, PWR_PIN,
  type Io,
} from './hardware';
import * as v1  from './v1';
import * as v2  from './v2';
import * as v2b from './v2b';

type Version = '1' | '2' | '2B';

const VERSIONS: Record<Version, typeof v2> = { '1': v1, '2': v2, '2B': v2b };

export async function sendToDisplay(
  pixels: Uint8Array,
  width: number,
  height: number,
): Promise<void> {
  const version = (process.env.WAVESHARE_EPD75_VERSION ?? '2') as Version;
  const { LineConstructor: Line, chip, device } = await getHardware();

  // Lines are re-requested each call — libgpiod invalidates the request after
  // the display's power-cycle, causing EPERM if we try to reuse them.
  const rst  = new Line(chip, RST_PIN);
  const dc   = new Line(chip, DC_PIN);
  const pwr  = new Line(chip, PWR_PIN);
  const busy = new Line(chip, BUSY_PIN);
  rst.requestOutputMode();
  dc.requestOutputMode();
  pwr.requestOutputMode();
  busy.requestInputMode();

  const spiWrite = makeSpiWrite(device);

  // DC=0 → command register, DC=1 → data. CS is managed by the SPI kernel driver.
  const io: Io = {
    sendCommand: async (cmd)  => { dc.setValue(0); await spiWrite(Buffer.from([cmd])); },
    sendByte:    async (data) => { dc.setValue(1); await spiWrite(Buffer.from([data])); },
    sendBuffer:  async (buf)  => { dc.setValue(1); await spiWrite(buf); },
    busy,
    rst,
  };

  consoleDebug(`Sending to display (EPD v${version})`);
  pwr.setValue(1);
  await VERSIONS[version].run(io, pixels, width, height);

  rst.release();
  dc.release();
  pwr.release();
  busy.release();
}
