import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { onAuthStateChanged, User, signOut, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc, collection, getDocs, setDoc } from 'firebase/firestore';
import { contentService, SiteContent, logAuditAction, getTenantId } from '../services/contentService';
import { BlogPost, Tenant, License } from '../types';
import { PSYCHOLOGIST_INFO, SERVICES, PROCESS_STEPS, FAQS, TESTIMONIALS, BLOG_POSTS } from '../data';

export interface Operator {
  operatorId: string;
  operatorName: string;
  companyId: string;
}

export interface CashRegisterState {
  isOpen: boolean;
  openedAt?: number;
  openedBy?: string;
  initialValue?: number;
}

export interface SessionTheme {
  primaryColor: string;
  backgroundColor: string;
  fontFamily: string;
}

interface SiteContextType {
  // --- SessionManager Specs ---
  user: User | null;
  loading: boolean;
  activeCompanyId: string;
  company: Tenant | null;
  permissions: {
    role: 'master' | 'admin' | 'colaborador' | 'paciente' | 'operator' | 'viewer';
    tenantId?: string;
    status?: string;
    plano?: string;
    features: string[];
  } | null;
  operator: Operator | null;
  cashRegister: CashRegisterState | null;
  theme: SessionTheme;
  
  // Session Actions
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  switchCompany: (companyId: string) => Promise<void>;
  setOperator: (operator: Operator | null) => void;
  setCashRegister: (state: CashRegisterState | null) => void;
  setTheme: (theme: Partial<SessionTheme>) => void;
  
  // --- CMS Content Specs ---
  siteContent: SiteContent;
  blogPosts: BlogPost[];
  isPreview: boolean;
  setIsPreview: (preview: boolean) => void;
  refreshContent: (forcePreview?: boolean) => Promise<void>;
  refreshBlog: () => Promise<void>;
  updateSiteContent: (content: Partial<SiteContent>) => Promise<void>;
  updateBlogPosts: (posts: BlogPost[]) => Promise<void>;
  publishContent: (changeDescription: string) => Promise<void>;
  cancelDraftChanges: () => Promise<void>;
  isDesignerMode: boolean;
  setIsDesignerMode: (isDesigner: boolean) => void;
  selectedElementId: string;
  setSelectedElementId: (id: string) => void;
}

const DEFAULT_CONTENT: SiteContent = {
  psychologist_info: {
    ...PSYCHOLOGIST_INFO,
    facebookUrl: "https://facebook.com/___________",
    officeHours: "Segunda a Sexta, das 08:00 às 20:00",
    footerText: "MenteCare Enterprise - Sistema de Gestão de Consultórios e Clínicas de Psicologia.",
    whatsappMessage: "Olá! Gostaria de agendar uma consulta.",
    heroImageUrl: "",
    aboutImageUrl: "",
    logoUrl: ""
  },
  services: SERVICES,
  process_steps: PROCESS_STEPS,
  faqs: FAQS,
  testimonials: TESTIMONIALS,
  appearance: {
    primaryColor: "#9c584e", // softblue-600
    backgroundColor: "#faf9f6", // sand-50
    backgroundImageUrl: "",
    logoUrl: ""
  },
  seo: {
    title: "MenteCare Enterprise | Prontuário Eletrônico e Gestão Clínica",
    description: "Plataforma SaaS de gestão de consultórios e clínicas de psicologia com prontuário eletrônico criptografado, teleconsulta integrada, faturamento e CMS customizável.",
    keywords: "psicologia, consultorio, prontuario eletronico, clinica, mentecare, gestao clinica"
  }
};

const MASTER_EMAILS = [
  'dmenossolucao@gmail.com',
  'd-briciod2@hotmail.com'
];

const SiteContext = createContext<SiteContextType | undefined>(undefined);

