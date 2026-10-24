import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ArrowRight,
  ShieldAlert,
  Send,
  RotateCcw,
  Activity,
  Layers
} from 'lucide-react';
import {
  runContentAudit,
  checkAuditHealth,
  type AuditReport,
  type AuditChannel,
  type AuditFinding
} from '../services/auditApi';
import type { CorrectionRecord } from '../types';

interface TextAuditProps {
  onSendToCorrectionWorkspace?: (record: Omit<CorrectionRecord, 'id' | 'createdAt' | 'updatedAt'>) => void;
  pushToast?: (msg: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

const SAMPLE_PROMPTS = [
  {
    title: 'Ad Headline (Overpromising & Prohibited)',
    channel: 'ads' as AuditChannel,
    text: 'Our cheap workflow software guarantees 100% uptime and 100% bug-free automation with a miracle fix that will crush the competition!'
  },
  {
    title: 'Social Media Caption (Sensationalist)',
    channel: 'social' as AuditChannel,
    text: 'Check out the world\'s best revolutionary hack for business management. Unlimited forever capacity guaranteed for modern teams!'
  },
  {
    title: 'Press Release (Near-Compliant)',
    channel: 'blogs' as AuditChannel,
    text: 'NovaTech announces intelligent automation capabilities. Our cost-effective platform is enterprise-ready and delivers 99.9% uptime SLA.'
  }
];

export function TextAudit({ onSendToCorrectionWorkspace, pushToast }: TextAuditProps) {
  const [inputText, setInputText] = useState(SAMPLE_PROMPTS[0].text);
  const [channel, setChannel] = useState<AuditChannel>('ads');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [backendStatus, setBackendStatus] = useState<{ online: boolean; engineMode?: string }>({ online: false });
  const [sentFindingIds, setSentFindingIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    checkAuditHealth().then(status => {
      setBackendStatus(status);
    });
  }, []);

  const handleRunAudit = async () => {
    if (!inputText.trim()) {
      pushToast?.('Please enter some text to audit.', 'warning');
      return;
    }
    setLoading(true);
    try {
      const res = await runContentAudit(inputText, channel);
      setReport(res);
      setSentFindingIds({});
      if (res.findings.length > 0) {
        pushToast?.(`Audit completed: ${res.findings.length} issues identified.`, 'warning');
      } else {
        pushToast?.('Audit completed: 100% compliant with brand rules!', 'success');
      }
    } catch {
      pushToast?.('Failed to complete audit.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendToWorkspace = (finding: AuditFinding) => {
    if (!onSendToCorrectionWorkspace) return;

    onSendToCorrectionWorkspace({
      contentTitle: `${channel.toUpperCase()} Draft — ${finding.matchedText}`,
      contentType: channel === 'ads' ? 'ad-copy' : channel === 'social' ? 'social-media' : 'website',
      originalContent: inputText,
      detectedIssue: finding.explanation.split('.')[0] || 'Brand Guideline Violation',
      issueExplanation: finding.explanation,
      severity: finding.severity === 'critical' ? 'critical' : finding.severity === 'high' ? 'high' : 'medium',
      guidelineRef: {
        id: finding.ruleId || 'GL-AUDIT',
        title: finding.category.replace('_', ' ').toUpperCase(),
        section: finding.ruleId
      },
      aiSuggestion: {
        suggestedText: inputText.replace(finding.matchedText, finding.recommendedCorrection),
        explanation: `Replace prohibited/unsubstantiated "${finding.matchedText}" with compliant alternative "${finding.recommendedCorrection}".`,
        confidence: finding.confidence || 0.92,
        generatedBy: 'member2-audit'
      },
      workingContent: inputText,
      status: 'draft'
    });

    setSentFindingIds(prev => ({ ...prev, [finding.id]: true }));
    pushToast?.(`Finding "${finding.matchedText}" sent to Correction Workspace!`, 'success');
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner / Engine Status */}
      <div className="bg-wine-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-wine-700/30 blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-2 bg-wine-800/90 border border-wine-700/80 px-3 py-1 rounded-full text-xs font-semibold text-wine-100 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-pastel-butter" />
              <span>Multimodal & Hybrid AI Text Audit</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-white">
              NovaTech Content Compliance Scanner
            </h1>
            <p className="text-xs sm:text-sm text-wine-200 mt-1 max-w-2xl leading-relaxed">
              Audits copy against verified brand guidelines, SLA commitments, SOC-2 certifications, and prohibited enterprise vocabulary using hybrid deterministic regex rules and Google Gemini AI.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-2">
            <div className="inline-flex items-center space-x-2 bg-wine-950/60 border border-wine-800 px-3.5 py-1.5 rounded-full text-xs">
              <span className={`w-2 h-2 rounded-full ${backendStatus.online ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-stone-200">
                {backendStatus.online ? `API Port 5001 (${backendStatus.engineMode || 'Hybrid'})` : 'Local Deterministic Fallback'}
              </span>
            </div>
            <span className="text-[11px] text-wine-300">Target Brand: NovaTech Workflow Software</span>
          </div>
        </div>
      </div>

      {/* Editor & Input Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-cream-300 p-5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-cream-200">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-secondary flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-wine-700" />
                Draft Content for Audit
              </span>

              {/* Channel Selector */}
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-ink-muted">Channel:</span>
                <select
                  value={channel}
                  onChange={e => setChannel(e.target.value as AuditChannel)}
                  className="bg-cream-100 border border-cream-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-ink-primary focus:outline-wine-800"
                >
                  <option value="ads">Ad Copy & Search Banners</option>
                  <option value="social">Social Media Posts</option>
                  <option value="emails">Email Campaigns</option>
                  <option value="blogs">Blog & Press Releases</option>
                  <option value="product_specs">Product Specs & Documentation</option>
                </select>
              </div>
            </div>

            {/* Quick Demo Templates */}
            <div className="mt-3 flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
              <span className="text-ink-muted text-[11px] whitespace-nowrap">Load Preset:</span>
              {SAMPLE_PROMPTS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInputText(p.text);
                    setChannel(p.channel);
                  }}
                  className="px-2.5 py-1 rounded-full bg-cream-100 hover:bg-cream-200 text-ink-secondary text-[11px] whitespace-nowrap border border-cream-200 transition"
                >
                  {p.title}
                </button>
              ))}
            </div>

            {/* Input Textarea */}
            <div className="mt-3">
              <textarea
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                rows={7}
                placeholder="Paste or write marketing draft copy here to run compliance audit..."
                className="w-full p-3.5 text-sm rounded-xl border border-cream-300 bg-cream-50/50 focus:bg-white focus:outline-wine-800 font-sans leading-relaxed text-ink-primary"
              />
              <div className="flex justify-between items-center text-[11px] text-ink-muted mt-2">
                <span>{inputText.length} characters · {inputText.trim().split(/\s+/).filter(Boolean).length} words</span>
                <button
                  onClick={() => setInputText('')}
                  className="text-ink-muted hover:text-wine-800 transition"
                >
                  Clear text
                </button>
              </div>
            </div>

            {/* Action Bar */}
            <div className="mt-4 pt-3 border-t border-cream-200 flex items-center justify-between">
              <div className="text-xs text-ink-muted flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-wine-800" />
                <span>Checks against 11 prohibited patterns, SLA facts & channel tone</span>
              </div>
              <button
                onClick={handleRunAudit}
                disabled={loading}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full bg-wine-900 hover:bg-wine-800 text-white font-semibold text-xs transition shadow-sm active:scale-95 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Analyzing Draft...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-pastel-butter" />
                    <span>Run AI Text Audit</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Audit Score Card */}
        <div className="lg:col-span-5 space-y-4">
          {report ? (
            <div className="bg-white rounded-2xl border border-cream-300 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-cream-200">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
                  Compliance Assessment
                </span>
                <span className="text-[11px] text-ink-muted">
                  Executed in {report.executionTimeMs}ms
                </span>
              </div>

              {/* Overall Score & Grade Badge */}
              <div className="flex items-center justify-between bg-cream-50 p-4 rounded-xl border border-cream-200">
                <div>
                  <span className="text-xs text-ink-muted uppercase font-medium">Brand Health Score</span>
                  <div className="text-3xl font-extrabold text-wine-950 font-display mt-0.5">
                    {report.score.overallScore}<span className="text-base text-ink-muted font-normal">/100</span>
                  </div>
                  <span className="text-[11px] font-medium text-ink-secondary capitalize">
                    Status: {report.score.status.replace('_', ' ')}
                  </span>
                </div>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black font-display shadow-inner ${
                  report.score.grade === 'A' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                  report.score.grade === 'B' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                  report.score.grade === 'C' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                  'bg-rose-100 text-rose-800 border border-rose-300'
                }`}>
                  {report.score.grade}
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1.5 border-b border-cream-100">
                  <span className="text-ink-secondary">Terminology Compliance:</span>
                  <strong className={`font-mono ${report.score.categoryScores.terminology.score < 80 ? 'text-rose-700' : 'text-emerald-700'}`}>
                    {report.score.categoryScores.terminology.score}%
                  </strong>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-cream-100">
                  <span className="text-ink-secondary">Factual Accuracy (SLA & SOC-2):</span>
                  <strong className={`font-mono ${report.score.categoryScores.factualAccuracy.score < 80 ? 'text-rose-700' : 'text-emerald-700'}`}>
                    {report.score.categoryScores.factualAccuracy.score}%
                  </strong>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-ink-secondary">Tone & Voice Fit:</span>
                  <strong className="font-mono text-emerald-700">
                    {report.score.categoryScores.toneVoice.score}%
                  </strong>
                </div>
              </div>

              {/* Summary Pills */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-cream-200 text-center">
                <div className="bg-cream-100 p-2 rounded-xl">
                  <span className="text-[10px] text-ink-muted block">Findings</span>
                  <span className="text-sm font-bold text-ink-primary">{report.summary.totalFindings}</span>
                </div>
                <div className="bg-rose-50 p-2 rounded-xl border border-rose-200">
                  <span className="text-[10px] text-rose-700 block">Critical</span>
                  <span className="text-sm font-bold text-rose-800">{report.summary.criticalCount}</span>
                </div>
                <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                  <span className="text-[10px] text-emerald-700 block">Passed</span>
                  <span className="text-sm font-bold text-emerald-800">{report.summary.passedCount}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-cream-300 p-8 text-center shadow-xs">
              <div className="w-12 h-12 rounded-full bg-cream-100 flex items-center justify-center mx-auto text-xl mb-3">
                🔍
              </div>
              <h3 className="text-sm font-bold text-ink-primary">Audit Results Pending</h3>
              <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                Click &quot;Run AI Text Audit&quot; on the left to inspect copy against enterprise brand rules, verified SLA facts, and tone guidelines.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Detailed Findings & Cross-Module Pipeline Actions */}
      {report && (
        <div className="bg-white rounded-2xl border border-cream-300 p-5 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-cream-200">
            <div>
              <h3 className="text-base font-bold text-ink-primary font-display">
                Detected Issues & Remediation Actions ({report.findings.length})
              </h3>
              <p className="text-xs text-ink-muted">
                Each violation can be pushed into the Correction Workspace for formal review and human sign-off.
              </p>
            </div>
          </div>

          {report.findings.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto" />
              <h4 className="text-sm font-bold text-ink-primary">Zero Violations Found!</h4>
              <p className="text-xs text-ink-muted max-w-md mx-auto">
                This copy strictly adheres to NovaTech guidelines, approved 99.9% uptime SLA commitments, and enterprise vocabulary.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {report.findings.map(finding => {
                const isSent = sentFindingIds[finding.id];
                return (
                  <div
                    key={finding.id}
                    className="p-4 rounded-xl border border-cream-300 bg-cream-50/60 hover:bg-white transition space-y-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          finding.severity === 'critical' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                          finding.severity === 'high' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                          'bg-blue-100 text-blue-800 border border-blue-300'
                        }`}>
                          {finding.severity}
                        </span>
                        <span className="text-xs font-semibold text-ink-primary">
                          Found: <code className="bg-rose-100/80 text-rose-900 px-1.5 py-0.5 rounded font-mono text-xs">&quot;{finding.matchedText}&quot;</code>
                        </span>
                      </div>

                      {/* Cross-Module Pipeline Button */}
                      {onSendToCorrectionWorkspace && (
                        <button
                          onClick={() => handleSendToWorkspace(finding)}
                          disabled={isSent}
                          className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold transition ${
                            isSent
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default'
                              : 'bg-wine-900 text-white hover:bg-wine-800 shadow-xs'
                          }`}
                        >
                          {isSent ? (
                            <>
                              <CheckCircle className="w-3 h-3 text-emerald-700" />
                              <span>Sent to Corrections</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-3 h-3 text-pastel-butter" />
                              <span>Send to Correction Workspace →</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-ink-secondary leading-relaxed">
                      {finding.explanation}
                    </p>

                    <div className="bg-emerald-50/80 p-2.5 rounded-lg border border-emerald-200 text-xs flex items-center justify-between">
                      <span className="text-emerald-900">
                        <strong>Recommended Replacement:</strong> &quot;{finding.recommendedCorrection}&quot;
                      </span>
                      <span className="text-[10px] text-emerald-700 font-mono">Confidence: {Math.round(finding.confidence * 100)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full Corrected Version */}
          {report.findings.length > 0 && (
            <div className="mt-4 pt-4 border-t border-cream-200">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-secondary block mb-1.5">
                AI Intent-Preserving Remediation Preview
              </span>
              <div className="bg-cream-100 p-3.5 rounded-xl border border-cream-300 text-xs text-ink-primary leading-relaxed font-mono">
                {report.correctedText}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
