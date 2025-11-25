// API route to diagnose mint failure
import { NextResponse } from 'next/server'
import { createPublicClient, http, Address } from 'viem'
import { base } from 'viem/chains'
import { farcasturdsV3Abi } from '@/abi/FarcasturdsV3'
import { privateKeyToAccount } from 'viem/accounts'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const fidParam = searchParams.get('fid')

  const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_FARCASTURDS_ADDRESS as Address
  const BACKEND_PRIVATE_KEY = process.env.FARCASTURDS_BACKEND_PRIVATE_KEY as `0x${string}`
  const RPC_URL = process.env.BASE_RPC_URL || 'https://mainnet.base.org'

  const results: any = {
    contractAddress: CONTRACT_ADDRESS,
    timestamp: new Date().toISOString(),
    checks: {}
  }

  try {
    const client = createPublicClient({
      chain: base,
      transport: http(RPC_URL)
    })

    // Check 1: Contract owner
    const owner = await client.readContract({
      address: CONTRACT_ADDRESS,
      abi: farcasturdsV3Abi,
      functionName: 'owner'
    })
    results.checks.owner = owner

    // Check 2: Backend signer
    if (BACKEND_PRIVATE_KEY) {
      const account = privateKeyToAccount(BACKEND_PRIVATE_KEY)
      results.checks.backendSigner = account.address
      results.checks.signerMatchesOwner = owner.toLowerCase() === account.address.toLowerCase()

      if (!results.checks.signerMatchesOwner) {
        results.error = '❌ CRITICAL: Backend signer does NOT match contract owner!'
      }
    } else {
      results.checks.backendSigner = null
      results.error = '❌ FARCASTURDS_BACKEND_PRIVATE_KEY not configured'
    }

    // Check 3: Paused?
    const paused = await client.readContract({
      address: CONTRACT_ADDRESS,
      abi: farcasturdsV3Abi,
      functionName: 'paused'
    })
    results.checks.paused = paused
    if (paused) {
      results.error = '❌ Contract is PAUSED'
    }

    // Check 4: Mint price
    const mintPrice = await client.readContract({
      address: CONTRACT_ADDRESS,
      abi: farcasturdsV3Abi,
      functionName: 'mintPrice'
    })
    results.checks.mintPrice = {
      wei: mintPrice.toString(),
      eth: (Number(mintPrice) / 1e18).toString()
    }

    // Check 5: Treasury
    const treasury = await client.readContract({
      address: CONTRACT_ADDRESS,
      abi: farcasturdsV3Abi,
      functionName: 'treasury'
    })
    results.checks.treasury = treasury

    // Check 6: Total supply
    const totalSupply = await client.readContract({
      address: CONTRACT_ADDRESS,
      abi: farcasturdsV3Abi,
      functionName: 'totalSupply'
    })
    results.checks.totalSupply = totalSupply.toString()

    // Check 7: Specific FID (if provided)
    if (fidParam) {
      const fid = parseInt(fidParam)
      const hasMinted = await client.readContract({
        address: CONTRACT_ADDRESS,
        abi: farcasturdsV3Abi,
        functionName: 'hasMinted',
        args: [BigInt(fid)]
      })
      results.checks.fidStatus = {
        fid,
        hasMinted,
        message: hasMinted ? '❌ This FID has already minted!' : '✅ FID eligible to mint'
      }
    }

    return NextResponse.json(results)

  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      ...results
    }, { status: 500 })
  }
}
