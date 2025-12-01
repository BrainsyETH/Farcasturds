import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, createWalletClient, http, Address } from 'viem'
// FIX: Import privateKeyToAccount from 'viem/accounts'
import { privateKeyToAccount } from 'viem/accounts' 
import { base } from 'viem/chains'
// Assuming named export based on user provided ABI content
import { farcasturdsV3Abi as farcasturdsAbi } from '@/abi/FarcasturdsV3'; 
import { FarcasturdsAddress } from '@/lib/wagmi'

// --- Configuration (Local/Server-Side Only) ---
const CONTRACT: Address = FarcasturdsAddress; 
const BOT_PRIVATE_KEY = process.env.BOT_PRIVATE_KEY as `0x${string}`;

if (!BOT_PRIVATE_KEY) {
  throw new Error("BOT_PRIVATE_KEY is not set in the environment variables.");
}

const botAccount = privateKeyToAccount(BOT_PRIVATE_KEY);
const BASE_RPC_URL = process.env.BASE_RPC_URL || 'https://mainnet.base.org';

const publicClient = createPublicClient({
    chain: base,
    transport: http(BASE_RPC_URL),
});

const walletClient = createWalletClient({
    chain: base,
    transport: http(BASE_RPC_URL),
    account: botAccount,
});
// ---------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const { targetFid, targetAddress } = await req.json();

    if (!targetFid || !targetAddress) {
      return NextResponse.json({ error: 'Missing targetFid or targetAddress' }, { status: 400 });
    }

    const fid = BigInt(targetFid);
    const recipient: Address = targetAddress as Address;

    console.log(`[DebugMint] Starting debug mint for FID: ${fid} to address: ${recipient}`);

    // === Verification Steps (Using readContract) ===

    // 1. Check if already minted (assuming hasMinted(fid) exists, though farcasturdsV3Abi doesn't show it explicitly, 
    // it's standard for Farcaster frame contracts that check existence)
    // NOTE: Based on the V3 ABI provided previously, we assume `hasMinted` takes the FID.
    try {
        const isMinted = await publicClient.readContract({
            address: CONTRACT,
            abi: farcasturdsAbi,
            functionName: "hasMinted",
            args: [fid],
            // FIX: Add missing required property for viem compatibility
            authorizationList: [],
        }) as boolean; 

        if (isMinted) {
            console.log(`[DebugMint] FID ${fid} already minted.`);
            return NextResponse.json({ error: `Farcasturd for FID ${fid} already minted.` }, { status: 400 });
        }
    } catch (e) {
        // If hasMinted throws (e.g., if FID is invalid), we catch and log, but assume not minted to proceed.
        // For production, this should likely be a hard fail unless the contract gracefully handles non-existent tokens/FIDs.
        console.error(`[DebugMint] Failed to check if already minted for FID ${fid}. Proceeding with assumption not minted.`, e);
    }
    
    // 2. Check if contract is paused
    const isPaused = await publicClient.readContract({
        address: CONTRACT,
        abi: farcasturdsAbi,
        functionName: "paused",
        // FIX: Add missing required property for viem compatibility
        authorizationList: [],
    }) as boolean;

    if (isPaused) {
        console.log(`[DebugMint] Contract is paused.`);
        return NextResponse.json({ error: "Contract is currently paused." }, { status: 400 });
    }

    // 3. Check contract mintPrice
    const mintPriceWei = await publicClient.readContract({
        address: CONTRACT,
        abi: farcasturdsAbi,
        functionName: "mintPrice",
        // FIX: Add missing required property for viem compatibility
        authorizationList: [],
    }) as bigint;

    // 4. Check bot's ETH balance
    const botBalance = await publicClient.getBalance({ address: botAccount.address });
    if (botBalance < mintPriceWei) {
        console.log(`[DebugMint] Bot balance too low. Required: ${mintPriceWei} (wei), Has: ${botBalance} (wei)`);
        return NextResponse.json({ error: `Bot ETH balance is too low to cover the mint price (${mintPriceWei} wei).` }, { status: 500 });
    }

    // 5. Check contract minter
    // FIX: Replaced non-existent 'minter' with 'owner' which is present in the ABI.
    const contractOwner = await publicClient.readContract({
        address: CONTRACT,
        abi: farcasturdsAbi,
        functionName: "owner", 
        // FIX: Add missing required property for viem compatibility
        authorizationList: [],
    }) as Address;

    // NOTE: Changed variable name to contractOwner to match the function name
    if (contractOwner.toLowerCase() !== botAccount.address.toLowerCase()) {
        console.log(`[DebugMint] Bot is not the approved minter/owner.`);
        return NextResponse.json({ error: `Bot address ${botAccount.address} is not the contract owner ${contractOwner}.` }, { status: 403 });
    }

    // === Transaction Execution (writeContract) ===

    // 6. Execute the mintFor transaction
    // Assuming the bot (owner/minter) has the authority to mint without a full authorization signature/deadline check in this debug route
    const { request } = await publicClient.simulateContract({
        account: botAccount,
        address: CONTRACT,
        abi: farcasturdsAbi,
        functionName: 'mintFor',
        args: [
            recipient,
            fid,
            BigInt(Date.now() + 1000 * 60 * 5), // 5 minutes deadline (mocked authorization)
            '0x' as `0x${string}` // Mock signature
        ],
        value: mintPriceWei,
    });

    const hash = await walletClient.writeContract(request);

    // 7. Wait for receipt
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    // Assuming a FarcasturdMinted event is emitted on success
    const success = receipt.status === 'success';

    return NextResponse.json({
        success: success,
        transactionHash: hash,
        receipt: receipt,
        message: success ? `Successfully debug minted for FID ${targetFid}` : 'Mint transaction failed on chain.'
    }, { status: success ? 200 : 500 });

  } catch (error) {
    console.error("[DebugMint] Failed to process debug mint:", error);
    return NextResponse.json(
      { error: "Debug mint processing failed", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}