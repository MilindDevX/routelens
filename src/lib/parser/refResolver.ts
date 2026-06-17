/**
 * Recursive $ref resolver for inline OpenAPI specs.
 * Handles:
 *   - Chained refs (A → B → C)
 *   - Circular refs (substitutes { $circular: true } and warns)
 *   - OpenAPI 2.0 (#/definitions/...) and 3.x (#/components/schemas/...)
 *   - External refs (http://, ./relative) are skipped with a warning
 */

export interface ResolveResult {
  resolved: unknown;
  warnings: string[];
}

export function resolveRefs(root: unknown): ResolveResult {
  const warningSet = new Set<string>();

  function addWarning(msg: string) {
    if (!warningSet.has(msg)) {
      warningSet.add(msg);
    }
  }

  function getByPath(obj: unknown, pathParts: string[]): unknown {
    let current = obj;
    for (const part of pathParts) {
      if (current === null || typeof current !== 'object') return undefined;
      current = (current as Record<string, unknown>)[part];
    }
    return current;
  }

  function resolveNode(
    node: unknown,
    inFlight: Set<string>
  ): unknown {
    if (node === null || typeof node !== 'object') return node;

    // Array
    if (Array.isArray(node)) {
      return node.map((item) => resolveNode(item, inFlight));
    }

    const obj = node as Record<string, unknown>;

    // $ref node
    if ('$ref' in obj && typeof obj['$ref'] === 'string') {
      const ref = obj['$ref'] as string;

      // External ref — skip
      if (ref.startsWith('http://') || ref.startsWith('https://') || !ref.startsWith('#')) {
        addWarning(`External $ref skipped: "${ref}"`);
        return { $externalRef: ref };
      }

      // Circular ref protection
      if (inFlight.has(ref)) {
        addWarning(`Circular $ref detected: "${ref}"`);
        return { $circular: true, $ref: ref };
      }

      // Resolve the internal path
      // #/components/schemas/Foo → ['components', 'schemas', 'Foo']
      // #/definitions/Foo → ['definitions', 'Foo']
      const pathStr = ref.slice(1); // remove leading #
      const pathParts = pathStr.split('/').filter(Boolean);
      const target = getByPath(root, pathParts);

      if (target === undefined) {
        addWarning(`Could not resolve $ref: "${ref}"`);
        return { $unresolved: ref };
      }

      const nextInFlight = new Set(inFlight);
      nextInFlight.add(ref);
      return resolveNode(target, nextInFlight);
    }

    // Regular object — recurse into all values
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj)) {
      result[key] = resolveNode(val, inFlight);
    }
    return result;
  }

  const resolved = resolveNode(root, new Set<string>());

  return {
    resolved,
    warnings: Array.from(warningSet),
  };
}
