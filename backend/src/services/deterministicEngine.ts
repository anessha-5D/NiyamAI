import {
  AuditChannel,
  BrandProfileConfig,
  Finding,
  FindingCategory,
  FindingSeverity
} from '../types/audit.js';

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Creates a regex that accurately matches whole phrases or words,
 * respecting punctuation boundaries without substring false-positives.
 */
function createWordOrPhraseRegex(term: string): RegExp {
  const escaped = escapeRegex(term).replace(/\s+/g, '\\s+');
  return new RegExp(`(?:^|(?<=[^\\w-]))${escaped}(?=[^\\w-]|$)`, 'gi');
}

export interface DeterministicAuditResult {
  findings: Finding[];
  passedChecks: string[];
}

export class DeterministicRuleEngine {
  constructor(private config: BrandProfileConfig) {}

  public audit(text: string, channel: AuditChannel, uploadedDoc?: any): DeterministicAuditResult {
    const findings: Finding[] = [];
    const passedChecks: string[] = [];

    if (!text || text.trim().length === 0) {
      return { findings: [], passedChecks: [] };
    }

    // 1. Uploaded PDF Brand Guidelines Checks (Prioritized over generic built-in rules)
    if (uploadedDoc && Array.isArray(uploadedDoc.guidelines)) {
      const docName = uploadedDoc.fileName || 'Uploaded Brand Document';

      for (let i = 0; i < uploadedDoc.guidelines.length; i++) {
        const rule = uploadedDoc.guidelines[i];

        // A. Prohibited claims from PDF
        if (rule.category === 'prohibited_claims' && Array.isArray(rule.prohibitedTerms)) {
          for (const term of rule.prohibitedTerms) {
            if (!term || term.length < 2) continue;
            const termRegex = createWordOrPhraseRegex(term);
            let match: RegExpExecArray | null;

            while ((match = termRegex.exec(text)) !== null) {
              const matchedText = match[0];
              const startIndex = match.index;
              const endIndex = startIndex + matchedText.length;

              const isDuplicate = findings.some(
                f => f.startIndex === startIndex && f.endIndex === endIndex
              );

              if (!isDuplicate) {
                findings.push({
                  id: `det-pdf-proh-${rule.id}-${startIndex}`,
                  category: 'prohibited_term',
                  severity: rule.severity === 'Strict' ? 'critical' : 'high',
                  matchedText,
                  startIndex,
                  endIndex,
                  explanation: `[PDF: ${docName} (p. ${rule.pageNumber || 1})] ${rule.ruleText || rule.title}`,
                  recommendedCorrection: rule.suggestedReplacement || 'compliant phrasing',
                  confidence: 99,
                  ruleId: rule.id,
                  source: 'pdf_guideline',
                  pageNumber: rule.pageNumber,
                  pdfSource: docName
                });
              }
            }
          }
        }
      }
    }

    // 2. Built-in Prohibited Terminology Checks
    let prohibitedViolations = 0;
    for (const rule of this.config.prohibitedTerms) {
      const regex = createWordOrPhraseRegex(rule.term);
      let match: RegExpExecArray | null;
      let matchedInRule = false;

      while ((match = regex.exec(text)) !== null) {
        matchedInRule = true;
        prohibitedViolations++;
        const matchedText = match[0];
        const startIndex = match.index;
        const endIndex = startIndex + matchedText.length;

        // Check if already covered by an identical finding (e.g. from uploaded PDF)
        const isDuplicate = findings.some(
          f => f.startIndex === startIndex && f.endIndex === endIndex
        );

        if (!isDuplicate) {
          findings.push({
            id: `det-proh-${rule.id}-${startIndex}`,
            category: 'prohibited_term',
            severity: rule.severity,
            matchedText,
            startIndex,
            endIndex,
            explanation: rule.explanation,
            recommendedCorrection: rule.replacement,
            confidence: 98,
            ruleId: rule.id,
            source: 'deterministic'
          });
        }
      }

      if (!matchedInRule) {
        passedChecks.push(`Prohibited Term Check: No prohibited references to "${rule.term}"`);
      }
    }

    // 3. Preferred Terminology Checks
    for (const pref of this.config.preferredTerminology) {
      for (const alt of pref.alternatives) {
        const regex = createWordOrPhraseRegex(alt);
        let match: RegExpExecArray | null;

        while ((match = regex.exec(text)) !== null) {
          const matchedText = match[0];
          const startIndex = match.index;
          const endIndex = startIndex + matchedText.length;

          // Deduplicate if already matched
          const isDuplicate = findings.some(
            f => f.startIndex === startIndex && f.endIndex === endIndex
          );

          if (!isDuplicate) {
            findings.push({
              id: `det-pref-${pref.id}-${startIndex}`,
              category: 'preferred_term',
              severity: 'low',
              matchedText,
              startIndex,
              endIndex,
              explanation: pref.explanation,
              recommendedCorrection: pref.term,
              confidence: 95,
              ruleId: pref.id,
              source: 'deterministic'
            });
          }
        }
      }
    }

    // 4. Deterministic Fact Contradiction Checks
    let contradictionViolations = 0;
    if (this.config.claimRules?.contradictions) {
      for (let i = 0; i < this.config.claimRules.contradictions.length; i++) {
        const rule = this.config.claimRules.contradictions[i];
        const regex = new RegExp(rule.pattern, 'gi');
        let match: RegExpExecArray | null;
        let matched = false;

        while ((match = regex.exec(text)) !== null) {
          matched = true;
          contradictionViolations++;
          const matchedText = match[0];
          const startIndex = match.index;
          const endIndex = startIndex + matchedText.length;

          const isDuplicate = findings.some(
            f => f.startIndex === startIndex && f.endIndex === endIndex
          );

          if (!isDuplicate) {
            findings.push({
              id: `det-contra-${i}-${startIndex}`,
              category: 'fact_contradiction',
              severity: rule.severity,
              matchedText,
              startIndex,
              endIndex,
              explanation: `${rule.explanation} (Contradicts: ${rule.contradicts})`,
              recommendedCorrection: this.getSuggestedCorrectionForContradiction(rule.contradicts),
              confidence: 96,
              ruleId: `CONTRA-00${i + 1}`,
              source: 'deterministic'
            });
          }
        }

        if (!matched) {
          passedChecks.push(`Fact Check: Verified compliant with ${rule.contradicts.split(' ')[0]}`);
        }
      }
    }

    // 5. Deterministic Unsupported Claims Checks
    if (this.config.claimRules?.unsupportedPatterns) {
      for (let i = 0; i < this.config.claimRules.unsupportedPatterns.length; i++) {
        const rule = this.config.claimRules.unsupportedPatterns[i];
        const regex = new RegExp(rule.pattern, 'gi');
        let match: RegExpExecArray | null;

        while ((match = regex.exec(text)) !== null) {
          const matchedText = match[0];
          const startIndex = match.index;
          const endIndex = startIndex + matchedText.length;

          const isDuplicate = findings.some(
            f => f.startIndex === startIndex && f.endIndex === endIndex
          );

          if (!isDuplicate) {
            findings.push({
              id: `det-unsup-${i}-${startIndex}`,
              category: 'unsupported_claim',
              severity: rule.severity,
              matchedText,
              startIndex,
              endIndex,
              explanation: `${rule.explanation} Requires external documentation or qualified citation.`,
              recommendedCorrection: this.getSuggestedCorrectionForSuperlative(matchedText),
              confidence: 90,
              ruleId: `UNSUP-00${i + 1}`,
              source: 'deterministic'
            });
          }
        }
      }
    }

    // 6. Deterministic Tone & Voice Checks
    if (this.config.toneGuidelines?.toneRules) {
      for (const rule of this.config.toneGuidelines.toneRules) {
        const regex = new RegExp(rule.pattern, 'gi');
        let match: RegExpExecArray | null;

        while ((match = regex.exec(text)) !== null) {
          const matchedText = match[0];
          const startIndex = match.index;
          const endIndex = startIndex + matchedText.length;

          const isDuplicate = findings.some(
            f => f.startIndex === startIndex && f.endIndex === endIndex
          );

          if (!isDuplicate) {
            findings.push({
              id: `det-tone-${rule.id}-${startIndex}`,
              category: rule.category || 'tone_mismatch',
              severity: rule.severity,
              matchedText,
              startIndex,
              endIndex,
              explanation: rule.explanation,
              recommendedCorrection: rule.replacement,
              confidence: 92,
              ruleId: rule.id,
              source: 'deterministic'
            });
          }
        }
      }
    }

    // 7. Channel-specific checks (e.g. Ads length or hashtag warnings)
    if (channel === 'ads' && text.length > 500) {
      findings.push({
        id: `det-chan-ads-len`,
        category: 'channel_guidance',
        severity: 'low',
        matchedText: text.slice(0, 40) + '...',
        startIndex: 0,
        endIndex: Math.min(40, text.length),
        explanation: 'Ad copy is exceeding typical high-conversion length (recommended under 300 characters for primary ad text).',
        recommendedCorrection: 'Condense copy to focus on single primary call-to-action and value proposition.',
        confidence: 85,
        ruleId: 'CHAN-ADS-001',
        source: 'deterministic'
      });
    }

    if (prohibitedViolations === 0) {
      passedChecks.unshift('Brand Terminology: Zero prohibited or restricted terms detected');
    }
    if (contradictionViolations === 0) {
      passedChecks.unshift('Official Facts: No direct contradictions with approved brand facts found');
    }

    // Sort findings in chronological order of occurrence in text
    findings.sort((a, b) => a.startIndex - b.startIndex);

    return { findings, passedChecks };
  }

