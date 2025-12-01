import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const normalizeValue = (value: string | null, fallback = 'N/A') => {
  if (!value) return fallback;
  const trimmed = value.trim();
  return trimmed && trimmed !== 'null' && trimmed !== 'undefined' ? trimmed : fallback;
};

// Get Ethos score color based on score level (matching Ethos native color scheme)
function getEthosColor(score: string | null): { color: string; background: string; border: string } {
  if (!score || score === 'N/A') {
    return {
      color: '#86efac',
      background: 'linear-gradient(135deg, rgba(34,197,94,0.22), rgba(34,197,94,0.1))',
      border: '1.5px solid rgba(34,197,94,0.35)',
    };
  }

  const numScore = parseInt(score, 10);

  // Ethos native color gradient: red (untrusted) to purple (exemplary)
  if (numScore >= 2000) {
    return {
      color: '#d8b4fe', // Purple - Exemplary
      background: 'linear-gradient(135deg, rgba(168,85,247,0.22), rgba(168,85,247,0.1))',
      border: '1.5px solid rgba(168,85,247,0.35)',
    };
  }
  if (numScore >= 1600) {
    return {
      color: '#86efac', // Green - Reputable
      background: 'linear-gradient(135deg, rgba(34,197,94,0.22), rgba(34,197,94,0.1))',
      border: '1.5px solid rgba(34,197,94,0.35)',
    };
  }
  if (numScore >= 1200) {
    return {
      color: '#fde047', // Yellow - Neutral
      background: 'linear-gradient(135deg, rgba(234,179,8,0.22), rgba(234,179,8,0.1))',
      border: '1.5px solid rgba(234,179,8,0.35)',
    };
  }
  if (numScore >= 800) {
    return {
      color: '#fdba74', // Orange - Questionable
      background: 'linear-gradient(135deg, rgba(249,115,22,0.22), rgba(249,115,22,0.1))',
      border: '1.5px solid rgba(249,115,22,0.35)',
    };
  }
  return {
    color: '#fca5a5', // Red - Untrusted
    background: 'linear-gradient(135deg, rgba(239,68,68,0.22), rgba(239,68,68,0.1))',
    border: '1.5px solid rgba(239,68,68,0.35)',
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fid = normalizeValue(searchParams.get('fid'), 'N/A');
    const neynarScore = normalizeValue(searchParams.get('neynarScore'));
    const spamScoreRaw = normalizeValue(searchParams.get('spamScore'), '');
    const builderScore = normalizeValue(searchParams.get('builderScore'));
    const ethosScore = normalizeValue(searchParams.get('ethosScore'));
    const username = normalizeValue(searchParams.get('username'), 'User');

    const spamScore = spamScoreRaw ? spamScoreRaw : null;
    const ethosStyle = getEthosColor(ethosScore);

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background:
              'radial-gradient(circle at 20% 20%, rgba(105,56,199,0.24), transparent 40%), radial-gradient(circle at 78% 78%, rgba(34,197,94,0.18), transparent 36%), linear-gradient(135deg, #0c0b14, #1d0f2d 55%, #0f1928)',
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
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 30px 120px rgba(0,0,0,0.55)',
              padding: '36px',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ color: '#c4b5fd', letterSpacing: '0.12em', fontSize: '18px', fontWeight: 700 }}>
                  Farcasturds Reputation
                </span>
                <span style={{ color: '#f3f4f6', fontSize: '34px', fontWeight: 800 }}>
                  @{username} • FID {fid}
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

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
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
                  flex: '1 1 48%',
                }}
              >
                <span style={{ color: '#e0def5', fontSize: '20px', fontWeight: 700 }}>Neynar Quality</span>
                <span style={{ color: '#c084fc', fontSize: '40px', fontWeight: 800 }}>{neynarScore}</span>
              </div>

              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(0,82,255,0.22), rgba(0,122,255,0.1))',
                  border: '1.5px solid rgba(0,82,255,0.45)',
                  borderRadius: '18px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  flex: '1 1 48%',
                }}
              >
                <span style={{ color: '#bfdbfe', fontSize: '20px', fontWeight: 700 }}>Base Onchain</span>
                <span style={{ color: '#60a5fa', fontSize: '40px', fontWeight: 800 }}>{builderScore}</span>
              </div>

              <div
                style={{
                  background: spamScore
                    ? 'linear-gradient(135deg, rgba(251,146,60,0.22), rgba(251,146,60,0.1))'
                    : 'linear-gradient(135deg, rgba(75,85,99,0.3), rgba(75,85,99,0.15))',
                  border: spamScore ? '1.5px solid rgba(251,146,60,0.38)' : '1.5px solid rgba(75,85,99,0.5)',
                  borderRadius: '18px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  flex: '1 1 48%',
                }}
              >
                <span style={{ color: '#e5e7eb', fontSize: '20px', fontWeight: 700 }}>
                  {spamScore ? 'Spam Score' : 'Ethos Credibility'}
                </span>
                <span
                  style={{
                    color: spamScore ? '#fbbf24' : ethosStyle.color,
                    fontSize: '40px',
                    fontWeight: 800,
                  }}
                >
                  {spamScore || ethosScore}
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
                  flex: '1 1 48%',
                }}
              >
                <span style={{ color: '#d1d5db', fontSize: '18px', fontWeight: 700 }}>Share your scores</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    color: '#f9fafb',
                    fontSize: '22px',
                    fontWeight: 800,
                    letterSpacing: '0.01em',
                  }}>
                    Mint a Turd on Farcasturds
                  </span>
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
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (error: any) {
    console.error('Error generating share preview image:', error);
    return new Response(`Failed to generate image: ${error.message}`, {
      status: 500,
    });
  }
}
