import { detectAndParse } from './detect';
import { resolveRefs } from './refResolver';
import { generateId } from '@/lib/uuid';
import type {
  ParseResult,
  RouteRecord,
  RouteParam,
  HttpMethod,
} from '@/types';

// ─── Type Guards ──────────────────────────────────────────────────────────────

function isObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function asString(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

function asArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

const VALID_METHODS: HttpMethod[] = [
  'GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS',
];

// ─── Schema Key Extraction ────────────────────────────────────────────────────

/**
 * Extract top-level keys from a JSON Schema object.
 * Handles allOf/oneOf/anyOf merging.
 */
function extractSchemaKeys(schema: unknown): string[] {
  if (!isObject(schema)) return [];

  const keys = new Set<string>();

  // Direct properties
  if (isObject(schema.properties)) {
    for (const k of Object.keys(schema.properties)) {
      keys.add(k);
    }
  }

  // Merge combiners
  for (const combiner of ['allOf', 'oneOf', 'anyOf']) {
    for (const sub of asArray(schema[combiner])) {
      for (const k of extractSchemaKeys(sub)) {
        keys.add(k);
      }
    }
  }

  // items for arrays
  if (schema.type === 'array' && isObject(schema.items)) {
    for (const k of extractSchemaKeys(schema.items)) {
      keys.add(k);
    }
  }

  return Array.from(keys);
}

// ─── Parameter Extraction ─────────────────────────────────────────────────────

function extractParams(rawParams: unknown[]): RouteParam[] {
  return rawParams
    .filter(isObject)
    .map((p) => {
      const inVal = asString(p.in) as RouteParam['in'];
      const schema = isObject(p.schema)
        ? asString((p.schema as Record<string, unknown>).type)
        : asString(p.type);
      return {
        name: asString(p.name, '(unnamed)'),
        in: (['query', 'path', 'header', 'body', 'formData', 'cookie'].includes(inVal)
          ? inVal
          : 'query') as RouteParam['in'],
        required: Boolean(p.required),
        schema: schema || undefined,
        description: asString(p.description) || undefined,
      };
    });
}

// ─── Response Key Extraction ──────────────────────────────────────────────────

function extractResponseKeys(responses: unknown): string[] {
  if (!isObject(responses)) return [];

  // Find first 2xx response
  const statusCodes = Object.keys(responses).sort();
  const successCode = statusCodes.find((c) => c.startsWith('2'));
  if (!successCode) return [];

  const response = responses[successCode];
  if (!isObject(response)) return [];

  // OpenAPI 3.x: response.content['application/json'].schema
  if (isObject(response.content)) {
    const jsonContent =
      response.content['application/json'] ||
      response.content['application/json; charset=utf-8'] ||
      Object.values(response.content)[0];

    if (isObject(jsonContent) && isObject(jsonContent.schema)) {
      return extractSchemaKeys(jsonContent.schema);
    }
  }

  // OpenAPI 2.0: response.schema
  if (isObject(response.schema)) {
    return extractSchemaKeys(response.schema);
  }

  return [];
}

// ─── Main Parser ──────────────────────────────────────────────────────────────

export function parseOpenApiSpec(
  raw: string,
  project = '',
  source: RouteRecord['source'] = 'openapi'
): ParseResult<RouteRecord[]> {
  // Step 1: Parse text
  let parsed: unknown;
  try {
    const result = detectAndParse(raw);
    parsed = result.parsed;
  } catch (e: unknown) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Failed to parse input',
    };
  }

  if (!isObject(parsed)) {
    return {
      ok: false,
      error: "Couldn't parse this as an OpenAPI/Swagger spec. Make sure it's a valid JSON or YAML object.",
    };
  }

  // Step 2: Validate it looks like OpenAPI
  if (!parsed.swagger && !parsed.openapi) {
    return {
      ok: false,
      error:
        'This doesn\'t look like an OpenAPI spec — no top-level "swagger" or "openapi" key found.',
      detail: 'Supported formats: OpenAPI 2.0 (swagger: "2.0") and OpenAPI 3.x (openapi: "3.x.x")',
    };
  }

  // Step 3: Resolve $refs
  const { resolved, warnings } = resolveRefs(parsed);
  const spec = resolved as Record<string, unknown>;

  // Step 4: Extract metadata
  const info = isObject(spec.info) ? spec.info : {};
  const specTitle = asString(info.title) || undefined;

  // Step 5: Extract routes from paths
  const paths = spec.paths;
  if (!isObject(paths)) {
    return {
      ok: false,
      error: 'No "paths" object found in spec.',
    };
  }

  const routes: RouteRecord[] = [];
  const now = new Date().toISOString();

  for (const [path, pathItem] of Object.entries(paths)) {
    if (!isObject(pathItem)) continue;

    // Path-level parameters (inherited by all operations)
    const pathParams = asArray(pathItem.parameters);

    for (const method of VALID_METHODS) {
      const methodKey = method.toLowerCase();
      const operation = pathItem[methodKey];
      if (!isObject(operation)) continue;

      // Merge path-level params with operation params
      const opParams = asArray(operation.parameters);
      const mergedParams = [...pathParams, ...opParams];

      const tags = asArray(operation.tags)
        .filter((t): t is string => typeof t === 'string');

      routes.push({
        id: generateId(),
        method,
        path,
        summary: asString(operation.summary) || asString(operation.description) || '',
        operationId: asString(operation.operationId) || undefined,
        params: extractParams(mergedParams),
        responseKeys: extractResponseKeys(operation.responses),
        source,
        tags,
        project,
        specTitle,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  if (routes.length === 0) {
    return {
      ok: false,
      error: 'No routes found in spec. The "paths" object may be empty.',
    };
  }

  return { ok: true, data: routes, warnings };
}
