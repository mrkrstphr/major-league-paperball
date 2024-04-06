import { subMinutes } from 'date-fns';
import { isNotNil, sortBy, splitEvery } from 'ramda';
import {
  getLiveGameFeed,
  getStandingsForLeague,
  getTeamById,
  getTeamSchedule,
  getTeams,
} from './api.js';
import {
  getBaseRunners,
  getBatter,
  getBatterLine,
  getLastTen,
  getPitcher,
  getPitcherLine,
  inbetweenInnings,
  lastPlayWithDescription,
  nextTeam,
  today,
} from './util.js';

const cache = { schedule: undefined, gameEnded: {} };

const refetchTeamSchedule = async () => {
  const games = await getTeamSchedule(process.env.TEAM_ID);

  cache.schedule = { date: today(), games };
};

export default async function getNextState(currentState) {
  // for now, we have to be restarted after editing .env...
  if (currentState.mode === 'missing-team') return currentState;

  if (!process.env.TEAM_ID) {
    return missingTeamState();
  }

  if (!cache.team) {
    cache.team = await getTeamById(process.env.TEAM_ID);
  }

  const hasTodaysSchedule = cache.schedule && cache.schedule.date === today();

  if (!hasTodaysSchedule) {
    await refetchTeamSchedule();
  }

  // if we're past a game start time and it's not final, return the live game state
  const liveGame = cache.schedule.games.find(
    (game) =>
      new Date(game.gameDate) <= new Date() &&
      game.status.abstractGameCode !== 'F'
  );

  if (liveGame) {
    return liveGameState(liveGame.gamePk, currentState);
  }

  return nextGameAndStandingsState(currentState);
}

async function missingTeamState() {
  const teams = await getTeams();

  const sortedTeams = sortBy((team) => team.name.toLowerCase(), teams);
  const teamsKvp = sortedTeams.map((team) => ({
    id: team.id,
    name: team.name,
  }));
  const splitList = splitEvery(Math.ceil(teamsKvp.length / 3), teamsKvp);

  return {
    mode: 'missing-team',
    data: {
      groups: splitList,
    },
  };
}

async function liveGameState(gameId, currentState) {
  // if we've already noticed this game is over, return the final state...
  if (cache.gameEnded[gameId]) {
    return gameEndedState(gameId, currentState);
  }

  const game = await getLiveGameFeed(gameId);

  // if this game is over...
  if (game.gameData.status.abstractGameCode === 'F') {
    // note the time we first noticed it as ended so we can leave up a final state...
    if (!cache.gameEnded[gameId]) {
      cache.gameEnded[gameId] = new Date();
    }

    return gameEndedState(gameId, currentState);
  }

  // otherwise the game is live...
  const data = {
    inningDescription: `${game.liveData.linescore.inningState} ${game.liveData.linescore.currentInningOrdinal}`,
    lastPlayDescription: inbetweenInnings(game)
      ? `${nextTeam(game)} are up next`
      : `Last Play: ${lastPlayWithDescription(game)?.result?.description}`,

    count: game.liveData?.plays?.currentPlay?.count,

    betweenInnings: inbetweenInnings(game),

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

async function gameEndedState(gameId, currentState) {
  // if it's been 20 minutes since we noticed it ended, manually updated
  // the cache to be an ended game so we stop showing it next tick

  if (
    cache.gameEnded[gameId] <
    subMinutes(new Date(), process.env.GAME_END_DELAY_MINUTES ?? 20)
  ) {
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

  if (currentState?.mode === 'final-game') {
    // don't bother refetching game stats
    return currentState;
  }

  const game = await getLiveGameFeed(gameId);

  // TODO: standings...

  return {
    mode: 'final-game',
    data: {
      lastPlayDescription: inbetweenInnings(game)
        ? `${nextTeam(game)} are up next`
        : `Last Play: ${lastPlayWithDescription(game)?.result?.description}`,
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
    },
  };
}

async function nextGameAndStandingsState(currentState) {
  if (
    currentState?.mode === 'next-game' &&
    currentState?.data?.lastFetch >= subMinutes(new Date(), 20)
  ) {
    return currentState;
  }

  const standings = await getStandingsForLeague(cache.team.league.id);

  const divisionStandings = standings.find(
    (record) => record.division.id === cache.team.division.id
  );

  const standingsData = (divisionStandings || []).teamRecords.map((team) => ({
    team: team.team.name,
    wins: team.wins,
    losses: team.losses,
    winningPercentage: team.winningPercentage,
    gamesBack: team.gamesBack,
    streak: team.streak.streakCode,
    lastTen: getLastTen(team),
  }));

  const nextScheduledGame = cache.schedule.games.find(
    (game) =>
      new Date(game.gameDate) >= new Date() &&
      game.status.abstractGameCode !== 'F'
  );

  const nextGame = isNotNil(nextScheduledGame) && {
    gameDate: `${new Date(
      nextScheduledGame.gameDate
    ).toLocaleDateString()} ${new Date(
      nextScheduledGame.gameDate
    ).toLocaleTimeString()}`,
    description:
      nextScheduledGame?.teams.home.team.id === cache.team.id
        ? `${nextScheduledGame.teams.home.team.name} vs ${nextScheduledGame.teams.away.team.name}`
        : `${nextScheduledGame.teams.away.team.name} at ${nextScheduledGame.teams.home.team.name}`,
  };

  return {
    mode: 'next-game',
    data: {
      lastFetch: new Date(),
      standings: standingsData,
      nextGame,
    },
  };
}
