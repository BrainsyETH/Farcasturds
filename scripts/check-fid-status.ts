#!/usr/bin/env tsx
/**
 * Check if a FID has already minted
 * Usage: npx tsx scripts/check-fid-status.ts <fid>
 */

import { createPublicClient, http, formatEther } from 'viem'
import { baseSepolia } from 'viem/chains'
import { farcasturdsAbi } from '../abi/Farcasturds'

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_FARCASTURDS_ADDRESS as `0x${string}`
const RPC_URL = process.env.BASE_RPC_URL || 'https://sepolia.base.org'

async function checkFidStatus(fid: number) {
  console.log(`\n🔍 Checking FID ${fid} mint status...\n`)

  const client = createPublicClient({
    chain: baseSepolia,
    transport: http(RPC_URL),
  })

  try {
    // Check if already minted
    const hasMinted = await client.readContract({
      address: CONTRACT_ADDRESS,
      abi: farcasturdsAbi,
      functionName: 'hasMinted',
      args: [BigInt(fid)],
    } as any)

    const minted = Boolean(hasMinted)

    console.log(`✓ Has minted: ${minted ? '✅ YES' : '❌ NO'}`)

    // Get current mint price from contract
    const mintPrice = await client.readContract({
      address: CONTRACT_ADDRESS,
      abi: farcasturdsAbi,
      functionName: 'mintPrice',
      args: [],
    } as any)

    console.log(`✓ Contract mint price: ${formatEther(mintPrice as bigint)} ETH`)

    // If minted, try to get owner
    if (hasMinted) {
      try {
        const owner = await client.readContract({
          address: CONTRACT_ADDRESS,
          abi: farcasturdsAbi,
          functionName: 'ownerOfFid',
          args: [BigInt(fid)],
        } as any)
        console.log(`✓ Owner address: ${owner}`)
      } catch (err) {
        console.log(`⚠️  Could not fetch owner (might not have ownerOfFid function)`)
      }
    }

    // Get total supply
    const totalSupply = await client.readContract({
      address: CONTRACT_ADDRESS,
      abi: farcasturdsAbi,
      functionName: 'totalSupply',
      args: [],
    } as any)

    console.log(`✓ Total minted: ${totalSupply}`)

    console.log(`\n📋 Summary:`)
    console.log(`   Contract: ${CONTRACT_ADDRESS}`)
    console.log(`   Network: Base Sepolia`)
    console.log(`   FID ${fid}: ${hasMinted ? 'ALREADY MINTED ❌' : 'Available to mint ✅'}`)
    console.log(`   Required price: ${formatEther(mintPrice as bigint)} ETH\n`)

  } catch (error) {
    console.error('❌ Error checking FID status:', error)
    process.exit(1)
  }
}

const fid = process.argv[2]
if (!fid || isNaN(Number(fid))) {
  console.error('Usage: npx tsx scripts/check-fid-status.ts <fid>')
  console.error('Example: npx tsx scripts/check-fid-status.ts 221543')
  process.exit(1)
}

checkFidStatus(Number(fid))
