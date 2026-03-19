'use client';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SignupForm from '../components/SignupForm';

export default function SignupPage() {
  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen flex items-center justify-center px-4">
        <SignupForm />
      </main>
      <Footer />
    </>
  );
}
