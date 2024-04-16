const DEFAULT_GAME_END_DELAY_MINUTES = 20;
const DEFAULT_SCREEN_WIDTH = 800;
const DEFAULT_SCREEN_HEIGHT = 480;

export function isEnvTruthy(val?: string) {
  return val === 'true' || val === '1';
}

export function envToInt(name: string, fallback = 0) {
  const value = parseInt(process.env[name] ?? `${fallback}`, 10);

  return isNaN(value) ? fallback : value;
}

export const teamId = () => envToInt('TEAM_ID');

export const gameEndDelay = () =>
  envToInt('GAME_END_DELAY_MINUTES', DEFAULT_GAME_END_DELAY_MINUTES);

export const screenWidth = () => envToInt('SCREEN_WIDTH', DEFAULT_SCREEN_WIDTH);
export const screenHeight = () =>
  envToInt('SCREEN_HEIGHT', DEFAULT_SCREEN_HEIGHT);

export const browserBin = () => process.env.BROWSER_BIN;

export const withoutPaper = () => isEnvTruthy(process.env.WITHOUT_PAPER);
export const debugDumpGame = () => isEnvTruthy(process.env.DEBUG_DUMP_GAME);
