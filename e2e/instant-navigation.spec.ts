/**
 * Instant Navigation の自動回帰テスト。
 *
 * 公式 `@next/playwright` の `instant()` ヘルパで「ナビゲーション直後・動的データ
 * 到着前」の静的シェルだけに対して assertion する。シェルが空白に化けたり
 * Suspense fallback が消えたりした時にこのテストが落ちる。
 *
 * 設計方針（公式 docs より）:
 *   > There is no need to write an instant() test for every navigation.
 *   > Build-time validation already provides the structural guarantee.
 *   > Use instant() for the user flows that matter most.
 *
 * MVP では一覧 ↔ 詳細の代表 2 ルート（spots / flowers）だけ。流入が多い動線が
 * 増えたら追加する。
 *
 * 注意:
 *   - 本テストはローカル / Preview の Supabase に接続する。スポット / 花が 1 件
 *     以上ないと一覧→詳細クリックが成立しない。
 *   - ヘッダー（Logo / Nav）とフッターは layout 由来で常に存在するため検査対象外。
 *     検査対象は「ページ単位のシェル（Suspense fallback）の有無」。
 */

import { instant } from '@next/playwright';
import { expect, test } from '@playwright/test';

test.describe('Instant Navigation', () => {
  test('/spots → /spots/[id] のシェルが即座に出る', async ({ page }) => {
    await page.goto('/spots');

    // 一覧の SpotCard リンクが出るまで待つ。`/spots/<id>` の形式（末尾スラッシュ付）のみ拾う。
    // ヘッダの `/spots` リンクは末尾スラッシュ無しなので [href^="/spots/"] では引っかからない。
    const detailLink = page.locator('a[href^="/spots/"]').first();
    await expect(detailLink).toBeVisible({ timeout: 15_000 });
    const href = await detailLink.getAttribute('href');
    expect(href).toMatch(/^\/spots\/.+/);

    await instant(page, async () => {
      await detailLink.click();
      // ナビゲーション完了（URL 変化）= プリフェッチ済みシェルが即時に切り替わった
      await expect(page).toHaveURL(/\/spots\/[\w-]+/);
      // 詳細ページの `<article>` ラッパは static shell に含まれるので、
      // 動的データ到着前でも DOM に存在しているはず。
      await expect(page.locator('article').first()).toBeVisible();
    });

    // instant() を抜けると Suspense 内側の動的データがストリームされる。
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.locator('h1').first()).not.toBeEmpty();
  });

  test('/flowers → /flowers/[id] のシェルが即座に出る', async ({ page }) => {
    await page.goto('/flowers');

    const detailLink = page.locator('a[href^="/flowers/"]').first();
    await expect(detailLink).toBeVisible({ timeout: 15_000 });
    const href = await detailLink.getAttribute('href');
    expect(href).toMatch(/^\/flowers\/.+/);

    await instant(page, async () => {
      await detailLink.click();
      await expect(page).toHaveURL(/\/flowers\/[\w-]+/);
      await expect(page.locator('article').first()).toBeVisible();
    });

    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.locator('h1').first()).not.toBeEmpty();
  });
});
