import React from 'react';
import { font, SCREEN_PADDING } from './styles';
import Scorecard from './partials/Scorecard';
import Bases from './partials/Bases';
import BallsAndStrikes from './partials/BallsAndStrikes';
import Matchup from './partials/Matchup';
import LastXPlays from './partials/LastXPlays';
import Banner from './partials/Banner';
import BasesAndOuts from './partials/BasesAndOuts';
import GameHeader from './partials/GameHeader';

type Props = Record<string, any>;

export default function LiveGame(props: Props) {
  const {
    inningDescription, lastPlayDescription, lineScore, count, runners,
    matchup, last3ScoringPlays, isScoringPlay, scoringTeam, isOut, outEvent, isOnBase,
    awayTeam, homeTeam, weather,
  } = props;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', fontSize: font['2xl'], position: 'relative' }}>
      <div style={{ display: 'flex', flexDirection: 'column', padding: SCREEN_PADDING }}>
        <GameHeader
          inningDescription={inningDescription}
          awayTeam={awayTeam}
          homeTeam={homeTeam}
          weather={weather}
        />

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
      </div>

      {isScoringPlay && (
        <Banner>
          <div style={{ display: 'flex', fontSize: font['2xl'] }}>{`${scoringTeam?.name} Score!`}</div>
          <div style={{ display: 'flex', fontSize: font.lg }}>{lastPlayDescription}</div>
          <div style={{ display: 'flex', fontSize: font.lg, paddingTop: 8 }}>
            {`${lineScore?.away?.name} ${lineScore?.away?.runs}  ·  ${lineScore?.home?.name} ${lineScore?.home?.runs}`}
          </div>
        </Banner>
      )}

      {!isScoringPlay && isOnBase && (
        <Banner>
          <div style={{ display: 'flex', fontSize: font['2xl'] }}>{outEvent?.toUpperCase()}</div>
          <div style={{ display: 'flex', fontSize: font.lg }}>{lastPlayDescription}</div>
          <div style={{ display: 'flex', paddingTop: 8 }}>
            <BasesAndOuts runners={runners ?? []} outs={count?.outs ?? 0} color="white" />
          </div>
        </Banner>
      )}

      {!isScoringPlay && isOut && (
        <Banner>
          <div style={{ display: 'flex', fontSize: font['2xl'] }}>{outEvent}</div>
          <div style={{ display: 'flex', fontSize: font.lg }}>{lastPlayDescription}</div>
          <div style={{ display: 'flex', paddingTop: 8 }}>
            <BasesAndOuts runners={runners ?? []} outs={count?.outs ?? 0} color="white" />
          </div>
        </Banner>
      )}
    </div>
  );
}
