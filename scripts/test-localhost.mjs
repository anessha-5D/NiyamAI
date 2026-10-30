/**
 * NiyamAI Localhost API Test Suite
 *
 * Usage:
 *   node scripts/test-localhost.mjs [optional-port-or-url]
 *
 * Default target: http://localhost:5001
 */

const BASE_URL = process.argv[2] || process.env.API_BASE_URL || 'http://localhost:5001';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

function pass(name, details = '') {
  console.log(`  ${colors.green}✔ PASS${colors.reset} ${colors.bright}${name}${colors.reset} ${colors.gray}${details}${colors.reset}`);
}

function fail(name, error) {
  console.log(`  ${colors.red}✖ FAIL${colors.reset} ${colors.bright}${name}${colors.reset}`);
  console.log(`         ${colors.red}${error}${colors.reset}`);
}

function section(title) {
  console.log(`\n${colors.cyan}${colors.bright}=== ${title} ===${colors.reset}`);
}

async function fetchJson(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const start = Date.now();
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const duration = Date.now() - start;
  let body = null;
  const text = await res.text();
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: res.status, ok: res.ok, body, duration };
}

async function runTests() {
  console.log(`\n${colors.bright}🚀 Starting NiyamAI Localhost API Tests on: ${colors.cyan}${BASE_URL}${colors.reset}`);

  // Connectivity check
  try {
    await fetch(`${BASE_URL}/api/health`, { signal: AbortSignal.timeout(3000) });
  } catch (err) {
    console.log(`\n${colors.red}${colors.bright}❌ Cannot connect to ${BASE_URL}${colors.reset}`);
    console.log(`${colors.yellow}Tip: Make sure the server is running in another terminal:${colors.reset}`);
    console.log(`     ${colors.bright}npm run server${colors.reset}   (or: npm --prefix backend run dev)\n`);
    process.exit(1);
  }

  let total = 0;
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    total++;
    try {
      await fn();
      passed++;
    } catch (err) {
      failed++;
      fail(name, err.message || err);
    }
  }

  // -------------------------------------------------------------
  // 1. Core Health & Configuration
  // -------------------------------------------------------------
  section('1. Server Health & Rules Configuration');

  await test('GET /api/health', async () => {
    const res = await fetchJson('/api/health');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (res.body?.status !== 'healthy') throw new Error(`Status not healthy: ${JSON.stringify(res.body)}`);
    pass('GET /api/health', `(${res.duration}ms) engineMode: ${res.body.engineMode}`);
  });

  await test('GET /api/config/rules', async () => {
    const res = await fetchJson('/api/config/rules');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (res.body?.brand?.name !== 'NovaTech') throw new Error(`Brand mismatch: ${res.body?.brand?.name}`);
    pass('GET /api/config/rules', `(${res.duration}ms) Prohibited terms: ${res.body.prohibitedTerms?.length}, Facts: ${res.body.approvedFacts?.length}`);
  });

  await test('POST /api/config/reload', async () => {
    const res = await fetchJson('/api/config/reload', { method: 'POST' });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    pass('POST /api/config/reload', `(${res.duration}ms) ${res.body.message}`);
  });

  // -------------------------------------------------------------
  // 2. Audit Engine Endpoints
  // -------------------------------------------------------------
  section('2. Audit Engine & Remediation');

  let generatedAuditId = null;
  let auditReportToSave = null;

  await test('POST /api/audit (Clean content -> Grade A)', async () => {
    const res = await fetchJson('/api/audit', {
      method: 'POST',
      body: JSON.stringify({
        text: 'NovaTech is an intelligent workflow orchestration platform designed for modern enterprise teams. We deliver 99.9% uptime SLA backed by service credits and are ISO 27001 certified. Explore our plans with a 14-day free trial.',
        channel: 'blogs'
      })
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (res.body.score.overallScore < 90) throw new Error(`Expected Grade A, got score ${res.body.score.overallScore}`);
    pass('POST /api/audit [Clean]', `(${res.duration}ms) Score: ${res.body.score.overallScore}/100 (Grade ${res.body.score.grade}), Findings: ${res.body.findings.length}`);
  });

  await test('POST /api/audit (Multi-violation draft -> Grade F)', async () => {
    const res = await fetchJson('/api/audit', {
      method: 'POST',
      body: JSON.stringify({
        text: 'Our brand is good and modern. Use any colors and fonts you like. Our tone can be formal or casual depending on the situation. We provide the best services and are number one in the market. Use different logos whenever needed. There are no strict rules for wording or design. Our target audience is everyone.',
        channel: 'blogs'
      })
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (res.body.score.overallScore > 35) throw new Error(`Expected Grade F, got score ${res.body.score.overallScore}`);
    generatedAuditId = res.body.auditId;
    auditReportToSave = res.body;
    pass('POST /api/audit [Vague/Contradictory]', `(${res.duration}ms) Score: ${res.body.score.overallScore}/100 (Grade ${res.body.score.grade}), Findings: ${res.body.findings.length}`);
  });

  await test('POST /api/audit (Uploaded PDF Guidelines integration)', async () => {
    const res = await fetchJson('/api/audit', {
      method: 'POST',
      body: JSON.stringify({
        text: 'Our solution will crush the competition with guaranteed 100% uptime.',
        channel: 'ads',
        uploadedDoc: {
          id: 'test-pdf-doc',
          fileName: 'Acme_Brand_Manual_2026.pdf',
          guidelines: [
            {
              id: 'PDF-PC-05',
              category: 'prohibited_claims',
              title: 'Prohibited phrase: crush the competition',
              ruleText: "Prohibited phrase: 'crush the competition'. Combative framing violates our positioning.",
              severity: 'Strict',
              pageNumber: 2,
              prohibitedTerms: ['crush the competition'],
              suggestedReplacement: "accelerate your team's productivity"
            }
          ]
        }
      })
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!res.body.uploadedPdfDoc || res.body.uploadedPdfDoc.fileName !== 'Acme_Brand_Manual_2026.pdf') {
      throw new Error(`Expected uploadedPdfDoc in response`);
    }
    const pdfFinding = res.body.findings.find(f => f.source === 'pdf_guideline');
    if (!pdfFinding) throw new Error(`Expected pdf_guideline finding`);
    pass('POST /api/audit [PDF Integration]', `(${res.duration}ms) Detected PDF rule: ${pdfFinding.ruleId} (p. ${pdfFinding.pageNumber})`);
  });

  await test('POST /api/audit (Validation error on empty text)', async () => {
    const res = await fetchJson('/api/audit', {
      method: 'POST',
      body: JSON.stringify({ text: '', channel: 'blogs' })
    });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    pass('POST /api/audit [Empty Text -> 400]', `(${res.duration}ms) Correctly rejected`);
  });

  await test('POST /api/correction/apply-single', async () => {
    const res = await fetchJson('/api/correction/apply-single', {
      method: 'POST',
      body: JSON.stringify({
        text: 'NovaTech is cheap.',
        finding: {
          id: 'find-1',
          matchedText: 'cheap',
          startIndex: 12,
          endIndex: 17,
          recommendedCorrection: 'cost-effective'
        }
      })
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (res.body.updatedText !== 'NovaTech is cost-effective.') {
      throw new Error(`Unexpected replacement: ${res.body.updatedText}`);
    }
    pass('POST /api/correction/apply-single', `(${res.duration}ms) Result: "${res.body.updatedText}"`);
  });

  await test('POST /api/correction/apply-all', async () => {
    const res = await fetchJson('/api/correction/apply-all', {
      method: 'POST',
      body: JSON.stringify({
        text: 'We are cheap and promise 100% bug-free software.',
        findings: [
          {
            id: 'f1',
            matchedText: 'cheap',
            startIndex: 7,
            endIndex: 12,
            recommendedCorrection: 'cost-effective'
          },
          {
            id: 'f2',
            matchedText: '100% bug-free',
            startIndex: 25,
            endIndex: 38,
            recommendedCorrection: 'rigorously tested'
          }
        ]
      })
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    pass('POST /api/correction/apply-all', `(${res.duration}ms) Result: "${res.body.updatedText}"`);
  });

  // -------------------------------------------------------------
  // 3. Database Persistence (Audits, Corrections, History)
  // -------------------------------------------------------------
  section('3. Database Persistence (Audits & Corrections)');

  let createdCorrectionId = null;

  await test('POST /api/audits (Save audit report)', async () => {
    if (!auditReportToSave) throw new Error('No audit report from previous test');
    const res = await fetchJson('/api/audits', {
      method: 'POST',
      body: JSON.stringify(auditReportToSave)
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status} (${JSON.stringify(res.body)})`);
    pass('POST /api/audits', `(${res.duration}ms) Saved auditId: ${res.body.audit?.auditId}`);
  });

  await test('GET /api/audits (List audit summaries)', async () => {
    const res = await fetchJson('/api/audits');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!Array.isArray(res.body.audits)) throw new Error('Expected audits array in envelope');
    pass('GET /api/audits', `(${res.duration}ms) Retrieved ${res.body.audits.length} saved audits`);
  });

  await test(`GET /api/audits/:auditId`, async () => {
    if (!generatedAuditId) throw new Error('No auditId available');
    const res = await fetchJson(`/api/audits/${generatedAuditId}`);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!res.body.audit) throw new Error('Expected { audit: ... } envelope');
    pass(`GET /api/audits/${generatedAuditId}`, `(${res.duration}ms) Fetched full report successfully`);
  });

  await test('POST /api/corrections (Create record)', async () => {
    const newRecord = {
      contentTitle: 'Localhost Test Campaign',
      contentType: 'ad-copy',
      originalContent: 'Our product is cheap and 100% bug-free.',
      detectedIssue: 'Prohibited term "cheap"',
      issueExplanation: 'Degrades brand perceived value.',
      severity: 'high',
      workingContent: 'Our product is cost-effective and 100% bug-free.',
      status: 'draft',
      aiSuggestion: {
        suggestedText: 'Our product is cost-effective.',
        explanation: 'Replaces cheap with enterprise phrasing.',
        confidence: 0.95,
        generatedBy: 'member2-audit'
      }
    };
    const res = await fetchJson('/api/corrections', {
      method: 'POST',
      body: JSON.stringify(newRecord)
    });
    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status} (${JSON.stringify(res.body)})`);
    if (!res.body.record?.id) throw new Error('No record ID returned');
    createdCorrectionId = res.body.record.id;
    pass('POST /api/corrections', `(${res.duration}ms) Created correction ID: ${createdCorrectionId}`);
  });

  await test('GET /api/corrections (List all records)', async () => {
    const res = await fetchJson('/api/corrections');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!Array.isArray(res.body.records)) throw new Error('Expected records array');
    pass('GET /api/corrections', `(${res.duration}ms) Found ${res.body.records.length} correction records`);
  });

  await test('GET /api/corrections/:id (Retrieve single record)', async () => {
    if (!createdCorrectionId) throw new Error('No correction ID available');
    const res = await fetchJson(`/api/corrections/${createdCorrectionId}`);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (res.body.record?.id !== createdCorrectionId) throw new Error('ID mismatch');
    pass(`GET /api/corrections/${createdCorrectionId}`, `(${res.duration}ms) Status: ${res.body.record.status}`);
  });

  await test('PUT /api/corrections/:id (Update record status)', async () => {
    if (!createdCorrectionId) throw new Error('No correction ID available');
    const res = await fetchJson(`/api/corrections/${createdCorrectionId}`, {
      method: 'PUT',
      body: JSON.stringify({
        status: 'approved',
        approvalComment: 'Approved via localhost automated test'
      })
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (res.body.record?.status !== 'approved') throw new Error(`Status not updated: ${res.body.record?.status}`);
    pass(`PUT /api/corrections/${createdCorrectionId}`, `(${res.duration}ms) Updated status to "${res.body.record.status}"`);
  });

  await test('POST /api/corrections/:id/history (Append history entry)', async () => {
    if (!createdCorrectionId) throw new Error('No correction ID available');
    const res = await fetchJson(`/api/corrections/${createdCorrectionId}/history`, {
      method: 'POST',
      body: JSON.stringify({
        contentTitle: 'Localhost Test Campaign',
        originalContent: 'Our product is cheap and 100% bug-free.',
        suggestedContent: 'Our product is cost-effective.',
        finalContent: 'Our product is cost-effective and rigorously tested.',
        method: 'accepted',
        status: 'approved',
        note: 'Applied and approved in localhost verification'
      })
    });
    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}`);
    pass(`POST /api/corrections/${createdCorrectionId}/history`, `(${res.duration}ms) Appended history entry`);
  });

  await test('GET /api/corrections/:id/history', async () => {
    if (!createdCorrectionId) throw new Error('No correction ID available');
    const res = await fetchJson(`/api/corrections/${createdCorrectionId}/history`);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!Array.isArray(res.body.history) || res.body.history.length === 0) throw new Error('No history found');
    pass(`GET /api/corrections/${createdCorrectionId}/history`, `(${res.duration}ms) Found ${res.body.history.length} history item(s)`);
  });

  await test('GET /api/correction-history (All history entries)', async () => {
    const res = await fetchJson('/api/correction-history');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!Array.isArray(res.body.history)) throw new Error('Expected history array');
    pass('GET /api/correction-history', `(${res.duration}ms) Total history items: ${res.body.history.length}`);
  });

  // Summary
  console.log(`\n${colors.bright}========================================${colors.reset}`);
  if (failed === 0) {
    console.log(`${colors.green}${colors.bright}🎉 ALL ${passed}/${total} API TESTS PASSED!${colors.reset}`);
  } else {
    console.log(`${colors.red}${colors.bright}❌ ${failed}/${total} TESTS FAILED (${passed} passed)${colors.reset}`);
  }
  console.log(`${colors.bright}========================================${colors.reset}\n`);
}

runTests().catch(err => {
  console.error('\nFatal test runner error:', err);
  process.exit(1);
});
