/**
 * NiyamAI - Intelligent Brand Governance & AI Compliance Platform
 * Step 05: Publishing, Audit Trail & Governance Analytics
 * 
 * Realistic Enterprise Governance Mock Data
 */

const NiyamMockData = {
  // Executive Overview KPIs
  kpis: {
    brandHealthScore: 95.4,
    brandHealthDelta: "+2.8%",
    publishedAssetsCount: 248,
    gatePassRate: "96.2%",
    violationsPrevented: 64,
    avgReleaseVelocity: "3.2 hrs",
    avgVelocityPrevious: "48.0 hrs"
  },

  // Publishing Queue Assets
  assets: [
    {
      id: "AST-1082",
      title: "Q4 Global AI Flagship Launch — Press Release & Hero Copy",
      category: "Press Release",
      author: "Aarav Sharma (Product Marketing)",
      date: "2026-10-23",
      timestamp: "10:45 AM",
      wordCount: 840,
      overallScore: 98,
      thresholdStatus: "PASSED",
      status: "Ready to Publish",
      approvals: { current: 3, required: 3, signedBy: ["Elena Rostova (Brand Lead)", "Marcus Vance (Legal)", "Devin Chen (VP Marketing)"] },
      scores: {
        tone: 99,
        claims: 97,
        accessibility: 96,
        visual: 100
      },
      channels: ["PR Newswire", "Corporate Website", "LinkedIn Executive"],
      summary: "Official announcement for NiyamAI Enterprise v2.0 highlighting automated pre-publish compliance.",
      governanceHash: "0x8f2d5a3c10b741e97d25e0c529948ef63402778a48bc63557e4922119bb9e410",
      auditTrail: [
        {
          step: 1,
          stage: "INGEST",
          actor: "Aarav Sharma",
          role: "Content Creator",
          time: "09:15 AM",
          action: "Asset draft imported via Markdown connector",
          detail: "Initial copy submitted for automated pre-screening.",
          status: "completed"
        },
        {
          step: 2,
          stage: "AI_AUDIT",
          actor: "NiyamAI Multimodal Audit Engine",
          role: "Automated Governance",
          time: "09:16 AM",
          action: "Multi-vector brand compliance scan",
          detail: "Checked tone against Brand Book v4.1, claims against SEC/FTC factbase, accessibility WCAG 2.1 AA.",
          status: "flagged",
          flags: [
            {
              type: "Claim Verification",
              severity: "Medium",
              rule: "Brand Guideline §4.2: Verifiable Technical Claims",
              found: "\"Guarantees 100% elimination of all regulatory fines\"",
              suggestedFix: "\"Engineered to dramatically reduce regulatory compliance risk and policy violations\"",
              resolution: "Auto-corrected and approved by creator"
            }
          ]
        },
        {
          step: 3,
          stage: "CORRECTION",
          actor: "Aarav Sharma",
          role: "Content Creator",
          time: "09:28 AM",
          action: "Applied AI intent-preserving correction",
          detail: "Modified superlative claim to verified factual claim; re-ran scan. All tests passed.",
          status: "completed"
        },
        {
          step: 4,
          stage: "HUMAN_REVIEW",
          actor: "Marcus Vance",
          role: "Legal & Regulatory Counsel",
          time: "10:12 AM",
          action: "Tier-2 Human Review Sign-off",
          detail: "Signed off on revised compliance assertions and liability disclosures.",
          status: "approved"
        },
        {
          step: 5,
          stage: "BRAND_APPROVAL",
          actor: "Elena Rostova",
          role: "Global Brand Director",
          time: "10:40 AM",
          action: "Executive Brand Sign-off",
          detail: "Tone alignment verified: Authoritative, empathetic, clear.",
          status: "approved"
        },
        {
          step: 6,
          stage: "GATE_VERIFICATION",
          actor: "NiyamAI Release Gatekeeper",
          role: "Release Gatekeeper",
          time: "10:45 AM",
          action: "Pre-Publish Threshold Validation",
          detail: "All 4 governance vectors exceed 95% threshold. All 3 required signatures validated. Tamper-evident hash generated.",
          status: "ready"
        }
      ]
    },
    {
      id: "AST-1083",
      title: "Eco-Conscious Packaging Social Campaign — Instagram & TikTok Carousel",
      category: "Social Media",
      author: "Priya Nair (Creative Agency)",
      date: "2026-10-23",
      timestamp: "11:20 AM",
      wordCount: 220,
      overallScore: 79,
      thresholdStatus: "BLOCKED",
      status: "Blocked: Below Threshold",
      approvals: { current: 1, required: 2, signedBy: ["Priya Nair (Agency Copywriter)"] },
      scores: {
        tone: 92,
        claims: 68,
        accessibility: 76,
        visual: 82
      },
      channels: ["Instagram", "TikTok", "Facebook Ads"],
      summary: "Consumer-facing promotional carousel highlighting sustainable packaging and green delivery.",
      governanceHash: null,
      blockReasons: [
        "Unsubstantiated green claim: '100% Zero-Carbon Footprint' violates FTC Green Guides §260.4.",
        "Color contrast ratio (2.8:1) on slide 3 fails WCAG AA minimum requirement of 4.5:1.",
        "Missing mandatory ESG Sustainability Legal Disclaimer."
      ],
      auditTrail: [
        {
          step: 1,
          stage: "INGEST",
          actor: "Priya Nair",
          role: "Creative Agency",
          time: "11:00 AM",
          action: "Social asset carousel uploaded with image assets",
          detail: "Uploaded 4 images and caption copy.",
          status: "completed"
        },
        {
          step: 2,
          stage: "AI_AUDIT",
          actor: "NiyamAI Vision & Text Audit Engine",
          role: "Automated Governance",
          time: "11:02 AM",
          action: "Comprehensive multimodal audit",
          detail: "Detected 2 high-severity violations in visual contrast and claims.",
          status: "blocked",
          flags: [
            {
              type: "Legal / Regulatory",
              severity: "High",
              rule: "FTC Green Guides §260.4 & Brand Rule §7.1",
              found: "\"100% Zero-Carbon Footprint with Zero Net Impact\"",
              suggestedFix: "\"Crafted with 85% post-consumer recycled materials to minimize packaging footprint\"",
              resolution: "Unresolved — requires Legal Reviewer sign-off"
            },
            {
              type: "Accessibility",
              severity: "Medium",
              rule: "WCAG 2.1 AA Contrast standard (Brand Rule §9.3)",
              found: "Light blush text on white banner (#EADCD5 on #FFFFFF = 2.8:1)",
              suggestedFix: "Use deep wine (#561D2E) text for 7.8:1 contrast ratio",
              resolution: "Unresolved — pending visual update"
            }
          ]
        },
        {
          step: 3,
          stage: "GATE_VERIFICATION",
          actor: "NiyamAI Release Gatekeeper",
          role: "Release Gatekeeper",
          time: "11:20 AM",
          action: "Pre-Publish Threshold Validation FAILED",
          detail: "Claim score (68%) and Accessibility (76%) fail the 90% threshold. Missing Legal Counsel approval. Dispatch blocked.",
          status: "blocked"
        }
      ]
    },
    {
      id: "AST-1084",
      title: "Enterprise AI Governance Whitepaper — Executive Summary",
      category: "Whitepaper",
      author: "David Kim (Research & Strategy)",
      date: "2026-10-23",
      timestamp: "09:30 AM",
      wordCount: 1450,
      overallScore: 96,
      thresholdStatus: "PASSED",
      status: "Ready to Publish",
      approvals: { current: 2, required: 2, signedBy: ["David Kim (Lead Analyst)", "Elena Rostova (Brand Lead)"] },
      scores: {
        tone: 98,
        claims: 95,
        accessibility: 94,
        visual: 97
      },
      channels: ["Website Resource Hub", "Salesforce Partner Portal", "Email Campaign"],
      summary: "In-depth research report detailing enterprise compliance benchmarks across Fortune 500 AI deployments.",
      governanceHash: "0x4a9e887f1c32b509e86311ddaf9013e8432a67bc45df33215809ab77c1265fa1",
      auditTrail: [
        {
          step: 1,
          stage: "INGEST",
          actor: "David Kim",
          role: "Lead Analyst",
          time: "08:15 AM",
          action: "Whitepaper PDF & Executive Summary text ingested",
          detail: "Cross-checked with corporate terminology dictionary.",
          status: "completed"
        },
        {
          step: 2,
          stage: "AI_AUDIT",
          actor: "NiyamAI Multimodal Audit Engine",
          role: "Automated Governance",
          time: "08:17 AM",
          action: "Tone, Style & Fact Checking",
          detail: "Cross-verified 14 cited research statistics against authoritative sources. Tone scored 98% authoritative.",
          status: "completed"
        },
        {
          step: 3,
          stage: "BRAND_APPROVAL",
          actor: "Elena Rostova",
          role: "Global Brand Director",
          time: "09:10 AM",
          action: "Brand Consistency Approval",
          detail: "Typography and visual guidelines verified. Ready for gated release.",
          status: "approved"
        },
        {
          step: 4,
          stage: "GATE_VERIFICATION",
          actor: "NiyamAI Release Gatekeeper",
          role: "Release Gatekeeper",
          time: "09:30 AM",
          action: "Pre-Publish Threshold Validation",
          detail: "All quality gates satisfied. Digital compliance certificate ready for emission.",
          status: "ready"
        }
      ]
    },
    {
      id: "AST-1085",
      title: "Global Partner Summit 2026 Invitation & Agenda",
      category: "Email Marketing",
      author: "Sofia Martinez (Field Marketing)",
      date: "2026-10-23",
      timestamp: "11:42 AM",
      wordCount: 420,
      overallScore: 97,
      thresholdStatus: "PUBLISHED",
      status: "Published",
      publishedAt: "2026-10-23 11:42:18",
      approvals: { current: 3, required: 3, signedBy: ["Sofia Martinez", "Elena Rostova", "Marcus Vance"] },
      scores: {
        tone: 98,
        claims: 99,
        accessibility: 95,
        visual: 96
      },
      channels: ["Marketo", "Partner Portal", "Direct Email"],
      summary: "Executive invitation to EMEA and APAC channel partners for annual innovation summit.",
      governanceHash: "0x3e18a90d45b78ca9012fce451299efaa87612c0199435bda5e6f112cba876301",
      auditTrail: [
        {
          step: 1,
          stage: "INGEST",
          actor: "Sofia Martinez",
          role: "Field Marketing",
          time: "10:00 AM",
          action: "HTML Email Template ingested",
          detail: "Responsive email layout and personalized merge tags loaded.",
          status: "completed"
        },
        {
          step: 2,
          stage: "AI_AUDIT",
          actor: "NiyamAI Audit Engine",
          role: "Automated Governance",
          time: "10:01 AM",
          action: "Email deliverability and compliance review",
          detail: "Checked CAN-SPAM and GDPR unsubscribe requirements. Verified brand headers.",
          status: "completed"
        },
        {
          step: 3,
          stage: "HUMAN_REVIEW",
          actor: "Marcus Vance",
          role: "Legal Counsel",
          time: "10:50 AM",
          action: "Data privacy & consent review",
          detail: "GDPR language validated. Approved for sending.",
          status: "approved"
        },
        {
          step: 4,
          stage: "GATE_VERIFICATION",
          actor: "NiyamAI Release Gatekeeper",
          role: "Release Gatekeeper",
          time: "11:40 AM",
          action: "Release authorization approved",
          detail: "Cryptographic manifest committed. Audit ID: CERT-2026-8842.",
          status: "completed"
        },
        {
          step: 5,
          stage: "PUBLISH",
          actor: "Automated Multi-Channel Dispatcher",
          role: "Publishing API",
          time: "11:42 AM",
          action: "Multi-channel release executed",
          detail: "Successfully pushed to Marketo & Partner Portal. HTTP 200 OK.",
          status: "completed"
        }
      ]
    },
    {
      id: "AST-1086",
      title: "Quarterly Compliance & ESG Impact Brief",
      category: "Corporate Report",
      author: "Vikram Mehta (IR Team)",
      date: "2026-10-22",
      timestamp: "04:15 PM",
      wordCount: 2100,
      overallScore: 95,
      thresholdStatus: "PUBLISHED",
      status: "Published",
      publishedAt: "2026-10-22 16:15:02",
      approvals: { current: 3, required: 3, signedBy: ["Vikram Mehta", "Marcus Vance", "Elena Rostova"] },
      scores: {
        tone: 96,
        claims: 98,
        accessibility: 92,
        visual: 95
      },
      channels: ["Investor Relations Website", "SEC EDGAR Feed", "Press Wire"],
      summary: "Comprehensive ESG update disclosing governance milestones, renewable data center migration, and ethical AI auditing.",
      governanceHash: "0x12c45e99aa831b74d9203ef18063a8427fcd881144a9e22301c4b789ef239910",
      auditTrail: [
        {
          step: 1,
          stage: "INGEST",
          actor: "Vikram Mehta",
          role: "Investor Relations",
          time: "02:00 PM",
          action: "Ingested audited report tables and draft statements",
          detail: "Imported 12 audited financial and emissions metrics.",
          status: "completed"
        },
        {
          step: 2,
          stage: "AI_AUDIT",
          actor: "NiyamAI Audit Engine",
          role: "Automated Governance",
          time: "02:04 PM",
          action: "Checked statements against ESG disclosures database",
          detail: "Flagged one vague forward-looking claim. Auto-suggested Safe Harbor disclaimer.",
          status: "completed"
        },
        {
          step: 3,
          stage: "HUMAN_REVIEW",
          actor: "Marcus Vance",
          role: "Legal Counsel",
          time: "03:45 PM",
          action: "Safe Harbor & Legal Sign-off",
          detail: "Legal counsel verified all safe harbor citations.",
          status: "approved"
        },
        {
          step: 4,
          stage: "PUBLISH",
          actor: "NiyamAI Release Gatekeeper",
          role: "Release Gatekeeper",
          time: "04:15 PM",
          action: "Dispatched to Investor Relations portal and wires",
          detail: "Published with cryptographic tamper-evident token #ESG-2026-401.",
          status: "completed"
        }
      ]
    },
    {
      id: "AST-1087",
      title: "Executive Leadership Keynote — APAC Tech Summit",
      category: "Video Script",
      author: "Kavita Reddy (Executive Communications)",
      date: "2026-10-23",
      timestamp: "01:15 PM",
      wordCount: 1250,
      overallScore: 95,
      thresholdStatus: "PENDING_APPROVAL",
      status: "Blocked: Pending Approval",
      approvals: { current: 1, required: 2, signedBy: ["Kavita Reddy (Author)"] },
      scores: {
        tone: 95,
        claims: 96,
        accessibility: 93,
        visual: 94
      },
      channels: ["APAC Media Room", "LinkedIn Video", "Corporate YouTube"],
      summary: "Mainstage keynote script announcing strategic enterprise AI compliance standards across Asia-Pacific.",
      governanceHash: null,
      blockReasons: [
        "Mandatory Legal Counsel sign-off pending for Tier-1 public executive keynote (Brand Rule §5.1).",
        "Asset cleared automated AI scan (95% overall) but cannot be released without Step 04 human sign-off."
      ],
      auditTrail: [
        {
          step: 1,
          stage: "INGEST",
          actor: "Kavita Reddy",
          role: "Executive Communications",
          time: "11:30 AM",
          action: "Keynote presentation script ingested",
          detail: "Loaded full 1,250-word speech draft with slide references.",
          status: "completed"
        },
        {
          step: 2,
          stage: "AI_AUDIT",
          actor: "NiyamAI Multimodal Audit Engine",
          role: "Automated Governance",
          time: "11:32 AM",
          action: "Tone, Style & Claim Verification",
          detail: "All claims verified against APAC regional regulatory filings. Tone evaluated as 95% inspiring & authoritative.",
          status: "completed"
        },
        {
          step: 3,
          stage: "HUMAN_REVIEW",
          actor: "Kavita Reddy",
          role: "Author Sign-off",
          time: "12:10 PM",
          action: "Initial Author Sign-off",
          detail: "Author approved content. Forwarded to Marcus Vance (Legal) for mandatory Tier-2 review.",
          status: "approved"
        },
        {
          step: 4,
          stage: "GATE_VERIFICATION",
          actor: "NiyamAI Release Gatekeeper",
          role: "Release Gatekeeper",
          time: "01:15 PM",
          action: "Pre-Publish Threshold Validation BLOCKED",
          detail: "All numerical compliance scores pass (>= 90%), but mandatory Legal Counsel approval (1 of 2) is missing. Release held.",
          status: "blocked"
        }
      ]
    }
  ],

  // Governance Drift & Friction Analytics
  analytics: {
    // Frequently triggered brand rules (Friction points)
    frictionRules: [
      {
        rule: "Rule §4.2: Unsubstantiated Superlative Claims",
        occurrences: 48,
        category: "Claims & Accuracy",
        severity: "High",
        resolutionRate: "92%",
        recommendation: "Clarify acceptable empirical benchmarks in Brand Book §4.2 to reduce creator ambiguity."
      },
      {
        rule: "Rule §3.1: Informal Slang & Excessive Jargon",
        occurrences: 39,
        category: "Tone & Voice",
        severity: "Medium",
        resolutionRate: "88%",
        recommendation: "Update the prohibited vocabulary list with modern AI buzzwords ('game-changer', 'revolutionary')."
      },
      {
        rule: "Rule §9.3: WCAG AA Minimum Contrast Ratio (4.5:1)",
        occurrences: 31,
        category: "Accessibility",
        severity: "Medium",
        resolutionRate: "95%",
        recommendation: "Provide pre-approved Figma token palettes to external creative agencies."
      },
      {
        rule: "Rule §2.4: Secondary Brand Palette Drift",
        occurrences: 24,
        category: "Visual Identity",
        severity: "Low",
        resolutionRate: "97%",
        recommendation: "Ensure asset export templates lock non-approved HEX codes automatically."
      },
      {
        rule: "Rule §6.2: Missing Mandatory Regulatory Disclaimers",
        occurrences: 19,
        category: "Legal & Regulatory",
        severity: "High",
        resolutionRate: "100%",
        recommendation: "Auto-inject required legal footnotes during template ingestion step."
      }
    ],

    // Monthly Compliance Scores vs Turnaround Time
    trendData: {
      labels: ["May", "Jun", "Jul", "Aug", "Sep", "Oct"],
      complianceScores: [83.5, 86.2, 89.1, 91.8, 93.6, 95.4],
      turnaroundHours: [38.4, 29.1, 18.5, 12.0, 6.2, 3.2],
      preventedFlags: [112, 94, 82, 73, 58, 42]
    },

    // Channel Compliance Rates
    channelDistribution: {
      labels: ["Corporate Web", "PR & Wires", "Investor Relations", "Email Marketing", "Social Media", "Paid Ad Networks"],
      scores: [98, 97, 96, 94, 88, 84]
    },

    // Category breakdown
    categoryBreakdown: {
      labels: ["Tone & Style", "Claims & Facts", "Accessibility", "Visual Consistency", "Legal Compliance"],
      percentages: [26, 32, 18, 12, 12]
    },

    // Ambiguous Rules detected by AI (Frequent Human Overrides)
    ambiguousRulesFeedback: [
      {
        ruleId: "RULE-TONE-204",
        name: "Conversational yet Authoritative B2B Tone",
        overrideCount: 22,
        overrideRate: "44%",
        insight: "Reviewers consistently override AI tone flags when marketing speaks to developer audiences. The guideline currently lacks nuance for technical vs executive personas.",
        suggestedFix: "Split Rule §2.4 into 'Technical Audience Guidelines' vs 'Enterprise Executive Guidelines'."
      },
      {
        ruleId: "RULE-CLAIM-312",
        name: "Industry Leadership Terminology",
        overrideCount: 16,
        overrideRate: "35%",
        insight: "Phrases like 'pioneering platform' are repeatedly approved by legal despite AI strict-mode flagging, as internal patent filings support the claim.",
        suggestedFix: "Whitelist approved patent claims directly in the RAG Fact Sheet."
      }
    ]
  }
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = NiyamMockData;
}
