/**
 * captureGame.ts
 *
 * Fetches and saves MLB API responses for all of a team's games today.
 * Runs on a 20-second interval so you accumulate live-game snapshots.
 *
 * Usage:
 *   npx ts-node captureGame.ts <teamId>
 *
 * Output structure:
 *   captures/
 *     YYYY-MM-DD/
 *       <gamePk>-<away>-vs-<home>/
 *         schedule.json            ← full day schedule (overwritten each tick)
 *         livegame-<ISO>.json      ← live feed snapshot (one per tick)
 */

import axios from 'axios';
import { CronJob } from 'cron';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

const BASE_URL = 'https://statsapi.mlb.com/api';
const CAPTURES_DIR = 'captures';

const teamId = parseInt(process.argv[2] ?? process.env.TEAM_ID ?? '0', 10);

if (!teamId) {
  console.error('Usage: npx ts-node captureGame.ts <teamId>');
  process.exit(1);
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

function isoTimestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function capture(): Promise<void> {
  const today = todayStr();

  const { data: schedule } = await axios.get(
    `${BASE_URL}/v1/schedule?sportId=1&teamId=${teamId}&startDate=${today}&endDate=${today}`
  );

  const games: any[] = (schedule.dates ?? []).flatMap((d: any) => d.games ?? []);

  if (games.length === 0) {
    console.log(`[${new Date().toISOString()}] No games today for team ${teamId}`);
    return;
  }

  for (const game of games) {
    const { gamePk, teams } = game;
    const awaySlug = slugify(teams.away.team.name);
    const homeSlug = slugify(teams.home.team.name);
    const gameDir = join(CAPTURES_DIR, today, `${gamePk}-${awaySlug}-vs-${homeSlug}`);

    await mkdir(gameDir, { recursive: true });

    // Overwrite schedule each tick so it reflects latest game status
    await writeFile(join(gameDir, 'schedule.json'), JSON.stringify(schedule, null, 2));

    const { data: liveGame } = await axios.get(
      `${BASE_URL}/v1.1/game/${gamePk}/feed/live`
    );

    const snapshotFile = join(gameDir, `livegame-${isoTimestamp()}.json`);
    await writeFile(snapshotFile, JSON.stringify(liveGame, null, 2));

    const status = liveGame.gameData?.status?.detailedState ?? 'unknown';
    console.log(`[${new Date().toISOString()}] ${gamePk} (${status}) → ${snapshotFile}`);
  }
}

async function tick(): Promise<void> {
  try {
    await capture();
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Error:`, (err as Error).message);
  }
}

console.log(`Starting capture for team ${teamId}, ticking every 20s. Output: ${CAPTURES_DIR}/`);
tick();

CronJob.from({
  cronTime: '*/20 * * * * *',
  onTick: tick,
  start: true,
});
