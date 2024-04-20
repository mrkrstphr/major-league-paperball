import { LiveGame } from '../../types';
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
      winningTeam: homeScore > awayScore ? homeTeam(game) : awayTeam(game),
      winnerScore: homeScore > awayScore ? homeScore : awayScore,
      loserScore: homeScore > awayScore ? awayScore : homeScore,
    },
  };
}
