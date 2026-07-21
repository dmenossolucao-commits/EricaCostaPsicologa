import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Services from '../components/Services';
import Faqs from '../components/Faqs';
import Contact from '../components/Contact';
import Footer from '../components/Footer';

interface CleanTemplateProps {
  navigate?: (to: string) => void;
}

export default function CleanTemplate({ navigate }: CleanTemplateProps) {
  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-indigo-100 selection:text-indigo-950 antialiased bg-zinc-50 font-sans">
      <Navbar navigate={navigate} />
      <main className="flex-1 space-y-16">
        <Hero />
        <Services />
        <Faqs />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
