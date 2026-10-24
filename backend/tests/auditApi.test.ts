import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/server.js';

describe('Audit API Endpoints', () => {
  it('GET /api/health returns healthy status and engine information', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.module).toBe('NiyamAI-Text_Audit');
    expect(res.body).toHaveProperty('engineMode');
    expect(res.body).toHaveProperty('geminiConfigured');
  });

  it('GET /api/config/rules returns active brand profile and rules', async () => {
    const res = await request(app).get('/api/config/rules');
    expect(res.status).toBe(200);
    expect(res.body.brand.name).toBe('NovaTech');
    expect(Array.isArray(res.body.prohibitedTerms)).toBe(true);
    expect(Array.isArray(res.body.approvedFacts)).toBe(true);
  });

  it('POST /api/audit validates input and rejects empty text', async () => {
    const res = await request(app)
      .post('/api/audit')
      .send({ text: '', channel: 'blogs' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(res.body.details).toContain('Text cannot be empty');
  });

  it('POST /api/audit performs deterministic audit when Gemini API key is absent', async () => {
    const res = await request(app)
      .post('/api/audit')
      .send({
        text: 'NovaTech offers a cheap tool with guaranteed 100% uptime.',
        channel: 'ads'
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('auditId');
    expect(res.body).toHaveProperty('score');
    expect(res.body.score).toHaveProperty('overallScore');
    expect(res.body.findings.length).toBeGreaterThanOrEqual(2);
    expect(res.body.findings.some((f: any) => f.matchedText.toLowerCase().includes('cheap'))).toBe(true);
    expect(res.body).toHaveProperty('correctedText');
    expect(res.body.correctedText).not.toContain('cheap');
  });

  it('POST /api/correction/apply-single updates target finding text', async () => {
    const res = await request(app)
      .post('/api/correction/apply-single')
      .send({
        text: 'We are cheap today.',
        finding: {
          id: 'f-1',
          matchedText: 'cheap',
          startIndex: 7,
          endIndex: 12,
          recommendedCorrection: 'cost-effective'
        }
      });

    expect(res.status).toBe(200);
    expect(res.body.updatedText).toBe('We are cost-effective today.');
  });
});
