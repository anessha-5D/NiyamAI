import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  FileText,
  Search,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Download,
  Trash2,
  RefreshCw,
  Eye,
  ShieldCheck,
  Tag,
  BookOpen,
  ArrowRight,
  Sliders,
  Sparkles,
  Info
} from 'lucide-react';
import type {
  ExtractedGuideline,
  GuidelineCategory,
  GuidelineSearchResult,
  UploadedBrandDocument
} from '../types/brandPdf';
import {
  getUploadedBrandDocument,
  processUploadedPdf,
  loadSampleBenchmarkPdf,
  clearUploadedBrandDocument,
  searchBrandDocument,
  exportDocumentAsJson
} from '../services/pdfBrandService';

interface PdfBrandUploadProps {
  onNavigateToAudit?: () => void;
  pushToast?: (msg: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

type ActiveViewTab = 'categories' | 'search' | 'rules' | 'raw_text';

export default function PdfBrandUpload({ onNavigateToAudit, pushToast }: PdfBrandUploadProps) {
  const [document, setDocument] = useState<UploadedBrandDocument | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveViewTab>('categories');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [searchResults, setSearchResults] = useState<GuidelineSearchResult[]>([]);

  // Selected rule for detail view modal
  const [selectedRule, setSelectedRule] = useState<ExtractedGuideline | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const stored = getUploadedBrandDocument();
    if (stored) {
      setDocument(stored);
      setSearchResults(searchBrandDocument(stored, ''));
    }
  }, []);

  // Update search results whenever query, filter, or doc changes
  useEffect(() => {
    if (document) {
      const res = searchBrandDocument(document, searchQuery, selectedCategoryFilter);
      setSearchResults(res);
    }
  }, [document, searchQuery, selectedCategoryFilter]);

