/**
 * pages/ReportIncident.jsx
 *
 * SafeStreet — Guided Reporting Workflow.
 * Step-by-step progressive disclosure:
 * Incident → Location → Evidence → Privacy → Submit.
 * The resident always visually understands where they are in the reporting pipeline.
 */
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FileText,
  Camera,
  X,
  AlertCircle,
  Send,
  Lock,
  Lightbulb,
  ShieldAlert,
  AlertTriangle,
  Eye,
  MapPin,
  MoreHorizontal,
  Check,
  ArrowRight,
  ArrowLeft,
  Info,
} from 'lucide-react';
import api from '../services/api';
import LocationPicker from '../components/LocationPicker';
import { Button, Input, Textarea } from '../components/ui';
import { SEVERITY_LEVELS } from '../utils/constants';

const STEPS = [
  { id: 1, label: 'Incident', key: 'incident' },
  { id: 2, label: 'Location', key: 'location' },
  { id: 3, label: 'Evidence', key: 'evidence' },
  { id: 4, label: 'Privacy', key: 'privacy' },
  { id: 5, label: 'Submit', key: 'submit' },
];

const CATEGORIES = [
  {
    value: 'poor_lighting',
    label: 'Poor Lighting',
    icon: Lightbulb,
    desc: 'Broken lamps, dark crosswalks, blackout sectors',
  },
  {
    value: 'harassment',
    label: 'Harassment',
    icon: AlertTriangle,
    desc: 'Verbal, physical, stalking, or hostile encounters',
  },
  {
    value: 'unsafe_intersection',
    label: 'Unsafe Intersection',
    icon: ShieldAlert,
    desc: 'Blind turns, speeding, broken signals, blocked views',
  },
  {
    value: 'suspicious_activity',
    label: 'Suspicious Activity',
    icon: Eye,
    desc: 'Prowling, trespassing, or abnormal disruptions',
  },
  {
    value: 'other',
    label: 'Other',
    sublabel: 'Civic / General Hazard',
    icon: MoreHorizontal,
    desc: 'Anything not listed above — drains, debris, power lines, infrastructure',
  },
];

