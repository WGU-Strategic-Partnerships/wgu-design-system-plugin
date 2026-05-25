# Stack

## The stack

WGU.tools and MBR Builder are built on Next.js 16 App Router + React 19 + TypeScript + Tailwind v4 + `@supabase/ssr` + Lucide icons. There is no shadcn/ui — components live in `src/components/` directly; reusable design primitives are gathered in `src/components/ui/` (see [design-primitives.md](./design-primitives.md)). There is no CSS-in-JS (plain utility classes + CSS variables only) and no client-side state management library (Server Components + form actions carry the load instead).

## Pinned versions

The pinned dependency set, excerpted from `package.json` (other top-level fields like `name`, `version`, `scripts` omitted):

<!-- /Users/bentley/Documents/Claude/Projects/wgu-tools/package.json -->
```json
  "dependencies": {
    "@supabase/ssr": "^0.10.2",
    "@supabase/supabase-js": "^2.105.1",
    "lucide-react": "^1.14.0",
    "next": "16.2.4",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "server-only": "^0.0.1"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.2.4",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
```

## Directory layout

```
src/
  app/          (App Router pages + API routes)
  components/   (shared React components; optional ui/ subdirectory holds reusable primitives — lifted from MBR Builder, see design-primitives.md)
  lib/          (server-only helpers, supabase clients, auth, master-roster)
```

## next.config.ts

<!-- /Users/bentley/Documents/Claude/Projects/wgu-tools/next.config.ts -->
```ts
import type { NextConfig } from 'next'

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
]

const nextConfig: NextConfig = {
  experimental: {
    // Avatar uploads are capped at 2 MB; the default 1 MB Server Actions
    // body limit would reject them once multipart overhead is added.
    serverActions: { bodySizeLimit: '4mb' },
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
}

export default nextConfig
```

## postcss.config.mjs

<!-- /Users/bentley/Documents/Claude/Projects/wgu-tools/postcss.config.mjs -->
```mjs
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}

export default config
```

## tsconfig.json

<!-- /Users/bentley/Documents/Claude/Projects/wgu-tools/tsconfig.json -->
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": [
      "dom",
      "dom.iterable",
      "esnext"
    ],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": [
        "./src/*"
      ]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts"
  ],
  "exclude": [
    "node_modules"
  ]
}
```

## Root layout + font wiring

<!-- /Users/bentley/Documents/Claude/Projects/wgu-tools/src/app/layout.tsx -->
```tsx
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
  title: 'WGU.tools — Strategic Partnerships',
  description: 'One place for every WGU Strategic Partnerships tool.',
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
```

Jost is the free Google Fonts substitute for WGU's licensed Futura PT typeface, loaded here as the `--font-display` CSS variable. Tailwind picks it up via the `font-display` utility class defined in `globals.css`, which is maintained in the sibling `wgu-design` skill. To swap in real Futura PT, add a woff2 to `public/` and a matching `@font-face` block in `globals.css`.

## Why these choices

Next.js 16 + React 19 Server Components are the default so that client-side JavaScript stays minimal — data fetching and mutations happen on the server via Server Actions, and only interactive islands ship JS to the browser. Tailwind v4 uses native CSS variables for its design tokens, which aligns naturally with the WGU token system (all tokens are CSS custom properties) and eliminates any build-time theme compilation step. Supabase SSR is the only auth library considered because the WGU.tools canon is Google SSO backed by a Postgres database — `@supabase/ssr` handles cookie-based session management across Server Components, Route Handlers, and Middleware without additional wrappers.

---

See also: [auth.md](./auth.md) for the Supabase auth flow, [deploy.md](./deploy.md) for env vars, [design-primitives.md](./design-primitives.md) for the `src/components/ui/` parts.
