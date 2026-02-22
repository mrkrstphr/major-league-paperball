import React from 'react';
import { font, headerBanner, SCREEN_PADDING } from './styles';
import Boxscore from './partials/Boxscore';

type Props = Record<string, any>;

export default function EndOfInning({ upNext, inningDescription, boxscore, teams }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={headerBanner}>
        <div style={{ display: 'flex', fontSize: font['2xl'] }}>{`${upNext} are up next!`}</div>
        <div style={{ display: 'flex', fontSize: font.lg }}>{inningDescription}</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', marginTop: 32, width: '83%', alignSelf: 'center', padding: `0 ${SCREEN_PADDING}px` }}>
        <Boxscore boxscore={boxscore} teams={teams} />
      </div>
    </div>
  );
}
