import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  RotateCcw,
  Check,
  AlertTriangle,
  BookOpen
} from 'lucide-react';
import {
  getTerminology,
  getPreferredTerms,
  getProhibitedTerms,
  generateUniqueTerminologyId,
  addTerminology,
  updateTerminology,
  deleteTerminology,
  resetTerminologyToDefault,
  checkTerminologyCompliance,
} from '../services/brandDataService';
import Modal from './Modal';

export default function Terminology() {
  const [termsData, setTermsData] = useState({ all: [], preferred: [], prohibited: [] });
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'preferred', 'prohibited'
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Active items
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);

  // Notifications
  const [toastMessage, setToastMessage] = useState('');

  // Scanner state (Dictionary demonstration tool)
  const [scannerText, setScannerText] = useState('');
  const [scannerResult, setScannerResult] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    id: '',
    term: '',
    type: 'preferred',
    replacementTerm: '',
    reason: '',
    status: 'Active',
    category: 'Product Performance',
  });

  // Validation Error State
  const [errors, setErrors] = useState({});

  const refreshData = () => {
    setTermsData(getTerminology());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Open Add Modal
  const handleOpenAdd = (defaultType = 'preferred') => {
    const uniqueId = generateUniqueTerminologyId();
    setEditingItem(null);
    setFormData({
      id: uniqueId,
      term: '',
      type: defaultType,
      replacementTerm: '',
      reason: '',
      status: 'Active',
      category: 'Product Performance',
    });
    setErrors({});
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      id: item.id,
      term: item.term,
      type: item.type,
      replacementTerm: item.replacementTerm || '',
      reason: item.reason || item.rationale || '',
      status: item.status || 'Active',
      category: item.category || 'General',
    });
    setErrors({});
    setIsFormModalOpen(true);
  };

  // Open Delete Confirmation Modal
  const handleOpenDelete = (item) => {
    setDeletingItem(item);
    setIsDeleteModalOpen(true);
  };

  // Field change handler
  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  // Form Validation
  const validateForm = () => {
    const newErrors = {};
    const cleanTerm = formData.term?.trim();
    if (!cleanTerm) {
      newErrors.term = 'Term text is required.';
    }
    if (!formData.reason?.trim()) {
      newErrors.reason = 'Reason or explanation is required.';
    }
    if (!formData.id?.trim()) {
      newErrors.id = 'Term ID is required.';
    }

    // Duplicate & Conflict checks on client before submit
    if (cleanTerm) {
      const normalized = cleanTerm.toLowerCase();
      const targetType = formData.type;
      const oppositeType = targetType === 'preferred' ? 'prohibited' : 'preferred';

      // Check duplicate in same type
      const isDuplicate = termsData.all.some(
        (t) => (!editingItem || t.id !== editingItem.id) &&
               t.term.trim().toLowerCase() === normalized &&
               t.type === targetType
      );
      if (isDuplicate) {
        newErrors.term = `"${cleanTerm}" is already registered in the ${targetType} list.`;
      }

      // Check cross-conflict (cannot be both preferred and prohibited)
      const isConflict = termsData.all.some(
        (t) => (!editingItem || t.id !== editingItem.id) &&
               t.term.trim().toLowerCase() === normalized &&
               t.type === oppositeType
      );
      if (isConflict) {
        newErrors.term = `Conflict: "${cleanTerm}" is already registered as a ${oppositeType} term. A term cannot be both preferred and prohibited.`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form Submit
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (editingItem) {
      const res = updateTerminology(editingItem.id, formData);
      if (!res.success) {
        setErrors({ general: res.error });
        return;
      }
      showToast('Terminology entry updated successfully!');
    } else {
      const res = addTerminology(formData);
      if (!res.success) {
        setErrors({ general: res.error });
        return;
      }
      showToast('New terminology entry added to dictionary!');
    }

    setIsFormModalOpen(false);
    refreshData();
    if (scannerText) handleScan(scannerText);
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (!deletingItem) return;
    deleteTerminology(deletingItem.id);
    setIsDeleteModalOpen(false);
    setDeletingItem(null);
    refreshData();
    if (scannerText) handleScan(scannerText);
    showToast('Terminology entry deleted.');
  };

  // Reset to Sample Terms
  const handleResetToDefault = () => {
    if (window.confirm('Reset terminology dictionary back to predefined NovaTech sample entries?')) {
      resetTerminologyToDefault();
      refreshData();
      if (scannerText) handleScan(scannerText);
      showToast('Restored predefined sample terminology.');
    }
  };

  // Scanner handler
  const handleScan = (text) => {
    setScannerText(text);
    if (!text.trim()) {
      setScannerResult(null);
      return;
    }
    const result = checkTerminologyCompliance(text);
    setScannerResult(result);
  };

  const loadSampleText = () => {
    const sample = "Our platform offers guaranteed results with 100% success, making us No. 1 without evidence.";
    handleScan(sample);
  };

  // Filtered terms
  const displayedTerms = termsData.all.filter((item) => {
    if (activeTab !== 'all' && item.type !== activeTab) return false;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;

    return (
      item.term.toLowerCase().includes(q) ||
      (item.replacementTerm && item.replacementTerm.toLowerCase().includes(q)) ||
      (item.reason && item.reason.toLowerCase().includes(q)) ||
      (item.category && item.category.toLowerCase().includes(q)) ||
      item.id.toLowerCase().includes(q)
    );
  });

  return (
    <section id="terminology" className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <span className="text-xs font-bold tracking-widest uppercase text-wine-800 bg-wine-100 px-3.5 py-1 rounded-full border border-wine-200">
            Section 04 • Terminology
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-wine-950 font-display">
            Preferred & Prohibited Terminology
          </h2>
          <p className="mt-2 text-ink-secondary text-sm max-w-2xl">
            Controlled brand vocabulary to maintain professional, trustworthy communication. Prevents conflicting or duplicate brand terms.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <button
            onClick={handleResetToDefault}
            title="Restore original predefined sample terminology"
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-full bg-white text-ink-secondary hover:text-wine-950 border border-cream-300 text-xs font-semibold shadow-xs transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-ink-muted" />
            <span>Reset Samples</span>
          </button>

          <button
            onClick={() => handleOpenAdd('preferred')}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full bg-emerald-800 text-white font-semibold text-xs hover:bg-emerald-900 transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Preferred</span>
          </button>

          <button
            onClick={() => handleOpenAdd('prohibited')}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full bg-rose-800 text-white font-semibold text-xs hover:bg-rose-900 transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Prohibited</span>
          </button>
        </div>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="mb-6 p-3.5 rounded-2xl bg-pastel-sage/90 border border-emerald-300 text-xs font-semibold text-emerald-950 flex items-center space-x-2 animate-fadeIn shadow-xs">
          <Check className="w-4 h-4 text-emerald-800 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Lexicon Scanner Tool Box (Helper Dictionary Scanner) */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-cream-300 shadow-sm mb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-wine-800" />
            <h3 className="text-base font-bold text-wine-950 font-display">
              Brand Lexicon Scanner
            </h3>
          </div>
          <div className="flex items-center space-x-2 mt-2 sm:mt-0">
            <button
              onClick={loadSampleText}
              className="text-xs font-semibold px-3 py-1 rounded-full bg-cream-100 text-wine-900 border border-cream-300 hover:bg-cream-200 transition-all"
            >
              Load Sample Text
            </button>
            {scannerText && (
              <button
                onClick={() => handleScan('')}
                className="text-xs text-ink-muted hover:text-ink-primary"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <textarea
          rows={2}
          value={scannerText}
          onChange={(e) => handleScan(e.target.value)}
          placeholder="Paste or type sample copy to check against prohibited terminology rules..."
          className="w-full p-3.5 rounded-2xl bg-cream-100/70 border border-cream-300 text-xs text-ink-primary focus:outline-none focus:border-wine-800 focus:bg-white transition-all placeholder:text-ink-muted"
        />

        {scannerResult && (
          <div className="mt-3 pt-3 border-t border-cream-200">
            {scannerResult.isCompliant ? (
              <div className="flex items-center space-x-2 p-3 rounded-xl bg-pastel-sage/50 text-emerald-950 border border-emerald-300 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-800 flex-shrink-0" />
                <span className="font-semibold">
                  Brand Compliant: No prohibited terms found in this draft text.
                </span>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-pastel-rose/40 border border-rose-300 text-xs space-y-2.5">
                <div className="flex items-center space-x-2 text-rose-900 font-bold">
                  <AlertCircle className="w-4 h-4 text-rose-700 flex-shrink-0" />
                  <span>
                    Detected {scannerResult.matches.length} prohibited term(s) in your copy:
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {scannerResult.matches.map((m, idx) => (
                    <div key={idx} className="bg-white/90 p-3 rounded-xl border border-rose-200 shadow-2xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="line-through font-bold text-rose-900">
                          "{m.foundWord}"
                        </span>
                        <span className="text-[10px] font-mono text-rose-800 uppercase font-semibold">
                          Prohibited
                        </span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-emerald-950 font-bold text-xs mt-1">
                        <ArrowRight className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
                        <span>Recommended: “{m.replacement}”</span>
                      </div>
                      <p className="text-[11px] text-ink-secondary mt-1">
                        Why: {m.reason}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lexicon Search & Filter Tabs */}
      <div className="bg-white rounded-3xl p-5 border border-cream-300 shadow-sm mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search terms, replacements, reasons, or categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-cream-100/70 rounded-full border border-cream-300 focus:outline-none focus:border-wine-800 focus:bg-white transition-all placeholder:text-ink-muted"
            />
          </div>

          {/* Filter Tabs (Requirement 6 & 7) */}
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTab === 'all'
                  ? 'bg-wine-900 text-white'
                  : 'bg-cream-100 text-ink-secondary hover:bg-cream-200'
              }`}
            >
              All Lexicon ({termsData.all.length})
            </button>
            <button
              onClick={() => setActiveTab('preferred')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTab === 'preferred'
                  ? 'bg-emerald-800 text-white'
                  : 'bg-cream-100 text-ink-secondary hover:bg-cream-200'
              }`}
            >
              Preferred ({termsData.preferred.length})
            </button>
            <button
              onClick={() => setActiveTab('prohibited')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTab === 'prohibited'
                  ? 'bg-rose-800 text-white'
                  : 'bg-cream-100 text-ink-secondary hover:bg-cream-200'
              }`}
            >
              Prohibited ({termsData.prohibited.length})
            </button>
          </div>
        </div>
      </div>

      {/* Terminology Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {displayedTerms.map((item) => {
          const isPreferred = item.type === 'preferred';

          return (
            <div
              key={item.id}
              className={`rounded-3xl p-7 border shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
                isPreferred
                  ? 'bg-pastel-sage/35 border-emerald-300/80 hover:bg-pastel-sage/50'
                  : 'bg-pastel-rose/35 border-rose-300/80 hover:bg-pastel-rose/50'
              }`}
            >
              <div>
                {/* Badges Bar */}
                <div className="flex items-center justify-between mb-3.5">
                  <span className="text-xs font-mono font-semibold text-wine-900 bg-white/70 px-2.5 py-0.5 rounded-full border border-black/5">
                    [{item.category || 'General'}]
                  </span>

                  <div className="flex items-center space-x-1.5">
                    <span
                      className={`inline-flex items-center space-x-1 text-[10px] font-mono uppercase font-bold px-2.5 py-0.5 rounded-full ${
                        isPreferred
                          ? 'bg-emerald-200 text-emerald-950 border border-emerald-300'
                          : 'bg-rose-200 text-rose-950 border border-rose-300'
                      }`}
                    >
                      {isPreferred ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-800" />
                          <span>Preferred</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 text-rose-800" />
                          <span>Prohibited</span>
                        </>
                      )}
                    </span>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-white/80 text-ink-secondary border border-black/5">
                      {item.status || 'Active'}
                    </span>
                  </div>
                </div>

                {/* Primary Term Word */}
                <div className="mb-3">
                  <h3
                    className={`text-xl sm:text-2xl font-bold font-display leading-snug ${
                      isPreferred ? 'text-emerald-950' : 'text-rose-950 line-through'
                    }`}
                  >
                    “{item.term}”
                  </h3>
                </div>

                {/* Replacement Term Block for Prohibited Words (Requirement 11) */}
                {!isPreferred && item.replacementTerm && (
                  <div className="mb-4 p-3 rounded-2xl bg-white/80 border border-emerald-300/60 flex items-center space-x-2">
                    <ArrowRight className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                    <div>
                      <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-900 font-bold block">
                        Approved Alternative
                      </span>
                      <span className="text-sm font-bold text-emerald-950">
                        “{item.replacementTerm}”
                      </span>
                    </div>
                  </div>
                )}

                {/* Strategic Reason (Requirement 12) */}
                <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed mb-4">
                  <strong className="text-ink-primary font-semibold">Strategic Reason: </strong>
                  {item.reason || item.rationale}
                </p>
              </div>

              {/* Bottom Actions & ID */}
              <div className="pt-3 border-t border-black/5 flex items-center justify-between text-xs mt-2">
                <span className="font-mono text-[11px] text-ink-muted">
                  ID: {item.id}
                </span>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleOpenEdit(item)}
                    aria-label="Edit term"
                    title="Edit Term"
                    className="p-1.5 rounded-full text-ink-secondary hover:text-wine-950 hover:bg-white/80 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleOpenDelete(item)}
                    aria-label="Delete term"
                    title="Delete Term"
                    className="p-1.5 rounded-full text-ink-secondary hover:text-rose-700 hover:bg-rose-100 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {displayedTerms.length === 0 && (
        <div className="text-center py-12 bg-white rounded-3xl border border-cream-300">
          <BookOpen className="w-8 h-8 text-ink-muted mx-auto mb-2 opacity-50" />
          <p className="text-sm font-semibold text-wine-950">No terminology entries found.</p>
          <button
            onClick={() => {
              setActiveTab('all');
              setSearchQuery('');
            }}
            className="mt-2 text-xs font-semibold text-wine-800 underline"
          >
            Show All Lexicon
          </button>
        </div>
      )}

      {/* 1. Add / Edit Term Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingItem ? 'Edit Terminology Rule' : 'Add Terminology Entry'}
        subtitle="Saved to localStorage with duplicate prevention and conflict validation."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.general && (
            <div className="p-3 rounded-xl bg-rose-100 text-rose-900 border border-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errors.general}</span>
            </div>
          )}

          {/* Unique ID */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-wine-950">
                Term ID <span className="text-rose-600">*</span>
              </label>
              <span className="text-[10px] font-mono text-ink-muted">
                (Unique identifier)
              </span>
            </div>
            <input
              type="text"
              value={formData.id}
              disabled={!!editingItem}
              onChange={(e) => handleFieldChange('id', e.target.value)}
              className={`w-full px-3.5 py-2 text-sm font-mono rounded-xl border focus:outline-none transition-all ${
                editingItem ? 'bg-cream-200/80 text-ink-muted cursor-not-allowed border-cream-300' : 'bg-white'
              } ${errors.id ? 'border-rose-400 bg-rose-50/30' : 'border-cream-300 focus:border-wine-800'}`}
              required
            />
            {errors.id && <p className="text-[11px] text-rose-600 mt-1">{errors.id}</p>}
          </div>

          {/* Term Word/Phrase */}
          <div>
            <label className="block text-xs font-bold text-wine-950 mb-1">
              Term Word or Phrase <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Reliable, Affordable, or Guaranteed results"
              value={formData.term}
              onChange={(e) => handleFieldChange('term', e.target.value)}
              className={`w-full px-3.5 py-2 text-sm bg-white rounded-xl border focus:outline-none transition-all ${
                errors.term ? 'border-rose-400 bg-rose-50/30' : 'border-cream-300 focus:border-wine-800'
              }`}
            />
            {errors.term && <p className="text-[11px] text-rose-600 mt-1">{errors.term}</p>}
          </div>

          {/* Type & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-wine-950 mb-1">
                Classification Type <span className="text-rose-600">*</span>
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleFieldChange('type', e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-cream-300 focus:outline-none focus:border-wine-800"
              >
                <option value="preferred">Preferred (Approved to Use)</option>
                <option value="prohibited">Prohibited (Do Not Use)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-wine-950 mb-1">
                Status <span className="text-rose-600">*</span>
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleFieldChange('status', e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-cream-300 focus:outline-none focus:border-wine-800"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Replacement Term (Especially for prohibited terms) */}
          <div>
            <label className="block text-xs font-bold text-wine-950 mb-1">
              Replacement Term (Recommended alternative for prohibited terms)
            </label>
            <input
              type="text"
              placeholder="e.g. Predictable outcomes, High reliability"
              value={formData.replacementTerm}
              onChange={(e) => handleFieldChange('replacementTerm', e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white rounded-xl border border-cream-300 focus:outline-none focus:border-wine-800"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-wine-950 mb-1">
              Category
            </label>
            <input
              type="text"
              placeholder="e.g. Product Performance, Pricing & Value, Marketing Claims"
              value={formData.category}
              onChange={(e) => handleFieldChange('category', e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white rounded-xl border border-cream-300 focus:outline-none focus:border-wine-800"
            />
          </div>

          {/* Reason or Explanation */}
          <div>
            <label className="block text-xs font-bold text-wine-950 mb-1">
              Reason or Explanation <span className="text-rose-600">*</span>
            </label>
            <textarea
              rows={2}
              placeholder="Explain why this term is encouraged or prohibited..."
              value={formData.reason}
              onChange={(e) => handleFieldChange('reason', e.target.value)}
              className={`w-full px-3.5 py-2 text-sm bg-white rounded-xl border focus:outline-none transition-all ${
                errors.reason ? 'border-rose-400 bg-rose-50/30' : 'border-cream-300 focus:border-wine-800'
              }`}
            />
            {errors.reason && <p className="text-[11px] text-rose-600 mt-1">{errors.reason}</p>}
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-cream-300 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsFormModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-ink-secondary hover:text-ink-primary rounded-full transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-wine-900 hover:bg-wine-800 rounded-full shadow-sm active:scale-95 transition-all"
            >
              {editingItem ? 'Save Updates' : 'Add Term'}
            </button>
          </div>
        </form>
      </Modal>

      {/* 2. Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingItem(null);
        }}
        title="Confirm Delete Term"
        subtitle="This action will permanently remove the entry from the terminology dictionary."
      >
        {deletingItem && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-950">
              <div className="flex items-center space-x-2 font-bold mb-1 text-rose-900">
                <AlertTriangle className="w-4 h-4 text-rose-700 flex-shrink-0" />
                <span>Are you sure you want to delete this terminology entry?</span>
              </div>
              <p className="mt-2 font-semibold text-wine-950 text-sm">
                “{deletingItem.term}” ({deletingItem.type} term)
              </p>
              <p className="mt-1 font-mono text-[11px] text-ink-muted">
                ID: {deletingItem.id} • Category: {deletingItem.category}
              </p>
            </div>

            <div className="pt-3 border-t border-cream-300 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeletingItem(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-ink-secondary hover:text-ink-primary rounded-full transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 text-xs font-semibold text-white bg-rose-800 hover:bg-rose-900 rounded-full shadow-sm transition-colors"
              >
                Delete Term
              </button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}