export const SiteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPreview, setIsPreview] = useState(() => {
    return window.location.search.includes('preview=true') || sessionStorage.getItem('cms_preview_mode') === 'true';
  });
  
  const [siteContent, setSiteContent] = useState<SiteContent>(DEFAULT_CONTENT);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(BLOG_POSTS);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  
  // --- Session States ---
  const [activeCompanyId, setActiveCompanyId] = useState<string>(() => getTenantId());
  const [company, setCompany] = useState<Tenant | null>(null);
  const [permissions, setPermissions] = useState<{
    role: 'master' | 'admin' | 'colaborador' | 'paciente' | 'operator' | 'viewer';
    tenantId?: string;
    status?: string;
    plano?: string;
    features: string[];
  } | null>(null);
  const [operator, setOperatorState] = useState<Operator | null>(null);
  const [cashRegister, setCashRegisterState] = useState<CashRegisterState | null>(null);
  const [theme, setThemeState] = useState<SessionTheme>({
    primaryColor: '#9c584e',
    backgroundColor: '#faf9f6',
    fontFamily: 'Poppins'
  });

  // Designer Mode State
  const [isDesignerMode, setIsDesignerMode] = useState(false);
  const [selectedElementId, setSelectedElementId] = useState('');

  const prevUserRef = useRef<User | null>(null);

  // Load and refresh content of active company
  const refreshContent = async (forcePreview?: boolean) => {
    try {
      const activePreview = forcePreview !== undefined ? forcePreview : isPreview;
      const data = await contentService.getSiteContent(activePreview);
      setSiteContent(data);
      
      // Update theme from appearance properties
      if (data.appearance) {
        setThemeState(prev => ({
          ...prev,
          primaryColor: data.appearance.primaryColor || '#2563eb',
          backgroundColor: data.appearance.backgroundColor || '#f8fafc'
        }));
      }

      // Update dynamic document head attributes on the fly
      if (data.seo?.title) {
        document.title = data.seo.title;
      }
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc && data.seo?.description) {
        metaDesc.setAttribute('content', data.seo.description);
      }
      
      // Update favicon on the fly
      const faviconUrl = (data.appearance as any)?.faviconUrl || (data.psychologist_info as any)?.faviconUrl;
      if (faviconUrl) {
        let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.head.appendChild(link);
        }
        link.href = faviconUrl;
      }
    } catch (err) {
      console.error("Error refreshing site content:", err);
    }
  };

  const refreshBlog = async () => {
    try {
      const data = await contentService.getBlogPosts();
      setBlogPosts(data);
    } catch (err) {
      console.error("Error refreshing blog posts:", err);
    }
  };

  // Fetch details of active tenant / company
  const fetchCompanyDetails = async (tenantId: string) => {
    try {
      const tenantsList = await contentService.getTenants();
      const current = tenantsList.find(t => t.id === tenantId);
      if (current) {
        setCompany(current);
      } else {
        setCompany({
          id: tenantId,
          name: tenantId === 'mentecare_platform' ? 'MenteCare Enterprise' : tenantId,
          subdomain: tenantId,
          ownerEmail: '',
          status: 'Ativo',
          createdAt: Date.now()
        });
      }
    } catch (err) {
      console.error("Error loading company details:", err);
    }
  };

  // Load operator & cash register safely isolated by companyId
  const loadLocalSessionData = (companyId: string) => {
    try {
      const savedOperator = localStorage.getItem(`operator_${companyId}`);
      if (savedOperator) {
        setOperatorState(JSON.parse(savedOperator));
      } else {
        setOperatorState(null);
      }

      const savedCash = localStorage.getItem(`cash_register_${companyId}`);
      if (savedCash) {
        setCashRegisterState(JSON.parse(savedCash));
      } else {
        setCashRegisterState(null);
      }
    } catch (e) {
      console.error("Failed to load local session data:", e);
    }
  };

  // Login handler
  const login = async (emailInput: string, passwordInput: string) => {
    const emailLower = emailInput.trim().toLowerCase();
    const userCredential = await signInWithEmailAndPassword(auth, emailLower, passwordInput);
    return userCredential.user;
  };

  // Logout handler
  const logout = async () => {
    try {
      if (user) {
        await logAuditAction('LOGOUT', `Usuário ${user.email || user.uid} encerrou a sessão.`);
      }
      
      const currentTenant = getTenantId();

      // Clear master override session
      sessionStorage.removeItem('master_email');
      
      // Perform Firebase Sign Out
      await signOut(auth);
      
      // Clean up sensitive session caches but NOT general metadata
      localStorage.removeItem(`operator_${currentTenant}`);
      localStorage.removeItem(`cash_register_${currentTenant}`);
      localStorage.setItem('active_tenant_id', 'mentecare_platform');
      
      // Clear fallback local caches to prevent visual leak on next visit
      const keysToClear = Object.keys(localStorage);
      keysToClear.forEach(key => {
        if (key.startsWith('fs_fallback_') || key.startsWith('cache_')) {
          localStorage.removeItem(key);
        }
      });

      setUser(null);
      setCompany(null);
      setPermissions(null);
      setOperatorState(null);
      setCashRegisterState(null);
      setActiveCompanyId('mentecare_platform');

      // Trigger navigation back to the public site of the clinic, or main platform page if none
      if (currentTenant && currentTenant !== 'mentecare_platform') {
        window.history.pushState({}, '', `/clinica/${currentTenant}`);
      } else {
        window.history.pushState({}, '', '/');
      }
      window.dispatchEvent(new PopStateEvent('popstate'));
    } catch (err) {
      console.error("Error during logout:", err);
    }
  };

  // Switch Active Tenant (Company) + Clear Cache
  const switchCompany = async (companyId: string) => {
    const cleanCompanyId = companyId.trim().toLowerCase();
    
    // 1. Audit Log of change
    if (user) {
      await logAuditAction('COMPANY_SWITCH', `Troca de empresa: ${activeCompanyId} -> ${cleanCompanyId}`);
    }

    // 2. Erase the active tenant's temporary visual cache to avoid cross-tenant visualization leak
    const keysToClear = Object.keys(localStorage);
    keysToClear.forEach(key => {
      if (key.startsWith('fs_fallback_') || key.startsWith('cache_')) {
        localStorage.removeItem(key);
      }
    });

    // 3. Persist new tenant choice
    localStorage.setItem('active_tenant_id', cleanCompanyId);
    setActiveCompanyId(cleanCompanyId);
    
    // 4. Reload details
    await fetchCompanyDetails(cleanCompanyId);
    loadLocalSessionData(cleanCompanyId);
    await refreshContent();
  };

  const setOperator = (op: Operator | null) => {
    setOperatorState(op);
    if (op) {
      localStorage.setItem(`operator_${activeCompanyId}`, JSON.stringify(op));
    } else {
      localStorage.removeItem(`operator_${activeCompanyId}`);
    }
  };

  const setCashRegister = (state: CashRegisterState | null) => {
    setCashRegisterState(state);
    if (state) {
      localStorage.setItem(`cash_register_${activeCompanyId}`, JSON.stringify(state));
    } else {
      localStorage.removeItem(`cash_register_${activeCompanyId}`);
    }
  };

  const setTheme = (newTheme: Partial<SessionTheme>) => {
    setThemeState(prev => ({
      ...prev,
      ...newTheme
    }));
  };

  // Resolve user permissions dynamically based on roles or Firestore configs
  const resolveUserPermissions = async (currentUser: User) => {
    try {
      const emailLower = (currentUser.email || '').toLowerCase();
      
      let data: any = null;
      let userRole: 'master' | 'admin' | 'colaborador' | 'paciente' | 'operator' | 'viewer' = 'admin';
      let userTenantId = 'erica';
      let userStatus = 'active';
      let userPlano = 'Starter';

      if (MASTER_EMAILS.includes(emailLower)) {
        userRole = 'master';
        userTenantId = 'mentecare_platform';
        userStatus = 'active';
        userPlano = 'Enterprise';

        // Clear any previous session/impersonation/lingering states on Master login
        sessionStorage.removeItem('mente_care_impersonating');
        sessionStorage.removeItem('mente_care_impersonated_tenant_name');

        // Auto-provision Firestore document records with required fields
        try {
          const masterDocData = {
            email: emailLower,
            role: "master",
            status: "active",
            tenantId: "mentecare_platform",
            plan: "enterprise",
            isMaster: true
          };
          const uidDocRef = doc(db, 'admins', currentUser.uid);
          await setDoc(uidDocRef, masterDocData, { merge: true });
          
          const emailDocRef = doc(db, 'admins', emailLower);
          await setDoc(emailDocRef, masterDocData, { merge: true });
        } catch (e) {
          console.error("Error auto-provisioning master user in Firestore:", e);
        }
      } else {
        // Query from /admins/{uid} doc
        const docRef = doc(db, 'admins', currentUser.uid);
        const snap = await getDoc(docRef);
        
        if (snap.exists()) {
          data = snap.data();
        } else {
          // Fallback query by email if UID not matched
          const emailDocRef = doc(db, 'admins', emailLower);
          const emailSnap = await getDoc(emailDocRef);
          if (emailSnap.exists()) {
            data = emailSnap.data();
          }
        }

        if (data) {
          // Identify role, tenantId, status, plano as required
          userRole = data.role || data.profile || 'admin';
          userTenantId = data.tenantId || 'erica';
          userStatus = data.status || 'active';
          userPlano = data.plano || data.plan || 'Starter';
        } else {
          // Try to look up if patient exists in /patients collection
          try {
            const patientsSnap = await getDocs(collection(db, 'patients'));
            let foundPatient: any = null;
            patientsSnap.forEach((doc) => {
              const pData = doc.data();
              if (pData && (pData.email || '').toLowerCase().trim() === emailLower) {
                foundPatient = pData;
              }
            });
            if (foundPatient) {
              userRole = 'paciente';
              userTenantId = foundPatient.tenantId || 'erica';
              userStatus = foundPatient.status || 'active';
              userPlano = 'Starter';
            } else {
              // Fallback default
              userRole = 'paciente';
              userTenantId = 'erica';
              userStatus = 'active';
              userPlano = 'Starter';
            }
          } catch (e) {
            console.error("Error querying patients:", e);
            userRole = 'paciente';
            userTenantId = 'erica';
            userStatus = 'active';
            userPlano = 'Starter';
          }
        }
      }

      setPermissions({
        role: userRole,
        tenantId: userTenantId,
        status: userStatus,
        plano: userPlano,
        features: userRole === 'master'
          ? ['dashboard', 'perfil', 'fotos', 'agenda', 'pacientes', 'mensagens', 'blog', 'pagamentos', 'configuracoes', 'minhaconta', 'seguranca', 'cms', 'designer', 'multiempresa']
          : userRole === 'admin'
          ? ['dashboard', 'perfil', 'fotos', 'agenda', 'pacientes', 'mensagens', 'blog', 'pagamentos', 'configuracoes', 'minhaconta', 'seguranca', 'cms', 'designer', 'multiempresa']
          : userRole === 'colaborador'
          ? ['dashboard', 'agenda', 'pacientes']
          : userRole === 'paciente'
          ? ['portal']
          : ['dashboard']
      });

      // Synchronize active_tenant_id and activeCompanyId ONLY as internal cache post-login
      // (Never decides initial public page)
      localStorage.setItem('active_tenant_id', userTenantId);
      setActiveCompanyId(userTenantId);
      await fetchCompanyDetails(userTenantId);
      loadLocalSessionData(userTenantId);
      await refreshContent();
    } catch (err) {
      console.error("Error resolving user permissions:", err);
      // Fail-safe to viewer
      setPermissions({
        role: 'viewer',
        features: ['dashboard']
      });
    }
  };

  useEffect(() => {
    // Sync current activeTenantId from localStorage
    const savedTenant = getTenantId();
    setActiveCompanyId(savedTenant);
    fetchCompanyDetails(savedTenant);
    loadLocalSessionData(savedTenant);

    // Load initial site content & blog list
    Promise.all([refreshContent(), refreshBlog()]).finally(() => {
      setLoading(false);
    });

    // Auth Subscription
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      const prevUser = prevUserRef.current;
      
      let resolvedUser = currentUser;
      const savedMaster = sessionStorage.getItem('master_email');
      if (savedMaster && MASTER_EMAILS.includes(savedMaster) && currentUser) {
        resolvedUser = {
          ...currentUser,
          email: savedMaster,
          uid: currentUser.uid
        } as any;
      }
      
      setUser(resolvedUser);
      prevUserRef.current = resolvedUser;

      if (resolvedUser) {
        // Load permissions for newly logged user
        await resolveUserPermissions(resolvedUser);
        
        if (!prevUser) {
          try {
            await logAuditAction('LOGIN', `Usuário ${resolvedUser.email || resolvedUser.uid} realizou login no painel administrativo.`);
          } catch (e) {}
        }
      } else {
        setPermissions(null);
        localStorage.setItem('active_tenant_id', 'mentecare_platform');
        setActiveCompanyId('mentecare_platform');
        await fetchCompanyDetails('mentecare_platform');
        loadLocalSessionData('mentecare_platform');
        await refreshContent();
        if (prevUser) {
          try {
            await logAuditAction('LOGOUT', `Usuário ${prevUser.email || prevUser.uid} encerrou a sessão.`);
          } catch (e) {}
        }
      }
    });

    return () => unsubscribe();
  }, [isPreview]);

  // Sync site content when tenant ID in URL/location changes
  useEffect(() => {
    const syncTenantFromUrl = () => {
      const currentTenantFromUrl = getTenantId();
      if (currentTenantFromUrl && currentTenantFromUrl !== activeCompanyId) {
        setActiveCompanyId(currentTenantFromUrl);
        fetchCompanyDetails(currentTenantFromUrl);
        loadLocalSessionData(currentTenantFromUrl);
        refreshContent();
        refreshBlog();
      }
    };

    window.addEventListener('popstate', syncTenantFromUrl);
    window.addEventListener('hashchange', syncTenantFromUrl);

    // Polling interval to detect client route changes via pushState on desktop
    const interval = setInterval(syncTenantFromUrl, 800);

    return () => {
      window.removeEventListener('popstate', syncTenantFromUrl);
      window.removeEventListener('hashchange', syncTenantFromUrl);
      clearInterval(interval);
    };
  }, [activeCompanyId]);

  const updateSiteContent = async (content: Partial<SiteContent>) => {
    await contentService.updateSiteContent(content);
    await refreshContent(true);
  };

  const publishContent = async (changeDescription: string) => {
    await contentService.publishDraftContent(changeDescription);
    await refreshContent(isPreview);
  };

  const cancelDraftChanges = async () => {
    await contentService.cancelDraftChanges();
    await refreshContent(true);
  };

  const updateBlogPosts = async (posts: BlogPost[]) => {
    await contentService.updateBlogPostsList(posts);
    await refreshBlog();
  };

  return (
    <SiteContext.Provider value={{
      // --- SessionManager values ---
      user,
      loading,
      activeCompanyId,
      company,
      permissions,
      operator,
      cashRegister,
      theme,
      
      // Session actions
      login,
      logout,
      switchCompany,
      setOperator,
      setCashRegister,
      setTheme,
      
      // --- CMS values ---
      siteContent,
      blogPosts,
      isPreview,
      setIsPreview: (prev) => {
        setIsPreview(prev);
        if (prev) {
          sessionStorage.setItem('cms_preview_mode', 'true');
        } else {
          sessionStorage.removeItem('cms_preview_mode');
        }
      },
      refreshContent,
      refreshBlog,
      updateSiteContent,
      updateBlogPosts,
      publishContent,
      cancelDraftChanges,
      isDesignerMode,
      setIsDesignerMode,
      selectedElementId,
      setSelectedElementId
    }}>
      {children}
    </SiteContext.Provider>
  );
};

export const useSiteContent = () => {
  const context = useContext(SiteContext);
  if (context === undefined) {
    throw new Error('useSiteContent must be used within a SiteProvider');
  }
  return context;
};

// Backwards compatibility and exact requested SessionManager mapping
export const useSession = () => useSiteContent();
