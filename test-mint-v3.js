// test-mint-v3.js
// Run with: node test-mint-v3.js
// Tests FarcasturdsV3 contract on Base mainnet

import { createPublicClient, http, keccak256, toBytes, toHex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const CONTRACT = process.env.NEXT_PUBLIC_FARCASTURDS_ADDRESS;
const RPC = process.env.BASE_RPC_URL || 'https://mainnet.base.org';
const BACKEND_PK = process.env.FARCASTURDS_BACKEND_PRIVATE_KEY;

// Test with FID from screenshot
const TEST_FID = 845077;
const TEST_ADDRESS = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1'; // Example address

console.log('🔍 Testing FarcasturdsV3 Configuration\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Network:  Base Mainnet');
console.log('Contract:', CONTRACT);
console.log('RPC:     ', RPC);
console.log('Backend Key:', BACKEND_PK ? '✅ Found' : '❌ Missing');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (!CONTRACT || !BACKEND_PK) {
  console.error('❌ Missing environment variables!\n');
  process.exit(1);
}

const account = privateKeyToAccount(BACKEND_PK);
console.log('📝 Backend Signer:', account.address);
console.log('');

// Create client
const publicClient = createPublicClient({
  chain: base,
  transport: http(RPC),
});

// V3 ABI - just the functions we need
const farcasturdsV3Abi = [
  {
    type: 'function',
    name: 'owner',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'paused',
    inputs: [],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'mintPrice',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view'
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
    name: 'totalSupply',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'treasury',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'verifyAuthorization',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'fid', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
      { name: 'signature', type: 'bytes' }
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view'
  }
];

async function testSignature() {
  // Create test authorization signature (matching backend logic)
  const deadline = Math.floor(Date.now() / 1000) + (5 * 60); // 5 minutes from now

  console.log('🔐 Testing Signature Generation');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Test Parameters:');
  console.log('  To:      ', TEST_ADDRESS);
  console.log('  FID:     ', TEST_FID);
  console.log('  Deadline:', deadline, '(', new Date(deadline * 1000).toISOString(), ')');
  console.log('');

  // Create message hash matching backend (and contract)
  const messageHash = keccak256(
    toBytes(
      `0x${TEST_ADDRESS.slice(2).padStart(64, '0')}${TEST_FID.toString(16).padStart(64, '0')}${deadline.toString(16).padStart(64, '0')}`
    )
  );
  console.log('Message Hash:', messageHash);

  // Sign it (viem will apply eth_sign prefix)
  const signature = await account.signMessage({
    message: { raw: messageHash }
  });
  console.log('Signature:   ', signature);
  console.log('');

  return { deadline, signature };
}

async function test() {
  try {
    // 1. Check contract owner
    console.log('1️⃣  Checking Contract Owner');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const owner = await publicClient.readContract({
      address: CONTRACT,
      abi: farcasturdsV3Abi,
      functionName: 'owner',
    });
    console.log('Contract Owner:  ', owner);
    console.log('Backend Signer:  ', account.address);

    const signerMatches = owner.toLowerCase() === account.address.toLowerCase();
    console.log('Match:           ', signerMatches ? '✅ YES' : '❌ NO - CRITICAL ISSUE!');

    if (!signerMatches) {
      console.log('\n⚠️  PROBLEM FOUND: Backend signer does NOT match contract owner!');
      console.log('   The contract will reject all signatures from this backend.');
      console.log('   The contract owner needs to be:', account.address);
      console.log('   Or the FARCASTURDS_BACKEND_PRIVATE_KEY needs to match the owner.\n');
    }
    console.log('');

    // 2. Check if contract is paused
    console.log('2️⃣  Checking Contract Status');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const paused = await publicClient.readContract({
      address: CONTRACT,
      abi: farcasturdsV3Abi,
      functionName: 'paused',
    });
    console.log('Paused:', paused ? '❌ YES - Contract is PAUSED!' : '✅ No');

    if (paused) {
      console.log('\n⚠️  PROBLEM FOUND: Contract is paused!');
      console.log('   No one can mint while the contract is paused.\n');
    }
    console.log('');

    // 3. Check mint price
    console.log('3️⃣  Checking Mint Price');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const mintPrice = await publicClient.readContract({
      address: CONTRACT,
      abi: farcasturdsV3Abi,
      functionName: 'mintPrice',
    });
    console.log('Mint Price:', mintPrice, 'wei');
    console.log('Mint Price:', Number(mintPrice) / 1e18, 'ETH');
    console.log('');

    // 4. Check total supply
    console.log('4️⃣  Checking Total Supply');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const totalSupply = await publicClient.readContract({
      address: CONTRACT,
      abi: farcasturdsV3Abi,
      functionName: 'totalSupply',
    });
    console.log('Total Minted:', totalSupply.toString());
    console.log('');

    // 5. Check treasury
    console.log('5️⃣  Checking Treasury');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const treasury = await publicClient.readContract({
      address: CONTRACT,
      abi: farcasturdsV3Abi,
      functionName: 'treasury',
    });
    console.log('Treasury:', treasury);
    console.log('');

    // 6. Check if test FID has already minted
    console.log('6️⃣  Checking Test FID Status');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const hasMinted = await publicClient.readContract({
      address: CONTRACT,
      abi: farcasturdsV3Abi,
      functionName: 'hasMinted',
      args: [BigInt(TEST_FID)],
    });
    console.log(`FID ${TEST_FID}:`, hasMinted ? '❌ Already Minted' : '✅ Available');

    if (hasMinted) {
      console.log('\n⚠️  This FID has already minted! Try a different FID for testing.\n');
    }
    console.log('');

    // 7. Test signature verification
    if (signerMatches && !hasMinted) {
      console.log('7️⃣  Testing Signature Verification');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      const { deadline, signature } = await testSignature();

      try {
        const isValid = await publicClient.readContract({
          address: CONTRACT,
          abi: farcasturdsV3Abi,
          functionName: 'verifyAuthorization',
          args: [TEST_ADDRESS, BigInt(TEST_FID), BigInt(deadline), signature],
        });
        console.log('Signature Valid:', isValid ? '✅ YES' : '❌ NO');

        if (!isValid) {
          console.log('\n⚠️  PROBLEM FOUND: Signature verification failed!');
          console.log('   This means the signature generation logic is incorrect.\n');
        }
      } catch (err) {
        console.error('❌ Error verifying signature:', err.message);
      }
      console.log('');
    }

    console.log('═══════════════════════════════════════════');
    console.log('✅ Diagnostic Complete!');
    console.log('═══════════════════════════════════════════\n');

    // Summary
    console.log('📊 SUMMARY:');
    if (!signerMatches) {
      console.log('❌ CRITICAL: Backend signer does not match contract owner');
      console.log('   → Fix: Update FARCASTURDS_BACKEND_PRIVATE_KEY or transfer contract ownership\n');
    } else if (paused) {
      console.log('❌ Contract is paused');
      console.log('   → Fix: Call unpause() on the contract\n');
    } else if (hasMinted) {
      console.log('⚠️  Test FID has already minted');
      console.log('   → Try with a different FID\n');
    } else {
      console.log('✅ Everything looks good! Minting should work.\n');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.details) {
      console.error('Details:', error.details);
    }
  }
}

test();
