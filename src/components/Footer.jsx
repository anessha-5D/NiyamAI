import React from 'react';

export default function Footer({ onSelectSection }) {
  return (
    <footer className="bg-wine-950 text-cream-100 border-t border-wine-900 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Col 1: Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-wine-800 flex items-center justify-center text-white font-extrabold text-base border border-wine-700">
                N
              </div>
              <span className="font-extrabold text-xl tracking-tight text-cream-50 font-display">
                NIYAMAI
              </span>
            </div>
            <p className="text-xs text-cream-300/80 leading-relaxed">
              Brand Knowledge & Guidelines module for NiyamAI. A standalone brand governance engine managing brand identity rules.
            </p>
            <div className="pt-1 flex items-center space-x-2 text-[11px] text-wine-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>LocalStorage Persistence • Key: niyamai_brand_kit_data</span>
            </div>
          </div>

          {/* Col 2: Brand Kit Sections */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-wine-300 font-bold">
              [Brand Sections]
            </h4>
            <ul className="space-y-2 text-xs text-cream-200">
              <li>
                <button
                  onClick={() => onSelectSection('profile')}
                  className="hover:text-white transition-colors"
                >
                  1. Company Profile
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectSection('guidelines')}
                  className="hover:text-white transition-colors"
                >
                  2. Brand Guidelines
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectSection('facts')}
                  className="hover:text-white transition-colors"
                >
                  3. Approved Facts
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectSection('terminology')}
                  className="hover:text-white transition-colors"
                >
                  4. Preferred & Prohibited Terms
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectSection('assets')}
                  className="hover:text-white transition-colors"
                >
                  5. Brand Assets & Colors
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Export Functions for Team Members */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-wine-300 font-bold">
              [Shared Service API]
            </h4>
            <p className="text-[11px] text-cream-300/80 mb-2">
              Ready-made functions other team modules can import from <code className="text-pastel-butter">brandDataService.js</code>:
            </p>
            <ul className="space-y-1.5 text-[11px] font-mono text-cream-200">
              <li className="bg-wine-900/60 px-2 py-1 rounded border border-wine-800">
                getCompanyProfile()
              </li>
              <li className="bg-wine-900/60 px-2 py-1 rounded border border-wine-800">
                getBrandGuidelines()
              </li>
              <li className="bg-wine-900/60 px-2 py-1 rounded border border-wine-800">
                getApprovedFacts() <span className="text-emerald-300 text-[10px]">*active only</span>
              </li>
              <li className="bg-wine-900/60 px-2 py-1 rounded border border-wine-800">
                getTerminology()
              </li>
              <li className="bg-wine-900/60 px-2 py-1 rounded border border-wine-800">
                getBrandColors()
              </li>
              <li className="bg-wine-900/60 px-2 py-1 rounded border border-wine-800">
                getBrandAssets()
              </li>
            </ul>
          </div>

          {/* Col 4: Integration Status */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-wine-300 font-bold">
              [Integration Ready]
            </h4>
            <p className="text-xs text-cream-300/80 leading-relaxed">
              Self-contained React architecture. No global routing or team management conflicts. Easily integrates into your shared NiyamAI monorepo later.
            </p>
            <div className="p-3 rounded-2xl bg-wine-900/70 border border-wine-800 text-[11px] text-cream-200">
              <span className="font-semibold block text-wine-200 mb-0.5">Fictional Demo Environment</span>
              Data is saved in browser localStorage for testing without requiring a backend.
            </div>
          </div>
        </div>

        {/* Bottom Sub-bar */}
        <div className="mt-12 pt-8 border-t border-wine-900 flex flex-col sm:flex-row items-center justify-between text-xs text-wine-300/80 gap-4">
          <p>© 2026 NiyamAI • Brand Knowledge & Guidelines Module.</p>
          <div className="flex items-center space-x-4">
            <span className="text-[11px] font-mono">Theme: Editorial Minimalist</span>
            <span className="text-[11px] font-mono">Colors: Wine & Pastels</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
