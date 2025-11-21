// Test script to manually insert a turd and verify database connection
import { recordTurd, getUserStats } from '../lib/database';

async function testDatabaseInsert() {
  console.log('Testing database insert...');

  try {
    // Try to insert a test turd
    await recordTurd({
      from_fid: 220758,
      from_username: 'brainsy.eth',
      to_fid: 3,
      to_username: 'dwr.eth',
      cast_hash: 'test_' + Date.now(),
    });

    console.log('✓ Successfully inserted test turd');

    // Check stats
    const stats = await getUserStats(220758);
    console.log('Stats for FID 220758:', stats);

  } catch (error) {
    console.error('❌ Error:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
  }
}

testDatabaseInsert();
