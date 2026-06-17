'use client';

import { useState } from 'react';
import type { DiffNode, DiffStatus } from '@/types';
import type { DiffResult } from '@/lib/diff';

const STATUS_CONFIG: Record<DiffStatus, { label: string; rowClass: string; chipClass: string; textClass: string }> = {
  added: {
    label: '+ added',
    rowClass: 'diff-added',
    chipClass: 'bg-[rgba(74,222,128,0.15)] text-[var(--green)] border border-[rgba(74,222,128,0.2)]',
    textClass: 'text-[var(--green)]',
  },
  removed: {
    label: '− removed',
    rowClass: 'diff-removed',
    chipClass: 'bg-[rgba(248,113,113,0.15)] text-[var(--red)] border border-[rgba(248,113,113,0.2)]',
    textClass: 'text-[var(--red)]',
  },
  changed: {
    label: '~ changed',
    rowClass: 'diff-changed',
    chipClass: 'bg-[rgba(251,191,36,0.15)] text-[var(--amber)] border border-[rgba(251,191,36,0.2)]',
    textClass: 'text-[var(--amber)]',
  },
  'type-changed': {
    label: '⚡ type',
    rowClass: 'diff-changed',
    chipClass: 'bg-[rgba(251,146,60,0.15)] text-[var(--orange)] border border-[rgba(251,146,60,0.2)]',
    textClass: 'text-[var(--orange)]',
  },
  unchanged: {
    label: '= same',
    rowClass: 'diff-unchanged',
    chipClass: 'bg-[var(--bg-raised)] text-[var(--text-muted)] border border-[var(--border)]',
    textClass: 'text-[var(--text-muted)]',
  },
};

function formatVal(val: unknown): string {
  if (val === undefined) return '—';
  if (val === null) return 'null';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

interface DiffSummaryProps {
  result: DiffResult;
}

function DiffSummary({ result }: DiffSummaryProps) {
  const { summary } = result;
  const total =
    summary.added + summary.removed + summary.changed + summary.typeChanged + summary.unchanged;

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{total} field{total !== 1 ? 's' : ''} compared</span>
      <span style={{ color: 'var(--border)' }}>|</span>
      {summary.added > 0 && (
        <span className="text-xs font-medium flex items-center gap-1" style={{ color: 'var(--green)' }}>
          <span className="w-2 h-2 rounded-full" style={{ background: 'rgba(74,222,128,0.6)' }} />
          {summary.added} added
        </span>
      )}
      {summary.removed > 0 && (
        <span className="text-xs font-medium flex items-center gap-1" style={{ color: 'var(--red)' }}>
          <span className="w-2 h-2 rounded-full" style={{ background: 'rgba(248,113,113,0.6)' }} />
          {summary.removed} removed
        </span>
      )}
      {summary.changed > 0 && (
        <span className="text-xs font-medium flex items-center gap-1" style={{ color: 'var(--amber)' }}>
          <span className="w-2 h-2 rounded-full" style={{ background: 'rgba(251,191,36,0.6)' }} />
          {summary.changed} changed
        </span>
      )}
      {summary.typeChanged > 0 && (
        <span className="text-xs font-medium flex items-center gap-1" style={{ color: 'var(--orange)' }}>
          <span className="w-2 h-2 rounded-full" style={{ background: 'rgba(251,146,60,0.6)' }} />
          {summary.typeChanged} type change{summary.typeChanged !== 1 ? 's' : ''}
        </span>
      )}
      {summary.unchanged > 0 && (
        <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
          <span className="w-2 h-2 rounded-full" style={{ background: 'var(--border)' }} />
          {summary.unchanged} unchanged
        </span>
      )}
    </div>
  );
}

interface DiffRowProps {
  node: DiffNode;
}

