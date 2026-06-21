# 20. 静的ページ（terms / privacy）

## 概要

法的・運用上必要な静的ページ（利用規約・プライバシーポリシー）を実装する。

> 当初は特定商取引法に基づく表記（`/legal`）も含めていたが、本サービスは無料提供（通信販売に該当しない）のため特商法の表記義務は発生しないと判断し、MVP では作成しない。将来的に有料機能を追加するタイミングで別チケットとして再起票する。

## 依存チケット

- [04](./04_layout-navigation.md)

## 関連ファイル

- `app/(site)/terms/page.tsx`
- `app/(site)/privacy/page.tsx`
- `lib/constants/copy.ts`（`staticPages` セクション：ヘッダー文言・最終更新日 / `POLICY_LINKS`）
- `app/sitemap.ts`（2 URL を追加）

## TODO

### 利用規約（`/terms`）

- [x] サービス内容
- [x] 禁止事項（誹謗中傷・スクレイピング・悪用）
- [x] AI 生成結果の利用範囲（参考情報・正確性は保証しない）
- [x] 私有地侵入・現地マナー注意
- [x] 免責事項
- [x] 改定履歴

### プライバシーポリシー（`/privacy`）

- [x] 取得する情報（メール、Google プロフィール、画像、IP、Cookie）
- [x] 利用目的（認証、AI 判定、改善、レート制限）
- [x] 第三者提供（Supabase, Vercel, Google Maps, Gemini）
- [x] Cookie 利用
- [x] 退会・データ削除請求の窓口
- [x] 改定履歴

### 共通

- [x] フッターから 2 ページにリンク（既存 `COPY.footer.policyLinks` 経由）
- [x] 文面はマークダウン or 静的 JSX
- [x] 最終更新日表示

## 完了基準

- [x] 2 ページが公開されている
- [x] フッターから到達できる
- [ ] 文面が法的に問題ないか確認済み（必要なら専門家レビュー）

## 参考

- [specs/pages.md](./specs/pages.md) — 公開ページ一覧
- [specs/operations.md](./specs/operations.md) — ローンチチェックリスト
- [specs/nextjs-conventions.md](./specs/nextjs-conventions.md) — generateMetadata / 静的レンダリング
