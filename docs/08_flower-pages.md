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

### `/flowers` 一覧

- [ ] Server Component で全花を取得（`deleted_at IS NULL`）
- [ ] 50音順ソート（`name_kana` を `flowers` に追加するか、`name` のかな順）
- [ ] 50音インデックス（あ行 / か行 / …）
- [ ] 花カード（カバー画像 + 名称 + 見頃月の帯）
- [ ] `generateMetadata` で「花の種類一覧 | hana nav」

### `/flowers/[id]` 詳細

- [ ] Server Component、`params: Promise<{id}>` を `await`
- [ ] 未存在時は `notFound()`
- [ ] `flowers` 本体 + `flower_aliases`（品種名一覧）
- [ ] `images`（owner_type='flower'）でスライダー
- [ ] その花が見られるスポット一覧（`spot_flowers` 経由、`is_published=true`）
- [ ] 花言葉・特徴・豆知識（CMSではなく `description` カラム）
- [ ] 見頃時期チャート（年間カレンダー帯）
- [ ] `generateMetadata`（花名 + 見頃 + 関連スポット数）

### API

- [ ] `GET /api/flowers`（一覧）
- [ ] `GET /api/flowers/[id]`（詳細）

### 動作確認

- [ ] 50音ジャンプが動作する
- [ ] エイリアス（ソメイヨシノ等）でもページが見つけられる導線（任意：`/flowers?alias=...`）
- [ ] 関連スポット 0 件の場合の空状態

## 完了基準

- [ ] 一覧・詳細の両ページが動作する
- [ ] その花が見られるスポット一覧が出る

## 参考

- CLAUDE.md「4.2 公開ページ一覧」
- CLAUDE.md「8.3 flowers / flower_aliases」
