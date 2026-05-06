# 00. 開発チケット一覧（INDEX）

hana nav MVP の開発チケット。番号順に依存関係を組んでいる。各チケット内の TODO を `[ ]` → `[x]` で進捗管理する。

詳細仕様は `docs/specs/` を正とする。チケットは **やることリスト** であり、設計の二重管理は避ける。共通規約（Next.js App Router・Supabase Auth・論理削除・整合性）は `CLAUDE.md` 参照。

## チケット一覧

| # | チケット | 関連機能 | Week |
|---|---|---|---|
| [01](./01_project-setup.md) | プロジェクト初期セットアップ | - | W1 |
| [02](./02_database-schema.md) | DB スキーマ + RLS + マスター投入 | - | W1 |
| [03](./03_auth.md) | Supabase Auth 実装 | F-08 | W1 |
| [04](./04_layout-navigation.md) | 共通レイアウト・ナビゲーション | - | W1 |
| [05](./05_top-page.md) | トップページ | F-01 | W2 |
| [06](./06_spot-search.md) | スポット検索 + 見頃カレンダー | F-02, F-04 | W2 |
| [07](./07_spot-detail.md) | スポット詳細 | F-03 | W2 |
| [08](./08_flower-pages.md) | 花の種類一覧・詳細 | - | W2 |
| [09](./09_area-pages.md) | エリア別一覧 | - | W2 |
| [10](./10_bookmark.md) | ブックマーク機能 | F-09 | W2 |
| [11](./11_ai-identify.md) | AI 花判定 + レート制限 | F-05, F-07 | W3 |
| [12](./12_story-card.md) | 旅のしおり生成 + SNS シェア | F-06 | W3 |
| [13](./13_mypage.md) | マイページ・プロフィール編集 | - | W3 |
| [14](./14_review.md) | レビュー機能（WANT） | F-10 | W3 |
| [15](./15_admin-spots.md) | 管理画面：スポット | - | W4 |
| [16](./16_admin-content.md) | 管理画面：花マスター・画像 | - | W4 |
| [17](./17_admin-users.md) | 管理画面：ユーザー・レビュー・AI ログ | - | W4 |
| [18](./18_data-collector.md) | 初期データ投入（Python） | - | W4 |
| [19](./19_seo.md) | SEO 実装 | - | W4 |
| [20](./20_static-pages.md) | 静的ページ（terms/privacy/legal） | - | W4 |
| [21](./21_deploy-launch.md) | デプロイ・ローンチ | - | W4 |

## ステータス凡例

- `[ ]` 未着手
- `[x]` 完了

## 進捗ルール

- 1 チケット = 1 PR を基本にする（粒度が大きいものは分割可）
- TODO は実装中に追加・分解してよい
- 仕様変更が発生したら `docs/specs/` を先に更新し、チケット側はチェックリストのみ更新する。CLAUDE.md は共通規約のみで触らない
