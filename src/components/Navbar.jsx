import React, { useState } from 'react';
import { Download, Check, Menu, X, RotateCcw } from 'lucide-react';
import { exportBrandKitJson, resetToDefaults } from '../services/brandDataService';

export default function Navbar({ activeTab, setActiveTab, onDataReset }) {
  const [copiedExport, setCopiedExport] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'all', label: 'All Knowledge' },
    { id: 'profile', label: 'Company Profile' },
    { id: 'guidelines', label: 'Guidelines' },
    { id: 'facts', label: 'Approved Facts' },
    { id: 'terminology', label: 'Terminology' },
    { id: 'assets', label: 'Brand Assets' },
  ];

  const handleExportJson = () => {
    const jsonStr = exportBrandKitJson();
    navigator.clipboard.writeText(jsonStr);
    setCopiedExport(true);
    setTimeout(() => setCopiedExport(false), 2500);

    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'niyamai-brand-kit.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleResetData = () => {
    if (window.confirm('Reset all Brand Kit demo data back to initial defaults?')) {
      resetToDefaults();
      if (onDataReset) onDataReset();
      window.location.reload();
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F2]/90 backdrop-blur-md border-b border-cream-300/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between h-20">
          {/* Main Project Branding: NiyamAI */}
          <div
            className="flex items-center space-x-3 sm:space-x-4 cursor-pointer"
            onClick={() => setActiveTab('all')}
          >
            <div className="w-10 h-10 rounded-full bg-wine-900 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              N
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight text-wine-950 font-display">
                  NIYAMAI
                </span>
                <span className="text-[10px] font-mono font-bold tracking-wider uppercase bg-wine-100 text-wine-900 px-2.5 py-0.5 rounded-full border border-wine-200">
                  Brand Kit
                </span>
              </div>
              <p className="text-[11px] text-ink-muted tracking-tight font-medium">
                Brand Knowledge & Guidelines Module (Demo: NovaTech)
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            <button
              onClick={handleResetData}
              title="Reset data in localStorage to initial demo state"
              className="inline-flex items-center space-x-1.5 text-xs text-ink-secondary hover:text-wine-950 bg-white px-3 py-1.5 rounded-full border border-cream-300 transition-colors shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5 text-ink-muted" />
              <span>Reset Demo Defaults</span>
            </button>

            <button
              onClick={handleExportJson}
              className="inline-flex items-center space-x-2 text-xs font-semibold px-4 py-2 rounded-full bg-wine-900 text-white hover:bg-wine-800 transition-all shadow-sm active:scale-95"
            >
              {copiedExport ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Downloaded JSON</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Brand Kit</span>
                </>
              )}
            </button>
          </div>

          {/* Mobile hamburger button */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={handleExportJson}
              aria-label="Export Brand Kit"
              className="p-2 rounded-full bg-wine-900 text-white"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-full bg-white border border-cream-300 text-ink-primary"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Tab Navigation (Pill Style inspired by video) */}
        <div className="hidden md:flex items-center space-x-1 overflow-x-auto pb-3 pt-1 no-scrollbar border-t border-cream-200/60">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-wine-900 text-white shadow-sm'
                    : 'text-ink-secondary hover:text-wine-950 hover:bg-white/80'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Mobile Dropdown Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-cream-300 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`block w-full text-left px-4 py-2 rounded-xl text-sm font-semibold ${
                  activeTab === item.id
                    ? 'bg-wine-900 text-white'
                    : 'text-ink-secondary hover:bg-cream-200'
                }`}
              >
                {item.label}
              </button>
            ))}
            <div className="pt-2 border-t border-cream-200">
              <button
                onClick={handleResetData}
                className="w-full text-left px-4 py-2 text-xs font-medium text-rose-800"
              >
                Reset Demo Defaults
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
