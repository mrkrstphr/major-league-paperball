import React from 'react';

type Props = {
  runners: number[];
};

function Base({ filled }: { filled: boolean }) {
  return (
    <div
      style={{
        width: 20,
        height: 20,
        border: '1px solid black',
        backgroundColor: filled ? 'black' : 'transparent',
        transform: 'rotate(45deg)',
      }}
    />
  );
}

// Layout: 2B at top-center, 1B at bottom-right, 3B at bottom-left.
// Each base is 20×20 rotated 45°, making a diamond with corners ±14.14px from center.
// Centers are offset 18px in x and y (25px apart), giving ~5px gap between diamond edges.
// 1B→2B and 3B→2B are exactly 45° straight lines.
export default function Bases({ runners }: Props) {
  return (
    <div style={{ display: 'flex', width: 80, height: 64, position: 'relative' }}>
      {/* 2B — top center: left=30 → center x=40 */}
      <div style={{ display: 'flex', position: 'absolute', left: 30, top: 2 }}>
        <Base filled={runners.includes(2)} />
      </div>
      {/* 3B — bottom left: center x=22 (40−18), y=30 (12+18) */}
      <div style={{ display: 'flex', position: 'absolute', left: 12, top: 20 }}>
        <Base filled={runners.includes(3)} />
      </div>
      {/* 1B — bottom right: center x=58 (40+18), y=30 (12+18) */}
      <div style={{ display: 'flex', position: 'absolute', left: 48, top: 20 }}>
        <Base filled={runners.includes(1)} />
      </div>
    </div>
  );
}
