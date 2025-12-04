// app/api/user-scores/route.ts
import { NextRequest, NextResponse } from "next/server";
import { NeynarAPIClient } from "@neynar/nodejs-sdk";
import { createPublicClient, http } from "viem";
import { normalize } from "viem/ens";
import { mainnet, base } from "viem/chains";
import { Coinbase, ExternalAddress } from "@coinbase/coinbase-sdk";

const neynar = new NeynarAPIClient({
  apiKey: process.env.NEYNAR_API_KEY!,
});

// Create a public client for ENS resolution
const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(),
});

// Create a public client for Base network
const basePublicClient = createPublicClient({
  chain: base,
  transport: http(process.env.BASE_RPC_URL || 'https://mainnet.base.org'),
});

// Fetch Ethos score from Ethos API
async function getEthosScore(address: string): Promise<number | null> {
  try {
    // Ethos API endpoint - you may need to adjust based on their actual API
    const response = await fetch(`https://api.ethos.network/api/v1/score/${address}`, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      console.warn(`[Ethos] Failed to fetch score for ${address}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    // Adjust this based on the actual Ethos API response structure
    return data.score ?? null;
  } catch (error) {
    console.error('[Ethos] Error fetching score:', error);
    return null;
  }
}

// Try to get Ethos score from multiple addresses
async function getEthosScoreFromAddresses(addresses: string[]): Promise<number | null> {
  for (const address of addresses) {
    if (!address) continue;

    console.log(`[Ethos] Trying address: ${address}`);
    const score = await getEthosScore(address);

    if (score !== null) {
      console.log(`[Ethos] ✓ Found score ${score} for address: ${address}`);
      return score;
    }
  }

  return null;
}

// Resolve ENS name to address
async function resolveENS(ensName: string): Promise<string | null> {
  try {
    if (!ensName.endsWith('.eth')) {
      return null;
    }

    console.log(`[ENS] Resolving ${ensName}...`);
    const address = await publicClient.getEnsAddress({
      name: normalize(ensName),
    });

    if (address) {
      console.log(`[ENS] ✓ Resolved ${ensName} to ${address}`);
    }

    return address;
  } catch (error) {
    console.error(`[ENS] Error resolving ${ensName}:`, error);
    return null;
  }
}

// Get Onchain Score from Coinbase CDP (official Base reputation score)
// addressOrName can be an Ethereum address, ENS name, or Basename
// Returns an object with scores from both Ethereum and Base networks, plus the maximum score
async function getOnchainScore(addressOrName: string): Promise<{
  score: number | null;
  ethereumScore: number | null;
  baseScore: number | null;
  network: string | null;
}> {
  console.log(`[Coinbase CDP] === START getOnchainScore function ===`);
  console.log(`[Coinbase CDP] Input addressOrName:`, addressOrName);

  try {
    console.log(`[Coinbase CDP] Fetching Onchain Score for ${addressOrName}...`);

    // Check if CDP API keys are configured
    const apiKeyName = process.env.CDP_API_KEY_NAME;
    const apiKeyPrivateKey = process.env.CDP_API_KEY_PRIVATE_KEY;

    console.log(`[Coinbase CDP] API Key Name exists:`, !!apiKeyName);
    console.log(`[Coinbase CDP] API Key Private Key exists:`, !!apiKeyPrivateKey);

    if (!apiKeyName || !apiKeyPrivateKey) {
      console.warn('[Coinbase CDP] API keys not configured (CDP_API_KEY_NAME and CDP_API_KEY_PRIVATE_KEY required)');
      console.log(`[Coinbase CDP] === EARLY RETURN: Missing API keys ===`);
      return { score: null, ethereumScore: null, baseScore: null, network: null };
    }

    // Configure Coinbase SDK with API credentials
    Coinbase.configure({
      apiKeyName: apiKeyName,
      privateKey: apiKeyPrivateKey,
    });

    // Check both Ethereum and Base networks since users may have transactions on both
    console.log(`[Coinbase CDP] Checking reputation on both Ethereum and Base networks...`);

    let ethereumScore: number | null = null;
    let baseScore: number | null = null;

    // Try Ethereum network
    try {
      console.log(`[Coinbase CDP] Creating ExternalAddress with network="ethereum", identifier="${addressOrName}"`);
      const ethereumExternal = new ExternalAddress("ethereum", addressOrName);
      console.log(`[Coinbase CDP] Calling reputation() method for Ethereum...`);
      const ethereumRep = await ethereumExternal.reputation();
      ethereumScore = ethereumRep.score ?? null;
      console.log(`[Coinbase CDP] Ethereum reputation response:`, JSON.stringify(ethereumRep, null, 2));
      console.log(`[Coinbase CDP] Ethereum score:`, ethereumScore);
    } catch (error) {
      console.error(`[Coinbase CDP] Error fetching Ethereum score:`, error);
    }

    // Try Base network (try "base" first, then "base-mainnet" as fallback)
    try {
      console.log(`[Coinbase CDP] Creating ExternalAddress with network="base", identifier="${addressOrName}"`);
      const baseExternal = new ExternalAddress("base", addressOrName);
      console.log(`[Coinbase CDP] Calling reputation() method for Base...`);
      const baseRep = await baseExternal.reputation();
      baseScore = baseRep.score ?? null;
      console.log(`[Coinbase CDP] Base reputation response:`, JSON.stringify(baseRep, null, 2));
      console.log(`[Coinbase CDP] Base score:`, baseScore);
    } catch (error) {
      console.error(`[Coinbase CDP] Error fetching Base score with "base":`, error);

      // Try base-mainnet as fallback
      try {
        console.log(`[Coinbase CDP] Retrying with network="base-mainnet", identifier="${addressOrName}"`);
        const baseMainnetExternal = new ExternalAddress("base-mainnet", addressOrName);
        const baseMainnetRep = await baseMainnetExternal.reputation();
        baseScore = baseMainnetRep.score ?? null;
        console.log(`[Coinbase CDP] Base Mainnet reputation response:`, JSON.stringify(baseMainnetRep, null, 2));
        console.log(`[Coinbase CDP] Base Mainnet score:`, baseScore);
      } catch (fallbackError) {
        console.error(`[Coinbase CDP] Error fetching Base score with "base-mainnet":`, fallbackError);
      }
    }

    // Determine the maximum score and which network it came from
    let finalScore: number | null = null;
    let sourceNetwork: string | null = null;

    if (ethereumScore !== null && baseScore !== null) {
      // Both networks have scores - use the maximum
      if (ethereumScore >= baseScore) {
        finalScore = ethereumScore;
        sourceNetwork = 'ethereum';
      } else {
        finalScore = baseScore;
        sourceNetwork = 'base';
      }
      console.log(`[Coinbase CDP] ✓ Using maximum score: ${finalScore} from ${sourceNetwork} (Ethereum: ${ethereumScore}, Base: ${baseScore})`);
    } else if (ethereumScore !== null) {
      finalScore = ethereumScore;
      sourceNetwork = 'ethereum';
      console.log(`[Coinbase CDP] ✓ Using Ethereum score: ${finalScore}`);
    } else if (baseScore !== null) {
      finalScore = baseScore;
      sourceNetwork = 'base';
      console.log(`[Coinbase CDP] ✓ Using Base score: ${finalScore}`);
    } else {
      console.warn(`[Coinbase CDP] No score available from either network for ${addressOrName}`);
    }

    return {
      score: finalScore,
      ethereumScore,
      baseScore,
      network: sourceNetwork
    };
  } catch (error) {
    console.error(`[Coinbase CDP] Error fetching score for ${addressOrName}:`, error);
    return { score: null, ethereumScore: null, baseScore: null, network: null };
  }
}

// Get OpenRank Onchain Score for Farcaster FID
async function getOpenRankScore(fid: number): Promise<{ rank: number | null; score: number | null }> {
  try {
    console.log(`[OpenRank] Fetching score for FID ${fid}...`);

    const response = await fetch('https://graph.cast.k3l.io/scores/global/engagement/fids', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([fid]),
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      console.warn(`[OpenRank] Failed to fetch score for FID ${fid}: ${response.status}`);
      return { rank: null, score: null };
    }

    const data = await response.json();
    const result = data.result?.[0];

    if (result) {
      const rank = result.rank ?? null;
      const score = result.score ?? null;
      console.log(`[OpenRank] ✓ Score for FID ${fid}: rank=${rank}, score=${score}`);
      return { rank, score };
    }

    console.warn(`[OpenRank] No result found for FID ${fid}`);
    return { rank: null, score: null };
  } catch (error) {
    console.error(`[OpenRank] Error fetching score for FID ${fid}:`, error);
    return { rank: null, score: null };
  }
}

// Extract Neynar's raw reputation score (0-1 scale)
function getNeynarScore(user: any): number | null {
  // Neynar provides a user quality score in the experimental object
  // The field can be accessed as user.experimental?.neynar_user_score or similar
  const score = user.experimental?.neynar_user_score ?? user.neynar_user_score ?? null;

  if (score !== null) {
    console.log(`[Neynar] Raw user score: ${score}`);
  }

  return score;
}

// Extract Neynar's spam score (0-1 scale)
function getNeynarSpamScore(user: any): number | null {
  // Log the full experimental object to debug
  console.log('[Neynar] Full experimental object:', JSON.stringify(user.experimental, null, 2));
  console.log('[Neynar] User object keys:', Object.keys(user));

  // Neynar provides a spam score in the experimental object
  // Try multiple possible field names
  const spamScore =
    user.experimental?.spam_score ??
    user.experimental?.neynar_spam_score ??
    user.spam_score ??
    user.neynar_spam_score ??
    user.activeOnFcNetwork?.spam_score ??
    null;

  if (spamScore !== null) {
    console.log(`[Neynar] Spam score: ${spamScore}`);
  } else {
    console.log('[Neynar] Spam score not found in any known field');
  }

  return spamScore;
}

// GET /api/user-scores?fid=123
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const fidParam = url.searchParams.get("fid");

  if (!fidParam) {
    return NextResponse.json(
      { error: "FID required" },
      { status: 400 }
    );
  }

  const fid = Number(fidParam);
  if (Number.isNaN(fid) || fid <= 0) {
    return NextResponse.json(
      { error: "Invalid FID" },
      { status: 400 }
    );
  }

  try {
    // Fetch user data from Neynar
    console.log(`[/api/user-scores] Fetching scores for FID ${fid}`);
    const { users } = await neynar.fetchBulkUsers({ fids: [fid] });
    const user = users?.[0];

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get Neynar's raw reputation score (0-1 scale)
    const neynarScore = getNeynarScore(user);

    // Get Neynar's spam score (0-1 scale)
    const neynarSpamScore = getNeynarSpamScore(user);

    // Collect all possible addresses to check for reputation scores
    const addressesToCheck: string[] = [];

    // 1. Add all verified addresses
    if (user.verifications && user.verifications.length > 0) {
      addressesToCheck.push(...user.verifications);
      console.log(`[/api/user-scores] Found ${user.verifications.length} verified addresses`);
    }

    // 3. Add custody address as fallback
    if (user.custody_address) {
      addressesToCheck.push(user.custody_address);
    }

    // For Coinbase reputation, we need to use the actual Ethereum address
    // The SDK may not properly resolve Basenames for reputation lookups
    const username = user.username;

    // Strip .eth from username if present to get the base name
    const baseName = username ? username.replace(/\.eth$/, '') : null;
    const ensName = baseName ? `${baseName}.eth` : null;

    // Resolve ENS to get the actual Ethereum address for reputation check
    let addressForReputation = user.verifications?.[0] || user.custody_address;
    if (ensName) {
      const resolvedAddress = await resolveENS(ensName);
      if (resolvedAddress) {
        addressForReputation = resolvedAddress;
        console.log(`[/api/user-scores] Using ENS-resolved address for reputation: ${resolvedAddress}`);
      }
    }

    console.log(`[/api/user-scores] Username: ${username}, Base name: ${baseName}`);
    console.log(`[/api/user-scores] Checking reputation for address: ${addressForReputation}`);

    // Parallelize external API calls for faster loading
    const [ethosResult, onchainResult, openRankResult] = await Promise.allSettled([
      // Get Ethos score from any of the addresses
      getEthosScoreFromAddresses(addressesToCheck),
      // Get Coinbase Onchain Score - use resolved Ethereum address
      addressForReputation ? getOnchainScore(addressForReputation) : Promise.resolve({ score: null, ethereumScore: null, baseScore: null, network: null }),
      // Get OpenRank score from FID
      getOpenRankScore(fid)
    ]);

    // Add resolved ENS address to addressesToCheck if not already there
    if (addressForReputation && !addressesToCheck.includes(addressForReputation)) {
      addressesToCheck.push(addressForReputation);
      console.log(`[ENS] ✓ Using address: ${addressForReputation} for reputation checks`);
    }

    // Extract Ethos score or default to 1213 (neutral)
    const ethosScore = (ethosResult.status === 'fulfilled' && ethosResult.value !== null)
      ? ethosResult.value
      : 1213;

    // Extract Onchain score data
    const onchainData = (onchainResult.status === 'fulfilled')
      ? onchainResult.value
      : { score: null, ethereumScore: null, baseScore: null, network: null };

    const onchainScore = onchainData.score;

    // DEBUG: Add diagnostic info to response
    const onchainDebug = {
      status: onchainResult.status,
      value: onchainResult.status === 'fulfilled' ? onchainResult.value : null,
      score: onchainData.score,
      ethereumScore: onchainData.ethereumScore,
      baseScore: onchainData.baseScore,
      network: onchainData.network,
      addressChecked: addressForReputation,
      reason: onchainResult.status === 'rejected' ? onchainResult.reason?.message : null,
    };

    // Extract OpenRank score
    const openRankData = (openRankResult.status === 'fulfilled' && openRankResult.value)
      ? openRankResult.value
      : { rank: null, score: null };

    console.log(`[/api/user-scores] Checking ${addressesToCheck.length} addresses for reputation scores`);

    console.log(`[/api/user-scores] ✓ Scores for FID ${fid}:`, {
      neynarScore,
      neynarSpamScore,
      ethosScore,
      onchainScore,
      openRankScore: openRankData.score,
      openRankRank: openRankData.rank
    });

    return NextResponse.json({
      neynarScore,
      neynarSpamScore,
      ethosScore,
      onchainScore,
      openRankScore: openRankData.score,
      openRankRank: openRankData.rank,
      username: user.username || null,
      pfpUrl: user.pfp_url || null,
      followerCount: user.follower_count || 0,
      followingCount: user.following_count || 0,
      // DEBUG: Include diagnostic info
      _debug: {
        onchain: onchainDebug,
        hasApiKeys: !!(process.env.CDP_API_KEY_NAME && process.env.CDP_API_KEY_PRIVATE_KEY),
      }
    });
  } catch (error: any) {
    console.error('[/api/user-scores] Error:', error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch scores" },
      { status: 500 }
    );
  }
}
