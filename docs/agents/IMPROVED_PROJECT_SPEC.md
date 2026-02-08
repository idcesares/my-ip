# "What's My IP" — Modern Production-Ready Specification v2.0

**Last updated:** February 2026

## Executive Summary
Build a lightning-fast, privacy-first "What's My IP" web application that displays visitor IP addresses (IPv4/IPv6) plus comprehensive browser/network diagnostics. Production-ready with enterprise-grade code quality, accessibility, and zero tracking.

---

## 1. Tech Stack (Locked & Modern)

### Core Framework
- **Next.js 15.1+** with App Router (React 19+)
- **TypeScript 5.3+** (strict mode)
- **Node.js 20+ LTS**

### Styling & UI
- **Tailwind CSS 4.0+** with CSS variables for theming
- **shadcn/ui** components (copy-paste, customizable)
- **Framer Motion** for animations (respecting reduced-motion)
- **Lucide React** for icons

### Data & API
- **Next.js Route Handlers** for serverless API endpoints
- **Zod** for runtime validation
- **SWR** or **TanStack Query** for client-side data fetching

### Development
- **ESLint** + **Prettier** (configured)
- **Vitest** or **Jest** for unit tests
- **Playwright** for E2E tests (optional but recommended)
- **Husky** + **lint-staged** for pre-commit hooks

### Deployment Targets
- **Vercel** (primary, zero-config)
- **Cloudflare Pages** (alternative)
- **Docker** support for self-hosting

---

## 2. Core Features (Must-Have)

### 2.1 IP Detection (Server-Side)
Display hierarchy:
1. **Primary IP Card** — The "preferred" IP (what the server sees)
2. **IPv4 Address** — Explicitly detected IPv4 (if different/available)
3. **IPv6 Address** — Explicitly detected IPv6 (if different/available)

**Backend Logic:**
```
1. Extract from Next.js request headers/connection
2. Check proxy headers in order:
   - CF-Connecting-IP (Cloudflare)
   - X-Real-IP (nginx)
   - X-Forwarded-For (leftmost public IP, validated)
   - Fallback to socket IP
3. Validate: reject private/reserved IPs for "public" display
   - Show warning if IP is private (10.x, 192.168.x, etc.)
4. Detect version: IPv4 vs IPv6 (regex + parsing)
5. Strip port numbers (if present)
6. Return structured JSON
```

**IP Validation:**
- Whitelist public IP ranges
- Flag special addresses (loopback, link-local, documentation IPs)
- Detect CGNAT ranges (100.64.0.0/10)

### 2.2 Geolocation & ISP (Enhanced)
**Option A (Privacy-first, no third-party):**
- Include embedded GeoLite2 City database (MaxMind)
- Server-side lookup: City, Country, Coordinates, Timezone
- No external API calls

**Option B (API-based, privacy disclosure):**
- Optional client-side call to ipapi.co or ip-api.com
- Require user click "Show Location" (not automatic)
- Display: ISP, Organization, AS Number, Country, City, Lat/Long
- Privacy note: "This lookup sends your IP to a third-party service"

**Recommendation:** Implement Option A by default, Option B as opt-in.

### 2.3 Browser Diagnostics (Client-Side)
**Network Info:**
- Connection type (navigator.connection.effectiveType)
- Downlink speed estimate
- RTT (round-trip time)
- Data saver mode
- Online/offline status

**Browser Info:**
- User-Agent (raw + parsed via UA-CH API if available)
- Viewport dimensions (width × height)
- Screen resolution + pixel ratio
- Available screen (accounting for OS toolbars)
- Color depth
- GPU renderer (WebGL, no fingerprinting)
- Installed fonts count (no enumeration, just count)

**Privacy & Preferences:**
- Preferred language(s)
- Timezone (Intl API)
- Color scheme (dark/light/auto)
- Reduced motion preference
- High contrast mode
- Touch capability (maxTouchPoints > 0)
- Cookie enabled status

**Security Capabilities:**
- HTTPS/HTTP protocol
- Do Not Track status
- Referrer policy
- Permissions API status (notifications, geolocation - without requesting)

**Explicitly NOT included (privacy):**
- WebRTC local IP enumeration (privacy risk)
- Canvas/Audio fingerprinting
- Installed plugin list
- Precise battery level
- Detailed font list

### 2.4 DNS & Network Tools (Stretch)
- **DNS Resolver Detection**: Use DNS-over-HTTPS query to known test domains
  - Query: whoami.akamai.net via 1.1.1.1 or 8.8.8.8
  - Display detected resolver IP
  - Explain limitations (not always accurate behind proxies)
