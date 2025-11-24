// NOTE: This ABI must be generated after compiling FarcasturdsV3.sol
// Run: forge build
// Then extract ABI from: contracts/out/FarcasturdsV3.sol/FarcasturdsV3.json

export const farcasturdsV3Abi = [
  // TODO: Replace with actual ABI after compilation
  // This is a placeholder to prevent TypeScript errors
  {
    type: 'function',
    name: 'mintFor',
    stateMutability: 'payable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'fid', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
      { name: 'signature', type: 'bytes' }
    ],
    outputs: []
  },
  {
    type: 'function',
    name: 'hasMinted',
    stateMutability: 'view',
    inputs: [{ name: 'fid', type: 'uint256' }],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    type: 'function',
    name: 'ownerOfFid',
    stateMutability: 'view',
    inputs: [{ name: 'fid', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }]
  },
  {
    type: 'function',
    name: 'mintPrice',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    type: 'function',
    name: 'treasury',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }]
  },
  {
    type: 'function',
    name: 'totalSupply',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    type: 'function',
    name: 'verifyAuthorization',
    stateMutability: 'view',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'fid', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
      { name: 'signature', type: 'bytes' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    type: 'error',
    name: 'AlreadyMinted',
    inputs: []
  },
  {
    type: 'error',
    name: 'InsufficientPayment',
    inputs: []
  },
  {
    type: 'error',
    name: 'InvalidFID',
    inputs: []
  },
  {
    type: 'error',
    name: 'InvalidSignature',
    inputs: []
  },
  {
    type: 'error',
    name: 'SignatureExpired',
    inputs: []
  },
  {
    type: 'error',
    name: 'NonTransferable',
    inputs: []
  },
  {
    type: 'event',
    name: 'FarcasturdMinted',
    inputs: [
      { name: 'fid', type: 'uint256', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'tokenId', type: 'uint256', indexed: false }
    ]
  },
  {
    type: 'event',
    name: 'PaymentForwarded',
    inputs: [
      { name: 'treasury', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false }
    ]
  }
] as const
