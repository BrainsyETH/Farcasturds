// abi/Farcasturds.ts
export const farcasturdsAbi = [
  {
    type: "constructor",
    inputs: [
      { name: "_minter", type: "address", internalType: "address" },
      { name: "baseURI_", type: "string", internalType: "string" }
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
    stateMutability: "nonpayable"
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
    name: "minter",
    inputs: [],
    outputs: [
      { name: "", type: "address", internalType: "address" }
    ],
    stateMutability: "view"
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
    type: "event",
    name: "FarcasturdMinted",
    inputs: [
      { name: "fid", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "to", type: "address", indexed: true, internalType: "address" }
    ],
    anonymous: false
  }
] as const;