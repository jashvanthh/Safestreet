/**
 * pages/LandingPage.jsx
 *
 * SafeStreet — Premium Public Product Landing Page.
 * Built for civic trust, geographic awareness, and neighborhood safety intelligence.
 *
 * Structure:
 * 1. Hero: Editorial headline, value proposition, CTAs, trust statement
 * 2. Hero Visual: Interactive Leaflet map product preview with category pins
 * 3. Value Strip: Minimal horizontal strip (Report, Discover, Stay Informed)
 * 4. How It Works: Numbered editorial layout (01 Report, 02 Connect, 03 Respond, 04 Learn)
 * 5. Reporting Feature: Split layout with UI preview of guided report form
 * 6. Privacy & Trust: Anonymous reporting without commercial surveillance
 * 7. Live Safety Map: Geospatial exploration, status filters, heatmap visualization
 * 8. Proximity Alerts: Real-time notification dispatch previews
 * 9. Weekly Safety Digest: Editorial data visualization & retrospective intelligence
 * 10. Community / Civic Purpose: How small observations reveal larger neighborhood patterns
 * 11. Final CTA: Clean sage background with prominent action buttons
 * 12. Footer: SaaS-style footer with accurate product links
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import {
  MapPin,
  Shield,
  Bell,
  Lock,
  ArrowRight,
  CheckCircle2,
  Lightbulb,
  ShieldAlert,
  Camera,
  Map as MapIcon,
  Eye,
  Clock,
  FileText,
  Radio,
  ChevronRight,
} from 'lucide-react';
import { Button } from '../components/ui';
import StatusBadge from '../components/StatusBadge';
import { createCustomPin } from '../utils/mapIcons';
import { DEFAULT_MAP_CENTER } from '../utils/constants';

// Demonstration data for realistic map exploration
const DEMO_INCIDENTS = [
  {
    id: 'demo-1',
    category: 'poor_lighting',
    categoryLabel: 'Poor Lighting',
    title: 'Pedestrian Crossing Illumination Outage',
    description: 'Two overhead municipal streetlamps non-functional for 48 hours. Reduced visibility for night crosswalk users.',
    lat: 17.3875,
    lng: 78.4895,
    time: '2 hours ago',
    status: 'under_review',
    distance: '0.6 km away',
  },
  {
    id: 'demo-2',
    category: 'unsafe_intersection',
    categoryLabel: 'Unsafe Intersection',
    title: 'Blind Turn Sidewalk Obstruction',
    description: 'Heavy construction debris obstructing sidewalk; forcing pedestrians into active roadway around corner.',
    lat: 17.3820,
    lng: 78.4830,
    time: 'Yesterday',
    status: 'reported',
    distance: '1.2 km away',
  },
  {
    id: 'demo-3',
    category: 'other',
    categoryLabel: 'Civic Hazard',
    title: 'Open Drainage Cover Repaired',
    description: 'Sidewalk drainage slab cracked near transit stop. Municipal maintenance team placed concrete barrier.',
    lat: 17.3890,
    lng: 78.4820,
    time: '3 days ago',
    status: 'resolved',
    distance: '1.8 km away',
  },
];

const LandingPage = () => {
  const [activePinId, setActivePinId] = useState('demo-1');
  const [mapCategoryFilter, setMapCategoryFilter] = useState('all');

  const filteredDemoPins = mapCategoryFilter === 'all'
    ? DEMO_INCIDENTS
    : DEMO_INCIDENTS.filter((p) => p.category === mapCategoryFilter);

  return (
    <div className="bg-[var(--color-bg)] text-[var(--color-text-primary)] selection:bg-[var(--color-primary-light)] selection:text-[var(--color-primary)]">

      {/* ── 1. Hero Section ─────────────────────────────────────────── */}
      <section className="relative pt-12 pb-16 sm:pt-16 sm:pb-20 overflow-hidden border-b border-[var(--color-border)] bg-gradient-to-b from-[var(--color-bg)] via-[var(--color-bg)] to-[var(--color-surface)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">

            {/* Left Column: Editorial Value Proposition (7 cols) */}
            <div className="lg:col-span-7 space-y-6">

              {/* Eyebrow Pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold text-[var(--color-primary)] bg-[var(--color-primary-light)] border border-[var(--color-primary)]/20 shadow-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-primary)] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-primary)]"></span>
                </span>
                <span className="tracking-wide uppercase text-[11px] font-bold">Community Safety Intelligence</span>
              </div>

              {/* Editorial Headline */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[var(--color-text-primary)] leading-[1.12]">
                Know what's happening around your{' '}
                <span className="text-[var(--color-primary)] underline decoration-[var(--color-primary-light)] decoration-wavy underline-offset-4">
                  neighborhood
                </span>
                .
              </h1>

              {/* Supporting Copy */}
              <p className="text-base sm:text-lg text-[var(--color-text-secondary)] leading-relaxed max-w-xl">
                SafeStreet gives residents a transparent way to report local hazards, discover community hotspots on a live map, and receive instant proximity dispatches when incidents happen nearby.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link to="/report">
                  <Button variant="primary" size="lg" className="gap-2 shadow-xs group">
                    <span>Report a concern</span>
                    <ArrowRight size={16} strokeWidth={2.2} className="transition-transform group-hover:translate-x-0.5" />
                  </Button>
                </Link>
                <a href="#safety-map">
                  <Button variant="secondary" size="lg" className="gap-2 bg-[var(--color-surface)] border-[var(--color-border)] hover:bg-[var(--color-surface-secondary)]">
                    <MapIcon size={16} strokeWidth={2} className="text-[var(--color-primary)]" />
                    <span>Explore safety map</span>
                  </Button>
                </a>
              </div>

              {/* Trust Badge & Micro-Proof */}
              <div className="pt-2 border-t border-[var(--color-border)]/70 space-y-3">
                <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                  <CheckCircle2 size={15} className="text-[var(--color-primary)] flex-shrink-0" />
                  <span className="font-medium">Built for residents. Designed for civic trust.</span>
                  <span className="text-[var(--color-border)]">•</span>
                  <span className="text-[var(--color-text-muted)]">Zero commercial surveillance</span>
                </div>

                {/* Micro Metrics Strip */}
                <div className="grid grid-cols-3 gap-3 pt-1 max-w-lg text-xs">
                  <div className="p-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]/80">
                    <div className="text-sm font-bold text-[var(--color-text-primary)] font-mono">0.5 - 50 km</div>
                    <div className="text-[10px] text-[var(--color-text-muted)] leading-tight">Adaptive Alert Radius</div>
                  </div>
                  <div className="p-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]/80">
                    <div className="text-sm font-bold text-[var(--color-primary)] font-mono">&lt; 24h</div>
                    <div className="text-[10px] text-[var(--color-text-muted)] leading-tight">Municipal Triage Time</div>
                  </div>
                  <div className="p-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]/80">
                    <div className="text-sm font-bold text-[var(--color-text-primary)] font-mono">100%</div>
                    <div className="text-[10px] text-[var(--color-text-muted)] leading-tight">Anonymous Option</div>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column: High-End 3D Civic Map Visual & Interactive Badges (5 cols) */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                
                {/* Main Image Frame */}
                <div className="relative rounded-2xl border border-[var(--color-border)] overflow-hidden shadow-lg shadow-emerald-950/5 bg-[var(--color-surface)] group">
                  <img
                    src="/hero-civic-map.jpg"
                    alt="SafeStreet Civic Safety Mapping Visualization"
                    className="w-full h-auto object-cover object-center transition-transform duration-700 group-hover:scale-102"
                    loading="eager"
                  />
                  <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-2xl pointer-events-none" />
                </div>

                {/* Floating Telemetry Badge 1 (Top Left) */}
                <div className="absolute -top-3 -left-3 sm:-top-4 sm:-left-4 z-10 bg-[var(--color-surface)]/95 backdrop-blur-md border border-[var(--color-border)] rounded-xl p-3 shadow-md shadow-slate-900/5 max-w-[210px] space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-[var(--color-success-light)] text-[var(--color-success)] flex items-center justify-center">
                      <CheckCircle2 size={12} strokeWidth={2.5} />
                    </span>
                    <span className="text-[11px] font-bold text-[var(--color-text-primary)]">Streetlight Restored</span>
                  </div>
                  <p className="text-[10px] text-[var(--color-text-secondary)] pl-6 leading-tight">
                    Park Avenue crosswalk illumination verified by municipal crew.
                  </p>
                </div>

                {/* Floating Telemetry Badge 2 (Bottom Right) */}
                <div className="absolute -bottom-3 -right-3 sm:-bottom-4 sm:-right-4 z-10 bg-[var(--color-surface)]/95 backdrop-blur-md border border-[var(--color-border)] rounded-xl p-3 shadow-md shadow-slate-900/5 max-w-[220px] space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[var(--color-text-primary)]">
                      <Radio size={12} className="text-[var(--color-primary)] animate-pulse" />
                      Perimeter Active
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-[var(--color-primary-light)] text-[var(--color-primary)] font-semibold">
                      2.0 km
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-[var(--color-text-muted)] border-t border-[var(--color-border-subtle)] pt-1">
                    <span>Monitored Zone</span>
                    <span className="text-[var(--color-primary)] font-medium">3 Reports Active</span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 2. Hero Visual: Realistic Leaflet Map Product Preview ────── */}
      <section className="py-12 sm:py-16 bg-[var(--color-surface)] border-b border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

          {/* Map Preview Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">
                Geospatial Incident Explorer
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
                Live Neighborhood Safety Canvas
              </h2>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">
                Click pins to inspect incident dossiers, verified timestamps, and proximity distance measurements.
              </p>
            </div>
            <Link to="/map">
              <Button variant="secondary" size="sm" className="gap-1.5 self-start md:self-auto">
                <span>Launch Full Map Console</span>
                <ChevronRight size={14} />
              </Button>
            </Link>
          </div>

          {/* Map Preview Shell */}
          <div className="rounded-xl border border-[var(--color-border)] overflow-hidden shadow-sm bg-[var(--color-bg)]">

            {/* Minimal Map Control Header */}
            <div className="px-4 py-3 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] font-medium">
                  <Radio size={12} className="text-[var(--color-primary)] animate-pulse" />
                  <span>Live Community Perimeter</span>
                </span>
                <span className="hidden sm:inline text-[var(--color-text-muted)] font-mono">
                  17.3850° N, 78.4867° E
                </span>
              </div>

              {/* Category Filter Pills on Preview */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setMapCategoryFilter('all')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                    mapCategoryFilter === 'all'
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  All (3)
                </button>
                <button
                  type="button"
                  onClick={() => setMapCategoryFilter('poor_lighting')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                    mapCategoryFilter === 'poor_lighting'
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  Lighting
                </button>
                <button
                  type="button"
                  onClick={() => setMapCategoryFilter('unsafe_intersection')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                    mapCategoryFilter === 'unsafe_intersection'
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  Intersections
                </button>
              </div>
            </div>

            {/* Interactive Leaflet Map Container */}
            <div className="relative h-80 sm:h-[420px] w-full">
              <MapContainer
                center={DEFAULT_MAP_CENTER}
                zoom={14}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
                scrollWheelZoom={false}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />

                {/* Demonstration Pins */}
                {filteredDemoPins.map((pin) => {
                  const isSelected = activePinId === pin.id;
                  return (
                    <Marker
                      key={pin.id}
                      position={[pin.lat, pin.lng]}
                      icon={createCustomPin(pin.category, isSelected)}
                      eventHandlers={{
                        click: () => setActivePinId(pin.id),
                      }}
                    >
                      <Popup className="custom-popup">
                        <div className="min-w-[200px] max-w-[240px] p-1 space-y-2">
                          <div className="flex items-center justify-between gap-1">
                            <StatusBadge status={pin.status} size="sm" />
                            <span className="text-[10px] font-mono text-[var(--color-text-muted)]">
                              {pin.categoryLabel}
                            </span>
                          </div>

                          <h4 className="font-bold text-xs text-[var(--color-text-primary)] leading-snug">
                            {pin.title}
                          </h4>

                          <p className="text-[11px] text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed">
                            {pin.description}
                          </p>

                          <div className="pt-2 border-t border-[var(--color-border)] flex items-center justify-between text-[10px] text-[var(--color-text-muted)]">
                            <span>{pin.time}</span>
                            <span className="text-[var(--color-primary)] font-semibold">
                              {pin.distance}
                            </span>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>

              {/* Floating Map Hint */}
              <div className="absolute bottom-3 left-3 z-[1000] bg-[var(--color-surface)]/95 backdrop-blur-md border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-[11px] text-[var(--color-text-secondary)] shadow-xs flex items-center gap-2 pointer-events-none">
                <MapPin size={13} className="text-[var(--color-primary)]" />
                <span>Interactive SafeStreet Product Preview • Click pins to inspect details</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ── 3. Value Strip (Minimal Horizontal Value Section) ────────── */}
      <section className="py-10 bg-[var(--color-bg)] border-b border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[var(--color-border)]">

            {/* Item 1: Report */}
            <div className="py-4 md:py-0 md:px-8 first:pl-0 flex items-start gap-4">
              <div className="w-9 h-9 rounded-lg bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center flex-shrink-0 mt-0.5">
                <FileText size={17} strokeWidth={2.2} />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)]">
                  Report
                </span>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  Report concerns from your neighborhood with precision locations and evidence.
                </p>
              </div>
            </div>

            {/* Item 2: Discover */}
            <div className="py-4 md:py-0 md:px-8 flex items-start gap-4">
              <div className="w-9 h-9 rounded-lg bg-[var(--color-secondary-light)] text-[var(--color-primary)] flex items-center justify-center flex-shrink-0 mt-0.5">
                <MapIcon size={17} strokeWidth={2.2} />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)]">
                  Discover
                </span>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  Explore safety incidents on the live interactive map and category heatmap.
                </p>
              </div>
            </div>

            {/* Item 3: Stay Informed */}
            <div className="py-4 md:py-0 md:px-8 last:pr-0 flex items-start gap-4">
              <div className="w-9 h-9 rounded-lg bg-[var(--color-warning-light)] text-[var(--color-warning)] flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bell size={17} strokeWidth={2.2} />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)]">
                  Stay Informed
                </span>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  Receive real-time proximity alerts for verified reports within your perimeter.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 4. How It Works (Numbered Editorial Layout) ─────────────── */}
      <section id="how-it-works" className="py-16 sm:py-24 bg-[var(--color-surface)] border-b border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">

          <div className="max-w-2xl space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">
              Architecture & Lifecycle
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
              How SafeStreet works
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              Five structured phases that turn individual observations into collective community protection.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">

            {/* 01 Report */}
            <div className="space-y-3 pt-4 border-t-2 border-[var(--color-primary)]">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-[var(--color-primary)] block">
                01
              </span>
              <h3 className="text-sm sm:text-base font-bold text-[var(--color-text-primary)]">
                Report
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                Describe the incident, select a safety category, and attach photo evidence. Choose public attribution or submit anonymously.
              </p>
            </div>

            {/* 02 Locate */}
            <div className="space-y-3 pt-4 border-t-2 border-[var(--color-primary)]">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-[var(--color-primary)] block">
                02
              </span>
              <h3 className="text-sm sm:text-base font-bold text-[var(--color-text-primary)]">
                Locate
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                Pin precise geographic coordinates using GPS or the interactive OpenStreetMap selector to ensure exact municipal response.
              </p>
            </div>

            {/* 03 Alert */}
            <div className="space-y-3 pt-4 border-t-2 border-[var(--color-primary)]">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-[var(--color-primary)] block">
                03
              </span>
              <h3 className="text-sm sm:text-base font-bold text-[var(--color-text-primary)]">
                Alert
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                SafeStreet calculates spatial proximity and dispatches real-time alerts to residents who configured a matching notification perimeter.
              </p>
            </div>

            {/* 04 Respond */}
            <div className="space-y-3 pt-4 border-t-2 border-[var(--color-primary)]">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-[var(--color-primary)] block">
                04
              </span>
              <h3 className="text-sm sm:text-base font-bold text-[var(--color-text-primary)]">
                Respond
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                Verified reports are reviewed by authorized responders and advanced through the transparent status pipeline from triage to resolution.
              </p>
            </div>

            {/* 05 Understand */}
            <div className="space-y-3 pt-4 border-t-2 border-[var(--color-primary)]">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-[var(--color-primary)] block">
                05
              </span>
              <h3 className="text-sm sm:text-base font-bold text-[var(--color-text-primary)]">
                Understand
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                Weekly neighborhood digests aggregate local safety telemetry, recurring hotspot density, and week-over-week trends.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ── 5. Reporting Feature (Clean Split Layout) ────────────────── */}
      <section className="py-16 sm:py-24 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            {/* Left: Text & Explanation (5 Cols) */}
            <div className="lg:col-span-5 space-y-5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold text-[var(--color-primary)] bg-[var(--color-primary-light)]">
                <span>Guided Incident Submission</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-primary)] leading-tight">
                Turn a concern into a community signal.
              </h2>

              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                SafeStreet makes reporting effortless while maintaining the strict data fidelity required by community associations and municipal teams.
              </p>

              <div className="space-y-3 text-xs text-[var(--color-text-secondary)] pt-2">
                <div className="flex items-center gap-2">
                  <Lightbulb size={15} className="text-[var(--color-warning)]" />
                  <span><strong>Poor street lighting:</strong> Dark pathways and broken illumination fixtures</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldAlert size={15} className="text-[var(--color-danger)]" />
                  <span><strong>Unsafe intersections:</strong> Blind crossings, speeding hazards, and blocked visibility</span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye size={15} className="text-[var(--color-primary)]" />
                  <span><strong>Suspicious activity:</strong> Prowling or abnormal neighborhood disruptions</span>
                </div>
                <div className="flex items-center gap-2">
                  <Camera size={15} className="text-[var(--color-secondary)]" />
                  <span><strong>Evidence upload:</strong> Sub-5MB photo streaming directly to MongoDB GridFS</span>
                </div>
              </div>

              <div className="pt-2">
                <Link to="/report">
                  <Button variant="primary" size="md" className="gap-2 shadow-sm">
                    <span>File a safety report</span>
                    <ChevronRight size={14} />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right: UI Preview of Actual SafeStreet Form (7 Cols) */}
            <div className="lg:col-span-7">
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6 shadow-sm space-y-4 text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[var(--color-primary)] text-white font-bold flex items-center justify-center text-[10px]">
                      1
                    </span>
                    <span className="font-bold uppercase tracking-wider text-[var(--color-text-primary)]">
                      Incident Details Preview
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[var(--color-text-muted)]">Step 1 of 5</span>
                </div>

                {/* Mock Headline */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase">
                    Incident Headline
                  </label>
                  <div className="p-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] font-medium text-[var(--color-text-primary)]">
                    Main crossing illumination failure on 5th Avenue
                  </div>
                </div>

                {/* Mock Category Chips */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase">
                    Category Classification
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded-lg border border-[var(--color-primary)] bg-[var(--color-primary-light)] font-medium text-[var(--color-primary)] flex items-center gap-2">
                      <Lightbulb size={13} />
                      <span>Poor Lighting</span>
                    </div>
                    <div className="p-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-secondary)] flex items-center gap-2">
                      <ShieldAlert size={13} />
                      <span>Unsafe Intersection</span>
                    </div>
                  </div>
                </div>

                {/* Mock Location Pin */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-[var(--color-text-secondary)] uppercase">Geotagged Location</span>
                    <span className="font-mono text-[var(--color-primary)] font-semibold">17.3875°, 78.4895°</span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] flex items-center justify-between text-[11px] text-[var(--color-text-secondary)]">
                    <span className="flex items-center gap-1.5">
                      <MapPin size={12} className="text-[var(--color-primary)]" />
                      Pinned to OpenStreetMap Leaflet Canvas
                    </span>
                    <span className="text-[var(--color-success)] font-medium">Verified</span>
                  </div>
                </div>

                {/* Mock Anonymous Toggle */}
                <div className="p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock size={13} className="text-[var(--color-primary)]" />
                    <span className="font-medium text-[var(--color-text-primary)]">Submit Report Anonymously</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] font-bold">
                    Enabled
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 6. Privacy / Anonymous Reporting Section ────────────────── */}
      <section id="privacy" className="py-16 sm:py-24 bg-[var(--color-surface)] border-b border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-[var(--color-primary)] bg-[var(--color-primary-light)]">
              <Lock size={12} />
              <span>Civic Trust & Privacy Protocol</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-[var(--color-text-primary)]">
              Speak up without putting yourself in the spotlight.
            </h2>
            <p className="text-sm sm:text-base text-[var(--color-text-secondary)] leading-relaxed">
              SafeStreet is designed to empower neighbors, not monetize surveillance. Our privacy protections ensure you can report safety hazards safely and transparently.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Privacy Feature 1 */}
            <div className="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] space-y-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center">
                <Lock size={16} strokeWidth={2.2} />
              </div>
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                Anonymous Public Attribution
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                When you choose anonymous reporting, your name and profile are stripped from community map markers, notifications, and public activity feeds.
              </p>
            </div>

            {/* Privacy Feature 2 */}
            <div className="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] space-y-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center">
                <Shield size={16} strokeWidth={2.2} />
              </div>
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                Zero Commercial Ad Tracking
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                We never sell location profiles, track behavioral ad cookies, or commercialize community reporting data to third-party data brokers.
              </p>
            </div>

            {/* Privacy Feature 3 */}
            <div className="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] space-y-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center">
                <FileText size={16} strokeWidth={2.2} />
              </div>
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                Optional Follow-Up Contact
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                You can optionally provide secondary contact info solely for verified municipal triage teams to confirm hazard resolution details.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ── 7. Live Safety Map Section ──────────────────────────────── */}
      <section id="safety-map" className="py-16 sm:py-24 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

          <div className="max-w-2xl space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">
              Geographic Exploration
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
              See where concerns are happening.
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              Explore reported incidents geographically and filter by category, status, and viewport boundary in real time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <div className="p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] block">
                Category Filtering
              </span>
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                Multi-Classification Views
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                Filter map pins instantly by Poor Lighting, Unsafe Intersections, Harassment, or Suspicious Activity to analyze specific hazards.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] block">
                Resolution Progression
              </span>
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                Follow Report Status
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                Track issues as they move from Reported to Under Review by municipal responders, and finally to Resolved once repairs conclude.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] block">
                Geospatial Heatmap
              </span>
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                Incident Hotspots
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                Toggle the density heatmap layer to visually identify spatial clusters and recurring hazard concentrations across streets.
              </p>
            </div>

          </div>

          <div className="pt-2 text-center">
            <Link to="/map">
              <Button variant="primary" size="lg" className="gap-2 shadow-sm">
                <MapIcon size={16} strokeWidth={2} />
                <span>Open full safety map</span>
              </Button>
            </Link>
          </div>

        </div>
      </section>

      {/* ── 8. Proximity Alerts Section ─────────────────────────────── */}
      <section className="py-16 sm:py-24 bg-[var(--color-surface)] border-b border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">

            {/* Left: Explanation (6 Cols) */}
            <div className="lg:col-span-6 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-[var(--color-primary)] bg-[var(--color-primary-light)]">
                <Bell size={13} />
                <span>Socket.IO Proximity Engine</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-primary)] leading-tight">
                Stay aware of what happens nearby.
              </h2>

              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                SafeStreet calculates spatial proximity against your personal notification perimeter. Whenever an incident is reported inside your zone, instant dispatches are pushed directly to your account.
              </p>

              <div className="space-y-2 text-xs text-[var(--color-text-secondary)] pt-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-[var(--color-primary)]" />
                  <span>Customizable perimeter radius from 0.5 km to 50 km</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-[var(--color-primary)]" />
                  <span>Instant socket dispatches with distance measurements</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-[var(--color-primary)]" />
                  <span>Dedicated Proximity Inbox for historical incident tracking</span>
                </div>
              </div>
            </div>

            {/* Right: UI Dispatch Cards Preview (6 Cols) */}
            <div className="lg:col-span-6 space-y-3">
              {/* Alert Card 1 */}
              <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] shadow-xs space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--color-warning)] bg-[var(--color-warning-light)] px-2 py-0.5 rounded-full">
                    <Lightbulb size={12} />
                    Poor street lighting
                  </span>
                  <span className="text-[10px] font-mono text-[var(--color-text-muted)] flex items-center gap-1">
                    <Clock size={11} /> 12 mins ago
                  </span>
                </div>
                <h4 className="text-xs font-bold text-[var(--color-text-primary)]">
                  Streetlight fixture out on West Market Crosswalk
                </h4>
                <div className="pt-1 flex items-center justify-between text-[11px] text-[var(--color-text-muted)] font-mono border-t border-[var(--color-border-subtle)]">
                  <span>Proximity: <strong>0.8 km away</strong></span>
                  <span className="text-[var(--color-primary)] font-medium">Inside 2.0 km perimeter</span>
                </div>
              </div>

              {/* Alert Card 2 */}
              <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] shadow-xs space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--color-danger)] bg-[var(--color-danger-light)] px-2 py-0.5 rounded-full">
                    <ShieldAlert size={12} />
                    Unsafe Intersection
                  </span>
                  <span className="text-[10px] font-mono text-[var(--color-text-muted)] flex items-center gap-1">
                    <Clock size={11} /> 2 hours ago
                  </span>
                </div>
                <h4 className="text-xs font-bold text-[var(--color-text-primary)]">
                  Blind corner hazard near elementary school
                </h4>
                <div className="pt-1 flex items-center justify-between text-[11px] text-[var(--color-text-muted)] font-mono border-t border-[var(--color-border-subtle)]">
                  <span>Proximity: <strong>1.4 km away</strong></span>
                  <span className="text-[var(--color-primary)] font-medium">Inside 2.0 km perimeter</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 9. Weekly Safety Digest Section ─────────────────────────── */}
      <section className="py-16 sm:py-24 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

          <div className="max-w-2xl space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">
              Retrospective Analytics
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
              Understand the pattern, not just the incident.
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              Every Sunday, SafeStreet aggregates 7-day retrospective intelligence for your perimeter, highlighting changes in local activity and category distributions.
            </p>
          </div>

          {/* Editorial Data Visualization Preview */}
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--color-border)] text-xs">
              <div className="space-y-0.5">
                <span className="font-mono text-[11px] text-[var(--color-text-muted)]">DEMONSTRATION RETROSPECTIVE PREVIEW</span>
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                  Weekly Neighborhood Safety Telemetry
                </h3>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-success)] bg-[var(--color-success-light)] px-2.5 py-1 rounded-md">
                <span>Activity Decreased ↓ 33%</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
              <div className="space-y-1">
                <span className="text-[11px] text-[var(--color-text-muted)] uppercase">Total Incidents This Week</span>
                <div className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-primary)] font-mono">
                  3
                </div>
                <p className="text-[11px] text-[var(--color-text-secondary)]">Down from 5 in previous cycle</p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-[var(--color-text-muted)] uppercase">Primary Category</span>
                <div className="text-base font-bold text-[var(--color-text-primary)]">
                  Poor Lighting (67%)
                </div>
                <p className="text-[11px] text-[var(--color-text-secondary)]">2 of 3 reports logged</p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-[var(--color-text-muted)] uppercase">Remediated Cases</span>
                <div className="text-base font-bold text-[var(--color-success)]">
                  1 Case Closed
                </div>
                <p className="text-[11px] text-[var(--color-text-secondary)]">Sidewalk drainage fixed</p>
              </div>
            </div>

            {/* Category Bars */}
            <div className="space-y-3 pt-2 border-t border-[var(--color-border-subtle)] text-xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                Hazard Distribution
              </span>
              <div className="space-y-2">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="font-medium text-[var(--color-text-primary)]">Poor Lighting</span>
                    <span className="font-mono text-[var(--color-text-muted)]">67%</span>
                  </div>
                  <div className="w-full bg-[var(--color-surface-secondary)] rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-[var(--color-warning)] rounded-full w-[67%]" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="font-medium text-[var(--color-text-primary)]">Unsafe Intersection</span>
                    <span className="font-mono text-[var(--color-text-muted)]">33%</span>
                  </div>
                  <div className="w-full bg-[var(--color-surface-secondary)] rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-[var(--color-primary)] rounded-full w-[33%]" />
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── 10. Community / Civic Purpose Section ───────────────────── */}
      <section id="community-safety" className="py-16 sm:py-24 bg-[var(--color-surface)] border-b border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-[var(--color-primary)] bg-[var(--color-primary-light)]">
              <Shield size={12} />
              <span>Civic Co-Responsibility</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-[var(--color-text-primary)]">
              Small observations reveal larger neighborhood patterns.
            </h2>
            <p className="text-sm sm:text-base text-[var(--color-text-secondary)] leading-relaxed">
              When a resident flags a broken streetlight or an obscured crosswalk, it helps neighbors avoid hazardous routes and provides authorized municipal personnel with the actionable data required to prioritize community repairs.
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              SafeStreet does not claim to eradicate crime—it provides communities with transparent, reliable tools to report, understand, and respond to neighborhood concerns together.
            </p>
          </div>
        </div>
      </section>

      {/* ── 11. Final CTA Section ───────────────────────────────────── */}
      <section className="py-16 sm:py-24 bg-[var(--color-surface-subtle)] border-b border-[var(--color-border)] text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[var(--color-text-primary)]">
            Make your neighborhood easier to understand.
          </h2>
          <p className="text-sm sm:text-base text-[var(--color-text-secondary)] leading-relaxed max-w-xl mx-auto">
            Report a concern, explore the map, and stay informed about what's happening nearby.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link to="/report">
              <Button variant="primary" size="lg" className="gap-2 shadow-sm">
                <span>Report a concern</span>
                <ArrowRight size={16} />
              </Button>
            </Link>
            <Link to="/map">
              <Button variant="secondary" size="lg" className="gap-2">
                <MapIcon size={16} />
                <span>Explore safety map</span>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── 12. SaaS-Style Footer ────────────────────────────────────── */}
      <footer className="py-12 bg-[var(--color-surface)] text-xs text-[var(--color-text-secondary)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

            {/* Brand Column */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="SafeStreet" className="h-6 w-auto object-contain" />
                <span className="font-bold text-base text-[var(--color-text-primary)]">
                  SafeStreet
                </span>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                Community-powered safety intelligence for neighborhoods.
              </p>
              <span className="text-[11px] text-[var(--color-text-muted)] font-mono block">
                MERN • Leaflet • MongoDB 2dsphere • Socket.IO
              </span>
            </div>

            {/* Product Column */}
            <div className="space-y-2">
              <span className="font-bold text-xs uppercase tracking-wider text-[var(--color-text-primary)] block">
                Product
              </span>
              <ul className="space-y-1.5 text-xs text-[var(--color-text-secondary)]">
                <li>
                  <Link to="/map" className="hover:text-[var(--color-primary)] transition-colors">
                    Safety Map
                  </Link>
                </li>
                <li>
                  <Link to="/report" className="hover:text-[var(--color-primary)] transition-colors">
                    Report a Concern
                  </Link>
                </li>
                <li>
                  <Link to="/digest" className="hover:text-[var(--color-primary)] transition-colors">
                    Weekly Digest
                  </Link>
                </li>
              </ul>
            </div>

            {/* Account Column */}
            <div className="space-y-2">
              <span className="font-bold text-xs uppercase tracking-wider text-[var(--color-text-primary)] block">
                Account
              </span>
              <ul className="space-y-1.5 text-xs text-[var(--color-text-secondary)]">
                <li>
                  <Link to="/login" className="hover:text-[var(--color-primary)] transition-colors">
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="hover:text-[var(--color-primary)] transition-colors">
                    Create Account
                  </Link>
                </li>
              </ul>
            </div>

            {/* Information Column */}
            <div className="space-y-2">
              <span className="font-bold text-xs uppercase tracking-wider text-[var(--color-text-primary)] block">
                Information
              </span>
              <ul className="space-y-1.5 text-xs text-[var(--color-text-secondary)]">
                <li>
                  <a href="#how-it-works" className="hover:text-[var(--color-primary)] transition-colors">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#privacy" className="hover:text-[var(--color-primary)] transition-colors">
                    Privacy Protocol
                  </a>
                </li>
                <li>
                  <a href="#community-safety" className="hover:text-[var(--color-primary)] transition-colors">
                    Community Safety
                  </a>
                </li>
              </ul>
            </div>

          </div>

          <div className="pt-6 border-t border-[var(--color-border)] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[var(--color-text-muted)]">
            <span>© {new Date().getFullYear()} SafeStreet Platform. Built for civic safety intelligence.</span>
            <span>Zero commercial ad tracking • All rights reserved</span>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
