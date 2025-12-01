// lib/nftVerification.ts
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";
import { farcasturdsV2Abi } from "@/abi/FarcasturdsV2";
import { farcasturdsV3Abi } from "@/abi/FarcasturdsV3";

const CONTRACT_V3 = process.env.NEXT_PUBLIC_FARCASTURDS_ADDRESS as `0x${string}`;
const CONTRACT_V2 = process.env.NEXT_PUBLIC_FARCASTURDS_V2_ADDRESS as `0x${string}`;
const RPC = process.env.BASE_RPC_URL;

/**
 * Check if a user (by FID) has minted a Farcasturd NFT
 * Checks both V3 and V2 contracts for backward compatibility
 * @param fid - The Farcaster ID to check
 * @returns Promise<boolean> - True if the user has minted an NFT
 */
export async function checkUserHasNFT(fid: number): Promise<boolean> {
  if ((!CONTRACT_V3 && !CONTRACT_V2) || !RPC) {
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

    let hasMinted = false;

    // Check V3 contract first (current)
    if (CONTRACT_V3) {
      try {
        const mintedOnV3 = await publicClient.readContract({
          address: CONTRACT_V3,
          abi: farcasturdsV3Abi,
          functionName: "hasMinted",
          args: [BigInt(fid)],
        } as any);

        hasMinted = Boolean(mintedOnV3);
        console.log(`[NFT Check] V3 FID ${fid} hasMinted:`, hasMinted);
      } catch (err) {
        console.error(`[NFT Check] Error checking V3 for FID ${fid}:`, err);
      }
    }

    // If not minted on V3, check V2 contract (backward compatibility)
    if (!hasMinted && CONTRACT_V2) {
      try {
        const mintedOnV2 = await publicClient.readContract({
          address: CONTRACT_V2,
          abi: farcasturdsV2Abi,
          functionName: "hasMinted",
          args: [BigInt(fid)],
        } as any);

        hasMinted = Boolean(mintedOnV2);
        console.log(`[NFT Check] V2 FID ${fid} hasMinted:`, hasMinted);
      } catch (err) {
        console.error(`[NFT Check] Error checking V2 for FID ${fid}:`, err);
      }
    }

    return hasMinted as boolean;
  } catch (err) {
    console.error(`[NFT Check] Error checking NFT for FID ${fid}:`, err);
    // On error, fail closed - don't allow
    return false;
  }
}
