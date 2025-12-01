import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

// Get Ethos score color based on score level (matching Ethos native color scheme)
function getEthosColor(score: string | null): { color: string; background: string; border: string } {
  if (!score || score === 'N/A') {
    return {
      color: '#6b7280',
      background: 'rgba(107, 114, 128, 0.15)',
      border: 'rgba(107, 114, 128, 0.35)',
    };
  }

  const numScore = parseInt(score, 10);

  // Ethos native color gradient: red (untrusted) to purple (exemplary)
  if (numScore >= 2000) {
    return {
      color: '#a855f7', // Purple - Exemplary
      background: 'rgba(168, 85, 247, 0.15)',
      border: 'rgba(168, 85, 247, 0.35)',
    };
  }
  if (numScore >= 1600) {
    return {
      color: '#22c55e', // Green - Reputable
      background: 'rgba(34, 197, 94, 0.15)',
      border: 'rgba(34, 197, 94, 0.35)',
    };
  }
  if (numScore >= 1200) {
    return {
      color: '#eab308', // Yellow - Neutral
      background: 'rgba(234, 179, 8, 0.15)',
      border: 'rgba(234, 179, 8, 0.35)',
    };
  }
  if (numScore >= 800) {
    return {
      color: '#f97316', // Orange - Questionable
      background: 'rgba(249, 115, 22, 0.15)',
      border: 'rgba(249, 115, 22, 0.35)',
    };
  }
  return {
    color: '#ef4444', // Red - Untrusted
    background: 'rgba(239, 68, 68, 0.15)',
    border: 'rgba(239, 68, 68, 0.35)',
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fid = searchParams.get('fid');
    const neynarScore = searchParams.get('neynarScore');
    const spamScore = searchParams.get('spamScore');
    const builderScore = searchParams.get('builderScore');
    const ethosScore = searchParams.get('ethosScore');
    const username = searchParams.get('username') || 'User';

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
            background: 'linear-gradient(135deg, #511974, #1e2329, #501f7b, #371479)',
            padding: '40px',
          }}
        >
          {/* Main Card */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.9))',
              borderRadius: '24px',
              padding: '40px 60px',
              width: '100%',
              maxWidth: '1100px',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <h1 style={{ fontSize: '40px', fontWeight: 'bold', margin: 0, color: '#1b0a33' }}>
                  Reputation Scores
                </h1>
                <p style={{ fontSize: '18px', margin: 0, color: '#6e5c88' }}>
                  @{username} • FID {fid}
                </p>
              </div>
              <div style={{ fontSize: '20px', color: '#8b5cf6', fontWeight: 600 }}>
                farcasturds.xyz
              </div>
            </div>

            {/* Scores Grid - 2 columns */}
            <div style={{ display: 'flex', gap: '16px' }}>
              {/* Left Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                {/* Neynar Score */}
                <div
                  style={{
                    background: 'rgba(139, 92, 246, 0.15)',
                    border: '2px solid rgba(139, 92, 246, 0.35)',
                    borderRadius: '16px',
                    padding: '20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: '22px', fontWeight: 600, color: '#1b0a33' }}>
                    Neynar Quality
                  </span>
                  <span style={{ fontSize: '40px', fontWeight: 700, color: '#8b5cf6' }}>
                    {neynarScore || 'N/A'}
                  </span>
                </div>

                {/* Base Onchain Score */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, rgba(0, 82, 255, 0.18), rgba(0, 122, 255, 0.12))',
                    border: '2px solid rgba(0, 82, 255, 0.5)',
                    borderRadius: '16px',
                    padding: '20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: '22px', fontWeight: 600, color: '#1b0a33' }}>
                    Base Onchain
                  </span>
                  <span style={{ fontSize: '40px', fontWeight: 700, color: '#0052ff' }}>
                    {builderScore || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Right Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                {/* Spam Score or Ethos Score */}
                {spamScore && spamScore !== 'null' ? (
                  <div
                    style={{
                      background: 'rgba(251, 146, 60, 0.15)',
                      border: '2px solid rgba(251, 146, 60, 0.35)',
                      borderRadius: '16px',
                      padding: '20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontSize: '22px', fontWeight: 600, color: '#1b0a33' }}>
                      Spam Score
                    </span>
                    <span style={{ fontSize: '40px', fontWeight: 700, color: '#fb923c' }}>
                      {spamScore}
                    </span>
                  </div>
                ) : (
                  <div
                    style={{
                      background: 'rgba(107, 114, 128, 0.15)',
                      border: '2px solid rgba(107, 114, 128, 0.35)',
                      borderRadius: '16px',
                      padding: '20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontSize: '22px', fontWeight: 600, color: '#1b0a33' }}>
                      Ethos Credibility
                    </span>
                    <span style={{ fontSize: '40px', fontWeight: 700, color: ethosStyle.color }}>
                      {ethosScore || 'N/A'}
                    </span>
                  </div>
                )}

                {/* Ethos Score (if spam score exists) */}
                {spamScore && spamScore !== 'null' && (
                  <div
                    style={{
                      background: 'rgba(107, 114, 128, 0.15)',
                      border: '2px solid rgba(107, 114, 128, 0.35)',
                      borderRadius: '16px',
                      padding: '20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontSize: '22px', fontWeight: 600, color: '#1b0a33' }}>
                      Ethos Credibility
                    </span>
                    <span style={{ fontSize: '40px', fontWeight: 700, color: ethosStyle.color }}>
                      {ethosScore || 'N/A'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error: any) {
    console.error('Error generating share image:', error);
    return new Response(`Failed to generate image: ${error.message}`, {
      status: 500,
    });
  }
}
