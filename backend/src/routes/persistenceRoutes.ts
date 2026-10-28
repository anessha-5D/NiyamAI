import { randomUUID } from 'node:crypto';
import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import { AuditReport } from '../types/audit.js';

export const persistenceRouter = Router();

/**
 * POST /api/audits
 * Save an audit report using its existing auditId.
 */
persistenceRouter.post('/audits', async (req: Request, res: Response) => {
  try {
    const report = req.body as AuditReport;

    if (
      !report ||
      typeof report.auditId !== 'string' ||
      !report.auditId.trim() ||
      typeof report.inputText !== 'string' ||
      typeof report.timestamp !== 'string'
    ) {
      return res.status(400).json({ error: 'Invalid audit report.' });
    }

    const { data, error } = await supabase
      .from('audits')
      .upsert({
        audit_id: report.auditId,
        timestamp: report.timestamp,
        input_text: report.inputText,
        channel: report.channel,
        brand: report.brand,
        engine_mode: report.engineMode,
        score: report.score,
        findings: report.findings,
        corrected_text: report.correctedText,
        passed_checks: report.passedChecks,
        summary: report.summary,
        execution_time_ms: report.executionTimeMs
      }, { onConflict: 'audit_id' })
      .select()
      .single();

    if (error) {
      console.error('Failed to save audit:', error.message);
      return res.status(500).json({ error: 'Failed to save audit.' });
    }

    return res.status(200).json({
      audit: {
        auditId: data.audit_id,
        timestamp: data.timestamp,
        inputText: data.input_text,
        channel: data.channel,
        brand: data.brand,
        engineMode: data.engine_mode,
        score: data.score,
        findings: data.findings,
        correctedText: data.corrected_text,
        passedChecks: data.passed_checks,
        summary: data.summary,
        executionTimeMs: data.execution_time_ms
      }
    });
  } catch (err) {
    console.error('Unexpected error while saving audit.');
    return res.status(500).json({ error: 'An unexpected error occurred.' });
  }
});

/**
 * GET /api/audits
 * Retrieve audit summaries, newest first.
 */
persistenceRouter.get('/audits', async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('audits')
      .select('audit_id, timestamp, channel, brand, engine_mode, score, summary, execution_time_ms')
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Failed to retrieve audit summaries:', error.message);
      return res.status(500).json({ error: 'Failed to retrieve audits.' });
    }

    const audits = (data ?? []).map((row) => ({
      auditId: row.audit_id,
      timestamp: row.timestamp,
      channel: row.channel,
      brand: row.brand,
      engineMode: row.engine_mode,
      score: row.score,
      summary: row.summary,
      executionTimeMs: row.execution_time_ms
    }));

    return res.status(200).json({ audits });
  } catch {
    console.error('Unexpected error while retrieving audit summaries.');
    return res.status(500).json({ error: 'An unexpected error occurred.' });
  }
});

/**
 * GET /api/audits/:auditId
 * Retrieve one saved audit.
 */
persistenceRouter.get('/audits/:auditId', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('audits')
      .select('*')
      .eq('audit_id', req.params.auditId)
      .maybeSingle();

    if (error) {
      console.error('Failed to retrieve audit:', error.message);
      return res.status(500).json({ error: 'Failed to retrieve audit.' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Audit not found.' });
    }

    return res.status(200).json({
      audit: {
        auditId: data.audit_id,
        timestamp: data.timestamp,
        inputText: data.input_text,
        channel: data.channel,
        brand: data.brand,
        engineMode: data.engine_mode,
        score: data.score,
        findings: data.findings,
        correctedText: data.corrected_text,
        passedChecks: data.passed_checks,
        summary: data.summary,
        executionTimeMs: data.execution_time_ms
      }
    });
  } catch {
    console.error('Unexpected error while retrieving audit.');
    return res.status(500).json({ error: 'An unexpected error occurred.' });
  }
});

/**
 * Convert a database correction record to the frontend's camelCase format.
 */
function formatCorrection(row: any) {
  return {
    id: row.id,
    auditId: row.audit_id ?? undefined,
    contentTitle: row.content_title,
    contentType: row.content_type,
    originalContent: row.original_content,
    detectedIssue: row.detected_issue,
    issueExplanation: row.issue_explanation,
    severity: row.severity,
    guidelineRef: row.guideline_ref ?? undefined,
    aiSuggestion: row.ai_suggestion,
    workingContent: row.working_content,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    approvalComment: row.approval_comment ?? undefined
  };
}

/**
 * POST /api/corrections
 * Create a correction record.
 */
