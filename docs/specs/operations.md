# 運用・コスト・リスク・ローンチ

## オーバーツーリズム・私有地侵入対策

| 制約                     | 実装                                                                           |
| ------------------------ | ------------------------------------------------------------------------------ |
| 出典の明示を必須化       | `official_url` が NULL の場合は `source` 必須（validate スクリプトでチェック） |
| 公開前の人手レビュー     | `is_published=false` で投入 → 管理者が出典の信頼性を確認 → 公開                |
| 位置情報の意図的なボカし | ピンは公式駐車場/入口に統一（私有地の特定を防ぐ）                              |
| 「秘境」訴求の排除       | UI コピーで「誰も知らない」「穴場」を使わない                                  |
| 混雑度サインの表示       | 見頃ピーク警告 + 「平日推奨」明記                                              |
| マナー啓発               | スポット詳細ページに「ゴミを持ち帰ろう」「花は摘まない」を明記                 |

## cacheComponents タグ schema

公開ページの `'use cache'` ブロックは `cacheTag()` で下記タグを付ける。admin の Server Action は `updateTag()` で同じタグを叩き、編集直後に最新値が反映される（read-your-own-writes）。タグ定数は `lib/cacheTags.ts` で一元管理する。

| タグ                   | 付与箇所                                                              | 何が変わったら invalidate するか                                       |
| ---------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `flowers`              | `HomeContent` / `loadFlowerBundle` / `loadAreaBundle`                 | 花マスターの追加・編集・削除・別名追加（一覧・索引・関連花表示に波及） |
| `flower:<id>`          | `loadFlowerBundle`                                                    | 単一花の詳細・画像・別名・関連スポット                                 |
| `spots`                | `HomeContent` / `loadFlowerBundle`（関連スポット） / `loadAreaBundle` | スポットマスターの追加・公開切替・編集・削除                           |
| `spot:<id>`            | （将来 `/spots/[id]` を `'use cache'` 化したら付与）                  | 単一スポットの詳細・画像・関連花                                       |
| `prefectures`          | `loadAreaBundle`                                                      | 都道府県マスター（基本固定）                                           |
| `area:<prefecture_id>` | `loadAreaBundle`                                                      | 該当都道府県の集計（spots/flowers の編集で派生的に呼ばれる）           |

### Admin Action ごとの叩くタグ

| Action                                                                 | updateTag 対象                                                                 |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `createFlowerAction` / `updateFlowerAction` / `softDeleteFlowerAction` | `flowers`, `flower:<id>`                                                       |
| `createSpotAction` / `updateSpotAction`                                | `spots`, `spot:<id>`, `area:<prefecture_id>`                                   |
| `togglePublishedAction` / `softDeleteSpotAction`                       | `spots`, `spot:<id>`（影響都道府県の引き直しを避けるため area タグはスキップ） |
| `softDeleteImageAction`（spot owner）                                  | `spot:<owner_id>`, `spots`                                                     |
| `softDeleteImageAction`（flower owner）                                | `flower:<owner_id>`, `flowers`                                                 |

レビュー削除・ユーザー BAN は公開ページの `'use cache'` に影響を与えないため、`updateTag` は呼ばず `revalidatePath('/admin/...')` だけで完結する。

### `revalidateTag` ではなく `updateTag` を使う理由

Next.js 16 `cacheComponents` の `revalidateTag` は第 2 引数（profile）が必須で、かつ「次のリクエストで lazy 再検証」する。一方 `updateTag` は Server Action 専用で synchronous に該当タグのキャッシュを破棄するため、admin の編集直後にユーザーがページを開いた瞬間に新しいデータが返る。本プロジェクトでは admin 編集 → 即時反映の体験を優先するため `updateTag` を使う。

## コスト管理

| 対策                            | 詳細                                                                   |
| ------------------------------- | ---------------------------------------------------------------------- |
| **レート制限**                  | `ai_usage_logs` ベースの匿名/ログイン別カウント                        |
| **画像圧縮**                    | クライアントで max-width: 1024px、JPEG 品質 0.8 にリサイズしてから送信 |
| **同一画像キャッシュ**          | SHA-256 ハッシュをキーに 24 時間キャッシュして重複呼び出しをゼロ化     |
| **Google Cloud 月予算アラート** | ¥5,000 超でメール通知（必須）                                          |
| **Vercel Spend Management**     | 設定必須                                                               |
| **Supabase DB サイズ監視**      | 無料枠 500MB。画像は Storage ではなく外部 URL 参照で節約               |

## 技術的懸念点

### 高優先度

| 懸念                             | リスク                 | 対策                                                                                             |
| -------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------ |
| **Gemini API コスト爆発**        | バズって $1,000 超請求 | レート制限 + Google Cloud 月予算アラート (¥5,000) + Vercel Spend Management                      |
| **Supabase 無料枠（500MB）超過** | 突然のサービス停止     | DB は軽量データのみ。画像は Storage ではなく外部 URL 参照                                        |
| **images テーブル整合性**        | 孤立画像発生           | A: アプリ層の共通バリデータ + B: DB トリガーで親存在検証（2 層防御）+ 運用ルールで物理削除を禁止 |

### 中優先度

