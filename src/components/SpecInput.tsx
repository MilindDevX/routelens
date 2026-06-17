'use client';

import { useState, useCallback } from 'react';
import { parseOpenApiSpec } from '@/lib/parser/openapi';
import { parseQuickAdd } from '@/lib/parser/quickadd';
import { ParseErrorBanner, QuickAddErrors } from './ParseErrorBanner';
import type { RouteRecord } from '@/types';
import {
  DocumentTextIcon,
  PlusCircleIcon,
  ArrowUpTrayIcon,
  LinkIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

type InputMode = 'spec' | 'quickadd' | 'url';

interface SpecInputProps {
  onRoutesAdded: (routes: RouteRecord[]) => void;
}

const QUICKADD_PLACEHOLDER = `GET /users — list all users
POST /users — create user
GET /users/:id — get user by id
PUT /users/:id — update user
DELETE /users/:id — delete user
GET /posts?page=1&limit=10 — paginated posts`;

const SPEC_PLACEHOLDER = `Paste OpenAPI 2.0 or 3.x spec here (JSON or YAML)…

Example — OpenAPI 3.0 YAML:
openapi: "3.0.3"
info:
  title: My API
  version: "1.0"
paths:
  /users:
    get:
      summary: List users
      ...`;

export function SpecInput({ onRoutesAdded }: SpecInputProps) {
  const [mode, setMode] = useState<InputMode>('spec');
  const [text, setText] = useState('');
  const [projectName, setProjectName] = useState('');
  const [error, setError] = useState<{ message: string; detail?: string } | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [quickAddErrors, setQuickAddErrors] = useState<
    { line: number; text: string; reason: string }[]
  >([]);
  const [parsing, setParsing] = useState(false);
  const [lastAdded, setLastAdded] = useState(0);

  // URL mode state
  const [urlInput, setUrlInput] = useState('');
  const [fetchLoading, setFetchLoading] = useState(false);

  const resetStatus = () => {
    setError(null);
    setWarnings([]);
    setQuickAddErrors([]);
  };

  const switchMode = (m: InputMode) => {
    setMode(m);
    resetStatus();
  };

  const flashSuccess = (count: number) => {
    setLastAdded(count);
    setTimeout(() => setLastAdded(0), 4000);
  };

  // ── Parse pasted text ───────────────────────────────────────────────────────
  const handleParse = useCallback(async () => {
    resetStatus();
    if (!text.trim()) {
      setError({ message: 'Input is empty. Paste a spec or route list first.' });
      return;
    }

    setParsing(true);
    await new Promise((r) => setTimeout(r, 10));

    if (mode === 'spec') {
      const result = parseOpenApiSpec(text, projectName.trim());
      setParsing(false);
      if (!result.ok) {
        setError({ message: result.error, detail: result.detail });
        return;
      }
      if (result.warnings.length) setWarnings(result.warnings);
      onRoutesAdded(result.data);
      flashSuccess(result.data.length);
      setText('');
    } else {
      const { routes, lineErrors } = parseQuickAdd(text, projectName.trim());
      setParsing(false);
      if (lineErrors.length) setQuickAddErrors(lineErrors);
      if (routes.length > 0) {
        onRoutesAdded(routes);
        flashSuccess(routes.length);
        if (!lineErrors.length) setText('');
      } else if (!lineErrors.length) {
        setError({ message: 'No valid routes found. Check the format.' });
      } else {
        setError({ message: 'No valid routes could be parsed from the input.' });
      }
    }
  }, [text, mode, projectName, onRoutesAdded]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      if (mode === 'url') handleFetchUrl();
      else handleParse();
    }
  };

  // ── Load from URL ───────────────────────────────────────────────────────────
  const handleFetchUrl = useCallback(async () => {
    resetStatus();
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setError({ message: 'Enter a URL first.' });
      return;
    }
    // Basic URL validation
    try {
      new URL(trimmed);
    } catch {
      setError({ message: 'Invalid URL. Enter a full URL including http:// or https://' });
      return;
    }

    setFetchLoading(true);
    try {
      const response = await fetch(trimmed, {
        // No credentials — this is user-initiated, to their own endpoints
        headers: { Accept: 'application/json, application/yaml, text/yaml, text/plain, */*' },
      });

      if (!response.ok) {
        setError({
          message: `Server returned ${response.status} ${response.statusText}`,
          detail: 'Check the URL is correct and the server is running.',
        });
        return;
      }

      const rawText = await response.text();
      const result = parseOpenApiSpec(rawText, projectName.trim(), 'url');

      if (!result.ok) {
        setError({ message: result.error, detail: result.detail });
        return;
      }

      if (result.warnings.length) setWarnings(result.warnings);
      onRoutesAdded(result.data);
      flashSuccess(result.data.length);
    } catch (e: unknown) {
      // Distinguish CORS/network errors from other errors
      if (e instanceof TypeError && e.message.toLowerCase().includes('failed to fetch')) {
        setError({
          message: 'Request blocked — likely a CORS restriction or the server is offline.',
          detail:
            'The server does not allow browser requests from this origin. ' +
            'This is common for production APIs and hosted docs. ' +
            'Copy the raw JSON/YAML and paste it in the "Paste OpenAPI Spec" tab instead.',
        });
      } else {
        setError({
          message: e instanceof Error ? e.message : 'Unknown network error',
        });
      }
    } finally {
      setFetchLoading(false);
    }
  }, [urlInput, projectName, onRoutesAdded]);

  const tabClass = (m: InputMode) =>
    `flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all duration-150 border-b-2 -mb-px ${
      mode === m
        ? 'text-indigo-400 border-indigo-500'
        : 'text-slate-500 border-transparent hover:text-slate-300'
    }`;

  return (
    <div className="card p-5 space-y-4" onKeyDown={handleKeyDown}>
      {/* Mode tabs */}
      <div className="flex items-center gap-0.5 border-b border-slate-800 -mx-5 px-5 pb-0">
        <button id="tab-spec" onClick={() => switchMode('spec')} className={tabClass('spec')}>
          <DocumentTextIcon className="w-4 h-4" />
          Paste OpenAPI Spec
        </button>
        <button id="tab-quickadd" onClick={() => switchMode('quickadd')} className={tabClass('quickadd')}>
          <PlusCircleIcon className="w-4 h-4" />
          Quick Add
        </button>
        <button id="tab-url" onClick={() => switchMode('url')} className={tabClass('url')}>
          <LinkIcon className="w-4 h-4" />
          Load from URL
        </button>
      </div>

      {/* Project name input — shared across all modes */}
      <div className="flex items-center gap-3">
        <label htmlFor="project-name-input" className="text-xs text-slate-500 whitespace-nowrap">
          Project tag
        </label>
        <input
          id="project-name-input"
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          placeholder="e.g. Petstore, My Backend v2 (optional)"
          className="input-base flex-1 max-w-xs text-xs py-1.5"
          maxLength={60}
        />
        {projectName && (
          <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full">
            {projectName}
          </span>
        )}
      </div>

      {/* Helper text */}
      <p className="text-xs text-slate-500">
        {mode === 'spec'
          ? 'Supports OpenAPI 2.0 (Swagger) and 3.x in JSON or YAML format. $refs are resolved automatically.'
          : mode === 'quickadd'
          ? 'One route per line: METHOD /path — optional summary. Path params like :id are normalized to {id}.'
          : 'Fetches a spec from a URL. Works best for localhost and CORS-enabled endpoints.'}
      </p>

      {/* CORS notice for URL mode */}
      {mode === 'url' && (
        <div className="flex items-start gap-2 text-xs text-amber-400/80 bg-amber-500/5 border border-amber-500/15 rounded-lg px-3 py-2.5">
          <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            <strong>CORS heads-up:</strong> Most production APIs block browser fetches. If this fails,
            copy the JSON/YAML and paste it in the{' '}
            <button
              className="underline hover:text-amber-300"
              onClick={() => switchMode('spec')}
            >
              Paste OpenAPI Spec
            </button>{' '}
            tab instead — that always works.
          </span>
        </div>
      )}

      {/* Input area */}
      {mode === 'url' ? (
        <div className="flex gap-2">
          <input
            id="url-input"
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="http://localhost:8000/openapi.json"
            className="input-base flex-1 font-mono text-sm"
            spellCheck={false}
          />
          <button
            id="fetch-url-btn"
            onClick={handleFetchUrl}
            disabled={fetchLoading || !urlInput.trim()}
            className="btn-primary whitespace-nowrap"
          >
            <LinkIcon className="w-4 h-4" />
            {fetchLoading ? 'Fetching…' : 'Fetch & Parse'}
          </button>
        </div>
      ) : (
        <textarea
          id={mode === 'spec' ? 'spec-input' : 'quickadd-input'}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={mode === 'spec' ? SPEC_PLACEHOLDER : QUICKADD_PLACEHOLDER}
          className="textarea-base h-48"
          spellCheck={false}
        />
      )}

      {/* Error/warnings */}
      {error && (
        <ParseErrorBanner
          error={error.message}
          detail={error.detail}
          onDismiss={() => setError(null)}
        />
      )}
      {warnings.length > 0 && (
        <ParseErrorBanner
          type="warning"
          error={`${warnings.length} warning${warnings.length !== 1 ? 's' : ''} during $ref resolution`}
          warnings={warnings}
          onDismiss={() => setWarnings([])}
        />
      )}
      {quickAddErrors.length > 0 && (
        <QuickAddErrors lineErrors={quickAddErrors} />
      )}

      {/* Success flash */}
      {lastAdded > 0 && (
        <div className="flex items-center gap-2 text-sm text-emerald-400 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          {lastAdded} route{lastAdded !== 1 ? 's' : ''} added successfully
        </div>
      )}

      {/* Actions — only shown for paste modes */}
      {mode !== 'url' && (
        <div className="flex items-center gap-3">
          <button
            id="parse-btn"
            onClick={handleParse}
            disabled={parsing || !text.trim()}
            className="btn-primary"
          >
            <ArrowUpTrayIcon className="w-4 h-4" />
            {parsing
              ? 'Parsing…'
              : mode === 'spec'
              ? 'Parse Spec'
              : 'Add Routes'}
          </button>
          <span className="text-xs text-slate-600">
            {mode === 'spec' ? '⌘+Enter to parse' : '⌘+Enter to add'}
          </span>
        </div>
      )}
    </div>
  );
}
