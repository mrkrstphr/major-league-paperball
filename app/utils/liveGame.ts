// TODO: migrate from ../utils

import { LiveGame, Team } from '../types';

export const followedHomeOrAway = (game: LiveGame, followedTeam: Team) =>
  game.gameData.teams.away.id === followedTeam.id ? 'away' : 'home';

export const followedTeam = (game: LiveGame, followedTeam: Team) =>
  game.gameData.teams.away.id === followedTeam.id
    ? game.gameData.teams.away
    : game.gameData.teams.home;

export const opponentTeam = (game: LiveGame, followedTeam: Team) =>
  game.gameData.teams.away.id === followedTeam.id
    ? game.gameData.teams.home
    : game.gameData.teams.away;

export const playerBoxscore = (
  game: LiveGame,
  homeOrAway: 'home' | 'away',
  playerId: number
) => game.liveData.boxscore.teams[homeOrAway].players[`ID${playerId}`];
