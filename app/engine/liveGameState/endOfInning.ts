import { LiveGame } from '../../types';
import { lastPlayWithDescription } from '../../utils';
import { boxscore, nextTeam } from '../../utils/liveGame';
import { formatOrdinal } from '../../utils/number';

export default function endOfInning(game: LiveGame) {
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
    },
  };
}
