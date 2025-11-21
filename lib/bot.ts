import { NeynarAPIClient } from "@neynar/nodejs-sdk";

const client = new NeynarAPIClient(process.env.NEYNAR_API_KEY!);

// ============================================================================
// COMMAND PARSING
// ============================================================================

export interface TurdCommand {
  targetUsername: string;
  senderFid: number;
  senderUsername: string;
  castHash: string;
}

export async function processTurdCommand(cast: any): Promise<TurdCommand | null> {
  const text = cast.text.toLowerCase();

  // Parse command patterns:
  // "@farcasturds send turd to @username"
  // "@farcasturds turd @username"
  // "@farcasturds @username"
  const patterns = [
    /@farcasturds\s+(?:send\s+)?turd\s+(?:to\s+)?@(\w+)/i,
    /@farcasturds\s+@(\w+)/i,
  ];

  let match = null;
  for (const pattern of patterns) {
    match = text.match(pattern);
    if (match) break;
  }

  if (!match) {
    return null; // Invalid command
  }

  const targetUsername = match[1];
  const senderFid = cast.author.fid;
  const senderUsername = cast.author.username;

  return {
    targetUsername,
    senderFid,
    senderUsername,
    castHash: cast.hash,
  };
}

// ============================================================================
// NEYNAR API FUNCTIONS
// ============================================================================

export async function lookupUserByUsername(username: string) {
  try {
    const response = await client.searchUser(username, 1);
    return response.result.users[0] || null;
  } catch (error) {
    console.error('Error looking up user:', error);
    return null;
  }
}

export async function replyToCast(parentHash: string, text: string) {
  try {
    await client.publishCast({
      signerUuid: process.env.BOT_SIGNER_UUID!,
      text: text,
      parent: parentHash,
    });
    console.log(`✓ Replied to cast ${parentHash}`);
  } catch (error) {
    console.error('Error replying to cast:', error);
    throw error;
  }
}

export async function fetchUserByFid(fid: number) {
  try {
    const response = await client.fetchBulkUsers([fid]);
    return response.users[0] || null;
  } catch (error) {
    console.error('Error fetching user by FID:', error);
    return null;
  }
}
