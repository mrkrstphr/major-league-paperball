import { subMinutes } from 'date-fns';
import { getLiveGameFeed } from '../api';
import { State } from '../state';
import { LiveGame_LiveData_BoxScore_Team_Player } from '../types';
import { formatTime } from '../utils/date';
import {
  followedHomeOrAway,
  followedTeam,
  opponentTeam,
  playerBoxscore,
} from '../utils/liveGame';
import { Cache } from './types';

const opposite = (homeOrAway: string) =>
  homeOrAway === 'home' ? 'away' : 'home';

const getPitcherDetails = (pitcher?: LiveGame_LiveData_BoxScore_Team_Player) =>
  pitcher && {
    name: pitcher.person.fullName,
    era: pitcher.seasonStats.pitching.era,
    record: [
      pitcher.seasonStats.pitching.wins,
      pitcher.seasonStats.pitching.losses,
    ].join('-'),
  };

export default async function previewState(
  gameId: number,
  currentState: State,
  cache: Cache
) {
  // refetch preview data every 5 minutes
  if (
    currentState?.mode === 'preview' &&
    currentState?.lastFetch &&
    currentState?.lastFetch >= subMinutes(new Date(), 5)
  ) {
    return currentState;
  }

  console.info('[paperball] previewState: fetching game feed');

  const game = await getLiveGameFeed(gameId);
  const homeOrAway = followedHomeOrAway(game, cache.team);

  const followedPitcher = playerBoxscore(
    game,
    homeOrAway,
    game.gameData.probablePitchers[homeOrAway].id
  );
  const opponentPitcher = playerBoxscore(
    game,
    opposite(homeOrAway),
    game.gameData.probablePitchers[opposite(homeOrAway)].id
  );

  return {
    mode: 'preview',
    data: {
      followedTeam: followedTeam(game, cache.team),
      opponentTeam: opponentTeam(game, cache.team),
      atOrVs: homeOrAway === 'home' ? 'vs' : 'at',
      gameTime: formatTime(game.gameData.datetime.dateTime),

      seriesTied: true,
      // Can't find this information anyway in the schedule or live game info
      // seriesLeader: 'TEAM',
      // seriesRecord: 'X-X', // null if first game

      venue: game.gameData.venue.name,
      weather: game.gameData.weather,

      probablePitchers: {
        followed: getPitcherDetails(followedPitcher),
        opponent: getPitcherDetails(opponentPitcher),
      },
    },
    lastFetch: new Date(),
  };
}
