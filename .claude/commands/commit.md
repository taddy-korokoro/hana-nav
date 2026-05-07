---
description: Conventional Commits 形式で commit する（hana-nav 固有のレビュー観点も自動チェック）
argument-hint: "[追加で伝えたいコンテキスト（省略可）]"
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git add:*), Bash(git commit:*), Bash(git branch:*), Bash(grep:*), Bash(rg:*), Read, Edit
---

# /commit — hana-nav 用コミットコマンド

このコマンドは **Conventional Commits + hana-nav 固有のレビュー観点** で staged/unstaged 変更を確認し、安全に commit するためのものです。ユーザーから追加のコンテキストがある場合は: $ARGUMENTS

---

## 実行手順

### 1. 変更状態の把握（並列実行）

まず `git fetch origin --quiet` を実行して `origin/main` を最新化する（§2 のマージ済みブランチ判定に必要）。続けて以下を **1 メッセージ内で並列に** 実行してから、結果を読み解いてください：

- `git status`（**`-uall` フラグは絶対に付けない** — 大規模リポでメモリ事故を起こす）
- `git diff`（unstaged の変更）
- `git diff --staged`（staged の変更）
- `git log -10 --oneline`（過去のコミットメッセージスタイル踏襲のため）
- `git branch --show-current`（ブランチ名から `main` 直 commit を検出）
- `git merge-base --is-ancestor HEAD origin/main; echo "merged_into_main=$?"`（exit `0` なら HEAD が `origin/main` に完全に取り込み済み = §2 でマージ済みブランチ警告の対象）

### 2. ブランチ・対象ファイルの安全チェック

- **`main` ブランチに直接 commit しようとしている場合は止めて警告**。「feature/NN-xxx ブランチを切るべきでは？」と確認する。ユーザーが「そのまま」と明言した場合のみ続行。
- **現ブランチが既に `origin/main` に取り込み済みの場合は止めて警告**。§1 の `git merge-base --is-ancestor HEAD origin/main` が exit `0`（= HEAD のすべてのコミットが既に main に乗っている）なら、**マージ済みブランチに新規 commit しようとしている可能性が高い**。以下を案内し、ユーザーが「そのまま」と明言した場合のみ続行：
  - 「現ブランチ (`<branch>`) は既に `origin/main` にマージ済みです。`git checkout -B <type>/<topic> origin/main` で新ブランチを切ってから commit しますか？」
  - 未 commit の変更がある場合は `git stash -u` → 新ブランチ作成 → `git stash pop` の順で退避・復元する手順を提示する。
  - 既に commit してしまった後で気付いた場合は、`git checkout -B <new> origin/main && git cherry-pick <sha> && git branch -f <old> origin/<old>` で新ブランチに移し替えるリカバリ手順を案内する。
- staged に以下が含まれていたら **必ず警告して確認を取る**：
  - `.env`, `.env.local`, `.env.*`（環境変数ファイル）
  - `*.pem`, `*.key`, `id_rsa*`, `credentials.json`, `service-account*.json`
  - `node_modules/`, `.next/`, `dist/`, `build/`（生成物）
  - 1MB 超のバイナリ
- これらが意図的でない限り、`git rm --cached` での除外を提案する。

### 3. hana-nav 固有のレビュー観点（pre-commit チェックリスト）

`git diff --staged` の差分に対して、以下を **必ず順番にチェック** し、引っかかったら commit を止めて報告する。ユーザーが「そのまま commit して」と判断した場合のみ続行。

#### 3-1. Supabase / 認証境界

- [ ] `SUPABASE_SERVICE_ROLE_KEY` が **`NEXT_PUBLIC_` プレフィックス付き** で書かれていないか（grep で確認）
- [ ] Client Component（`'use client'` を含むファイル）で `@/lib/supabase/server` を import していないか
- [ ] Server Component / Route Handler で `@/lib/supabase/client` を import していないか
- [ ] `supabase.auth.getSession()` を **保護ページ・middleware の認可判定** に使っていないか（必ず `getUser()` を使う）
- [ ] `lib/supabase/middleware.ts` を編集している場合、`createServerClient` と `getUser()` の間に処理を挟んでいないか

#### 3-2. 論理削除・データ整合性

- [ ] Supabase クエリ（`.from(...)`）に **`.is('deleted_at', null)` が付いているか**（`select` / `update` 系で漏れがちなので grep で確認）
- [ ] SQL マイグレーション（`supabase/migrations/*.sql`）で **新規テーブルに `deleted_at TIMESTAMPTZ DEFAULT NULL` を持たせているか**
- [ ] `images` テーブルへの INSERT 前に `validateImageOwner()`（`@/lib/utils/imageValidator`）を呼んでいるか

#### 3-3. Next.js App Router 規約

