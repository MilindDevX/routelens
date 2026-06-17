'use client';

import { useState } from 'react';
import { MethodBadge } from './MethodBadge';
import { SnippetModal } from './SnippetModal';
import type { RouteRecord } from '@/types';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  CodeBracketIcon,
  TrashIcon,
  BookmarkIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';

interface RouteRowProps {
  route: RouteRecord;
  onDelete: (id: string) => void;
  onDiffOpen: (id: string) => void;
  hasBaseline: boolean;
  onSaveBaseline: (id: string) => void;
}

export function RouteRow({ route, onDelete, onDiffOpen, hasBaseline, onSaveBaseline }: RouteRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [showSnippet, setShowSnippet] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const hasDetails = route.params.length > 0 || route.responseKeys.length > 0 || route.operationId;

  const handleDelete = () => {
    if (confirmDelete) {
      onDelete(route.id);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  return (
    <>
      <div
        className="group transition-colors duration-100"
        style={{ borderBottom: '1px solid var(--border-muted)' }}
      >
        {/* Main row */}
        <div
          className="flex items-center gap-3 px-4 py-2.5 transition-colors duration-100"
          style={{ background: 'transparent' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          {/* Expand toggle */}
          <button
            onClick={() => hasDetails && setExpanded(!expanded)}
            className="flex-shrink-0 w-4 h-4 transition-colors"
            style={{ color: hasDetails ? 'var(--text-muted)' : 'transparent', cursor: hasDetails ? 'pointer' : 'default' }}
            aria-label={expanded ? 'Collapse' : 'Expand'}
            id={`expand-${route.id}`}
          >
            {expanded ? (
              <ChevronDownIcon className="w-4 h-4" />
            ) : (
              <ChevronRightIcon className="w-4 h-4" />
            )}
          </button>

          {/* Method */}
          <MethodBadge method={route.method} size="sm" />

          {/* Path */}
          <code
            className="flex-1 text-sm truncate"
            style={{ color: 'var(--text-code)', fontFamily: "'JetBrains Mono', monospace" }}
          >
            {route.path}
          </code>

          {/* Summary */}
          {route.summary && (
            <span
              className="hidden md:block text-xs truncate max-w-xs"
              style={{ color: 'var(--text-muted)' }}
            >
              {route.summary}
            </span>
          )}

          {/* Project tag */}
          {route.project && (
            <span
              className="hidden sm:inline text-xs px-2 py-0.5 rounded-full font-medium max-w-[8rem] truncate"
              style={{
                color: 'var(--accent)',
                background: 'var(--accent-dim)',
                border: '1px solid rgba(168,85,247,0.2)',
                fontSize: '0.68rem',
              }}
            >
              {route.project}
            </span>
          )}

          {/* OpenAPI tags */}
          {route.tags.slice(0, 1).map((tag) => (
            <span
              key={tag}
              className="hidden lg:inline text-xs px-2 py-0.5 rounded-full"
              style={{ color: 'var(--text-muted)', background: 'var(--bg-raised)', fontSize: '0.68rem', border: '1px solid var(--border)' }}
            >
              {tag}
            </span>
          ))}

          {/* Source badge */}
          <span
            className="text-xs px-1.5 py-0.5 rounded font-mono"
            style={{
              color: route.source === 'openapi' ? 'var(--accent)' : route.source === 'url' ? '#2dd4bf' : 'var(--text-muted)',
              background: route.source === 'openapi' ? 'var(--accent-dim)' : route.source === 'url' ? 'rgba(45,212,191,0.08)' : 'var(--bg-raised)',
              fontSize: '0.65rem',
            }}
          >
            {route.source === 'openapi' ? 'spec' : route.source === 'url' ? 'url' : 'quick'}
          </span>

          {/* Baseline indicator */}
          {hasBaseline && (
            <span title="Has saved baseline response" style={{ color: 'var(--amber)' }}>
              <BookmarkSolidIcon className="w-3 h-3" />
            </span>
          )}

          {/* Actions */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setShowSnippet(true)}
              className="btn-ghost p-1.5"
              title="Copy as curl/fetch/axios"
              id={`snippet-${route.id}`}
            >
              <CodeBracketIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onSaveBaseline(route.id)}
              className="btn-ghost p-1.5"
              title={hasBaseline ? 'Update baseline response' : 'Save baseline response'}
              id={`baseline-${route.id}`}
            >
              <BookmarkIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDiffOpen(route.id)}
              className="btn-ghost p-1.5"
              title="Diff this route's response"
              id={`diff-${route.id}`}
            >
              <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleDelete}
              className="btn-ghost p-1.5"
              style={confirmDelete ? { color: 'var(--red)', background: 'var(--red-bg)' } : {}}
              title={confirmDelete ? 'Click again to confirm delete' : 'Delete route'}
              id={`delete-${route.id}`}
            >
              <TrashIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Expanded drawer */}
        {expanded && hasDetails && (
          <div
            className="px-6 py-4 border-t"
            style={{ borderColor: 'var(--border-muted)', background: 'var(--bg)' }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Parameters */}
              {route.params.length > 0 && (
                <div>
                  <p className="eyebrow mb-3">Parameters ({route.params.length})</p>
                  <div className="space-y-2">
                    {route.params.map((p, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <code
                          className="text-xs"
                          style={{ color: 'var(--accent)', fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          {p.name}
                        </code>
                        <span
                          className="text-xs px-1.5 py-0.5 rounded font-mono"
                          style={{
                            color: p.in === 'path' ? '#fb923c' : p.in === 'query' ? '#60a5fa' : p.in === 'header' ? '#c084fc' : 'var(--text-muted)',
                            background: p.in === 'path' ? 'rgba(251,146,60,0.08)' : p.in === 'query' ? 'rgba(59,130,246,0.08)' : p.in === 'header' ? 'rgba(192,132,252,0.08)' : 'var(--bg-raised)',
                          }}
                        >
                          {p.in}
                        </span>
                        {p.schema && (
                          <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{p.schema}</span>
                        )}
                        {p.required && (
                          <span className="text-xs font-mono" style={{ color: 'var(--red)' }}>required</span>
                        )}
                        {p.description && (
                          <span className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{p.description}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Response keys */}
              {route.responseKeys.length > 0 && (
                <div>
                  <p className="eyebrow mb-3">Response Keys ({route.responseKeys.length})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {route.responseKeys.map((key) => (
                      <code
                        key={key}
                        className="text-xs px-2 py-0.5 rounded"
                        style={{ background: 'var(--bg-raised)', color: 'var(--green)', fontFamily: "'JetBrains Mono', monospace", border: '1px solid var(--border)' }}
                      >
                        {key}
                      </code>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata row */}
              <div className="lg:col-span-2 flex flex-wrap gap-4 text-xs pt-3 mt-1" style={{ borderTop: '1px solid var(--border-muted)', color: 'var(--text-muted)' }}>
                {route.operationId && (
                  <span>operationId: <code style={{ color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace" }}>{route.operationId}</code></span>
                )}
                {route.project && (
                  <span>project: <code style={{ color: 'var(--accent)', fontFamily: "'JetBrains Mono', monospace" }}>{route.project}</code></span>
                )}
                {route.specTitle && (
                  <span>spec: <code style={{ color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace" }}>{route.specTitle}</code></span>
                )}
                <span>added: <code style={{ color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace" }}>{new Date(route.createdAt).toLocaleDateString()}</code></span>
              </div>
            </div>
          </div>
        )}
      </div>

      {showSnippet && (
        <SnippetModal route={route} onClose={() => setShowSnippet(false)} />
      )}
    </>
  );
}
