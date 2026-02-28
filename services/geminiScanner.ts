import { TargetType, Severity, Vulnerability, ScanResult, ScanSettings } from "../types";

/**
 * Aegis Scanner Client
 * 
 * Architecture: This module calls YOUR backend API proxy at /api/scan,
 * which holds the Gemini API key server-side. The client never touches
 * the API key directly.
 * 
 * For local development, set VITE_API_BASE_URL in .env.local
 * (defaults to '' which means same-origin /api/scan).
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export const performScan = async (
  target: string,
  type: TargetType,
  settings: ScanSettings
): Promise<ScanResult> => {
  const startTime = performance.now();

  try {
    const response = await fetch(`${API_BASE}/api/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target, targetType: type, settings }),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      
      if (response.status === 429) {
        throw new Error("Rate limit reached. Please wait a few minutes before scanning again.");
      }
      
      throw new Error(
        errBody.error || `Scan failed with status ${response.status}. Check your API configuration.`
      );
    }

    const data = await response.json();
    const endTime = performance.now();

    // Validate response shape
    if (!data.findings || !Array.isArray(data.findings)) {
      throw new Error("Received malformed scan results from the server.");
    }

    const findings: Vulnerability[] = data.findings;

    // Strip codeFix when auto-remediation is disabled
    const processedFindings = settings.autoRemediation
      ? findings
      : findings.map(({ codeFix, ...rest }) => rest);

    const summary = processedFindings.reduce(
      (acc, curr) => {
        acc.total++;
        const s = curr.severity as Severity;
        if (s === Severity.CRITICAL) acc.critical++;
        else if (s === Severity.HIGH) acc.high++;
        else if (s === Severity.MEDIUM) acc.medium++;
        else if (s === Severity.LOW) acc.low++;
        else acc.info++;
        return acc;
      },
      { total: 0, critical: 0, high: 0, medium: 0, low: 0, info: 0 }
    );

    return {
      target,
      targetType: type,
      timestamp: new Date().toISOString(),
      scanDuration: endTime - startTime,
      summary,
      findings: processedFindings,
    };
  } catch (error: any) {
    // Re-throw user-facing errors as-is
    if (error.message && !error.message.includes('fetch')) {
      throw error;
    }
    // Network errors
    console.error("Scan failed:", error);
    throw new Error(
      "Could not reach the Aegis API. Check your connection and try again."
    );
  }
};
