import { NextResponse } from 'next/server';
import { NeynarAPIClient } from "@neynar/nodejs-sdk";
import { processTurdCommand, lookupUserByUsername, replyToCast } from '@/lib/bot';
import { recordTurd, getTurdCount } from '@/lib/database';

const client = new NeynarAPIClient(process.env.NEYNAR_API_KEY!);

export async function GET() {
  try {
    // Fetch recent mentions
    const mentions = await client.fetchMentionAndReplyNotifications({
      fid: parseInt(process.env.BOT_FID!),
      limit: 25,
    });
    
    for (const notification of mentions.notifications) {
      const cast = notification.cast;
      
      // Skip if already processed (check database)
      const existing = await checkIfProcessed(cast.hash);
      if (existing) continue;
      
      // Process the command
      const command = await processTurdCommand(cast);
      if (!command) continue;
      
      // Look up target user
      const targetUser = await lookupUserByUsername(command.targetUsername);
      
      if (!targetUser) {
        await replyToCast(
          cast.hash,
          `@${command.senderUsername} User @${command.targetUsername} not found! 💩`
        );
        continue;
      }
      
      // Record the turd
      await recordTurd({
        from_fid: command.senderFid,
        from_username: command.senderUsername,
        to_fid: targetUser.fid,
        to_username: command.targetUsername,
        cast_hash: cast.hash,
      });
      
      // Reply with confirmation
      const turdCount = await getTurdCount(targetUser.fid);
      await replyToCast(
        cast.hash,
        `💩 @${command.senderUsername} sent a turd to @${command.targetUsername}!\n\nTotal turds received: ${turdCount}`
      );
    }
    
    return NextResponse.json({ status: 'success', processed: mentions.notifications.length });
  } catch (error) {
    console.error('Polling error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}