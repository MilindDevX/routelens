'use client';

import type { HttpMethod } from '@/types';

const METHOD_STYLES: Record<HttpMethod, string> = {
  GET: 'badge-get',
  POST: 'badge-post',
  PUT: 'badge-put',
  PATCH: 'badge-patch',
  DELETE: 'badge-delete',
  HEAD: 'badge-head',
  OPTIONS: 'badge-options',
};

interface MethodBadgeProps {
  method: HttpMethod;
  size?: 'sm' | 'md';
}

export function MethodBadge({ method, size = 'md' }: MethodBadgeProps) {
  const sizeClass = size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-xs px-2.5 py-1';
  return (
    <span
      className={`inline-flex items-center font-mono font-semibold rounded-md tracking-wider ${sizeClass} ${METHOD_STYLES[method] ?? 'bg-slate-500/15 text-slate-400 border border-slate-500/30'}`}
    >
      {method}
    </span>
  );
}
