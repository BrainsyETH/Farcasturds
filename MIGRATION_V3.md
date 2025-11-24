# Farcasturds V3 Migration Guide

## What's New in V3

### 🔒 Security Enhancements
- **Backend signature authorization** - Prevents griefing attacks where someone mints your FID before you
- **FID ownership verification** - SIWE + Neynar verification ensures only FID owners can mint
- **Replay attack prevention** - Each authorization signature can only be used once
- **Time-limited authorizations** - Signatures expire after 5 minutes

### 💰 Payment Updates
- **Treasury forwarding** - Payments go directly to: `0xa27374DA87e7075e4D1AE5B81853dD7970C1841a`
- **Same user experience** - Still uses Farcaster wallet modal with 0.001 ETH payment
- **Zero contract balance** - Funds immediately forwarded, no withdrawals needed

### ✅ Backward Compatibility
- **Images preserved** - Stored by FID in Vercel Blob, no migration needed
- **Same metadata URLs** - `/api/metadata/{fid}` still works
- **Existing NFTs safe** - V2 NFTs remain on-chain, V3 is separate collection

## Architecture

### User Flow
```
1. User connects wallet
   └─> Farcaster Mini App connector

2. User clicks "Verify Signature"
   ├─> Generate SIWE message with FID
   ├─> User signs in Farcaster wallet
   ├─> Backend verifies signature
   ├─> Backend checks FID ownership (Neynar)
   └─> Backend generates mint authorization signature

3. User clicks "Mint"
   ├─> Frontend calls contract with authorization
   ├─> User confirms 0.001 ETH payment in Farcaster wallet
   ├─> Contract verifies backend signature
   ├─> Contract forwards payment to treasury
   └─> NFT minted to user
```

### Contract Changes

#### V2 (Current)
```solidity
function mintFor(address to, uint256 fid) external payable {
    // Anyone can call and mint any FID
}
```

#### V3 (New)
```solidity
function mintFor(
    address to,
    uint256 fid,
    uint256 deadline,
    bytes calldata signature  // ← Backend authorization
) external payable {
    // Verifies backend signed this mint
    // Prevents griefing
}
```

## Files Created/Modified

### New Files
- `contracts/src/FarcasturdsV3.sol` - New contract with signature verification
- `abi/FarcasturdsV3.ts` - TypeScript ABI (needs compilation)
- `app/api/mint/authorize/route.ts` - Backend authorization endpoint
- `scripts/migrate-to-v3.ts` - Migration script
- `MIGRATION_V3.md` - This file

### Modified Files
- `components/MintModal.tsx` - Added authorization flow
- `lib/farcasterClient.ts` - Added verified addresses
- `app/api/auth/verify/route.ts` - Added FID ownership verification

## Deployment Steps

### 1. Prepare Environment

```bash
# Install dependencies (if needed)
cd contracts
forge install

# Set environment variables
export BASE_RPC_URL="https://mainnet.base.org"
export DEPLOYER_PRIVATE_KEY="your-private-key-here"
export FARCASTURDS_BACKEND_PRIVATE_KEY="backend-signer-private-key"
export BASESCAN_API_KEY="your-basescan-api-key"
```

### 2. Export V2 Holders

```bash
# Run migration script to export current holders
npx tsx scripts/migrate-to-v3.ts
```

This creates:
- `migration/v2-holders.json` - List of all current NFT holders
- `migration/DEPLOYMENT.md` - Detailed deployment instructions

### 3. Compile Contract

```bash
cd contracts
forge build

# Verify compilation succeeded
ls out/FarcasturdsV3.sol/FarcasturdsV3.json
```

### 4. Generate ABI

```bash
# Extract ABI from compilation output
cat out/FarcasturdsV3.sol/FarcasturdsV3.json | jq '.abi' > ../abi/farcasturdsV3-compiled.json

# Then manually update ../abi/FarcasturdsV3.ts with the compiled ABI
```

### 5. Test on Sepolia (RECOMMENDED)

```bash
# Deploy to Base Sepolia first
forge create src/FarcasturdsV3.sol:FarcasturdsV3 \
  --rpc-url https://sepolia.base.org \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --constructor-args \
    "https://farcasturds.vercel.app/api/metadata/" \
    "1000000000000000" \
    "0xa27374DA87e7075e4D1AE5B81853dD7970C1841a"

# Test:
# 1. Update NEXT_PUBLIC_FARCASTURDS_ADDRESS in .env.local
# 2. Test signature verification
# 3. Test minting with payment
# 4. Verify payment received at treasury address
```

### 6. Deploy to Mainnet

