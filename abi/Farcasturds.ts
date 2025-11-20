// abi/Farcasturds.ts
export const farcasturdsAbi = [
  {
    type: "constructor",
    inputs: [
      { name: "_minter", type: "address", internalType: "address" },
      { name: "baseURI_", type: "string", internalType: "string" },
      { name: "_mintPrice", type: "uint256", internalType: "uint256" }
    ],
    stateMutability: "nonpayable"
  },
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
    name: "mintPrice",
    inputs: [],
    outputs: [
      { name: "", type: "uint256", internalType: "uint256" }
    ],
    stateMutability: "view"
  },
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
    name: "minter",
    inputs: [],
    outputs: [
      { name: "", type: "address", internalType: "address" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "setMinter",
    inputs: [
      { name: "newMinter", type: "address", internalType: "address" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
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
    name: "totalSupply",
    inputs: [],
    outputs: [
      { name: "", type: "uint256", internalType: "uint256" }
    ],
    stateMutability: "view"
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
    name: "setBaseURI",
    inputs: [
      { name: "baseURI_", type: "string", internalType: "string" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
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
    name: "MinterUpdated",
    inputs: [
      { name: "oldMinter", type: "address", indexed: true, internalType: "address" },
      { name: "newMinter", type: "address", indexed: true, internalType: "address" }
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