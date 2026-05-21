import type { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const [spotsRes, flowersRes] = await Promise.all([
    supabase.from('spots').select('id, updated_at').eq('is_published', true).is('deleted_at', null),
    supabase.from('flowers').select('id, updated_at').is('deleted_at', null),
  ]);

  if (spotsRes.error) {
    console.error('[sitemap] failed to fetch spots', spotsRes.error);
  }
  if (flowersRes.error) {
    console.error('[sitemap] failed to fetch flowers', flowersRes.error);
  }

  const now = new Date();

  const staticPaths: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: now, priority: 1.0, changeFrequency: 'daily' },
    { url: `${baseUrl}/spots`, lastModified: now, priority: 0.9, changeFrequency: 'daily' },
    { url: `${baseUrl}/flowers`, lastModified: now, priority: 0.8, changeFrequency: 'weekly' },
    { url: `${baseUrl}/identify`, lastModified: now, priority: 0.7, changeFrequency: 'monthly' },
    { url: `${baseUrl}/terms`, lastModified: now, priority: 0.3, changeFrequency: 'yearly' },
    { url: `${baseUrl}/privacy`, lastModified: now, priority: 0.3, changeFrequency: 'yearly' },
    { url: `${baseUrl}/legal`, lastModified: now, priority: 0.3, changeFrequency: 'yearly' },
  ];

  const spotEntries: MetadataRoute.Sitemap = (spotsRes.data ?? []).map((s) => ({
    url: `${baseUrl}/spots/${s.id}`,
    lastModified: s.updated_at ? new Date(s.updated_at) : now,
    priority: 0.7,
    changeFrequency: 'weekly',
  }));

  const flowerEntries: MetadataRoute.Sitemap = (flowersRes.data ?? []).map((f) => ({
    url: `${baseUrl}/flowers/${f.id}`,
    lastModified: f.updated_at ? new Date(f.updated_at) : now,
    priority: 0.6,
    changeFrequency: 'monthly',
  }));

  const areaEntries: MetadataRoute.Sitemap = Array.from({ length: 47 }, (_, i) => ({
    url: `${baseUrl}/areas/${i + 1}`,
    lastModified: now,
    priority: 0.6,
    changeFrequency: 'weekly',
  }));

  return [...staticPaths, ...spotEntries, ...flowerEntries, ...areaEntries];
}
