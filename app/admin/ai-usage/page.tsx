import type { Metadata } from 'next';
import Link from 'next/link';
import { AdminCard } from '@/app/admin/_components/admin-card';
import { AdminPageHeader } from '@/app/admin/_components/admin-page-header';
import { AiUsageChart } from '@/components/admin/AiUsageChart';
import { COPY } from '@/lib/constants/copy';
import { ESTIMATED_YEN_PER_CALL, getAiUsageStats } from '@/lib/queries/admin-ai-usage';


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
    <section className="mx-auto max-w-6xl space-y-8 px-4 pb-24 pt-8 md:space-y-10 md:px-6 md:pt-12">
      <AdminPageHeader eyebrow={c.eyebrow} title={c.title} description={c.description} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
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

      <AdminCard title={c.daily.heading}>
        {daily.every((d) => d.total === 0) ? (
          <p className="mt-3 text-sm text-ink-muted">{c.daily.empty}</p>
        ) : (
          <div className="mt-4">
            <AiUsageChart rows={daily} />
          </div>
        )}
      </AdminCard>

      <AdminCard title={c.monthly.heading}>
        {/* モバイル：縦リスト */}
        <ul className="mt-4 grid grid-cols-1 gap-2 sm:hidden">
          {monthly.map((m) => (
            <li
              key={m.month}
              className="flex items-baseline justify-between rounded-card border border-line px-3 py-2 text-sm"
            >
              <span className="font-medium">{m.month}</span>
              <span className="flex items-baseline gap-3 text-xs text-ink-muted">
                <span>
                  {c.monthly.anonymous} {m.anonymous}
                </span>
                <span>
                  {c.monthly.authenticated} {m.authenticated}
                </span>
                <span className="font-medium text-ink">{m.total}</span>
              </span>
            </li>
          ))}
        </ul>

        {/* デスクトップ：テーブル */}
        <div className="mt-4 hidden overflow-x-auto sm:block">
          <table className="w-full text-left text-sm">
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
      </AdminCard>

      <AdminCard title={c.ranking.heading}>
        {ranking.length === 0 ? (
          <p className="mt-3 text-sm text-ink-muted">{c.ranking.empty}</p>
        ) : (
          <>
            {/* モバイル：カード */}
            <ul className="mt-4 grid grid-cols-1 gap-2 md:hidden">
              {ranking.map((r, i) => (
                <li
                  key={r.userId}
                  className="flex items-center justify-between gap-3 rounded-card border border-line px-3 py-2"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="size-7 shrink-0 rounded-pill bg-surface-2 text-center text-xs font-medium leading-7 text-ink-muted">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <Link
                        href={`/admin/users/${r.userId}`}
                        className="block truncate text-sm font-medium text-ink hover:text-brand"
                      >
                        {r.username ?? c.ranking.anonymousName}
                      </Link>
                      <p className="mt-0.5 truncate text-[11px] text-ink-faint">
                        {c.ranking.count} {r.count} ・ {c.ranking.rewardUnlocked}{' '}
                        {r.rewardUnlockedCount}
                      </p>
                    </div>
                  </div>
                  {r.isWithdrawn && (
                    <span className="shrink-0 rounded-pill bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">
                      退会済
                    </span>
                  )}
                </li>
              ))}
            </ul>

            {/* デスクトップ：テーブル */}
            <div className="mt-4 hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
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
                      <td className="px-4 py-2 text-right text-ink-muted">
                        {r.rewardUnlockedCount}
                      </td>
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
          </>
        )}
      </AdminCard>
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
    <div className="rounded-card border border-line bg-white px-4 py-4 md:px-6 md:py-5">
      <p className="text-xs text-ink-muted md:text-sm">{label}</p>
      <p className="mt-2 md:mt-3">
        <span className="font-serif text-2xl font-bold text-ink md:text-3xl">{stats.total}</span>
        <span className="ml-1 text-xs text-ink-muted md:ml-1.5 md:text-sm">{suffix}</span>
      </p>
      <p className="mt-1 text-[10px] text-ink-faint md:mt-2 md:text-xs">
        {c.anonymous}: {stats.anonymous} ／ {c.authenticated}: {stats.authenticated}
      </p>
    </div>
  );
}

function CostCard({ label, yen }: { label: string; yen: number }) {
  return (
    <div className="rounded-card border border-line bg-white px-4 py-4 md:px-6 md:py-5">
      <p className="text-xs text-ink-muted md:text-sm">{label}</p>
      <p className="mt-2 md:mt-3">
        <span className="font-serif text-2xl font-bold text-ink md:text-3xl">
          ¥{yen.toLocaleString('ja-JP')}
        </span>
      </p>
      <p className="mt-1 text-[10px] text-ink-faint md:mt-2 md:text-xs">推計値</p>
    </div>
  );
}
