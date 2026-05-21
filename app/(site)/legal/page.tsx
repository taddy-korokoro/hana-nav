import type { Metadata } from 'next';
import { COPY } from '@/lib/constants/copy';

const COPY_PAGE = COPY.staticPages.legal;

export const metadata: Metadata = {
  title: COPY_PAGE.metaTitle,
  description: COPY_PAGE.metaDescription,
};

const ITEMS = [
  {
    label: '販売事業者',
    value: '個人運営（法人化後に正式名称を本表記に反映します）',
  },
  {
    label: '運営責任者',
    value: '請求があった場合に遅滞なく開示します',
  },
  {
    label: '所在地',
    value: '請求があった場合に遅滞なく開示します',
  },
  {
    label: '連絡先',
    value: 'フッターの「お問い合わせ」リンクからご連絡ください',
  },
  {
    label: '販売価格',
    value: '本サービスは無料で提供しています（有料機能を追加する際は本表記を更新します）',
  },
  {
    label: '商品代金以外の必要料金',
    value:
      '本サービスの利用に必要な通信費等は利用者の負担となります。本サービス自体に追加料金は発生しません。',
  },
  {
    label: '役務の提供時期',
    value: 'アカウント作成後、即時に提供します',
  },
  {
    label: '返品・キャンセル',
    value: '本サービスは無料のため、返品・キャンセルの対象はありません',
  },
] as const;

export default function LegalPage() {
  return (
    <section className="mx-auto max-w-3xl px-6 pb-24 pt-8 md:pt-12">
      <header className="pb-8">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-brand">
          {COPY_PAGE.eyebrow}
        </p>
        <h1 className="mt-3 font-serif text-4xl font-bold leading-[1.25] tracking-tight md:text-5xl">
          {COPY_PAGE.title}
        </h1>
        <p className="mt-3 text-sm leading-7 text-ink-muted">{COPY_PAGE.description}</p>
        <p className="mt-4 text-xs text-ink-faint">
          {COPY.staticPages.lastUpdatedLabel}：{COPY_PAGE.lastUpdated}
        </p>
      </header>

      <article className="text-sm leading-7 text-ink">
        <dl className="divide-y divide-line border-t border-line">
          {ITEMS.map((item) => (
            <div key={item.label} className="grid gap-2 py-5 sm:grid-cols-[12rem_1fr] sm:gap-6">
              <dt className="font-serif text-base font-semibold text-ink">{item.label}</dt>
              <dd className="text-sm leading-7 text-ink-muted">{item.value}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-10 text-xs leading-6 text-ink-faint">
          ※
          将来的に有料機能を提供する際は、商品ごとの価格・支払い方法・引き渡し時期等を別途明記します。
        </p>
      </article>
    </section>
  );
}
