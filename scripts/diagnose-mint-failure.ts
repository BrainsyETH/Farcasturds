// Diagnostic script to identify mint failure cause
import { createPublicClient, http, parseEther, Address } from 'viem'
import { base } from 'viem/chains'
import { farcasturdsV3Abi } from '../abi/FarcasturdsV3'
import { privateKeyToAccount } from 'viem/accounts'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_FARCASTURDS_ADDRESS as Address
const BACKEND_PRIVATE_KEY = process.env.FARCASTURDS_BACKEND_PRIVATE_KEY as `0x${string}`
const RPC_URL = process.env.BASE_RPC_URL || 'https://mainnet.base.org'

async function diagnose() {
  console.log('🔍 Farcasturds Mint Diagnostic Tool\n')
  console.log('Contract Address:', CONTRACT_ADDRESS)

  const client = createPublicClient({
    chain: base,
    transport: http(RPC_URL)
  })

  // Check 1: Contract owner
  console.log('\n--- Check 1: Contract Owner ---')
  const owner = await client.readContract({
    address: CONTRACT_ADDRESS,
    abi: farcasturdsV3Abi,
    functionName: 'owner'
  })
  console.log('Contract Owner:', owner)

  // Check 2: Backend signer address
  if (BACKEND_PRIVATE_KEY) {
    console.log('\n--- Check 2: Backend Signer ---')
    const account = privateKeyToAccount(BACKEND_PRIVATE_KEY)
    console.log('Backend Signer:', account.address)
    console.log('✓ Match:', owner.toLowerCase() === account.address.toLowerCase() ? '✅ YES' : '❌ NO - THIS IS THE PROBLEM!')
  } else {
    console.log('\n❌ FARCASTURDS_BACKEND_PRIVATE_KEY not set!')
  }

  // Check 3: Contract paused?
  console.log('\n--- Check 3: Contract Paused? ---')
  const paused = await client.readContract({
    address: CONTRACT_ADDRESS,
    abi: farcasturdsV3Abi,
    functionName: 'paused'
  })
  console.log('Paused:', paused ? '❌ YES - Contract is paused!' : '✅ No')

  // Check 4: Mint price
  console.log('\n--- Check 4: Mint Price ---')
  const mintPrice = await client.readContract({
    address: CONTRACT_ADDRESS,
    abi: farcasturdsV3Abi,
    functionName: 'mintPrice'
  })
  console.log('Mint Price:', mintPrice, 'wei')
  console.log('Mint Price:', Number(mintPrice) / 1e18, 'ETH')

  // Check 5: Treasury address
  console.log('\n--- Check 5: Treasury ---')
  const treasury = await client.readContract({
    address: CONTRACT_ADDRESS,
    abi: farcasturdsV3Abi,
    functionName: 'treasury'
  })
  console.log('Treasury:', treasury)

  // Check 6: Test with a specific FID (example)
  console.log('\n--- Check 6: Example FID Status ---')
  const testFid = 845077 // From the screenshot
  const hasMinted = await client.readContract({
    address: CONTRACT_ADDRESS,
    abi: farcasturdsV3Abi,
    functionName: 'hasMinted',
    args: [BigInt(testFid)]
  })
  console.log(`FID ${testFid} has minted:`, hasMinted ? '❌ YES - Already minted!' : '✅ No')

  // Check 7: Total supply
  console.log('\n--- Check 7: Total Supply ---')
  const totalSupply = await client.readContract({
    address: CONTRACT_ADDRESS,
    abi: farcasturdsV3Abi,
    functionName: 'totalSupply'
  })
  console.log('Total Minted:', totalSupply.toString())

  console.log('\n✅ Diagnostic complete!')
}

diagnose().catch(console.error)
