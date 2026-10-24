import { GoogleGenAI } from '@google/genai';
import {
  AuditChannel,
  BrandProfileConfig,
  Finding,
  FindingCategory,
  FindingSeverity
} from '../types/audit.js';

export interface GeminiAuditResult {
  available: boolean;
  modelUsed?: string;
  findings: Finding[];
  toneAssessment?: {
    matchesBrandTone: boolean;
    detectedToneSummary: string;
    audienceSuitability: string;
  };
  suggestedRewrite?: string;
  error?: string;
}

interface RawGeminiFinding {
  category: string;
  severity: string;
  matchedExcerpt: string;
  explanation: string;
  recommendedCorrection: string;
  confidence: number;
}

interface RawGeminiResponse {
  toneAssessment: {
    matchesBrandTone: boolean;
    detectedToneSummary: string;
    audienceSuitability: string;
  };
  findings: RawGeminiFinding[];
  suggestedRewrite: string;
  passedToneChecks?: string[];
}

export class GeminiAuditService {
  private getApiKey(): string | undefined {
    return process.env.GEMINI_API_KEY?.trim();
  }

  public getModelName(): string {
    return process.env.GEMINI_MODEL?.trim() || 'gemini-3.7-flash';
  }

  public isConfigured(): boolean {
    const key = this.getApiKey();
    return Boolean(key && key.length > 5 && !key.includes('your_gemini_api_key'));
  }

  public async analyzeText(
    text: string,
    channel: AuditChannel,
    config: BrandProfileConfig
  ): Promise<GeminiAuditResult> {
    if (!this.isConfigured()) {
      return {
        available: false,
        findings: [],
        error: 'Gemini API key is not configured. Running deterministic rule checks only.'
      };
    }

    const apiKey = this.getApiKey()!;
    const model = this.getModelName();

    try {
      const ai = new GoogleGenAI({ apiKey });

      const approvedFactsList = config.approvedFacts
        .map(f => `- [${f.id}] ${f.statement}`)
        .join('\n');

      const systemInstruction = `You are the lead Brand Compliance & Content Auditor for NovaTech, an enterprise software company.
Brand Profile:
- Name: ${config.brand.name}
- Mission: ${config.brand.mission}
- Target Audience: ${config.brand.targetAudience}
- Tone of Voice: ${config.brand.brandTone} (Credible, professional, approachable, helpful, active voice, zero hype, zero hostility)
- Current Channel: ${channel.toUpperCase()}

Official Approved Facts (Ground Truth):
${approvedFactsList}

Your role is to perform nuanced, contextual Brand Governance and Tone Analysis.
Rules:
1. Assess if the text aligns with NovaTech's professional, friendly, and team-oriented tone.
2. Flag subtle aggressive, condescending, overly casual, hyperbolic, or misleading statements.
3. Compare claims against the Official Approved Facts. Distinguish between:
   - Direct Contradiction: contradicts an approved fact (e.g., claiming 100% uptime SLA or 30-day trial).
   - Unsupported Claim: claims a specific metric, award, customer figure, or promise with no evidence in the approved facts (e.g. "#1 workflow app in Europe").
   - Missing info is unknown, not automatically false unless stated as a guaranteed company claim.
   - Do NOT invent company facts.
4. If the text already matches NovaTech tone, do NOT fabricate issues. Give credit where earned.
5. Return ONLY a valid JSON object matching this exact schema:
{
  "toneAssessment": {
    "matchesBrandTone": boolean,
    "detectedToneSummary": string,
    "audienceSuitability": string
  },
  "findings": [
    {
      "category": "tone_mismatch" | "unsupported_claim" | "fact_contradiction",
      "severity": "critical" | "high" | "medium" | "low",
      "matchedExcerpt": string, // exact verbatim substring from the input text
      "explanation": string, // clear reasoning grounded in NovaTech guidelines
      "recommendedCorrection": string, // precise rewrite suggestion
      "confidence": number // integer from 50 to 99
    }
  ],
  "suggestedRewrite": string, // complete rewrite of input text fixing issues while preserving meaning
  "passedToneChecks": string[] // 1-3 positive tone elements verified
}`;

      const userPrompt = `Audit the following ${channel} draft for NovaTech brand compliance:\n\n"""\n${text}\n"""`;

      const response = await ai.models.generateContent({
        model,
        contents: [
          { role: 'user', parts: [{ text: `${systemInstruction}\n\n${userPrompt}` }] }
        ],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1
        }
      });

      const responseText = response.text?.trim() || '';
      if (!responseText) {
        throw new Error('Empty response received from Gemini model.');
      }

      // Safe JSON parsing
      let parsed: RawGeminiResponse;
      try {
        parsed = JSON.parse(responseText);
      } catch (parseErr) {
        // Fallback for markdown-wrapped json
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Failed to parse Gemini structured JSON response.');
        }
      }

      // Map raw findings to typed findings with exact index calculation
      const findings: Finding[] = (parsed.findings || []).map((raw, index) => {
        let startIndex = 0;
        let endIndex = 0;
        let matchedText = raw.matchedExcerpt || '';

        if (matchedText) {
          const lowerInput = text.toLowerCase();
          const lowerExcerpt = matchedText.toLowerCase();
          const foundIdx = lowerInput.indexOf(lowerExcerpt);
          if (foundIdx !== -1) {
            startIndex = foundIdx;
            endIndex = foundIdx + matchedText.length;
            matchedText = text.substring(startIndex, endIndex);
          } else {
            // Find best substring
            const firstWords = matchedText.split(/\s+/).slice(0, 3).join(' ').toLowerCase();
            const approxIdx = lowerInput.indexOf(firstWords);
            if (approxIdx !== -1) {
              startIndex = approxIdx;
              endIndex = Math.min(text.length, approxIdx + matchedText.length);
              matchedText = text.substring(startIndex, endIndex);
            }
          }
        }

        const validCategory: FindingCategory =
          raw.category === 'fact_contradiction'
            ? 'fact_contradiction'
            : raw.category === 'unsupported_claim'
            ? 'unsupported_claim'
            : 'tone_mismatch';

        const validSeverity: FindingSeverity =
          raw.severity === 'critical'
            ? 'critical'
            : raw.severity === 'high'
            ? 'high'
            : raw.severity === 'low'
            ? 'low'
            : 'medium';

        return {
          id: `gemini-${validCategory}-${index}-${startIndex}`,
          category: validCategory,
          severity: validSeverity,
          matchedText: matchedText || text.slice(0, 30),
          startIndex,
          endIndex: endIndex || Math.min(text.length, startIndex + 30),
          explanation: raw.explanation,
          recommendedCorrection: raw.recommendedCorrection,
          confidence: Math.min(99, Math.max(50, Math.round(raw.confidence || 85))),
          ruleId: `GEMINI-${validCategory.toUpperCase()}-${index + 1}`,
          source: 'gemini'
        };
      });

      return {
        available: true,
        modelUsed: model,
        findings,
        toneAssessment: parsed.toneAssessment,
        suggestedRewrite: parsed.suggestedRewrite
      };
    } catch (err: any) {
      console.error('Error during Gemini API analysis:', err?.message || err);
      return {
        available: false,
        findings: [],
        error: `Gemini analysis error: ${err?.message || 'Unexpected API failure'}. Fallback to deterministic rule audit.`
      };
    }
  }
}
