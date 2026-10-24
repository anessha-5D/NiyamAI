/**
 * NiyamAI — Brand Data Service (Member 1)
 * 
 * Central data store and persistence service for NovaTech Brand Knowledge,
 * Guidelines, Approved Facts, Terminology, and Brand Design Tokens.
 * Fully compatible with Member 1's JSX components and LocalStorage persistence.
 */

export interface BrandPillarItem {
  id: string;
  tag: string;
  title: string;
  description: string;
  colorClass: string;
}

export interface CompanyProfileData {
  name: string;
  description: string;
  brandTone: string;
  targetAudience: string;
  mission: string;
  tagline: string;
  pillars?: BrandPillarItem[];
}

export interface BrandGuidelineItem {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  status: string;
  source: string;
}

export interface ApprovedFactItem {
  id: string;
  fact: string;
  details: string;
  source: string;
  status: string;
  approvalStatus?: string;
  expiryDate: string;
  category: string;
  isExpired?: boolean;
}

export interface TerminologyItem {
  id: string;
  term: string;
  type: 'preferred' | 'prohibited';
  replacementTerm: string;
  reason: string;
  status: string;
  category: string;
  severity?: string;
}

export interface TerminologyStore {
  all: TerminologyItem[];
  preferred: TerminologyItem[];
  prohibited: TerminologyItem[];
}

export interface BrandColorItem {
  id: string;
  name: string;
  hex: string;
  role: string;
  description: string;
  status: string;
  approvalStatus?: string;
  usage?: string;
}

export interface BrandTypographyItem {
  id: string;
  role: string;
  name: string;
  family: string;
  weights: string;
  specimen: string;
}

export interface BrandLogoItem {
  id: string;
  name: string;
  format: string;
  usage: string;
  url?: string;
}

export interface BrandAssetsData {
  colors: BrandColorItem[];
  typography: BrandTypographyItem[];
  logos: BrandLogoItem[];
}

export interface ServiceResult<T = any> {
  success: boolean;
  error?: string;
  data?: T;
}

// ----------------- Default Seed Data -----------------

const DEFAULT_PROFILE: CompanyProfileData = {
  name: "NovaTech",
  description: "Software company helping teams manage workflows effectively and securely.",
  brandTone: "Professional, friendly, empowering",
  targetAudience: "Enterprise teams, operations managers, and collaborative businesses",
  mission: "Help teams manage their workflows more effectively with intelligent, reliable tools.",
  tagline: "Intelligent workflow orchestration for modern teams",
  pillars: [
    {
      id: "PIL-01",
      tag: "AUTOMATION",
      title: "Workflow Orchestration",
      description: "Automating multi-stage work pipelines with intelligent engineering rigor rather than gimmicky superlatives.",
      colorClass: "bg-pastel-sage/70"
    },
    {
      id: "PIL-02",
      tag: "SECURITY & SLA",
      title: "99.9% Verified SLA",
      description: "Enterprise reliability backed by certified ISO 27001 and SOC 2 Type II data security standards.",
      colorClass: "bg-pastel-butter/70"
    },
    {
      id: "PIL-03",
      tag: "INCLUSIVITY",
      title: "WCAG 2.1 AA Standards",
      description: "Accessible design tokens, calibrated color contrast, and descriptive metadata built for all users.",
      colorClass: "bg-pastel-periwinkle/70"
    },
    {
      id: "PIL-04",
      tag: "GOVERNANCE",
      title: "Traceable Compliance",
      description: "Cryptographically verifiable claims, intent-preserving corrections, and transparent audit trails.",
      colorClass: "bg-pastel-rose/70"
    }
  ]
};

