/**
 * NiyamAI — Step 05: Publishing, Audit Trail & Governance Analytics
 * Core Application Engine & State Controller
 */

// Global Application State with LocalStorage Persistence
const appState = {
  activeTab: 'release-gate',
  currentFilter: 'all',
  currentCategory: 'all',
  searchQuery: '',
  selectedAsset: null,
  assets: [],
  ruleProposals: []
};

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', async () => {
  loadPersistedState();
  initUI();
  await ensureAuditHashes();
  renderAssets();
  renderFrictionRules();
  renderAmbiguousRules();
  renderProposalsList();
  setupEventListeners();

  // Initialize analytics charts
  if (typeof initAnalyticsCharts === 'function') {
    initAnalyticsCharts();
  }
});

/**
 * Load state from localStorage or initialize with benchmark demo data
 */
function loadPersistedState() {
  try {
    const savedAssets = localStorage.getItem('niyamai_assets_v1');
    if (savedAssets) {
      appState.assets = JSON.parse(savedAssets);
    } else {
      appState.assets = JSON.parse(JSON.stringify(NiyamMockData.assets));
      savePersistedState();
    }

    const savedProposals = localStorage.getItem('niyamai_proposals_v1');
    if (savedProposals) {
      appState.ruleProposals = JSON.parse(savedProposals);
    } else {
      appState.ruleProposals = [];
    }
  } catch (err) {
    console.warn('LocalStorage access issue, using in-memory state:', err);
    appState.assets = JSON.parse(JSON.stringify(NiyamMockData.assets));
  }
}

/**
 * Save current asset state to localStorage
 */
function savePersistedState() {
  try {
    localStorage.setItem('niyamai_assets_v1', JSON.stringify(appState.assets));
    localStorage.setItem('niyamai_proposals_v1', JSON.stringify(appState.ruleProposals));
  } catch (err) {
    console.warn('Failed to save to localStorage:', err);
  }
}

/**
 * Reset all demo data to initial state
 */
function resetAllDemoData() {
  if (confirm("Reset demonstration data to original benchmark state? Any published releases or simulated approvals will be reset.")) {
    localStorage.removeItem('niyamai_assets_v1');
    localStorage.removeItem('niyamai_proposals_v1');
    appState.assets = JSON.parse(JSON.stringify(NiyamMockData.assets));
    appState.ruleProposals = [];
    savePersistedState();
    initUI();
    renderAssets();
    renderFrictionRules();
    renderAmbiguousRules();
    renderProposalsList();
    if (typeof initAnalyticsCharts === 'function') {
      initAnalyticsCharts();
    }
    showToast("Demonstration data reset to initial benchmark state.", "info");
  }
}

/**
 * Ensure all audit trails have deterministic cryptographic hashes computed via Web Crypto
 */
async function ensureAuditHashes() {
  if (window.NiyamIntegrationAPI && window.NiyamIntegrationAPI.computeAuditChain) {
    for (let asset of appState.assets) {
      if (asset.auditTrail && asset.auditTrail.length > 0) {
        await window.NiyamIntegrationAPI.computeAuditChain(asset.auditTrail);
        if (asset.status === 'Published' && (!asset.governanceHash || asset.governanceHash.startsWith('0xrandom'))) {
          asset.governanceHash = asset.auditTrail[asset.auditTrail.length - 1].stepHash;
        }
      }
    }
    savePersistedState();
  }
}

/**
 * Update executive KPI strip dynamically based on current asset state
 */
function initUI() {
  const publishedAssets = appState.assets.filter(a => a.status === 'Published');
  const blockedAssets = appState.assets.filter(a => a.status.includes('Blocked'));
  const totalAssets = appState.assets.length;

  const passRate = totalAssets > 0 ? ((publishedAssets.length / totalAssets) * 100).toFixed(1) : 96.2;
  const brandHealthScore = NiyamMockData.kpis.brandHealthScore;

  const healthScoreEl = document.getElementById('kpiHealthScore');
  if (healthScoreEl) healthScoreEl.textContent = brandHealthScore + '%';

  const healthDeltaEl = document.getElementById('kpiHealthDelta');
  if (healthDeltaEl) healthDeltaEl.textContent = NiyamMockData.kpis.brandHealthDelta;

  const publishedCountEl = document.getElementById('kpiPublishedCount');
  if (publishedCountEl) publishedCountEl.textContent = (NiyamMockData.kpis.publishedAssetsCount + (publishedAssets.length - 2));

  const passRateEl = document.getElementById('kpiPassRate');
  if (passRateEl) passRateEl.textContent = passRate + '%';

  const violationsPreventedEl = document.getElementById('kpiViolationsPrevented');
  if (violationsPreventedEl) violationsPreventedEl.textContent = (NiyamMockData.kpis.violationsPrevented + blockedAssets.length);

  const velocityEl = document.getElementById('kpiVelocity');
  if (velocityEl) velocityEl.textContent = NiyamMockData.kpis.avgReleaseVelocity;
}

/**
 * Event Listeners for Tabs, Filters, Modals, Keyboard shortcuts
 */
function setupEventListeners() {
  // Tab Switching
  const tabBtns = document.querySelectorAll('.nav-tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      switchTab(targetTab);
    });
  });

  // Filter Buttons
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => {
        b.classList.remove('bg-plum-900', 'text-white', 'shadow-sm');
        b.classList.add('bg-white', 'text-stone-700');
      });
      btn.classList.add('bg-plum-900', 'text-white', 'shadow-sm');
      btn.classList.remove('bg-white', 'text-stone-700');
      appState.currentFilter = btn.getAttribute('data-filter');
      renderAssets();
    });
  });

  // Search input
  const searchInput = document.getElementById('assetSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      appState.searchQuery = e.target.value.toLowerCase().trim();
      renderAssets();
    });
  }

  // Category select
  const categorySelect = document.getElementById('assetCategorySelect');
  if (categorySelect) {
    categorySelect.addEventListener('change', (e) => {
      appState.currentCategory = e.target.value;
      renderAssets();
    });
  }

  // Close modals on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllModals();
    }
  });
}

function closeAllModals() {
  closeAuditDrawer();
  closePublishModal();
  closeBlockedModal();
  closeCertificateModal();
  closeIntegrationModal();
  closeProposeRuleModal();
}

/**
 * Switch Active Workspace Tab
 */
