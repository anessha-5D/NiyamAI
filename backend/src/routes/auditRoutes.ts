import { Router, Request, Response } from 'express';
import { loadBrandConfig, reloadBrandConfig } from '../config/brandProfile.js';
import { SingleCorrectionSchema, validateAuditRequest } from '../middleware/validator.js';
import { AuditOrchestrator } from '../services/auditOrchestrator.js';
import { CorrectionService } from '../services/correctionService.js';
import { GeminiAuditService } from '../services/geminiService.js';

export const auditRouter = Router();

const orchestrator = new AuditOrchestrator();
const correctionService = new CorrectionService();
const geminiService = new GeminiAuditService();

/**
 * POST /api/audit
 * Primary audit endpoint accepting content draft and channel.
 */
auditRouter.post('/audit', validateAuditRequest, async (req: Request, res: Response) => {
  try {
    const { text, channel } = req.body;
    const report = await orchestrator.runAudit(text, channel);
    return res.status(200).json(report);
  } catch (err: any) {
    console.error('Unhandled error in /api/audit:', err);
    return res.status(500).json({
      error: 'Internal audit engine error',
      message: 'Failed to complete content audit. Please try again or check server logs.'
    });
  }
});

/**
 * GET /api/config/rules
 * Returns the active editable NovaTech brand profile, approved facts,
 * prohibited vocabulary, and claim guidelines.
 */
auditRouter.get('/config/rules', (req: Request, res: Response) => {
  try {
    const config = loadBrandConfig();
    return res.status(200).json(config);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve brand configuration' });
  }
});

/**
 * POST /api/config/reload
 * Reloads brand configuration from disk without server restart.
 */
auditRouter.post('/config/reload', (req: Request, res: Response) => {
  try {
    const reloaded = reloadBrandConfig();
    return res.status(200).json({ message: 'Configuration reloaded successfully', config: reloaded });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to reload configuration' });
  }
});

/**
 * POST /api/correction/apply-single
 * Test or apply a single finding's correction to a text snippet.
 */
auditRouter.post('/correction/apply-single', (req: Request, res: Response) => {
  const parsed = SingleCorrectionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid correction payload', details: parsed.error.format() });
  }

  const { text, finding } = parsed.data;
  const updatedText = correctionService.applySingleCorrection(text, finding as any);
  return res.status(200).json({ updatedText });
});

/**
 * GET /api/health
 * Health check & engine status.
 */
auditRouter.get('/health', (req: Request, res: Response) => {
  const isGeminiAvailable = geminiService.isConfigured();
  return res.status(200).json({
    status: 'healthy',
    module: 'NiyamAI-Text_Audit',
    timestamp: new Date().toISOString(),
    engineMode: isGeminiAvailable ? 'hybrid (Gemini + Rules)' : 'deterministic-only (Rules only)',
    geminiConfigured: isGeminiAvailable,
    version: '1.0.0'
  });
});
