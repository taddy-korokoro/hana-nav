# 設計ドキュメント作成手順書

hana-nav の SI 形式設計ドキュメント（要件定義 / 基本設計 / 詳細設計サンプル / ADR）を作成する際の手順書。

## 利用ルール

- 作業は **タスク単位**（T01〜T17）で実施。Claude への依頼時は必ずタスク ID（例：「T03 を進めて」）を含める
- 各タスクには **推奨モデル**（`[model: opus]` または `[model: sonnet]`）を明記してある
- 推奨モデルと現在モデルが一致しない場合、`.claude/hooks/check-model.sh` がプロンプトをブロックする
  - モデル切り替えは `/model` を実行して選択
- 既存の `docs/specs/` は参考資料として参照可。コピペせず再構成すること

## モデル選定方針

| モデル | 用途                                                                                      |
| ------ | ----------------------------------------------------------------------------------------- |
| Opus   | 要件整理・設計判断・思考が中心の作業（要件定義 / ADR / 外部 I/F 設計 / AI 処理フロー）    |
| Sonnet | 整形・量産・既知仕様の文書化（画面遷移図 / API 一覧 / ER 図 / 詳細設計テンプレ / README） |

---

## タスク一覧

### T01: 要件定義サマリ [model: opus]

- 出力: `docs/design-docs/01_requirements.md`
- 工数目安: 2〜3 人日
- 含める内容:
  - ペルソナ（2〜3 パターン）
  - 課題定義
  - F-01〜F-12 の機能要件一覧（優先度付き）
  - 非機能要件（性能・可用性・セキュリティ・SEO・コスト上限）
  - システム化範囲・対象外
  - 用語集
- 完了条件: A4 換算 5〜8 ページ。F-01〜F-12 すべてに目的・主要ユーザー導線が明記されていること

### T02: 画面遷移図 [model: sonnet]

- 出力: `docs/design-docs/02_screen-flow.md`
- 工数目安: 1〜1.5 人日
- 含める内容:
  - 主要 15 画面の一覧
  - Mermaid 記法での画面遷移図
  - 認証要否（公開 / 認証必須 / 管理者のみ）
- 完了条件: TOP→検索→詳細→AI 判定→しおり生成 の主要動線が網羅されていること

### T03: 画面一覧 [model: sonnet]

- 出力: `docs/design-docs/03_screen-list.md`
- 工数目安: 1 人日
- 含める内容:
  - 全画面の一覧表（画面 ID / 画面名 / URL / 認証要否 / 利用機能）
- 完了条件: `docs/specs/pages.md` と整合していること

### T04: API 一覧 [model: sonnet]

- 出力: `docs/design-docs/04_api-list.md`
- 工数目安: 1.5〜2 人日
- 含める内容:
  - ユーザー向け Route Handler / Server Action 一覧
  - 管理者向け API 一覧
  - メソッド・URL・概要・認可レベル
- 完了条件: `docs/specs/api.md` と整合していること

### T05: ER 図 [model: sonnet]

- 出力: `docs/design-docs/05_er-diagram.md`
- 工数目安: 1〜1.5 人日
- 含める内容:
  - Mermaid erDiagram での ER 図
  - 主要 10 テーブルの関係性
  - 論理削除フラグの明示
- 完了条件: `docs/specs/database.md` と整合し、`images` の多態関連も表現されていること

### T06: 外部 I/F 設計 [model: opus]

- 出力: `docs/design-docs/06_external-interfaces.md`
- 工数目安: 1.5〜2 人日
- 含める内容:
  - Gemini API（花判定）: 呼び出しタイミング / リクエスト・レスポンス / フォールバック戦略
  - Rakuten Affiliate API
  - Supabase Auth（@supabase/ssr）
  - Geocoding
  - 各 I/F のエラー処理方針
- 完了条件: 各外部 API について「呼び出し条件 / 失敗時挙動 / コスト・レート制限」が記述されていること

