'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { DiffTextarea } from '@/components/DiffTextarea';
import { DiffTable } from '@/components/DiffTable';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { diffObjects, parseJsonSafe } from '@/lib/diff';
import { safeStorage } from '@/lib/storage';
import type { DiffResult } from '@/lib/diff';
import type { DiffScratch, BaselineStore, RouteRecord } from '@/types';
import { STORAGE_KEYS } from '@/types';
import {
  ArrowsRightLeftIcon,
  BookmarkIcon,
  XMarkIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';

function DiffPageInner() {
  const searchParams = useSearchParams();
  const routeId = searchParams.get('routeId') || undefined;

  const { value: routes } = useLocalStorage<RouteRecord[]>(STORAGE_KEYS.ROUTES, []);
  const { value: baselines, setValue: setBaselines } = useLocalStorage<BaselineStore>(
    STORAGE_KEYS.BASELINES,
    {}
  );

  const [rawA, setRawA] = useState('');
  const [rawB, setRawB] = useState('');
  const [errorA, setErrorA] = useState<string | null>(null);
  const [errorB, setErrorB] = useState<string | null>(null);
  const [result, setResult] = useState<DiffResult | null>(null);
  const [arrayNote, setArrayNote] = useState(false);

  // Load scratch on mount
  useEffect(() => {
    const scratch = safeStorage.get<DiffScratch>(STORAGE_KEYS.DIFF_SCRATCH, { rawA: '', rawB: '' });
    if (scratch.rawA) setRawA(scratch.rawA);
    if (scratch.rawB) setRawB(scratch.rawB);
  }, []);

  // Load baseline as A if routeId matches
  useEffect(() => {
    if (routeId && baselines[routeId]) {
      setRawA(baselines[routeId]);
    }
  }, [routeId, baselines]);

  // Save scratch on change
  useEffect(() => {
    safeStorage.set(STORAGE_KEYS.DIFF_SCRATCH, { routeId, rawA, rawB });
  }, [routeId, rawA, rawB]);

  const linkedRoute = routeId ? routes.find((r) => r.id === routeId) : undefined;
  const hasBaseline = routeId ? Boolean(baselines[routeId]) : false;

  const handleDiff = useCallback(() => {
    setErrorA(null);
    setErrorB(null);
    setResult(null);

    const parsedA = parseJsonSafe(rawA);
    const parsedB = parseJsonSafe(rawB);

    if (!parsedA.ok) { setErrorA(parsedA.error); }
    if (!parsedB.ok) { setErrorB(parsedB.error); }
    if (!parsedA.ok || !parsedB.ok) return;

    const diffResult = diffObjects(parsedA.data, parsedB.data);
    setResult(diffResult);
    setArrayNote(diffResult.nodes.some((n) => n.note?.includes('Array length')));
  }, [rawA, rawB]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleDiff();
    }
  };

  const handleSaveBaseline = () => {
    if (!routeId || !rawA) return;
    setBaselines((prev) => ({ ...prev, [routeId]: rawA }));
  };

  const handleSwap = () => {
    setRawA(rawB);
    setRawB(rawA);
    setResult(null);
  };

  const handleClear = () => {
    setRawA('');
    setRawB('');
    setResult(null);
    setErrorA(null);
    setErrorB(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8" onKeyDown={handleKeyDown}>
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gradient tracking-tight">Response Diff</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Paste two JSON responses to see a structural diff — added, removed, changed, and type-changed fields highlighted clearly.
        </p>
        {linkedRoute && (
          <div
            className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg"
            style={{ background: 'var(--accent-dim)', border: '1px solid rgba(168,85,247,0.2)', color: 'var(--text-primary)' }}
          >
            <ArrowsRightLeftIcon className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
            Diffing against route:{' '}
            <code className="font-mono">
              {linkedRoute.method} {linkedRoute.path}
            </code>
            {hasBaseline && (
              <span className="flex items-center gap-1" style={{ color: 'var(--amber)' }}>
                <BookmarkSolidIcon className="w-3 h-3" /> baseline loaded as A
              </span>
            )}
          </div>
        )}
      </div>

      {/* Array note */}
      {arrayNote && (
        <div
          className="text-xs rounded-lg px-4 py-2.5"
          style={{ color: 'var(--text-muted)', background: 'var(--bg-raised)', border: '1px solid var(--border)' }}
        >
          ℹ️ Arrays are compared by matching elements on common identity keys (id, key, name, etc.) where possible. Otherwise positional comparison is used. Reordered arrays may show more changes than expected.
        </div>
      )}

      {/* Textareas */}
      <div className="flex flex-col lg:flex-row gap-4">
        <DiffTextarea
          id="diff-input-a"
          label="A — Before"
          labelColor="var(--red)"
          value={rawA}
          onChange={setRawA}
          error={errorA}
          placeholder={`Paste original JSON here…\n\n{\n  "id": 1,\n  "name": "Alice"\n}`}
        />

        {/* Swap button */}
        <div className="flex lg:flex-col items-center justify-center gap-2 py-2">
          <button
            onClick={handleSwap}
            className="btn-ghost p-2"
            title="Swap A and B"
            id="swap-btn"
          >
            <ArrowsRightLeftIcon className="w-5 h-5" />
          </button>
        </div>

        <DiffTextarea
          id="diff-input-b"
          label="B — After"
          labelColor="var(--green)"
          value={rawB}
          onChange={setRawB}
          error={errorB}
          placeholder={`Paste modified JSON here…\n\n{\n  "id": 1,\n  "name": "Alice",\n  "email": "alice@example.com"\n}`}
        />
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          id="run-diff-btn"
          onClick={handleDiff}
          disabled={!rawA.trim() || !rawB.trim()}
          className="btn-primary"
        >
          <ArrowsRightLeftIcon className="w-4 h-4" />
          Run Diff
        </button>

        {routeId && rawA && (
          <button
            id="save-baseline-btn"
            onClick={handleSaveBaseline}
            className="btn-secondary"
            title="Save A as baseline for this route"
          >
            <BookmarkIcon className="w-4 h-4" />
            {hasBaseline ? 'Update Baseline (A)' : 'Save as Baseline (A)'}
          </button>
        )}

        {(rawA || rawB) && (
          <button
            onClick={handleClear}
            className="btn-ghost text-sm"
            id="clear-diff-btn"
          >
            <XMarkIcon className="w-4 h-4" />
            Clear
          </button>
        )}

        <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>⌘+Enter to run diff</span>
      </div>

      {/* Results */}
      {result && <DiffTable result={result} />}

      {/* How-to callout */}
      {!result && (
        <div className="card p-6 space-y-3">
          <h3 className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <ArrowPathIcon className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            How to use
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
            <div className="space-y-1">
              <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>1. Paste JSON</p>
              <p>Paste your original API response in A and the modified one in B. Supports any valid JSON — objects, arrays, or primitives.</p>
            </div>
            <div className="space-y-1">
              <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>2. Run Diff</p>
              <p>Click Run Diff or press ⌘+Enter. The structural diff will highlight added (green), removed (red), and changed (amber) fields.</p>
            </div>
            <div className="space-y-1">
              <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>3. Save Baseline</p>
              <p>If this diff is linked to a route, save A as the baseline. Future opens from that route will auto-load the baseline into A.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DiffPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 py-8 text-sm" style={{ color: 'var(--text-muted)' }}>Loading…</div>
    }>
      <DiffPageInner />
    </Suspense>
  );
}
