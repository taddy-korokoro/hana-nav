# デザイン規約

このプロジェクトの UI 全画面共通の規約。**画面実装前に必ず本ファイルとトークン定義（`app/globals.css` の `@theme`）を確認**すること。

実装サンプルは **すべて `app/demo/` 配下**（本番ルートとは独立したサンドボックス）：

- `app/demo/page.tsx` (`/demo`) — トップページ系の全パターン（ヒーロー、ストーリーバー、エディトリアル、チップ群、人気スポット）
- `app/demo/spots/page.tsx` (`/demo/spots`) — 一覧ページの全パターン（ページタイトル、フィルター、件数、グリッド、空状態）

新しいサンプルを追加する場合も `app/demo/{name}/page.tsx` の形で配置し、`app/demo/_components/demo-nav.tsx` の `SAMPLES` に追加する。本番ルート（`/spots`, `/mypage` 等）は **チケット駆動の実装時に新規作成**し、デモ流用しない。

## 方向性

「**モダントラベル + 和の差し色**」。写真主役のレイアウト構造で、サンセリフ + 明朝体（Noto Serif JP）の硬軟ミックス。落ち着いた暖色系の `bg-surface` 背景に、くすみピンク（`brand`）を 1 点投入する。

参考プロダクト：星野リゾート Web、OnTrip JAL、ことりっぷ Web。

## デザイントークン

`app/globals.css` の `@theme` で定義。Tailwind ユーティリティから直接呼び出せる（例：`bg-brand`, `text-ink`, `font-serif`, `rounded-card`）。

### カラー

| トークン      | Hex       | 用途                                            |
| ------------- | --------- | ----------------------------------------------- |
| `surface`     | `#fafaf9` | ページ背景。暖色寄りオフホワイト                |
| `surface-2`   | `#f5f5f4` | フッター・サブブロック背景                      |
| `ink`         | `#1c1917` | 本文・主要テキスト                              |
| `ink-muted`   | `#78716c` | 補助テキスト（メタ情報、二行目）                |
| `ink-faint`   | `#a8a29e` | さらに薄い情報（タイムスタンプ等）              |
| `line`        | `#e7e5e4` | 境界線。**最小限。多用しない**                  |
| `line-strong` | `#d6d3d1` | hover 時の境界強調                              |
| `brand`       | `#c66487` | CTA、リンク強調、ブックマーク済み、eyebrow 文字 |
| `brand-hover` | `#b25578` | brand のホバー                                  |
| `brand-soft`  | `#f4e3eb` | brand 系の薄い背景（バッジ・選択状態の地）      |
| `spring`      | `#f4a8b8` | 春の花カテゴリ（桜・梅・つつじ）                |
| `summer`      | `#f5c84b` | 夏の花カテゴリ（向日葵・紫陽花）                |
| `autumn`      | `#b888c7` | 秋の花カテゴリ（コスモス・彼岸花）              |
| `winter`      | `#c44862` | 冬の花カテゴリ（梅・椿）                        |
| `danger`      | `#b91c1c` | 破壊的アクション・エラーメッセージ・必須マーク  |
| `danger-soft` | `#fde8e8` | エラーバナー背景                                |

成功（success）系の色は **brand を流用**する（`bg-brand-soft text-brand`）。確定したアクション後の通知やプロフィール保存完了などに使う。専用の緑系は追加しない（画面に色が散らかるのを避ける）。

### 角丸

| トークン          | 値            | 用途                                     |
| ----------------- | ------------- | ---------------------------------------- |
| `rounded-card`    | 1rem (16px)   | スポットカード、検索バー、ボタン、入力欄 |
| `rounded-card-lg` | 1.5rem (24px) | エディトリアル大カード（16:9 ヒーロー）  |
| `rounded-pill`    | 9999px        | チップ、丸ボタン、アバター               |

### フォント

| トークン     | 値            | 用途                                           |
| ------------ | ------------- | ---------------------------------------------- |
| `font-sans`  | Geist         | 本文・UI（デフォルト）                         |
| `font-serif` | Noto Serif JP | 見出し（h1〜h3）・スポット名・大カードのコピー |
| `font-mono`  | Geist Mono    | コード、桁を揃えたい数値（必要時のみ）         |

