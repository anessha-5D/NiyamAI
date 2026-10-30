/**
 * NiyamAI — Brand PDF Types & Guideline Data Structures
 */

export type GuidelineCategory =
  | 'tone_of_voice'
  | 'terminology'
  | 'prohibited_claims'
  | 'approved_claims'
  | 'required_disclaimers'
  | 'visual_accessibility'
  | 'general_policy';

export type GuidelineSeverity = 'Strict' | 'Recommended' | 'Optional';

export interface ExtractedGuideline {
  id: string;
  category: GuidelineCategory;
  categoryLabel: string;
  title: string;
  ruleText: string;
  severity: GuidelineSeverity;
  pageNumber: number;
  source: string;
  prohibitedTerms?: string[];
  preferredTerms?: string[];
  suggestedReplacement?: string;
  matchedKeywords?: string[];
}

export interface ExtractedPdfPage {
  pageNumber: number;
  text: string;
  wordCount: number;
  characterCount: number;
}

export interface CategoryBreakdown {
  toneCount: number;
  terminologyCount: number;
  prohibitedCount: number;
  approvedCount: number;
  disclaimersCount: number;
  visualCount: number;
  generalCount: number;
}

export interface UploadedBrandDocument {
  id: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  pageCount: number;
  totalWordCount: number;
  totalCharacterCount: number;
  rawText: string;
  pages: ExtractedPdfPage[];
  guidelines: ExtractedGuideline[];
  summary: {
    totalRules: number;
    categories: CategoryBreakdown;
  };
}

export interface PdfExtractionResult {
  success: boolean;
  error?: string;
  document?: UploadedBrandDocument;
}

export interface GuidelineSearchResult {
  type: 'rule' | 'text_excerpt';
  id: string;
  rule?: ExtractedGuideline;
  excerpt?: string;
  pageNumber: number;
  matchedKeyword: string;
  category?: GuidelineCategory;
}
