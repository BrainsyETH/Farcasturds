import { createClient } from '@supabase/supabase-js';

// Lazy initialization to avoid build-time errors when env vars are not set
let supabaseClient: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!supabaseClient) {
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase environment variables not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY.');
    }

    supabaseClient = createClient(supabaseUrl, supabaseKey);
  }
  return supabaseClient;
}

export const supabase = {
  get from() {
    return getSupabaseClient().from.bind(getSupabaseClient());
  },
  get rpc() {
    return getSupabaseClient().rpc.bind(getSupabaseClient());
  }
};

// ============================================================================
// TURD RECORDING FUNCTIONS
// ============================================================================

export async function recordTurd(data: {
  from_fid: number;
  from_username: string;
  to_fid: number;
  to_username: string;
  cast_hash: string;
}) {
  const { error } = await supabase
    .from('turds')
    .insert([data]);

  if (error) throw error;
}

export async function getTurdCount(fid: number): Promise<number> {
  const { count } = await supabase
    .from('turds')
    .select('*', { count: 'exact', head: true })
    .eq('to_fid', fid);

  return count || 0;
}

export async function getUserStats(fid: number) {
  const { count: received } = await supabase
    .from('turds')
    .select('*', { count: 'exact', head: true })
    .eq('to_fid', fid);

  const { count: sent } = await supabase
    .from('turds')
    .select('*', { count: 'exact', head: true })
    .eq('from_fid', fid);

  return {
    fid,
    received: received || 0,
    sent: sent || 0,
  };
}

// ============================================================================
// LEADERBOARD FUNCTIONS
// ============================================================================

export async function getLeaderboard(limit = 10) {
  const { data, error } = await supabase
    .rpc('get_leaderboard', { limit_count: limit });

  if (error) throw error;
  return data;
}

export async function getRecentActivity(limit = 10) {
  const { data, error } = await supabase
    .from('turds')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

// ============================================================================
// RATE LIMITING FUNCTIONS
// ============================================================================

export async function checkRateLimit(fid: number): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  const { data } = await supabase
    .from('turd_rate_limits')
    .select('*')
    .eq('from_fid', fid)
    .single();

  // First time user - allow and create record
  if (!data) {
    await supabase
      .from('turd_rate_limits')
      .insert([{
        from_fid: fid,
        last_turd_at: new Date().toISOString(),
        daily_count: 1,
        reset_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }]);

    return { allowed: true };
  }

  // Reset daily count if needed
  if (new Date(data.reset_at) < new Date()) {
    await supabase
      .from('turd_rate_limits')
      .update({
        daily_count: 1,
        last_turd_at: new Date().toISOString(),
        reset_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      })
      .eq('from_fid', fid);

    return { allowed: true };
  }

  // Check limits
  const DAILY_LIMIT = 10;
  const COOLDOWN_MS = 60000; // 1 minute

  if (data.daily_count >= DAILY_LIMIT) {
    return {
      allowed: false,
      reason: `Daily limit reached (${DAILY_LIMIT} turds/day). Reset at ${new Date(data.reset_at).toLocaleTimeString()}.`
    };
  }

  const timeSinceLastTurd = Date.now() - new Date(data.last_turd_at).getTime();
  if (timeSinceLastTurd < COOLDOWN_MS) {
    const secondsLeft = Math.ceil((COOLDOWN_MS - timeSinceLastTurd) / 1000);
    return {
      allowed: false,
      reason: `Cooldown active. Please wait ${secondsLeft} seconds.`
    };
  }

  // Update the rate limit record
  await supabase
    .from('turd_rate_limits')
    .update({
      last_turd_at: new Date().toISOString(),
      daily_count: data.daily_count + 1,
    })
    .eq('from_fid', fid);

  return { allowed: true };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export async function checkIfCastProcessed(castHash: string): Promise<boolean> {
  const { data } = await supabase
    .from('turds')
    .select('cast_hash')
    .eq('cast_hash', castHash)
    .single();

  return !!data;
}
