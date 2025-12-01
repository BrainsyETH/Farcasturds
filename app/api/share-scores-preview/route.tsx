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
            flexDirection: 'column',
            background: 'linear-gradient(135deg, #1a0b2e 0%, #2d1b4e 25%, #16213e 50%, #0f0919 100%)',
            position: 'relative',
            padding: '36px',
          }}
        >
          {/* Animated gradient orbs */}
          <div
            style={{
              position: 'absolute',
              top: '6%',
              left: '12%',
              width: '360px',
              height: '360px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(139,92,246,0.32) 0%, transparent 70%)',
              filter: 'blur(60px)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '6%',
              right: '12%',
              width: '320px',
              height: '320px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(34,197,94,0.24) 0%, transparent 70%)',
              filter: 'blur(60px)',
            }}
          />

          {/* Main container */}
          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
              borderRadius: '28px',
              border: '2px solid rgba(255,255,255,0.1)',
              boxShadow: '0 30px 70px rgba(0,0,0,0.45), inset 0 0 40px rgba(255,255,255,0.03)',
              padding: '32px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              backdropFilter: 'blur(20px)',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '42px' }}>💩</span>
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
                </div>
                <span style={{ color: '#e5e7eb', fontSize: '26px', fontWeight: 700 }}>
                  @{username}
                </span>
                <span style={{ color: '#9ca3af', fontSize: '16px', fontWeight: 600 }}>
                  FID {fid}
                </span>
              </div>
              <div
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                  color: '#fff',
                  padding: '10px 18px',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '16px',
                  boxShadow: '0 8px 32px rgba(139,92,246,0.5)',
                  letterSpacing: '0.02em',
                }}
              >
                farcasturds.xyz
              </div>
            </div>

            {/* Scores Grid - 2x2 */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                flex: 1,
              }}
            >
              {/* Row 1 */}
              <div style={{ display: 'flex', gap: '14px', flex: 1 }}>
                {/* Turd Score - Featured with emoji */}
                <div
                  style={{
                    background: 'linear-gradient(145deg, rgba(139,92,246,0.15), rgba(168,85,247,0.08))',
                    border: '2px solid rgba(139,92,246,0.4)',
                    borderRadius: '18px',
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
                    <span style={{ color: '#e0e7ff', fontSize: '22px', fontWeight: 700 }}>Turd Score</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                    <span style={{ color: turdColor, fontSize: '60px', fontWeight: 900, lineHeight: 1 }}>
                      {turdScore}
                    </span>
                    <span style={{ color: '#c4b5fd', fontSize: '28px', fontWeight: 700 }}>%</span>
                  </div>
                  <span style={{ color: '#a78bfa', fontSize: '14px', fontWeight: 600 }}>
                    {turdScore !== 'N/A' && parseFloat(turdScore) >= 90 ? 'Top tier bad takes!' : 'Percentile rank'}
                  </span>
                </div>

                {/* Neynar Score */}
                <div
                  style={{
                    background: 'linear-gradient(145deg, rgba(99,102,241,0.15), rgba(99,102,241,0.08))',
                    border: '2px solid rgba(99,102,241,0.4)',
                    borderRadius: '18px',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    flex: 1,
                    boxShadow: '0 8px 32px rgba(99,102,241,0.2)',
                  }}
                >
                  <span style={{ color: '#e0e7ff', fontSize: '22px', fontWeight: 700 }}>Neynar Score</span>
                  <span style={{ color: '#818cf8', fontSize: '60px', fontWeight: 900, lineHeight: 1 }}>
                    {neynarScore}
                  </span>
                  <span style={{ color: '#a5b4fc', fontSize: '14px', fontWeight: 600 }}>Quality score</span>
                </div>
              </div>

              {/* Row 2 */}
              <div style={{ display: 'flex', gap: '14px', flex: 1 }}>
                {/* Base Score */}
                <div
                  style={{
                    background: 'linear-gradient(145deg, rgba(0,82,255,0.18), rgba(0,122,255,0.1))',
                    border: '2px solid rgba(0,82,255,0.5)',
                    borderRadius: '18px',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    flex: 1,
                    boxShadow: '0 8px 32px rgba(0,82,255,0.25)',
                  }}
                >
                  <span style={{ color: '#dbeafe', fontSize: '22px', fontWeight: 700 }}>Base Score</span>
                  <span style={{ color: '#60a5fa', fontSize: '60px', fontWeight: 900, lineHeight: 1 }}>
                    {builderScore}
                  </span>
                  <span style={{ color: '#93c5fd', fontSize: '14px', fontWeight: 600 }}>Onchain activity</span>
                </div>

                {/* Ethos Score */}
                <div
                  style={{
                    background: 'linear-gradient(145deg, rgba(75,85,99,0.2), rgba(75,85,99,0.1))',
                    border: '2px solid rgba(75,85,99,0.4)',
                    borderRadius: '18px',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    flex: 1,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                  }}
                >
                  <span style={{ color: '#e5e7eb', fontSize: '22px', fontWeight: 700 }}>Ethos Score</span>
                  <span style={{ color: ethosColor, fontSize: '60px', fontWeight: 900, lineHeight: 1 }}>
                    {ethosScore}
                  </span>
                  <span style={{ color: '#d1d5db', fontSize: '14px', fontWeight: 600 }}>Credibility rating</span>
                </div>
              </div>
            </div>

            {/* Footer CTA */}
            <div
              style={{
                background: 'linear-gradient(90deg, rgba(139,92,246,0.1) 0%, rgba(34,197,94,0.1) 100%)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '16px',
                padding: '14px 20px',
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