- **Traceroute Visualization**: Not feasible client-side (skip or note as impossible)

### 2.5 Interactive Features
**Copy Actions:**
- Copy IPv4 (button)
- Copy IPv6 (button)
- Copy all as JSON (pretty-printed)
- Copy all as plain text (formatted)
- Toast notification: "Copied IPv4 to clipboard!" (3s duration)

**Share Functionality:**
- Use Web Share API if available
- Fallback: Copy shareable URL with encoded data (optional)
- Share text: "My IP: [IP] | Browser: [UA] | Location: [City]"

**Export:**
- Download JSON file: `ip-info-YYYY-MM-DD-HHmmss.json`
- Download TXT file with formatted report

**History (localStorage):**
- Store last 10 checks (IP, timestamp, location)
- Table view with "View Details" action
- "Clear History" button
- Respects user privacy (no server sync)

### 2.6 JSON API Endpoint
**Endpoint:** `GET /api/ip`

**Query Parameters:**
- `?format=json` (default)
- `?format=text` (plain text response)
- `?include=geo` (include geolocation, requires opt-in)

**Response Schema (JSON):**
```json
{
  "ip": "203.0.113.42",
  "ipVersion": "IPv4",
  "ipv4": "203.0.113.42",
  "ipv6": null,
  "isPublic": true,
  "isVPN": null,
  "timestamp": "2026-02-07T14:32:10.123Z",
  "location": {
    "city": "San Francisco",
    "region": "California",
    "country": "US",
    "timezone": "America/Los_Angeles",
    "coordinates": {
      "latitude": 37.7749,
      "longitude": -122.4194
    }
  },
  "isp": {
    "name": "Example ISP Inc.",
    "asn": "AS12345",
    "organization": "Example Org"
  },
  "request": {
    "userAgent": "Mozilla/5.0...",
    "language": "en-US",
    "headers": {
      "cf-ray": "...",
      "cf-ipcountry": "US"
    }
  },
  "warnings": [
    "IP detected via proxy header (X-Forwarded-For)",
    "May not be accurate behind VPN/Tor"
  ]
}
```

**Response Schema (Text):**
```
Your IP Address: 203.0.113.42 (IPv4)
Location: San Francisco, California, US
ISP: Example ISP Inc. (AS12345)
Timestamp: 2026-02-07 14:32:10 UTC
```

**Rate Limiting:**
- 60 requests/minute per IP (Redis or in-memory)
- Return 429 with Retry-After header
- Display warning in UI when rate limited

---

## 3. UI/UX Design System

### 3.1 Layout Architecture
```
┌─────────────────────────────────────────┐
│  Header: Logo + Theme Toggle + API Btn  │
├─────────────────────────────────────────┤
│  Hero Section                            │
│  ┌───────────────────────────────────┐  │
│  │  "What's My IP?"                  │  │
│  │  "No tracking. Privacy-first."    │  │
│  └───────────────────────────────────┘  │
├─────────────────────────────────────────┤
│  Main IP Card (Prominent)               │
│  ┌───────────────────────────────────┐  │
│  │  📍 Your IP Address                │  │
│  │  203.0.113.42 (IPv4)   [Copy]     │  │
│  │  Detected from: Direct connection  │  │
│  └───────────────────────────────────┘  │
├──────────────┬──────────────────────────┤
│  IPv4 Card   │  IPv6 Card               │
│  (if dual)   │  (if dual)               │
├──────────────┴──────────────────────────┤
│  Info Grid (2-3 columns on desktop)     │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐  │
│  │ Network │ │ Browser │ │ Location │  │
│  │  Info   │ │  Info   │ │   Info   │  │
│  └─────────┘ └─────────┘ └──────────┘  │
├─────────────────────────────────────────┤
│  Actions: [Share] [Export] [Refresh]    │
├─────────────────────────────────────────┤
│  History Panel (collapsible)            │
├─────────────────────────────────────────┤
│  Privacy Accordion                       │
├─────────────────────────────────────────┤
│  Footer: About + GitHub + Docs          │
└─────────────────────────────────────────┘
```

### 3.2 Design Tokens
**Colors (HSL variables):**
- Primary: Blue (212° 100% 50%)
- Success: Green (142° 71% 45%)
- Warning: Orange (38° 92% 50%)
- Error: Red (0° 84% 60%)
- Neutral: Zinc scale

**Typography:**
- Font: Inter (variable) or Geist
- Headings: 600 weight
- Body: 400 weight
- Mono: Fira Code or Geist Mono

