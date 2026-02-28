# Aegis AI Security Scanner

AI-powered vulnerability scanner and remediation agent. Performs SAST on source code and OSINT-grounded dynamic assessment on web/network targets using Google Gemini.

## Architecture

```
┌─────────────────┐       ┌──────────────────┐       ┌─────────────┐
│   React Client  │──────▶│  /api/scan       │──────▶│  Gemini API │
│   (Vite + TS)   │◀──────│  (Vercel Fn)     │◀──────│  + Search   │
└─────────────────┘       └──────────────────┘       └─────────────┘
                           │ Rate limiting    │
                           │ Input validation │
                           │ API key (server) │
```

- **Client**: React 19 + TypeScript + Tailwind + Recharts
- **API**: Vercel serverless function (`/api/scan.ts`)
- **AI**: Google Gemini 2.5 Pro with Google Search grounding for OSINT

The API key **never** touches the client. All Gemini calls go through the serverless proxy.

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Create .env.local for the serverless function
#    (Vercel CLI reads this automatically)
echo "GEMINI_API_KEY=your_key_here" > .env.local

# 3. Run with Vercel CLI (needed for /api routes)
npx vercel dev

# Or for frontend-only dev (API calls will fail):
npm run dev
```

## Deploy to Vercel

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy
vercel

# 3. Set the API key in Vercel dashboard:
#    Settings → Environment Variables → GEMINI_API_KEY
```

## Features

- **Source Code Scanning (SAST)**: Paste code for deep analysis — injection, XSS, CSRF, hardcoded secrets, insecure crypto, and more
- **Web Application Scanning (DAST + OSINT)**: Enter a URL — Gemini uses Google Search to fingerprint the stack, check SSL ratings, find exposed paths, and identify known CVEs
- **Network Target Assessment**: Audit IPs and domains for open ports, service vulnerabilities, and misconfigurations
- **AI Remediation**: Every finding includes plain-English explanation, severity rating, CWE ID, and (when enabled) a concrete code fix
- **Export**: Download scan reports as Markdown
- **Settings**: Toggle deep thinking (extended AI reasoning) and auto-remediation (code fix generation)
- **Rate Limiting**: 10 scans per 15 minutes per IP (server-enforced)

## Project Structure

```
├── api/
│   └── scan.ts                  # Vercel serverless function (Gemini proxy)
├── components/
│   ├── Dashboard.tsx            # Risk metrics and charts
│   ├── ErrorBoundary.tsx        # Crash recovery
│   ├── Layout.tsx               # Responsive sidebar layout
│   ├── ScanInterface.tsx        # Scan input + live console
│   ├── VulnerabilityDetail.tsx  # Finding detail panel
│   └── VulnerabilityList.tsx    # Findings list
├── services/
│   └── geminiScanner.ts         # Client-side API caller
├── App.tsx                      # Main app with routing and state
├── types.ts                     # TypeScript interfaces
├── constants.tsx                # Severity colors and OWASP categories
└── vercel.json                  # Deployment configuration
```

## Rate Limits

The `/api/scan` endpoint enforces 10 requests per IP per 15-minute window using in-memory tracking. For production at scale, replace the in-memory Map with Redis (e.g., Upstash).

## License

MIT
