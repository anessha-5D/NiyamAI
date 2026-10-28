/**
 * NiyamAI — PDF Text Extractor
 * 
 * Extracts readable text and page metadata from uploaded PDF documents.
 * Employs a dual-strategy architecture:
 * 1. Primary: Mozilla pdfjs-dist library
 * 2. Secondary: Resilient native PDF stream parser with FlateDecode decompression
 * 
 * Guarantees 100% offline and confidential local processing.
 */

import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import type { ExtractedPdfPage } from '../types/brandPdf';

// Configure PDF.js worker in browser/Vite environments
try {
  if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
  }
} catch {
  // Graceful fallback if worker cannot be initialized
}

export const MAX_PDF_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

export interface RawExtractionResult {
  pages: ExtractedPdfPage[];
  rawText: string;
  totalWordCount: number;
  totalCharacterCount: number;
}

/**
 * Validates a selected File before extraction
 */
export function validatePdfFile(file: File): { isValid: boolean; error?: string } {
  if (!file) {
    return { isValid: false, error: 'No file was provided.' };
  }

  // Size checks
  if (file.size === 0) {
    return { isValid: false, error: 'Selected PDF file is empty (0 bytes).' };
  }

  if (file.size > MAX_PDF_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      isValid: false,
      error: `File size (${sizeMb} MB) exceeds the maximum allowed limit of 15 MB.`
    };
  }

  // File type checks
  const isPdfMime = file.type === 'application/pdf';
  const hasPdfExtension = file.name.toLowerCase().endsWith('.pdf');

  if (!isPdfMime && !hasPdfExtension) {
    return {
      isValid: false,
      error: 'Invalid file format. Please upload a standard PDF document (.pdf).'
    };
  }

  return { isValid: true };
}

/**
 * Primary extraction using pdfjs-dist
 */
async function extractWithPdfJs(arrayBuffer: ArrayBuffer): Promise<ExtractedPdfPage[]> {
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true
  });

  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;

  if (numPages === 0) {
    throw new Error('PDF has 0 pages.');
  }

  const pages: ExtractedPdfPage[] = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();

    let lastY: number | null = null;
    let pageText = '';

    for (const item of textContent.items) {
      if ('str' in item) {
        const itemStr = (item as any).str || '';
        const transform = (item as any).transform;
        const currentY = transform ? transform[5] : null;

        // Line break heuristic based on Y coordinate change
        if (lastY !== null && currentY !== null && Math.abs(currentY - lastY) > 5) {
          pageText += '\n';
        } else if (pageText.length > 0 && !pageText.endsWith(' ') && !pageText.endsWith('\n')) {
          pageText += ' ';
        }

        pageText += itemStr;
        if (currentY !== null) {
          lastY = currentY;
        }
      }
    }

    const trimmed = pageText.trim();
    const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;

    pages.push({
      pageNumber: i,
      text: trimmed,
      wordCount: words,
      characterCount: trimmed.length
    });
  }

  return pages;
}

/**
 * Resilient direct stream parser as fallback
 * Supports uncompressed and FlateDecode streams using native Web DecompressionStream
 */
