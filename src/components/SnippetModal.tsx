'use client';

import { useState } from 'react';
import { generateSnippet } from '@/lib/snippets';
import type { RouteRecord } from '@/types';
import { XMarkIcon, ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline';

type Format = 'curl' | 'fetch' | 'axios';

const FORMAT_TABS: { id: Format; label: string }[] = [
  { id: 'curl', label: 'curl' },
  { id: 'fetch', label: 'fetch' },
  { id: 'axios', label: 'axios' },
];

interface SnippetModalProps {
  route: RouteRecord;
  onClose: () => void;
}

export function SnippetModal({ route, onClose }: SnippetModalProps) {
  const [format, setFormat] = useState<Format>('curl');
  const [copied, setCopied] = useState(false);

  const snippet = generateSnippet(route, format);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = snippet;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-gray-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-200">Code Snippet</span>
            <code className="text-xs text-slate-400 font-mono">
              {route.method} {route.path}
            </code>
          </div>
          <button
            onClick={onClose}
            className="btn-ghost p-1.5"
            id="snippet-modal-close"
            aria-label="Close"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Format tabs */}
        <div className="flex items-center gap-1 px-5 pt-4">
          {FORMAT_TABS.map((tab) => (
            <button
              key={tab.id}
              id={`snippet-tab-${tab.id}`}
              onClick={() => setFormat(tab.id)}
              className={`px-3 py-1.5 text-sm font-mono rounded-lg transition-all ${
                format === tab.id
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Code */}
        <div className="relative m-5 mt-3">
          <pre className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-sm font-mono text-slate-300 overflow-x-auto leading-relaxed whitespace-pre-wrap break-all">
            {snippet}
          </pre>
          <button
            id="copy-snippet-btn"
            onClick={handleCopy}
            className="absolute top-3 right-3 btn-secondary py-1.5 px-2.5 text-xs"
          >
            {copied ? (
              <>
                <CheckIcon className="w-3.5 h-3.5 text-emerald-400" />
                Copied!
              </>
            ) : (
              <>
                <ClipboardDocumentIcon className="w-3.5 h-3.5" />
                Copy
              </>
            )}
          </button>
        </div>

        <p className="px-5 pb-4 text-xs text-slate-500">
          Replace <code className="text-slate-400">&lt;param&gt;</code> placeholders with actual values before sending.
        </p>
      </div>
    </div>
  );
}
