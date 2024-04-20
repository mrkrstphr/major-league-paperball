import { subMinutes } from 'date-fns';
import { mkdir, writeFile } from 'fs/promises';
import { reverse, take } from 'ramda';
import { refetchTeamSchedule } from '.';
import { getLiveGameFeed } from '../api';
import { State } from '../state';
import { LiveGame } from '../types';
import {
  betweenInnings,
  getBaseRunners,
  getBatter,
  getBatterLine,
  getLoserScore,
  getOffense,
  getPitcher,
  getPitcherLine,
  getWinnerScore,
  getWinningTeam,
  isTeamWinning,
  lastPlayWithDescription,
  nextTeam,
  scoringPlays,
} from '../utils';
import { consoleDebug, debugDumpGame, gameEndDelay } from '../utils/env';
import { Cache } from './types';

export default async function liveGameState(
  gameId: number,
  cache: Cache,
  currentState: State,
) {
  // if we've already noticed this game is over, return the final state...
  if (cache.gameEnded[gameId]) {
    if (cache.gameEnded[gameId] < subMinutes(new Date(), gameEndDelay())) {
      consoleDebug(`Game end delay over, refetching schedule...`);
      if (cache.schedule?.games) {
        // trigger a refetch of the schedule
        await refetchTeamSchedule();
      }
    }

    return currentState;
  }

  const game = await getLiveGameFeed(gameId);

  if (debugDumpGame()) {
    if (game.liveData.plays.currentPlay.result.event) {
      await mkdir(`debug/${gameId}`, { recursive: true });

      await writeFile(
        `debug/${gameId}/${game.liveData.plays.currentPlay.about.endTime}.${game.liveData.plays.currentPlay.result.event}.json`,
        JSON.stringify(game, null, 2),
      );
    }
  }

  return processGameState(game, cache);
}

function getWinningTeamAndScore(game: LiveGame) {
  return {
    winningTeam: getWinningTeam(game),
    winnerScore: getWinnerScore(game),
    loserScore: getLoserScore(game),
  };
}

export const processGameState = async (game: LiveGame, cache: Cache) => {
  const last3ScoringPlays = take(3, reverse(scoringPlays(game)));

  // if this game is over...
  if (game.gameData.status.abstractGameCode === 'F') {
    consoleDebug(`Noting game as ended`);
    if (!cache.gameEnded[game.gameData.id]) {
      cache.gameEnded[game.gameData.id] = new Date();
    }
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

    upOrDown: isTeamWinning(game, cache.team.id) ? 'up' : 'down',

    count: game.liveData?.plays?.currentPlay?.count,

    betweenInnings: betweenInnings(game),

    last3ScoringPlays,

    isScoringPlay: game.liveData.plays.currentPlay.about.isScoringPlay,
    scoringTeam: getOffense(game).team,

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
    ...getWinningTeamAndScore(game),
  };

  return {
    mode: 'live-game',
    data,
  };
};
