import { Finding } from '../types/audit.js';

export class CorrectionService {
  /**
   * Applies an individual finding's recommended correction to the text,
   * preserving surrounding formatting and whitespace.
   */
  public applySingleCorrection(originalText: string, finding: Finding): string {
    if (!finding.recommendedCorrection) return originalText;

    // Use startIndex and endIndex if valid
    if (
      finding.startIndex >= 0 &&
      finding.endIndex <= originalText.length &&
      finding.startIndex < finding.endIndex
    ) {
      const before = originalText.substring(0, finding.startIndex);
      const after = originalText.substring(finding.endIndex);
      return before + finding.recommendedCorrection + after;
    }

    // Fallback: replace exact matchedText if indices are out of sync
    if (finding.matchedText && originalText.includes(finding.matchedText)) {
      return originalText.replace(finding.matchedText, finding.recommendedCorrection);
    }

    return originalText;
  }

  /**
   * Applies all recommended corrections from findings in reverse index order
   * to guarantee that index offsets for earlier findings remain valid.
   */
  public applyAllCorrections(
    originalText: string,
    findings: Finding[],
    geminiRewrite?: string
  ): string {
    // If Gemini provided a high-quality full suggested rewrite, we can prefer it
    // if there are multiple tone changes, or fallback to deterministic substitutions.
    if (geminiRewrite && geminiRewrite.trim().length > 0 && findings.some(f => f.source === 'gemini')) {
      return geminiRewrite.trim();
    }

    // Filter findings that have corrections
    const fixableFindings = findings
      .filter(f => Boolean(f.recommendedCorrection && f.recommendedCorrection.trim()))
      .filter(f => f.startIndex >= 0 && f.endIndex <= originalText.length && f.startIndex < f.endIndex)
      // Sort in reverse order of startIndex
      .sort((a, b) => b.startIndex - a.startIndex);

    let result = originalText;

    // Deduplicate overlapping spans
    const processedSpans: Array<{ start: number; end: number }> = [];

    for (const f of fixableFindings) {
      // Check if this span overlaps with any already applied replacement
      const overlaps = processedSpans.some(
        span => !(f.endIndex <= span.start || f.startIndex >= span.end)
      );

      if (!overlaps) {
        const before = result.substring(0, f.startIndex);
        const after = result.substring(f.endIndex);
        result = before + f.recommendedCorrection + after;
        processedSpans.push({ start: f.startIndex, end: f.endIndex });
      }
    }

    return result;
  }
}
