# FarcasturdsV3 Build Instructions

## Fix Applied

Fixed import path in `script/DeployFarcasturds.s.sol`:
```diff
- import "../contracts/Farcasturds.sol";
+ import "../src/Farcasturds.sol";
```

## Build Steps

### 1. Compile Contract

```bash
cd contracts
forge build
```

This will compile:
- `src/FarcasturdsV3.sol` ← New V3 contract
- `src/FarcasturdsV2.sol` ← Existing V2 contract
- `src/Farcasturds.sol` ← Original V1 contract

### 2. Extract V3 ABI

After successful compilation:

```bash
# Extract ABI from compiled output
cat out/FarcasturdsV3.sol/FarcasturdsV3.json | jq '.abi' > ../abi/farcasturdsV3-full.json
```

Then copy the ABI array and replace the placeholder in `../abi/FarcasturdsV3.ts`:

```typescript
export const farcasturdsV3Abi = [
  // Paste the compiled ABI here
  // (from farcasturdsV3-full.json)
] as const
```

### 3. Deploy to Sepolia (Testing)

```bash
# Set environment variables
export DEPLOYER_PRIVATE_KEY="your-private-key"
export BASE_RPC_URL="https://sepolia.base.org"

# Deploy
forge script script/DeployV3.s.sol:DeployV3 \
  --rpc-url $BASE_RPC_URL \
  --broadcast \
  --verify
```

### 4. Deploy to Mainnet (Production)

```bash
# Set environment variables
export DEPLOYER_PRIVATE_KEY="your-private-key"
export BASE_RPC_URL="https://mainnet.base.org"
export BASESCAN_API_KEY="your-basescan-api-key"

# Deploy
forge script script/DeployV3.s.sol:DeployV3 \
  --rpc-url $BASE_RPC_URL \
  --broadcast \
  --verify \
  --etherscan-api-key $BASESCAN_API_KEY
```

## Expected Output

After successful compilation, you'll see:
```
[⠊] Compiling...
[⠒] Compiling 44 files with Solc 0.8.30
[⠰] Solc 0.8.30 finished in XXXms
Compiler run successful!
```

ABI file will be at:
```
contracts/out/FarcasturdsV3.sol/FarcasturdsV3.json
```

## Troubleshooting

### "forge: command not found"
Install Foundry:
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### "Source not found" errors
Make sure you're in the `contracts` directory:
```bash
cd /path/to/Farcasturds/contracts
```

### Import errors
All imports should use `../src/` not `../contracts/`:
```solidity
import "../src/FarcasturdsV3.sol";  ✅
import "../contracts/FarcasturdsV3.sol";  ❌
```

## After Successful Build

1. ✅ Update `../abi/FarcasturdsV3.ts` with compiled ABI
2. ✅ Update `../components/MintModal.tsx` line 247 to use `farcasturdsV3Abi`
3. ✅ Test on Sepolia testnet
4. ✅ Deploy to mainnet
5. ✅ Update environment variables

See `../MIGRATION_V3.md` for complete deployment guide.
