import { describe, it, expect } from 'vitest';
import { DeterministicRuleEngine } from '../src/services/deterministicEngine.js';
import { BrandProfileConfig } from '../src/types/audit.js';

const mockConfig: BrandProfileConfig = {
  brand: {
    name: 'NovaTech',
    description: 'Workflow software',
    brandTone: 'Professional and friendly',
    targetAudience: 'Teams and businesses',
    mission: 'Help teams manage workflows',
    tagline: 'Orchestration for modern teams'
  },
  prohibitedTerms: [
    {
      id: 'PROH-001',
      term: 'cheap',
      severity: 'high',
      category: 'brand_positioning',
      explanation: 'Avoid cheap',
      replacement: 'cost-effective'
    },
    {
      id: 'PROH-002',
      term: '100% bug-free',
      severity: 'critical',
      category: 'legal_liability',
      explanation: 'No bug-free claims',
      replacement: 'rigorously tested'
    }
  ],
  preferredTerminology: [
    {
      id: 'PREF-001',
      term: 'cost-effective',
      alternatives: ['budget-rate', 'low-priced'],
      explanation: 'Use cost-effective'
    }
  ],
  approvedFacts: [
    {
      id: 'FACT-003',
      topic: 'uptime',
      statement: 'Guaranteed 99.9% uptime SLA',
      verifiableKeywords: ['99.9%', 'uptime']
    }
  ],
  claimRules: {
    contradictions: [
      {
        pattern: "(?:100%|100 percent)\\s+uptime",
        contradicts: "FACT-003 (99.9% SLA)",
        severity: "critical",
        explanation: "Official SLA is 99.9%"
      }
    ],
    unsupportedPatterns: [
      {
        pattern: "(?:#1|number\\s+one|world['']?s\\s+best)",
        type: "unsubstantiated_superlative",
        severity: "medium",
        explanation: "Superlative requires documentation"
      }
    ]
  },
  toneGuidelines: {
    voiceAttributes: ['Professional'],
    channelAdjustments: { ads: 'Concise' }
  }
};

describe('DeterministicRuleEngine', () => {
  const engine = new DeterministicRuleEngine(mockConfig);

  it('detects prohibited terms accurately', () => {
    const text = 'Our software is cheap and works well.';
    const result = engine.audit(text, 'blogs');
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0].matchedText).toBe('cheap');
    expect(result.findings[0].category).toBe('prohibited_term');
    expect(result.findings[0].severity).toBe('high');
    expect(result.findings[0].recommendedCorrection).toBe('cost-effective');
  });

  it('respects whole-word boundaries and avoids substring false positives', () => {
    // "cheaper" or "cheapskate" should not match whole word "cheap"
    const text = 'This process is cheaper than before.';
    const result = engine.audit(text, 'blogs');
    expect(result.findings.some(f => f.matchedText.toLowerCase() === 'cheap')).toBe(false);
  });

  it('performs case-insensitive matching', () => {
    const text = 'We guarantee CHEAP and 100% BUG-FREE execution.';
    const result = engine.audit(text, 'blogs');
    expect(result.findings).toHaveLength(2);
    expect(result.findings[0].matchedText).toBe('CHEAP');
    expect(result.findings[1].matchedText).toBe('100% BUG-FREE');
  });

  it('identifies preferred terminology alternatives and suggests standard replacements', () => {
    const text = 'We offer a budget-rate solution for startups.';
    const result = engine.audit(text, 'blogs');
    const prefFinding = result.findings.find(f => f.category === 'preferred_term');
    expect(prefFinding).toBeDefined();
    expect(prefFinding?.matchedText).toBe('budget-rate');
    expect(prefFinding?.recommendedCorrection).toBe('cost-effective');
  });

  it('distinguishes claim contradiction from unsupported claims', () => {
    const text = 'We offer 100% uptime and we are the world\'s best workflow engine.';
    const result = engine.audit(text, 'blogs');

    const contradiction = result.findings.find(f => f.category === 'fact_contradiction');
    const unsupported = result.findings.find(f => f.category === 'unsupported_claim');

    expect(contradiction).toBeDefined();
    expect(contradiction?.severity).toBe('critical');
    expect(contradiction?.explanation).toContain('99.9%');

    expect(unsupported).toBeDefined();
    expect(unsupported?.severity).toBe('medium');
    expect(unsupported?.explanation).toContain('Superlative requires documentation');
  });

  it('prevents duplicate findings for identical text tokens', () => {
    const text = 'Our tool is cheap.';
    const result = engine.audit(text, 'blogs');
    const cheapFindings = result.findings.filter(f => f.matchedText.toLowerCase() === 'cheap');
    expect(cheapFindings).toHaveLength(1);
  });

  it('returns clean passed checks when text has no violations', () => {
    const text = 'NovaTech provides a reliable, cost-effective workflow management solution.';
    const result = engine.audit(text, 'blogs');
    expect(result.findings).toHaveLength(0);
    expect(result.passedChecks.length).toBeGreaterThan(0);
  });
});