| 懸念                           | 対策                                                                                                                                                                                                                                               |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **AI の誤判定**                | `confidence` が低い場合は「自信なし」と明示。マスター未登録時は関連スポット非表示で運用                                                                                                                                                            |
| **レビューの誹謗中傷**         | NG ワードフィルタ（辞書ベース、`lib/ng-words.ts`）+ 管理者画面から手動論理削除                                                                                                                                                                     |
| **地図 API コスト**            | Google Maps 無料枠 ($200/月) 超過時は Mapbox 無料枠に移行検討                                                                                                                                                                                      |
| **モバイルでの Canvas 性能**   | 端末性能で重い場合は 1080→720px に落とす分岐                                                                                                                                                                                                       |
| **画像アップロードサイズ**     | クライアント側で 2MB 以下にリサイズ                                                                                                                                                                                                                |
| **画像差し替えの反映遅延**     | `next.config.ts` の `images.minimumCacheTTL` を 30 日に設定済み。Supabase Storage 上で**同一パス**の画像を上書きすると、Image CDN が最大 30 日間古いバリアントを返す。差し替え時は新パスにアップロードして DB の `images.url` を更新する運用にする |
| **論理削除のクエリ漏れ**       | 全クエリで `WHERE deleted_at IS NULL` を必須。Supabase のビューで「アクティブのみ」を別名公開する手も検討                                                                                                                                          |
| **退会ユーザーのレビュー扱い** | レビューは物理削除しない。`profiles.deleted_at IS NOT NULL` の場合に「退会済ユーザー」と表示                                                                                                                                                       |

## ローンチチェックリスト

### コスト・監視

- [ ] Google Cloud コンソールで月予算アラート設定（¥5,000 超でメール通知）
- [ ] Vercel Spend Management 設定
- [ ] Supabase Dashboard で DB サイズ監視を確認
- [ ] エラーログ収集設定（Vercel Logs / Sentry）
- [ ] 緊急時の API キー無効化手順をドキュメント化

### セキュリティ・権限

- [ ] 全テーブルで RLS が有効になっていることを確認
- [ ] `SUPABASE_SERVICE_ROLE_KEY` がクライアントサイドに漏れていないことを確認（`NEXT_PUBLIC_` プレフィックスなし）
- [ ] 管理者アカウント（`role='admin'`）を本番 DB に設定
- [ ] Middleware のマッチャーで保護パスが正しく設定されていることを確認

### SEO・公開設定

- [ ] Google Search Console にサイトマップ（`/sitemap.xml`）を送信
- [ ] OGP 画像（`/og-default.png`、1200×630px）を配置
- [ ] robots.txt で `/admin/`, `/api/`, `/auth/`, `/mypage/` がブロックされていることを確認
- [ ] HTTPS で配信されていることを確認（本番 URL は `https://hananav.site`。Vercel が自動発行する Let's Encrypt 証明書を使用）

### コンテンツ

- [ ] `is_published=true` のスポットが最低 100 件以上あること
- [ ] flowers マスターに 30 種類以上あること
- [ ] 利用規約・プライバシーポリシーページが公開されていること（特定商取引法表記は MVP では作成しない。理由はチケット [20](../20_static-pages.md)）
- [ ] スポット詳細ページにマナー啓発文言が表示されていること

## 緊急時 API キー無効化手順

コスト爆発・キー流出を検知したら **即座に無効化**。流出ルート特定より無効化を優先する（再発行は数分で可能）。

### Gemini API（最優先）

バズ検知時の最大リスク。AI 判定が停止するが、サービス全体は動く。

1. <https://aistudio.google.com/app/apikey> を開く
2. 該当 API キーの **Delete** をクリック → 即座に無効化
3. 新しいキーを発行（必要であれば）
4. Vercel Dashboard > Project Settings > Environment Variables で `GEMINI_API_KEY` を更新
5. Production を **Redeploy**（既存ビルドは古い値で固められているため）

### Google Maps API キー（`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`）

`NEXT_PUBLIC_` 付きで Client に露出している。流出時は地図表示が止まるが、検索・詳細は動く。

1. <https://console.cloud.google.com/apis/credentials> を開く
2. 該当キーを開いて **DELETE KEY**
3. 新キー発行 → HTTP リファラー制限を本番 URL に設定（`https://hananav.site/*` / `https://www.hananav.site/*` / `http://localhost:3000/*` のみ）
4. Vercel に新キーを登録 → Redeploy

リファラー制限を最初から設定していれば、流出してもリファラー以外からは使えないので即時無効化は不要。

### Supabase Service Role Key（`SUPABASE_SERVICE_ROLE_KEY`）

**最も危険**。RLS をバイパスする全権キー。流出時は DB 全データを読み書きされ得る。

1. <https://supabase.com/dashboard> > 該当プロジェクト > Project Settings > API
2. **Service Role Key** の **Reveal** で旧キーをコピー（バックアップ用）
3. プロジェクト直下の **JWT Secret** を **Regenerate JWT Secret**（service role key とともに anon key も再発行される）
4. Vercel Environment Variables の `NEXT_PUBLIC_SUPABASE_ANON_KEY` と `SUPABASE_SERVICE_ROLE_KEY` を新値に更新
5. Production を **Redeploy**
6. 既存ユーザーの JWT は失効するので、全員再ログインが必要（事前に告知できない場合は受け入れる）

JWT Secret 再生成のインパクトが大きいため、流出が確実な場合のみ実施。疑いの段階では Supabase Support に連絡して相談。

### Supabase Anon Key

`NEXT_PUBLIC_` 付きで Client に露出しているため流出は前提。**RLS が正しく書けていれば anon key 単体では破壊できない**。RLS の穴を発見した場合の対処は上記の JWT Secret 再生成と同じ手順。

### 連絡・記録

- [ ] 無効化したキー種別・タイミング・原因を Slack / メモに残す（再発防止用）
- [ ] ユーザー影響範囲を `app/(site)` の障害バナー等で告知（必要時）
