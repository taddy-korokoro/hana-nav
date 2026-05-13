import Link from 'next/link';
import { COPY } from '@/lib/constants/copy';
import { SiteLogo } from './site-logo';

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto bg-surface-2">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 md:grid-cols-3">
        <div>
          <SiteLogo size="md" />
          <p className="mt-2 text-xs leading-6 text-ink-muted">{COPY.site.descriptionShort}</p>
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
              <a href={`mailto:${COPY.site.contactEmail}`} className="text-ink hover:text-brand">
                {COPY.footer.contact}
              </a>
            </li>
          </ul>
        </nav>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto max-w-6xl px-6 py-4 text-xs text-ink-faint">
          {COPY.site.copyright(year)}
        </div>
      </div>
    </footer>
  );
}
