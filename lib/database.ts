import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Database functions
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

export async function getTurdCount(fid: number) {
  const { count } = await supabase
    .from('turds')
    .select('*', { count: 'exact', head: true })
    .eq('to_fid', fid);
  
  return count || 0;
}

export async function getLeaderboard(limit = 10) {
  const { data, error } = await supabase
    .from('turds')
    .select('to_fid, to_username, count(*)')
    .group('to_fid, to_username')
    .order('count', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return data;
}