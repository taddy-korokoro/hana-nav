import type { Metadata } from 'next';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { COPY } from '@/lib/constants/copy';

// 完全静的だが、共通レイアウト（SiteHeader の UserNavIsland 等）が cookies を読むため
// 他ページと同様 disableValidation を付ける。プリフェッチ自体は有効。
export const unstable_instant = { prefetch: 'static', unstable_disableValidation: true };

const COPY_PAGE = COPY.staticPages.terms;

export const metadata: Metadata = {
  title: COPY_PAGE.metaTitle,
  description: COPY_PAGE.metaDescription,
};

export default function TermsPage() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-24 pt-8 md:pt-12">
      <header className="pb-8">
        <Breadcrumb
          className="mb-4"
          items={[{ label: COPY.nav.labels.home, href: '/' }, { label: COPY_PAGE.title }]}
        />
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

      <article className="max-w-3xl space-y-10 text-sm leading-7 text-ink">
        <section>
          <h2 className="font-serif text-xl font-bold">第 1 条（適用範囲）</h2>
          <p className="mt-3">
            本規約は、運営者が提供する「hana
            nav」（以下「本サービス」といいます）の利用条件を定めるものです。利用者は、本規約に同意のうえで本サービスを利用するものとします。
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold">第 2 条（サービス内容）</h2>
          <p className="mt-3">
            本サービスは、全国の花畑スポットの検索・情報提供、AI
            による花の判定、旅のしおりの生成等の機能を、利用者に対し原則無料で提供します。運営者は、機能の追加・変更・廃止を予告なく行うことがあります。
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold">第 3 条（アカウント）</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-6">
            <li>
              利用者は、メールアドレスまたは外部認証サービスを用いてアカウントを作成できます。
            </li>
            <li>
              アカウント情報の管理は利用者の責任で行うものとし、第三者への譲渡・貸与は禁止します。
            </li>
            <li>利用者はマイページから自らのアカウントを退会することができます。</li>
          </ol>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold">第 4 条（禁止事項）</h2>
          <p className="mt-3">利用者は、本サービスの利用にあたり以下の行為をしてはなりません。</p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>法令または公序良俗に違反する行為</li>
            <li>他者への誹謗中傷・なりすまし・ハラスメント</li>
            <li>不正アクセス、サーバへの過剰な負荷、自動化されたスクレイピング</li>
            <li>虚偽情報や他者の著作権・肖像権を侵害する投稿</li>
            <li>本サービスを商用目的で無断利用する行為</li>
            <li>その他、運営者が不適切と判断する行為</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold">第 5 条（AI 機能の利用範囲）</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-6">
            <li>
              本サービスの AI 花判定および AI による情報生成（以下「AI
              機能」といいます）は、参考情報の提供を目的とするものです。
            </li>
            <li>
              AI
              機能による判定結果・生成情報は、その正確性・完全性・最新性を保証するものではありません。
            </li>
            <li>
              利用者は AI
              機能の出力を自らの判断と責任において利用するものとし、医薬・健康・安全に関わる判断には用いないでください。
            </li>
            <li>AI 機能を不当な目的（虚偽の生成・なりすまし等）に利用することは禁止します。</li>
          </ol>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold">第 6 条（現地マナー）</h2>
          <p className="mt-3">
            本サービスで紹介するスポットには、私有地・農地・自然保護区が含まれる場合があります。利用者は以下を遵守してください。
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>立ち入り禁止区域には入らない</li>
            <li>花や植物を採取・損傷しない</li>
            <li>周辺住民・他の来訪者の迷惑となる行為をしない</li>
            <li>各スポットが定めるルール・営業時間・入場料を確認のうえ訪問する</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold">第 7 条（投稿コンテンツの取り扱い）</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-6">
            <li>
              利用者がレビュー・画像等を投稿した場合、当該コンテンツの著作権は利用者に帰属します。
            </li>
            <li>
              利用者は、運営者が本サービスの提供・改善・宣伝のために当該コンテンツを無償・非独占的に利用することを許諾するものとします。
            </li>
            <li>
              運営者は、第 4 条に違反するコンテンツを通知なく非表示・論理削除することがあります。
            </li>
          </ol>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold">第 8 条（外部リンク・アフィリエイト）</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-6">
            <li>
              本サービスは、楽天株式会社が提供する「楽天アフィリエイト」プログラムに参加しており、関連する書籍・商品・宿泊施設へのアフィリエイトリンクを掲載することがあります。
            </li>
            <li>
              アフィリエイトリンク先での商品購入・宿泊予約・契約条件・配送・返品・トラブル対応等は、すべてリンク先の販売事業者と利用者との間で完結するものであり、運営者は当該取引について一切の責任を負いません。
            </li>
            <li>
              本サービスから外部サイトへ遷移した場合、外部サイトでの個人情報の取り扱いは当該外部サイトの定めに従います。利用者は、外部サイトの規約・プライバシーポリシーをご自身でご確認ください。
            </li>
          </ol>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold">第 9 条（免責事項）</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-6">
            <li>
              運営者は、本サービスの内容、AI
              機能の判定結果、紹介スポットの開花状況・営業状況の正確性について、いかなる保証も行いません。
            </li>
            <li>
              本サービスの利用に起因して利用者または第三者に生じた損害について、運営者は責任を負わないものとします。
            </li>
            <li>
              運営者は、本サービスの中断・終了・データ消失について、可能な範囲で利用者に通知するものとし、その他の責任を負わないものとします。
            </li>
          </ol>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold">第 10 条（規約の改定）</h2>
          <p className="mt-3">
            運営者は、必要に応じて本規約を改定することがあります。改定後の規約は、本サービス上で公開した時点から効力を生じます。
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold">第 11 条（準拠法および管轄）</h2>
          <p className="mt-3">
            本規約は日本法に準拠し、本サービスに関して紛争が生じた場合は、運営者の所在地を管轄する裁判所を第一審の専属的合意管轄裁判所とします。
          </p>
        </section>

        <section className="border-t border-line pt-8">
          <h2 className="font-serif text-xl font-bold">{COPY.staticPages.historyHeading}</h2>
          <ul className="mt-3 space-y-2 text-sm text-ink-muted">
            <li>2026-05-25 アフィリエイトリンク条項追加に伴う条文追加</li>
            <li>2026-05-21 初版公開</li>
          </ul>
        </section>
      </article>
    </section>
  );
}
