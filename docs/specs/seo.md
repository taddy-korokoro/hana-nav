# SEO 実装

## 各ページのメタデータ（動的生成）

```typescript
// app/spots/[id]/page.tsx
export async function generateMetadata({ params }: { params: { id: string } }) {
  const { data: spot } = await supabase
    .from('spots')
    .select('name, description, location, prefecture:prefectures(name), best_season_start, best_season_end')
    .eq('id', params.id)
    .is('deleted_at', null)
    .single();

  if (!spot) return { title: 'スポットが見つかりません | hana nav' };

  const prefName = (spot.prefecture as any)?.name || '';
  const seasonText = `${spot.best_season_start}月〜${spot.best_season_end}月`;

  return {
    title: `${spot.name}の見頃情報 | hana nav`,
    description: `${prefName}の${spot.name}は${seasonText}が見頃。${spot.description ?? ''}アクセス、見どころ情報をhana navがお届けします。`,
    openGraph: {
      title: `${spot.name}の見頃情報`,
      description: spot.description ?? '',
      type: 'article',
      images: [/* OGP画像URL */],
    },
  };
}
```

## ルートレイアウトのデフォルトメタデータ

```typescript
// app/layout.tsx
export const metadata: Metadata = {
  title: {
    default: '花ナビ | 全国花畑・絶景スポット検索',
    template: '%s | hana nav',
  },
  description: '全国の花畑・絶景スポットを検索できる花ナビ。AI花判定で撮った花を即特定、SNS映えする旅のしおりも生成できます。',
  openGraph: {
    siteName: 'hana nav',
    locale: 'ja_JP',
    type: 'website',
    images: ['/og-default.png'],  // 1200x630px
  },
  twitter: {
    card: 'summary_large_image',
  },
};
```

## サイトマップ（`app/sitemap.ts`）

```typescript
import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data: spots } = await supabase
    .from('spots')
    .select('id, updated_at')
    .eq('is_published', true)
    .is('deleted_at', null);

  const { data: flowers } = await supabase
    .from('flowers')
    .select('id, updated_at')
    .is('deleted_at', null);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://hananav.example.com';

  return [
    { url: baseUrl, lastModified: new Date(), priority: 1.0 },
    { url: `${baseUrl}/spots`, lastModified: new Date(), priority: 0.9 },
    { url: `${baseUrl}/flowers`, lastModified: new Date(), priority: 0.8 },
    { url: `${baseUrl}/identify`, lastModified: new Date(), priority: 0.7 },
    ...(spots ?? []).map(s => ({
      url: `${baseUrl}/spots/${s.id}`,
      lastModified: new Date(s.updated_at),
      priority: 0.7,
    })),
    ...(flowers ?? []).map(f => ({
      url: `${baseUrl}/flowers/${f.id}`,
      lastModified: new Date(f.updated_at),
      priority: 0.6,
    })),
    ...Array.from({ length: 47 }, (_, i) => ({
      url: `${baseUrl}/areas/${i + 1}`,
      lastModified: new Date(),
      priority: 0.6,
    })),
  ];
}
```

## robots.txt（`app/robots.ts`）

```typescript
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/auth/', '/mypage/'],
      },
    ],
    sitemap: `${process.env.NEXT_PUBLIC_BASE_URL}/sitemap.xml`,
  };
}
```

## 構造化データ（JSON-LD、時間あれば）

```typescript
// app/spots/[id]/page.tsx 内
function SpotJsonLd({ spot }: { spot: Spot }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TouristAttraction',
    name: spot.name,
    description: spot.description,
    address: {
      '@type': 'PostalAddress',
      addressRegion: spot.prefecture?.name,
      streetAddress: spot.location,
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
```

## SEO実装上の注意点

| ポイント | 注意点 |
|---|---|
| `alt`属性 | `images.caption` を `<img alt="">` に設定する |
| 見出し階層 | `<h1>` はページに1つ、`<h2>`, `<h3>` は階層を守る |
| 内部リンク | 関連スポット・関連花への内部リンクを充実させる |
| 重複コンテンツ | 検索結果ページには `noindex` を推奨（クエリパラメータで無限に重複ページが生成されるため） |

---