**Spacing:** 4px base unit (Tailwind default)

**Shadows:**
- sm: subtle (cards)
- md: medium (hover states)
- lg: prominent (modals)

**Border Radius:**
- Default: 0.5rem (8px)
- Large: 1rem (16px)

### 3.3 Component Library (shadcn/ui)
**Required components:**
- Card
- Button
- Badge
- Tooltip
- Accordion
- Table
- Tabs
- Toast/Sonner
- Separator
- Skeleton (loading states)

**Custom components:**
- IPAddressCard
- InfoGrid
- CopyButton (with animation)
- ThemeToggle
- HistoryTable

### 3.4 Responsive Breakpoints
- Mobile: < 640px (single column)
- Tablet: 640px - 1024px (2 columns)
- Desktop: > 1024px (3 columns)
- Wide: > 1536px (max-width container)

### 3.5 Dark Mode
- System preference default
- Manual toggle (persisted in localStorage)
- Smooth transition (200ms)
- All components fully themed
- High contrast support

### 3.6 Animations & Interactions
**Respect `prefers-reduced-motion`:**
- If enabled: disable all animations
- If not: use subtle transitions

**Animations:**
- Fade-in on mount (200ms)
- Copy button: scale + checkmark morph
- Card hover: subtle lift (2px translate)
- Skeleton loading: pulse
- Number changes: count-up animation

**Loading States:**
- Skeleton UI for IP card (no spinners)
- Progressive enhancement (show cached data first)

---

## 4. Privacy & Security (Non-Negotiable)

### 4.1 Privacy Commitments
**What we DO:**
- Display IP address sent to you by the server
- Compute browser info locally in your browser
- Store history in your browser only (localStorage)
- Provide JSON API for programmatic access

**What we DON'T:**
- Log IP addresses server-side (beyond standard HTTP logs)
- Use analytics (no Google Analytics, Plausible, etc.)
- Use third-party trackers
- Store data in databases
- Share data with anyone
- Fingerprint users for tracking

**Transparency:**
- Full privacy policy in accordion
- Open-source codebase (GitHub link)
- Explain each data point source (client vs server)

### 4.2 Security Headers
**Next.js middleware to set:**
```http
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

### 4.3 Input Validation
- Sanitize all header values (prevent XSS)
- Validate IP addresses (regex + parsing)
- Rate limit API endpoint
- No user input stored server-side

### 4.4 Dependency Security
- Monthly `npm audit` checks
- Snyk integration (optional)
- No unmaintained packages
- Minimal dependency tree

---

## 5. Technical Requirements

### 5.1 Performance Targets
**Lighthouse Score:** 95+ in all categories
- Performance: 95+
- Accessibility: 100
- Best Practices: 100
- SEO: 95+

**Core Web Vitals:**
- LCP (Largest Contentful Paint): < 1.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1
- TTFB (Time to First Byte): < 600ms

**Bundle Size:**
- Initial JS: < 100KB (gzipped)
- First Load JS: < 200KB
- CSS: < 20KB (gzipped)

### 5.2 Accessibility (WCAG 2.2 AA)
- Semantic HTML5
- ARIA labels on all interactive elements
- Keyboard navigation (focus visible)
- Screen reader tested
- Color contrast ratio: 4.5:1 minimum
- Skip to main content link
- Reduced motion respected
- Font scaling support (up to 200%)

### 5.3 Browser Support
- Chrome/Edge: last 2 versions
- Firefox: last 2 versions
- Safari: last 2 versions
- Mobile browsers: iOS 15+, Android 10+
- Graceful degradation for older browsers

### 5.4 IP Detection Logic (Detailed)
```typescript
// Pseudo-code for IP extraction
function extractIP(request: NextRequest): IPResult {
  const headers = request.headers;
  
  // Priority order for proxy headers
  const candidates = [
    headers.get('cf-connecting-ip'),      // Cloudflare
    headers.get('x-real-ip'),             // Nginx
    headers.get('x-forwarded-for')?.split(',')[0]?.trim(), // Standard proxy
    request.socket.remoteAddress,         // Direct connection
  ].filter(Boolean);
  
  for (const ip of candidates) {
    const parsed = parseIP(ip);
    
    if (parsed && isPublicIP(parsed)) {
      return {
        ip: parsed.address,
        version: parsed.version,
        source: parsed.source,
        isPublic: true,
      };
    }
  }
  
  // Fallback to connection IP even if private
  return {
    ip: request.socket.remoteAddress,
    version: detectVersion(request.socket.remoteAddress),
    source: 'connection',
    isPublic: false,
    warning: 'Private IP detected - you may be behind NAT/proxy',
  };
}

