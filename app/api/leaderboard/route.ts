import { NextResponse } from 'next/server';

export interface LeaderboardEntry {
  rank: number;
  fid: number;
  username: string;
  pfpUrl?: string;
  turdCount: number;
}

export interface TurdActivity {
  id: string;
  fromFid: number;
  fromUsername: string;
  toFid: number;
  toUsername: string;
  timestamp: string;
  castHash?: string;
}

export interface UserStats {
  fid: number;
  received: number;
  sent: number;
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  recentActivity: TurdActivity[];
  userStats?: UserStats;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userFid = searchParams.get('fid');

    // TODO: Replace with actual database queries once bot backend is ready
    // For now, returning mock data to demonstrate the structure

    const mockLeaderboard: LeaderboardEntry[] = [
      { rank: 1, fid: 12345, username: 'vitalik.eth', turdCount: 420 },
      { rank: 2, fid: 67890, username: 'dwr.eth', turdCount: 369 },
      { rank: 3, fid: 11111, username: 'jessepollak', turdCount: 250 },
      { rank: 4, fid: 22222, username: 'balajis', turdCount: 180 },
      { rank: 5, fid: 33333, username: 'varunsrin', turdCount: 150 },
      { rank: 6, fid: 44444, username: 'sanjay', turdCount: 120 },
      { rank: 7, fid: 55555, username: 'cmichel', turdCount: 100 },
      { rank: 8, fid: 66666, username: 'farcaster', turdCount: 95 },
      { rank: 9, fid: 77777, username: 'base', turdCount: 80 },
      { rank: 10, fid: 88888, username: 'noun40', turdCount: 69 },
    ];

    const mockActivity: TurdActivity[] = [
      {
        id: '1',
        fromFid: 12345,
        fromUsername: 'alice',
        toFid: 67890,
        toUsername: 'bob',
        timestamp: new Date(Date.now() - 120000).toISOString(),
      },
      {
        id: '2',
        fromFid: 33333,
        fromUsername: 'charlie',
        toFid: 12345,
        toUsername: 'alice',
        timestamp: new Date(Date.now() - 300000).toISOString(),
      },
      {
        id: '3',
        fromFid: 44444,
        fromUsername: 'david',
        toFid: 22222,
        toUsername: 'eve',
        timestamp: new Date(Date.now() - 600000).toISOString(),
      },
      {
        id: '4',
        fromFid: 55555,
        fromUsername: 'frank',
        toFid: 11111,
        toUsername: 'grace',
        timestamp: new Date(Date.now() - 900000).toISOString(),
      },
      {
        id: '5',
        fromFid: 66666,
        fromUsername: 'henry',
        toFid: 33333,
        toUsername: 'ivy',
        timestamp: new Date(Date.now() - 1200000).toISOString(),
      },
    ];

    let userStats: UserStats | undefined;

    if (userFid) {
      // TODO: Query actual user stats from database
      // For now, return mock stats
      userStats = {
        fid: parseInt(userFid),
        received: 42,
        sent: 13,
      };
    }

    const response: LeaderboardResponse = {
      leaderboard: mockLeaderboard,
      recentActivity: mockActivity,
      userStats,
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
      },
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard data' },
      { status: 500 }
    );
  }
}

/**
 * Future implementation notes:
 *
 * When the bot backend is ready, this endpoint should:
 *
 * 1. Query the turds database table:
 *    SELECT to_fid, to_username, COUNT(*) as turd_count
 *    FROM turds
 *    GROUP BY to_fid, to_username
 *    ORDER BY turd_count DESC
 *    LIMIT 10
 *
 * 2. Query recent activity:
 *    SELECT * FROM turds
 *    ORDER BY created_at DESC
 *    LIMIT 10
 *
 * 3. Query user-specific stats if fid is provided:
 *    SELECT
 *      (SELECT COUNT(*) FROM turds WHERE to_fid = $1) as received,
 *      (SELECT COUNT(*) FROM turds WHERE from_fid = $1) as sent
 *
 * 4. Optionally fetch profile pictures from Neynar API for each user
 */
