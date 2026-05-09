import Link from 'next/link';

const POLICY_LINKS = [
  { label: '利用規約', href: '/terms' },
  { label: 'プライバシーポリシー', href: '/privacy' },
  { label: '特定商取引法に基づく表記', href: '/legal' },
];

const NAV_LINKS = [
  { label: 'スポット検索', href: '/spots' },
  { label: '花の種類', href: '/flowers' },
  { label: 'AI花判定', href: '/identify' },
];

const CONTACT_EMAIL = 'support@hana-nav.example';

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto bg-surface-2">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 md:grid-cols-3">
        <div>
          <p className="font-serif text-lg font-bold tracking-wider">hana nav</p>
          <p className="mt-2 text-xs leading-6 text-ink-muted">
            全国の花畑スポットを、エリア・季節・花の種類から探せる検索サービス。
          </p>
        </div>

        <nav>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">Explore</p>
          <ul className="mt-3 space-y-2 text-sm">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-ink hover:text-brand">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">About</p>
          <ul className="mt-3 space-y-2 text-sm">
            {POLICY_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-ink hover:text-brand">
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-ink hover:text-brand">
                お問い合わせ
              </a>
            </li>
          </ul>
        </nav>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto max-w-6xl px-6 py-4 text-xs text-ink-faint">© {year} hana nav</div>
      </div>
    </footer>
  );
}
