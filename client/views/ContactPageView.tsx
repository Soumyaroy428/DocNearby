'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, Send, CheckCircle2, AlertTriangle, ShieldCheck, ArrowLeft, MessageSquare } from 'lucide-react';

export function ContactPageView() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'Traveler Inquiry',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    setLoading(true);
    // Simulate support ticket dispatch
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      <div className="space-y-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Discovery
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-teal-50 border border-teal-200 rounded-2xl text-teal-700">
            <Mail className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Contact & Grievance Redressal</h1>
            <p className="text-sm text-slate-500">
              DocNearby Support, Compliance, and Grievance Desk (Kolkata Pilot)
            </p>
          </div>
        </div>
      </div>

      {/* Emergency Notice */}
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 sm:p-5 flex items-start gap-3 text-rose-900">
        <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm space-y-1">
          <p className="font-bold">Not for Medical Emergencies</p>
          <p className="text-rose-800">
            If you or someone around you requires emergency medical attention, call <strong>112</strong> or <strong>102</strong> in India immediately or visit the nearest hospital casualty department. Support emails are not monitored for emergency triage.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Support Channels & Compliance */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-teal-600" />
              Statutory Grievance Redressal
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              In compliance with the <em>Digital Personal Data Protection Act, 2023</em> and Information Technology Rules:
            </p>
            <div className="space-y-2.5 text-xs text-slate-700">
              <div className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900">Grievance & Privacy Email</p>
                  <a href="mailto:grievance@docnearby.com" className="text-teal-700 hover:underline">
                    grievance@docnearby.com
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MessageSquare className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900">General Support & Feedback</p>
                  <a href="mailto:support@docnearby.com" className="text-teal-700 hover:underline">
                    support@docnearby.com
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900">Pilot Operational Office</p>
                  <p className="text-slate-500">Salt Lake Sector V, Kolkata, West Bengal 700091, India</p>
                </div>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500">
              Response SLA: Acknowledgment within 48 hours; resolution within 30 days.
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-2 text-xs text-slate-600">
            <h3 className="font-bold text-slate-900">For Medical Providers & Clinics</h3>
            <p>
              Are you a doctor or clinic administrator wishing to register your facility or update consultation fees?
            </p>
            <p>
              Please register your profile at <Link href="/register" className="text-teal-700 font-semibold underline">Register as Provider</Link> or email your medical registration documentation to <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200">onboarding@docnearby.com</code>.
            </p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-2">Send us a Message</h2>
          <p className="text-xs text-slate-500 mb-6">
            Have a question about healthcare discovery or need to report inaccurate clinic details? Let us know.
          </p>

          {submitted ? (
            <div className="p-6 bg-teal-50 border border-teal-200 rounded-xl text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-teal-600 mx-auto" />
              <h3 className="text-sm font-bold text-teal-900">Message Dispatched Successfully</h3>
              <p className="text-xs text-teal-800 leading-relaxed">
                Thank you for contacting DocNearby. Your reference ticket has been logged and our compliance team will respond to {formData.email} within 48 hours.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setFormData({ name: '', email: '', subject: 'Traveler Inquiry', message: '' });
                }}
                className="text-xs text-teal-700 underline font-semibold mt-2"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Your Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Ananya Sengupta"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Topic</label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  <option value="Traveler Inquiry">Traveler / Patient Inquiry</option>
                  <option value="Clinic Fee Correction">Report Inaccurate Fee or Hours</option>
                  <option value="Provider Onboarding">Healthcare Provider Onboarding</option>
                  <option value="Privacy / DPDP Request">Privacy / Data Deletion Request</option>
                  <option value="Other">Other Inquiry</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Message</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Please describe your inquiry or feedback..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                {loading ? 'Submitting...' : 'Submit Message'}
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

