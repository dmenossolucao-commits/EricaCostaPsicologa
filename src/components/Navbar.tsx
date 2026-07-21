import { useState, useEffect } from 'react';
import { Menu, X, Heart, Lock, Calendar, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSiteContent } from '../context/SiteContext';
import { getTenantId } from '../services/contentService';

interface NavbarProps {
  navigate?: (to: string) => void;
}

export default function Navbar({ navigate }: NavbarProps) {
  const { siteContent } = useSiteContent();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  const { name = 'Clínica de Psicologia', logoUrl = '' } = siteContent?.psychologist_info || {};
  const currentTenant = getTenantId();

  const navItems = [
    { id: 'home', label: 'Início' },
    { id: 'sobre', label: 'Quem Somos' },
    { id: 'servicos', label: 'Serviços' },
    { id: 'como-funciona', label: 'Como Funciona' },
    { id: 'depoimentos', label: 'Depoimentos' },
    { id: 'faq', label: 'Dúvidas' },
    { id: 'contato', label: 'Contato' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);

      // Simple active section detection
      const scrollPosition = window.scrollY + 120;
      for (const item of navItems) {
        const el = document.getElementById(item.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(item.id);
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (id: string) => {
    setIsMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; // height of navbar
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    } else if (id === 'agendamento') {
      // Fallback scroll
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
  };

  const handleAdminClick = () => {
    setIsMobileMenuOpen(false);
    const targetPath = currentTenant && currentTenant !== 'mentecare_platform'
      ? `/clinica/${currentTenant}/admin`
      : '/admin';

    if (navigate) {
      navigate(targetPath);
    } else {
      window.history.pushState({}, '', targetPath);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const handleLoginClick = () => {
    setIsMobileMenuOpen(false);
    const targetPath = currentTenant && currentTenant !== 'mentecare_platform'
      ? `/login?tenant=${currentTenant}`
      : '/login';

    if (navigate) {
      navigate(targetPath);
    } else {
      window.history.pushState({}, '', targetPath);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled
            ? 'bg-sand-50/95 backdrop-blur-md shadow-sm border-b border-sand-200/60 py-3'
            : 'bg-sand-50/80 backdrop-blur-xs py-4 border-b border-sand-200/30'
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <a
              href="#home"
              onClick={(e) => {
                e.preventDefault();
                handleNavClick('home');
              }}
              className="flex items-center space-x-2 text-sage-800 font-serif font-bold text-lg md:text-xl shrink-0"
            >
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-8 max-w-[150px] object-contain rounded" referrerPolicy="no-referrer" />
              ) : (
                <>
                  <div className="w-8 h-8 rounded-xl bg-softblue-100 border border-softblue-200 flex items-center justify-center text-softblue-700 shrink-0 shadow-2xs">
                    <Heart className="h-4 w-4 fill-softblue-200" />
                  </div>
                  <span className="truncate max-w-[180px] sm:max-w-xs">{name}</span>
                </>
              )}
            </a>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-6">
              <nav className="flex items-center space-x-6">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`relative text-xs font-semibold tracking-wide transition-colors hover:text-softblue-700 cursor-pointer ${
                      activeSection === item.id ? 'text-softblue-700 font-bold' : 'text-sand-800'
                    }`}
                  >
                    {item.label}
                    {activeSection === item.id && (
                      <motion.div
                        layoutId="activeNavIndicator"
                        className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-softblue-500 rounded-full"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                  </button>
                ))}
              </nav>

              <div className="flex items-center space-x-2 pl-4 border-l border-sand-200">
                {/* Patient Login Button */}
                <button
                  onClick={handleLoginClick}
                  className="border border-sand-300 hover:bg-white text-sand-800 text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs cursor-pointer hover:border-sand-400 flex items-center gap-1.5"
                  title="Acesse sua área de paciente"
                >
                  <UserCheck size={13} className="text-softblue-600" />
                  Entrar
                </button>

                {/* Primary CTA Button: Marcar Sessão */}
                <button
                  onClick={() => handleNavClick('agendamento')}
                  className="bg-softblue-600 hover:bg-softblue-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm hover:shadow-md cursor-pointer hover:scale-[1.02] active:scale-[0.98] flex items-center gap-1.5"
                >
                  <Calendar size={13} />
                  Marcar Sessão
                </button>

                {/* Admin Access Quick Icon/Button */}
                <button
                  onClick={handleAdminClick}
                  className="bg-sand-100 hover:bg-sand-200 text-sand-700 hover:text-sand-900 p-2 rounded-xl transition-all cursor-pointer border border-sand-200"
                  title="Acesso Restrito ao Painel Administrativo (/admin)"
                >
                  <Lock size={13} />
                </button>
              </div>
            </div>

            {/* Mobile / Tablet Controls */}
            <div className="lg:hidden flex items-center space-x-2">
              <button
                onClick={() => handleNavClick('agendamento')}
                className="bg-softblue-600 hover:bg-softblue-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1"
              >
                <Calendar size={12} />
                Marcar Sessão
              </button>

              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-sand-800 hover:text-softblue-700 p-1.5 focus:outline-none bg-white border border-sand-200 rounded-xl shadow-2xs"
                aria-label="Toggle Menu"
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-30 pt-20 bg-sand-50/98 backdrop-blur-lg lg:hidden flex flex-col justify-between overflow-y-auto"
          >
            <div className="px-5 py-6 space-y-2 flex flex-col items-center">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full py-3 text-center text-base font-semibold rounded-xl transition-colors cursor-pointer ${
                    activeSection === item.id
                      ? 'bg-softblue-50 text-softblue-700 font-bold border border-softblue-200/50'
                      : 'text-sand-800 hover:bg-sand-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}

              <div className="w-full pt-4 space-y-2.5 border-t border-sand-200 mt-2">
                <button
                  onClick={handleLoginClick}
                  className="w-full py-3 bg-white border border-sand-300 hover:bg-sand-100 text-center text-sm font-bold rounded-xl transition-colors cursor-pointer text-sand-800 flex items-center justify-center gap-2"
                >
                  <UserCheck size={16} className="text-softblue-600" />
                  Área do Paciente / Entrar
                </button>

                <button
                  onClick={handleAdminClick}
                  className="w-full py-2.5 bg-sand-100 border border-sand-200 text-center text-xs font-bold rounded-xl transition-colors cursor-pointer text-sand-700 flex items-center justify-center gap-2"
                >
                  <Lock size={14} className="text-sand-600" />
                  Painel Administrativo (/admin)
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

