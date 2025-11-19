// test-mint.js
// Run with: node test-mint.js
// Tests if the minter wallet can call mintFor on the contract

import { createWalletClient, createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const CONTRACT = process.env.NEXT_PUBLIC_FARCASTURDS_ADDRESS;
const RPC = process.env.BASE_RPC_URL || 'https://sepolia.base.org';
const MINTER_PK = process.env.FARCASTURDS_MINTER_PRIVATE_KEY;

console.log('🔍 Testing Minting Configuration\n');
console.log('Contract:', CONTRACT);
console.log('RPC:', RPC);
console.log('Minter Address:', MINTER_PK ? '✅ Found' : '❌ Missing');

if (!CONTRACT || !MINTER_PK) {
  console.error('\n❌ Missing environment variables!');
  process.exit(1);
}

const account = privateKeyToAccount(MINTER_PK);
console.log('Minter Wallet:', account.address);

// Create clients
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(RPC),
});

const walletClient = createWalletClient({
  account,
  chain: baseSepolia,
  transport: http(RPC),
});

// ABI for just the functions we need
const farcasturdsAbi = [
  {
    type: 'function',
    name: 'mintFor',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'fid', type: 'uint256' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'hasMinted',
    inputs: [{ name: 'fid', type: 'uint256' }],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'minter',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view'
  }
];

async function test() {
  try {
    // 1. Check wallet balance
    console.log('\n1️⃣ Checking wallet balance...');
    const balance = await publicClient.getBalance({ address: account.address });
    console.log(`   Balance: ${balance} wei (${Number(balance) / 1e18} ETH)`);
    
    if (balance === 0n) {
      console.error('   ❌ Wallet has no ETH! Get Sepolia ETH from a faucet.');
      return;
    }
    console.log('   ✅ Wallet has ETH');

    // 2. Check contract's minter address
    console.log('\n2️⃣ Checking contract minter...');
    const contractMinter = await publicClient.readContract({
      address: CONTRACT,
      abi: farcasturdsAbi,
      functionName: 'minter',
    });
    console.log(`   Contract minter: ${contractMinter}`);
    console.log(`   Your wallet:     ${account.address}`);
    
    if (contractMinter.toLowerCase() !== account.address.toLowerCase()) {
      console.error('   ❌ MISMATCH! Your wallet is not set as the minter!');
      console.log('\n   💡 Fix: Call setMinter() on the contract to set it to:', account.address);
      return;
    }
    console.log('   ✅ Minter matches!');

    // 3. Test hasMinted for a test FID
    console.log('\n3️⃣ Testing hasMinted(999999)...');
    const testFid = 999999n;
    const alreadyMinted = await publicClient.readContract({
      address: CONTRACT,
      abi: farcasturdsAbi,
      functionName: 'hasMinted',
      args: [testFid],
    });
    console.log(`   FID ${testFid} already minted:`, alreadyMinted);
    
    if (alreadyMinted) {
      console.log('   ℹ️  Try a different FID for testing');
    } else {
      console.log('   ✅ FID is available to mint');
    }

    // 4. Estimate gas for mint
    console.log('\n4️⃣ Estimating gas for mint...');
    try {
      const gasEstimate = await publicClient.estimateContractGas({
        address: CONTRACT,
        abi: farcasturdsAbi,
        functionName: 'mintFor',
        args: [account.address, testFid],
        account,
      });
      console.log(`   Estimated gas: ${gasEstimate}`);
      console.log('   ✅ Mint call should succeed!');
    } catch (err) {
      console.error('   ❌ Gas estimation failed:', err.message);
      console.log('\n   This means the transaction would revert. Possible reasons:');
      console.log('   - FID already minted');
      console.log('   - Not authorized (minter address wrong)');
      console.log('   - Contract issue');
    }

    console.log('\n✅ Configuration check complete!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  }
}

test();
