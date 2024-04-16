import { Schedule } from '../types';

export const isGameInProgress = (schedule: Schedule['dates'][0]) =>
  schedule.games.find(
    (game) =>
      new Date(game.gameDate) <= new Date() &&
      game.status.abstractGameCode !== 'F'
  );
