// ============================================================
// NiyamAI — App Root
// Member 4: Correction Workspace
//
// INTEGRATION NOTE:
//   - Member 1 (Brand Guidelines): Replace GuidelineRef stubs in sampleData.ts
//   - Member 2 (AI Text Audit): Replace SAMPLE_CORRECTIONS with real audit findings
//   - Member 3 (Visual Audit): Add visual finding records if agreed upon
//   - Member 5 (Analytics): Call exportAnalyticsSnapshot() and POST to their endpoint
// ============================================================

import { useState, useCallback } from 'react';
import './App.css';
import type { CorrectionRecord, HistoryEntry } from './types';
import {
  loadRecords, saveRecords, updateRecord,
  loadHistory, saveHistory, addHistoryEntry,
} from './utils/storage';
import { RecordList } from './components/RecordList';
import { CorrectionDetail } from './components/CorrectionDetail';
import { CorrectionHistory } from './components/CorrectionHistory';
import { ToastContainer, useToasts } from './components/Toast';

type MainTab = 'workspace' | 'history';

export default function App() {
  const [records, setRecords] = useState<CorrectionRecord[]>(() => loadRecords());
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory());
  const [selectedId, setSelectedId] = useState<string | null>(records[0]?.id ?? null);
  const [mainTab, setMainTab] = useState<MainTab>('workspace');
  const { toasts, push: pushToast, dismiss } = useToasts();

  const selectedRecord = records.find(r => r.id === selectedId) ?? null;

  // Counts for nav badge
  const pendingCount = records.filter(r => r.status === 'pending-approval').length;
  const changesCount = records.filter(r => r.status === 'changes-requested').length;

  const handleSelectRecord = useCallback((id: string) => {
    setSelectedId(id);
    setMainTab('workspace');
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
    if (window.confirm('Reset all records and history to sample data?')) {
      localStorage.removeItem('niyamai_correction_records');
      localStorage.removeItem('niyamai_correction_history');
      const fresh = loadRecords();
      setRecords(fresh);
      setHistory([]);
      setSelectedId(fresh[0]?.id ?? null);
      pushToast('Data reset to sample records.', 'info');
    }
  };

  return (
    <div className="app">
      {/* Top navigation */}
      <nav className="top-nav" role="navigation" aria-label="Main navigation">
        <div className="nav-brand">
          <div className="nav-logo" aria-hidden="true">N</div>
          <span className="nav-name">NiyamAI</span>
        </div>
        <div className="nav-links">
          <span className="nav-link">🏠 Dashboard</span>
          <span className="nav-link">📐 Brand Guidelines</span>
          <span className="nav-link">🔍 Text Audit</span>
          <span className="nav-link">🖼 Visual Audit</span>
          <span className="nav-link active">
            ✏️ Corrections
            {(pendingCount + changesCount) > 0 && (
              <span className="nav-badge">{pendingCount + changesCount}</span>
            )}
          </span>
          <span className="nav-link">📊 Analytics</span>
        </div>
      </nav>

      {/* Page content */}
      <main className="page-container" id="main-content">
        {/* Page header */}
        <div className="page-header">
          <div className="page-header-inner">
            <div>
              <h1 className="page-title">Correction Workspace</h1>
              <p className="page-subtitle">
                Review AI-detected compliance issues, accept or refine suggestions, and manage the approval workflow for your content.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div className="workflow-status-bar">
                <span>📋</span>
                <strong>{records.length}</strong> records
                {pendingCount > 0 && <> · <strong style={{ color: '#A0720A' }}>{pendingCount} pending</strong></>}
                {changesCount > 0 && <> · <strong style={{ color: '#C0440A' }}>{changesCount} needs changes</strong></>}
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={handleResetData}
                aria-label="Reset to sample data"
                title="Reset all records to sample data"
              >
                ↺ Reset Sample Data
              </button>
            </div>
          </div>
        </div>

        {/* Main tabs */}
        <div className="tabs" style={{ maxWidth: 340 }}>
          <button
            className={`tab-btn${mainTab === 'workspace' ? ' active' : ''}`}
            onClick={() => setMainTab('workspace')}
            aria-selected={mainTab === 'workspace'}
          >
            ✏️ Workspace
          </button>
          <button
            className={`tab-btn${mainTab === 'history' ? ' active' : ''}`}
            onClick={() => setMainTab('history')}
            aria-selected={mainTab === 'history'}
          >
            📜 History {history.length > 0 && `(${history.length})`}
          </button>
        </div>

        {mainTab === 'workspace' && (
          <div className="workspace-grid">
            {/* Left: record list */}
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

              {/* Integration status card */}
              <div className="section-card" style={{ marginTop: '1.25rem' }}>
                <div className="section-card-header">
                  <div className="section-card-title" style={{ fontSize: '0.875rem' }}>
                    🔗 Integration Status
                  </div>
                </div>
                <div className="section-card-body">
                  <IntegrationStatus />
                </div>
              </div>
            </div>

            {/* Right: detail */}
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
                      Choose a correction record from the list on the left to review and act on it.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {mainTab === 'history' && (
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

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}

function IntegrationStatus() {
  const items = [
    { member: 'M1 Brand Guidelines', status: 'pending', note: 'Will populate GuidelineRef' },
    { member: 'M2 AI Text Audit', status: 'pending', note: 'Will replace sample data' },
    { member: 'M3 Visual Audit', status: 'pending', note: 'To be confirmed with team' },
    { member: 'M5 Analytics', status: 'pending', note: 'exportAnalyticsSnapshot() ready' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {items.map(it => (
        <div key={it.member} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.8rem' }}>
          <span style={{ color: '#A0720A', flexShrink: 0 }}>⏳</span>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{it.member}</div>
            <div style={{ color: 'var(--text-muted)' }}>{it.note}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
