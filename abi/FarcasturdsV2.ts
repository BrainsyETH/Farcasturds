// abi/FarcasturdsV2.ts
// ABI for FarcasturdsV2 - Production contract with user-paid minting
export const farcasturdsV2Abi = [
  // Constructor
  {
    type: "constructor",
    inputs: [
      { name: "baseURI_", type: "string", internalType: "string" },
      { name: "_mintPrice", type: "uint256", internalType: "uint256" }
    ],
    stateMutability: "nonpayable"
  },

  // Errors
  {
    type: "error",
    name: "AlreadyMinted",
    inputs: []
  },
  {
    type: "error",
    name: "InsufficientPayment",
    inputs: []
  },
  {
    type: "error",
    name: "InvalidFID",
    inputs: []
  },
  {
    type: "error",
    name: "InvalidPrice",
    inputs: []
  },
  {
    type: "error",
    name: "TransferFailed",
    inputs: []
  },
  {
    type: "error",
    name: "NonTransferable",
    inputs: []
  },

  // Main Functions
  {
    type: "function",
    name: "mintFor",
    inputs: [
      { name: "to", type: "address", internalType: "address" },
      { name: "fid", type: "uint256", internalType: "uint256" }
    ],
    outputs: [],
    stateMutability: "payable"
  },

  // View Functions
  {
    type: "function",
    name: "hasMinted",
    inputs: [
      { name: "fid", type: "uint256", internalType: "uint256" }
    ],
    outputs: [
      { name: "", type: "bool", internalType: "bool" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "ownerOfFid",
    inputs: [
      { name: "fid", type: "uint256", internalType: "uint256" }
    ],
    outputs: [
      { name: "", type: "address", internalType: "address" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "mintPrice",
    inputs: [],
    outputs: [
      { name: "", type: "uint256", internalType: "uint256" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "totalSupply",
    inputs: [],
    outputs: [
      { name: "", type: "uint256", internalType: "uint256" }
    ],
    stateMutability: "view"
  },

  // Owner Functions
  {
    type: "function",
    name: "setMintPrice",
    inputs: [
      { name: "newPrice", type: "uint256", internalType: "uint256" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "setBaseURI",
    inputs: [
      { name: "baseURI_", type: "string", internalType: "string" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "pause",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "unpause",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "withdraw",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "withdrawTo",
    inputs: [
      { name: "to", type: "address", internalType: "address payable" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },

  // ERC721 Standard Functions
  {
    type: "function",
    name: "ownerOf",
    inputs: [
      { name: "tokenId", type: "uint256", internalType: "uint256" }
    ],
    outputs: [
      { name: "", type: "address", internalType: "address" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [
      { name: "owner", type: "address", internalType: "address" }
    ],
    outputs: [
      { name: "", type: "uint256", internalType: "uint256" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "tokenURI",
    inputs: [
      { name: "tokenId", type: "uint256", internalType: "uint256" }
    ],
    outputs: [
      { name: "", type: "string", internalType: "string" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "name",
    inputs: [],
    outputs: [
      { name: "", type: "string", internalType: "string" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "symbol",
    inputs: [],
    outputs: [
      { name: "", type: "string", internalType: "string" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [
      { name: "", type: "address", internalType: "address" }
    ],
    stateMutability: "view"
  },

  // Disabled transfer functions (will revert)
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "", type: "address", internalType: "address" },
      { name: "", type: "uint256", internalType: "uint256" }
    ],
    outputs: [],
    stateMutability: "pure"
  },
  {
    type: "function",
    name: "setApprovalForAll",
    inputs: [
      { name: "", type: "address", internalType: "address" },
      { name: "", type: "bool", internalType: "bool" }
    ],
    outputs: [],
    stateMutability: "pure"
  },

  // Events
  {
    type: "event",
    name: "FarcasturdMinted",
    inputs: [
      { name: "fid", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "to", type: "address", indexed: true, internalType: "address" },
      { name: "tokenId", type: "uint256", indexed: false, internalType: "uint256" }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "MintPriceUpdated",
    inputs: [
      { name: "oldPrice", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "newPrice", type: "uint256", indexed: false, internalType: "uint256" }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "Withdrawal",
    inputs: [
      { name: "to", type: "address", indexed: true, internalType: "address" },
      { name: "amount", type: "uint256", indexed: false, internalType: "uint256" }
    ],
    anonymous: false
  }
] as const;
