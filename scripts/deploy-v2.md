# FarcasturdsV2 Deployment Guide

## Overview
This guide covers deploying the new FarcasturdsV2 contract to Base mainnet with user-paid minting.

## Prerequisites

1. **Foundry installed** (for contract compilation)
   ```bash
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   ```

2. **Environment variables set**:
   ```bash
   DEPLOYER_PRIVATE_KEY=0x...      # Your wallet private key (needs ETH on Base)
   BASE_RPC_URL=https://mainnet.base.org
   BASESCAN_API_KEY=...            # For contract verification (optional)
   ```

3. **Base ETH** - You'll need ~0.01 ETH on Base mainnet for deployment gas

## Contract Parameters

- **Base URI**: `https://farcasturds.vercel.app/api/metadata/`
- **Initial Mint Price**: `0.001 ETH` (1000000000000000 wei)
- **Network**: Base Mainnet (Chain ID: 8453)

## Step 1: Compile the Contract

```bash
cd contracts
forge build
```

Verify the contract compiles without errors.

## Step 2: Run Tests (Recommended)

```bash
forge test --match-path test/FarcasturdsV2.t.sol -vv
```

All tests should pass before deployment.

## Step 3: Deploy to Base Mainnet

### Option A: Using Forge Script (Recommended)

```bash
forge script scripts/DeployV2.s.sol:DeployV2 \\
  --rpc-url $BASE_RPC_URL \\
  --private-key $DEPLOYER_PRIVATE_KEY \\
  --broadcast \\
  --verify \\
  --etherscan-api-key $BASESCAN_API_KEY
```

### Option B: Using Forge Create

```bash
forge create src/FarcasturdsV2.sol:FarcasturdsV2 \\
  --rpc-url $BASE_RPC_URL \\
  --private-key $DEPLOYER_PRIVATE_KEY \\
  --constructor-args \\
    "https://farcasturds.vercel.app/api/metadata/" \\
    "1000000000000000" \\
  --verify \\
  --etherscan-api-key $BASESCAN_API_KEY
```

## Step 4: Verify Deployment

After deployment, you'll receive a contract address. Verify it on BaseScan:

```
https://basescan.org/address/YOUR_CONTRACT_ADDRESS
```

Check:
- ✅ Contract is verified
- ✅ `mintPrice()` returns `1000000000000000` (0.001 ETH)
- ✅ `owner()` returns your deployer address
- ✅ `totalSupply()` returns `0`
- ✅ Contract is not paused

## Step 5: Test Mint Function

Test a mint transaction to ensure everything works:

```javascript
// Using the check script
node scripts/test-mint-v2.js <CONTRACT_ADDRESS>
```

## Step 6: Update Frontend

1. Update `.env.local`:
   ```bash
   NEXT_PUBLIC_FARCASTURDS_V2_ADDRESS=0x...
   MINT_PRICE_ETH=0.001
   BASE_RPC_URL=https://mainnet.base.org
   ```

2. Deploy frontend changes to Vercel

3. Test the full flow in production

## Post-Deployment Checklist

- [ ] Contract deployed and verified on BaseScan
- [ ] Mint price is correct (0.001 ETH)
- [ ] Test mint successful
- [ ] Frontend updated with new contract address
- [ ] Metadata API working correctly
- [ ] Share functionality tested
- [ ] Monitor first few real mints

## Security Considerations

### ✅ Implemented
- ReentrancyGuard on mint and withdraw
- Pausable for emergency stops
- Owner-only administrative functions
- Non-transferable (soulbound) tokens
- Input validation (FID > 0)
- Exact payment requirement
- One mint per FID enforcement

### 🔒 Production Recommendations
1. **Transfer ownership to multisig** (e.g., Safe)
2. **Monitor first 100 mints** for any issues
3. **Set up alerts** for pause events
4. **Regular withdrawals** to secure wallet
5. **Keep private keys secure** - use hardware wallet

## Cost Estimates (Base Mainnet)

- **Deployment**: ~0.003-0.005 ETH
- **Mint (per user)**: ~0.0002-0.0003 ETH gas + mint price
- **Set price**: ~0.0001 ETH
- **Withdrawal**: ~0.0001 ETH

## Emergency Procedures

### Pause Contract
```bash
cast send $CONTRACT_ADDRESS "pause()" \\
  --rpc-url $BASE_RPC_URL \\
  --private-key $OWNER_PRIVATE_KEY
```

### Unpause Contract
```bash
cast send $CONTRACT_ADDRESS "unpause()" \\
  --rpc-url $BASE_RPC_URL \\
  --private-key $OWNER_PRIVATE_KEY
```

### Update Mint Price
```bash
# New price in wei (e.g., 0.002 ETH = 2000000000000000)
cast send $CONTRACT_ADDRESS "setMintPrice(uint256)" 2000000000000000 \\
  --rpc-url $BASE_RPC_URL \\
  --private-key $OWNER_PRIVATE_KEY
```

### Withdraw Funds
```bash
cast send $CONTRACT_ADDRESS "withdraw()" \\
  --rpc-url $BASE_RPC_URL \\
  --private-key $OWNER_PRIVATE_KEY
```

## Differences from V1

| Feature | V1 (Sepolia) | V2 (Base) |
|---------|--------------|-----------|
| Payment | Backend (minter key) | User-paid (direct) |
| Network | Base Sepolia | Base Mainnet |
| Price | Free (or backend-paid) | 0.001 ETH |
| Pausable | No | Yes |
| ReentrancyGuard | No | Yes |
| Withdrawal | No | Yes (owner) |
| Errors | String reverts | Custom errors |

## Support

If you encounter issues:
1. Check BaseScan for transaction details
2. Verify environment variables are correct
3. Ensure sufficient ETH balance for gas
4. Review contract events for debugging

## Contract Address (After Deployment)

```
Base Mainnet: 0x... (FILL IN AFTER DEPLOYMENT)
BaseScan: https://basescan.org/address/0x...
```