function switchTab(tabId) {
  appState.activeTab = tabId;
  const tabContents = document.querySelectorAll('.tab-content-panel');
  tabContents.forEach(panel => panel.classList.add('hidden'));

  const activePanel = document.getElementById(`panel-${tabId}`);
  if (activePanel) {
    activePanel.classList.remove('hidden');
  }

  // Update nav tab styling
  const tabBtns = document.querySelectorAll('.nav-tab-btn');
  tabBtns.forEach(btn => {
    if (btn.getAttribute('data-tab') === tabId) {
      btn.classList.add('border-plum-850', 'text-plum-900', 'font-bold');
      btn.classList.remove('border-transparent', 'text-stone-500', 'font-medium');
    } else {
      btn.classList.remove('border-plum-850', 'text-plum-900', 'font-bold');
      btn.classList.add('border-transparent', 'text-stone-500', 'font-medium');
    }
  });

  // Smooth scroll to workspace container
  const workspaceMain = document.querySelector('main');
  if (workspaceMain) {
    const topOffset = workspaceMain.getBoundingClientRect().top + window.scrollY - 80;
    if (window.scrollY > topOffset) {
      window.scrollTo({ top: topOffset, behavior: 'smooth' });
    }
  }

  // Re-trigger chart rendering if analytics tab is activated
  if (tabId === 'governance-analytics') {
    setTimeout(() => {
      if (typeof initAnalyticsCharts === 'function') {
        initAnalyticsCharts();
      }
    }, 60);
  }
}

/**
 * Render Asset Cards in Release Gate Queue
 */
