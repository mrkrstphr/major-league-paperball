import React from 'react';
import { font, SCREEN_PADDING } from './styles';

type Team = { id: number; name: string };
type Props = { groups: Team[][] };

export default function MissingTeam({ groups }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: SCREEN_PADDING, fontSize: font.base }}>
      <div style={{ marginBottom: 12 }}>
        It looks like you're missing a team! Place a variable inside a .env file with the ID of the team you want to follow:
      </div>
      <div style={{ marginBottom: 12, fontSize: font.base }}>
        TEAM_ID=1234
      </div>
      <div style={{ marginBottom: 24 }}>Replace 1234 with a team ID from below:</div>
      <div style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
        {(groups ?? []).map((group, gi) => (
          <div key={gi} style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 4 }}>
            {group.map((team) => (
              <div key={team.id} style={{ display: 'flex', flexDirection: 'row', gap: 12 }}>
                <span>{team.id}</span>
                <span>{team.name}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
