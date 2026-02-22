import React from 'react';
import { font, headerBanner, SCREEN_PADDING } from './styles';
import Boxscore from './partials/Boxscore';

type Props = Record<string, any>;

export default function EndOfGame({ winningTeam, winnerScore, loserScore, totalInnings, scheduledInnings, boxscore, teams }: Props) {
  const isExtraInnings = totalInnings > scheduledInnings;
  const finalLabel = isExtraInnings ? `Final/${totalInnings}` : 'Final';

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={headerBanner}>
        <div style={{ display: 'flex', fontSize: font['2xl'] }}>
          {`${winningTeam?.name} win ${winnerScore}-${loserScore}`}
        </div>
        <div style={{ display: 'flex', fontSize: font.lg }}>{finalLabel}</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', marginTop: 32, width: '83%', alignSelf: 'center', padding: `0 ${SCREEN_PADDING}px` }}>
        <Boxscore boxscore={boxscore} teams={teams} />
      </div>
    </div>
  );
}
