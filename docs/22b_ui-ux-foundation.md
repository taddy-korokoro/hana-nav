# 22b. UI/UX 基盤改善（案 X：基盤フォーカス）

## 概要

ローンチ後の UX 底上げとして、サイト全体で再利用される **インタラクション基盤・ローディング/エラー表現・アクセシビリティ・デザイントークンの統一** を一気に整備する。個別ページの飾り付けではなく、**共通コンポーネントとデザインシステムの土台**を作ることで、以後のページ追加が一貫した手触りになる。

「案 Y（体感改善追加）」「案 Z（フル）」は本チケットの後の別チケットとして扱う。J 系の小粒（マップ遷移ボタン・共有ボタン等）も別チケット。

## 含む改善項目

監査結果から以下を採用する（カタログ番号は 2026-05-24 の壁打ち時の連番）：

| #   | 項目                                                                                           | カテゴリ             |
| --- | ---------------------------------------------------------------------------------------------- | -------------------- |
| A1  | 共通 `<Button>` の loading/disabled 統一                                                       | インタラクション基盤 |
| A2  | フォーム送信ボタンの loading/disabled をサイト全体で適用                                       | インタラクション展開 |
| A4  | しおり生成（Canvas）のプログレス表示改善                                                       | フィードバック       |
| A6  | API エラーを `error code` ベースで具体的メッセージに展開                                       | フィードバック       |
| B1  | skeleton UI の粒度向上（実レイアウトに沿わせる）                                               | ローディング         |
| B2  | 欠けている error.tsx の追加（`mypage/page.tsx`, `mypage/profile/`）                            | エラー境界           |
| C1  | パンくず共通化＋未配置ページ（spots/[id], flowers, flowers/[id], identify, mypage/\*）への追加 | ナビゲーション       |
| D1  | `focus-visible:ring` を全インタラクティブ要素に徹底適用                                        | アクセシビリティ     |
| D2  | エラーメッセージと input の `aria-describedby` 紐付け                                          | アクセシビリティ     |
| E1  | 管理画面（images / flowers / spots 一覧）のモバイル対応                                        | レスポンシブ         |
| F1  | アイコンを lucide-react に統一（自前 SVG を置換）                                              | 視覚的一貫性         |
| F3  | `destructive` 等のトークンを `globals.css` の `@theme` に正式追加                              | 視覚的一貫性         |
| H1  | label の必須マーク（`*`）と「（任意）」テキストの規約化                                        | フォーム             |
| H3  | success/error メッセージのスタイル統一（`brand-soft` vs `destructive`）                        | フォーム             |
| H4  | disabled 時の `cursor-not-allowed` 統一（A1 で同時解決）                                       | フォーム             |
| I1  | スピナー共通化（lucide `Loader2` を共通スピナーとして規定）                                    | デザイン細部         |

含まないもの（別チケット候補）：

- A3 AI 判定中のフェーズ表示プログレス
- B3 検索結果ゼロ時のリカバリ CTA
- F2 ホバー状態のリッチアニメーション
- G 系 パフォーマンス体感（画像 placeholder blur 等）
- I2 ページ遷移 fade-in
- J 系 「あるとよい」機能（マップで開く・共有ボタン・最近見たスポット 等）
- ダークモード対応（v2）

## 依存チケット

- [04](./04_layout-navigation.md) — 共通レイアウトに手を入れる
- [05](./05_top-page.md) 〜 [20](./20_static-pages.md) — 既存ページ全体に影響

## 関連ファイル

### 新規

- `components/ui/Spinner.tsx` — 共通スピナー（lucide `Loader2` ラッパ、size variant）
- `components/ui/Breadcrumb.tsx` — パンくず共通コンポーネント
- `components/ui/FormFieldLabel.tsx`（必要なら）— 必須/任意マーク統一

### 大幅変更

- `components/ui/button.tsx` — `loading` prop 追加、`brand` variant 追加、design.md トークンへ寄せる
- `app/globals.css` — `destructive` 系トークンを `@theme` に昇格、`focus-visible` の base スタイル定義
- `docs/specs/design.md` — 「インタラクション状態」「フォーム規約」「アイコン」セクションを追加・改訂
- `app/demo/page.tsx` — Button の loading 状態 / Breadcrumb / Spinner / Form の必須マーク等のショーケース追加

### 影響範囲（リネーム・置換）

