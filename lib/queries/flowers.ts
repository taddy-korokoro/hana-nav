import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';

/**
 * 単一花マスター行をリクエスト内でメモ化して返す。
 * `getFlowerDetail` と `getFlowerMeta` が同一ページで同じ id を引くので、
 * `React.cache()` で同一リクエスト内の重複ラウンドトリップを抑える
 * （CLAUDE.md「同一リクエスト内で同じデータを複数コンポーネントから取りたい場合は
 * React.cache() でメモ化する」）。
 *
 * 詳細・メタ両方の用途を満たすよう SELECT は両者の和集合（updated_at まで含む）。
 */
const fetchFlowerRow = cache(async (id: string) => {
  const supabase = await createClient();
  return supabase
    .from('flowers')
    .select(
      'id, name, name_kana, description, default_season_start, default_season_end, updated_at',
    )
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();
});

export type FlowerListItem = {
  id: string;
  name: string;
  nameKana: string | null;
  defaultSeasonStart: number | null;
  defaultSeasonEnd: number | null;
  coverImageUrl: string | null;
};

export type FlowerImage = {
  id: string;
  url: string;
  caption: string | null;
  displayOrder: number;
};

export type FlowerAlias = {
  id: string;
  alias: string;
};

export type FlowerSpot = {
  id: string;
  name: string;
  prefectureName: string;
  bestSeasonStart: number;
  bestSeasonEnd: number;
  coverImageUrl: string | null;
  bloomStartMonth: number | null;
  bloomEndMonth: number | null;
};

export type FlowerDetail = {
  id: string;
  name: string;
  nameKana: string | null;
  description: string | null;
  defaultSeasonStart: number | null;
  defaultSeasonEnd: number | null;
  updatedAt: string;
};

export type FlowerDetailBundle = {
  flower: FlowerDetail;
  aliases: FlowerAlias[];
  images: FlowerImage[];
  spots: FlowerSpot[];
};

/**
 * `/flowers` 一覧用に全花マスター + 代表画像を取得する。
 * 並びは `name_kana NULLS LAST → name`。50 音インデックスは UI 側で `groupFlowersByKana` に流す。
 */
export async function getFlowerList(): Promise<FlowerListItem[]> {
  const supabase = await createClient();

  const { data: flowers, error } = await supabase
    .from('flowers')
    .select('id, name, name_kana, default_season_start, default_season_end')
    .is('deleted_at', null)
    .order('name_kana', { ascending: true, nullsFirst: false })
    .order('name', { ascending: true });

  // CLAUDE.md「データ取得エラーは error.tsx で境界を作る。try/catch で握りつぶして
  // 空配列を返す実装はしない」に従い、DB エラーは上位に投げて error 境界に委ねる。
  // ここで `[]` にすると DB 障害が「花マスター 0 件」の正常表示に化けてしまう。
  if (error) {
    console.error('[getFlowerList] failed to fetch flowers', error);
    throw error;
  }
  if (!flowers || flowers.length === 0) return [];

  const ids = flowers.map((f) => f.id);
  const { data: images, error: imgError } = await supabase
    .from('images')
    .select('owner_id, url, display_order')
    .eq('owner_type', 'flower')
    .in('owner_id', ids)
    .is('deleted_at', null)
    .order('display_order', { ascending: true });
  if (imgError) console.error('[getFlowerList] failed to fetch flower images', imgError);

  const coverByOwner = new Map<string, string>();
  for (const img of images ?? []) {
    if (!coverByOwner.has(img.owner_id)) coverByOwner.set(img.owner_id, img.url);
  }

  return flowers.map((f) => ({
    id: f.id,
    name: f.name,
    nameKana: f.name_kana ?? null,
    defaultSeasonStart: f.default_season_start ?? null,
    defaultSeasonEnd: f.default_season_end ?? null,
    coverImageUrl: coverByOwner.get(f.id) ?? null,
  }));
}

/**
 * 花詳細ページ。本体取得後に aliases / images / 該当スポットを `Promise.all` で並列取得。
 * 未存在 / 論理削除の場合のみ `null` を返し呼び出し側で `notFound()` させる。
 * DB エラーは上位の error 境界に委ねるため `throw` する（404 化させない）。
 */
export async function getFlowerDetail(id: string): Promise<FlowerDetailBundle | null> {
  const { data: row, error } = await fetchFlowerRow(id);

  if (error) {
    console.error('[getFlowerDetail] failed to fetch flower', error);
    throw error;
  }
  if (!row) return null;

  const flower: FlowerDetail = {
    id: row.id,
    name: row.name,
    nameKana: row.name_kana ?? null,
    description: row.description ?? null,
    defaultSeasonStart: row.default_season_start ?? null,
    defaultSeasonEnd: row.default_season_end ?? null,
    updatedAt: row.updated_at,
  };

  const [aliases, images, spots] = await Promise.all([
    fetchAliases(flower.id),
    fetchImages(flower.id),
    fetchSpotsByFlower(flower.id),
  ]);

  return { flower, aliases, images, spots };
}

