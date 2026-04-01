import React from 'react';
import { font } from '../styles';
import { CircleOpen, CircleClosed } from '../icons/index';

type Count = {
  balls: number;
  strikes: number;
  outs: number;
};

type Props = {
  count: Count;
};

function Circle({ filled }: { filled: boolean }) {
  return filled ? <CircleClosed /> : <CircleOpen />;
}

function CountRow({ label, filled, total }: { label: string; filled: number; total: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'row', gap: 4, alignItems: 'center' }}>
      <div style={{ display: 'flex', fontSize: font.base, width: 20 }}>{`${label}:`}</div>
      {Array.from({ length: total }, (_, i) => (
        <Circle key={i} filled={i < filled} />
      ))}
    </div>
  );
}

export default function BallsAndStrikes({ count }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <CountRow label="B" filled={count.balls} total={4} />
      <CountRow label="S" filled={count.strikes} total={3} />
      <CountRow label="O" filled={count.outs} total={3} />
    </div>
  );
}
