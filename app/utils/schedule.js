export const isGameInProgress = (schedule) =>
  schedule.games.find(
    (game) =>
      new Date(game.gameDate) <= new Date() &&
      game.status.abstractGameCode !== 'F',
  );
