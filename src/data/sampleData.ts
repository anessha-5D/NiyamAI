// ============================================================
// NiyamAI — Sample Data
// Member 4: Correction Workspace
//
// INTEGRATION NOTE:
//   Replace this file's exports with real data from:
//   - Member 2 (AI Text Audit findings)
//   - Member 3 (Visual Audit findings, if included)
//   Keep the CorrectionRecord shape identical so UI works unchanged.
// ============================================================

import type { CorrectionRecord } from '../types';

export const SAMPLE_CORRECTIONS: CorrectionRecord[] = [
  {
    id: 'rec-001',
    contentTitle: 'Homepage Hero Copy',
    contentType: 'website',
    originalContent:
      'Our product guarantees 100% success for every client, every time — without exception.',
    detectedIssue: 'Absolute Performance Guarantee',
    issueExplanation:
      'The phrase "guarantees 100% success" constitutes an unsubstantiated absolute claim that may violate advertising standards and brand guidelines. Absolute guarantees require documented evidence and legal review before publication.',
    severity: 'critical',
    guidelineRef: {
      id: 'GL-ADV-003',
      title: 'Advertising Claims Standard §3.2',
      section: 'Prohibited Absolute Guarantees',
    },
    aiSuggestion: {
      suggestedText:
        'Our product is designed to help improve your results — backed by real-world performance data and dedicated client support.',
      explanation:
        'Replaced the absolute guarantee with a performance-oriented statement supported by evidence references. Removed "every client, every time" superlative. Retained persuasive tone while meeting compliance requirements.',
      confidence: 0.91,
      generatedBy: 'sample-data',
    },
    workingContent:
      'Our product guarantees 100% success for every client, every time — without exception.',
    status: 'draft',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'rec-002',
    contentTitle: 'Q4 Email Campaign — Subject Line',
    contentType: 'email',
    originalContent: 'Lose 30 pounds in just 2 weeks with our revolutionary formula!',
    detectedIssue: 'Misleading Health Claim',
    issueExplanation:
      'Specific quantitative health outcomes ("30 pounds in 2 weeks") are regulated claims in most markets. Without clinical evidence cited in the creative, this violates health advertising regulations and brand integrity guidelines.',
    severity: 'critical',
    guidelineRef: {
      id: 'GL-HLTH-007',
      title: 'Health & Wellness Claims Policy §7',
      section: 'Quantitative Outcome Claims',
    },
    aiSuggestion: {
      suggestedText:
        'Start your transformation journey with our science-backed wellness formula.',
      explanation:
        'Removed the specific weight-loss claim and unrealistic timeline. Replaced with aspiration-focused language that acknowledges the science behind the product without making regulated promises.',
      confidence: 0.88,
      generatedBy: 'sample-data',
    },
    workingContent:
      'Lose 30 pounds in just 2 weeks with our revolutionary formula!',
    status: 'draft',
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
  {
    id: 'rec-003',
    contentTitle: 'Instagram Ad — Product Caption',
    contentType: 'social-media',
    originalContent:
      'The best skincare product on the market. Everyone loves it — it\'s literally perfect!',
    detectedIssue: 'Unsubstantiated Superlative Claim',
    issueExplanation:
      'Terms like "the best on the market" and "literally perfect" are superlative claims that require comparative evidence. Social media posts are subject to the same advertising standards as other channels.',
    severity: 'high',
    guidelineRef: {
      id: 'GL-SOC-012',
      title: 'Social Media Content Guidelines §12.4',
      section: 'Comparative and Superlative Claims',
    },
    aiSuggestion: {
      suggestedText:
        'A skincare product our community can\'t stop talking about — crafted with care for real results.',
      explanation:
        'Replaced superlative "best on the market" with community-driven social proof language. Removed "literally perfect" while preserving the enthusiasm and testimonial tone appropriate for Instagram.',
      confidence: 0.85,
      generatedBy: 'sample-data',
    },
    workingContent:
      'The best skincare product on the market. Everyone loves it — it\'s literally perfect!',
    status: 'draft',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: 'rec-004',
    contentTitle: 'Press Release — Company Announcement',
    contentType: 'press-release',
    originalContent:
      'NiyamAI has completely solved the compliance problem for all businesses worldwide.',
    detectedIssue: 'Overstated Product Claim',
    issueExplanation:
      'Claiming to have "completely solved" a problem for "all businesses worldwide" is an absolute claim not supported by evidence. Press releases receive heightened scrutiny from journalists and regulators.',
    severity: 'high',
    guidelineRef: {
      id: 'GL-PR-002',
      title: 'Press Release Standards §2.1',
      section: 'Factual Accuracy Requirements',
    },
    aiSuggestion: {
      suggestedText:
        'NiyamAI introduces an AI-powered compliance platform designed to help businesses across industries navigate complex brand and regulatory requirements with greater efficiency.',
      explanation:
        'Replaced the absolute claim with a factual product description. Highlights AI capability and real benefit (efficiency) without overstating universal applicability.',
      confidence: 0.93,
      generatedBy: 'sample-data',
    },
    workingContent:
      'NiyamAI has completely solved the compliance problem for all businesses worldwide.',
    status: 'pending-approval',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 'rec-005',
    contentTitle: 'LinkedIn Ad — Corporate CTA',
    contentType: 'ad-copy',
    originalContent: 'Join thousands of companies who have eliminated compliance risk entirely.',
    detectedIssue: 'Risk Elimination Claim',
    issueExplanation:
      'Claiming to "eliminate compliance risk entirely" is a categorical absolute that no product can substantiate. It may create legal liability and violates brand communication standards.',
    severity: 'medium',
    guidelineRef: {
      id: 'GL-ADV-009',
      title: 'Advertising Claims Standard §9.3',
      section: 'Risk Mitigation Language',
    },
    aiSuggestion: {
      suggestedText:
        'Join thousands of companies strengthening their compliance posture with NiyamAI.',
      explanation:
        'Replaced "eliminated compliance risk entirely" with "strengthening compliance posture" — a credible, measurable direction of improvement rather than an absolute endpoint.',
      confidence: 0.87,
      generatedBy: 'sample-data',
    },
    workingContent:
      'Join thousands of companies who have eliminated compliance risk entirely.',
    status: 'approved',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
];
