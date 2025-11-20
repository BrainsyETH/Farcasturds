# Farcasturds Deployment Guide

Complete guide for deploying the Farcasturds smart contract and configuring the application with Farcaster authentication and payment.

## 📋 Prerequisites

- Node.js 18+ and npm
- A wallet with Base Sepolia ETH (for testnet deployment)
- Neynar API key ([get one here](https://neynar.com))
- OpenAI API key for image generation
- Vercel account for deployment

## 🔧 Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Farcaster Integration
NEYNAR_API_KEY=your_neynar_api_key_here

# Smart Contract (will be filled after deployment)
NEXT_PUBLIC_FARCASTURDS_ADDRESS=0x...
FARCASTURDS_MINTER_PRIVATE_KEY=0x...

# Blockchain RPC
BASE_RPC_URL=https://sepolia.base.org

# AI Image Generation
OPENAI_API_KEY=sk-...

# Mint Price Configuration (in ETH)
MINT_PRICE_ETH=0.0001

# Application
APP_BASE_URL=https://farcasturds.vercel.app
```

## 📝 Smart Contract Deployment

### Step 1: Install Foundry (for contract deployment)

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### Step 2: Initialize Foundry in your project

```bash
cd /home/user/Farcasturds
forge init --force
```

### Step 3: Install OpenZeppelin contracts

```bash
forge install OpenZeppelin/openzeppelin-contracts
```

### Step 4: Update foundry.toml

Create/update `foundry.toml`:

```toml
[profile.default]
src = "contracts"
out = "out"
libs = ["node_modules", "lib"]
remappings = [
    "@openzeppelin/contracts/=lib/openzeppelin-contracts/contracts/"
]

[rpc_endpoints]
base_sepolia = "${BASE_RPC_URL}"
```

### Step 5: Create deployment script

Create `script/Deploy.s.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/Farcasturds.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("FARCASTURDS_MINTER_PRIVATE_KEY");
        address minter = vm.addr(deployerPrivateKey);

        string memory baseURI = vm.envString("APP_BASE_URL");
        string memory metadataURI = string(abi.encodePacked(baseURI, "/api/metadata/"));

        // Mint price: 0.0001 ETH = 100000000000000 wei
        uint256 mintPrice = 100000000000000;

        vm.startBroadcast(deployerPrivateKey);

        Farcasturds farcasturds = new Farcasturds(
            minter,           // minter address
            metadataURI,      // base URI for metadata
            mintPrice         // mint price in wei
        );

        console.log("Farcasturds deployed to:", address(farcasturds));
        console.log("Minter address:", minter);
        console.log("Base URI:", metadataURI);
        console.log("Mint price:", mintPrice, "wei");

        vm.stopBroadcast();
    }
}
```

### Step 6: Deploy to Base Sepolia

```bash
# Load environment variables
source .env.local

# Deploy the contract
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url base_sepolia \
  --broadcast \
  --verify \
  --etherscan-api-key $BASESCAN_API_KEY \
  -vvvv
```

### Step 7: Update environment variables

After deployment, copy the contract address and update `.env.local`:

```bash
NEXT_PUBLIC_FARCASTURDS_ADDRESS=0x<deployed_contract_address>
```

## 🚀 Application Deployment

### Step 1: Install dependencies

```bash
npm install
```

### Step 2: Build and test locally

```bash
npm run dev
```

Visit `http://localhost:3000?fid=YOUR_FID` to test (replace YOUR_FID with your Farcaster ID)

### Step 3: Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard or via CLI:
vercel env add NEYNAR_API_KEY
vercel env add OPENAI_API_KEY
vercel env add NEXT_PUBLIC_FARCASTURDS_ADDRESS
vercel env add FARCASTURDS_MINTER_PRIVATE_KEY
vercel env add BASE_RPC_URL
vercel env add MINT_PRICE_ETH
vercel env add APP_BASE_URL

# Deploy to production
vercel --prod
```

## 🔐 Security Configuration

### 1. Smart Contract Security

The deployed contract includes:
- ✅ One mint per FID restriction
- ✅ Payable mint with configurable price
- ✅ Owner-only administrative functions
- ✅ Refund mechanism for overpayment

### 2. Application Security

The app implements:
- ✅ **Farcaster Sign-In (SIWF)**: Users must sign a message proving FID ownership
- ✅ **Signature verification**: Backend verifies SIWE signatures
- ✅ **Nonce protection**: Prevents replay attacks
- ✅ **User-initiated transactions**: Users pay gas + mint fee directly (not backend)

### 3. Rate Limiting (Recommended for Production)

Add rate limiting to prevent abuse:

```bash
# Install Vercel KV for rate limiting
npm install @vercel/kv

