import React from 'react';
import { font } from '../styles';

type Play = {
  inningDescription: string;
  description: string;
  score: string;
};

type Props = {
  plays: Play[];
};

function truncate(text: string, maxLen: number): string {
  if (!text || text.length <= maxLen) return text ?? '';
  return text.slice(0, maxLen - 1) + '…';
}

export default function LastXPlays({ plays }: Props) {
  if (!plays || plays.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontSize: font.lg, marginTop: 16, marginBottom: 8, fontWeight: 600 }}>
        Last Scoring Plays
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {plays.map((play, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'row', gap: 16, fontSize: font.base }}>
            <div style={{ whiteSpace: 'nowrap', width: 64, flexShrink: 0 }}>
              {play.inningDescription}
            </div>
            <div style={{ flex: 1 }}>
              {truncate(play.description, 80)}
            </div>
            <div style={{ whiteSpace: 'nowrap', width: 64, textAlign: 'right', flexShrink: 0 }}>
              {play.score}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
