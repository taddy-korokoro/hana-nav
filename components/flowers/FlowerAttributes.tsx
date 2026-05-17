import { COPY } from '@/lib/constants/copy';
import type { CultivationDifficulty, ShadeTolerance, ToleranceLevel } from '@/lib/queries/flowers';

type Props = {
  cultivationDifficulty: CultivationDifficulty | null;
  coldTolerance: ToleranceLevel | null;
  heatTolerance: ToleranceLevel | null;
  shadeTolerance: ShadeTolerance | null;
};

const {
  labels,
  difficulty,
  tolerance,
  shade,
  difficultySymbol,
  toleranceSymbol,
  shadeSymbol,
  empty,
  unregistered,
} = COPY.flowerDetail.attributes;

type Symbol = '◎' | '○' | '△' | '×';

// シンボルごとに視覚階調を付ける。
// ◎（最も良）は brand のソリッド、○ は brand-soft、△ は中立、× は最も控えめ。
// 色覚に依存しないようシンボル形（◎/○/△/×）でも識別可能。
const SYMBOL_STYLE: Record<Symbol, { badge: string; value: string }> = {
  '◎': { badge: 'bg-brand text-white shadow-sm', value: 'text-brand' },
  '○': { badge: 'bg-brand-soft text-brand', value: 'text-ink' },
  '△': { badge: 'bg-surface-2 text-ink-muted', value: 'text-ink-muted' },
  '×': { badge: 'bg-surface-2 text-ink-faint', value: 'text-ink-faint' },
};

// 値が未登録の場合のバッジ。dashed border で「未確定」を視覚化
const UNREGISTERED_STYLE = {
  badge: 'border border-dashed border-line bg-surface text-ink-faint',
  value: 'text-ink-faint',
};

type Row = {
  label: string;
  // null = この属性が DB 側で未登録（scraper / admin 入力で値が無い）
  symbol: Symbol | null;
  value: string | null;
};

/**
 * 栽培情報（栽培難易度・耐寒/耐暑/耐陰性）を 4 カードのグリッドで表示する。
 *
 * - 各属性のカードは値の有無にかかわらず **常に 4 枚レンダリング** する。
 *   値が null のカラム（例: greensnap で耐陰性 dd が空だったケース）も枠だけ出して
 *   「未登録」と分かるようにする。歯抜けで 3 枚しか出ない状態を避ける目的。
 * - 全て null の場合のみ、単一の空状態メッセージにフォールバック
 * - 5 段階 → 4 シンボルに圧縮するため、シンボルだけでは「普通」と「やや難しい」を
 *   区別できない。日本語ラベル併記は必須（色覚アクセシビリティも兼ねる）
 *
 * レスポンシブ: mobile は 2 列、sm 以上で 4 列。
 */
export function FlowerAttributes({
  cultivationDifficulty,
  coldTolerance,
  heatTolerance,
  shadeTolerance,
}: Props) {
  // 「全カラムが DB 上 null」を判定するため、フォールバック決定は raw 値で行う。
  // これより後の rows 構築でドメインルール（耐陰性 null → なし）を適用する。
  const hasAnyData =
    cultivationDifficulty !== null ||
    coldTolerance !== null ||
    heatTolerance !== null ||
    shadeTolerance !== null;

  if (!hasAnyData) {
    return (
      <div className="rounded-card border border-line bg-white p-6 text-center text-sm text-ink-muted">
        {empty}
      </div>
    );
  }

  // ドメインルール: 耐陰性は 2 値属性（あり/なし）。null は「なし (UNAVAILABLE)」として描画する。
  // DB の値は null のまま保持し、UI 層のみで補正（「未確認 = なし」と扱う運用方針）。
  const effectiveShade: ShadeTolerance = shadeTolerance ?? 'UNAVAILABLE';

  const rows: Row[] = [
    {
      label: labels.cultivationDifficulty,
      symbol: cultivationDifficulty ? (difficultySymbol[cultivationDifficulty] as Symbol) : null,
      value: cultivationDifficulty ? difficulty[cultivationDifficulty] : null,
    },
    {
      label: labels.coldTolerance,
      symbol: coldTolerance ? (toleranceSymbol[coldTolerance] as Symbol) : null,
      value: coldTolerance ? tolerance[coldTolerance] : null,
    },
    {
      label: labels.heatTolerance,
      symbol: heatTolerance ? (toleranceSymbol[heatTolerance] as Symbol) : null,
      value: heatTolerance ? tolerance[heatTolerance] : null,
    },
    {
      label: labels.shadeTolerance,
      symbol: shadeSymbol[effectiveShade] as Symbol,
      value: shade[effectiveShade],
    },
  ];

  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {rows.map((row) => {
        const style = row.symbol ? SYMBOL_STYLE[row.symbol] : UNREGISTERED_STYLE;
        const symbolChar = row.symbol ?? '—';
        const valueLabel = row.value ?? unregistered;
        return (
          <div
            key={row.label}
            className="flex flex-col items-center gap-3 rounded-card border border-line bg-white px-4 py-5 text-center transition-shadow hover:shadow-sm"
          >
            <dt className="text-xs font-medium tracking-wider text-ink-muted">{row.label}</dt>
            <span
              className={`inline-flex size-12 items-center justify-center rounded-full font-serif text-2xl font-bold ${style.badge}`}
              aria-hidden="true"
            >
              {symbolChar}
            </span>
            <dd className={`text-sm font-medium ${style.value}`}>{valueLabel}</dd>
          </div>
        );
      })}
    </dl>
  );
}
