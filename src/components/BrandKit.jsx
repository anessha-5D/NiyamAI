import React, { useState, useEffect, useRef, useCallback } from 'react';
import HeroBanner from './HeroBanner';
import CompanyProfile from './CompanyProfile';
import BrandGuidelines from './BrandGuidelines';
import ApprovedFacts from './ApprovedFacts';
import Terminology from './Terminology';
import BrandAssets from './BrandAssets';
import PdfBrandUpload from './PdfBrandUpload';
import Footer from './Footer';

export default function BrandKit({
  activeSection,
  activeTab = 'profile',
  onSectionChange,
  setActiveTab,
  showHero = true,
  showLocalTabs = true,
  onNavigateToAudit,
  pushToast,
  initialTab,
  scrollToPdfSection = false,
  onScrollComplete,
}) {
  const resolvedSection = activeSection !== undefined ? activeSection : activeTab;
  const resolvedOnChange = onSectionChange || setActiveTab;

  const validTabIds = ['profile', 'guidelines', 'pdf-guidelines', 'facts', 'terminology', 'assets'];

  // Use initialTab (from cross-module navigation) if provided, else fall back to resolvedSection
  const startingSection = initialTab && validTabIds.includes(initialTab)
    ? initialTab
    : (resolvedSection && validTabIds.includes(resolvedSection) ? resolvedSection : 'profile');

  const [internalSection, setInternalSection] = useState(startingSection);

  // Ref for the PDF Guidelines section wrapper (used for scroll-into-view)
  const pdfSectionRef = useRef(null);

  useEffect(() => {
    if (resolvedSection) {
      if (validTabIds.includes(resolvedSection)) {
        setInternalSection(resolvedSection);
      } else {
        setInternalSection('profile');
      }
    }
  }, [resolvedSection]);

  // When initialTab changes (cross-module navigation), switch to that tab
  useEffect(() => {
    if (initialTab && validTabIds.includes(initialTab)) {
      setInternalSection(initialTab);
    }
  }, [initialTab]);

  const rawSection = resolvedOnChange && activeSection !== undefined ? activeSection : internalSection;
  const activeTabId = validTabIds.includes(rawSection) ? rawSection : 'profile';

  // Scroll to PDF Guidelines section after it mounts, when scrollToPdfSection is true
  useEffect(() => {
    if (!scrollToPdfSection) return;
    if (activeTabId !== 'pdf-guidelines') return;

    // Use a short timeout to let the tab content fully render before scrolling
    const timer = setTimeout(() => {
      const target = document.getElementById('pdf-upload-card') || pdfSectionRef.current || document.getElementById('pdf-guidelines-section');
      if (target) {
        const navbarHeight = 64; // approximate sticky navbar height in px
        const elementTop = target.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: Math.max(0, elementTop - navbarHeight - 16), behavior: 'smooth' });
      }
      if (onScrollComplete) onScrollComplete();
    }, 150);

    return () => clearTimeout(timer);
  }, [scrollToPdfSection, activeTabId]);

  const handleSectionSelect = (sectionId) => {
    const targetSection = validTabIds.includes(sectionId) ? sectionId : 'profile';
    setInternalSection(targetSection);
    if (resolvedOnChange) {
      resolvedOnChange(targetSection);
    }
  };

  const sectionTabs = [
    { id: 'profile', label: 'Company Profile' },
    { id: 'guidelines', label: 'Guidelines Registry' },
    { id: 'pdf-guidelines', label: 'PDF Guidelines' },
    { id: 'facts', label: 'Approved Facts' },
    { id: 'terminology', label: 'Terminology' },
    { id: 'assets', label: 'Brand Assets' },
  ];

  return (
    <div className="w-full bg-[#FAF7F2] text-ink-primary font-sans">
      {/* Landing Hero Section placed above the horizontal tabs */}
      {showHero && <HeroBanner onSelectSection={handleSectionSelect} />}

      {/* Horizontal Tabs at the top of the Brand Kit content */}
      {showLocalTabs && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
          <div
            role="tablist"
            aria-label="Brand Kit Sections"
            className="flex items-center space-x-2 overflow-x-auto pb-2 no-scrollbar border-b border-cream-300"
          >
            {sectionTabs.map((tab) => {
              const isActive = activeTabId === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => handleSectionSelect(tab.id)}
                  type="button"
                  className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-wine-900 text-white shadow-sm'
                      : 'bg-white/80 text-ink-secondary hover:text-wine-950 hover:bg-white border border-cream-300'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Content Area - Render only the currently selected tab */}
      <div className="pt-2">
        {activeTabId === 'profile' && <CompanyProfile />}
        {activeTabId === 'guidelines' && (
          <BrandGuidelines onOpenPdfUpload={() => handleSectionSelect('pdf-guidelines')} />
        )}
        {activeTabId === 'pdf-guidelines' && (
          <div id="pdf-guidelines-section" ref={pdfSectionRef}>
            <PdfBrandUpload onNavigateToAudit={onNavigateToAudit} pushToast={pushToast} />
          </div>
        )}
        {activeTabId === 'facts' && <ApprovedFacts />}
        {activeTabId === 'terminology' && <Terminology />}
        {activeTabId === 'assets' && <BrandAssets />}
      </div>

      {/* Footer */}
      <Footer onSelectSection={handleSectionSelect} />
    </div>
  );
}
