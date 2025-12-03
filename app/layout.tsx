import { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/Providers'

export const metadata: Metadata = {
  title: 'Farcasturds',
  description: 'Pumps, but mostly dumps.',
  icons: {
    icon: '/icons/icon.png',
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://farcasturds.vercel.app'),
  openGraph: {
    title: 'Farcasturds',
    description: 'Your Number Two on Base',
    images: ['/icons/preview.png'],
  },
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
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}