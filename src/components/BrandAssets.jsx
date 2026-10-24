import React, { useState, useEffect } from 'react';
import {
  Plus,
  Palette,
  Copy,
  Check,
  Edit2,
  Trash2,
  AlertCircle,
  Search,
  Type,
  Image,
  RotateCcw,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import {
  getBrandAssets,
  getBrandColors,
  generateUniqueColorId,
  validateAndNormalizeHex,
  addBrandColor,
  updateBrandColor,
  deleteBrandColor,
  resetBrandColorsToDefault,
} from '../services/brandDataService';
import Modal from './Modal';

export default function BrandAssets() {
  const [assets, setAssets] = useState(getBrandAssets());
  const [colorSearchQuery, setColorSearchQuery] = useState('');
  const [copiedHex, setCopiedHex] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Modal States
  const [isColorModalOpen, setIsColorModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Active items
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    hex: '#3D101E',
    role: 'Primary Accent',
    description: '',
    status: 'Approved',
  });

  // Validation Error State
  const [errors, setErrors] = useState({});

  const refreshData = () => {
    setAssets(getBrandAssets());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Copy HEX helper
  const handleCopyHex = (hex) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  // Open Add Color Modal
  const handleOpenAdd = () => {
    const uniqueId = generateUniqueColorId();
    setEditingItem(null);
    setFormData({
      id: uniqueId,
      name: '',
      hex: '#3D101E',
      role: 'Brand Accent',
      description: 'Used for brand accents and UI highlights.',
      status: 'Approved',
    });
    setErrors({});
    setIsColorModalOpen(true);
  };

  // Open Edit Color Modal
  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      id: item.id,
      name: item.name,
      hex: item.hex,
      role: item.role || '',
      description: item.description || item.usage || '',
      status: item.status || item.approvalStatus || 'Approved',
    });
    setErrors({});
    setIsColorModalOpen(true);
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

  // Form Validation (Requirement: Accept 6-digit hex with optional leading #, validate, normalize)
  const validateForm = () => {
    const newErrors = {};
    if (!formData.name?.trim()) {
      newErrors.name = 'Color name is required.';
    }
    if (!formData.id?.trim()) {
      newErrors.id = 'Color ID is required.';
    }

    // HEX Validation
    const hexCheck = validateAndNormalizeHex(formData.hex);
    if (!hexCheck.isValid) {
      newErrors.hex = hexCheck.error;
    }

    // Duplicate ID check on Add
    if (!editingItem && formData.id) {
      const isDuplicate = (assets.colors || []).some(
        (c) => c.id.toLowerCase() === formData.id.trim().toLowerCase()
      );
      if (isDuplicate) {
        newErrors.id = `ID "${formData.id.trim()}" already exists. Choose a unique ID.`;
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
      const res = updateBrandColor(editingItem.id, formData);
      if (!res.success) {
        setErrors({ general: res.error });
        return;
      }
      showToast('Brand color updated successfully!');
    } else {
      const res = addBrandColor(formData);
      if (!res.success) {
        setErrors({ general: res.error });
        return;
      }
      showToast('New brand color swatch added!');
    }

    setIsColorModalOpen(false);
    refreshData();
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (!deletingItem) return;
    deleteBrandColor(deletingItem.id);
    setIsDeleteModalOpen(false);
    setDeletingItem(null);
    refreshData();
    showToast('Brand color swatch deleted.');
  };

  // Reset to Sample Colors
  const handleResetToDefault = () => {
    if (window.confirm('Reset brand colors back to predefined NovaTech sample palette?')) {
      resetBrandColorsToDefault();
      refreshData();
      showToast('Restored predefined brand color tokens.');
    }
  };

  // Filter colors by search
  const filteredColors = (assets.colors || []).filter((color) => {
    const q = colorSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      color.name.toLowerCase().includes(q) ||
      color.hex.toLowerCase().includes(q) ||
      (color.role && color.role.toLowerCase().includes(q)) ||
      (color.description && color.description.toLowerCase().includes(q)) ||
      color.id.toLowerCase().includes(q)
    );
  });

  // Current live hex status for modal preview
  const currentHexStatus = validateAndNormalizeHex(formData.hex);

  return (
    <section id="brand-assets" className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <span className="text-xs font-bold tracking-widest uppercase text-wine-800 bg-wine-100 px-3.5 py-1 rounded-full border border-wine-200">
            Section 05 • Brand Assets
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-wine-950 font-display">
            Brand Assets & Design Tokens
          </h2>
          <p className="mt-2 text-ink-secondary text-sm max-w-2xl">
            Verified design tokens for NovaTech. Manage brand color palettes with built-in HEX validation and inspect official logo placeholders.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 self-start md:self-auto">
          <button
            onClick={handleResetToDefault}
            title="Restore original predefined color swatches"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 rounded-full bg-white text-ink-secondary hover:text-wine-950 border border-cream-300 text-xs font-semibold shadow-xs transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-ink-muted" />
            <span>Reset Colors</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full bg-wine-900 text-white font-semibold text-xs hover:bg-wine-800 transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Brand Color</span>
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

      {/* 1. Official Logo Placeholders */}
      <div className="mb-14">
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-wine-800">
              [Visual Identity]
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-wine-950 font-display mt-0.5">
              NovaTech Logo Marks
            </h3>
          </div>
          <div className="flex items-center space-x-1.5 text-xs text-ink-muted">
            <Image className="w-4 h-4 text-wine-800" />
            <span>Demonstration Placeholders</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {assets.logos?.map((logo) => (
            <div
              key={logo.id}
              className="bg-white rounded-3xl p-7 border border-cream-300 shadow-sm flex flex-col justify-between"
            >
              <div>
                {/* Visual Mark Display */}
                <div className="h-32 rounded-2xl bg-cream-100 border border-cream-200 flex items-center justify-center p-6 mb-5">
                  {logo.type === 'Square Icon' ? (
                    <div className="w-16 h-16 rounded-2xl bg-wine-900 text-white flex items-center justify-center text-3xl font-extrabold font-display shadow-sm">
                      N
                    </div>
                  ) : (
                    <div className="text-center">
                      <span className="font-extrabold text-3xl tracking-tight text-wine-950 font-display block">
                        NOVATECH
                      </span>
                      <span className="text-[10px] tracking-widest uppercase font-mono text-wine-800 font-semibold">
                        Workflow Software
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-semibold text-wine-900 bg-cream-200 px-2.5 py-0.5 rounded-full">
                    [{logo.format}]
                  </span>
                  <span className="text-[10px] font-mono uppercase font-bold text-emerald-800 bg-pastel-sage px-2 py-0.5 rounded-full">
                    Demo Placeholder
                  </span>
                </div>

                <h4 className="text-lg font-bold text-wine-950 font-display mb-1">
                  {logo.name}
                </h4>

                <p className="text-xs text-ink-secondary leading-relaxed">
                  {logo.usage}
                </p>
              </div>

              <div className="pt-4 border-t border-cream-200 mt-4 flex items-center justify-between text-xs">
                <span className="font-mono text-[11px] text-ink-muted">
                  Vector SVG Placeholder
                </span>
                <span className="font-semibold text-wine-900">
                  Stable Local Asset
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Brand Colors System (with Search & Full CRUD) */}
      <div className="mb-14">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-3">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-wine-800">
              [Color Tokens]
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-wine-950 font-display mt-0.5">
              Brand Color System
            </h3>
          </div>

          {/* Color Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search colors by name or HEX..."
              value={colorSearchQuery}
              onChange={(e) => setColorSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-white rounded-full border border-cream-300 focus:outline-none focus:border-wine-800 transition-all placeholder:text-ink-muted"
            />
          </div>
        </div>

        {/* Swatch Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredColors.map((color) => {
            const isCopied = copiedHex === color.hex;

            return (
              <div
                key={color.id}
                className="bg-white rounded-3xl p-6 border border-cream-300 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group hover:border-wine-300"
              >
                <div>
                  {/* Color Swatch Preview */}
                  <div
                    className="h-24 rounded-2xl mb-4 border border-black/10 flex items-end p-3.5 shadow-inner transition-transform group-hover:scale-[1.01]"
                    style={{ backgroundColor: color.hex }}
                  >
                    <span className="text-xs font-mono font-bold tracking-wider px-2.5 py-1 rounded-md bg-white/85 text-wine-950 backdrop-blur-sm shadow-2xs">
                      {color.hex}
                    </span>
                  </div>

                  {/* Name and Status */}
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-base font-bold text-wine-950 font-display">
                      {color.name}
                    </h4>
                    <span className="text-[10px] font-mono text-emerald-800 bg-pastel-sage px-2 py-0.5 rounded-full font-semibold">
                      {color.status || color.approvalStatus || 'Approved'}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-wine-900 mb-1">
                    {color.role}
                  </p>

                  <p className="text-xs text-ink-secondary leading-relaxed mb-4">
                    {color.description || color.usage}
                  </p>
                </div>

                {/* Bottom Controls */}
                <div className="pt-3 border-t border-cream-200 flex items-center justify-between">
                  <button
                    onClick={() => handleCopyHex(color.hex)}
                    className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                      isCopied
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-white text-ink-primary hover:bg-cream-100 border-cream-300 shadow-2xs'
                    }`}
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-ink-muted" />
                        <span>Copy HEX</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEdit(color)}
                      aria-label="Edit color"
                      title="Edit Color"
                      className="p-1.5 rounded-full text-ink-secondary hover:text-wine-950 hover:bg-cream-200 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenDelete(color)}
                      aria-label="Delete color"
                      title="Delete Color"
                      className="p-1.5 rounded-full text-ink-secondary hover:text-rose-700 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredColors.length === 0 && (
          <div className="text-center py-10 bg-white rounded-3xl border border-cream-300">
            <Palette className="w-8 h-8 text-ink-muted mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-wine-950">No color swatches match your query.</p>
            <button
              onClick={() => setColorSearchQuery('')}
              className="mt-2 text-xs font-semibold text-wine-800 underline"
            >
              Show All Colors
            </button>
          </div>
        )}
      </div>

      {/* 3. Typography Hierarchy Specimen */}
      <div className="bg-white rounded-3xl p-7 border border-cream-300 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-wine-800">
              [Typography Scale]
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-wine-950 font-display mt-0.5">
              Typography System
            </h3>
          </div>
          <div className="flex items-center space-x-1.5 text-xs text-ink-muted">
            <Type className="w-4 h-4 text-wine-800" />
            <span>Plus Jakarta Sans & JetBrains Mono</span>
          </div>
        </div>

        <div className="space-y-4">
          {assets.typography?.map((item) => (
            <div key={item.id} className="p-5 rounded-2xl bg-cream-100/70 border border-cream-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                <span className="text-xs font-mono font-bold text-wine-900 uppercase">
                  {item.role} • {item.fontFamily}
                </span>
                <span className="text-[11px] font-mono text-ink-muted">
                  Weights: {item.weights}
                </span>
              </div>
              <p
                className={`text-wine-950 ${
                  item.role.includes('Headings')
                    ? 'text-xl sm:text-2xl font-extrabold tracking-tight font-display'
                    : item.role.includes('Body')
                    ? 'text-sm sm:text-base leading-relaxed'
                    : 'text-xs font-mono bg-white p-3 rounded-xl border border-cream-300'
                }`}
              >
                {item.specimen}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 1. Add / Edit Color Modal */}
      <Modal
        isOpen={isColorModalOpen}
        onClose={() => setIsColorModalOpen(false)}
        title={editingItem ? 'Edit Brand Color' : 'Add Brand Color'}
        subtitle="HEX values support optional leading # and are strictly validated as 6-digit colors."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.general && (
            <div className="p-3 rounded-xl bg-rose-100 text-rose-900 border border-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errors.general}</span>
            </div>
          )}

          {/* Live Color Swatch Preview */}
          <div className="flex items-center space-x-4 p-4 rounded-2xl bg-cream-100 border border-cream-300">
            <div
              className="w-16 h-16 rounded-xl border border-black/15 shadow-inner flex items-center justify-center font-mono text-xs font-bold transition-colors"
              style={{
                backgroundColor: currentHexStatus.isValid ? currentHexStatus.normalizedHex : '#E2E8F0',
              }}
            >
              {!currentHexStatus.isValid && (
                <span className="text-rose-900 text-[10px] font-semibold">Invalid</span>
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-wine-950">
                {formData.name || 'Color Preview'}
              </p>
              <p className="text-xs font-mono text-ink-muted">
                HEX: {currentHexStatus.isValid ? currentHexStatus.normalizedHex : (formData.hex || 'None')}
              </p>
              <p className="text-[11px] text-ink-secondary mt-0.5">
                {currentHexStatus.isValid ? 'Valid 6-digit HEX format' : 'Accepts e.g. #3D101E or 3D101E'}
              </p>
            </div>
          </div>

          {/* Color ID */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-wine-950">
                Color ID <span className="text-rose-600">*</span>
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

          {/* Color Name */}
          <div>
            <label className="block text-xs font-bold text-wine-950 mb-1">
              Color Name <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Deep Bordeaux Wine, Soft Sage Mint"
              value={formData.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              className={`w-full px-3.5 py-2 text-sm bg-white rounded-xl border focus:outline-none transition-all ${
                errors.name ? 'border-rose-400 bg-rose-50/30' : 'border-cream-300 focus:border-wine-800'
              }`}
            />
            {errors.name && <p className="text-[11px] text-rose-600 mt-1">{errors.name}</p>}
          </div>

          {/* HEX Value & Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-wine-950 mb-1">
                HEX Value <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                placeholder="#3D101E or 3D101E"
                value={formData.hex}
                onChange={(e) => handleFieldChange('hex', e.target.value)}
                className={`w-full px-3.5 py-2 text-sm font-mono bg-white rounded-xl border focus:outline-none transition-all ${
                  errors.hex ? 'border-rose-400 bg-rose-50/30' : 'border-cream-300 focus:border-wine-800'
                }`}
              />
              {errors.hex && <p className="text-[11px] text-rose-600 mt-1">{errors.hex}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-wine-950 mb-1">
                Role / Function in UI
              </label>
              <input
                type="text"
                placeholder="e.g. Primary Accent, Canvas, Success"
                value={formData.role}
                onChange={(e) => handleFieldChange('role', e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white rounded-xl border border-cream-300 focus:outline-none focus:border-wine-800"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-wine-950 mb-1">
              Description / Usage Guidelines
            </label>
            <textarea
              rows={2}
              placeholder="Specify where and how this color should be applied across UI components..."
              value={formData.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white rounded-xl border border-cream-300 focus:outline-none focus:border-wine-800"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-cream-300 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsColorModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-ink-secondary hover:text-ink-primary rounded-full transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-wine-900 hover:bg-wine-800 rounded-full shadow-sm active:scale-95 transition-all"
            >
              {editingItem ? 'Save Updates' : 'Add Color'}
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
        title="Confirm Delete Brand Color"
        subtitle="This action will remove the swatch from the design system tokens."
      >
        {deletingItem && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-950">
              <div className="flex items-center space-x-2 font-bold mb-1 text-rose-900">
                <AlertTriangle className="w-4 h-4 text-rose-700 flex-shrink-0" />
                <span>Are you sure you want to delete this brand color?</span>
              </div>
              <div className="flex items-center space-x-2.5 mt-2">
                <div
                  className="w-5 h-5 rounded-md border border-black/20"
                  style={{ backgroundColor: deletingItem.hex }}
                />
                <span className="font-semibold text-wine-950 text-sm">
                  {deletingItem.name} ({deletingItem.hex})
                </span>
              </div>
              <p className="mt-1 font-mono text-[11px] text-ink-muted">
                ID: {deletingItem.id}
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
                Delete Color
              </button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}
