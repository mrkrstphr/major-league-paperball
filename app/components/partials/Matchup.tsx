import React from 'react';
import { font } from '../styles';

type Player = {
  name: string;
  line: string;
};

type Props = {
  matchup: {
    pitcher: Player;
    batter: Player;
  };
};

export default function Matchup({ matchup }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: font.lg }}>Pitching</div>
        <div style={{ fontWeight: 700, fontSize: font.lg }}>{matchup.pitcher.name}</div>
        <div style={{ fontSize: font.base }}>{matchup.pitcher.line}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: font.lg }}>Batting</div>
        <div style={{ fontWeight: 700, fontSize: font.lg }}>{matchup.batter.name}</div>
        <div style={{ fontSize: font.base }}>{matchup.batter.line}</div>
      </div>
    </div>
  );
}
