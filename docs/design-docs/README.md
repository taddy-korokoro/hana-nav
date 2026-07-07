# hana-nav 設計ドキュメント

hana-nav（花畑スポット検索サービス）の SI 形式設計ドキュメント一覧。要件定義 → 基本設計 → 詳細設計 → ADR の順で構成されている。

---

## ドキュメント一覧と読み順

### 1. 要件定義

| #   | ドキュメント                             | 概要                                                           |
| --- | ---------------------------------------- | -------------------------------------------------------------- |
| T01 | [01_requirements.md](01_requirements.md) | ペルソナ・課題定義・機能要件（F-01〜F-12）・非機能要件・用語集 |

### 2. 基本設計

| #   | ドキュメント                                           | 概要                                                                       |
| --- | ------------------------------------------------------ | -------------------------------------------------------------------------- |
| T02 | [02_screen-flow.md](02_screen-flow.md)                 | 主要 15 画面の Mermaid 画面遷移図・認証要否                                |
| T03 | [03_screen-list.md](03_screen-list.md)                 | 全画面の URL・コンポーネント・Server Action・認証ルール一覧                |
| T04 | [04_api-list.md](04_api-list.md)                       | Route Handler 一覧（ユーザー向け / 管理者向け）・リクエスト/レスポンス概要 |
| T05 | [05_er-diagram.md](05_er-diagram.md)                   | ER 図（Mermaid）・テーブル定義・RLS 方針・インデックス                     |
| T06 | [06_external-interfaces.md](06_external-interfaces.md) | 外部 I/F 設計（Gemini API・Supabase Storage・地図 API）                    |

### 3. 詳細設計サンプル

| #   | ドキュメント                                                 | 概要                                                                                                  |
| --- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| T07 | [07_detail-screen-spot.md](07_detail-screen-spot.md)         | スポット詳細画面のコンポーネント構成・状態遷移・Suspense 境界                                         |
| T08 | [08_detail-api-ai-identify.md](08_detail-api-ai-identify.md) | AI 花判定 API（`POST /api/ai/identify-flower`）のリクエスト/レスポンス・エラー定義                    |
| T09 | [09_ai-flow.md](09_ai-flow.md)                               | AI 花判定の 5 フェーズ処理フロー（画像前処理・レート制限・キャッシュ・Gemini 呼び出し・マスター照合） |

### 4. ADR（Architecture Decision Record）

| #   | ドキュメント                                                   | 決定内容                                                                                |
| --- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| T10 | [adr/001-soft-delete.md](adr/001-soft-delete.md)               | 論理削除を全テーブルに適用。物理削除禁止・カスケードトリガー・RLS 設計                  |
| T11 | [adr/002-ai-fallback.md](adr/002-ai-fallback.md)               | Gemini 返却値 → `flowers` → `flower_aliases` の 3 段階フォールバックマッチング          |
| T12 | [adr/003-instant-navigation.md](adr/003-instant-navigation.md) | Next.js `unstable_instant` 採用・`cacheComponents: true`・`'use cache'` 化の 5 段階移行 |

---

## 推奨読み順

初めてこのリポジトリを読む場合は以下の順を推奨する。

```
01_requirements.md          ← プロダクトの目的・機能範囲の全体像
↓
02_screen-flow.md           ← ユーザーがどう動くかの地図
↓
05_er-diagram.md            ← データ構造の骨格
↓
adr/001-soft-delete.md      ← 全クエリに影響する論理削除のルール
↓
06_external-interfaces.md   ← Gemini API 等の外部依存
↓
09_ai-flow.md               ← AI 花判定のコアロジック
↓
adr/002-ai-fallback.md      ← マッチング設計の意思決定
↓
adr/003-instant-navigation.md ← パフォーマンス改善の経緯
```

個別機能の実装詳細が必要な場合は T07〜T09 の詳細設計サンプルを参照。

---

## 設計判断の主要トピック

### データ整合性

**[ADR-001 論理削除方針](adr/001-soft-delete.md)** — `prefectures` を除く全テーブルに `deleted_at TIMESTAMPTZ DEFAULT NULL` を付与。物理削除は禁止し、全クエリに `.is('deleted_at', null)` を必須とする。退会ユーザーのレビューは内容を保持してユーザー名を「退会済ユーザー」に置換する。

### AI マッチング精度

**[ADR-002 3 段階フォールバック](adr/002-ai-fallback.md)** — Gemini の表記揺れ・品種名混入に対応するため、`flowers.name` 完全一致 → `flower_aliases`（総称キー） → `flower_aliases`（品種名キー）の順で照合する。誤マッチ防止のため 3 段階で上限とし、LIKE 検索・ベクトル検索は採用しない。

### クライアントサイドナビゲーション

**[ADR-003 Instant Navigation](adr/003-instant-navigation.md)** — 「一覧 → 詳細」の主要動線で白画面が発生していた問題を、Next.js `unstable_instant` + `cacheComponents: true` + `'use cache'` 化の組み合わせで解決。5 段階 PR 分割で安全に移行し、Lighthouse 80+ を達成（2026-06-07）。

---

## 関連ドキュメント

| 種別     | 場所                                 | 内容                                                            |
| -------- | ------------------------------------ | --------------------------------------------------------------- |
| 仕様書   | [`docs/specs/`](../specs/)           | 技術スタック・DB 定義・認証ルール・デザイントークン等の詳細仕様 |
| チケット | [`docs/`](../) (`00_overview.md` 〜) | 実装チケット（TODO チェックリスト付き）                         |
| 作成手順 | [`PROCEDURE.md`](PROCEDURE.md)       | このドキュメント群の作成手順・モデル選定方針                    |
