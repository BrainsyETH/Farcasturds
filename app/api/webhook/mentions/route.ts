import { NextResponse } from 'next/server';
import { processTurdCommand, replyToCast } from '@/lib/bot';
import { recordTurd, getTurdCount, checkRateLimit, checkIfCastProcessed } from '@/lib/database';
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
        `@${command.senderUsername} ${rateLimitCheck.reason} 💩`
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
        `@${command.senderUsername} You need to mint a Farcasturd NFT to send turds! 💩\n\nMint yours at: https://farcasturds.xyz`
      );

      return NextResponse.json({
        status: 'nft_required',
        reason: 'User must own a Farcasturd NFT to send turds'
      });
    }
    // ============================================================

    console.log(`✓ Target user: @${command.targetUsername} (FID: ${command.targetFid})`);

    // Record the turd in database
    await recordTurd({
      from_fid: command.senderFid,
      from_username: command.senderUsername,
      to_fid: command.targetFid,
      to_username: command.targetUsername,
      cast_hash: cast.hash,
    });

    console.log(`✓ Turd recorded in database`);

    // Get updated count
    const turdCount = await getTurdCount(command.targetFid);

    // Reply with confirmation
    await replyToCast(
      cast.hash,
      `💩 @${command.senderUsername} sent a turd to @${command.targetUsername}!\n\nTotal turds received: ${turdCount}`
    );

    console.log(`✓ Confirmation sent, total count: ${turdCount}`);

    return NextResponse.json({
      status: 'success',
      from: command.senderUsername,
      to: command.targetUsername,
      count: turdCount
    });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
