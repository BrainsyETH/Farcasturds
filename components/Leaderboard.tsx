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

      // TODO: Replace with actual API call once backend is ready
      // const response = await fetch('/api/leaderboard');
      // const data = await response.json();

      // Mock data for now
      const mockLeaderboard: LeaderboardEntry[] = [
        { rank: 1, fid: 12345, username: 'vitalik.eth', turdCount: 420, pfpUrl: undefined },
        { rank: 2, fid: 67890, username: 'dwr.eth', turdCount: 369, pfpUrl: undefined },
        { rank: 3, fid: 11111, username: 'jessepollak', turdCount: 250, pfpUrl: undefined },
        { rank: 4, fid: 22222, username: 'balajis', turdCount: 180, pfpUrl: undefined },
        { rank: 5, fid: 33333, username: 'varunsrin', turdCount: 150, pfpUrl: undefined },
        { rank: 6, fid: 44444, username: 'sanjay', turdCount: 120, pfpUrl: undefined },
        { rank: 7, fid: 55555, username: 'cmichel', turdCount: 100, pfpUrl: undefined },
        { rank: 8, fid: 66666, username: 'farcaster', turdCount: 95, pfpUrl: undefined },
        { rank: 9, fid: 77777, username: 'base', turdCount: 80, pfpUrl: undefined },
        { rank: 10, fid: 88888, username: 'noun40', turdCount: 69, pfpUrl: undefined },
      ];

      const mockActivity: TurdActivity[] = [
        { id: '1', fromFid: 12345, fromUsername: 'alice', toFid: 67890, toUsername: 'bob', timestamp: new Date(Date.now() - 120000).toISOString() },
        { id: '2', fromFid: 33333, fromUsername: 'charlie', toFid: 12345, toUsername: 'alice', timestamp: new Date(Date.now() - 300000).toISOString() },
        { id: '3', fromFid: 44444, fromUsername: 'david', toFid: 22222, toUsername: 'eve', timestamp: new Date(Date.now() - 600000).toISOString() },
        { id: '4', fromFid: 55555, fromUsername: 'frank', toFid: 11111, toUsername: 'grace', timestamp: new Date(Date.now() - 900000).toISOString() },
        { id: '5', fromFid: 66666, fromUsername: 'henry', toFid: 33333, toUsername: 'ivy', timestamp: new Date(Date.now() - 1200000).toISOString() },
      ];

      setLeaderboard(mockLeaderboard);
      setRecentActivity(mockActivity);

      // Mock user stats
      if (userFid) {
        setUserStats({ received: 42, sent: 13 });
      }
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
              <strong>1.</strong> Mention <span className="fc-highlight">@farcasturds</span> in a cast
            </p>
            <p className="fc-howto-step">
              <strong>2.</strong> Use the format: <code className="fc-code">@farcasturds send turd to @username</code>
            </p>
            <p className="fc-howto-step">
              <strong>3.</strong> Watch them climb the leaderboard! 💩
            </p>
            <p className="fc-subtle" style={{ marginTop: '1rem' }}>
              <strong>Note:</strong> Bot functionality coming soon. For now, mint your own Farcasturd on the Mint tab!
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
