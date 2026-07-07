# 06. 外部 I/F 設計

| 項目       | 値                                                                                                                                                                                       |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 参照 spec  | `docs/specs/ai-identify.md` / `docs/specs/supabase-auth.md` / `docs/specs/data-collector.md` / `docs/specs/tech-stack.md` / `docs/specs/operations.md` / `docs/22a_rakuten-affiliate.md` |
| 関連タスク | T04 API 一覧 / T05 ER 図                                                                                                                                                                 |

---

## 1. 対象外部 I/F 一覧

hana nav が接続する外部 API を用途別に列挙する。番号は本ドキュメント内の節番号と対応。

| #   | I/F 名                     | 用途                                    | 呼び出し元                                      | 課金 | MVP 必須  |
| --- | -------------------------- | --------------------------------------- | ----------------------------------------------- | ---- | --------- |
| 2   | Gemini API                 | 花判定（画像→種類推定）/ スクレイプ整形 | Route Handler / Python バッチ                   | 従量 | ✅        |
| 3   | Google Maps Geocoding API  | 住所→緯度経度変換                       | Python バッチ                                   | 従量 | ✅        |
| 4   | Google Maps JavaScript API | 地図・ピン描画                          | Client Component                                | 従量 | ✅        |
| 5   | Supabase Auth              | ログイン / OAuth / セッション管理       | Middleware / Route Handler / Server Action      | 無料 | ✅        |
| 6   | Supabase Storage           | 画像・アバターの保存と配信              | Server Action（管理者）/ Client（プロフィール） | 無料 | ✅        |
| 7   | 楽天ウェブサービス         | アフィリエイト検索（市場・トラベル）    | Server Component                                | 無料 | ✅  |

> Supabase PostgREST（DB 経由の CRUD）は `@supabase/ssr` 内部でラップされ、外部 I/F として意識するのは Auth と Storage の 2 面のみ。

---

## 2. Gemini API（花判定・データ整形）

### 2-1. 用途と呼び出し箇所

| 用途                   | 呼び出し元                                   | モデル             | 呼び出しタイミング                                       |
| ---------------------- | -------------------------------------------- | ------------------ | -------------------------------------------------------- |
| ユーザー撮影画像の判定 | `app/api/ai/identify-flower/route.ts` (POST) | `gemini-2.5-flash` | ユーザーが AI 花判定画面で画像を送信したとき             |
| スクレイプ結果の構造化 | `data_collector/scripts/02_normalize.py`     | `gemini-2.5-flash` | 週次バッチ（`01_scrape.py` の raw データを整形するとき） |

キーはサーバー専用の `GEMINI_API_KEY`。**Client Component からは絶対に呼ばない**（`NEXT_PUBLIC_` プレフィックス禁止）。

### 2-2. リクエスト・レスポンス（花判定 API）

| 項目           | 値                                                                                                                                  |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| SDK            | `@google/generative-ai`                                                                                                             |
| 入力           | `inlineData` (Base64 画像, MIME 型) + テキストプロンプト                                                                            |
| 画像制約       | クライアント側で最大 1024px / JPEG 品質 0.8 / 2MB 以下にリサイズ済み                                                                |
| プロンプト形式 | **必ず JSON のみで返せ** と明示。マークダウン・自然文の混入を禁止する                                                               |
| 期待レスポンス | `{ flower_name, flower_variety, confidence, bloom_status, description, flower_language, fun_fact, best_viewing_months, is_flower }` |

JSON パース失敗時は `500 { error: 'AI response parse failed' }` を返す（ユーザーには「サーバーエラー」表示）。

### 2-3. 3 段階フォールバックマッチング

Gemini が返す `flower_name`（総称）→ `flower_variety`（品種）を、`flowers` / `flower_aliases` マスターに突き合わせる。

| 段階 | クエリ                                                      | マッチしたら                   |
| ---- | ----------------------------------------------------------- | ------------------------------ |
| 1    | `flowers.name = ai_result.flower_name`                      | そのままマスターヒット         |
| 2    | `flower_aliases.alias = ai_result.flower_name`              | エイリアス経由でマスターヒット |
| 3    | `flower_aliases.alias = ai_result.flower_variety`（品種名） | 品種名でエイリアスヒット       |