## やらないこと

UI 実装で **避ける**こと。インスタ寄せや派手系に流れがちな箇所を抑制する。

- ❌ Tailwind の生のパレット（`bg-pink-300`, `text-rose-500`, `border-stone-200` 等）を **本番コードに直書きしない**。色はトークン経由のみ。
  - **例外**：花の写真がない時の **グラデーション・プレースホルダー**だけ Tailwind パレットを許可（季節感を出すため。`bg-gradient-to-br from-pink-300 to-rose-200` 等）
- ❌ ボーダーで領域を区切らない。**余白（`pt-16` / `gap-*`）でセクションを区切る**
- ❌ 派手なアニメーション（バウンス、回転、ネオン光、虹色グラデのリング）。`transition` + `hover:translate-x-1` 程度の上品なものに留める
- ❌ ハート赤（`#ed4956` 等）。**ブックマークは `text-brand` に統一**
- ❌ 仮想ストーリーリング（虹色グラデの円形）。横スクロール一覧は **長方形カード**で表現する
- ❌ Instagram の底タブ。モバイルナビは **ヘッダー + ハンバーガーメニュー** で構成する
- ❌ 純白（`#fff`）の大面積背景。`bg-surface` を使う
- ❌ ダークモード対応（v2 で検討。MVP では不要）
- ❌ 画像なしの巨大グレー矩形。**実装途中で写真がない場合は季節色のグラデーションで埋める**

## 画面パターン

### 1. ページシェル

```tsx
<div className="min-h-dvh bg-surface text-ink">
  <SiteHeader />
  <main className="mx-auto max-w-6xl px-6 pb-24">{/* sections */}</main>
  <SiteFooter />
</div>
```

- 横幅は `max-w-6xl`（1152px）に統一。**勝手に変えない**
- 横余白 `px-6`、下余白 `pb-24`（モバイル）／ `pb-8`（PC）が基準

### 2. セクションヘッダー

```tsx
<div className="flex items-end justify-between gap-4">
  <div>
    <p className="text-xs font-medium uppercase tracking-[0.25em] text-brand">
      {eyebrow} {/* 例: "May 2026", "Editorial", "Popular" */}
    </p>
    <h2 className="mt-1 font-serif text-2xl font-bold tracking-tight md:text-3xl">{title}</h2>
  </div>
  {linkLabel && (
    <Link
      href="..."
      className="flex items-center gap-1 text-sm font-medium text-ink hover:text-brand"
    >
      {linkLabel}
      <ArrowRightIcon className="size-4" />
    </Link>
  )}
</div>
```

- セクション見出しは **必ず明朝体（`font-serif`）+ 太字（`font-bold`）**
- eyebrow は英字・大文字・字間広く（`uppercase tracking-[0.25em]`）
- セクション間は `pt-16`（PC）／ `pt-12`（モバイル）

### 3. スポットカード（一覧）

```tsx
<Link href={`/spots/${id}`} className="group">
  <div className="relative aspect-[4/3] overflow-hidden rounded-card">
    <Image src={cover} alt={...} fill className="object-cover" />
    <div className="absolute right-3 top-3">
      <BookmarkButton />
    </div>
  </div>
  <div className="mt-3 flex items-baseline justify-between gap-3">
    <div className="min-w-0">
      <p className="truncate font-serif text-base font-semibold">{name}</p>
      <p className="truncate text-xs text-ink-muted">{prefecture} ・ {flower}</p>
      <p className="mt-0.5 text-xs text-ink-faint">{peak}</p>
    </div>
    <ArrowRightIcon className="size-4 shrink-0 text-ink-faint transition group-hover:translate-x-1 group-hover:text-ink" />
  </div>
</Link>
```

- 画像比率：一覧 `aspect-[4/3]`、横スクロール `h-56 w-44`、エディトリアル `aspect-[16/9]`
- 角丸：通常 `rounded-card`、エディトリアル `rounded-card-lg`
- ブックマークボタンは右上、白半透明背景の丸ボタン

