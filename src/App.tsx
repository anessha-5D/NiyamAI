// ============================================================
// NiyamAI — Unified Application Shell
// Fully Integrating Members 1, 2, 3, 4, and 5
// ============================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import './App.css';
import type { CorrectionRecord, HistoryEntry } from './types';
import {
  loadRecords, saveRecords, updateRecord,
  loadHistory, saveHistory, addHistoryEntry,
} from './utils/storage';
import { getCorrectionRecords, getAllCorrectionHistory } from './services/databaseService';
import { RecordList } from './components/RecordList';
import { CorrectionDetail } from './components/CorrectionDetail';
import { CorrectionHistory } from './components/CorrectionHistory';
import { ToastContainer, useToasts } from './components/Toast';

// Integrated Member Modules
import BrandKit from './components/BrandKit';
import { TextAudit } from './components/TextAudit';
import { VisualAudit } from './components/VisualAudit';
import { PublishingAnalytics } from './components/PublishingAnalytics';

export type ActiveModuleTab = 'dashboard' | 'brand-kit' | 'text-audit' | 'visual-audit' | 'corrections' | 'publishing';
type WorkspaceSubTab = 'workspace' | 'history';

export default function App() {
  const [activeModule, setActiveModule] = useState<ActiveModuleTab>('dashboard');
  const [records, setRecords] = useState<CorrectionRecord[]>(() => loadRecords());
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory());
  const [selectedId, setSelectedId] = useState<string | null>(records[0]?.id ?? null);
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceSubTab>('workspace');
  const { toasts, push: pushToast, dismiss } = useToasts();

  const selectedRecord = useMemo(() => records.find(r => r.id === selectedId) ?? null, [records, selectedId]);

  // Phase 1: Read-only database hydration for correction records and history
  useEffect(() => {
    let isMounted = true;

    async function hydrateFromDatabase() {
      try {
        const [recordsResult, historyResult] = await Promise.allSettled([
          getCorrectionRecords(),
          getAllCorrectionHistory()
        ]);

        if (!isMounted) return;

        // Hydrate records if backend returned a non-empty array
        if (
          recordsResult.status === 'fulfilled' &&
          Array.isArray(recordsResult.value) &&
          recordsResult.value.length > 0
        ) {
          setRecords(recordsResult.value);
          saveRecords(recordsResult.value);
          setSelectedId(prevId => {
            const exists = recordsResult.value.some(r => r.id === prevId);
            return exists ? prevId : (recordsResult.value[0]?.id ?? null);
          });
        }

        // Hydrate history if backend returned a non-empty array
        if (
          historyResult.status === 'fulfilled' &&
          Array.isArray(historyResult.value) &&
          historyResult.value.length > 0
        ) {
          setHistory(historyResult.value);
          saveHistory(historyResult.value);
        }
      } catch (err) {
        // Silently retain existing local data if database request fails
        console.warn('[App] Database hydration failed or offline:', err);
      }
    }

    hydrateFromDatabase();

    return () => {
      isMounted = false;
    };
  }, []);

  // Counts for nav badges
  const pendingCount = records.filter(r => r.status === 'pending-approval').length;
  const changesCount = records.filter(r => r.status === 'changes-requested').length;
  const approvedRecords = useMemo(() => records.filter(r => r.status === 'approved'), [records]);

  const handleSelectRecord = useCallback((id: string) => {
    setSelectedId(id);
    setWorkspaceTab('workspace');
  }, []);

  const handleUpdate = useCallback(
    (updated: CorrectionRecord, histEntry: Omit<HistoryEntry, 'id' | 'timestamp'>) => {
      const newRecords = updateRecord(records, updated);
      setRecords(newRecords);
      saveRecords(newRecords);

      const newHistory = addHistoryEntry(history, histEntry);
      setHistory(newHistory);
      saveHistory(newHistory);
    },
    [records, history]
  );

  const handleClearHistory = useCallback(() => {
    setHistory([]);
    saveHistory([]);
  }, []);

  const handleResetData = () => {
    if (window.confirm('Reset all records and history to benchmark sample data?')) {
      localStorage.removeItem('niyamai_correction_records');
      localStorage.removeItem('niyamai_correction_history');
      const fresh = loadRecords();
      setRecords(fresh);
      setHistory([]);
      setSelectedId(fresh[0]?.id ?? null);
      pushToast('Data reset to sample records.', 'info');
    }
  };

  // Cross-Module Pipeline: Ingest new finding into Correction Workspace
  const handleCreateCorrectionRecord = useCallback(
    (recordData: Omit<CorrectionRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
      const newRecord: CorrectionRecord = {
        ...recordData,
        id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const nextRecords = [newRecord, ...records];
      setRecords(nextRecords);
      saveRecords(nextRecords);
      setSelectedId(newRecord.id);

      // Add audit history log entry
      const histEntry = addHistoryEntry(history, {
        recordId: newRecord.id,
        contentTitle: newRecord.contentTitle,
        originalContent: newRecord.originalContent,
        suggestedContent: newRecord.aiSuggestion.suggestedText,
        finalContent: newRecord.workingContent,
        method: 'submitted',
        status: 'draft',
        note: `Ingested from audit engine: ${newRecord.detectedIssue}`
      });
      setHistory(histEntry);
      saveHistory(histEntry);
    },
    [records, history]
  );

  return (
    <div className="app min-h-screen bg-[#FAF7F2] text-[#1A0A0F] font-sans">
      {/* GLOBAL TOP NAVIGATION */}
      <nav className="top-nav" role="navigation" aria-label="Main navigation">
        <div
          className="nav-brand flex items-center gap-2.5 cursor-pointer"
          onClick={() => setActiveModule('dashboard')}
          title="Open NiyamAI Overview Dashboard"
        >
          <div className="nav-logo" aria-hidden="true">N</div>
          <span className="nav-name">NiyamAI</span>
        </div>

        {/* 6-Item Navigation Tabs */}
        <div className="nav-links flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setActiveModule('dashboard')}
            className={`nav-link ${activeModule === 'dashboard' ? 'active font-bold' : ''}`}
            title="Overview & 5-Step Pipeline"
          >
            <span>🏠 Dashboard</span>
          </button>

          <button
            onClick={() => setActiveModule('brand-kit')}
            className={`nav-link ${activeModule === 'brand-kit' ? 'active font-bold' : ''}`}
            title="Step 01: Brand Knowledge, Guidelines & Design Assets"
          >
            <span>📐 Brand Kit</span>
          </button>

          <button
            onClick={() => setActiveModule('text-audit')}
            className={`nav-link ${activeModule === 'text-audit' ? 'active font-bold' : ''}`}
            title="Step 02: AI Text & Claims Compliance Audit"
          >
            <span>🔍 Text Audit</span>
          </button>

          <button
            onClick={() => setActiveModule('visual-audit')}
            className={`nav-link ${activeModule === 'visual-audit' ? 'active font-bold' : ''}`}
            title="Step 03: Visual Quality, Contrast & Alt-Text Audit"
          >
            <span>🖼 Visual Audit</span>
          </button>

          <button
            onClick={() => setActiveModule('corrections')}
            className={`nav-link ${activeModule === 'corrections' ? 'active font-bold' : ''}`}
            title="Step 04: Human Review & Correction Workspace"
          >
            <span>✏️ Corrections</span>
            {(pendingCount + changesCount) > 0 && (
              <span className="nav-badge">{pendingCount + changesCount}</span>
            )}
          </button>

          <button
            onClick={() => setActiveModule('publishing')}
            className={`nav-link ${activeModule === 'publishing' ? 'active font-bold' : ''}`}
            title="Step 05: Pre-Publish Release Gatekeeper & Provenance Analytics"
          >
            <span>🚀 Publishing & Analytics</span>
            {approvedRecords.length > 0 && (
              <span className="nav-badge bg-emerald-400 text-emerald-950 font-bold">
                {approvedRecords.length}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* MODULE 0: DASHBOARD / OVERVIEW */}
      {activeModule === 'dashboard' && (
        <main className="page-container">
          <div className="page-header">
            <h1 className="page-title">Digital Correction & Approval Workspace</h1>
            <p className="page-subtitle">
              NiyamAI coordinates automated brand auditing, intent-preserving corrections, human approval workflows, and tamper-evident release management for enterprise marketing copy.
            </p>
          </div>

          {/* 5-Step Pipeline Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div
              onClick={() => setActiveModule('brand-kit')}
              className="bg-white rounded-2xl p-5 border border-cream-300 shadow-xs hover:border-wine-800 cursor-pointer transition space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="w-6 h-6 rounded-full bg-wine-900 text-white font-bold text-xs flex items-center justify-center">1</span>
                <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">ACTIVE</span>
              </div>
              <h3 className="font-bold text-sm text-wine-950 font-display group-hover:text-wine-800 transition">Brand Kit</h3>
              <p className="text-xs text-ink-muted">Company profile, SLA facts, guidelines & design tokens.</p>
              <span className="text-xs font-semibold text-wine-900 block pt-1">Open Module →</span>
            </div>

            <div
              onClick={() => setActiveModule('text-audit')}
              className="bg-white rounded-2xl p-5 border border-cream-300 shadow-xs hover:border-wine-800 cursor-pointer transition space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="w-6 h-6 rounded-full bg-wine-900 text-white font-bold text-xs flex items-center justify-center">2</span>
                <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">PORT 5001</span>
              </div>
              <h3 className="font-bold text-sm text-wine-950 font-display group-hover:text-wine-800 transition">AI Text Audit</h3>
              <p className="text-xs text-ink-muted">Hybrid Gemini & deterministic rule compliance scanner.</p>
              <span className="text-xs font-semibold text-wine-900 block pt-1">Run Audit →</span>
            </div>

            <div
              onClick={() => setActiveModule('visual-audit')}
              className="bg-white rounded-2xl p-5 border border-cream-300 shadow-xs hover:border-wine-800 cursor-pointer transition space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="w-6 h-6 rounded-full bg-wine-900 text-white font-bold text-xs flex items-center justify-center">3</span>
                <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">WCAG AA</span>
              </div>
              <h3 className="font-bold text-sm text-wine-950 font-display group-hover:text-wine-800 transition">Visual Studio</h3>
              <p className="text-xs text-ink-muted">Image metadata, WCAG contrast ratio & alt-text review.</p>
              <span className="text-xs font-semibold text-wine-900 block pt-1">Inspect Creative →</span>
            </div>

            <div
              onClick={() => setActiveModule('corrections')}
              className="bg-white rounded-2xl p-5 border border-cream-300 shadow-xs hover:border-wine-800 cursor-pointer transition space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="w-6 h-6 rounded-full bg-wine-900 text-white font-bold text-xs flex items-center justify-center">4</span>
                <span className="text-[10px] font-mono font-bold text-wine-900 bg-rose-100 px-2 py-0.5 rounded-full">{records.length} RECORDS</span>
              </div>
              <h3 className="font-bold text-sm text-wine-950 font-display group-hover:text-wine-800 transition">Corrections</h3>
              <p className="text-xs text-ink-muted">Side-by-side diff review, manual editor & approvals.</p>
              <span className="text-xs font-semibold text-wine-900 block pt-1">Review Workspace →</span>
            </div>

            <div
              onClick={() => setActiveModule('publishing')}
              className="bg-white rounded-2xl p-5 border border-cream-300 shadow-xs hover:border-wine-800 cursor-pointer transition space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="w-6 h-6 rounded-full bg-wine-900 text-white font-bold text-xs flex items-center justify-center">5</span>
                <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">RELEASE GATE</span>
              </div>
              <h3 className="font-bold text-sm text-wine-950 font-display group-hover:text-wine-800 transition">Publishing Gate</h3>
              <p className="text-xs text-ink-muted">Thresholds, SHA-256 hash chains & analytics.</p>
              <span className="text-xs font-semibold text-wine-900 block pt-1">Release Gate →</span>
            </div>
          </div>

          {/* Workflow Status Bar */}
          <div className="section-card">
            <div className="section-card-header">
              <div className="section-card-title">Live Governance Pipeline Status</div>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                {approvedRecords.length} of {records.length} records approved
              </span>
            </div>
            <div className="section-card-body" style={{ padding: '1.25rem' }}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <span className="text-xs text-ink-muted block">Pending Human Review</span>
                    <strong className="text-amber-700 font-mono text-lg">{pendingCount}</strong>
                  </div>
                  <div>
                    <span className="text-xs text-ink-muted block">Needs Changes</span>
                    <strong className="text-rose-700 font-mono text-lg">{changesCount}</strong>
                  </div>
                  <div>
                    <span className="text-xs text-ink-muted block">Approved for Gate</span>
                    <strong className="text-emerald-700 font-mono text-lg">{approvedRecords.length}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveModule('corrections')}
                    className="btn btn-primary btn-sm"
                  >
                    Open Correction Workspace
                  </button>
                  <button
                    onClick={() => setActiveModule('publishing')}
                    className="btn btn-secondary btn-sm"
                  >
                    View Release Gatekeeper
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* MODULE 1: BRAND KIT (Member 1) */}
      {activeModule === 'brand-kit' && (
        <main className="w-full">
          <BrandKit
            showHero={true}
            showLocalTabs={true}
          />
        </main>
      )}

      {/* MODULE 2: AI TEXT AUDIT (Member 2) */}
      {activeModule === 'text-audit' && (
        <main className="w-full">
          <TextAudit
            onSendToCorrectionWorkspace={(rec) => {
              handleCreateCorrectionRecord(rec);
              setActiveModule('corrections');
            }}
            pushToast={pushToast}
          />
        </main>
      )}

      {/* MODULE 3: VISUAL AUDIT (Member 3) */}
      {activeModule === 'visual-audit' && (
        <main className="w-full">
          <VisualAudit
            onSendToCorrectionWorkspace={(rec) => {
              handleCreateCorrectionRecord(rec);
              setActiveModule('corrections');
            }}
            pushToast={pushToast}
          />
        </main>
      )}

      {/* MODULE 4: CORRECTION WORKSPACE (Member 4) */}
      {activeModule === 'corrections' && (
        <main className="page-container" id="main-content">
          <div className="page-header">
            <div className="page-header-inner">
              <div>
                <h1 className="page-title">Correction & Review Workspace</h1>
                <p className="page-subtitle">
                  Review AI-detected compliance findings, inspect side-by-side diffs, accept or refine suggestions, and approve content for release.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div className="workflow-status-bar">
                  <span>📋</span>
                  <strong>{records.length}</strong> records
                  {pendingCount > 0 && <> · <strong style={{ color: '#A0720A' }}>{pendingCount} pending</strong></>}
                  {changesCount > 0 && <> · <strong style={{ color: '#C0440A' }}>{changesCount} needs changes</strong></>}
                  {approvedRecords.length > 0 && <> · <strong style={{ color: '#1B6A3E' }}>{approvedRecords.length} approved</strong></>}
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={handleResetData}
                  aria-label="Reset to sample data"
                  title="Reset all records to benchmark sample data"
                >
                  ↺ Reset Data
                </button>
              </div>
            </div>
          </div>

          {/* Sub-tabs: Workspace vs History */}
          <div className="tabs" style={{ maxWidth: 340 }}>
            <button
              className={`tab-btn${workspaceTab === 'workspace' ? ' active' : ''}`}
              onClick={() => setWorkspaceTab('workspace')}
              aria-selected={workspaceTab === 'workspace'}
            >
              ✏️ Workspace
            </button>
            <button
              className={`tab-btn${workspaceTab === 'history' ? ' active' : ''}`}
              onClick={() => setWorkspaceTab('history')}
              aria-selected={workspaceTab === 'history'}
            >
              📜 Audit History {history.length > 0 && `(${history.length})`}
            </button>
          </div>

          {workspaceTab === 'workspace' && (
            <div className="workspace-grid">
              {/* Left: Record list */}
              <div>
                <div className="section-card">
                  <div className="section-card-header">
                    <div className="section-card-title">Correction Records</div>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      {records.length} total
                    </span>
                  </div>
                  <div className="section-card-body" style={{ padding: '0.75rem' }}>
                    <RecordList
                      records={records}
                      selectedId={selectedId}
                      onSelect={handleSelectRecord}
                    />
                  </div>
                </div>

                {/* Pipeline Integration Status Card */}
                <div className="section-card" style={{ marginTop: '1.25rem' }}>
                  <div className="section-card-header">
                    <div className="section-card-title" style={{ fontSize: '0.875rem' }}>
                      🔗 5-Step Pipeline Live State
                    </div>
                  </div>
                  <div className="section-card-body">
                    <PipelineIntegrationStatus
                      recordsCount={records.length}
                      approvedCount={approvedRecords.length}
                      onNavigate={(tab) => setActiveModule(tab)}
                    />
                  </div>
                </div>
              </div>

              {/* Right: Record Detail */}
              <div>
                {selectedRecord ? (
                  <CorrectionDetail
                    key={selectedRecord.id}
                    record={selectedRecord}
                    onUpdate={handleUpdate}
                    pushToast={pushToast}
                  />
                ) : (
                  <div className="section-card">
                    <div className="empty-state" style={{ padding: '4rem 2rem' }}>
                      <div className="empty-state-icon">👈</div>
                      <div className="empty-state-title">Select a record</div>
                      <div className="empty-state-text">
                        Choose a correction record from the list on the left to review, edit, and approve.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {workspaceTab === 'history' && (
            <div className="section-card">
              <div className="section-card-body">
                <CorrectionHistory
                  history={history}
                  onClearHistory={handleClearHistory}
                />
              </div>
            </div>
          )}
        </main>
      )}

      {/* MODULE 5: PUBLISHING & GOVERNANCE ANALYTICS (Member 5) */}
      {activeModule === 'publishing' && (
        <main className="w-full">
          <PublishingAnalytics
            approvedRecords={approvedRecords}
            history={history}
            pushToast={pushToast}
          />
        </main>
      )}

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}

function PipelineIntegrationStatus({
  recordsCount,
  approvedCount,
  onNavigate
}: {
  recordsCount: number;
  approvedCount: number;
  onNavigate: (tab: ActiveModuleTab) => void;
}) {
  const steps = [
    { num: 1, title: 'Brand Kit', note: '5 sections active & seeded', tab: 'brand-kit' as ActiveModuleTab, status: 'active' },
    { num: 2, title: 'AI Text Audit', note: 'API Port 5001 connected', tab: 'text-audit' as ActiveModuleTab, status: 'active' },
    { num: 3, title: 'Visual Audit', note: 'WCAG contrast & alt-text ready', tab: 'visual-audit' as ActiveModuleTab, status: 'active' },
    { num: 4, title: 'Correction Review', note: `${recordsCount} active records`, tab: 'corrections' as ActiveModuleTab, status: 'current' },
    { num: 5, title: 'Release Gate', note: `${approvedCount} approved for release`, tab: 'publishing' as ActiveModuleTab, status: approvedCount > 0 ? 'ready' : 'pending' },
  ];

  return (
    <div className="space-y-2.5 text-xs">
      {steps.map(s => (
        <button
          key={s.num}
          onClick={() => onNavigate(s.tab)}
          className="w-full text-left p-2 rounded-lg hover:bg-cream-100 flex items-start gap-2.5 transition border border-transparent hover:border-cream-300"
        >
          <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${
            s.status === 'ready' || s.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
            s.status === 'current' ? 'bg-wine-900 text-white' : 'bg-stone-200 text-stone-600'
          }`}>
            {s.num}
          </span>
          <div className="leading-tight">
            <div className="font-semibold text-ink-primary">{s.title}</div>
            <div className="text-[11px] text-ink-muted">{s.note}</div>
          </div>
        </button>
      ))}
    </div>
  );
}