3 段階すべて外れた場合は「マスター未登録」扱い。AI の推定結果（`ai_result`）だけをユーザーに返し、関連スポットは表示しない。詳細ロジックは `docs/specs/ai-identify.md` §「実装」を参照。

### 2-4. レート制限・コスト

| 項目               | 内容                                                                                           |
| ------------------ | ---------------------------------------------------------------------------------------------- |
| ユーザー側制限     | 匿名 1 回/日、ログイン 3 回/日。`ai_usage_logs` テーブルで管理                                 |
| 匿名 ID            | `localStorage` の UUID（`anonymous_id`）                                                       |
| リワード解放       | 動画広告視聴で `reward_unlocked=true` のレコードを 1 件追加、上限が +5 回加算される            |
| 同一画像キャッシュ | クライアント側で SHA-256 ハッシュを計算し、24 時間以内の同一ハッシュはローカルキャッシュを返す |
| API コスト目安     | `gemini-2.5-flash` 従量課金。MAU 5,000 想定で ¥3,000〜10,000/月（`docs/specs/tech-stack.md`）  |
| 上限監視           | Google Cloud で月予算アラート ¥5,000 を必須設定（超過時にメール通知）                          |

上限到達時は `429 { error: 'rate_limit_exceeded', remaining: 0, showAdReward: true }` を返し、UI 側でリワード広告誘導を出す。

### 2-5. エラー処理

| 事象                        | 挙動                                                                                 |
| --------------------------- | ------------------------------------------------------------------------------------ |
| ネットワーク / タイムアウト | `500 サーバーエラー` を返し、UI は「もう一度お試しください」ボタン付きエラー表示     |
| JSON パース失敗             | `500 AI response parse failed`。同上                                                 |
| `is_flower=false`（花以外） | UI で「花として認識できませんでした」を表示。`ai_usage_logs` は記録しない方針で運用  |
| バーストによる 429          | 呼び出し前に必ず `checkRateLimit()` を通す設計のため、Gemini 側 429 は基本発生しない |
| キー失効・不正              | `500`。緊急時は §9 の手順で即無効化・再発行                                          |

---

## 3. Google Maps Geocoding API

### 3-1. 用途と呼び出し箇所

| 用途                | 呼び出し元                             | タイミング                           |
| ------------------- | -------------------------------------- | ------------------------------------ |
| 住所→緯度経度の変換 | `data_collector/scripts/03_geocode.py` | 週次バッチ（normalize 後の一括処理） |

Web ランタイムから直接叩かない。Python バッチ内でのみ使う。

### 3-2. リクエスト・レスポンス

| 項目         | 値                                                              |
| ------------ | --------------------------------------------------------------- |
| SDK          | `googlemaps` (Python)                                           |
| 入力         | `address` 文字列（`normalized_data.json` の `location` を使用） |
| リージョン   | `region="jp"` を必ず指定（同名地名の海外ヒットを避ける）        |
| レスポンス   | `results[0].geometry.location.{lat, lng}` を採用                |
| 呼び出し間隔 | `time.sleep(0.1)`（1 リクエスト間 100ms）                       |

得られた座標は `geocoded_data.json` に `latitude` / `longitude` として書き戻し、後続の `04_validate.py` で必須項目チェックに使う。

### 3-3. レート制限・コスト

| 項目           | 内容                                                                                    |
| -------------- | --------------------------------------------------------------------------------------- |
| 無料枠         | Google Maps Platform 共通の $200/月クレジット内で運用（他 API と共有）                  |
| バッチ規模     | MVP で 200〜500 件想定。1 件 $0.005 目安 = 数百円/月に収まる                            |
| リクエスト制限 | サービス自体は 50 QPS 程度まで許容だが、意図的に 10 QPS 以下に絞る（`time.sleep(0.1)`） |
| バジェット監視 | Google Cloud 月予算アラート ¥5,000（Gemini と共通）                                     |

