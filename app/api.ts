import axios from 'axios';
import { addDays, subDays } from 'date-fns';
import { getMockedData } from './mockedData';
import { LiveGame, Schedule, Standings, Team } from './types';

const baseUrl = 'https://statsapi.mlb.com/api';

export async function getTeams() {
  const { data } = await axios.get<{ teams: Array<Team> }>(
    `${baseUrl}/v1/teams?sportId=1`
  );

  return data.teams;
}

export async function getTeamById(teamId: number) {
  const { data } = await axios.get(`${baseUrl}/v1/teams/${teamId}`);

  return data.teams[0];
}

export async function getTeamSchedule(teamId: number) {
  const startDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(subDays(Date.now(), 6));

  const endDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(addDays(new Date(), 6));

  const data = await getMockedData<Schedule>(
    'schedule',
    async () =>
      (
        await axios.get<Schedule>(
          `${baseUrl}/v1/schedule?sportId=1&teamId=${teamId}&startDate=${startDate}&endDate=${endDate}`
        )
      ).data
  );

  return data.dates
    .map(({ games }) => games)
    .flat()
    .filter(Boolean);
}

export async function getLiveGameFeed(gameId: number) {
  return await getMockedData<LiveGame>(
    'live-game',
    async () =>
      (
        await axios.get<LiveGame>(`${baseUrl}/v1.1/game/${gameId}/feed/live`)
      ).data
  );
}

export async function getStandingsForLeague(leagueId: number) {
  const { data } = await axios.get<Standings>(
    `${baseUrl}/v1/standings?leagueId=${leagueId}`
  );

  return data.records;
}