### 4. ヒーロー

```tsx
<section className="pb-10 pt-12 md:pb-16 md:pt-20">
  <p className="text-xs font-medium uppercase tracking-[0.25em] text-brand">{eyebrow}</p>
  <h1 className="mt-3 font-serif text-4xl font-bold leading-[1.25] tracking-tight md:text-6xl">
    {headline}
  </h1>
  <p className="mt-4 max-w-xl text-base leading-7 text-ink-muted">{lead}</p>
</section>
```

- 見出しは `text-4xl` → `md:text-6xl` のスケール
- リード文は `max-w-xl` で幅を制限（読みやすさ）

### 5. チップ

```tsx
<Link
  href="..."
  className="rounded-pill border border-line bg-white px-4 py-2 text-sm transition hover:border-ink hover:bg-ink hover:text-white"
>
  {label}
</Link>
```

- ホバーで黒地反転。**brand 色は使わない**（CTA と区別するため）
- 選択状態が必要な場合は `bg-brand-soft text-brand border-brand`

### 6. 検索バー（複合フィールド）

```tsx
<div className="flex flex-col gap-2 rounded-card border border-line bg-white p-2 shadow-sm sm:flex-row">
  {fields.map((f) => (
    <button className="flex flex-1 items-center gap-3 rounded-card px-4 py-3 text-left transition hover:bg-surface">
      <Icon className="size-5 text-ink-muted" />
      <span>
        <span className="block text-xs font-semibold text-ink-muted">{f.label}</span>
        <span className="block text-sm">{f.value ?? f.placeholder}</span>
      </span>
    </button>
  ))}
  <button className="rounded-card bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-hover">
    検索
  </button>
</div>
```

### 7. ページタイトル（一覧・詳細・マイページ等）

ヒーロー（パターン 4）はトップ専用。それ以外のページタイトルはこちらを使う。

```tsx
<section className="pb-6 pt-12 md:pt-16">
  <p className="text-xs font-medium uppercase tracking-[0.25em] text-brand">
    {eyebrow} {/* "Browse spots", "My page" 等 */}
  </p>
  <h1 className="mt-3 font-serif text-4xl font-bold leading-[1.25] tracking-tight md:text-5xl">
    {title}
  </h1>
  <p className="mt-3 max-w-xl text-sm leading-7 text-ink-muted">{description}</p>
</section>
```

- ヒーローより一段小さい（`md:text-6xl` → `md:text-5xl`）
- description は `text-sm`（ヒーローは `text-base`）でメリハリをつける

### 8. フィルター行（ラベル + チップ群）

複数のフィルター（エリア・時期・花など）を縦に積む。各行は横スクロール対応。

```tsx
<section className="space-y-5 pb-8">
  {filterGroups.map((g) => (
    <div key={g.label}>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">
        {g.label}
      </p>
      <div className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
        {g.options.map((opt) => (
          <Link
            key={opt.value}
            href={opt.href}
            className={
              opt.selected
                ? 'shrink-0 rounded-pill border border-brand bg-brand-soft px-4 py-2 text-sm font-medium text-brand'
                : 'shrink-0 rounded-pill border border-line bg-white px-4 py-2 text-sm transition hover:border-ink hover:bg-ink hover:text-white'
            }
          >
            {opt.label}
          </Link>
        ))}
      </div>
    </div>
  ))}
</section>
```

- ラベルは `text-ink-muted` の英字風（`uppercase tracking-[0.2em]`）。eyebrow より字間は狭め
- チップ自体はパターン 5 を踏襲、選択状態は `bg-brand-soft text-brand border-brand`
- フィルター状態は **URL `searchParams` に保持**（CLAUDE.md「9. URL 検索パラメータを状態として活用」）

### 9. 件数表示

検索結果数や総数を、本文より目立たせて見せる。

```tsx
<section className="flex items-baseline justify-between border-t border-line pt-6">
  <p className="text-sm text-ink-muted">
    <span className="font-serif text-2xl font-bold text-ink">{count}</span>
    <span className="ml-2">件 / 全 {total} 件</span>
  </p>
  {hasFilter && (
    <Link href={resetHref} className="text-xs font-medium text-ink-muted hover:text-ink">
      フィルターをクリア
    </Link>
  )}
</section>
```

