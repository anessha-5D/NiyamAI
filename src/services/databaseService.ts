/**
 * NiyamAI — Database Service (Frontend Integration)
 *
 * Implements the frontend API client for database-backed persistence of:
 * - Audits (`/api/audits`)
 * - Correction Records (`/api/corrections`)
 * - Correction History (`/api/corrections/:id/history`, `/api/correction-history`)
 *
 * Communicates with the Express backend via the existing Vite `/api` proxy.
 * Reuses existing TypeScript types and ensures camelCase fields throughout.
 */

import type { AuditReport } from './auditApi';
import type { CorrectionRecord, HistoryEntry } from '../types';

const API_BASE = '/api';

/**
 * Custom error class for database API failures.
 * Captures HTTP status code, target endpoint, and backend error payload.
 */
export class DatabaseApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public endpoint?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'DatabaseApiError';
  }
}

/**
 * Internal generic HTTP request helper.
 * Enforces JSON headers, handles network timeouts/failures,
 * and extracts structured error details from non-2xx responses.
 */
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
  } catch (networkErr: any) {
    throw new DatabaseApiError(
      `Network error when calling ${endpoint}: ${networkErr.message || 'Server unreachable'}`,
      undefined,
      endpoint,
      networkErr
    );
  }

  if (!res.ok) {
    let errorData: any = null;
    try {
      errorData = await res.json();
    } catch {
      try {
        errorData = await res.text();
      } catch {
        // Fallback if response body cannot be read
      }
    }

    const message =
      typeof errorData === 'object' && errorData !== null
        ? errorData.message || errorData.error || `Request failed with status ${res.status}`
        : typeof errorData === 'string' && errorData.trim()
          ? errorData
          : `Request to ${endpoint} failed with status ${res.status} (${res.statusText})`;

    throw new DatabaseApiError(message, res.status, endpoint, errorData);
  }

  // Backend confirmed success; parse and return payload
  return (await res.json()) as T;
}

// ============================================================
// AUDITS API
// ============================================================

/**
 * Summary representation of an audit report returned by GET /api/audits.
 * Derives strictly from AuditReport, omitting the detailed arrays (findings,
 * correctedText, and passedChecks) while preserving confirmed audit identity,
 * timestamp, channel, compliance score, and summary metrics without inventing unconfirmed fields.
 */
export type AuditReportSummary = Omit<AuditReport, 'findings' | 'correctedText' | 'passedChecks'>;

/**
 * Save an audit report to the database.
 * Preserves the existing auditId provided on the report.
 *
 * Endpoint: POST /api/audits
 */
export async function saveAudit(audit: AuditReport): Promise<AuditReport> {
  if (!audit.auditId) {
    throw new DatabaseApiError('Cannot save audit without a valid auditId', 400, '/audits');
  }

  const res = await apiRequest<{ audit?: AuditReport } | AuditReport>('/audits', {
    method: 'POST',
    body: JSON.stringify(audit)
  });

  return (res as any)?.audit ?? (res as AuditReport);
}

/**
 * Retrieve summaries of all saved audit reports, newest first.
 *
 * Endpoint: GET /api/audits
 */
export async function getSavedAudits(): Promise<AuditReportSummary[]> {
  const res = await apiRequest<{ audits?: AuditReportSummary[] } | AuditReportSummary[]>('/audits', {
    method: 'GET'
  });

  if (Array.isArray(res)) {
    return res;
  }
  return (res as any)?.audits ?? [];
}

/**
 * Retrieve a single audit report by its unique ID.
 *
 * Endpoint: GET /api/audits/:auditId
 */
export async function getAuditById(auditId: string): Promise<AuditReport> {
  if (!auditId) {
    throw new DatabaseApiError('Audit ID is required', 400, '/audits/:auditId');
  }

  const res = await apiRequest<{ audit?: AuditReport } | AuditReport>(`/audits/${encodeURIComponent(auditId)}`, {
    method: 'GET'
  });

  return (res as any)?.audit ?? (res as AuditReport);
}

