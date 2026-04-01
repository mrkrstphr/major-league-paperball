import React from 'react';
import { CloudIcon } from './CloudIcon';
import { PartlyCloudyIcon } from './PartlyCloudyIcon';
import { RainIcon } from './RainIcon';
import { SnowIcon } from './SnowIcon';
import { SunIcon } from './SunIcon';
import { ThunderstormIcon } from './ThunderstormIcon';
import { WindIcon } from './WindIcon';

export function WeatherIcon({ condition }: { condition: string }) {
  const c = condition.toLowerCase();
  if (c.includes('thunder')) return <ThunderstormIcon />;
  if (c.includes('snow') || c.includes('flurr')) return <SnowIcon />;
  if (c.includes('rain') || c.includes('shower') || c.includes('drizzle'))
    return <RainIcon />;
  if (c.includes('partly') || c.includes('few clouds'))
    return <PartlyCloudyIcon />;
  if (c.includes('cloud') || c.includes('overcast')) return <CloudIcon />;
  if (c.includes('wind')) return <WindIcon />;
  return <SunIcon />;
}
