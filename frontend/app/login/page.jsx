'use client';
import { Suspense } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import LoginForm from '../components/LoginForm';

export default function LoginPage() {
  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen flex items-center justify-center px-4">
        <Suspense fallback={<div className="w-full max-w-md h-80 terminal-card animate-pulse" />}>
          <LoginForm />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
