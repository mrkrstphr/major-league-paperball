import React from 'react';
import { font, headerBanner } from './styles';

type Props = Record<string, any>;

export default function Preview({ followedTeam, opponentTeam, atOrVs, gameTime, venue, seriesRecord, seriesTied, seriesLeader, probablePitchers }: Props) {
  const seriesLine = seriesRecord
    ? seriesTied
      ? `The series is tied ${seriesRecord}`
      : `${seriesLeader} lead the series ${seriesRecord}`
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={headerBanner}>
        <div style={{ display: 'flex', fontSize: font.lg }}>Starting Soon</div>
        <div style={{ display: 'flex', fontSize: font['2xl'] }}>
          {`${followedTeam?.name} ${atOrVs} ${opponentTeam?.name}`}
        </div>
        <div style={{ display: 'flex', fontSize: font.lg }}>{`${gameTime} - ${venue}`}</div>
        {seriesLine && (
          <div style={{ display: 'flex', marginTop: 16, fontSize: font.base }}>{seriesLine}</div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32, fontSize: font.lg, fontWeight: 500 }}>
        Probable Pitchers
      </div>

      <div style={{ display: 'flex', flexDirection: 'row', marginTop: 8, width: '100%', gap: 32 }}>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, textAlign: 'right' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', fontWeight: 700 }}>{probablePitchers?.followed?.name}</div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>{`${probablePitchers?.followed?.era} ERA`}</div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>{probablePitchers?.followed?.record}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div style={{ display: 'flex', fontWeight: 700 }}>{probablePitchers?.opponent?.name}</div>
          <div style={{ display: 'flex' }}>{`${probablePitchers?.opponent?.era} ERA`}</div>
          <div style={{ display: 'flex' }}>{probablePitchers?.opponent?.record}</div>
        </div>
      </div>
    </div>
  );
}
