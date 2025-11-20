# Farcasturds V2 Migration Guide

## Overview

This guide covers the migration from Farcasturds V1 (Base Sepolia, backend minting) to V2 (Base Mainnet, user-paid minting).

## What Changed

### Architecture Changes

#### V1 (Old - Sepolia)
- **Network**: Base Sepolia (testnet)
- **Minting**: Backend-controlled via private key
- **Payment**: Free or backend-paid
- **Contract**: Requires authorized minter address
- **User Flow**: Frontend → API → Contract

#### V2 (New - Base Mainnet)
- **Network**: Base Mainnet (production)
- **Minting**: User-paid direct minting
- **Payment**: 0.001 ETH (configurable)
- **Contract**: Payable, anyone can mint
- **User Flow**: Frontend → Contract (direct)

### Contract Improvements

| Feature | V1 | V2 |
|---------|----|----|
| Payable mint | ❌ | ✅ |
| Pausable | ❌ | ✅ |
| ReentrancyGuard | ❌ | ✅ |
| Withdrawal function | ❌ | ✅ |
| Custom errors | ❌ | ✅ (gas efficient) |
| Mint price updates | ❌ | ✅ |
| One mint per FID | ✅ | ✅ |
| Non-transferable | ✅ | ✅ |

## Deployment Steps

### 1. Prerequisites

Install Foundry (for contract deployment):
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

Set up environment variables:
```bash
# Copy and fill the template
cp .env.local.example .env.local

# Required variables:
DEPLOYER_PRIVATE_KEY=0x...        # Wallet with Base ETH
BASE_RPC_URL=https://mainnet.base.org
NEYNAR_API_KEY=...
OPENAI_API_KEY=sk-...
```

### 2. Deploy Contract

```bash
cd contracts

# Compile and test
forge build
forge test --match-path test/FarcasturdsV2.t.sol -vv

# Deploy to Base Mainnet
forge script script/DeployV2.s.sol:DeployV2 \
  --rpc-url $BASE_RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast \
  --verify \
  --etherscan-api-key $BASESCAN_API_KEY
```

**Save the deployed contract address!**

### 3. Update Environment

Add the deployed contract address to `.env.local`:

```bash
NEXT_PUBLIC_FARCASTURDS_ADDRESS=0x... # Your deployed V2 address
```

### 4. Test the Contract

```bash
# Verify contract details
node check-contract.js 0xYOUR_CONTRACT_ADDRESS

# Test mint (optional - costs real ETH!)
node scripts/test-mint-v2.js 0xYOUR_CONTRACT_ADDRESS 999999
```

### 5. Deploy Frontend

```bash
# Build and test locally
npm run build
npm run dev

# Deploy to Vercel
git add .
git commit -m "Deploy Farcasturds V2 on Base Mainnet"
git push origin main

# Or use Vercel CLI
vercel --prod
```

### 6. Update Vercel Environment Variables

In Vercel dashboard:
1. Go to Project Settings → Environment Variables
2. Update:
   - `NEXT_PUBLIC_FARCASTURDS_ADDRESS` → V2 contract address
   - `MINT_PRICE_ETH` → `0.001`
   - `BASE_RPC_URL` → `https://mainnet.base.org`
3. Redeploy

## Code Changes Summary

### Frontend Changes

1. **wagmi config** (`lib/wagmi.ts`)
   - Changed from `baseSepolia` to `base`

2. **ABI imports**
   - Old: `import { farcasturdsAbi } from '@/abi/Farcasturds'`
   - New: `import { farcasturdsV2Abi } from '@/abi/FarcasturdsV2'`

3. **Transaction flow**
   - ✅ Still uses `writeContract` (Farcaster embedded wallet)
   - ✅ Now payable (users send ETH)
   - ❌ No backend API needed

4. **Block explorer links**
   - Old: `https://sepolia.basescan.org/tx/${hash}`
   - New: `https://basescan.org/tx/${hash}`

### Backend Changes (Simplified)

- `/api/mint/route.ts` - **No longer needed** for user minting
- `/api/me/route.ts` - Updated to use `base` and `farcasturdsV2Abi`

## Testing Checklist

Before going live, test:

