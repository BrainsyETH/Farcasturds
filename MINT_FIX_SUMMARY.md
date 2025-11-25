# Mint Failure Fix Summary

## Issues Found and Fixed

### Issue #1: Payment Amount Mismatch ✅ FIXED
**File**: `app/api/config/mint-price/route.ts`

**Problem**:
- Frontend was using `process.env.MINT_PRICE_ETH` environment variable
- Contract has `mintPrice = 0.001 ETH` (1000000000000000 wei) on-chain
- Contract requires **EXACT** match: `if (msg.value != mintPrice) revert InsufficientPayment()`
- If env variable was "0" or not set, transaction would fail

**Solution**:
- Updated API endpoint to fetch price directly from contract using `publicClient.readContract()`
- Returns both ETH and wei values for accuracy
- Falls back to env variable only if contract read fails

**Code Changes**:
```typescript
// Before:
const mintPriceEth = process.env.MINT_PRICE_ETH || "0";

// After:
const mintPriceWei = await client.readContract({
  address: CONTRACT_ADDRESS,
  abi: farcasturdsV3Abi,
  functionName: "mintPrice",
});
const mintPriceEth = formatEther(mintPriceWei);
```

---

### Issue #2: Wrong ABI Used for V3 Contract ✅ FIXED
**File**: `app/page.tsx` (handleGenerateAndMint function)

**Problem**:
- "Generate and Mint" button was using `farcasturdsV2Abi`
- But contract is V3 which requires authorization
- V2: `mintFor(address, fid)` - 2 parameters
- V3: `mintFor(address, fid, deadline, signature)` - 4 parameters
- Result: Contract reverted because signature validation failed

**Solution**:
- Removed direct minting from `handleGenerateAndMint()`
- Now generates image, then opens MintModal
- MintModal handles proper V3 authorization flow:
  1. User signs SIWE message (proves FID ownership)
  2. Backend verifies and returns signed authorization
  3. Frontend calls mintFor() with all 4 parameters
  4. Contract verifies signature and mints

**Code Changes**:
```typescript
// Before:
writeContract({
  address: CONTRACT_ADDRESS,
  abi: farcasturdsV2Abi,  // ❌ WRONG ABI
  functionName: 'mintFor',
  args: [address, BigInt(me.fid)],  // ❌ Missing deadline & signature
  value: parseEther(priceInEth),
});

// After:
// Generate image first, then open MintModal
// MintModal uses farcasturdsV3Abi with proper authorization
```

---

## How the V3 Mint Flow Works

### Full Authorization Flow:

```
1. User clicks "Mint" button
   ↓
2. MintModal opens → User clicks "Verify Signature"
   ↓
3. Frontend generates SIWE message
   ↓
4. User signs SIWE message with wallet
   ↓
5. Frontend sends SIWE signature to /api/auth/verify
   ↓
6. Backend verifies signature + FID ownership
   ↓
7. Frontend sends verified signature to /api/mint/authorize
   ↓
8. Backend generates authorization:
   - Creates deadline (5 minutes from now)
   - Creates messageHash = keccak256(to, fid, deadline)
   - Signs with FARCASTURDS_BACKEND_PRIVATE_KEY
   - Returns {deadline, signature}
   ↓
9. Frontend calls contract:
   mintFor(address, fid, deadline, signature) with 0.001 ETH
   ↓
10. Contract verifies:
    - FID not already minted
    - Payment = exact mintPrice
    - Deadline not expired
    - Signature not used before
    - Signature from contract owner
    ↓
11. Contract mints NFT (tokenId = fid)
```

---

## Why These Fixes Were Needed

### The V3 Contract Design:
FarcasturdsV3 uses **backend authorization** to prevent griefing attacks:
- Without signatures, anyone could mint for any FID
- With signatures, backend verifies FID ownership via SIWE + Neynar
- Only verified users get signed authorization to mint

### The Migration Issue:
The codebase was upgraded from V2 to V3, but:
- The main page still had V2 minting code
- Only the MintModal component was updated for V3
- This created two different mint flows, one broken

---

## Testing Checklist

After deploying these fixes:

- [ ] Visit `/api/config/mint-price` - should return `0.001` ETH
- [ ] Click "Mint" button - MintModal should open
- [ ] Click "Verify Signature" - wallet should prompt for SIWE signature
- [ ] After signing - should see "✓ Authorized! You can now mint."
- [ ] Click "💩 Mint for 0.001 ETH" - should see transaction with correct parameters
- [ ] Check browser console for logs:
  ```
  [Mint] Price string: 0.001 ETH
  [MintModal] Mint parameters: {
    to: "0x...",
    fid: 845077,
    deadline: 1234567890,
    signatureLength: 132,
    mintPriceETH: "0.001",
    paymentValueWei: "1000000000000000"
  }
  ```

---

## Environment Variables Required

Make sure these are set in Vercel:

| Variable | Required Value | Purpose |
|----------|---------------|---------|
| `NEXT_PUBLIC_FARCASTURDS_ADDRESS` | `0x99316cF6D2Ff8051Cd0dDfb2adCB0D23F7Ff3Ac3` | V3 contract address |
| `FARCASTURDS_BACKEND_PRIVATE_KEY` | (private key) | Backend signer - MUST match contract owner |
| `BASE_RPC_URL` | Base RPC endpoint | For reading contract data |
| `NEYNAR_API_KEY` | Your Neynar key | For FID verification |

**Critical**: `FARCASTURDS_BACKEND_PRIVATE_KEY` must derive to the same address as the contract's `owner()` function returns, otherwise all signatures will fail verification.

---

## Files Changed

1. **app/api/config/mint-price/route.ts**
   - Fetch price from contract instead of env variable
   - Added proper error handling

2. **app/page.tsx**
   - Removed V2 ABI import
   - Updated `handleGenerateAndMint()` to use MintModal
   - Removed direct mint transaction code

3. **components/MintModal.tsx**
   - Added detailed logging for debugging
   - Already had proper V3 authorization flow

---

## What Causes "Contract Function Reverted" Errors

For future reference, the error `"The contract function '<unknown>' reverted"` happens when:

1. **Wrong payment amount** - Contract expects exact `mintPrice`
2. **Invalid signature** - Backend signer doesn't match contract owner
3. **FID already minted** - Each FID can only mint once
4. **Signature expired** - Deadline passed (5 minute window)
5. **Signature replay** - Same signature used twice
6. **Contract paused** - Emergency pause activated
7. **Wrong ABI** - Function signature doesn't match contract

All of these issues should now be resolved with proper error messages.

---

## Deployment Steps

1. Merge this branch to main (or deploy from this branch)
2. Verify environment variables in Vercel
3. Test the mint flow end-to-end
4. Monitor for any new errors in Vercel logs

If issues persist:
- Check `/api/diagnose?fid=<your_fid>` for contract state
- Check browser console for detailed logs
- Verify `FARCASTURDS_BACKEND_PRIVATE_KEY` matches contract owner
