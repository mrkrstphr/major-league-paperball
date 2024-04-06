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

export const inbetweenInnings = (game) =>
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
