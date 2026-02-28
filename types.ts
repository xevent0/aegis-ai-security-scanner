export enum Severity {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  INFO = 'INFO'
}

export enum TargetType {
  CODE = 'CODE',
  WEB_APP = 'WEB_APP',
  NETWORK = 'NETWORK'
}

export interface ScanSettings {
  deepThinking: boolean;
  autoRemediation: boolean;
}

export interface Vulnerability {
  id: string;
  title: string;
  severity: Severity;
  category: string;
  description: string;
  location: string;
  remediation: string;
  codeFix?: string;
  references: string[];
  cweId?: string;
}

export interface ScanResult {
  target: string;
  targetType: TargetType;
  timestamp: string;
  scanDuration: number;
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  findings: Vulnerability[];
}

/** Payload sent to the backend /api/scan endpoint */
export interface ScanRequest {
  target: string;
  targetType: TargetType;
  settings: ScanSettings;
}
