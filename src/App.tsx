import { useState, useEffect } from 'react';
import { useSiteContent } from './context/SiteContext';
import { getTenantId } from './services/contentService';
import MenteCareLanding from './components/MenteCareSaaS/MenteCareLanding';
import Login from './components/Login';
import Cadastro from './components/Cadastro';
import AdminApp from './components/AdminApp';
import PatientArea from './components/PatientArea';
import ErrorBoundary from './components/ErrorBoundary';

// Import clinical templates for public page rendering
import ModernTemplate from './templates/ModernTemplate';
import CleanTemplate from './templates/CleanTemplate';
import MinimalTemplate from './templates/MinimalTemplate';
import PremiumTemplate from './templates/PremiumTemplate';

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const { siteContent, user, loading, permissions, logout } = useSiteContent();

  const navigate = (to: string) => {
    window.history.pushState({}, '', to);
    setCurrentPath(to);
    window.scrollTo({ top: 0, behavior: 'instant' as any });
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Check if current path or URL hash indicates an admin access request (e.g. /admin, /clinica/xyz/admin, /tenant/xyz/admin, or #admin)
  const isAdminRoute = 
    currentPath === '/admin' ||
    currentPath.startsWith('/admin') ||
    currentPath.endsWith('/admin') ||
    currentPath.endsWith('/admin/') ||
    currentPath.includes('/admin/') ||
    window.location.hash === '#admin';

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#admin') {
        setCurrentPath('/admin');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Sync tenant ID if entering via /clinica/:tenantId/admin or /tenant/:tenantId/admin
  useEffect(() => {
    if (isAdminRoute) {
      const match = currentPath.match(/\/(clinica|tenant)\/([a-zA-Z0-9_-]+)\/admin/);
      if (match && match[2]) {
        localStorage.setItem('active_tenant_id', match[2]);
      }
    }
  }, [currentPath, isAdminRoute]);

  // Check if we are in a clinic/tenant public page context
  const currentTenant = getTenantId();
  const isClinicContext = currentTenant && currentTenant !== 'mentecare_platform';

  // Role-Based Navigation Guards (runs post-login or auth updates)
  useEffect(() => {
    if (user && permissions) {
      if (permissions.role === 'paciente') {
        if (currentPath === '/login' || currentPath === '/cadastro' || isAdminRoute || currentPath === '/master') {
          navigate('/');
        }
      } else if (permissions.role === 'master') {
        // Master admin flow: redirect auth pages to /master, but do NOT redirect '/' or other public pages
        if (currentPath === '/login' || currentPath === '/cadastro' || currentPath === '/admin') {
          navigate('/master');
        }
      } else {
        // Clinic Admin / Colaborador flow: redirect auth pages or raw /admin to /admin/dashboard, but do NOT redirect '/' or '/clinica/*' public pages
        if (currentPath === '/login' || currentPath === '/cadastro' || currentPath === '/admin' || currentPath === '/master') {
          navigate('/admin/dashboard');
        }
      }
    }
  }, [user, permissions, currentPath, isAdminRoute]);

  // Elegant loading screen during auth/permissions initialization
  if (loading || (user && !permissions)) {
    return (
      <div className="min-h-screen bg-sand-50 flex flex-col items-center justify-center text-sand-950 font-sans">
        <div className="relative flex items-center justify-center mb-6">
          <div className="absolute w-20 h-20 rounded-full border-2 border-softblue-500/10 animate-pulse" />
          <div className="absolute w-14 h-14 rounded-full border-t-2 border-b-2 border-softblue-500 animate-spin" />
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-softblue-700 to-dusty-600 flex items-center justify-center font-black text-white text-sm shadow-xl shadow-softblue-500/20">
            MC
          </div>
        </div>
        <div className="flex flex-col items-center space-y-1">
          <span className="text-sm font-serif font-bold tracking-wider text-sand-900 uppercase">MenteCare Enterprise</span>
          <span className="text-[10px] font-mono tracking-widest text-sand-600 uppercase">Carregando permissões de acesso...</span>
        </div>
      </div>
    );
  }

  // Dynamic public template resolver for clinics
  const renderClinicPublicPage = () => {
    const templateName = (siteContent?.appearance as any)?.template || 'modern';
    let templateComponent;
    switch (templateName.toLowerCase()) {
      case 'clean':
        templateComponent = <CleanTemplate navigate={navigate} />;
        break;
      case 'minimal':
        templateComponent = <MinimalTemplate navigate={navigate} />;
        break;
      case 'premium':
        templateComponent = <PremiumTemplate navigate={navigate} />;
        break;
      case 'modern':
      default:
        templateComponent = <ModernTemplate navigate={navigate} />;
        break;
    }
    return (
      <ErrorBoundary fallbackTitle="Página da Clínica">
        {templateComponent}
      </ErrorBoundary>
    );
  };

  // 1. Exclusive Patient Portal
  if (user && permissions?.role === 'paciente') {
    return <PatientArea isOpen={true} onClose={logout} />;
  }

  // 2. Master SaaS Owner Route Guard
  if (currentPath === '/master') {
    if (!user) {
      return <Login navigate={navigate} redirectMessage="Acesso Restrito ao Painel Master. Autentique-se para prosseguir." />;
    }
    if (permissions?.role !== 'master') {
      return (
        <div className="min-h-screen bg-sand-50 flex flex-col items-center justify-center p-4 text-center">
          <h2 className="text-xl font-serif font-bold text-sand-950">Acesso Negado</h2>
          <p className="text-xs text-sand-600 mt-2">Sua conta não possui permissões Master para acessar esta área.</p>
          <button onClick={logout} className="mt-4 px-4 py-2 bg-softblue-600 text-white rounded-xl text-xs font-bold cursor-pointer">
            Sair e Logar como Master
          </button>
        </div>
      );
    }
    // Authenticated as master: Render AdminApp (which defaults to Master Panel view)
    return <AdminApp navigate={navigate} currentPath={currentPath} />;
  }

  // 3. Enforce Protection Route Guard for `/admin` routes (including /clinica/:id/admin and #admin)
  if (isAdminRoute) {
    if (!user) {
      return <Login navigate={navigate} redirectMessage="Autenticação necessária. Faça login para acessar o painel administrativo da clínica." />;
    }
    // Render the enterprise administration panel
    return <AdminApp navigate={navigate} currentPath={currentPath} />;
  }

  // 4. Redirect active session away from Login / Register
  if (currentPath === '/login') {
    if (user) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white font-sans">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <span className="text-xs font-semibold tracking-wider text-slate-400">Sessão ativa detectada. Redirecionando...</span>
        </div>
      );
    }
    return <Login navigate={navigate} />;
  }

  if (currentPath === '/cadastro') {
    if (user) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white font-sans">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <span className="text-xs font-semibold tracking-wider text-slate-400">Sessão ativa detectada. Redirecionando...</span>
        </div>
      );
    }
    return <Cadastro navigate={navigate} />;
  }

  // 5. Site Público da Clínica (accessed via subdomain or path `/clinica/:tenantId`)
  if (isClinicContext && (currentPath === '/' || currentPath.startsWith('/clinica'))) {
    return renderClinicPublicPage();
  }

  // 6. Platform MenteCare Landing Page (Company's institutional portal)
  return <MenteCareLanding navigate={navigate} />;
}
