import React from 'react';
import { font } from '../styles';
import Bases from './Bases';

type Props = {
  runners: number[];
  outs: number;
  color?: string;
};

export default function BasesAndOuts({ runners, outs, color = 'black' }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 24 }}>
      <Bases runners={runners} color={color} />
      <div style={{ display: 'flex', fontSize: font.lg, color }}>
        {`${outs} ${outs === 1 ? 'out' : 'outs'}`}
      </div>
    </div>
  );
}
