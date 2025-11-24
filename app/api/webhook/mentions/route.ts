import { NextResponse } from 'next/server';
import { processTurdCommand, replyToCast } from '@/lib/bot';
import { recordTurd, checkRateLimit, checkIfCastProcessed, getRandomMeme } from '@/lib/database';
import { checkUserHasNFT } from '@/lib/nftVerification';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Verify webhook signature (important for security!)
    const signature = request.headers.get('x-neynar-signature');
    // TODO: Verify signature matches your webhook secret
    // const expectedSignature = crypto.createHmac('sha256', process.env.WEBHOOK_SECRET!)
    //   .update(JSON.stringify(body))
    //   .digest('hex');
    // if (signature !== expectedSignature) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    // }

    // Extract the cast from webhook payload
    const cast = body.data;

    console.log(`📩 Received mention from @${cast.author.username} (FID: ${cast.author.fid})`);

    // Check if we already processed this cast
    const alreadyProcessed = await checkIfCastProcessed(cast.hash);
    if (alreadyProcessed) {
      console.log(`⏭️  Cast ${cast.hash} already processed, skipping`);
      return NextResponse.json({ status: 'already_processed' });
    }

    // Parse the command
    const command = await processTurdCommand(cast);

    if (!command) {
      console.log(`❌ Invalid command format`);
      return NextResponse.json({ status: 'invalid_command' });
    }

    console.log(`🎯 Target: @${command.targetUsername} (FID: ${command.targetFid})`);

    // ============================================================
    // THIS IS WHERE checkRateLimit IS USED
    // ============================================================
    const rateLimitCheck = await checkRateLimit(command.senderFid);

    if (!rateLimitCheck.allowed) {
      console.log(`🚫 Rate limit hit for FID ${command.senderFid}: ${rateLimitCheck.reason}`);

      await replyToCast(
        cast.hash,
        `@${command.senderUsername} ${rateLimitCheck.reason}`
      );

      return NextResponse.json({
        status: 'rate_limited',
        reason: rateLimitCheck.reason
      });
    }
    // ============================================================

    // ============================================================
    // CHECK IF SENDER HAS FARCASTURD NFT
    // ============================================================
    const hasNFT = await checkUserHasNFT(command.senderFid);

    if (!hasNFT) {
      console.log(`🚫 NFT required for FID ${command.senderFid} (@${command.senderUsername})`);

      await replyToCast(
        cast.hash,
        `@${command.senderUsername} You need to mint a Farcasturd NFT to send turds!\n\nMint yours at: https://farcasturds.vercel.app`
      );

      return NextResponse.json({
        status: 'nft_required',
        reason: 'User must own a Farcasturd NFT to send turds'
      });
    }
    // ============================================================

    console.log(`✓ Target user: @${command.targetUsername} (FID: ${command.targetFid})`);

    // Record the turd in database
    console.log(`[Webhook] Attempting to record turd:`, {
      from_fid: command.senderFid,
      from_username: command.senderUsername,
      to_fid: command.targetFid,
      to_username: command.targetUsername,
      cast_hash: cast.hash,
    });

    try {
      await recordTurd({
        from_fid: command.senderFid,
        from_username: command.senderUsername,
        to_fid: command.targetFid,
        to_username: command.targetUsername,
        cast_hash: cast.hash,
      });
      console.log(`✓ Turd recorded in database successfully`);
    } catch (recordError) {
      console.error(`❌ FAILED to record turd in database:`, recordError);
      throw recordError; // Re-throw to be caught by outer catch
    }

    // Send a random meme/gif response for NFT holders, or confirmation if no meme available
    let memeSent = false;
    try {
      const meme = await getRandomMeme();
      if (meme) {
        const memeMessage = meme.caption
          ? `${meme.caption}\n\n${meme.url}`
          : meme.url;

        await replyToCast(cast.hash, memeMessage);
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

    return NextResponse.json({
      status: 'success',
      from: command.senderUsername,
      to: command.targetUsername,
      memeSent
    });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
