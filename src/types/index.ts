// ─── Route Data Model ────────────────────────────────────────────────────────

export type RouteSource = 'openapi' | 'quickadd' | 'url';

export type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'HEAD'
  | 'OPTIONS';

export interface RouteParam {
  name: string;
  in: 'query' | 'path' | 'header' | 'body' | 'formData' | 'cookie';
  required: boolean;
  schema?: string; // JSON Schema type string e.g. "string", "integer"
  description?: string;
}

export interface RouteRecord {
  id: string;
  method: HttpMethod;
  path: string;
  summary: string;
  operationId?: string;
  params: RouteParam[];
  responseKeys: string[];
  source: RouteSource;
  tags: string[];
  /** Optional project tag for grouping routes. Empty string = untagged. */
  project: string;
  specTitle?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Parse Results ────────────────────────────────────────────────────────────

export interface ParseSuccess<T> {
  ok: true;
  data: T;
  warnings: string[];
}

export interface ParseError {
  ok: false;
  error: string;
  detail?: string;
}

export type ParseResult<T> = ParseSuccess<T> | ParseError;

export interface QuickAddResult {
  routes: RouteRecord[];
  lineErrors: { line: number; text: string; reason: string }[];
}

// ─── Diff Data Model ─────────────────────────────────────────────────────────

export type DiffStatus =
  | 'added'
  | 'removed'
  | 'changed'
  | 'type-changed'
  | 'unchanged';

export interface DiffNode {
  path: string;
  status: DiffStatus;
  aVal?: unknown;
  bVal?: unknown;
  aType?: string;
  bType?: string;
  note?: string; // e.g. "Array length changed: 3 → 5"
}

// ─── localStorage Schemas ─────────────────────────────────────────────────────

export type BaselineStore = Record<string, string>; // routeId → raw JSON string

export interface DiffScratch {
  routeId?: string;
  rawA: string;
  rawB: string;
}


export const SCHEMA_VERSION = 1;

export const STORAGE_KEYS = {
  ROUTES: 'rl_routes_v1',
  BASELINES: 'rl_baselines_v1',
  DIFF_SCRATCH: 'rl_diff_scratch_v1',
  SCHEMA_VERSION: 'rl_schema_version',
} as const;

// ─── Duplicate Detection ──────────────────────────────────────────────────────

export interface DuplicateWarning {
  /** Human-readable dedup key */
  key: string;
  count: number;
}
