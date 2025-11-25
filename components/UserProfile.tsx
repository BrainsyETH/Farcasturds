'use client';

import React, { useEffect, useState } from 'react';

interface UserProfileProps {
  userFid?: number;
}

export default function UserProfile({ userFid }: UserProfileProps) {
  const [userStats, setUserStats] = useState<{ received: number; sent: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserStats();
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
    </div>
  );
}
