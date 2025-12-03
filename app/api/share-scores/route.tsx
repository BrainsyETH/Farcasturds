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

// Inline SVG logos as data URIs - no external fetching needed for edge runtime
const LOGOS = {
  neynar: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="6" fill="#6366f1"/>
    <path d="M8 22V10h3.5l6.5 8.5V10H21v12h-3.5L11 13.5V22H8z" fill="white"/>
  </svg>`,
  base: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#0052FF"/>
    <path d="M16 28C22.627 28 28 22.627 28 16C28 9.373 22.627 4 16 4C9.98 4 4.94 8.35 4 14.1h17v3.8H4C4.94 23.65 9.98 28 16 28z" fill="white"/>
  </svg>`,
  ethos: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="6" fill="#6b7280"/>
    <path d="M16 6l-8 5v8c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11v-8l-8-5zm-1 16h-4v-2h4v2zm0-4h-4v-2h4v2zm0-4h-4v-2h4v2zm6 8h-4v-2h4v2zm0-4h-4v-2h4v2zm0-4h-4v-2h4v2z" fill="white"/>
  </svg>`,
  openrank: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="6" fill="#ff8c00"/>
    <path d="M16 4c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12S22.627 4 16 4zm0 21c-4.971 0-9-4.029-9-9s4.029-9 9-9 9 4.029 9 9-4.029 9-9 9z" fill="white"/>
    <path d="M16 9c-3.866 0-7 3.134-7 7s3.134 7 7 7 7-3.134 7-7-3.134-7-7-7zm0 11c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4z" fill="white"/>
  </svg>`,
};