# Add to Vercel project
vercel kv create farcasturds-rate-limit
```

Update `/app/api/generate/route.ts` with rate limiting logic.

## 🎨 Farcaster Frame Configuration

The app is configured as a Farcaster Mini App. To publish:

### Step 1: Update metadata in `app/layout.tsx`

Ensure the URLs point to your deployed app:

```typescript
url: "https://your-domain.vercel.app"
```

### Step 2: Create a cast with your app

1. Go to Warpcast
2. Create a new cast
3. Add your deployment URL
4. The frame will automatically render with the "💩 Mint a Turd" button

## 📊 Contract Management

### Check mint price:

```bash
cast call $NEXT_PUBLIC_FARCASTURDS_ADDRESS "mintPrice()(uint256)" --rpc-url $BASE_RPC_URL
```

### Update mint price (owner only):

```bash
# Set to 0.0005 ETH (500000000000000 wei)
cast send $NEXT_PUBLIC_FARCASTURDS_ADDRESS \
  "setMintPrice(uint256)" \
  500000000000000 \
  --private-key $FARCASTURDS_MINTER_PRIVATE_KEY \
  --rpc-url $BASE_RPC_URL
```

### Withdraw collected funds (owner only):

```bash
cast send $NEXT_PUBLIC_FARCASTURDS_ADDRESS \
  "withdraw()" \
  --private-key $FARCASTURDS_MINTER_PRIVATE_KEY \
  --rpc-url $BASE_RPC_URL
```

### Check total supply:

```bash
cast call $NEXT_PUBLIC_FARCASTURDS_ADDRESS "totalSupply()(uint256)" --rpc-url $BASE_RPC_URL
```

## 🧪 Testing

### Test authentication flow:

1. Open app in Warpcast or use embed tool with `?fid=YOUR_FID`
2. Click "Generate & Mint"
3. Approve the SIWE signature request
4. Generate your Farcasturd
5. Payment modal should open
6. Approve the transaction in your wallet
7. Wait for confirmation

### Test on Base Sepolia:

- Faucet: https://faucet.quicknode.com/base/sepolia
- Explorer: https://sepolia.basescan.org

## 📱 Mainnet Deployment (When Ready)

### Step 1: Update chain configuration

Update `lib/wagmi.ts` and `lib/auth.ts`:

```typescript
import { base } from 'wagmi/chains' // Change from baseSepolia

export const config = createConfig({
  chains: [base],
  // ...
})

// In auth.ts, change chainId to 8453 (Base mainnet)
chainId: 8453,
```

### Step 2: Deploy contract to Base Mainnet

```bash
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url base_mainnet \
  --broadcast \
  --verify \
  --etherscan-api-key $BASESCAN_API_KEY \
  -vvvv
```

### Step 3: Update environment variables for production

## 🐛 Troubleshooting

### Issue: "User rejected signature"
- **Solution**: Users must approve the SIWF message to authenticate

### Issue: "Insufficient payment"
- **Solution**: Check that `MINT_PRICE_ETH` environment variable matches contract's `mintPrice`

### Issue: "Nonce already used"
- **Solution**: Clear browser cache or wait for nonce to expire (10 minutes)

### Issue: TypeScript errors
- **Solution**: Run `npm install --legacy-peer-deps` to resolve dependency conflicts

## 📚 Additional Resources

- [Farcaster Mini Apps Docs](https://miniapps.farcaster.xyz)
- [Sign In With Farcaster](https://docs.farcaster.xyz/developers/siwf/)
- [Base Docs](https://docs.base.org)
- [Wagmi Documentation](https://wagmi.sh)
- [Foundry Book](https://book.getfoundry.sh)

## 🎉 Success!

Your Farcasturds app is now deployed with:
- ✅ Farcaster authentication
- ✅ User-paid minting with configurable fees
- ✅ Secure signature verification
- ✅ One mint per FID
- ✅ Complete payment flow via modal

Users can now generate and mint their unique Farcasturds NFTs! 💩
