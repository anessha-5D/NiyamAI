import { describe, it, expect } from 'vitest';
import { CorrectionService } from '../src/services/correctionService.js';
import { Finding } from '../src/types/audit.js';

describe('CorrectionService', () => {
  const service = new CorrectionService();

  it('applies a single correction and preserves surrounding text and formatting', () => {
    const original = 'We offer a cheap option for teams.';
    const finding: Finding = {
      id: 'f1',
      category: 'prohibited_term',
      severity: 'high',
      matchedText: 'cheap',
      startIndex: 11,
      endIndex: 16,
      explanation: 'Avoid cheap',
      recommendedCorrection: 'cost-effective',
      confidence: 95,
      ruleId: 'PROH-001',
      source: 'deterministic'
    };

    const corrected = service.applySingleCorrection(original, finding);
    expect(corrected).toBe('We offer a cost-effective option for teams.');
  });

  it('applies all corrections in reverse index order without offset drift', () => {
    const original = 'Our cheap tool has a revolutionary hack for modern teams.';
    const findings: Finding[] = [
      {
        id: 'f1',
        category: 'prohibited_term',
        severity: 'high',
        matchedText: 'cheap',
        startIndex: 4,
        endIndex: 9,
        explanation: '',
        recommendedCorrection: 'cost-effective',
        confidence: 95,
        ruleId: 'PROH-001',
        source: 'deterministic'
      },
      {
        id: 'f2',
        category: 'prohibited_term',
        severity: 'medium',
        matchedText: 'revolutionary hack',
        startIndex: 21,
        endIndex: 39,
        explanation: '',
        recommendedCorrection: 'proven optimization technique',
        confidence: 90,
        ruleId: 'PROH-005',
        source: 'deterministic'
      }
    ];

    const corrected = service.applyAllCorrections(original, findings);
    expect(corrected).toBe('Our cost-effective tool has a proven optimization technique for modern teams.');
  });

  it('prefers Gemini holistic rewrite when available', () => {
    const original = 'Our cheap tool is 100% bug-free.';
    const geminiRewrite = 'Our cost-effective platform is thoroughly tested and reliable.';
    const findings: Finding[] = [
      {
        id: 'f1',
        category: 'tone_mismatch',
        severity: 'high',
        matchedText: 'cheap',
        startIndex: 4,
        endIndex: 9,
        explanation: '',
        recommendedCorrection: 'cost-effective',
        confidence: 90,
        ruleId: 'GEMINI-01',
        source: 'gemini'
      }
    ];

    const corrected = service.applyAllCorrections(original, findings, geminiRewrite);
    expect(corrected).toBe(geminiRewrite);
  });
});
