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
  fromPfpUrl?: string;
  toFid: number;
  toUsername: string;
  toPfpUrl?: string;
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
      {/* Leaderboard Section */}
      <section className="fc-section">
        <div className="fc-card">
          <h2 className="fc-card-title">🏆 Stinkiest Offenders</h2>
          <p className="fc-subtle" style={{ marginBottom: '1rem' }}>
            Hall of Porcelain
          </p>

          <div className="fc-leaderboard">
            {leaderboard.map((entry) => (
              <a
                key={entry.fid}
                href={`https://warpcast.com/${entry.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`fc-leaderboard-entry ${entry.fid === userFid ? 'fc-leaderboard-entry-highlight' : ''}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
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
                  <div className="fc-leaderboard-count-label">
                    <img src="/splash.png" alt="" style={{ width: '1.1rem', height: '1.1rem', display: 'inline-block' }} />
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Activity Section */}
      <section className="fc-section">
        <div className="fc-card">
          <h3 className="fc-card-title">Recent Activity</h3>
          <p className="fc-subtle" style={{ marginBottom: '1rem' }}>
            
          </p>

          <div className="fc-activity-list">
            {recentActivity.map((activity) => (
              <a
                key={activity.id}
                href={activity.castHash ? `https://warpcast.com/~/conversations/${activity.castHash}` : '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="fc-activity-item"
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                {activity.fromPfpUrl && (
                  <img
                    src={activity.fromPfpUrl}
                    alt={`@${activity.fromUsername}`}
                    className="fc-activity-pfp"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
                <div className="fc-activity-content">
                  <div className="fc-activity-text">
                    <strong>@{activity.fromUsername}</strong> sent a turd to{' '}
                    <strong>@{activity.toUsername}</strong>
                  </div>
                  <div className="fc-activity-time">{formatTimeAgo(activity.timestamp)}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* How to Send Turds Section */}
      <section className="fc-section">
        <div className="fc-card">
          <h3 className="fc-card-title">How to Send Turds</h3>
          <div className="fc-howto">

           <p className="fc-howto-step">
              <strong>Spot a crap take</strong> - Come across a post or content that deserves a turd?
            </p>
            <p className="fc-howto-step">
              <strong>Alert the turd</strong> - Reply to that post with <code className="fc-code">@farcasturd</code> (make sure to tag it correctly!)
            </p>
            <p className="fc-howto-step">
              <strong>Turd flung!</strong> - OP automatically receives a turd added to their Turd Score
            </p>
            <p className="fc-howto-step">
              <strong>Requirements</strong> - You must own a Farcasturds to send turds. No NFT = no poop privileges!
            </p>

            <div style={{ marginTop: '2rem' }}>
              <h4 style={{ marginBottom: '1rem', fontSize: '1.1em', fontWeight: 'bold' }}>Pro tips:</h4>
              <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem' }}>
                <li style={{ marginBottom: '0.5rem' }}>
                  Turds are meant to be fun. Don't be a turd yourself. 
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  Use your turds wisely - there are daily limits. 
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  Your Turd Score is based on received Turds.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
