import React from 'react';

export const SCREEN_PADDING = 16;

export const colors = {
  black: '#000000',
  white: '#ffffff',
  gray: '#6b7280',
};

export const font = {
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
};

// Satori requires explicit display on all multi-child divs.
// Use these helpers to avoid forgetting.
export const row: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
};

export const col: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
};

export const center: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

export const headerBanner: React.CSSProperties = {
  backgroundColor: '#000000',
  color: '#ffffff',
  width: '100%',
  padding: '16px 0',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
};
