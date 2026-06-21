# 14. レビュー機能（F-10、WANT）

## 概要

ログインユーザーがスポットに ★1〜5 + 200文字以内のコメントを投稿できる機能。NG ワードフィルタは辞書ベース。WANT のため時間が無ければ削除可。

## 関連機能

- F-10 簡易レビュー（WANT）

## 依存チケット

- [03](./03_auth.md), [07](./07_spot-detail.md)

## 関連ファイル

- `app/spots/[id]/page.tsx`（レビューセクション）
- `app/mypage/reviews/page.tsx`
- `app/api/reviews/route.ts`（POST / GET）
- `app/api/reviews/[id]/route.ts`（PATCH / DELETE）
- `components/reviews/ReviewForm.tsx`（Client Component）
- `components/reviews/ReviewList.tsx`
- `components/reviews/ReviewCard.tsx`
- `lib/ng-words.ts`

## 関連 DB

`reviews`, `profiles`, `spots`

## TODO

### NG ワード辞書

- [x] `lib/ng-words.ts` に基本リストを定義（誹謗中傷・差別・性的表現の代表語）
- [x] バージョン定数を持たせて変更履歴を追えるようにする
- [x] `containsNgWord(text: string): boolean` を export

### Server Action / API

- [x] レビュー投稿（Route Handler）：認証必須、UNIQUE(user_id, spot_id) 違反は更新扱い（POST /api/reviews でアップサート）
- [x] NG ワード検出時は 400 で返す
- [x] `revalidatePath('/spots/[id]')` で詳細ページ更新
- [x] レビュー編集 / 論理削除（PATCH/DELETE /api/reviews/[id]）
- [x] reviews UPDATE ポリシーに `WITH CHECK` を明示（マイグレーション追加）

### UI（スポット詳細）

- [x] 平均評価 + 件数表示（既存）
- [x] レビューカード一覧（既存。最大 50 件取得）
- [x] 退会済ユーザーの場合は「退会済ユーザー」表示（既存）
- [x] 自分のレビューがある場合は編集ボタン（SpotReviewInteraction）
- [x] 未ログイン時は「ログインしてレビューする」誘導（SpotReviewInteraction）
- [x] 投稿フォーム（★選択 + 200文字 textarea + 訪問日）

### マイページ

- [x] `/mypage/reviews` で自分のレビュー一覧
- [x] 編集・削除動線（編集は /spots/[id] へ遷移してフォーム展開、削除はその場で API DELETE）

### 動作確認

- [ ] 1ユーザー1スポット1レビューに制限される（UNIQUE）
- [ ] 200文字超でバリデーションエラー
- [ ] NG ワード入りで投稿拒否
- [ ] 平均評価が再計算される

## 完了基準

- [x] 投稿・編集・削除・一覧表示ができる
- [x] 平均評価がスポット詳細に反映される

## 参考

- [specs/database.md](./specs/database.md) — reviews
- [specs/operations.md](./specs/operations.md) — レビューの誹謗中傷リスク
- [specs/nextjs-conventions.md](./specs/nextjs-conventions.md) — Server Action / revalidatePath
