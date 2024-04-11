import { format } from 'date-fns';
import { isNil, isNotNil } from 'ramda';

export const today = () => justDate();

export const justDate = (date = new Date()) =>
  new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

export const awayTeam = (game) => game.gameData.teams.away;
export const homeTeam = (game) => game.gameData.teams.home;

export const isAwayTeamBatting = (game) => game.liveData.linescore.isTopInning;

export const topOfInning = (game) => game.liveData.linescore.isTopInning;

export const endOfInning = (game) =>
  game.liveData?.linescore?.inningState === 'End';

export const middleOfInning = (game) =>
  game.liveData?.linescore?.inningState === 'Middle';

export const betweenInnings = (game) =>
  endOfInning(game) || middleOfInning(game);

export const lastPlayWithDescription = (game) =>
  game.liveData.plays.allPlays.findLast(
    (play) => !isNil(play.result?.description)
  );

export const nextTeam = (game) => {
  if (endOfInning(game)) {
    return awayTeam(game).name;
  }

  return homeTeam(game).name;
};

export const getOffense = (game) => game.liveData.linescore.offense;
export const getDefense = (game) => game.liveData.linescore.defense;

export const getBaseRunners = (game) => {
  const { first, second, third } = getOffense(game);

  return [
    isNotNil(first) ? 1 : undefined,
    isNotNil(second) ? 2 : undefined,
    isNotNil(third) ? 3 : undefined,
  ].filter(isNotNil);
};

export const getBatter = (game) => getOffense(game).batter;

export const getPitcher = (game) => getDefense(game).pitcher;

export const getPitcherLine = (game) => {
  const defense = getDefense(game);

  return game.liveData?.boxscore?.teams?.[
    game.liveData?.linescore?.isTopInning ? 'home' : 'away'
  ]?.players?.[`ID${defense?.pitcher.id}`]?.stats?.pitching?.summary;
};

export const getBatterLine = (game) => {
  const offense = getOffense(game);

  return game.liveData?.boxscore?.teams?.[
    game.liveData?.linescore?.isTopInning ? 'away' : 'home'
  ]?.players?.[`ID${offense?.batter.id}`]?.stats?.batting?.summary;
};

export const getLastTen = (team) => {
  const lastTen = team.records.splitRecords.find(
    (record) => record.type === 'lastTen'
  );

  return lastTen ? `${lastTen.wins}-${lastTen.losses}` : '';
};

export const scoringPlays = (game) => {
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

export const isTeamWinning = (game, teamId) =>
  game.gameData.teams.away.id === teamId
    ? game.liveData.linescore.teams.away.runs >
      game.liveData.linescore.teams.home.runs
    : game.liveData.linescore.teams.home.runs >
      game.liveData.linescore.teams.away.runs;

export const wasGamePostponed = (game) => game.status.codedGameState === 'D';

export const didTeamWin = (game, teamId) =>
  game.teams.away.team.id === teamId
    ? game.teams.away.score > game.teams.home.score
    : game.teams.home.score > game.teams.away.score;

export const gameResult = (game, followedTeam) => {
  if (wasGamePostponed(game)) {
    return (
      'Postponed' +
      (game.rescheduleDate ? ` to ${formatDateTime(game.rescheduleDate)}` : '')
    );
  }

  return (
    (didTeamWin(game, followedTeam.id) ? 'Won' : 'Lost') +
    ` ${game.teams.away.score}-${game.teams.home.score}`
  );
};

export const formatDateTime = (date) => {
  const doubleDate = new Date(date);

  switch (process.env.DATE_FORMAT) {
    case 'american':
      return format(doubleDate, 'L/d h:mm a');

    case 'world':
      return format(doubleDate, 'd/L H:mm');
  }

  return doubleDate.toLocaleString();
};

export const gameVsOrAatDescription = (scheduledGame, followedTeam) =>
  scheduledGame?.teams.home.team.id === followedTeam.id
    ? `${scheduledGame.teams.home.team.name} vs ${scheduledGame.teams.away.team.name}`
    : `${scheduledGame.teams.away.team.name} at ${scheduledGame.teams.home.team.name}`;
