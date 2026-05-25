import type { Metadata } from 'next'
import { Jost } from 'next/font/google'
import './globals.css'

/**
 * WGU's primary typeface is Futura PT (licensed). Jost is the closest free
 * geometric-sans substitute and is the approved stand-in in the WGU Design
 * System. Swap to real Futura PT in production by adding a woff2 to public/
 * and a matching @font-face block in globals.css.
 */
const jost = Jost({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['300', '400', '500', '700', '800', '900'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: '__APP_NAME__',
  description: '__APP_NAME__ — internal tool.',
  icons: {
    icon: '/owl-blue.png',
    apple: '/owl-blue.png',
  },
}

export const viewport = {
  themeColor: '#002855',
  colorScheme: 'light' as const,
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${jost.variable} h-full antialiased`}>
      <body>{children}</body>
    </html>
  )
}