// ============================================================
// CORRECTION RECORDS API
// ============================================================

/**
 * Create a new correction record in the database.
 *
 * Endpoint: POST /api/corrections
 */
export async function createCorrectionRecord(record: CorrectionRecord): Promise<CorrectionRecord> {
  if (!record.id) {
    throw new DatabaseApiError('Correction record must have a valid id', 400, '/corrections');
  }

  const res = await apiRequest<{ record?: CorrectionRecord } | CorrectionRecord>('/corrections', {
    method: 'POST',
    body: JSON.stringify(record)
  });

  return (res as any)?.record ?? (res as CorrectionRecord);
}

/**
 * Retrieve all correction records from the database.
 *
 * Endpoint: GET /api/corrections
 */
export async function getCorrectionRecords(): Promise<CorrectionRecord[]> {
  const res = await apiRequest<{ records?: CorrectionRecord[] } | CorrectionRecord[]>('/corrections', {
    method: 'GET'
  });

  if (Array.isArray(res)) {
    return res;
  }
  return (res as any)?.records ?? [];
}

/**
 * Retrieve a specific correction record by ID.
 *
 * Endpoint: GET /api/corrections/:id
 */
export async function getCorrectionRecordById(id: string): Promise<CorrectionRecord> {
  if (!id) {
    throw new DatabaseApiError('Record ID is required', 400, '/corrections/:id');
  }

  const res = await apiRequest<{ record?: CorrectionRecord } | CorrectionRecord>(`/corrections/${encodeURIComponent(id)}`, {
    method: 'GET'
  });

  return (res as any)?.record ?? (res as CorrectionRecord);
}

/**
 * Update an existing correction record in the database.
 *
 * Endpoint: PUT /api/corrections/:id
 */
export async function updateCorrectionRecord(
  id: string,
  updates: Partial<CorrectionRecord>
): Promise<CorrectionRecord> {
  if (!id) {
    throw new DatabaseApiError('Record ID is required for update', 400, '/corrections/:id');
  }

  const res = await apiRequest<{ record?: CorrectionRecord } | CorrectionRecord>(`/corrections/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  });

  return (res as any)?.record ?? (res as CorrectionRecord);
}

// ============================================================
// CORRECTION HISTORY API
// ============================================================

/**
 * Add a new history entry for a specific correction record.
 *
 * Endpoint: POST /api/corrections/:id/history
 */
export async function addRecordHistoryEntry(
  recordId: string,
  entry: Omit<HistoryEntry, 'id' | 'timestamp'> | HistoryEntry
): Promise<HistoryEntry> {
  if (!recordId) {
    throw new DatabaseApiError('Record ID is required to append history', 400, '/corrections/:id/history');
  }

  const res = await apiRequest<{ entry?: HistoryEntry } | HistoryEntry>(`/corrections/${encodeURIComponent(recordId)}/history`, {
    method: 'POST',
    body: JSON.stringify(entry)
  });

  return (res as any)?.entry ?? (res as HistoryEntry);
}

/**
 * Retrieve history entries associated with a single correction record.
 *
 * Endpoint: GET /api/corrections/:id/history
 */
export async function getRecordHistory(recordId: string): Promise<HistoryEntry[]> {
  if (!recordId) {
    throw new DatabaseApiError('Record ID is required to retrieve history', 400, '/corrections/:id/history');
  }

  const res = await apiRequest<{ history?: HistoryEntry[] } | HistoryEntry[]>(`/corrections/${encodeURIComponent(recordId)}/history`, {
    method: 'GET'
  });

  if (Array.isArray(res)) {
    return res;
  }
  return (res as any)?.history ?? [];
}

/**
 * Retrieve history entries across all correction records.
 *
 * Endpoint: GET /api/correction-history
 */
export async function getAllCorrectionHistory(): Promise<HistoryEntry[]> {
  const res = await apiRequest<{ history?: HistoryEntry[] } | HistoryEntry[]>('/correction-history', {
    method: 'GET'
  });

  if (Array.isArray(res)) {
    return res;
  }
  return (res as any)?.history ?? [];
}
