import { NeynarAPIClient } from "@neynar/nodejs-sdk";

// Lazy initialization to avoid build-time errors when env vars are not set
let neynarClient: NeynarAPIClient | null = null;

function getNeynarClient() {
  if (!neynarClient) {
    const apiKey = process.env.NEYNAR_API_KEY || '';

    if (!apiKey) {
      throw new Error('NEYNAR_API_KEY environment variable not configured.');
    }

    neynarClient = new NeynarAPIClient({ apiKey });
  }
  return neynarClient;
}

// ============================================================================
// COMMAND PARSING
// ============================================================================

export interface TurdCommand {
  targetUsername: string;
  targetFid: number;
  senderFid: number;
  senderUsername: string;
  castHash: string;
}

export async function processTurdCommand(cast: any): Promise<TurdCommand | null> {
  const text = cast.text.toLowerCase();

  // Check if this is a reply (has parent)
  if (!cast.parent_hash && !cast.parent_url) {
    console.log('Skipping: Not a reply, original post');
    return null; // Only process replies, not original posts
  }

  // Check if @farcasturd (no S) is mentioned
  if (!text.includes('@farcasturd')) {
    return null; // Bot not mentioned
  }

  // Get sender info
  const senderFid = cast.author.fid;
  const senderUsername = cast.author.username;

  // The target is the PARENT AUTHOR (the original poster being replied to)
  // We need to fetch the parent cast to get the author
  const parentAuthor = cast.parent_author;

  if (!parentAuthor) {
    console.log('No parent author found in cast');
    return null;
  }

  const targetFid = parentAuthor.fid;
  const targetUsername = parentAuthor.username;

  // Don't allow sending turds to yourself
  if (senderFid === targetFid) {
    console.log('User trying to send turd to themselves, ignoring');
    return null;
  }

  console.log(`✓ Command parsed: @${senderUsername} → @${targetUsername} (parent author)`);

  return {
    targetUsername,
    targetFid,
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
    const client = getNeynarClient();
    const response = await client.searchUser(username, 1);
    return response.result.users[0] || null;
  } catch (error) {
    console.error('Error looking up user:', error);
    return null;
  }
}

export async function replyToCast(parentHash: string, text: string) {
  try {
    const client = getNeynarClient();
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
    const client = getNeynarClient();
    const response = await client.fetchBulkUsers([fid]);
    return response.users[0] || null;
  } catch (error) {
    console.error('Error fetching user by FID:', error);
    return null;
  }
}
