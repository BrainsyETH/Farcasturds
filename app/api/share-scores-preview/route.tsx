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
            width: '1200px',
            height: '630px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            background: 'linear-gradient(135deg, #120a1f, #2c0f4d)',
            padding: '24px',
            overflow: 'hidden',
            boxSizing: 'border-box',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
            color: '#ffffff',
          }}
        >
          {/* Soft gradient accents */}
          <div
            style={{
              position: 'absolute',
              top: '-5%',
              left: '-8%',
              width: '360px',
              height: '360px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(167,139,250,0.35), transparent 70%)',
              filter: 'blur(80px)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-6%',
              right: '-10%',
              width: '320px',
              height: '320px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(52,211,153,0.28), transparent 70%)',
              filter: 'blur(80px)',
            }}
          />

          {/* Content card scaled for Farcaster OG ratio */}
          <div
            // Keep inner content inside a square safe area so Warpcast's composer/frame preview doesn't crop edges
            style={{
              width: '800px',
              maxWidth: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              transform: 'scale(0.92)',
              transformOrigin: 'center center',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '4px 8px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img
                    src="https://farcasturds.vercel.app/splash.png"
                    alt="Splash"
                    style={{ width: '40px', height: '40px', borderRadius: '50%' }}
                  />
                  <span
                    style={{
                      fontSize: '32px',
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      textShadow: '0 0 5px #a78bfa, 0 0 10px #a78bfa',
                    }}
                  >
                    ONCHAIN SCORES
                  </span>
                </div>
                <span style={{ fontSize: '22px', fontWeight: 600 }}>@{username}</span>
                <span style={{ fontSize: '14px', color: '#cbd5e1' }}>FID {fid}</span>
              </div>
              <div
                style={{
                  padding: '8px 14px',
                  background: '#7c3aed',
                  borderRadius: '999px',
                  fontSize: '14px',
                  fontWeight: 700,
                  opacity: 0.9,
                  boxShadow: '0 10px 30px rgba(124,58,237,0.5)',
                }}
              >
                Farcasturds
              </div>
            </div>

            {/* Score grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: '12px',
              }}
            >
              {/* Turd Score */}
              <div
                style={{
                  background: 'rgba(30, 0, 50, 0.4)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '24px',
                  padding: '18px',
                  minHeight: '120px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                }}
              >
                <span style={{ fontSize: '18px', fontWeight: 400, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <img
                    src="https://farcasturds.vercel.app/splash.png"
                    alt="Splash"
                    style={{ width: '24px', height: '24px', borderRadius: '50%' }}
                  />
                  Turd Score
                </span>
                <span style={{ fontSize: '56px', fontWeight: 800, color: turdColor, lineHeight: 1 }}>{turdScore}%</span>
                <span style={{ fontSize: '12px', color: '#cbd5e1', marginTop: 'auto' }}>Percentile rank</span>
              </div>

              {/* Neynar Score */}
              <div
                style={{
                  background: 'rgba(30, 0, 50, 0.4)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '24px',
                  padding: '18px',
                  minHeight: '120px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                }}
              >
                <span style={{ fontSize: '18px', fontWeight: 400 }}>Neynar Score</span>
                <span style={{ fontSize: '56px', fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>{neynarScore}</span>
                <span style={{ fontSize: '12px', color: '#cbd5e1', marginTop: 'auto' }}>Quality score</span>
              </div>

              {/* Base Score */}
              <div
                style={{
                  background: 'rgba(30, 0, 50, 0.4)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '24px',
                  padding: '18px',
                  minHeight: '120px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                }}
              >
                <span style={{ fontSize: '18px', fontWeight: 400 }}>Base Score</span>
                <span style={{ fontSize: '56px', fontWeight: 800, color: '#60a5fa', lineHeight: 1 }}>{builderScore}</span>
                <span style={{ fontSize: '12px', color: '#cbd5e1', marginTop: 'auto' }}>Onchain activity</span>
              </div>

              {/* Ethos Score */}
              <div
                style={{
                  background: 'rgba(30, 0, 50, 0.4)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '24px',
                  padding: '18px',
                  minHeight: '120px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                }}
              >
                <span style={{ fontSize: '18px', fontWeight: 400 }}>Ethos Score</span>
                <span style={{ fontSize: '56px', fontWeight: 800, color: ethosColor, lineHeight: 1 }}>{ethosScore}</span>
                <span style={{ fontSize: '12px', color: '#cbd5e1', marginTop: 'auto' }}>Credibility rating</span>
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                marginTop: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '14px',
                color: '#e2e8f0',
                textAlign: 'center',
              }}
            >
              <span>Tap to view full reputation & mint turds</span>
              <img
                src="https://farcasturds.vercel.app/splash.png"
                alt="Splash"
                style={{ width: '20px', height: '20px', borderRadius: '50%' }}
              />
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
    console.error('Error generating share preview image:', error);
    return new Response(`Failed to generate image: ${error.message}`, {
      status: 500,
    });
  }
}