- **数字だけ `font-serif` で大きく**（明朝の数字は太く存在感が出る）
- 単位「件」は `font-sans` のまま、`text-ink-muted` で抑える
- フィルター適用時のみ「フィルターをクリア」リンクを右に出す
- このパターン**だけ** `border-t border-line` で上線を許可（フィルターと結果の境界）

### 10. 空状態（ゼロ件・未検索・404）

```tsx
<div className="mt-8 rounded-card border border-line bg-white p-10 text-center">
  <p className="font-serif text-lg font-bold">
    {title} {/* "該当するスポットがありません" */}
  </p>
  <p className="mt-2 text-sm text-ink-muted">{description}</p>
  <Link
    href={recoveryHref}
    className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-hover"
  >
    {recoveryLabel}
    <ArrowRightIcon className="size-4" />
  </Link>
</div>
```

- カード型（`rounded-card border border-line bg-white`）で囲み、中央寄せ
- 必ず **復帰アクション**（フィルタークリア・トップへ戻る等）を 1 つ提示する
- イラスト・絵文字は使わない（明朝のタイトルだけで上品にまとめる）

## 文字組み

- 見出し（h1〜h3）：`font-serif font-bold tracking-tight`
- 本文：デフォルト（`font-sans`）、`leading-7` 推奨
- 補助テキスト：`text-xs text-ink-muted`
- さらに薄い情報：`text-xs text-ink-faint`
- 英字 eyebrow：`uppercase tracking-[0.25em] text-brand`
- 日本語の詰め組みは `body` で `font-feature-settings: "palt"` を一括適用（`globals.css`）

## 色の使い分け

- **`brand`**：CTA・eyebrow・ブックマーク済み・選択状態。**1 画面で多用しない**（ピンクが氾濫すると軽くなる）
- **季節色（`spring`/`summer`/`autumn`/`winter`）**：花カテゴリ・タグ・季節フィルタの選択状態のみ
- **`ink-muted`**：メタ情報。**本文には使わない**（読みづらい）
- **`ink-faint`**：日付・ピーク時期・補助の補助
- **`line`**：検索バー・チップ・入力欄のみ。**カードは原則ボーダーなし**

## インタラクション状態

ボタン・リンク・入力欄・カードなどのインタラクティブ要素に必ず付ける状態。**個別コンポーネントで自前実装せず、共通コンポーネント（`<Button>` / `<Spinner>` 等）が責任を持つ**。

### フォーカス（focus-visible）

- **ボタン・リンク・summary** など押下系の要素に **`focus-visible:ring-2 ring-brand/40 ring-offset-2`** を効かせる
- ベースは `app/globals.css` の `:where(a, button, ...):focus-visible` で一括適用
- **input / textarea / select はピンクリングの対象外**。フォーム要素は `focus:border-brand` 等の控えめな枠色変化で対応する（フォーム外周に pink リングが出ると視覚的に強すぎるため）
- マウスクリック時にリングを出さないため `focus-visible:` のみを使う（`focus:` 単体は禁止）

### ホバー

- リンク：`hover:text-brand`（文字色反転）
- ボタン（primary）：`hover:bg-brand-hover`
- ボタン（outline）：`hover:border-ink hover:bg-ink hover:text-white`（黒地反転）
- カード：`hover:border-line-strong` か、画像 zoom（`group-hover:scale-105`）

### 無効（disabled）

- `disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none`
- 共通 `<Button>` が一括で付与。個別の `<button>` には書かない

### 読み込み（loading）

- 共通 `<Button loading>` を使う：自動で `disabled` 化＋左に `<Spinner size="sm" />` を表示
- スピナー単体（フォーム外・ページ内処理など）は `<Spinner size="md" />` を使う
- 推定時間は表示しない（不正確で逆効果）。フェーズ名（「処理中…」「解析中…」等）の文言で代替する

### モーション抑制