- [ ] Contract deploys successfully
- [ ] Mint price is correct (0.001 ETH)
- [ ] Test mint transaction works
- [ ] Metadata API returns correct data
- [ ] Frontend connects to Farcaster wallet
- [ ] Transaction confirmation works
- [ ] Image generation triggers after mint
- [ ] BaseScan links work
- [ ] Share functionality works
- [ ] OpenSea metadata displays correctly

## Migration Path for Existing Users

**V1 users (Sepolia) cannot transfer to V2 (Mainnet)**

Options:
1. **Fresh start**: Deploy V2, users mint on Base Mainnet (new NFTs)
2. **Parallel chains**: Keep V1 on Sepolia, run V2 on Base (separate mints)
3. **Snapshot & airdrop**: Snapshot V1 holders, airdrop V2 tokens (requires manual process)

**Recommended: Fresh start on Base Mainnet**

Pros:
- Clean migration
- Production-ready
- Real value (ETH mainnet)
- Better user experience

Cons:
- Users need to mint again (costs real ETH)
- Previous Sepolia NFTs become testnet memorabilia

## Post-Deployment

### Monitor the Contract

```bash
# Check contract stats
cast call $CONTRACT_ADDRESS "totalSupply()" --rpc-url $BASE_RPC_URL
cast call $CONTRACT_ADDRESS "mintPrice()" --rpc-url $BASE_RPC_URL
```

### Withdraw Collected Funds

```bash
# Withdraw to owner
cast send $CONTRACT_ADDRESS "withdraw()" \
  --rpc-url $BASE_RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY

# Or withdraw to specific address (multisig)
cast send $CONTRACT_ADDRESS "withdrawTo(address)" <ADDRESS> \
  --rpc-url $BASE_RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY
```

### Update Mint Price (if needed)

```bash
# Set new price (in wei)
# Example: 0.002 ETH = 2000000000000000 wei
cast send $CONTRACT_ADDRESS "setMintPrice(uint256)" 2000000000000000 \
  --rpc-url $BASE_RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY
```

### Emergency Pause

```bash
# Pause minting
cast send $CONTRACT_ADDRESS "pause()" \
  --rpc-url $BASE_RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY

# Unpause
cast send $CONTRACT_ADDRESS "unpause()" \
  --rpc-url $BASE_RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY
```

## Security Recommendations

1. **Transfer ownership to multisig** (e.g., Safe wallet)
   ```bash
   cast send $CONTRACT_ADDRESS "transferOwnership(address)" <MULTISIG_ADDRESS> \
     --rpc-url $BASE_RPC_URL \
     --private-key $DEPLOYER_PRIVATE_KEY
   ```

2. **Secure private keys**
   - Use hardware wallet for deployment
   - Store DEPLOYER_PRIVATE_KEY in secure vault
   - Never commit private keys to git

3. **Monitor early mints**
   - Watch first 100 mints for issues
   - Check BaseScan for unusual activity
   - Set up alerts for pause events

4. **Regular withdrawals**
   - Don't accumulate large ETH in contract
   - Withdraw to secure wallet regularly

## Troubleshooting

### "InsufficientPayment" Error
- Check mint price: `cast call $CONTRACT_ADDRESS "mintPrice()"`
- Ensure exact payment (no more, no less)
- Update frontend `MINT_PRICE_ETH` env var

### "AlreadyMinted" Error
- User's FID already minted
- Check: `cast call $CONTRACT_ADDRESS "hasMinted(uint256)" <FID>`
- Each FID can only mint once

### Wallet Connection Issues
- Ensure Farcaster Mini App is being used
- Check wagmi config uses `base` chain
- Verify embedded wallet has Base ETH

### Transaction Failures
- Check Base mainnet status
- Ensure sufficient gas + mint price
- View transaction on BaseScan for details

## Support

- **Contract**: View on BaseScan at `https://basescan.org/address/<CONTRACT_ADDRESS>`
- **Docs**: See `scripts/deploy-v2.md` for full deployment guide
- **Issues**: Report at https://github.com/BrainsyETH/Farcasturds/issues

## Cost Estimates

- **Deployment**: ~0.003-0.005 ETH
- **Per mint (user)**: 0.001 ETH + ~0.0002 ETH gas
- **Admin operations**: ~0.0001 ETH each

---

**Ready to deploy? Follow the deployment steps above and let's ship Farcasturds V2 on Base! 💩**
