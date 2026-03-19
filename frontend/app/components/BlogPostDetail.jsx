'use client';
import { useState } from 'react';
import { useAuthContext } from '../context/AuthContext';
import TerminalCard from './TerminalCard';

export default function BlogPostDetail({ post }) {
  const { user } = useAuthContext();
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(post?.title || '');
  const [content, setContent] = useState(post?.content || '');
  const [saving, setSaving] = useState(false);

  if (!post) return null;

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  const getToken = () => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored)?.token : null;
  };

  const handleDelete = async () => {
    if (!confirm('Delete this post?')) return;
    setDeleting(true);
    try {
      await fetch(`${API_URL}/api/blog/${post.slug}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      window.location.href = '/blog';
    } catch {
      alert('Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/blog/${post.slug}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ title, content }),
      });
      if (!res.ok) throw new Error('Failed to update');
      window.location.reload();
    } catch {
      alert('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <TerminalCard title={`blog://${post.slug}`} className="max-w-3xl mx-auto">
      <div className="flex items-start justify-between mb-4">
        <div>
          {editing ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-2xl sm:text-3xl font-bold w-full mb-2"
            />
          ) : (
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight">{post.title}</h1>
          )}
          <p className="text-xs font-mono text-text-tertiary mt-2">
            {post.createdAt ? new Date(post.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
          </p>
        </div>
        {user && (
          <div className="flex gap-2 shrink-0">
            {editing ? (
              <>
                <button onClick={handleSave} disabled={saving} className="btn-primary !py-1.5 !px-3 text-xs">
                  {saving ? '...' : 'Save'}
                </button>
                <button onClick={() => { setEditing(false); setTitle(post.title); setContent(post.content); }} className="btn-secondary !py-1.5 !px-3 text-xs">
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setEditing(true)} className="btn-secondary !py-1.5 !px-3 text-xs">
                  Edit
                </button>
                <button onClick={handleDelete} disabled={deleting} className="btn-danger !py-1.5 !px-3 text-xs">
                  {deleting ? '...' : 'Delete'}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {editing ? (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={25}
          className="w-full font-mono text-sm bg-bg-primary border border-border-primary rounded-lg p-4 text-text-secondary resize-y"
          placeholder="HTML content..."
        />
      ) : (
        <div
          className="prose prose-invert max-w-none text-text-secondary leading-relaxed [&_a]:text-accent-cyan [&_h2]:text-text-primary [&_h3]:text-text-primary [&_strong]:text-text-primary [&_code]:text-accent-cyan [&_code]:font-mono [&_code]:text-sm [&_code]:bg-bg-primary [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      )}
    </TerminalCard>
  );
}
