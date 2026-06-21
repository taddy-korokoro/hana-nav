# 08. 花の種類一覧・詳細

## 概要

`/flowers` 全花種類の50音順一覧と、`/flowers/[id]` 個別ページ（特徴・花言葉・見頃時期・その花が見られるスポット）を実装する。

## 依存チケット

- [02](./02_database-schema.md), [04](./04_layout-navigation.md)

## 関連ファイル

- `app/flowers/page.tsx`
- `app/flowers/[id]/page.tsx`
- `app/flowers/[id]/not-found.tsx`
- `app/api/flowers/route.ts`
- `app/api/flowers/[id]/route.ts`
- `components/flowers/FlowerCard.tsx`
- `components/flowers/FlowerSeasonChart.tsx`

## 関連 DB

`flowers`, `flower_aliases`, `images`, `spots`, `spot_flowers`

## TODO

### 画像ホスティング方針の決定（早期にやる）

花マスターの代表画像（`images.owner_type='flower'`）の置き場所を決める。MVP 中は `flowers` 32 種すべてが揃っていなくても CLAUDE.md のグラデーションプレースホルダーで動くが、この方針だけは curate 作業に入る前（チケット 11／16）までに固める。

- [x] ホスティング方針を決める（以下から 1 つ選定して理由を `docs/specs/tech-stack.md` に追記）
  - Supabase Storage（バケット `flower-images` を作成、CDN 経由で配信）← **採用**
  - 外部 URL 直リンク（Wikimedia Commons 等、ライセンス確認の上で `images.url` に直書き）
  - ハイブリッド（一部は Storage、出典明示が必要なものだけ直リンク）
- [x] 選定方針に応じて Supabase Storage バケット作成 / `next.config.ts` の `images.remotePatterns` 候補を整理
- [x] 画像が無い場合のグラデーションプレースホルダーが想定通り出ることを確認（`FlowerCard` / `/flowers/[id]` 双方）

### `/flowers` 一覧

- [x] Server Component で全花を取得（`deleted_at IS NULL`）
- [x] 50音順ソート（`name_kana` を `flowers` に追加するか、`name` のかな順）
- [x] 50音インデックス（あ行 / か行 / …）
- [x] 花カード（カバー画像 + 名称 + 見頃月の帯）
- [x] `generateMetadata` で「花の種類一覧 | hana nav」

### `/flowers/[id]` 詳細

- [x] Server Component、`params: Promise<{id}>` を `await`
- [x] 未存在時は `notFound()`
- [x] `flowers` 本体 + `flower_aliases`（品種名一覧）
- [x] `images`（owner_type='flower'）でスライダー
- [x] その花が見られるスポット一覧（`spot_flowers` 経由、`is_published=true`）
- [x] 花言葉・特徴・豆知識（CMSではなく `description` カラム）
- [x] 見頃時期チャート（年間カレンダー帯）
- [x] `generateMetadata`（花名 + 見頃 + 関連スポット数）

### API

- [x] `GET /api/flowers`（一覧）
- [x] `GET /api/flowers/[id]`（詳細）

### 動作確認

- [x] 50音ジャンプが動作する
- [x] エイリアス（ソメイヨシノ等）でもページが見つけられる導線（任意：`/flowers?alias=...`）
- [x] 関連スポット 0 件の場合の空状態

## 完了基準

- [x] 一覧・詳細の両ページが動作する
- [x] その花が見られるスポット一覧が出る

## 参考

- [specs/pages.md](./specs/pages.md) — 公開ページ一覧
- [specs/database.md](./specs/database.md) — flowers / flower_aliases
- [specs/nextjs-conventions.md](./specs/nextjs-conventions.md) — generateMetadata / generateStaticParams