- `components/identify/IdentifyUploader.tsx` — 共通 Button へ置換、aria-describedby 追加
- `components/reviews/ReviewForm.tsx` — 同上
- `components/bookmarks/BookmarkButton.tsx` — 同上
- `components/mypage/ProfileForm.tsx` — 同上
- `app/auth/_components/form-fields.tsx` / `app/auth/login/page.tsx` / `app/auth/signup/page.tsx` — 同上
- `app/admin/**/*.tsx` — 同上 ＋ レスポンシブ修正
- `components/layout/icons.tsx` — lucide-react に置換 or 廃止
- 各 `app/(site)/**/loading.tsx` — skeleton 粒度向上
- `app/(site)/mypage/profile/error.tsx`（新規）/ `app/(site)/mypage/error.tsx`（新規）

## 設計方針

### A1 / I1 共通 Button・Spinner

- 既存 `components/ui/button.tsx` は shadcn 由来で `bg-primary`/`text-primary-foreground` 等の shadcn トークン依存。これを **design.md のトークン（`bg-brand` / `text-ink` / `rounded-pill` / `rounded-card`）に寄せる**
- 既存の `variant` を維持しつつ「`brand`」を default に変更（破壊的変更）。`destructive` は F3 で `@theme` に追加した後に整合
- 追加 prop：
  - `loading?: boolean` — true の時：disabled 化＋左に `<Spinner size="sm" />` を自動挿入
  - `loadingText?: string` — 任意。指定時は children を置換、未指定なら children のまま
- `<Spinner>` は `lucide-react` の `Loader2` を `animate-spin` でラップした薄い軽量コンポーネント。size: `sm` / `md` / `lg`

### A2 / H4 フォーム送信ボタンへの展開

- Server Action フォーム：`useFormStatus().pending` を読み、`<Button loading={pending}>` で渡す
- 通常 `onClick`：既存の `useTransition` / `useState` の値をそのまま `loading` に渡す
- `<Button disabled={...}>` は `loading` と OR で適用される
- 一気に grep して全置換せず、**ファイル単位で順次置換**（差分が肥大しないように）

### A4 しおり生成プログレス

- 現状 `<Spinner>` だけ。Canvas 処理を段階分割して `useState<Phase>` でフェーズ名を表示する
  - `'preparing'`（テキスト整形）→ `'rendering'`（Canvas 描画）→ `'encoding'`（PNG 化）→ `'done'`
- 残り時間は表示しない（不正確で逆効果）

### A6 エラー文言の具体化

- Route Handler のエラーレスポンスを `{ error: string, code: string }` 形式に統一済みであれば、クライアント側で `code` ベースの辞書引きに切り替える
- `lib/constants/copy.ts` の `errors` セクションに `code → message` の辞書を集約
- `IdentifyUploader` の `ERROR_KEY_BY_API` を `lib/constants/copy.ts` 側に移動して汎用化

### B1 Skeleton 粒度

- 現状の `animate-pulse` 矩形を実カードの幅・行数に合わせる
- 共通の `<SkeletonCard variant="spot" />` / `<SkeletonCard variant="flower" />` 等は **作らない**（過剰抽象化）。各 `loading.tsx` 内に inline で書くが、本物の Card コンポーネントの structure と DOM 構造を合わせる

### B2 不在の error.tsx 追加

- `app/(site)/mypage/error.tsx` — マイページ全体のエラー境界
- `app/(site)/mypage/profile/error.tsx` — プロフィール編集のエラー境界
- 既存の `bookmarks/error.tsx` / `reviews/error.tsx` のパターンを踏襲

### C1 パンくず

- `<Breadcrumb items={[{label, href}, ...]}>` の汎用コンポーネント
- 構造は既存 `components/areas/AreaBreadcrumb.tsx` を基底にして汎用化（既存 areas は新コンポーネントに置換）
- aria-label / `aria-current="page"` を引き継ぐ
- 配置先：
  - `/spots/[id]` — トップ > スポット > {スポット名}
  - `/flowers` — トップ > 花の種類
  - `/flowers/[id]` — トップ > 花の種類 > {花名}
  - `/identify` — トップ > AI 花判定
  - `/identify/result` — トップ > AI 花判定 > 判定結果
  - `/mypage` — トップ > マイページ
  - `/mypage/bookmarks` — トップ > マイページ > ブックマーク
  - `/mypage/reviews` — トップ > マイページ > レビュー
  - `/mypage/profile` — トップ > マイページ > プロフィール

### D1 focus-visible 徹底

- `app/globals.css` のベーススタイルで `*:focus-visible { @apply outline-none ring-2 ring-brand/40 ring-offset-2; }` を入れて全要素に default を効かせる
- 個別コンポーネント側の focus スタイルは不要なものを整理（`<Button>` の focus は base で吸収）

### D2 aria-describedby

