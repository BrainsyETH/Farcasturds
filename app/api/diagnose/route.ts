import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, Address } from 'viem';
import { base } from 'viem/chains';
import { farcasturdsV3Abi } from '@/abi/FarcasturdsV3'; 
import { FarcasturdsAddress } from '@/lib/wagmi'; 

const CONTRACT_ADDRESS: Address = FarcasturdsAddress;
const BASE_RPC_URL = process.env.BASE_RPC_URL || 'https://mainnet.base.org';

const client = createPublicClient({
    chain: base,
    transport: http(BASE_RPC_URL),
});

export async function GET(req: NextRequest) {
    try {
        const results = [];

        // Check 1: Contract owner
        const owner = await client.readContract({
            address: CONTRACT_ADDRESS,
            abi: farcasturdsV3Abi,
            functionName: 'owner',
            authorizationList: undefined,
        }) as Address;
        
        results.push({ name: "Contract Owner", status: "OK", value: owner });

        // Check 2: Mint Price
        const mintPrice = await client.readContract({
            address: CONTRACT_ADDRESS,
            abi: farcasturdsV3Abi,
            functionName: 'mintPrice',
            authorizationList: undefined,
        }) as bigint;

        results.push({ name: "Mint Price (Wei)", status: "OK", value: mintPrice.toString() });

        // Check 3: Paused Status
        const isPaused = await client.readContract({
            address: CONTRACT_ADDRESS,
            abi: farcasturdsV3Abi,
            functionName: 'paused',
            authorizationList: undefined,
        }) as boolean;

        results.push({ name: "Paused Status", status: "OK", value: isPaused.toString() });

        // Check 4: Total Supply (for debug purposes)
        const totalSupply = await client.readContract({
            address: CONTRACT_ADDRESS,
            abi: farcasturdsV3Abi,
            functionName: 'totalSupply',
            authorizationList: undefined,
        }) as bigint;

        results.push({ name: "Total Supply", status: "OK", value: totalSupply.toString() });


        return NextResponse.json({
            status: "success",
            diagnostics: results,
        }, { status: 200 });

    } catch (error) {
        console.error("[Diagnose] Error running diagnostics:", error);
        return NextResponse.json(
            { error: "Diagnostic failed", details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}