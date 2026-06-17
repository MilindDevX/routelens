'use client';

import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface DiffTextareaProps {
  id: string;
  label: string;
  labelColor?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string | null;
  placeholder?: string;
  readOnly?: boolean;
}

export function DiffTextarea({
  id,
  label,
  labelColor = 'var(--text-muted)',
  value,
  onChange,
  error,
  placeholder,
  readOnly = false,
}: DiffTextareaProps) {
  return (
    <div className="flex flex-col gap-2 flex-1 min-w-0">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wider" style={{ color: labelColor }}>
          {label}
        </label>
        {value && !error && (
          <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
            {value.split('\n').length} lines
          </span>
        )}
      </div>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || `Paste JSON here…\n\n{\n  "key": "value"\n}`}
        className="textarea-base flex-1 h-64"
        style={error ? { border: '2px solid rgba(248,113,113,0.5)', outline: 'none' } : {}}
        spellCheck={false}
        readOnly={readOnly}
      />
      {error && (
        <div
          className="flex items-start gap-2 text-xs rounded-lg px-3 py-2"
          style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: 'var(--red)' }}
        >
          <ExclamationTriangleIcon className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span className="font-mono">{error}</span>
        </div>
      )}
    </div>
  );
}
