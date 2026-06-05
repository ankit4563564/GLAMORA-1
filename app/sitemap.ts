import { MetadataRoute } from 'next';
import { getSalons } from '@/lib/salons';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const salons = await getSalons();
  const salonEntries = salons.map((s) => ({
    url: `https://glamora-bangalore.vercel.app/salons/${s._id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [
    {
      url: 'https://glamora-bangalore.vercel.app',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'https://glamora-bangalore.vercel.app/salons',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: 'https://glamora-bangalore.vercel.app/beauty-ai',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://glamora-bangalore.vercel.app/agent',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    ...salonEntries,
  ];
}
