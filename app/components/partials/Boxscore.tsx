import React from 'react';
import { font } from '../styles';

type Inning = {
  num: number;
  away?: { runs?: number };
  home?: { runs?: number };
};

type Totals = {
  away: { runs: number; hits: number; errors: number };
  home: { runs: number; hits: number; errors: number };
};

type BoxscoreData = {
  innings: Inning[];
  totals: Totals;
};

type Teams = {
  away: { abbreviation: string };
  home: { abbreviation: string };
};

type Props = {
  boxscore: BoxscoreData;
  teams: Teams;
};

const dividerBorder = '1px solid black';

function cell(value: string | number): string {
  return String(value);
}

function inningScore(runs?: number): string {
  return runs != null ? String(runs) : '-';
}

export default function Boxscore({ boxscore, teams }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', borderTop: dividerBorder, borderBottom: dividerBorder, fontSize: font.lg }}>
      {/* Header row */}
      <div style={{ display: 'flex', flexDirection: 'row', borderBottom: dividerBorder }}>
        <div style={{ width: 96, fontWeight: 600 }} />
        {boxscore.innings.map((inning) => (
          <div key={inning.num} style={{ display: 'flex', flex: 1, justifyContent: 'center', padding: '2px 0' }}>
            {cell(inning.num)}
          </div>
        ))}
        <div style={{ display: 'flex', flex: 1, justifyContent: 'center', padding: '2px 0' }}>R</div>
        <div style={{ display: 'flex', flex: 1, justifyContent: 'center', padding: '2px 0' }}>H</div>
        <div style={{ display: 'flex', flex: 1, justifyContent: 'center', padding: '2px 0' }}>E</div>
      </div>

      {/* Data rows */}
      <div style={{ display: 'flex', flexDirection: 'row' }}>
        {/* Team names column */}
        <div style={{ width: 96, display: 'flex', flexDirection: 'column', borderRight: dividerBorder }}>
          <div style={{ display: 'flex', fontWeight: 600, borderBottom: dividerBorder, padding: '2px 0' }}>
            {teams.away.abbreviation}
          </div>
          <div style={{ display: 'flex', fontWeight: 600, padding: '2px 0' }}>
            {teams.home.abbreviation}
          </div>
        </div>

        {/* Inning cells */}
        {boxscore.innings.map((inning) => (
          <div key={inning.num} style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: dividerBorder }}>
            <div style={{ display: 'flex', justifyContent: 'center', borderBottom: dividerBorder, padding: '2px 0', fontSize: font.lg }}>
              {inningScore(inning.away?.runs)}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2px 0', fontSize: font.lg }}>
              {inningScore(inning.home?.runs)}
            </div>
          </div>
        ))}

        {/* Totals: R, H, E */}
        {(['runs', 'hits', 'errors'] as const).map((stat) => (
          <div key={stat} style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: dividerBorder }}>
            <div style={{ display: 'flex', justifyContent: 'center', fontWeight: 600, borderBottom: dividerBorder, padding: '2px 0', fontSize: font.lg }}>
              {cell(boxscore.totals.away[stat])}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', fontWeight: 600, padding: '2px 0', fontSize: font.lg }}>
              {cell(boxscore.totals.home[stat])}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
