import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import About from '../components/About';
import Benefits from '../components/Benefits';
import Services from '../components/Services';
import HowItWorks from '../components/HowItWorks';
import Testimonials from '../components/Testimonials';
import Faqs from '../components/Faqs';
import BookingSection from '../components/BookingSection';
import Contact from '../components/Contact';
import Footer from '../components/Footer';
import WhatsAppButton from '../components/WhatsAppButton';

interface ModernTemplateProps {
  navigate?: (to: string) => void;
}

export default function ModernTemplate({ navigate }: ModernTemplateProps) {
  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-teal-200 selection:text-teal-900 antialiased bg-slate-50 font-sans">
      <Navbar navigate={navigate} />
      <main className="flex-1 space-y-16">
        <Hero />
        <About />
        <Benefits />
        <Services />
        <HowItWorks />
        <Testimonials />
        <Faqs />
        <BookingSection />
        <Contact />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}

