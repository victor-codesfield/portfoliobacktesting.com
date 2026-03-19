const BASE_URL = 'https://portfoliobacktesting.com';

export default async function sitemap() {
  const staticPages = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE_URL}/backtester`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/pricing`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/login`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/signup`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/privacy-policy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE_URL}/terms-of-service`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
  ];

  let blogPages = [];
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const res = await fetch(`${apiUrl}/api/blog`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const posts = await res.json();
      blogPages = posts.map((post) => ({
        url: `${BASE_URL}/blog/${post.slug}`,
        lastModified: new Date(post.updatedAt || post.createdAt),
        changeFrequency: 'monthly',
        priority: 0.6,
      }));
    }
  } catch {
    // API unavailable during build — skip blog pages
  }

  return [...staticPages, ...blogPages];
}
