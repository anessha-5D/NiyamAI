import fs from 'fs';
import path from 'path';
import { BrandProfileConfig } from '../types/audit.js';

let cachedConfig: BrandProfileConfig | null = null;

export function getBrandConfigPath(): string {
  // Try current directory config or relative to src
  const possiblePaths = [
    path.resolve(process.cwd(), 'src/config/brandProfile.json'),
    path.resolve(process.cwd(), 'dist/config/brandProfile.json'),
    path.resolve(process.cwd(), 'backend/src/config/brandProfile.json'),
    path.resolve(process.cwd(), 'backend/dist/config/brandProfile.json')
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  // Fallback default
  return path.resolve(process.cwd(), 'src/config/brandProfile.json');
}

export function loadBrandConfig(): BrandProfileConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  try {
    const configPath = getBrandConfigPath();
    const raw = fs.readFileSync(configPath, 'utf-8');
    cachedConfig = JSON.parse(raw) as BrandProfileConfig;
    return cachedConfig;
  } catch (error) {
    console.warn('Warning: Could not read brandProfile.json from disk, falling back to embedded defaults.', error);
    // Embedded safe fallback matching NovaTech requirements
    cachedConfig = {
      brand: {
        name: "NovaTech",
        description: "Software company helping teams manage workflows effectively and securely",
        brandTone: "Professional and friendly",
        targetAudience: "Teams and businesses",
        mission: "Help teams manage their workflows more effectively with intelligent, reliable tools",
        tagline: "Intelligent workflow orchestration for modern teams"
      },
      prohibitedTerms: [
        {
          id: "PROH-001",
          term: "cheap",
          severity: "high",
          category: "brand_positioning",
          explanation: "NovaTech is positioned as an enterprise-grade solution. 'Cheap' degrades brand perceived value.",
          replacement: "cost-effective"
        },
        {
          id: "PROH-002",
          term: "100% bug-free",
          severity: "critical",
          category: "legal_liability",
          explanation: "Absolutist claims like '100% bug-free' create legal warranties and are unverifiable.",
          replacement: "rigorously tested and stable"
        },
        {
          id: "PROH-003",
          term: "guaranteed 100% uptime",
          severity: "critical",
          category: "compliance_contradiction",
          explanation: "Contradicts approved brand SLA: NovaTech Enterprise offers 99.9% uptime SLA, never 100%.",
          replacement: "99.9% uptime SLA"
        }
      ],
      preferredTerminology: [
        {
          id: "PREF-001",
          term: "cost-effective",
          alternatives: ["budget-rate", "low-priced"],
          explanation: "Use 'cost-effective' to convey value without sounding low-end."
        }
      ],
      approvedFacts: [
        {
          id: "FACT-001",
          topic: "founding",
          statement: "NovaTech was founded in 2021 by workflow automation specialists.",
          verifiableKeywords: ["founded", "2021"]
        },
        {
          id: "FACT-002",
          topic: "compliance_certifications",
          statement: "NovaTech is certified for ISO 27001 and SOC 2 Type II data security standards.",
          verifiableKeywords: ["iso 27001", "soc 2"]
        },
        {
          id: "FACT-003",
          topic: "uptime_sla",
          statement: "NovaTech provides a guaranteed 99.9% uptime SLA exclusively on Enterprise tiers.",
          verifiableKeywords: ["99.9%", "uptime", "sla"]
        },
        {
          id: "FACT-004",
          topic: "trial_period",
          statement: "NovaTech offers a 14-day free trial on all plans with no credit card required.",
          verifiableKeywords: ["14-day", "free trial"]
        }
      ],
      claimRules: {
        contradictions: [
          {
            pattern: "(?:100%|100 percent)\\s+uptime",
            contradicts: "FACT-003 (Approved SLA is 99.9%)",
            severity: "critical",
            explanation: "Contradicts NovaTech's official 99.9% uptime SLA."
          }
        ],
        unsupportedPatterns: [
          {
            pattern: "(?:#1|number\\s+one|world['']?s\\s+best)",
            type: "unsubstantiated_superlative",
            severity: "medium",
            explanation: "Unsubstantiated superlative claims require verified third-party awards."
          }
        ]
      },
      toneGuidelines: {
        voiceAttributes: [
          "Professional: Credible, articulate, and respectful of enterprise standards",
          "Friendly: Accessible, collaborative, and human rather than robotic or stiff"
        ],
        channelAdjustments: {
          "ads": "Crisp, benefit-driven, high urgency without false scarcity",
          "social": "Conversational, engaging, community-focused"
        }
      }
    };
    return cachedConfig;
  }
}

export function reloadBrandConfig(): BrandProfileConfig {
  cachedConfig = null;
  return loadBrandConfig();
}