persistenceRouter.post('/corrections', async (req: Request, res: Response) => {
  try {
    const body = req.body;

    const requiredStrings = [
      'contentTitle',
      'contentType',
      'originalContent',
      'detectedIssue',
      'issueExplanation',
      'severity',
      'workingContent',
      'status'
    ];

    if (
      !body ||
      typeof body !== 'object' ||
      requiredStrings.some(
        key => typeof body[key] !== 'string' || !body[key].trim()
      ) ||
      !body.aiSuggestion ||
      typeof body.aiSuggestion !== 'object' ||
      typeof body.aiSuggestion.suggestedText !== 'string' ||
      typeof body.aiSuggestion.explanation !== 'string' ||
      typeof body.aiSuggestion.confidence !== 'number' ||
      !['sample-data', 'member2-audit'].includes(body.aiSuggestion.generatedBy)
    ) {
      return res.status(400).json({ error: 'Invalid correction record.' });
    }

    if (
      !['social-media', 'email', 'ad-copy', 'website', 'print', 'press-release'].includes(body.contentType) ||
      !['critical', 'high', 'medium', 'low'].includes(body.severity) ||
      !['draft', 'correction-accepted', 'correction-rejected', 'manually-edited', 'pending-approval', 'approved', 'changes-requested'].includes(body.status)
    ) {
      return res.status(400).json({ error: 'Invalid correction record values.' });
    }

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('correction_records')
      .insert({
        id: randomUUID(),
        audit_id: body.auditId ?? null,
        content_title: body.contentTitle,
        content_type: body.contentType,
        original_content: body.originalContent,
        detected_issue: body.detectedIssue,
        issue_explanation: body.issueExplanation,
        severity: body.severity,
        guideline_ref: body.guidelineRef ?? null,
        ai_suggestion: body.aiSuggestion,
        working_content: body.workingContent,
        status: body.status,
        created_at: now,
        updated_at: now,
        approval_comment: body.approvalComment ?? null
      })
      .select('*')
      .single();

    if (error) {
      console.error('Failed to create correction record:', error.message);
      return res.status(500).json({ error: 'Failed to create correction record.' });
    }

    return res.status(201).json({ record: formatCorrection(data) });
  } catch {
    return res.status(500).json({ error: 'An unexpected error occurred.' });
  }
});

/**
 * GET /api/corrections
 * Retrieve all correction records, newest first.
 */
persistenceRouter.get('/corrections', async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('correction_records')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to retrieve correction records:', error.message);
      return res.status(500).json({ error: 'Failed to retrieve correction records.' });
    }

    return res.status(200).json({
      records: (data ?? []).map(formatCorrection)
    });
  } catch {
    return res.status(500).json({ error: 'An unexpected error occurred.' });
  }
});

/**
 * GET /api/corrections/:id
 * Retrieve one correction record.
 */
persistenceRouter.get('/corrections/:id', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('correction_records')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error) {
      console.error('Failed to retrieve correction record:', error.message);
      return res.status(500).json({ error: 'Failed to retrieve correction record.' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Correction record not found.' });
    }

    return res.status(200).json({ record: formatCorrection(data) });
  } catch {
    return res.status(500).json({ error: 'An unexpected error occurred.' });
  }
});

/**
 * PUT /api/corrections/:id
 * Update only the fields supplied in the request body.
 */