### 3-4. エラー処理

| 事象                       | 挙動                                                                              |
| -------------------------- | --------------------------------------------------------------------------------- |
| 該当住所ヒットなし         | 該当 item は `latitude` / `longitude` が入らないまま次へ。`04_validate.py` で除外 |
| API 例外（タイムアウト等） | `print` でログ出力し、そのアイテムをスキップ。バッチ全体は継続                    |
| クォータ超過               | Google Cloud コンソールで検知。翌月クレジット復帰まで手動投入で代替               |

Web ユーザー体験には影響しない（バッチ側で解決してから公開する運用のため）。

---

## 4. Google Maps JavaScript API

### 4-1. 用途と呼び出し箇所

| 用途                     | 呼び出し元                             | タイミング                                       |
| ------------------------ | -------------------------------------- | ------------------------------------------------ |
| 検索結果のマップビュー   | `components/spots/SpotMapView.tsx`     | `/spots?view=map` を Client Component として描画 |
| スポット詳細ページの地図 | スポット詳細ページの地図コンポーネント | スポット詳細を開いたとき                         |

Client Component から `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` を使う。**HTTP リファラー制限を必ず設定**（`https://hananav.site/*` / `https://www.hananav.site/*` / `http://localhost:3000/*`）。

### 4-2. 認証

