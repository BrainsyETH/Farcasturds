/**
 * Migration Script: Export V2 holders and prepare for V3 deployment
 *
 * This script:
 * 1. Exports all existing NFT holders from FarcasturdsV2
 * 2. Generates a batch mint script for V3
 * 3. Creates deployment instructions
 *
 * Usage:
 *   npx tsx scripts/migrate-to-v3.ts
 */

import { createPublicClient, http, parseAbiItem, Address } from 'viem'
import { base } from 'viem/chains'
import fs from 'fs'
import path from 'path'

// Configuration
const V2_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_FARCASTURDS_ADDRESS as Address
const BASE_RPC_URL = process.env.BASE_RPC_URL || 'https://mainnet.base.org'

if (!V2_CONTRACT_ADDRESS) {
  console.error('❌ NEXT_PUBLIC_FARCASTURDS_ADDRESS not set')
  process.exit(1)
}

interface MintRecord {
  fid: bigint
  owner: Address
  tokenId: bigint
  blockNumber: bigint
  transactionHash: string
}

async function exportV2Holders(): Promise<MintRecord[]> {
  console.log('🔍 Connecting to Base network...')

  const publicClient = createPublicClient({
    chain: base,
    transport: http(BASE_RPC_URL)
  })

  console.log(`📋 Fetching Transfer events from contract: ${V2_CONTRACT_ADDRESS}`)

  // Get contract deployment block (you may need to adjust this)
  // For now, we'll fetch from a recent block range
  const currentBlock = await publicClient.getBlockNumber()
  const startBlock = currentBlock - 1000000n // ~1M blocks back

  console.log(`   Block range: ${startBlock} to ${currentBlock}`)

  const logs = await publicClient.getLogs({
    address: V2_CONTRACT_ADDRESS,
    event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'),
    fromBlock: startBlock,
    toBlock: 'latest'
  })

  console.log(`✓ Found ${logs.length} Transfer events`)

  // Filter for mints (from = 0x0)
  const mints: MintRecord[] = logs
    .filter(log => log.args.from === '0x0000000000000000000000000000000000000000')
    .map(log => ({
      fid: log.args.tokenId!,
      owner: log.args.to!,
      tokenId: log.args.tokenId!,
      blockNumber: log.blockNumber,
      transactionHash: log.transactionHash
    }))

  console.log(`✓ Found ${mints.length} mints`)

  return mints
}

function generateBatchMintScript(mints: MintRecord[]): string {
  const script = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script} from "forge-std/Script.sol";
import {FarcasturdsV3} from "../src/FarcasturdsV3.sol";

/**
 * Batch mint script for migrating V2 holders to V3
 *
 * Usage:
 *   forge script scripts/BatchMintV3.s.sol:BatchMintV3 \\
 *     --rpc-url $BASE_RPC_URL \\
 *     --private-key $DEPLOYER_PRIVATE_KEY \\
 *     --broadcast
 */
contract BatchMintV3 is Script {
    function run() external {
        address contractAddress = vm.envAddress("FARCASTURDS_V3_ADDRESS");
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        FarcasturdsV3 farcasturds = FarcasturdsV3(contractAddress);

        // Batch mint for all V2 holders
        ${mints.map((mint, i) =>
          `farcasturds.mintFor(${mint.owner}, ${mint.fid}, block.timestamp + 1 hours, hex""); // FID ${mint.fid}`
        ).join('\n        ')}

        vm.stopBroadcast();

        console.log("Batch minted %d Farcasturds", ${mints.length});
    }
}
`

  return script
}

async function main() {
  console.log('🚀 Farcasturds V2 → V3 Migration')
  console.log('================================\n')

  // Step 1: Export holders
  const mints = await exportV2Holders()

  // Step 2: Save to JSON
  const outputDir = path.join(process.cwd(), 'migration')
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir)
  }

  const jsonPath = path.join(outputDir, 'v2-holders.json')
  fs.writeFileSync(
    jsonPath,
    JSON.stringify(mints, (_, v) => typeof v === 'bigint' ? v.toString() : v, 2)
  )
  console.log(`\n💾 Saved holders to: ${jsonPath}`)

  // Step 3: Generate batch mint script
  const batchMintScript = generateBatchMintScript(mints)
  const scriptPath = path.join(process.cwd(), 'contracts/script/BatchMintV3.s.sol')
  fs.writeFileSync(scriptPath, batchMintScript)
  console.log(`💾 Generated batch mint script: ${scriptPath}`)

  // Step 4: Generate deployment instructions
  const instructions = `
# Farcasturds V3 Deployment Instructions

