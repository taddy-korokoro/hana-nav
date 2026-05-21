import type { Metadata } from 'next';
import { COPY } from '@/lib/constants/copy';

const COPY_PAGE = COPY.staticPages.privacy;

export const metadata: Metadata = {
  title: COPY_PAGE.metaTitle,
  description: COPY_PAGE.metaDescription,
};

export default function PrivacyPage() {
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

      <article className="space-y-10 text-sm leading-7 text-ink">
        <section>
          <h2 className="font-serif text-xl font-bold">第 1 条（取得する情報）</h2>
          <p className="mt-3">本サービスは、利用者から以下の情報を取得します。</p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>メールアドレス、パスワード（パスワードはハッシュ化して保管します）</li>
            <li>
              Google アカウントでログインした場合、Google
              が提供するプロフィール情報（表示名・アイコン等）
            </li>
            <li>利用者が任意に登録するユーザー名、アバター画像、ブックマーク、レビュー</li>
            <li>
              AI 花判定にアップロードされた画像（AI 機能の処理にのみ利用し、サーバには保存しません）
            </li>
            <li>アクセスログ、IP アドレス、ユーザーエージェント、Cookie</li>
            <li>匿名利用回数を制御するためにブラウザ上で保持する識別子（UUID 等）</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold">第 2 条（利用目的）</h2>
          <p className="mt-3">取得した情報は以下の目的で利用します。</p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>認証およびアカウント管理</li>
            <li>AI 機能の提供および利用回数のレート制限</li>
            <li>本サービスの提供・運営・改善・新機能の検討</li>
            <li>不正利用・スクレイピング等の検知と防止</li>
            <li>利用者からのお問い合わせへの対応</li>
            <li>法令に基づく対応</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold">第 3 条（第三者提供・業務委託）</h2>
          <p className="mt-3">
            本サービスは、運営にあたり以下の事業者を業務委託先として利用します。これらの事業者には必要最小限の情報のみが渡ります。
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>Supabase（米国／データベース・認証・ストレージ）</li>
            <li>Vercel（米国／アプリケーションホスティング）</li>
            <li>Google LLC（米国／Google 認証、Google Maps Platform、Gemini API）</li>
          </ul>
          <p className="mt-3">
            法令に基づく開示請求があった場合、運営者は最小限の範囲で情報を提供することがあります。
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold">第 4 条（Cookie の利用）</h2>
          <p className="mt-3">
            本サービスは、ログインセッションの維持・利用状況の把握・サービス改善のために Cookie
            を使用します。ブラウザの設定で Cookie
            を無効化できますが、その場合は一部機能をご利用いただけないことがあります。
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold">
            第 5 条（AI 花判定における画像の取り扱い）
          </h2>
          <p className="mt-3">
            AI 花判定にアップロードされた画像は、Gemini API
            への送信時にのみ利用し、本サービスのストレージには保存しません。AI
            機能の利用ログ（呼び出し時刻、利用者識別子、結果のメタ情報）は、不正検知とコスト管理のために一定期間保管します。
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold">第 6 条（退会・データ削除請求）</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-6">
            <li>
              利用者は、マイページから自らのアカウントを退会することができます。退会時、プロフィール・ブックマーク・自身のレビュー等の情報は速やかに非表示化されます。
            </li>
            <li>
              退会後のデータ完全削除を希望する場合は、第 7
              条のお問い合わせ窓口までご連絡ください。法令上保管義務がある情報を除き、合理的な期間内に削除に応じます。
            </li>
          </ol>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold">第 7 条（お問い合わせ窓口）</h2>
          <p className="mt-3">
            個人情報の取り扱いに関するお問い合わせは、フッターの「お問い合わせ」リンクからご連絡ください。
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold">第 8 条（ポリシーの改定）</h2>
          <p className="mt-3">
            本ポリシーは、法令およびサービス内容の変更に応じて改定することがあります。重要な変更がある場合は、本サービス上で告知します。
          </p>
        </section>

        <section className="border-t border-line pt-8">
          <h2 className="font-serif text-xl font-bold">{COPY.staticPages.historyHeading}</h2>
          <ul className="mt-3 space-y-2 text-sm text-ink-muted">
            <li>2026-05-21 初版公開</li>
          </ul>
        </section>
      </article>
    </section>
  );
}
