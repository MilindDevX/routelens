import yaml from 'js-yaml';

type DetectedFormat = 'json' | 'yaml';

export interface DetectResult {
  format: DetectedFormat;
  parsed: unknown;
}

/**
 * Detect the format of raw spec text and parse it.
 * Tries JSON first (faster), falls back to YAML.
 * Throws a descriptive error if both fail.
 */
export function detectAndParse(raw: string): DetectResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error('Input is empty. Paste an OpenAPI/Swagger spec to continue.');
  }

  // Heuristic: if it starts with { or [ it's almost certainly JSON
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return { format: 'json', parsed: JSON.parse(trimmed) };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new Error(`Invalid JSON: ${msg}`);
    }
  }

  // Try YAML
  try {
    const parsed = yaml.load(trimmed);
    return { format: 'yaml', parsed };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Could not parse input as YAML or JSON: ${msg}`);
  }
}
