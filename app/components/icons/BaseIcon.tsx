import React from 'react';

export const SVG_SIZE = 32;

export function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      width={SVG_SIZE}
      height={SVG_SIZE}
      viewBox="0 0 32 32"
      shapeRendering="crispEdges"
      fill="black"
    >
      {children}
    </svg>
  );
}
