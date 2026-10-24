import {
  BrandComplianceScore,
  CategoryScore,
  DeductionItem,
  Finding,
  FindingCategory,
  FindingSeverity
} from '../types/audit.js';

export const SEVERITY_WEIGHTS: Record<FindingSeverity, number> = {
  critical: 25,
  high: 15,
  medium: 8,
  low: 4,
  info: 0
};

export class ScoringService {
  /**
   * Calculates an explainable, deterministic brand compliance score from 0 to 100.
   */
  public calculateScore(
    findings: Finding[],
    isDeterministicOnly: boolean
  ): BrandComplianceScore {
    // 1. Deduplicate findings to prevent compound penalization on the same text range
    const dedupedFindings = this.deduplicateFindings(findings);

    // 2. Tally deductions per category
    const deductions: DeductionItem[] = [];
    let termDeductions = 0;
    let factDeductions = 0;
    let toneDeductions = 0;

    for (const f of dedupedFindings) {
      const points = SEVERITY_WEIGHTS[f.severity] || 0;
      deductions.push({
        id: `deduct-${f.id}`,
        ruleId: f.ruleId,
        label: `${f.category.replace(/_/g, ' ')}: "${f.matchedText}"`,
        pointsDeducted: points,
        severity: f.severity
      });

      if (f.category === 'prohibited_term' || f.category === 'preferred_term') {
        termDeductions += points;
      } else if (f.category === 'fact_contradiction' || f.category === 'unsupported_claim') {
        factDeductions += points;
      } else {
        toneDeductions += points;
      }
    }

    // 3. Category Subscores (clamped 0 to 100)
    const termScoreVal = Math.max(0, 100 - termDeductions);
    const factScoreVal = Math.max(0, 100 - factDeductions);
    const toneScoreVal = Math.max(0, 100 - toneDeductions);

    const termCategory: CategoryScore = {
      category: 'terminology',
      label: 'Brand Terminology',
      score: termScoreVal,
      status: termScoreVal >= 90 ? 'pass' : termScoreVal >= 70 ? 'warning' : 'fail',
      violationsCount: dedupedFindings.filter(
        f => f.category === 'prohibited_term' || f.category === 'preferred_term'
      ).length,
      summary:
        termScoreVal === 100
          ? 'Full alignment with approved vocabulary and prohibited terms.'
          : `${termDeductions} points deducted across vocabulary and terminology checks.`
    };

    const factCategory: CategoryScore = {
      category: 'factualAccuracy',
      label: 'Factual Accuracy & Claims',
      score: factScoreVal,
      status: factScoreVal >= 90 ? 'pass' : factScoreVal >= 70 ? 'warning' : 'fail',
      violationsCount: dedupedFindings.filter(
        f => f.category === 'fact_contradiction' || f.category === 'unsupported_claim'
      ).length,
      summary:
        factScoreVal === 100
          ? 'No unsupported or contradictory claims detected against NovaTech facts.'
          : `${factDeductions} points deducted across claim verification checks.`
    };

    const toneCategory: CategoryScore = {
      category: 'toneVoice',
      label: 'Tone & Audience Alignment',
      score: toneScoreVal,
      status: toneScoreVal >= 90 ? 'pass' : toneScoreVal >= 70 ? 'warning' : 'fail',
      violationsCount: dedupedFindings.filter(
        f => f.category === 'tone_mismatch' || f.category === 'channel_guidance'
      ).length,
      summary: isDeterministicOnly
        ? 'Evaluated via deterministic baseline heuristics (Gemini AI contextual tone analysis offline).'
        : toneScoreVal === 100
        ? 'Voice matches NovaTech professional and friendly tone.'
        : `${toneDeductions} points deducted for tone calibration and style issues.`
    };

    // 4. Overall Weighted Score: 35% Terminology + 35% Facts + 30% Tone
    const overallScore = Math.max(
      0,
      Math.min(
        100,
        Math.round(termScoreVal * 0.35 + factScoreVal * 0.35 + toneScoreVal * 0.3)
      )
    );

    // 5. Letter Grade and Status
    let grade: 'A' | 'B' | 'C' | 'D' | 'F' = 'F';
    let status: 'compliant' | 'needs_attention' | 'non_compliant' = 'non_compliant';

    if (overallScore >= 90) {
      grade = 'A';
      status = 'compliant';
    } else if (overallScore >= 75) {
      grade = 'B';
      status = 'compliant';
    } else if (overallScore >= 60) {
      grade = 'C';
      status = 'needs_attention';
    } else if (overallScore >= 45) {
      grade = 'D';
      status = 'needs_attention';
    } else {
      grade = 'F';
      status = 'non_compliant';
    }

    const scoringFormula =
      'OverallScore = round(Terminology(35%) + FactualAccuracy(35%) + ToneVoice(30%)) where each category starts at 100 minus severity deductions (Critical: -25, High: -15, Medium: -8, Low: -4).';

    return {
      overallScore,
      grade,
      status,
      scoringFormula,
      categoryScores: {
        terminology: termCategory,
        factualAccuracy: factCategory,
        toneVoice: toneCategory
      },
      deductions,
      isDeterministicOnly
    };
  }

  /**
   * Filters out duplicate or overlapping findings for the same text token or range.
   */
  private deduplicateFindings(findings: Finding[]): Finding[] {
    const result: Finding[] = [];

    // Sort by severity priority so highest penalty stays if overlapping
    const severityRank: Record<FindingSeverity, number> = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
      info: 0
    };

    const sorted = [...findings].sort((a, b) => {
      const diff = (severityRank[b.severity] || 0) - (severityRank[a.severity] || 0);
      if (diff !== 0) return diff;
      // If same severity, prefer longer match
      return (b.endIndex - b.startIndex) - (a.endIndex - a.startIndex);
    });

    for (const f of sorted) {
      // Check if this finding overlaps with any already accepted finding
      const hasOverlap = result.some(existing => {
        return (
          Math.max(existing.startIndex, f.startIndex) <
          Math.min(existing.endIndex, f.endIndex)
        );
      });

      if (!hasOverlap) {
        result.push(f);
      }
    }

    return result.sort((a, b) => a.startIndex - b.startIndex);
  }
}
