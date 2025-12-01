import { http, createConfig, type Address } from 'wagmi'
import { base } from 'wagmi/chains'
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector'

// Wagmi configuration for Farcaster Mini App on Base Mainnet
export const config = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(),
  },
  connectors: [farcasterMiniApp()],
})

// Chain configuration export
export const chains = [base]
export const defaultChain = base

// FIX: Exporting the contract address, which was missing and caused the error.
// NOTE: Replaced with a placeholder address. You must update this with your actual FarcasturdsV3 contract address.
export const FarcasturdsAddress = '0x99316cF6D2Ff8051Cd0dDfb2adCB0D23F7Ff3Ac3' as Address;