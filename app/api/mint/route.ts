// app/api/mint/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createWalletClient, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import { farcasturdsAbi } from "@/abi/Farcasturds";

// Lazy initialization - only runs at request time
function getClients() {
  const CONTRACT = process.env.NEXT_PUBLIC_FARCASTURDS_ADDRESS as `0x${string}`;
  const RPC = process.env.BASE_RPC_URL!;
  const MINTER_PK = process.env.FARCASTURDS_MINTER_PRIVATE_KEY as `0x${string}`;

  if (!CONTRACT || !RPC || !MINTER_PK) {
    throw new Error(
      "Missing NEXT_PUBLIC_FARCASTURDS_ADDRESS / BASE_RPC_URL / FARCASTURDS_MINTER_PRIVATE_KEY"
    );
  }

  const account = privateKeyToAccount(MINTER_PK);

  const publicClient = createPublicClient({
    chain: base,
    transport: http(RPC),
  });

  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http(RPC),
  });

  return { CONTRACT, publicClient, walletClient };
}

export async function POST(req: NextRequest) {
  try {
    const { fid, to } = await req.json();

    if (typeof fid !== "number" || !to) {
      return NextResponse.json(
        { error: "Expected payload: { fid: number, to: address }" },
        { status: 400 }
      );
    }

    // Initialize clients at request time
    const { CONTRACT, publicClient, walletClient } = getClients();

    // Check if this FID already minted
    const already = await publicClient.readContract({
      address: CONTRACT,
      abi: farcasturdsAbi,
      functionName: "hasMinted",
      args: [BigInt(fid)],
    });

    if (already) {
      return NextResponse.json(
        { error: "Farcasturd already minted for this FID" },
        { status: 409 }
      );
    }

    // Write on-chain tx
    const txHash = await walletClient.writeContract({
      address: CONTRACT,
      abi: farcasturdsAbi,
      functionName: "mintFor",
      args: [to as `0x${string}`, BigInt(fid)],
    });

    return NextResponse.json({
      fid,
      to,
      txHash,
      ok: true,
    });
  } catch (err: any) {
    console.error("Mint error:", err);
    return NextResponse.json(
      { error: err?.shortMessage || err?.message || "Constipation - Mint failed" },
      { status: 500 }
    );
  }
}