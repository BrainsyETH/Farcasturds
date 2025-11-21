import { NextResponse } from 'next/server';
import { processTurdCommand, replyToCast } from '@/lib/bot';
import { recordTurd, getTurdCount, checkRateLimit, checkIfCastProcessed } from '@/lib/database';
import { checkUserHasNFT } from '@/lib/nftVerification';

// Lazy initialization to avoid build-time errors
let clientInitialized = false;
async function ensureClientInitialized() {
  if (!clientInitialized) {
    // The bot.ts functions handle client initialization
    clientInitialized = true;
  }
}

export async function GET() {
  try {
    await ensureClientInitialized();

    // Import NeynarAPIClient dynamically to avoid build-time initialization
    const { NeynarAPIClient } = await import("@neynar/nodejs-sdk");
    const client = new NeynarAPIClient({ apiKey: process.env.NEYNAR_API_KEY! });

    // Fetch recent mentions
    const mentions = await client.fetchMentionAndReplyNotifications({
      fid: parseInt(process.env.BOT_FID!),
      limit: 25,
    });

    for (const notification of mentions.notifications) {
      const cast = notification.cast;

      // Skip if already processed (check database)
      const existing = await checkIfCastProcessed(cast.hash);
      if (existing) continue;
      
      // Process the command
      const command = await processTurdCommand(cast);
      if (!command) continue;

      // Check rate limit
      const rateLimitCheck = await checkRateLimit(command.senderFid);
      if (!rateLimitCheck.allowed) {
        await replyToCast(
          cast.hash,
          `@${command.senderUsername} ${rateLimitCheck.reason} 💩`
        );
        continue;
      }

      // Check if sender has Farcasturd NFT
      const hasNFT = await checkUserHasNFT(command.senderFid);
      if (!hasNFT) {
        await replyToCast(
          cast.hash,
          `@${command.senderUsername} You need to mint a Farcasturd NFT to send turds! 💩\n\nMint yours at: https://farcasturds.xyz`
        );
        continue;
      }

      // Record the turd (target is the parent author)
      await recordTurd({
        from_fid: command.senderFid,
        from_username: command.senderUsername,
        to_fid: command.targetFid,
        to_username: command.targetUsername,
        cast_hash: cast.hash,
      });

      // Reply with confirmation
      const turdCount = await getTurdCount(command.targetFid);
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