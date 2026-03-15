import React from 'react';
import { font, headerBanner, SCREEN_PADDING } from './styles';
import Boxscore from './partials/Boxscore';
import GameHeader from './partials/GameHeader';

type Props = Record<string, any>;

export default function EndOfInning({ upNext, inningDescription, lastPlayDescription, boxscore, teams, awayTeam, homeTeam, weather }: Props) {
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
      </div>
    </div>
  );
}
