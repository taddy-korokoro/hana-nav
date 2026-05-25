'use client';

import { Check, ChevronDown, Search } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';

import { COPY } from '@/lib/constants/copy';

export type SearchableOption = {
  value: string;
  label: string;
  /** 選択するためのリンク先（クエリ更新後の URL）。クリア用は `clearHref` を別途渡す */
  href: string;
};

type Props = {
  label: string;
  /** 候補一覧。各候補は href を持つ Link 化されたアイテム */
  options: SearchableOption[];
  /** 選択を解除するときの URL（その filter param を undefined にした URL） */
  clearHref: string;
  /** 現在選択されている value（オプションに含まれる value のいずれか）。未選択は null */
  selectedValue: string | null;
};

/**
 * URL searchParams をベースに動くドロップダウン。リンクを押下するとそのまま遷移する。
 * - 検索 input で候補を絞り込み
 * - 「指定なし」を選ぶと clearHref へ遷移してフィルタ解除
 * - 外側クリック / Escape キーで閉じる
 */
export function SearchableSelect({ label, options, clearHref, selectedValue }: Props) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = selectedValue ? (options.find((o) => o.value === selectedValue) ?? null) : null;

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(query.toLowerCase().trim()),
  );

  // 外側クリック / Escape で閉じる
  useEffect(() => {
    if (!open) return;
    const closeFromEvent = () => {
      setOpen(false);
      setQuery('');
    };
    const handleClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        closeFromEvent();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeFromEvent();
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  // 開いたら検索入力にフォーカス（閉じたときの query クリアは閉じる側で実施）
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  return (
    <div ref={containerRef} className="relative">
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-ink-muted">
        {label}
      </label>
      <button
        id={id}
        type="button"
        onClick={() => {
          if (open) {
            close();
          } else {
            setOpen(true);
          }
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 rounded-card border border-line bg-white px-3.5 py-2.5 text-left text-sm text-ink transition-colors hover:border-line-strong"
      >
        <span className={selected ? 'text-ink' : 'text-ink-faint'}>
          {selected ? selected.label : COPY.spotsList.advanced.placeholder}
        </span>
        <ChevronDown className="size-4 shrink-0 text-ink-muted" aria-hidden />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={label}
          className="absolute left-0 right-0 z-20 mt-1 max-h-72 overflow-hidden rounded-card border border-line bg-white shadow-lg"
        >
          <div className="flex items-center gap-2 border-b border-line px-3 py-2">
            <Search className="size-4 shrink-0 text-ink-muted" aria-hidden />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={COPY.spotsList.advanced.searchPlaceholder}
              className="w-full bg-transparent text-sm outline-none placeholder:text-ink-faint"
            />
          </div>
          <ul className="max-h-56 overflow-y-auto py-1">
            <li>
              <Link
                href={clearHref}
                onClick={close}
                className="flex items-center justify-between px-3 py-2 text-sm text-ink-muted hover:bg-surface-2"
              >
                <span>{COPY.spotsList.advanced.placeholder}</span>
                {!selected && <Check className="size-4 text-brand" aria-hidden />}
              </Link>
            </li>
            {filtered.length === 0 ? (
              <li className="px-3 py-3 text-center text-xs text-ink-faint">
                {COPY.spotsList.advanced.noResults}
              </li>
            ) : (
              filtered.map((o) => {
                const isActive = o.value === selectedValue;
                return (
                  <li key={o.value}>
                    <Link
                      href={o.href}
                      onClick={close}
                      className={`flex items-center justify-between px-3 py-2 text-sm hover:bg-surface-2 ${
                        isActive ? 'font-medium text-brand' : 'text-ink'
                      }`}
                    >
                      <span>{o.label}</span>
                      {isActive && <Check className="size-4 text-brand" aria-hidden />}
                    </Link>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
