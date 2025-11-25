# Mint Failure Diagnosis - Farcasturds

## Error Details

- **Error**: `Simulation failed: ContractFunctionExecutionError: The contract function "<unknown>" reverted.`
- **Contract**: `0x99316cF6D2Ff8051Cd0dDfb2adCB0D23F7Ff3Ac3` (FarcasturdsV3)
- **Network**: Base Mainnet
- **FID**: 845077

## Contract Validation Order

The `mintFor` function in FarcasturdsV3.sol validates in this exact order:

1. **Line 135**: `if (fid == 0) revert InvalidFID();`
2. **Line 138**: `if (hasMinted[fid]) revert AlreadyMinted();` ⚠️ **MOST LIKELY**
3. **Line 141**: `if (msg.value != mintPrice) revert InsufficientPayment();` ⚠️ **VERY LIKELY**
4. **Line 144**: `if (block.timestamp > deadline) revert SignatureExpired();`
5. **Line 151**: `if (usedAuthorizations[authHash]) revert InvalidSignature();`
6. **Line 155**: `if (signer != owner()) revert InvalidSignature();` ⚠️ **CRITICAL IF BACKEND MISCONFIGURED**

## Top 3 Most Likely Issues

### 1. ❌ FID Already Minted (AlreadyMinted)

**Likelihood**: 80%

The FID 845077 may have already minted on this contract. The V3 contract stores minted FIDs in a mapping:

```solidity
mapping(uint256 => bool) public hasMinted;
```

**How to Check**:
```bash
# Using cast
cast call 0x99316cF6D2Ff8051Cd0dDfb2adCB0D23F7Ff3Ac3 "hasMinted(uint256)" 845077 --rpc-url https://mainnet.base.org

# Expected: 0x0000...0000 (false) or 0x0000...0001 (true)
```

**Solution**: The user needs to try with a different FID that hasn't minted yet.

---

### 2. ❌ Wrong Payment Amount (InsufficientPayment)

**Likelihood**: 60%

The contract requires **EXACT** payment - not "at least", but exactly equal to `mintPrice`:

```solidity
if (msg.value != mintPrice) revert InsufficientPayment();
```

**Issue in Frontend**: The MintModal.tsx (line 253) sends:
```typescript
value: parseEther(mintPrice || '0')
```

If `mintPrice` is fetched as a string like `"0.001"` but the contract expects `1000000000000000` wei, even a 1 wei difference will fail.

**How to Check**:
```bash
# Get contract's mint price
cast call 0x99316cF6D2Ff8051Cd0dDfb2adCB0D23F7Ff3Ac3 "mintPrice()" --rpc-url https://mainnet.base.org
```

**Solution**: Ensure the frontend fetches the exact wei amount and sends it precisely.

---

### 3. ❌ Backend Signer Mismatch (InvalidSignature)

**Likelihood**: 40%

The contract verifies that signatures come from the contract `owner()`:

```solidity
address signer = authHash.recover(signature);
if (signer != owner()) revert InvalidSignature();
```

**Backend Signing** (app/api/mint/authorize/route.ts:88-103):
```typescript
const account = privateKeyToAccount(FARCASTURDS_BACKEND_PRIVATE_KEY)
// ... generates signature
```

**Critical Requirement**: The address derived from `FARCASTURDS_BACKEND_PRIVATE_KEY` **MUST** match the contract's `owner()` address.

**How to Check**:
```bash
# Get contract owner
cast call 0x99316cF6D2Ff8051Cd0dDfb2adCB0D23F7Ff3Ac3 "owner()" --rpc-url https://mainnet.base.org

# Compare with backend signer address
# (You need to derive the address from your private key)
```

**Solution**:
- Either transfer contract ownership to match the backend signer
- Or update `FARCASTURDS_BACKEND_PRIVATE_KEY` to match the current owner

---

## Other Possible Issues

### 4. Contract Paused
```solidity
function mintFor(...) external payable whenNotPaused { ... }
```

Check: `cast call 0x99316cF6D2Ff8051Cd0dDfb2adCB0D23F7Ff3Ac3 "paused()" --rpc-url https://mainnet.base.org`

### 5. Signature Expired
Backend sets deadline to 5 minutes. If there's clock skew or user delays, it could expire.

### 6. Signature Already Used
The contract prevents replay attacks. If the same signature is submitted twice, it will fail.

---

