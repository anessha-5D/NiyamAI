// ============================================================
// NiyamAI — localStorage Persistence
// Member 4: Correction Workspace
//
// INTEGRATION NOTE:
//   Replace these functions with API calls when the backend
//   is available. The shape of CorrectionRecord and
//   HistoryEntry must remain identical.
// ============================================================

import type { CorrectionRecord, HistoryEntry } from '../types';
import { SAMPLE_CORRECTIONS } from '../data/sampleData';

const RECORDS_KEY = 'niyamai_correction_records';
const HISTORY_KEY = 'niyamai_correction_history';

// --------------- Records ---------------

export function loadRecords(): CorrectionRecord[] {
  try {
    const raw = localStorage.getItem(RECORDS_KEY);
    if (!raw) {
      // First load — seed with sample data
      const seeded = SAMPLE_CORRECTIONS.map(r => ({ ...r }));
      saveRecords(seeded);
      return seeded;
    }
    return JSON.parse(raw) as CorrectionRecord[];
  } catch {
    return SAMPLE_CORRECTIONS.map(r => ({ ...r }));
  }
}

export function saveRecords(records: CorrectionRecord[]): void {
  try {
    localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
  } catch (e) {
    console.error('NiyamAI: failed to persist records', e);
  }
}

export function updateRecord(
  records: CorrectionRecord[],
  updated: CorrectionRecord
): CorrectionRecord[] {
  return records.map(r => (r.id === updated.id ? { ...updated, updatedAt: new Date().toISOString() } : r));
}

// --------------- History ---------------

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveHistory(history: HistoryEntry[]): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (e) {
    console.error('NiyamAI: failed to persist history', e);
  }
}

export function addHistoryEntry(
  history: HistoryEntry[],
  entry: Omit<HistoryEntry, 'id' | 'timestamp'>
): HistoryEntry[] {
  const newEntry: HistoryEntry = {
    ...entry,
    id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
  };
  return [newEntry, ...history];
}

// --------------- Helpers ---------------

export function clearLocalData(): void {
  localStorage.removeItem(RECORDS_KEY);
  localStorage.removeItem(HISTORY_KEY);
}

/**
 * Export snapshot for Member 5 (Analytics).
 * INTEGRATION NOTE: When Member 5's API is ready, send this payload instead
 * of returning it locally.
 */
export function exportAnalyticsSnapshot(
  records: CorrectionRecord[],
  history: HistoryEntry[]
) {
  return {
    exportedAt: new Date().toISOString(),
    source: 'member4-correction-workspace',
    records,
    history,
  };
}
