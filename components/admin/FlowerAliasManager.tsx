'use client';

import { useState } from 'react';
import type { FlowerAliasInput } from '@/lib/queries/admin-flower-mutations';

const INPUT_CLASS =
  'w-full rounded-card border border-line bg-white px-3 py-2 text-sm outline-none transition focus:border-line-strong ';

type Labels = {
  aliasLabel: string;
  aliasPlaceholder: string;
  addAlias: string;
  removeAlias: string;
  aliasEmpty: string;
};

type Props = {
  value: FlowerAliasInput[];
  onChange: (next: FlowerAliasInput[]) => void;
  labels: Labels;
};

/**
 * 花マスターの別名（flower_aliases.alias）を編集するコンポーネント。
 * - 並び順は意味を持たないため、表示は登録順のみ（並び替えなし）
 * - 同フォーム内の重複は addAlias 時にクライアントでガードし、サーバー側でも検証する
 */
export function FlowerAliasManager({ value, onChange, labels }: Props) {
  const [draft, setDraft] = useState('');

  const handleAdd = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    if (value.some((a) => a.alias.trim() === trimmed)) {
      setDraft('');
      return;
    }
    onChange([...value, { alias: trimmed }]);
    setDraft('');
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex-1">
          <span className="mb-1 block text-sm font-medium text-ink">{labels.aliasLabel}</span>
          <input
            type="text"
            className={INPUT_CLASS}
            placeholder={labels.aliasPlaceholder}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAdd();
              }
            }}
          />
        </label>
        <button
          type="button"
          onClick={handleAdd}
          className="rounded-pill border border-line bg-white px-4 py-2 text-sm transition hover:border-line-strong hover:bg-surface-2"
        >
          {labels.addAlias}
        </button>
      </div>

      {value.length === 0 ? (
        <p className="text-xs text-ink-muted">{labels.aliasEmpty}</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {value.map((a, idx) => (
            <li
              key={`${a.alias}-${idx}`}
              className="inline-flex items-center gap-2 rounded-pill border border-line bg-white px-3 py-1 text-sm"
            >
              <span>{a.alias}</span>
              <button
                type="button"
                onClick={() => onChange(value.filter((_, i) => i !== idx))}
                aria-label={labels.removeAlias}
                className="text-xs text-destructive transition hover:text-destructive/80"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
