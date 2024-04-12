import { sortBy, splitEvery } from 'ramda';
import { getTeamById, getTeamSchedule, getTeams } from '../api.js';
import { today } from '../utils.js';
import { isGameInProgress } from '../utils/schedule.js';
import liveGameState from './liveGameState.js';
import standingsState from './standingsState.js';

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
  const liveGame = isGameInProgress(cache.schedule);

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
