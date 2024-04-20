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

export const awayTeam = (game: LiveGame) => game.gameData.teams.away;
export const homeTeam = (game: LiveGame) => game.gameData.teams.home;

export const playerBoxscore = (
  game: LiveGame,
  homeOrAway: 'home' | 'away',
  playerId: number,
) => game.liveData.boxscore.teams[homeOrAway].players[`ID${playerId}`];

export const endOfInning = (game: LiveGame) =>
  game.liveData?.linescore?.inningState === 'End';

export const middleOfInning = (game: LiveGame) =>
  game.liveData?.linescore?.inningState === 'Middle';

export const betweenInnings = (game: LiveGame) =>
  endOfInning(game) || middleOfInning(game);

export const isGameOver = (game: LiveGame) => {
  if (game.gameData.status.abstractGameCode === 'F') {
    return true;
  }

  // if the currentInning is >= scheduledInnings and there are 3 outs
  const currentInning = game.liveData.linescore.currentInning;
  const scheduledInnings = game.liveData.linescore.scheduledInnings;
  const outs = game.liveData.linescore.outs;

  if (currentInning >= scheduledInnings) {
    const isTopInning = game.liveData.linescore.isTopInning;
    const homeRuns = game.liveData.linescore.teams.home.runs;
    const awayRuns = game.liveData.linescore.teams.away.runs;

    // if it is top of the inning, and home team is up, game is over
    if (isTopInning && homeRuns > awayRuns && outs === 3) {
      return true;
    }

    if (!isTopInning && homeRuns !== awayRuns) {
      return true;
    }

    return false;
  }

  return false;
};

export const nextTeam = (game: LiveGame) => {
  if (endOfInning(game)) {
    return awayTeam(game).name;
  }

  return homeTeam(game).name;
};

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
