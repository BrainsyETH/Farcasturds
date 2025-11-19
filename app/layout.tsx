import { Metadata } from 'next'
import './globals.css' // Adjust this import based on your actual CSS file

export const metadata: Metadata = {
  title: 'Farcasturd',
  description: 'The ultimate Farcaster Mini App experience',
  icons: {
    icon: '/icon.png',
  },
  openGraph: {
    title: 'Farcasturd',
    description: 'Play now on Farcaster',
    images: ['/preview.png'],
  },
  other: {
    // Farcaster Mini App metadata
    'fc:miniapp': JSON.stringify({
      version: "1",
      imageUrl: "https://farcasturds.vercel.app/preview.png",
      button: {
        title: "🎮 Play",
        action: {
          type: "launch_frame",
          name: "Farcasturd",
          url: "https://farcasturds.vercel.app",
          splashImageUrl: "https://farcasturds.vercel.app/splash.png",
          splashBackgroundColor: "#1a1a1a"
        }
      }
    }),
    // Backward compatibility
    'fc:frame': JSON.stringify({
      version: "1",
      imageUrl: "https://farcasturds.vercel.app/preview.png",
      button: {
        title: "🎮 Play",
        action: {
          type: "launch_frame",
          name: "Farcasturd",
          url: "https://farcasturds.vercel.app",
          splashImageUrl: "https://farcasturds.vercel.app/splash.png",
          splashBackgroundColor: "#1a1a1a"
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
        {/* Add any additional head elements here */}
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}