// ============================================================
// NiyamAI — Types
// Member 4: Correction Workspace
// ============================================================

export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type ContentType = 'social-media' | 'email' | 'ad-copy' | 'website' | 'print' | 'press-release';
export type CorrectionMethod = 'accepted' | 'rejected' | 'manual' | 'reverted' | 'submitted' | 'resubmitted';

export type WorkflowStatus =
  | 'draft'
  | 'correction-accepted'
  | 'correction-rejected'
  | 'manually-edited'
  | 'pending-approval'
  | 'approved'
  | 'changes-requested';

export interface GuidelineRef {
  id: string;
  title: string;
  /** Member 1 will provide actual guideline URLs */
  url?: string;
  section?: string;
}

export interface AISuggestion {
  suggestedText: string;
  explanation: string;
  confidence: number; // 0–1
  /** Member 2 will populate this from the actual audit engine */
  generatedBy: 'sample-data' | 'member2-audit';
}

export interface CorrectionRecord {
  id: string;
  contentTitle: string;
  contentType: ContentType;
  originalContent: string;
  detectedIssue: string;
  issueExplanation: string;
  severity: Severity;
  guidelineRef?: GuidelineRef;
  aiSuggestion: AISuggestion;
  workingContent: string;
  status: WorkflowStatus;
  createdAt: string;
  updatedAt: string;
  approvalComment?: string;
}

export interface HistoryEntry {
  id: string;
  recordId: string;
  contentTitle: string;
  originalContent: string;
  suggestedContent: string;
  finalContent: string;
  method: CorrectionMethod;
  status: WorkflowStatus;
  timestamp: string;
  note?: string;
}
