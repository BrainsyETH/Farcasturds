import { NextResponse } from 'next/server';
import { processTurdCommand, replyToCast } from '@/lib/bot';
import { recordTurd, checkRateLimit, checkIfCastProcessed, getRandomMeme, markCastAsProcessed } from '@/lib/database';
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

    if (!process.env.BOT_FID) {
      throw new Error('BOT_FID not configured');
    }

    // Fetch recent notifications using the correct SDK v3 method
    const notifications = await client.fetchAllNotifications({
      fid: parseInt(process.env.BOT_FID),
      type: ['mentions', 'replies'],
    });

    if (!notifications?.notifications) {
      return NextResponse.json({ status: 'success', processed: 0 });
    }

    // Only process notifications from the last 30 minutes to avoid reprocessing old mentions
    const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
    const recentNotifications = notifications.notifications.filter(notification => {
      const notificationTime = new Date(notification.cast.timestamp).getTime();
      return notificationTime > thirtyMinutesAgo;
    });

    console.log(`📊 Found ${notifications.notifications.length} total notifications, ${recentNotifications.length} from last 30 minutes`);

    for (const notification of recentNotifications) {
      const cast = notification.cast;

      // Skip if already processed (check database)
      const existing = await checkIfCastProcessed(cast.hash);
      if (existing) continue;
      
      // Process the command
      const command = await processTurdCommand(cast);
      if (!command) {
        await markCastAsProcessed(cast.hash, 'invalid_command');
        continue;
      }

      // Check rate limit
      const rateLimitCheck = await checkRateLimit(command.senderFid);
      if (!rateLimitCheck.allowed) {
        await replyToCast(
          cast.hash,
          `@${command.senderUsername} ${rateLimitCheck.reason}`
        );
        await markCastAsProcessed(cast.hash, 'rate_limited', command.senderFid, command.senderUsername);
        continue;
      }

      // Check if sender has Farcasturd NFT
      const hasNFT = await checkUserHasNFT(command.senderFid);
      if (!hasNFT) {
        await replyToCast(
          cast.hash,
          `@${command.senderUsername} You need to mint a Farcasturd NFT to send turds!`,
          ['https://farcasturds.vercel.app']
        );
        await markCastAsProcessed(cast.hash, 'nft_required', command.senderFid, command.senderUsername);
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

      // Mark the cast as successfully processed
      await markCastAsProcessed(cast.hash, 'success', command.senderFid, command.senderUsername);

      // Send a random meme/gif response for NFT holders, or confirmation if no meme available
      let memeSent = false;
      try {
        const meme = await getRandomMeme();
        if (meme) {
          // Send meme as an embed with optional caption as text
          await replyToCast(cast.hash, meme.caption || '', [meme.url]);
          console.log(`✓ Meme response sent: ${meme.url}`);
          memeSent = true;
        }
      } catch (memeError) {
        console.error('⚠️  Failed to send meme response:', memeError);
      }

      // Only send confirmation if no meme was sent
      if (!memeSent) {
        await replyToCast(
          cast.hash,
          `@${command.senderUsername} sent a turd to @${command.targetUsername}!`
        );
        console.log(`✓ Confirmation sent (no meme available)`);
      }
    }
    
    return NextResponse.json({ status: 'success', processed: recentNotifications.length });
  } catch (error) {
    console.error('Polling error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}