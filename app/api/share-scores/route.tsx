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

// Get Turd Score gradient color (green to red based on percentile)
function getTurdScoreColor(score: string | null): string {
  if (!score || score === 'N/A') return '#86efac';

  const numScore = parseFloat(score);
  if (isNaN(numScore)) return '#86efac';

  // 0% = green (#22c55e = rgb(34, 197, 94))
  // 99% = red (#ef4444 = rgb(239, 68, 68))
  const clampedScore = Math.min(Math.max(numScore, 0), 99);
  const ratio = clampedScore / 99;

  const r = Math.round(34 + (239 - 34) * ratio);
  const g = Math.round(197 + (68 - 197) * ratio);
  const b = Math.round(94 + (68 - 94) * ratio);

  return `rgb(${r}, ${g}, ${b})`;
}

// Get Ethos score color based on score level (matching Ethos native color scheme)
function getEthosColor(score: string | null): string {
  if (!score || score === 'N/A') return '#9ca3af';

  const numScore = parseInt(score, 10);

  // Ethos native color gradient: red (untrusted) to purple (exemplary)
  if (numScore >= 2000) return '#c084fc'; // Purple - Exemplary
  if (numScore >= 1600) return '#4ade80'; // Green - Reputable
  if (numScore >= 1200) return '#fbbf24'; // Yellow - Neutral
  if (numScore >= 800) return '#fb923c'; // Orange - Questionable
  return '#f87171'; // Red - Untrusted
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fid = normalizeValue(searchParams.get('fid'), 'N/A');
    const neynarScore = normalizeValue(searchParams.get('neynarScore'));
    const builderScore = normalizeValue(searchParams.get('builderScore'));
    const ethosScore = normalizeValue(searchParams.get('ethosScore'));
    const turdScore = normalizeValue(searchParams.get('turdScore'));
    const username = normalizeValue(searchParams.get('username'), 'User');

    const turdColor = getTurdScoreColor(turdScore);
    const ethosColor = getEthosColor(ethosScore);

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #1a0b2e 0%, #2d1b4e 25%, #16213e 50%, #0f0919 100%)',
            position: 'relative',
          }}
        >
          {/* Animated gradient orbs */}
          <div
            style={{
              position: 'absolute',
              top: '10%',
              left: '15%',
              width: '400px',
              height: '400px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(139,92,246,0.4) 0%, transparent 70%)',
              filter: 'blur(60px)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '10%',
              right: '15%',
              width: '350px',
              height: '350px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(34,197,94,0.3) 0%, transparent 70%)',
              filter: 'blur(60px)',
            }}
          />

          {/* Main container */}
          <div
            style={{
              width: '1100px',
              height: '550px',
              background: 'linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
              borderRadius: '32px',
              border: '2px solid rgba(255,255,255,0.1)',
              boxShadow: '0 40px 100px rgba(0,0,0,0.6), inset 0 0 60px rgba(255,255,255,0.03)',
              padding: '40px 50px',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              backdropFilter: 'blur(20px)',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: '48px' }}>💩</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span
                    style={{
                      color: '#c4b5fd',
                      letterSpacing: '0.08em',
                      fontSize: '20px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                    }}
                  >
                    Reputation Scores
                  </span>
                  <span style={{ color: '#e5e7eb', fontSize: '26px', fontWeight: 700 }}>
                    @{username} • FID {fid}
                  </span>
                </div>
              </div>
              <div
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                  color: '#fff',
                  padding: '12px 20px',
                  borderRadius: '14px',
                  fontWeight: 800,
                  fontSize: '18px',
                  boxShadow: '0 8px 32px rgba(139,92,246,0.5)',
                }}
              >
                farcasturds.xyz
              </div>
            </div>

            {/* Scores Grid - 4 columns */}
            <div style={{ display: 'flex', gap: '16px', flex: 1 }}>
              {/* Turd Score */}
              <div
                style={{
                  background: 'linear-gradient(145deg, rgba(139,92,246,0.15), rgba(168,85,247,0.08))',
                  border: '2px solid rgba(139,92,246,0.4)',
                  borderRadius: '20px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  flex: 1,
                  boxShadow: '0 8px 32px rgba(139,92,246,0.2)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '28px' }}>💩</span>
                  <span style={{ color: '#e0e7ff', fontSize: '20px', fontWeight: 700 }}>Turd</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <span style={{ color: turdColor, fontSize: '52px', fontWeight: 900, lineHeight: 1 }}>
                    {turdScore}
                  </span>
                  <span style={{ color: '#c4b5fd', fontSize: '28px', fontWeight: 700 }}>%</span>
                </div>
              </div>

              {/* Neynar Score */}
              <div
                style={{
                  background: 'linear-gradient(145deg, rgba(99,102,241,0.15), rgba(99,102,241,0.08))',
                  border: '2px solid rgba(99,102,241,0.4)',
                  borderRadius: '20px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  flex: 1,
                  boxShadow: '0 8px 32px rgba(99,102,241,0.2)',
                }}
              >
                <span style={{ color: '#e0e7ff', fontSize: '20px', fontWeight: 700 }}>Neynar</span>
                <span style={{ color: '#818cf8', fontSize: '52px', fontWeight: 900, lineHeight: 1 }}>
                  {neynarScore}
                </span>
              </div>

              {/* Base Score */}
              <div
                style={{
                  background: 'linear-gradient(145deg, rgba(0,82,255,0.18), rgba(0,122,255,0.1))',
                  border: '2px solid rgba(0,82,255,0.5)',
                  borderRadius: '20px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  flex: 1,
                  boxShadow: '0 8px 32px rgba(0,82,255,0.25)',
                }}
              >
                <span style={{ color: '#dbeafe', fontSize: '20px', fontWeight: 700 }}>Base</span>
                <span style={{ color: '#60a5fa', fontSize: '52px', fontWeight: 900, lineHeight: 1 }}>
                  {builderScore}
                </span>
              </div>

              {/* Ethos Score */}
              <div
                style={{
                  background: 'linear-gradient(145deg, rgba(75,85,99,0.2), rgba(75,85,99,0.1))',
                  border: '2px solid rgba(75,85,99,0.4)',
                  borderRadius: '20px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  flex: 1,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                }}
              >
                <span style={{ color: '#e5e7eb', fontSize: '20px', fontWeight: 700 }}>Ethos</span>
                <span style={{ color: ethosColor, fontSize: '52px', fontWeight: 900, lineHeight: 1 }}>
                  {ethosScore}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                background: 'linear-gradient(90deg, rgba(139,92,246,0.1) 0%, rgba(34,197,94,0.1) 100%)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '16px',
                padding: '12px 20px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <span style={{ color: '#f3f4f6', fontSize: '18px', fontWeight: 700, textAlign: 'center' }}>
                Tap to view full reputation & mint turds 💩
              </span>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (error: any) {
    console.error('Error generating share image:', error);
    return new Response(`Failed to generate image: ${error.message}`, {
      status: 500,
    });
  }
}
