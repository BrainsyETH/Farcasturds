// app/api/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";
import { NeynarAPIClient } from "@neynar/nodejs-sdk";
import { farcasturdsV3Abi } from "@/abi/FarcasturdsV3";
import { farcasturdsV2Abi } from "@/abi/FarcasturdsV2";

// ---- Neynar client ----
const neynar = new NeynarAPIClient({
  apiKey: process.env.NEYNAR_API_KEY!,
});

const CONTRACT_V3 = process.env
  .NEXT_PUBLIC_FARCASTURDS_ADDRESS as `0x${string}`;
const CONTRACT_V2 = process.env
  .NEXT_PUBLIC_FARCASTURDS_V2_ADDRESS as `0x${string}`;
const RPC = process.env.BASE_RPC_URL;

// Helper: fetch real Farcaster user by fid from Neynar
async function getUserFromNeynar(fid: number) {
  const { users } = await neynar.fetchBulkUsers({ fids: [fid] });
  const user = users?.[0];

  if (!user) {
    throw new Error("User not found on Neynar");
  }

  const wallet =
    user.verifications?.[0] ||
    ((user.custody_address as string | undefined) ?? "");

  return {
    fid: user.fid as number,
    username: user.username as string,
    displayName: (user.display_name as string | undefined) ?? undefined,
    pfpUrl: (user.pfp_url as string | undefined) ?? undefined,
    wallet,
  };
}

// Helper: create mock user for testing when Neynar fails
function createMockUser(fid: number) {
  return {
    fid: fid,
    username: `user${fid}`,
    displayName: `Test User ${fid}`,
    wallet: "0x0000000000000000000000000000000000000000", // Zero address for testing
    pfpUrl: undefined,
  };
}

// GET /api/me?fid=1234
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const fidParam =
    url.searchParams.get("fid") || req.headers.get("x-fc-fid") || "";

  // Parse FID from request
  let fidNum: number | undefined;
  if (fidParam) {
    fidNum = Number(fidParam);
    if (Number.isNaN(fidNum) || fidNum <= 0) {
      return NextResponse.json(
        { error: "Invalid FID provided" },
        { status: 400 }
      );
    }
  }

  if (!fidNum) {
    return NextResponse.json(
      { error: "FID required. Add ?fid=YOUR_FID to the URL" },
      { status: 400 }
    );
  }

  let user;
  let hasMinted = false;

  // 1) Try real Neynar user
  try {
    console.log(`[/api/me] Fetching user from Neynar for FID ${fidNum}`);
    user = await getUserFromNeynar(fidNum);
    console.log(`[/api/me] ✓ Successfully fetched user from Neynar:`, user.username);
  } catch (err) {
    console.warn(`[/api/me] Neynar lookup failed for FID ${fidNum}, using mock user:`, err);
    user = createMockUser(fidNum);
    console.log(`[/api/me] ⚠️ Using mock user for FID ${fidNum}`);
  }

  // 2) On-chain hasMinted check - Check both V3 and V2 contracts
  if (RPC) {
    const publicClient = createPublicClient({
      chain: base,
      transport: http(RPC),
    });

    // Check V3 contract first
    if (CONTRACT_V3) {
      try {
        hasMinted = await publicClient.readContract({
          address: CONTRACT_V3,
          abi: farcasturdsV3Abi,
          functionName: "hasMinted",
          args: [BigInt(user.fid)],
        } as any);

        console.log(`[/api/me] V3 hasMinted check for FID ${user.fid}:`, hasMinted);
      } catch (err) {
        console.error(`[/api/me] Error reading hasMinted from V3 for FID ${user.fid}:`, err);
      }
    }

    // If not minted on V3, check V2 contract (for backward compatibility)
    if (!hasMinted && CONTRACT_V2) {
      try {
        hasMinted = await publicClient.readContract({
          address: CONTRACT_V2,
          abi: farcasturdsV2Abi,
          functionName: "hasMinted",
          args: [BigInt(user.fid)],
        } as any);

        console.log(`[/api/me] V2 hasMinted check for FID ${user.fid}:`, hasMinted);
      } catch (err) {
        console.error(`[/api/me] Error reading hasMinted from V2 for FID ${user.fid}:`, err);
      }
    }

    if (!CONTRACT_V3 && !CONTRACT_V2) {
      console.warn(
        "[/api/me] Neither V3 nor V2 contract addresses configured - skipping on-chain check"
      );
    }
  } else {
    console.warn(
      "[/api/me] RPC not configured - skipping on-chain check"
    );
  }

  return NextResponse.json({
    ...user,
    hasMinted,
  });
}