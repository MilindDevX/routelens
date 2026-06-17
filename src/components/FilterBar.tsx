'use client';

import type { HttpMethod } from '@/types';
import { MagnifyingGlassIcon, XMarkIcon, FolderIcon } from '@heroicons/react/24/outline';

const METHODS: Array<HttpMethod | 'ALL'> = ['ALL', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

const METHOD_ACTIVE: Record<string, { color: string; bg: string; border: string }> = {
  ALL:    { color: 'var(--text-primary)', bg: 'var(--bg-raised)', border: 'var(--border)' },
  GET:    { color: '#60a5fa', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.25)' },
  POST:   { color: '#4ade80', bg: 'rgba(34,197,94,0.10)',  border: 'rgba(34,197,94,0.25)' },
  PUT:    { color: '#fbbf24', bg: 'rgba(251,191,36,0.10)', border: 'rgba(251,191,36,0.25)' },
  PATCH:  { color: '#c084fc', bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.25)' },
  DELETE: { color: '#f87171', bg: 'rgba(248,113,113,0.10)',border: 'rgba(248,113,113,0.25)' },
};

interface FilterBarProps {
  selectedMethod: HttpMethod | 'ALL';
  onMethodChange: (method: HttpMethod | 'ALL') => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  totalCount: number;
  filteredCount: number;
  projects: string[];
  selectedProject: string | 'ALL';
  onProjectChange: (p: string | 'ALL') => void;
}

export function FilterBar({
  selectedMethod,
  onMethodChange,
  searchQuery,
  onSearchChange,
  totalCount,
  filteredCount,
  projects,
  selectedProject,
  onProjectChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Row 1: search + method pills + count */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-48 max-w-sm">
          <MagnifyingGlassIcon
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
            style={{ color: 'var(--text-muted)' }}
          />
          <input
            id="route-search"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search paths, summaries, projects…"
            className="input-base pl-9 pr-8 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors"
              style={{ color: 'var(--text-muted)' }}
              aria-label="Clear search"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Method pills */}
        <div className="flex items-center gap-1 flex-wrap">
          {METHODS.map((m) => {
            const active = selectedMethod === m;
            const s = METHOD_ACTIVE[m];
            return (
              <button
                key={m}
                id={`filter-${m}`}
                onClick={() => onMethodChange(m as HttpMethod | 'ALL')}
                className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full border transition-all duration-150"
                style={
                  active
                    ? { color: s.color, background: s.bg, borderColor: s.border }
                    : { color: 'var(--text-muted)', background: 'transparent', borderColor: 'var(--border)' }
                }
              >
                {m}
              </button>
            );
          })}
        </div>

        {/* Count */}
        <span className="text-xs whitespace-nowrap ml-auto" style={{ color: 'var(--text-muted)' }}>
          {filteredCount === totalCount
            ? `${totalCount} route${totalCount !== 1 ? 's' : ''}`
            : `${filteredCount} of ${totalCount}`}
        </span>
      </div>

      {/* Row 2: project filter pills */}
      {projects.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <FolderIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
          <span className="text-xs mr-1" style={{ color: 'var(--text-muted)' }}>Project</span>

          {[{ label: 'All', value: 'ALL' as const }, { label: 'Untagged', value: '' }].map(({ label, value }) => {
            const active = selectedProject === value;
            return (
              <button
                key={label}
                id={`filter-project-${label.toLowerCase()}`}
                onClick={() => onProjectChange(value)}
                className="text-xs px-2.5 py-1 rounded-full border transition-all duration-150"
                style={
                  active
                    ? { color: 'var(--text-primary)', background: 'var(--bg-raised)', borderColor: 'var(--border)' }
                    : { color: 'var(--text-muted)', background: 'transparent', borderColor: 'var(--border-muted)' }
                }
              >
                {label}
              </button>
            );
          })}

          {projects.filter(p => p !== '').map((p) => {
            const active = selectedProject === p;
            return (
              <button
                key={p}
                id={`filter-project-${p}`}
                onClick={() => onProjectChange(p)}
                className="text-xs px-2.5 py-1 rounded-full border transition-all duration-150"
                style={
                  active
                    ? { color: 'var(--accent)', background: 'var(--accent-dim)', borderColor: 'rgba(168,85,247,0.3)' }
                    : { color: 'var(--text-muted)', background: 'transparent', borderColor: 'var(--border-muted)' }
                }
              >
                {p}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
