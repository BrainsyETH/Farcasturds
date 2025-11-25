// app/api/user-scores/route.ts
import { NextRequest, NextResponse } from "next/server";
import { NeynarAPIClient } from "@neynar/nodejs-sdk";
import { createPublicClient, http, normalize } from "viem";
import { mainnet } from "viem/chains";

const neynar = new NeynarAPIClient({
  apiKey: process.env.NEYNAR_API_KEY!,
});

// Create a public client for ENS resolution
const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(),
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

// Calculate a Neynar-based score from user engagement metrics
function calculateNeynarScore(user: any): number {
  // Score based on follower count, following count, and engagement
  const followerCount = user.follower_count || 0;
  const followingCount = user.following_count || 0;

  // Simple scoring algorithm:
  // - Followers contribute to score
  // - Following/follower ratio matters (higher ratio = lower score)
  // - Cap at 1000 points
  let score = Math.min(followerCount / 10, 1000);

  // Penalize accounts with very high following/follower ratios
  if (followerCount > 0) {
    const ratio = followingCount / followerCount;
    if (ratio > 2) {
      score *= 0.7; // 30% penalty for high follow/follower ratio
    }
  }

  return Math.round(score);
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

    // Calculate Neynar score
    const neynarScore = calculateNeynarScore(user);

    // Collect all possible addresses to check for Ethos score
    const addressesToCheck: string[] = [];

    // 1. Add all verified addresses
    if (user.verifications && user.verifications.length > 0) {
      addressesToCheck.push(...user.verifications);
      console.log(`[/api/user-scores] Found ${user.verifications.length} verified addresses`);
    }

    // 2. Try to resolve ENS name if available
    const ensName = user.username ? `${user.username}.eth` : null;
    if (ensName) {
      const ensAddress = await resolveENS(ensName);
      if (ensAddress) {
        addressesToCheck.push(ensAddress);
      }
    }

    // 3. Add custody address as fallback
    if (user.custody_address) {
      addressesToCheck.push(user.custody_address);
    }

    console.log(`[/api/user-scores] Checking ${addressesToCheck.length} addresses for Ethos score`);

    // Get Ethos score from any of the addresses
    const ethosScore = await getEthosScoreFromAddresses(addressesToCheck);

    console.log(`[/api/user-scores] ✓ Scores for FID ${fid}:`, { neynarScore, ethosScore });

    return NextResponse.json({
      neynarScore,
      ethosScore,
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
