import type { RouteRecord } from '@/types';

export interface ExportBundle {
  version: number;
  exportedAt: string;
  routeCount: number;
  /** If set, this bundle only contains routes from this project. */
  project?: string;
  routes: RouteRecord[];
}

/** Minimal structural check so malformed files can't inject bad data into the table. */
function isValidRouteRecord(r: unknown): r is RouteRecord {
  if (!r || typeof r !== 'object' || Array.isArray(r)) return false;
  const obj = r as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.method === 'string' &&
    typeof obj.path === 'string' &&
    Array.isArray(obj.params) &&
    Array.isArray(obj.tags)
  );
}

function sanitizeFilename(name: string): string {
  return name.trim().replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase().slice(0, 40);
}

/**
 * Export routes to a JSON file download.
 * @param routes All routes (will be filtered by projectFilter if provided)
 * @param projectFilter If provided, only exports routes matching this project tag
 */
export function exportRoutesToJson(routes: RouteRecord[], projectFilter?: string): void {
  const toExport = projectFilter !== undefined
    ? routes.filter((r) => r.project === projectFilter)
    : routes;

  const bundle: ExportBundle = {
    version: 1,
    exportedAt: new Date().toISOString(),
    routeCount: toExport.length,
    ...(projectFilter !== undefined ? { project: projectFilter } : {}),
    routes: toExport,
  };

  const json = JSON.stringify(bundle, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = projectFilter
    ? `routelens-${sanitizeFilename(projectFilter) || 'untagged'}-${dateStr}.json`
    : `routelens-all-${dateStr}.json`;

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importRoutesFromJson(
  fileContent: string,
  existing: RouteRecord[],
  mode: 'merge' | 'replace' = 'merge'
): { routes: RouteRecord[]; added: number; skipped: number; error?: string } {
  let bundle: ExportBundle;
  try {
    bundle = JSON.parse(fileContent) as ExportBundle;
  } catch {
    return { routes: existing, added: 0, skipped: 0, error: 'Invalid JSON file' };
  }

  if (!bundle.routes || !Array.isArray(bundle.routes)) {
    return { routes: existing, added: 0, skipped: 0, error: 'File does not contain a valid route list' };
  }

  // Ensure every imported route has the project field (backfill for pre-project exports)
  const normalized = bundle.routes.map((r) => ({
    project: '',
    ...(r as object),
  }));

  // Filter out routes with invalid shape before merging
  const validRoutes = normalized.filter(isValidRouteRecord);
  const invalidCount = bundle.routes.length - validRoutes.length;

  if (mode === 'replace') {
    return {
      routes: validRoutes,
      added: validRoutes.length,
      skipped: invalidCount,
      ...(invalidCount > 0 ? { error: `${invalidCount} invalid route(s) were skipped.` } : {}),
    };
  }

  // Merge: skip duplicates by id
  const existingIds = new Set(existing.map((r) => r.id));
  const toAdd = validRoutes.filter((r) => !existingIds.has(r.id));
  const skipped = validRoutes.length - toAdd.length + invalidCount;

  return {
    routes: [...existing, ...toAdd],
    added: toAdd.length,
    skipped,
  };
}
