import React from 'react';
import { font, SCREEN_PADDING } from './styles';

export default function Offline() {
  return (
    <div style={{ padding: SCREEN_PADDING, fontSize: font.base }}>
      App is offline. Something isn't running.
    </div>
  );
}
