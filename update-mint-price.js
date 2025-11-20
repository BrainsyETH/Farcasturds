#!/usr/bin/env node
/**
 * Update mint price on deployed Farcasturds contract
 * Usage: MINT_PRICE_ETH=0.0005 node update-mint-price.js
 */

const { createWalletClient, createPublicClient, http, parseEther } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { baseSepolia } = require('viem/chains');

const farcasturdsAbi = [
  {
    type: 'function',
    name: 'setMintPrice',
    inputs: [{ name: 'newPrice', type: 'uint256', internalType: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'mintPrice',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
];

async function main() {
  const contractAddress = process.env.NEXT_PUBLIC_FARCASTURDS_ADDRESS;
  const newPriceEth = process.env.MINT_PRICE_ETH;
  const privateKey = process.env.FARCASTURDS_MINTER_PRIVATE_KEY;

  if (!contractAddress || !newPriceEth || !privateKey) {
    console.error('Missing required environment variables:');
    console.error('- NEXT_PUBLIC_FARCASTURDS_ADDRESS');
    console.error('- MINT_PRICE_ETH (new price in ETH, e.g., 0.0005)');
    console.error('- FARCASTURDS_MINTER_PRIVATE_KEY');
    process.exit(1);
  }

  console.log('📝 Updating Farcasturds mint price...\n');
  console.log('Contract:', contractAddress);
  console.log('New Price:', newPriceEth, 'ETH');
  console.log('Network: Base Sepolia\n');

  const account = privateKeyToAccount(privateKey);
  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(process.env.BASE_RPC_URL || 'https://sepolia.base.org'),
  });

  const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http(process.env.BASE_RPC_URL || 'https://sepolia.base.org'),
  });

  try {
    // Get current price
    const currentPriceWei = await publicClient.readContract({
      address: contractAddress,
      abi: farcasturdsAbi,
      functionName: 'mintPrice',
    });

    const currentPriceEth = Number(currentPriceWei) / 1e18;
    console.log('Current mint price:', currentPriceEth, 'ETH');

    // Update price
    const newPriceWei = parseEther(newPriceEth);
    console.log('New mint price (wei):', newPriceWei.toString());

    console.log('\n🔄 Sending transaction...');
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: farcasturdsAbi,
      functionName: 'setMintPrice',
      args: [newPriceWei],
    });

    console.log('Transaction hash:', hash);
    console.log('Waiting for confirmation...');

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status === 'success') {
      console.log('\n✅ Mint price updated successfully!');
      console.log('Gas used:', receipt.gasUsed.toString());

      // Verify new price
      const verifyPriceWei = await publicClient.readContract({
        address: contractAddress,
        abi: farcasturdsAbi,
        functionName: 'mintPrice',
      });

      const verifyPriceEth = Number(verifyPriceWei) / 1e18;
      console.log('Verified new price:', verifyPriceEth, 'ETH');
    } else {
      console.error('❌ Transaction failed');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