const DEFAULT_GUIDELINES: BrandGuidelineItem[] = [
  {
    id: "GL-001",
    title: "Empirical Claim Verification",
    description: "Every performance metric or percentage improvement claim must be substantiated by internal benchmark data or certified audit reports before publication.",
    category: "Marketing",
    severity: "Strict",
    status: "Active",
    source: "NovaTech Legal & Compliance Council"
  },
  {
    id: "GL-002",
    title: "Tone & Voice Clarity",
    description: "Maintain an empowering, approachable yet authoritative tone. Avoid aggressive sales superlatives, jargon, or exaggerated promises.",
    category: "Content",
    severity: "Strict",
    status: "Active",
    source: "Global Brand Editorial Team"
  },
  {
    id: "GL-003",
    title: "SLA Uptime Attribution",
    description: "Reference our official 99.9% uptime SLA exclusively in connection with Enterprise tier offerings. Never state or imply 100% bug-free operation.",
    category: "Compliance",
    severity: "Strict",
    status: "Active",
    source: "Enterprise Customer Operations"
  },
  {
    id: "GL-004",
    title: "Accessible Visual Contrast",
    description: "All creative imagery, typography, and marketing assets must meet minimum WCAG 2.1 AA contrast ratios (4.5:1 for standard text, 3:1 for large display text).",
    category: "Product",
    severity: "Strict",
    status: "Active",
    source: "Accessibility & Design Standards Committee"
  },
  {
    id: "GL-005",
    title: "Evaluation Period Framing",
    description: "Standard product evaluation is strictly a 14-day free trial without credit card requirement. Do not advertise permanent free plans or 30-day trials.",
    category: "Marketing",
    severity: "Recommended",
    status: "Active",
    source: "Commercial Pricing Strategy"
  }
];

const DEFAULT_FACTS: ApprovedFactItem[] = [
  {
    id: "FACT-001",
    fact: "NovaTech was founded in 2021 by workflow automation specialists.",
    details: "Established in Delaware; headquartered with distributed engineering hub across North America and Europe.",
    source: "Corporate Legal Registry",
    status: "Approved",
    expiryDate: "2029-12-31",
    category: "Company Identity"
  },
  {
    id: "FACT-002",
    fact: "NovaTech is certified for ISO 27001 and SOC 2 Type II data security standards.",
    details: "Annual audits conducted by third-party certified auditors; renewed annually in Q2.",
    source: "InfoSec & Compliance Division",
    status: "Approved",
    expiryDate: "2027-06-30",
    category: "Security & Compliance"
  },
  {
    id: "FACT-003",
    fact: "NovaTech provides a guaranteed 99.9% uptime SLA exclusively on Enterprise tiers, backed by service credits.",
    details: "Applicable to Enterprise dedicated instances with multi-region failover infrastructure.",
    source: "Infrastructure Engineering SLA",
    status: "Approved",
    expiryDate: "2028-12-31",
    category: "Product Performance"
  },
  {
    id: "FACT-004",
    fact: "NovaTech offers a 14-day free trial on all plans with no credit card required.",
    details: "Includes complete access to collaboration features and workflow automations during evaluation.",
    source: "Commercial Growth Operations",
    status: "Approved",
    expiryDate: "2027-12-31",
    category: "Product Capability"
  },
  {
    id: "FACT-005",
    fact: "NovaTech is actively deployed across more than 10,000 teams and businesses worldwide.",
    details: "Verified telemetry tracking unique active tenant domains as of Q3 audit.",
    source: "Business Intelligence Audit",
    status: "Approved",
    expiryDate: "2027-09-30",
    category: "Scale & Adoption"
  },
  {
    id: "FACT-006",
    fact: "NovaTech natively integrates with Slack, Microsoft Teams, Jira, Asana, and GitHub.",
    details: "Supported through authenticated REST and Webhook bidirectional connectors.",
    source: "Platform Architecture Team",
    status: "Approved",
    expiryDate: "2028-01-31",
    category: "Integrations"
  },
  {
    id: "FACT-007",
    fact: "24/7 dedicated priority support is included exclusively on Enterprise plans.",
    details: "Standard plans receive business-hours support with 4-hour SLA response times.",
    source: "Global Support Operations",
    status: "Approved",
    expiryDate: "2028-05-31",
    category: "Customer Support"
  },
  {
    id: "FACT-008",
    fact: "All customer data is encrypted in transit with TLS 1.3 and at rest with AES-256.",
    details: "Zero plain-text database persistence; customer encryption keys managed in dedicated HSM.",
    source: "Data Protection Officer",
    status: "Approved",
    expiryDate: "2029-12-31",
    category: "Security & Compliance"
  }
];

