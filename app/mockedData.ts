import { readFile } from 'fs/promises';
import { dirname, resolve } from 'path';
import { consoleDebug, mockDataFile } from './utils/env';

export type MockedDataType = 'schedule' | 'standings' | 'teams' | 'live-game';

export async function getMockedData<T>(
  type: MockedDataType,
  otherwise: () => Promise<T>,
): Promise<T> {
  const mocks = mockDataFile();

  if (!mocks) return otherwise();

  try {
    const mockFile = JSON.parse(await readFile(mocks, 'utf-8')) as
      | Record<MockedDataType, string>
      | undefined;

    if (!mockFile) return otherwise();

    const resolvedFile = resolve(dirname(mocks), mockFile[type]);

    const rawData = await readFile(resolvedFile, 'utf-8');
    const dateAdjusted = rawData.replaceAll(
      '{{TODAY}}',
      new Date().toISOString(),
    );

    consoleDebug(`Using mocked data from for ${type}: ${resolvedFile}`);

    return JSON.parse(dateAdjusted) as T;
  } catch (e) {
    consoleDebug(`Failed to load mocked data for ${type}: ${e}`);
    console.error(e);
  }

  return otherwise();
}
