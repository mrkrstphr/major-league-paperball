import { subMinutes } from 'date-fns';
import { isNotNil, reverse } from 'ramda';
import { getStandingsForLeague } from '../api';
import { State } from '../state';
import { gameResult, gameVsOrAatDescription, getLastTen } from '../utils';
import { formatDateTime } from '../utils/date';
import { Cache } from './types';

export default async function standingsState(
  currentState: State,
  cache: Cache
) {
  // refetch schedule and standings every 20 minutes
  if (
    currentState?.mode === 'next-game' &&
    currentState?.lastFetch &&
    currentState?.lastFetch >= subMinutes(new Date(), 20)
  ) {
    return currentState;
  }

  const standings = await getStandingsForLeague(cache.team.league.id);
  const divisionStandings = standings.find(
    (record) => record.division.id === cache.team.division.id
  );

  const standingsData =
    divisionStandings &&
    divisionStandings.teamRecords.map((teamRecord) => ({
      team: teamRecord.team.name,
      wins: teamRecord.wins,
      losses: teamRecord.losses,
      winningPercentage: teamRecord.winningPercentage,
      gamesBack: teamRecord.gamesBack,
      streak: teamRecord.streak.streakCode,
      lastTen: getLastTen(teamRecord),
    }));

  const nextScheduledGame = cache.schedule?.games.find(
    (game) =>
      new Date(game.gameDate) >= new Date() &&
      game.status.abstractGameCode !== 'F'
  );

  const lastFinishedGame = reverse(cache.schedule?.games ?? []).find(
    (game) => game.status.abstractGameCode === 'F'
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
    mode: 'standings',
    data: {
      standings: standingsData,
      nextGame,
      previousGame,
    },
    lastFetch: new Date(),
  };
}