const DEFAULT_TERMINOLOGY: TerminologyItem[] = [
  {
    id: "TRM-001",
    term: "cheap",
    type: "prohibited",
    replacementTerm: "cost-effective",
    reason: "NovaTech is positioned as an enterprise-grade solution. 'Cheap' degrades perceived brand value.",
    status: "Active",
    category: "Brand Positioning",
    severity: "High"
  },
  {
    id: "TRM-002",
    term: "100% bug-free",
    type: "prohibited",
    replacementTerm: "rigorously tested and stable",
    reason: "Absolutist claims create unfulfillable legal warranties and are technically unverifiable.",
    status: "Active",
    category: "Legal Liability",
    severity: "Critical"
  },
  {
    id: "TRM-003",
    term: "guaranteed 100% uptime",
    type: "prohibited",
    replacementTerm: "99.9% uptime SLA",
    reason: "Contradicts approved brand SLA: NovaTech Enterprise offers 99.9% uptime SLA, never 100%.",
    status: "Active",
    category: "Compliance Contradiction",
    severity: "Critical"
  },
  {
    id: "TRM-004",
    term: "miracle fix",
    type: "prohibited",
    replacementTerm: "comprehensive workflow solution",
    reason: "Hyperbolic and sensationalist claims undermine enterprise trust.",
    status: "Active",
    category: "Tone Sensationalism",
    severity: "High"
  },
  {
    id: "TRM-005",
    term: "revolutionary hack",
    type: "prohibited",
    replacementTerm: "proven optimization technique",
    reason: "'Hack' connotes unstable workarounds or security vulnerabilities.",
    status: "Active",
    category: "Tone Sensationalism",
    severity: "Medium"
  },
  {
    id: "TRM-006",
    term: "cost-effective",
    type: "preferred",
    replacementTerm: "",
    reason: "Conveys high enterprise return-on-investment without discount connotations.",
    status: "Active",
    category: "Value Proposition"
  },
  {
    id: "TRM-007",
    term: "intelligent automation",
    type: "preferred",
    replacementTerm: "",
    reason: "Emphasizes intelligent engineering rigor rather than gimmicky AI claims.",
    status: "Active",
    category: "Technology Description"
  },
  {
    id: "TRM-008",
    term: "workflow orchestration",
    type: "preferred",
    replacementTerm: "",
    reason: "Standard enterprise framing for multi-stage automated pipelines.",
    status: "Active",
    category: "Product Capability"
  },
  {
    id: "TRM-009",
    term: "enterprise-ready",
    type: "preferred",
    replacementTerm: "",
    reason: "Communicates enterprise governance without indefensible absolutes like 'bulletproof'.",
    status: "Active",
    category: "Security & Governance"
  }
];

const DEFAULT_COLORS: BrandColorItem[] = [
  {
    id: "CLR-001",
    name: "Imperial Wine",
    hex: "#4E1227",
    role: "Primary Brand / Hero",
    description: "Dominant brand tone conveying authority, depth, and enterprise luxury.",
    status: "Approved"
  },
  {
    id: "CLR-002",
    name: "Deep Plum",
    hex: "#330B18",
    role: "Primary Dark Surface",
    description: "Deep navigational header and contrast foundation.",
    status: "Approved"
  },
  {
    id: "CLR-003",
    name: "Cream Alabaster",
    hex: "#FAF7F2",
    role: "Base Background",
    description: "Warm, premium paper backdrop ensuring soft readability.",
    status: "Approved"
  },
  {
    id: "CLR-004",
    name: "Rose Blush",
    hex: "#F4C5D0",
    role: "Highlight Accent",
    description: "Subtle accent tone for badges, callouts, and hover states.",
    status: "Approved"
  },
  {
    id: "CLR-005",
    name: "Pastel Sage",
    hex: "#E3ECE2",
    role: "Success & Compliance Badge",
    description: "Gentle green indicating approved verification and verified metrics.",
    status: "Approved"
  },
  {
    id: "CLR-006",
    name: "Pastel Lavender",
    hex: "#ECE5F2",
    role: "Secondary Accent Pill",
    description: "Accent tint for AI-driven recommendations and secondary tags.",
    status: "Approved"
  }
];

