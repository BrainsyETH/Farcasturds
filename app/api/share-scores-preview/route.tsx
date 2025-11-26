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
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(circle at 20% 20%, rgba(105,56,199,0.25), transparent 40%), radial-gradient(circle at 80% 80%, rgba(34,197,94,0.18), transparent 35%), linear-gradient(135deg, #0c0b14, #1d0f2d 55%, #0f1928)',
            padding: '48px',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              maxWidth: '900px',
              maxHeight: '900px',
              background: 'linear-gradient(145deg, rgba(255,255,255,0.1), rgba(255,255,255,0.03))',
              borderRadius: '32px',
              border: '1px solid rgba(255,255,255,0.06)',
              boxShadow: '0 30px 120px rgba(0,0,0,0.55)',
              padding: '36px',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ color: '#c4b5fd', letterSpacing: '0.12em', fontSize: '18px', fontWeight: 700 }}>
                  Farcasturds Reputation
                </span>
                <span style={{ color: '#f3f4f6', fontSize: '34px', fontWeight: 800 }}>
                  @{username} • FID {fid || 'N/A'}
                </span>
              </div>
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(105,56,199,0.9), rgba(59,130,246,0.9))',
                  color: '#fff',
                  padding: '10px 18px',
                  borderRadius: '14px',
                  fontWeight: 700,
                  fontSize: '18px',
                  boxShadow: '0 12px 30px rgba(105,56,199,0.4)',
                }}
              >
                farcasturds.xyz
              </div>
            </div>

            {/* Scores */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: '18px',
              }}
            >
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(105,56,199,0.22), rgba(139,92,246,0.12))',
                  border: '1.5px solid rgba(139,92,246,0.35)',
                  borderRadius: '18px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <span style={{ color: '#e0def5', fontSize: '20px', fontWeight: 700 }}>Neynar Quality</span>
                <span style={{ color: '#c084fc', fontSize: '40px', fontWeight: 800 }}>
                  {neynarScore || 'N/A'}
                </span>
              </div>

              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(59,130,246,0.22), rgba(59,130,246,0.1))',
                  border: '1.5px solid rgba(59,130,246,0.35)',
                  borderRadius: '18px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <span style={{ color: '#dceafe', fontSize: '20px', fontWeight: 700 }}>Builder Score</span>
                <span style={{ color: '#93c5fd', fontSize: '40px', fontWeight: 800 }}>
                  {builderScore || 'N/A'}
                </span>
              </div>

              <div
                style={{
                  background: spamScore && spamScore !== 'null' ? 'linear-gradient(135deg, rgba(251,146,60,0.22), rgba(251,146,60,0.1))' : 'linear-gradient(135deg, rgba(34,197,94,0.22), rgba(34,197,94,0.1))',
                  border: spamScore && spamScore !== 'null' ? '1.5px solid rgba(251,146,60,0.38)' : '1.5px solid rgba(34,197,94,0.35)',
                  borderRadius: '18px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <span style={{ color: '#e5e7eb', fontSize: '20px', fontWeight: 700 }}>
                  {spamScore && spamScore !== 'null' ? 'Spam Score' : 'Ethos Onchain'}
                </span>
                <span
                  style={{
                    color: spamScore && spamScore !== 'null' ? '#fbbf24' : '#86efac',
                    fontSize: '40px',
                    fontWeight: 800,
                  }}
                >
                  {spamScore && spamScore !== 'null' ? spamScore : ethosScore || 'N/A'}
                </span>
              </div>

              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.07), rgba(255,255,255,0.04))',
                  border: '1.5px solid rgba(255,255,255,0.08)',
                  borderRadius: '18px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ color: '#d1d5db', fontSize: '18px', fontWeight: 700 }}>Share your scores</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '26px' }}>💩</span>
                  <span style={{ color: '#f9fafb', fontSize: '22px', fontWeight: 800 }}>Mint a Turd on Farcasturds</span>
                </div>
                <span style={{ color: '#9ca3af', fontSize: '16px' }}>
                  Stand out in casts with a dedicated reputation preview that links straight to the mini app.
                </span>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1000,
        height: 1000,
      }
    );
  } catch (error: any) {
    console.error('Error generating share preview image:', error);
    return new Response(`Failed to generate image: ${error.message}`, {
      status: 500,
    });
  }
}
