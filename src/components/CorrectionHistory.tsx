// ============================================================
// NiyamAI — Correction History Panel
// ============================================================

import { useState } from 'react';
import type { HistoryEntry } from '../types';
import {
  statusLabel, statusColor, statusBg,
  methodLabel, formatDate, timeAgo,
} from '../utils/format';

interface Props {
  history: HistoryEntry[];
  onClearHistory: () => void;
}

export function CorrectionHistory({ history, onClearHistory }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = history.find(h => h.id === selectedId) ?? null;

  if (history.length === 0) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', color: 'var(--text-primary)' }}>
            Correction History
          </h2>
          <div className="sample-notice">
            <span>💾</span> Stored in browser localStorage
          </div>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">📜</div>
          <div className="empty-state-title">No history yet</div>
          <div className="empty-state-text">
            Actions you take in the Correction Workspace will be recorded here.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', color: 'var(--text-primary)' }}>
            Correction History
          </h2>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
            {history.length} record{history.length !== 1 ? 's' : ''} — local prototype log, not a server-side audit trail
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <div className="sample-notice">
            <span>💾</span> localStorage
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              if (window.confirm('Clear all local correction history?')) {
                onClearHistory();
                setSelectedId(null);
              }
            }}
            aria-label="Clear correction history"
          >
            🗑 Clear History
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: '1.25rem' }}>
        {/* History list */}
        <div className="history-list">
          {history.map(entry => (
            <div
              key={entry.id}
              className={`history-item${selectedId === entry.id ? ' selected' : ''}`}
              onClick={() => setSelectedId(selectedId === entry.id ? null : entry.id)}
              tabIndex={0}
              role="button"
              aria-expanded={selectedId === entry.id}
              onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setSelectedId(selectedId === entry.id ? null : entry.id)}
              aria-label={`History entry: ${entry.contentTitle}`}
            >
              <div className="history-item-top">
                <div>
                  <div className="history-item-title">{entry.contentTitle}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                    {timeAgo(entry.timestamp)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <span
                    className="badge"
                    style={{
                      background: '#F0EBE3',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {methodLabel(entry.method)}
                  </span>
                  <span
                    className="badge"
                    style={{ background: statusBg(entry.status), color: statusColor(entry.status) }}
                  >
                    {statusLabel(entry.status)}
                  </span>
                </div>
              </div>

              {/* Preview */}
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {entry.finalContent}
              </div>

              {entry.note && (
                <div style={{ marginTop: '0.375rem', fontSize: '0.75rem', color: '#7A2A06', background: '#FEF0E7', padding: '0.25rem 0.5rem', borderRadius: 6 }}>
                  Note: {entry.note}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="history-detail-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: '1rem' }}>
                {selected.contentTitle}
              </div>
              <button
                className="btn btn-ghost btn-icon"
                onClick={() => setSelectedId(null)}
                aria-label="Close detail panel"
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <span className="badge" style={{ background: '#F0EBE3', color: 'var(--text-secondary)' }}>
                {methodLabel(selected.method)}
              </span>
              <span className="badge" style={{ background: statusBg(selected.status), color: statusColor(selected.status) }}>
                {statusLabel(selected.status)}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
                {formatDate(selected.timestamp)}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <div className="content-block-label">
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--rose-dark)', display: 'inline-block' }} />
                  Original Content
                </div>
                <div className="content-block original" style={{ fontSize: '0.875rem' }}>
                  {selected.originalContent}
                </div>
              </div>

              <div>
                <div className="content-block-label">
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--sage-dark)', display: 'inline-block' }} />
                  AI Suggestion
                </div>
                <div className="content-block suggested" style={{ fontSize: '0.875rem' }}>
                  {selected.suggestedContent}
                </div>
              </div>

              <div>
                <div className="content-block-label">
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--wine)', display: 'inline-block' }} />
                  Final Content
                </div>
                <div className="content-block working" style={{ fontSize: '0.875rem' }}>
                  {selected.finalContent}
                </div>
              </div>

              {selected.note && (
                <div style={{ padding: '0.75rem', background: '#FEF0E7', border: '1px solid #C0440A', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', color: '#7A2A06' }}>
                  <strong>Note:</strong> {selected.note}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
