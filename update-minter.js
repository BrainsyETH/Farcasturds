// update-minter.js
// Run with: node update-minter.js
// Updates the minter address on your deployed contract

import { createWalletClient, createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const CONTRACT = process.env.NEXT_PUBLIC_FARCASTURDS_ADDRESS;
const RPC = process.env.BASE_RPC_URL || 'https://sepolia.base.org';
const DEPLOYER_PK = process.env.DEPLOYER_PRIVATE_KEY; // Your contract owner/deployer wallet
const NEW_MINTER = '0xa27374DA87e7075e4D1AE5B81853dD7970C1841a'; // Your minter wallet

console.log('🔧 Updating Contract Minter\n');
console.log('Contract:', CONTRACT);
console.log('New Minter:', NEW_MINTER);

if (!CONTRACT || !DEPLOYER_PK) {
  console.error('\n❌ Missing environment variables!');
  console.error('Need: NEXT_PUBLIC_FARCASTURDS_ADDRESS and DEPLOYER_PRIVATE_KEY');
  process.exit(1);
}

const account = privateKeyToAccount(DEPLOYER_PK);
console.log('Deployer/Owner:', account.address);

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(RPC),
});

const walletClient = createWalletClient({
  account,
  chain: baseSepolia,
  transport: http(RPC),
});

const farcasturdsAbi = [
  {
    type: 'function',
    name: 'setMinter',
    inputs: [{ name: 'newMinter', type: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'minter',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'owner',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view'
  }
];

async function updateMinter() {
  try {
    // 1. Check current minter
    console.log('\n1️⃣ Checking current minter...');
    const currentMinter = await publicClient.readContract({
      address: CONTRACT,
      abi: farcasturdsAbi,
      functionName: 'minter',
    });
    console.log('   Current minter:', currentMinter);

    if (currentMinter.toLowerCase() === NEW_MINTER.toLowerCase()) {
      console.log('   ✅ Minter is already set correctly!');
      return;
    }

    // 2. Check you're the owner
    console.log('\n2️⃣ Checking contract owner...');
    const owner = await publicClient.readContract({
      address: CONTRACT,
      abi: farcasturdsAbi,
      functionName: 'owner',
    });
    console.log('   Contract owner:', owner);
    console.log('   Your address:  ', account.address);

    if (owner.toLowerCase() !== account.address.toLowerCase()) {
      console.error('   ❌ You are not the owner! Only owner can set minter.');
      return;
    }
    console.log('   ✅ You are the owner');

    // 3. Update minter
    console.log('\n3️⃣ Updating minter...');
    const txHash = await walletClient.writeContract({
      address: CONTRACT,
      abi: farcasturdsAbi,
      functionName: 'setMinter',
      args: [NEW_MINTER],
    });

    console.log('   Transaction hash:', txHash);
    console.log('   Waiting for confirmation...');

    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    
    if (receipt.status === 'success') {
      console.log('   ✅ Transaction confirmed!');
      console.log(`   View on BaseScan: https://sepolia.basescan.org/tx/${txHash}`);

      // 4. Verify new minter
      console.log('\n4️⃣ Verifying new minter...');
      const newMinter = await publicClient.readContract({
        address: CONTRACT,
        abi: farcasturdsAbi,
        functionName: 'minter',
      });
      console.log('   New minter:', newMinter);
      
      if (newMinter.toLowerCase() === NEW_MINTER.toLowerCase()) {
        console.log('   ✅ Minter successfully updated!\n');
      } else {
        console.log('   ⚠️  Minter not updated correctly');
      }
    } else {
      console.error('   ❌ Transaction failed!');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  }
}

updateMinter();