- `prefers-reduced-motion: reduce` を持つユーザに対して `animate-spin` / `animate-pulse` を抑制する（`globals.css` のメディアクエリで一括）

## フォーム規約

### 必須マーク・任意マーク

- **必須マーク（`*`）は表示しない**。input は `required` 属性を持つが、ラベル側にビジュアルマークは置かない（プロダクトデザインの判断）。HTML の `required` 属性とブラウザのバリデーションで十分とする
- 任意項目：何も付けない。誤解を招きそうな場面に限り `<span className="ml-1 text-xs text-ink-faint">（任意）</span>` を付ける

### エラーメッセージ

- input の直下に配置（`<p id="{name}-error" role="alert" className="mt-1 text-xs text-danger">`）
- input には `aria-describedby="{name}-error"` を必ず紐付け
- ヘルプテキストがあれば `aria-describedby="{name}-error {name}-hint"` のようにスペース区切りで複数紐付け

### success / error バナー（フォーム全体）

- 共通 `<FormBanner variant="success|error">` を使う
- success：`bg-brand-soft text-brand border border-brand/20`
- error：`bg-danger-soft text-danger border border-danger/20`
- `role="alert"`（error）/ `role="status"`（success）を内部で付与

### ボタンの loading 状態

- Server Action フォーム：`useFormStatus().pending` を `<Button loading={pending}>` に渡す
- 通常 `onClick`：`useTransition` / `useState` の値をそのまま `loading` に渡す
- 二重送信は loading 中の `disabled` で構造的に防ぐ

## アイコン

- ライブラリ：**`lucide-react` に統一**（22b で確定）。自前 SVG は段階的に廃止。
- 基本：`strokeWidth={1.5}`、`stroke="currentColor"` の細線
- サイズ：`size-4`（本文内）／ `size-5`（フィールド内）／ `size-6`（ナビ）
- スピナーは `<Spinner>`（lucide `Loader2` ラッパ）を経由して使う。直接 `<Loader2 className="animate-spin" />` を書かない（サイズや色の規格化を共通化するため）

## コンポーネント階層

MVP / デモ期は **`app/demo/_components/` に全集約**。本番ルートが複数ルート間でパーツを共有する必要が出たタイミングで `@/components/` を新設して昇格させる。

| 配置                       | 現在の中身                                                              | 用途                                                |
| -------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------- |
| `app/demo/_components/`    | `site-header`, `site-footer`, `bookmark-button`, `icons`, `demo-nav` 等 | デモ・サンプル用パーツ。**現状ここに全部置く**      |
| `app/{route}/_components/` | （未作成）                                                              | 本番ルートでそのルート専用に閉じるパーツ            |
| `@/components/`            | （未作成）                                                              | 本番の **複数ルート間で共有**する必要が出てから新設 |

- **`_` プライベートフォルダは同階層 or 下位ルートからのみ参照可**。`/demo` 配下なら相対 import で OK（`./_components/...` / `../_components/...`）
- 本番ルート（`/spots`, `/mypage` 等）が **デモのコンポーネントを直接 import しない**。必要になったらその時点で `@/components/` に昇格させ、両者から参照する形に切り替える
- shadcn/ui を入れたら（チケット 01）プリミティブ層は shadcn 主体に置き換え、自前の `bookmark-button` 等プロジェクト固有のものだけ残す

## レスポンシブ

- モバイル基準（`min-h-dvh`、`px-6`）
- ブレークポイント：`sm:` (640px) 軽微、`md:` (768px) でナビ展開、`lg:` (1024px) でグリッド密度アップ
- グリッドのデフォルト：`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`

## ダークモード

非対応（v2 で検討）。`prefers-color-scheme: dark` を実装で参照しない。

## 拡張時のルール

1. 新しい色を追加したくなったら、**まず本ファイルと `globals.css` の `@theme` に追加**してからコードで使う
2. 新しい画面パターンを発明したら、**実装後に必ずこのファイルにパターンとして登録**する
3. パレットを増やすなら、**「やらないこと」リストも同時に更新**する
4. 仕様や雰囲気の方向転換は **設計を先に直してから実装**（CLAUDE.md「実装フロー」参照）
