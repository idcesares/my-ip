# Quick-Start Implementation Guide

**Ready to build?** Follow these steps to go from zero to working prototype in 2 hours.

---

## Phase 0: Setup (15 minutes)

### 1. Create Next.js Project
```bash
npx create-next-app@latest whatsmyip \
  --typescript \
  --tailwind \
  --app \
  --eslint \
  --src-dir \
  --import-alias "@/*"

cd whatsmyip
```

**Answer prompts:**
- TypeScript: Yes
- ESLint: Yes
- Tailwind CSS: Yes
- `src/` directory: Yes
- App Router: Yes
- Customize import alias: Yes (@/*)

### 2. Install shadcn/ui
```bash
npx shadcn@latest init
```

**Answer prompts:**
- Style: Default
- Base color: Zinc
- CSS variables: Yes

### 3. Add Required Components
```bash
npx shadcn@latest add card button badge tooltip accordion separator toast
```

### 4. Install Additional Dependencies
```bash
npm install zod framer-motion lucide-react @tanstack/react-query
npm install -D @types/node vitest @vitejs/plugin-react
```

### 5. Create Environment File
```bash
touch .env.local
```

Add to `.env.local`:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
ENABLE_GEOLOCATION=false
RATE_LIMIT_ENABLED=false
```

---

## Phase 1: Core IP Detection (30 minutes)

### File 1: Create IP Detection Utility
**Path:** `src/lib/ip-detection.ts`

```typescript
import { headers } from 'next/headers';

export interface IPResult {
  ip: string;
  ipVersion: 'IPv4' | 'IPv6' | 'Unknown';
  source: string;
  isPublic: boolean;
  warnings: string[];
}

export async function detectIP(): Promise<IPResult> {
  const headersList = await headers();
  const warnings: string[] = [];

  // Priority order for proxy headers
  const cfConnectingIP = headersList.get('cf-connecting-ip');
  const xRealIP = headersList.get('x-real-ip');
  const xForwardedFor = headersList.get('x-forwarded-for');
  const forwardedFor = xForwardedFor?.split(',')[0]?.trim();

  let detectedIP = cfConnectingIP || xRealIP || forwardedFor;
  let source = 'proxy';

  if (!detectedIP) {
    // Fallback to connection IP (not available in App Router without middleware)
    detectedIP = '127.0.0.1'; // Will be overridden in production
    source = 'connection';
    warnings.push('Unable to detect IP - ensure proper proxy headers are set');
  }

  // Clean IP (remove port if present)
  detectedIP = detectedIP.split(':').slice(0, -1).join(':') || detectedIP;

  // Detect version
  const ipVersion = detectIPVersion(detectedIP);
  
  // Check if public
  const isPublic = isPublicIP(detectedIP);
  
  if (!isPublic) {
    warnings.push('Private IP detected - you may be behind NAT or a firewall');
  }

  if (forwardedFor) {
    warnings.push('IP detected via proxy header - may not be accurate behind VPN/Tor');
  }

  return {
    ip: detectedIP,
    ipVersion,
    source,
    isPublic,
    warnings,
  };
}

function detectIPVersion(ip: string): 'IPv4' | 'IPv6' | 'Unknown' {
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) return 'IPv4';
  if (/^([0-9a-f]{0,4}:){2,7}[0-9a-f]{0,4}$/i.test(ip)) return 'IPv6';
  return 'Unknown';
}

function isPublicIP(ip: string): boolean {
  // Private IPv4 ranges
  const privateRanges = [
    /^10\./,                    // 10.0.0.0/8
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
    /^192\.168\./,              // 192.168.0.0/16
    /^127\./,                   // 127.0.0.0/8 (loopback)
    /^169\.254\./,              // 169.254.0.0/16 (link-local)
    /^100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\./, // 100.64.0.0/10 (CGNAT)
  ];

  // Private IPv6 ranges
  const privateIPv6Ranges = [
    /^fc00:/i,                  // fc00::/7 (ULA)
    /^fe80:/i,                  // fe80::/10 (link-local)
    /^::1$/,                    // loopback
  ];

  return !privateRanges.some(regex => regex.test(ip)) &&
         !privateIPv6Ranges.some(regex => regex.test(ip));
}
```

### File 2: Create API Route
**Path:** `src/app/api/ip/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { detectIP } from '@/lib/ip-detection';

export async function GET(request: NextRequest) {
  try {
    const result = await detectIP();
    
    const response = {
      ip: result.ip,
      ipVersion: result.ipVersion,
      isPublic: result.isPublic,
      timestamp: new Date().toISOString(),
      warnings: result.warnings,
      request: {
        userAgent: request.headers.get('user-agent') || 'Unknown',
        language: request.headers.get('accept-language')?.split(',')[0] || 'Unknown',
      },
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('IP detection error:', error);
    return NextResponse.json(
      { error: 'Failed to detect IP address' },
      { status: 500 }
    );
  }
}
```

### File 3: Create Type Definitions
**Path:** `src/types/index.ts`

```typescript
export interface IPInfo {
  ip: string;
  ipVersion: 'IPv4' | 'IPv6' | 'Unknown';
  isPublic: boolean;
  timestamp: string;
  warnings: string[];
  request: {
    userAgent: string;
    language: string;
  };
}

export interface BrowserInfo {
  userAgent: string;
  platform: string;
  languages: string[];
  timezone: string;
  screenResolution: string;
  viewportSize: string;
  colorScheme: 'light' | 'dark';
  reducedMotion: boolean;
  touchCapable: boolean;
  online: boolean;
}
```

---

## Phase 2: Basic UI (45 minutes)

### File 4: Create IP Card Component
**Path:** `src/components/ip-card.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Check } from 'lucide-react';
import { IPInfo } from '@/types';

export function IPCard({ data }: { data: IPInfo }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(data.ip);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Your IP Address</span>
          <Badge variant={data.isPublic ? 'default' : 'secondary'}>
            {data.ipVersion}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <code className="text-2xl font-mono font-semibold">
              {data.ip}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="ml-4"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </>
              )}
            </Button>
          </div>

          {data.warnings.length > 0 && (
            <div className="space-y-2">
              {data.warnings.map((warning, idx) => (
                <p key={idx} className="text-sm text-muted-foreground">
                  ⚠️ {warning}
                </p>
              ))}
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            Detected at {new Date(data.timestamp).toLocaleString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### File 5: Create Browser Info Hook
**Path:** `src/hooks/use-browser-info.ts`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { BrowserInfo } from '@/types';

export function useBrowserInfo() {
  const [info, setInfo] = useState<BrowserInfo | null>(null);

  useEffect(() => {
    const browserInfo: BrowserInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      languages: Array.from(navigator.languages),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenResolution: `${window.screen.width}×${window.screen.height}`,
      viewportSize: `${window.innerWidth}×${window.innerHeight}`,
      colorScheme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      touchCapable: navigator.maxTouchPoints > 0,
      online: navigator.onLine,
    };

    setInfo(browserInfo);
  }, []);

  return info;
}
```

### File 6: Update Home Page
**Path:** `src/app/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { IPCard } from '@/components/ip-card';
import { useBrowserInfo } from '@/hooks/use-browser-info';
import { IPInfo } from '@/types';

export default function Home() {
  const [ipInfo, setIPInfo] = useState<IPInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const browserInfo = useBrowserInfo();

  useEffect(() => {
    async function fetchIP() {
      try {
        const response = await fetch('/api/ip');
        const data = await response.json();
        setIPInfo(data);
      } catch (error) {
        console.error('Failed to fetch IP:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchIP();
  }, []);

  return (
    <main className="min-h-screen p-8 bg-gradient-to-b from-background to-muted">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="text-center space-y-2">
          <h1 className="text-4xl font-bold">What's My IP?</h1>
          <p className="text-muted-foreground">
            Quickly see your public IP address and browser info. No tracking.
          </p>
        </header>

        {loading ? (
          <div className="flex justify-center">
            <div className="animate-pulse">Loading...</div>
          </div>
        ) : ipInfo ? (
          <IPCard data={ipInfo} />
        ) : (
          <div className="text-center text-muted-foreground">
            Failed to detect IP address
          </div>
        )}

        {browserInfo && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Browser</h3>
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Platform:</dt>
                  <dd className="font-mono">{browserInfo.platform}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Language:</dt>
                  <dd className="font-mono">{browserInfo.languages[0]}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Timezone:</dt>
                  <dd className="font-mono">{browserInfo.timezone}</dd>
                </div>
              </dl>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Display</h3>
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Screen:</dt>
                  <dd className="font-mono">{browserInfo.screenResolution}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Viewport:</dt>
                  <dd className="font-mono">{browserInfo.viewportSize}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Color scheme:</dt>
                  <dd className="font-mono">{browserInfo.colorScheme}</dd>
                </div>
              </dl>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
```

---

## Phase 3: Test & Run (10 minutes)

### 1. Start Development Server
```bash
npm run dev
```

Open http://localhost:3000

### 2. Test IP Detection
Check that you see:
- ✅ Your IP address displayed
- ✅ IP version badge (IPv4/IPv6)
- ✅ Copy button works
- ✅ Browser info cards show data
- ✅ Warnings display (if behind proxy)

### 3. Test API Endpoint
```bash
curl http://localhost:3000/api/ip
```

Should return JSON like:
```json
{
  "ip": "203.0.113.42",
  "ipVersion": "IPv4",
  "isPublic": true,
  "timestamp": "2026-02-07T14:32:10.123Z",
  "warnings": [],
  "request": {
    "userAgent": "curl/7.81.0",
    "language": "Unknown"
  }
}
```

---

## Phase 4: Add Dark Mode (20 minutes)

### File 7: Create Theme Provider
**Path:** `src/components/theme-provider.tsx`

```typescript
'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
```

### File 8: Create Theme Toggle
**Path:** `src/components/theme-toggle.tsx`

```typescript
'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
```

### File 9: Update Root Layout
**Path:** `src/app/layout.tsx`

```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "What's My IP?",
  description: 'Discover your public IP address and network details. Private, fast, no tracking.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### Install Theme Dependency
```bash
npm install next-themes
```

### Add Theme Toggle to Page
Update `src/app/page.tsx` to include `<ThemeToggle />` in the header.

---

## Phase 5: Deploy to Vercel (10 minutes)

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit: What's My IP MVP"
git branch -M main
git remote add origin https://github.com/yourusername/whatsmyip.git
git push -u origin main
```

### 2. Deploy to Vercel
```bash
npm install -g vercel
vercel
```

Follow prompts:
- Link to existing project? No
- Project name: whatsmyip
- Directory: ./
- Override settings? No

### 3. Set Environment Variables
In Vercel dashboard:
- Go to Settings → Environment Variables
- Add: `ENABLE_GEOLOCATION=false`

### 4. Test Production
Visit your deployed URL (e.g., `https://whatsmyip.vercel.app`)

---

## Next Steps (Phase 2+)

Now that you have a working MVP, add:

1. **Export Feature** (30 min)
   - Add "Export JSON" button
   - Implement file download

2. **History Panel** (1 hour)
   - localStorage integration
   - Table component from shadcn/ui

3. **Geolocation** (2 hours)
   - MaxMind GeoLite2 integration
   - City/Country display

4. **Advanced Diagnostics** (2 hours)
   - Network Information API
   - Connection quality metrics

5. **Testing** (3 hours)
   - Vitest unit tests
   - Playwright E2E tests

6. **Polish** (ongoing)
   - Animations with Framer Motion
   - Accessibility audit
   - Performance optimization

---

## Troubleshooting

### IP shows as 127.0.0.1 or ::1
- **Cause:** Running locally without proxy headers
- **Fix:** Test on Vercel or add test headers in middleware

### Dark mode flashing
- **Cause:** Hydration mismatch
- **Fix:** Already handled with `suppressHydrationWarning` in layout

### Copy button not working
- **Cause:** HTTPS required for clipboard API
- **Fix:** Use localhost (allowed) or deploy to Vercel

### TypeScript errors
- **Cause:** Missing types
- **Fix:** `npm install -D @types/node @types/react`

---

## File Structure After Phase 1-4

```
whatsmyip/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── ip/
│   │   │       └── route.ts
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/          (shadcn components)
│   │   ├── ip-card.tsx
│   │   ├── theme-provider.tsx
│   │   └── theme-toggle.tsx
│   ├── hooks/
│   │   └── use-browser-info.ts
│   ├── lib/
│   │   ├── ip-detection.ts
│   │   └── utils.ts     (shadcn util)
│   └── types/
│       └── index.ts
├── public/
├── .env.local
├── .eslintrc.json
├── .gitignore
├── components.json      (shadcn config)
├── next.config.js
├── package.json
├── postcss.config.js
├── README.md
├── tailwind.config.ts
└── tsconfig.json
```

---

## Success Checklist

After following this guide, you should have:

- ✅ Working Next.js 15 app with TypeScript
- ✅ IP detection API endpoint (`/api/ip`)
- ✅ Modern UI with Tailwind + shadcn/ui
- ✅ Dark/light mode toggle
- ✅ Copy to clipboard functionality
- ✅ Browser diagnostics display
- ✅ Deployed to Vercel
- ✅ Zero TypeScript errors
- ✅ Mobile responsive
- ✅ 2-hour time investment

**Estimated time to MVP:** 2 hours  
**Estimated time to production-ready:** 2 weeks (following full spec)

---

**Ready to ship? 🚀** You now have a solid foundation to build upon!
