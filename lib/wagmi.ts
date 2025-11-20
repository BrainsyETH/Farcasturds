// lib/wagmi.ts
import { http, createConfig } from 'wagmi'
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
