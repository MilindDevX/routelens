'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { SpecInput } from '@/components/SpecInput';
import { FilterBar } from '@/components/FilterBar';
import { RouteRow } from '@/components/RouteRow';
import { StorageBanner } from '@/components/StorageBanner';
import { exportRoutesToJson, importRoutesFromJson } from '@/lib/exportImport';
import { safeStorage } from '@/lib/storage';
import type { RouteRecord, HttpMethod, BaselineStore, DuplicateWarning } from '@/types';
import { STORAGE_KEYS } from '@/types';
import {
  CircleStackIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  BookmarkIcon,
  ChevronDownIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

const ROUTES_PER_PAGE = 100;

/** Build the dedup key: project + method + path */
function dedupKey(r: Pick<RouteRecord, 'project' | 'method' | 'path'>): string {
  return `${r.project || ''}::${r.method}::${r.path}`;
}

export default function HomePage() {
  const router = useRouter();
  const { value: routes, setValue: setRoutes, isStorageAvailable } = useLocalStorage<RouteRecord[]>(
    STORAGE_KEYS.ROUTES,
    []
  );
  const { value: baselines, setValue: setBaselines } = useLocalStorage<BaselineStore>(
    STORAGE_KEYS.BASELINES,
    {}
  );

  const [selectedMethod, setSelectedMethod] = useState<HttpMethod | 'ALL'>('ALL');
  const [selectedProject, setSelectedProject] = useState<string | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [duplicateWarnings, setDuplicateWarnings] = useState<DuplicateWarning[]>([]);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // ── Derived: unique project tags present in the route list ──────────────────
  const allProjects = useMemo(() => {
    const set = new Set(routes.map((r) => r.project || ''));
    return Array.from(set).sort();
  }, [routes]);

  // ── Filtered + searched routes ───────────────────────────────────────────────
  const filteredRoutes = useMemo(() => {
    return routes.filter((r) => {
      if (selectedMethod !== 'ALL' && r.method !== selectedMethod) return false;
      if (selectedProject !== 'ALL' && (r.project || '') !== selectedProject) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          r.path.toLowerCase().includes(q) ||
          r.summary.toLowerCase().includes(q) ||
          r.tags.some((t) => t.toLowerCase().includes(q)) ||
          (r.operationId || '').toLowerCase().includes(q) ||
          (r.project || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [routes, selectedMethod, selectedProject, searchQuery]);

  const totalPages = Math.ceil(filteredRoutes.length / ROUTES_PER_PAGE);
  const pageRoutes = filteredRoutes.slice((page - 1) * ROUTES_PER_PAGE, page * ROUTES_PER_PAGE);

  // ── Add routes with duplicate detection ─────────────────────────────────────
  const handleRoutesAdded = useCallback(
    (newRoutes: RouteRecord[]) => {
      setRoutes((prev) => {
        const existingKeys = new Set(prev.map(dedupKey));
        const toAdd: RouteRecord[] = [];
        const dupeMap = new Map<string, number>();

        for (const r of newRoutes) {
          const k = dedupKey(r);
          if (existingKeys.has(k)) {
            dupeMap.set(k, (dupeMap.get(k) ?? 0) + 1);
          } else {
            existingKeys.add(k); // prevent duplicates within the batch itself
            toAdd.push(r);
          }
        }

        if (dupeMap.size > 0) {
          const warnings: DuplicateWarning[] = Array.from(dupeMap.entries()).map(([key, count]) => ({
            key,
            count,
          }));
          setDuplicateWarnings(warnings);
          setTimeout(() => setDuplicateWarnings([]), 8000);
        }

        return [...prev, ...toAdd];
      });
      setPage(1);
    },
    [setRoutes]
  );

  // ── Delete ───────────────────────────────────────────────────────────────────
  const handleDelete = useCallback(
    (id: string) => {
      setRoutes((prev) => prev.filter((r) => r.id !== id));
      setBaselines((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    },
    [setRoutes, setBaselines]
  );

  // ── Clear all ────────────────────────────────────────────────────────────────
  const handleClearAll = () => {
    if (showClearConfirm) {
      setRoutes([]);
      setBaselines({});
      setShowClearConfirm(false);
      setPage(1);
      setSelectedProject('ALL');
    } else {
      setShowClearConfirm(true);
      setTimeout(() => setShowClearConfirm(false), 4000);
    }
  };

  // ── Diff navigation ──────────────────────────────────────────────────────────
  const handleDiffOpen = useCallback(
    (routeId: string) => {
      const baseline = baselines[routeId];
      if (baseline) {
        safeStorage.set(STORAGE_KEYS.DIFF_SCRATCH, { routeId, rawA: baseline, rawB: '' });
      } else {
        safeStorage.set(STORAGE_KEYS.DIFF_SCRATCH, { routeId, rawA: '', rawB: '' });
      }
      router.push(`/diff?routeId=${routeId}`);
    },
    [baselines, router]
  );

  const handleSaveBaseline = useCallback(
    (routeId: string) => {
      const current = safeStorage.getRaw(STORAGE_KEYS.DIFF_SCRATCH);
      if (current) {
        try {
          const scratch = JSON.parse(current);
          if (scratch.rawB && scratch.routeId === routeId) {
            setBaselines((prev) => ({ ...prev, [routeId]: scratch.rawB }));
            return;
          }
        } catch {
          // ignore
        }
      }
      router.push(`/diff?routeId=${routeId}`);
    },
    [setBaselines, router]
  );

  // ── Export ───────────────────────────────────────────────────────────────────
  const handleExportAll = () => {
    exportRoutesToJson(routes);
    setShowExportMenu(false);
  };

  const handleExportProject = (project: string) => {
    exportRoutesToJson(routes, project);
    setShowExportMenu(false);
  };

  // ── Import ───────────────────────────────────────────────────────────────────
  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      const { routes: merged, added, skipped, error } = importRoutesFromJson(content, routes, 'merge');
      if (error) {
        setImportError(error);
        setTimeout(() => setImportError(null), 5000);
      } else {
        setRoutes(merged);
        setImportSuccess(
          `Imported ${added} route${added !== 1 ? 's' : ''}${skipped > 0 ? ` (${skipped} duplicates skipped)` : ''}`
        );
        setTimeout(() => setImportSuccess(null), 4000);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <>
      {!isStorageAvailable && <StorageBanner />}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        {/* Hero */}
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gradient tracking-tight">API Directory</h1>
            {routes.length > 0 && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-mono"
                style={{ color: 'var(--accent)', background: 'var(--accent-dim)', border: '1px solid rgba(168,85,247,0.2)' }}
              >
                {routes.length} saved
              </span>
            )}
            {isStorageAvailable && routes.length > 0 && (
              <span className="text-xs flex items-center gap-1.5" style={{ color: '#4ade80' }} title="Routes saved to localStorage">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#4ade80', animation: 'pulse 2s ease-in-out infinite' }} />
                local
              </span>
            )}
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Parse OpenAPI/Swagger specs or add routes manually. Everything stays in your browser.
          </p>
        </div>

        {/* Input */}
        <SpecInput onRoutesAdded={handleRoutesAdded} />

        {/* Duplicate warning banner */}
        {duplicateWarnings.length > 0 && (
          <div
            className="flex items-start gap-3 rounded-xl px-4 py-3"
            style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.2)' }}
          >
            <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--amber)' }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium" style={{ color: 'var(--amber)' }}>
                {duplicateWarnings.length} duplicate route{duplicateWarnings.length !== 1 ? 's' : ''} skipped
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(251,191,36,0.6)' }}>
                Routes with the same project + method + path already exist:
              </p>
              <ul className="mt-1.5 space-y-0.5">
                {duplicateWarnings.slice(0, 5).map(({ key }) => {
                  const [proj, method, path] = key.split('::');
                  return (
                    <li key={key} className="text-xs font-mono" style={{ color: 'rgba(251,191,36,0.8)' }}>
                      {proj ? <span style={{ color: 'var(--accent)' }}>[{proj}] </span> : null}
                      <span style={{ color: 'var(--amber)' }}>{method}</span>{' '}
                      <span>{path}</span>
                    </li>
                  );
                })}
                {duplicateWarnings.length > 5 && (
                  <li className="text-xs" style={{ color: 'rgba(251,191,36,0.5)' }}>+{duplicateWarnings.length - 5} more</li>
                )}
              </ul>
            </div>
            <button onClick={() => setDuplicateWarnings([])} className="flex-shrink-0 transition-opacity opacity-60 hover:opacity-100" style={{ color: 'var(--amber)' }}>
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Route table */}
        {routes.length > 0 ? (
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <FilterBar
                selectedMethod={selectedMethod}
                onMethodChange={(m) => { setSelectedMethod(m); setPage(1); }}
                searchQuery={searchQuery}
                onSearchChange={(q) => { setSearchQuery(q); setPage(1); }}
                totalCount={routes.length}
                filteredCount={filteredRoutes.length}
                projects={allProjects}
                selectedProject={selectedProject}
                onProjectChange={(p) => { setSelectedProject(p); setPage(1); }}
              />

              <div className="flex items-center gap-2 ml-auto flex-shrink-0">
                {importError && (
                  <span className="text-xs" style={{ color: 'var(--red)' }}>{importError}</span>
                )}
                {importSuccess && (
                  <span className="text-xs" style={{ color: 'var(--green)' }}>{importSuccess}</span>
                )}
                <button onClick={handleImportClick} className="btn-ghost text-xs" id="import-btn" title="Import routes from JSON file">
                  <ArrowUpTrayIcon className="w-4 h-4" />
                  Import
                </button>

                {/* Export dropdown */}
                <div className="relative" ref={exportMenuRef}>
                  <button
                    onClick={() => setShowExportMenu((v) => !v)}
                    className="btn-ghost text-xs"
                    id="export-btn"
                    title="Export routes as JSON"
                  >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    Export
                    <ChevronDownIcon className="w-3 h-3" />
                  </button>
                  {showExportMenu && (
                    <div
                      className="absolute right-0 top-full mt-1 w-56 rounded-xl shadow-xl z-50 py-1"
                      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 16px 40px rgba(0,0,0,0.5)' }}
                      onMouseLeave={() => setShowExportMenu(false)}
                    >
                      <button
                        onClick={handleExportAll}
                        id="export-all-btn"
                        className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors"
                        style={{ color: 'var(--text-secondary)' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-raised)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <ArrowDownTrayIcon className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                        Export all ({routes.length})
                      </button>
                      {allProjects.filter((p) => p !== '').length > 0 && (
                        <>
                          <div className="my-1" style={{ borderTop: '1px solid var(--border)' }} />
                          <p className="px-4 py-1 text-xs" style={{ color: 'var(--text-muted)' }}>By project</p>
                          {allProjects.filter((p) => p !== '').map((p) => {
                            const count = routes.filter((r) => r.project === p).length;
                            return (
                              <button
                                key={p}
                                onClick={() => handleExportProject(p)}
                                id={`export-project-${p}`}
                                className="w-full text-left px-4 py-2 text-sm flex items-center justify-between gap-2 transition-colors"
                                style={{ color: 'var(--text-secondary)' }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-raised)')}
                                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                              >
                                <span className="truncate" style={{ color: 'var(--accent)' }}>{p}</span>
                                <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{count}</span>
                              </button>
                            );
                          })}
                          {allProjects.includes('') && (
                            <button
                              onClick={() => handleExportProject('')}
                              id="export-project-untagged"
                              className="w-full text-left px-4 py-2 text-sm flex items-center justify-between gap-2 transition-colors"
                              style={{ color: 'var(--text-secondary)' }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-raised)')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                            >
                              <span style={{ color: 'var(--text-muted)' }}>Untagged</span>
                              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{routes.filter((r) => !r.project).length}</span>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={handleClearAll}
                  className="btn-ghost text-xs"
                  style={showClearConfirm ? { color: 'var(--red)', background: 'var(--red-bg)' } : {}}
                  id="clear-all-btn"
                  title={showClearConfirm ? 'Click again to confirm' : 'Clear all routes'}
                >
                  <TrashIcon className="w-4 h-4" />
                  {showClearConfirm ? 'Confirm?' : 'Clear all'}
                </button>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImportFile}
              id="file-import-input"
            />

            {/* Routes table */}
            {pageRoutes.length > 0 ? (
              <div
                className="rounded-xl overflow-hidden"
                style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}
              >
                {/* Table header */}
                <div
                  className="hidden md:grid grid-cols-[1rem_5rem_1fr_1fr_auto] gap-3 px-4 py-2 text-xs font-medium border-b"
                  style={{ color: 'var(--text-muted)', borderColor: 'var(--border)', background: 'var(--bg)' }}
                >
                  <span />
                  <span>Method</span>
                  <span>Path</span>
                  <span>Summary</span>
                  <span>Actions</span>
                </div>
                {pageRoutes.map((route) => (
                  <RouteRow
                    key={route.id}
                    route={route}
                    onDelete={handleDelete}
                    onDiffOpen={handleDiffOpen}
                    hasBaseline={Boolean(baselines[route.id])}
                    onSaveBaseline={handleSaveBaseline}
                  />
                ))}
              </div>
            ) : (
              <div className="card p-10 text-center">
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  No routes match your filter.{' '}
                  <button
                    onClick={() => { setSelectedMethod('ALL'); setSearchQuery(''); setSelectedProject('ALL'); }}
                    className="underline transition-colors"
                    style={{ color: 'var(--accent)' }}
                  >
                    Clear filters
                  </button>
                </p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40"
                  id="routes-prev-page"
                >
                  ← Previous
                </button>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Page {page} of {totalPages} · {pageRoutes.length} of {filteredRoutes.length} routes
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40"
                  id="routes-next-page"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Empty state */
          <div
            className="rounded-2xl p-16 text-center space-y-5"
            style={{ border: '1px dashed var(--border)', background: 'var(--bg-card)' }}
          >
            <div
              className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--bg-raised)' }}
            >
              <CircleStackIcon className="w-7 h-7" style={{ color: 'var(--accent)' }} />
            </div>
            <div className="space-y-1.5">
              <h2 className="font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>No routes yet</h2>
              <p className="text-sm max-w-xs mx-auto" style={{ color: 'var(--text-muted)' }}>
                Paste an OpenAPI spec, load one from a URL, or use Quick Add to add endpoints one by one.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
              <BookmarkIcon className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
              <span>Routes persist across page refreshes via localStorage</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
