import { randomUUID } from 'crypto';
import { loadBrandConfig } from '../config/brandProfile.js';
import {
  AuditChannel,
  AuditReport,
  AuditSummary,
  Finding
} from '../types/audit.js';
import { CorrectionService } from './correctionService.js';
import { DeterministicRuleEngine } from './deterministicEngine.js';
import { GeminiAuditService } from './geminiService.js';
import { ScoringService } from './scoringService.js';

export class AuditOrchestrator {
  private deterministicEngine: DeterministicRuleEngine;
  private geminiService: GeminiAuditService;
  private scoringService: ScoringService;
  private correctionService: CorrectionService;

  constructor() {
    const config = loadBrandConfig();
    this.deterministicEngine = new DeterministicRuleEngine(config);
    this.geminiService = new GeminiAuditService();
    this.scoringService = new ScoringService();
    this.correctionService = new CorrectionService();
  }

  public async runAudit(text: string, channel: AuditChannel = 'blogs'): Promise<AuditReport> {
    const startTime = Date.now();
    const config = loadBrandConfig();

    // 1. Run Deterministic Engine
    const detResult = this.deterministicEngine.audit(text, channel);

    // 2. Run Gemini Contextual Analysis (if API key present)
    const geminiResult = await this.geminiService.analyzeText(text, channel, config);

    // 3. Merge findings and deduplicate between deterministic and Gemini
    const mergedFindings = this.mergeFindings(detResult.findings, geminiResult.findings);

    // 4. Calculate Scores
    const isDeterministicOnly = !geminiResult.available;
    const score = this.scoringService.calculateScore(mergedFindings, isDeterministicOnly);

    // 5. Generate Full Corrected Text Preview
    const correctedText = this.correctionService.applyAllCorrections(
      text,
      mergedFindings,
      geminiResult.suggestedRewrite
    );

    // 6. Summary metrics
    const summary: AuditSummary = {
      totalFindings: mergedFindings.length,
      criticalCount: mergedFindings.filter(f => f.severity === 'critical').length,
      highCount: mergedFindings.filter(f => f.severity === 'high').length,
      mediumCount: mergedFindings.filter(f => f.severity === 'medium').length,
      lowCount: mergedFindings.filter(f => f.severity === 'low').length,
      passedCount: detResult.passedChecks.length
    };

    // Passed checks combined
    const passedChecks = [...detResult.passedChecks];
    if (geminiResult.available && geminiResult.toneAssessment?.matchesBrandTone) {
      passedChecks.push(`Voice & Tone Check: Content aligns with ${config.brand.name}'s professional and friendly voice`);
    }

    const executionTimeMs = Date.now() - startTime;

    return {
      auditId: `audit-${randomUUID().slice(0, 8)}`,
      timestamp: new Date().toISOString(),
      inputText: text,
      channel,
      brand: {
        name: config.brand.name,
        tone: config.brand.brandTone,
        targetAudience: config.brand.targetAudience
      },
      engineMode: geminiResult.available ? 'hybrid' : 'deterministic-only',
      modelUsed: geminiResult.modelUsed,
      score,
      findings: mergedFindings,
      correctedText,
      passedChecks,
      summary,
      executionTimeMs
    };
  }

  /**
   * Merges deterministic and Gemini findings, avoiding duplicate penalties
   * or overlapping findings when multiple rules or Gemini flag the same text.
   */
  private mergeFindings(detFindings: Finding[], geminiFindings: Finding[]): Finding[] {
    const rawCombined: Finding[] = [...detFindings, ...geminiFindings];

    const severityRank: Record<string, number> = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
      info: 0
    };

    // Sort by severity descending, then by length descending
    const sorted = [...rawCombined].sort((a, b) => {
      const diff = (severityRank[b.severity] || 0) - (severityRank[a.severity] || 0);
      if (diff !== 0) return diff;
      return (b.endIndex - b.startIndex) - (a.endIndex - a.startIndex);
    });

    const deduped: Finding[] = [];
    for (const f of sorted) {
      const hasOverlap = deduped.some(existing => {
        // If range overlaps
        if (f.startIndex >= 0 && f.endIndex > f.startIndex && existing.startIndex >= 0 && existing.endIndex > existing.startIndex) {
          return Math.max(existing.startIndex, f.startIndex) < Math.min(existing.endIndex, f.endIndex);
        }
        // If text matches exactly
        return (
          existing.matchedText.toLowerCase().includes(f.matchedText.toLowerCase()) ||
          f.matchedText.toLowerCase().includes(existing.matchedText.toLowerCase())
        );
      });

      if (!hasOverlap) {
        deduped.push(f);
      }
    }

    return deduped.sort((a, b) => a.startIndex - b.startIndex);
  }
}
