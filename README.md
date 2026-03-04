# Aegis AI Security Scanner

AI-powered vulnerability scanner. SAST on source code, OSINT-grounded DAST on web/network targets powered by Claude (Anthropic).

**Live:** [aegis-scanner.com](https://www.aegis-scanner.com)

## Features

- **Source Code Analysis (SAST)** — Paste code to detect injection, hardcoded secrets, insecure crypto, broken access control, and more
- **Web Application Scanning (DAST)** — Enter a URL for header analysis, SSL/TLS assessment, technology fingerprinting, and known CVE detection
- **Network Node Assessment** — Analyze infrastructure for service risks and misconfigurations
- **Auto-Remediation** — Get concrete code fixes for every finding
- **Export Reports** — Download findings as Markdown reports
- **Dashboard** — Visual risk distribution, severity matrix, and scan history
- **Client-Side Rate Limiting** — Scan counter with clear feedback when limit is reached

## Architecture
```
Client (React/Vite) → /api/scan (Vercel Serverless) → Claude API (Anthropic)
                       ↑ Rate limiting (3/15min per IP)
                       ↑ Input validation (50K char max)
                       ↑ API key secured server-side
```

## Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Recharts
- **Backend:** Vercel Serverless Functions
- **AI Engine:** Claude Sonnet 4.5 (Anthropic)
- **Deployment:** Vercel + Custom Domain (aegis-scanner.com)

## Quick Start

Quick Start and Deploy are for developers who want to run their own instance of Aegis locally or deploy their own copy.
```bash
git clone https://github.com/xevent0/aegis-ai-security-scanner.git
cd aegis-ai-security-scanner
npm install
```

Create a `.env.local` file with your Anthropic API key:
```
ANTHROPIC_API_KEY=your_key_here
```

Then run locally:
```bash
vercel dev
```

Open http://localhost:3000

## Deploy
```bash
vercel --prod
```

Then set `ANTHROPIC_API_KEY` in Vercel dashboard → Settings → Environment Variables.

## License

MIT