```bash
cd contracts

# Deploy FarcasturdsV3
forge create src/FarcasturdsV3.sol:FarcasturdsV3 \
  --rpc-url $BASE_RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --constructor-args \
    "https://farcasturds.vercel.app/api/metadata/" \
    "1000000000000000" \
    "0xa27374DA87e7075e4D1AE5B81853dD7970C1841a" \
  --verify \
  --etherscan-api-key $BASESCAN_API_KEY

# Save the deployed contract address!
```

### 7. Update Environment Variables

```bash
# Update .env.local
NEXT_PUBLIC_FARCASTURDS_ADDRESS="<NEW_V3_CONTRACT_ADDRESS>"
FARCASTURDS_BACKEND_PRIVATE_KEY="<BACKEND_SIGNER_PRIVATE_KEY>"
```

**IMPORTANT:** The `FARCASTURDS_BACKEND_PRIVATE_KEY` must match the deployer's private key (contract owner), since the contract verifies signatures are from the owner.

### 8. Update Frontend

```bash
# Update MintModal.tsx
# Change line 247:
abi: farcasturdsV3Abi, // ← Update this import and reference

# Also update the import at the top:
import { farcasturdsV3Abi } from '@/abi/FarcasturdsV3'
```

### 9. Migrate V2 Holders (Optional)

You have two options:

#### Option A: Contact Holders to Re-Mint
- Announce the migration
- Users verify signature and mint for free/discounted
- Most user-friendly

#### Option B: Backend Batch Mint
- Create special migration endpoint
- Backend mints for all V2 holders
- Backend pays gas fees
- Requires batch minting function or loop

### 10. Deploy Frontend

```bash
# Commit changes
git add .
git commit -m "Migrate to FarcasturdsV3 with backend authorization"
git push

# Vercel will auto-deploy
```

## Testing Checklist

Before deploying to mainnet:

- [ ] Compile FarcasturdsV3 successfully
- [ ] Deploy to Base Sepolia testnet
- [ ] Test SIWE signature flow
- [ ] Test backend authorization endpoint
- [ ] Test minting with 0.001 ETH payment
- [ ] Verify payment received at treasury address
- [ ] Test error cases (expired signature, invalid signature, already minted)
- [ ] Test with Farcaster Mini App wallet
- [ ] Verify NFT metadata displays correctly
- [ ] Verify AI generation still works after mint

## Security Considerations

### Backend Private Key
- The `FARCASTURDS_BACKEND_PRIVATE_KEY` must be kept secure
- It's used to sign mint authorizations
- Store in Vercel environment variables (encrypted at rest)
- Rotate periodically

### Contract Owner
- Owner has privileged functions (pause, setMintPrice, setTreasury)
- Consider using a multisig for production
- Can transfer ownership after deployment

### Signature Expiry
- Authorizations expire after 5 minutes
- Prevents stale authorizations
- Users must mint within the window

## Cost Analysis

### Gas Costs (Estimated)
- V2 mint: ~50,000 gas (~$0.05 @ 1 gwei)
- V3 mint: ~70,000 gas (~$0.07 @ 1 gwei) - Higher due to signature verification
- Treasury forward: Included in mint transaction

### Mint Price
- Current: 0.001 ETH per mint
- Configurable via `setMintPrice()`
- Sanity check: Max 1 ETH

## Rollback Plan

If issues arise:

1. **Pause V3 contract**: `contract.pause()`
2. **Revert environment variables** to V2 contract address
3. **Redeploy frontend** with V2 configuration
4. **Debug and fix** V3 issues
5. **Test on Sepolia** again
6. **Re-enable V3** when ready

V2 contract remains functional and can be used as fallback.

## FAQ

### Can someone still mint my FID on V3?
**No.** The backend verifies FID ownership via SIWE + Neynar before signing authorization. Only you can get a valid authorization signature for your FID.

### What happens to my V2 NFT?
**Nothing.** It stays in your wallet. V3 is a separate collection. You can keep both.

### Do I need to migrate?
**Optional.** V2 NFTs remain valid. V3 offers enhanced security. Users can mint V3 versions if desired.

### What if I lose my authorization signature?
**No problem.** Just verify again. Signatures expire after 5 minutes anyway.

### Can the backend refuse to sign?
**Yes.** If FID ownership verification fails, or if security checks fail, backend won't sign. This prevents griefing.

### Where does the 0.001 ETH go?
**Directly to:** `0xa27374DA87e7075e4D1AE5B81853dD7970C1841a`

The contract immediately forwards all payments. No funds stay in contract.

## Support

Issues? Questions?
- GitHub: Create issue on BrainsyETH/Farcasturds
- Farcaster: Tag @farcasturds
