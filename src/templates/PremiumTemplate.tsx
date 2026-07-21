import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import About from '../components/About';
import Benefits from '../components/Benefits';
import Services from '../components/Services';
import HowItWorks from '../components/HowItWorks';
import BookingSection from '../components/BookingSection';
import Faqs from '../components/Faqs';
import Testimonials from '../components/Testimonials';
import Contact from '../components/Contact';
import Footer from '../components/Footer';
import WhatsAppButton from '../components/WhatsAppButton';

interface PremiumTemplateProps {
  navigate?: (to: string) => void;
}

export default function PremiumTemplate({ navigate }: PremiumTemplateProps) {
  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-softblue-200 selection:text-softblue-900 antialiased bg-sand-50">
      <Navbar navigate={navigate} />
      <main className="flex-1 space-y-12 sm:space-y-16">
        <Hero />
        <About />
        <Benefits />
        <Services />
        <HowItWorks />
        <Faqs />
        <Testimonials />
        <BookingSection />
        <Contact />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
