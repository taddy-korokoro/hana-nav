'use client';

import { ChevronUp } from 'lucide-react';
import { useEffect, useState } from 'react';

const SHOW_THRESHOLD = 400;

/**
 * 花一覧画面の右下に常駐するページトップ移動ボタン。50音 ピルで下方ジャンプした後、
 * 検索バーへ戻りたいケース向け。`window.scrollY` が閾値を超えたら表示する。
 */
export function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_THRESHOLD);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="ページの先頭へ戻る"
      data-visible={visible || undefined}
      className="
        fixed bottom-6 right-6 z-40 grid size-12 place-items-center rounded-pill
        bg-brand text-white shadow-lg transition
        hover:bg-brand-hover focus-visible:outline-none
        opacity-0 translate-y-2 pointer-events-none
        data-[visible]:opacity-100 data-[visible]:translate-y-0 data-[visible]:pointer-events-auto
      "
    >
      <ChevronUp className="size-5" aria-hidden />
    </button>
  );
}
