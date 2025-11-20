#!/usr/bin/env node
/**
 * Check deployed Farcasturds contract details
 * Usage: node check-contract.js <contract-address>
 */

const { createPublicClient, http, formatEther } = require('viem');
const { baseSepolia } = require('viem/chains');

const farcasturdsAbi = [
  {
    type: 'function',
    name: 'mintPrice',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'minter',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'totalSupply',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
];

async function main() {
  const contractAddress = process.argv[2] || process.env.NEXT_PUBLIC_FARCASTURDS_ADDRESS;

  if (!contractAddress) {
    console.error('Usage: node check-contract.js <contract-address>');
    console.error('Or set NEXT_PUBLIC_FARCASTURDS_ADDRESS environment variable');
    process.exit(1);
  }

  console.log('🔍 Checking Farcasturds contract...\n');
  console.log('Contract Address:', contractAddress);
  console.log('Network: Base Sepolia\n');

  const client = createPublicClient({
    chain: baseSepolia,
    transport: http(),
  });

  try {
    // Get mint price
    const mintPriceWei = await client.readContract({
      address: contractAddress,
      abi: farcasturdsAbi,
      functionName: 'mintPrice',
    });

    const mintPriceEth = formatEther(mintPriceWei);

    console.log('✅ Contract Details:');
    console.log('├─ Mint Price (wei):', mintPriceWei.toString());
    console.log('├─ Mint Price (ETH):', mintPriceEth);
    console.log('└─ Mint Price (formatted):', mintPriceEth, 'ETH\n');

    // Get minter address
    const minterAddress = await client.readContract({
      address: contractAddress,
      abi: farcasturdsAbi,
      functionName: 'minter',
    });

    console.log('Minter Address:', minterAddress);

    // Get total supply
    const totalSupply = await client.readContract({
      address: contractAddress,
      abi: farcasturdsAbi,
      functionName: 'totalSupply',
    });

    console.log('Total Minted:', totalSupply.toString());

    console.log('\n📝 Update your .env.local with:');
    console.log(`MINT_PRICE_ETH=${mintPriceEth}`);
    console.log(`NEXT_PUBLIC_FARCASTURDS_ADDRESS=${contractAddress}`);
  } catch (error) {
    console.error('❌ Error reading contract:', error.message);
    console.error('\nPossible issues:');
    console.error('- Contract not deployed to Base Sepolia');
    console.error('- Invalid contract address');
    console.error('- RPC connection issues');
    process.exit(1);
  }
}

main();
