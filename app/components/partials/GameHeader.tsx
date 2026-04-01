import React from 'react';
import { font, row } from '../styles';
import { WeatherIcon, WindIcon, ClockIcon } from '../icons/index';

type Weather = {
  condition: string;
  temp: string;
  wind: string;
};

type Props = {
  inningDescription: string;
  awayTeam: string;
  homeTeam: string;
  weather?: Weather;
};

function parseWindSpeed(wind: string): string {
  const match = wind.match(/^(\d+)/);
  return match ? `${match[1]}mph` : wind;
}

function currentTime(): string {
  return new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export default function GameHeader({ inningDescription, awayTeam, homeTeam, weather }: Props) {
  return (
    <div
      style={{
        ...row,
        justifyContent: 'space-between',
        marginBottom: 16,
        paddingBottom: 8,
        borderBottom: '2px solid black',
        width: '100%',
      }}
    >
      <div style={{ ...row, gap: 8, fontSize: font.lg }}>
        <div style={{ display: 'flex', fontWeight: 700 }}>{`${inningDescription}:`}</div>
        <div style={{ display: 'flex' }}>{`${awayTeam} @ ${homeTeam}`}</div>
      </div>

      <div style={{ ...row, gap: 16, fontSize: font.lg }}>
        {weather && (
          <div style={{ ...row, gap: 16 }}>
            <div style={{ ...row, gap: 4 }}>
              <WeatherIcon condition={weather.condition} />
              <div style={{ display: 'flex' }}>{`${weather.temp}°`}</div>
            </div>
            <div style={{ ...row, gap: 4 }}>
              <WindIcon />
              <div style={{ display: 'flex' }}>{parseWindSpeed(weather.wind)}</div>
            </div>
          </div>
        )}
        <div style={{ ...row, gap: 4 }}>
          <ClockIcon />
          <div style={{ display: 'flex' }}>{currentTime()}</div>
        </div>
      </div>
    </div>
  );
}
