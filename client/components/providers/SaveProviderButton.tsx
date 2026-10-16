'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bookmark, Loader2 } from 'lucide-react';

interface SaveProviderButtonProps {
  providerId: string;
  variant?: 'card' | 'details';
}

export function SaveProviderButton({ providerId, variant = 'card' }: SaveProviderButtonProps) {
  const router = useRouter();
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function checkSaved() {
      try {
        const res = await fetch('/api/v1/user/saved-providers');
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.data)) {
            const exists = json.data.some((r: { providerId: string }) => r.providerId === providerId);
            setIsSaved(exists);
          }
        }
      } catch {
        // Non-blocking
      }
    }
    checkSaved();
  }, [providerId]);

  const toggleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLoading) return;
    setIsLoading(true);

    try {
      if (isSaved) {
        const res = await fetch(`/api/v1/user/saved-providers/${providerId}`, {
          method: 'DELETE',
        });
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        if (res.ok) {
          setIsSaved(false);
        }
      } else {
        const res = await fetch('/api/v1/user/saved-providers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ providerId }),
        });
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        if (res.ok) {
          setIsSaved(true);
        }
      }
    } catch {
      // Error handling
    } finally {
      setIsLoading(false);
    }
  };

  if (variant === 'details') {
    return (
      <button
        onClick={toggleSave}
        disabled={isLoading}
        className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all ${
          isSaved
            ? 'bg-teal-50 border-teal-300 text-teal-800'
            : 'bg-white border-slate-200 text-slate-700 hover:border-teal-300 hover:text-teal-700'
        }`}
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
        ) : (
          <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-teal-700 text-teal-700' : 'text-slate-400'}`} />
        )}
        <span>{isSaved ? 'Saved to Favorites' : 'Save Provider'}</span>
      </button>
    );
  }

  return (
    <button
      onClick={toggleSave}
      disabled={isLoading}
      title={isSaved ? 'Remove from saved' : 'Save to my account'}
      className={`p-1.5 rounded-lg border transition-colors ${
        isSaved
          ? 'bg-teal-50 border-teal-200 text-teal-700'
          : 'bg-white border-slate-200 text-slate-400 hover:text-teal-700 hover:border-teal-200'
      }`}
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
      ) : (
        <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-teal-600 text-teal-600' : ''}`} />
      )}
    </button>
  );
}
