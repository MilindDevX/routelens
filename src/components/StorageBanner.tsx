'use client';

import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

export function StorageBanner() {
  return (
    <div className="w-full bg-amber-500/10 border-b border-amber-500/20 px-4 py-2" role="alert">
      <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs text-amber-300">
        <ExclamationCircleIcon className="w-4 h-4 flex-shrink-0 text-amber-400" />
        <span>
          <strong>Storage unavailable</strong> — Your routes and settings won&apos;t survive a page refresh. Try opening this page outside of incognito/private mode, or ensure localStorage isn&apos;t blocked.
        </span>
      </div>
    </div>
  );
}
