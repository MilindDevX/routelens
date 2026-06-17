import type { DiffNode, DiffStatus } from '@/types';

function getType(val: unknown): string {
  if (val === null) return 'null';
  if (Array.isArray(val)) return 'array';
  return typeof val;
}

function isPrimitive(val: unknown): boolean {
  return (
    val === null ||
    typeof val === 'string' ||
    typeof val === 'number' ||
    typeof val === 'boolean'
  );
}

/**
 * Try to find a common "identity key" in an array of objects.
 * Returns the key name if most objects have it, otherwise null.
 */
function detectIdKey(arr: unknown[]): string | null {
  const candidates = ['id', 'key', 'name', 'slug', 'uuid', '_id', 'code'];
  const objects = arr.filter((x) => x !== null && typeof x === 'object' && !Array.isArray(x)) as Record<string, unknown>[];
  if (objects.length < 2) return null;

  for (const key of candidates) {
    const withKey = objects.filter((o) => key in o);
    if (withKey.length >= Math.ceil(objects.length * 0.7)) {
      // Check values are primitives and mostly unique
      const vals = withKey.map((o) => o[key]);
      const unique = new Set(vals.map(String));
      if (unique.size >= Math.ceil(vals.length * 0.7)) {
        return key;
      }
    }
  }
  return null;
}

/**
 * Core recursive diff function.
 * Returns a flat list of DiffNode items, each with a dot-notation path.
 */
function diffValues(
  a: unknown,
  b: unknown,
  path: string,
  nodes: DiffNode[],
  maxDepth: number,
  depth: number
): void {
  if (depth > maxDepth) {
    // Too deep — just mark as changed if not equal
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      nodes.push({ path, status: 'changed', aVal: a, bVal: b });
    } else {
      nodes.push({ path, status: 'unchanged', aVal: a, bVal: b });
    }
    return;
  }

  const aType = getType(a);
  const bType = getType(b);

  // Type mismatch
  if (aType !== bType) {
    nodes.push({ path, status: 'type-changed', aVal: a, bVal: b, aType, bType });
    return;
  }

  // Both null
  if (a === null && b === null) {
    nodes.push({ path, status: 'unchanged', aVal: a, bVal: b });
    return;
  }

  // Both arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    const maxLen = Math.max(a.length, b.length);

    if (a.length !== b.length) {
      nodes.push({
        path: `${path}[]`,
        status: 'changed',
        note: `Array length changed: ${a.length} → ${b.length}`,
        aVal: a.length,
        bVal: b.length,
      });
    }

    // Try smart matching by id key
    const idKey = detectIdKey([...a, ...b]);
    if (idKey && a.length > 0 && b.length > 0) {
      const aObjects = a as Record<string, unknown>[];
      const bObjects = b as Record<string, unknown>[];
      const aMap = new Map(aObjects.map((o) => [String(o[idKey]), o]));
      const bMap = new Map(bObjects.map((o) => [String(o[idKey]), o]));

      const allKeys = new Set([...aMap.keys(), ...bMap.keys()]);
      for (const k of allKeys) {
        const subPath = `${path}[${idKey}=${k}]`;
        if (!aMap.has(k)) {
          nodes.push({ path: subPath, status: 'added', bVal: bMap.get(k) });
        } else if (!bMap.has(k)) {
          nodes.push({ path: subPath, status: 'removed', aVal: aMap.get(k) });
        } else {
          diffValues(aMap.get(k), bMap.get(k), subPath, nodes, maxDepth, depth + 1);
        }
      }
    } else {
      // Positional comparison
      for (let i = 0; i < maxLen; i++) {
        const subPath = `${path}[${i}]`;
        if (i >= a.length) {
          nodes.push({ path: subPath, status: 'added', bVal: b[i] });
        } else if (i >= b.length) {
          nodes.push({ path: subPath, status: 'removed', aVal: a[i] });
        } else {
          diffValues(a[i], b[i], subPath, nodes, maxDepth, depth + 1);
        }
      }
    }
    return;
  }

  // Both plain objects
  if (aType === 'object' && !Array.isArray(a)) {
    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;
    const allKeys = new Set([...Object.keys(aObj), ...Object.keys(bObj)]);

    for (const key of allKeys) {
      const subPath = path ? `${path}.${key}` : key;
      if (!(key in aObj)) {
        nodes.push({ path: subPath, status: 'added', bVal: bObj[key] });
      } else if (!(key in bObj)) {
        nodes.push({ path: subPath, status: 'removed', aVal: aObj[key] });
      } else {
        diffValues(aObj[key], bObj[key], subPath, nodes, maxDepth, depth + 1);
      }
    }
    return;
  }

  // Primitives
  if (isPrimitive(a) && isPrimitive(b)) {
    if (a === b) {
      nodes.push({ path, status: 'unchanged', aVal: a, bVal: b });
    } else {
      nodes.push({ path, status: 'changed', aVal: a, bVal: b });
    }
    return;
  }

  // Fallback
  const unchanged = JSON.stringify(a) === JSON.stringify(b);
  nodes.push({
    path,
    status: unchanged ? 'unchanged' : 'changed',
    aVal: a,
    bVal: b,
  });
}

export interface DiffResult {
  nodes: DiffNode[];
  summary: {
    added: number;
    removed: number;
    changed: number;
    typeChanged: number;
    unchanged: number;
  };
  rootTypeMismatch?: { aType: string; bType: string };
  arrayLengthNote?: string;
}

/**
 * Public diff API. Accepts any two parsed JSON values.
 * Returns flat list of DiffNodes with summary counts.
 */
export function diffObjects(a: unknown, b: unknown, maxDepth = 20): DiffResult {
  const nodes: DiffNode[] = [];
  const aType = getType(a);
  const bType = getType(b);

  if (aType !== bType) {
    return {
      nodes: [{ path: '(root)', status: 'type-changed', aVal: a, bVal: b, aType, bType }],
      summary: { added: 0, removed: 0, changed: 0, typeChanged: 1, unchanged: 0 },
      rootTypeMismatch: { aType, bType },
    };
  }

  diffValues(a, b, '', nodes, maxDepth, 0);

  // Clean up empty-string paths at root level
  const cleaned = nodes.map((n) => ({
    ...n,
    path: n.path === '' ? '(root)' : n.path,
  }));

  const summary = {
    added: cleaned.filter((n) => n.status === 'added').length,
    removed: cleaned.filter((n) => n.status === 'removed').length,
    changed: cleaned.filter((n) => n.status === 'changed' && !n.note).length,
    typeChanged: cleaned.filter((n) => n.status === 'type-changed').length,
    unchanged: cleaned.filter((n) => n.status === 'unchanged').length,
  };

  return { nodes: cleaned, summary };
}

/**
 * Parse a raw JSON string, returning typed result or error message.
 */
export function parseJsonSafe(
  raw: string
): { ok: true; data: unknown } | { ok: false; error: string } {
  if (!raw.trim()) return { ok: false, error: 'Empty input' };
  try {
    return { ok: true, data: JSON.parse(raw) };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : 'Invalid JSON' };
  }
}
