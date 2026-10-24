import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  Check,
  AlertCircle,
  Copy,
  RotateCcw,
  BookOpen,
  Tag,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import {
  getBrandGuidelines,
  getGuidelineById,
  generateUniqueGuidelineId,
  addGuideline,
  updateGuideline,
  deleteGuideline,
  resetGuidelinesToDefault,
} from '../services/brandDataService';
import Modal from './Modal';

export default function BrandGuidelines() {
  const [guidelines, setGuidelines] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Active items
  const [editingItem, setEditingItem] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);

  // Toast notice
  const [toastMessage, setToastMessage] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    description: '',
    category: 'Marketing',
    severity: 'Strict',
    status: 'Active',
    source: 'NovaTech Brand Governance',
  });

  // Form Validation Errors State
  const [errors, setErrors] = useState({});

  const refreshData = () => {
    setGuidelines(getBrandGuidelines());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const categories = ['all', 'Marketing', 'Content', 'Compliance', 'Product', 'General'];
  const severities = ['all', 'Strict', 'Recommended', 'Optional'];
  const statuses = ['all', 'Active', 'Draft', 'Archived'];

  // Filtered guidelines
  const filteredGuidelines = guidelines.filter((item) => {
    const matchesCategory =
      selectedCategory === 'all' ||
      item.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSeverity =
      selectedSeverity === 'all' ||
      item.severity.toLowerCase() === selectedSeverity.toLowerCase();
    const matchesStatus =
      selectedStatus === 'all' ||
      item.status.toLowerCase() === selectedStatus.toLowerCase();

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.source.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q);

    return matchesCategory && matchesSeverity && matchesStatus && matchesSearch;
  });

  // Open Add Modal with newly generated unique ID
  const handleOpenAdd = () => {
    const uniqueId = generateUniqueGuidelineId();
    setEditingItem(null);
    setFormData({
      id: uniqueId,
      title: '',
      description: '',
      category: 'Marketing',
      severity: 'Strict',
      status: 'Active',
      source: 'NovaTech Brand Governance',
    });
    setErrors({});
    setIsFormModalOpen(true);
  };

  // Open Edit Modal with existing item data
  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      id: item.id,
      title: item.title,
      description: item.description,
      category: item.category,
      severity: item.severity,
      status: item.status,
      source: item.source,
    });
    setErrors({});
    setIsFormModalOpen(true);
  };

  // Open Details Modal
  const handleOpenDetails = (item) => {
    setSelectedItem(item);
    setIsDetailModalOpen(true);
  };

  // Open Delete Confirmation
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
    if (!formData.title?.trim()) {
      newErrors.title = 'Guideline title is required.';
    }
    if (!formData.description?.trim()) {
      newErrors.description = 'Rule description is required.';
    }
    if (!formData.source?.trim()) {
      newErrors.source = 'Source document / authority is required.';
    }
    if (!formData.id?.trim()) {
      newErrors.id = 'Guideline ID is required.';
    } else if (!editingItem) {
      // Check for duplicate ID on Add
      const isDuplicate = guidelines.some(
        (g) => g.id.toLowerCase() === formData.id.trim().toLowerCase()
      );
      if (isDuplicate) {
        newErrors.id = `ID "${formData.id.trim()}" already exists. Please choose a unique ID.`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit Handler (Add or Edit)
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (editingItem) {
      const res = updateGuideline(editingItem.id, formData);
      if (!res.success) {
        setErrors({ general: res.error });
        return;
      }
      showToast('Brand guideline updated successfully!');
    } else {
      const res = addGuideline(formData);
      if (!res.success) {
        setErrors({ general: res.error });
        return;
      }
      showToast('New brand guideline added to registry!');
    }

    setIsFormModalOpen(false);
    refreshData();
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (!deletingItem) return;
    deleteGuideline(deletingItem.id);
    setIsDeleteModalOpen(false);
    setDeletingItem(null);
    if (selectedItem?.id === deletingItem.id) {
      setIsDetailModalOpen(false);
      setSelectedItem(null);
    }
    refreshData();
    showToast('Guideline deleted successfully.');
  };

  // Reset to Sample Guidelines
  const handleResetToDefault = () => {
    if (window.confirm('Reset all guidelines back to the predefined NovaTech sample guidelines?')) {
      resetGuidelinesToDefault();
      refreshData();
      showToast('Restored predefined sample guidelines.');
    }
  };

  // Copy ID helper
  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <section id="brand-guidelines" className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <span className="text-xs font-bold tracking-widest uppercase text-wine-800 bg-wine-100 px-3.5 py-1 rounded-full border border-wine-200">
            Section 02 • Brand Guidelines
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-wine-950 font-display">
            Brand Rules & Compliance Policies
          </h2>
          <p className="mt-2 text-ink-secondary text-sm max-w-2xl">
            Structured rules governing marketing claims, tone of voice, and product boundaries for NovaTech. Changes are stored in localStorage.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 self-start md:self-auto">
          <button
            onClick={handleResetToDefault}
            title="Restore original predefined sample guidelines"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 rounded-full bg-white text-ink-secondary hover:text-wine-950 border border-cream-300 text-xs font-semibold shadow-xs transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-ink-muted" />
            <span>Reset Samples</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full bg-wine-900 text-white font-semibold text-xs hover:bg-wine-800 transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Guideline</span>
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

      {/* Search & Comprehensive Filters Bar */}
      <div className="bg-white rounded-3xl p-5 border border-cream-300 shadow-sm mb-8 space-y-4">
        {/* Top: Live Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search guidelines by title, description, category, source, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-cream-100/70 rounded-full border border-cream-300 focus:outline-none focus:border-wine-800 focus:bg-white transition-all placeholder:text-ink-muted"
          />
        </div>

        {/* Bottom: Filter Pills for Category, Severity, and Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-2 border-t border-cream-200">
          {/* Category Filter */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar">
            <span className="text-[11px] font-mono text-ink-muted uppercase mr-1 flex-shrink-0">
              Category:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory.toLowerCase() === cat.toLowerCase()
                    ? 'bg-wine-900 text-white'
                    : 'bg-cream-100 text-ink-secondary hover:bg-cream-200'
                }`}
              >
                {cat === 'all' ? 'All' : cat}
              </button>
            ))}
          </div>

          {/* Severity Filter */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar">
            <span className="text-[11px] font-mono text-ink-muted uppercase mr-1 flex-shrink-0">
              Severity:
            </span>
            {severities.map((sev) => (
              <button
                key={sev}
                onClick={() => setSelectedSeverity(sev)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedSeverity.toLowerCase() === sev.toLowerCase()
                    ? 'bg-wine-800 text-white'
                    : 'bg-cream-100 text-ink-secondary hover:bg-cream-200'
                }`}
              >
                {sev === 'all' ? 'All' : sev}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar">
            <span className="text-[11px] font-mono text-ink-muted uppercase mr-1 flex-shrink-0">
              Status:
            </span>
            {statuses.map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedStatus.toLowerCase() === st.toLowerCase()
                    ? 'bg-wine-950 text-white'
                    : 'bg-cream-100 text-ink-secondary hover:bg-cream-200'
                }`}
              >
                {st === 'all' ? 'All' : st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Header Count */}
      <div className="flex items-center justify-between text-xs text-ink-muted mb-4 px-2">
        <span>
          Showing <strong>{filteredGuidelines.length}</strong> of <strong>{guidelines.length}</strong> total guidelines
        </span>
        {(selectedCategory !== 'all' || selectedSeverity !== 'all' || selectedStatus !== 'all' || searchQuery) && (
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSelectedSeverity('all');
              setSelectedStatus('all');
              setSearchQuery('');
            }}
            className="text-wine-800 font-semibold hover:underline"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Guidelines Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredGuidelines.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-3xl p-7 border border-cream-300 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group hover:border-wine-300"
          >
            <div>
              {/* Badges Bar */}
              <div className="flex items-center justify-between mb-3.5">
                <span className="text-xs font-mono font-semibold text-wine-900 bg-pastel-sage/70 px-2.5 py-0.5 rounded-full border border-emerald-300/40">
                  [{item.category}]
                </span>

                <div className="flex items-center space-x-2">
                  <span
                    className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full ${
                      item.severity === 'Strict'
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : item.severity === 'Recommended'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-cream-200 text-ink-secondary'
                    }`}
                  >
                    {item.severity}
                  </span>
                  <span
                    className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-semibold border ${
                      item.status === 'Active'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : item.status === 'Draft'
                        ? 'bg-slate-100 text-slate-700 border-slate-300'
                        : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              </div>

              {/* Title & Description */}
              <h3 className="text-lg font-bold text-wine-950 font-display mb-2 leading-snug">
                {item.title}
              </h3>

              <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed mb-6 line-clamp-3">
                {item.description}
              </p>
            </div>

            {/* Bottom Actions & Metadata */}
            <div className="pt-4 border-t border-cream-200">
              <div className="flex items-center justify-between text-[11px] font-mono text-ink-muted mb-3">
                <span className="truncate max-w-[200px]" title={item.source}>
                  Src: {item.source}
                </span>
                <span className="font-semibold text-wine-900 bg-cream-100 px-2 py-0.5 rounded">
                  {item.id}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-black/5">
                {/* View Details Button (Requirement 9) */}
                <button
                  onClick={() => handleOpenDetails(item)}
                  className="inline-flex items-center space-x-1 text-xs font-semibold text-wine-900 hover:text-wine-950 bg-cream-100 hover:bg-cream-200 px-3 py-1 rounded-full border border-cream-300 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Details</span>
                </button>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => handleOpenEdit(item)}
                    aria-label="Edit guideline"
                    title="Edit Guideline"
                    className="p-1.5 rounded-full text-ink-secondary hover:text-wine-950 hover:bg-cream-200 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleOpenDelete(item)}
                    aria-label="Delete guideline"
                    title="Delete Guideline"
                    className="p-1.5 rounded-full text-ink-secondary hover:text-rose-700 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredGuidelines.length === 0 && (
        <div className="text-center py-12 bg-white rounded-3xl border border-cream-300">
          <BookOpen className="w-8 h-8 text-ink-muted mx-auto mb-2 opacity-50" />
          <p className="text-sm font-semibold text-wine-950">No guidelines matched your search criteria.</p>
          <p className="text-xs text-ink-secondary mt-1">Try adjusting your category, severity, or search query.</p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSelectedSeverity('all');
              setSelectedStatus('all');
              setSearchQuery('');
            }}
            className="mt-3 text-xs font-semibold text-wine-800 underline"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* 1. Add / Edit Guideline Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingItem ? 'Edit Brand Guideline' : 'Add Brand Guideline'}
        subtitle="Saved to localStorage with automatic unique ID duplicate prevention."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.general && (
            <div className="p-3 rounded-xl bg-rose-100 text-rose-900 border border-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errors.general}</span>
            </div>
          )}

          {/* Unique Guideline ID (Requirement 11 & 12) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-wine-950">
                Guideline ID <span className="text-rose-600">*</span>
              </label>
              <span className="text-[10px] font-mono text-ink-muted">
                (Unique identifier)
              </span>
            </div>
            <input
              type="text"
              value={formData.id}
              disabled={!!editingItem} // ID locked during editing to maintain integrity
              onChange={(e) => handleFieldChange('id', e.target.value)}
              className={`w-full px-3.5 py-2 text-sm font-mono rounded-xl border focus:outline-none transition-all ${
                editingItem ? 'bg-cream-200/80 text-ink-muted cursor-not-allowed border-cream-300' : 'bg-white'
              } ${errors.id ? 'border-rose-400 bg-rose-50/30' : 'border-cream-300 focus:border-wine-800'}`}
              required
            />
            {errors.id && (
              <p className="text-[11px] text-rose-600 mt-1">{errors.id}</p>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-wine-950 mb-1">
              Guideline Title <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Marketing claims must be supported by approved facts"
              value={formData.title}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              className={`w-full px-3.5 py-2 text-sm bg-white rounded-xl border focus:outline-none transition-all ${
                errors.title ? 'border-rose-400 bg-rose-50/30' : 'border-cream-300 focus:border-wine-800'
              }`}
            />
            {errors.title && (
              <p className="text-[11px] text-rose-600 mt-1">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-wine-950 mb-1">
              Rule Description & Context <span className="text-rose-600">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Provide clear boundaries, reasoning, and context for this brand rule..."
              value={formData.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              className={`w-full px-3.5 py-2 text-sm bg-white rounded-xl border focus:outline-none transition-all ${
                errors.description ? 'border-rose-400 bg-rose-50/30' : 'border-cream-300 focus:border-wine-800'
              }`}
            />
            {errors.description && (
              <p className="text-[11px] text-rose-600 mt-1">{errors.description}</p>
            )}
          </div>

          {/* Category, Severity, and Status Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-wine-950 mb-1">
                Category <span className="text-rose-600">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleFieldChange('category', e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-cream-300 focus:outline-none focus:border-wine-800"
              >
                <option value="Marketing">Marketing</option>
                <option value="Content">Content</option>
                <option value="Compliance">Compliance</option>
                <option value="Product">Product</option>
                <option value="General">General</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-wine-950 mb-1">
                Severity <span className="text-rose-600">*</span>
              </label>
              <select
                value={formData.severity}
                onChange={(e) => handleFieldChange('severity', e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-cream-300 focus:outline-none focus:border-wine-800"
              >
                <option value="Strict">Strict (Mandatory)</option>
                <option value="Recommended">Recommended</option>
                <option value="Optional">Optional</option>
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
                <option value="Draft">Draft</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
          </div>

          {/* Source Document */}
          <div>
            <label className="block text-xs font-bold text-wine-950 mb-1">
              Source Authority / Policy Reference <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. NovaTech Legal & Brand Policy 2026"
              value={formData.source}
              onChange={(e) => handleFieldChange('source', e.target.value)}
              className={`w-full px-3.5 py-2 text-sm bg-white rounded-xl border focus:outline-none transition-all ${
                errors.source ? 'border-rose-400 bg-rose-50/30' : 'border-cream-300 focus:border-wine-800'
              }`}
            />
            {errors.source && (
              <p className="text-[11px] text-rose-600 mt-1">{errors.source}</p>
            )}
          </div>

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
              {editingItem ? 'Save Updates' : 'Add Guideline'}
            </button>
          </div>
        </form>
      </Modal>

      {/* 2. Show Guideline Details Modal (Requirement 9) */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedItem(null);
        }}
        title="Guideline Specification"
        subtitle="Detailed view of the brand rule, enforcement level, and official source authority."
      >
        {selectedItem && (
          <div className="space-y-5">
            {/* Metadata Pills Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-cream-100 border border-cream-300">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold text-wine-900 bg-pastel-sage px-3 py-1 rounded-full">
                  [{selectedItem.category}]
                </span>
                <span
                  className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full uppercase ${
                    selectedItem.severity === 'Strict'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {selectedItem.severity}
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-semibold">
                  {selectedItem.status}
                </span>
              </div>

              {/* ID Badge with copy */}
              <div className="flex items-center space-x-1.5 text-xs font-mono text-ink-muted">
                <span>ID: {selectedItem.id}</span>
                <button
                  onClick={() => handleCopyId(selectedItem.id)}
                  title="Copy ID"
                  className="p-1 hover:text-wine-950 transition-colors"
                >
                  {copiedId === selectedItem.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-700" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Title */}
            <div>
              <h3 className="text-xl font-extrabold text-wine-950 font-display leading-snug">
                {selectedItem.title}
              </h3>
            </div>

            {/* Full Rule Description */}
            <div>
              <label className="text-[11px] font-mono uppercase font-bold text-ink-muted block mb-1">
                Rule Definition & Enforcement Boundaries
              </label>
              <div className="p-4 rounded-2xl bg-white border border-cream-300 text-sm text-ink-primary leading-relaxed shadow-inner">
                {selectedItem.description}
              </div>
            </div>

            {/* Source Authority */}
            <div className="p-3.5 rounded-2xl bg-cream-100/80 border border-cream-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] font-mono text-ink-muted block uppercase">
                  Source Policy Document
                </span>
                <span className="font-semibold text-wine-950">{selectedItem.source}</span>
              </div>
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-cream-300 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  handleOpenDelete(selectedItem);
                }}
                className="inline-flex items-center space-x-1 text-xs font-semibold text-rose-700 hover:text-rose-900 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Guideline</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    handleOpenEdit(selectedItem);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-wine-950 bg-cream-200 hover:bg-cream-300 rounded-full transition-colors inline-flex items-center space-x-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Guideline</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    setSelectedItem(null);
                  }}
                  className="px-5 py-2 text-xs font-semibold text-white bg-wine-900 hover:bg-wine-800 rounded-full shadow-sm transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* 3. Delete Confirmation Modal (Requirement 4) */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingItem(null);
        }}
        title="Confirm Delete Guideline"
        subtitle="This action will remove the rule from localStorage."
      >
        {deletingItem && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-950">
              <div className="flex items-center space-x-2 font-bold mb-1 text-rose-900">
                <AlertTriangle className="w-4 h-4 text-rose-700 flex-shrink-0" />
                <span>Are you sure you want to delete this brand guideline?</span>
              </div>
              <p className="mt-2 font-semibold text-wine-950 text-sm">
                "{deletingItem.title}"
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
                Delete Guideline
              </button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}
