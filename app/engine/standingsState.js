import { subMinutes } from 'date-fns';
import { isNotNil, reverse } from 'ramda';
import { getStandingsForLeague } from '../api.js';
import {
  formatDateTime,
  gameResult,
  gameVsOrAatDescription,
  getLastTen,
} from '../utils.js';

export default async function standingsState(currentState, cache) {
  // refetch schedule and standings every 20 minutes
  if (
    currentState?.mode === 'next-game' &&
    currentState?.lastFetch >= subMinutes(new Date(), 20)
  ) {
    return currentState;
  }

  const standings = await getStandingsForLeague(cache.team.league.id);
  const divisionStandings = standings.find(
    (record) => record.division.id === cache.team.division.id,
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
      game.status.abstractGameCode !== 'F',
  );

  const lastFinishedGame = reverse(cache.schedule.games).find(
    (game) => game.status.abstractGameCode === 'F',
  );

  const nextGame = isNotNil(nextScheduledGame) && {
    gameDate: `${formatDateTime(nextScheduledGame.gameDate)}`,
    description: gameVsOrAatDescription(nextScheduledGame, cache.team),
  };

  const previousGame = isNotNil(lastFinishedGame) && {
    result: gameResult(lastFinishedGame, cache.team),
    description: gameVsOrAatDescription(lastFinishedGame, cache.team),
  };

  return {
    mode: 'next-game',
    data: {
      standings: standingsData,
      nextGame,
      previousGame,
    },
    lastFetch: new Date(),
  };
}
