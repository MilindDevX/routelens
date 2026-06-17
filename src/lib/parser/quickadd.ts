import { generateId } from '@/lib/uuid';
import type { QuickAddResult, RouteRecord, HttpMethod } from '@/types';

const VALID_METHODS: HttpMethod[] = [
  'GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS',
];

const METHOD_REGEX = new RegExp(
  `^\\s*(${VALID_METHODS.join('|')})\\s+(/[^\\s]*)(?:[\\s\\u2014\\-]+(.*))?$`,
  'i'
);

/**
 * Parse quick-add text format: one route per line.
 * Supported formats:
 *   GET /users
 *   POST /users — create a user
 *   PUT /users/:id - update user
 *   delete /items/{id}
 *
 * Lines with no recognizable method+path are reported as errors.
 * @param project Optional project tag to stamp on every route.
 */
export function parseQuickAdd(text: string, project = ''): QuickAddResult {
  const lines = text.split('\n');
  const routes: RouteRecord[] = [];
  const lineErrors: QuickAddResult['lineErrors'] = [];
  const now = new Date().toISOString();

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i].trim();
    if (!raw || raw.startsWith('#') || raw.startsWith('//')) continue;

    const match = METHOD_REGEX.exec(raw);
    if (!match) {
      lineErrors.push({
        line: i + 1,
        text: raw,
        reason: 'Could not find a valid HTTP method (GET, POST, PUT, PATCH, DELETE) followed by a path starting with /',
      });
      continue;
    }

    const method = match[1].toUpperCase() as HttpMethod;
    const path = match[2].replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, '{$1}'); // normalize :id → {id}
    const summary = (match[3] || '').trim();

    // Extract path params from {param} syntax
    const paramMatches = [...path.matchAll(/\{([^}]+)\}/g)];
    const params = paramMatches.map((m) => ({
      name: m[1],
      in: 'path' as const,
      required: true,
      schema: 'string',
    }));

    routes.push({
      id: generateId(),
      method,
      path,
      summary,
      params,
      responseKeys: [],
      source: 'quickadd',
      tags: [],
      project,
      createdAt: now,
      updatedAt: now,
    });
  }

  return { routes, lineErrors };
}