function DiffRow({ node }: DiffRowProps) {
  const cfg = STATUS_CONFIG[node.status];
  const hasNote = Boolean(node.note);

  return (
    <tr className={`${cfg.rowClass} group`} style={{ borderBottom: '1px solid var(--border)' }}>
      <td className="px-4 py-2.5 font-mono text-xs max-w-xs">
        <span className="break-all" style={{ color: 'var(--text-secondary)' }}>{node.path}</span>
      </td>
      <td className="px-4 py-2.5">
        <span className={`inline-flex text-xs px-2 py-0.5 rounded-full font-mono ${cfg.chipClass}`}>
          {cfg.label}
        </span>
      </td>
      <td className="px-4 py-2.5 font-mono text-xs max-w-xs" style={{ color: 'var(--text-muted)' }}>
        {node.status === 'added' ? (
          <span style={{ color: 'var(--border)' }}>—</span>
        ) : (
          <span className={node.status === 'removed' ? 'line-through opacity-70' : ''} style={node.status === 'removed' ? { color: 'var(--red)' } : {}}>
            {hasNote ? <span className="italic" style={{ color: 'var(--text-muted)' }}>{node.note}</span> : formatVal(node.aVal)}
          </span>
        )}
        {node.aType && node.bType && (
          <span className="ml-1" style={{ color: 'var(--orange)' }}>({node.aType})</span>
        )}
      </td>
      <td className="px-4 py-2.5 font-mono text-xs max-w-xs" style={{ color: 'var(--text-muted)' }}>
        {node.status === 'removed' ? (
          <span style={{ color: 'var(--border)' }}>—</span>
        ) : (
          <span style={node.status === 'added' ? { color: 'var(--green)' } : {}}>
            {hasNote ? <span className="italic" style={{ color: 'var(--text-muted)' }}>{node.note}</span> : formatVal(node.bVal)}
          </span>
        )}
        {node.bType && node.aType && (
          <span className="ml-1" style={{ color: 'var(--orange)' }}>({node.bType})</span>
        )}
      </td>
    </tr>
  );
}

interface DiffTableProps {
  result: DiffResult;
}

const ROWS_PER_PAGE = 100;

export function DiffTable({ result }: DiffTableProps) {
  const [showUnchanged, setShowUnchanged] = useState(false);
  const [page, setPage] = useState(1);

  const filtered = showUnchanged
    ? result.nodes
    : result.nodes.filter((n) => n.status !== 'unchanged');

  const totalPages = Math.ceil(filtered.length / ROWS_PER_PAGE);
  const pageNodes = filtered.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  if (result.rootTypeMismatch) {
    return (
      <div className="card p-6 text-center space-y-2">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Root type mismatch</p>
        <p style={{ color: 'var(--text-secondary)' }}>
          A is <code style={{ color: 'var(--amber)' }}>{result.rootTypeMismatch.aType}</code> but B is{' '}
          <code style={{ color: 'var(--amber)' }}>{result.rootTypeMismatch.bType}</code>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <DiffSummary result={result} />

      {/* Controls */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none" style={{ color: 'var(--text-muted)' }}>
          <input
            id="show-unchanged-toggle"
            type="checkbox"
            checked={showUnchanged}
            onChange={(e) => { setShowUnchanged(e.target.checked); setPage(1); }}
            className="w-4 h-4 rounded text-accent focus:ring-accent"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-raised)' }}
          />
          Show unchanged fields
        </label>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {filtered.length} row{filtered.length !== 1 ? 's' : ''}
          {totalPages > 1 ? ` · page ${page}/${totalPages}` : ''}
        </span>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {result.nodes.every((n) => n.status === 'unchanged')
              ? '✓ Responses are identical — no differences found.'
              : 'No differences to show. Enable "Show unchanged fields" to see all fields.'}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Path
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider w-28" style={{ color: 'var(--text-muted)' }}>
                    Status
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    A (Before)
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    B (After)
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageNodes.map((node, i) => (
                  <DiffRow key={`${node.path}-${i}`} node={node} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid var(--border)' }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary py-1 px-3 text-xs disabled:opacity-40"
                id="diff-prev-page"
              >
                ← Previous
              </button>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-secondary py-1 px-3 text-xs disabled:opacity-40"
                id="diff-next-page"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
