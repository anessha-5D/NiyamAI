import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Calendar,
  Edit2,
  Trash2,
  ShieldCheck,
  AlertCircle,
  Clock,
  Copy,
  Check,
  RotateCcw,
  Eye,
  AlertTriangle,
  FileText,
  Tag
} from 'lucide-react';
import {
  getAllFacts,
  getApprovedFacts,
  getFactById,
  generateUniqueFactId,
  isFactExpired,
  addFact,
  updateFact,
  deleteFact,
  resetFactsToDefault,
} from '../services/brandDataService';
import Modal from './Modal';

export default function ApprovedFacts() {
  const [facts, setFacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'expired', 'pending', 'archived'

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Active items
  const [editingItem, setEditingItem] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);

  // Toast & Copy status
  const [toastMessage, setToastMessage] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    id: '',
    fact: '',
    details: '',
    source: 'NovaTech Operations',
    status: 'Approved',
    expiryDate: '2027-12-31',
    category: 'Product Capability',
  });

  // Validation Errors State
  const [errors, setErrors] = useState({});

  const refreshData = () => {
    setFacts(getAllFacts());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Status Metrics
  const activeApprovedCount = facts.filter((f) => (f.status === 'Approved' || f.approvalStatus === 'Approved') && !f.isExpired).length;
  const expiredCount = facts.filter((f) => f.isExpired).length;
  const pendingCount = facts.filter((f) => (f.status === 'Pending' || f.approvalStatus === 'Pending') && !f.isExpired).length;

  // Filter & Search Logic
  const filteredFacts = facts.filter((item) => {
    // Status Filter
    if (statusFilter === 'active') {
      if (item.isExpired || (item.status !== 'Approved' && item.approvalStatus !== 'Approved')) return false;
    } else if (statusFilter === 'expired') {
      if (!item.isExpired) return false;
    } else if (statusFilter === 'pending') {
      if (item.status !== 'Pending' && item.approvalStatus !== 'Pending') return false;
    } else if (statusFilter === 'archived') {
      if (item.status !== 'Archived' && item.approvalStatus !== 'Archived') return false;
    }

    // Search Query
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;

    return (
      item.fact.toLowerCase().includes(q) ||
      (item.details && item.details.toLowerCase().includes(q)) ||
      item.source.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q)
    );
  });

  // Open Add Modal with generated unique ID
  const handleOpenAdd = () => {
    const uniqueId = generateUniqueFactId();
    setEditingItem(null);
    setFormData({
      id: uniqueId,
      fact: '',
      details: '',
      source: 'NovaTech Operations Specification',
      status: 'Approved',
      expiryDate: '2027-12-31',
      category: 'Product Capability',
    });
    setErrors({});
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      id: item.id,
      fact: item.fact,
      details: item.details || '',
      source: item.source,
      status: item.status || item.approvalStatus || 'Approved',
      expiryDate: item.expiryDate,
      category: item.category || 'General',
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
    if (!formData.fact?.trim()) {
      newErrors.fact = 'Fact statement is required.';
    }
    if (!formData.source?.trim()) {
      newErrors.source = 'Source authority document is required.';
    }
    if (!formData.expiryDate?.trim()) {
      newErrors.expiryDate = 'Expiry date is required.';
    }
    if (!formData.id?.trim()) {
      newErrors.id = 'Fact ID is required.';
    } else if (!editingItem) {
      // Check for duplicate ID on Add
      const isDuplicate = facts.some(
        (f) => f.id.toLowerCase() === formData.id.trim().toLowerCase()
      );
      if (isDuplicate) {
        newErrors.id = `ID "${formData.id.trim()}" already exists. Please choose a unique ID.`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit Handler
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (editingItem) {
      const res = updateFact(editingItem.id, formData);
      if (!res.success) {
        setErrors({ general: res.error });
        return;
      }
      showToast('Approved fact updated successfully!');
    } else {
      const res = addFact(formData);
      if (!res.success) {
        setErrors({ general: res.error });
        return;
      }
      showToast('New fact added to Approved Facts Vault!');
    }

    setIsFormModalOpen(false);
    refreshData();
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (!deletingItem) return;
    deleteFact(deletingItem.id);
    setIsDeleteModalOpen(false);
    setDeletingItem(null);
    if (selectedItem?.id === deletingItem.id) {
      setIsDetailModalOpen(false);
      setSelectedItem(null);
    }
    refreshData();
    showToast('Fact deleted from vault.');
  };

  // Reset to Sample Facts
  const handleResetToDefault = () => {
    if (window.confirm('Reset all facts back to predefined NovaTech sample facts?')) {
      resetFactsToDefault();
      refreshData();
      showToast('Restored predefined sample facts.');
    }
  };

  // One-click Copy
  const handleCopyFact = (item) => {
    const citation = `“${item.fact}” (Source: ${item.source} • Verified Expiry: ${item.expiryDate})`;
    navigator.clipboard.writeText(citation);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <section id="approved-facts" className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <span className="text-xs font-bold tracking-widest uppercase text-wine-800 bg-wine-100 px-3.5 py-1 rounded-full border border-wine-200">
            Section 03 • Approved Facts Vault
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-wine-950 font-display">
            Approved Facts Vault
          </h2>
          <p className="mt-2 text-ink-secondary text-sm max-w-2xl">
            Verified corporate claims, product capabilities, and metrics for NovaTech. Automatically checks expiry dates and excludes expired entries.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 self-start md:self-auto">
          <button
            onClick={handleResetToDefault}
            title="Restore original predefined sample facts"
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
            <span>Add Approved Fact</span>
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

      {/* Vault Safeguard Notice Banner (Requirement 13, 14, 15) */}
      <div className="mb-8 p-4 rounded-3xl bg-white border border-cream-300 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 rounded-full bg-wine-100 flex items-center justify-center text-wine-900 flex-shrink-0 mt-0.5">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-wine-950 uppercase tracking-wide">
              Automated Vault Expiry Safeguard
            </h4>
            <p className="text-xs text-ink-secondary mt-0.5">
              The reusable <code className="bg-cream-200 px-1.5 py-0.5 rounded font-mono text-[11px] text-wine-950">getApprovedFacts()</code> function guarantees that only approved, unexpired claims are returned to other NiyamAI modules.
            </p>
          </div>
        </div>

        {/* Live Counters */}
        <div className="flex items-center space-x-2 self-start md:self-auto font-mono text-xs">
          <span className="bg-pastel-sage/80 border border-emerald-300 px-3 py-1 rounded-full text-emerald-950 font-bold">
            {activeApprovedCount} Active Approved
          </span>
          <span className="bg-pastel-rose/80 border border-rose-300 px-3 py-1 rounded-full text-rose-950 font-bold">
            {expiredCount} Expired
          </span>
        </div>
      </div>

      {/* Search & Status Filter Controls */}
      <div className="bg-white rounded-3xl p-5 border border-cream-300 shadow-sm mb-8 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Live Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search facts by claim text, source document, ID, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-cream-100/70 rounded-full border border-cream-300 focus:outline-none focus:border-wine-800 focus:bg-white transition-all placeholder:text-ink-muted"
            />
          </div>

          {/* Status Filter Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === 'all'
                  ? 'bg-wine-900 text-white'
                  : 'bg-cream-100 text-ink-secondary hover:bg-cream-200'
              }`}
            >
              All Facts ({facts.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === 'active'
                  ? 'bg-emerald-800 text-white'
                  : 'bg-cream-100 text-ink-secondary hover:bg-cream-200'
              }`}
            >
              Active & Approved ({activeApprovedCount})
            </button>
            <button
              onClick={() => setStatusFilter('expired')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === 'expired'
                  ? 'bg-rose-800 text-white'
                  : 'bg-cream-100 text-ink-secondary hover:bg-cream-200'
              }`}
            >
              Expired ({expiredCount})
            </button>
            {pendingCount > 0 && (
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  statusFilter === 'pending'
                    ? 'bg-amber-800 text-white'
                    : 'bg-cream-100 text-ink-secondary hover:bg-cream-200'
                }`}
              >
                Pending ({pendingCount})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Facts Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFacts.map((item) => {
          const isCopied = copiedId === item.id;
          const expired = item.isExpired;

          return (
            <div
              key={item.id}
              className={`rounded-3xl p-7 border shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
                expired
                  ? 'bg-rose-50/40 border-rose-300'
                  : 'bg-white border-cream-300 hover:border-wine-300'
              }`}
            >
              <div>
                {/* Badges Bar */}
                <div className="flex items-center justify-between mb-3.5">
                  <span className="text-xs font-mono font-semibold text-wine-900 bg-cream-200 px-2.5 py-0.5 rounded-full">
                    [{item.category || 'General'}]
                  </span>

                  {/* Expiry / Approval Status Indicator (Requirement 13 & 14) */}
                  {expired ? (
                    <span className="inline-flex items-center space-x-1 text-[10px] font-mono uppercase font-bold px-2.5 py-0.5 rounded-full bg-rose-200 text-rose-950 border border-rose-300">
                      <AlertCircle className="w-3 h-3 text-rose-800" />
                      <span>Expired</span>
                    </span>
                  ) : (
                    <span
                      className={`inline-flex items-center space-x-1 text-[10px] font-mono uppercase font-bold px-2.5 py-0.5 rounded-full border ${
                        item.status === 'Approved'
                          ? 'bg-pastel-sage text-emerald-950 border-emerald-300'
                          : 'bg-amber-100 text-amber-900 border-amber-300'
                      }`}
                    >
                      <ShieldCheck className="w-3 h-3 text-emerald-800" />
                      <span>{item.status}</span>
                    </span>
                  )}
                </div>

                {/* Primary Fact Text */}
                <h3 className="text-lg font-bold text-wine-950 font-display mb-2 leading-snug">
                  “{item.fact}”
                </h3>

                {/* Additional context if present */}
                {item.details && (
                  <p className="text-xs text-ink-secondary leading-relaxed mb-4 line-clamp-3">
                    {item.details}
                  </p>
                )}

                {/* Warning callout on expired card */}
                {expired && (
                  <div className="p-2.5 rounded-xl bg-rose-100/70 border border-rose-200 text-[11px] text-rose-900 font-medium mb-4 flex items-center space-x-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-700 flex-shrink-0" />
                    <span>Excluded from approved queries. Needs verification review.</span>
                  </div>
                )}
              </div>

              {/* Bottom Metadata & Controls (Requirement 7 & 8) */}
              <div className="pt-4 border-t border-black/5 mt-2">
                {/* Source & Expiry Date row */}
                <div className="space-y-1.5 text-[11px] font-mono text-ink-muted mb-3">
                  <div className="flex items-center justify-between">
                    <span className="truncate max-w-[180px]" title={item.source}>
                      Src: <strong className="text-ink-primary font-semibold">{item.source}</strong>
                    </span>
                    <span className="text-wine-900 bg-cream-100 px-1.5 py-0.5 rounded text-[10px]">
                      {item.id}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-ink-muted" />
                      <span>Expires:</span>
                    </span>
                    <span
                      className={`font-semibold ${
                        expired ? 'text-rose-700 underline font-bold' : 'text-emerald-900'
                      }`}
                    >
                      {item.expiryDate}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-black/5">
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => handleCopyFact(item)}
                      title="Copy Verified Citation"
                      className={`inline-flex items-center space-x-1 text-xs font-semibold px-3 py-1 rounded-full border transition-all ${
                        isCopied
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-white text-wine-950 border-cream-300 hover:bg-cream-100 shadow-2xs'
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-ink-muted" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleOpenDetails(item)}
                      title="Inspect Fact Details"
                      className="p-1.5 rounded-full text-ink-secondary hover:text-wine-950 hover:bg-cream-200 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      aria-label="Edit fact"
                      title="Edit Fact"
                      className="p-1.5 rounded-full text-ink-secondary hover:text-wine-950 hover:bg-cream-200 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenDelete(item)}
                      aria-label="Delete fact"
                      title="Delete Fact"
                      className="p-1.5 rounded-full text-ink-secondary hover:text-rose-700 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredFacts.length === 0 && (
        <div className="text-center py-12 bg-white rounded-3xl border border-cream-300">
          <FileText className="w-8 h-8 text-ink-muted mx-auto mb-2 opacity-50" />
          <p className="text-sm font-semibold text-wine-950">No facts matched your criteria.</p>
          <button
            onClick={() => {
              setStatusFilter('all');
              setSearchQuery('');
            }}
            className="mt-2 text-xs font-semibold text-wine-800 underline"
          >
            Show All Facts
          </button>
        </div>
      )}

      {/* 1. Add / Edit Fact Modal (Requirement 2, 3, 9 & 10) */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingItem ? 'Edit Approved Fact' : 'Add Approved Fact'}
        subtitle="Saved to localStorage with automatic expiry tracking and unique ID assignment."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.general && (
            <div className="p-3 rounded-xl bg-rose-100 text-rose-900 border border-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errors.general}</span>
            </div>
          )}

          {/* Unique Fact ID */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-wine-950">
                Fact ID <span className="text-rose-600">*</span>
              </label>
              <span className="text-[10px] font-mono text-ink-muted">
                (Unique identifier)
              </span>
            </div>
            <input
              type="text"
              value={formData.id}
              disabled={!!editingItem} // ID locked during editing
              onChange={(e) => handleFieldChange('id', e.target.value)}
              className={`w-full px-3.5 py-2 text-sm font-mono rounded-xl border focus:outline-none transition-all ${
                editingItem ? 'bg-cream-200/80 text-ink-muted cursor-not-allowed border-cream-300' : 'bg-white'
              } ${errors.id ? 'border-rose-400 bg-rose-50/30' : 'border-cream-300 focus:border-wine-800'}`}
              required
            />
            {errors.id && <p className="text-[11px] text-rose-600 mt-1">{errors.id}</p>}
          </div>

          {/* Fact Statement */}
          <div>
            <label className="block text-xs font-bold text-wine-950 mb-1">
              Fact Statement (Accurate & Provable) <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Product supports 5 languages."
              value={formData.fact}
              onChange={(e) => handleFieldChange('fact', e.target.value)}
              className={`w-full px-3.5 py-2 text-sm bg-white rounded-xl border focus:outline-none transition-all ${
                errors.fact ? 'border-rose-400 bg-rose-50/30' : 'border-cream-300 focus:border-wine-800'
              }`}
            />
            {errors.fact && <p className="text-[11px] text-rose-600 mt-1">{errors.fact}</p>}
          </div>

          {/* Context / Details */}
          <div>
            <label className="block text-xs font-bold text-wine-950 mb-1">
              Additional Details / Supporting Context (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Provide exact breakdown, technical scope, or verified audit parameters..."
              value={formData.details}
              onChange={(e) => handleFieldChange('details', e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white rounded-xl border border-cream-300 focus:outline-none focus:border-wine-800"
            />
          </div>

          {/* Category & Source Document */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-wine-950 mb-1">
                Category
              </label>
              <input
                type="text"
                placeholder="e.g. Product Capability, Customer Support"
                value={formData.category}
                onChange={(e) => handleFieldChange('category', e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-cream-300 focus:outline-none focus:border-wine-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-wine-950 mb-1">
                Source Document <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Engineering Product Specification v3.2"
                value={formData.source}
                onChange={(e) => handleFieldChange('source', e.target.value)}
                className={`w-full px-3 py-2 text-xs bg-white rounded-xl border focus:outline-none transition-all ${
                  errors.source ? 'border-rose-400 bg-rose-50/30' : 'border-cream-300 focus:border-wine-800'
                }`}
              />
              {errors.source && <p className="text-[11px] text-rose-600 mt-1">{errors.source}</p>}
            </div>
          </div>

          {/* Approval Status & Expiry Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-wine-950 mb-1">
                Approval Status <span className="text-rose-600">*</span>
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleFieldChange('status', e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-cream-300 focus:outline-none focus:border-wine-800"
              >
                <option value="Approved">Approved</option>
                <option value="Pending">Pending Review</option>
                <option value="Archived">Archived</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-wine-950 mb-1">
                Expiry Date <span className="text-rose-600">*</span>
              </label>
              <input
                type="date"
                value={formData.expiryDate}
                onChange={(e) => handleFieldChange('expiryDate', e.target.value)}
                className={`w-full px-3 py-2 text-xs bg-white rounded-xl border focus:outline-none transition-all ${
                  errors.expiryDate ? 'border-rose-400 bg-rose-50/30' : 'border-cream-300 focus:border-wine-800'
                }`}
              />
              {errors.expiryDate && <p className="text-[11px] text-rose-600 mt-1">{errors.expiryDate}</p>}
            </div>
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
              {editingItem ? 'Save Updates' : 'Add Fact'}
            </button>
          </div>
        </form>
      </Modal>

      {/* 2. Show Fact Details Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedItem(null);
        }}
        title="Fact Vault Entry Details"
        subtitle="Full provenance, source citation, and automatic validity verification."
      >
        {selectedItem && (
          <div className="space-y-5">
            {/* Badges Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-cream-100 border border-cream-300">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold text-wine-900 bg-cream-200 px-3 py-1 rounded-full">
                  [{selectedItem.category || 'General'}]
                </span>
                <span
                  className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full uppercase ${
                    selectedItem.isExpired
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {selectedItem.isExpired ? 'EXPIRED' : selectedItem.status}
                </span>
              </div>

              <div className="flex items-center space-x-1.5 text-xs font-mono text-ink-muted">
                <span>ID: {selectedItem.id}</span>
              </div>
            </div>

            {/* Fact Statement */}
            <div>
              <label className="text-[11px] font-mono uppercase font-bold text-ink-muted block mb-1">
                Verified Statement
              </label>
              <div className="p-4 rounded-2xl bg-white border border-cream-300 text-base font-bold text-wine-950 font-display leading-relaxed shadow-inner">
                “{selectedItem.fact}”
              </div>
            </div>

            {/* Supporting Details */}
            {selectedItem.details && (
              <div>
                <label className="text-[11px] font-mono uppercase font-bold text-ink-muted block mb-1">
                  Scope & Technical Parameters
                </label>
                <p className="text-xs text-ink-secondary leading-relaxed bg-cream-100/60 p-3 rounded-xl border border-cream-200">
                  {selectedItem.details}
                </p>
              </div>
            )}

            {/* Source & Expiry Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-cream-100/80 border border-cream-200 text-xs">
                <span className="text-[10px] font-mono text-ink-muted block uppercase">
                  Source Document (Provenance)
                </span>
                <span className="font-semibold text-wine-950">{selectedItem.source}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-cream-100/80 border border-cream-200 text-xs">
                <span className="text-[10px] font-mono text-ink-muted block uppercase">
                  Expiry Date
                </span>
                <span className={`font-semibold ${selectedItem.isExpired ? 'text-rose-700 font-bold' : 'text-emerald-900'}`}>
                  {selectedItem.expiryDate} {selectedItem.isExpired ? '(EXPIRED)' : '(Valid)'}
                </span>
              </div>
            </div>

            {/* Actions */}
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
                <span>Delete Fact</span>
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
                  <span>Edit Fact</span>
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
        title="Confirm Delete Fact"
        subtitle="This action will remove the claim from the Approved Facts Vault."
      >
        {deletingItem && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-950">
              <div className="flex items-center space-x-2 font-bold mb-1 text-rose-900">
                <AlertTriangle className="w-4 h-4 text-rose-700 flex-shrink-0" />
                <span>Are you sure you want to delete this approved fact?</span>
              </div>
              <p className="mt-2 font-semibold text-wine-950 text-sm">
                “{deletingItem.fact}”
              </p>
              <p className="mt-1 font-mono text-[11px] text-ink-muted">
                ID: {deletingItem.id} • Source: {deletingItem.source}
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
                Delete Fact
              </button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}
