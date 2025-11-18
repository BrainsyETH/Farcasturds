// app/api/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";
import { farcasturdsAbi } from "@/abi/Farcasturds";

// Farcaster Auth
const MOCK_USER = {
  fid: 198116,
  username: "Brainsy",
  displayName: "Brainsy",
  wallet: "0x0000000000000000000000000000000000000000",
  pfpUrl: "https://i.imgur.com/ODhZl9K.png",
};

const CONTRACT = process.env
  .NEXT_PUBLIC_FARCASTURDS_ADDRESS as `0x${string}`;
const RPC = process.env.BASE_RPC_URL!;

const publicClient = createPublicClient({
  chain: base,
  transport: http(RPC),
});

export async function GET(_req: NextRequest) {
  const { fid } = MOCK_USER;

  let hasMinted = false;

  try {
    hasMinted = await publicClient.readContract({
  address: CONTRACT,
  abi: farcasturdsAbi,
  functionName: "hasMinted",
  args: [BigInt(fid)],
  // Remove authorizationList requirement by adding this:
} as any); // Temporary fix for viem type issue
  } catch (err) {
    console.error("Error reading hasMinted:", err);
  }

  return NextResponse.json({
    ...MOCK_USER,
    hasMinted,
  });
}
