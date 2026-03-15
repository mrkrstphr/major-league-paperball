import React from 'react';

const SVG_SIZE = 22;
const STROKE = {
  stroke: 'black',
  strokeWidth: '1.5',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export function SunIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" width={SVG_SIZE} height={SVG_SIZE} {...STROKE}>
      <circle cx="12" cy="12" r="4"></circle>
      <path d="M12 2v2"></path>
      <path d="M12 20v2"></path>
      <path d="m4.93 4.93 1.41 1.41"></path>
      <path d="m17.66 17.66 1.41 1.41"></path>
      <path d="M2 12h2"></path>
      <path d="M20 12h2"></path>
      <path d="m6.34 17.66-1.41 1.41"></path>
      <path d="m19.07 4.93-1.41 1.41"></path>
    </svg>
  );
}

export function PartlyCloudyIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" width={SVG_SIZE} height={SVG_SIZE} {...STROKE}>
      <path d="M12 2v2"></path>
      <path d="m4.93 4.93 1.41 1.41"></path>
      <path d="M20 12h2"></path>
      <path d="m19.07 4.93-1.41 1.41"></path>
      <path d="M15.947 12.65a4 4 0 0 0-5.925-4.128"></path>
      <path d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z"></path>
    </svg>
  );
}

export function CloudIcon() {
  return (
    <svg width={SVG_SIZE} height={SVG_SIZE} viewBox="0 0 24 24" fill="none" {...STROKE}>
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path>
    </svg>
  );
}

export function RainIcon() {
  return (
    <svg width={SVG_SIZE} height={SVG_SIZE} viewBox="0 0 24 24" fill="none" {...STROKE}>
      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path>
      <path d="m9.2 22 3-7"></path>
      <path d="m9 13-3 7"></path>
      <path d="m17 13-3 7"></path>
    </svg>
  );
}

export function ThunderstormIcon() {
  return (
    <svg width={SVG_SIZE} height={SVG_SIZE} viewBox="0 0 24 24" fill="none" {...STROKE}>
      <path d="M6 16.326A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 .5 8.973"></path>
      <path d="m13 12-3 5h4l-3 5"></path>
    </svg>
  );
}

export function SnowIcon() {
  return (
    <svg width={SVG_SIZE} height={SVG_SIZE} viewBox="0 0 24 24" fill="none" {...STROKE}>
      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path>
      <path d="M8 15h.01"></path>
      <path d="M8 19h.01"></path>
      <path d="M12 17h.01"></path>
      <path d="M12 21h.01"></path>
      <path d="M16 15h.01"></path>
      <path d="M16 19h.01"></path>
    </svg>
  );
}

export function WindIcon() {
  return (
    <svg width={SVG_SIZE} height={SVG_SIZE} viewBox="0 0 24 24" fill="none" {...STROKE}>
      <path d="M12.8 19.6A2 2 0 1 0 14 16H2"></path>
      <path d="M17.5 8a2.5 2.5 0 1 1 2 4H2"></path>
      <path d="M9.8 4.4A2 2 0 1 1 11 8H2"></path>
    </svg>
  );
}

export function ClockIcon() {
  return (
    <svg width={SVG_SIZE} height={SVG_SIZE} viewBox="0 0 24 24" fill="none" {...STROKE}>
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12 6 12 12 14.5 16"></polyline>
    </svg>
  );
}

export function WeatherIcon({ condition }: { condition: string }) {
  const c = condition.toLowerCase();
  if (c.includes('thunder')) return <ThunderstormIcon />;
  if (c.includes('snow') || c.includes('flurr')) return <SnowIcon />;
  if (c.includes('rain') || c.includes('shower') || c.includes('drizzle')) return <RainIcon />;
  if (c.includes('partly') || c.includes('few clouds')) return <PartlyCloudyIcon />;
  if (c.includes('cloud') || c.includes('overcast')) return <CloudIcon />;
  if (c.includes('wind')) return <WindIcon />;
  return <SunIcon />;
}
