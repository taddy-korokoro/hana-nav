import type { Metadata } from 'next';
import Link from 'next/link';
import { AiUsageChart } from '@/components/admin/AiUsageChart';
import { COPY } from '@/lib/constants/copy';
import { ESTIMATED_YEN_PER_CALL, getAiUsageStats } from '@/lib/queries/admin-ai-usage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: COPY.admin.aiUsage.metaTitle,
  robots: { index: false, follow: false },
};

export default async function AdminAiUsagePage() {
  const { summary, daily, monthly, ranking } = await getAiUsageStats();
  const c = COPY.admin.aiUsage;

  const hasAny =
    summary.last30Days.total > 0 || summary.thisMonth.total > 0 || summary.last7Days.total > 0;

  return (
    <section className="mx-auto max-w-6xl space-y-10 px-6 pb-24 pt-8 md:pt-12">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-brand">{c.eyebrow}</p>
        <h1 className="mt-3 font-serif text-3xl font-bold leading-[1.25] tracking-tight md:text-4xl">
          {c.title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-muted">{c.description}</p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <SummaryCard
          label={c.summary.last7Days}
          stats={summary.last7Days}
          suffix={c.summary.countSuffix}
        />
        <SummaryCard
          label={c.summary.last30Days}
          stats={summary.last30Days}
          suffix={c.summary.countSuffix}
        />
        <SummaryCard
          label={c.summary.thisMonth}
          stats={summary.thisMonth}
          suffix={c.summary.countSuffix}
        />
        <CostCard label={c.summary.totalCost} yen={summary.estimatedCostThisMonthYen} />
      </div>

      <p className="text-xs text-ink-faint">{c.costNote(ESTIMATED_YEN_PER_CALL)}</p>

      {!hasAny ? (
        <p className="rounded-card border border-line bg-white p-8 text-center text-sm text-ink-muted">
          {c.empty}
        </p>
      ) : null}

      <section className="rounded-card border border-line bg-white p-6">
        <h2 className="font-serif text-lg font-semibold">{c.daily.heading}</h2>
        {daily.every((d) => d.total === 0) ? (
          <p className="mt-3 text-sm text-ink-muted">{c.daily.empty}</p>
        ) : (
          <div className="mt-4">
            <AiUsageChart rows={daily} />
          </div>
        )}
      </section>

      <section className="rounded-card border border-line bg-white p-6">
        <h2 className="font-serif text-lg font-semibold">{c.monthly.heading}</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="bg-surface-2 text-xs uppercase tracking-wider text-ink-muted">
              <tr>
                <th className="px-4 py-2">{c.monthly.month}</th>
                <th className="px-4 py-2 text-right">{c.monthly.anonymous}</th>
                <th className="px-4 py-2 text-right">{c.monthly.authenticated}</th>
                <th className="px-4 py-2 text-right">{c.monthly.total}</th>
              </tr>
            </thead>
            <tbody>
              {monthly.map((m) => (
                <tr key={m.month} className="border-t border-line">
                  <td className="px-4 py-2">{m.month}</td>
                  <td className="px-4 py-2 text-right text-ink-muted">{m.anonymous}</td>
                  <td className="px-4 py-2 text-right text-ink-muted">{m.authenticated}</td>
                  <td className="px-4 py-2 text-right font-medium">{m.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-card border border-line bg-white p-6">
        <h2 className="font-serif text-lg font-semibold">{c.ranking.heading}</h2>
        {ranking.length === 0 ? (
          <p className="mt-3 text-sm text-ink-muted">{c.ranking.empty}</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-surface-2 text-xs uppercase tracking-wider text-ink-muted">
                <tr>
                  <th className="px-4 py-2">{c.ranking.rank}</th>
                  <th className="px-4 py-2">{c.ranking.user}</th>
                  <th className="px-4 py-2 text-right">{c.ranking.count}</th>
                  <th className="px-4 py-2 text-right">{c.ranking.rewardUnlocked}</th>
                  <th className="px-4 py-2 text-right">{c.ranking.view}</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((r, i) => (
                  <tr key={r.userId} className="border-t border-line">
                    <td className="px-4 py-2 text-xs text-ink-faint">{i + 1}</td>
                    <td className="px-4 py-2">
                      <Link
                        href={`/admin/users/${r.userId}`}
                        className="font-medium text-ink hover:text-brand"
                      >
                        {r.username ?? c.ranking.anonymousName}
                      </Link>
                      {r.isWithdrawn && (
                        <span className="ml-2 rounded-pill bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">
                          退会済
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right font-medium">{r.count}</td>
                    <td className="px-4 py-2 text-right text-ink-muted">{r.rewardUnlockedCount}</td>
                    <td className="px-4 py-2 text-right">
                      <Link
                        href={`/admin/users/${r.userId}`}
                        className="rounded-pill border border-line bg-white px-3 py-1 text-xs transition hover:border-line-strong hover:bg-surface-2"
                      >
                        {c.ranking.view}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}

function SummaryCard({
  label,
  stats,
  suffix,
}: {
  label: string;
  stats: { anonymous: number; authenticated: number; total: number };
  suffix: string;
}) {
  const c = COPY.admin.aiUsage.summary;
  return (
    <div className="rounded-card border border-line bg-white px-6 py-5">
      <p className="text-sm text-ink-muted">{label}</p>
      <p className="mt-3">
        <span className="font-serif text-3xl font-bold text-ink">{stats.total}</span>
        <span className="ml-1.5 text-sm text-ink-muted">{suffix}</span>
      </p>
      <p className="mt-2 text-xs text-ink-faint">
        {c.anonymous}: {stats.anonymous} ／ {c.authenticated}: {stats.authenticated}
      </p>
    </div>
  );
}

function CostCard({ label, yen }: { label: string; yen: number }) {
  return (
    <div className="rounded-card border border-line bg-white px-6 py-5">
      <p className="text-sm text-ink-muted">{label}</p>
      <p className="mt-3">
        <span className="font-serif text-3xl font-bold text-ink">
          ¥{yen.toLocaleString('ja-JP')}
        </span>
      </p>
      <p className="mt-2 text-xs text-ink-faint">推計値</p>
    </div>
  );
}
