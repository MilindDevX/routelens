'use client';

import { ExclamationTriangleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface ParseErrorBannerProps {
  error: string;
  detail?: string;
  warnings?: string[];
  onDismiss?: () => void;
  type?: 'error' | 'warning';
}

export function ParseErrorBanner({
  error,
  detail,
  warnings = [],
  onDismiss,
  type = 'error',
}: ParseErrorBannerProps) {
  const isError = type === 'error';
  const colorClass = isError
    ? 'bg-red-500/10 border-red-500/30 text-red-300'
    : 'bg-amber-500/10 border-amber-500/30 text-amber-300';
  const iconColor = isError ? 'text-red-400' : 'text-amber-400';

  return (
    <div className={`rounded-xl border px-4 py-3 ${colorClass} animate-fade-in`} role="alert">
      <div className="flex items-start gap-3">
        <ExclamationTriangleIcon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColor}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{error}</p>
          {detail && (
            <p className="text-xs mt-1 opacity-80">{detail}</p>
          )}
          {warnings.length > 0 && (
            <ul className="mt-2 space-y-1">
              {warnings.map((w, i) => (
                <li key={i} className="text-xs opacity-75 flex items-start gap-1">
                  <span className="mt-0.5">•</span>
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={`flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity`}
            aria-label="Dismiss"
          >
            <XCircleIcon className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}

interface QuickAddErrorProps {
  lineErrors: { line: number; text: string; reason: string }[];
}

export function QuickAddErrors({ lineErrors }: QuickAddErrorProps) {
  if (!lineErrors.length) return null;
  return (
    <div className="rounded-xl border bg-amber-500/10 border-amber-500/30 px-4 py-3 animate-fade-in">
      <div className="flex items-start gap-3">
        <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-400" />
        <div>
          <p className="text-sm font-medium text-amber-300">
            {lineErrors.length} line{lineErrors.length !== 1 ? 's' : ''} couldn't be parsed
          </p>
          <ul className="mt-2 space-y-1.5">
            {lineErrors.map((e, i) => (
              <li key={i} className="text-xs text-amber-200/70">
                <span className="font-mono text-amber-400">Line {e.line}:</span>{' '}
                <code className="bg-amber-900/30 px-1 py-0.5 rounded">{e.text}</code>
                <span className="block mt-0.5 ml-4 opacity-70">{e.reason}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
