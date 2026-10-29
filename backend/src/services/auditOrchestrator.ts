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

  public async runAudit(
    text: string,
    channel: AuditChannel = 'blogs',
    uploadedDoc?: any
  ): Promise<AuditReport> {
    const startTime = Date.now();
    const config = loadBrandConfig();

    // 1. Run Deterministic Engine
    const detResult = this.deterministicEngine.audit(text, channel, uploadedDoc);

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
      executionTimeMs,
      uploadedPdfDoc: uploadedDoc ? {
        fileName: uploadedDoc.fileName,
        totalRulesApplied: uploadedDoc.summary?.totalRules ?? uploadedDoc.guidelines?.length ?? 0
      } : undefined
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

    // Deduplicate overlapping spans: keep the one with higher severity or longer span
    const sorted = [...rawCombined].sort((a, b) => {
      const sDiff = (severityRank[b.severity] || 0) - (severityRank[a.severity] || 0);
      if (sDiff !== 0) return sDiff;
      return (b.endIndex - b.startIndex) - (a.endIndex - a.startIndex);
    });

    const deduped: Finding[] = [];
    for (const f of sorted) {
      const hasOverlap = deduped.some(
        existing =>
          Math.max(existing.startIndex, f.startIndex) < Math.min(existing.endIndex, f.endIndex)
      );
      if (!hasOverlap) {
        deduped.push(f);
      }
    }

    return deduped.sort((a, b) => a.startIndex - b.startIndex);
  }
}
