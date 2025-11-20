#!/usr/bin/env node
/**
 * Test minting on the deployed FarcasturdsV2 contract
 * Usage: node scripts/test-mint-v2.js <contract-address> <test-fid>
 */

const { createWalletClient, createPublicClient, http, parseEther, formatEther } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { base } = require('viem/chains');
const { farcasturdsV2Abi } = require('../abi/FarcasturdsV2');

async function main() {
  const contractAddress = process.argv[2] || process.env.NEXT_PUBLIC_FARCASTURDS_V2_ADDRESS;
  const testFid = process.argv[3] || 999999; // Use high FID for testing

  if (!contractAddress) {
    console.error('Usage: node scripts/test-mint-v2.js <contract-address> [test-fid]');
    console.error('Or set NEXT_PUBLIC_FARCASTURDS_V2_ADDRESS environment variable');
    process.exit(1);
  }

  const privateKey = process.env.DEPLOYER_PRIVATE_KEY || process.env.TEST_PRIVATE_KEY;
  if (!privateKey) {
    console.error('Error: DEPLOYER_PRIVATE_KEY or TEST_PRIVATE_KEY environment variable required');
    process.exit(1);
  }

  console.log('\n🧪 Testing FarcasturdsV2 Contract\n');
  console.log('Contract:', contractAddress);
  console.log('Network: Base Mainnet');
  console.log('Test FID:', testFid);
  console.log('\n');

  const account = privateKeyToAccount(privateKey);
  const rpcUrl = process.env.BASE_RPC_URL || 'https://mainnet.base.org';

  const publicClient = createPublicClient({
    chain: base,
    transport: http(rpcUrl),
  });

  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http(rpcUrl),
  });

  try {
    console.log('📊 Contract Information:');
    console.log('========================\n');

    // Get contract details
    const [name, symbol, mintPrice, totalSupply, owner] = await Promise.all([
      publicClient.readContract({
        address: contractAddress,
        abi: farcasturdsV2Abi,
        functionName: 'name',
      }),
      publicClient.readContract({
        address: contractAddress,
        abi: farcasturdsV2Abi,
        functionName: 'symbol',
      }),
      publicClient.readContract({
        address: contractAddress,
        abi: farcasturdsV2Abi,
        functionName: 'mintPrice',
      }),
      publicClient.readContract({
        address: contractAddress,
        abi: farcasturdsV2Abi,
        functionName: 'totalSupply',
      }),
      publicClient.readContract({
        address: contractAddress,
        abi: farcasturdsV2Abi,
        functionName: 'owner',
      }),
    ]);

    console.log(`Name: ${name}`);
    console.log(`Symbol: ${symbol}`);
    console.log(`Mint Price: ${formatEther(mintPrice)} ETH`);
    console.log(`Total Supply: ${totalSupply}`);
    console.log(`Owner: ${owner}`);
    console.log('\n');

    // Check if test FID already minted
    const hasMinted = await publicClient.readContract({
      address: contractAddress,
      abi: farcasturdsV2Abi,
      functionName: 'hasMinted',
      args: [BigInt(testFid)],
    });

    console.log(`FID ${testFid} Status: ${hasMinted ? '❌ Already Minted' : '✅ Available'}\n`);

    if (hasMinted) {
      console.log('ℹ️  This FID has already been minted. Try a different FID.');
      const ownerOfFid = await publicClient.readContract({
        address: contractAddress,
        abi: farcasturdsV2Abi,
        functionName: 'ownerOfFid',
        args: [BigInt(testFid)],
      });
      console.log(`   Owner: ${ownerOfFid}\n`);
      return;
    }

    // Check account balance
    const balance = await publicClient.getBalance({ address: account.address });
    console.log(`Your Balance: ${formatEther(balance)} ETH`);

    if (balance < mintPrice) {
      console.error(`❌ Insufficient balance. Need ${formatEther(mintPrice)} ETH + gas`);
      process.exit(1);
    }

    // Ask for confirmation
    console.log('\n🎯 Ready to mint!');
    console.log(`   To: ${account.address}`);
    console.log(`   FID: ${testFid}`);
    console.log(`   Cost: ${formatEther(mintPrice)} ETH + gas`);
    console.log('\n⚠️  This will execute a REAL transaction on Base Mainnet!');
    console.log('   Press Ctrl+C to cancel, or wait 5 seconds to proceed...\n');

    await new Promise(resolve => setTimeout(resolve, 5000));

    // Execute mint
    console.log('🔄 Sending transaction...');
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: farcasturdsV2Abi,
      functionName: 'mintFor',
      args: [account.address, BigInt(testFid)],
      value: mintPrice,
    });

    console.log(`Transaction Hash: ${hash}`);
    console.log(`BaseScan: https://basescan.org/tx/${hash}`);
    console.log('\n⏳ Waiting for confirmation...');

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status === 'success') {
      console.log('\n✅ Mint Successful!');
      console.log(`   Gas Used: ${receipt.gasUsed.toString()}`);
      console.log(`   Block: ${receipt.blockNumber}`);

      // Verify mint
      const [newHasMinted, newOwner, newSupply] = await Promise.all([
        publicClient.readContract({
          address: contractAddress,
          abi: farcasturdsV2Abi,
          functionName: 'hasMinted',
          args: [BigInt(testFid)],
        }),
        publicClient.readContract({
          address: contractAddress,
          abi: farcasturdsV2Abi,
          functionName: 'ownerOf',
          args: [BigInt(testFid)],
        }),
        publicClient.readContract({
          address: contractAddress,
          abi: farcasturdsV2Abi,
          functionName: 'totalSupply',
        }),
      ]);

      console.log('\n📋 Verification:');
      console.log(`   Has Minted: ${newHasMinted ? '✅' : '❌'}`);
      console.log(`   Token Owner: ${newOwner}`);
      console.log(`   New Total Supply: ${newSupply}`);
      console.log(`\n🎨 View on OpenSea: https://opensea.io/assets/base/${contractAddress}/${testFid}`);
      console.log(`🔍 View on BaseScan: https://basescan.org/token/${contractAddress}?a=${testFid}\n`);
    } else {
      console.error('\n❌ Transaction Failed');
      console.error(`   Status: ${receipt.status}`);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);

    if (error.message.includes('AlreadyMinted')) {
      console.error('   This FID has already been minted.');
    } else if (error.message.includes('InsufficientPayment')) {
      console.error('   Payment amount does not match mint price.');
    } else if (error.message.includes('InvalidFID')) {
      console.error('   FID must be greater than 0.');
    } else if (error.message.includes('user rejected')) {
      console.error('   Transaction was rejected.');
    }

    process.exit(1);
  }
}

main();
