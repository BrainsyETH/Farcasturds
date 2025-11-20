import { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/Providers'

export const metadata: Metadata = {
  title: 'Farcasturds',
  description: 'Pumps, but mostly dumps.',
  icons: {
    icon: '/icons/icon.png',
  },
  openGraph: {
    title: 'Farcasturds',
    description: 'Your Number Two on Base',
    images: ['/icons/preview.png'],
  },
  other: {
    // Farcaster Mini App metadata
    'fc:miniapp': JSON.stringify({
      version: "1",
      imageUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://farcasturds.vercel.app'}/icons/preview.png`,
      button: {
        title: "💩 Mint a Turd",
        action: {
          type: "launch_frame",
          name: "Farcasturds",
          url: process.env.NEXT_PUBLIC_BASE_URL || "https://farcasturds.vercel.app",
          splashImageUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://farcasturds.vercel.app'}/icons/splash.png`,
          splashBackgroundColor: "#6938c7"
        }
      }
    }),
    // Backward compatibility
    'fc:frame': JSON.stringify({
      version: "1",
      imageUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://farcasturds.vercel.app'}/icons/preview.png`,
      button: {
        title: "💩 Mint a Turd",
        action: {
          type: "launch_frame",
          name: "Farcasturds",
          url: process.env.NEXT_PUBLIC_BASE_URL || "https://farcasturds.vercel.app",
          splashImageUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://farcasturds.vercel.app'}/icons/splash.png`,
          splashBackgroundColor: "#6938c7"
        }
      }
    })
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Add */}
      </head>
      <body>
        {/* Splash screen that shows until app loads */}
        <div id="splash-screen" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: '#6938c7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          transition: 'opacity 0.3s ease-out'
        }}>
          <img
            src="/icons/splash.png"
            alt="Farcasturds"
            style={{
              maxWidth: '90%',
              maxHeight: '90%',
              objectFit: 'contain'
            }}
          />
        </div>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}