## Overview
Migrating ${mints.length} NFTs from V2 to V3 with enhanced security.

## Prerequisites
- [x] FarcasturdsV3.sol contract created
- [x] V2 holders exported (${mints.length} NFTs)
- [x] Batch mint script generated

## Step 1: Compile V3 Contract

\`\`\`bash
cd contracts
forge build
\`\`\`

## Step 2: Generate ABI

\`\`\`bash
# Extract ABI from compilation output
cat contracts/out/FarcasturdsV3.sol/FarcasturdsV3.json | jq '.abi' > ../abi/farcasturdsV3.json

# Update TypeScript ABI file
# TODO: Manually update abi/FarcasturdsV3.ts with the compiled ABI
\`\`\`

## Step 3: Deploy V3 Contract

\`\`\`bash
# Set environment variables
export BASE_RPC_URL="https://mainnet.base.org"
export DEPLOYER_PRIVATE_KEY="your-private-key"
export BASE_URI="https://farcasturds.vercel.app/api/metadata/"
export MINT_PRICE="1000000000000000"  # 0.001 ETH in wei
export TREASURY_ADDRESS="0xa27374DA87e7075e4D1AE5B81853dD7970C1841a"

# Deploy
forge create src/FarcasturdsV3.sol:FarcasturdsV3 \\
  --rpc-url $BASE_RPC_URL \\
  --private-key $DEPLOYER_PRIVATE_KEY \\
  --constructor-args "$BASE_URI" "$MINT_PRICE" "$TREASURY_ADDRESS" \\
  --verify \\
  --etherscan-api-key $BASESCAN_API_KEY
\`\`\`

## Step 4: Batch Mint V2 Holders

IMPORTANT: Use a different approach since contract requires backend signature.
Instead of using mintFor() directly, the backend will need to mint for each holder.

\`\`\`typescript
// Option A: Backend mints without payment for migration
// Add a special migration endpoint that:
// 1. Checks if FID was in V2
// 2. Signs authorization
// 3. Calls mintFor() from backend (backend pays gas, no user payment)

// Option B: Contact each holder to re-mint
// Not recommended - poor UX
\`\`\`

## Step 5: Update Environment Variables

\`\`\`bash
# Update .env.local
NEXT_PUBLIC_FARCASTURDS_ADDRESS="<NEW_V3_CONTRACT_ADDRESS>"
FARCASTURDS_BACKEND_PRIVATE_KEY="<BACKEND_SIGNER_PRIVATE_KEY>"
\`\`\`

## Step 6: Update Frontend

\`\`\`bash
# Update MintModal.tsx to use farcasturdsV3Abi
# The TODO comments are already in place
\`\`\`

## Step 7: Test on Testnet First!

Deploy to Base Sepolia testnet before mainnet:
1. Deploy V3 to testnet
2. Test signature authorization flow
3. Test mint with payment
4. Verify payment goes to treasury address
5. Test all error cases

## Migration Checklist

- [ ] Compile FarcasturdsV3.sol
- [ ] Generate and update V3 ABI
- [ ] Deploy V3 to Base Sepolia testnet
- [ ] Test authorization flow
- [ ] Test minting with payment
- [ ] Verify treasury receives payments
- [ ] Deploy V3 to Base mainnet
- [ ] Verify contract on Basescan
- [ ] Create migration mint endpoint
- [ ] Batch mint for ${mints.length} V2 holders
- [ ] Update environment variables
- [ ] Update frontend to use V3 ABI
- [ ] Deploy frontend
- [ ] Announce migration to users

## Exported Holders

Total: ${mints.length} NFTs
File: migration/v2-holders.json

Sample:
${mints.slice(0, 3).map(m => `- FID ${m.fid}: ${m.owner}`).join('\n')}
${mints.length > 3 ? '  ...' : ''}

## Notes

- Images stored by FID, no migration needed ✅
- Payment now goes to 0xa27374DA87e7075e4D1AE5B81853dD7970C1841a ✅
- Backend signature prevents griefing ✅
- Same user experience with Farcaster modal ✅
`

  const instructionsPath = path.join(outputDir, 'DEPLOYMENT.md')
  fs.writeFileSync(instructionsPath, instructions)
  console.log(`📝 Generated deployment instructions: ${instructionsPath}`)

  console.log('\n✅ Migration preparation complete!')
  console.log('\nNext steps:')
  console.log('1. Review migration/DEPLOYMENT.md')
  console.log('2. Compile FarcasturdsV3.sol contract')
  console.log('3. Test on Base Sepolia testnet')
  console.log('4. Deploy to Base mainnet')
  console.log('5. Batch mint for existing holders')
}

main().catch(console.error)
