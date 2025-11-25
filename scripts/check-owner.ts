#!/usr/bin/env tsx
import { createPublicClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { base } from 'viem/chains'

const CONTRACT_ADDRESS = '0x99316cF6D2Ff8051Cd0dDfb2adCB0D23F7Ff3Ac3' as `0x${string}`

const abi = [
  {
    name: 'owner',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }],
  },
] as const

async function main() {
  const client = createPublicClient({
    chain: base,
    transport: http('https://mainnet.base.org'),
  })

  console.log('\n==========================================')
  console.log('Contract Owner Check')
  console.log('==========================================\n')
  console.log('Contract:', CONTRACT_ADDRESS)

  try {
    const owner = await client.readContract({
      address: CONTRACT_ADDRESS,
      abi,
      functionName: 'owner',
    })

    console.log('Contract Owner:', owner)

    // If private key is provided, check if it matches
    const privateKey = process.env.FARCASTURDS_BACKEND_PRIVATE_KEY as `0x${string}` | undefined

    if (privateKey) {
      const account = privateKeyToAccount(privateKey)
      console.log('\nBackend Signer:', account.address)

      if (account.address.toLowerCase() === owner.toLowerCase()) {
        console.log('\n✅ Backend private key matches contract owner!')
      } else {
        console.log('\n❌ ERROR: Backend private key does NOT match contract owner!')
        console.log('\nThe contract expects signatures from:', owner)
        console.log('But your private key corresponds to:', account.address)
        console.log('\nYou need to use the private key for the contract owner address.')
      }
    } else {
      console.log('\n⚠️  FARCASTURDS_BACKEND_PRIVATE_KEY not set')
      console.log('Set this environment variable to the private key of:', owner)
    }

  } catch (error: any) {
    console.error('\n❌ Error:', error.message)
    process.exit(1)
  }
}

main()
