import { subMinutes } from 'date-fns';
import { sortBy, splitEvery } from 'ramda';
import { getTeamById, getTeamSchedule, getTeams } from '../api';
import { State } from '../state';
import { today } from '../utils';
import { consoleDebug, gameEndDelay, teamId } from '../utils/env';
import { isGameStartingSoon, isPotentiallyActive } from '../utils/schedule';
import liveGameState from './liveGameState';
import previewState from './previewState';
import standingsState from './standingsState';
import type { Cache } from './types';

const cache: Cache = { schedule: undefined, gameEnded: {} };

const SCHEDULE_REFETCH_MS = 2 * 60 * 60 * 1000; // 2 hours

export const refetchTeamSchedule = async () => {
  const games = await getTeamSchedule(teamId());

  cache.schedule = { date: today(), fetchedAt: new Date(), games };
};

export default async function getNextState(currentState: State) {
  const followedTeamId = teamId();
  // for now, we have to be restarted after editing .env...
  if (currentState.mode === 'missing-team') return currentState;

  if (!followedTeamId) {
    return missingTeamState();
  }

  if (!cache.team) {
    cache.team = await getTeamById(followedTeamId);
  }

  const scheduleStale =
    !cache.schedule ||
    cache.schedule.date !== today() ||
    Date.now() - cache.schedule.fetchedAt.getTime() > SCHEDULE_REFETCH_MS;

  if (scheduleStale) {
    await refetchTeamSchedule();
  }

  // if a game started recently, check the live feed to determine actual state
  const liveGame = cache.schedule && isPotentiallyActive(cache.schedule);

  if (liveGame) {
    const gameEndedAt = cache.gameEnded[liveGame.gamePk];
    const delayPassed =
      gameEndedAt && gameEndedAt < subMinutes(new Date(), gameEndDelay());

    if (delayPassed) {
      // End-of-game delay has passed; refetch schedule and fall through to standings
      consoleDebug(`Game end delay over, refetching schedule...`);
      await refetchTeamSchedule();
    } else {
      return liveGameState(liveGame.gamePk, cache, currentState);
    }
  }

  const startingSoon = cache.schedule && isGameStartingSoon(cache.schedule);

  if (startingSoon) {
    return previewState(startingSoon.gamePk, currentState, cache);
  }

  return standingsState(currentState, cache);
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
