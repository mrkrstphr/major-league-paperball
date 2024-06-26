import { isNil, isNotNil } from 'ramda';
import { LiveGame, Schedule_Game, Standings_Team, Team } from './types';
import { formatDateTime } from './utils/date';

export const today = () => justDate();

export const justDate = (date = new Date()) =>
  new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

export const isAwayTeamBatting = (game: LiveGame) =>
  game.liveData.linescore.isTopInning;

export const topOfInning = (game: LiveGame) =>
  game.liveData.linescore.isTopInning;

export const lastPlayWithDescription = (game: LiveGame) =>
  game.liveData.plays.allPlays.findLast(
    (play) => !isNil(play.result?.description),
  );

export const getOffense = (game: LiveGame) => game.liveData.linescore.offense;
export const getDefense = (game: LiveGame) => game.liveData.linescore.defense;

export const getBaseRunners = (game: LiveGame) => {
  const { first, second, third } = getOffense(game);

  return [
    isNotNil(first) ? 1 : undefined,
    isNotNil(second) ? 2 : undefined,
    isNotNil(third) ? 3 : undefined,
  ].filter(isNotNil);
};

export const getBatter = (game: LiveGame) => getOffense(game).batter;

export const getPitcher = (game: LiveGame) => getDefense(game).pitcher;

export const getPitcherLine = (game: LiveGame) => {
  const defense = getDefense(game);

  return game.liveData?.boxscore?.teams?.[
    game.liveData?.linescore?.isTopInning ? 'home' : 'away'
  ]?.players?.[`ID${defense?.pitcher.id}`]?.stats?.pitching?.summary;
};

export const getBatterLine = (game: LiveGame) => {
  const offense = getOffense(game);

  return game.liveData?.boxscore?.teams?.[
    game.liveData?.linescore?.isTopInning ? 'away' : 'home'
  ]?.players?.[`ID${offense?.batter.id}`]?.stats?.batting?.summary;
};

export const getLastTen = (team: Standings_Team) => {
  const lastTen = team.records.splitRecords.find(
    (record) => record.type === 'lastTen',
  );

  return lastTen ? `${lastTen.wins}-${lastTen.losses}` : '';
};

export const scoringPlays = (game: LiveGame) => {
  return game.liveData.plays.allPlays
    .filter((play) => play.about.isScoringPlay)
    .map((play) => {
      const halfInning = play.about.halfInning.substring(0, 3);

      return {
        inningDescription: `${
          halfInning.charAt(0).toUpperCase() + halfInning.slice(1)
        } ${play.about.inning}`,
        score: `${play.result.awayScore}-${play.result.homeScore}`,
        description: play.result.description,
      };
    });
};

export const isTeamWinning = (game: LiveGame, teamId: number) =>
  game.gameData.teams.away.id === teamId
    ? game.liveData.linescore.teams.away.runs >
      game.liveData.linescore.teams.home.runs
    : game.liveData.linescore.teams.home.runs >
      game.liveData.linescore.teams.away.runs;

export const wasGamePostponed = (game: Schedule_Game) =>
  game.status.codedGameState === 'D';

export const didTeamWin = (game: Schedule_Game, teamId: number) =>
  game.teams.away.team.id === teamId
    ? game.teams.away.score > game.teams.home.score
    : game.teams.home.score > game.teams.away.score;

export const getWinningTeam = (game: LiveGame) =>
  game.liveData.linescore.teams.away.runs >
  game.liveData.linescore.teams.home.runs
    ? game.gameData.teams.away
    : game.gameData.teams.home;

export const getWinnerScore = (game: LiveGame) =>
  game.liveData.linescore.teams.away.runs >
  game.liveData.linescore.teams.home.runs
    ? game.liveData.linescore.teams.away.runs
    : game.liveData.linescore.teams.home.runs;

export const getLoserScore = (game: LiveGame) =>
  game.liveData.linescore.teams.away.runs <
  game.liveData.linescore.teams.home.runs
    ? game.liveData.linescore.teams.away.runs
    : game.liveData.linescore.teams.home.runs;

export const followedTeamScore = (game: Schedule_Game, followedTeam: Team) =>
  game.teams.away.team.id === followedTeam.id
    ? game.teams.away.score
    : game.teams.home.score;

export const opponentTeamScore = (game: Schedule_Game, followedTeam: Team) =>
  game.teams.away.team.id === followedTeam.id
    ? game.teams.home.score
    : game.teams.away.score;

export const gameResult = (game: Schedule_Game, followedTeam: Team) => {
  if (wasGamePostponed(game)) {
    return (
      'Postponed' +
      (game.rescheduleDate ? ` to ${formatDateTime(game.rescheduleDate)}` : '')
    );
  }

  const ourScore = followedTeamScore(game, followedTeam);
  const theirScore = opponentTeamScore(game, followedTeam);

  return (
    (didTeamWin(game, followedTeam.id) ? 'Won' : 'Lost') +
    ` ${ourScore}-${theirScore}`
  );
};

export const gameVsOrAatDescription = (
  scheduledGame: Schedule_Game,
  followedTeam: Team,
) =>
  scheduledGame?.teams.home.team.id === followedTeam.id
    ? `${scheduledGame.teams.home.team.name} vs ${scheduledGame.teams.away.team.name}`
    : `${scheduledGame.teams.away.team.name} at ${scheduledGame.teams.home.team.name}`;
