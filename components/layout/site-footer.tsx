import Link from 'next/link';
import { Suspense } from 'react';
import { SiteFooterYear } from '@/components/layout/site-footer-year';
import { COPY } from '@/lib/constants/copy';

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-surface-2">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 md:grid-cols-3">
        <div>
          <p className="text-xs leading-6 text-ink-muted">{COPY.site.descriptionShort}</p>
        </div>

        <nav>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">
            {COPY.footer.explore}
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {COPY.nav.items.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-ink hover:text-brand">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">
            {COPY.footer.about}
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {COPY.footer.policyLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-ink hover:text-brand">
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/contact" className="text-ink hover:text-brand">
                {COPY.footer.contact}
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto max-w-6xl px-6 py-4 text-xs text-ink-faint">
          {/* 年表示は new Date() に依存するため Client Component（葉）に切り出し、
              cacheComponents 有効下の prerender 拒否を予防。fallback={null} は CLS 回避用。 */}
          <Suspense fallback={null}>
            <SiteFooterYear />
          </Suspense>
        </div>
      </div>
    </footer>
  );
}