  private getSuggestedCorrectionForContradiction(contradicts: string): string {
    if (contradicts.includes('FACT-003')) {
      return '99.9% uptime SLA';
    }
    if (contradicts.includes('FACT-004')) {
      return '14-day free trial';
    }
    if (contradicts.includes('FACT-002')) {
      return 'ISO 27001 and SOC 2 Type II certified';
    }
    if (contradicts.includes('FACT-005')) {
      return 'over 10,000 active teams';
    }
    if (contradicts.includes('GOVERN')) {
      return 'Adhere strictly to official NovaTech brand guidelines, messaging frameworks, and visual standards';
    }
    if (contradicts.includes('DESIGN')) {
      return 'Use approved brand colors (Burgundy, Cream, Ink) and designated brand typography';
    }
    if (contradicts.includes('LOGO')) {
      return 'Always use the official, approved NovaTech logo asset without alteration';
    }
    if (contradicts.includes('AUDIENCE')) {
      return 'target audience is modern teams, enterprise organizations, and growing businesses';
    }
    return 'approved company specification';
  }

  private getSuggestedCorrectionForSuperlative(matchedText: string): string {
    const lower = matchedText.toLowerCase();
    if (lower.includes('#1') || lower.includes('best') || lower.includes('leader')) {
      return 'a trusted workflow management solution';
    }
    if (lower.includes('double') || lower.includes('roi') || lower.includes('10x')) {
      return 'measurably improve your team productivity';
    }
    if (lower.includes('military-grade') || lower.includes('unhackable')) {
      return 'enterprise-grade encryption with TLS 1.3 and AES-256';
    }
    return 'verified, high-performing solution';
  }
}
