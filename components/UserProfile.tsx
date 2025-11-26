'use client';

import React, { useEffect, useRef, useState } from 'react';
import html2canvas from 'html2canvas';

interface UserProfileProps {
  userFid?: number;
}

interface UserScores {
  neynarScore: number | null;
  ethosScore: number | null;
  builderScore: number | null;
  followerCount: number;
  followingCount: number;
  neynarSpamScore: number | null;
}

export default function UserProfile({ userFid }: UserProfileProps) {
  const [userStats, setUserStats] = useState<{ received: number; sent: number; turdScore: number } | null>(null);
  const [userScores, setUserScores] = useState<UserScores | null>(null);
  const [loading, setLoading] = useState(true);
  const [scoresLoading, setScoresLoading] = useState(true);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const tooltipRefs = useRef<{ [key: string]: HTMLSpanElement | null }>({});
  const scoresCardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchUserStats();
    fetchUserScores();
  }, [userFid]);

  async function fetchUserStats() {
    try {
      setLoading(true);

      const response = await fetch(`/api/leaderboard${userFid ? `?fid=${userFid}` : ''}`);

      if (!response.ok) {
        throw new Error('Failed to fetch user stats');
      }

      const data = await response.json();
      setUserStats(data.userStats);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchUserScores() {
    if (!userFid) {
      setScoresLoading(false);
      return;
    }

    try {
      setScoresLoading(true);

      const response = await fetch(`/api/user-scores?fid=${userFid}`);

      if (!response.ok) {
        throw new Error('Failed to fetch user scores');
      }

      const data = await response.json();
      setUserScores(data);
    } catch (error) {
      console.error('Error fetching user scores:', error);
    } finally {
      setScoresLoading(false);
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const clickedOutside = Object.values(tooltipRefs.current).every(
        (ref) => !ref || !ref.contains(event.target as Node)
      );
      if (clickedOutside) {
        setActiveTooltip(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleTooltipPointerEnter = (tooltipId: string) => (event: React.PointerEvent<HTMLSpanElement>) => {
    if (event.pointerType === 'mouse') {
      setActiveTooltip(tooltipId);
    }
  };

  const handleTooltipPointerLeave = (event: React.PointerEvent<HTMLSpanElement>) => {
    if (event.pointerType === 'mouse') {
      setActiveTooltip(null);
    }
  };

  const toggleTooltip = (tooltipId: string) => (event: React.MouseEvent<HTMLSpanElement>) => {
    event.stopPropagation();
    setActiveTooltip((prev) => prev === tooltipId ? null : tooltipId);
  };

  // Helper function to calculate color gradient from green to red
  const getTurdScoreColor = (score: number): string => {
    // 0% = green (#22c55e = rgb(34, 197, 94))
    // 99% = red (#ef4444 = rgb(239, 68, 68))
    const clampedScore = Math.min(Math.max(score, 0), 99);
    const ratio = clampedScore / 99;

    const r = Math.round(34 + (239 - 34) * ratio);
    const g = Math.round(197 + (68 - 197) * ratio);
    const b = Math.round(94 + (68 - 94) * ratio);

    return `rgb(${r}, ${g}, ${b})`;
  };

  // Share functionality to generate image of scores
  const handleShareScores = async () => {
    if (!scoresCardRef.current || !userScores) return;

    try {
      setIsGeneratingImage(true);

      // Hide all tooltips before capturing
      const previousTooltip = activeTooltip;
      setActiveTooltip(null);

      // Wait for tooltip to hide
      await new Promise(resolve => setTimeout(resolve, 100));

      // Capture the element as canvas
      const canvas = await html2canvas(scoresCardRef.current, {
        backgroundColor: '#0a0a0a',
        scale: 2, // Higher quality
        logging: false,
        windowWidth: scoresCardRef.current.scrollWidth,
        windowHeight: scoresCardRef.current.scrollHeight,
      });

      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (!blob) return;

        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `farcasturds-reputation-scores-${userFid || 'user'}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        // Restore previous tooltip state
        setActiveTooltip(previousTooltip);
        setIsGeneratingImage(false);
      }, 'image/png');

    } catch (error) {
      console.error('Error generating image:', error);
      setIsGeneratingImage(false);
    }
  };

  if (loading) {
    return (
      <div className="fc-section">
        <div className="fc-card">
          <p className="fc-status">Loading stats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fc-leaderboard-container">
      {/* User Stats Section */}
      {userStats && (
        <section className="fc-section">
          <div className="fc-card fc-card--overflow-visible">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: '2rem',
                alignItems: 'center',
                justifyItems: 'center',
                textAlign: 'center'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', position: 'relative' }}>
                  <img src="/splash.png" alt="" style={{ width: '1em', height: '1em', display: 'inline-block', verticalAlign: 'middle' }} />
                  <h3 className="fc-card-title" style={{ margin: 0 }}>Turd Score</h3>
                  <span
                    ref={(el) => (tooltipRefs.current['turdScore'] = el)}
                    onPointerEnter={handleTooltipPointerEnter('turdScore')}
                    onPointerLeave={handleTooltipPointerLeave}
                    onClick={toggleTooltip('turdScore')}
                    style={{
                      cursor: 'help',
                      fontSize: '0.75rem',
                      color: 'var(--fc-text-soft)',
                      backgroundColor: 'rgba(0,0,0,0.1)',
                      borderRadius: '50%',
                      width: '16px',
                      height: '16px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      position: 'relative'
                    }}
                  >
                    i
                    {activeTooltip === 'turdScore' && (
                      <span
                        style={{
                          position: 'absolute',
                          bottom: '125%',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          backgroundColor: '#1a1a1a',
                          color: '#fff',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          whiteSpace: 'nowrap',
                          zIndex: 1000,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                          minWidth: '200px',
                          textAlign: 'center'
                        }}
                      >
                        Your percentile rank based on turds received.<br />
                        Higher = more bad takes called out.<br />
                        99% = top 1% of bad takes!
                        <span
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 0,
                            height: 0,
                            borderLeft: '6px solid transparent',
                            borderRight: '6px solid transparent',
                            borderTop: '6px solid #1a1a1a'
                          }}
                        ></span>
                      </span>
                    )}
                  </span>
                </div>
                <div className="fc-stat-value" style={{ color: getTurdScoreColor(userStats.turdScore), fontSize: '2rem', lineHeight: 1 }}>
                  {userStats.turdScore}%
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <h3 className="fc-card-title" style={{ margin: 0 }}>Your Stats</h3>
                <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', justifyContent: 'center' }}>
                  <div className="fc-stat-item" style={{ textAlign: 'center' }}>
                    <div className="fc-stat-value">{userStats.received}</div>
                    <div className="fc-stat-label">
                      <img src="/splash.png" alt="" style={{ width: '1em', height: '1em', display: 'inline-block', verticalAlign: 'middle', marginRight: '0.2em' }} />
                      Received
                    </div>
                  </div>
                  <div className="fc-stat-item" style={{ textAlign: 'center' }}>
                    <div className="fc-stat-value">{userStats.sent}</div>
                    <div className="fc-stat-label">
                      <img src="/splash.png" alt="" style={{ width: '1em', height: '1em', display: 'inline-block', verticalAlign: 'middle', marginRight: '0.2em' }} />
                      Sent
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Reputation Scores Section */}
      <section className="fc-section">
        <div className="fc-card" ref={scoresCardRef}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 className="fc-card-title" style={{ margin: 0 }}>Reputation Scores</h3>
            {!scoresLoading && userScores && (
              <button
                onClick={handleShareScores}
                disabled={isGeneratingImage}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: isGeneratingImage ? '#444' : '#8b5cf6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: isGeneratingImage ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
                onMouseOver={(e) => !isGeneratingImage && (e.currentTarget.style.backgroundColor = '#7c3aed')}
                onMouseOut={(e) => !isGeneratingImage && (e.currentTarget.style.backgroundColor = '#8b5cf6')}
              >
                {isGeneratingImage ? (
                  <>
                    <span style={{
                      display: 'inline-block',
                      width: '12px',
                      height: '12px',
                      border: '2px solid #fff',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Generating...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                      <polyline points="16 6 12 2 8 6" />
                      <line x1="12" y1="2" x2="12" y2="15" />
                    </svg>
                    Share Scores
                  </>
                )}
              </button>
            )}
          </div>

          {scoresLoading ? (
            <p className="fc-status" style={{ textAlign: 'center', padding: '1rem' }}>Loading scores...</p>
          ) : userScores ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Neynar Score */}
              <div style={{
                padding: '1rem',
                background: 'rgba(139, 92, 246, 0.15)',
                borderRadius: '12px',
                border: '1.5px solid rgba(139, 92, 246, 0.35)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.95rem' }}>
                    Neynar Score
                    <span
                      ref={(el) => (tooltipRefs.current['neynarScore'] = el)}
                      onPointerEnter={handleTooltipPointerEnter('neynarScore')}
                      onPointerLeave={handleTooltipPointerLeave}
                      onClick={toggleTooltip('neynarScore')}
                      style={{
                        cursor: 'help',
                        fontSize: '0.7rem',
                        color: 'var(--fc-text-soft)',
                        backgroundColor: 'rgba(0,0,0,0.1)',
                        borderRadius: '50%',
                        width: '14px',
                        height: '14px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        position: 'relative'
                      }}
                    >
                      i
                      {activeTooltip === 'neynarScore' && (
                        <span
                          style={{
                            position: 'absolute',
                            bottom: '125%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            backgroundColor: '#1a1a1a',
                            color: '#fff',
                            padding: '0.5rem 0.75rem',
                            borderRadius: '6px',
                            fontSize: '0.7rem',
                            whiteSpace: 'nowrap',
                            zIndex: 1000,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                            minWidth: '220px',
                            textAlign: 'center'
                          }}
                        >
                          Quality score from Neynar (0-1 scale).<br />
                          Based on engagement, followers, and activity.
                          <span
                            style={{
                              position: 'absolute',
                              top: '100%',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              width: 0,
                              height: 0,
                              borderLeft: '6px solid transparent',
                              borderRight: '6px solid transparent',
                              borderTop: '6px solid #1a1a1a'
                            }}
                          ></span>
                        </span>
                      )}
                    </span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#8b5cf6' }}>
                    {userScores.neynarScore !== null ? userScores.neynarScore.toFixed(2) : 'N/A'}
                  </div>
                </div>
                {userScores.neynarScore === null ? (
                  <div style={{ fontSize: '0.75rem', color: 'var(--fc-text-soft)' }}>
                    Score not available from Neynar API
                  </div>
                ) : (
                  <div style={{ fontSize: '0.75rem', color: 'var(--fc-text-soft)' }}>
                    <a
                      href="https://docs.neynar.com/docs/neynar-user-quality-score"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#8b5cf6', textDecoration: 'none' }}
                    >
                      Neynar Quality Score →
                    </a>
                  </div>
                )}
              </div>

              {/* Neynar Spam Score */}
              {userScores.neynarSpamScore !== null && (
                <div style={{
                  padding: '1rem',
                  background: 'rgba(251, 146, 60, 0.15)',
                  borderRadius: '12px',
                  border: '1.5px solid rgba(251, 146, 60, 0.35)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.95rem' }}>
                      Neynar Spam Score
                      <span
                        ref={(el) => (tooltipRefs.current['neynarSpamScore'] = el)}
                        onPointerEnter={handleTooltipPointerEnter('neynarSpamScore')}
                        onPointerLeave={handleTooltipPointerLeave}
                        onClick={toggleTooltip('neynarSpamScore')}
                        style={{
                          cursor: 'help',
                          fontSize: '0.7rem',
                          color: 'var(--fc-text-soft)',
                          backgroundColor: 'rgba(0,0,0,0.1)',
                          borderRadius: '50%',
                          width: '14px',
                          height: '14px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          position: 'relative'
                        }}
                      >
                        i
                        {activeTooltip === 'neynarSpamScore' && (
                          <span
                            style={{
                              position: 'absolute',
                              bottom: '125%',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              backgroundColor: '#1a1a1a',
                              color: '#fff',
                              padding: '0.5rem 0.75rem',
                              borderRadius: '6px',
                              fontSize: '0.7rem',
                              whiteSpace: 'nowrap',
                              zIndex: 1000,
                              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                              minWidth: '220px',
                              textAlign: 'center'
                            }}
                          >
                            Likelihood of being a spam account (0-1 scale).<br />
                            Lower is better. Higher = likely spam.
                            <span
                              style={{
                                position: 'absolute',
                                top: '100%',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: 0,
                                height: 0,
                                borderLeft: '6px solid transparent',
                                borderRight: '6px solid transparent',
                                borderTop: '6px solid #1a1a1a'
                              }}
                            ></span>
                          </span>
                        )}
                      </span>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fb923c' }}>
                      {userScores.neynarSpamScore.toFixed(2)}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--fc-text-soft)' }}>
                    Spam detection by Neynar
                  </div>
                </div>
              )}

              {/* Builder Score (Talent Protocol) */}
              <div style={{
                padding: '1rem',
                background: 'rgba(59, 130, 246, 0.15)',
                borderRadius: '12px',
                border: '1.5px solid rgba(59, 130, 246, 0.35)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.95rem' }}>
                    Builder Score
                    <span
                      ref={(el) => (tooltipRefs.current['builderScore'] = el)}
                      onPointerEnter={handleTooltipPointerEnter('builderScore')}
                      onPointerLeave={handleTooltipPointerLeave}
                      onClick={toggleTooltip('builderScore')}
                      style={{
                        cursor: 'help',
                        fontSize: '0.7rem',
                        color: 'var(--fc-text-soft)',
                        backgroundColor: 'rgba(0,0,0,0.1)',
                        borderRadius: '50%',
                        width: '14px',
                        height: '14px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        position: 'relative'
                      }}
                    >
                      i
                      {activeTooltip === 'builderScore' && (
                        <span
                          style={{
                            position: 'absolute',
                            bottom: '125%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            backgroundColor: '#1a1a1a',
                            color: '#fff',
                            padding: '0.5rem 0.75rem',
                            borderRadius: '6px',
                            fontSize: '0.7rem',
                            whiteSpace: 'nowrap',
                            zIndex: 1000,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                            minWidth: '220px',
                            textAlign: 'center'
                          }}
                        >
                          Talent Protocol Builder Score.<br />
                          Based on onchain activity on Base Network.
                          <span
                            style={{
                              position: 'absolute',
                              top: '100%',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              width: 0,
                              height: 0,
                              borderLeft: '6px solid transparent',
                              borderRight: '6px solid transparent',
                              borderTop: '6px solid #1a1a1a'
                            }}
                          ></span>
                        </span>
                      )}
                    </span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#3b82f6' }}>
                    {userScores.builderScore !== null ? userScores.builderScore : 'N/A'}
                  </div>
                </div>
                {userScores.builderScore === null ? (
                  <div style={{ fontSize: '0.75rem', color: 'var(--fc-text-soft)' }}>
                    Pending Talent Protocol granting me API access 🙃
                  </div>
                ) : (
                  <div style={{ fontSize: '0.75rem', color: 'var(--fc-text-soft)' }}>
                    <a
                      href="https://docs.talentprotocol.com/docs/protocol-concepts/scoring-systems/builder-score"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#3b82f6', textDecoration: 'none' }}
                    >
                      Talent Protocol • Base Network →
                    </a>
                  </div>
                )}
              </div>

              {/* Ethos Score */}
              <div style={{
                padding: '1rem',
                background: 'rgba(34, 197, 94, 0.15)',
                borderRadius: '12px',
                border: '1.5px solid rgba(34, 197, 94, 0.35)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.95rem' }}>
                    Ethos Onchain Score
                    <span
                      ref={(el) => (tooltipRefs.current['ethosScore'] = el)}
                      onPointerEnter={handleTooltipPointerEnter('ethosScore')}
                      onPointerLeave={handleTooltipPointerLeave}
                      onClick={toggleTooltip('ethosScore')}
                      style={{
                        cursor: 'help',
                        fontSize: '0.7rem',
                        color: 'var(--fc-text-soft)',
                        backgroundColor: 'rgba(0,0,0,0.1)',
                        borderRadius: '50%',
                        width: '14px',
                        height: '14px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        position: 'relative'
                      }}
                    >
                      i
                      {activeTooltip === 'ethosScore' && (
                        <span
                          style={{
                            position: 'absolute',
                            bottom: '125%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            backgroundColor: '#1a1a1a',
                            color: '#fff',
                            padding: '0.5rem 0.75rem',
                            borderRadius: '6px',
                            fontSize: '0.7rem',
                            whiteSpace: 'nowrap',
                            zIndex: 1000,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                            minWidth: '220px',
                            textAlign: 'center'
                          }}
                        >
                          Onchain reputation score from Ethos Network.<br />
                          Based on verified onchain activity and reviews.
                          <span
                            style={{
                              position: 'absolute',
                              top: '100%',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              width: 0,
                              height: 0,
                              borderLeft: '6px solid transparent',
                              borderRight: '6px solid transparent',
                              borderTop: '6px solid #1a1a1a'
                            }}
                          ></span>
                        </span>
                      )}
                    </span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#22c55e' }}>
                    {userScores.ethosScore !== null ? userScores.ethosScore : 'N/A'}
                  </div>
                </div>
                {userScores.ethosScore === null ? (
                  <div style={{ fontSize: '0.75rem', color: 'var(--fc-text-soft)' }}>
                    No verified address or score not available
                  </div>
                ) : (
                  <div style={{ fontSize: '0.75rem', color: 'var(--fc-text-soft)' }}>
                    <a
                      href="https://ethos.network"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#22c55e', textDecoration: 'none' }}
                    >
                      Ethos Network →
                    </a>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="fc-subtle" style={{ textAlign: 'center', padding: '1rem' }}>
              Unable to load reputation scores
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
