/**
 * NiyamAI — PDF Brand Service
 * 
 * Manages active uploaded brand PDF document state, persistence in LocalStorage,
 * keyword searching across rules and document text, and benchmark sample loading.
 */

import type {
  GuidelineSearchResult,
  PdfExtractionResult,
  UploadedBrandDocument
} from '../types/brandPdf';
import { organizeBrandGuidelines } from './guidelineOrganizer';
import { extractPdfText, validatePdfFile } from './pdfTextExtractor';

const STORAGE_KEY_PDF_DOC = 'niyamai_uploaded_brand_pdf';

/**
 * Retrieve the active uploaded brand document from LocalStorage
 */
export function getUploadedBrandDocument(): UploadedBrandDocument | null {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return null;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PDF_DOC);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.id && Array.isArray(parsed.guidelines)) {
      return parsed as UploadedBrandDocument;
    }
    return null;
  } catch (err) {
    console.warn('[PDFBrandService] Error reading stored PDF brand document:', err);
    return null;
  }
}

/**
 * Save an uploaded brand document to LocalStorage
 */
export function saveUploadedBrandDocument(doc: UploadedBrandDocument): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(STORAGE_KEY_PDF_DOC, JSON.stringify(doc));
  } catch (err) {
    console.error('[PDFBrandService] Failed to persist PDF brand document:', err);
  }
}

/**
 * Remove the active uploaded brand document from LocalStorage
 */
export function clearUploadedBrandDocument(): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return;
  }
  try {
    localStorage.removeItem(STORAGE_KEY_PDF_DOC);
  } catch (err) {
    console.error('[PDFBrandService] Error removing PDF brand document:', err);
  }
}

/**
 * Extracts, organizes, and persists an uploaded PDF File
 */
export async function processUploadedPdf(file: File): Promise<PdfExtractionResult> {
  const validation = validatePdfFile(file);
  if (!validation.isValid) {
    return {
      success: false,
      error: validation.error || 'Invalid PDF file.'
    };
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const rawExtraction = await extractPdfText(arrayBuffer, file.name);

    const organizedDoc = organizeBrandGuidelines(
      rawExtraction.pages,
      file.name,
      rawExtraction.rawText,
      file.size
    );

    saveUploadedBrandDocument(organizedDoc);

    return {
      success: true,
      document: organizedDoc
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'An unexpected error occurred during PDF text extraction.'
    };
  }
}

/**
 * Loads the pre-packaged benchmark Brand Guidelines sample PDF from /sample-brand-guidelines.pdf
 * Enables quick one-click testing and demonstration for hackathon judges.
 */
export async function loadSampleBenchmarkPdf(): Promise<PdfExtractionResult> {
  try {
    const res = await fetch('/sample-brand-guidelines.pdf');
    if (!res.ok) {
      throw new Error(`Failed to load benchmark PDF file (HTTP ${res.status}).`);
    }

    const arrayBuffer = await res.arrayBuffer();
    const fileName = 'NovaTech_Enterprise_Brand_Manual_2026.pdf';
    const rawExtraction = await extractPdfText(arrayBuffer, fileName);

    const organizedDoc = organizeBrandGuidelines(
      rawExtraction.pages,
      fileName,
      rawExtraction.rawText,
      arrayBuffer.byteLength
    );

    saveUploadedBrandDocument(organizedDoc);

    return {
      success: true,
      document: organizedDoc
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Failed to load benchmark sample brand guidelines PDF.'
    };
  }
}

/**
 * Search across extracted guidelines and raw document text
 * Grounded strictly in actual document content.
 */
export function searchBrandDocument(
  doc: UploadedBrandDocument,
  query: string,
  categoryFilter: string = 'all'
): GuidelineSearchResult[] {
  if (!doc) return [];

  const q = query.trim().toLowerCase();
  const results: GuidelineSearchResult[] = [];

  // 1. Search in categorized guideline rules
  for (const rule of doc.guidelines) {
    if (categoryFilter !== 'all' && rule.category !== categoryFilter) {
      continue;
    }

    const matchesQuery =
      !q ||
      rule.title.toLowerCase().includes(q) ||
      rule.ruleText.toLowerCase().includes(q) ||
      rule.id.toLowerCase().includes(q) ||
      rule.categoryLabel.toLowerCase().includes(q) ||
      (rule.prohibitedTerms && rule.prohibitedTerms.some(t => t.toLowerCase().includes(q))) ||
      (rule.preferredTerms && rule.preferredTerms.some(t => t.toLowerCase().includes(q))) ||
      (rule.suggestedReplacement && rule.suggestedReplacement.toLowerCase().includes(q));

    if (matchesQuery) {
      results.push({
        type: 'rule',
        id: rule.id,
        rule,
        pageNumber: rule.pageNumber,
        matchedKeyword: q || rule.title,
        category: rule.category
      });
    }
  }

  // 2. Search in raw page text for contextual excerpts when query is provided
  if (q.length >= 2) {
    for (const page of doc.pages) {
      const lowerPage = page.text.toLowerCase();
      let searchPos = 0;

      while (searchPos < lowerPage.length) {
        const foundIdx = lowerPage.indexOf(q, searchPos);
        if (foundIdx === -1) break;

        // Context excerpt around found keyword
        const start = Math.max(0, foundIdx - 60);
        const end = Math.min(page.text.length, foundIdx + q.length + 80);
        const rawExcerpt = page.text.substring(start, end);
        const formattedExcerpt = (start > 0 ? '...' : '') + rawExcerpt.trim() + (end < page.text.length ? '...' : '');

        // Avoid adding duplicate excerpt if identical to an already matched rule
        const alreadyCoveredInRule = results.some(
          r => r.type === 'rule' && r.rule && r.rule.ruleText.toLowerCase().includes(q) && r.pageNumber === page.pageNumber
        );

        if (!alreadyCoveredInRule) {
          results.push({
            type: 'text_excerpt',
            id: `excerpt-p${page.pageNumber}-${foundIdx}`,
            excerpt: formattedExcerpt,
            pageNumber: page.pageNumber,
            matchedKeyword: q
          });
        }

        searchPos = foundIdx + q.length + 40; // Skip ahead
      }
    }
  }

  return results;
}

/**
 * Exports document guidelines as structured JSON for transparency
 */
export function exportDocumentAsJson(doc: UploadedBrandDocument): void {
  if (typeof window === 'undefined') return;

  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(doc, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `${doc.fileName.replace(/\.pdf$/i, '')}_guidelines.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