const ReportIncident = () => {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [title,           setTitle]           = useState('');
  const [description,     setDescription]     = useState('');
  const [category,        setCategory]        = useState('');
  const [severity,        setSeverity]        = useState('medium');
  const [location,        setLocation]        = useState(null);
  const [isAnonymous,     setIsAnonymous]     = useState(false);
  const [reporterContact, setReporterContact] = useState('');
  const [photo,           setPhoto]           = useState(null);
  const [photoPreview,    setPhotoPreview]    = useState(null);
  const [error,           setError]           = useState('');
  const [isSubmitting,    setIsSubmitting]    = useState(false);

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Photo exceeds maximum allowed size of 5 MB.');
      return;
    }
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
    setError('');
  };

  const removePhoto = () => {
    setPhoto(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
  };

  // Step Validation before progressing
  const validateStep = (step) => {
    setError('');
    if (step === 1) {
      if (!title.trim()) {
        setError('Please provide a descriptive headline for the report.');
        return false;
      }
      if (!category) {
        setError('Please select an incident category.');
        return false;
      }
      if (!description.trim()) {
        setError('Please provide a detailed description of the safety concern.');
        return false;
      }
    }
    if (step === 2) {
      if (!location) {
        setError('Please pin the exact location coordinates on the map.');
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 5));
    }
  };

  const prevStep = () => {
    setError('');
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const goToStep = (stepId) => {
    if (stepId < currentStep) {
      setError('');
      setCurrentStep(stepId);
    } else if (validateStep(currentStep)) {
      setCurrentStep(stepId);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');

    if (!title.trim() || !category || !description.trim() || !location) {
      setError('Required fields are missing. Please review previous steps.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('category', category);
      formData.append('severity', severity);
      formData.append('lat', location.lat);
      formData.append('lng', location.lng);
      formData.append('isAnonymous', isAnonymous);
      if (reporterContact.trim()) {
        formData.append('reporterContact', reporterContact.trim());
      }
      if (photo) {
        formData.append('photo', photo);
      }

      const res = await api.post('/incidents', formData);
      const newId = res.data?.data?.incident?._id;

      navigate(`/incidents/${newId}`, { state: { justCreated: true } });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit report. Please try again.');
      setIsSubmitting(false);
    }
  };

  const selectedCategoryMeta = CATEGORIES.find((c) => c.value === category);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[var(--color-bg)] py-8 px-4 sm:px-6 lg:px-8 text-[var(--color-text-primary)]">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* ── Page Intro ────────────────────────────────────────────── */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-primary)]">
            <FileText size={13} strokeWidth={2.5} />
            <span>Guided Incident Filing Workflow</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Report a Neighborhood Hazard
          </h1>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
            Follow the guided steps below to file a verified safety report. Surrounding neighbors within your perimeter will be notified automatically.
          </p>
        </div>

        {/* ── Guided Step Progress Bar ───────────────────────────────── */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-3 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between gap-1 overflow-x-auto">
            {STEPS.map((step, idx) => {
              const isCompleted = step.id < currentStep;
              const isCurrent = step.id === currentStep;

              return (
                <div key={step.id} className="flex items-center flex-1 min-w-[70px]">
                  <button
                    type="button"
                    onClick={() => goToStep(step.id)}
                    className="flex flex-col sm:flex-row items-center gap-1.5 focus:outline-none cursor-pointer group text-left"
                  >
                    {/* Circle Indicator */}
                    <div
                      className={`
                        w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all
                        ${isCurrent
                          ? 'bg-[var(--color-primary)] text-white ring-4 ring-[var(--color-primary-light)]'
                          : isCompleted
                          ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                          : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)] border border-[var(--color-border)]'
                        }
                      `}
                    >
                      {isCompleted ? <Check size={12} strokeWidth={3} /> : step.id}
                    </div>

                    {/* Step Label */}
                    <span
                      className={`
                        text-[11px] font-semibold whitespace-nowrap transition-colors
                        ${isCurrent
                          ? 'text-[var(--color-primary)]'
                          : isCompleted
                          ? 'text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)]'
                          : 'text-[var(--color-text-muted)]'
                        }
                      `}
                    >
                      {step.label}
                    </span>
                  </button>

                  {/* Connecting Line */}
                  {idx < STEPS.length - 1 && (
                    <div
                      className={`
                        h-[2px] flex-1 mx-2 sm:mx-3 transition-colors hidden xs:block
                        ${step.id < currentStep
                          ? 'bg-[var(--color-primary)]'
                          : 'bg-[var(--color-border)]'
                        }
                      `}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Error Banner ────────────────────────────────────────────── */}
        {error && (
          <div className="p-3.5 bg-[var(--color-danger-light)] border border-[var(--color-danger)]/30 rounded-xl flex items-start gap-2.5 text-xs text-[var(--color-danger)] animate-fadeIn">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" strokeWidth={2} />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* ── Workflow Step Containers ───────────────────────────────── */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 sm:p-7 shadow-sm">

          {/* ════ STEP 1: INCIDENT CLASSIFICATION ════ */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div className="border-b border-[var(--color-border-subtle)] pb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-primary)]">
                  Step 1 of 5
                </span>
                <h2 className="text-base font-bold text-[var(--color-text-primary)]">
                  Incident Information
                </h2>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                  Classify the nature of the hazard and describe the current situation clearly.
                </p>
              </div>

              {/* Title */}
              <Input
                id="report-title"
                label="Incident Headline"
                required
                placeholder="E.g., Streetlamp failure at West Market crossing"
                maxLength={120}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                helperText={`${title.length}/120 characters`}
              />

              {/* Category Visual Cards */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                  Select Incident Category <span className="text-[var(--color-danger)]">*</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
                  {CATEGORIES.map((c) => {
                    const Icon = c.icon;
                    const isSelected = category === c.value;
                    return (
                      <div
                        key={c.value}
                        onClick={() => {
                          setCategory(c.value);
                          setError('');
                        }}
                        className={`
                          p-3 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-3
                          ${isSelected
                            ? 'bg-[var(--color-primary-light)] border-[var(--color-primary)] ring-1 ring-[var(--color-primary)] shadow-xs'
                            : 'bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-border-light)] hover:bg-[var(--color-surface-secondary)]'
                          }
                        `}
                      >
                        <div
                          className={`
                            w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                            ${isSelected
                              ? 'bg-[var(--color-primary)] text-white'
                              : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] border border-[var(--color-border)]'
                            }
                          `}
                        >
                          <Icon size={16} strokeWidth={2} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-[var(--color-text-primary)]">
                            {c.label}
                          </h4>
                          {c.sublabel && (
                            <span className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
                              {c.sublabel}
                            </span>
                          )}
                          <p className="text-[11px] text-[var(--color-text-secondary)] leading-tight mt-0.5">
                            {c.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Severity Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                  Risk Severity <span className="text-[var(--color-danger)]">*</span>
                </label>
                <p className="text-[11px] text-[var(--color-text-muted)]">
                  How serious is this hazard right now?
                </p>
                <div className="grid grid-cols-3 gap-2 pt-0.5">
                  {SEVERITY_LEVELS.map((s) => {
                    const isSelected = severity === s.value;
                    return (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => setSeverity(s.value)}
                        className="relative p-3 rounded-xl border transition-all cursor-pointer select-none text-left"
                        style={isSelected ? {
                          backgroundColor: s.bg,
                          borderColor:     s.color,
                          boxShadow:       `0 0 0 2px ${s.color}22`,
                        } : {
                          backgroundColor: 'var(--color-surface)',
                          borderColor:     'var(--color-border)',
                        }}
                      >
                        {/* Severity dot */}
                        <div className="flex items-center gap-2 mb-1">
                          <div style={{
                            width:           10,
                            height:          10,
                            borderRadius:    '50%',
                            backgroundColor: isSelected ? s.color : 'var(--color-border)',
                            flexShrink:      0,
                            transition:      'background-color 0.15s',
                          }} />
                          <span className="text-xs font-bold" style={{ color: isSelected ? s.color : 'var(--color-text-secondary)' }}>
                            {s.label}
                          </span>
                        </div>
                        <p className="text-[10px] leading-snug" style={{ color: isSelected ? s.color : 'var(--color-text-muted)' }}>
                          {s.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <Textarea
                id="report-description"
                label="Detailed Description"
                required
                rows={4}
                maxLength={2000}
                showCount
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Specify exact details: what occurred, ongoing threat level, visible hazards, or landmark notes…"
              />
            </div>
          )}

          {/* ════ STEP 2: LOCATION ════ */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <div className="border-b border-[var(--color-border-subtle)] pb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-primary)]">
                  Step 2 of 5
                </span>
                <h2 className="text-base font-bold text-[var(--color-text-primary)]">
                  Geospatial Incident Location
                </h2>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                  Pin the exact coordinates of the hazard on the map so nearby neighbors can be alerted.
                </p>
              </div>

              <LocationPicker
                value={location}
                onChange={(coords) => {
                  setLocation(coords);
                  setError('');
                }}
              />
            </div>
          )}

          {/* ════ STEP 3: EVIDENCE ════ */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <div className="border-b border-[var(--color-border-subtle)] pb-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-primary)]">
                    Step 3 of 5
                  </span>
                  <h2 className="text-base font-bold text-[var(--color-text-primary)]">
                    Photographic Evidence
                  </h2>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                    Attach a clear photo of the hazard to assist neighbors and municipal response teams.
                  </p>
                </div>
                <span className="text-xs text-[var(--color-text-muted)] bg-[var(--color-surface-secondary)] px-2 py-0.5 rounded-full">
                  Optional
                </span>
              </div>

              {photoPreview ? (
                <div className="space-y-2">
                  <div className="relative rounded-xl overflow-hidden border border-[var(--color-border)] max-h-72 bg-[var(--color-bg)] flex items-center justify-center">
                    <img
                      src={photoPreview}
                      alt="Uploaded incident evidence"
                      className="max-h-72 w-auto object-contain"
                    />
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/70 hover:bg-black text-white hover:text-[var(--color-danger)] transition-colors cursor-pointer"
                      title="Remove attached photo"
                    >
                      <X size={15} strokeWidth={2} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] px-1 font-mono">
                    <span>{photo?.name}</span>
                    <span>{photo?.size ? `${(photo.size / (1024 * 1024)).toFixed(2)} MB` : ''}</span>
                  </div>
                </div>
              ) : (
                <label
                  htmlFor="incident-photo"
                  className="flex flex-col items-center justify-center p-8 border border-dashed border-[var(--color-border)] hover:border-[var(--color-primary)] rounded-xl cursor-pointer bg-[var(--color-surface-secondary)] hover:bg-[var(--color-surface-subtle)] transition-all group select-none text-center"
                >
                  <div className="w-11 h-11 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] group-hover:border-[var(--color-primary)]/40 transition-colors mb-2">
                    <Camera size={20} strokeWidth={2} />
                  </div>
                  <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                    Click to upload photo evidence
                  </span>
                  <span className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                    JPEG, PNG or WEBP • Maximum file size 5 MB
                  </span>
                  <input
                    id="incident-photo"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                </label>
              )}
            </div>
          )}

          {/* ════ STEP 4: PRIVACY ════ */}
          {currentStep === 4 && (
            <div className="space-y-5">
              <div className="border-b border-[var(--color-border-subtle)] pb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-primary)]">
                  Step 4 of 5
                </span>
                <h2 className="text-base font-bold text-[var(--color-text-primary)]">
                  Privacy & Contact Settings
                </h2>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                  Control how your report appears publicly on community maps and neighborhood feeds.
                </p>
              </div>

              {/* Anonymous Toggle */}
              <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] space-y-2">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    id="report-anonymous"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-text-primary)]">
                      <Lock size={13} className="text-[var(--color-primary)]" />
                      <span>Submit Report Anonymously</span>
                    </div>
                    <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5 leading-relaxed">
                      Your name will be hidden from public feeds and community map markers. Encrypted user credentials are kept solely for administrative spam prevention.
                    </p>
                  </div>
                </label>
              </div>

              {/* Optional Reporter Contact */}
              {!isAnonymous && (
                <Input
                  id="report-contact"
                  label="Reporter Contact Info (Optional)"
                  placeholder="Phone number or secondary email for municipal verification"
                  value={reporterContact}
                  onChange={(e) => setReporterContact(e.target.value)}
                  helperText="Only visible to verified municipal administrators for incident follow-up."
                />
              )}
            </div>
          )}

          {/* ════ STEP 5: SUBMIT (REVIEW & DISPATCH) ════ */}
          {currentStep === 5 && (
            <div className="space-y-5">
              <div className="border-b border-[var(--color-border-subtle)] pb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-primary)]">
                  Step 5 of 5
                </span>
                <h2 className="text-base font-bold text-[var(--color-text-primary)]">
                  Review & Dispatch Incident
                </h2>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                  Verify your filing details before broadcasting to neighboring residents and authorities.
                </p>
              </div>

              {/* Review Card */}
              <div className="p-4 sm:p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] space-y-4 text-xs">
                {/* Headline & Category */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-bold text-[var(--color-text-primary)]">
                    {title}
                  </span>
                  {selectedCategoryMeta && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--color-primary-light)] text-[var(--color-primary)]">
                      {selectedCategoryMeta.label}
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed bg-[var(--color-surface)] p-3 rounded-lg border border-[var(--color-border-subtle)]">
                  {description}
                </p>

                {/* Location & Metadata Rows */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-[var(--color-border-subtle)] text-[11px]">
                  <div className="flex items-center gap-1.5 text-[var(--color-text-muted)]">
                    <MapPin size={13} className="text-[var(--color-primary)]" />
                    <span>Coordinates:</span>
                    <strong className="text-[var(--color-text-primary)] font-mono">
                      {location ? `${location.lat.toFixed(4)}°, ${location.lng.toFixed(4)}°` : 'Not set'}
                    </strong>
                  </div>

                  <div className="flex items-center gap-1.5 text-[var(--color-text-muted)]">
                    <Lock size={13} className="text-[var(--color-primary)]" />
                    <span>Privacy Status:</span>
                    <strong className="text-[var(--color-text-primary)]">
                      {isAnonymous ? 'Anonymous Reporting' : 'Public Profile'}
                    </strong>
                  </div>

                  {photo && (
                    <div className="flex items-center gap-1.5 text-[var(--color-text-muted)] sm:col-span-2">
                      <Camera size={13} className="text-[var(--color-primary)]" />
                      <span>Evidence Attached:</span>
                      <strong className="text-[var(--color-text-primary)] font-mono">
                        {photo.name} ({(photo.size / (1024 * 1024)).toFixed(2)} MB)
                      </strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Proximity Dispatch Trust Notice */}
              <div className="flex items-start gap-2 p-3 rounded-lg bg-[var(--color-surface-subtle)] border border-[var(--color-border-subtle)] text-[11px] text-[var(--color-text-secondary)]">
                <Info size={14} className="text-[var(--color-primary)] mt-0.5 flex-shrink-0" />
                <span>
                  Upon submission, SafeStreet automatically dispatches proximity alerts via Socket.IO to residents whose notification perimeters overlap these coordinates.
                </span>
              </div>
            </div>
          )}

          {/* ── Action Navigation Bar ─────────────────────────────────── */}
          <div className="pt-6 mt-6 border-t border-[var(--color-border)] flex items-center justify-between gap-3">
            {currentStep > 1 ? (
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={prevStep}
                disabled={isSubmitting}
                className="gap-1.5"
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </Button>
            ) : (
              <Link to="/">
                <Button variant="ghost" size="md">
                  Cancel
                </Button>
              </Link>
            )}

            {currentStep < 5 ? (
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={nextStep}
                className="gap-1.5 shadow-sm"
              >
                <span>Continue</span>
                <ArrowRight size={14} />
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="gap-2 shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Broadcasting Dispatch…</span>
                  </>
                ) : (
                  <>
                    <Send size={15} strokeWidth={2.2} />
                    <span>Dispatch Incident</span>
                  </>
                )}
              </Button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default ReportIncident;
