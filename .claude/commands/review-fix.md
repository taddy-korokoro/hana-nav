---
description: PR レビュー指摘を取得して修正する（未解決スレッドの抽出・修正・返信を一気通貫）
argument-hint: '[PR 番号 / URL / 省略時は現ブランチの PR] [追加コンテキスト]'
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git branch:*), Bash(git fetch:*), Bash(git pull:*), Bash(git push:*), Bash(git rev-parse:*), Bash(gh pr:*), Bash(gh api:*), Bash(gh repo:*), Bash(gh auth:*), Bash(grep:*), Bash(rg:*), Read, Edit, Write, Grep, Glob, TodoWrite
---

# /review-fix — hana-nav 用 PR レビュー指摘修正コマンド

このコマンドは **GitHub PR のレビュー指摘を取得 → 整理 → 修正 → 返信／解決** までを一気通貫で進めるためのものです。`/ultrareview` や人間レビュアーから付いたコメントを、未解決スレッド単位で順番に潰していきます。

ユーザーから追加のコンテキスト（対象 PR・特定の指摘番号・修正方針など）がある場合は: $ARGUMENTS

---

## 前提チェック

実行前に以下を **並列に** 確認：

- `gh auth status`（GitHub CLI 認証）
- `git rev-parse --abbrev-ref HEAD`（現ブランチ名）
- `git status`（ローカル未コミット変更の有無）
- `gh repo view --json nameWithOwner,defaultBranchRef -q '{repo: .nameWithOwner, base: .defaultBranchRef.name}'`（リポ・base ブランチ）

`gh` 未認証なら「`gh auth login` を実行してください」と案内して終了。
**ローカルに未コミット変更が残っている** 場合は警告し、先にコミット/退避するか確認を取る（修正の途中で混ざると区別が付かなくなるため）。

---

## 実行手順

### 1. 対象 PR の特定

引数 `$ARGUMENTS` から PR 番号を抽出する。優先順位：

1. `#123` / `123` / `https://github.com/owner/repo/pull/123` 形式が含まれていればそれを採用
2. なければ現ブランチに紐付く PR を `gh pr view --json number,headRefName,state,url` で取得
3. それでも取れなければ「対象 PR が特定できません。`#番号` を指定してください」と案内して終了

PR の `state` が `MERGED` / `CLOSED` の場合は「この PR は既にクローズ/マージ済みです。続行しますか？」と確認。

### 2. レビュー指摘の取得

未解決のレビュースレッドを **GraphQL で一括取得** する（REST の `pulls/{n}/comments` だと `isResolved` が取れないため）：

```bash
gh api graphql -f query='
  query($owner:String!, $repo:String!, $pr:Int!) {
    repository(owner:$owner, name:$repo) {
      pullRequest(number:$pr) {
        reviewThreads(first:100) {
          nodes {
            id
            isResolved
            isOutdated
            path
            line
            startLine
            comments(first:20) {
              nodes {
                id
                databaseId
                body
                author { login }
                createdAt
                diffHunk
                pullRequestReview { state }
              }
            }
          }
        }
        reviews(first:50) {
          nodes {
            id
            state
            body
            author { login }
            submittedAt
          }
        }
        comments(first:50) {
          nodes {
            id
            body
            author { login }
            createdAt
          }
        }
      }
    }
  }' -F owner=<owner> -F repo=<repo> -F pr=<番号>
```

加えて **PR 全体に紐付いたサマリレビュー** (`reviews.nodes[].body`) と **Issue コメント** (`comments.nodes[].body`) も拾う。`/ultrareview` などはサマリで観点をまとめている場合があるため。

### 3. 指摘の整理と一覧表示

取得したスレッド／コメントを以下のように分類して表示する：

#### 未解決のレビュースレッド（行コメント）

`isResolved == false` のものだけ、**ファイル → 行番号** 順で並べて、番号付きで列挙：

```
【未解決スレッド】
1. app/spots/page.tsx:42  by @reviewer-bot
   "deleted_at IS NULL のフィルタが漏れています"
   状態: 未解決 / 元コードあり

2. lib/supabase/server.ts:18  by @human-reviewer
   "createServerClient と getUser() の間に処理が挟まっています"
   状態: 未解決 / 既に修正コミット済みの可能性あり → 要確認
```

