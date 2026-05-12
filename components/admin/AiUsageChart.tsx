import type { AiUsageDailyRow } from '@/lib/queries/admin-ai-usage';

type Props = {
  rows: AiUsageDailyRow[];
};

/**
 * 日別 AI 利用数の折れ線グラフ（サーバー描画 SVG）。匿名・認証済みの 2 系列を重ねる。
 * クライアント側でインタラクションは不要なので Server Component で完結。
 */
export function AiUsageChart({ rows }: Props) {
  const width = 720;
  const height = 200;
  const paddingX = 32;
  const paddingY = 24;

  const max = Math.max(1, ...rows.map((r) => r.total));
  const n = rows.length;

  const xAt = (i: number) =>
    n <= 1 ? width / 2 : paddingX + (i * (width - paddingX * 2)) / (n - 1);
  const yAt = (v: number) => height - paddingY - (v / max) * (height - paddingY * 2);

  const buildPath = (values: number[]) =>
    values
      .map((v, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i).toFixed(1)} ${yAt(v).toFixed(1)}`)
      .join(' ');

  const totals = rows.map((r) => r.total);
  const anons = rows.map((r) => r.anonymous);
  const auths = rows.map((r) => r.authenticated);

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="min-w-[640px] w-full"
        role="img"
        aria-label="日別 AI 利用件数の折れ線グラフ"
      >
        <rect x={0} y={0} width={width} height={height} fill="transparent" />
        {/* Y 軸の目盛 */}
        {[0, 0.25, 0.5, 0.75, 1].map((p, idx) => {
          const y = paddingY + (height - paddingY * 2) * (1 - p);
          const v = Math.round(max * p);
          return (
            <g key={idx}>
              <line
                x1={paddingX}
                x2={width - paddingX}
                y1={y}
                y2={y}
                stroke="rgba(0,0,0,0.06)"
                strokeWidth={1}
              />
              <text
                x={4}
                y={y + 3}
                fontSize={10}
                fill="rgba(0,0,0,0.45)"
                fontFamily="ui-sans-serif"
              >
                {v}
              </text>
            </g>
          );
        })}
        {/* 総数（濃いライン） */}
        <path d={buildPath(totals)} stroke="#d4467a" strokeWidth={2} fill="none" />
        {/* 認証済み */}
        <path
          d={buildPath(auths)}
          stroke="#7c83ff"
          strokeWidth={1.5}
          fill="none"
          strokeDasharray="3,3"
        />
        {/* 匿名 */}
        <path
          d={buildPath(anons)}
          stroke="#94a3b8"
          strokeWidth={1.5}
          fill="none"
          strokeDasharray="1,3"
        />
        {/* X 軸ラベル（5 日おき） */}
        {rows.map((r, i) => {
          if (i % 5 !== 0 && i !== n - 1) return null;
          return (
            <text
              key={r.date}
              x={xAt(i)}
              y={height - 6}
              fontSize={10}
              textAnchor="middle"
              fill="rgba(0,0,0,0.45)"
              fontFamily="ui-sans-serif"
            >
              {r.date.slice(5)}
            </text>
          );
        })}
      </svg>
      <div className="mt-2 flex flex-wrap gap-4 text-[11px] text-ink-muted">
        <LegendItem color="#d4467a" label="合計" />
        <LegendItem color="#7c83ff" label="認証済み" dashed />
        <LegendItem color="#94a3b8" label="匿名" dashed />
      </div>
    </div>
  );
}

function LegendItem({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <svg width={20} height={4} aria-hidden>
        <line
          x1={0}
          x2={20}
          y1={2}
          y2={2}
          stroke={color}
          strokeWidth={2}
          strokeDasharray={dashed ? '3,3' : undefined}
        />
      </svg>
      <span>{label}</span>
    </span>
  );
}
