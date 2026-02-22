import React from 'react';
import { font, SCREEN_PADDING } from './styles';
import StandingsTable from './partials/StandingsTable';

type Props = Record<string, any>;

export default function Standings({ standings, previousGame, nextGame }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: SCREEN_PADDING }}>
      <div style={{ display: 'flex', flexDirection: 'row', marginBottom: 16 }}>
        {previousGame && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ fontSize: font.sm }}>Last Game</div>
            <div style={{ fontWeight: 700 }}>{previousGame.description}</div>
            <div>{previousGame.result}</div>
          </div>
        )}
        {nextGame && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, textAlign: 'right' }}>
            <div style={{ fontSize: font.sm }}>Next Game</div>
            <div style={{ fontWeight: 700 }}>{nextGame.description}</div>
            <div>{nextGame.gameDate}</div>
          </div>
        )}
      </div>

      <div style={{ fontSize: font.lg, fontWeight: 600, marginBottom: 8 }}>
        Division Standings
      </div>

      {standings && <StandingsTable teams={standings} />}
    </div>
  );
}
