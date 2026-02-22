import React from 'react';
import { font, SCREEN_PADDING } from './styles';
import Scorecard from './partials/Scorecard';
import Bases from './partials/Bases';
import BallsAndStrikes from './partials/BallsAndStrikes';
import Matchup from './partials/Matchup';
import LastXPlays from './partials/LastXPlays';

type Props = Record<string, any>;

export default function LiveGame(props: Props) {
  const {
    inningDescription, lastPlayDescription, lineScore, count, runners,
    matchup, last3ScoringPlays, isScoringPlay, scoringTeam, winningTeam,
    winnerScore, loserScore,
  } = props;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', fontSize: font['2xl'], padding: SCREEN_PADDING, position: 'relative' }}>
      <div style={{ display: 'flex', marginBottom: 16, fontSize: font.lg, paddingBottom: 8 }}>
        {inningDescription}
      </div>

      <div style={{ display: 'flex', flexDirection: 'row', gap: 32, alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 448 }}>
          <div style={{ display: 'flex', flexDirection: 'row', gap: 32, alignItems: 'center' }}>
            <Scorecard lineScore={lineScore} />
            <Bases runners={runners ?? []} />
            <BallsAndStrikes count={count ?? { balls: 0, strikes: 0, outs: 0 }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'row', fontSize: font.lg, gap: 4 }}>
            <span style={{ fontWeight: 700, flexShrink: 0 }}>Last Play:</span>
            <span style={{ flex: 1, minWidth: 0 }}>{lastPlayDescription}</span>
          </div>
        </div>

        <Matchup matchup={matchup} />
      </div>

      <LastXPlays plays={last3ScoringPlays ?? []} />

      {isScoringPlay && (
        <div
          style={{
            position: 'absolute',
            backgroundColor: 'black',
            color: 'white',
            width: '100%',
            left: -SCREEN_PADDING,
            padding: '16px 0',
            textAlign: 'center',
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', fontSize: font['2xl'] }}>{`${scoringTeam?.name} Score!`}</div>
          <div style={{ display: 'flex', fontSize: font.lg }}>
            {`${winningTeam?.name} leads ${winnerScore}-${loserScore}`}
          </div>
        </div>
      )}
    </div>
  );
}
