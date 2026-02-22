import React from 'react';
import { font } from '../styles';

type StandingTeam = {
  team: string;
  wins: number;
  losses: number;
  winningPercentage: number;
  gamesBack: number | string;
  streak: string;
  lastTen: string;
};

type Props = {
  teams: StandingTeam[];
};

const headerCell: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  fontWeight: 600,
  fontSize: font.base,
  padding: '0 8px',
};

const dataCell: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  fontSize: font.lg,
  padding: '2px 8px',
};

const dividerBorder = '1px solid black';

export default function StandingsTable({ teams }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', borderTop: dividerBorder }}>
      {/* Header */}
      <div style={{ display: 'flex', flexDirection: 'row', borderBottom: dividerBorder, padding: '4px 0' }}>
        <div style={{ display: 'flex', flex: 3, fontSize: font.base, fontWeight: 600, paddingLeft: 4 }}>Team</div>
        <div style={headerCell}>W</div>
        <div style={headerCell}>L</div>
        <div style={headerCell}>PCT</div>
        <div style={headerCell}>GB</div>
        <div style={headerCell}>STRK</div>
        <div style={headerCell}>L10</div>
      </div>
      {/* Rows */}
      {teams.map((team, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            flexDirection: 'row',
            borderBottom: i < teams.length - 1 ? '1px solid #e5e7eb' : 'none',
            padding: '2px 0',
          }}
        >
          <div style={{ display: 'flex', flex: 3, fontSize: font.lg, paddingLeft: 4 }}>{team.team}</div>
          <div style={dataCell}>{String(team.wins)}</div>
          <div style={dataCell}>{String(team.losses)}</div>
          <div style={dataCell}>{String(team.winningPercentage)}</div>
          <div style={dataCell}>{String(team.gamesBack)}</div>
          <div style={dataCell}>{team.streak}</div>
          <div style={dataCell}>{team.lastTen}</div>
        </div>
      ))}
    </div>
  );
}
