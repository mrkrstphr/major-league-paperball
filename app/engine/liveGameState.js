import { subMinutes } from 'date-fns';
import { mkdir, writeFile } from 'fs/promises';
import { reverse, take } from 'ramda';
import { getLiveGameFeed } from '../api.js';
import {
  betweenInnings,
  getBaseRunners,
  getBatter,
  getBatterLine,
  getLoserScore,
  getPitcher,
  getPitcherLine,
  getWinnerScore,
  getWinningTeam,
  isTeamWinning,
  lastPlayWithDescription,
  nextTeam,
  scoringPlays,
} from '../utils.js';

export default async function liveGameState(gameId, cache, currentState) {
  // if we've already noticed this game is over, return the final state...
  if (cache.gameEnded[gameId]) {
    if (
      cache.gameEnded[gameId] <
      subMinutes(new Date(), process.env.GAME_END_DELAY_MINUTES ?? 20)
    ) {
      console.log(
        `Game has been over for ${process.env.GAME_END_DELAY_MINUTES} minutes, updating schedule cache to mark game as complete`,
      );
      cache.schedule.games = cache.schedule.games.map((game) => {
        if (game.gamePk === gameId) {
          return {
            ...game,
            status: { abstractGameCode: 'F' },
          };
        }

        return game;
      });
    }

    return currentState;
  }

  const game = await getLiveGameFeed(gameId);
  const last3ScoringPlays = take(3, reverse(scoringPlays(game)));

  if (process.env.DEBUG_DUMP_GAME) {
    if (game.liveData.plays.currentPlay.result.event) {
      await mkdir(`debug/${gameId}`, { recursive: true });

      await writeFile(
        `debug/${gameId}/${game.liveData.plays.currentPlay.about.endTime}.${game.liveData.plays.currentPlay.result.event}.json`,
        JSON.stringify(game, null, 2),
      );
    }
  }

  // if this game is over...
  if (game.gameData.status.abstractGameCode === 'F') {
    console.log(`Noting game as ended`);
    // note the time we first noticed it as ended so we can leave up a final state...
    if (!cache.gameEnded[gameId]) {
      cache.gameEnded[gameId] = new Date();
    }

    // return gameEndedState(gameId, cache, currentState);
  }

  const isFinal = game.gameData.status.abstractGameCode === 'F';

  // otherwise the game is live...
  const data = {
    teamName: cache.team.teamName,

    // opponentName: // TODO: get opponent name

    inningNumber: game.liveData.linescore.currentInning,
    inningDescription: `${game.liveData.linescore.inningState} ${game.liveData.linescore.currentInningOrdinal}`,
    lastPlayDescription: lastPlayWithDescription(game)?.result?.description,
    upNext: betweenInnings(game) && nextTeam(game),

    isFinal,
    ...(isFinal && getEndOfGameData(game)),

    upOrDown: isTeamWinning(game, cache.team.id) ? 'up' : 'down',

    count: game.liveData?.plays?.currentPlay?.count,

    betweenInnings: betweenInnings(game),

    last3ScoringPlays,

    hasRuns:
      game.liveData.linescore.teams.away.runs > 0 ||
      game.liveData.linescore.teams.home.runs > 0,

    lineScore: {
      away: {
        name: game.gameData.teams.away.abbreviation,
        runs: game.liveData.linescore.teams.away.runs,
        hits: game.liveData.linescore.teams.away.hits,
        errors: game.liveData.linescore.teams.away.errors,
        isUp: game.liveData.linescore.isTopInning,
      },
      home: {
        name: game.gameData.teams.home.abbreviation,
        runs: game.liveData.linescore.teams.home.runs,
        hits: game.liveData.linescore.teams.home.hits,
        errors: game.liveData.linescore.teams.home.errors,
        isUp: !game.liveData.linescore.isTopInning,
      },
    },

    matchup: {
      pitcher: { name: getPitcher(game).fullName, line: getPitcherLine(game) },
      batter: { name: getBatter(game).fullName, line: getBatterLine(game) },
    },

    runners: getBaseRunners(game),
  };

  return {
    mode: 'live-game',
    data,
  };
}

function getEndOfGameData(game) {
  return {
    winner: getWinningTeam(game),
    winnerScore: getWinnerScore(game),
    loserScore: getLoserScore(game),
  };
}