### T07: 詳細設計サンプル - スポット詳細画面 [model: sonnet]

- 出力: `docs/design-docs/07_detail-screen-spot.md`
- 工数目安: 1〜1.5 人日
- 含める内容:
  - 画面項目定義（表形式：項目名 / 型 / 必須 / バリデーション / 表示条件）
  - 画面状態遷移（ローディング / エラー / 空 / 正常）
  - 関連 API
- 完了条件: 実装と照合可能なレベルまで詳細化されていること

### T08: 詳細設計サンプル - AI 花判定画面 [model: sonnet]

- 出力: `docs/design-docs/08_detail-screen-ai-identify.md`
- 工数目安: 1〜1.5 人日
- 含める内容: T07 同様。AI 判定特有の状態（識別中 / 候補表示 / 確定 / 失敗）を含むこと

### T09: 詳細設計サンプル - API: スポット検索 [model: sonnet]

- 出力: `docs/design-docs/09_detail-api-spot-search.md`
- 工数目安: 0.5〜1 人日
- 含める内容:
  - リクエスト・レスポンスのスキーマ
  - クエリパラメータ仕様（`searchParams` ベース）
  - エラーレスポンス
  - 認可
- 完了条件: OpenAPI 風の項目粒度

### T10: 詳細設計サンプル - API: AI 花判定 [model: sonnet]

- 出力: `docs/design-docs/10_detail-api-ai-identify.md`
- 工数目安: 0.5〜1 人日
- 含める内容: T09 同様 + レート制限ロジック

### T11: AI 花判定処理フロー詳細 [model: opus]

- 出力: `docs/design-docs/11_ai-flow.md`
- 工数目安: 1〜1.5 人日
- 含める内容:
  - 3 段階フォールバックマッチングのアルゴリズム
  - 画像前処理（リサイズ・ハッシュ）
  - キャッシュ戦略（同一ハッシュ 24h）
  - レート制限（匿名 1/日 / ログイン 3/日）
- 完了条件: `docs/specs/ai-identify.md` より一段詳細

### T12: ADR-001 Next.js 16 採用理由 [model: opus]

- 出力: `docs/design-docs/adr/001-nextjs-16.md`
- 工数目安: 0.5〜1 人日
- 含める内容: 文脈 / 決定 / 結果 / 代替案 / 補足
- 完了条件: 比較対象（Next.js 15 LTS / Remix / SvelteKit 等）が明示されていること

### T13: ADR-002 Supabase 採用理由 [model: opus]

- 出力: `docs/design-docs/adr/002-supabase.md`
- 工数目安: 0.5〜1 人日
- 完了条件: Firebase / 自前 Auth + RDS 等との比較を含むこと

### T14: ADR-003 論理削除方針 [model: opus]

- 出力: `docs/design-docs/adr/003-soft-delete.md`
- 工数目安: 0.5〜1 人日
- 含める内容: 全テーブル `deleted_at` 必須・カスケード論理削除トリガー・レビューの退会後扱い

### T15: ADR-004 AI 花判定の 3 段階フォールバック [model: opus]

- 出力: `docs/design-docs/adr/004-ai-fallback.md`
- 工数目安: 0.5〜1 人日
- 含める内容: なぜ 3 段階か / 各段階の役割 / コストとのバランス

### T16: ADR-005 Instant Navigation 採用 [model: opus]

- 出力: `docs/design-docs/adr/005-instant-navigation.md`
- 工数目安: 0.5〜1 人日

### T17: README 整備 [model: sonnet]

- 出力: `docs/design-docs/README.md`
- 工数目安: 0.5〜1 人日
- 含める内容:
  - ドキュメント一覧と読み順
  - 各ドキュメントへのリンク
  - 設計判断の主要トピック（ADR へのリンク）

---

## 完了基準（全体）

- T01〜T17 すべてが完了条件を満たす
- 全文書の用語・記法が統一されている
- 既存 `docs/specs/` と矛盾がない（specs の方が古い場合は specs を更新する）
