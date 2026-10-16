import React from 'react';
import Link from 'next/link';
import { ArrowLeft, AlertCircle } from 'lucide-react';

export function ProviderNotFoundView() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
      <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h1 className="text-xl font-bold text-slate-900">Healthcare Provider Not Found</h1>
      <p className="text-xs text-slate-500 max-w-md mx-auto">
        The requested healthcare provider profile could not be found or has been removed from the registry.
      </p>
      <div className="pt-2">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white text-xs font-semibold rounded-lg hover:bg-teal-700 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Search Directory
        </Link>
      </div>
    </div>
  );
}

