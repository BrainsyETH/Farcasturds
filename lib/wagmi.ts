// lib/wagmi.ts
import { http, createConfig } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector'

// Wagmi configuration for Farcaster Mini App
export const config = createConfig({
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http(),
  },
  connectors: [farcasterMiniApp()],
})

// Chain configuration export
export const chains = [baseSepolia]
export const defaultChain = baseSepolia
