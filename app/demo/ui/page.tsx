import { ArrowRight, Bookmark, Search } from 'lucide-react';

import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { FormBanner } from '@/components/ui/form-banner';
import { Spinner } from '@/components/ui/spinner';

import { DemoNav } from '../_components/demo-nav';
import { SiteFooter } from '../_components/site-footer';
import { SiteHeader } from '../_components/site-header';

export const metadata = {
  title: 'UI 基盤 — Hana Nav Demo',
};

export default function UiDemoPage() {
  return (
    <div className="min-h-dvh bg-surface text-ink">
      <SiteHeader />
      <DemoNav current="/demo/ui" />
      <main className="mx-auto max-w-6xl space-y-16 px-6 pb-24 pt-12">
        <header className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-brand">
            22b · Foundation
          </p>
          <h1 className="font-serif text-4xl font-bold tracking-tight md:text-5xl">
            UI 基盤コンポーネント
          </h1>
          <p className="max-w-xl text-sm leading-7 text-ink-muted">
            共通 Button・Spinner・Breadcrumb・FormBanner のショーケース。design.md
            「インタラクション状態」「フォーム規約」「アイコン」セクションと突き合わせて確認する。
          </p>
        </header>

        <ShowcaseSection
          eyebrow="Button"
          title="共通ボタン（variant × size × loading）"
          description="既存の <Button /> を design.md トークンへ寄せて再構築。loading prop でスピナー＋disabled を一括制御。"
        >
          <div className="space-y-6">
            <Row label="variant">
              <Button>判定する</Button>
              <Button variant="outline">撮り直す</Button>
              <Button variant="ghost">キャンセル</Button>
              <Button variant="danger">削除する</Button>
              <Button variant="link">詳細を見る</Button>
            </Row>

            <Row label="size">
              <Button size="sm">SM</Button>
              <Button size="md">MD</Button>
              <Button size="lg">LG</Button>
              <Button size="icon" aria-label="検索">
                <Search />
              </Button>
              <Button size="icon-sm" variant="outline" aria-label="ブックマーク">
                <Bookmark />
              </Button>
            </Row>

            <Row label="loading">
              <Button loading>判定する</Button>
              <Button loading loadingText="判定中">
                判定する
              </Button>
              <Button variant="outline" loading>
                送信中
              </Button>
              <Button variant="danger" loading loadingText="削除中">
                削除する
              </Button>
            </Row>

            <Row label="disabled">
              <Button disabled>判定する</Button>
              <Button variant="outline" disabled>
                送信
              </Button>
            </Row>

            <Row label="asChild (Link)">
              <Button asChild>
                <a href="#">
                  しおりを作る
                  <ArrowRight />
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href="#">スポットを探す</a>
              </Button>
            </Row>
          </div>
        </ShowcaseSection>

        <ShowcaseSection
          eyebrow="Spinner"
          title="共通スピナー"
          description="lucide-react Loader2 ラッパ。Button 内では aria-hidden で装飾扱い、単体使用時は role=status でラベル付与。"
        >
          <Row label="size">
            <Spinner size="sm" />
            <Spinner size="md" />
            <Spinner size="lg" />
            <span className="inline-flex items-center gap-2 text-sm text-ink-muted">
              <Spinner size="sm" label={null} />
              読み込み中
            </span>
          </Row>
        </ShowcaseSection>

        <ShowcaseSection
          eyebrow="Breadcrumb"
          title="パンくず"
          description="最終要素は自動で aria-current=page。href 未指定でもテキストのみ表示可能。"
        >
          <div className="space-y-3">
            <Breadcrumb
              items={[
                { label: 'トップ', href: '/' },
                { label: 'スポット', href: '/spots' },
                { label: '国営ひたち海浜公園' },
              ]}
            />
            <Breadcrumb
              items={[
                { label: 'トップ', href: '/' },
                { label: 'マイページ', href: '/mypage' },
                { label: 'プロフィール' },
              ]}
            />
          </div>
        </ShowcaseSection>

        <ShowcaseSection
          eyebrow="FormBanner"
          title="フォームバナー（success / error / info）"
          description="フォーム上部に置く通知。success は brand 流用、error は新規 danger トークン。"
        >
          <div className="space-y-3">
            <FormBanner variant="success" title="プロフィールを更新しました">
              次回ログイン時から表示名が変わります。
            </FormBanner>
            <FormBanner variant="error" title="判定に失敗しました">
              しばらく時間を置いてから再度お試しください。
            </FormBanner>
            <FormBanner variant="info">
              画像はサーバーで AI 判定の処理にのみ利用し、保存しません。
            </FormBanner>
          </div>
        </ShowcaseSection>

        <ShowcaseSection
          eyebrow="Form"
          title="フォーム規約（必須マーク・エラーメッセージ）"
          description="必須は赤の * を label に付与。エラーは input 直下に role=alert で aria-describedby 紐付け。"
        >
          <form className="max-w-md space-y-4" noValidate>
            <div className="space-y-1">
              <label htmlFor="demo-required" className="text-sm font-medium text-ink">
                ユーザー名
              </label>
              <input
                id="demo-required"
                type="text"
                required
                aria-describedby="demo-required-error demo-required-hint"
                aria-invalid
                defaultValue=""
                className="w-full rounded-card border border-danger/40 bg-white px-3 py-2 text-sm outline-none focus:border-danger focus:ring-2 focus:ring-danger/20"
              />
              <p id="demo-required-error" role="alert" className="text-xs text-danger">
                ユーザー名は必須です。
              </p>
              <p id="demo-required-hint" className="text-xs text-ink-faint">
                3〜20 文字、半角英数字とアンダースコアのみ。
              </p>
            </div>

            <div className="space-y-1">
              <label htmlFor="demo-optional" className="text-sm font-medium text-ink">
                自己紹介
                <span className="ml-1 text-xs text-ink-faint">（任意）</span>
              </label>
              <textarea
                id="demo-optional"
                rows={3}
                className="w-full rounded-card border border-line bg-white px-3 py-2 text-sm outline-none focus:border-line-strong"
              />
            </div>

            <Button type="submit">保存する</Button>
          </form>
        </ShowcaseSection>
      </main>
      <SiteFooter />
    </div>
  );
}

function ShowcaseSection({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-ink-muted">{eyebrow}</p>
        <h2 className="font-serif text-2xl font-bold tracking-tight md:text-3xl">{title}</h2>
        {description && <p className="max-w-2xl text-sm leading-7 text-ink-muted">{description}</p>}
      </header>
      <div className="rounded-card-lg border border-line bg-white p-6">{children}</div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <span className="w-24 shrink-0 text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}
