import { NextResponse } from 'next/server';
import { supabase } from '@/lib/database';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userFid = searchParams.get('fid');

    // Get leaderboard
    const { data: leaderboardData, error: leaderboardError } = await supabase
      .rpc('get_leaderboard', { limit_count: 10 });
    
    if (leaderboardError) throw leaderboardError;

    // Get recent activity
    const { data: activityData, error: activityError } = await supabase
      .from('turds')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (activityError) throw activityError;

    // Get user stats if FID provided
    let userStats = null;
    if (userFid) {
      console.log('[Leaderboard API] Fetching stats for FID:', userFid);

      const { count: received, error: receivedError } = await supabase
        .from('turds')
        .select('*', { count: 'exact', head: true })
        .eq('to_fid', parseInt(userFid));

      console.log('[Leaderboard API] Received count:', received, 'Error:', receivedError);

      const { count: sent, error: sentError } = await supabase
        .from('turds')
        .select('*', { count: 'exact', head: true })
        .eq('from_fid', parseInt(userFid));

      console.log('[Leaderboard API] Sent count:', sent, 'Error:', sentError);

      userStats = {
        fid: parseInt(userFid),
        received: received || 0,
        sent: sent || 0,
      };

      console.log('[Leaderboard API] Final userStats:', userStats);
    }

    return NextResponse.json({
      leaderboard: leaderboardData.map((row: any, index: number) => ({
        rank: index + 1,
        fid: row.to_fid,
        username: row.to_username,
        turdCount: row.turd_count,
      })),
      recentActivity: activityData.map((row: any) => ({
        id: row.id,
        fromFid: row.from_fid,
        fromUsername: row.from_username,
        toFid: row.to_fid,
        toUsername: row.to_username,
        timestamp: row.created_at,
        castHash: row.cast_hash,
      })),
      userStats,
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard data' },
      { status: 500 }
    );
  }
}