- フォーム input にエラー / ヘルプテキストが付いている場合、`<input aria-describedby="<id>-error <id>-hint">` 形式で紐付け
- `<FormField>` 系コンポーネントがあれば内部で自動付与
- IDなしで `<p role="alert">` だけ書いている箇所を全て紐付ける

### E1 管理画面レスポンシブ

- `app/admin/images/page.tsx` のテーブル → モバイル時はカード型レイアウトに切り替え
- 一覧系：`<table>` を維持しつつ `overflow-x-auto` で横スクロール可、もしくは `md:` 以下でカード化
- フィルター行：`flex-wrap` で改行

### F1 アイコン統一

- `components/layout/icons.tsx` の自前 SVG を lucide-react に置き換え
- 同等品がない場合のみ自前 SVG を残し、`components/layout/icons.tsx` 内で integration する形に
- 全 import を grep して洗い出す

### F3 destructive トークン

- 現状 `bg-destructive` / `border-destructive` / `text-destructive` が shadcn 由来で `globals.css` の `:root` に CSS 変数として定義されているが、`@theme` 側に集約して `bg-danger-soft` / `bg-danger` / `text-danger` 等の命名で再定義
- 破壊変更になるので grep で全置換
- `docs/specs/design.md` のカラートークン表に追加

### H1 必須マーク規約

- label に `<span className="text-danger ml-1" aria-hidden>*</span>` を必須項目に付与
- 任意項目は何も付けないか、`<span className="text-ink-faint text-xs">（任意）</span>`
- `docs/specs/design.md` 「フォーム規約」セクションに明文化

### H3 success/error スタイル統一

- success：`bg-brand-soft text-brand border border-brand/20`
- error：`bg-danger-soft text-danger border border-danger/20`
- 両者を `<FormBanner variant="success|error">` のような汎用コンポーネントに集約

## TODO

### 設計・規約

- [x] `docs/specs/design.md` に「インタラクション状態」「フォーム規約」「アイコン規約」セクション追加
- [x] `app/globals.css` の `@theme` に `destructive`/`danger` トークン昇格＋ `focus-visible` ベース定義
- [x] `app/demo/ui/page.tsx` 新設に新コンポーネントのショーケースを集約（既存 `/demo` トップは温存）

### 共通コンポーネント

- [x] `components/ui/spinner.tsx` 新設（lucide Loader2 ラッパ）
- [x] `components/ui/button.tsx` 拡張：`loading` / `loadingText` prop、`brand` variant、design.md トークン化
- [x] `components/ui/breadcrumb.tsx` 新設（既存 `areas/AreaBreadcrumb.tsx` を廃止・置換）
- [x] `components/ui/form-banner.tsx` 新設（success / error / info 共通）

### 共通ユーティリティ

- [x] `lib/constants/copy.ts` の `errors` 系は既存 `identify.error` 構造をそのまま流用（広範な再設計は未着手項目に残す。後追いの 22b' チケットで対応可）
- [x] `IdentifyUploader` の `ERROR_KEY_BY_API` はローカル維持（影響軽微なため）

### 既存ボタン置換（ファイル単位で順次）

- [x] `components/identify/IdentifyUploader.tsx`
- [x] `components/identify/StoryCardGenerator.tsx`（A4 のフェーズ表示は spinner サイズ拡大で代替、本格的なフェーズ表示は未対応）
- [x] `components/reviews/ReviewForm.tsx`
- [x] `components/bookmarks/BookmarkButton.tsx`
- [x] `components/mypage/ProfileForm.tsx`
- [x] `app/auth/_components/form-fields.tsx` 系（パスワード表示トグルも合わせて実装）
- [ ] 管理画面の主要フォーム（SpotEditor / FlowerEditor / 等） — 内部利用のためスコープから外し、別チケットで段階対応

### パンくず

- [x] `components/ui/breadcrumb.tsx` 実装
- [x] `components/areas/AreaBreadcrumb.tsx` を新コンポーネントに置換して廃止
- [x] 主要ルートにパンくず配置（spots / spots/[id] / flowers / flowers/[id] / identify / identify/result / identify/story / areas/[prefecture_id] / mypage / mypage/bookmarks / mypage/reviews / mypage/profile / terms / privacy）
- [x] ラベルを `COPY.nav.labels` に集約してヘッダー表記と統一

### アクセシビリティ

- [x] `app/globals.css` の `:focus-visible` ベーススタイル追加（input/select/textarea は除外、`box-shadow:none` で明示抑制）
- [x] 主要フォーム input に `aria-describedby` 紐付け（ReviewForm / ProfileForm / FormField）
- [ ] star rating のキーボード操作対応（既存実装の `aria-pressed`/`role=radiogroup` で最低限担保。矢印キー操作は未対応）

