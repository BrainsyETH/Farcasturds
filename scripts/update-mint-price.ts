#!/usr/bin/env tsx
import { createWalletClient, http, parseEther, publicActions } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { base } from 'viem/chains'

const CONTRACT_ADDRESS = '0x99316cF6D2Ff8051Cd0dDfb2adCB0D23F7Ff3Ac3' as `0x${string}`
const NEW_MINT_PRICE = parseEther('0.001') // 0.001 ETH

// Minimal ABI - just the functions we need
const abi = [
  {
    name: 'mintPrice',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'setMintPrice',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'newPrice', type: 'uint256' }],
    outputs: [],
  },
] as const

async function main() {
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`

  if (!privateKey) {
    console.error('❌ DEPLOYER_PRIVATE_KEY environment variable not set')
    process.exit(1)
  }

  const account = privateKeyToAccount(privateKey)

  const client = createWalletClient({
    account,
    chain: base,
    transport: http('https://mainnet.base.org'),
  }).extend(publicActions)

  console.log('\n==========================================')
  console.log('Updating Mint Price')
  console.log('==========================================\n')
  console.log('Contract:', CONTRACT_ADDRESS)
  console.log('Owner:', account.address)
  console.log('New Mint Price: 0.001 ETH')
  console.log('\n')

  try {
    // Read current price
    const currentPrice = await client.readContract({
      address: CONTRACT_ADDRESS,
      abi,
      functionName: 'mintPrice',
    } as any)

    console.log('Current Mint Price:', Number(currentPrice) / 1e18, 'ETH')
    console.log('Current Mint Price (wei):', currentPrice.toString())

    if (currentPrice === NEW_MINT_PRICE) {
      console.log('\n✅ Mint price is already correct!')
      return
    }

    console.log('\nSending transaction...')

    // Update mint price
    const hash = await client.writeContract({
      address: CONTRACT_ADDRESS,
      abi,
      functionName: 'setMintPrice',
      args: [NEW_MINT_PRICE],
    } as any)

    console.log('Transaction hash:', hash)
    console.log('Waiting for confirmation...')

    const receipt = await client.waitForTransactionReceipt({ hash })

    if (receipt.status === 'success') {
      console.log('\n✅ Transaction confirmed!')
      console.log('Block:', receipt.blockNumber)

      // Verify new price
      const newPrice = await client.readContract({
        address: CONTRACT_ADDRESS,
        abi,
        functionName: 'mintPrice',
      } as any)

      console.log('\n==========================================')
      console.log('Update Successful!')
      console.log('==========================================')
      console.log('New Mint Price:', Number(newPrice) / 1e18, 'ETH')
      console.log('New Mint Price (wei):', newPrice.toString())
    } else {
      console.error('\n❌ Transaction failed')
    }
  } catch (error: any) {
    console.error('\n❌ Error:', error.message)
    process.exit(1)
  }
}

main()