function isPublicIP(ip: string): boolean {
  // Reject private ranges:
  // - 10.0.0.0/8
  // - 172.16.0.0/12
  // - 192.168.0.0/16
  // - 127.0.0.0/8 (loopback)
  // - 169.254.0.0/16 (link-local)
  // - 100.64.0.0/10 (CGNAT)
  // - fc00::/7 (IPv6 ULA)
  // - fe80::/10 (IPv6 link-local)
}
```

### 5.5 Environment Variables
```env
# Required
NEXT_PUBLIC_APP_URL=https://whatsmyip.example.com

# Optional
ENABLE_GEOLOCATION=true
GEOLOCATION_PROVIDER=maxmind|ipapi
MAXMIND_LICENSE_KEY=xxx
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX_REQUESTS=60
```

### 5.6 Error Handling
- Graceful degradation (show partial data if API fails)
- User-friendly error messages
- Error boundary for React components
- API error responses with helpful messages
- Retry logic for transient failures

---

## 6. Documentation Requirements

### 6.1 README.md Sections
1. **Overview** - What the app does
2. **Features** - Bullet list with screenshots
3. **Tech Stack** - Links to technologies used
4. **Getting Started** - Local development setup
5. **Deployment** - Vercel, Cloudflare, Docker
6. **API Documentation** - Endpoint usage
7. **Privacy** - What data is collected/not collected
8. **Contributing** - How to contribute
9. **License** - MIT or similar

### 6.2 Code Documentation
- JSDoc comments on all functions
- Type definitions for all data structures
- Inline comments for complex logic
- Component prop types documented

### 6.3 API Documentation
- OpenAPI/Swagger spec (optional)
- Example requests/responses
- Error codes explained
- Rate limiting details

---

## 7. Testing Strategy

### 7.1 Unit Tests (Vitest)
- IP parsing logic
- Validation functions
- Utility functions
- Component props validation

### 7.2 Integration Tests
- API endpoint responses
- IP detection with mocked headers
- Geolocation lookup

### 7.3 E2E Tests (Playwright, optional)
- Full user flow: visit → see IP → copy → export
- Mobile viewport testing
- Dark mode toggle
- Accessibility audit

### 7.4 Manual Testing Checklist
- [ ] IPv4 detection
- [ ] IPv6 detection
- [ ] Dual-stack detection
- [ ] Behind proxy (X-Forwarded-For)
- [ ] Behind Cloudflare
- [ ] VPN detection (if applicable)
- [ ] Copy buttons work
- [ ] Dark mode toggle
- [ ] Export JSON
- [ ] History panel
- [ ] Mobile responsive
- [ ] Keyboard navigation
- [ ] Screen reader
- [ ] Reduced motion
- [ ] Rate limiting

---

## 8. Deployment

### 8.1 Vercel (Recommended)
```bash
npm install -g vercel
vercel --prod
```
- Auto SSL
- Edge functions
- Analytics (optional)
- Zero config

### 8.2 Cloudflare Pages
- Build command: `npm run build`
- Output directory: `.next`
- Environment variables: Set in dashboard
- Edge runtime compatible

### 8.3 Docker (Self-Hosted)
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### 8.4 Reverse Proxy Configuration
**Nginx example:**
```nginx
location / {
  proxy_pass http://localhost:3000;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
}
```

---

## 9. Limitations & Warnings

### 9.1 Known Limitations
1. **VPN/Proxy**: Shows VPN exit IP, not true ISP IP
2. **Tor**: Shows exit node IP
3. **Corporate Proxy**: May show proxy IP instead of public IP
4. **CGNAT**: Shared IP addresses (100.64.x.x range)
5. **IPv6 Privacy Extensions**: May show temporary address
6. **iCloud Private Relay**: Shows Apple relay IP
7. **DNS Resolver**: Not 100% accurate behind some proxies
8. **Geolocation**: City-level accuracy only (±50km)

### 9.2 User Warnings (Display in UI)
- "Your IP may differ if using VPN, Tor, or proxy services"
- "Geolocation is approximate and based on ISP data"
- "Private IP detected - you're behind NAT/firewall"
- "IPv6 not detected - your ISP may not support it yet"

---

## 10. Stretch Goals (Phase 2)

### 10.1 Advanced Features
- [ ] **Speed Test**: Integrated bandwidth test (optional)
- [ ] **Blacklist Check**: Check if IP is in spam databases (RBL lookup)
- [ ] **Port Scanner**: Scan common ports (client-side via service workers)
- [ ] **WHOIS Lookup**: Display IP allocation info
- [ ] **Reverse DNS**: PTR record lookup
- [ ] **Hostname Detection**: Extract hostname if available
- [ ] **Multi-Language**: i18n support (English, Spanish, Chinese, etc.)
- [ ] **PWA**: Offline support, install prompt

### 10.2 Integrations
- [ ] Browser extension (Chrome/Firefox)
- [ ] CLI tool (`npx whatsmyip`)
- [ ] Slack bot integration
- [ ] API wrapper libraries (Python, Node.js, Go)

### 10.3 Analytics (Privacy-Respecting)
- [ ] Plausible or GoatCounter (no cookies, no tracking)
- [ ] Show public stats: "X checks today" (aggregated)

---

## 11. Deliverables Checklist

**Code:**
- [ ] Complete Next.js project structure
- [ ] All source files with proper types
- [ ] API routes with validation
- [ ] Comprehensive tests
- [ ] Docker configuration

**Documentation:**
- [ ] README.md with setup instructions
- [ ] API.md with endpoint documentation
- [ ] PRIVACY.md explaining data handling
- [ ] CONTRIBUTING.md for contributors
- [ ] CHANGELOG.md for version history

**Assets:**
- [ ] Favicon + app icons (all sizes)
- [ ] OpenGraph image
- [ ] Twitter card image
- [ ] Screenshots for README

**Configuration:**
- [ ] .env.example with all variables
- [ ] ESLint + Prettier configs
- [ ] tsconfig.json optimized
- [ ] package.json with all scripts
- [ ] vercel.json or cloudflare config

---

## 12. Success Metrics

**Technical:**
- Lighthouse score: 95+
- Build time: < 60s
- Cold start: < 500ms (API endpoint)
- Zero critical dependencies with vulnerabilities

**User Experience:**
- Time to interactive: < 2s
- Error rate: < 0.1%
- Accessibility score: 100

**Business:**
- GitHub stars: 100+ (if open-sourced)
- API usage: 1000+ requests/day
- Zero privacy complaints

---

## Example Copy (Use These Strings)

**Hero:**
- Title: "What's My IP?"
- Subtitle: "Instantly discover your public IP address and network details. Private, fast, no tracking."

**Sections:**
- "Your IP Address"
- "Network Information"
- "Browser Details"
- "Location & ISP"
- "Connection Quality"
- "Privacy Information"

**Actions:**
- "Copy IPv4"
- "Copy IPv6"
- "Export as JSON"
- "Share Results"
- "Refresh"
- "View History"

**Privacy Note:**
> "Your IP address is not stored on our servers. All information is computed in real-time and displayed only to you. Browser details are processed locally in your device. We don't use analytics or tracking of any kind."

**Warnings:**
- "⚠️ Private IP detected — you're behind NAT or a firewall"
- "🔒 Using VPN or Proxy — displayed IP may not be your true ISP IP"
- "🌐 IPv6 not available — your ISP may not support IPv6 yet"

---

## Implementation Timeline

**Phase 1 (Core - 1 week):**
- Setup Next.js + TypeScript + Tailwind
- IP detection API endpoint
- Basic UI with IP display
- Copy functionality
- Dark mode

**Phase 2 (Enhanced - 1 week):**
- Browser diagnostics
- Network information
- Geolocation integration
- History panel
- Export features

**Phase 3 (Polish - 3 days):**
- Animations
- Accessibility audit
- Performance optimization
- Documentation
- Testing

**Phase 4 (Deploy - 1 day):**
- Vercel deployment
- Custom domain setup
- Monitoring setup
- Open-source release

---

## Questions for Stakeholders

1. **Geolocation**: Should we include it? (Privacy trade-off)
2. **Third-party APIs**: Allowed for enhanced features?
3. **Branding**: Logo/colors/domain name?
4. **Open Source**: MIT license okay?
5. **Analytics**: Even privacy-respecting ones okay?
6. **Monetization**: Completely free or API tiers later?

---

## Conclusion

This specification provides a complete blueprint for building a modern, production-ready "What's My IP" application with:
- ✅ Privacy-first architecture
- ✅ Modern tech stack (Next.js 15 + TypeScript)
- ✅ Comprehensive feature set
- ✅ Enterprise-grade code quality
- ✅ Full documentation
- ✅ Accessibility compliance
- ✅ Performance optimized
- ✅ Deployment ready

**Ready to build? Let's ship it! 🚀**