  const handleFileSelection = async (file: File) => {
    setErrorMessage('');
    setIsProcessing(true);
    setProcessingStatus(`Analyzing "${file.name}"...`);

    try {
      setProcessingStatus('Extracting embedded text and layout streams...');
      const res = await processUploadedPdf(file);

      if (res.success && res.document) {
        setDocument(res.document);
        setSearchQuery('');
        setSelectedCategoryFilter('all');
        pushToast?.(
          `Successfully processed "${res.document.fileName}"! Extracted ${res.document.summary.totalRules} brand rules.`,
          'success'
        );
      } else {
        setErrorMessage(res.error || 'Failed to extract text from PDF document.');
        pushToast?.(res.error || 'Extraction failed', 'error');
      }
    } catch (err: any) {
      const msg = err?.message || 'An unexpected error occurred during PDF upload.';
      setErrorMessage(msg);
      pushToast?.(msg, 'error');
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileSelection(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleFileSelection(file);
    }
  };

  const handleLoadBenchmarkSample = async () => {
    setErrorMessage('');
    setIsProcessing(true);
    setProcessingStatus('Loading NovaTech Enterprise Brand Guidelines Benchmark PDF...');

    try {
      const res = await loadSampleBenchmarkPdf();
      if (res.success && res.document) {
        setDocument(res.document);
        setSearchQuery('');
        setSelectedCategoryFilter('all');
        pushToast?.(
          `Loaded sample "${res.document.fileName}" (${res.document.summary.totalRules} rules extracted).`,
          'success'
        );
      } else {
        setErrorMessage(res.error || 'Failed to load sample benchmark PDF.');
        pushToast?.(res.error || 'Failed to load sample PDF', 'error');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error loading sample PDF.');
      pushToast?.('Error loading sample PDF', 'error');
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  const handleRemoveDocument = () => {
    if (window.confirm('Remove this uploaded brand guidelines document?')) {
      clearUploadedBrandDocument();
      setDocument(null);
      setSearchQuery('');
      setSearchResults([]);
      pushToast?.('Brand document removed. Audits will revert to built-in rules.', 'info');
    }
  };

  const categoriesList: { id: GuidelineCategory; label: string; count: number; icon: string; desc: string }[] = document
    ? [
        {
          id: 'prohibited_claims',
          label: 'Prohibited Claims',
          count: document.summary.categories.prohibitedCount,
          icon: '🚫',
          desc: 'Restricted claims, forbidden vocabulary, and unapproved promises'
        },
        {
          id: 'approved_claims',
          label: 'Approved Facts & Claims',
          count: document.summary.categories.approvedCount,
          icon: '✅',
          desc: 'Substantiated SLA statements, certified stats, and company milestones'
        },
        {
          id: 'required_disclaimers',
          label: 'Required Disclaimers',
          count: document.summary.categories.disclaimersCount,
          icon: '⚖️',
          desc: 'Mandatory footnotes, asterisks, and regulatory disclosure notices'
        },
        {
          id: 'tone_of_voice',
          label: 'Tone of Voice',
          count: document.summary.categories.toneCount,
          icon: '🎙️',
          desc: 'Brand voice attributes, style boundaries, and communication principles'
        },
        {
          id: 'terminology',
          label: 'Brand Terminology',
          count: document.summary.categories.terminologyCount,
          icon: '📖',
          desc: 'Approved glossary, naming standards, and preferred phrasing'
        },
        {
          id: 'visual_accessibility',
          label: 'Visual & Accessibility',
          count: document.summary.categories.visualCount,
          icon: '👁️',
          desc: 'WCAG contrast standards, logo clear space, and typography guidelines'
        }
      ]
    : [];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-wine-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-wine-700/30 blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-2 bg-wine-800/90 border border-wine-700/80 px-3.5 py-1 rounded-full text-xs font-semibold text-wine-100 mb-3">
              <FileText className="w-3.5 h-3.5 text-rose-300" />
              <span>Round 3 • Enterprise PDF Brand Knowledge Ingestion</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
              PDF Brand Guidelines Upload & Rule Engine
            </h1>
            <p className="text-xs sm:text-sm text-wine-200 mt-1 max-w-2xl leading-relaxed">
              Upload official corporate brand guideline manuals, styleguides, and compliance policies in PDF format.
              Text is extracted and categorized into actionable rules, and seamlessly integrated into the content compliance auditor.
            </p>
          </div>

          {/* Quick Demo Button for Hackathon Judges */}
          <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
            <button
              onClick={handleLoadBenchmarkSample}
              disabled={isProcessing}
              title="Loads the pre-packaged NovaTech Enterprise Brand Guidelines PDF"
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-full bg-pastel-butter text-wine-950 font-bold text-xs hover:bg-amber-200 transition shadow-sm active:scale-95 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-wine-900" />
              <span>Load Benchmark Sample PDF</span>
            </button>
            <span className="text-[11px] text-wine-300">Confidential local extraction • 0 external AI leaks</span>
          </div>
        </div>
      </div>

      {/* Upload Drag & Drop Area */}
      <div id="pdf-upload-card" className="bg-white rounded-3xl p-6 sm:p-8 border border-cream-300 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-wine-950 font-display">
              Upload PDF Brand Document
            </h2>
            <p className="text-xs text-ink-secondary">
              Select or drop a brand guidelines document (.pdf up to 15 MB) to parse its rules.
            </p>
          </div>

          {document && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => exportDocumentAsJson(document)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-cream-100 text-ink-primary hover:bg-cream-200 text-xs font-semibold border border-cream-300 transition"
                title="Download extracted rules as JSON"
              >
                <Download className="w-3.5 h-3.5 text-wine-800" />
                <span>Export JSON</span>
              </button>
              <button
                onClick={handleRemoveDocument}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-rose-50 text-rose-800 hover:bg-rose-100 text-xs font-semibold border border-rose-200 transition"
                title="Remove uploaded document"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-700" />
                <span>Remove PDF</span>
              </button>
            </div>
          )}
        </div>

        {/* Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
            isDragOver
              ? 'border-wine-800 bg-wine-50/60 scale-[1.01]'
              : 'border-cream-300 hover:border-wine-400 bg-cream-50/40 hover:bg-white'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept=".pdf,application/pdf"
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center space-y-3">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xs transition ${
              isDragOver ? 'bg-wine-900 text-white' : 'bg-white text-wine-900 border border-cream-300'
            }`}>
              {isProcessing ? (
                <RefreshCw className="w-6 h-6 animate-spin text-wine-800" />
              ) : (
                <Upload className="w-6 h-6" />
              )}
            </div>

            <div>
              <p className="text-sm font-bold text-wine-950 font-display">
                {isProcessing
                  ? processingStatus || 'Processing PDF document...'
                  : isDragOver
                  ? 'Drop your PDF brand guidelines here'
                  : 'Click to browse or drag and drop your PDF guidelines'}
              </p>
              <p className="text-xs text-ink-muted mt-1">
                Supports Adobe PDF (.pdf) documents up to 15 MB · Local text extraction without external data sharing
              </p>
            </div>

            {!isProcessing && (
              <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold bg-wine-100 text-wine-900 border border-wine-200">
                Browse Files on Device
              </span>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-xs text-rose-950 flex items-start space-x-3">
            <XCircle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="block font-bold">Extraction Failed</strong>
              <p>{errorMessage}</p>
              <p className="text-[11px] text-rose-800">
                Please verify that the file is an uncorrupted PDF containing searchable text (not purely scanned images).
              </p>
            </div>
          </div>
        )}

        {/* Active Uploaded Document Status Card */}
        {document && (
          <div className="bg-cream-100/70 rounded-2xl p-4 sm:p-5 border border-cream-300 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-xl bg-wine-900 text-white flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6 text-pastel-butter" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold text-wine-950 truncate max-w-sm" title={document.fileName}>
                    {document.fileName}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Active Brand Kit
                  </span>
                </div>
                <div className="text-[11px] text-ink-muted mt-0.5 flex flex-wrap gap-x-3 gap-y-1">
                  <span>{(document.fileSize / 1024).toFixed(1)} KB</span>
                  <span>·</span>
                  <span>{document.pageCount} {document.pageCount === 1 ? 'page' : 'pages'}</span>
                  <span>·</span>
                  <span>{document.totalWordCount.toLocaleString()} words</span>
                  <span>·</span>
                  <span>{document.summary.totalRules} rules categorized</span>
                  <span>·</span>
                  <span>Uploaded {new Date(document.uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>

            {/* Action to Jump to Content Audit */}
            {onNavigateToAudit && (
              <button
                onClick={onNavigateToAudit}
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-full bg-wine-900 hover:bg-wine-800 text-white font-semibold text-xs transition shadow-sm self-start md:self-auto shrink-0"
              >
                <span>Audit Content with this PDF</span>
                <ArrowRight className="w-3.5 h-3.5 text-pastel-butter" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Extracted Guidelines Viewer */}
      {document && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-cream-300 shadow-sm space-y-6">
          {/* View Mode Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-cream-200">
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar">
              <button
                onClick={() => setActiveTab('categories')}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition ${
                  activeTab === 'categories'
                    ? 'bg-wine-900 text-white shadow-xs'
                    : 'bg-cream-100 text-ink-secondary hover:bg-cream-200'
                }`}
              >
                🗂️ Categories Overview ({document.summary.totalRules})
              </button>
              <button
                onClick={() => setActiveTab('search')}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition ${
                  activeTab === 'search'
                    ? 'bg-wine-900 text-white shadow-xs'
                    : 'bg-cream-100 text-ink-secondary hover:bg-cream-200'
                }`}
              >
                🔍 Search Guidelines {searchQuery && `(${searchResults.length})`}
              </button>
              <button
                onClick={() => setActiveTab('rules')}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition ${
                  activeTab === 'rules'
                    ? 'bg-wine-900 text-white shadow-xs'
                    : 'bg-cream-100 text-ink-secondary hover:bg-cream-200'
                }`}
              >
                📋 All Extracted Rules ({document.guidelines.length})
              </button>
              <button
                onClick={() => setActiveTab('raw_text')}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition ${
                  activeTab === 'raw_text'
                    ? 'bg-wine-900 text-white shadow-xs'
                    : 'bg-cream-100 text-ink-secondary hover:bg-cream-200'
                }`}
              >
                📄 Full Extracted Document ({document.pageCount} Pages)
              </button>
            </div>

            <span className="text-xs text-ink-muted">
              Document ID: <code className="font-mono bg-cream-100 px-1.5 py-0.5 rounded text-[10px]">{document.id}</code>
            </span>
          </div>

          {/* TAB 1: CATEGORIES OVERVIEW */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoriesList.map(cat => (
                  <div
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategoryFilter(cat.id);
                      setActiveTab('search');
                    }}
                    className="p-5 rounded-2xl border border-cream-300 bg-cream-50/50 hover:bg-white hover:border-wine-300 transition-all cursor-pointer flex flex-col justify-between group shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xl">{cat.icon}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${
                          cat.count > 0 ? 'bg-wine-100 text-wine-900' : 'bg-cream-200 text-ink-muted'
                        }`}>
                          {cat.count} {cat.count === 1 ? 'rule' : 'rules'}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-wine-950 font-display group-hover:text-wine-800 transition">
                        {cat.label}
                      </h3>
                      <p className="text-xs text-ink-secondary mt-1 leading-relaxed">
                        {cat.desc}
                      </p>
                    </div>

                    <div className="pt-3 mt-3 border-t border-cream-200 flex items-center justify-between text-xs text-wine-900 font-semibold">
                      <span>View Category Rules</span>
                      <span>→</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Sample Extracted Rules Preview */}
              <div className="bg-cream-50/70 p-5 rounded-2xl border border-cream-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-ink-secondary flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span>Top Rules Active in Compliance Engine</span>
                  </h4>
                  <button
                    onClick={() => setActiveTab('rules')}
                    className="text-xs font-semibold text-wine-800 hover:underline"
                  >
                    View all {document.guidelines.length} rules →
                  </button>
                </div>

                <div className="space-y-2">
                  {document.guidelines.slice(0, 4).map(rule => (
                    <div
                      key={rule.id}
                      onClick={() => setSelectedRule(rule)}
                      className="p-3 rounded-xl bg-white border border-cream-300 hover:border-wine-300 transition cursor-pointer flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-wine-900">{rule.id}</span>
                          <span className="font-semibold text-ink-primary">{rule.title}</span>
                          <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold uppercase ${
                            rule.severity === 'Strict' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {rule.severity}
                          </span>
                        </div>
                        <p className="text-ink-secondary line-clamp-1">{rule.ruleText}</p>
                      </div>

                      <span className="text-[10px] text-ink-muted shrink-0 font-mono">
                        Page {rule.pageNumber}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SEARCH GUIDELINES (Requirement 5) */}
          {activeTab === 'search' && (
            <div className="space-y-5">
              {/* Search Bar & Filter Controls */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search extracted brand rules by keyword (e.g. 'cheap', 'uptime', 'contrast', 'disclaimer', 'logo')..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-cream-50/80 rounded-full border border-cream-300 focus:outline-none focus:border-wine-800 focus:bg-white transition-all text-ink-primary"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-ink-muted hover:text-wine-900"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Category Filter Pills */}
                <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                  <span className="text-[11px] font-mono text-ink-muted uppercase mr-1 shrink-0">Filter:</span>
                  {[
                    { id: 'all', label: 'All Categories' },
                    { id: 'prohibited_claims', label: 'Prohibited' },
                    { id: 'approved_claims', label: 'Approved Claims' },
                    { id: 'required_disclaimers', label: 'Disclaimers' },
                    { id: 'tone_of_voice', label: 'Tone' },
                    { id: 'terminology', label: 'Terminology' },
                    { id: 'visual_accessibility', label: 'Visual' }
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => setSelectedCategoryFilter(f.id)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                        selectedCategoryFilter === f.id
                          ? 'bg-wine-900 text-white shadow-2xs'
                          : 'bg-cream-100 text-ink-secondary hover:bg-cream-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Results Count Bar */}
              <div className="flex items-center justify-between text-xs text-ink-muted px-1">
                <span>
                  Showing <strong>{searchResults.length}</strong> matching results grounded in <strong>{document.fileName}</strong>
                </span>
                {(searchQuery || selectedCategoryFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategoryFilter('all');
                    }}
                    className="text-wine-800 font-semibold hover:underline"
                  >
                    Reset Search & Filters
                  </button>
                )}
              </div>

              {/* Results List */}
              {searchResults.length === 0 ? (
                <div className="text-center py-12 bg-cream-50/50 rounded-2xl border border-cream-200 space-y-2">
                  <BookOpen className="w-8 h-8 text-ink-muted mx-auto opacity-50" />
                  <p className="text-sm font-bold text-wine-950 font-display">
                    No matching guidelines found for &quot;{searchQuery}&quot;
                  </p>
                  <p className="text-xs text-ink-secondary max-w-sm mx-auto">
                    Search is grounded strictly in the extracted document content. Try searching for terms like &quot;uptime&quot;, &quot;trial&quot;, &quot;prohibited&quot;, &quot;contrast&quot;, or &quot;disclaimer&quot;.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {searchResults.map(result => {
                    if (result.type === 'rule' && result.rule) {
                      const r = result.rule;
                      return (
                        <div
                          key={result.id}
                          onClick={() => setSelectedRule(r)}
                          className="p-4 rounded-xl border border-cream-300 bg-white hover:border-wine-300 transition-all cursor-pointer shadow-2xs space-y-2"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono font-bold text-wine-900 text-xs bg-cream-100 px-2 py-0.5 rounded">
                                {r.id}
                              </span>
                              <span className="text-xs font-mono text-ink-muted uppercase">
                                [{r.categoryLabel}]
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                r.severity === 'Strict'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : 'bg-amber-100 text-amber-800 border border-amber-200'
                              }`}>
                                {r.severity}
                              </span>
                            </div>

                            <span className="text-[11px] font-mono text-ink-muted">
                              Page {r.pageNumber}
                            </span>
                          </div>

                          <h4 className="text-sm font-bold text-wine-950 font-display">
                            {r.title}
                          </h4>

                          <p className="text-xs text-ink-secondary leading-relaxed">
                            {r.ruleText}
                          </p>

                          {r.suggestedReplacement && (
                            <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-200 text-xs text-emerald-950 flex items-center space-x-1.5">
                              <span className="font-bold">Recommended alternative:</span>
                              <code className="bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded font-mono font-semibold">
                                {r.suggestedReplacement}
                              </code>
                            </div>
                          )}
                        </div>
                      );
                    }

                    // Text excerpt result
                    return (
                      <div
                        key={result.id}
                        className="p-3.5 rounded-xl border border-cream-200 bg-cream-50/70 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-ink-muted">
                          <span className="font-semibold text-wine-900 flex items-center gap-1">
                            <span>📄 Text Context Match</span>
                          </span>
                          <span className="font-mono text-[10px]">Page {result.pageNumber}</span>
                        </div>
                        <p className="text-ink-secondary italic leading-relaxed">
                          &quot;{result.excerpt}&quot;
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ALL EXTRACTED RULES */}
          {activeTab === 'rules' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-ink-muted">
                <span>All {document.guidelines.length} structured rules parsed from {document.fileName}</span>
                <span className="text-[11px]">Click any rule to examine full specification</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {document.guidelines.map(rule => (
                  <div
                    key={rule.id}
                    onClick={() => setSelectedRule(rule)}
                    className="p-4 rounded-2xl border border-cream-300 bg-white hover:border-wine-300 transition-all cursor-pointer shadow-2xs flex flex-col justify-between group space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono font-bold text-wine-900 bg-cream-100 px-2 py-0.5 rounded">
                          {rule.id}
                        </span>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[10px] font-mono text-ink-muted">
                            [{rule.categoryLabel}]
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            rule.severity === 'Strict' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {rule.severity}
                          </span>
                        </div>
                      </div>

                      <h4 className="text-sm font-bold text-wine-950 font-display group-hover:text-wine-800 transition">
                        {rule.title}
                      </h4>

                      <p className="text-xs text-ink-secondary mt-1 line-clamp-3 leading-relaxed">
                        {rule.ruleText}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-cream-200 flex items-center justify-between text-[11px] text-ink-muted">
                      <span>Source: Page {rule.pageNumber}</span>
                      <span className="font-semibold text-wine-900 group-hover:underline">
                        View Details →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: RAW EXTRACTED DOCUMENT TEXT */}
          {activeTab === 'raw_text' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-cream-100 text-xs text-ink-secondary flex items-center space-x-2">
                <Info className="w-4 h-4 text-wine-800 shrink-0" />
                <span>
                  Complete raw text parsed page-by-page. Information is preserved in its original sequence to ensure zero data loss.
                </span>
              </div>

              <div className="space-y-4">
                {document.pages.map(page => (
                  <div key={page.pageNumber} className="border border-cream-300 rounded-2xl p-4 bg-white space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-wine-900 pb-2 border-b border-cream-200">
                      <span>Page {page.pageNumber} of {document.pageCount}</span>
                      <span className="font-mono text-ink-muted text-[11px]">
                        {page.wordCount} words · {page.characterCount} chars
                      </span>
                    </div>
                    <pre className="text-xs font-mono text-ink-primary whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto p-3 bg-cream-50/60 rounded-xl">
                      {page.text}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rule Detail Modal */}
      {selectedRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-cream-300 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-cream-200">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold text-wine-900 bg-cream-100 px-2.5 py-1 rounded">
                  {selectedRule.id}
                </span>
                <span className="text-xs font-mono text-ink-muted">
                  [{selectedRule.categoryLabel}]
                </span>
              </div>
              <button
                onClick={() => setSelectedRule(null)}
                className="text-ink-muted hover:text-wine-900 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                selectedRule.severity === 'Strict' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {selectedRule.severity} Enforcement
              </span>
              <h3 className="text-base font-bold text-wine-950 font-display mt-2">
                {selectedRule.title}
              </h3>
            </div>

            <div className="p-4 rounded-xl bg-cream-50 border border-cream-200 text-xs text-ink-primary leading-relaxed font-sans">
              {selectedRule.ruleText}
            </div>

            {selectedRule.suggestedReplacement && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-1">
                <span className="font-bold text-[11px] block uppercase text-emerald-800">
                  Approved Phrasing / Replacement:
                </span>
                <code className="font-mono font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded inline-block">
                  {selectedRule.suggestedReplacement}
                </code>
              </div>
            )}

            <div className="pt-3 border-t border-cream-200 flex items-center justify-between text-xs text-ink-muted">
              <span>Source: {selectedRule.source}</span>
              <button
                onClick={() => setSelectedRule(null)}
                className="px-4 py-1.5 rounded-full bg-wine-900 text-white font-semibold text-xs hover:bg-wine-800 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
