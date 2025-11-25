'use client';

import React, { useEffect, useState } from 'react';

interface UserProfileProps {
  userFid?: number;
}

interface UserScores {
  neynarScore: number | null;
  ethosScore: number | null;
  builderScore: number | null;
  followerCount: number;
  followingCount: number;
}

export default function UserProfile({ userFid }: UserProfileProps) {
  const [userStats, setUserStats] = useState<{ received: number; sent: number } | null>(null);
  const [userScores, setUserScores] = useState<UserScores | null>(null);
  const [loading, setLoading] = useState(true);
  const [scoresLoading, setScoresLoading] = useState(true);

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
          <div className="fc-card">
            <h3 className="fc-card-title">Your Stats</h3>
            <div className="fc-user-stats">
              <div className="fc-stat-item">
                <div className="fc-stat-value">{userStats.received}</div>
                <div className="fc-stat-label">
                  <img src="/splash.png" alt="" style={{ width: '1em', height: '1em', display: 'inline-block', verticalAlign: 'middle', marginRight: '0.2em' }} />
                  Received
                </div>
              </div>
              <div className="fc-stat-divider"></div>
              <div className="fc-stat-item">
                <div className="fc-stat-value">{userStats.sent}</div>
                <div className="fc-stat-label">
                  <img src="/splash.png" alt="" style={{ width: '1em', height: '1em', display: 'inline-block', verticalAlign: 'middle', marginRight: '0.2em' }} />
                  Sent
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Reputation Scores Section */}
      <section className="fc-section">
        <div className="fc-card">
          <h3 className="fc-card-title">Reputation Scores</h3>

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
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Neynar Score</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#8b5cf6' }}>
                    {userScores.neynarScore !== null ? userScores.neynarScore.toFixed(2) : 'N/A'}
                  </div>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--fc-text-soft)', display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>{userScores.followerCount} followers</span>
                  <span>{userScores.followingCount} following</span>
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
                      Neynar User Quality Score →
                    </a>
                  </div>
                )}
              </div>

              {/* Builder Score (Talent Protocol) */}
              <div style={{
                padding: '1rem',
                background: 'rgba(59, 130, 246, 0.15)',
                borderRadius: '12px',
                border: '1.5px solid rgba(59, 130, 246, 0.35)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Builder Score</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#3b82f6' }}>
                    {userScores.builderScore !== null ? userScores.builderScore : 'N/A'}
                  </div>
                </div>
                {userScores.builderScore === null ? (
                  <div style={{ fontSize: '0.75rem', color: 'var(--fc-text-soft)' }}>
                    No verified address or score not available
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
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Ethos Onchain Score</div>
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
