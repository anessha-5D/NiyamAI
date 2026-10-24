// ============================================================
// NiyamAI — Record List (left panel)
// ============================================================

import type { CorrectionRecord } from '../types';
import {
  severityLabel, severityColor, severityBg,
  statusLabel, statusColor, statusBg,
  contentTypeLabel, timeAgo,
} from '../utils/format';

interface Props {
  records: CorrectionRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function RecordList({ records, selectedId, onSelect }: Props) {
  if (records.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📋</div>
        <div className="empty-state-title">No correction records</div>
        <div className="empty-state-text">Correction records from the AI audit will appear here.</div>
      </div>
    );
  }

  return (
    <div className="record-list" role="listbox" aria-label="Correction records">
      {records.map(rec => (
        <div
          key={rec.id}
          className={`record-card${selectedId === rec.id ? ' selected' : ''}`}
          onClick={() => onSelect(rec.id)}
          role="option"
          aria-selected={selectedId === rec.id}
          tabIndex={0}
          onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onSelect(rec.id)}
        >
          <div className="record-card-title">{rec.contentTitle}</div>
          <div className="record-card-meta">
            <span
              className="badge"
              style={{ background: severityBg(rec.severity), color: severityColor(rec.severity) }}
            >
              {severityLabel(rec.severity)}
            </span>
            <span
              className="badge"
              style={{ background: statusBg(rec.status), color: statusColor(rec.status) }}
            >
              {statusLabel(rec.status)}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
              {timeAgo(rec.updatedAt)}
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.375rem' }}>
            {contentTypeLabel(rec.contentType)}
          </div>
        </div>
      ))}
    </div>
  );
}
