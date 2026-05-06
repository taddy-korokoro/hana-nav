---
description: 現ブランチから main への Pull Request を作成する（チケット連動・テンプレ自動生成）
argument-hint: "[PR タイトルや追加コンテキスト（省略可）]"
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git branch:*), Bash(git push:*), Bash(git rev-parse:*), Bash(gh pr:*), Bash(gh repo:*), Bash(gh auth:*), Read, Edit, Grep
---

# /pr — hana-nav 用 Pull Request 作成コマンド

このコマンドは **チケット駆動開発に沿った PR 作成** を行います。ブランチ命名規則・チケット TODO 状態・出典情報・hana-nav 固有のレビュー観点を確認した上で、`gh pr create` でドラフト/通常 PR を作成します。

ユーザーから追加のコンテキスト（PR タイトル等）がある場合は: $ARGUMENTS

---

## 前提チェック

実行前に以下を **並列に** 確認：

- `git rev-parse --abbrev-ref HEAD`（現ブランチ名）
- `git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null || echo "no upstream"`（upstream の有無）
- `gh auth status`（GitHub CLI 認証）
- `gh repo view --json defaultBranchRef -q .defaultBranchRef.name`（base ブランチ名 — 通常 `main`）

`gh` 未認証なら「`gh auth login` を実行してください」と案内して終了。

---

## 実行手順

### 1. ブランチの妥当性チェック

- **`main` から PR は作れない**。現ブランチが `main` の場合は止めて「先に `feature/NN-xxx` 等のブランチを切ってください」と案内。
- ブランチ命名規則を確認（推奨パターン）：
  - `feature/NN-<slug>`（新機能・チケット番号）
  - `fix/NN-<slug>`（バグ修正）
  - `chore/<slug>` / `docs/<slug>` / `refactor/<slug>`
- 規則から外れていても止めはしない。**警告だけ出してユーザー判断**（既に作業中のブランチを名前変えするのはコスト高いため）。

### 2. 差分・コミット履歴の収集（並列実行）

base ブランチ（通常 `main`）に対する全差分を見る。**最後の 1 コミットだけ見ない** — マージ後の PR 単位で意味のあるサマリにするため：

- `git status`
- `git diff main...HEAD`（差分全量）
- `git log main..HEAD --oneline`（このブランチで積まれたコミット一覧）
- `git log main..HEAD --stat`（変更ファイルの規模感）

差分が空なら「コミットがありません」と報告して終了。

### 3. チケット番号の特定と TODO 状態確認

ブランチ名・コミットメッセージから **チケット番号 NN** を抽出：

- ブランチ名に `feature/05-...` のように含まれていれば `docs/05_*.md`
- 含まれていない場合はコミットメッセージ内の `Refs: docs/NN_*.md` を grep
- それでも特定できなければユーザーに「対象チケットはどれですか？」と確認

特定できたら **`docs/NN_*.md` を読んで TODO リストを確認**：

- 先頭の `[ ]` / `[x]` チェックリストを Read で取得
- このブランチの差分内容に **対応する TODO で `[x]` になっていないものがあれば警告**：「TODO の `[x]` 化漏れがありそうです。`/commit` で更新してから PR にしますか？」
- ユーザーが「このまま」と言えば続行。「更新する」と言えば該当ファイルを Edit して TODO を `[x]` に書き換える提案をする（コミットは別途）。

### 4. hana-nav 固有のレビュー観点（再確認）

`/commit` 時に見ているはずだが、PR 段階で **diff 全量に対してもう一度** 軽くスキャン：

- `SUPABASE_SERVICE_ROLE_KEY` が `NEXT_PUBLIC_` 露出していないか
- Client Component で `lib/supabase/server` を import していないか
- `getServerSideProps` / `pages/api/*` / `<Head>` 等の Pages Router 構文が混入していないか
- 新規追加の Supabase クエリに `.is('deleted_at', null)` が漏れていないか
- スポット新規投入が `is_published=false` で入っているか
- `is_published=true` で投入する変更がある場合、`official_url` が NULL なら `source` 必須（オーバーツーリズム対策）になっているか

引っかかれば **PR 作成を止めて** 報告。ユーザーが「そのまま PR」と判断したら続行。

### 5. PR タイトル・本文の起草

#### タイトル

- **70 文字以内**。Conventional Commits の type を先頭に付ける（`feat: スポット検索の県絞り込みを追加`）。
- ユーザーが `$ARGUMENTS` でタイトル指定していればそれを優先。
- 単一コミットの PR なら、その commit message の subject をベースに調整。
- 複数コミットなら **PR 全体の意図** を要約（個別コミットの羅列にしない）。

#### 本文（HEREDOC で渡す）