// Convert SVG to data URI for use in ImageResponse
function svgToDataUri(svg: string): string {
  const base64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fid = normalizeValue(searchParams.get('fid'), 'N/A');
    const neynarScore = normalizeValue(searchParams.get('neynarScore'));
    const builderScore = normalizeValue(searchParams.get('builderScore'));
    const ethosScore = normalizeValue(searchParams.get('ethosScore'));
    const openRankRank = normalizeValue(searchParams.get('openRankRank'));
    const turdScore = normalizeValue(searchParams.get('turdScore'));
    const username = normalizeValue(searchParams.get('username'), 'User');
    const pfpUrl = normalizeValue(searchParams.get('pfpUrl'), 'https://farcasturds.vercel.app/splash.png');

    // Format OpenRank rank with # prefix if it's a number
    const openRankDisplay = openRankRank !== 'N/A' ? `#${parseInt(openRankRank).toLocaleString()}` : 'N/A';

    const turdColor = getTurdScoreColor(turdScore);
    const ethosColor = getEthosColor(ethosScore);

    // Convert inline SVG logos to data URIs - no external fetching needed
    const neynarLogo = svgToDataUri(LOGOS.neynar);
    const baseLogo = svgToDataUri(LOGOS.base);
    const ethosLogo = svgToDataUri(LOGOS.ethos);
    const openRankLogo = svgToDataUri(LOGOS.openrank);

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
              top: '15%',
              left: '15%',
              width: '350px',
              height: '350px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(139,92,246,0.4) 0%, transparent 70%)',
              filter: 'blur(60px)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '15%',
              right: '15%',
              width: '300px',
              height: '300px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(34,197,94,0.3) 0%, transparent 70%)',
              filter: 'blur(60px)',
            }}
          />

          {/* Main container - Now square and vertical layout */}
          <div
            style={{
              width: '900px',
              height: '900px',
              background: 'linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
              borderRadius: '32px',
              border: '2px solid rgba(255,255,255,0.1)',
              boxShadow: '0 40px 100px rgba(0,0,0,0.6), inset 0 0 60px rgba(255,255,255,0.03)',
              padding: '40px',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              backdropFilter: 'blur(20px)',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <img
                  src={pfpUrl}
                  alt="Profile"
                  style={{ width: '64px', height: '64px', borderRadius: '50%', border: '3px solid rgba(139,92,246,0.5)' }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ color: '#e5e7eb', fontSize: '28px', fontWeight: 700 }}>
                    @{username}
                  </span>
                  <span style={{ color: '#9ca3af', fontSize: '22px', fontWeight: 600 }}>
                    FID {fid}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img
                  src="https://farcasturds.vercel.app/splash.png"
                  alt="Farcasturds"
                  style={{ width: '48px', height: '48px' }}
                />
                <span
                  style={{
                    color: '#c4b5fd',
                    letterSpacing: '0.08em',
                    fontSize: '24px',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                  }}
                >
                  Onchain Scores
                </span>
              </div>
            </div>

            {/* Scores Stack - Vertical layout for mobile-friendly display */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
              {/* Turd Score */}
              <div
                style={{
                  background: 'linear-gradient(145deg, rgba(139,92,246,0.15), rgba(168,85,247,0.08))',
                  border: '2px solid rgba(139,92,246,0.4)',
                  borderRadius: '18px',
                  padding: '24px 28px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxShadow: '0 8px 32px rgba(139,92,246,0.2)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <img
                    src="https://farcasturds.vercel.app/splash.png"
                    alt="Turd"
                    style={{ width: '40px', height: '40px' }}
                  />
                  <span style={{ color: '#e0e7ff', fontSize: '32px', fontWeight: 800 }}>Turd Score</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <span style={{ color: turdColor, fontSize: '56px', fontWeight: 900, lineHeight: 1 }}>
                    {turdScore}
                  </span>
                  <span style={{ color: '#c4b5fd', fontSize: '32px', fontWeight: 700 }}>%</span>
                </div>
              </div>

              {/* Neynar Score */}
              <div
                style={{
                  background: 'linear-gradient(145deg, rgba(99,102,241,0.15), rgba(99,102,241,0.08))',
                  border: '2px solid rgba(99,102,241,0.4)',
                  borderRadius: '18px',
                  padding: '24px 28px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxShadow: '0 8px 32px rgba(99,102,241,0.2)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <img
                    src={neynarLogo}
                    alt="Neynar"
                    style={{ width: '40px', height: '40px' }}
                  />
                  <span style={{ color: '#e0e7ff', fontSize: '32px', fontWeight: 800 }}>Neynar</span>
                </div>
                <span style={{ color: '#818cf8', fontSize: '56px', fontWeight: 900, lineHeight: 1 }}>
                  {neynarScore}
                </span>
              </div>

              {/* Base Score */}
              <div
                style={{
                  background: 'linear-gradient(145deg, rgba(0,82,255,0.18), rgba(0,122,255,0.1))',
                  border: '2px solid rgba(0,82,255,0.5)',
                  borderRadius: '18px',
                  padding: '24px 28px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxShadow: '0 8px 32px rgba(0,82,255,0.25)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <img
                    src={baseLogo}
                    alt="Base"
                    style={{ width: '40px', height: '40px' }}
                  />
                  <span style={{ color: '#dbeafe', fontSize: '32px', fontWeight: 800 }}>Base</span>
                </div>
                <span style={{ color: '#60a5fa', fontSize: '56px', fontWeight: 900, lineHeight: 1 }}>
                  {builderScore}
                </span>
              </div>

              {/* Ethos Score */}
              <div
                style={{
                  background: 'linear-gradient(145deg, rgba(75,85,99,0.2), rgba(75,85,99,0.1))',
                  border: '2px solid rgba(75,85,99,0.4)',
                  borderRadius: '18px',
                  padding: '24px 28px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <img
                    src={ethosLogo}
                    alt="Ethos"
                    style={{ width: '40px', height: '40px' }}
                  />
                  <span style={{ color: '#e5e7eb', fontSize: '32px', fontWeight: 800 }}>Ethos</span>
                </div>
                <span style={{ color: ethosColor, fontSize: '56px', fontWeight: 900, lineHeight: 1 }}>
                  {ethosScore}
                </span>
              </div>

              {/* OpenRank Score */}
              <div
                style={{
                  background: 'linear-gradient(145deg, rgba(255,165,0,0.18), rgba(255,140,0,0.1))',
                  border: '2px solid rgba(255,165,0,0.5)',
                  borderRadius: '18px',
                  padding: '24px 28px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxShadow: '0 8px 32px rgba(255,165,0,0.25)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <img
                    src={openRankLogo}
                    alt="OpenRank"
                    style={{ width: '40px', height: '40px' }}
                  />
                  <span style={{ color: '#fef3c7', fontSize: '32px', fontWeight: 800 }}>OpenRank</span>
                </div>
                <span style={{ color: '#fbbf24', fontSize: '56px', fontWeight: 900, lineHeight: 1 }}>
                  {openRankDisplay}
                </span>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1080,
        height: 1080,
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
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  }
}
