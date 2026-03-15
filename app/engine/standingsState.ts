import { subMinutes } from 'date-fns';
import { isNotNil, reverse } from 'ramda';
import { getSpringStandingsForLeague, getStandingsForLeague } from '../api';
import { State } from '../state';
import { gameResult, gameVsOrAatDescription, getLastTen } from '../utils';
import { formatDateTime } from '../utils/date';
import { Cache } from './types';

export default async function standingsState(
  currentState: State,
  cache: Cache,
) {
  // refetch schedule and standings every 20 minutes
  if (
    currentState?.lastFetch &&
    currentState?.lastFetch >= subMinutes(new Date(), 20)
  ) {
    return currentState;
  }

  console.info('[paperball] standingsState: fetching standings');

  const mostRecentGame = reverse(cache.schedule?.games ?? []).find(Boolean);
  const isSpringTraining = mostRecentGame?.gameType === 'S';

  let standingsData;
  if (isSpringTraining) {
    console.info('[paperball] standingsState: spring training mode');
    const records = await getSpringStandingsForLeague(cache.team.springLeague.id);
    // Spring leagues may not have divisions; return all teams from all records
    const allTeamRecords = records.flatMap((record) => record.teamRecords);
    standingsData = allTeamRecords.map((teamRecord) => ({
      teamId: teamRecord.team.id,
      team: teamRecord.team.name,
      wins: teamRecord.wins,
      losses: teamRecord.losses,
      winningPercentage: teamRecord.winningPercentage,
      gamesBack: teamRecord.gamesBack,
      streak: teamRecord.streak?.streakCode,
      lastTen: getLastTen(teamRecord),
    }));
  } else {
    const standings = await getStandingsForLeague(cache.team.league.id);
    const divisionStandings = standings.find(
      (record) => record.division.id === cache.team.division.id,
    );
    standingsData =
      divisionStandings &&
      divisionStandings.teamRecords.map((teamRecord) => ({
        teamId: teamRecord.team.id,
        team: teamRecord.team.name,
        wins: teamRecord.wins,
        losses: teamRecord.losses,
        winningPercentage: teamRecord.winningPercentage,
        gamesBack: teamRecord.gamesBack,
        streak: teamRecord.streak?.streakCode,
        lastTen: getLastTen(teamRecord),
      }));
  }

  const nextScheduledGame = cache.schedule?.games.find(
    (game) =>
      new Date(game.gameDate) >= new Date() &&
      game.status.abstractGameCode !== 'F',
  );

  const lastFinishedGame = reverse(cache.schedule?.games ?? []).find(
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
    mode: 'standings',
    data: {
      standings: standingsData,
      myTeamId: cache.team.id,
      nextGame,
      previousGame,
    },
    lastFetch: new Date(),
  };
}
