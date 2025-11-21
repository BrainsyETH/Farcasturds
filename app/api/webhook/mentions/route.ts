import { NextResponse } from 'next/server';
import { processTurdCommand, lookupUserByUsername, replyToCast } from '@/lib/bot';
import { recordTurd, getTurdCount } from '@/lib/database';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Verify webhook signature (important for security!)
    const signature = request.headers.get('x-neynar-signature');
    // TODO: Verify signature matches your webhook secret
    
    // Process the mention
    const cast = body.data;
    const command = await processTurdCommand(cast);
    
    if (!command) {
      return NextResponse.json({ status: 'ignored' });
    }
    
    // Look up target user
    const targetUser = await lookupUserByUsername(command.targetUsername);
    
    if (!targetUser) {
      await replyToCast(
        cast.hash,
        `@${command.senderUsername} User @${command.targetUsername} not found! 💩`
      );
      return NextResponse.json({ status: 'user_not_found' });
    }
    
    // Record the turd in database
    await recordTurd({
      from_fid: command.senderFid,
      from_username: command.senderUsername,
      to_fid: targetUser.fid,
      to_username: command.targetUsername,
      cast_hash: cast.hash,
    });
    
    // Get updated count
    const turdCount = await getTurdCount(targetUser.fid);
    
    // Reply with confirmation
    await replyToCast(
      cast.hash,
      `💩 @${command.senderUsername} sent a turd to @${command.targetUsername}!\n\nTotal turds received: ${turdCount}`
    );
    
    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}