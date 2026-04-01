import { addHours } from 'date-fns';
import { Schedule } from '../types';

const GAME_WINDOW_HOURS = 10;

// A game is potentially active if it started in the past and is within the
// activity window. We intentionally ignore schedule status codes here -- the
// live game feed is the authoritative source for real-time game state.
export const isPotentiallyActive = (schedule: {
  games: Schedule['dates'][0]['games'];
}) =>
  schedule.games.find((game) => {
    const startTime = new Date(game.gameDate);
    return (
      startTime <= new Date() &&
      new Date() <= addHours(startTime, GAME_WINDOW_HOURS)
    );
  });

export const isGameStartingSoon = (schedule: {
  games: Schedule['dates'][0]['games'];
}) =>
  schedule.games.find(
    (game) =>
      game.status.abstractGameCode === 'L' &&
      game.status.codedGameState === 'P',
  );
