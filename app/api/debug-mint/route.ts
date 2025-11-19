// app/api/debug-mint/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createWalletClient, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import { farcasturdsAbi } from "@/abi/Farcasturds";

export async function GET(req: NextRequest) {
  const debugInfo: any = {
    timestamp: new Date().toISOString(),
    envVars: {},
    walletInfo: {},
    contractInfo: {},
    error: null,
  };

  try {
    // 1. Check env vars exist
    debugInfo.envVars = {
      CONTRACT: !!process.env.NEXT_PUBLIC_FARCASTURDS_ADDRESS,
      contractValue: process.env.NEXT_PUBLIC_FARCASTURDS_ADDRESS || 'MISSING',
      RPC: !!process.env.BASE_RPC_URL,
      rpcValue: process.env.BASE_RPC_URL || 'MISSING',
      MINTER_PK: !!process.env.FARCASTURDS_MINTER_PRIVATE_KEY,
      minterPkLength: process.env.FARCASTURDS_MINTER_PRIVATE_KEY?.length || 0,
    };

    const CONTRACT = process.env.NEXT_PUBLIC_FARCASTURDS_ADDRESS as `0x${string}`;
    const RPC = process.env.BASE_RPC_URL!;
    const MINTER_PK = process.env.FARCASTURDS_MINTER_PRIVATE_KEY as `0x${string}`;

    if (!CONTRACT || !RPC || !MINTER_PK) {
      throw new Error("Missing environment variables");
    }

    // 2. Check wallet creation
    const account = privateKeyToAccount(MINTER_PK);
    debugInfo.walletInfo = {
      address: account.address,
      created: true,
    };

    // 3. Check clients creation
    const publicClient = createPublicClient({
      chain: base,
      transport: http(RPC),
    });

    const walletClient = createWalletClient({
      account,
      chain: base,
      transport: http(RPC),
    });

    debugInfo.clientsCreated = true;

    // 4. Check wallet balance
    const balance = await publicClient.getBalance({ address: account.address });
    debugInfo.walletInfo.balance = balance.toString();
    debugInfo.walletInfo.balanceETH = (Number(balance) / 1e18).toFixed(6);

    // 5. Check contract minter
    const contractMinter = await publicClient.readContract({
      address: CONTRACT,
      abi: farcasturdsAbi,
      functionName: "minter",
    });
    debugInfo.contractInfo.minter = contractMinter;
    debugInfo.contractInfo.minterMatches = contractMinter.toLowerCase() === account.address.toLowerCase();

    // 6. Test hasMinted
    const testFid = 999999;
    const hasMinted = await publicClient.readContract({
      address: CONTRACT,
      abi: farcasturdsAbi,
      functionName: "hasMinted",
      args: [BigInt(testFid)],
    });
    debugInfo.contractInfo.testHasMinted = {
      fid: testFid,
      minted: hasMinted,
    };

    // 7. Test gas estimation
    try {
      const testMintAddress = account.address;
      const gasEstimate = await publicClient.estimateContractGas({
        address: CONTRACT,
        abi: farcasturdsAbi,
        functionName: "mintFor",
        args: [testMintAddress, BigInt(testFid)],
        account,
      });
      debugInfo.contractInfo.gasEstimate = gasEstimate.toString();
      debugInfo.contractInfo.canMint = true;
    } catch (gasError: any) {
      debugInfo.contractInfo.canMint = false;
      debugInfo.contractInfo.gasError = gasError.message;
    }

    debugInfo.success = true;

  } catch (error: any) {
    debugInfo.success = false;
    debugInfo.error = {
      message: error.message,
      stack: error.stack,
      code: error.code,
    };
  }

  return NextResponse.json(debugInfo, { status: 200 });
}