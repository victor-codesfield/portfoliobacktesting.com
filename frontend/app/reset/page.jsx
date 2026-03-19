'use client';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PasswordResetForm from '../components/PasswordResetForm';

export default function ResetPage() {
  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen flex items-center justify-center px-4">
        <PasswordResetForm />
      </main>
      <Footer />
    </>
  );
}
