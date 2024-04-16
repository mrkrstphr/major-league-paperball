import { sortBy, splitEvery } from 'ramda';
import { getTeamById, getTeamSchedule, getTeams } from '../api';
import { State } from '../state';
import { today } from '../utils';
import { teamId } from '../utils/env';
import { isGameInProgress, isGameStartingSoon } from '../utils/schedule';
import liveGameState from './liveGameState';
import previewState from './previewState';
import standingsState from './standingsState';
import type { Cache } from './types';

const cache: Cache = { schedule: undefined, gameEnded: {} };

export const refetchTeamSchedule = async () => {
  const games = await getTeamSchedule(teamId());

  cache.schedule = { date: today(), games };
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

  const hasTodaysSchedule = cache.schedule && cache.schedule.date === today();
  if (!hasTodaysSchedule) {
    await refetchTeamSchedule();
  }

  // if we're past a game start time and it's not final, return the live game state
  const liveGame = cache.schedule && isGameInProgress(cache.schedule);

  if (liveGame) {
    return liveGameState(liveGame.gamePk, cache, currentState);
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
