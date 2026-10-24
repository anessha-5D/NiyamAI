import React from 'react';
import { ArrowRight, Sparkles, Compass } from 'lucide-react';

export default function HeroBanner({ onSelectSection }) {
  return (
    <section className="relative overflow-hidden bg-wine-900 text-white mx-4 sm:mx-6 lg:mx-8 my-4 rounded-3xl sm:rounded-4xl shadow-xl transition-all">
      {/* Decorative background aura */}
      <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 rounded-full bg-wine-700/40 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-80 h-80 rounded-full bg-wine-950/80 blur-2xl pointer-events-none" />

      {/* Top Banner Status Bar (Direct visual reference to the sample video) */}
      <div className="relative border-b border-wine-800/80 px-6 sm:px-10 py-3.5 flex flex-wrap items-center justify-between text-xs tracking-wide text-wine-200">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-medium">NiyamAI • Brand Knowledge & Guidelines</span>
        </div>
        <div className="hidden sm:flex items-center space-x-6 text-[11px] font-medium tracking-wider uppercase text-wine-300">
          <span>Demo Subject: NovaTech Workflow Software</span>
        </div>
      </div>

      {/* Center Hero Content */}
      <div className="relative px-6 sm:px-12 py-16 sm:py-20 max-w-5xl mx-auto text-center">
        {/* Tagline Badge */}
        <div className="inline-flex items-center space-x-2 bg-wine-800/80 border border-wine-700/60 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide text-wine-100 mb-6">
          <Sparkles className="w-3.5 h-3.5 text-pastel-butter" />
          <span>Brand Intelligence & Governance Engine</span>
        </div>

        {/* Big Editorial Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6 font-display text-cream-50">
          NiyamAI Brand Knowledge<br className="hidden sm:block" />
          <span className="text-wine-200"> & Guidelines Portal.</span>
        </h1>

        {/* Narrative Subtitle */}
        <p className="max-w-2xl mx-auto text-sm sm:text-base text-cream-200/90 leading-relaxed font-normal mb-8">
          The central brand kit module for NiyamAI — managing company identity, active guidelines, approved facts, terminology rules, and design tokens for demo company NovaTech.
        </p>

        {/* Video-style Pill Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <button
            onClick={() => onSelectSection('assets')}
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-full bg-cream-100 text-wine-950 font-semibold text-sm hover:bg-white transition-all shadow-md active:scale-95 group"
          >
            <span>Explore Brand Assets</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={() => onSelectSection('terminology')}
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-full bg-wine-800/90 text-cream-100 border border-wine-700 font-semibold text-sm hover:bg-wine-700 transition-all active:scale-95"
          >
            <Compass className="w-4 h-4 text-pastel-sage" />
            <span>Test Terminology</span>
          </button>
        </div>

        {/* Value Prop Pills (Direct homage to video's bottom hero cards) */}
        <div className="mt-12 pt-8 border-t border-wine-800/60 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
          <div className="bg-wine-950/40 p-3.5 rounded-2xl border border-wine-800/40">
            <p className="text-[10px] uppercase tracking-wider text-wine-300 font-medium">Core Brand Kit</p>
            <p className="text-base font-bold text-cream-50 mt-0.5">5 Main Sections</p>
          </div>
          <div className="bg-wine-950/40 p-3.5 rounded-2xl border border-wine-800/40">
            <p className="text-[10px] uppercase tracking-wider text-wine-300 font-medium">Data Expiry Check</p>
            <p className="text-base font-bold text-cream-50 mt-0.5">Automated Filter</p>
          </div>
          <div className="bg-wine-950/40 p-3.5 rounded-2xl border border-wine-800/40">
            <p className="text-[10px] uppercase tracking-wider text-wine-300 font-medium">LocalStorage</p>
            <p className="text-base font-bold text-cream-50 mt-0.5">Full Persistence</p>
          </div>
          <div className="bg-wine-950/40 p-3.5 rounded-2xl border border-wine-800/40">
            <p className="text-[10px] uppercase tracking-wider text-wine-300 font-medium">Integration API</p>
            <p className="text-base font-bold text-cream-50 mt-0.5">6 Export Functions</p>
          </div>
        </div>
      </div>
    </section>
  );
}