const DEFAULT_TYPOGRAPHY: BrandTypographyItem[] = [
  {
    id: "TYPO-01",
    role: "Headings & Editorial Display",
    name: "Playfair Display",
    family: "Playfair Display, Georgia, serif",
    weights: "600 SemiBold, 700 Bold",
    specimen: "NiyamAI — Intelligent Brand Governance & Workflow Compliance"
  },
  {
    id: "TYPO-02",
    role: "Body Copy & UI Elements",
    name: "Plus Jakarta Sans / Inter",
    family: "Plus Jakarta Sans, Inter, system-ui, sans-serif",
    weights: "400 Regular, 500 Medium, 600 SemiBold",
    specimen: "Every detail matters. NovaTech provides dependable workflow orchestration for modern teams."
  },
  {
    id: "TYPO-03",
    role: "Code & Monospace Identifiers",
    name: "JetBrains Mono",
    family: "JetBrains Mono, monospace",
    weights: "500 Medium",
    specimen: "SHA256: 0x8f2d5a3c10b741e97d25e0c529948ef63402778a48bc63557e4922119bb9e410"
  }
];

const DEFAULT_LOGOS: BrandLogoItem[] = [
  {
    id: "LOGO-01",
    name: "NiyamAI Primary Monogram",
    format: "SVG Vector",
    usage: "Application navigation header, favicon, and official release seal"
  },
  {
    id: "LOGO-02",
    name: "NovaTech Enterprise Wordmark",
    format: "SVG / High-Resolution PNG",
    usage: "Client workspace header, investor reports, and enterprise SLA documentation"
  }
];

const DEFAULT_ASSETS: BrandAssetsData = {
  colors: DEFAULT_COLORS,
  typography: DEFAULT_TYPOGRAPHY,
  logos: DEFAULT_LOGOS
};

// ----------------- Storage Helpers -----------------

const STORAGE_KEYS = {
  PROFILE: 'niyamai_brand_profile',
  GUIDELINES: 'niyamai_brand_guidelines',
  FACTS: 'niyamai_brand_facts',
  TERMINOLOGY: 'niyamai_brand_terminology',
  ASSETS: 'niyamai_brand_assets'
};

function readStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return defaultValue;
  }
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    const parsed = JSON.parse(raw);
    return parsed !== null && parsed !== undefined ? parsed : defaultValue;
  } catch {
    return defaultValue;
  }
}

function writeStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

// ----------------- Company Profile API -----------------

export function getCompanyProfile(): CompanyProfileData {
  const profile = readStorage<CompanyProfileData>(STORAGE_KEYS.PROFILE, DEFAULT_PROFILE);
  if (!profile.pillars || profile.pillars.length === 0) {
    profile.pillars = DEFAULT_PROFILE.pillars;
  }
  return profile;
}

export function updateCompanyProfile(updated: Partial<CompanyProfileData>): CompanyProfileData {
  const current = getCompanyProfile();
  const next: CompanyProfileData = {
    ...current,
    ...updated,
    pillars: current.pillars || DEFAULT_PROFILE.pillars
  };
  writeStorage(STORAGE_KEYS.PROFILE, next);
  return next;
}

export function resetCompanyProfileToDefault(): CompanyProfileData {
  writeStorage(STORAGE_KEYS.PROFILE, DEFAULT_PROFILE);
  return DEFAULT_PROFILE;
}

// ----------------- Brand Guidelines API -----------------

export function getBrandGuidelines(): BrandGuidelineItem[] {
  return readStorage<BrandGuidelineItem[]>(STORAGE_KEYS.GUIDELINES, DEFAULT_GUIDELINES);
}

export function getGuidelineById(id: string): BrandGuidelineItem | undefined {
  return getBrandGuidelines().find(g => g.id === id);
}

export function generateUniqueGuidelineId(): string {
  const all = getBrandGuidelines();
  const maxNum = all.reduce((max, it) => {
    const match = it.id.match(/\d+/);
    return match ? Math.max(max, parseInt(match[0], 10)) : max;
  }, 0);
  return `GL-${String(maxNum + 1).padStart(3, '0')}`;
}

export function addGuideline(guideline: BrandGuidelineItem): ServiceResult<BrandGuidelineItem> {
  if (!guideline.title || !guideline.description) {
    return { success: false, error: 'Title and description are required.' };
  }
  const all = getBrandGuidelines();
  if (all.some(g => g.id.toLowerCase() === guideline.id.toLowerCase())) {
    return { success: false, error: `Guideline ID "${guideline.id}" already exists.` };
  }
  const next = [guideline, ...all];
  writeStorage(STORAGE_KEYS.GUIDELINES, next);
  return { success: true, data: guideline };
}

