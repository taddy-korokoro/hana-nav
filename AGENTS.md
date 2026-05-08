<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## このリポジトリの作業ルール

- プロジェクト規約・コーディングルールは `CLAUDE.md` を参照（毎回ロード対象）。
- 仕様の詳細は `docs/specs/` 配下、進捗管理は `docs/NN_*.md` のチケット駆動。
- UI トークン・画面パターンは `docs/specs/design.md` と `app/globals.css` の `@theme`。実装サンプルは `app/demo/`。
- shadcn/ui のプリミティブは `components/ui/` 配下。`@/lib/utils` の `cn()` でクラスを合成する。
