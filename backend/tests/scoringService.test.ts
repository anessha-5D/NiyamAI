import { describe, it, expect } from 'vitest';
import { ScoringService, SEVERITY_WEIGHTS } from '../src/services/scoringService.js';
import { Finding } from '../src/types/audit.js';

describe('ScoringService', () => {
  const service = new ScoringService();

  it('awards 100 points for text with zero findings', () => {
    const score = service.calculateScore([], false);
    expect(score.overallScore).toBe(100);
    expect(score.grade).toBe('A');
    expect(score.status).toBe('compliant');
    expect(score.categoryScores.terminology.score).toBe(100);
    expect(score.categoryScores.factualAccuracy.score).toBe(100);
    expect(score.categoryScores.toneVoice.score).toBe(100);
  });

  it('applies correct severity deductions', () => {
    const findings: Finding[] = [
      {
        id: '1',
        category: 'prohibited_term',
        severity: 'critical',
        matchedText: '100% bug-free',
        startIndex: 0,
        endIndex: 13,
        explanation: '',
        recommendedCorrection: '',
        confidence: 90,
        ruleId: 'PROH-002',
        source: 'deterministic'
      }
    ];

    const score = service.calculateScore(findings, false);
    // Critical deduction is 25 in terminology (100 - 25 = 75)
    // Overall = 75 * 0.35 + 100 * 0.35 + 100 * 0.30 = 26.25 + 35 + 30 = 91.25 -> 91
    expect(score.categoryScores.terminology.score).toBe(75);
    expect(score.overallScore).toBe(91);
    expect(score.deductions).toHaveLength(1);
    expect(score.deductions[0].pointsDeducted).toBe(SEVERITY_WEIGHTS.critical);
  });

  it('prevents duplicate deductions for overlapping findings', () => {
    const duplicateFindings: Finding[] = [
      {
        id: '1',
        category: 'prohibited_term',
        severity: 'high', // -15
        matchedText: 'cheap',
        startIndex: 10,
        endIndex: 15,
        explanation: 'Avoid cheap',
        recommendedCorrection: 'cost-effective',
        confidence: 95,
        ruleId: 'PROH-001',
        source: 'deterministic'
      },
      {
        id: '2',
        category: 'prohibited_term',
        severity: 'high', // duplicate range and rule
        matchedText: 'cheap',
        startIndex: 10,
        endIndex: 15,
        explanation: 'Avoid cheap',
        recommendedCorrection: 'cost-effective',
        confidence: 95,
        ruleId: 'PROH-001',
        source: 'deterministic'
      }
    ];

    const score = service.calculateScore(duplicateFindings, false);
    // Should deduplicate and deduct 15 once, not 30
    expect(score.categoryScores.terminology.score).toBe(85);
  });

  it('labels deterministic-only evaluation clearly when Gemini is offline', () => {
    const score = service.calculateScore([], true);
    expect(score.isDeterministicOnly).toBe(true);
    expect(score.categoryScores.toneVoice.summary).toContain('deterministic baseline');
  });
});
