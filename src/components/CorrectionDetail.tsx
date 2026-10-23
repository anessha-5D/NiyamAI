// ============================================================
// NiyamAI — Correction Detail Panel (right panel)
// ============================================================

import React, { useState, useEffect } from 'react';
import type { CorrectionRecord, HistoryEntry, WorkflowStatus } from '../types';
import {
  severityLabel, severityColor, severityBg,
  statusLabel, statusColor, statusBg,
  contentTypeLabel, confidencePct, formatDate,
} from '../utils/format';
import type { ToastType } from './Toast';

interface Props {
  record: CorrectionRecord;
  onUpdate: (updated: CorrectionRecord, histEntry: Omit<HistoryEntry, 'id' | 'timestamp'>) => void;
  pushToast: (msg: string, type?: ToastType) => void;
}

type Panel = 'workspace' | 'approval';

export function CorrectionDetail({ record, onUpdate, pushToast }: Props) {
  const [panel, setPanel] = useState<Panel>('workspace');
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(record.workingContent);
  const [editError, setEditError] = useState('');
  const [approvalComment, setApprovalComment] = useState(record.approvalComment || '');

  // Reset local state when record changes
  useEffect(() => {
    setIsEditing(false);
    setEditText(record.workingContent);
    setEditError('');
    setApprovalComment(record.approvalComment || '');
    setPanel('workspace');
  }, [record.id, record.workingContent, record.approvalComment]);

  const isTerminal = record.status === 'approved';
  const isPending = record.status === 'pending-approval';
  const isChangesRequested = record.status === 'changes-requested';
  const canSubmit =
    record.status === 'correction-accepted' ||
    record.status === 'manually-edited' ||
    record.status === 'correction-rejected' ||
    isChangesRequested;

  // ---- Actions ----

  function handleAccept() {
    const updated: CorrectionRecord = {
      ...record,
      workingContent: record.aiSuggestion.suggestedText,
      status: 'correction-accepted',
    };
    onUpdate(updated, {
      recordId: record.id,
      contentTitle: record.contentTitle,
      originalContent: record.originalContent,
      suggestedContent: record.aiSuggestion.suggestedText,
      finalContent: record.aiSuggestion.suggestedText,
      method: 'accepted',
      status: 'correction-accepted',
    });
    pushToast('AI suggestion accepted and applied.', 'success');
  }

  function handleReject() {
    const updated: CorrectionRecord = {
      ...record,
      workingContent: record.originalContent,
      status: 'correction-rejected',
    };
    onUpdate(updated, {
      recordId: record.id,
      contentTitle: record.contentTitle,
      originalContent: record.originalContent,
      suggestedContent: record.aiSuggestion.suggestedText,
      finalContent: record.originalContent,
      method: 'rejected',
      status: 'correction-rejected',
    });
    pushToast('AI suggestion rejected. Original content restored.', 'warning');
  }

  function handleEditSave() {
    const trimmed = editText.trim();
    if (!trimmed) {
      setEditError('Content cannot be empty.');
      return;
    }
    const updated: CorrectionRecord = {
      ...record,
      workingContent: trimmed,
      status: 'manually-edited',
    };
    onUpdate(updated, {
      recordId: record.id,
      contentTitle: record.contentTitle,
      originalContent: record.originalContent,
      suggestedContent: record.aiSuggestion.suggestedText,
      finalContent: trimmed,
      method: 'manual',
      status: 'manually-edited',
    });
    setIsEditing(false);
    setEditError('');
    pushToast('Manual edit saved.', 'success');
  }

  function handleEditCancel() {
    setEditText(record.workingContent);
    setEditError('');
    setIsEditing(false);
  }

  function handleRevert() {
    const updated: CorrectionRecord = {
      ...record,
      workingContent: record.originalContent,
      status: 'draft',
    };
    onUpdate(updated, {
      recordId: record.id,
      contentTitle: record.contentTitle,
      originalContent: record.originalContent,
      suggestedContent: record.aiSuggestion.suggestedText,
      finalContent: record.originalContent,
      method: 'reverted',
      status: 'draft',
    });
    pushToast('Content reverted to original.', 'info');
  }

  function handleSubmit() {
    const trimmed = record.workingContent.trim();
    if (!trimmed) {
      pushToast('Cannot submit empty content.', 'error');
      return;
    }
    const updated: CorrectionRecord = {
      ...record,
      status: 'pending-approval',
    };
    onUpdate(updated, {
      recordId: record.id,
      contentTitle: record.contentTitle,
      originalContent: record.originalContent,
      suggestedContent: record.aiSuggestion.suggestedText,
      finalContent: record.workingContent,
      method: isChangesRequested ? 'resubmitted' : 'submitted',
      status: 'pending-approval',
    });
    setPanel('approval');
    pushToast('Submitted for approval.', 'success');
  }

  // Simulated reviewer actions
  function handleApprove() {
    const updated: CorrectionRecord = {
      ...record,
      status: 'approved',
      approvalComment: approvalComment,
    };
    onUpdate(updated, {
      recordId: record.id,
      contentTitle: record.contentTitle,
      originalContent: record.originalContent,
      suggestedContent: record.aiSuggestion.suggestedText,
      finalContent: record.workingContent,
      method: 'submitted',
      status: 'approved',
      note: approvalComment || undefined,
    });
    pushToast('Content approved! ✓', 'success');
  }

  function handleRequestChanges() {
    if (!approvalComment.trim()) {
      pushToast('Please add a comment before requesting changes.', 'error');
      return;
    }
    const updated: CorrectionRecord = {
      ...record,
      status: 'changes-requested',
      approvalComment: approvalComment,
    };
    onUpdate(updated, {
      recordId: record.id,
      contentTitle: record.contentTitle,
      originalContent: record.originalContent,
      suggestedContent: record.aiSuggestion.suggestedText,
      finalContent: record.workingContent,
      method: 'submitted',
      status: 'changes-requested',
      note: approvalComment,
    });
    pushToast('Changes requested. Returned to editor.', 'warning');
    setPanel('workspace');
  }

  return (
    <div>
      {/* Sample data notice */}
      <div className="sample-notice" style={{ marginBottom: '1rem' }}>
        <span>🔬</span>
        <span>
          <strong>Sample Data:</strong> AI suggestion below is for demonstration only and was not generated by a live audit engine.
        </span>
      </div>

      {/* Changes Requested alert */}
      {isChangesRequested && record.approvalComment && (
        <div className="changes-requested-alert">
          <span>⚠</span>
          <div>
            <strong>Changes Requested by Reviewer:</strong>
            <div style={{ marginTop: '0.25rem' }}>{record.approvalComment}</div>
          </div>
        </div>
      )}

      {/* Panel tabs */}
      <div className="tabs">
        <button
          className={`tab-btn${panel === 'workspace' ? ' active' : ''}`}
          onClick={() => setPanel('workspace')}
        >
          ✏️ Workspace
        </button>
        <button
          className={`tab-btn${panel === 'approval' ? ' active' : ''}`}
          onClick={() => setPanel('approval')}
          aria-label="Approval workflow panel"
        >
          {isPending ? '⏳' : record.status === 'approved' ? '✅' : '📋'} Approval
        </button>
      </div>

      {panel === 'workspace' && (
        <WorkspacePanel
          record={record}
          isEditing={isEditing}
          editText={editText}
          editError={editError}
          isTerminal={isTerminal}
          isPending={isPending}
          canSubmit={canSubmit}
          onEditTextChange={setEditText}
          onStartEdit={() => { setEditText(record.workingContent); setIsEditing(true); }}
          onSaveEdit={handleEditSave}
          onCancelEdit={handleEditCancel}
          onAccept={handleAccept}
          onReject={handleReject}
          onRevert={handleRevert}
          onSubmit={handleSubmit}
        />
      )}

      {panel === 'approval' && (
        <ApprovalPanel
          record={record}
          comment={approvalComment}
          onCommentChange={setApprovalComment}
          onApprove={handleApprove}
          onRequestChanges={handleRequestChanges}
          onBackToEditor={() => setPanel('workspace')}
          isPending={isPending}
          isApproved={record.status === 'approved'}
        />
      )}
    </div>
  );
}

