
import React from 'react';
import { Severity } from './types';

export const SEVERITY_COLORS: Record<Severity, string> = {
  [Severity.CRITICAL]: 'bg-red-900/40 text-red-400 border-red-700',
  [Severity.HIGH]: 'bg-orange-900/40 text-orange-400 border-orange-700',
  [Severity.MEDIUM]: 'bg-yellow-900/40 text-yellow-400 border-yellow-700',
  [Severity.LOW]: 'bg-blue-900/40 text-blue-400 border-blue-700',
  [Severity.INFO]: 'bg-slate-800 text-slate-400 border-slate-700',
};

export const SEVERITY_CHART_COLORS: Record<Severity, string> = {
  [Severity.CRITICAL]: '#ef4444',
  [Severity.HIGH]: '#f97316',
  [Severity.MEDIUM]: '#eab308',
  [Severity.LOW]: '#3b82f6',
  [Severity.INFO]: '#94a3b8',
};

export const OWASP_CATEGORIES = [
  "Broken Access Control",
  "Cryptographic Failures",
  "Injection",
  "Insecure Design",
  "Security Misconfiguration",
  "Vulnerable and Outdated Components",
  "Identification and Authentication Failures",
  "Software and Data Integrity Failures",
  "Security Logging and Monitoring Failures",
  "Server-Side Request Forgery"
];