export function updateGuideline(id: string, updated: BrandGuidelineItem): ServiceResult<BrandGuidelineItem> {
  const all = getBrandGuidelines();
  const idx = all.findIndex(g => g.id === id);
  if (idx === -1) {
    return { success: false, error: `Guideline "${id}" not found.` };
  }
  all[idx] = { ...all[idx], ...updated };
  writeStorage(STORAGE_KEYS.GUIDELINES, all);
  return { success: true, data: all[idx] };
}

export function deleteGuideline(id: string): ServiceResult {
  const all = getBrandGuidelines();
  const next = all.filter(g => g.id !== id);
  writeStorage(STORAGE_KEYS.GUIDELINES, next);
  return { success: true };
}

export function resetGuidelinesToDefault(): BrandGuidelineItem[] {
  writeStorage(STORAGE_KEYS.GUIDELINES, DEFAULT_GUIDELINES);
  return DEFAULT_GUIDELINES;
}

// ----------------- Approved Facts API -----------------

export function isFactExpired(dateStr?: string): boolean {
  if (!dateStr) return false;
  try {
    const expiry = new Date(dateStr).getTime();
    return !isNaN(expiry) && expiry < Date.now();
  } catch {
    return false;
  }
}

export function getAllFacts(): ApprovedFactItem[] {
  const facts = readStorage<ApprovedFactItem[]>(STORAGE_KEYS.FACTS, DEFAULT_FACTS);
  return facts.map(f => ({
    ...f,
    isExpired: isFactExpired(f.expiryDate),
    approvalStatus: f.status || f.approvalStatus || 'Approved'
  }));
}

export function getApprovedFacts(): ApprovedFactItem[] {
  return getAllFacts().filter(f => (f.status === 'Approved' || f.approvalStatus === 'Approved') && !f.isExpired);
}

export function getFactById(id: string): ApprovedFactItem | undefined {
  return getAllFacts().find(f => f.id === id);
}

export function generateUniqueFactId(): string {
  const all = getAllFacts();
  const maxNum = all.reduce((max, it) => {
    const match = it.id.match(/\d+/);
    return match ? Math.max(max, parseInt(match[0], 10)) : max;
  }, 0);
  return `FACT-${String(maxNum + 1).padStart(3, '0')}`;
}

export function addFact(fact: ApprovedFactItem): ServiceResult<ApprovedFactItem> {
  if (!fact.fact || !fact.source) {
    return { success: false, error: 'Fact statement and source are required.' };
  }
  const all = getAllFacts();
  if (all.some(f => f.id.toLowerCase() === fact.id.toLowerCase())) {
    return { success: false, error: `Fact ID "${fact.id}" already exists.` };
  }
  const enriched: ApprovedFactItem = {
    ...fact,
    isExpired: isFactExpired(fact.expiryDate),
    approvalStatus: fact.status || 'Approved'
  };
  const next = [enriched, ...all];
  writeStorage(STORAGE_KEYS.FACTS, next);
  return { success: true, data: enriched };
}

export function updateFact(id: string, updated: ApprovedFactItem): ServiceResult<ApprovedFactItem> {
  const all = getAllFacts();
  const idx = all.findIndex(f => f.id === id);
  if (idx === -1) {
    return { success: false, error: `Fact "${id}" not found.` };
  }
  all[idx] = {
    ...all[idx],
    ...updated,
    isExpired: isFactExpired(updated.expiryDate || all[idx].expiryDate),
    approvalStatus: updated.status || all[idx].status
  };
  writeStorage(STORAGE_KEYS.FACTS, all);
  return { success: true, data: all[idx] };
}

export function deleteFact(id: string): ServiceResult {
  const all = getAllFacts();
  const next = all.filter(f => f.id !== id);
  writeStorage(STORAGE_KEYS.FACTS, next);
  return { success: true };
}

export function resetFactsToDefault(): ApprovedFactItem[] {
  writeStorage(STORAGE_KEYS.FACTS, DEFAULT_FACTS);
  return getAllFacts();
}

