import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import BlogPostDetail from '../../components/BlogPostDetail';

export const dynamic = 'force-dynamic';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function getPost(slug) {
  try {
    const res = await fetch(`${API_URL}/api/blog/${slug}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: 'Post Not Found' };
  return {
    title: `${post.title} | Portfolio Backtester Blog`,
    description: post.content?.replace(/<[^>]*>/g, '').slice(0, 160),
  };
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const post = await getPost(slug);

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16 min-h-screen px-4">
        {post ? (
          <BlogPostDetail post={post} />
        ) : (
          <div className="max-w-3xl mx-auto terminal-card p-8 text-center">
            <p className="text-text-secondary">Post not found</p>
          </div>
        )}
      </main>
      <Footer />

      {post && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Article',
              headline: post.title,
              datePublished: post.createdAt,
              dateModified: post.updatedAt,
            }),
          }}
        />
      )}
    </>
  );
}
