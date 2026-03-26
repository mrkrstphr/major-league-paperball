import React from 'react';
import { font, headerBanner, row, SCREEN_PADDING } from './styles';
import Boxscore from './partials/Boxscore';
import GameHeader from './partials/GameHeader';

type Props = Record<string, any>;

export default function EndOfInning({ upNext, inningDescription, lastPlayDescription, boxscore, teams, awayTeam, homeTeam, weather, pitcher, batter }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', padding: SCREEN_PADDING, paddingBottom: 0 }}>
        <GameHeader
          inningDescription={inningDescription}
          awayTeam={awayTeam}
          homeTeam={homeTeam}
          weather={weather}
        />
      </div>
      <div style={headerBanner}>
        <div style={{ display: 'flex', fontSize: font['2xl'] }}>{`${upNext} are up next!`}</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', marginTop: 32, width: '83%', alignSelf: 'center', padding: `0 ${SCREEN_PADDING}px` }}>
        <Boxscore boxscore={boxscore} teams={teams} />
        {lastPlayDescription && (
          <div style={{ display: 'flex', fontSize: font.sm, marginTop: 20, flexWrap: 'wrap' }}>
            {lastPlayDescription}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20, paddingBottom: 12 }}>
          <div style={{ display: 'flex', fontSize: font.lg, fontWeight: 700 }}>Up Next</div>
        </div>
        <div style={{ ...row, justifyContent: 'space-between', gap: 32 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ display: 'flex', fontSize: font.sm }}>Pitching</div>
            <div style={{ display: 'flex', fontSize: font.lg, fontWeight: 700 }}>{pitcher?.name}</div>
            <div style={{ display: 'flex', fontSize: font.sm }}>{pitcher?.line}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', fontSize: font.sm }}>Up to bat</div>
            <div style={{ display: 'flex', fontSize: font.lg, fontWeight: 700 }}>{batter?.name}</div>
            <div style={{ display: 'flex', fontSize: font.sm }}>{batter?.line}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
