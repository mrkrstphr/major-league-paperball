import { LiveGame } from '../../types';
import { lastPlayWithDescription } from '../../utils';
import { awayTeam, boxscore, homeTeam } from '../../utils/liveGame';

export default function endOfGame(game: LiveGame) {
  const homeScore = game.liveData.linescore.teams.home.runs;
  const awayScore = game.liveData.linescore.teams.away.runs;

  return {
    mode: 'end-of-game',
    data: {
      boxscore: boxscore(game),
      scheduledInnings: game.liveData.linescore.scheduledInnings,
      teams: game.gameData.teams,
      totalInnings: game.liveData.linescore.currentInning,
      lastPlayDescription: lastPlayWithDescription(game)?.result?.description,
      winningTeam: homeScore > awayScore ? homeTeam(game) : awayScore > homeScore ? awayTeam(game) : null,
      winnerScore: Math.max(homeScore, awayScore),
      loserScore: Math.min(homeScore, awayScore),
    },
  };
}
