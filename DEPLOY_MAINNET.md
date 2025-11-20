# Deploy FarcasturdsV2 to Base Mainnet

## Prerequisites

1. **Install Foundry** (if not already installed):
   ```bash
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   ```

2. **Set Environment Variables**:
   Create a `.env` file in the `contracts/` directory:
   ```bash
   cd contracts
   cp .env.example .env
   ```

   Add these variables to `.env`:
   ```bash
   # Deployer wallet private key (DO NOT COMMIT THIS!)
   DEPLOYER_PRIVATE_KEY=your_private_key_here

   # Base Mainnet RPC URL
   BASE_RPC_URL=https://mainnet.base.org

   # BaseScan API key for contract verification
   BASESCAN_API_KEY=your_basescan_api_key_here
   ```

   **Security Note**: Never commit your private key to git! The `.env` file should be in `.gitignore`.

## Deployment Steps

### From the `contracts/` directory:

```bash
# Navigate to contracts directory
cd contracts

# Load environment variables
source .env

# Deploy to Base Mainnet
forge script script/DeployV2.s.sol:DeployV2 \
  --rpc-url $BASE_RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast \
  --verify \
  --etherscan-api-key $BASESCAN_API_KEY \
  -vvvv
```

### Alternative: Deploy without verification (verify separately later)

```bash
# Deploy first
forge script script/DeployV2.s.sol:DeployV2 \
  --rpc-url $BASE_RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast \
  -vvvv

# Then verify separately
forge verify-contract <CONTRACT_ADDRESS> \
  src/FarcasturdsV2.sol:FarcasturdsV2 \
  --chain-id 8453 \
  --etherscan-api-key $BASESCAN_API_KEY \
  --constructor-args $(cast abi-encode "constructor(string,uint256)" "https://farcasturds.vercel.app/api/metadata/" "1000000000000000")
```

## Pre-Deployment Checklist

- [ ] Deployer wallet has sufficient ETH on Base Mainnet (at least 0.01 ETH)
- [ ] Environment variables are set correctly
- [ ] Contract compiles without errors: `forge build`
- [ ] Tests pass: `forge test`
- [ ] You're deploying to the correct network (Base Mainnet, Chain ID: 8453)

## Post-Deployment Steps

1. **Save the contract address** from the deployment output

2. **Update your `.env.local`** file in the project root:
   ```bash
   NEXT_PUBLIC_FARCASTURDS_V2_ADDRESS=<deployed_contract_address>
   ```

3. **Verify the deployment** on BaseScan:
   - Visit: https://basescan.org/address/<deployed_contract_address>
   - Check that the contract is verified
   - Verify the mint price is correct (0.001 ETH)

4. **Test the mint function**:
   ```bash
   # From project root
   node test-mint.js
   ```

5. **Deploy frontend** to production (Vercel):
   ```bash
   # Commit your changes
   git add .env.local
   git commit -m "Update contract address for V2 deployment"
   git push

   # Vercel will auto-deploy
   ```

## Troubleshooting

### "Insufficient ETH for deployment"
- Your deployer wallet needs at least 0.01 ETH on Base Mainnet
- Bridge ETH to Base: https://bridge.base.org

### "Must deploy to Base Mainnet (chain ID 8453)"
- Verify your RPC URL is correct: `https://mainnet.base.org`
- Check you're connected to Base Mainnet, not Base Sepolia

### Compilation errors
- Run `forge clean` then `forge build`
- Ensure you're in the `contracts/` directory
- Check that `foundry.toml` has `src = "src"`

### Verification fails
- Wait a few minutes and try again
- Verify manually on BaseScan
- Ensure constructor args match exactly

## Contract Configuration

The deployment script uses these parameters:

- **Name**: Farcasturds
- **Symbol**: TURD
- **Base URI**: https://farcasturds.vercel.app/api/metadata/
- **Mint Price**: 0.001 ETH (1000000000000000 wei)
- **Network**: Base Mainnet (Chain ID: 8453)

## Security Considerations

✅ **Implemented Safeguards**:
- ReentrancyGuard on mint and withdraw functions
- Pausable for emergency stops
- One mint per FID (Farcaster ID)
- Non-transferable (soulbound) tokens
- Owner-controlled mint price updates (max 1 ETH)
- Proper event emissions

⚠️ **Post-Deployment**:
- Test mint function with small amounts first
- Monitor initial mints for any issues
- Keep deployer private key secure (consider using hardware wallet)
- Set up monitoring for contract events