| 項目           | 内容                                                                  |
| -------------- | --------------------------------------------------------------------- |
| キー           | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`（Client に露出前提）                |
| リファラー制限 | Google Cloud Console で本番 URL / localhost のみ許可                  |
| 有効化 API     | Maps JavaScript API のみ。Geocoding API は Web ランタイムから呼ばない |

### 4-3. レート制限・コスト

| 項目         | 内容                                                                            |
| ------------ | ------------------------------------------------------------------------------- |
| 無料枠       | Google Maps Platform 共通 $200/月クレジット。Map Load 1 回 $0.007 目安          |
| MAU 想定     | 5,000 MAU で ¥0〜5,000/月（`docs/specs/tech-stack.md` の想定コスト表）          |
| 予算超過対策 | ¥5,000 アラート発火時に Mapbox 無料枠への切替検討（`docs/specs/operations.md`） |

### 4-4. エラー処理

| 事象                   | 挙動                                                                                            |
| ---------------------- | ----------------------------------------------------------------------------------------------- |
| スクリプト読み込み失敗 | 地図の代わりに「地図を読み込めませんでした」フォールバックを表示。リスト表示に切替導線を維持    |
| リファラー制限違反     | 地図ロード時に `RefererNotAllowedMapError`。開発時のドメイン変更を都度 Console 側で追加する運用 |
| キー流出時             | §9 のリファラー制限運用で被害を抑える。即時無効化は必須ではないが、疑わしければキー再発行       |

---

## 5. Supabase Auth（@supabase/ssr）

### 5-1. 用途と呼び出し箇所

`@supabase/ssr` を経由して、以下 3 面で認証を扱う。詳細ルールは `docs/specs/supabase-auth.md` を正とする。

| 面                      | 実装ファイル                         | 主なメソッド                              |
| ----------------------- | ------------------------------------ | ----------------------------------------- |
| Client Component        | `lib/supabase/client.ts`             | `createBrowserClient()`（イベント購読等） |
| Server Component / RH   | `lib/supabase/server.ts`             | `createServerClient()` + `getUser()`      |
| Middleware              | `lib/supabase/middleware.ts`         | `updateSession()` → `getUser()`           |
| OAuth コールバック      | `app/auth/callback/route.ts`         | `exchangeCodeForSession(code)`            |
| ログイン / サインアップ | `app/auth/{login,signup}/actions.ts` | `signInWithPassword` / `signUp`           |

### 5-2. Cookie 設計

| 項目            | 内容                                                                                    |
| --------------- | --------------------------------------------------------------------------------------- |
| Cookie 名       | `sb-<project-ref>-auth-token`（`@supabase/ssr` が管理）                                 |
| Cookie API 形式 | **必ず `getAll()` / `setAll(cookiesToSet)` ペア**。古い 3 メソッド形式は使わない        |
| セッション判定  | 保護ページ・middleware では必ず `getUser()` を使う。`getSession()` は改ざん検証されない |
| リクエスト間隔  | `createServerClient` はリクエスト毎に新規生成する（モジュールキャッシュ禁止）           |

middleware では `createServerClient` 直後に `getUser()` を呼び、**間に他の処理を書かない**（セッション喪失の原因）。`supabaseResponse` はそのまま return する。

### 5-3. OAuth コールバック

| 項目             | 値                                                                                                       |
| ---------------- | -------------------------------------------------------------------------------------------------------- |
| コールバック URL | `/auth/callback?code=...&next=...`                                                                       |
| 交換フロー       | `exchangeCodeForSession(code)` → 成功で `next` 先へ 302、失敗で `/auth/login?error=auth_callback_failed` |
| 対応プロバイダ   | Email + Google OAuth（`docs/specs/roadmap.md` Week 1）                                                   |

### 5-4. エラー処理

| 事象                         | 挙動                                                                                    |
| ---------------------------- | --------------------------------------------------------------------------------------- |
| ログイン失敗（資格情報誤り） | `redirect('/auth/login?error=invalid_credentials')`                                     |
| OAuth 交換失敗               | `redirect('/auth/login?error=auth_callback_failed')`                                    |
| セッション期限切れ           | middleware が `getUser()` で `null` を検出 → 保護パスは `/auth/login` へリダイレクト    |
| 管理者権限なし               | middleware が `profiles.role !== 'admin'` を検出 → `/` へリダイレクト                   |
| Cookie 破壊（setAll 失敗）   | Server Component 経由の書き込みは `try/catch` で握りつぶす。middleware 経由で復元される |

### 5-5. コスト・レート制限

Supabase Free プラン内で運用（無料）。認証イベント数はプランに応じた上限を Supabase Dashboard で監視。Pro 移行の閾値判断は Week 4 で確認する。

---

## 6. Supabase Storage

### 6-1. 用途と呼び出し箇所

| バケット  | 用途                               | 呼び出し元                                              | 権限                                                            |
| --------- | ---------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------- |
| `images`  | スポット / 花マスターの画像        | 管理画面の Server Action（`SUPABASE_SERVICE_ROLE_KEY`） | INSERT / UPDATE / DELETE は service role のみ、SELECT は public |
| `avatars` | ユーザープロフィールのアバター画像 | プロフィール編集ページ（Client Component）              | 自分のフォルダ配下のみ書込可（RLS）                             |

### 6-2. パス規約

| バケット  | パス                                                 |
| --------- | ---------------------------------------------------- |
| `images`  | `{owner_type}/{owner_id}/{display_order}-{slug}.jpg` |
| `avatars` | `{user_id}/avatar-{timestamp}.jpg`                   |

CDN 経由の公開 URL は `*.supabase.co/storage/v1/object/public/**`。`next.config.ts` の `images.remotePatterns` に許可済み。

### 6-3. 制限・コスト

| 項目               | 内容                                                                                          |
| ------------------ | --------------------------------------------------------------------------------------------- |
| Free 枠            | Storage 1GB（flower 30 種 × 2 枚 + spot 数百件 × 2 枚 で 200KB/枚換算なら数百 MB に収まる）   |
| ファイルサイズ制限 | クライアント側で 2MB 以下にリサイズしてからアップロード                                       |
| MIME 制限          | `avatars` は `image/jpeg` / `image/png` / `image/webp` のみ許可（RLS で強制）                 |
| キャッシュ         | `next.config.ts` の `images.minimumCacheTTL` を 30 日に設定。差し替えは新パスへ再アップロード |

### 6-4. エラー処理

| 事象                     | 挙動                                                                             |
| ------------------------ | -------------------------------------------------------------------------------- |
| RLS 違反（他人フォルダ） | Supabase 側で 403。UI は「アップロードできませんでした」で終わる                 |
| ファイルサイズ超過       | クライアント側リサイズで防ぐ。すり抜けた場合は Storage 側 413                    |
| 同一パス上書き警告       | 運用ルールで新パス採用（30 日キャッシュ問題）。誤って上書きしたら DB の URL 更新 |

---

## 7. 楽天ウェブサービス（アフィリエイト）

詳細は `docs/22a_rakuten-affiliate.md` を正とする。

### 7-1. 用途と呼び出し箇所

| API                      | 用途                           | 呼び出し元                                   | キャッシュ |
| ------------------------ | ------------------------------ | -------------------------------------------- | ---------- |
| 楽天市場商品検索 API     | 花の種類詳細で「育ててみる」枠 | `app/(site)/flowers/[id]/page.tsx`（Server） | 12h        |
| 楽天トラベル空室検索 API | スポット詳細で「近くの宿」枠   | `app/(site)/spots/[id]/page.tsx`（Server）   | 1h         |

**Server Component から `await` で直接呼ぶ**（Route Handler は作らない）。fetch オプションは `next: { revalidate, tags: ['rakuten:<domain>:<key>'] }` でドメイン別タグを切る。

### 7-2. API 別クエリ

| API              | クエリ組立                                                                                      |
| ---------------- | ----------------------------------------------------------------------------------------------- |
| 楽天市場商品     | `keyword=<花名> 種 OR 苗`、`genreId=<園芸>`、`hits=4`、`imageFlag=1`                            |
| 楽天トラベル空室 | `latitude=<spot.lat>&longitude=<spot.lng>&searchRadius=3`（km）、`hits=5`、`responseType=small` |

### 7-3. レート制限・コスト

| 項目           | 内容                                                                            |
| -------------- | ------------------------------------------------------------------------------- |
| API 料金       | 無料                                                                            |
| リクエスト制限 | Application ID 単位で 1 秒 1 リクエスト、1 日上限あり（10 万 req/日程度が目安） |
| キャッシュ戦略 | ドメイン別 `revalidate` で叩く。実行時に直接 `fetch` しない                     |
| キャッシュ TTL | 市場 12h / トラベル 1h                                                          |

### 7-4. エラー処理・法令対応

| 事象 / 対応          | 内容                                                                                          |
| -------------------- | --------------------------------------------------------------------------------------------- |
| API 失敗（429 含む） | `null` を返す。上位の Section コンポーネントが「表示しない」or テキストリンクへフォールバック |
| タイムアウト         | fetch ラッパで 5 秒。超過時は `null` フォールバック                                           |
| ステマ規制対応       | 全リンクに「広告」バッジ + `rel="sponsored noopener noreferrer" target="_blank"` を強制       |
| プライバシー         | `/privacy` に「楽天アフィリエイトプログラム参加」「Cookie が楽天に送信される」旨を追記        |

---

## 8. 環境変数一覧

| 変数名                            | 用途                      | プレフィックス | 露出面 | 補足                                                     |
| --------------------------------- | ------------------------- | -------------- | ------ | -------------------------------------------------------- |
| `GEMINI_API_KEY`                  | Gemini（花判定・整形）    | なし           | Server | Route Handler / Python バッチのみ                        |
| `NEXT_PUBLIC_SUPABASE_URL`        | Supabase プロジェクト URL | `NEXT_PUBLIC_` | Both   | クライアント露出前提                                     |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`   | Supabase 匿名キー         | `NEXT_PUBLIC_` | Both   | RLS で防御。露出前提                                     |
| `SUPABASE_SERVICE_ROLE_KEY`       | Supabase 管理キー         | なし           | Server | RLS バイパス。Route Handler / Server Action / バッチ限定 |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps JS API        | `NEXT_PUBLIC_` | Client | HTTP リファラー制限で保護                                |
| `GOOGLE_MAPS_API_KEY`（バッチ用） | Geocoding                 | なし           | Batch  | `data_collector/.env`。Web には設置しない                |
| `NEXT_PUBLIC_BASE_URL`            | サイトの絶対 URL          | `NEXT_PUBLIC_` | Both   | OGP / sitemap 用                                         |
| `RAKUTEN_APPLICATION_ID`  | 楽天ウェブサービス        | なし           | Server | 許可ドメインは本番 URL のみ                              |
| `RAKUTEN_ACCESS_KEY`      | 楽天ウェブサービス        | なし           | Server | 2026-05-14 移行で必須化                                  |
| `RAKUTEN_AFFILIATE_ID`    | 楽天アフィリエイト        | なし           | Server | サーバー専用                                             |

`NEXT_PUBLIC_` プレフィックスは **Client Component が参照する変数のみ** に付ける。サーバー秘密（Gemini / Supabase Service Role / Rakuten）に付けたら設計ミス。

---

## 9. 緊急時 API キー無効化サマリ

流出・コスト爆発検知時は **無効化を最優先**（原因調査より先に止める）。詳細手順は `docs/specs/operations.md` §「緊急時 API キー無効化手順」を参照。

| キー                              | 優先度 | 影響範囲                         | 無効化先                          |
| --------------------------------- | ------ | -------------------------------- | --------------------------------- |
| `GEMINI_API_KEY`                  | 最優先 | AI 判定停止（サイト本体は動く）  | Google AI Studio → Delete         |
| `SUPABASE_SERVICE_ROLE_KEY`       | 最優先 | DB 全権限流出                    | Supabase Dashboard → JWT 再生成   |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | 中     | 地図停止（検索・詳細は動く）     | Google Cloud Console → Delete Key |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`   | 中     | RLS で防御済み。JWT 再生成で対応 | 上記 Supabase 手順と同時          |

無効化後は Netlify Environment variables を更新し **Clear cache and deploy site** を実行する（既存ビルドは古い値で固まっているため単純 redeploy では反映されない）。

---

## 10. 呼び出し条件 / 失敗時挙動 / コスト・レート制限 一覧

完了条件で求められている 3 観点の対応関係を再掲する。

| API                        | 呼び出し条件                                  | 失敗時挙動                                   | コスト・レート制限                             |
| -------------------------- | --------------------------------------------- | -------------------------------------------- | ---------------------------------------------- |
| Gemini（花判定）           | 判定 UI から画像送信 & レート制限内           | 500 エラー → UI 再試行導線                   | 匿名 1/日・ログイン 3/日、¥3〜10k/月           |
| Gemini（整形）             | 週次バッチ `02_normalize.py`                  | 該当 item を除外して継続                     | バッチ規模 200〜500 件、Web と共通の予算枠     |
| Google Maps Geocoding      | 週次バッチ `03_geocode.py`                    | 該当 item に座標なし → validate で除外       | `time.sleep(0.1)` で 10 QPS、$200 無料枠内     |
| Google Maps JS             | 地図ビュー描画時                              | フォールバック文言 & リスト表示への切替導線  | $0.007/load、¥0〜5k/月                         |
| Supabase Auth              | ページ遷移 / ログイン / OAuth 折返し          | 未認証は `/auth/login`、権限不足は `/`       | Free プラン内で運用                            |
| Supabase Storage           | 画像 / アバターの登録・取得                   | RLS 違反は 403、サイズ超過は 413             | Free 1GB、2MB/枚に自制                         |
| 楽天ウェブサービス | 花詳細・スポット詳細ページの Server Component | `null` 返却 → 表示スキップ or テキストリンク | 無料、1 秒 1 req / 1 日上限、`revalidate` 経由 |

---

## 11. 参考

- `docs/specs/ai-identify.md` — Gemini API 実装コード・プロンプト・マッチング詳細
- `docs/specs/supabase-auth.md` — Cookie API・middleware・DO / DON'T
- `docs/specs/data-collector.md` — Python バッチ 5 スクリプトの詳細
- `docs/specs/tech-stack.md` — 環境変数・想定コスト・Storage バケット設計
- `docs/specs/operations.md` — 緊急時 API キー無効化手順・監視項目
- `docs/22a_rakuten-affiliate.md` — 楽天アフィリエイト実装チケット
- `docs/design-docs/04_api-list.md` — 内部 Route Handler / Server Action 一覧との対応
