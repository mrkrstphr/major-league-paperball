import axios from 'axios';
import { addDays, subDays } from 'date-fns';

const baseUrl = 'https://statsapi.mlb.com/api';

export async function getTeams() {
  const { data } = await axios.get(`${baseUrl}/v1/teams?sportId=1`);

  if (data) {
    return data.teams;
  }

  return null;
}

export async function getTeamById(teamId) {
  const { data } = await axios.get(`${baseUrl}/v1/teams/${teamId}`);

  return data.teams[0];
}

export async function getTeamSchedule(teamId) {
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

  const { data } = await axios.get(
    `${baseUrl}/v1/schedule?sportId=1&teamId=${teamId}&startDate=${startDate}&endDate=${endDate}`
  );

  return data.dates
    .map(({ games }) => games)
    .flat()
    .filter(Boolean);
}

export async function getLiveGameFeed(gameId) {
  const { data } = await axios.get(`${baseUrl}/v1.1/game/${gameId}/feed/live`);

  return data;
}

export async function getStandingsForLeague(leagueId) {
  const { data } = await axios.get(
    `${baseUrl}/v1/standings?leagueId=${leagueId}`
  );

  return data.records;
}
