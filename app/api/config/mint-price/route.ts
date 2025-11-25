// app/api/config/mint-price/route.ts
import { NextResponse } from "next/server";
import { createPublicClient, http, formatEther } from "viem";
import { base } from "viem/chains";
import { farcasturdsV3Abi } from "@/abi/FarcasturdsV3";

export async function GET() {
  const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_FARCASTURDS_ADDRESS as `0x${string}`;
  const RPC_URL = process.env.BASE_RPC_URL || "https://mainnet.base.org";

  try {
    // Fetch mint price directly from the contract
    const client = createPublicClient({
      chain: base,
      transport: http(RPC_URL),
    });

    const mintPriceWei = await client.readContract({
      address: CONTRACT_ADDRESS,
      abi: farcasturdsV3Abi,
      functionName: "mintPrice",
    });

    const mintPriceEth = formatEther(mintPriceWei);

    return NextResponse.json({
      price: mintPriceEth,
      priceWei: mintPriceWei.toString(),
      isFree: mintPriceWei === 0n,
    });
  } catch (error: any) {
    console.error("[mint-price] Error fetching from contract:", error);

    // Fallback to environment variable if contract read fails
    const fallbackPrice = process.env.MINT_PRICE_ETH || "0";
    return NextResponse.json({
      price: fallbackPrice,
      isFree: fallbackPrice === "0",
      error: "Failed to fetch from contract, using fallback",
    });
  }
}