/**
 * `generateMetadata` 専用の軽量クエリ。詳細用と同じ join を毎回回したくないので分離。
 */
export async function getFlowerMeta(id: string): Promise<{
  name: string;
  nameKana: string | null;
  description: string | null;
  defaultSeasonStart: number | null;
  defaultSeasonEnd: number | null;
  coverImageUrl: string | null;
  spotCount: number;
} | null> {
  const { data, error } = await fetchFlowerRow(id);

  // not-found（!data）と DB エラー（error）を分ける。エラーは上位に投げて metadata
  // 生成失敗が「メタなしで表示」に化けないようにする。
  if (error) {
    console.error('[getFlowerMeta] failed to fetch flower', error);
    throw error;
  }
  if (!data) return null;

  const supabase = await createClient();

  const { data: imageRow } = await supabase
    .from('images')
    .select('url, display_order')
    .eq('owner_type', 'flower')
    .eq('owner_id', data.id)
    .is('deleted_at', null)
    .order('display_order', { ascending: true })
    .limit(1)
    .maybeSingle();

  // 公開済みスポットの件数のみ。RLS が is_published=true を弾くので head カウントで十分
  const { count: spotCount } = await supabase
    .from('spot_flowers')
    .select('spot_id, spot:spots!inner(id, is_published, deleted_at)', {
      count: 'exact',
      head: true,
    })
    .eq('flower_id', data.id)
    .is('deleted_at', null)
    .eq('spot.is_published', true)
    .is('spot.deleted_at', null);

  return {
    name: data.name,
    nameKana: data.name_kana ?? null,
    description: data.description ?? null,
    defaultSeasonStart: data.default_season_start ?? null,
    defaultSeasonEnd: data.default_season_end ?? null,
    coverImageUrl: imageRow?.url ?? null,
    spotCount: spotCount ?? 0,
  };
}

async function fetchAliases(flowerId: string): Promise<FlowerAlias[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('flower_aliases')
    .select('id, alias')
    .eq('flower_id', flowerId)
    .is('deleted_at', null)
    .order('alias', { ascending: true });

  if (error) {
    console.error('[getFlowerDetail] failed to fetch aliases', error);
    throw error;
  }
  return (data ?? []).map((a) => ({ id: a.id, alias: a.alias }));
}

async function fetchImages(flowerId: string): Promise<FlowerImage[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('images')
    .select('id, url, caption, display_order')
    .eq('owner_type', 'flower')
    .eq('owner_id', flowerId)
    .is('deleted_at', null)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('[getFlowerDetail] failed to fetch images', error);
    throw error;
  }
  return (data ?? []).map((img) => ({
    id: img.id,
    url: img.url,
    caption: img.caption ?? null,
    displayOrder: img.display_order,
  }));
}

async function fetchSpotsByFlower(flowerId: string): Promise<FlowerSpot[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('spot_flowers')
    .select(
      `
      bloom_start_month,
      bloom_end_month,
      spot:spots!inner(
        id, name, best_season_start, best_season_end, is_published, deleted_at,
        prefecture:prefectures(name)
      )
    `,
    )
    .eq('flower_id', flowerId)
    .is('deleted_at', null)
    .eq('spot.is_published', true)
    .is('spot.deleted_at', null);

  if (error) {
    console.error('[getFlowerDetail] failed to fetch spots', error);
    throw error;
  }

  type Row = {
    bloom_start_month: number | null;
    bloom_end_month: number | null;
    spot:
      | {
          id: string;
          name: string;
          best_season_start: number;
          best_season_end: number;
          prefecture: { name: string } | { name: string }[] | null;
        }
      | {
          id: string;
          name: string;
          best_season_start: number;
          best_season_end: number;
          prefecture: { name: string } | { name: string }[] | null;
        }[]
      | null;
  };

  const items = (data as unknown as Row[])
    .map((sf) => {
      const spot = Array.isArray(sf.spot) ? sf.spot[0] : sf.spot;
      if (!spot) return null;
      const pref = Array.isArray(spot.prefecture) ? spot.prefecture[0] : spot.prefecture;
      return {
        id: spot.id,
        name: spot.name,
        prefectureName: pref?.name ?? '',
        bestSeasonStart: spot.best_season_start,
        bestSeasonEnd: spot.best_season_end,
        coverImageUrl: null as string | null,
        bloomStartMonth: sf.bloom_start_month ?? null,
        bloomEndMonth: sf.bloom_end_month ?? null,
      } satisfies FlowerSpot;
    })
    .filter((v): v is FlowerSpot => v !== null);

  if (items.length === 0) return [];

  const ids = items.map((s) => s.id);
  const { data: images, error: imgError } = await supabase
    .from('images')
    .select('owner_id, url, display_order')
    .eq('owner_type', 'spot')
    .in('owner_id', ids)
    .is('deleted_at', null)
    .order('display_order', { ascending: true });
  if (imgError) console.error('[getFlowerDetail] failed to fetch related spot images', imgError);

  const coverByOwner = new Map<string, string>();
  for (const img of images ?? []) {
    if (!coverByOwner.has(img.owner_id)) coverByOwner.set(img.owner_id, img.url);
  }

  return items.map((s) => ({ ...s, coverImageUrl: coverByOwner.get(s.id) ?? null }));
}