各エントリに以下を含める：

- 通し番号
- ファイル:行
- 投稿者
- 本文（長ければ最初の 1〜2 文 + 続きあり表示）
- スレッドの `id`（後で resolveReviewThread に使う）
- コメントの `databaseId`（後で返信に使う）

#### サマリレビュー / 全体コメント

PR レベルのレビュー本文・Issue コメントは別セクションで表示：

```
【全体コメント】
A. by @ultrareview-bot  (CHANGES_REQUESTED)
   "セキュリティ観点で 3 件、規約違反で 2 件…"
```

英字 `A. B. C.` で番号付け（行コメントの数字番号と区別するため）。

#### 既に解決済み / outdated は隠す

`isResolved == true` または `isOutdated == true` は **デフォルトでは表示しない**。ユーザーが「解決済みも見たい」と言ったときだけ展開する。

### 4. 修正方針の確認

ユーザーに「どこから対応しますか？」と聞く。指定の取り方：

- 「全部」 → 番号順に上から処理
- 「1, 3, 5」 → 指定番号のみ
- 「セキュリティ系だけ」 → サマリの分類から該当しそうなものをピック
- 「Aの指摘から」 → 全体コメントから該当する観点を分解して個別タスクに展開

複数指摘を一括対応する場合は **TODO リスト化** して進捗を見せる。

### 5. 1 件ずつの修正フロー

各指摘に対して、以下を **順番に** 実施：

#### 5-1. コンテキスト把握

- 該当ファイルの **指摘行 ± 30 行** を Read で確認
- 指摘の `diffHunk` と現在のコードを比較し、**指摘当時から既にコードが変わっていないか** チェック
  - 既に修正済みなら「この指摘はすでに解消されている可能性があります」と報告し、ユーザーに resolve するか確認
  - まだ未修正なら次へ

#### 5-2. 修正方針の提案

指摘の種別ごとに対応を変える：

| 指摘種別             | 対応                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------ |
| 明確なバグ・規約違反 | そのまま反映する方針を提案 → ユーザー承認 → Edit                                     |
| 設計の議論余地あり   | 現状の理由・代替案を整理して **ユーザーに判断を仰ぐ**。勝手に変更しない              |
| 単なる質問・確認     | 修正不要。コメント返信のみで対応                                                     |
| 反対できる指摘       | 反論材料（コードの根拠・規約・テスト）を提示し、返信文案をユーザーに見せて判断を仰ぐ |

**hana-nav 固有のレビュー観点**（`/commit` §3 と同じ）に該当する指摘は **議論せず原則そのまま直す**：

- `SUPABASE_SERVICE_ROLE_KEY` の `NEXT_PUBLIC_` 露出
- Client / Server Supabase クライアントの取り違え
- `supabase.auth.getSession()` を保護判定に使用
- `.is('deleted_at', null)` 漏れ
- Pages Router 構文の混入（`getServerSideProps` / `<Head>` / `pages/api/*` 等）
- `<a href>` 内部遷移 / `<img>` 直書き
- AI 判定のレート制限漏れ
- スポット投入の `is_published=true` デフォルト化

#### 5-3. 修正実行

- 修正は Edit で **最小差分** に留める。周辺リファクタを混ぜない（指摘範囲を超える変更はレビュアーを混乱させる）。
- 1 つの指摘で複数ファイルを触る必要があれば、まとめて 1 タスクとして扱う。
- 修正後に **再度 Read で確認**（タブ・スペースの食い違いがないか、import 漏れがないか）。

### 6. コミット粒度

修正をまとめてコミットする方針：

- **基本は「1 指摘 = 1 コミット」**。あとでレビュアーが diff を追いやすい。
- ただし **同じ観点の修正が複数ファイルに散らばる** 場合（例：`.is('deleted_at', null)` 漏れを 5 ファイルで修正）は 1 コミットにまとめてよい。
- コミットメッセージは `/commit` 規約に従う。footer に **指摘の出典** を書くと追跡しやすい：

  ```
  fix: 公開スポット一覧から論理削除済みレコードを除外

  @reviewer-bot の指摘 (#123 review thread) を反映。
  spots/page.tsx と spots/[id]/page.tsx の Supabase クエリに
  .is('deleted_at', null) を追加。

  Refs: docs/06_spot-search.md

  Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
  ```

