import React, { useState, useEffect } from 'react';
import { Target, Users, Volume2, Edit3, ShieldAlert, Check, AlertCircle, RotateCcw, Building } from 'lucide-react';
import { getCompanyProfile, updateCompanyProfile, resetCompanyProfileToDefault } from '../services/brandDataService';
import Modal from './Modal';

export default function CompanyProfile() {
  const [profile, setProfile] = useState(getCompanyProfile());
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    brandTone: '',
    targetAudience: '',
    mission: '',
    tagline: '',
  });

  // Validation errors state
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setProfile(getCompanyProfile());
  }, []);

  const handleOpenEdit = () => {
    setFormData({
      name: profile.name || '',
      description: profile.description || '',
      brandTone: profile.brandTone || '',
      targetAudience: profile.targetAudience || '',
      mission: profile.mission || '',
      tagline: profile.tagline || '',
    });
    setErrors({});
    setIsEditModalOpen(true);
  };

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field if user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Brand name is required.';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Company description is required.';
    }
    if (!formData.brandTone.trim()) {
      newErrors.brandTone = 'Brand tone is required.';
    }
    if (!formData.targetAudience.trim()) {
      newErrors.targetAudience = 'Target audience is required.';
    }
    if (!formData.mission.trim()) {
      newErrors.mission = 'Mission statement is required.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    // Save to localStorage via service
    const updated = updateCompanyProfile({
      name: formData.name.trim(),
      description: formData.description.trim(),
      brandTone: formData.brandTone.trim(),
      targetAudience: formData.targetAudience.trim(),
      mission: formData.mission.trim(),
      tagline: formData.tagline?.trim() || profile.tagline,
    });

    setProfile(updated);
    setIsEditModalOpen(false);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleResetToSample = () => {
    if (window.confirm('Reset company profile back to the initial NovaTech sample values?')) {
      const sample = resetCompanyProfileToDefault();
      setProfile(sample);
      setFormData({
        name: sample.name,
        description: sample.description,
        brandTone: sample.brandTone,
        targetAudience: sample.targetAudience,
        mission: sample.mission,
        tagline: sample.tagline,
      });
      setErrors({});
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 3000);
    }
  };

  return (
    <section id="company-profile" className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Demo Notice Banner */}
      <div className="mb-8 p-3.5 rounded-2xl bg-pastel-butter/60 border border-amber-300/80 flex items-center justify-between text-xs text-amber-950">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 text-amber-800 flex-shrink-0" />
          <span>
            <strong>Fictional Demo Subject:</strong> {profile.name} is a fictional company for Member 1 testing. These are not real corporate claims.
          </span>
        </div>
        <span className="font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-200/80 text-amber-900">
          Demo Profile
        </span>
      </div>

      {/* Header with Title and Edit Profile Button */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
        <div>
          <span className="text-xs font-bold tracking-widest uppercase text-wine-800 bg-wine-100 px-3.5 py-1 rounded-full border border-wine-200">
            Section 01 • Company Profile
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-wine-950 font-display">
            {profile.name}
          </h2>
          {profile.tagline && (
            <p className="mt-1 text-base font-semibold text-wine-800">
              {profile.tagline}
            </p>
          )}
        </div>

        {/* Edit Profile Action Button */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleOpenEdit}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full bg-wine-900 text-white font-semibold text-xs hover:bg-wine-800 transition-all shadow-sm active:scale-95"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {savedNotice && (
        <div className="mb-6 p-3.5 rounded-2xl bg-pastel-sage/80 border border-emerald-300 text-xs font-semibold text-emerald-950 flex items-center space-x-2 animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-800" />
          <span>Company profile updated and saved to localStorage!</span>
        </div>
      )}

      {/* Main Profile Grid: Company Description & Core Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
        {/* Left Column (2 spans): Company Description & Mission */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Description Card */}
          <div className="bg-white rounded-3xl p-8 border border-cream-300 shadow-sm relative overflow-hidden group hover:border-wine-300 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-medium text-ink-muted uppercase tracking-wider">
                [Company Description]
              </span>
              <Building className="w-4 h-4 text-wine-800/60" />
            </div>
            <h3 className="text-xl font-bold text-wine-950 font-display mb-3">
              About {profile.name}
            </h3>
            <p className="text-sm sm:text-base text-ink-secondary leading-relaxed">
              {profile.description}
            </p>
          </div>

          {/* 2. Mission Card */}
          <div className="bg-white rounded-3xl p-8 border border-cream-300 shadow-sm relative overflow-hidden group hover:border-wine-300 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-medium text-ink-muted uppercase tracking-wider">
                [Company Mission]
              </span>
              <div className="w-8 h-8 rounded-full bg-pastel-sage flex items-center justify-center text-wine-950">
                <Target className="w-4 h-4 text-wine-900" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-wine-950 font-display mb-3">
              Our Mission
            </h3>
            <p className="text-sm sm:text-base text-ink-primary font-medium leading-relaxed bg-cream-100/70 p-4 rounded-2xl border border-cream-200">
              “{profile.mission}”
            </p>
          </div>
        </div>

        {/* Right Column: Brand Tone & Target Audience */}
        <div className="space-y-6">
          {/* 3. Brand Tone Card */}
          <div className="bg-white rounded-3xl p-7 border border-cream-300 shadow-sm relative overflow-hidden hover:border-wine-300 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-medium text-ink-muted uppercase tracking-wider">
                [Brand Tone]
              </span>
              <div className="w-8 h-8 rounded-full bg-pastel-butter flex items-center justify-center text-wine-950">
                <Volume2 className="w-4 h-4 text-amber-900" />
              </div>
            </div>
            <h4 className="text-base font-bold text-wine-950 font-display mb-2">
              Tone of Voice
            </h4>
            <p className="text-xs text-ink-secondary mb-4">
              Personality and attitude conveyed across all communications:
            </p>

            <div className="flex flex-wrap gap-2">
              {profile.brandTone?.split(',').map((tone, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-full text-xs font-semibold bg-pastel-sage/70 text-wine-950 border border-emerald-300/40"
                >
                  {tone.trim()}
                </span>
              ))}
            </div>
          </div>

          {/* 4. Target Audience Card */}
          <div className="bg-white rounded-3xl p-7 border border-cream-300 shadow-sm relative overflow-hidden hover:border-wine-300 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-medium text-ink-muted uppercase tracking-wider">
                [Target Audience]
              </span>
              <div className="w-8 h-8 rounded-full bg-pastel-periwinkle flex items-center justify-center text-wine-950">
                <Users className="w-4 h-4 text-indigo-900" />
              </div>
            </div>
            <h4 className="text-base font-bold text-wine-950 font-display mb-2">
              Primary Users
            </h4>
            <p className="text-xs text-ink-secondary mb-3">
              The key stakeholders and groups this product serves:
            </p>
            <div className="p-3.5 rounded-2xl bg-pastel-periwinkle/40 border border-indigo-200 text-xs font-semibold text-indigo-950">
              {profile.targetAudience}
            </div>
          </div>
        </div>
      </div>

      {/* 4 Core Brand Pillars (Preserved from reference video layout) */}
      {profile.pillars && profile.pillars.length > 0 && (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-wine-800">
                [Strategic Foundations]
              </span>
              <h3 className="text-2xl font-bold text-wine-950 font-display mt-0.5">
                Core Brand Pillars
              </h3>
            </div>
            <p className="text-xs text-ink-muted mt-1 sm:mt-0">
              Guiding product values for {profile.name}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {profile.pillars.map((pillar) => (
              <div
                key={pillar.id}
                className={`${pillar.colorClass} rounded-3xl p-7 border border-black/5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-semibold text-ink-primary/70 tracking-wide uppercase bg-black/5 px-2.5 py-0.5 rounded-full">
                      [{pillar.tag}]
                    </span>
                    <div className="w-2 h-2 rounded-full bg-wine-900/30" />
                  </div>
                  <h4 className="text-lg font-bold text-wine-950 mb-2 font-display">
                    {pillar.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-ink-primary/80 leading-relaxed font-normal">
                    {pillar.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Profile Modal Dialog */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit ${profile.name} Profile`}
        subtitle="Update the brand identity fields below. All fields are validated and saved to localStorage."
      >
        <form onSubmit={handleSave} className="space-y-4">
          {/* General Form Error Alert */}
          {Object.keys(errors).length > 0 && (
            <div className="p-3 rounded-xl bg-rose-100 text-rose-900 border border-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>Please fill in all required fields marked below.</span>
            </div>
          )}

          {/* 1. Brand Name Field */}
          <div>
            <label className="block text-xs font-bold text-wine-950 mb-1">
              Brand Name <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. NovaTech"
              value={formData.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              className={`w-full px-3.5 py-2 text-sm bg-white rounded-xl border focus:outline-none transition-all ${
                errors.name
                  ? 'border-rose-400 bg-rose-50/30 focus:border-rose-600'
                  : 'border-cream-300 focus:border-wine-800'
              }`}
            />
            {errors.name && (
              <p className="text-[11px] text-rose-600 mt-1 flex items-center space-x-1">
                <span>{errors.name}</span>
              </p>
            )}
          </div>

          {/* Optional Tagline */}
          <div>
            <label className="block text-xs font-bold text-wine-950 mb-1">
              Tagline (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Intelligent Workflows for Collaborative Teams"
              value={formData.tagline}
              onChange={(e) => handleFieldChange('tagline', e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white rounded-xl border border-cream-300 focus:outline-none focus:border-wine-800"
            />
          </div>

          {/* 2. Company Description Field */}
          <div>
            <label className="block text-xs font-bold text-wine-950 mb-1">
              Company Description <span className="text-rose-600">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="e.g. A fictional software company that helps teams manage workflows."
              value={formData.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              className={`w-full px-3.5 py-2 text-sm bg-white rounded-xl border focus:outline-none transition-all ${
                errors.description
                  ? 'border-rose-400 bg-rose-50/30 focus:border-rose-600'
                  : 'border-cream-300 focus:border-wine-800'
              }`}
            />
            {errors.description && (
              <p className="text-[11px] text-rose-600 mt-1 flex items-center space-x-1">
                <span>{errors.description}</span>
              </p>
            )}
          </div>

          {/* 3 & 4. Brand Tone & Target Audience Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-wine-950 mb-1">
                Brand Tone <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Professional, friendly, trustworthy"
                value={formData.brandTone}
                onChange={(e) => handleFieldChange('brandTone', e.target.value)}
                className={`w-full px-3.5 py-2 text-sm bg-white rounded-xl border focus:outline-none transition-all ${
                  errors.brandTone
                    ? 'border-rose-400 bg-rose-50/30 focus:border-rose-600'
                    : 'border-cream-300 focus:border-wine-800'
                }`}
              />
              {errors.brandTone && (
                <p className="text-[11px] text-rose-600 mt-1">
                  {errors.brandTone}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-wine-950 mb-1">
                Target Audience <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Teams and businesses"
                value={formData.targetAudience}
                onChange={(e) => handleFieldChange('targetAudience', e.target.value)}
                className={`w-full px-3.5 py-2 text-sm bg-white rounded-xl border focus:outline-none transition-all ${
                  errors.targetAudience
                    ? 'border-rose-400 bg-rose-50/30 focus:border-rose-600'
                    : 'border-cream-300 focus:border-wine-800'
                }`}
              />
              {errors.targetAudience && (
                <p className="text-[11px] text-rose-600 mt-1">
                  {errors.targetAudience}
                </p>
              )}
            </div>
          </div>

          {/* 5. Mission Statement Field */}
          <div>
            <label className="block text-xs font-bold text-wine-950 mb-1">
              Mission Statement <span className="text-rose-600">*</span>
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Help teams manage their workflows more effectively."
              value={formData.mission}
              onChange={(e) => handleFieldChange('mission', e.target.value)}
              className={`w-full px-3.5 py-2 text-sm bg-white rounded-xl border focus:outline-none transition-all ${
                errors.mission
                  ? 'border-rose-400 bg-rose-50/30 focus:border-rose-600'
                  : 'border-cream-300 focus:border-wine-800'
              }`}
            />
            {errors.mission && (
              <p className="text-[11px] text-rose-600 mt-1">
                {errors.mission}
              </p>
            )}
          </div>

          {/* Form Actions: Reset to Sample, Cancel, Save */}
          <div className="pt-4 border-t border-cream-300 flex items-center justify-between">
            <button
              type="button"
              onClick={handleResetToSample}
              className="inline-flex items-center space-x-1 text-xs text-ink-muted hover:text-wine-900 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Sample Profile</span>
            </button>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-ink-secondary hover:text-ink-primary rounded-full transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-white bg-wine-900 hover:bg-wine-800 rounded-full shadow-sm active:scale-95 transition-all"
              >
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </section>
  );
}