```markdown
## 概要
<!-- 変更の概要を記載 -->

## 関連チケット
<!-- チケットへのリンク (例: #123) -->

## 変更内容
<!-- 具体的にどのような変更を行ったか -->
- 
- 

## 影響する機能・箇所
<!-- 影響範囲を記載 -->

## テスト・レビューの観点
<!-- 動作確認内容、レビューで見てほしいポイント -->
- [ ] 
- [ ] 

## 破壊的変更
- [ ] なし
- [ ] あり（あれば記載）

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

#### 各セクションの埋め方ガイドライン

- **概要** — 「なぜ」中心に 1〜3 行。`$ARGUMENTS` でユーザーが指示した内容や、コミット履歴・チケットの背景から起草する。
- **関連チケット** — `docs/NN_*.md`（リポ内チケット）と関連 GitHub Issue があれば `#123` 形式で併記。両方ない場合は「該当なし」と書く（コメントだけ残さない）。
- **変更内容** — `git log main..HEAD --oneline` の各コミットや、`git diff --stat` の主要ファイルから箇条書きで列挙。コミット文字列の機械貼り付けではなく **意味のある粒度** にまとめる。
- **影響する機能・箇所** — UI / DB スキーマ / API / バッチ / 認証 / SEO 等のどこに波及するかを列挙。差分が触ったファイルのディレクトリから推定する。
- **テスト・レビューの観点** — `lint` / `build` の通過は前提として、変更領域に応じて以下から **関連項目だけ** 入れる（機械的に全部入れない）：
  - `npm run lint` / `npm run build` が通ること
  - UI 変更：`npm run dev` で対象画面の golden path / edge case 確認
  - DB スキーマ：マイグレーションを開発環境に適用して動作確認
  - 外部 API：`ai_usage_logs` のレート制限が機能するか
  - 認証：ログイン / 未ログイン / 管理者の 3 パターン
  - 論理削除：`deleted_at IS NULL` フィルタが効いているか
- **破壊的変更** — DB スキーマ変更・公開 API のシグネチャ変更・環境変数の追加削除がある場合は `あり` にチェックして内容を併記。それ以外は `なし`。

**HTML コメント（`<!-- -->`）は残さない**。テンプレ流用感が出るので、内容を埋めたらコメントは削除する。チェックボックスはユーザーが手で潰すものなので空のまま `[ ]` で出して良い（少なくとも 2 項目は具体的な観点で埋める）。

### 6. push と PR 作成

#### upstream がない場合

```bash
git push -u origin <current-branch>
```

#### upstream がある場合

ローカルが上流より進んでいるかを確認し、必要なら `git push`。**`git push --force` は使わない**（ユーザーが明示要求した場合のみ。`main` への force push は要警告）。

#### PR 作成

```bash
gh pr create --base main --title "feat: スポット検索の県絞り込みを追加" --body "$(cat <<'EOF'
## 概要

URL の searchParams で絞り込み状態を持たせ、SEO・戻るボタン要件を満たす実装に変更。

## 関連チケット

docs/06_spot-search.md

## 変更内容

- `/spots` ページに県セレクトを追加し、選択値を `?prefecture=` で URL に反映
- Server Component 側で `searchParams` を読んで Supabase クエリに流すよう変更
- 既存の `useState` ベースの絞り込みを撤去

## 影響する機能・箇所

- `/spots` 一覧画面の URL 構造
- 検索結果の SSR / キャッシュ動作

## テスト・レビューの観点

- [ ] 県を切り替えると URL の `?prefecture=` が更新されること
- [ ] 戻るボタンで前の絞り込み状態に復元されること
- [ ] `npm run lint` / `npm run build` が通ること

## 破壊的変更
- [x] なし
- [ ] あり（あれば記載）

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- **WIP / draft で出したいか確認**。明確に「出して」と指示されていない場合や、TODO に未完項目が残っている場合は `--draft` を提案。
- `--reviewer` / `--assignee` / `--label` はユーザー指示があれば付ける。指示がなければ付けない（hana-nav はソロ開発前提のため）。

### 7. 結果報告

- 作成した PR の URL を返す（`gh pr create` の標準出力に出る）。
- 1 文で「次の一歩」（CI 待ち / レビュー依頼 / 続けて作業）を添える。

---

## 禁止事項

- **`main` への force push は絶対にしない**。ユーザーが要求しても警告して確認を取る。
- **`git push --force` は通常使わない**（`--force-with-lease` を提案する）。
- **ホストされていないリポジトリで `gh pr create` を試みない**。`gh repo view` でリモートが存在するか先に確認。
- **PR を勝手にマージしない** — 作成のみ。マージはユーザーの判断。
- **PR にシークレットを貼らない**（差分内に `.env` 系が入っていたら §4 で止まっているはず）。

---

## 失敗時のリカバリ

- **`gh pr create` が「PR already exists」で失敗** → `gh pr view` で既存 PR を表示し、`gh pr edit --body ...` で更新するか確認を取る。
- **push が rejected** → `git fetch && git log HEAD..@{u} --oneline` でリモート側に何が積まれているか確認。`git pull --rebase` を提案するが、勝手に実行はしない。
- **`gh` 未認証** → `gh auth login` をユーザーに促して終了。