- コミット作業は **`/commit` の手順を踏襲** する（hana-nav 固有チェックも再走させる）。

### 7. レビューコメントへの返信（任意）

修正後、各スレッドに返信を残すか確認する。返信する場合：

```bash
# 行コメントへの返信（スレッドにぶら下げる）
gh api -X POST repos/<owner>/<repo>/pulls/<pr>/comments \
  -f body="修正しました。<commit-sha> で対応。" \
  -F in_reply_to=<元コメントの databaseId>
```

返信文案の方針：

- **何をどう直したか** を 1〜2 文で要約。冗長な感謝・謝罪は不要（ノイズになる）。
- 反対意見の場合は **理由とコード/規約の根拠** を簡潔に。攻撃的にならない。
- 修正コミット SHA を含めるとレビュアーが追いやすい。
- ユーザーが返信文をレビューした上で送る。**勝手に送信しない**。

### 8. スレッドの解決マーク

返信後、または修正だけで完結するなら、スレッドを resolved にする：

```bash
gh api graphql -f query='
  mutation($threadId:ID!) {
    resolveReviewThread(input:{threadId:$threadId}) {
      thread { isResolved }
    }
  }' -F threadId=<スレッドの id>
```

**ユーザー承認なしに勝手に resolve しない**。レビュアーの「OK」を待つ運用なら、resolve はレビュアー側に任せる選択肢も提示する。

### 9. push と結果報告

すべての修正コミットが終わったら：

```bash
git push
```

upstream が無ければ `git push -u origin <branch>`、強制が必要そうな状況（rebase 後など）でも **`--force-with-lease`** を提案。`--force` 単独は使わない。

報告内容：

- 対応した指摘の番号と要約（例：「1, 3, 5 を修正、2 はユーザー判断で据え置き」）
- 作成したコミット数と SHA
- 残っている未解決スレッド（あれば）
- 次の一歩（CI 待ち / レビュアーへの再依頼 / 残りの指摘対応 etc.）

---

## 禁止事項

- **レビュー指摘を勝手に resolve しない**。ユーザー承認後のみ。
- **指摘の範囲を超えるリファクタを混ぜない**。「ついでに直す」が積もるとレビュアー側で diff の意図が読めなくなる。
- **反対意見の指摘を黙って従わない**。コードの根拠が示せるなら返信して議論する選択肢を提示する。
- **`--force` push を勝手に使わない**（`--force-with-lease` でも事前確認）。
- **CI が失敗していても無視して push しない**。失敗内容を確認してから判断。

---

## 失敗時のリカバリ

- **`gh api graphql` が空配列を返す** → 対象 PR にレビューが付いていない、または `gh` の権限不足。`gh auth refresh -s repo` を案内。
- **指摘ファイルが既にリネーム/削除されている** → `git log --follow -- <旧パス>` で追跡し、新パスで対応。追跡できなければ「指摘当時のファイルが見当たらない」と報告してユーザー判断を仰ぐ。
- **修正がコンフリクトを起こす** → `git status` を見せて状況報告。`git reset --hard` 等の破壊的操作は使わない。
- **resolveReviewThread が権限エラー** → スレッド作成者かリポジトリの maintain 権限が必要。ユーザーに resolve してもらう旨を案内。

---

## 補足

- **`/ultrareview` の出力が PR コメント本文に貼られているケース** が多い。サマリレビューを 1 つの指摘として扱うのではなく、内訳の各項目を **個別タスクに分解** してから §4 の番号付けに乗せる。
- **複数の `/ultrareview` 実行で同じ観点が重複** している場合は、最新分だけを採用してよい（古い指摘は outdated として扱う）。
- 指摘の出典が **ユーザー本人のセルフレビュー**（例：`assignees` で自分にレビューを付けた）の場合、返信プロセスはスキップして修正＋ resolve だけで OK。
