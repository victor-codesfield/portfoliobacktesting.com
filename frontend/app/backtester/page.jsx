'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthContext } from '../context/AuthContext';
import { portfolioAPI } from '../lib/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import GenerationsManager from '../components/GenerationsManager';

export default function BacktesterPage() {
  const { user, ready } = useAuthContext();
  const router = useRouter();
  const [generations, setGenerations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ready && !user) {
      router.push('/signup?redirect=/backtester');
    }
  }, [user, ready, router]);

  useEffect(() => {
    if (!user) return;
    portfolioAPI.getGenerations()
      .then((data) => setGenerations(data.generations || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const handleDelete = async (id) => {
    try {
      await portfolioAPI.deleteGeneration(id);
      setGenerations((prev) => prev.filter((g) => g._id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  if (!ready || !user) {
    return (
      <>
        <Navbar />
        <main className="pt-24 min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-accent-cyan/30 border-t-accent-cyan rounded-full animate-spin" />
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16 min-h-screen px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Your Portfolios</h1>
              <p className="text-sm text-text-secondary mt-1">
                {generations.length}/10 portfolio slots used
              </p>
            </div>
            {generations.length < 10 && (
              <Link href="/backtester/new" className="btn-primary no-underline">
                + New Portfolio
              </Link>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="terminal-card p-4 h-36 animate-pulse" />
              ))}
            </div>
          ) : (
            <GenerationsManager
              generations={generations}
              onSelect={(id) => router.push(`/backtester/${id}`)}
              onDelete={handleDelete}
            />
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
