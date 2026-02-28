# Aegis AI Security Scanner

AI-powered vulnerability scanner. SAST on source code, OSINT-grounded DAST on web/network targets powered by Claude (Anthropic).

**Live:** [aegis-scanner.com](https://aegis-scanner.com)

## Features

- **Source Code Analysis (SAST)** — Paste code to detect injection, hardcoded secrets, insecure crypto, broken access control, and more
- **Web Application Scanning (DAST)** — Enter a URL for header analysis, SSL/TLS assessment, technology fingerprinting, and known CVE detection
- **Network Node Assessment** — Analyze infrastructure for service risks and misconfigurations
- **Auto-Remediation** — Get concrete code fixes for every finding
- **Export Reports** — Download findings as Markdown reports
- **Dashboard** — Visual risk distribution, severity matrix, and scan history

## Architecture
```
Client (React/Vite) → /api/scan (Vercel Serverless) → Claude API (Anthropic)
                       ↑ Rate limiting (10/15min per IP)
                       ↑ Input validation (50K char max)
                       ↑ API key secured server-side
```

## Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Recharts
- **Backend:** Vercel Serverless Functions
- **AI Engine:** Claude Sonnet 4 (Anthropic)
- **Deployment:** Vercel + Custom Domain

## Quick Start
```bash
npm install
# Set ANTHROPIC_API_KEY in .env.local
vercel dev
# Open http://localhost:3000
```

## Deploy
```bash
vercel --prod
# Set ANTHROPIC_API_KEY in Vercel dashboard → Settings → Environment Variables
```

## License

MIT