// ---- Sub-components ----

interface WorkspacePanelProps {
  record: CorrectionRecord;
  isEditing: boolean;
  editText: string;
  editError: string;
  isTerminal: boolean;
  isPending: boolean;
  canSubmit: boolean;
  onEditTextChange: (v: string) => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onAccept: () => void;
  onReject: () => void;
  onRevert: () => void;
  onSubmit: () => void;
}

function WorkspacePanel({
  record, isEditing, editText, editError,
  isTerminal, isPending, canSubmit,
  onEditTextChange, onStartEdit, onSaveEdit,
  onCancelEdit, onAccept, onReject, onRevert, onSubmit,
}: WorkspacePanelProps) {
  return (
    <div>
      {/* Content info */}
      <div className="section-card" style={{ marginBottom: '1.25rem' }}>
        <div className="section-card-header">
          <div className="section-card-title">📄 Content Information</div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span
              className="badge"
              style={{
                background: severityBg(record.severity),
                color: severityColor(record.severity),
              }}
            >
              {severityLabel(record.severity)} Severity
            </span>
            <span
              className="badge"
              style={{
                background: statusBg(record.status),
                color: statusColor(record.status),
              }}
            >
              {statusLabel(record.status)}
            </span>
          </div>
        </div>
        <div className="section-card-body">
          <div className="detail-row">
            <span className="detail-label">Title</span>
            <span className="detail-value" style={{ fontWeight: 600 }}>{record.contentTitle}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Content Type</span>
            <span className="detail-value">{contentTypeLabel(record.contentType)}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Detected Issue</span>
            <span className="detail-value" style={{ fontWeight: 600, color: severityColor(record.severity) }}>
              {record.detectedIssue}
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Explanation</span>
            <span className="detail-value" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {record.issueExplanation}
            </span>
          </div>
          {record.guidelineRef && (
            <div className="detail-row">
              <span className="detail-label">Guideline</span>
              <span className="detail-value">
                <span
                  style={{
                    background: 'var(--lavender)',
                    color: '#3D2B7A',
                    borderRadius: 'var(--radius-pill)',
                    padding: '0.15rem 0.6rem',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}
                >
                  {record.guidelineRef.id}
                </span>
                {' '}
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {record.guidelineRef.title}
                  {record.guidelineRef.section && ` — ${record.guidelineRef.section}`}
                </span>
              </span>
            </div>
          )}
          <div className="detail-row">
            <span className="detail-label">Last Updated</span>
            <span className="detail-value" style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              {formatDate(record.updatedAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Original vs AI suggestion */}
      <div className="section-card" style={{ marginBottom: '1.25rem' }}>
        <div className="section-card-header">
          <div className="section-card-title">🤖 AI Suggestion</div>
          <div className="confidence-bar-wrap" style={{ maxWidth: 200 }}>
            <span>Confidence</span>
            <div className="confidence-bar">
              <div
                className="confidence-fill"
                style={{ width: `${record.aiSuggestion.confidence * 100}%` }}
              />
            </div>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {confidencePct(record.aiSuggestion.confidence)}
            </span>
          </div>
        </div>
        <div className="section-card-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <div className="content-block-label">
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--rose-dark)', display: 'inline-block' }} />
                Original Content
              </div>
              <div className="content-block original">
                {record.originalContent}
              </div>
            </div>
            <div>
              <div className="content-block-label">
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--sage-dark)', display: 'inline-block' }} />
                AI-Suggested Correction
              </div>
              <div className="content-block suggested">
                {record.aiSuggestion.suggestedText}
              </div>
            </div>
          </div>

          <div style={{ marginTop: '0.875rem', padding: '0.75rem', background: 'var(--lavender)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#3D2B7A', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              AI Explanation
            </div>
            <div style={{ fontSize: '0.875rem', color: '#3D2B7A', lineHeight: 1.6 }}>
              {record.aiSuggestion.explanation}
            </div>
          </div>

          {!isTerminal && !isPending && (
            <div className="action-bar">
              <button
                className="btn btn-success btn-sm"
                onClick={onAccept}
                disabled={record.status === 'correction-accepted'}
                title="Apply the AI suggestion"
                aria-label="Accept AI correction"
              >
                ✓ Accept Correction
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={onReject}
                disabled={record.status === 'correction-rejected'}
                title="Keep original content, reject suggestion"
                aria-label="Reject AI correction"
              >
                ✕ Reject
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Working content + manual edit */}
      <div className="section-card">
        <div className="section-card-header">
          <div className="section-card-title">✏️ Working Content</div>
          {!isTerminal && !isPending && !isEditing && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={onStartEdit}
              aria-label="Edit content manually"
            >
              Edit Manually
            </button>
          )}
        </div>
        <div className="section-card-body">
          {isEditing ? (
            <div>
              <label htmlFor="edit-textarea" className="sr-only">Edit working content</label>
              <textarea
                id="edit-textarea"
                className={`edit-textarea${editError ? ' error' : ''}`}
                value={editText}
                onChange={e => onEditTextChange(e.target.value)}
                aria-describedby={editError ? 'edit-error' : undefined}
                autoFocus
              />
              {editError && (
                <div id="edit-error" style={{ color: '#B91C4A', fontSize: '0.8125rem', marginTop: '0.375rem' }}>
                  {editError}
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                <div style={{ flex: 1, fontSize: '0.8125rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                  Original: <em style={{ color: 'var(--text-secondary)', marginLeft: 4 }}>"{record.originalContent.slice(0, 60)}{record.originalContent.length > 60 ? '…' : ''}"</em>
                </div>
                <button className="btn btn-success btn-sm" onClick={onSaveEdit}>Save Edit</button>
                <button className="btn btn-ghost btn-sm" onClick={onCancelEdit}>Cancel</button>
              </div>
            </div>
          ) : (
            <div>
              <div className="content-block working">
                {record.workingContent}
              </div>
              {record.workingContent !== record.originalContent && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>↩</span>
                  <span>Modified from original</span>
                  {!isTerminal && !isPending && (
                    <button
                      className="btn btn-ghost"
                      style={{ fontSize: '0.8rem', padding: '0.1rem 0.5rem' }}
                      onClick={onRevert}
                      aria-label="Revert to original content"
                    >
                      Revert
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Submit for approval */}
          {canSubmit && !isEditing && (
            <div className="action-bar">
              <button
                className="btn btn-primary"
                onClick={onSubmit}
                disabled={!record.workingContent.trim()}
                aria-label="Submit for approval"
              >
                🚀 Submit for Approval
              </button>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
                Submits current working content for review
              </span>
            </div>
          )}

          {isPending && (
            <div style={{ marginTop: '1rem', padding: '0.875rem', background: '#FEF7E0', border: '1px solid #D4A800', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', color: '#7A5500' }}>
              ⏳ <strong>Pending review.</strong> Switch to the Approval tab to see the review panel.
            </div>
          )}

          {isTerminal && (
            <div style={{ marginTop: '1rem', padding: '0.875rem', background: '#E0F4EE', border: '1px solid #1A6A50', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', color: '#1A4A38' }}>
              ✅ <strong>Approved.</strong> This content has been approved and is read-only.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ApprovalPanelProps {
  record: CorrectionRecord;
  comment: string;
  onCommentChange: (v: string) => void;
  onApprove: () => void;
  onRequestChanges: () => void;
  onBackToEditor: () => void;
  isPending: boolean;
  isApproved: boolean;
}

function ApprovalPanel({
  record, comment, onCommentChange,
  onApprove, onRequestChanges, onBackToEditor,
  isPending, isApproved,
}: ApprovalPanelProps) {
  return (
    <div>
      <div className="section-card">
        <div className="section-card-header">
          <div className="section-card-title">📋 Approval Workflow</div>
          <span
            className="badge"
            style={{ background: statusBg(record.status), color: statusColor(record.status) }}
          >
            {statusLabel(record.status)}
          </span>
        </div>
        <div className="section-card-body">
          <div style={{ marginBottom: '1rem' }}>
            <div className="content-block-label">Final Content for Review</div>
            <div className="content-block working">{record.workingContent}</div>
          </div>

          {isApproved ? (
            <div style={{ padding: '1rem', background: '#E0F4EE', border: '1px solid #1A6A50', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontWeight: 700, color: '#1A4A38', marginBottom: '0.375rem' }}>✅ Content Approved</div>
              {record.approvalComment && (
                <div style={{ fontSize: '0.875rem', color: '#1A4A38' }}>
                  Reviewer note: {record.approvalComment}
                </div>
              )}
              <div style={{ fontSize: '0.8125rem', color: '#2A7A60', marginTop: '0.5rem' }}>
                Approved on {formatDate(record.updatedAt)}
              </div>
            </div>
          ) : (
            <div className="approval-panel">
              <div className="approval-panel-title">
                {isPending ? '⏳ Simulated Review Panel' : '📝 Review Panel'}
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                {isPending
                  ? 'This panel simulates the reviewer\'s view for demo purposes. In production, this would be a separate role-gated screen.'
                  : 'Submit this content to enable the review panel.'}
              </p>

              {isPending && (
                <>
                  <label
                    htmlFor="approval-comment"
                    style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}
                  >
                    Reviewer Comment (optional for approval, required for changes)
                  </label>
                  <textarea
                    id="approval-comment"
                    className="approval-comment-input"
                    placeholder="Add a comment…"
                    value={comment}
                    onChange={e => onCommentChange(e.target.value)}
                  />
                  <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
                    <button className="btn btn-success" onClick={onApprove}>
                      ✓ Approve
                    </button>
                    <button className="btn btn-danger" onClick={onRequestChanges}>
                      ↩ Request Changes
                    </button>
                    <button className="btn btn-ghost" onClick={onBackToEditor}>
                      Back to Editor
                    </button>
                  </div>
                </>
              )}

              {!isPending && !isApproved && (
                <button className="btn btn-secondary" onClick={onBackToEditor}>
                  ← Back to Editor
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Workflow status steps */}
      <div className="section-card" style={{ marginTop: '1.25rem' }}>
        <div className="section-card-header">
          <div className="section-card-title">Workflow Status</div>
        </div>
        <div className="section-card-body">
          <WorkflowSteps currentStatus={record.status} />
        </div>
      </div>
    </div>
  );
}

const WORKFLOW_STEPS: { status: WorkflowStatus; label: string }[] = [
  { status: 'draft', label: 'Draft' },
  { status: 'correction-accepted', label: 'Decision Made' },
  { status: 'pending-approval', label: 'Under Review' },
  { status: 'approved', label: 'Approved' },
];

function WorkflowSteps({ currentStatus }: { currentStatus: WorkflowStatus }) {
  const specialStatuses = new Set<WorkflowStatus>([
    'correction-rejected',
    'manually-edited',
    'changes-requested',
  ]);

  const baseOrder: WorkflowStatus[] = [
    'draft',
    'correction-accepted',
    'manually-edited',
    'pending-approval',
    'approved',
  ];

  const currentIdx = baseOrder.indexOf(currentStatus);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0', overflowX: 'auto', paddingBottom: '0.25rem' }}>
      {WORKFLOW_STEPS.map((step, i) => {
        const stepIdx = baseOrder.indexOf(step.status);
        const isDone = currentIdx > stepIdx;
        const isActive = currentStatus === step.status ||
          (step.status === 'correction-accepted' && specialStatuses.has(currentStatus) && currentStatus !== 'pending-approval') ||
          (step.status === 'pending-approval' && currentStatus === 'changes-requested');
        const _isNext = !isDone && !isActive;

        return (
          <React.Fragment key={step.status}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.375rem', flex: '0 0 auto', minWidth: 80 }}>
              <div style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: isDone ? 'var(--sage-dark)' : isActive ? 'var(--wine)' : 'var(--cream-dark)',
                border: `2px solid ${isDone ? 'var(--sage-dark)' : isActive ? 'var(--wine)' : 'var(--border-strong)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isDone || isActive ? '#fff' : 'var(--text-muted)',
                fontSize: '0.8rem',
                fontWeight: 700,
                transition: 'all 0.3s',
              }}>
                {isDone ? '✓' : i + 1}
              </div>
              <div style={{
                fontSize: '0.7rem',
                fontWeight: isActive ? 700 : 400,
                color: isActive ? 'var(--wine)' : isDone ? 'var(--text-secondary)' : 'var(--text-muted)',
                textAlign: 'center',
                whiteSpace: 'nowrap',
              }}>
                {step.label}
              </div>
            </div>
            {i < WORKFLOW_STEPS.length - 1 && (
              <div style={{
                flex: 1,
                height: 2,
                background: isDone ? 'var(--sage-dark)' : 'var(--border)',
                minWidth: 20,
                marginBottom: 18,
                transition: 'background 0.3s',
              }} />
            )}
          </React.Fragment>
        );
      })}

      {/* Show special status badge */}
      {specialStatuses.has(currentStatus) && (
        <div style={{
          marginLeft: '0.75rem',
          marginBottom: 18,
          flexShrink: 0,
        }}>
          <span
            className="badge"
            style={{ background: statusBg(currentStatus), color: statusColor(currentStatus), fontSize: '0.7rem' }}
          >
            {statusLabel(currentStatus)}
          </span>
        </div>
      )}
    </div>
  );
}