persistenceRouter.put('/corrections/:id', async (req: Request, res: Response) => {
  try {
    const body = req.body;

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return res.status(400).json({ error: 'Invalid update body.' });
    }

    const fieldMap: Record<string, string> = {
      contentTitle: 'content_title',
      contentType: 'content_type',
      originalContent: 'original_content',
      detectedIssue: 'detected_issue',
      issueExplanation: 'issue_explanation',
      severity: 'severity',
      guidelineRef: 'guideline_ref',
      aiSuggestion: 'ai_suggestion',
      workingContent: 'working_content',
      status: 'status',
      approvalComment: 'approval_comment'
    };

    const updates: Record<string, unknown> = {};

    for (const [apiField, dbField] of Object.entries(fieldMap)) {
      if (Object.prototype.hasOwnProperty.call(body, apiField)) {
        updates[dbField] = body[apiField];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields provided to update.' });
    }

    if (
      ('contentType' in body &&
        !['social-media', 'email', 'ad-copy', 'website', 'print', 'press-release'].includes(body.contentType)) ||
      ('severity' in body &&
        !['critical', 'high', 'medium', 'low'].includes(body.severity)) ||
      ('status' in body &&
        !['draft', 'correction-accepted', 'correction-rejected', 'manually-edited', 'pending-approval', 'approved', 'changes-requested'].includes(body.status))
    ) {
      return res.status(400).json({ error: 'Invalid correction record values.' });
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('correction_records')
      .update(updates)
      .eq('id', req.params.id)
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('Failed to update correction record:', error.message);
      return res.status(500).json({ error: 'Failed to update correction record.' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Correction record not found.' });
    }

    return res.status(200).json({ record: formatCorrection(data) });
  } catch {
    return res.status(500).json({ error: 'An unexpected error occurred.' });
  }
});

/**
 * Convert a database history entry to the frontend's camelCase format.
 */
function formatHistory(row: any) {
  return {
    id: row.id,
    recordId: row.record_id,
    contentTitle: row.content_title,
    originalContent: row.original_content,
    suggestedContent: row.suggested_content,
    finalContent: row.final_content,
    method: row.method,
    status: row.status,
    timestamp: row.timestamp,
    note: row.note ?? undefined
  };
}

/**
 * POST /api/corrections/:id/history
 * Add a history entry for an existing correction record.
 */
persistenceRouter.post(
  '/corrections/:id/history',
  async (req: Request, res: Response) => {
    try {
      const body = req.body;

      if (
        !body ||
        typeof body.contentTitle !== 'string' ||
        typeof body.originalContent !== 'string' ||
        typeof body.suggestedContent !== 'string' ||
        typeof body.finalContent !== 'string' ||
        !['accepted', 'rejected', 'manual', 'reverted', 'submitted', 'resubmitted'].includes(body.method) ||
        !['draft', 'correction-accepted', 'correction-rejected', 'manually-edited', 'pending-approval', 'approved', 'changes-requested'].includes(body.status)
      ) {
        return res.status(400).json({ error: 'Invalid history entry.' });
      }

      // Confirm that the correction record exists.
      const { data: record, error: recordError } = await supabase
        .from('correction_records')
        .select('id')
        .eq('id', req.params.id)
        .maybeSingle();

      if (recordError) {
        console.error('Failed to check correction record:', recordError.message);
        return res.status(500).json({ error: 'Failed to check correction record.' });
      }

      if (!record) {
        return res.status(404).json({ error: 'Correction record not found.' });
      }

      const { data, error } = await supabase
        .from('correction_history')
        .insert({
          id: randomUUID(),
          record_id: req.params.id,
          content_title: body.contentTitle,
          original_content: body.originalContent,
          suggested_content: body.suggestedContent,
          final_content: body.finalContent,
          method: body.method,
          status: body.status,
          timestamp: new Date().toISOString(),
          note: body.note ?? null
        })
        .select('*')
        .single();

      if (error) {
        console.error('Failed to save correction history:', error.message);
        return res.status(500).json({ error: 'Failed to save correction history.' });
      }

      return res.status(201).json({ entry: formatHistory(data) });
    } catch {
      return res.status(500).json({ error: 'An unexpected error occurred.' });
    }
  }
);

/**
 * GET /api/corrections/:id/history
 * Retrieve history entries for one correction record.
 */
persistenceRouter.get(
  '/corrections/:id/history',
  async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from('correction_history')
        .select('*')
        .eq('record_id', req.params.id)
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Failed to retrieve correction history:', error.message);
        return res.status(500).json({ error: 'Failed to retrieve correction history.' });
      }

      return res.status(200).json({
        history: (data ?? []).map(formatHistory)
      });
    } catch {
      return res.status(500).json({ error: 'An unexpected error occurred.' });
    }
  }
);

/**
 * GET /api/correction-history
 * Retrieve all correction history entries.
 */
persistenceRouter.get('/correction-history', async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('correction_history')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Failed to retrieve all correction history:', error.message);
      return res.status(500).json({ error: 'Failed to retrieve correction history.' });
    }

    return res.status(200).json({
      history: (data ?? []).map(formatHistory)
    });
  } catch {
    return res.status(500).json({ error: 'An unexpected error occurred.' });
  }
});

/**
 * DELETE /api/correction-history
 * Clear history entries only. Correction records and saved audits remain intact.
 */
persistenceRouter.delete('/correction-history', async (_req: Request, res: Response) => {
  try {
    const { error } = await supabase
      .from('correction_history')
      .delete()
      .not('id', 'is', null);

    if (error) {
      console.error('Failed to clear correction history:', error.message);
      return res.status(500).json({ error: 'Failed to clear correction history.' });
    }

    return res.status(200).json({ message: 'Correction history cleared.' });
  } catch {
    return res.status(500).json({ error: 'An unexpected error occurred.' });
  }
});
