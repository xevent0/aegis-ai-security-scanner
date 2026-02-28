/**
 * Aegis API — /api/scan
 *
 * Vercel Serverless Function that proxies scan requests to Gemini.
 * The API key never touches the client.
 *
 * Environment variables required (set in Vercel dashboard):
 *   GEMINI_API_KEY — Your Google Gemini API key
 *
 * Rate limiting: 10 requests per IP per 15-minute window (in-memory).
 * For production, swap the Map for Redis/Upstash.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// ── Rate limiter (in-memory, resets on cold start) ──────────────────
const rateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

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

// ── Gemini scanner prompt & schema ──────────────────────────────────
const SCANNER_PROMPT = `You are a Senior Security Research Engineer and Aegis AI, a world-class hybrid vulnerability scanner.

[METHODOLOGY]
1. FOR SOURCE CODE (SAST):
   - Analyze control flow, data flow, and taint propagation.
   - Detect injection (SQLi, XSS, CSRF, command injection), hardcoded secrets,
     insecure crypto, path traversal, insecure deserialization, and broken access control.
   - Reference specific line numbers and variable names.

2. FOR WEB APPLICATIONS (DAST + OSINT):
   - Use the Google Search tool to perform OSINT reconnaissance on the target domain.
   - Look for: technology stack fingerprinting, publicly reported SSL/TLS grades,
     exposed admin/config paths, historical data breaches or leaks, and known CVEs
     for the identified infrastructure.
   - Assess common missing security headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options).

3. FOR NETWORK TARGETS:
   - Search for known open ports, service banners, and CVEs for the target.
   - Assess firewall posture and common misconfigurations.

[SEVERITY ASSIGNMENT]
- CRITICAL: Remote code execution, auth bypass, data exfiltration with no interaction.
- HIGH: SQLi, stored XSS, privilege escalation, hardcoded admin credentials.
- MEDIUM: Reflected XSS, missing critical headers, CSRF on state-changing endpoints.
- LOW: Information disclosure, verbose errors, missing minor headers.
- INFO: Best-practice recommendations, non-exploitable observations.

[RESPONSE FORMAT]
Respond ONLY in valid JSON matching the provided schema.
Each finding MUST include a specific CWE ID and at least one actionable reference URL.
If autoRemediation is true, include concrete code/config fix snippets in codeFix.
If autoRemediation is false, omit the codeFix field entirely.`;

const VULNERABILITY_SCHEMA = {
  type: "OBJECT",
  properties: {
    findings: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          id: { type: "STRING" },
          title: { type: "STRING" },
          severity: { type: "STRING", description: "CRITICAL, HIGH, MEDIUM, LOW, or INFO" },
          category: { type: "STRING" },
          description: { type: "STRING" },
          location: { type: "STRING" },
          remediation: { type: "STRING" },
          codeFix: { type: "STRING" },
          references: { type: "ARRAY", items: { type: "STRING" } },
          cweId: { type: "STRING" },
        },
        required: [
          "id", "title", "severity", "category",
          "description", "location", "remediation", "references", "cweId",
        ],
      },
    },
  },
  required: ["findings"],
};

// ── Input validation ────────────────────────────────────────────────
const VALID_TYPES = ["CODE", "WEB_APP", "NETWORK"];
const MAX_TARGET_LENGTH = 50_000;

function validateBody(body: any): string | null {
  if (!body?.target || typeof body.target !== 'string') return "Missing or invalid 'target'.";
  if (body.target.length > MAX_TARGET_LENGTH) return `Target exceeds ${MAX_TARGET_LENGTH} characters.`;
  if (!VALID_TYPES.includes(body.targetType)) return `Invalid targetType. Must be one of: ${VALID_TYPES.join(', ')}`;
  return null;
}

// ── Handler ─────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS — adjust origin for your domain in production
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Rate limit
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 'unknown';
  if (!checkRate(ip)) {
    return res.status(429).json({
      error: "Rate limit reached. You can perform 10 scans per 15 minutes.",
    });
  }

  // Validate
  const validationError = validateBody(req.body);
  if (validationError) return res.status(400).json({ error: validationError });

  const { target, targetType, settings } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not set in environment variables.");
    return res.status(500).json({ error: "Server configuration error." });
  }

  // Build Gemini request
  const autoRem = settings?.autoRemediation !== false;
  const deepThinking = settings?.deepThinking !== false;

  const userContent = `Target Type: ${targetType}
Target/Input:
${target}

AutoRemediation: ${autoRem}
Perform a thorough security audit.${targetType !== 'CODE' ? ' Use Google Search for OSINT reconnaissance first.' : ''}`;

  const geminiBody: any = {
    contents: [{ parts: [{ text: userContent }] }],
    systemInstruction: { parts: [{ text: SCANNER_PROMPT }] },
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: VULNERABILITY_SCHEMA,
    },
  };

  // Google Search grounding for web/network targets
  if (targetType !== 'CODE') {
    geminiBody.tools = [{ googleSearch: {} }];
  }

  // Extended thinking for deep scan mode
  if (deepThinking) {
    geminiBody.generationConfig.thinkingConfig = { thinkingBudget: 16000 };
  }

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geminiBody),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini API error:", geminiRes.status, errText);
      return res.status(502).json({ error: "AI engine returned an error. Please try again." });
    }

    const geminiData = await geminiRes.json();

    // Extract text from response
    const text = geminiData.candidates?.[0]?.content?.parts
      ?.map((p: any) => p.text)
      .filter(Boolean)
      .join('') || '{"findings": []}';

    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      console.error("Failed to parse Gemini JSON:", text.slice(0, 500));
      return res.status(502).json({ error: "AI engine returned malformed results." });
    }

    // Extract grounding URLs from search metadata
    const groundingUrls: string[] = geminiData.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => chunk.web?.uri)
      .filter(Boolean) || [];

    // Enrich findings: attach relevant grounding URLs per-finding (deduplicated)
    const findings = (parsed.findings || []).map((f: any, idx: number) => ({
      ...f,
      id: f.id || `AEGIS-${String(idx + 1).padStart(3, '0')}`,
      references: [
        ...new Set([
          ...(f.references || []),
          // Distribute grounding URLs across findings rather than duplicating all
          ...(groundingUrls.length > 0
            ? [groundingUrls[idx % groundingUrls.length]]
            : []),
        ]),
      ],
    }));

    return res.status(200).json({ findings });
  } catch (error: any) {
    console.error("Scan handler error:", error);
    return res.status(500).json({ error: "Internal server error during scan." });
  }
}
