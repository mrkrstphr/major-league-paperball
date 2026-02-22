import React from 'react';
import { font } from '../styles';

type ScorecardTeam = {
  name: string;
  runs: number;
  hits: number;
  errors: number;
  isUp: boolean;
};

type Props = {
  lineScore: {
    away: ScorecardTeam;
    home: ScorecardTeam;
  };
};

function ScorecardRow({ team }: { team: ScorecardTeam }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {team.isUp && (
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: 'black',
            }}
          />
        )}
      </div>
      <div style={{ display: 'flex', padding: 4, width: 64, fontSize: font.base }}>{team.name}</div>
      <div style={{ display: 'flex', justifyContent: 'center', fontWeight: 700, padding: 4, width: 32, fontSize: font.base }}>
        {String(team.runs)}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', fontWeight: 700, padding: 4, width: 32, fontSize: font.base }}>
        {String(team.hits)}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', fontWeight: 700, padding: 4, width: 32, fontSize: font.base }}>
        {String(team.errors)}
      </div>
    </div>
  );
}

export default function Scorecard({ lineScore }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', flexDirection: 'row', gap: 8, marginBottom: 2 }}>
        <div style={{ width: 8 }} />
        <div style={{ width: 64 }} />
        <div style={{ display: 'flex', justifyContent: 'center', width: 32, fontSize: font.base }}>R</div>
        <div style={{ display: 'flex', justifyContent: 'center', width: 32, fontSize: font.base }}>H</div>
        <div style={{ display: 'flex', justifyContent: 'center', width: 32, fontSize: font.base }}>E</div>
      </div>
      <ScorecardRow team={lineScore.away} />
      <ScorecardRow team={lineScore.home} />
    </div>
  );
}