async function extractWithDirectStreamParser(arrayBuffer: ArrayBuffer): Promise<ExtractedPdfPage[]> {
  const uint8 = new Uint8Array(arrayBuffer);
  const textDecoder = new TextDecoder('latin1');
  const fullContent = textDecoder.decode(uint8);

  // Validate PDF magic bytes
  if (!fullContent.startsWith('%PDF-')) {
    throw new Error('File does not have a valid %PDF header.');
  }

  // Find all stream objects
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match: RegExpExecArray | null;
  const extractedSections: string[] = [];

  while ((match = streamRegex.exec(fullContent)) !== null) {
    const rawStreamLatin1 = match[1];
    let streamBytes = new Uint8Array(rawStreamLatin1.length);
    for (let i = 0; i < rawStreamLatin1.length; i++) {
      streamBytes[i] = rawStreamLatin1.charCodeAt(i) & 0xff;
    }

    let decodedContent = '';

    // Attempt native DecompressionStream('deflate')
    if (typeof DecompressionStream !== 'undefined') {
      try {
        const ds = new DecompressionStream('deflate');
        const writer = ds.writable.getWriter();
        writer.write(streamBytes);
        writer.close();
        const reader = ds.readable.getReader();
        const chunks: Uint8Array[] = [];
        let done = false;
        while (!done) {
          const res = await reader.read();
          if (res.done) {
            done = true;
          } else if (res.value) {
            chunks.push(res.value);
          }
        }
        const totalLen = chunks.reduce((acc, c) => acc + c.length, 0);
        const merged = new Uint8Array(totalLen);
        let offset = 0;
        for (const c of chunks) {
          merged.set(c, offset);
          offset += c.length;
        }
        decodedContent = new TextDecoder('latin1').decode(merged);
      } catch {
        // Fallback to raw stream content if not deflated
        decodedContent = rawStreamLatin1;
      }
    } else {
      decodedContent = rawStreamLatin1;
    }

    // Extract text from BT ... ET blocks
    const btRegex = /BT([\s\S]*?)ET/g;
    let btMatch: RegExpExecArray | null;
    let sectionText = '';

    while ((btMatch = btRegex.exec(decodedContent)) !== null) {
      const block = btMatch[1];

      // Match (text) ' or (text) Tj
      const tjRegex = /\((.*?)\)\s*(?:'|Tj)/g;
      let tjMatch: RegExpExecArray | null;
      while ((tjMatch = tjRegex.exec(block)) !== null) {
        sectionText += tjMatch[1].replace(/\\([()\\])/g, '$1') + '\n';
      }

      // Match [(array)] TJ
      const arrayRegex = /\[(.*?)\]\s*TJ/g;
      let arrMatch: RegExpExecArray | null;
      while ((arrMatch = arrayRegex.exec(block)) !== null) {
        const inner = arrMatch[1];
        const innerTj = /\((.*?)\)/g;
        let itMatch: RegExpExecArray | null;
        let line = '';
        while ((itMatch = innerTj.exec(inner)) !== null) {
          line += itMatch[1].replace(/\\([()\\])/g, '$1');
        }
        if (line) sectionText += line + '\n';
      }
    }

    if (sectionText.trim()) {
      extractedSections.push(sectionText.trim());
    }
  }

  if (extractedSections.length === 0) {
    throw new Error('No stream text blocks found.');
  }

  // Format into pages (group sections or split by form feed / page markers)
  const pages: ExtractedPdfPage[] = extractedSections.map((sec, idx) => ({
    pageNumber: idx + 1,
    text: sec,
    wordCount: sec.split(/\s+/).filter(Boolean).length,
    characterCount: sec.length
  }));

  return pages;
}

/**
 * Main function: Extracts all pages and text from a PDF ArrayBuffer
 */
export async function extractPdfText(
  arrayBuffer: ArrayBuffer,
  fileName: string = 'document.pdf'
): Promise<RawExtractionResult> {
  // Validate arrayBuffer
  if (!arrayBuffer || arrayBuffer.byteLength === 0) {
    throw new Error('Selected PDF file is empty (0 bytes).');
  }

  // Validate PDF header magic bytes
  const headerCheck = new Uint8Array(arrayBuffer.slice(0, 8));
  const headerString = String.fromCharCode(...headerCheck);
  if (!headerString.includes('%PDF-')) {
    throw new Error('Invalid PDF format: File header does not match %PDF- specification.');
  }

  let pages: ExtractedPdfPage[] = [];
  let extractionError: Error | null = null;

  // Try Strategy 1: pdfjs-dist
  try {
    pages = await extractWithPdfJs(arrayBuffer);
  } catch (err: any) {
    console.warn('[PDFExtractor] pdfjs-dist extraction failed, falling back to direct stream parser:', err?.message || err);
    extractionError = err;
  }

  // Try Strategy 2: Direct stream parser if pdfjs-dist yielded no pages
  if (pages.length === 0) {
    try {
      pages = await extractWithDirectStreamParser(arrayBuffer);
    } catch (fallbackErr: any) {
      console.error('[PDFExtractor] Direct stream parser failed:', fallbackErr?.message || fallbackErr);
      const reason = extractionError?.message || fallbackErr?.message || 'Unknown parsing failure';
      throw new Error(`Failed to extract text from "${fileName}": ${reason}`);
    }
  }

  // Check if any readable text was found
  const totalCharacters = pages.reduce((sum, p) => sum + p.characterCount, 0);
  const totalWords = pages.reduce((sum, p) => sum + p.wordCount, 0);

  if (totalCharacters === 0 || totalWords === 0) {
    throw new Error(
      `No extractable text found in "${fileName}". The file may be a scanned image or rasterized creative without an embedded text layer.`
    );
  }

  const rawText = pages.map(p => `--- Page ${p.pageNumber} ---\n${p.text}`).join('\n\n');

  return {
    pages,
    rawText,
    totalWordCount: totalWords,
    totalCharacterCount: totalCharacters
  };
}
