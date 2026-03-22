import React from 'react';

export default function Spinner({ size = 24 }: { size?: number }) {
  return (
    <div style={{
      width: size,
      height: size,
      border: '3px solid var(--border)',
      borderTopColor: 'var(--accent)',
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
      display: 'inline-block',
    }} role="status" aria-label="Loading" />
  );
}