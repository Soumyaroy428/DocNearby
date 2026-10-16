'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bookmark,
  Settings,
  LogOut,
  MapPin,
  Trash2,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { UserPublicProfile, SavedProviderRecord } from '@/shared/types/auth';

export function AccountPageView() {
  const router = useRouter();
  const [user, setUser] = useState<UserPublicProfile | null>(null);
  const [savedProviders, setSavedProviders] = useState<SavedProviderRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'saved' | 'profile'>('saved');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [name, setName] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('English');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function loadAccountData() {
      setIsLoading(true);
      try {
        const authRes = await fetch('/api/v1/auth/me');
        const authJson = await authRes.json();

        if (!authJson.data) {
          router.push('/login');
          return;
        }

        const currentUser = authJson.data;
        setUser(currentUser);
        setName(currentUser.name);
        setPreferredLanguage(currentUser.preferredLanguage);

        // Fetch saved providers
        const savedRes = await fetch('/api/v1/user/saved-providers');
        const savedJson = await savedRes.json();
        if (savedJson.data) {
          setSavedProviders(savedJson.data);
        }
      } catch {
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    }

    loadAccountData();
  }, [router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/v1/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, preferredLanguage }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error?.message || 'Failed to update profile');
      }

      setUser(json.data);
      setStatusMessage({ type: 'success', text: 'Profile preferences updated successfully.' });
    } catch (err: unknown) {
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error updating profile',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveSaved = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/user/saved-providers/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setSavedProviders((prev) => prev.filter((p) => p.id !== id && p.providerId !== id));
      }
    } catch {
      // Handle error gracefully
    }
  };

  const handleLogout = async () => {
    await fetch('/api/v1/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Profile Summary */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-600 text-white flex items-center justify-center text-xl font-bold shadow-xs">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">{user.name}</h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                {user.role}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors w-fit"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('saved')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-colors ${
            activeTab === 'saved'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          Saved Providers ({savedProviders.length})
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-colors ${
            activeTab === 'profile'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Settings className="w-4 h-4" />
          Profile Settings
        </button>
      </div>

      {/* Tab Content: Saved Providers */}
      {activeTab === 'saved' && (
        <div className="space-y-4">
          {savedProviders.length === 0 ? (
            <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
              <Bookmark className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-900">No Saved Healthcare Providers</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                You haven&apos;t bookmarked any doctors or facilities yet. Browse the healthcare directory to save providers for quick access.
              </p>
              <div className="pt-2">
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white text-xs font-semibold rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Browse Healthcare Directory
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedProviders.map((record) => (
                <div
                  key={record.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-teal-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {record.providerSnapshot.verificationStatus === 'verified'
                          ? 'Verified'
                          : record.providerSnapshot.verificationStatus}
                      </span>
                      <button
                        onClick={() => handleRemoveSaved(record.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                        title="Remove bookmark"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">
                      {record.providerSnapshot.displayName}
                    </h3>

                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {record.providerSnapshot.specialties.map((s) => (
                        <span key={s} className="text-[11px] px-2 py-0.5 rounded bg-teal-50 text-teal-800">
                          {s}
                        </span>
                      ))}
                    </div>

                    <div className="mt-3 text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {record.providerSnapshot.locality}, {record.providerSnapshot.city}
                      </span>
                    </div>

                    {record.notes && (
                      <p className="mt-2 text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg italic">
                        Note: {record.notes}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end">
                    <Link
                      href={`/providers/${record.providerId}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:underline"
                    >
                      View Profile
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Profile Settings */}
      {activeTab === 'profile' && (
        <div className="max-w-xl bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <h2 className="text-base font-bold text-slate-900">User Account & Preferences</h2>

          {statusMessage && (
            <div
              className={`p-3 rounded-xl flex items-start gap-2 text-xs ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Display Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Email Address (Read-only)</label>
              <input
                type="email"
                disabled
                value={user.email}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Account Role</label>
              <input
                type="text"
                disabled
                value={user.role.toUpperCase()}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Preferred Language</label>
              <select
                value={preferredLanguage}
                onChange={(e) => setPreferredLanguage(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white"
              >
                <option value="English">English</option>
                <option value="Bengali">Bengali</option>
                <option value="Hindi">Hindi</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="German">German</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isUpdating}
              className="px-5 py-2.5 bg-teal-600 text-white text-xs font-semibold rounded-xl hover:bg-teal-700 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-xs"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