## Debugging Steps

### Step 1: Check if FID has already minted
```javascript
// Run this in browser console on your site
const hasMinted = await fetch('/api/me?fid=845077').then(r => r.json())
console.log('Has minted:', hasMinted.hasMinted)
```

### Step 2: Check mint price
```javascript
// Check frontend's mint price
const price = await fetch('/api/config/mint-price').then(r => r.json())
console.log('Mint price:', price)
```

### Step 3: Verify backend configuration
Create a diagnostic endpoint:
```javascript
// Visit: /api/diagnose?fid=845077
// This will check:
// - Owner vs Backend Signer match
// - Contract paused status
// - Mint price
// - FID minted status
```

### Step 4: Test signature generation
The signature logic must match between backend and contract:

**Backend** (app/api/mint/authorize/route.ts:94-103):
```typescript
const messageHash = keccak256(
  toBytes(`0x${to.slice(2).padStart(64, '0')}${fid.toString(16).padStart(64, '0')}${deadline.toString(16).padStart(64, '0')}`)
)
const signature = await account.signMessage({ message: { raw: messageHash } })
```

**Contract** (FarcasturdsV3.sol:147-154):
```solidity
bytes32 messageHash = keccak256(abi.encodePacked(to, fid, deadline));
bytes32 authHash = messageHash.toEthSignedMessageHash();
address signer = authHash.recover(signature);
```

Both apply `toEthSignedMessageHash()` (via viem's `signMessage`), so they should match.

---

## Recommended Fix Priority

1. **Check FID status first** - Run `/api/me?fid=845077` and verify `hasMinted` is false
2. **Verify mint price** - Ensure exact wei amount is being sent
3. **Check backend signer** - Verify `FARCASTURDS_BACKEND_PRIVATE_KEY` matches contract owner
4. **Check if paused** - Verify contract is not paused

---

## Quick Diagnostic Commands

```bash
# 1. Check if FID has minted
cast call 0x99316cF6D2Ff8051Cd0dDfb2adCB0D23F7Ff3Ac3 "hasMinted(uint256)" 845077 --rpc-url https://mainnet.base.org

# 2. Check contract owner
cast call 0x99316cF6D2Ff8051Cd0dDfb2adCB0D23F7Ff3Ac3 "owner()" --rpc-url https://mainnet.base.org

# 3. Check if paused
cast call 0x99316cF6D2Ff8051Cd0dDfb2adCB0D23F7Ff3Ac3 "paused()" --rpc-url https://mainnet.base.org

# 4. Check mint price
cast call 0x99316cF6D2Ff8051Cd0dDfb2adCB0D23F7Ff3Ac3 "mintPrice()" --rpc-url https://mainnet.base.org

# 5. Check total minted
cast call 0x99316cF6D2Ff8051Cd0dDfb2adCB0D23F7Ff3Ac3 "totalSupply()" --rpc-url https://mainnet.base.org
```

---

## Additional Notes

- The `/api/me` endpoint checks BOTH V3 and V2 contracts (app/api/me/route.ts:100-129)
- The frontend properly shows "✓ Eligible" badge, suggesting the FID check passed initially
- The error occurs during transaction submission, meaning wallet is connected and user is authenticated
- The error "function `<unknown>`" suggests viem couldn't decode the revert reason, but it's definitely one of the custom errors defined in the contract

---

## Files to Review

1. **Contract**: `contracts/src/FarcasturdsV3.sol:123-179` - The mintFor function
2. **Backend Auth**: `app/api/mint/authorize/route.ts:79-103` - Signature generation
3. **Frontend Mint**: `components/MintModal.tsx:217-262` - Transaction submission
4. **FID Check**: `app/api/me/route.ts:92-145` - hasMinted verification
5. **Mint Price**: `app/api/config/mint-price/route.ts` - Price fetching

---

## Environment Variables Checklist

Make sure these are set in your deployment (Vercel):

- ✅ `NEXT_PUBLIC_FARCASTURDS_ADDRESS` = `0x99316cF6D2Ff8051Cd0dDfb2adCB0D23F7Ff3Ac3`
- ✅ `FARCASTURDS_BACKEND_PRIVATE_KEY` = (Private key whose address MUST match contract owner)
- ✅ `BASE_RPC_URL` = Your Base RPC endpoint
- ✅ `NEYNAR_API_KEY` = Your Neynar API key

