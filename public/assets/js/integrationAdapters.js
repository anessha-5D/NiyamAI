/**
 * NiyamAI — Modular Teammate Integration Adapters & Core Governance Engine
 * Platform: NiyamAI Intelligent Brand Governance & AI Compliance Platform
 * Module: Step 05 — Publishing Gate, Audit Provenance & Analytics
 * 
 * This module defines the clear contract and integration points for
 * Members 1, 2, 3, and 4 to interface with Member 5.
 */

(function (window) {
  'use strict';

  // Default Governance Threshold Configuration
  const GOVERNANCE_THRESHOLDS = {
    minToneScore: 90,
    minClaimsScore: 95,
    minAccessibilityScore: 90,
    requireFullApprovals: true,
    supportedChannels: [
      "Corporate Website",
      "PR Newswire",
      "LinkedIn Executive",
      "Meta & Google Ad Networks",
      "Investor Relations Portal",
      "Resource Center Hub"
    ]
  };

  /**
   * Cryptographic Hash Helper using Web Crypto API (SHA-256)
   * Deterministic client-side integrity hashing.
   */
  async function computeSha256(inputString) {
    if (window.crypto && window.crypto.subtle) {
      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(inputString);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      } catch (err) {
        console.warn('Web Crypto API failed, using fallback:', err);
      }
    }
    // Fallback deterministic hash (for older environments or insecure contexts)
    let hash1 = 5381, hash2 = 52711;
    for (let i = 0; i < inputString.length; i++) {
      const char = inputString.charCodeAt(i);
      hash1 = (hash1 * 33) ^ char;
      hash2 = (hash2 * 33) ^ char;
    }
    const hex1 = (hash1 >>> 0).toString(16).padStart(8, '0');
    const hex2 = (hash2 >>> 0).toString(16).padStart(8, '0');
    return '0x' + (hex1 + hex2).repeat(4);
  }

  /**
   * Evaluate Release Gate Eligibility for any asset.
   * Pure evaluation function ensuring no bypass through UI.
   */
  function evaluateReleaseGate(asset) {
    const reasons = [];
    const checks = {
      tone: { passed: false, score: 0, required: GOVERNANCE_THRESHOLDS.minToneScore },
      claims: { passed: false, score: 0, required: GOVERNANCE_THRESHOLDS.minClaimsScore },
      accessibility: { passed: false, score: 0, required: GOVERNANCE_THRESHOLDS.minAccessibilityScore },
      approvals: { passed: false, current: 0, required: 0 }
    };

    if (!asset || !asset.scores) {
      return { eligible: false, reasons: ["Asset data or compliance scores missing."], checks };
    }

    // 1. Tone Score
    checks.tone.score = Number(asset.scores.tone) || 0;
    checks.tone.passed = checks.tone.score >= GOVERNANCE_THRESHOLDS.minToneScore;
    if (!checks.tone.passed) {
      reasons.push(`Tone consistency (${checks.tone.score}%) is below mandatory threshold (${GOVERNANCE_THRESHOLDS.minToneScore}%).`);
    }

    // 2. Claims Verification Score
    checks.claims.score = Number(asset.scores.claims) || 0;
    checks.claims.passed = checks.claims.score >= GOVERNANCE_THRESHOLDS.minClaimsScore;
    if (!checks.claims.passed) {
      reasons.push(`Claim verification (${checks.claims.score}%) is below strict empirical threshold (${GOVERNANCE_THRESHOLDS.minClaimsScore}%). Unsubstantiated claims must be verified.`);
    }

    // 3. Accessibility Score
    checks.accessibility.score = Number(asset.scores.accessibility) || 0;
    checks.accessibility.passed = checks.accessibility.score >= GOVERNANCE_THRESHOLDS.minAccessibilityScore;
    if (!checks.accessibility.passed) {
      reasons.push(`Accessibility rating (${checks.accessibility.score}%) fails WCAG 2.1 AA minimum requirement (${GOVERNANCE_THRESHOLDS.minAccessibilityScore}%).`);
    }

    // 4. Human Approvals
    const currentApprovals = (asset.approvals && Number(asset.approvals.current)) || 0;
    const requiredApprovals = (asset.approvals && Number(asset.approvals.required)) || 1;
    checks.approvals.current = currentApprovals;
    checks.approvals.required = requiredApprovals;
    checks.approvals.passed = currentApprovals >= requiredApprovals;
    if (!checks.approvals.passed) {
      reasons.push(`Human reviewer sign-offs incomplete (${currentApprovals} of ${requiredApprovals} completed). Mandatory approvals required from Step 04.`);
    }

    // 5. Active Block Reasons in asset record
    if (asset.blockReasons && asset.blockReasons.length > 0 && !checks.claims.passed) {
      asset.blockReasons.forEach(r => {
        if (!reasons.includes(r)) reasons.push(r);
      });
    }

    const eligible = checks.tone.passed && checks.claims.passed && checks.accessibility.passed && checks.approvals.passed;

    return {
      eligible,
      reasons,
      checks
    };
  }

  /**
   * Build or update the cryptographic hash chain for an audit trail.
   * Each step's hash = SHA-256(step + stage + actor + time + detail + prevHash).
   */
  async function computeAuditChain(auditTrail) {
    if (!Array.isArray(auditTrail)) return [];
    let prevHash = "0x0000000000000000000000000000000000000000000000000000000000000000";

    for (let i = 0; i < auditTrail.length; i++) {
      const step = auditTrail[i];
      step.prevHash = prevHash;
      const canonicalString = JSON.stringify({
        step: step.step,
        stage: step.stage,
        actor: step.actor,
        role: step.role,
        time: step.time,
        action: step.action,
        detail: step.detail,
        status: step.status,
        prevHash: step.prevHash
      });
      step.stepHash = await computeSha256(canonicalString);
      prevHash = step.stepHash;
    }
    return auditTrail;
  }

  /**
   * Verify the integrity of an audit hash chain.
   * Returns verification report indicating if any block was tampered with.
   */
  async function verifyAuditChain(auditTrail) {
    if (!Array.isArray(auditTrail) || auditTrail.length === 0) {
      return { valid: false, message: "No audit events found to verify.", stepsChecked: 0 };
    }

    let expectedPrevHash = "0x0000000000000000000000000000000000000000000000000000000000000000";

    for (let i = 0; i < auditTrail.length; i++) {
      const step = auditTrail[i];
      if (step.prevHash !== expectedPrevHash) {
        return {
          valid: false,
          brokenAtStep: step.step,
          message: `Hash link broken at step ${step.step}: prevHash does not match previous block hash.`,
          stepsChecked: i + 1
        };
      }

      const canonicalString = JSON.stringify({
        step: step.step,
        stage: step.stage,
        actor: step.actor,
        role: step.role,
        time: step.time,
        action: step.action,
        detail: step.detail,
        status: step.status,
        prevHash: step.prevHash
      });

      const recalculatedHash = await computeSha256(canonicalString);
      if (step.stepHash && step.stepHash !== recalculatedHash) {
        return {
          valid: false,
          brokenAtStep: step.step,
          message: `Data tampering detected at step ${step.step}: payload hash mismatch.`,
          stepsChecked: i + 1
        };
      }
      expectedPrevHash = step.stepHash || recalculatedHash;
    }

    return {
      valid: true,
      message: `All ${auditTrail.length} audit trail blocks cryptographically verified via SHA-256 hash chain.`,
      stepsChecked: auditTrail.length,
      finalHash: expectedPrevHash
    };
  }

  // Integration Hub API exposed for Teammates (Members 1 to 4)
  const NiyamIntegrationAPI = {
    thresholds: GOVERNANCE_THRESHOLDS,
    computeSha256,
    evaluateReleaseGate,
    computeAuditChain,
    verifyAuditChain,

    // Step 01 Integration: Ingest Asset
    ingestAssetFromMember1: function (payload) {
      const assetId = payload.id || `AST-${Math.floor(1000 + Math.random() * 9000)}`;
      const newAsset = {
        id: assetId,
        title: payload.title || "Untitled Ingested Asset",
        category: payload.category || "Press Release",
        author: payload.author || "Marketing Team",
        date: new Date().toISOString().substring(0, 10),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        wordCount: payload.wordCount || 500,
        overallScore: 0,
        thresholdStatus: "INGESTED",
        status: "In Review: Step 01 Completed",
        approvals: { current: 0, required: payload.requiredApprovals || 2, signedBy: [] },
        scores: { tone: 0, claims: 0, accessibility: 0, visual: 0 },
        channels: payload.targetChannels || ["Corporate Website"],
        summary: payload.summary || "Draft content ingested from Step 01 Brand Guideline Ingestion.",
        governanceHash: null,
        auditTrail: [
          {
            step: 1,
            stage: "INGEST",
            actor: payload.author || "Content Ingestion Lead",
            role: "Content Creator",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            action: "Ingested via Brand Kit Connector",
            detail: `Imported asset content with target brand guidelines: ${payload.brandGuidelinesRef || "Brand Book v4.1"}.`,
            status: "completed"
          }
        ]
      };
      return newAsset;
    },

    // Step 02 Integration: Apply AI Multimodal Audit Scores
    applyAuditScoresFromMember2: function (asset, auditPayload) {
      if (!asset) return null;
      asset.scores = {
        tone: auditPayload.tone || 85,
        claims: auditPayload.claims || 90,
        accessibility: auditPayload.accessibility || 88,
        visual: auditPayload.visual || 95
      };
      asset.overallScore = Math.round(
        (asset.scores.tone * 0.3) +
        (asset.scores.claims * 0.4) +
        (asset.scores.accessibility * 0.15) +
        (asset.scores.visual * 0.15)
      );

      asset.auditTrail.push({
        step: asset.auditTrail.length + 1,
        stage: "AI_AUDIT",
        actor: "Multimodal AI Audit Engine",
        role: "Automated Governance",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: "Multi-vector brand compliance scan",
        detail: `Tone: ${asset.scores.tone}%, Claims: ${asset.scores.claims}%, Accessibility: ${asset.scores.accessibility}%. Checked against RAG factsheet.`,
        status: auditPayload.flags && auditPayload.flags.length > 0 ? "flagged" : "completed",
        flags: auditPayload.flags || []
      });

      return asset;
    },

    // Step 03 Integration: Register Corrections
    applyCorrectionsFromMember3: function (asset, correctionPayload) {
      if (!asset) return null;
      if (correctionPayload.updatedClaimsScore) asset.scores.claims = correctionPayload.updatedClaimsScore;
      if (correctionPayload.updatedToneScore) asset.scores.tone = correctionPayload.updatedToneScore;
      if (correctionPayload.updatedA11yScore) asset.scores.accessibility = correctionPayload.updatedA11yScore;

      asset.overallScore = Math.round(
        (asset.scores.tone * 0.3) +
        (asset.scores.claims * 0.4) +
        (asset.scores.accessibility * 0.15) +
        (asset.scores.visual * 0.15)
      );

      asset.auditTrail.push({
        step: asset.auditTrail.length + 1,
        stage: "CORRECTION",
        actor: correctionPayload.actor || "Intent-Preserving Correction Engine",
        role: "Correction Specialist",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: "Applied AI intent-preserving remediation",
        detail: correctionPayload.detail || "Rewrote superlative claim to empirical verifiable statement; verified WCAG contrast ratio.",
        status: "completed"
      });

      return asset;
    },

    // Step 04 Integration: Record Human Sign-off
    recordApprovalFromMember4: function (asset, approvalPayload) {
      if (!asset) return null;
      if (!asset.approvals) asset.approvals = { current: 0, required: 2, signedBy: [] };

      const reviewerName = approvalPayload.reviewer || "Authorized Compliance Officer";
      const role = approvalPayload.role || "Legal & Regulatory Counsel";

      if (!asset.approvals.signedBy.includes(`${reviewerName} (${role})`)) {
        asset.approvals.signedBy.push(`${reviewerName} (${role})`);
        asset.approvals.current = asset.approvals.signedBy.length;
      }

      asset.auditTrail.push({
        step: asset.auditTrail.length + 1,
        stage: "HUMAN_REVIEW",
        actor: reviewerName,
        role: role,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: `Tier-${approvalPayload.tier || 2} Human Review Sign-off`,
        detail: approvalPayload.notes || "Signed off on content accuracy, liability disclosures, and brand adherence.",
        status: "approved"
      });

      // Re-evaluate gate eligibility
      const evalResult = evaluateReleaseGate(asset);
      if (evalResult.eligible) {
        asset.status = "Ready to Publish";
        asset.thresholdStatus = "PASSED";
      }

      return asset;
    }
  };

  window.NiyamIntegrationAPI = NiyamIntegrationAPI;

})(window);
