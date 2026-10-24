import React, { useState } from 'react';
import HeroBanner from './HeroBanner';
import CompanyProfile from './CompanyProfile';
import BrandGuidelines from './BrandGuidelines';
import ApprovedFacts from './ApprovedFacts';
import Terminology from './Terminology';
import BrandAssets from './BrandAssets';

/**
 * NiyamAI — Member 1: Reusable Brand Kit Entry Component
 * 
 * This is the primary component that the shared NiyamAI application shell can
 * import to embed Member 1's complete Brand Knowledge & Guidelines module.
 * 
 * @param {string} activeSection - Current section ('all', 'profile', 'guidelines', 'facts', 'terminology', 'assets')
 * @param {function} onSectionChange - Optional handler called when section changes
 * @param {boolean} showHero - Whether to render the HeroBanner (default: true)
 * @param {boolean} showLocalTabs - Render self-contained pill sub-navigation (useful when imported into an outer shell)
 */
export default function BrandKit({
  activeSection,
  activeTab = 'all',
  onSectionChange,
  setActiveTab,
  showHero = true,
  showLocalTabs = false,
}) {
  const resolvedSection = activeSection !== undefined ? activeSection : activeTab;
  const resolvedOnChange = onSectionChange || setActiveTab;
  const [internalSection, setInternalSection] = useState(resolvedSection);
  const currentSection = resolvedOnChange ? resolvedSection : internalSection;
  const handleSectionSelect = resolvedOnChange || setInternalSection;

  const sectionTabs = [
    { id: 'all', label: 'All Knowledge' },
    { id: 'profile', label: 'Company Profile' },
    { id: 'guidelines', label: 'Guidelines' },
    { id: 'facts', label: 'Approved Facts' },
    { id: 'terminology', label: 'Terminology' },
    { id: 'assets', label: 'Brand Assets' },
  ];

  return (
    <div className="w-full bg-[#FAF7F2] text-ink-primary font-sans">
      {/* Optional Embedded Section Tabs (Useful when integrated into a shared team shell) */}
      {showLocalTabs && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 no-scrollbar border-b border-cream-300">
            {sectionTabs.map((tab) => {
              const isActive = currentSection === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleSectionSelect(tab.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
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

      {/* 'all': Complete cohesive view matching reference video layout */}
      {currentSection === 'all' && (
        <>
          {showHero && <HeroBanner onSelectSection={handleSectionSelect} />}
          <CompanyProfile />
          <BrandGuidelines />
          <ApprovedFacts />
          <Terminology />
          <BrandAssets />
        </>
      )}

      {/* Individual Focused Sections */}
      {currentSection === 'profile' && (
        <div className="pt-4">
          <CompanyProfile />
        </div>
      )}

      {currentSection === 'guidelines' && (
        <div className="pt-4">
          <BrandGuidelines />
        </div>
      )}

      {currentSection === 'facts' && (
        <div className="pt-4">
          <ApprovedFacts />
        </div>
      )}

      {currentSection === 'terminology' && (
        <div className="pt-4">
          <Terminology />
        </div>
      )}

      {currentSection === 'assets' && (
        <div className="pt-4">
          <BrandAssets />
        </div>
      )}
    </div>
  );
}