### ローディング・エラー

- [ ] 各 `loading.tsx` の skeleton 粒度向上（現状の `animate-pulse` で機能要件は満たすため別チケットに先送り）
- [x] `app/(site)/mypage/error.tsx` 新規
- [x] `app/(site)/mypage/profile/error.tsx` 新規

### レスポンシブ

- [ ] `app/admin/images/page.tsx` のモバイル対応（管理画面は内部利用のためスコープから外し、別チケットで段階対応）
- [ ] 他の admin 一覧（spots / flowers / users / reviews / ai-usage）の横スクロール検証
- [x] `IdentifyUploader` のカメラ/ギャラリー選択をモバイルで縦並びに

### アイコン統一

- [x] 新規コンポーネント（Spinner / Button / 検索フィールド / IdentifyUploader 等）は lucide-react に統一
- [ ] `components/layout/icons.tsx` 全体の lucide 置換は機械的だが影響範囲が大きいため別チケットで対応

### 検証

- [x] `npm run build` / `npm run lint` がエラーなく通る
- [x] 既存の Server Action / `useTransition` 系フォームの送信が壊れていない（手動確認済み）
- [x] Playwright で `/`, `/spots`, `/identify`, `/demo/ui`, `/flowers` の主要画面を目視確認
- [ ] スクリーンリーダー（VoiceOver）でエラーメッセージが読み上げられること（実機検証は別途）
- [ ] モバイル（iPhone 14 想定）で管理画面が破綻なく見られる（管理画面のレスポンシブを別チケットに先送りしたため）
- [ ] ライトハウス Accessibility スコアが現状以上であること（目安：90+）（ローンチ前にチケット 22 と合わせて計測）

## 22b 実装中に追加で実施した改善（チケット作成時の想定外）

- ヘッダー背景色を `bg-brand-soft` に変更（コンセプト「和の差し色」を反映）
- ヘッダーから検索フォームを撤去、ロゴ左 / ナビ右の配置に整理
- フッターのロゴ画像削除
- マイページの「一般ユーザー」表記削除 / メニュー重複整理 / 退会項目を danger 枠で強調
- 花詳細ページの画像サイズ縮小（max-w-md + aspect-[4/3]）で粗画質を回避
- トップ地図に `restriction` を設定して日本国内（北海道〜沖縄）に固定
- トップ地図コンテナを縦に拡大（モバイル h-[640px] / PC h-[836px]）
- ローディング文言の「…」を全削除（スピナー側で状態表現するため不要）
- 全ページ max-w-6xl に統一（トップ画面と他ページの左揃え位置を一致）
- 主要キャッチコピーの調整（タイトル / 検索フォーム CTA / アクティブフィルタ等）
- スポット検索画面の検索フォーム刷新：大型キーワード検索バー、`<SearchableSelect>` による検索可能ドロップダウン（都道府県・花）、アクティブフィルタを ×削除可能チップで集約、フィルタは初期表示
- 花の種類画面に専用検索フォーム追加（名前・ふりがな部分一致）
- パスワード入力に表示/非表示トグル（lucide Eye/EyeOff）
- 必須マーク `*` を全フォームから非表示（ブラウザの required 属性に委ねる）
- フォーム枠のフォーカス時のピンクリングを完全に抑制
- AI花判定のアップロードアイコンを絵文字から lucide Camera/ImageIcon に置換

## 完了基準

- [x] 共通 `<Button>` `<Spinner>` `<Breadcrumb>` `<FormBanner>` が `app/demo/ui/page.tsx` に揃って表示される
- [x] サイト内の主要フォーム送信ボタンが loading 中に「スピナー＋disabled」になる
- [x] パンくずが対象ルートで表示される
- [x] ボタン・リンク等の押下系インタラクティブ要素に `focus-visible` リングが効く（input/select/textarea は意図的に除外）
- [ ] `app/admin/images` がモバイルで破綻しない（管理画面レスポンシブは別チケット）
- [x] `docs/specs/design.md` が更新され、追加した規約がコードと一致している

## 参考

- [specs/design.md](./specs/design.md) — 本チケットで大幅更新
- [pages.md](./specs/pages.md) — パンくずを置く対象ルートの一覧
- [specs/nextjs-conventions.md](./specs/nextjs-conventions.md) — Client 境界の押し下げ / Link・Image 規約
- 監査結果（2026-05-24 壁打ち時の Explore 結果） — チケット作成時の根拠