function renderAssets() {
  const container = document.getElementById('assetListContainer');
  if (!container) return;

  const filtered = appState.assets.filter(asset => {
    // Status filter
    if (appState.currentFilter === 'ready' && asset.status !== 'Ready to Publish') return false;
    if (appState.currentFilter === 'blocked' && !asset.status.includes('Blocked')) return false;
    if (appState.currentFilter === 'published' && asset.status !== 'Published') return false;

    // Category filter
    if (appState.currentCategory !== 'all' && asset.category !== appState.currentCategory) return false;

    // Search query
    if (appState.searchQuery) {
      const q = appState.searchQuery;
      const match = asset.title.toLowerCase().includes(q) ||
                    asset.id.toLowerCase().includes(q) ||
                    asset.author.toLowerCase().includes(q) ||
                    (asset.channels && asset.channels.join(' ').toLowerCase().includes(q)) ||
                    (asset.summary && asset.summary.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-16 text-center bg-white rounded-3xl border border-stone-200">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
        <h4 class="font-display font-bold text-lg text-stone-800">No assets match your filter</h4>
        <p class="text-xs text-stone-500 mt-1">Try selecting another filter or searching for a different keyword.</p>
        <button onclick="resetFilters()" class="mt-4 px-5 py-2 text-xs font-semibold text-plum-900 border border-plum-800 rounded-full hover:bg-plum-50 transition">Reset Filters</button>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(asset => {
    const isReady = asset.status === 'Ready to Publish';
    const isBlocked = asset.status.includes('Blocked');
    const isPublished = asset.status === 'Published';

    // Gate evaluation check
    const gateEval = window.NiyamIntegrationAPI ? window.NiyamIntegrationAPI.evaluateReleaseGate(asset) : { eligible: isReady };

    let statusPill = '';
    if (isPublished) {
      statusPill = `<span class="badge-pill bg-slate-100 text-slate-800 border border-slate-200"><span class="w-2 h-2 rounded-full bg-slate-500"></span> Published & Audited</span>`;
    } else if (isReady && gateEval.eligible) {
      statusPill = `<span class="badge-pill bg-emerald-50 text-emerald-800 border border-emerald-200"><span class="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span> Ready to Publish</span>`;
    } else if (asset.status.includes('Pending Approval')) {
      statusPill = `<span class="badge-pill bg-amber-50 text-amber-800 border border-amber-200"><span class="w-2 h-2 rounded-full bg-amber-600"></span> Blocked: Approval Pending</span>`;
    } else {
      statusPill = `<span class="badge-pill bg-rose-50 text-rose-800 border border-rose-200"><span class="w-2 h-2 rounded-full bg-rose-600"></span> Blocked: Below Threshold</span>`;
    }

    // Card background tint based on category
    let cardAccent = 'bg-white';
    if (asset.category === 'Press Release') cardAccent = 'bg-[#FAF6F8]';
    if (asset.category === 'Social Media') cardAccent = 'bg-[#FBF8F5]';
    if (asset.category === 'Whitepaper') cardAccent = 'bg-[#F6FAF6]';
    if (asset.category === 'Corporate Report') cardAccent = 'bg-[#F8F9FB]';
    if (asset.category === 'Video Script') cardAccent = 'bg-[#F8F5FA]';

    return `
      <div class="luxury-card ${cardAccent} rounded-3xl p-6 sm:p-7 border border-[#EBE2DC] shadow-sm flex flex-col justify-between relative overflow-hidden">
        <!-- Top row: ID, category, and status -->
        <div>
          <div class="flex items-center justify-between gap-2 mb-3">
            <div class="flex items-center gap-2">
              <span class="text-xs font-mono font-bold text-stone-600 tracking-wider bg-white/80 px-2.5 py-1 rounded-full border border-stone-200">${asset.id}</span>
              <span class="text-xs font-semibold text-stone-500 uppercase tracking-widest">${asset.category}</span>
            </div>
            ${statusPill}
          </div>

          <!-- Title -->
          <h3 class="font-display font-bold text-lg text-stone-900 leading-snug hover:text-plum-900 cursor-pointer transition" onclick="openAuditDrawer('${asset.id}')">
            ${asset.title}
          </h3>

          <p class="text-xs text-stone-600 mt-2 line-clamp-2">${asset.summary}</p>

          <!-- Governance Scores Strip -->
          <div class="grid grid-cols-4 gap-2 mt-5 p-3 rounded-2xl bg-white/90 border border-stone-200/70">
            <div class="text-center">
              <span class="block text-[10px] font-bold text-stone-600 uppercase tracking-wider">Tone</span>
              <span class="text-sm font-extrabold ${asset.scores.tone >= 90 ? 'text-emerald-700' : 'text-rose-700'}">${asset.scores.tone}%</span>
            </div>
            <div class="text-center border-l border-stone-100">
              <span class="block text-[10px] font-bold text-stone-600 uppercase tracking-wider">Claims</span>
              <span class="text-sm font-extrabold ${asset.scores.claims >= 95 ? 'text-emerald-700' : 'text-rose-700'}">${asset.scores.claims}%</span>
            </div>
            <div class="text-center border-l border-stone-100">
              <span class="block text-[10px] font-bold text-stone-600 uppercase tracking-wider">A11y</span>
              <span class="text-sm font-extrabold ${asset.scores.accessibility >= 90 ? 'text-emerald-700' : 'text-amber-700'}">${asset.scores.accessibility}%</span>
            </div>
            <div class="text-center border-l border-stone-100">
              <span class="block text-[10px] font-bold text-stone-600 uppercase tracking-wider">Overall</span>
              <span class="text-sm font-extrabold text-plum-900">${asset.overallScore}%</span>
            </div>
          </div>

          <!-- Approvals & Channels -->
          <div class="mt-4 flex flex-wrap items-center justify-between text-xs text-stone-500 gap-2">
            <div class="flex items-center gap-1.5">
              <svg class="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <span>Sign-offs: <strong class="${asset.approvals.current >= asset.approvals.required ? 'text-emerald-800' : 'text-amber-700'}">${asset.approvals.current}/${asset.approvals.required}</strong></span>
            </div>
            <div class="flex items-center gap-1">
              <span class="text-[11px] text-stone-600">${asset.channels.slice(0, 2).join(', ')}${asset.channels.length > 2 ? ' +' + (asset.channels.length - 2) : ''}</span>
            </div>
          </div>
        </div>

        <!-- Card Footer Actions -->
        <div class="mt-6 pt-4 border-t border-stone-200/60 flex items-center justify-between gap-3">
          <button onclick="openAuditDrawer('${asset.id}')" class="text-xs font-bold text-plum-900 hover:text-plum-700 flex items-center gap-1 transition">
            <span>Audit Trail</span>
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </button>

          <div class="flex items-center gap-2">
            ${isPublished ? `
              <button onclick="viewCertificate('${asset.id}')" class="px-3.5 py-1.5 text-xs font-semibold text-stone-700 bg-white border border-stone-300 rounded-full hover:bg-stone-50 transition shadow-xs flex items-center gap-1">
                <svg class="w-3.5 h-3.5 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                Certificate
              </button>
            ` : isReady && gateEval.eligible ? `
              <button onclick="initiatePublish('${asset.id}')" class="btn-pill-wine !py-1.5 !px-4 !text-xs flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                Release to Channels
              </button>
            ` : `
              <button onclick="showBlockedDetails('${asset.id}')" class="px-3.5 py-1.5 text-xs font-semibold text-rose-800 bg-rose-50 border border-rose-200 rounded-full hover:bg-rose-100 transition flex items-center gap-1">
                <svg class="w-3 h-3 text-rose-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                Inspect Block
              </button>
            `}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function resetFilters() {
  appState.currentFilter = 'all';
  appState.currentCategory = 'all';
  appState.searchQuery = '';
  const searchInput = document.getElementById('assetSearchInput');
  if (searchInput) searchInput.value = '';
  const catSelect = document.getElementById('assetCategorySelect');
  if (catSelect) catSelect.value = 'all';

  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(b => {
    if (b.getAttribute('data-filter') === 'all') {
      b.classList.add('bg-plum-900', 'text-white', 'shadow-sm');
      b.classList.remove('bg-white', 'text-stone-700');
    } else {
      b.classList.remove('bg-plum-900', 'text-white', 'shadow-sm');
      b.classList.add('bg-white', 'text-stone-700');
    }
  });

  renderAssets();
}

/**
 * Open Slide-Over Audit Timeline Drawer
 */
async function openAuditDrawer(assetId) {
  const asset = appState.assets.find(a => a.id === assetId);
  if (!asset) return;

  appState.selectedAsset = asset;
  const drawer = document.getElementById('auditTimelineDrawer');
  const drawerBackdrop = document.getElementById('drawerBackdrop');
  const drawerPanel = document.getElementById('drawerPanel');

  document.getElementById('drawerAssetId').textContent = asset.id;
  document.getElementById('drawerAssetTitle').textContent = asset.title;
  document.getElementById('drawerAssetCategory').textContent = asset.category;
  document.getElementById('drawerAssetScore').textContent = asset.overallScore + '%';
  document.getElementById('drawerAssetAuthor').textContent = asset.author;
  document.getElementById('drawerAssetDate').textContent = asset.date;
  document.getElementById('drawerHash').textContent = asset.governanceHash || 'Pending release threshold gate verification';

  // Compute / update hash chain before displaying
  if (window.NiyamIntegrationAPI && window.NiyamIntegrationAPI.computeAuditChain) {
    await window.NiyamIntegrationAPI.computeAuditChain(asset.auditTrail);
  }

  // Render timeline steps
  renderDrawerTimeline(asset);

  // Reset verification indicator
  const verifyResultEl = document.getElementById('drawerVerifyResult');
  if (verifyResultEl) {
    verifyResultEl.innerHTML = '';
  }

  // Show drawer
  drawer.classList.remove('hidden');
  setTimeout(() => {
    drawerBackdrop.classList.remove('opacity-0');
    drawerPanel.classList.remove('translate-x-full');
  }, 10);
}

function renderDrawerTimeline(asset) {
  const timelineContainer = document.getElementById('drawerTimelineContent');
  if (!timelineContainer) return;

  timelineContainer.innerHTML = asset.auditTrail.map((item, index) => {
    let iconBg = 'bg-stone-100 text-stone-600 border-stone-300';
    let statusBadge = `<span class="text-[10px] uppercase font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">${item.stage}</span>`;

    if (item.status === 'completed' || item.status === 'approved') {
      iconBg = 'bg-emerald-100 text-emerald-800 border-emerald-300';
    } else if (item.status === 'flagged') {
      iconBg = 'bg-amber-100 text-amber-800 border-amber-300';
    } else if (item.status === 'blocked') {
      iconBg = 'bg-rose-100 text-rose-800 border-rose-300';
    } else if (item.status === 'ready') {
      iconBg = 'bg-purple-100 text-purple-800 border-purple-300';
    }

    let flagsHtml = '';
    if (item.flags && item.flags.length > 0) {
      flagsHtml = `
        <div class="mt-3 p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs">
          <div class="font-bold text-amber-900 flex items-center gap-1.5 mb-1.5">
            <svg class="w-4 h-4 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            Flagged: ${item.flags[0].type} (${item.flags[0].severity} Severity)
          </div>
          <p class="font-mono text-[11px] text-amber-800 mb-1"><strong>Rule:</strong> ${item.flags[0].rule}</p>
          <p class="text-stone-700 mb-1"><strong>Detected:</strong> <span class="bg-rose-100 text-rose-900 px-1 py-0.5 rounded line-through">${item.flags[0].found}</span></p>
          <p class="text-stone-700 mb-1"><strong>AI Suggestion:</strong> <span class="bg-emerald-100 text-emerald-900 px-1 py-0.5 rounded font-medium">${item.flags[0].suggestedFix}</span></p>
          <div class="mt-2 text-[11px] text-stone-500 font-medium">Status: ${item.flags[0].resolution}</div>
        </div>
      `;
    }

    const shortHash = item.stepHash ? `${item.stepHash.substring(0, 10)}...${item.stepHash.substring(item.stepHash.length - 6)}` : '';

    return `
      <div class="relative pl-10 pb-8 last:pb-2">
        <!-- Connector line -->
        ${index < asset.auditTrail.length - 1 ? '<div class="absolute left-4 top-8 bottom-0 w-0.5 bg-stone-200"></div>' : ''}
        
        <!-- Step Icon -->
        <div class="absolute left-1.5 top-1.5 w-6 h-6 rounded-full border-2 ${iconBg} flex items-center justify-center text-xs font-bold shadow-xs">
          ${item.step}
        </div>

        <div>
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <span class="font-display font-bold text-sm text-stone-900">${item.action}</span>
              ${statusBadge}
            </div>
            <span class="text-xs text-stone-400 font-mono">${item.time}</span>
          </div>

          <div class="text-xs text-stone-500 mt-0.5 flex items-center gap-1.5">
            <span class="font-medium text-stone-700">${item.actor}</span>
            <span>·</span>
            <span>${item.role}</span>
          </div>

          <p class="text-xs text-stone-600 mt-2 bg-white/70 p-2.5 rounded-xl border border-stone-100">${item.detail}</p>
          ${flagsHtml}

          ${shortHash ? `
            <div class="mt-2 flex items-center gap-2 text-[10px] font-mono text-stone-400">
              <span class="text-stone-500 font-semibold">Block Hash:</span>
              <span class="bg-stone-100 px-2 py-0.5 rounded">${shortHash}</span>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function closeAuditDrawer() {
  const drawer = document.getElementById('auditTimelineDrawer');
  const drawerBackdrop = document.getElementById('drawerBackdrop');
  const drawerPanel = document.getElementById('drawerPanel');
  if (!drawer || !drawerBackdrop || !drawerPanel) return;

  drawerBackdrop.classList.add('opacity-0');
  drawerPanel.classList.add('translate-x-full');
  setTimeout(() => {
    drawer.classList.add('hidden');
  }, 300);
}

/**
 * Verify Hash Chain Integrity using Web Crypto API
 */
async function verifyActiveAuditChain() {
  const asset = appState.selectedAsset;
  if (!asset || !window.NiyamIntegrationAPI) return;

  const verifyResultEl = document.getElementById('drawerVerifyResult');
  if (!verifyResultEl) return;

  verifyResultEl.innerHTML = `<span class="inline-block animate-spin mr-2">⟳</span> Recalculating SHA-256 blocks...`;

  const report = await window.NiyamIntegrationAPI.verifyAuditChain(asset.auditTrail);

  setTimeout(() => {
    if (report.valid) {
      verifyResultEl.innerHTML = `
        <div class="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2">
          <svg class="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
          <div>
            <span class="font-bold block">✓ Cryptographic Hash Chain Intact</span>
            <span class="text-[11px] text-emerald-800">${report.message} (Genesis → Step ${report.stepsChecked})</span>
          </div>
        </div>
      `;
      showToast("Audit trail cryptographic integrity verified (SHA-256).", "success");
    } else {
      verifyResultEl.innerHTML = `
        <div class="p-3 bg-rose-50 rounded-2xl border border-rose-200 text-xs text-rose-900 flex items-start gap-2">
          <svg class="w-4 h-4 text-rose-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
          <div>
            <span class="font-bold block">Tampering Detected</span>
            <span class="text-[11px] text-rose-800">${report.message}</span>
          </div>
        </div>
      `;
      showToast("Warning: Hash chain mismatch detected!", "error");
    }
  }, 350);
}

/**
 * Pre-Publish Gate Authorization Flow
 */
function initiatePublish(assetId) {
  const asset = appState.assets.find(a => a.id === assetId);
  if (!asset) return;

  // Strict Gatekeeper evaluation: prevent UI bypass
  const gateEval = window.NiyamIntegrationAPI ? window.NiyamIntegrationAPI.evaluateReleaseGate(asset) : { eligible: asset.status === 'Ready to Publish' };
  if (!gateEval.eligible) {
    showBlockedDetails(assetId);
    return;
  }

  appState.selectedAsset = asset;
  const modal = document.getElementById('publishGateModal');

  document.getElementById('modalAssetTitle').textContent = asset.title;
  document.getElementById('modalAssetId').textContent = asset.id;
  document.getElementById('modalAssetCategory').textContent = asset.category;
  document.getElementById('modalAssetScore').textContent = asset.overallScore + '%';

  // Render Gate Threshold Validation Checklist
  const checklistContainer = document.getElementById('modalGateChecklist');
  if (checklistContainer) {
    checklistContainer.innerHTML = `
      <div class="grid grid-cols-2 gap-2 text-xs">
        <div class="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-900 flex items-center justify-between">
          <span>Tone Score (≥ 90%)</span>
          <strong>${asset.scores.tone}% ✓</strong>
        </div>
        <div class="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-900 flex items-center justify-between">
          <span>Claims Score (≥ 95%)</span>
          <strong>${asset.scores.claims}% ✓</strong>
        </div>
        <div class="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-900 flex items-center justify-between">
          <span>A11y WCAG AA (≥ 90%)</span>
          <strong>${asset.scores.accessibility}% ✓</strong>
        </div>
        <div class="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-900 flex items-center justify-between">
          <span>Sign-offs (${asset.approvals.required})</span>
          <strong>${asset.approvals.current}/${asset.approvals.required} ✓</strong>
        </div>
      </div>
    `;
  }

  // Render targeted channels checkboxes
  const channelList = document.getElementById('modalChannelTargets');
  const availableChannels = (window.NiyamIntegrationAPI && window.NiyamIntegrationAPI.thresholds.supportedChannels) || asset.channels;

  channelList.innerHTML = availableChannels.map(ch => {
    const isTarget = asset.channels.includes(ch);
    return `
      <label class="flex items-center gap-3 p-3 rounded-2xl bg-[#FAF7F5] border border-stone-200 cursor-pointer hover:bg-stone-100 transition">
        <input type="checkbox" ${isTarget ? 'checked' : ''} onchange="validateChannelSelection()" class="channel-target-checkbox w-4 h-4 text-plum-900 rounded accent-plum-900 focus:ring-plum-800">
        <span class="text-xs font-semibold text-stone-800">${ch}</span>
        <span class="ml-auto text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">Connector Ready</span>
      </label>
    `;
  }).join('');

  validateChannelSelection();
  modal.classList.remove('hidden');
}

function validateChannelSelection() {
  const checkboxes = document.querySelectorAll('.channel-target-checkbox:checked');
  const btn = document.getElementById('btnConfirmRelease');
  if (btn) {
    if (checkboxes.length === 0) {
      btn.disabled = true;
      btn.classList.add('opacity-50', 'cursor-not-allowed');
      btn.title = "Select at least one publishing destination";
    } else {
      btn.disabled = false;
      btn.classList.remove('opacity-50', 'cursor-not-allowed');
      btn.title = "";
    }
  }
}

function closePublishModal() {
  const modal = document.getElementById('publishGateModal');
  if (modal) modal.classList.add('hidden');
}

/**
 * Execute Multi-Channel Release Simulation
 */
async function executeRelease() {
  const asset = appState.selectedAsset;
  if (!asset) return;

  const btn = document.getElementById('btnConfirmRelease');
  if (btn.disabled && btn.getAttribute('data-releasing') === 'true') {
    return; // Prevent duplicate rapid clicks
  }

  // Final Gate Validation before release execution
  const gateEval = window.NiyamIntegrationAPI ? window.NiyamIntegrationAPI.evaluateReleaseGate(asset) : { eligible: true };
  if (!gateEval.eligible) {
    closePublishModal();
    showBlockedDetails(asset.id);
    return;
  }

  // Get selected channels
  const selectedChannels = [];
  document.querySelectorAll('.channel-target-checkbox:checked').forEach(cb => {
    const labelSpan = cb.parentElement.querySelector('span');
    if (labelSpan) selectedChannels.push(labelSpan.textContent.trim());
  });

  if (selectedChannels.length === 0) {
    showToast("Please select at least one publishing channel.", "error");
    return;
  }

  btn.disabled = true;
  btn.setAttribute('data-releasing', 'true');
  btn.innerHTML = `<span class="inline-block animate-spin mr-2">⟳</span> Validating & Sealing SHA-256 Hash...`;

  // Compute real deterministic cryptographic hash
  const canonicalPayload = JSON.stringify({
    assetId: asset.id,
    title: asset.title,
    overallScore: asset.overallScore,
    scores: asset.scores,
    approvals: asset.approvals,
    channels: selectedChannels,
    timestamp: new Date().toISOString()
  });

  const generatedHash = window.NiyamIntegrationAPI
    ? await window.NiyamIntegrationAPI.computeSha256(canonicalPayload)
    : '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');

  setTimeout(() => {
    btn.innerHTML = `<span class="inline-block animate-pulse mr-2">📡</span> Dispatching to ${selectedChannels.length} channels...`;
  }, 400);

  setTimeout(async () => {
    asset.status = 'Published';
    asset.thresholdStatus = 'PUBLISHED';
    asset.publishedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);
    asset.channels = selectedChannels;
    asset.governanceHash = generatedHash;

    // Add publishing step to audit trail
    const prevStep = asset.auditTrail[asset.auditTrail.length - 1];
    const prevHash = prevStep ? prevStep.stepHash || '0x0000000000000000000000000000000000000000000000000000000000000000' : '0x0000000000000000000000000000000000000000000000000000000000000000';

    const publishStep = {
      step: asset.auditTrail.length + 1,
      stage: 'PUBLISH',
      actor: 'NiyamAI Release Gatekeeper',
      role: 'Release Gate API',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: 'Release Authorized & Cryptographically Sealed',
      detail: `Asset dispatched to ${selectedChannels.join(', ')}. Audit certificate emitted with SHA-256 token ${generatedHash.substring(0, 16)}...`,
      status: 'completed',
      prevHash: prevHash,
      stepHash: generatedHash
    };

    asset.auditTrail.push(publishStep);

    // Save state
    savePersistedState();

    closePublishModal();
    btn.disabled = false;
    btn.removeAttribute('data-releasing');
    btn.innerHTML = `Authorize & Release to Channels`;

    // Confetti celebration
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#4E1227', '#8FA89B', '#D9A58F', '#FAF7F5']
      });
    }

    initUI();
    renderAssets();
    if (typeof initAnalyticsCharts === 'function') {
      initAnalyticsCharts();
    }

    showToast(`Asset ${asset.id} published successfully across ${selectedChannels.length} destinations!`, 'success');
  }, 1100);
}

/**
 * Show Blocked Violations Modal with Interactive Remediation Simulation
 */
function showBlockedDetails(assetId) {
  const asset = appState.assets.find(a => a.id === assetId);
  if (!asset) return;

  appState.selectedAsset = asset;
  const modal = document.getElementById('blockedModal');
  document.getElementById('blockedAssetTitle').textContent = asset.title;
  document.getElementById('blockedAssetId').textContent = asset.id;
  document.getElementById('blockedAssetScore').textContent = asset.overallScore + '%';

  // Evaluate gate reasons
  const gateEval = window.NiyamIntegrationAPI ? window.NiyamIntegrationAPI.evaluateReleaseGate(asset) : { eligible: false, reasons: asset.blockReasons || [] };

  const reasonsContainer = document.getElementById('blockedReasonsList');
  if (gateEval.reasons && gateEval.reasons.length > 0) {
    reasonsContainer.innerHTML = gateEval.reasons.map(r => `
      <li class="flex items-start gap-2.5 text-xs text-stone-700 bg-rose-50/70 p-3 rounded-2xl border border-rose-200">
        <svg class="w-4 h-4 text-rose-700 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        <span>${r}</span>
      </li>
    `).join('');
  } else {
    reasonsContainer.innerHTML = `<li class="text-xs text-stone-500">Asset is undergoing review or pending human sign-offs.</li>`;
  }

  // Interactive Demo Remediation actions
  const actionContainer = document.getElementById('blockedModalActions');
  if (actionContainer) {
    if (asset.id === 'AST-1087') {
      // Scenario: Pending Legal Sign-off
      actionContainer.innerHTML = `
        <button onclick="simulateLegalSignoff('AST-1087')" class="btn-pill-wine !py-2 !px-5 !text-xs flex items-center gap-1.5">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          Simulate Step 04 Legal Sign-off (Marcus Vance)
        </button>
        <button onclick="closeBlockedModal()" class="btn-pill-outline !py-2 !px-4 !text-xs">
          Close
        </button>
      `;
    } else if (asset.id === 'AST-1083') {
      // Scenario: Below threshold claims & accessibility
      actionContainer.innerHTML = `
        <button onclick="simulateFullRemediation('AST-1083')" class="btn-pill-wine !py-2 !px-5 !text-xs flex items-center gap-1.5">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
          Simulate Step 03 Fix & Step 04 Approval
        </button>
        <button onclick="closeBlockedModal()" class="btn-pill-outline !py-2 !px-4 !text-xs">
          Close
        </button>
      `;
    } else {
      actionContainer.innerHTML = `
        <button onclick="closeBlockedModal()" class="btn-pill-outline !py-2 !px-5 !text-xs">
          Acknowledge & Close
        </button>
      `;
    }
  }

  modal.classList.remove('hidden');
}

function closeBlockedModal() {
  const modal = document.getElementById('blockedModal');
  if (modal) modal.classList.add('hidden');
}

/**
 * Simulate Teammate Actions (Steps 3 & 4) to demonstrate unblocking
 */
async function simulateLegalSignoff(assetId) {
  const asset = appState.assets.find(a => a.id === assetId);
  if (!asset || !window.NiyamIntegrationAPI) return;

  window.NiyamIntegrationAPI.recordApprovalFromMember4(asset, {
    reviewer: "Marcus Vance",
    role: "Legal & Regulatory Counsel",
    tier: 2,
    notes: "Verified keynote safe harbor disclosures and regional regulatory compliance. Signed off for publication."
  });

  asset.blockReasons = [];
  asset.status = "Ready to Publish";
  asset.thresholdStatus = "PASSED";

  await ensureAuditHashes();
  savePersistedState();
  closeBlockedModal();
  initUI();
  renderAssets();

  showToast(`Legal sign-off recorded from Step 04! Asset ${asset.id} is now Ready to Publish.`, "success");
}

async function simulateFullRemediation(assetId) {
  const asset = appState.assets.find(a => a.id === assetId);
  if (!asset || !window.NiyamIntegrationAPI) return;

  // Step 03 Correction
  window.NiyamIntegrationAPI.applyCorrectionsFromMember3(asset, {
    actor: "Priya Nair & AI Correction Engine",
    updatedClaimsScore: 97,
    updatedA11yScore: 94,
    detail: "Replaced 100% carbon-neutral claim with verifiable recycled packaging metric (§260.4); adjusted color contrast to 7.8:1."
  });

  // Step 04 Legal Approval
  window.NiyamIntegrationAPI.recordApprovalFromMember4(asset, {
    reviewer: "Marcus Vance",
    role: "Legal Counsel",
    tier: 2,
    notes: "Verified FTC Green Guides disclaimer compliance."
  });

  asset.blockReasons = [];
  asset.status = "Ready to Publish";
  asset.thresholdStatus = "PASSED";

  await ensureAuditHashes();
  savePersistedState();
  closeBlockedModal();
  initUI();
  renderAssets();

  showToast(`Remediations and approvals applied! Asset ${asset.id} passed all gates and is Ready to Publish.`, "success");
}

/**
 * View Executive Compliance Certificate
 * Respects pass vs blocked states
 */
function viewCertificate(assetId) {
  const asset = appState.assets.find(a => a.id === assetId);
  if (!asset) return;

  appState.selectedAsset = asset;
  const modal = document.getElementById('certificateModal');
  const certContainer = document.getElementById('certificateContainer');

  const isEligible = asset.status === 'Published' || asset.status === 'Ready to Publish';

  if (isEligible) {
    // Compliant Executive Certificate Layout
    certContainer.className = "bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border-4 border-plum-900 relative";
    certContainer.innerHTML = `
      <button onclick="closeCertificateModal()" class="no-print absolute top-4 right-4 text-stone-400 hover:text-stone-700">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>

      <div class="text-center pb-6 border-b-2 border-plum-900">
        <div class="inline-flex items-center gap-2 mb-2">
          <div class="w-8 h-8 rounded-full bg-plum-900 text-white flex items-center justify-center font-bold text-sm">न</div>
          <span class="font-display font-extrabold text-xl text-plum-900 tracking-tight">NiyamAI Compliance Platform</span>
        </div>
        <h2 class="font-display font-black text-2xl uppercase tracking-wider text-stone-900">Certificate of Brand Governance</h2>
        <p class="text-xs text-stone-500 font-serif italic mt-1">Issued under automated pre-publish compliance protocols</p>
      </div>

      <div class="py-6 space-y-4 text-xs">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <span class="block text-stone-500 uppercase tracking-wider text-[10px] font-bold">Asset Identifier</span>
            <span class="font-mono font-bold text-sm text-plum-900">${asset.id}</span>
          </div>
          <div>
            <span class="block text-stone-500 uppercase tracking-wider text-[10px] font-bold">Verified Overall Score</span>
            <span class="font-bold text-sm text-emerald-800">${asset.overallScore}% Passed</span>
          </div>
        </div>

        <div>
          <span class="block text-stone-500 uppercase tracking-wider text-[10px] font-bold">Asset Title & Format</span>
          <span class="font-display font-bold text-stone-900 text-sm">${asset.title}</span>
          <span class="text-stone-500 ml-1">(${asset.category})</span>
        </div>

        <div class="grid grid-cols-3 gap-2 p-3 bg-stone-50 rounded-2xl border border-stone-200 text-center">
          <div>
            <span class="block text-[10px] font-bold text-stone-500 uppercase">Tone</span>
            <strong class="text-emerald-700">${asset.scores.tone}%</strong>
          </div>
          <div class="border-l border-stone-200">
            <span class="block text-[10px] font-bold text-stone-500 uppercase">Claims</span>
            <strong class="text-emerald-700">${asset.scores.claims}%</strong>
          </div>
          <div class="border-l border-stone-200">
            <span class="block text-[10px] font-bold text-stone-500 uppercase">Accessibility</span>
            <strong class="text-emerald-700">${asset.scores.accessibility}%</strong>
          </div>
        </div>

        <div>
          <span class="block text-stone-500 uppercase tracking-wider text-[10px] font-bold">Authorized Signatures</span>
          <span class="text-stone-800 font-medium">${asset.approvals.signedBy.join(' • ') || 'Tier-2 Review Complete'}</span>
        </div>

        <div class="p-3 bg-stone-50 rounded-2xl border border-stone-200 font-mono text-[10px] text-stone-600 break-all">
          <strong class="text-plum-900 block mb-0.5">Tamper-Proof Verification Hash:</strong>
          <span>${asset.governanceHash || 'SHA-256 Token Emitted Upon Multi-Channel Release'}</span>
        </div>
      </div>

      <div class="pt-4 border-t border-stone-200 flex items-center justify-between text-[11px] text-stone-400">
        <span>Published At: <strong class="text-stone-700 font-mono">${asset.publishedAt || asset.date}</strong></span>
        
        <div class="no-print flex items-center gap-3">
          <button onclick="window.print()" class="btn-pill-wine !py-1.5 !px-4 !text-xs flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
            Print Certificate
          </button>
        </div>
      </div>
    `;
  } else {
    // Ineligible / Blocked Violation Notice Layout
    certContainer.className = "bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border-4 border-rose-800 relative";
    certContainer.innerHTML = `
      <button onclick="closeCertificateModal()" class="no-print absolute top-4 right-4 text-stone-400 hover:text-stone-700">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>

      <div class="text-center pb-6 border-b-2 border-rose-800">
        <div class="inline-flex items-center gap-2 mb-2">
          <div class="w-8 h-8 rounded-full bg-rose-800 text-white flex items-center justify-center font-bold text-sm">✕</div>
          <span class="font-display font-extrabold text-xl text-rose-900 tracking-tight">NiyamAI Governance Notice</span>
        </div>
        <h2 class="font-display font-black text-2xl uppercase tracking-wider text-rose-900">Release Prohibited — Gate Blocked</h2>
        <p class="text-xs text-rose-700 font-medium mt-1">This asset has failed mandatory pre-publish brand governance criteria</p>
      </div>

      <div class="py-6 space-y-4 text-xs">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <span class="block text-stone-500 uppercase tracking-wider text-[10px] font-bold">Asset Identifier</span>
            <span class="font-mono font-bold text-sm text-rose-900">${asset.id}</span>
          </div>
          <div>
            <span class="block text-stone-500 uppercase tracking-wider text-[10px] font-bold">Status</span>
            <span class="font-bold text-sm text-rose-700">${asset.status}</span>
          </div>
        </div>

        <div>
          <span class="block text-stone-500 uppercase tracking-wider text-[10px] font-bold">Asset Title & Format</span>
          <span class="font-display font-bold text-stone-900 text-sm">${asset.title}</span>
          <span class="text-stone-500 ml-1">(${asset.category})</span>
        </div>

        <div class="p-4 bg-rose-50 rounded-2xl border border-rose-200">
          <strong class="text-rose-900 block mb-2 uppercase text-[10px] tracking-wider">Unresolved Blocking Issues:</strong>
          <ul class="space-y-1.5 text-stone-700">
            ${(asset.blockReasons || ['Compliance scores below threshold or missing human approval']).map(r => `<li>• ${r}</li>`).join('')}
          </ul>
        </div>
      </div>

      <div class="pt-4 border-t border-stone-200 flex items-center justify-between text-[11px] text-stone-400">
        <span>Evaluation Date: <strong class="text-stone-700 font-mono">${asset.date}</strong></span>
        
        <div class="no-print flex items-center gap-3">
          <button onclick="window.print()" class="btn-pill-outline !border-rose-800 !text-rose-900 !py-1.5 !px-4 !text-xs flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
            Print Violation Notice
          </button>
        </div>
      </div>
    `;
  }

  modal.classList.remove('hidden');
}

function closeCertificateModal() {
  const modal = document.getElementById('certificateModal');
  if (modal) modal.classList.add('hidden');
}

/**
 * Download Audit Manifest JSON
 * Handles selected asset or platform-wide manifest
 */
function downloadAuditManifest() {
  try {
    const asset = appState.selectedAsset || appState.assets[0];
    const manifest = {
      $schema: "https://niyamai.io/schemas/governance-manifest-v1.json",
      platform: "NiyamAI Intelligent Brand Governance & AI Compliance Platform",
      module: "Step 05: Publishing, Audit Trail & Governance Analytics",
      exportTimestamp: new Date().toISOString(),
      governanceThresholds: window.NiyamIntegrationAPI ? window.NiyamIntegrationAPI.thresholds : {},
      assetManifest: {
        id: asset.id,
        title: asset.title,
        category: asset.category,
        author: asset.author,
        status: asset.status,
        overallScore: asset.overallScore,
        scores: asset.scores,
        approvals: asset.approvals,
        publishingDestinations: asset.channels,
        cryptographicSeals: {
          governanceHash: asset.governanceHash || "UNSEALED_PENDING_RELEASE",
          algorithm: "SHA-256",
          verificationMethod: "Web Crypto API (subtle.digest)"
        },
        chronologicalAuditEvents: asset.auditTrail
      }
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(manifest, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `niyamai-audit-manifest-${asset.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showToast(`Audit manifest for ${asset.id} downloaded successfully.`, 'info');
  } catch (err) {
    console.error('Failed to export manifest:', err);
    showToast("Failed to generate JSON manifest. Please try again.", "error");
  }
}

/**
 * Render Friction Rules Table
 */
function renderFrictionRules() {
  const container = document.getElementById('frictionRulesTableBody');
  if (!container) return;

  const rules = NiyamMockData.analytics.frictionRules;
  container.innerHTML = rules.map((item, idx) => `
    <tr class="hover:bg-stone-50/80 transition">
      <td class="py-4 px-4 text-xs font-semibold text-stone-900">
        ${item.rule}
      </td>
      <td class="py-4 px-4 text-xs text-stone-600">
        <span class="px-2.5 py-1 rounded-full text-[11px] font-medium bg-stone-100 text-stone-700 border border-stone-200">${item.category}</span>
      </td>
      <td class="py-4 px-4 text-xs font-bold text-center text-plum-900">
        ${item.occurrences}
      </td>
      <td class="py-4 px-4 text-xs text-center font-bold text-emerald-800">
        ${item.resolutionRate}
      </td>
      <td class="py-4 px-4 text-xs text-stone-600">
        <div>${item.recommendation}</div>
        <button onclick="openProposeRuleModal('FRICTION-${idx}', '${item.rule.replace(/'/g, "\\'")}', '${item.recommendation.replace(/'/g, "\\'")}')" class="mt-1 text-[11px] font-bold text-plum-900 hover:underline">
          + Propose Brand Book Clarification
        </button>
      </td>
    </tr>
  `).join('');
}

/**
 * Render Ambiguous Rules & Continuous Feedback Loop
 */
function renderAmbiguousRules() {
  const container = document.getElementById('ambiguousRulesContainer');
  if (!container) return;

  const rules = NiyamMockData.analytics.ambiguousRulesFeedback;
  container.innerHTML = rules.map(rule => `
    <div class="luxury-card bg-[#F9F5F7] p-6 rounded-3xl border border-[#E8DCD8] shadow-xs flex flex-col justify-between">
      <div>
        <div class="flex items-start justify-between gap-3 mb-2">
          <div>
            <span class="text-[10px] font-mono font-bold bg-plum-100 text-plum-900 px-2 py-0.5 rounded-full">${rule.ruleId}</span>
            <h4 class="font-display font-bold text-base text-stone-900 mt-1.5">${rule.name}</h4>
          </div>
          <div class="text-right">
            <span class="text-xs text-stone-500 block">Override Rate</span>
            <span class="font-display font-extrabold text-base text-plum-900">${rule.overrideRate}</span>
          </div>
        </div>
        <p class="text-xs text-stone-600 mt-2 bg-white/80 p-3 rounded-2xl border border-stone-200">${rule.insight}</p>
        <div class="mt-4 flex flex-col gap-1 text-xs pt-3 border-t border-stone-200">
          <span class="font-semibold text-stone-800">System Recommendation:</span>
          <span class="text-plum-900 font-bold bg-white p-2.5 rounded-xl border border-plum-200">${rule.suggestedFix}</span>
        </div>
      </div>
      <div class="mt-4 pt-3 flex items-center justify-between">
        <span class="text-[10px] text-stone-400">Requires Brand Committee Approval</span>
        <button onclick="openProposeRuleModal('${rule.ruleId}', '${rule.name.replace(/'/g, "\\'")}', '${rule.suggestedFix.replace(/'/g, "\\'")}')" class="btn-pill-wine !py-1 !px-3.5 !text-xs">
          Submit Proposal
        </button>
      </div>
    </div>
  `).join('');
}

/**
 * Propose Rule Clarification Modal & Workflow
 */
function openProposeRuleModal(ruleId, ruleName, defaultSuggestion) {
  const modal = document.getElementById('proposeRuleModal');
  if (!modal) return;

  document.getElementById('propRuleId').textContent = ruleId;
  document.getElementById('propRuleName').textContent = ruleName;
  const inputEl = document.getElementById('propRuleSuggestion');
  if (inputEl) inputEl.value = defaultSuggestion || '';

  modal.classList.remove('hidden');
}

function closeProposeRuleModal() {
  const modal = document.getElementById('proposeRuleModal');
  if (modal) modal.classList.add('hidden');
}

function submitRuleProposal() {
  const ruleId = document.getElementById('propRuleId').textContent;
  const ruleName = document.getElementById('propRuleName').textContent;
  const suggestion = document.getElementById('propRuleSuggestion').value.trim();
  const rationale = document.getElementById('propRuleRationale').value.trim();

  if (!suggestion) {
    showToast("Please provide the proposed wording refinement.", "error");
    return;
  }

  const newProposal = {
    id: `PROP-${Date.now().toString().slice(-4)}`,
    ruleId,
    ruleName,
    suggestion,
    rationale: rationale || "Identified through recurring human review overrides.",
    submittedAt: new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
    status: "Pending Committee Review"
  };

  appState.ruleProposals.unshift(newProposal);
  savePersistedState();
  closeProposeRuleModal();
  renderProposalsList();

  showToast(`Proposal ${newProposal.id} recorded for Brand Committee review.`, "success");
}

function renderProposalsList() {
  const container = document.getElementById('submittedProposalsContainer');
  if (!container) return;

  if (appState.ruleProposals.length === 0) {
    container.innerHTML = `
      <div class="text-center py-6 text-xs text-stone-400 italic bg-stone-50 rounded-2xl border border-stone-200">
        No active revision proposals submitted yet. Click "Submit Proposal" above to record a brand guideline update.
      </div>
    `;
    return;
  }

  container.innerHTML = appState.ruleProposals.map(p => `
    <div class="p-4 bg-white rounded-2xl border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
      <div>
        <div class="flex items-center gap-2">
          <span class="font-mono font-bold text-plum-900 bg-plum-50 px-2 py-0.5 rounded-full">${p.id}</span>
          <span class="font-bold text-stone-900">${p.ruleName}</span>
          <span class="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">${p.status}</span>
        </div>
        <p class="text-stone-600 mt-1"><strong>Proposed Refinement:</strong> ${p.suggestion}</p>
        <span class="text-[10px] text-stone-400 mt-1 block">Submitted on ${p.submittedAt} · ${p.rationale}</span>
      </div>
      <button onclick="deleteProposal('${p.id}')" class="text-stone-400 hover:text-rose-600 self-end sm:self-center transition p-1">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
      </button>
    </div>
  `).join('');
}

function deleteProposal(propId) {
  appState.ruleProposals = appState.ruleProposals.filter(p => p.id !== propId);
  savePersistedState();
  renderProposalsList();
  showToast("Proposal removed.", "info");
}

/**
 * Teammate Integration Hub Modal (Steps 01 to 04)
 */
function openIntegrationBridge(stepNum) {
  const modal = document.getElementById('integrationBridgeModal');
  if (!modal) return;

  const titleEl = document.getElementById('bridgeModalTitle');
  const descEl = document.getElementById('bridgeModalDesc');
  const codeEl = document.getElementById('bridgeModalSchema');
  const injectBtn = document.getElementById('btnInjectPayload');

  let memberInfo = {};
  if (stepNum === 1) {
    memberInfo = {
      title: "Step 01: Content Ingestion & Brand Guidelines",
      desc: "Step 01 imports marketing copy, assigns applicable Brand Book version rules, and passes initial drafts into the governance pipeline.",
      schema: `{
  "id": "AST-2091",
  "title": "Winter Product Catalog - Hero Headline",
  "category": "Corporate Report",
  "author": "Brand Ingestion Service",
  "brandGuidelinesRef": "Brand Book v4.2 §3",
  "wordCount": 920,
  "targetChannels": ["Corporate Website", "PR Newswire"]
}`,
      injectAction: () => simulateInboundFromMember(1)
    };
  } else if (stepNum === 2) {
    memberInfo = {
      title: "Step 02: Multimodal AI Audit Engine",
      desc: "Step 02 audits incoming assets across tone of voice, factual claim verification, WCAG accessibility, and visual guidelines.",
      schema: `{
  "assetId": "AST-1082",
  "tone": 98,
  "claims": 96,
  "accessibility": 95,
  "visual": 98,
  "flags": []
}`,
      injectAction: () => simulateInboundFromMember(2)
    };
  } else if (stepNum === 3) {
    memberInfo = {
      title: "Step 03: Violation Detection & Corrections",
      desc: "Step 03 identifies specific brand violations, surfaces citations from company guidelines, and provides intent-preserving corrections.",
      schema: `{
  "assetId": "AST-1083",
  "updatedClaimsScore": 96,
  "updatedA11yScore": 92,
  "correction": "Auto-corrected superlative claim to empirical statement."
}`,
      injectAction: () => simulateInboundFromMember(3)
    };
  } else if (stepNum === 4) {
    memberInfo = {
      title: "Step 04: Human Review & Approval Sign-offs",
      desc: "Step 04 routes flagged assets through tiered human review, collects authorized signatures, and feeds approvals to Step 05.",
      schema: `{
  "assetId": "AST-1087",
  "reviewer": "Marcus Vance",
  "role": "Legal Counsel",
  "tier": 2,
  "status": "APPROVED"
}`,
      injectAction: () => simulateInboundFromMember(4)
    };
  }

  titleEl.textContent = memberInfo.title;
  descEl.textContent = memberInfo.desc;
  codeEl.textContent = memberInfo.schema;
  injectBtn.onclick = memberInfo.injectAction;

  modal.classList.remove('hidden');
}

function closeIntegrationModal() {
  const modal = document.getElementById('integrationBridgeModal');
  if (modal) modal.classList.add('hidden');
}

async function simulateInboundFromMember(stepNum) {
  closeIntegrationModal();
  if (stepNum === 1) {
    const newAsset = window.NiyamIntegrationAPI.ingestAssetFromMember1({
      title: "Winter Product Catalog — Hero Headline & Copy",
      category: "Press Release",
      author: "Brand Ingestion Service",
      targetChannels: ["Corporate Website", "PR Newswire"]
    });
    // Give it initial scores
    newAsset.scores = { tone: 92, claims: 96, accessibility: 93, visual: 94 };
    newAsset.overallScore = 94;
    newAsset.status = "Ready to Publish";
    newAsset.thresholdStatus = "PASSED";
    newAsset.approvals = { current: 2, required: 2, signedBy: ["Content Lead", "Elena Rostova"] };

    appState.assets.unshift(newAsset);
    await ensureAuditHashes();
    savePersistedState();
    renderAssets();
    switchTab('release-gate');
    showToast("Sample asset ingested into Release Gate!", "success");
  } else if (stepNum === 2) {
    showToast("Audit scores verified from AI Audit Engine.", "info");
  } else if (stepNum === 3) {
    await simulateFullRemediation('AST-1083');
  } else if (stepNum === 4) {
    await simulateLegalSignoff('AST-1087');
  }
}

/**
 * Toast Notification System
 */
function showToast(message, type = 'info') {
  let toast = document.getElementById('niyamToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'niyamToast';
    toast.className = 'fixed bottom-6 right-6 z-50 transform transition-all duration-300 ease-out translate-y-10 opacity-0';
    document.body.appendChild(toast);
  }

  let bgClass = 'bg-[#330B18] text-white border border-[#4E1227]';
  if (type === 'success') bgClass = 'bg-[#1C3627] text-white border border-[#2D563E]';
  if (type === 'error') bgClass = 'bg-[#48121A] text-white border border-[#7A1E2E]';

  toast.innerHTML = `
    <div class="${bgClass} px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-semibold">
      ${type === 'success' ? `
        <svg class="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
      ` : type === 'error' ? `
        <svg class="w-4 h-4 text-rose-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
      ` : `
        <svg class="w-4 h-4 text-plum-200 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
      `}
      <span>${message}</span>
    </div>
  `;

  toast.classList.remove('translate-y-10', 'opacity-0');

  setTimeout(() => {
    toast.classList.add('translate-y-10', 'opacity-0');
  }, 3500);
}