// ----------------- Terminology API (Returns { all, preferred, prohibited }) -----------------

export function getTerminology(): TerminologyStore {
  const list = readStorage<TerminologyItem[]>(STORAGE_KEYS.TERMINOLOGY, DEFAULT_TERMINOLOGY);
  return {
    all: list,
    preferred: list.filter(t => t.type === 'preferred'),
    prohibited: list.filter(t => t.type === 'prohibited')
  };
}

export function getPreferredTerms(): TerminologyItem[] {
  return getTerminology().preferred;
}

export function getProhibitedTerms(): TerminologyItem[] {
  return getTerminology().prohibited;
}

export function generateUniqueTerminologyId(): string {
  const all = getTerminology().all;
  const maxNum = all.reduce((max, it) => {
    const match = it.id.match(/\d+/);
    return match ? Math.max(max, parseInt(match[0], 10)) : max;
  }, 0);
  return `TRM-${String(maxNum + 1).padStart(3, '0')}`;
}

export function addTerminology(term: TerminologyItem): ServiceResult<TerminologyItem> {
  if (!term.term) {
    return { success: false, error: 'Term is required.' };
  }
  const store = getTerminology();
  if (store.all.some(t => t.id.toLowerCase() === term.id.toLowerCase())) {
    return { success: false, error: `Terminology ID "${term.id}" already exists.` };
  }
  const next = [term, ...store.all];
  writeStorage(STORAGE_KEYS.TERMINOLOGY, next);
  return { success: true, data: term };
}

export function updateTerminology(id: string, updated: TerminologyItem): ServiceResult<TerminologyItem> {
  const store = getTerminology();
  const idx = store.all.findIndex(t => t.id === id);
  if (idx === -1) {
    return { success: false, error: `Terminology "${id}" not found.` };
  }
  store.all[idx] = { ...store.all[idx], ...updated };
  writeStorage(STORAGE_KEYS.TERMINOLOGY, store.all);
  return { success: true, data: store.all[idx] };
}

export function deleteTerminology(id: string): ServiceResult {
  const store = getTerminology();
  const next = store.all.filter(t => t.id !== id);
  writeStorage(STORAGE_KEYS.TERMINOLOGY, next);
  return { success: true };
}

export function resetTerminologyToDefault(): TerminologyStore {
  writeStorage(STORAGE_KEYS.TERMINOLOGY, DEFAULT_TERMINOLOGY);
  return getTerminology();
}

export interface TerminologyViolation {
  term: string;
  type: string;
  replacement: string;
  reason: string;
  index: number;
}

