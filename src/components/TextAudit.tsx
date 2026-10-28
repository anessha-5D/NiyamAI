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
  Layers,
  Database,
  Clock
} from 'lucide-react';
import {
  runContentAudit,
  checkAuditHealth,
  type AuditReport,
  type AuditChannel,
  type AuditFinding
} from '../services/auditApi';
import {
  saveAudit,
  getSavedAudits,
  getAuditById,
  type AuditReportSummary
} from '../services/databaseService';
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
  const [activeTab, setActiveTab] = useState<'scanner' | 'saved'>('scanner');
  const [inputText, setInputText] = useState(SAMPLE_PROMPTS[0].text);
  const [channel, setChannel] = useState<AuditChannel>('ads');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [backendStatus, setBackendStatus] = useState<{ online: boolean; engineMode?: string }>({ online: false });
  const [sentFindingIds, setSentFindingIds] = useState<Record<string, boolean>>({});
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);

  // Saved Audits state
  const [savedAudits, setSavedAudits] = useState<AuditReportSummary[]>([]);
  const [loadingSavedAudits, setLoadingSavedAudits] = useState(false);
  const [savedAuditsError, setSavedAuditsError] = useState<string | null>(null);
  const [fetchingAuditId, setFetchingAuditId] = useState<string | null>(null);

  const loadSavedAudits = async () => {
    setLoadingSavedAudits(true);
    setSavedAuditsError(null);
    try {
      const data = await getSavedAudits();
      setSavedAudits(Array.isArray(data) ? data : (data as any)?.audits ?? []);
    } catch (err: any) {
      console.warn('[TextAudit] Failed to load saved audits:', err);
      setSavedAuditsError(err.message || 'Unable to connect to database (/api/audits is unreachable or not yet implemented).');
    } finally {
      setLoadingSavedAudits(false);
    }
  };

  useEffect(() => {
    checkAuditHealth().then(status => {
      setBackendStatus(status);
    });
    // Silently populate saved audits count if backend is online
    loadSavedAudits();
  }, []);

  const handleRunAudit = async () => {
    if (!inputText.trim()) {
      pushToast?.('Please enter some text to audit.', 'warning');
      return;
    }
    setLoading(true);
    setSaveStatus('idle');
    setSaveErrorMessage(null);
    try {
      const res = await runContentAudit(inputText, channel);
      setReport(res);
      setSentFindingIds({});
      if (res.findings.length > 0) {
        pushToast?.(`Audit completed: ${res.findings.length} issues identified.`, 'warning');
      } else {
        pushToast?.('Audit completed: 100% compliant with brand rules!', 'success');
      }

      // Attempt database persistence (preserving offline fallback & report visibility)
      setSaveStatus('saving');
      try {
        await saveAudit(res);
        setSaveStatus('saved');
        pushToast?.('Audit report successfully saved to database.', 'success');
        loadSavedAudits();
      } catch (saveErr: any) {
        console.warn('[TextAudit] Database persistence failed:', saveErr);
        setSaveStatus('failed');
        setSaveErrorMessage(saveErr.message || 'Database save failed');
        pushToast?.('Audit generated, but could not be saved to database (backend endpoint pending or offline).', 'warning');
      }
    } catch {
      pushToast?.('Failed to complete audit.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRetrySave = async () => {
    if (!report) return;
    setSaveStatus('saving');
    setSaveErrorMessage(null);
    try {
      await saveAudit(report);
      setSaveStatus('saved');
      pushToast?.('Audit report successfully saved to database.', 'success');
      loadSavedAudits();
    } catch (saveErr: any) {
      console.warn('[TextAudit] Retry save failed:', saveErr);
      setSaveStatus('failed');
      setSaveErrorMessage(saveErr.message || 'Database save failed');
      pushToast?.('Database save failed. Ensure backend /api/audits is available.', 'error');
    }
  };

  const handleSelectSavedAudit = async (auditId: string) => {
    setFetchingAuditId(auditId);
    try {
      const fullReport = await getAuditById(auditId);
      setReport(fullReport);
      if (fullReport.inputText) {
        setInputText(fullReport.inputText);
      }
      if (fullReport.channel) {
        setChannel(fullReport.channel);
      }
      setSaveStatus('saved');
      setSaveErrorMessage(null);
      pushToast?.(`Loaded audit report #${auditId}`, 'success');
    } catch (err: any) {
      console.warn('[TextAudit] Failed to fetch full audit report:', err);
      pushToast?.(`Failed to load audit #${auditId}: ${err.message}`, 'error');
    } finally {
      setFetchingAuditId(null);
    }
  };

  const handleSendToWorkspace = (finding: AuditFinding, sourceReport?: AuditReport) => {
    if (!onSendToCorrectionWorkspace) return;

    const currentReport = sourceReport || report;
    const draftText = currentReport?.inputText || inputText;
    const auditChannel = currentReport?.channel || channel;

    onSendToCorrectionWorkspace({
      contentTitle: `${auditChannel.toUpperCase()} Draft — ${finding.matchedText}`,
      contentType: auditChannel === 'ads' ? 'ad-copy' : auditChannel === 'social' ? 'social-media' : 'website',
      originalContent: draftText,
      detectedIssue: finding.explanation.split('.')[0] || 'Brand Guideline Violation',
      issueExplanation: finding.explanation,
      severity: finding.severity === 'critical' ? 'critical' : finding.severity === 'high' ? 'high' : 'medium',
      guidelineRef: {
        id: finding.ruleId || 'GL-AUDIT',
        title: finding.category.replace('_', ' ').toUpperCase(),
        section: finding.ruleId
      },
      aiSuggestion: {
        suggestedText: draftText.replace(finding.matchedText, finding.recommendedCorrection),
        explanation: `Replace prohibited/unsubstantiated "${finding.matchedText}" with compliant alternative "${finding.recommendedCorrection}".`,
        confidence: finding.confidence || 0.92,
        generatedBy: 'member2-audit'
      },
      workingContent: draftText,
      status: 'draft'
    });

    setSentFindingIds(prev => ({ ...prev, [finding.id]: true }));
    pushToast?.(`Finding "${finding.matchedText}" sent to Correction Workspace!`, 'success');
  };

  const renderScoreCard = (
    reportToRender: AuditReport,
    statusBadge: 'idle' | 'saving' | 'saved' | 'failed',
    errorDetails: string | null,
    onRetry?: () => void
  ) => {
    return (
      <div className="bg-white rounded-2xl border border-cream-300 p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-cream-200">
          <span className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
            Compliance Assessment
          </span>
          <div className="flex items-center gap-2">
            {/* Database Persistence Status Badge */}
            {statusBadge === 'saving' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                <span className="w-2 h-2 rounded-full border border-amber-600 border-t-transparent animate-spin" />
                <span>Saving to DB...</span>
              </span>
            )}
            {statusBadge === 'saved' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <CheckCircle className="w-3 h-3 text-emerald-600" />
                <span>Saved to DB</span>
              </span>
            )}
            {statusBadge === 'failed' && (
              <div className="inline-flex items-center gap-1.5">
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-800 border border-rose-200"
                  title={errorDetails || 'Backend endpoint pending or offline'}
                >
                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                  <span>Unsynced</span>
                </span>
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="text-[10px] font-semibold text-wine-800 hover:text-wine-950 underline transition cursor-pointer"
                    title="Retry saving report to database"
                  >
                    Retry
                  </button>
                )}
              </div>
            )}
            <span className="text-[11px] text-ink-muted">
              Executed in {reportToRender.executionTimeMs}ms
            </span>
          </div>
        </div>

        {/* Overall Score & Grade Badge */}
        <div className="flex items-center justify-between bg-cream-50 p-4 rounded-xl border border-cream-200">
          <div>
            <span className="text-xs text-ink-muted uppercase font-medium">Brand Health Score</span>
            <div className="text-3xl font-extrabold text-wine-950 font-display mt-0.5">
              {reportToRender.score?.overallScore ?? '—'}
              <span className="text-base text-ink-muted font-normal">/100</span>
            </div>
            <span className="text-[11px] font-medium text-ink-secondary capitalize">
              Status: {reportToRender.score?.status?.replace('_', ' ') ?? 'calculated'}
            </span>
          </div>
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black font-display shadow-inner ${
              reportToRender.score?.grade === 'A'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : reportToRender.score?.grade === 'B'
                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                  : reportToRender.score?.grade === 'C'
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-rose-100 text-rose-800 border border-rose-300'
            }`}
          >
            {reportToRender.score?.grade || '—'}
          </div>
        </div>

        {/* Category Breakdown */}
        {reportToRender.score?.categoryScores && (
          <div className="space-y-2 text-xs">
            {reportToRender.score.categoryScores.terminology && (
              <div className="flex justify-between items-center py-1.5 border-b border-cream-100">
                <span className="text-ink-secondary">Terminology Compliance:</span>
                <strong
                  className={`font-mono ${
                    reportToRender.score.categoryScores.terminology.score < 80 ? 'text-rose-700' : 'text-emerald-700'
                  }`}
                >
                  {reportToRender.score.categoryScores.terminology.score}%
                </strong>
              </div>
            )}
            {reportToRender.score.categoryScores.factualAccuracy && (
              <div className="flex justify-between items-center py-1.5 border-b border-cream-100">
                <span className="text-ink-secondary">Factual Accuracy (SLA & SOC-2):</span>
                <strong
                  className={`font-mono ${
                    reportToRender.score.categoryScores.factualAccuracy.score < 80 ? 'text-rose-700' : 'text-emerald-700'
                  }`}
                >
                  {reportToRender.score.categoryScores.factualAccuracy.score}%
                </strong>
              </div>
            )}
            {reportToRender.score.categoryScores.toneVoice && (
              <div className="flex justify-between items-center py-1.5">
                <span className="text-ink-secondary">Tone & Voice Fit:</span>
                <strong className="font-mono text-emerald-700">
                  {reportToRender.score.categoryScores.toneVoice.score}%
                </strong>
              </div>
            )}
          </div>
        )}

        {/* Summary Pills */}
        {reportToRender.summary && (
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-cream-200 text-center">
            <div className="bg-cream-100 p-2 rounded-xl">
              <span className="text-[10px] text-ink-muted block">Findings</span>
              <span className="text-sm font-bold text-ink-primary">{reportToRender.summary.totalFindings}</span>
            </div>
            <div className="bg-rose-50 p-2 rounded-xl border border-rose-200">
              <span className="text-[10px] text-rose-700 block">Critical</span>
              <span className="text-sm font-bold text-rose-800">{reportToRender.summary.criticalCount}</span>
            </div>
            <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-200">
              <span className="text-[10px] text-emerald-700 block">Passed</span>
              <span className="text-sm font-bold text-emerald-800">{reportToRender.summary.passedCount}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderFindingsPanel = (reportToRender: AuditReport) => {
    return (
      <div className="bg-white rounded-2xl border border-cream-300 p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-cream-200">
          <div>
            <h3 className="text-base font-bold text-ink-primary font-display">
              Detected Issues & Remediation Actions ({reportToRender.findings?.length || 0})
            </h3>
            <p className="text-xs text-ink-muted">
              Each violation can be pushed into the Correction Workspace for formal review and human sign-off.
            </p>
          </div>
        </div>

        {!reportToRender.findings || reportToRender.findings.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto" />
            <h4 className="text-sm font-bold text-ink-primary">Zero Violations Found!</h4>
            <p className="text-xs text-ink-muted max-w-md mx-auto">
              This copy strictly adheres to NovaTech guidelines, approved 99.9% uptime SLA commitments, and enterprise vocabulary.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {reportToRender.findings.map(finding => {
              const isSent = sentFindingIds[finding.id];
              return (
                <div
                  key={finding.id}
                  className="p-4 rounded-xl border border-cream-300 bg-cream-50/60 hover:bg-white transition space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          finding.severity === 'critical'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : finding.severity === 'high'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-blue-100 text-blue-800 border border-blue-300'
                        }`}
                      >
                        {finding.severity}
                      </span>
                      <span className="text-xs font-semibold text-ink-primary">
                        Found:{' '}
                        <code className="bg-rose-100/80 text-rose-900 px-1.5 py-0.5 rounded font-mono text-xs">
                          &quot;{finding.matchedText}&quot;
                        </code>
                      </span>
                    </div>

                    {/* Cross-Module Pipeline Button */}
                    {onSendToCorrectionWorkspace && (
                      <button
                        onClick={() => handleSendToWorkspace(finding, reportToRender)}
                        disabled={isSent}
                        className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
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

                  <p className="text-xs text-ink-secondary leading-relaxed">{finding.explanation}</p>

                  <div className="bg-emerald-50/80 p-2.5 rounded-lg border border-emerald-200 text-xs flex items-center justify-between">
                    <span className="text-emerald-900">
                      <strong>Recommended Replacement:</strong> &quot;{finding.recommendedCorrection}&quot;
                    </span>
                    <span className="text-[10px] text-emerald-700 font-mono">
                      Confidence: {Math.round((finding.confidence || 0.9) * 100)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Full Corrected Version */}
        {reportToRender.correctedText && (
          <div className="mt-4 pt-4 border-t border-cream-200">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-secondary block mb-1.5">
              AI Intent-Preserving Remediation Preview
            </span>
            <div className="bg-cream-100 p-3.5 rounded-xl border border-cream-300 text-xs text-ink-primary leading-relaxed font-mono">
              {reportToRender.correctedText}
            </div>
          </div>
        )}
      </div>
    );
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

      {/* Sub-Navigation Tabs: Audit Scanner vs Saved Audits */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-cream-300 shadow-xs">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('scanner')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition inline-flex items-center gap-2 cursor-pointer ${
              activeTab === 'scanner'
                ? 'bg-wine-900 text-white shadow-xs'
                : 'bg-cream-100 text-ink-secondary hover:bg-cream-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Audit Scanner</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('saved');
              loadSavedAudits();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition inline-flex items-center gap-2 cursor-pointer ${
              activeTab === 'saved'
                ? 'bg-wine-900 text-white shadow-xs'
                : 'bg-cream-100 text-ink-secondary hover:bg-cream-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Saved Audits</span>
            {savedAudits.length > 0 && (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === 'saved' ? 'bg-wine-800 text-wine-100' : 'bg-cream-300 text-ink-primary'
                }`}
              >
                {savedAudits.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'saved' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadSavedAudits()}
              disabled={loadingSavedAudits}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cream-300 hover:bg-cream-100 text-ink-primary text-xs font-medium transition cursor-pointer disabled:opacity-50"
              title="Refresh saved audits from backend"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${loadingSavedAudits ? 'animate-spin text-wine-800' : 'text-ink-secondary'}`} />
              <span>Refresh</span>
            </button>
          </div>
        )}
      </div>

      {/* VIEW 1: AUDIT SCANNER (Active by default) */}
      {activeTab === 'scanner' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Editor & Input Panel */}
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
                      className="px-2.5 py-1 rounded-full bg-cream-100 hover:bg-cream-200 text-ink-secondary text-[11px] whitespace-nowrap border border-cream-200 transition cursor-pointer"
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
                    <span>
                      {inputText.length} characters · {inputText.trim().split(/\s+/).filter(Boolean).length} words
                    </span>
                    <button
                      onClick={() => setInputText('')}
                      className="text-ink-muted hover:text-wine-800 transition cursor-pointer"
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
                    className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full bg-wine-900 hover:bg-wine-800 text-white font-semibold text-xs transition shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
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

            {/* Right: Audit Score Card */}
            <div className="lg:col-span-5 space-y-4">
              {report ? (
                renderScoreCard(report, saveStatus, saveErrorMessage, handleRetrySave)
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

          {/* Bottom: Detailed Findings */}
          {report && renderFindingsPanel(report)}
        </>
      )}

      {/* VIEW 2: SAVED AUDITS (Round 3 Improvement 1) */}
      {activeTab === 'saved' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Saved Audits List */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-2xl border border-cream-300 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-cream-200">
                <div>
                  <h3 className="text-sm font-bold text-ink-primary font-display flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-wine-800" />
                    Saved Audits ({savedAudits.length})
                  </h3>
                  <p className="text-[11px] text-ink-muted">
                    Persistent compliance reports from /api/audits
                  </p>
                </div>
              </div>

              {/* Loading State */}
              {loadingSavedAudits && (
                <div className="py-12 text-center space-y-2">
                  <div className="w-6 h-6 border-2 border-wine-900/30 border-t-wine-900 rounded-full animate-spin mx-auto" />
                  <p className="text-xs font-medium text-ink-secondary">Loading saved audits from database...</p>
                </div>
              )}

              {/* Error State with Retry */}
              {!loadingSavedAudits && savedAuditsError && (
                <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/60 space-y-2.5 text-center">
                  <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-rose-900">Failed to Load Saved Audits</h4>
                    <p className="text-[11px] text-rose-700 mt-0.5 leading-relaxed">
                      {savedAuditsError}
                    </p>
                    <p className="text-[10px] text-ink-muted mt-1">
                      The backend database endpoint (/api/audits) may be offline or still being implemented by your teammate.
                    </p>
                  </div>
                  <button
                    onClick={() => loadSavedAudits()}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-wine-900 hover:bg-wine-800 text-white text-[11px] font-semibold transition cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Retry Connection</span>
                  </button>
                </div>
              )}

              {/* Empty State */}
              {!loadingSavedAudits && !savedAuditsError && savedAudits.length === 0 && (
                <div className="py-12 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-cream-100 flex items-center justify-center mx-auto text-xl mb-2">
                    📂
                  </div>
                  <h4 className="text-xs font-bold text-ink-primary">No Saved Audits Found</h4>
                  <p className="text-[11px] text-ink-muted max-w-xs mx-auto">
                    No audits are currently saved in the database. Run an audit in the Scanner to persist reports.
                  </p>
                  <button
                    onClick={() => setActiveTab('scanner')}
                    className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-wine-900 hover:bg-wine-800 text-white text-[11px] font-semibold transition cursor-pointer"
                  >
                    <span>Open Scanner →</span>
                  </button>
                </div>
              )}

              {/* List of Summaries */}
              {!loadingSavedAudits && !savedAuditsError && savedAudits.length > 0 && (
                <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
                  {savedAudits.map(item => {
                    const isSelected = report?.auditId === item.auditId;
                    const isFetchingThis = fetchingAuditId === item.auditId;

                    return (
                      <div
                        key={item.auditId}
                        onClick={() => handleSelectSavedAudit(item.auditId)}
                        className={`p-3.5 rounded-xl border transition cursor-pointer space-y-2 ${
                          isSelected
                            ? 'border-wine-800 bg-rose-50/40 shadow-xs'
                            : 'border-cream-300 bg-cream-50/50 hover:bg-white hover:border-cream-400'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                          {/* Channel Badge (if exists) */}
                          {item.channel && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cream-200 text-ink-primary uppercase tracking-wider">
                              {item.channel}
                            </span>
                          )}

                          {/* Compliance Score (if exists) */}
                          {item.score && typeof item.score.overallScore === 'number' && (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                item.score.overallScore >= 90
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : item.score.overallScore >= 80
                                    ? 'bg-blue-100 text-blue-800'
                                    : item.score.overallScore >= 70
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              Score: {item.score.overallScore}/100 {item.score.grade ? `(${item.score.grade})` : ''}
                            </span>
                          )}
                        </div>

                        {/* Text Snippet (if exists) */}
                        {item.inputText && (
                          <p className="text-xs text-ink-secondary line-clamp-2 leading-relaxed">
                            &quot;{item.inputText}&quot;
                          </p>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-1 pt-1.5 border-t border-cream-200/80 text-[11px] text-ink-muted">
                          {/* Date/Time (if exists) */}
                          {item.timestamp ? (
                            <span className="flex items-center gap-1 text-[10px]">
                              <Clock className="w-3 h-3 text-ink-muted" />
                              {new Date(item.timestamp).toLocaleString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          ) : (
                            <span className="text-[10px]">Date unknown</span>
                          )}

                          {/* Findings Counts (if exists) */}
                          {item.summary && typeof item.summary.totalFindings === 'number' ? (
                            <span className="text-[10px] font-medium text-ink-secondary">
                              {item.summary.totalFindings} {item.summary.totalFindings === 1 ? 'issue' : 'issues'}
                              {typeof item.summary.criticalCount === 'number' && item.summary.criticalCount > 0
                                ? ` (${item.summary.criticalCount} crit)`
                                : ''}
                            </span>
                          ) : null}

                          <span className="text-[10px] font-semibold text-wine-900 flex items-center gap-0.5 ml-auto">
                            {isFetchingThis ? (
                              <>
                                <span className="w-2.5 h-2.5 border border-wine-800 border-t-transparent rounded-full animate-spin" />
                                <span>Loading...</span>
                              </>
                            ) : isSelected ? (
                              <span>Selected ✓</span>
                            ) : (
                              <span>View Report →</span>
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Selected Full Audit Report */}
          <div className="lg:col-span-7 space-y-4">
            {fetchingAuditId ? (
              <div className="bg-white rounded-2xl border border-cream-300 p-12 text-center shadow-xs space-y-3">
                <div className="w-6 h-6 border-2 border-wine-900/30 border-t-wine-900 rounded-full animate-spin mx-auto" />
                <h4 className="text-sm font-semibold text-ink-primary">Retrieving Audit Report...</h4>
                <p className="text-xs text-ink-muted">Fetching full findings and score breakdown from database</p>
              </div>
            ) : report ? (
              <div className="space-y-4">
                {/* Active Audit Banner */}
                <div className="bg-cream-100 border border-cream-300 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-ink-muted tracking-wider block">
                      Active Audit Report
                    </span>
                    <span className="text-xs font-semibold text-ink-primary">
                      ID:{' '}
                      <code className="font-mono text-wine-900 bg-white px-1.5 py-0.5 rounded border border-cream-200">
                        {report.auditId}
                      </code>
                    </span>
                    <span className="text-[11px] text-ink-muted block mt-0.5">
                      {report.timestamp ? new Date(report.timestamp).toLocaleString() : ''} · Channel: {report.channel}
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveTab('scanner')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-wine-900 hover:bg-wine-800 text-white text-xs font-semibold transition cursor-pointer"
                    title="Load this report and text draft into the Scanner editor"
                  >
                    <span>Open in Scanner Editor →</span>
                  </button>
                </div>

                {renderScoreCard(report, 'saved', null)}
                {renderFindingsPanel(report)}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-cream-300 p-12 text-center shadow-xs">
                <div className="w-12 h-12 rounded-full bg-cream-100 flex items-center justify-center mx-auto text-xl mb-3">
                  👈
                </div>
                <h3 className="text-sm font-bold text-ink-primary">Select a Saved Audit</h3>
                <p className="text-xs text-ink-muted mt-1 max-w-sm mx-auto leading-relaxed">
                  Choose an audit report from the list on the left to inspect its complete compliance assessment, detailed violation breakdown, and remediation options.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
