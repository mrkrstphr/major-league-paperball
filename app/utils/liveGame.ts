// TODO: migrate from ../utils

import { LiveGame, LiveGame_LiveData_LineScore, Team } from '../types';

export const followedHomeOrAway = (game: LiveGame, followedTeam: Team) =>
  game.gameData.teams.away.id === followedTeam.id ? 'away' : 'home';

export const followedTeam = (game: LiveGame, followedTeam: Team) =>
  game.gameData.teams.away.id === followedTeam.id
    ? game.gameData.teams.away
    : game.gameData.teams.home;

export const opponentTeam = (game: LiveGame, followedTeam: Team) =>
  game.gameData.teams.away.id === followedTeam.id
    ? game.gameData.teams.home
    : game.gameData.teams.away;

export const playerBoxscore = (
  game: LiveGame,
  homeOrAway: 'home' | 'away',
  playerId: number,
) => game.liveData.boxscore.teams[homeOrAway].players[`ID${playerId}`];

export const boxscore = (game: LiveGame) => {
  const rawInnings = game.liveData.linescore.innings;
  const scheduledInnings = game.liveData.linescore.scheduledInnings;

  let innings = rawInnings;

  if (innings.length > scheduledInnings) {
    innings = rawInnings.slice(-scheduledInnings);
  } else if (innings.length < scheduledInnings) {
    const remainingInnings = scheduledInnings - innings.length;

    innings = rawInnings.concat(
      Array.from(Array(remainingInnings).keys()).map(
        (k) =>
          ({
            num: k + 1 + rawInnings.length,
          }) as LiveGame_LiveData_LineScore['innings'][0],
      ),
    );
  }

  return {
    innings,
    totalInnings: game.liveData.linescore.scheduledInnings,
    totals: game.liveData.linescore.teams,
    renderInningsStart:
      Math.max(game.liveData.linescore.currentInning - 9, 0) + 1,
  };
};
