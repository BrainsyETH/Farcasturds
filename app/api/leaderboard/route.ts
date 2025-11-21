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
      const { data: receivedData } = await supabase
        .from('turds')
        .select('*', { count: 'exact', head: true })
        .eq('to_fid', parseInt(userFid));
      
      const { data: sentData } = await supabase
        .from('turds')
        .select('*', { count: 'exact', head: true })
        .eq('from_fid', parseInt(userFid));
      
      userStats = {
        fid: parseInt(userFid),
        received: receivedData || 0,
        sent: sentData || 0,
      };
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