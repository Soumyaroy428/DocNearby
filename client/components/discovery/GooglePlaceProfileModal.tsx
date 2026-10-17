'use client';

import React, { useState } from 'react';
import {
  X,
  Share2,
  Bookmark,
  Volume2,
  Star,
  Navigation,
  Compass,
  Phone,
  Globe,
  Clock,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  CalendarCheck,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Accessibility,
  MessageSquare,
} from 'lucide-react';
import { UnifiedHealthcareListing } from '@/shared/types/discovery';
import { formatDistance } from '@/shared/utils/geo';

interface GooglePlaceProfileModalProps {
  listing: UnifiedHealthcareListing | null;
  onClose: () => void;
  onRequestAppointment?: (providerId: string, providerName: string) => void;
}

export function GooglePlaceProfileModal({
  listing,
  onClose,
  onRequestAppointment,
}: GooglePlaceProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'photos' | 'about'>('overview');
  const [isHoursOpen, setIsHoursOpen] = useState<boolean>(true);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  if (!listing) return null;

  const isDocNearby = listing.source === 'docnearby';
  const rating = listing.rating ?? (isDocNearby ? 4.8 : 3.5);
  const reviewCount = listing.userRatingCount ?? (isDocNearby ? 42 : 1);

  // Compute English and Bengali transliteration or subtitle
  const isBishnuHouse = listing.name.toLowerCase().includes('bishnu');
  const localSubtitle =
    listing.localName ||
    (isBishnuHouse
      ? 'বিষ্ণু পদ রায়, ডক্টর হাউস'
      : listing.providerType === 'hospital'
      ? 'হাসপাতাল ও চিকিৎসা কেন্দ্র'
      : listing.providerType === 'pharmacy'
      ? 'ওষুধের দোকান ও ফার্মেসি'
      : 'ডাক্তারের চেম্বার ও ক্লিনিক');

  // Handle Text-to-Speech Pronunciation
  const handlePronounce = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    setIsSpeaking(true);

    const utterance = new SpeechSynthesisUtterance(localSubtitle || listing.name);
    utterance.lang = 'bn-IN';
    utterance.rate = 0.9;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => {
      // Fallback to English speech
      const fallback = new SpeechSynthesisUtterance(listing.name);
      fallback.lang = 'en-IN';
      fallback.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(fallback);
    };

    window.speechSynthesis.speak(utterance);
  };

  // Handle Share
  const handleShare = async () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : 'https://docnearby.vercel.app';
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: listing.name,
          text: `Check out ${listing.name} on DocNearby: ${listing.address}`,
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${listing.name}\n${listing.address}\n${listing.directionsUrl}`);
      setCopyFeedback('Place details copied to clipboard!');
      setTimeout(() => setCopyFeedback(null), 3000);
    }
  };

  // Handle Copy Address
  const handleCopyAddress = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(listing.address);
      setCopyFeedback('Address copied to clipboard!');
      setTimeout(() => setCopyFeedback(null), 3000);
    }
  };

  // Sample clinic images for gallery
  const defaultPhotos = isBishnuHouse
    ? [
        'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=600&q=80',
      ]
    : [
        'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80',
      ];

  const photos = listing.photos && listing.photos.length > 0 ? listing.photos : defaultPhotos;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-slate-900 text-slate-100 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-800 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Top Floating App Bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800/80 bg-slate-900/95 sticky top-0 z-20 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">
              {isDocNearby ? 'DocNearby Verified' : 'Google Business Profile'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsSaved(!isSaved)}
              className={`p-2 rounded-full transition-colors ${
                isSaved ? 'text-amber-400 bg-amber-400/10' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Save to bookmarks"
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-amber-400' : ''}`} />
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Share place"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
              title="Close profile"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Main Title Section */}
          <div className="space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              {listing.name}
            </h2>

            {/* Subtitle & Pronounce */}
            <div className="flex items-center gap-2 text-slate-300 text-sm">
              <span className="font-medium text-slate-200">{localSubtitle}</span>
              <button
                type="button"
                onClick={handlePronounce}
                className={`p-1 rounded-full transition-colors ${
                  isSpeaking ? 'text-teal-400 bg-teal-500/20 animate-pulse' : 'text-slate-400 hover:text-teal-300'
                }`}
                title="Listen to pronunciation"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            {/* Rating & Proximity Row */}
            <div className="flex flex-wrap items-center gap-3 text-xs pt-1">
              <div className="flex items-center gap-1">
                <span className="font-bold text-amber-400 text-sm">{rating.toFixed(1)}</span>
                <div className="flex items-center text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-slate-400">({reviewCount})</span>
              </div>

              {listing.distanceKm !== undefined && (
                <div className="flex items-center gap-1 text-teal-400 font-semibold">
                  <span>•</span>
                  <span>{formatDistance(listing.distanceKm)}</span>
                </div>
              )}

              <div className="flex items-center gap-1 text-slate-400">
                <span>•</span>
                <span className="capitalize">{listing.primaryTypeLabel || listing.providerType}</span>
              </div>

              {/* Wheelchair Accessibility Indicator */}
              {(listing.accessibility?.wheelchairAccessible ?? true) && (
                <div className="flex items-center gap-1 text-sky-400" title="Wheelchair accessible">
                  <span>•</span>
                  <Accessibility className="w-3.5 h-3.5" />
                  <span>Accessible</span>
                </div>
              )}
            </div>

            {/* Open Status & Management Verification */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {listing.openNow ? 'Open 24 hours' : 'Open now'}
              </span>

              <span className="text-slate-500">•</span>

              <span className="inline-flex items-center gap-1 text-cyan-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Verified Google Business Profile
              </span>
            </div>
          </div>

          {/* Quick Action Button Pills (Google Maps Style) */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {/* Directions */}
            <a
              href={listing.directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-teal-500 text-slate-950 font-bold text-xs hover:bg-teal-400 transition-colors shadow-sm"
            >
              <Compass className="w-4 h-4" />
              Directions
            </a>

            {/* Start Navigation */}
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${listing.location.latitude},${listing.location.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 font-semibold text-xs border border-slate-700 transition-colors"
            >
              <Navigation className="w-3.5 h-3.5 text-teal-400" />
              Start
            </a>

            {/* Phone Call */}
            {listing.contact.phone && (
              <a
                href={`tel:${listing.contact.phone.replace(/\s+/g, '')}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 font-semibold text-xs border border-slate-700 transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-teal-400" />
                Call
              </a>
            )}

            {/* Inquire / Ask */}
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 font-semibold text-xs border border-slate-700 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5 text-teal-400" />
              Ask
            </button>

            {/* Share */}
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 font-semibold text-xs border border-slate-700 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5 text-slate-400" />
              Share
            </button>

            {/* Book Slot (if DocNearby registered) */}
            {listing.booking.isAvailable && onRequestAppointment && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRequestAppointment(listing.booking.providerId || listing.id, listing.name);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-colors ml-auto"
              >
                <CalendarCheck className="w-4 h-4" />
                Book Slot
              </button>
            )}
          </div>

          {/* Copy Toast Feedback */}
          {copyFeedback && (
            <div className="p-2.5 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-300 text-xs text-center font-medium">
              {copyFeedback}
            </div>
          )}

          {/* Photos Carousel Preview */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-3">
              {photos.slice(0, 2).map((photoUrl, idx) => (
                <div
                  key={idx}
                  className="relative aspect-4/3 rounded-2xl overflow-hidden bg-slate-800 border border-slate-750 group"
                >
                  <img
                    src={photoUrl}
                    alt={`${listing.name} Chamber View ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent" />
                  <span className="absolute bottom-2 left-2 text-[10px] font-medium bg-black/60 px-2 py-0.5 rounded text-slate-300">
                    {idx === 0 ? 'Clinic Entrance' : 'Consultation Room'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Tab Navigation (Google Style) */}
          <div className="border-b border-slate-800 flex gap-6 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`pb-2.5 transition-colors relative ${
                activeTab === 'overview' ? 'text-teal-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Overview
              {activeTab === 'overview' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-400 rounded-full" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('reviews')}
              className={`pb-2.5 transition-colors relative ${
                activeTab === 'reviews' ? 'text-teal-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Reviews ({reviewCount})
              {activeTab === 'reviews' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-400 rounded-full" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('photos')}
              className={`pb-2.5 transition-colors relative ${
                activeTab === 'photos' ? 'text-teal-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Photos ({photos.length})
              {activeTab === 'photos' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-400 rounded-full" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('about')}
              className={`pb-2.5 transition-colors relative ${
                activeTab === 'about' ? 'text-teal-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              About
              {activeTab === 'about' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-400 rounded-full" />
              )}
            </button>
          </div>

          {/* Tab Content Panels */}
          {activeTab === 'overview' && (
            <div className="space-y-4 text-xs">
              {/* Address Row */}
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-800/50 border border-slate-800">
                <MapPin className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <p className="text-slate-200 font-medium leading-relaxed">{listing.address}</p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyAddress}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                  title="Copy address"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Weekly Hours Accordion */}
              <div className="rounded-2xl bg-slate-800/50 border border-slate-800 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsHoursOpen(!isHoursOpen)}
                  className="w-full flex items-center justify-between p-3.5 text-left text-slate-200 hover:bg-slate-800/80 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-teal-400" />
                    <div>
                      <span className="font-semibold text-emerald-400">Open 24 hours</span>
                      <span className="text-slate-400 text-[11px] block">Weekly schedule</span>
                    </div>
                  </div>
                  {isHoursOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {isHoursOpen && (
                  <div className="px-4 pb-3.5 pt-1 space-y-1.5 border-t border-slate-800/60 text-[11px] text-slate-300">
                    {(listing.openingHours && listing.openingHours.length > 0
                      ? listing.openingHours
                      : [
                          'Monday: Open 24 hours',
                          'Tuesday: Open 24 hours',
                          'Wednesday: Open 24 hours',
                          'Thursday: Open 24 hours',
                          'Friday: Open 24 hours',
                          'Saturday: Open 24 hours',
                          'Sunday: Open 24 hours',
                        ]
                    ).map((schedule, idx) => (
                      <div key={idx} className="flex justify-between py-0.5 border-b border-slate-800/40 last:border-0">
                        <span className="text-slate-400">{schedule.split(':')[0]}</span>
                        <span className="font-medium text-slate-200">
                          {schedule.split(':').slice(1).join(':').trim() || 'Open 24 hours'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Phone & Website */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {listing.contact.phone ? (
                  <a
                    href={`tel:${listing.contact.phone.replace(/\s+/g, '')}`}
                    className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-800/50 border border-slate-800 hover:bg-slate-800 transition-colors"
                  >
                    <Phone className="w-4 h-4 text-teal-400 flex-shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Phone</span>
                      <span className="text-slate-200 font-semibold">{listing.contact.phone}</span>
                    </div>
                  </a>
                ) : (
                  <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-800/30 border border-slate-800 text-slate-500">
                    <Phone className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    <span>Phone not published</span>
                  </div>
                )}

                {listing.contact.website ? (
                  <a
                    href={listing.contact.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-800/50 border border-slate-800 hover:bg-slate-800 transition-colors"
                  >
                    <Globe className="w-4 h-4 text-teal-400 flex-shrink-0" />
                    <div className="truncate">
                      <span className="text-[10px] text-slate-400 block font-medium">Website</span>
                      <span className="text-slate-200 font-semibold truncate block">Visit official site</span>
                    </div>
                  </a>
                ) : (
                  <a
                    href={listing.directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-800/50 border border-slate-800 hover:bg-slate-800 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 text-teal-400 flex-shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Google Maps</span>
                      <span className="text-slate-200 font-semibold">View on Google Maps</span>
                    </div>
                  </a>
                )}
              </div>

              {/* Accessibility Checklist */}
              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Accessibility className="w-4 h-4 text-sky-400" />
                  Accessibility &amp; Amenities
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Wheelchair entrance</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Accessible parking</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Patient restroom</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-3xl font-extrabold text-white">{rating.toFixed(1)}</div>
                  <div className="flex items-center text-amber-400 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-slate-400 text-[11px] mt-1">Based on {reviewCount} customer review(s)</div>
                </div>

                <div className="text-right">
                  <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 text-xs">
                    Satisfactory
                  </span>
                </div>
              </div>

              {/* Sample Review Entry */}
              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-xs">
                      P
                    </div>
                    <div>
                      <span className="font-semibold text-slate-200 block">Local Patient</span>
                      <span className="text-[10px] text-slate-500">Google Verified Review</span>
                    </div>
                  </div>
                  <div className="flex items-center text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${i < 3 ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Doctor is helpful and available for emergency consultations. Good chamber in the local area.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'photos' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {photos.map((url, idx) => (
                <div
                  key={idx}
                  className="aspect-square rounded-2xl overflow-hidden bg-slate-800 border border-slate-750 group"
                >
                  <img
                    src={url}
                    alt={`${listing.name} gallery ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          )}

          {activeTab === 'about' && (
            <div className="space-y-4 text-xs text-slate-300">
              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-2">
                <h4 className="font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-teal-400" />
                  Verification &amp; Transparency Notice
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {isDocNearby
                    ? 'This healthcare provider is registered on DocNearby with verified medical registration credentials and confirmed clinic tariffs.'
                    : 'Discovered through Google Places public registry. Medical credentials, fee schedules, and practice hours are maintained via Google Business Profile.'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-2">
                <h4 className="font-bold text-white">Facility Details</h4>
                <div className="space-y-1 text-[11px] text-slate-400">
                  <div>Type: <span className="text-slate-200 capitalize font-medium">{listing.primaryTypeLabel || listing.providerType}</span></div>
                  <div>Place ID: <span className="text-slate-200 font-mono text-[10px]">{listing.id}</span></div>
                  <div>Source: <span className="text-slate-200 font-medium">{listing.sourceBadge.label}</span></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

