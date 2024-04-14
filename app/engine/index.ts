import { sortBy, splitEvery } from 'ramda';
import { getTeamById, getTeamSchedule, getTeams } from '../api';
import { State } from '../state';
import { today } from '../utils';
import { isGameInProgress } from '../utils/schedule';
import liveGameState from './liveGameState';
import standingsState from './standingsState';
import type { Cache } from './types';

const cache: Cache = { schedule: undefined, gameEnded: {} };

const refetchTeamSchedule = async () => {
  // @ts-ignore TODO: fix this
  const games = await getTeamSchedule(process.env.TEAM_ID);

  cache.schedule = { date: today(), games };
};

export default async function getNextState(currentState: State) {
  // for now, we have to be restarted after editing .env...
  if (currentState.mode === 'missing-team') return currentState;

  if (!process.env.TEAM_ID) {
    return missingTeamState();
  }

  if (!cache.team) {
    // @ts-ignore TODO: fix this
    cache.team = await getTeamById(process.env.TEAM_ID);
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
