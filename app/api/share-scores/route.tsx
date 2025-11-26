import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fid = searchParams.get('fid');
    const neynarScore = searchParams.get('neynarScore');
    const spamScore = searchParams.get('spamScore');
    const builderScore = searchParams.get('builderScore');
    const ethosScore = searchParams.get('ethosScore');
    const username = searchParams.get('username') || 'User';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #511974, #1e2329, #501f7b, #371479)',
            padding: '40px',
          }}
        >
          {/* Main Card */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.9))',
              borderRadius: '24px',
              padding: '48px',
              width: '700px',
              display: 'flex',
              flexDirection: 'column',
              gap: '32px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '48px', fontWeight: 'bold', margin: 0, color: '#1b0a33' }}>
                Reputation Scores
              </h1>
              <p style={{ fontSize: '20px', margin: 0, color: '#6e5c88' }}>
                @{username} • FID {fid}
              </p>
            </div>

            {/* Scores Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Neynar Score */}
              <div
                style={{
                  background: 'rgba(139, 92, 246, 0.15)',
                  border: '2px solid rgba(139, 92, 246, 0.35)',
                  borderRadius: '16px',
                  padding: '24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: '28px', fontWeight: 600, color: '#1b0a33' }}>
                  Neynar Quality Score
                </span>
                <span style={{ fontSize: '48px', fontWeight: 700, color: '#8b5cf6' }}>
                  {neynarScore || 'N/A'}
                </span>
              </div>

              {/* Spam Score */}
              {spamScore && spamScore !== 'null' && (
                <div
                  style={{
                    background: 'rgba(251, 146, 60, 0.15)',
                    border: '2px solid rgba(251, 146, 60, 0.35)',
                    borderRadius: '16px',
                    padding: '24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: '28px', fontWeight: 600, color: '#1b0a33' }}>
                    Spam Score
                  </span>
                  <span style={{ fontSize: '48px', fontWeight: 700, color: '#fb923c' }}>
                    {spamScore}
                  </span>
                </div>
              )}

              {/* Builder Score */}
              <div
                style={{
                  background: 'rgba(59, 130, 246, 0.15)',
                  border: '2px solid rgba(59, 130, 246, 0.35)',
                  borderRadius: '16px',
                  padding: '24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: '28px', fontWeight: 600, color: '#1b0a33' }}>
                  Builder Score
                </span>
                <span style={{ fontSize: '48px', fontWeight: 700, color: '#3b82f6' }}>
                  {builderScore || 'N/A'}
                </span>
              </div>

              {/* Ethos Score */}
              <div
                style={{
                  background: 'rgba(34, 197, 94, 0.15)',
                  border: '2px solid rgba(34, 197, 94, 0.35)',
                  borderRadius: '16px',
                  padding: '24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: '28px', fontWeight: 600, color: '#1b0a33' }}>
                  Ethos Onchain Score
                </span>
                <span style={{ fontSize: '48px', fontWeight: 700, color: '#22c55e' }}>
                  {ethosScore || 'N/A'}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
              <span style={{ fontSize: '20px', color: '#6e5c88' }}>
                farcasturds.xyz
              </span>
            </div>
          </div>
        </div>
      ),
      {
        width: 800,
        height: 800,
      }
    );
  } catch (error: any) {
    console.error('Error generating share image:', error);
    return new Response(`Failed to generate image: ${error.message}`, {
      status: 500,
    });
  }
}
