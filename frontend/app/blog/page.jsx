import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BlogCreate from '../components/BlogCreate';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getPosts() {
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const res = await fetch(`${API_URL}/api/blog`, { cache: 'no-store' });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

function stripHTML(html) {
  return html?.replace(/<[^>]*>/g, '').slice(0, 200) || '';
}

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16 min-h-screen px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">Blog</h1>
            <BlogCreate />
          </div>

          {posts.length === 0 ? (
            <div className="terminal-card p-8 text-center">
              <p className="text-text-secondary">No blog posts yet</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {posts.map((post) => (
                <Link
                  key={post._id}
                  href={`/blog/${post.slug}`}
                  className="terminal-card p-5 block no-underline group"
                >
                  <h2 className="text-lg font-semibold text-text-primary group-hover:text-accent-cyan transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-xs font-mono text-text-tertiary mt-1 mb-2">
                    {post.createdAt ? new Date(post.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                  </p>
                  <p className="text-sm text-text-secondary leading-relaxed line-clamp-2">
                    {stripHTML(post.content)}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
