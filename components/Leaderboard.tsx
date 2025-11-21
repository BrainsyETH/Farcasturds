'use client';

import React, { useEffect, useState } from 'react';

interface LeaderboardEntry {
  rank: number;
  fid: number;
  username: string;
  pfpUrl?: string;
  turdCount: number;
}

interface TurdActivity {
  id: string;
  fromFid: number;
  fromUsername: string;
  toFid: number;
  toUsername: string;
  timestamp: string;
  castHash?: string;
}

interface LeaderboardProps {
  userFid?: number;
}

export default function Leaderboard({ userFid }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [recentActivity, setRecentActivity] = useState<TurdActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState<{ received: number; sent: number } | null>(null);

  useEffect(() => {
    fetchLeaderboardData();
  }, [userFid]);

  async function fetchLeaderboardData() {
  try {
    setLoading(true);
    
    // Fetch from real API instead of using mock data
    const response = await fetch(`/api/leaderboard${userFid ? `?fid=${userFid}` : ''}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch leaderboard');
    }
    
    const data = await response.json();
    
    setLeaderboard(data.leaderboard);
    setRecentActivity(data.recentActivity);
    setUserStats(data.userStats);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
  } finally {
    setLoading(false);
  }
}

  function formatTimeAgo(timestamp: string): string {
    const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }

  function getRankEmoji(rank: number): string {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `${rank}.`;
    }
  }

  if (loading) {
    return (
      <div className="fc-section">
        <div className="fc-card">
          <p className="fc-status">Loading leaderboard...</p>
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
                <div className="fc-stat-label">💩 Received</div>
              </div>
              <div className="fc-stat-divider"></div>
              <div className="fc-stat-item">
                <div className="fc-stat-value">{userStats.sent}</div>
                <div className="fc-stat-label">💩 Sent</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Leaderboard Section */}
      <section className="fc-section">
        <div className="fc-card">
          <h2 className="fc-card-title">🏆 Top Turd Recipients</h2>
          <p className="fc-subtle" style={{ marginBottom: '1rem' }}>
            Hall of shame for the most turds received
          </p>

          <div className="fc-leaderboard">
            {leaderboard.map((entry) => (
              <div
                key={entry.fid}
                className={`fc-leaderboard-entry ${entry.fid === userFid ? 'fc-leaderboard-entry-highlight' : ''}`}
              >
                <div className="fc-leaderboard-rank">
                  {getRankEmoji(entry.rank)}
                </div>

                <div className="fc-leaderboard-user">
                  <div className="fc-leaderboard-username">@{entry.username}</div>
                  <div className="fc-leaderboard-fid">FID: {entry.fid}</div>
                </div>

                <div className="fc-leaderboard-count">
                  <div className="fc-leaderboard-count-value">{entry.turdCount}</div>
                  <div className="fc-leaderboard-count-label">💩</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Activity Section */}
      <section className="fc-section">
        <div className="fc-card">
          <h3 className="fc-card-title">Recent Activity</h3>
          <p className="fc-subtle" style={{ marginBottom: '1rem' }}>
            Latest turd transactions
          </p>

          <div className="fc-activity-list">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="fc-activity-item">
                <div className="fc-activity-icon">💩</div>
                <div className="fc-activity-content">
                  <div className="fc-activity-text">
                    <strong>@{activity.fromUsername}</strong> sent a turd to{' '}
                    <strong>@{activity.toUsername}</strong>
                  </div>
                  <div className="fc-activity-time">{formatTimeAgo(activity.timestamp)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="fc-section">
        <div className="fc-card">
          <h3 className="fc-card-title">How to Send Turds</h3>
          <div className="fc-howto">
            <p className="fc-howto-step">
              <strong>1.</strong> Find a cast you want to send a turd to
            </p>
            <p className="fc-howto-step">
              <strong>2.</strong> Reply to it with <code className="fc-code">@farcasturd</code>
            </p>
            <p className="fc-howto-step">
              <strong>3.</strong> That's it! The original poster gets the turd 💩
            </p>
            <p className="fc-subtle" style={{ marginTop: '1rem' }}>
              <strong>Note:</strong> You can add any text - just include @farcasturd in your reply!
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
