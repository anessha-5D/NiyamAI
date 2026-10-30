export type AuditChannel = 'ads' | 'social' | 'emails' | 'blogs' | 'product_specs';

export type FindingSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type FindingCategory =
  | 'prohibited_term'
  | 'preferred_term'
  | 'fact_contradiction'
  | 'unsupported_claim'
  | 'tone_mismatch'
  | 'channel_guidance';

export interface Finding {
  id: string;
  category: FindingCategory;
  severity: FindingSeverity;
  matchedText: string;
  startIndex: number;
  endIndex: number;
  explanation: string;
  recommendedCorrection: string;
  confidence: number; // 0 - 100 estimated confidence
  ruleId: string;
  source: 'deterministic' | 'gemini' | 'pdf_guideline';
  pageNumber?: number;
  pdfSource?: string;
}

export interface CategoryScore {
  category: 'terminology' | 'factualAccuracy' | 'toneVoice';
  label: string;
  score: number; // 0 - 100
  status: 'pass' | 'warning' | 'fail';
  violationsCount: number;
  summary: string;
}

export interface DeductionItem {
  id: string;
  ruleId: string;
  label: string;
  pointsDeducted: number;
  severity: FindingSeverity;
}

export interface BrandComplianceScore {
  overallScore: number; // 0 - 100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  status: 'compliant' | 'needs_attention' | 'non_compliant';
  scoringFormula: string;
  categoryScores: {
    terminology: CategoryScore;
    factualAccuracy: CategoryScore;
    toneVoice: CategoryScore;
  };
  deductions: DeductionItem[];
  isDeterministicOnly: boolean;
}

export interface AuditSummary {
  totalFindings: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  passedCount: number;
}

export interface UploadedPdfSummary {
  fileName: string;
  totalRulesApplied: number;
}

export interface AuditReport {
  auditId: string;
  timestamp: string;
  inputText: string;
  channel: AuditChannel;
  brand: {
    name: string;
    tone: string;
    targetAudience: string;
  };
  engineMode: 'hybrid' | 'deterministic-only';
  modelUsed?: string;
  score: BrandComplianceScore;
  findings: Finding[];
  correctedText: string;
  passedChecks: string[];
  summary: AuditSummary;
  executionTimeMs: number;
  uploadedPdfDoc?: UploadedPdfSummary;
}

export interface BrandFact {
  id: string;
  topic: string;
  statement: string;
  verifiableKeywords: string[];
}

export interface ProhibitedTermConfig {
  id: string;
  term: string;
  severity: FindingSeverity;
  category: string;
  explanation: string;
  replacement: string;
}

export interface PreferredTermConfig {
  id: string;
  term: string;
  alternatives: string[];
  explanation: string;
}

export interface ContradictionRule {
  pattern: string;
  contradicts: string;
  severity: FindingSeverity;
  explanation: string;
}

export interface UnsupportedRule {
  pattern: string;
  type: string;
  severity: FindingSeverity;
  explanation: string;
}

export interface ToneRuleConfig {
  id: string;
  pattern: string;
  severity: FindingSeverity;
  category?: FindingCategory;
  explanation: string;
  replacement: string;
}

export interface BrandProfileConfig {
  brand: {
    name: string;
    description: string;
    brandTone: string;
    targetAudience: string;
    mission: string;
    tagline: string;
  };
  prohibitedTerms: ProhibitedTermConfig[];
  preferredTerminology: PreferredTermConfig[];
  approvedFacts: BrandFact[];
  claimRules: {
    contradictions: ContradictionRule[];
    unsupportedPatterns: UnsupportedRule[];
  };
  toneGuidelines: {
    voiceAttributes: string[];
    channelAdjustments: Record<string, string>;
    toneRules?: ToneRuleConfig[];
  };
}
