import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export const AuditRequestSchema = z.object({
  text: z
    .string({ required_error: 'Text to audit is required.' })
    .min(1, 'Text cannot be empty.')
    .max(50000, 'Text exceeds maximum character limit of 50,000 characters.'),
  channel: z
    .enum(['ads', 'social', 'emails', 'blogs', 'product_specs'], {
      invalid_type_error: 'Channel must be one of: ads, social, emails, blogs, product_specs.'
    })
    .default('blogs')
});

export const SingleCorrectionSchema = z.object({
  text: z.string(),
  finding: z.object({
    id: z.string(),
    matchedText: z.string(),
    startIndex: z.number(),
    endIndex: z.number(),
    recommendedCorrection: z.string()
  })
});

export function validateAuditRequest(req: Request, res: Response, next: NextFunction) {
  const result = AuditRequestSchema.safeParse(req.body);
  if (!result.success) {
    const errorDetails = result.error.errors.map(e => e.message).join('; ');
    return res.status(400).json({
      error: 'Invalid audit request',
      details: errorDetails
    });
  }
  req.body = result.data;
  next();
}
