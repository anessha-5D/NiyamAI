// ============================================================
// NiyamAI — Formatting Helpers
// ============================================================

import type { Severity, WorkflowStatus, ContentType, CorrectionMethod } from '../types';

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function severityLabel(s: Severity): string {
  return { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' }[s];
}

export function severityColor(s: Severity): string {
  return {
    critical: '#B91C4A',
    high: '#C0440A',
    medium: '#A0720A',
    low: '#2A6E3A',
  }[s];
}

export function severityBg(s: Severity): string {
  return {
    critical: '#FDEEF2',
    high: '#FEF0E7',
    medium: '#FEF7E0',
    low: '#E8F5EC',
  }[s];
}

export function statusLabel(s: WorkflowStatus): string {
  return {
    draft: 'Draft',
    'correction-accepted': 'Accepted',
    'correction-rejected': 'Rejected',
    'manually-edited': 'Manually Edited',
    'pending-approval': 'Pending Approval',
    approved: 'Approved',
    'changes-requested': 'Changes Requested',
  }[s];
}

export function statusColor(s: WorkflowStatus): string {
  return {
    draft: '#6B5A62',
    'correction-accepted': '#2A6E3A',
    'correction-rejected': '#B91C4A',
    'manually-edited': '#5B4A9E',
    'pending-approval': '#A0720A',
    approved: '#1A6A50',
    'changes-requested': '#C0440A',
  }[s];
}

export function statusBg(s: WorkflowStatus): string {
  return {
    draft: '#F0EBE3',
    'correction-accepted': '#E8F5EC',
    'correction-rejected': '#FDEEF2',
    'manually-edited': '#EDE9F8',
    'pending-approval': '#FEF7E0',
    approved: '#E0F4EE',
    'changes-requested': '#FEF0E7',
  }[s];
}

export function contentTypeLabel(ct: ContentType): string {
  return {
    'social-media': 'Social Media',
    email: 'Email',
    'ad-copy': 'Ad Copy',
    website: 'Website',
    print: 'Print',
    'press-release': 'Press Release',
  }[ct];
}

export function methodLabel(m: CorrectionMethod): string {
  return {
    accepted: 'AI Accepted',
    rejected: 'AI Rejected',
    manual: 'Manual Edit',
    reverted: 'Reverted',
    submitted: 'Submitted',
    resubmitted: 'Resubmitted',
  }[m];
}

export function confidencePct(c: number): string {
  return `${Math.round(c * 100)}%`;
}
