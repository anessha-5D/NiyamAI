/**
 * NiyamAI — Guideline Organizer
 * 
 * Organizes extracted PDF text into structured, searchable guideline entries.
 * Detects standard brand governance categories:
 * - Tone of Voice
 * - Terminology
 * - Prohibited Claims & Vocabulary
 * - Approved Facts & Claims
 * - Required Disclaimers
 * - Visual & Accessibility Guidance
 * 
 * Grounded strictly in extracted text without fabricating rules.
 * Preserves the complete raw text and page mappings.
 */

import type {
  CategoryBreakdown,
  ExtractedGuideline,
  ExtractedPdfPage,
  GuidelineCategory,
  GuidelineSeverity,
  UploadedBrandDocument
} from '../types/brandPdf';

interface SectionContext {
  category: GuidelineCategory;
  categoryLabel: string;
}

const CATEGORY_META: Record<GuidelineCategory, { label: string; defaultSeverity: GuidelineSeverity }> = {
  tone_of_voice: { label: 'Tone of Voice', defaultSeverity: 'Recommended' },
  terminology: { label: 'Brand Terminology', defaultSeverity: 'Strict' },
  prohibited_claims: { label: 'Prohibited Claims', defaultSeverity: 'Strict' },
  approved_claims: { label: 'Approved Claims', defaultSeverity: 'Strict' },
  required_disclaimers: { label: 'Required Disclaimers', defaultSeverity: 'Strict' },
  visual_accessibility: { label: 'Visual & Accessibility', defaultSeverity: 'Strict' },
  general_policy: { label: 'General Brand Policy', defaultSeverity: 'Recommended' }
};

/**
 * Detects whether a line is a section heading and returns the category
 */
function detectSectionHeader(line: string): SectionContext | null {
  const clean = line.trim().toLowerCase();

  // Prohibited Claims & Terms
  if (
    clean.includes('prohibited') ||
    clean.includes('forbidden') ||
    clean.includes('restricted vocabulary') ||
    clean.includes('restricted claims') ||
    clean.includes('never say') ||
    clean.includes("don't say") ||
    clean.includes('unacceptable claims')
  ) {
    return { category: 'prohibited_claims', categoryLabel: CATEGORY_META.prohibited_claims.label };
  }

  // Approved Claims & Facts
  if (
    clean.includes('approved fact') ||
    clean.includes('approved claim') ||
    clean.includes('verified claim') ||
    clean.includes('certified claim') ||
    clean.includes('official fact') ||
    clean.includes('substantiated claim')
  ) {
    return { category: 'approved_claims', categoryLabel: CATEGORY_META.approved_claims.label };
  }

  // Required Disclaimers
  if (
    clean.includes('disclaimer') ||
    clean.includes('mandatory disclosure') ||
    clean.includes('legal notice') ||
    clean.includes('footnote disclosure') ||
    clean.includes('asterisk disclosure')
  ) {
    return { category: 'required_disclaimers', categoryLabel: CATEGORY_META.required_disclaimers.label };
  }

  // Tone of Voice
  if (
    clean.includes('tone of voice') ||
    clean.includes('voice & tone') ||
    clean.includes('voice and tone') ||
    clean.includes('brand voice') ||
    clean.includes('brand personality') ||
    clean.includes('writing style') ||
    clean.includes('editorial voice')
  ) {
    return { category: 'tone_of_voice', categoryLabel: CATEGORY_META.tone_of_voice.label };
  }

  // Terminology
  if (
    clean.includes('terminology') ||
    clean.includes('vocabulary') ||
    clean.includes('preferred term') ||
    clean.includes('naming conventions') ||
    clean.includes('words to use') ||
    clean.includes('glossary')
  ) {
    return { category: 'terminology', categoryLabel: CATEGORY_META.terminology.label };
  }

  // Visual & Accessibility
  if (
    clean.includes('visual') ||
    clean.includes('accessibility') ||
    clean.includes('contrast') ||
    clean.includes('wcag') ||
    clean.includes('typography') ||
    clean.includes('color palette') ||
    clean.includes('logo usage') ||
    clean.includes('clear space')
  ) {
    return { category: 'visual_accessibility', categoryLabel: CATEGORY_META.visual_accessibility.label };
  }

  return null;
}

/**
 * Extracts quotes from text e.g. 'cheap' or "100% bug-free"
 */
function extractQuotedPhrases(text: string): string[] {
  const matches: string[] = [];
  const quoteRegex = /['"]([^'"]{2,60})['"]/g;
  let match: RegExpExecArray | null;
  while ((match = quoteRegex.exec(text)) !== null) {
    matches.push(match[1].trim());
  }
  return matches;
}

/**
 * Extracts replacement term if text says "use 'X' instead" or "replace with 'X'"
 */
