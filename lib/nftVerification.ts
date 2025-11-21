// lib/nftVerification.ts
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";
import { farcasturdsV2Abi } from "@/abi/FarcasturdsV2";

const CONTRACT = process.env.NEXT_PUBLIC_FARCASTURDS_ADDRESS as `0x${string}`;
const RPC = process.env.BASE_RPC_URL;

/**
 * Check if a user (by FID) has minted a Farcasturd NFT
 * @param fid - The Farcaster ID to check
 * @returns Promise<boolean> - True if the user has minted an NFT
 */
export async function checkUserHasNFT(fid: number): Promise<boolean> {
  if (!CONTRACT || !RPC) {
    console.warn(
      "[NFT Check] Contract or RPC not configured - skipping on-chain check"
    );
    // In development/testing without contract, allow all users
    return true;
  }

  try {
    const publicClient = createPublicClient({
      chain: base,
      transport: http(RPC),
    });

    const hasMinted = await publicClient.readContract({
      address: CONTRACT,
      abi: farcasturdsV2Abi,
      functionName: "hasMinted",
      args: [BigInt(fid)],
    } as any);

    console.log(`[NFT Check] FID ${fid} hasMinted:`, hasMinted);
    return hasMinted as boolean;
  } catch (err) {
    console.error(`[NFT Check] Error checking NFT for FID ${fid}:`, err);
    // On error, fail closed - don't allow
    return false;
  }
}
