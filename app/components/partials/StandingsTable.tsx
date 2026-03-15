import React from 'react';
import { font } from '../styles';

type StandingTeam = {
  teamId: number;
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
  myTeamId?: number;
};

const colWidths = {
  w:    40,
  l:    40,
  pct:  60,
  gb:   48,
  strk: 52,
  l10:  52,
};

const headerCell = (width: number): React.CSSProperties => ({
  display: 'flex',
  width,
  justifyContent: 'flex-end',
  fontWeight: 600,
  fontSize: font.base,
  padding: '0 6px',
});

const dataCell = (width: number): React.CSSProperties => ({
  display: 'flex',
  width,
  justifyContent: 'flex-end',
  fontSize: font.lg,
  padding: '2px 6px',
});

const dividerBorder = '1px solid black';

const MAX_ROWS = 8;

export default function StandingsTable({ teams, myTeamId }: Props) {
  const ranked = teams.map((team, i) => ({ ...team, rank: i + 1 }));

  let visible = ranked;
  if (ranked.length > MAX_ROWS) {
    const myIndex = ranked.findIndex((t) => t.teamId === myTeamId);
    const pivot = myIndex >= 0 ? myIndex : 0;
    const start = Math.max(0, Math.min(pivot - 3, ranked.length - MAX_ROWS));
    visible = ranked.slice(start, start + MAX_ROWS);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', borderTop: dividerBorder }}>
      {/* Header */}
      <div style={{ display: 'flex', flexDirection: 'row', borderBottom: dividerBorder, padding: '4px 0' }}>
        <div style={{ display: 'flex', flex: 1, fontSize: font.base, fontWeight: 600, paddingLeft: 4 }}>Team</div>
        <div style={headerCell(colWidths.w)}>W</div>
        <div style={headerCell(colWidths.l)}>L</div>
        <div style={headerCell(colWidths.pct)}>PCT</div>
        <div style={headerCell(colWidths.gb)}>GB</div>
        <div style={headerCell(colWidths.strk)}>STRK</div>
        <div style={headerCell(colWidths.l10)}>L10</div>
      </div>
      {/* Rows */}
      {visible.map((team, i) => (
        <div
          key={team.rank}
          style={{
            display: 'flex',
            flexDirection: 'row',
            borderBottom: i < visible.length - 1 ? '1px solid #e5e7eb' : 'none',
            padding: '2px 0',
          }}
        >
          <div style={{ display: 'flex', flex: 1, fontSize: font.lg, paddingLeft: 4 }}>
            <div style={{ display: 'flex', width: 28, justifyContent: 'flex-end', paddingRight: 4 }}>{`${team.rank}.`}</div>
            <div style={{ display: 'flex' }}>{team.team}</div>
          </div>
          <div style={dataCell(colWidths.w)}>{String(team.wins)}</div>
          <div style={dataCell(colWidths.l)}>{String(team.losses)}</div>
          <div style={dataCell(colWidths.pct)}>{String(team.winningPercentage)}</div>
          <div style={dataCell(colWidths.gb)}>{String(team.gamesBack)}</div>
          <div style={dataCell(colWidths.strk)}>{team.streak}</div>
          <div style={dataCell(colWidths.l10)}>{team.lastTen}</div>
        </div>
      ))}
    </div>
  );
}