function extractReplacement(text: string): string | undefined {
  const replacePatterns = [
    /use\s+['"]([^'"]+)['"]\s+instead/i,
    /replace\s+(?:with|by)\s+['"]([^'"]+)['"]/i,
    /preferred(?:\s+term)?:\s*['"]?([^'",.]+)['"]?/i,
    /instead\s+use\s+['"]([^'"]+)['"]/i
  ];

  for (const pat of replacePatterns) {
    const match = text.match(pat);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return undefined;
}

/**
 * Determines guideline severity based on language strictly present in the text
 */
function determineSeverity(text: string, defaultSeverity: GuidelineSeverity): GuidelineSeverity {
  const lower = text.toLowerCase();
  if (
    lower.includes('must') ||
    lower.includes('shall') ||
    lower.includes('never') ||
    lower.includes('strictly') ||
    lower.includes('prohibited') ||
    lower.includes('forbidden') ||
    lower.includes('mandatory') ||
    lower.includes('zero tolerance')
  ) {
    return 'Strict';
  }

  if (
    lower.includes('should') ||
    lower.includes('recommend') ||
    lower.includes('prefer') ||
    lower.includes('encouraged') ||
    lower.includes('avoid')
  ) {
    return 'Recommended';
  }

  return defaultSeverity;
}

/**
 * Organizes raw extracted PDF pages into structured guidelines
 */
export function organizeBrandGuidelines(
  pages: ExtractedPdfPage[],
  fileName: string,
  rawText: string,
  fileSize: number
): UploadedBrandDocument {
  const guidelines: ExtractedGuideline[] = [];
  let currentSection: SectionContext = {
    category: 'general_policy',
    categoryLabel: CATEGORY_META.general_policy.label
  };

  let ruleCounter = 1;

  for (const page of pages) {
    const lines = page.text.split('\n').map(l => l.trim()).filter(Boolean);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check if line is a section heading
      const detectedHeader = detectSectionHeader(line);
      if (detectedHeader) {
        currentSection = detectedHeader;
        continue;
      }

      // Check if line looks like a rule, bullet, or policy statement
      const isBullet = /^[-*•·–—]\s+/.test(line);
      const isNumbered = /^(?:Rule\s+)?[A-Z0-9_-]+[:.]\s+/i.test(line) || /^\d+[.)]\s+/.test(line);
      const isRuleHeader = /^(?:Rule|Guideline|Policy|Standard)\b/i.test(line);

      if (isBullet || isNumbered || isRuleHeader || (line.length > 35 && line.endsWith('.'))) {
        const cleanRuleText = line.replace(/^[-*•·–—]\s+/, '').trim();

        if (cleanRuleText.length < 10) continue;

        // Try extracting explicit Rule ID from line (e.g. "Rule TV-01:", "PC-02:")
        const idMatch = cleanRuleText.match(/^(?:Rule\s+)?([A-Z0-9_-]{2,10})[:.]\s*(.*)/i);
        let explicitId = '';
        let ruleBody = cleanRuleText;

        if (idMatch && idMatch[1]) {
          explicitId = idMatch[1].toUpperCase();
          ruleBody = idMatch[2] || cleanRuleText;
        }

        const id = explicitId || `PDF-GL-${String(ruleCounter).padStart(3, '0')}`;
        ruleCounter++;

        // Title derivation
        let title = '';
        if (ruleBody.includes(':')) {
          const parts = ruleBody.split(':');
          title = parts[0].trim();
        } else {
          // Take first 8 words as title
          const words = ruleBody.split(/\s+/);
          title = words.slice(0, 8).join(' ') + (words.length > 8 ? '...' : '');
        }

        // Clean up quotes from title if needed
        title = title.replace(/^['"]+|['"]+$/g, '');

        const severity = determineSeverity(
          ruleBody,
          CATEGORY_META[currentSection.category]?.defaultSeverity || 'Recommended'
        );

        // Extract quotes/terms
        const quotes = extractQuotedPhrases(ruleBody);
        const replacement = extractReplacement(ruleBody);

        const guidelineItem: ExtractedGuideline = {
          id,
          category: currentSection.category,
          categoryLabel: currentSection.categoryLabel,
          title,
          ruleText: ruleBody,
          severity,
          pageNumber: page.pageNumber,
          source: `${fileName} (Page ${page.pageNumber})`,
          prohibitedTerms: currentSection.category === 'prohibited_claims' ? quotes : undefined,
          preferredTerms: currentSection.category === 'terminology' ? quotes : undefined,
          suggestedReplacement: replacement,
          matchedKeywords: quotes.length > 0 ? quotes : undefined
        };

        guidelines.push(guidelineItem);
      }
    }
  }

  // If no bulleted rules were parsed, fallback to paragraph-level chunks
  if (guidelines.length === 0) {
    for (const page of pages) {
      const paragraphs = page.text
        .split(/\n\s*\n/)
        .map(p => p.trim())
        .filter(p => p.length > 25);

      for (const para of paragraphs) {
        const detected = detectSectionHeader(para) || currentSection;
        const severity = determineSeverity(para, 'Recommended');
        const quotes = extractQuotedPhrases(para);

        guidelines.push({
          id: `PDF-GL-${String(ruleCounter++).padStart(3, '0')}`,
          category: detected.category,
          categoryLabel: detected.categoryLabel,
          title: para.split(/\s+/).slice(0, 7).join(' ') + '...',
          ruleText: para,
          severity,
          pageNumber: page.pageNumber,
          source: `${fileName} (Page ${page.pageNumber})`,
          matchedKeywords: quotes
        });
      }
    }
  }

  // Calculate category breakdown
  const categories: CategoryBreakdown = {
    toneCount: guidelines.filter(g => g.category === 'tone_of_voice').length,
    terminologyCount: guidelines.filter(g => g.category === 'terminology').length,
    prohibitedCount: guidelines.filter(g => g.category === 'prohibited_claims').length,
    approvedCount: guidelines.filter(g => g.category === 'approved_claims').length,
    disclaimersCount: guidelines.filter(g => g.category === 'required_disclaimers').length,
    visualCount: guidelines.filter(g => g.category === 'visual_accessibility').length,
    generalCount: guidelines.filter(g => g.category === 'general_policy').length
  };

  const totalWords = pages.reduce((sum, p) => sum + p.wordCount, 0);
  const totalCharacters = pages.reduce((sum, p) => sum + p.characterCount, 0);

  return {
    id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    fileName,
    fileSize,
    uploadedAt: new Date().toISOString(),
    pageCount: pages.length,
    totalWordCount: totalWords,
    totalCharacterCount: totalCharacters,
    rawText,
    pages,
    guidelines,
    summary: {
      totalRules: guidelines.length,
      categories
    }
  };
}
