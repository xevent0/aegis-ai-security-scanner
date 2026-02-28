import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Aegis API — /api/scan
 *
 * Vercel Serverless Function that proxies scan requests to Claude (Anthropic).
 * The API key never touches the client.
 *
 * Environment variables required (set in Vercel dashboard):
 *   ANTHROPIC_API_KEY — Your Anthropic API key (sk-ant-...)
 */

// ── Rate limiter (in-memory, resets on cold start) ──────────────────
const rateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const WINDOW_MS = 15 * 60 * 1000;

function checkRate(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

// ── Scanner prompt ──────────────────────────────────────────────────
const SCANNER_PROMPT = `You are a Senior Security Research Engineer and Aegis AI, a world-class hybrid vulnerability scanner.

[METHODOLOGY]
1. FOR SOURCE CODE (SAST): Analyze control flow, data flow, taint propagation. Detect injection (SQLi, XSS, CSRF, command injection), hardcoded secrets, insecure crypto, path traversal, insecure deserialization, broken access control. Reference specific line numbers and variable names.
2. FOR WEB APPLICATIONS (DAST + OSINT): Based on the URL provided, analyze common vulnerabilities: missing security headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options), SSL/TLS misconfigurations, technology stack risks, exposed admin paths, known CVEs for common frameworks, cookie security, and CORS misconfiguration.
3. FOR NETWORK TARGETS: Analyze common network vulnerabilities: open ports, service banner risks, known CVEs for common services, firewall misconfigurations, DNS security, and protocol weaknesses.

[SEVERITY ASSIGNMENT]
- CRITICAL: Remote code execution, auth bypass, data exfiltration with no interaction.
- HIGH: SQLi, stored XSS, privilege escalation, hardcoded admin credentials.
- MEDIUM: Reflected XSS, missing critical headers, CSRF on state-changing endpoints.
- LOW: Information disclosure, verbose errors, missing minor headers.
- INFO: Best-practice recommendations, non-exploitable observations.

[RESPONSE FORMAT]
Respond ONLY with a valid JSON object. No markdown, no code fences, no preamble, no explanation.
The JSON must match this exact structure:
{
  "findings": [
    {
      "id": "AEGIS-001",
      "title": "Finding title",
      "severity": "CRITICAL|HIGH|MEDIUM|LOW|INFO",
      "category": "OWASP category",
      "description": "Detailed description",
      "location": "File:line or URL path or service",
      "remediation": "How to fix it",
      "codeFix": "Code snippet to fix (or null)",
      "references": ["https://relevant-url.com"],
      "cweId": "79"
    }
  ]
}

Each finding MUST include a CWE ID and at least one reference URL.
If autoRemediation is true, include concrete code/config fixes in codeFix.
If autoRemediation is false, set codeFix to null.`;

// ── Validation ──────────────────────────────────────────────────────
const VALID_TYPES = ["CODE", "WEB_APP", "NETWORK"];

function validateBody(body: any): string | null {
  if (!body?.target || typeof body.target !== 'string') return "Missing or invalid 'target'.";
  if (body.target.length > 50_000) return "Target exceeds 50,000 characters.";
  if (!VALID_TYPES.includes(body.targetType)) return "Invalid targetType.";
  return null;
}

// ── Handler ─────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', 'https://aegis-security-scanner.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 'unknown';
  if (!checkRate(ip)) {
    return res.status(429).json({ error: "Rate limit reached. 10 scans per 15 minutes." });
  }

  const validationError = validateBody(req.body);
  if (validationError) return res.status(400).json({ error: validationError });

  const { target, targetType, settings } = req.body;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("ANTHROPIC_API_KEY not set.");
    return res.status(500).json({ error: "Server configuration error." });
  }

  const autoRem = settings?.autoRemediation !== false;

  const userMessage = `Target Type: ${targetType}
Target/Input:
${target}

AutoRemediation: ${autoRem}

Perform a thorough security audit. Return ONLY the JSON object with findings.`;

  try {
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8192,
        system: SCANNER_PROMPT,
        messages: [
          { role: 'user', content: userMessage }
        ],
      }),
    });

    if (!claudeRes.ok) {
      const errText = await claudeRes.text();
      console.error("Claude API error:", claudeRes.status, errText);
      if (claudeRes.status === 401) {
        return res.status(502).json({ error: "Invalid API key. Check your Anthropic API key." });
      }
      if (claudeRes.status === 429) {
        return res.status(429).json({ error: "AI engine rate limit reached. Wait a moment." });
      }
      return res.status(502).json({ error: "AI engine returned an error. Please try again." });
    }

    const claudeData = await claudeRes.json();

    const text = claudeData.content
      ?.filter((block: any) => block.type === 'text')
      .map((block: any) => block.text)
      .join('') || '{"findings": []}';

    // Clean up any markdown code fences Claude might add
    const cleanText = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    let parsed: any;
    try {
      parsed = JSON.parse(cleanText);
    } catch {
      console.error("Failed to parse Claude JSON:", cleanText.slice(0, 500));
      return res.status(502).json({ error: "AI engine returned malformed results." });
    }

    const findings = (parsed.findings || []).map((f: any, idx: number) => ({
      ...f,
      id: f.id || `AEGIS-${String(idx + 1).padStart(3, '0')}`,
      references: f.references || [],
      cweId: f.cweId || 'N/A',
    }));

    return res.status(200).json({ findings });
  } catch (error: any) {
    console.error("Scan handler error:", error);
    return res.status(500).json({ error: "Internal server error during scan." });
  }
}