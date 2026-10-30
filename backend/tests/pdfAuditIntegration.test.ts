import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/server.js';

describe('PDF Brand Guidelines Audit Integration', () => {
  const sampleUploadedDoc = {
    id: 'doc-test-123',
    fileName: 'Acme_Brand_Manual_2026.pdf',
    guidelines: [
      {
        id: 'PDF-PC-01',
        category: 'prohibited_claims',
        title: 'Prohibited term: cheap',
        ruleText: "Prohibited term: 'cheap'. Use 'cost-effective' instead.",
        severity: 'Strict',
        pageNumber: 2,
        prohibitedTerms: ['cheap'],
        suggestedReplacement: 'cost-effective'
      },
      {
        id: 'PDF-PC-05',
        category: 'prohibited_claims',
        title: 'Prohibited phrase: crush the competition',
        ruleText: "Prohibited phrase: 'crush the competition'. Combative framing violates our positioning.",
        severity: 'Strict',
        pageNumber: 2,
        prohibitedTerms: ['crush the competition'],
        suggestedReplacement: "accelerate your team's productivity"
      },
      {
        id: 'PDF-DC-01',
        category: 'required_disclaimers',
        title: 'Mandatory SLA Disclaimer',
        ruleText: "*Applies exclusively to Enterprise dedicated clusters backed by SLA service credits.",
        severity: 'Strict',
        pageNumber: 3
      }
    ]
  };

  it('POST /api/audit audits draft against uploaded PDF rules when provided', async () => {
    const res = await request(app)
      .post('/api/audit')
      .send({
        text: 'Our solution will crush the competition with guaranteed 100% uptime.',
        channel: 'ads',
        uploadedDoc: sampleUploadedDoc
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('findings');
    expect(res.body).toHaveProperty('uploadedPdfDoc');
    expect(res.body.uploadedPdfDoc.fileName).toBe('Acme_Brand_Manual_2026.pdf');

    // Should detect the PDF prohibited phrase
    const pdfFinding = res.body.findings.find(
      (f: any) => f.matchedText.toLowerCase().includes('crush the competition')
    );
    expect(pdfFinding).toBeDefined();
    expect(pdfFinding.source).toBe('pdf_guideline');
    expect(pdfFinding.explanation).toContain('Acme_Brand_Manual_2026.pdf');
    expect(pdfFinding.pageNumber).toBe(2);
  });

  it('POST /api/audit falls back to built-in behavior when uploadedDoc is omitted', async () => {
    const res = await request(app)
      .post('/api/audit')
      .send({
        text: 'NovaTech announces 99.9% uptime SLA.',
        channel: 'blogs'
      });

    expect(res.status).toBe(200);
    expect(res.body.brand.name).toBe('NovaTech');
    expect(res.body.uploadedPdfDoc).toBeUndefined();
  });
});
