// app/api/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";
import { NeynarAPIClient } from "@neynar/nodejs-sdk";
import { farcasturdsAbi } from "@/abi/Farcasturds";

// ---- Neynar client ----
const neynar = new NeynarAPIClient({
  apiKey: process.env.NEYNAR_API_KEY!,
});

// Local/dev fallback
const MOCK_USER = {
  fid: 198116,
  username: "Brainsy",
  displayName: "Brainsy",
  wallet: "0x019061f6272B28e9d6BaaD2a1D65d0C16Bd8c555",
  pfpUrl: "https://i.imgur.com/ODhZl9K.png",
};

const CONTRACT = process.env
  .NEXT_PUBLIC_FARCASTURDS_ADDRESS as `0x${string}`;
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

// GET /api/me?fid=1234
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const fidParam =
    url.searchParams.get("fid") || req.headers.get("x-fc-fid") || "";

  let user = MOCK_USER;
  let hasMinted = false;

  // 1) Try real Neynar user if fid is provided
  if (fidParam) {
    const fidNum = Number(fidParam);
    if (!Number.isNaN(fidNum) && fidNum > 0) {
      try {
        user = await getUserFromNeynar(fidNum);
      } catch (err) {
        console.warn("[/api/me] Neynar lookup failed, using MOCK_USER:", err);
      }
    }
  } else {
    console.warn("[/api/me] No fid provided, using MOCK_USER");
  }

  // 2) On-chain hasMinted check
  if (CONTRACT && RPC) {
    try {
      const publicClient = createPublicClient({
        chain: base,
        transport: http(RPC),
      });

      hasMinted = await publicClient.readContract({
        address: CONTRACT,
        abi: farcasturdsAbi,
        functionName: "hasMinted",
        args: [BigInt(user.fid)],
      } as any);
    } catch (err) {
      console.error("Error reading hasMinted:", err);
      // soft-fail
    }
  } else {
    console.warn(
      "[/api/me] Contract or RPC not configured - skipping on-chain check"
    );
  }

  return NextResponse.json({
    ...user,
    hasMinted,
  });
}
