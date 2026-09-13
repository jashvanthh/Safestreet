/**
 * pages/ReportIncident.jsx
 *
 * Full incident reporting form. Built here rather than in a component file
 * because it's a full page with its own routing concern.
 *
 * MULTIPART FORM SUBMISSION (important for viva):
 *   When uploading a file, we CANNOT use JSON.
 *   We must use FormData and set Content-Type: multipart/form-data.
 *   Axios detects FormData automatically and sets the right header.
 *
 *   Text fields go into FormData like:  formData.append('title', title)
 *   Files go in like:                   formData.append('photo', file)
 *
 *   On the server, Multer reads the multipart body:
 *     • Text fields → req.body
 *     • File → req.file (streamed to GridFS)
 *
 * PHOTO PREVIEW:
 *   URL.createObjectURL(file) creates a temporary local URL for the file.
 *   The browser can render it as an <img> without uploading it.
 *   This URL is only valid while the page is open.
 *
 * COORDINATE ORDER REMINDER:
 *   LocationPicker gives us { lat, lng }  (human/Leaflet order)
 *   We send lat and lng as separate FormData fields.
 *   The server controller converts to GeoJSON [lng, lat] order.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import LocationPicker from '../components/LocationPicker';

const CATEGORIES = [
  { value: 'poor_lighting',       label: '💡 Poor Lighting' },
  { value: 'harassment',          label: '⚠️ Harassment' },
  { value: 'unsafe_intersection', label: '🚦 Unsafe Intersection' },
  { value: 'suspicious_activity', label: '👁️ Suspicious Activity' },
  { value: 'other',               label: '📌 Other' },
];

const ReportIncident = () => {
  const navigate = useNavigate();

  // Form state
  const [title,           setTitle]           = useState('');
  const [description,     setDescription]     = useState('');
  const [category,        setCategory]        = useState('');
  const [location,        setLocation]        = useState(null);   // { lat, lng }
  const [isAnonymous,     setIsAnonymous]     = useState(false);
  const [reporterContact, setReporterContact] = useState('');
  const [photo,           setPhoto]           = useState(null);   // File object
  const [photoPreview,    setPhotoPreview]    = useState(null);   // Blob URL
  const [error,           setError]           = useState('');
  const [isSubmitting,    setIsSubmitting]    = useState(false);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Photo must be under 5 MB');
      return;
    }
    setPhoto(file);
    // URL.createObjectURL creates a local preview URL — no upload yet
    setPhotoPreview(URL.createObjectURL(file));
    setError('');
  };

  const removePhoto = () => {
    setPhoto(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);  // Free memory
    setPhotoPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (!title.trim())   return setError('Title is required');
    if (!description.trim()) return setError('Description is required');
    if (!category)       return setError('Please select a category');
    if (!location)       return setError('Please pin the incident location on the map');

    setIsSubmitting(true);
    try {
      // Use FormData — required when sending a file
      // Axios automatically sets Content-Type: multipart/form-data
      const formData = new FormData();
      formData.append('title',           title.trim());
      formData.append('description',     description.trim());
      formData.append('category',        category);
      formData.append('lat',             location.lat);   // Server receives as string, parseFloat()s it
      formData.append('lng',             location.lng);
      formData.append('isAnonymous',     isAnonymous);
      formData.append('reporterContact', reporterContact);
      if (photo) {
        formData.append('photo', photo);  // Multer picks this up as req.file
      }

      const res = await api.post('/incidents', formData);
      const newId = res.data.data.incident._id;

      navigate(`/incidents/${newId}`, { state: { justCreated: true } });

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-1">📢 Report an Incident</h1>
          <p className="text-slate-400 text-sm">
            Help your community by reporting a safety concern.
          </p>
        </div>

        {/* Form card */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-6">

          {error && (
            <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>

            {/* Title */}
            <div>
              <label htmlFor="ri-title" className="block text-sm text-slate-300 mb-1.5 font-medium">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                id="ri-title" type="text" value={title}
                onChange={(e) => { setTitle(e.target.value); setError(''); }}
                placeholder="Brief description of the issue"
                maxLength={120}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
              <p className="text-slate-600 text-xs mt-1 text-right">{title.length}/120</p>
            </div>

            {/* Category */}
            <div>
              <label htmlFor="ri-category" className="block text-sm text-slate-300 mb-1.5 font-medium">
                Category <span className="text-red-400">*</span>
              </label>
              <select
                id="ri-category" value={category}
                onChange={(e) => { setCategory(e.target.value); setError(''); }}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              >
                <option value="">Select a category</option>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="ri-description" className="block text-sm text-slate-300 mb-1.5 font-medium">
                Description <span className="text-red-400">*</span>
              </label>
              <textarea
                id="ri-description" rows={4} value={description}
                onChange={(e) => { setDescription(e.target.value); setError(''); }}
                placeholder="Describe the incident in detail — what happened, when, who was involved..."
                maxLength={2000}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
              />
              <p className="text-slate-600 text-xs mt-1 text-right">{description.length}/2000</p>
            </div>

            {/* Location picker */}
            <div>
              <label className="block text-sm text-slate-300 mb-1.5 font-medium">
                Location <span className="text-red-400">*</span>
              </label>
              <LocationPicker value={location} onChange={(coords) => { setLocation(coords); setError(''); }} />
            </div>

            {/* Photo upload */}
            <div>
              <label className="block text-sm text-slate-300 mb-1.5 font-medium">
                Photo <span className="text-slate-500">(optional, max 5 MB)</span>
              </label>
              {photoPreview ? (
                <div className="relative w-full max-w-xs">
                  <img src={photoPreview} alt="Preview" className="w-full h-40 object-cover rounded-lg border border-slate-600" />
                  <button
                    type="button" onClick={removePhoto}
                    className="absolute top-2 right-2 bg-red-600 hover:bg-red-500 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center"
                  >✕</button>
                </div>
              ) : (
                <label
                  htmlFor="ri-photo"
                  className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-slate-600 hover:border-slate-500 rounded-xl cursor-pointer transition-colors"
                >
                  <span className="text-2xl mb-1">📷</span>
                  <span className="text-slate-400 text-sm">Click to upload photo</span>
                  <span className="text-slate-600 text-xs">JPEG, PNG, WEBP</span>
                  <input
                    id="ri-photo" type="file" accept="image/jpeg,image/png,image/webp"
                    className="hidden" onChange={handlePhotoChange}
                  />
                </label>
              )}
            </div>

            {/* Anonymous toggle */}
            <div className="flex items-start gap-3 bg-slate-900/50 border border-slate-700 rounded-xl p-4">
              <input
                id="ri-anon" type="checkbox" checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="mt-0.5 accent-blue-500 w-4 h-4"
              />
              <div>
                <label htmlFor="ri-anon" className="text-slate-300 text-sm font-medium cursor-pointer">
                  Submit anonymously
                </label>
                <p className="text-slate-500 text-xs mt-0.5">
                  Your name will not be shown publicly. We still record it internally for abuse prevention.
                </p>
              </div>
            </div>

            {/* Contact (only shown when NOT anonymous) */}
            {!isAnonymous && (
              <div>
                <label htmlFor="ri-contact" className="block text-sm text-slate-300 mb-1.5">
                  Contact info <span className="text-slate-500">(optional — for follow-up)</span>
                </label>
                <input
                  id="ri-contact" type="text" value={reporterContact}
                  onChange={(e) => setReporterContact(e.target.value)}
                  placeholder="Phone number or email"
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            )}

            {/* Submit */}
            <button
              type="submit" disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting…
                </>
              ) : '📢 Submit Report'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReportIncident;
