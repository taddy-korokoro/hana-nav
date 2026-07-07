# ADR-001. 論理削除方針

| 項目       | 値                                              |
| ---------- | ----------------------------------------------- |
| ステータス | Accepted（2026-05-09 マイグレーション適用済み） |
| 決定者     | プロジェクトリード                              |
| 関連 spec  | `docs/specs/database.md`                        |
| 関連タスク | T05 ER 図 / T07 詳細設計（スポット詳細画面）    |

---

## 1. 背景

hana-nav では複数のドメインで「削除」に相当する操作が発生する。

- 管理者によるスポット非公開化・花マスターの整理
- ユーザーによるブックマーク解除・自分のレビュー削除
- 匿名 / ログインユーザーの退会
- NG ワードフィルタや通報を経た管理者のレビュー強制削除

これらを **物理削除（`DELETE FROM ...`）で扱うと** 以下の問題が起きる。

| 問題                                     | 影響                                                                                               |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------- |
| レビューの物理削除でスポット詳細が壊れる | 過去に付いたレビュー数・平均点が突然変動。SEO 上「レビュー付き」と表示していたページの整合が崩れる |
| ユーザー退会でレビュー履歴が消える       | 他ユーザーが見ていたレビュー本文が突然消える。スポット選定情報が失われる                           |
| `images` の孤立レコードが検出困難        | 多態関連（`owner_type` + `owner_id`）で外部キー制約が張れず、親削除時に子が孤立する                |
| 誤操作・不正削除からの復旧が不可能       | 管理者が誤って削除したレコードを戻せない。バックアップ復元は他レコードにも影響                     |

さらに Supabase 無料枠（DB 500MB）を圧迫しないよう、大きなバイナリを DB に入れない設計を取っているため、論理削除でレコードが残っても行数増加が実運用の脅威にはならない。

---

## 2. 決定

**`prefectures` を除く全テーブルに `deleted_at TIMESTAMPTZ DEFAULT NULL` を持たせ、物理削除は原則行わない。**

具体的なルールを 4 点で規定する。

### 2-1. スキーマ規約

- 対象テーブル: `profiles` / `spots` / `flowers` / `flower_aliases` / `spot_flowers` / `images` / `bookmarks` / `reviews` / `ai_usage_logs` / `contact_messages`
- `prefectures` は固定マスタ（47 件）で削除ケースがないため対象外
- 有効データは常に `deleted_at IS NULL`。論理削除は `UPDATE ... SET deleted_at = NOW()` で行う

### 2-2. クエリ規約

- Supabase クライアントは `.is('deleted_at', null)` を **全 SELECT に必ず付与**（Server / Client 問わず）
- SQL 直書きの場合は `WHERE deleted_at IS NULL` を必ず含める
- Partial Index を活用: `CREATE INDEX ... WHERE deleted_at IS NULL` で削除済みレコードをインデックスから外し、有効データのアクセスコストを抑える

### 2-3. RLS 設計

**SELECT ポリシーに `deleted_at IS NULL` を入れない**。

論理削除は `UPDATE ... SET deleted_at = NOW()` で行うが、PostgREST は RETURNING で更新後の行を SELECT で取り戻そうとする。この時 SELECT ポリシーに `deleted_at IS NULL` が入っていると、更新直後の行（`deleted_at IS NOT NULL`）が条件を満たさず「new row violates row-level security policy」でエラーになる。

フィルタは常にアプリ層（`.is('deleted_at', null)`）で行うこと。

対象は本人が直接 UPDATE する 3 テーブル（`profiles` / `reviews` / `bookmarks`）。それ以外は Service Role で操作する前提のため、Service Role が RLS をバイパスすることを利用して SELECT ポリシー側の `deleted_at IS NULL` は残してよい。

### 2-4. カスケード論理削除トリガー

親の論理削除に子を追従させるため、DB トリガーで自動化する。手動で子を UPDATE するとアプリ実装ごとに漏れが出るため、DB 側に責務を寄せる。

対象:

| 親テーブル | 子テーブル            | トリガー関数                        |
| ---------- | --------------------- | ----------------------------------- |
| `spots`    | `images`（spot 用）   | `cascade_soft_delete_spot_images`   |
| `flowers`  | `images`（flower 用） | `cascade_soft_delete_flower_images` |

トリガーは `AFTER UPDATE ON <親>` で発火し、`NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL` を条件に対応する子行を `UPDATE images SET deleted_at = NOW()` する。復元（deleted_at を NULL に戻す）は自動追従しない（意図的な運用ケースが少ないため）。

### 2-5. 退会ユーザーのレビュー扱い

**退会後もレビューは物理削除せず、`profiles.deleted_at IS NOT NULL` の場合に username を「退会済ユーザー」として表示する。**

物理削除するとスポットの評価履歴が突然消えて他ユーザーの意思決定情報が失われる。名前だけ伏せて内容を残すことで、コミュニティ機能の一貫性を保ちつつ本人特定情報を消す。

---

## 3. 結果

### 3-1. 得られたもの

- **復旧容易性**: 誤削除は `UPDATE ... SET deleted_at = NULL` で戻せる
- **表示の一貫性**: スポット評価数・平均点が突然変動しない
- **監査性**: いつ・誰が削除したかを別カラム（`deleted_by` 等）で拡張しやすい

### 3-2. トレードオフ

- **クエリ負担**: 全 SELECT に `.is('deleted_at', null)` を書く必要がある。漏れると「削除したはずのゴミデータ」が画面に出るため、`/commit` スキル §3-2 で pre-commit チェックリストに入れて機械的に検出する
- **DB サイズ**: 論理削除された行が積み上がる。ただし DB は軽量データのみで画像は外部 URL 参照のため、500MB 枠圧迫の主因にはならない見込み。半年〜1 年ごとに `deleted_at < NOW() - INTERVAL '2 years'` の物理削除ジョブを検討する余地はある
- **インデックス設計**: 有効データ向けに partial index を張る必要がある。書き忘れると論理削除済みレコードもインデックスを消費してしまう

---

## 4. 検討した代替案

### 案 A: 物理削除（DELETE）+ 監査ログテーブル

**却下理由**: 削除後の復旧が「監査ログから手動で INSERT し直す」になり煩雑。監査ログの構造管理が別途必要で、実質的に論理削除と等価な複雑さを抱えつつ復旧容易性は劣る。

### 案 B: アーカイブテーブルへの物理移動

**却下理由**: `spots` → `spots_archive` のような別テーブル管理はマイグレーションの重複と JOIN の複雑化を招く。特にレビュー表示のような「削除済み参照を含む集計」が二重クエリになる。

### 案 C: Change Data Capture / イベントソーシング

**却下理由**: MVP 規模（4 週間ローンチ）に対しオーバーエンジニアリング。イベントストア設計とプロジェクション実装の学習コストが高く、Supabase のマネージド利点も薄れる。

---

## 5. 参考

- `docs/specs/database.md` — 全テーブル定義・partial index・カスケードトリガー実装
- `docs/design-docs/05_er-diagram.md` §4 — 論理削除サマリ
- `CLAUDE.md` — 「論理削除（全テーブル必須）」規約
- `supabase/migrations/20260509000001_extensions_and_functions.sql` — `cascade_soft_delete_*` 関数の実装
