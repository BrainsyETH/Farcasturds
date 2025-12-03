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
async function getOnchainScore(address: string): Promise<number | null> {
  try {
    console.log(`[Coinbase CDP] Fetching Onchain Score for ${address}...`);

    // Check if CDP API keys are configured
    const apiKeyName = process.env.CDP_API_KEY_NAME;
    const apiKeyPrivateKey = process.env.CDP_API_KEY_PRIVATE_KEY;

    if (!apiKeyName || !apiKeyPrivateKey) {
      console.warn('[Coinbase CDP] API keys not configured (CDP_API_KEY_NAME and CDP_API_KEY_PRIVATE_KEY required)');
      return null;
    }

    // Configure Coinbase SDK with API credentials
    Coinbase.configure({
      apiKeyName: apiKeyName,
      privateKey: apiKeyPrivateKey,
    });

    // Create ExternalAddress with the wallet address on Base network
    const external = new ExternalAddress("base", address);

    // Fetch reputation score
    const rep = await external.reputation();

    // Debug: log full response to understand structure
    console.log(`[Coinbase CDP] Full reputation response:`, JSON.stringify(rep, null, 2));

    const score = rep.score ?? null;

    if (score !== null) {
      console.log(`[Coinbase CDP] ✓ Onchain Score for ${address}: ${score} (range: -100 to +100)`);
    } else {
      console.warn(`[Coinbase CDP] Score is null for ${address}`);
    }

    return score;
  } catch (error) {
    console.error(`[Coinbase CDP] Error fetching score for ${address}:`, error);
    return null;
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

    // Try to resolve ENS name first to use as primary address
    const ensName = user.username ? `${user.username}.eth` : null;
    const ensAddress = ensName ? await resolveENS(ensName) : null;

    // Use ENS address if available, otherwise fall back to verified addresses
    const primaryAddress = ensAddress || user.verifications?.[0] || user.custody_address;

    console.log(`[/api/user-scores] Primary address for reputation check: ${primaryAddress}`);

    // Parallelize external API calls for faster loading
    const [ethosResult, onchainResult, openRankResult] = await Promise.allSettled([
      // Get Ethos score from any of the addresses
      getEthosScoreFromAddresses(addressesToCheck),
      // Get Coinbase Onchain Score from primary address (ENS-resolved if available)
      primaryAddress ? getOnchainScore(primaryAddress) : Promise.resolve(null),
      // Get OpenRank score from FID
      getOpenRankScore(fid)
    ]);

    // Add ENS address to addressesToCheck if resolved
    if (ensAddress) {
      addressesToCheck.push(ensAddress);
      console.log(`[ENS] ✓ Using ENS address: ${ensAddress} for reputation checks`);
    }

    // Extract Ethos score or default to 1213 (neutral)
    const ethosScore = (ethosResult.status === 'fulfilled' && ethosResult.value !== null)
      ? ethosResult.value
      : 1213;

    // Extract Onchain score
    const onchainScore = (onchainResult.status === 'fulfilled')
      ? onchainResult.value
      : null;

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
    });
  } catch (error: any) {
    console.error('[/api/user-scores] Error:', error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch scores" },
      { status: 500 }
    );
  }
}
