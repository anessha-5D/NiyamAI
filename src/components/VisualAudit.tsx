import React, { useState } from 'react';
import {
  ExternalLink,
  Eye,
  Send,
  Sparkles,
  ShieldCheck,
  Palette,
  AlertTriangle,
  CheckCircle,
  FileText
} from 'lucide-react';
import type { CorrectionRecord } from '../types';

interface VisualAuditProps {
  onSendToCorrectionWorkspace?: (record: Omit<CorrectionRecord, 'id' | 'createdAt' | 'updatedAt'>) => void;
  pushToast?: (msg: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export function VisualAudit({ onSendToCorrectionWorkspace, pushToast }: VisualAuditProps) {
  const [viewMode, setViewMode] = useState<'embedded' | 'quick-tools'>('embedded');
  const [forwardModalOpen, setForwardModalOpen] = useState(false);
  const [customIssue, setCustomIssue] = useState({
    title: 'Visual Creative — Low Contrast Ratio (3.1:1)',
    type: 'ad-copy' as const,
    detectedIssue: 'WCAG 2.1 AA Contrast Failure',
    explanation: 'Background #FAF7F5 and foreground text #4C1029 produce a 3.1:1 contrast ratio, failing the mandatory 4.5:1 WCAG AA threshold for normal body copy.',
    suggestedText: 'Darken text to #1C060D or calibrate background to #FFFFFF to achieve 7.2:1 contrast.',
    severity: 'high' as const
  });

  const handleForwardIssue = () => {
    if (!onSendToCorrectionWorkspace) return;
    onSendToCorrectionWorkspace({
      contentTitle: customIssue.title,
      contentType: customIssue.type,
      originalContent: 'Foreground #4C1029 on Background #FAF7F5',
      detectedIssue: customIssue.detectedIssue,
      issueExplanation: customIssue.explanation,
      severity: customIssue.severity,
      guidelineRef: {
        id: 'GL-004',
        title: 'Accessible Visual Contrast Standards §2.1',
        section: 'Visual Compliance'
      },
      aiSuggestion: {
        suggestedText: customIssue.suggestedText,
        explanation: 'Adjusted color palette to satisfy accessibility governance thresholds before public deployment.',
        confidence: 0.98,
        generatedBy: 'sample-data'
      },
      workingContent: 'Foreground #4C1029 on Background #FAF7F5',
      status: 'draft'
    });
    setForwardModalOpen(false);
    pushToast?.('Visual compliance finding forwarded to Correction Workspace!', 'success');
  };

  return (
    <div className="w-full flex flex-col bg-[#FAF7F2] min-h-screen">
      {/* Top Integration Control Ribbon */}
      <div className="bg-[#50152f] text-[#fffaf4] px-4 sm:px-8 py-3.5 border-b border-[#310d20] flex flex-wrap items-center justify-between gap-3 shadow-md sticky top-16 z-30">
        <div className="flex items-center space-x-3">
          <div className="w-7 h-7 rounded-full bg-[#f2d9e3] text-[#50152f] flex items-center justify-center font-bold text-xs">
            ✳
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm text-white font-display">
                Brand Experience Studio & Visual Audit
              </span>
            </div>
            <p className="text-[11px] text-[#f2d9e3]/80 hidden sm:block">
              Full visual consistency inspection, WCAG 2.1 AA luminance contrast, alt-text review, and privacy redaction.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Quick Forward to Corrections */}
          {onSendToCorrectionWorkspace && (
            <button
              onClick={() => setForwardModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-[#fffaf4] text-xs font-semibold border border-white/20 transition shadow-xs"
              title="Forward detected visual contrast or alt-text issue into Correction Workspace"
            >
              <Send className="w-3.5 h-3.5 text-[#f2d9e3]" />
              <span>Forward Issue to Corrections →</span>
            </button>
          )}

          {/* Standalone Open Button */}
          <a
            href="/visual-audit/index.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-[#702344] hover:bg-[#8b2b54] text-white text-xs font-semibold border border-[#9b3562] transition shadow-xs"
            title="Open Visual Audit in a dedicated full browser tab"
          >
            <span>Open Standalone Tab</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Forward Finding Modal */}
      {forwardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-cream-300 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-cream-200">
              <div className="flex items-center space-x-2">
                <Palette className="w-4 h-4 text-wine-900" />
                <h3 className="text-base font-bold text-ink-primary font-display">
                  Forward Visual Audit Issue to Correction Workspace
                </h3>
              </div>
              <button
                onClick={() => setForwardModalOpen(false)}
                className="text-ink-muted hover:text-ink-primary text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-ink-secondary">
              This creates a formal review record in the Correction Workspace with guideline citations and remediation suggestions.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-ink-primary mb-1">Issue Title</label>
                <input
                  type="text"
                  value={customIssue.title}
                  onChange={e => setCustomIssue(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full p-2.5 rounded-xl border border-cream-300 text-xs text-ink-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-ink-primary mb-1">Detected Non-Compliance</label>
                <input
                  type="text"
                  value={customIssue.detectedIssue}
                  onChange={e => setCustomIssue(prev => ({ ...prev, detectedIssue: e.target.value }))}
                  className="w-full p-2.5 rounded-xl border border-cream-300 text-xs text-ink-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-ink-primary mb-1">Issue Explanation</label>
                <textarea
                  rows={3}
                  value={customIssue.explanation}
                  onChange={e => setCustomIssue(prev => ({ ...prev, explanation: e.target.value }))}
                  className="w-full p-2.5 rounded-xl border border-cream-300 text-xs text-ink-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-ink-primary mb-1">Recommended Remediation</label>
                <textarea
                  rows={2}
                  value={customIssue.suggestedText}
                  onChange={e => setCustomIssue(prev => ({ ...prev, suggestedText: e.target.value }))}
                  className="w-full p-2.5 rounded-xl border border-cream-300 text-xs text-ink-primary font-mono"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-cream-200 flex justify-end space-x-2">
              <button
                onClick={() => setForwardModalOpen(false)}
                className="px-4 py-2 rounded-full text-xs font-semibold text-ink-secondary hover:text-ink-primary"
              >
                Cancel
              </button>
              <button
                onClick={handleForwardIssue}
                className="px-5 py-2 rounded-full text-xs font-bold bg-wine-900 hover:bg-wine-800 text-white shadow-sm"
              >
                Send to Corrections
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embedded 100% Original Standalone Studio */}
      <div className="w-full flex-1">
        <iframe
          src="/visual-audit/index.html"
          title="NiyamAI Brand Experience Studio"
          className="w-full border-none"
          style={{
            height: 'calc(100vh - 120px)',
            minHeight: '1300px'
          }}
        />
      </div>
    </div>
  );
}
