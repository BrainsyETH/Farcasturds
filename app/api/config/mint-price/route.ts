import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, formatEther } from 'viem';
import { base } from 'viem/chains';
// Assuming this is the named export based on the ABI content provided by the user
import { farcasturdsV3Abi } from '@/abi/FarcasturdsV3'; 
import { FarcasturdsAddress } from '@/lib/wagmi'; 

// Use the address from the common lib
const CONTRACT_ADDRESS = FarcasturdsAddress;
const BASE_RPC_URL = process.env.BASE_RPC_URL || 'https://mainnet.base.org';

const client = createPublicClient({
    chain: base,
    transport: http(BASE_RPC_URL),
});

export async function GET(req: NextRequest) {
  try {
    const mintPriceWei = await client.readContract({
      address: CONTRACT_ADDRESS,
      abi: farcasturdsV3Abi,
      functionName: "mintPrice",
      authorizationList: undefined,
    });

    const priceEth = formatEther(mintPriceWei);

    return NextResponse.json({
      price: priceEth,
    }, { status: 200 });

  } catch (error) {
    console.error("Error fetching mint price:", error);
    return NextResponse.json(
      { error: "Failed to fetch mint price" },
      { status: 500 }
    );
  }
}