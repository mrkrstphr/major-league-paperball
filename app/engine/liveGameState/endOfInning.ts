import { LiveGame } from '../../types';
import { boxscore, nextTeam } from '../../utils/liveGame';
import { formatOrdinal } from '../../utils/number';

export default function endOfInning(game: LiveGame) {
  return {
    mode: 'end-of-inning',
    data: {
      boxscore: boxscore(game),
      inningDescription: [
        game.liveData.linescore.isTopInning ? 'Bottom' : 'Top',
        formatOrdinal(game.liveData.linescore.currentInning + 1),
      ].join(' '),
      teams: game.gameData.teams,
      upNext: nextTeam(game),
    },
  };
}
