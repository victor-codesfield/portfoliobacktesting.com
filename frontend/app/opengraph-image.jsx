import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Portfolio Backtester';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0e17',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            marginBottom: '30px',
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '16px',
              background: 'rgba(0, 229, 255, 0.1)',
              border: '2px solid rgba(0, 229, 255, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '40px',
              fontWeight: 800,
              color: '#00e5ff',
            }}
          >
            PB
          </div>
          <div style={{ fontSize: '48px', fontWeight: 700, color: '#ffffff' }}>
            Portfolio Backtester
          </div>
        </div>
        <div style={{ fontSize: '24px', color: '#64748b' }}>
          Backtest your investment strategy with historical data
        </div>
      </div>
    ),
    { ...size }
  );
}