export function checkTerminologyCompliance(text: string): {
  passes: boolean;
  violations: TerminologyViolation[];
  scannedCount: number;
} {
  if (!text || !text.trim()) {
    return { passes: true, violations: [], scannedCount: 0 };
  }

  const prohibited = getProhibitedTerms();
  const violations: TerminologyViolation[] = [];
  const lower = text.toLowerCase();

  for (const item of prohibited) {
    const termLower = item.term.toLowerCase();
    let searchStart = 0;
    while (searchStart < lower.length) {
      const idx = lower.indexOf(termLower, searchStart);
      if (idx === -1) break;

      // Word boundary check
      const before = idx === 0 ? ' ' : lower[idx - 1];
      const after = idx + termLower.length >= lower.length ? ' ' : lower[idx + termLower.length];
      const isWordBoundary = /[\s.,!?;:()"'`\-]/.test(before) && /[\s.,!?;:()"'`\-]/.test(after);

      if (isWordBoundary) {
        violations.push({
          term: text.substring(idx, idx + termLower.length),
          type: 'Prohibited Vocabulary',
          replacement: item.replacementTerm,
          reason: item.reason,
          index: idx
        });
      }
      searchStart = idx + termLower.length;
    }
  }

  return {
    passes: violations.length === 0,
    violations,
    scannedCount: prohibited.length
  };
}

// ----------------- Brand Assets & Colors API -----------------

export function getBrandAssets(): BrandAssetsData {
  const data = readStorage<BrandAssetsData>(STORAGE_KEYS.ASSETS, DEFAULT_ASSETS);
  return {
    colors: Array.isArray(data.colors) && data.colors.length > 0 ? data.colors : DEFAULT_COLORS,
    typography: Array.isArray(data.typography) && data.typography.length > 0 ? data.typography : DEFAULT_TYPOGRAPHY,
    logos: Array.isArray(data.logos) && data.logos.length > 0 ? data.logos : DEFAULT_LOGOS
  };
}

export function getBrandColors(): BrandColorItem[] {
  return getBrandAssets().colors;
}

export function generateUniqueColorId(): string {
  const colors = getBrandColors();
  const maxNum = colors.reduce((max, it) => {
    const match = it.id.match(/\d+/);
    return match ? Math.max(max, parseInt(match[0], 10)) : max;
  }, 0);
  return `CLR-${String(maxNum + 1).padStart(3, '0')}`;
}

export function validateAndNormalizeHex(hex: string): {
  isValid: boolean;
  normalizedHex: string;
  error?: string;
} {
  if (!hex || !hex.trim()) {
    return { isValid: false, normalizedHex: '', error: 'HEX color value is required.' };
  }
  let clean = hex.trim();
  if (!clean.startsWith('#')) {
    clean = '#' + clean;
  }
  const match = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(clean);
  if (!match) {
    return { isValid: false, normalizedHex: '', error: 'Must be a valid 3-digit or 6-digit HEX color code (e.g. #3D101E).' };
  }
  let code = match[1];
  if (code.length === 3) {
    code = code.split('').map(c => c + c).join('');
  }
  return {
    isValid: true,
    normalizedHex: `#${code.toUpperCase()}`
  };
}

export function addBrandColor(color: BrandColorItem): ServiceResult<BrandColorItem> {
  const hexCheck = validateAndNormalizeHex(color.hex);
  if (!hexCheck.isValid) {
    return { success: false, error: hexCheck.error };
  }
  const assets = getBrandAssets();
  if (assets.colors.some(c => c.id.toLowerCase() === color.id.toLowerCase())) {
    return { success: false, error: `Color ID "${color.id}" already exists.` };
  }
  const normalizedColor: BrandColorItem = {
    ...color,
    hex: hexCheck.normalizedHex,
    status: color.status || 'Approved'
  };
  assets.colors = [normalizedColor, ...assets.colors];
  writeStorage(STORAGE_KEYS.ASSETS, assets);
  return { success: true, data: normalizedColor };
}

export function updateBrandColor(id: string, updated: BrandColorItem): ServiceResult<BrandColorItem> {
  const hexCheck = validateAndNormalizeHex(updated.hex);
  if (!hexCheck.isValid) {
    return { success: false, error: hexCheck.error };
  }
  const assets = getBrandAssets();
  const idx = assets.colors.findIndex(c => c.id === id);
  if (idx === -1) {
    return { success: false, error: `Color "${id}" not found.` };
  }
  assets.colors[idx] = {
    ...assets.colors[idx],
    ...updated,
    hex: hexCheck.normalizedHex,
    status: updated.status || assets.colors[idx].status || 'Approved'
  };
  writeStorage(STORAGE_KEYS.ASSETS, assets);
  return { success: true, data: assets.colors[idx] };
}

export function deleteBrandColor(id: string): ServiceResult {
  const assets = getBrandAssets();
  assets.colors = assets.colors.filter(c => c.id !== id);
  writeStorage(STORAGE_KEYS.ASSETS, assets);
  return { success: true };
}

export function resetBrandColorsToDefault(): BrandAssetsData {
  const assets = getBrandAssets();
  assets.colors = DEFAULT_COLORS;
  writeStorage(STORAGE_KEYS.ASSETS, assets);
  return assets;
}

// ----------------- Global Export & Reset API -----------------

export function exportBrandKitJson(): string {
  const bundle = {
    exportedAt: new Date().toISOString(),
    profile: getCompanyProfile(),
    guidelines: getBrandGuidelines(),
    facts: getAllFacts(),
    terminology: getTerminology(),
    assets: getBrandAssets()
  };
  return JSON.stringify(bundle, null, 2);
}

export function resetToDefaults(): void {
  resetCompanyProfileToDefault();
  resetGuidelinesToDefault();
  resetFactsToDefault();
  resetTerminologyToDefault();
  resetBrandColorsToDefault();
}
