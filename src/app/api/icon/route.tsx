import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#2563eb',
          borderRadius: '112px',
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 512 512">
          <path 
            d="M112 256h80l48-112 64 224 48-112h80" 
            fill="none" 
            stroke="white" 
            strokeWidth="48" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
        </svg>
      </div>
    ),
    {
      width: 512,
      height: 512,
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Type': 'image/png'
      }
    }
  );
}