/**
 * `?alias=...` から `flowers.id` を解決する。
 * 1. `flower_aliases.alias` の完全一致（UNIQUE 制約があるので 1 件に確定）
 * 2. それで無ければ `flowers.name` の完全一致（総称名で来たケース）
 * の順に引き、いずれも当たらなければ `null`。
 *
 * 大文字小文字・全半角の正規化はしない（AI 判定で返ってくる文字列も seed の alias も
 * 表記揺れを `flower_aliases` 側に持たせる方針なので、ここで吸収するとマスター運用の
 * 期待が崩れる）。
 */
export async function findFlowerIdByAlias(alias: string): Promise<string | null> {
  const trimmed = alias.trim();
  if (!trimmed) return null;

  const supabase = await createClient();

  const { data: aliasRow, error: aliasError } = await supabase
    .from('flower_aliases')
    .select('flower_id, flower:flowers!inner(id, deleted_at)')
    .eq('alias', trimmed)
    .is('deleted_at', null)
    .is('flower.deleted_at', null)
    .maybeSingle();

  // alias / flower 名どちらの lookup もエラー時は throw（DB 障害を「該当なし」表示に
  // 化けさせない）。null を返すのは「実際に該当が見つからなかった」場合のみ。
  if (aliasError) {
    console.error('[findFlowerIdByAlias] failed to resolve alias', aliasError);
    throw aliasError;
  }
  if (aliasRow?.flower_id) return aliasRow.flower_id;

  const { data: flowerRow, error: flowerError } = await supabase
    .from('flowers')
    .select('id')
    .eq('name', trimmed)
    .is('deleted_at', null)
    .maybeSingle();

  if (flowerError) {
    console.error('[findFlowerIdByAlias] failed to resolve flower name', flowerError);
    throw flowerError;
  }
  return flowerRow?.id ?? null;
}

// =====================================================================================
// 50 音グルーピング
// =====================================================================================

/**
 * 50 音インデックスの行ラベル。`他` は読み仮名が無い・かな範囲外（漢字・記号）の落とし先。
 * UI からはこの順序で順番にレンダリングし、ラベルをアンカーリンクの target にする。
 */
export const KANA_GROUP_LABELS = [
  'あ',
  'か',
  'さ',
  'た',
  'な',
  'は',
  'ま',
  'や',
  'ら',
  'わ',
  '他',
] as const;

export type KanaGroupLabel = (typeof KANA_GROUP_LABELS)[number];

export type FlowerKanaGroup = {
  label: KanaGroupLabel;
  flowers: FlowerListItem[];
};

const KANA_RANGES: Record<Exclude<KanaGroupLabel, '他'>, [number, number]> = {
  あ: [0x3042, 0x304a], // あ〜お
  か: [0x304b, 0x3054], // か〜ご（濁点含む）
  さ: [0x3055, 0x305e], // さ〜ぞ
  た: [0x305f, 0x3069], // た〜ど
  な: [0x306a, 0x306e], // な〜の
  は: [0x306f, 0x307d], // は〜ぽ（半濁点含む）
  ま: [0x307e, 0x3082], // ま〜も
  や: [0x3083, 0x3088], // ゃ〜よ
  ら: [0x3089, 0x308d], // ら〜ろ
  わ: [0x308e, 0x3093], // ゎ〜ん
};

function classifyKana(nameKana: string | null): KanaGroupLabel {
  if (!nameKana) return '他';
  // 先頭の小書き文字（ぁ・ぃ 等）も大文字側にまとめたいので codePointAt をそのまま使う
  const code = nameKana.codePointAt(0);
  if (code === undefined) return '他';
  for (const [label, [lo, hi]] of Object.entries(KANA_RANGES) as Array<
    [Exclude<KanaGroupLabel, '他'>, [number, number]]
  >) {
    if (code >= lo && code <= hi) return label;
  }
  return '他';
}

/**
 * 一覧（`getFlowerList` の戻り）を 50 音行ラベルでグルーピングする。
 * 並び順は `KANA_GROUP_LABELS` のとおり。空グループは除外する。
 */
export function groupFlowersByKana(flowers: FlowerListItem[]): FlowerKanaGroup[] {
  const buckets = new Map<KanaGroupLabel, FlowerListItem[]>();
  for (const label of KANA_GROUP_LABELS) buckets.set(label, []);
  for (const f of flowers) buckets.get(classifyKana(f.nameKana))!.push(f);
  return KANA_GROUP_LABELS.map((label) => ({
    label,
    flowers: buckets.get(label) ?? [],
  })).filter((g) => g.flowers.length > 0);
}
