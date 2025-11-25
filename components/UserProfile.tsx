'use client';

import React, { useEffect, useState } from 'react';

interface UserProfileProps {
  userFid?: number;
}

interface UserScores {
  neynarScore: number;
  ethosScore: number | null;
  baseScore: number | null;
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
                background: 'rgba(99, 102, 241, 0.1)',
                borderRadius: '12px',
                border: '1px solid rgba(99, 102, 241, 0.2)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Neynar Score</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#6366f1' }}>
                    {userScores.neynarScore}
                  </div>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--fc-text-soft)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{userScores.followerCount} followers</span>
                  <span>{userScores.followingCount} following</span>
                </div>
              </div>

              {/* Base Score */}
              <div style={{
                padding: '1rem',
                background: 'rgba(37, 99, 235, 0.1)',
                borderRadius: '12px',
                border: '1px solid rgba(37, 99, 235, 0.2)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Base Onchain Score</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#2563eb' }}>
                    {userScores.baseScore !== null ? userScores.baseScore : 'N/A'}
                  </div>
                </div>
                {userScores.baseScore === null && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--fc-text-soft)', marginTop: '0.5rem' }}>
                    No verified address or no Base activity
                  </div>
                )}
              </div>

              {/* Ethos Score */}
              <div style={{
                padding: '1rem',
                background: 'rgba(16, 185, 129, 0.1)',
                borderRadius: '12px',
                border: '1px solid rgba(16, 185, 129, 0.2)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Ethos Onchain Score</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>
                    {userScores.ethosScore !== null ? userScores.ethosScore : 'N/A'}
                  </div>
                </div>
                {userScores.ethosScore === null && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--fc-text-soft)', marginTop: '0.5rem' }}>
                    No verified address or score not available
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
