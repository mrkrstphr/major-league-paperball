import { LiveGame } from '../../types';
import { getBatter, getPitcher, lastPlayWithDescription } from '../../utils';
import { boxscore, nextTeam } from '../../utils/liveGame';
import { formatOrdinal } from '../../utils/number';

function teamSide(game: LiveGame, teamId: number): 'home' | 'away' {
  return game.gameData.teams.home.id === teamId ? 'home' : 'away';
}

export default function endOfInning(game: LiveGame) {
  const pitcher = getPitcher(game);
  const batter = getBatter(game);
  const defenseSide = teamSide(game, game.liveData.linescore.defense.team.id);
  const offenseSide = teamSide(game, game.liveData.linescore.offense.team.id);
  const pitcherLine = game.liveData.boxscore.teams[defenseSide].players[`ID${pitcher.id}`]?.stats?.pitching?.summary;
  const batterLine = game.liveData.boxscore.teams[offenseSide].players[`ID${batter.id}`]?.stats?.batting?.summary;

  return {
    mode: 'end-of-inning',
    data: {
      awayTeam: game.gameData.teams.away.teamName,
      homeTeam: game.gameData.teams.home.teamName,
      weather: game.gameData.weather,
      boxscore: boxscore(game),
      inningDescription: [
        game.liveData.linescore.isTopInning ? 'Bottom' : 'Top',
        formatOrdinal(game.liveData.linescore.currentInning + 1),
      ].join(' '),
      lastPlayDescription: lastPlayWithDescription(game)?.result?.description,
      teams: game.gameData.teams,
      upNext: nextTeam(game),
      pitcher: { name: pitcher.fullName, line: pitcherLine },
      batter: { name: batter.fullName, line: batterLine },
    },
  };
}