- [ ] **Pages Router 由来の禁止構文** が混入していないか：
  - `getServerSideProps` / `getStaticProps`
  - `pages/api/*`（`app/api/**/route.ts` で書く）
  - `_app.tsx` / `_document.tsx`
  - `import Head from 'next/head'`（→ `metadata` / `generateMetadata`）
  - `useRouter` を `next/router` から import（→ `next/navigation`）
- [ ] `'use client'` が **ページ全体やレイアウト** に付いていないか（葉のコンポーネントに押し下げる）
- [ ] 内部リンクが `<a href="/...">` になっていないか（→ `<Link>`）
- [ ] `<img src=...>` 直書きが新規追加されていないか（Canvas 合成等の例外を除き → `<Image>`）
- [ ] 動的ルートの `params` / `searchParams` を **同期参照していないか**（Next.js 15+ では `await params`）
- [ ] `fetch()` で `cache` / `next.revalidate` / `next.tags` の指定が漏れていないか

#### 3-4. その他のプロジェクト規約

- [ ] 月またぎの見頃判定を直書きせず `isInBestSeason()`（`@/lib/utils/seasonUtils`）を使っているか
- [ ] 管理者判定を直書きせず `requireAdmin()`（`@/lib/utils/requireAdmin`）を使っているか
- [ ] AI 判定など外部 API 呼び出しに `ai_usage_logs` のレート制限（匿名 1/日、ログイン 3/日）が入っているか
- [ ] スポット投入時 `is_published=false` がデフォルトになっているか
- [ ] `console.log` のデバッグ残骸が含まれていないか（明確に意図したログなら OK）

### 4. ステージング判断

- 既に staged のものだけを commit するのか、unstaged も含めるのかをユーザーの指示・文脈から判断。曖昧なら確認を取る。
- staged に追加する場合は **ファイル名を明示** して `git add path/to/file` で追加（`git add -A` / `git add .` は避ける — 上記 §2 の危険ファイルを巻き込む）。

### 5. コミットメッセージの起草

**Conventional Commits** 形式で起草する。日本語混在 OK（過去ログのスタイルに合わせる）。

```
<type>: <要約（命令形・50 文字以内推奨）>

<本文（任意・なぜを書く・72 文字で折り返し）>

<footer（任意：BREAKING CHANGE / Refs #NN）>
```

- **type**：`feat` / `fix` / `docs` / `style` / `refactor` / `perf` / `test` / `chore` / `build` / `ci` のいずれか。
- 過去コミット（`git log -10`）のスタイルを踏襲する。hana-nav は日本語 type 後コロン形式（例：`docs: CLAUDE.md を規約集に縮約し仕様を docs/specs/ へ分割`）。
- **要約は「何を」ではなく「何のために」寄りに**（差分を見れば「何を」は分かる）。
- **チケット番号** がブランチ名・コンテキストから分かる場合は footer に `Refs: docs/NN_*.md` を入れる。
- **複数の論理変更を 1 コミットに混ぜない**。混ざっている場合は分割を提案する。

### 6. コミット実行

メッセージは **必ず HEREDOC** で渡す（改行・引用符の事故防止）。`Co-Authored-By` フッタを必ず付ける。

```bash
git commit -m "$(cat <<'EOF'
feat: スポット検索ページに県絞り込みを追加

URL searchParams で状態を持たせ、Server Component で SQL に流す。
クライアント側の useState は使わない（SEO・戻るボタン要件のため）。

Refs: docs/06_spot-search.md

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

**禁止事項**：

- `--no-verify` で pre-commit フックをスキップしない（ユーザーが明示要求した場合のみ）
- `--amend` で既存 commit を書き換えない（pre-commit フックが落ちて失敗した場合も、修正後に **新しい commit** を作る）
- `git config` を勝手にいじらない

### 7. 結果報告

- `git status` を最後にもう一度実行して、commit 成功とワーキングツリーの状態を確認。
- 1〜2 文で「何を commit したか」「次に何をすべきか（push / 続けて作業 / PR 作成 etc.）」を伝える。長い要約は不要（差分は本人が見られる）。

---

## 失敗時のリカバリ

- **pre-commit フック失敗** → commit は **作成されていない**。フックが指摘した問題を修正 → 再 stage → **新しい commit を作る**（`--amend` ではない）。
- **コンフリクト・ロック** → 勝手に `git reset --hard` / `rm .git/index.lock` しない。状態を報告してユーザーの指示を仰ぐ。
- **意図しないファイルを stage してしまった** → `git restore --staged <file>` で外す（`git reset --hard` は使わない）。

---

## 補足

- 大きな差分の場合、§3 のチェックは **変更ファイルに該当しそうな項目だけ** に絞ってよい（無関係な項目を機械的に全部見ない）。
- 自動 fix できる軽微な問題（例：`<a>` → `<Link>`）はユーザー確認の上で修正してから commit。
- ユーザーが「とにかく commit して」と急いでいる場合でも、§2 の危険ファイル検出だけは飛ばさない。
