'use client';
import { useState } from 'react';
import { useAuthContext } from '../context/AuthContext';

export default function BlogCreate() {
  const { user } = useAuthContext();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!user) return null;

  const generateSlug = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const stored = localStorage.getItem('user');
      const token = stored ? JSON.parse(stored)?.token : null;
      const res = await fetch(`${API_URL}/api/blog`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, slug: slug || generateSlug(title), content }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create post');
      }
      window.location.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-secondary text-sm">
        + New Post
      </button>
    );
  }

  return (
    <div className="terminal-card p-5 animate-fade-in">
      <h3 className="font-semibold mb-4">Create Blog Post</h3>
      {error && <div className="mb-3 p-2 rounded bg-accent-red/10 border border-accent-red/20 text-xs text-accent-red">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-3">
        <input type="text" value={title} onChange={(e) => { setTitle(e.target.value); if (!slug) setSlug(generateSlug(e.target.value)); }} placeholder="Title" required />
        <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="slug-url" className="font-mono text-sm" />
        <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="HTML content..." rows={6} required />
        <div className="flex gap-2">
          <button type="submit" disabled={loading} className="btn-primary text-sm">{loading ? 'Creating...' : 'Create'}</button>
          <button type="button" onClick={() => setOpen(false)} className="btn-secondary text-sm">Cancel</button>
        </div>
      </form>
    </div>
  );
}
