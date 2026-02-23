import React from 'react';

type Props = {
  children: React.ReactNode;
};

export default function Banner({ children }: Props) {
  return (
    <div
      style={{
        position: 'absolute',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: 'black',
        color: 'white',
        width: '100%',
        left: 0,
        top: 140,
        padding: '16px 24px',
      }}
    >
      {children}
    </div>
  );
}
