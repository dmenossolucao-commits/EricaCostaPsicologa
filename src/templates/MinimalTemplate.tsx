import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import About from '../components/About';
import Contact from '../components/Contact';
import Footer from '../components/Footer';

interface MinimalTemplateProps {
  navigate?: (to: string) => void;
}

export default function MinimalTemplate({ navigate }: MinimalTemplateProps) {
  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-sand-200 selection:text-sand-900 antialiased bg-stone-50 font-sans">
      <Navbar navigate={navigate} />
      <main className="flex-1 space-y-16">
        {/* Simple Minimal Hero */}
        <Hero />
        <About />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
