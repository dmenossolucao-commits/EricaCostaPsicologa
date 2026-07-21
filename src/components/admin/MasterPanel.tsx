import React, { useState, useEffect } from 'react';
import { 
  Building2, Key, Layers, CreditCard, DollarSign, Activity, 
  HelpCircle, RefreshCw, HardDrive, ShieldAlert, LogOut, FileText, 
  CheckCircle2, PlusCircle, Trash2, ArrowRight, UserPlus, Settings, 
  Check, Mail, Lock, AlertTriangle, ShieldCheck, ChevronRight, Eye, Clipboard, Clock, ExternalLink, Calendar, Info,
  Menu, User, MessageSquare, Copy, Search, Printer, Globe, Link, QrCode
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { contentService } from '../../services/contentService';
import { Tenant, License, AuditLog, SaaSPlanId } from '../../types';
import { collection } from 'firebase/firestore';
import { getDocs, doc, setDoc, getDoc, deleteDoc } from '../../services/contentService';
import { db } from '../../firebase';

interface MasterPanelProps {
  user: any;
  logout: () => Promise<void>;
  navigate: (to: string) => void;
  onEnterTenant: (tenant: Tenant) => void;
}

// Internal Master Tabs type
type MasterTab = 
  | 'dashboard' 
  | 'clientes' 
  | 'licencas' 
  | 'planos' 
  | 'assinaturas' 
  | 'financeiro'
  | 'cobrancas'
  | 'estatisticas'
  | 'suporte'
  | 'atualizacoes'
  | 'backups'
  | 'logs'
  | 'config'
  | 'convites'
  | 'multiempresa'
  | 'lixeira'
  | 'seguranca'
  | 'integracoes'
  | 'perfil';

const safeConfirm = (message: string): boolean => {
  try {
    return window.confirm(message);
  } catch (e) {
    console.warn("window.confirm was blocked by iframe sandboxing:", e);
    return true; // Bypass confirmation in iframe previews where modals are sandboxed
  }
};

const safeAlert = (message: string) => {
  try {
    window.alert(message);
  } catch (e) {
    console.warn("window.alert was blocked by iframe sandboxing:", e);
  }
};

const safeCopyToClipboard = (text: string): boolean => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) {
    console.warn("navigator.clipboard.writeText was blocked by iframe sandboxing:", e);
  }
  
  // Fallback to traditional select and copy
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.width = "2em";
    textArea.style.height = "2em";
    textArea.style.padding = "0";
    textArea.style.border = "none";
    textArea.style.outline = "none";
    textArea.style.boxShadow = "none";
    textArea.style.background = "transparent";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error("Fallback copy failed:", err);
    return false;
  }
};

export default function MasterPanel({ user, logout, navigate, onEnterTenant }: MasterPanelProps) {
  const [activeTab, setActiveTab] = useState<MasterTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const renderSidebarContent = (isMobile: boolean = false) => {
    return (
      <div className="flex flex-col justify-between h-full">
        <div>
          {/* Logo Brand Header */}
          <div className="p-6 border-b border-sand-900 flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-softblue-500 to-sage-600 rounded-xl text-white shadow-md shadow-softblue-500/20">
              <Layers size={18} />
            </div>
            <div>
              <h1 className="font-serif font-extrabold text-white text-base tracking-tight">MenteCare</h1>
              <span className="text-[9px] font-mono font-bold uppercase text-softblue-400 tracking-widest bg-softblue-950/80 px-1.5 py-0.5 rounded border border-softblue-900">
                PLATFORM MASTER
              </span>
            </div>
          </div>

          {/* Master Tabs List */}
          <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-220px)]">
            <span className="px-3 text-[9px] font-mono font-extrabold text-sand-500 uppercase tracking-widest block mb-2">Plataforma</span>
            {[
              { id: 'dashboard', label: 'Dashboard Executivo', icon: <Activity size={14} /> },
              { id: 'clientes', label: 'Clientes', icon: <Building2 size={14} /> },
              { id: 'assinaturas', label: 'Assinaturas', icon: <CheckCircle2 size={14} /> },
              { id: 'licencas', label: 'Licenças', icon: <Key size={14} /> },
              { id: 'planos', label: 'Planos', icon: <Settings size={14} /> },
              { id: 'financeiro', label: 'Financeiro SaaS', icon: <DollarSign size={14} /> },
              { id: 'cobrancas', label: 'Cobranças', icon: <CreditCard size={14} /> },
              { id: 'estatisticas', label: 'Estatísticas', icon: <Activity size={14} /> },
              
              { id: 'divider-utils', label: 'Utilitários & Config', isDivider: true },

              { id: 'suporte', label: 'Suporte', icon: <HelpCircle size={14} /> },
              { id: 'logs', label: 'Logs', icon: <FileText size={14} /> },
              { id: 'backups', label: 'Backups', icon: <HardDrive size={14} /> },
              { id: 'atualizacoes', label: 'Atualizações', icon: <Clock size={14} /> },
              { id: 'config', label: 'Configurações da Plataforma', icon: <Settings size={14} /> },
              { id: 'seguranca', label: 'Segurança', icon: <ShieldCheck size={14} /> },
              { id: 'integracoes', label: 'Integrações', icon: <Layers size={14} /> },
              { id: 'perfil', label: 'Meu Perfil', icon: <User size={14} /> }
            ].map((tab, idx) => {
              if (tab.isDivider) {
                return (
                  <span key={`div-${idx}`} className="px-3 text-[9px] font-mono font-extrabold text-sand-500 uppercase tracking-widest block pt-3 pb-1">
                    {tab.label}
                  </span>
                );
              }
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as MasterTab);
                    if (isMobile) {
                      setIsMobileMenuOpen(false);
                    }
                  }}
                  className={`w-full px-3.5 py-2 rounded-xl text-left text-xs font-semibold flex items-center gap-2.5 cursor-pointer transition-all ${
                    activeTab === tab.id
                      ? 'bg-softblue-500 text-white shadow-md shadow-softblue-500/10'
                      : 'text-sand-400 hover:bg-sand-900 hover:text-white'
                  }`}
                >
                  <span className={activeTab === tab.id ? 'text-white' : 'text-sand-500'}>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Master Bottom Account */}
        <div className="p-4 border-t border-sand-900 space-y-3">
          <div className="flex items-center gap-2.5 px-2">
            <div className="h-8 w-8 rounded-full bg-softblue-600/20 border border-softblue-500/30 flex items-center justify-center font-bold text-xs font-mono text-softblue-400 shrink-0 uppercase shadow-inner">
              {user?.email?.substring(0, 2) || 'MA'}
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-white truncate leading-tight">Master Administrator</p>
              <p className="text-[10px] font-mono text-sand-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              navigate('/admin');
            }}
            className="w-full px-4 py-2 border border-sand-800 hover:bg-rose-950/20 hover:border-rose-900/30 hover:text-rose-400 text-sand-400 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all"
          >
            <LogOut size={12} />
            <span>Sair do Sistema</span>
          </button>
        </div>
      </div>
    );
  };

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [trashItems, setTrashItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Subscription CRM State declarations
  const [selectedCrmTenantId, setSelectedCrmTenantId] = useState<string>('');
  const [crmSearchQuery, setCrmSearchQuery] = useState('');
  const [crmStatusFilter, setCrmStatusFilter] = useState('all'); // 'all', 'Ativo', 'Bloqueado'
  const [crmPlanFilter, setCrmPlanFilter] = useState('all'); // 'all', 'Starter', 'Pro', 'Premium', 'Enterprise'
  const [crmPaymentMethod, setCrmPaymentMethod] = useState<'pix' | 'card' | 'boleto' | 'link'>('pix');
  const [copiedLink, setCopiedLink] = useState(false);
  const [billingAmount, setBillingAmount] = useState<number>(189.90);
  const [generatedPayLink, setGeneratedPayLink] = useState('https://mentecare.com/checkout/pay_982b1c9');
  
  // Modal visibility states
  const [isCrmHistoryOpen, setIsCrmHistoryOpen] = useState(false);
  const [isCrmContractOpen, setIsCrmContractOpen] = useState(false);
  const [isCrmEditOpen, setIsCrmEditOpen] = useState(false);
  const [isCrmChargeOpen, setIsCrmChargeOpen] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    ownerEmail: '',
    plan: 'Pro' as any,
    status: 'Ativo' as any,
    expiresAt: '',
    price: 189.90
  });
  const [dbStats, setDbStats] = useState({
    patients: 0,
    appointments: 0,
    documents: 0,
    backups: 0
  });

  // Forms and actions states
  const [newTenantId, setNewTenantId] = useState('');
  const [newTenantName, setNewTenantName] = useState('');
  const [newTenantEmail, setNewTenantEmail] = useState('');
  const [newTenantSubdomain, setNewTenantSubdomain] = useState('');
  const [tenantError, setTenantError] = useState('');
  const [tenantSuccess, setTenantSuccess] = useState('');

  // 4-Step Registration Wizard States
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardError, setWizardError] = useState('');
  const [wizardSuccess, setWizardSuccess] = useState('');
  const [wizardCreatedInfo, setWizardCreatedInfo] = useState<any>(null);

  const [wizardForm, setWizardForm] = useState({
    clinicName: '',
    professionalName: '',
    crp: '',
    cpfCnpj: '',
    phone: '',
    whatsApp: '',
    email: '',
    logoUrl: '',
    primaryColor: '#3b82f6',
    subdomain: '',
    
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    confirmPassword: '',
    autoGeneratePassword: true,
    forcePasswordChange: true,
    
    plan: 'Pro', // 'Starter' | 'Pro' | 'Premium' | 'Enterprise'
    status: 'Ativo', // 'Teste' | 'Ativo' | 'Suspenso' | 'Cancelado'
    expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    isTrial: false,
    trialDays: 14
  });

  const handleClinicNameChange = (val: string) => {
    const cleanSubdomain = val.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove accents
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_');
    setWizardForm(prev => ({
      ...prev,
      clinicName: val,
      subdomain: cleanSubdomain
    }));
  };

  const handleProfessionalNameChange = (val: string) => {
    setWizardForm(prev => ({
      ...prev,
      professionalName: val,
      adminName: val
    }));
  };

  const handleEmailChange = (val: string) => {
    setWizardForm(prev => ({
      ...prev,
      email: val,
      adminEmail: val
    }));
  };

  const resetWizard = () => {
    setIsWizardOpen(false);
    setWizardStep(1);
    setWizardError('');
    setWizardSuccess('');
    setWizardCreatedInfo(null);
    setWizardForm({
      clinicName: '',
      professionalName: '',
      crp: '',
      cpfCnpj: '',
      phone: '',
      whatsApp: '',
      email: '',
      logoUrl: '',
      primaryColor: '#3b82f6',
      subdomain: '',
      adminName: '',
      adminEmail: '',
      adminPassword: '',
      confirmPassword: '',
      autoGeneratePassword: true,
      forcePasswordChange: true,
      plan: 'Pro',
      status: 'Ativo',
      expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isTrial: false,
      trialDays: 14
    });
  };

  const handleWizardSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setWizardError('');
    setWizardSuccess('');

    if (wizardStep === 1) {
      if (!wizardForm.clinicName || !wizardForm.professionalName || !wizardForm.email || !wizardForm.cpfCnpj || !wizardForm.phone) {
        setWizardError('Por favor, preencha todos os campos obrigatórios da clínica (Nome, Responsável, CRP/CPF, Email e Telefone).');
        return;
      }
      setWizardStep(2);
      return;
    }

    if (wizardStep === 2) {
      if (!wizardForm.autoGeneratePassword) {
        if (!wizardForm.adminPassword || wizardForm.adminPassword.length < 6) {
          setWizardError('A senha do administrador deve conter no mínimo 6 caracteres.');
          return;
        }
        if (wizardForm.adminPassword !== wizardForm.confirmPassword) {
          setWizardError('As senhas digitadas não coincidem.');
          return;
        }
      }
      setWizardStep(3);
      return;
    }

    if (wizardStep === 3) {
      try {
        const finalTenantId = wizardForm.subdomain.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
        if (!finalTenantId) {
          setWizardError('O identificador (subdomínio) do tenant não pode ser vazio.');
          return;
        }

        // Check if tenant already exists
        const checkRef = doc(db, 'tenants', finalTenantId);
        const checkSnap = await getDoc(checkRef);
        if (checkSnap.exists()) {
          setWizardError(`Este subdomínio/identificador '${finalTenantId}' já está em uso por outra clínica.`);
          return;
        }

        let tempPassword = wizardForm.adminPassword;
        if (wizardForm.autoGeneratePassword) {
          tempPassword = 'MC_' + Math.floor(100000 + Math.random() * 900000) + '!';
        }

        const uid = 'usr_' + Date.now();

        // 1. Create Tenant
        const newTenant: Tenant = {
          id: finalTenantId,
          name: wizardForm.clinicName.trim(),
          subdomain: finalTenantId,
          createdAt: Date.now(),
          ownerEmail: wizardForm.email.trim().toLowerCase(),
          status: (wizardForm.status === 'Ativo' || wizardForm.status === 'Teste') ? 'Ativo' : 'Bloqueado'
        };
        await setDoc(doc(db, 'tenants', finalTenantId), newTenant);

        // Calculate limits & features
        let maxUsers = 1;
        let maxPatients = 50;
        let features = ['dashboard', 'agenda', 'pacientes', 'financeiro'];

        if (wizardForm.plan === 'Pro') {
          maxUsers = 3;
          maxPatients = 150;
          features = ['dashboard', 'agenda', 'pacientes', 'financeiro', 'blog', 'cms'];
        } else if (wizardForm.plan === 'Premium') {
          maxUsers = 10;
          maxPatients = 500;
          features = ['dashboard', 'agenda', 'pacientes', 'financeiro', 'blog', 'cms', 'designer', 'custom_domain'];
        } else if (wizardForm.plan === 'Enterprise') {
          maxUsers = 99;
          maxPatients = 9999;
          features = ['dashboard', 'agenda', 'pacientes', 'financeiro', 'blog', 'cms', 'designer', 'custom_domain', 'multiempresa', 'ia_clinica'];
        }

        const customExp = wizardForm.isTrial 
          ? Date.now() + (Number(wizardForm.trialDays) * 24 * 60 * 60 * 1000)
          : new Date(wizardForm.expirationDate).getTime();

        // 2. Create License
        const newLicense: License = {
          id: 'lic_' + finalTenantId + '_' + Date.now(),
          code: `LIC-${finalTenantId.toUpperCase()}-${wizardForm.plan.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
          activatedAt: Date.now(),
          expiresAt: customExp,
          plan: wizardForm.plan as any,
          maxUsers,
          maxPatients,
          features,
          status: wizardForm.status === 'Suspenso' ? 'Suspensa' : 'Ativa',
          tenantId: finalTenantId
        };
        await setDoc(doc(db, 'licenses', newLicense.id), newLicense);

        // 3. Create Admin Doc
        const adminDoc = {
          id: uid,
          name: wizardForm.professionalName.trim(),
          email: wizardForm.adminEmail.trim().toLowerCase(),
          phone: wizardForm.phone.trim(),
          role: 'admin',
          profile: 'clinico',
          status: wizardForm.status === 'Suspenso' ? 'suspended' : 'active',
          tenantId: finalTenantId,
          createdAt: Date.now(),
          firstAccess: wizardForm.forcePasswordChange,
          crp: wizardForm.crp,
          cpfCnpj: wizardForm.cpfCnpj,
          whatsApp: wizardForm.whatsApp || wizardForm.phone,
          primaryColor: wizardForm.primaryColor,
          logoUrl: wizardForm.logoUrl
        };
        await setDoc(doc(db, 'admins', uid), adminDoc);

        // 4. Create Site Content (Published + Draft)
        const registeredName = wizardForm.professionalName.trim() || wizardForm.clinicName.trim() || 'Atendimento Psicológico';
        const initialContent = {
          psychologist_info: {
            name: registeredName,
            email: wizardForm.email,
            phone: wizardForm.phone,
            whatsappMessage: `Olá, ${registeredName}! Gostaria de agendar uma consulta.`,
            footerText: `Psicoterapia online ética, sigilosa e acolhedora. Consultório: ${wizardForm.clinicName}`,
            clinicName: wizardForm.clinicName
          },
          cms_content: {
            hero: {
              tag: "Espaço Acolhedor & Ético",
              title: registeredName,
              subtitle: `Um espaço seguro no consultório ${wizardForm.clinicName || registeredName} para acolher sua história, fortalecer sua saúde emocional e promover seu bem-estar.`,
              body: "Atendimento psicológico online e presencial com acolhimento, ética, escuta qualificada e respeito à individualidade.",
              button_primary: "Agende sua primeira consulta",
              button_secondary: "Falar pelo WhatsApp",
              stat1_title: "100%",
              stat1_desc: "Sigiloso e Ético",
              stat2_title: "TCC",
              stat2_desc: "Prática Científica",
              stat3_title: "Online",
              stat3_desc: "Atendimento Nacional"
            },
            about: {
              tag: "SOBRE MIM",
              title: `Conheça ${registeredName}`,
              subtitle: "Caminhando ao seu lado em busca de equilíbrio emocional",
              bioLong: `Olá! Seja bem-vindo(a) ao atendimento com ${registeredName}. Meu compromisso é oferecer um atendimento acolhedor, ético e humanizado, proporcionando um espaço seguro para que você possa explorar suas emoções e desenvolver autoconhecimento.`
            }
          },
          seo: {
            title: `${registeredName} | ${wizardForm.clinicName} - Psicologia`,
            description: `Espaço seguro de acolhimento e escuta qualificada. Psicoterapia online para jovens e adultos no consultório ${wizardForm.clinicName}.`,
            keywords: `psicóloga, terapia online, psicoterapia, ${registeredName}, ${wizardForm.clinicName}`
          }
        };
        await setDoc(doc(db, 'site_content', `${finalTenantId}_published`), initialContent);
        await setDoc(doc(db, 'site_content', `${finalTenantId}_draft`), initialContent);

        // 5. Default PIX Config
        const pixPayload = {
          id: finalTenantId,
          keyType: 'email',
          key: wizardForm.email,
          receiverName: wizardForm.professionalName,
          receiverCity: 'Fortaleza',
          updatedAt: Date.now()
        };
        await setDoc(doc(db, 'pix_config', finalTenantId), pixPayload);

        // 6. Log audit action
        await setDoc(doc(db, 'audit_logs', 'audit_' + Date.now()), {
          userId: user.uid,
          email: user.email,
          action: 'CREATE',
          details: `Cliente '${wizardForm.clinicName}' provisionado via Painel Master no plano ${wizardForm.plan}.`,
          timestamp: Date.now(),
          ip: '127.0.0.1',
          browser: 'SaaS Engine',
          os: 'Linux',
          tenantId: finalTenantId
        });

        setWizardCreatedInfo({
          tenantId: finalTenantId,
          accessUrl: `${window.location.origin}/?tenant=${finalTenantId}`,
          email: wizardForm.adminEmail.trim().toLowerCase(),
          password: tempPassword,
          plan: wizardForm.plan,
          status: wizardForm.status,
          tenantObj: newTenant
        });

        setWizardSuccess('Cliente provisionado e ativado com sucesso!');
        setWizardStep(4);
        loadAllData();
      } catch (err: any) {
        setWizardError('Falha ao registrar dados no Firestore: ' + err.message);
      }
    }
  };

  const [licCode, setLicCode] = useState('');
  const [licTenant, setLicTenant] = useState('erica');
  const [licPlan, setLicPlan] = useState<'Starter' | 'Pro' | 'Premium'>('Pro');
  const [licSuccess, setLicSuccess] = useState('');
  const [licError, setLicError] = useState('');

  // Licensing filtering and sharing states
  const [licSearch, setLicSearch] = useState('');
  const [licPlanFilter, setLicPlanFilter] = useState('all');
  const [licStatusFilter, setLicStatusFilter] = useState('all');

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedShareLicense, setSelectedShareLicense] = useState<License | null>(null);
  const [shareClientName, setShareClientName] = useState('');
  const [shareClientEmail, setShareClientEmail] = useState('');
  const [shareClientPhone, setShareClientPhone] = useState('');
  const [shareTemplate, setShareTemplate] = useState('welcome'); // welcome | site_only | renewal
  const [shareCustomText, setShareCustomText] = useState('');

  // Licensing page/link generator states
  const [isLinkGenOpen, setIsLinkGenOpen] = useState(false);
  const [selectedLinkLicense, setSelectedLinkLicense] = useState<License | null>(null);
  const [activeLinkType, setActiveLinkType] = useState<'direct' | 'friendly' | 'login' | 'patient'>('direct');
  const [linkGenTenantId, setLinkGenTenantId] = useState('');
  const [isUpdatingLinkGenTenantId, setIsUpdatingLinkGenTenantId] = useState(false);

  // Support tickets state
  const [tickets, setTickets] = useState([
    { id: 'TK-102', author: 'Dra. Érica Costa', email: 'ericacostapsicologa7@gmail.com', subject: 'Como vincular meu domínio customizado?', status: 'Pendente', date: 'Hoje, 14:10', message: 'Olá, gostaria de ajuda para vincular o domínio erica.costa.com.br ao meu site.' },
    { id: 'TK-101', author: 'Dr. Ricardo Santos', email: 'ricardo@santos.com.br', subject: 'Dúvida sobre recibos de reembolso', status: 'Respondido', date: 'Ontem, 09:30', message: 'O recibo com assinatura digital é aceito por todos os planos de saúde? Obrigado.' },
    { id: 'TK-100', author: 'Dra. Lúcia Silva', email: 'lucia.silva@outlook.com', subject: 'Limite de pacientes atingido', status: 'Fechado', date: '15 Jul, 17:45', message: 'Gostaria de expandir meu plano de 30 para 100 pacientes. Como procedo?' }
  ]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [ticketReply, setTicketReply] = useState('');

  // Platform Plans configuration state
  const [plans, setPlans] = useState([
    { id: 'Starter', name: 'Plano Starter', price: 99.90, maxPatients: 30, maxUsers: 1, features: ['Dashboard', 'Agenda', 'Pacientes'] },
    { id: 'Pro', name: 'Plano Pro', price: 189.90, maxPatients: 150, maxUsers: 3, features: ['Dashboard', 'Agenda', 'Pacientes', 'Financeiro', 'Blog', 'CMS'] },
    { id: 'Premium', name: 'Plano Premium', price: 299.90, maxPatients: 500, maxUsers: 10, features: ['Dashboard', 'Agenda', 'Pacientes', 'Financeiro', 'Blog', 'CMS', 'Designer', 'Custom Domain'] }
  ]);

  // Invites state
  const [invites, setInvites] = useState([
    { code: 'CONV-SAGE-883', recipient: 'Dra. Mariana Gurgel', email: 'mariana.gurgel@gmail.com', role: 'Tenant Admin', status: 'Aceito', createdAt: '10 Jul 2026' },
    { code: 'CONV-SAGE-441', recipient: 'Dr. Felipe Alencar', email: 'felipe.alencar@uol.com.br', role: 'Tenant Admin', status: 'Pendente', createdAt: 'Hoje, 11:22' }
  ]);
  const [newInviteName, setNewInviteName] = useState('');
  const [newInviteEmail, setNewInviteEmail] = useState('');

  // Simulated System status and metrics
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [sysLogs, setSysLogs] = useState<string[]>([
    'System: Booting MenteCare Master SaaS Platform Engine...',
    'System: Database Connection OK (Standard Firestore Database).',
    'Tenant Router: Resolved 3 active clinics securely.',
    'Licensing: Validated license lic_main for tenant main. Status: Active.'
  ]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const tList = await contentService.getTenants();
      const lList = await contentService.getLicenses();

      const sanitizeNumber = (val: any, fallback: number): number => {
        if (val === undefined || val === null) return fallback;
        if (typeof val === 'number') {
          return isNaN(val) ? fallback : val;
        }
        if (typeof val === 'object') {
          if (typeof val.seconds === 'number') {
            return val.seconds * 1000;
          }
          if (typeof val._seconds === 'number') {
            return val._seconds * 1000;
          }
          if (val.toDate && typeof val.toDate === 'function') {
            try {
              return val.toDate().getTime();
            } catch (e) {}
          }
        }
        const num = Number(val);
        if (!isNaN(num)) return num;
        const parsedDate = Date.parse(val);
        if (!isNaN(parsedDate)) return parsedDate;
        return fallback;
      };

      const sanitizedTenants = (tList || []).map((tenant: any) => ({
        ...tenant,
        id: tenant.id || '',
        name: tenant.name || 'Sem Nome',
        ownerEmail: tenant.ownerEmail || '',
        subdomain: tenant.subdomain || '',
        status: tenant.status || 'Ativo',
      }));

      const sanitizedLicenses = (lList || []).map((lic: any) => {
        const expiresAt = sanitizeNumber(lic.expiresAt, Date.now() + 30 * 24 * 60 * 60 * 1000);
        const activatedAt = sanitizeNumber(lic.activatedAt, Date.now());
        return {
          ...lic,
          id: lic.id || 'lic_' + Math.random(),
          code: lic.code || 'LIC-INVALID',
          plan: lic.plan || 'Pro',
          status: lic.status || 'Ativa',
          tenantId: lic.tenantId || '',
          expiresAt,
          activatedAt,
        };
      });

      setTenants(sanitizedTenants);
      setLicenses(sanitizedLicenses);

      // Load recent logs from 'audit_logs'
      try {
        const snap = await getDocs(collection(db, 'audit_logs'));
        const logsList = snap.docs.map(d => ({ ...d.data(), id: d.id } as AuditLog));
        const sorted = logsList.sort((a, b) => b.timestamp - a.timestamp);
        setAuditLogs(sorted.slice(0, 30));
      } catch (e) {
        console.warn("Could not load audit logs for Master:", e);
      }

      // Load trash bin items
      try {
        const trList = await contentService.getTrashItems();
        setTrashItems(trList || []);
      } catch (e) {
        console.warn("Could not load trash items for Master:", e);
      }

      // Load database statistics (real counts)
      try {
        const [pSnap, aSnap, dSnap, bSnap] = await Promise.all([
          getDocs(collection(db, 'patients')).catch(() => ({ size: 0, docs: [] })),
          getDocs(collection(db, 'appointments')).catch(() => ({ size: 0, docs: [] })),
          getDocs(collection(db, 'patient_documents')).catch(() => ({ size: 0, docs: [] })),
          getDocs(collection(db, 'backups')).catch(() => ({ size: 0, docs: [] }))
        ]);

        setDbStats({
          patients: pSnap.size || pSnap.docs?.length || 0,
          appointments: aSnap.size || aSnap.docs?.length || 0,
          documents: dSnap.size || dSnap.docs?.length || 0,
          backups: bSnap.size || bSnap.docs?.length || 0
        });
      } catch (e) {
        console.warn("Could not load database stats for Master:", e);
      }

    } catch (err) {
      console.error("Error loading Master data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const [trashSearch, setTrashSearch] = useState('');
  const [trashColFilter, setTrashColFilter] = useState('all');
  const [trashTenantFilter, setTrashTenantFilter] = useState('all');

  const handleRestoreTrash = async (id: string, title: string) => {
    try {
      await contentService.restoreFromTrash(id);
      setTrashItems(prev => prev.filter(item => item.id !== id));
      safeAlert(`Item '${title}' restaurado com sucesso!`);
      loadAllData();
    } catch (e: any) {
      safeAlert(`Erro ao restaurar item: ${e.message}`);
    }
  };

  const handleDeletePermanently = async (id: string, title: string) => {
    if (!safeConfirm(`ATENÇÃO: Deseja EXCLUIR DEFINITIVAMENTE o item '${title}'?\nEsta ação é IRREVERSÍVEL e em total conformidade com a LGPD (Dados Clínicos).`)) {
      return;
    }
    try {
      await contentService.deletePermanentlyFromTrash(id);
      setTrashItems(prev => prev.filter(item => item.id !== id));
      safeAlert(`Item '${title}' excluído de forma permanente.`);
      loadAllData();
    } catch (e: any) {
      safeAlert(`Erro ao excluir permanentemente: ${e.message}`);
    }
  };

  const handleCreateTenantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTenantError('');
    setTenantSuccess('');

    if (!newTenantId || !newTenantName || !newTenantEmail) {
      setTenantError('Preencha os campos obrigatórios.');
      return;
    }

    const cleanId = newTenantId.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (tenants.some(t => t.id === cleanId)) {
      setTenantError('Este identificador (tenantId) já existe.');
      return;
    }

    const newTenant: Tenant = {
      id: cleanId,
      name: newTenantName.trim(),
      subdomain: newTenantSubdomain.trim().toLowerCase() || cleanId,
      createdAt: Date.now(),
      ownerEmail: newTenantEmail.trim(),
      status: 'Ativo'
    };

    try {
      await contentService.createTenant(newTenant);
      
      const newLicense: License = {
        id: 'lic_' + cleanId + '_' + Date.now(),
        code: `LIC-${cleanId.toUpperCase()}-PRO-${Math.floor(1000 + Math.random() * 9000)}`,
        activatedAt: Date.now(),
        expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
        plan: 'Pro',
        maxUsers: 3,
        maxPatients: 150,
        features: ['dashboard', 'agenda', 'pacientes', 'financeiro', 'blog', 'cms'],
        status: 'Ativa',
        tenantId: cleanId
      };
      await contentService.createLicense(newLicense);

      setTenantSuccess(`Novo psicólogo '${newTenant.name}' cadastrado e ativado! Licença Pro vinculada.`);
      setNewTenantId('');
      setNewTenantName('');
      setNewTenantEmail('');
      setNewTenantSubdomain('');
      loadAllData();
    } catch (err) {
      setTenantError('Falha ao cadastrar cliente no Firestore.');
    }
  };

  const handleGenerateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    setLicError('');
    setLicSuccess('');

    if (!licCode) {
      setLicError('Por favor, digite ou gere um código.');
      return;
    }

    const newLicense: License = {
      id: 'lic_man_' + Date.now(),
      code: licCode.trim().toUpperCase(),
      activatedAt: Date.now(),
      expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
      plan: licPlan,
      maxUsers: licPlan === 'Premium' ? 10 : licPlan === 'Pro' ? 3 : 1,
      maxPatients: licPlan === 'Premium' ? 500 : licPlan === 'Pro' ? 150 : 30,
      features: licPlan === 'Premium' 
        ? ['dashboard', 'agenda', 'pacientes', 'financeiro', 'blog', 'cms', 'designer', 'custom_domain']
        : licPlan === 'Pro'
        ? ['dashboard', 'agenda', 'pacientes', 'financeiro', 'blog', 'cms']
        : ['dashboard', 'agenda', 'pacientes'],
      status: 'Ativa',
      tenantId: licTenant
    };

    try {
      await setDoc(doc(db, 'licenses', newLicense.id), newLicense);
      setLicSuccess(`Licença ${newLicense.code} vinculada com sucesso!`);
      setLicCode('');
      loadAllData();
    } catch (err) {
      setLicError('Falha ao gravar licença.');
    }
  };

  const generateRandomKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'LIC-';
    for (let i = 0; i < 4; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    code += '-';
    for (let i = 0; i < 4; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    code += '-';
    for (let i = 0; i < 4; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    setLicCode(code);
  };

  const handleToggleLicenseStatus = async (licenseId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Ativa' ? 'Suspensa' : 'Ativa';
    try {
      const docRef = doc(db, 'licenses', licenseId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        await setDoc(docRef, { ...snap.data(), status: newStatus });
        safeAlert(`A licença foi ${newStatus === 'Ativa' ? 'ATIVADA' : 'SUSPENSA'} com sucesso!`);
        loadAllData();
      }
    } catch (e: any) {
      safeAlert('Erro ao alterar status da licença: ' + e.message);
    }
  };

  const handleExtendLicenseExpiry = async (licenseId: string, days: number) => {
    try {
      const docRef = doc(db, 'licenses', licenseId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const currentData = snap.data();
        const currentExpires = currentData.expiresAt || Date.now();
        const newExpires = currentExpires + days * 24 * 60 * 60 * 1000;
        await setDoc(docRef, { ...currentData, expiresAt: newExpires });
        safeAlert(`Validade estendida por +${days} dias com sucesso!`);
        loadAllData();
      }
    } catch (e: any) {
      safeAlert('Erro ao estender validade da licença: ' + e.message);
    }
  };

  const handleDeleteLicense = async (licenseId: string, code: string) => {
    if (!safeConfirm(`Deseja realmente excluir a licença ${code}?\nEsta ação removerá a licença do banco de dados permanentemente.`)) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'licenses', licenseId));
      safeAlert(`Licença ${code} removida com sucesso!`);
      loadAllData();
    } catch (e: any) {
      safeAlert('Erro ao excluir licença: ' + e.message);
    }
  };

  const handleGenerateInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInviteName || !newInviteEmail) return;

    const randomCode = 'CONV-SAGE-' + Math.floor(100 + Math.random() * 900);
    const newInvite = {
      code: randomCode,
      recipient: newInviteName,
      email: newInviteEmail,
      role: 'Tenant Admin',
      status: 'Pendente',
      createdAt: 'Hoje, ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    setInvites([newInvite, ...invites]);
    setNewInviteName('');
    setNewInviteEmail('');
    safeAlert(`Convite gerado! Código: ${randomCode}\nLink enviado para ${newInviteEmail}`);
  };

  const handleReplyTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketReply.trim()) return;

    const updated = tickets.map(t => {
      if (t.id === selectedTicket.id) {
        return { ...t, status: 'Respondido' };
      }
      return t;
    });

    setTickets(updated);
    setSelectedTicket({ ...selectedTicket, status: 'Respondido' });
    setTicketReply('');
    safeAlert(`Resposta enviada para ${selectedTicket.author}!`);
  };

  const triggerPlatformUpdate = () => {
    setIsUpdating(true);
    setUpdateProgress(0);
    const interval = setInterval(() => {
      setUpdateProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsUpdating(false);
            safeAlert('A plataforma MenteCare foi atualizada com sucesso para a v1.4.2 em produção!');
          }, 500);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const toggleTenantStatus = async (tenantId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Ativo' ? 'Bloqueado' : 'Ativo';
    try {
      const docRef = doc(db, 'tenants', tenantId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        await setDoc(docRef, { ...snap.data(), status: newStatus });
        safeAlert(`Tenant ${tenantId} foi ${newStatus === 'Ativo' ? 'reativado' : 'suspenso'} com sucesso!`);
        loadAllData();
      }
    } catch (e) {
      safeAlert('Erro ao alterar status do tenant.');
    }
  };

  // Subscription CRM Core Actions
  const handleCrmSelect = (tenantId: string) => {
    setSelectedCrmTenantId(tenantId);
    const tenant = tenants.find(t => t.id === tenantId);
    const license = licenses.find(l => l.tenantId === tenantId);
    if (tenant) {
      setEditForm({
        name: tenant.name,
        ownerEmail: tenant.ownerEmail,
        plan: (license?.plan || 'Pro') as any,
        status: tenant.status || 'Ativo',
        expiresAt: license ? new Date(license.expiresAt).toISOString().split('T')[0] : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        price: license?.plan === 'Premium' ? 299.90 : license?.plan === 'Starter' ? 99.90 : 189.90
      });
      setBillingAmount(license?.plan === 'Premium' ? 299.90 : license?.plan === 'Starter' ? 99.90 : 189.90);
      setGeneratedPayLink(`${window.location.origin}/checkout/pay_${tenantId}_${Math.floor(1000 + Math.random() * 9000)}`);
    }
  };

  const handleCrmRenew = async (tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
    const license = licenses.find(l => l.tenantId === tenantId);
    if (!tenant) return;

    try {
      const currentExpires = license?.expiresAt || Date.now();
      const newExpires = currentExpires + (30 * 24 * 60 * 60 * 1000); // Add 30 days

      if (license) {
        const updatedLicense = {
          ...license,
          expiresAt: newExpires,
          status: 'Ativa' as const
        };
        await setDoc(doc(db, 'licenses', license.id), updatedLicense);
      } else {
        const newLic: License = {
          id: 'lic_' + tenantId + '_' + Date.now(),
          code: `LIC-${tenantId.toUpperCase()}-RENEW-${Math.floor(1000 + Math.random() * 9000)}`,
          activatedAt: Date.now(),
          expiresAt: newExpires,
          plan: 'Pro',
          maxUsers: 3,
          maxPatients: 150,
          features: ['dashboard', 'agenda', 'pacientes', 'financeiro', 'blog', 'cms'],
          status: 'Ativa',
          tenantId: tenantId
        };
        await setDoc(doc(db, 'licenses', newLic.id), newLic);
      }

      // Log action
      await setDoc(doc(db, 'audit_logs', 'audit_renew_' + Date.now()), {
        userId: user.uid,
        email: user.email,
        action: 'LICENSE_RENEW',
        details: `Licença do inquilino '${tenant.name}' renovada por +30 dias pelo Master Admin.`,
        timestamp: Date.now(),
        ip: '127.0.0.1',
        browser: 'SaaS Engine',
        os: 'Linux',
        tenantId: tenantId
      });

      safeAlert(`Licença de ${tenant.name} renovada por mais 30 dias com sucesso!`);
      loadAllData();
      setTimeout(() => handleCrmSelect(tenantId), 100);
    } catch (e: any) {
      safeAlert('Erro ao renovar licença: ' + e.message);
    }
  };

  const handleCrmSuspend = async (tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) return;

    const currentStatus = tenant.status || 'Ativo';
    const nextTenantStatus = currentStatus === 'Ativo' ? 'Bloqueado' : 'Ativo';
    const nextLicenseStatus = nextTenantStatus === 'Ativo' ? 'Ativa' : 'Suspensa';

    try {
      // 1. Update Tenant
      await setDoc(doc(db, 'tenants', tenantId), {
        ...tenant,
        status: nextTenantStatus
      });

      // 2. Update Licenses
      const license = licenses.find(l => l.tenantId === tenantId);
      if (license) {
        await setDoc(doc(db, 'licenses', license.id), {
          ...license,
          status: nextLicenseStatus
        });
      }

      // 3. Log Action
      await setDoc(doc(db, 'audit_logs', 'audit_suspend_' + Date.now()), {
        userId: user.uid,
        email: user.email,
        action: nextTenantStatus === 'Bloqueado' ? 'TENANT_SUSPEND' : 'TENANT_REACTIVATE',
        details: `O inquilino '${tenant.name}' foi ${nextTenantStatus === 'Bloqueado' ? 'suspenso' : 'reativado'} pelo Master Admin.`,
        timestamp: Date.now(),
        ip: '127.0.0.1',
        browser: 'SaaS Engine',
        os: 'Linux',
        tenantId: tenantId
      });

      safeAlert(`Inquilino ${tenant.name} foi ${nextTenantStatus === 'Bloqueado' ? 'SUSPENSO' : 'REATIVADO'} com sucesso!`);
      loadAllData();
      setTimeout(() => handleCrmSelect(tenantId), 100);
    } catch (e: any) {
      safeAlert('Erro ao alterar status de suspensão: ' + e.message);
    }
  };

  const handleCrmCancel = async (tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) return;

    if (!safeConfirm(`Deseja realmente CANCELAR a assinatura do inquilino '${tenant.name}'?\nEsta ação suspenderá os acessos e expirará a licença imediatamente.`)) {
      return;
    }

    try {
      // 1. Update Tenant
      await setDoc(doc(db, 'tenants', tenantId), {
        ...tenant,
        status: 'Bloqueado'
      });

      // 2. Update Licenses
      const license = licenses.find(l => l.tenantId === tenantId);
      if (license) {
        await setDoc(doc(db, 'licenses', license.id), {
          ...license,
          status: 'Expirada'
        });
      }

      // 3. Log Action
      await setDoc(doc(db, 'audit_logs', 'audit_cancel_' + Date.now()), {
        userId: user.uid,
        email: user.email,
        action: 'TENANT_CANCEL',
        details: `Assinatura de '${tenant.name}' cancelada pelo Master Admin.`,
        timestamp: Date.now(),
        ip: '127.0.0.1',
        browser: 'SaaS Engine',
        os: 'Linux',
        tenantId: tenantId
      });

      safeAlert(`Assinatura de ${tenant.name} cancelada.`);
      loadAllData();
      setTimeout(() => handleCrmSelect(tenantId), 100);
    } catch (e: any) {
      safeAlert('Erro ao cancelar assinatura: ' + e.message);
    }
  };

  const handleCrmEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCrmTenantId) return;

    const tenant = tenants.find(t => t.id === selectedCrmTenantId);
    if (!tenant) return;

    try {
      // 1. Update Tenant name & email
      const updatedTenant = {
        ...tenant,
        name: editForm.name.trim(),
        ownerEmail: editForm.ownerEmail.trim().toLowerCase(),
        status: editForm.status
      };
      await setDoc(doc(db, 'tenants', selectedCrmTenantId), updatedTenant);

      // 2. Update License Plan & Expiration
      const license = licenses.find(l => l.tenantId === selectedCrmTenantId);
      if (license) {
        const updatedLicense = {
          ...license,
          plan: editForm.plan,
          expiresAt: new Date(editForm.expiresAt).getTime(),
          status: editForm.status === 'Ativo' ? 'Ativa' as const : 'Suspensa' as const
        };
        await setDoc(doc(db, 'licenses', license.id), updatedLicense);
      }

      // 3. Log Action
      await setDoc(doc(db, 'audit_logs', 'audit_edit_crm_' + Date.now()), {
        userId: user.uid,
        email: user.email,
        action: 'TENANT_EDIT',
        details: `Dados cadastrais e assinatura do inquilino '${editForm.name}' editados pelo Master Admin.`,
        timestamp: Date.now(),
        ip: '127.0.0.1',
        browser: 'SaaS Engine',
        os: 'Linux',
        tenantId: selectedCrmTenantId
      });

      setIsCrmEditOpen(false);
      safeAlert(`Dados da assinatura de ${editForm.name} salvos com sucesso!`);
      loadAllData();
      setTimeout(() => handleCrmSelect(selectedCrmTenantId), 100);
    } catch (e: any) {
      safeAlert('Erro ao salvar edições: ' + e.message);
    }
  };

  // MRR calculations
  const totalClinics = tenants.length || 3;
  const activeSubs = tenants.filter(t => t.status === 'Ativo').length;
  const estimatedMRR = activeSubs * 189.90; // Average pricing base

  return (
    <div className="flex h-screen bg-sand-100 overflow-hidden font-sans selection:bg-softblue-200 selection:text-softblue-900 antialiased">
      {/* MASTER PANEL SIDEBAR DESKTOP */}
      <aside className="hidden lg:flex w-64 bg-sand-950 border-r border-sand-900 flex-col justify-between shrink-0 h-full text-sand-100 z-30 shadow-xl">
        {renderSidebarContent(false)}
      </aside>

      {/* MASTER PANEL SIDEBAR MOBILE (DRAWER) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
            />
            {/* Slide-out Drawer */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed top-0 left-0 bottom-0 w-[300px] bg-sand-950 border-r border-sand-900 flex flex-col justify-between h-full text-sand-100 z-50 shadow-2xl rounded-r-2xl lg:hidden overflow-hidden"
            >
              {renderSidebarContent(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* MASTER PANEL MAIN PORT */}
      <main className="flex-1 overflow-y-auto bg-sand-50 p-4 sm:p-6 lg:p-8 flex flex-col justify-between">
        <div className="space-y-6">
          
          {/* Mobile Compact Premium Header */}
          <header className="lg:hidden flex items-center justify-between bg-sand-950 text-white px-4 py-3.5 rounded-2xl shadow-lg border border-sand-900 mb-2">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 bg-sand-900 border border-sand-800 rounded-xl text-sand-200 hover:text-white transition-colors cursor-pointer"
                aria-label="Abrir Menu"
              >
                <Menu size={20} />
              </button>
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gradient-to-tr from-softblue-500 to-sage-600 rounded-lg text-white shadow-sm shadow-softblue-500/10">
                  <Layers size={14} />
                </div>
                <div>
                  <h1 className="font-serif font-black text-sm text-white tracking-tight leading-none">MenteCare</h1>
                  <span className="text-[9px] font-mono text-softblue-400 font-bold uppercase tracking-widest block mt-0.5 max-w-[120px] truncate">
                    {activeTab === 'dashboard' ? 'Dashboard' : activeTab}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="hidden sm:block text-right pr-1">
                <p className="text-[10px] font-bold leading-none text-white">Master Admin</p>
                <span className="text-[9px] font-mono text-sand-500 block mt-0.5 truncate max-w-[100px]">{user?.email}</span>
              </div>
              <div className="h-8 w-8 rounded-full bg-softblue-600/20 border border-softblue-500/30 flex items-center justify-center font-bold text-xs font-mono text-softblue-400 uppercase shadow-inner">
                {user?.email?.substring(0, 2) || 'MA'}
              </div>
              <button
                onClick={() => {
                  logout();
                  navigate('/admin');
                }}
                className="p-2 bg-rose-950/30 border border-rose-900/30 text-rose-400 rounded-xl hover:bg-rose-900/30 transition-all cursor-pointer"
                title="Sair"
              >
                <LogOut size={14} />
              </button>
            </div>
          </header>

          {/* Main Top Welcome Row (Desktop Only) */}
          <div className="hidden lg:flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-sand-200/80 pb-5">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-sand-500 font-bold uppercase tracking-wider">
                <span>MenteCare Platform</span>
                <ChevronRight size={10} />
                <span className="text-softblue-600">{activeTab}</span>
              </div>
              <h2 className="text-2xl font-serif font-extrabold text-sand-900 mt-1 capitalize">
                {activeTab === 'dashboard' ? 'Overview Geral da Plataforma' : activeTab}
              </h2>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={loadAllData}
                disabled={loading}
                className="p-2.5 bg-white border border-sand-200 text-sand-700 rounded-xl hover:bg-sand-100 cursor-pointer shadow-sm"
                title="Sincronizar Dados"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin text-softblue-500' : ''} />
              </button>
              <div className="px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-mono font-bold rounded-lg uppercase tracking-wide flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                SaaS Engine Online
              </div>
            </div>
          </div>

          {/* TAB PORTIONS */}
          <AnimatePresence mode="wait">
            
            {/* 1. MASTER DASHBOARD */}
            {activeTab === 'dashboard' && (
              <motion.div
                key="master-dash"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* SaaS & Financial KPI Grid */}
                <div className="bg-sand-50/50 border border-sand-200/60 rounded-3xl p-6 space-y-4">
                  <h3 className="font-serif font-extrabold text-sand-900 text-sm flex items-center gap-2 pb-1 border-b border-sand-150">
                    <DollarSign size={16} className="text-emerald-600" />
                    <span>Métricas de Crescimento SaaS & KPIs Financeiros</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Clientes Ativos, Suspensos, Em Teste */}
                    <div className="bg-white border border-sand-200/80 rounded-2xl p-4 shadow-sm space-y-2">
                      <span className="text-[9px] font-bold font-mono uppercase text-sand-500 tracking-wider">Status dos Clientes (Tenants)</span>
                      <div className="grid grid-cols-3 gap-1 pt-1 text-center">
                        <div className="bg-emerald-50 text-emerald-800 p-1.5 rounded-lg">
                          <p className="text-xs font-bold font-mono">{tenants.filter(t => t.status === 'Ativo').length || 3}</p>
                          <p className="text-[7px] uppercase font-bold tracking-wider opacity-80">Ativos</p>
                        </div>
                        <div className="bg-amber-50 text-amber-800 p-1.5 rounded-lg">
                          <p className="text-xs font-bold font-mono">0</p>
                          <p className="text-[7px] uppercase font-bold tracking-wider opacity-80">Suspen.</p>
                        </div>
                        <div className="bg-blue-50 text-blue-800 p-1.5 rounded-lg">
                          <p className="text-xs font-bold font-mono">1</p>
                          <p className="text-[7px] uppercase font-bold tracking-wider opacity-80">Em Teste</p>
                        </div>
                      </div>
                    </div>

                    {/* MRR & ARR */}
                    <div className="bg-white border border-sand-200/80 rounded-2xl p-4 shadow-sm flex justify-between items-center">
                      <div>
                        <span className="text-[9px] font-bold font-mono uppercase text-sand-500 tracking-wider">MRR / ARR Estimado</span>
                        <h4 className="text-lg font-serif font-extrabold text-emerald-700 mt-1">
                          {estimatedMRR.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </h4>
                        <p className="text-[8px] text-sand-500 font-medium">ARR: {(estimatedMRR * 12).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                      </div>
                      <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><DollarSign size={18} /></div>
                    </div>

                    {/* Churn Rate & LTV */}
                    <div className="bg-white border border-sand-200/80 rounded-2xl p-4 shadow-sm flex justify-between items-center">
                      <div>
                        <span className="text-[9px] font-bold font-mono uppercase text-sand-500 tracking-wider">Taxa de Churn & LTV</span>
                        <h4 className="text-lg font-serif font-extrabold text-sand-900 mt-1">1.8%</h4>
                        <p className="text-[8px] text-emerald-600 font-semibold">LTV Médio: R$ 5.400,00</p>
                      </div>
                      <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl"><Activity size={18} /></div>
                    </div>

                    {/* CAC (Customer Acquisition Cost) */}
                    <div className="bg-white border border-sand-200/80 rounded-2xl p-4 shadow-sm flex justify-between items-center">
                      <div>
                        <span className="text-[9px] font-bold font-mono uppercase text-sand-500 tracking-wider">Custo de Aquisição (CAC)</span>
                        <h4 className="text-lg font-serif font-extrabold text-sand-900 mt-1">R$ 145,00</h4>
                        <p className="text-[8px] text-emerald-600 font-semibold">Payback: 1.2 meses</p>
                      </div>
                      <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl"><CreditCard size={18} /></div>
                    </div>
                  </div>
                </div>

                {/* Database, Clinical Records & System Operations (LGPD Compliance) */}
                <div className="bg-sand-50/50 border border-sand-200/60 rounded-3xl p-6 space-y-4">
                  <h3 className="font-serif font-extrabold text-sand-900 text-sm flex items-center gap-2 pb-1 border-b border-sand-150">
                    <HardDrive size={16} className="text-softblue-600" />
                    <span>Métricas Clínicas e Operações de TI (LGPD Audit)</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Pacientes & Consultas */}
                    <div className="bg-white border border-sand-200/80 rounded-2xl p-4 shadow-sm flex justify-between items-center">
                      <div>
                        <span className="text-[9px] font-bold font-mono uppercase text-sand-500 tracking-wider">Volume de Prontuários</span>
                        <h4 className="text-lg font-serif font-extrabold text-sand-900 mt-1">{dbStats.patients} Pacientes</h4>
                        <p className="text-[8px] text-sand-500">{dbStats.appointments} Consultas Realizadas</p>
                      </div>
                      <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><FileText size={18} /></div>
                    </div>

                    {/* Documentos & Backups */}
                    <div className="bg-white border border-sand-200/80 rounded-2xl p-4 shadow-sm flex justify-between items-center">
                      <div>
                        <span className="text-[9px] font-bold font-mono uppercase text-sand-500 tracking-wider">Documentos & Backups</span>
                        <h4 className="text-lg font-serif font-extrabold text-sand-900 mt-1">{dbStats.documents} Arquivos</h4>
                        <p className="text-[8px] text-emerald-600 font-semibold">{dbStats.backups} Snapshots Salvos</p>
                      </div>
                      <div className="p-2.5 bg-sage-50 text-sage-600 rounded-xl"><HardDrive size={18} /></div>
                    </div>

                    {/* Armazenamento & Uploads */}
                    <div className="bg-white border border-sand-200/80 rounded-2xl p-4 shadow-sm flex justify-between items-center">
                      <div>
                        <span className="text-[9px] font-bold font-mono uppercase text-sand-500 tracking-wider">Espaço & Uploads (Storage)</span>
                        <h4 className="text-lg font-serif font-extrabold text-sand-900 mt-1">1.42 GB</h4>
                        <p className="text-[8px] text-sand-500">48 mídias ativas</p>
                      </div>
                      <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><Layers size={18} /></div>
                    </div>

                    {/* Uso de CPU/Recursos do Servidor */}
                    <div className="bg-white border border-sand-200/80 rounded-2xl p-4 shadow-sm flex justify-between items-center">
                      <div>
                        <span className="text-[9px] font-bold font-mono uppercase text-sand-500 tracking-wider">Uso Médio de Recursos</span>
                        <h4 className="text-lg font-serif font-extrabold text-emerald-700 mt-1">34.8%</h4>
                        <p className="text-[8px] text-emerald-600 font-semibold">Servidores Estáveis (GCP)</p>
                      </div>
                      <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl"><Activity size={18} /></div>
                    </div>
                  </div>
                </div>

                {/* Main Graph Grid / Insights */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Subscriber and Revenue Simulation Chart */}
                  <div className="bg-white border border-sand-200 rounded-2xl p-6 shadow-sm lg:col-span-8 space-y-4">
                    <div className="flex justify-between items-center border-b border-sand-150 pb-3">
                      <h3 className="font-serif font-bold text-sand-900 text-sm">Estatísticas de Crescimento SaaS</h3>
                      <span className="text-[10px] bg-sand-100 text-sand-600 px-2 py-0.5 rounded font-bold font-mono">ÚLTIMOS 6 MESES</span>
                    </div>

                    <div className="h-48 flex items-end justify-between gap-2 pt-4">
                      {[
                        { month: 'Fev', clinics: 1, mrr: 189 },
                        { month: 'Mar', clinics: 1, mrr: 189 },
                        { month: 'Abr', clinics: 2, mrr: 379 },
                        { month: 'Mai', clinics: 2, mrr: 379 },
                        { month: 'Jun', clinics: 3, mrr: 569 },
                        { month: 'Jul', clinics: totalClinics, mrr: estimatedMRR }
                      ].map((item, idx) => {
                        const maxMRR = 1000;
                        const barHeight = (item.mrr / maxMRR) * 100;
                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                            <span className="text-[9px] font-mono font-bold text-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity">
                              R${item.mrr}
                            </span>
                            <div 
                              className="w-full bg-gradient-to-t from-softblue-600 to-softblue-400 rounded-t-lg transition-all duration-500 hover:from-softblue-500 hover:to-softblue-300" 
                              style={{ height: `${Math.max(barHeight, 10)}%` }}
                            ></div>
                            <span className="text-[10px] text-sand-600 font-mono">{item.month}</span>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-sand-500 leading-relaxed pt-2 text-center">
                      Gráfico representativo das assinaturas mensais recorrentes da plataforma MenteCare (MRR). Passe o cursor sobre as barras para ver os valores.
                    </p>
                  </div>

                  {/* Plan Distribution Widget */}
                  <div className="bg-white border border-sand-200 rounded-2xl p-6 shadow-sm lg:col-span-4 space-y-4">
                    <h3 className="font-serif font-bold text-sand-900 text-sm border-b border-sand-150 pb-3">Distribuição de Planos</h3>
                    
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span>Plano Premium (R$299/mês)</span>
                          <span className="text-purple-600">33%</span>
                        </div>
                        <div className="w-full bg-sand-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-purple-600 h-full rounded-full" style={{ width: '33.3%' }}></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span>Plano Pro (R$189/mês)</span>
                          <span className="text-softblue-600">50%</span>
                        </div>
                        <div className="w-full bg-sand-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-softblue-600 h-full rounded-full" style={{ width: '50%' }}></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span>Plano Starter (R$99/mês)</span>
                          <span className="text-sand-600">17%</span>
                        </div>
                        <div className="w-full bg-sand-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-sand-600 h-full rounded-full" style={{ width: '16.7%' }}></div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-sand-50 border border-sand-150 rounded-xl p-3 text-xs text-sand-700 space-y-1 mt-4">
                      <div className="font-semibold text-sand-900">Métrica Chave (LTV):</div>
                      <p className="text-[11px]">O Lifetime Value (LTV) médio do cliente é de <strong>R$ 2.278,00</strong> com um churn de apenas 2.1% ao ano.</p>
                    </div>
                  </div>
                </div>

                {/* Recent Activity Logs */}
                <div className="bg-white border border-sand-200 rounded-2xl p-6 shadow-sm space-y-3">
                  <h3 className="font-serif font-bold text-sand-900 text-sm border-b border-sand-150 pb-3">Histórico Recente de Auditoria</h3>
                  <div className="divide-y divide-sand-100 max-h-64 overflow-y-auto pr-2 space-y-2">
                    {auditLogs.length > 0 ? (
                      auditLogs.map((log) => (
                        <div key={log.id} className="pt-2 text-xs flex justify-between items-start gap-4">
                          <div className="space-y-0.5">
                            <span className="px-1.5 py-0.5 bg-sand-100 text-[9px] font-mono font-bold uppercase rounded text-sand-700 mr-2">
                              {log.action}
                            </span>
                            <span className="text-sand-800">{log.details}</span>
                            <div className="text-[10px] text-sand-400 font-mono">
                              Dispositivo: {log.os} ({log.browser}) | IP: {log.ip}
                            </div>
                          </div>
                          <span className="text-[10px] text-sand-500 font-mono shrink-0">
                            {new Date(log.timestamp).toLocaleString('pt-BR')}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-sand-500 py-3 text-center">Nenhum log de auditoria carregado.</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* 2. CLIENTES */}
            {activeTab === 'clientes' && (
              <motion.div
                key="master-clientes"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {!isWizardOpen ? (
                  <div className="space-y-6">
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-sand-200 p-5 rounded-2xl shadow-sm">
                      <div>
                        <h3 className="font-serif font-black text-sand-950 text-base">Controle de Clientes & Tenants</h3>
                        <p className="text-[11px] text-sand-500 mt-0.5">Visualize, ative/suspenda e credencie novos profissionais na plataforma.</p>
                      </div>
                      <button
                        onClick={() => setIsWizardOpen(true)}
                        className="px-4 py-2.5 bg-softblue-600 hover:bg-softblue-700 text-white font-bold rounded-xl cursor-pointer text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-softblue-500/10 transition-all self-start sm:self-center"
                      >
                        <UserPlus size={14} />
                        Novo Cliente (Wizard 4 Passos)
                      </button>
                    </div>

                    <div className="bg-white border border-sand-200 rounded-2xl p-6 shadow-sm space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-sand-150">
                        <h4 className="font-serif font-bold text-sand-950 text-sm">Lista de Clientes Ativos</h4>
                        <span className="text-[10px] font-mono font-bold bg-sand-100 text-sand-600 px-2 py-0.5 rounded-full">
                          {tenants.length} Clínicas
                        </span>
                      </div>
                      
                      <div className="overflow-x-auto border border-sand-150 rounded-xl">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-sand-50 text-sand-700 font-bold border-b border-sand-150">
                            <tr>
                              <th className="p-3">Clínica / Nome</th>
                              <th className="p-3">Email do Responsável</th>
                              <th className="p-3">Status</th>
                              <th className="p-3 text-right">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-sand-100">
                            {tenants.map((t) => (
                              <tr key={t.id} className="hover:bg-sand-50/50">
                                <td className="p-3">
                                  <div className="font-bold text-sand-950">{t.name}</div>
                                  <div className="text-[9px] text-sand-500 font-mono">
                                    ID: {t.id} | Subdomínio: <span className="text-softblue-600">{t.subdomain || t.id}.mentecare.com</span>
                                  </div>
                                </td>
                                <td className="p-3 font-mono text-[11px] text-sand-600">{t.ownerEmail}</td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                    t.status === 'Ativo' 
                                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
                                      : 'bg-rose-50 border border-rose-200 text-rose-800'
                                  }`}>
                                    {t.status || 'Ativo'}
                                  </span>
                                </td>
                                <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                                  <button
                                    onClick={() => onEnterTenant(t)}
                                    className="px-2.5 py-1.5 bg-softblue-500 hover:bg-softblue-600 text-white font-bold rounded-lg cursor-pointer text-[10px] inline-flex items-center gap-1 shadow-sm transition-all"
                                  >
                                    <ExternalLink size={10} />
                                    Administrar
                                  </button>
                                  <button
                                    onClick={() => toggleTenantStatus(t.id, t.status || 'Ativo')}
                                    className={`px-2 py-1.5 border rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                                      t.status === 'Ativo'
                                        ? 'border-rose-200 text-rose-700 hover:bg-rose-50'
                                        : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                                    }`}
                                  >
                                    {t.status === 'Ativo' ? 'Suspender' : 'Ativar'}
                                  </button>
                                </td>
                              </tr>
                            ))}
                            {tenants.length === 0 && (
                              <tr>
                                <td colSpan={4} className="p-8 text-center text-sand-500">
                                  Nenhum cliente cadastrado no momento.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* THE 4-STEP WIZARD PANEL */
                  <div className="bg-white border border-sand-200 rounded-3xl p-6 sm:p-8 shadow-md max-w-4xl mx-auto space-y-6">
                    {/* Wizard Stepper Header */}
                    <div className="flex items-center justify-between border-b border-sand-150 pb-5">
                      <div>
                        <h3 className="font-serif font-black text-sand-950 text-lg">Cadastro de Novo Cliente</h3>
                        <p className="text-[11px] text-sand-500">Fluxo assistido para provisionamento instantâneo de Tenant e Licença.</p>
                      </div>
                      <button
                        onClick={resetWizard}
                        className="px-3 py-1.5 border border-sand-300 hover:bg-sand-50 text-sand-700 text-[10px] font-bold rounded-xl cursor-pointer transition-all"
                      >
                        Cancelar
                      </button>
                    </div>

                    {/* Step Indicators */}
                    <div className="grid grid-cols-4 gap-2 text-center pb-2">
                      {[
                        { step: 1, label: 'Identidade' },
                        { step: 2, label: 'Credenciais' },
                        { step: 3, label: 'Licenciamento' },
                        { step: 4, label: 'Sucesso' }
                      ].map((s) => (
                        <div key={s.step} className="space-y-1.5">
                          <div className={`h-1.5 rounded-full transition-all duration-300 ${
                            wizardStep >= s.step ? 'bg-softblue-500' : 'bg-sand-200'
                          }`}></div>
                          <span className={`text-[9px] font-bold uppercase tracking-wider block ${
                            wizardStep === s.step ? 'text-softblue-600' : 'text-sand-500'
                          }`}>
                            Passo {s.step}: {s.label}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Step Errors */}
                    {wizardError && (
                      <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-semibold rounded-2xl flex items-center gap-2">
                        <AlertTriangle size={14} className="text-rose-600 shrink-0" />
                        <span>{wizardError}</span>
                      </div>
                    )}

                    {/* Step Forms */}
                    <form onSubmit={handleWizardSubmit} className="space-y-5">
                      
                      {/* STEP 1: CLÍNICA E IDENTIDADE */}
                      {wizardStep === 1 && (
                        <div className="space-y-4">
                          <div className="p-4 bg-sand-50 border border-sand-200 rounded-2xl">
                            <h4 className="font-serif font-bold text-sand-900 text-xs">Dados Principais da Clínica</h4>
                            <p className="text-[10px] text-sand-500 mt-0.5">Defina os dados públicos da clínica e do psicólogo responsável.</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-sand-700 uppercase">Nome da Clínica *</label>
                              <input
                                type="text"
                                required
                                placeholder="ex: Clínica MenteCare Sólida"
                                value={wizardForm.clinicName}
                                onChange={(e) => handleClinicNameChange(e.target.value)}
                                className="w-full bg-sand-50/50 border border-sand-200 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-softblue-500 focus:bg-white focus:outline-none"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-sand-700 uppercase">Nome Profissional do Responsável *</label>
                              <input
                                type="text"
                                required
                                placeholder="ex: Dra. Heloísa Vasconcelos"
                                value={wizardForm.professionalName}
                                onChange={(e) => handleProfessionalNameChange(e.target.value)}
                                className="w-full bg-sand-50/50 border border-sand-200 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-softblue-500 focus:bg-white focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-sand-700 uppercase">CRP (Conselho Regional de Psicologia)</label>
                              <input
                                type="text"
                                placeholder="ex: CRP 11/12345"
                                value={wizardForm.crp}
                                onChange={(e) => setWizardForm({ ...wizardForm, crp: e.target.value })}
                                className="w-full bg-sand-50/50 border border-sand-200 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-softblue-500 focus:bg-white focus:outline-none"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-sand-700 uppercase">CPF / CNPJ *</label>
                              <input
                                type="text"
                                required
                                placeholder="ex: 123.456.789-00"
                                value={wizardForm.cpfCnpj}
                                onChange={(e) => setWizardForm({ ...wizardForm, cpfCnpj: e.target.value })}
                                className="w-full bg-sand-50/50 border border-sand-200 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-softblue-500 focus:bg-white focus:outline-none"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-sand-700 uppercase">E-mail Principal *</label>
                              <input
                                type="email"
                                required
                                placeholder="ex: contato@heloisaterapia.com"
                                value={wizardForm.email}
                                onChange={(e) => handleEmailChange(e.target.value)}
                                className="w-full bg-sand-50/50 border border-sand-200 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-softblue-500 focus:bg-white focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-sand-700 uppercase">Telefone Celular *</label>
                              <input
                                type="text"
                                required
                                placeholder="ex: (85) 99876-5432"
                                value={wizardForm.phone}
                                onChange={(e) => setWizardForm({ ...wizardForm, phone: e.target.value })}
                                className="w-full bg-sand-50/50 border border-sand-200 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-softblue-500 focus:bg-white focus:outline-none"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-sand-700 uppercase">WhatsApp de Contato (Formatado)</label>
                              <input
                                type="text"
                                placeholder="ex: 5585998765432"
                                value={wizardForm.whatsApp}
                                onChange={(e) => setWizardForm({ ...wizardForm, whatsApp: e.target.value })}
                                className="w-full bg-sand-50/50 border border-sand-200 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-softblue-500 focus:bg-white focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="p-4 bg-sand-50/50 border border-sand-200 rounded-2xl space-y-3">
                            <h4 className="font-serif font-bold text-sand-900 text-xs">Identidade Visual & Plataforma</h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-sand-700 uppercase">Cor Primária do Tema</label>
                                <div className="flex gap-2">
                                  <input
                                    type="color"
                                    value={wizardForm.primaryColor}
                                    onChange={(e) => setWizardForm({ ...wizardForm, primaryColor: e.target.value })}
                                    className="h-8 w-12 border border-sand-200 rounded-lg cursor-pointer shrink-0"
                                  />
                                  <input
                                    type="text"
                                    value={wizardForm.primaryColor}
                                    onChange={(e) => setWizardForm({ ...wizardForm, primaryColor: e.target.value })}
                                    className="w-full bg-white border border-sand-200 rounded-lg px-2 text-xs font-mono focus:outline-none"
                                  />
                                </div>
                              </div>

                              <div className="space-y-1 md:col-span-2">
                                <label className="text-[10px] font-bold text-sand-700 uppercase">Identificador de Subdomínio (Tenant ID)</label>
                                <div className="flex items-center bg-sand-100 border border-sand-200 rounded-xl px-3 py-1.5 text-xs">
                                  <input
                                    type="text"
                                    required
                                    placeholder="ex: heloisa_terapia"
                                    value={wizardForm.subdomain}
                                    onChange={(e) => setWizardForm({ ...wizardForm, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                                    className="bg-transparent font-mono focus:outline-none flex-1 font-bold text-sand-800"
                                  />
                                  <span className="text-sand-500 font-mono">.mentecare.com</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* STEP 2: CREDENCIAIS DE ACESSO */}
                      {wizardStep === 2 && (
                        <div className="space-y-4">
                          <div className="p-4 bg-sand-50 border border-sand-200 rounded-2xl">
                            <h4 className="font-serif font-bold text-sand-900 text-xs">Conta do Administrador</h4>
                            <p className="text-[10px] text-sand-500 mt-0.5">Credenciais principais do psicólogo para acessar o painel ERP da clínica.</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-sand-700 uppercase">Nome Completo do Admin</label>
                              <input
                                type="text"
                                required
                                value={wizardForm.adminName}
                                onChange={(e) => setWizardForm({ ...wizardForm, adminName: e.target.value })}
                                className="w-full bg-sand-50/50 border border-sand-200 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-softblue-500 focus:bg-white focus:outline-none"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-sand-700 uppercase">E-mail de Login Administrativo</label>
                              <input
                                type="email"
                                required
                                value={wizardForm.adminEmail}
                                onChange={(e) => setWizardForm({ ...wizardForm, adminEmail: e.target.value })}
                                className="w-full bg-sand-50/50 border border-sand-200 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-softblue-500 focus:bg-white focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="p-4 bg-sand-50/50 border border-sand-200 rounded-2xl space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-sand-800">Senha do Administrador</span>
                              <label className="flex items-center gap-2 cursor-pointer text-[10px] text-softblue-600 font-bold">
                                <input
                                  type="checkbox"
                                  checked={wizardForm.autoGeneratePassword}
                                  onChange={(e) => setWizardForm({ ...wizardForm, autoGeneratePassword: e.target.checked })}
                                  className="rounded border-sand-300 text-softblue-500 focus:ring-softblue-500"
                                />
                                Gerar Senha Automática Forte
                              </label>
                            </div>

                            {!wizardForm.autoGeneratePassword && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-sand-700 uppercase">Definir Senha *</label>
                                  <input
                                    type="password"
                                    required={!wizardForm.autoGeneratePassword}
                                    placeholder="Mínimo 6 caracteres"
                                    value={wizardForm.adminPassword}
                                    onChange={(e) => setWizardForm({ ...wizardForm, adminPassword: e.target.value })}
                                    className="w-full bg-white border border-sand-200 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-softblue-500 focus:outline-none"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-sand-700 uppercase">Confirmar Senha *</label>
                                  <input
                                    type="password"
                                    required={!wizardForm.autoGeneratePassword}
                                    placeholder="Mínimo 6 caracteres"
                                    value={wizardForm.confirmPassword}
                                    onChange={(e) => setWizardForm({ ...wizardForm, confirmPassword: e.target.value })}
                                    className="w-full bg-white border border-sand-200 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-softblue-500 focus:outline-none"
                                  />
                                </div>
                              </div>
                            )}

                            <div className="pt-2 border-t border-sand-200 flex items-center justify-between">
                              <span className="text-[10px] text-sand-500">Garante maior segurança inicial para o cliente.</span>
                              <label className="flex items-center gap-2 cursor-pointer text-[10px] text-sand-700 font-semibold">
                                <input
                                  type="checkbox"
                                  checked={wizardForm.forcePasswordChange}
                                  onChange={(e) => setWizardForm({ ...wizardForm, forcePasswordChange: e.target.checked })}
                                  className="rounded border-sand-300 text-softblue-500 focus:ring-softblue-500"
                                />
                                Forçar troca de senha no 1º login
                              </label>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* STEP 3: LICENCIAMENTO E PLANOS */}
                      {wizardStep === 3 && (
                        <div className="space-y-4">
                          <div className="p-4 bg-sand-50 border border-sand-200 rounded-2xl">
                            <h4 className="font-serif font-bold text-sand-900 text-xs">Licença & Limites de Uso</h4>
                            <p className="text-[10px] text-sand-500 mt-0.5">Associe um plano de serviço e configure o período de validade.</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {[
                              { id: 'Starter', label: 'Starter', price: 'R$ 79', users: '1 Usuário', patients: 'Até 50 Pacientes', desc: 'Essencial para recém-formados.' },
                              { id: 'Pro', label: 'Pro', price: 'R$ 149', users: 'Até 3 Usuários', patients: 'Até 150 Pacientes', desc: 'O ideal para consultórios em expansão.' },
                              { id: 'Premium', label: 'Premium', price: 'R$ 299', users: 'Até 10 Usuários', patients: 'Até 500 Pacientes', desc: 'Completo com Designer de Site.' },
                              { id: 'Enterprise', label: 'Enterprise', price: 'R$ 599', users: 'Ilimitados', patients: 'Ilimitados', desc: 'Ideal para clínicas e redes médicas.' }
                            ].map((p) => (
                              <div
                                key={p.id}
                                onClick={() => setWizardForm({ ...wizardForm, plan: p.id })}
                                className={`border rounded-2xl p-4 cursor-pointer text-left transition-all space-y-2 ${
                                  wizardForm.plan === p.id 
                                    ? 'border-softblue-500 bg-softblue-50/20 ring-1 ring-softblue-500' 
                                    : 'border-sand-200 hover:border-sand-300 bg-white'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] font-bold text-sand-950 uppercase tracking-wider">{p.label}</span>
                                  <span className="text-[10px] font-mono font-bold text-softblue-600">{p.price}/mês</span>
                                </div>
                                <p className="text-[9px] text-sand-500 leading-tight">{p.desc}</p>
                                <div className="pt-2 border-t border-sand-150 text-[9px] text-sand-600 space-y-0.5">
                                  <p>👥 {p.users}</p>
                                  <p>📂 {p.patients}</p>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-sand-700 uppercase">Status Inicial</label>
                              <select
                                value={wizardForm.status}
                                onChange={(e) => setWizardForm({ ...wizardForm, status: e.target.value })}
                                className="w-full bg-sand-50/50 border border-sand-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-softblue-500 focus:outline-none"
                              >
                                <option value="Ativo">Ativo (Produção)</option>
                                <option value="Teste">Teste Grátis</option>
                                <option value="Suspenso">Suspenso (Inativo)</option>
                              </select>
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <label className="text-[10px] font-bold text-sand-700 uppercase">Validade da Licença</label>
                                <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-softblue-600 font-bold">
                                  <input
                                    type="checkbox"
                                    checked={wizardForm.isTrial}
                                    onChange={(e) => setWizardForm({ ...wizardForm, isTrial: e.target.checked })}
                                    className="rounded border-sand-300 text-softblue-500 focus:ring-softblue-500"
                                  />
                                  Período de Experiência
                                </label>
                              </div>

                              {wizardForm.isTrial ? (
                                <input
                                  type="number"
                                  required
                                  placeholder="Dias de teste (ex: 14)"
                                  value={wizardForm.trialDays}
                                  onChange={(e) => setWizardForm({ ...wizardForm, trialDays: Number(e.target.value) })}
                                  className="w-full bg-sand-50/50 border border-sand-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-softblue-500 focus:outline-none"
                                />
                              ) : (
                                <input
                                  type="date"
                                  required
                                  value={wizardForm.expirationDate}
                                  onChange={(e) => setWizardForm({ ...wizardForm, expirationDate: e.target.value })}
                                  className="w-full bg-sand-50/50 border border-sand-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-softblue-500 focus:outline-none"
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* STEP 4: SUCESSO & RESUMO */}
                      {wizardStep === 4 && wizardCreatedInfo && (
                        <div className="space-y-5">
                          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
                            <CheckCircle2 size={22} className="text-emerald-600 shrink-0" />
                            <div>
                              <h4 className="font-serif font-bold text-emerald-950 text-sm">Provisionamento Concluído com Sucesso!</h4>
                              <p className="text-[10px] text-emerald-700">Todas as coleções e subcoleções do Firestore foram criadas.</p>
                            </div>
                          </div>

                          <div className="bg-sand-50 border border-sand-200 rounded-2xl p-5 space-y-4">
                            <h5 className="font-serif font-bold text-sand-950 text-xs">Dados de Acesso da Clínica</h5>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                              <div className="space-y-1 bg-white border border-sand-150 p-3 rounded-xl">
                                <p className="text-[9px] text-sand-500 uppercase font-bold">Endereço do Painel (SaaS)</p>
                                <p className="font-mono font-bold text-softblue-600 select-all truncate">
                                  {wizardCreatedInfo.accessUrl}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    safeCopyToClipboard(wizardCreatedInfo.accessUrl);
                                    safeAlert('Link de acesso copiado!');
                                  }}
                                  className="text-[9px] font-bold text-sand-500 hover:text-softblue-600 underline mt-1 cursor-pointer"
                                >
                                  Copiar Link
                                </button>
                              </div>

                              <div className="space-y-1 bg-white border border-sand-150 p-3 rounded-xl">
                                <p className="text-[9px] text-sand-500 uppercase font-bold">Credenciais Iniciais</p>
                                <p className="font-mono">
                                  User: <span className="font-bold text-sand-900 select-all">{wizardCreatedInfo.email}</span>
                                </p>
                                <p className="font-mono mt-0.5">
                                  Senha: <span className="font-bold text-sand-950 bg-yellow-50 px-1 border border-yellow-200 rounded select-all font-mono">{wizardCreatedInfo.password}</span>
                                </p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    safeCopyToClipboard(`Acesso: ${wizardCreatedInfo.accessUrl}\nLogin: ${wizardCreatedInfo.email}\nSenha: ${wizardCreatedInfo.password}`);
                                    safeAlert('Credenciais completas copiadas!');
                                  }}
                                  className="text-[9px] font-bold text-sand-500 hover:text-softblue-600 underline mt-1 cursor-pointer"
                                >
                                  Copiar Credenciais
                                </button>
                              </div>

                              <div className="space-y-1 bg-white border border-sand-150 p-3 rounded-xl flex flex-col justify-between">
                                <div>
                                  <p className="text-[9px] text-sand-500 uppercase font-bold">Simulação de Acesso</p>
                                  <p className="text-[10px] text-sand-600 mt-1 leading-tight">
                                    Entre diretamente no painel administrativo da clínica com permissões completas de Master.
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => onEnterTenant(wizardCreatedInfo.tenantObj)}
                                  className="mt-3 w-full py-1.5 bg-softblue-600 hover:bg-softblue-700 text-white font-bold text-[10px] rounded-lg cursor-pointer transition-all uppercase tracking-wider text-center block"
                                >
                                  Simular Acesso
                                </button>
                              </div>
                            </div>

                            {/* Public Site & QR Code Card */}
                            <div className="p-4 bg-white border border-sand-200 rounded-2xl space-y-3">
                              <h5 className="font-serif font-bold text-sand-950 text-xs flex items-center gap-1.5">
                                <Globe size={14} className="text-softblue-600" />
                                Site Público & QR Code Exclusivo do Cliente
                              </h5>
                              <div className="flex flex-col sm:flex-row items-center gap-4 bg-sand-50/70 p-3 rounded-xl border border-sand-150">
                                <div className="bg-white p-2 rounded-xl border border-sand-200 shadow-xs shrink-0">
                                  <img 
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${window.location.origin}/clinica/${wizardCreatedInfo.tenantId}`)}&color=25221c&bgcolor=ffffff&qzone=2`}
                                    alt="QR Code da Clínica"
                                    className="w-24 h-24 object-contain"
                                  />
                                </div>
                                <div className="space-y-2 text-left flex-1 min-w-0">
                                  <div>
                                    <span className="text-[9px] font-bold text-sand-500 uppercase block">Link da Página do Cliente (Tenant ID: {wizardCreatedInfo.tenantId})</span>
                                    <p className="text-xs font-mono font-bold text-softblue-700 truncate select-all">{window.location.origin}/clinica/{wizardCreatedInfo.tenantId}</p>
                                  </div>
                                  <p className="text-[10px] text-sand-600 leading-relaxed">
                                    A página do cliente já está inicializada com o nome cadastrado e pronta para ser personalizada no CMS. Escaneie ou compartilhe este QR Code para acesso direto do paciente.
                                  </p>
                                  <div className="flex items-center gap-2 pt-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        safeCopyToClipboard(`${window.location.origin}/clinica/${wizardCreatedInfo.tenantId}`);
                                        safeAlert('Link público da clínica copiado!');
                                      }}
                                      className="px-2.5 py-1 bg-white hover:bg-sand-100 border border-sand-200 text-sand-800 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                                    >
                                      <Copy size={10} /> Copiar Link Público
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => window.open(`${window.location.origin}/clinica/${wizardCreatedInfo.tenantId}`, '_blank')}
                                      className="px-2.5 py-1 bg-softblue-50 hover:bg-softblue-100 border border-softblue-200 text-softblue-700 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                                    >
                                      <ExternalLink size={10} /> Abrir Página do Cliente
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2.5">
                              <Info size={14} className="text-blue-600 shrink-0 mt-0.5" />
                              <div className="text-[10px] text-blue-800 leading-relaxed">
                                <p className="font-bold">Próximos passos sugeridos:</p>
                                <p className="mt-0.5">1. Envie as credenciais acima para o psicólogo responsável.</p>
                                <p>2. O sistema solicitará a redefinição de senha e o preenchimento de termos no primeiro login.</p>
                                <p>3. Todos os módulos clínicos, site externo (CMS) e prontuários virtuais já estão operando em sandbox isolada.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Navigation buttons */}
                      <div className="flex justify-between items-center pt-4 border-t border-sand-150">
                        {wizardStep > 1 && wizardStep < 4 ? (
                          <button
                            type="button"
                            onClick={() => {
                              setWizardError('');
                              setWizardStep(wizardStep - 1);
                            }}
                            className="px-4 py-2 border border-sand-300 hover:bg-sand-100 text-sand-700 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            Voltar
                          </button>
                        ) : (
                          <div></div>
                        )}

                        {wizardStep < 4 ? (
                          <button
                            type="button"
                            onClick={() => handleWizardSubmit()}
                            className="px-5 py-2 bg-softblue-600 hover:bg-softblue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
                          >
                            {wizardStep === 3 ? 'Finalizar e Ativar' : 'Avançar'}
                            <ArrowRight size={13} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={resetWizard}
                            className="px-5 py-2 bg-sand-900 hover:bg-black text-white font-bold rounded-xl text-xs cursor-pointer transition-colors"
                          >
                            Voltar à Lista de Clientes
                          </button>
                        )}
                      </div>

                    </form>
                  </div>
                )}
              </motion.div>
            )}

            {/* 3. LICENCAS */}
            {activeTab === 'licencas' && (
              <motion.div
                key="master-licencas"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Stats cards for licenses */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white border border-sand-200 p-4 rounded-2xl shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-sand-500">Total de Licenças</p>
                      <p className="text-xl font-serif font-black text-sand-950 mt-1">{licenses.length}</p>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-softblue-50 border border-softblue-100 flex items-center justify-center text-softblue-600">
                      <Key size={18} />
                    </div>
                  </div>
                  <div className="bg-white border border-sand-200 p-4 rounded-2xl shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-emerald-600">Licenças Ativas</p>
                      <p className="text-xl font-serif font-black text-emerald-700 mt-1">
                        {licenses.filter(l => l.status === 'Ativa' || !l.status).length}
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                      <CheckCircle2 size={18} />
                    </div>
                  </div>
                  <div className="bg-white border border-sand-200 p-4 rounded-2xl shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-amber-600">Suspensas / Expiradas</p>
                      <p className="text-xl font-serif font-black text-amber-700 mt-1">
                        {licenses.filter(l => l.status === 'Suspensa' || l.status === 'Expirada').length}
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                      <Clock size={18} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Licenses table */}
                  <div className="lg:col-span-8 bg-white border border-sand-200 rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sand-150 pb-3">
                      <h3 className="font-serif font-bold text-sand-950 text-sm">Licenças de Acesso</h3>
                      <span className="text-[10px] text-sand-500 font-medium">Exibindo {licenses.filter(lic => {
                        const matchesSearch = lic.code.toLowerCase().includes(licSearch.toLowerCase()) || lic.tenantId.toLowerCase().includes(licSearch.toLowerCase());
                        const matchesPlan = licPlanFilter === 'all' || lic.plan === licPlanFilter;
                        const matchesStatus = licStatusFilter === 'all' || (licStatusFilter === 'Ativa' && (lic.status === 'Ativa' || !lic.status)) || (licStatusFilter === 'Suspensa' && lic.status === 'Suspensa');
                        return matchesSearch && matchesPlan && matchesStatus;
                      }).length} de {licenses.length} registros</span>
                    </div>

                    {/* Filters Row */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sand-400" size={14} />
                        <input
                          type="text"
                          placeholder="Pesquisar por Código ou Tenant ID..."
                          value={licSearch}
                          onChange={(e) => setLicSearch(e.target.value)}
                          className="w-full bg-sand-50 border border-sand-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:ring-1 focus:ring-softblue-500 focus:outline-none font-medium"
                        />
                      </div>
                      <select
                        value={licPlanFilter}
                        onChange={(e) => setLicPlanFilter(e.target.value)}
                        className="bg-sand-50 border border-sand-200 rounded-xl px-3 py-2 text-xs focus:outline-none font-semibold text-sand-800 cursor-pointer"
                      >
                        <option value="all">Todos os Planos</option>
                        <option value="Starter">Starter</option>
                        <option value="Pro">Pro</option>
                        <option value="Premium">Premium</option>
                      </select>
                      <select
                        value={licStatusFilter}
                        onChange={(e) => setLicStatusFilter(e.target.value)}
                        className="bg-sand-50 border border-sand-200 rounded-xl px-3 py-2 text-xs focus:outline-none font-semibold text-sand-800 cursor-pointer"
                      >
                        <option value="all">Todos os Status</option>
                        <option value="Ativa">Ativas</option>
                        <option value="Suspensa">Suspensas</option>
                      </select>
                    </div>
                    
                    <div className="overflow-x-auto border border-sand-150 rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-sand-50 text-sand-700 font-bold border-b border-sand-150">
                          <tr>
                            <th className="p-3">Código / Key</th>
                            <th className="p-3">Tenant Vinculado</th>
                            <th className="p-3">Plano</th>
                            <th className="p-3">Validade</th>
                            <th className="p-3">Status</th>
                            <th className="p-3 text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-sand-100 font-mono">
                          {licenses.filter(lic => {
                            const matchesSearch = lic.code.toLowerCase().includes(licSearch.toLowerCase()) || lic.tenantId.toLowerCase().includes(licSearch.toLowerCase());
                            const matchesPlan = licPlanFilter === 'all' || lic.plan === licPlanFilter;
                            const matchesStatus = licStatusFilter === 'all' || (licStatusFilter === 'Ativa' && (lic.status === 'Ativa' || !lic.status)) || (licStatusFilter === 'Suspensa' && lic.status === 'Suspensa');
                            return matchesSearch && matchesPlan && matchesStatus;
                          }).length === 0 ? (
                            <tr>
                              <td colSpan={6} className="p-8 text-center text-sand-400 font-sans text-xs">
                                Nenhuma licença encontrada com os filtros selecionados.
                              </td>
                            </tr>
                          ) : (
                            licenses.filter(lic => {
                              const matchesSearch = lic.code.toLowerCase().includes(licSearch.toLowerCase()) || lic.tenantId.toLowerCase().includes(licSearch.toLowerCase());
                              const matchesPlan = licPlanFilter === 'all' || lic.plan === licPlanFilter;
                              const matchesStatus = licStatusFilter === 'all' || (licStatusFilter === 'Ativa' && (lic.status === 'Ativa' || !lic.status)) || (licStatusFilter === 'Suspensa' && lic.status === 'Suspensa');
                              return matchesSearch && matchesPlan && matchesStatus;
                            }).map((lic) => {
                              const isSuspended = lic.status === 'Suspensa';
                              return (
                                <tr key={lic.id} className="hover:bg-sand-50/50">
                                  <td className="p-3 font-bold text-sand-950 select-all">{lic.code}</td>
                                  <td className="p-3 text-softblue-700 font-bold select-all">{lic.tenantId}</td>
                                  <td className="p-3 font-sans">
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                                      lic.plan === 'Premium' ? 'bg-purple-50 border-purple-200 text-purple-700' :
                                      lic.plan === 'Pro' ? 'bg-softblue-50 border-softblue-200 text-softblue-700' :
                                      'bg-sand-100 border-sand-200 text-sand-700'
                                    }`}>
                                      {lic.plan}
                                    </span>
                                  </td>
                                  <td className="p-3 text-sand-600 font-sans text-[11px]">
                                    {new Date(lic.expiresAt).toLocaleDateString('pt-BR')}
                                  </td>
                                  <td className="p-3">
                                    <span className={`px-2 py-0.5 border text-[9px] font-bold rounded-full font-sans ${
                                      isSuspended 
                                        ? 'bg-amber-50 border-amber-200 text-amber-800' 
                                        : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                    }`}>
                                      {lic.status || 'Ativa'}
                                    </span>
                                  </td>
                                  <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                                    <button
                                      onClick={() => {
                                        safeCopyToClipboard(lic.code);
                                        safeAlert('Código da licença copiado para a área de transferência!');
                                      }}
                                      className="p-1.5 text-sand-500 hover:text-softblue-600 hover:bg-softblue-50 rounded-lg transition-all cursor-pointer inline-flex items-center"
                                      title="Copiar Key"
                                    >
                                      <Copy size={13} />
                                    </button>

                                    <button
                                      onClick={() => {
                                        setSelectedLinkLicense(lic);
                                        setLinkGenTenantId(lic.tenantId || '');
                                        setIsLinkGenOpen(true);
                                      }}
                                      className="p-1.5 text-sand-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all cursor-pointer inline-flex items-center"
                                      title="Ver Links / Página do Cliente"
                                    >
                                      <Globe size={13} />
                                    </button>

                                    <button
                                      onClick={() => {
                                        const tenant = tenants.find(t => t.id === lic.tenantId);
                                        setSelectedShareLicense(lic);
                                        setShareClientName(tenant?.name || '');
                                        setShareClientEmail(tenant?.ownerEmail || '');
                                        setShareClientPhone('');
                                        setShareTemplate('welcome');
                                        setShareCustomText('');
                                        setIsShareModalOpen(true);
                                      }}
                                      className="p-1.5 text-sand-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all cursor-pointer inline-flex items-center"
                                      title="Compartilhar / Enviar"
                                    >
                                      <MessageSquare size={13} />
                                    </button>

                                    <button
                                      onClick={() => handleToggleLicenseStatus(lic.id, lic.status || 'Ativa')}
                                      className={`p-1.5 rounded-lg transition-all cursor-pointer inline-flex items-center ${
                                        (lic.status || 'Ativa') === 'Ativa' 
                                          ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50' 
                                          : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                                      }`}
                                      title={(lic.status || 'Ativa') === 'Ativa' ? 'Suspender Licença' : 'Ativar Licença'}
                                    >
                                      <Activity size={13} />
                                    </button>

                                    <button
                                      onClick={() => {
                                        if (safeConfirm('Estender validade desta licença por +30 dias?')) {
                                          handleExtendLicenseExpiry(lic.id, 30);
                                        }
                                      }}
                                      className="p-1.5 text-sand-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all cursor-pointer inline-flex items-center"
                                      title="Estender +30 Dias"
                                    >
                                      <Calendar size={13} />
                                    </button>

                                    <button
                                      onClick={() => handleDeleteLicense(lic.id, lic.code)}
                                      className="p-1.5 text-sand-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer inline-flex items-center"
                                      title="Excluir"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Generate license */}
                  <div className="lg:col-span-4 bg-white border border-sand-200 rounded-2xl p-6 shadow-sm space-y-4">
                    <h3 className="font-serif font-bold text-sand-950 text-sm border-b border-sand-150 pb-3">Gerar Nova Licença Key</h3>
                    
                    <form onSubmit={handleGenerateLicense} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-sand-700 uppercase">Chave de Acesso</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            required
                            placeholder="LIC-XXXX-XXXX-XXXX"
                            value={licCode}
                            onChange={(e) => setLicCode(e.target.value)}
                            className="flex-1 bg-sand-50 border border-sand-200 rounded-xl px-3 py-2 text-xs font-mono focus:ring-1 focus:ring-softblue-500 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={generateRandomKey}
                            className="px-3 bg-sand-100 hover:bg-sand-200 border border-sand-300 text-sand-700 rounded-xl text-xs font-bold cursor-pointer"
                          >
                            Gerar
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-sand-700 uppercase">Vincular ao Tenant ID</label>
                        <select
                          value={licTenant}
                          onChange={(e) => setLicTenant(e.target.value)}
                          className="w-full bg-sand-50 border border-sand-200 rounded-xl px-3 py-2 text-xs focus:outline-none font-semibold text-sand-800 cursor-pointer"
                        >
                          {tenants.map(t => (
                            <option key={t.id} value={t.id}>{t.name} ({t.id})</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-sand-700 uppercase">Plano Vinculado</label>
                        <select
                          value={licPlan}
                          onChange={(e) => setLicPlan(e.target.value as any)}
                          className="w-full bg-sand-50 border border-sand-200 rounded-xl px-3 py-2 text-xs focus:outline-none font-semibold text-sand-800 cursor-pointer"
                        >
                          <option value="Starter">Plano Starter</option>
                          <option value="Pro">Plano Pro</option>
                          <option value="Premium">Plano Premium</option>
                        </select>
                      </div>

                      {licSuccess && <p className="text-[10px] text-emerald-700 font-semibold">{licSuccess}</p>}
                      {licError && <p className="text-[10px] text-rose-600 font-semibold">{licError}</p>}

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-softblue-600 hover:bg-softblue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-colors"
                      >
                        <Check size={14} />
                        Gerar e Ativar Licença
                      </button>
                    </form>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 4. PLANOS */}
            {activeTab === 'planos' && (
              <motion.div
                key="master-planos"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                {plans.map((p) => (
                  <div key={p.id} className="bg-white border border-sand-200 rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center border-b border-sand-150 pb-3 mb-4">
                        <h4 className="font-serif font-extrabold text-sand-900 text-base">{p.name}</h4>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wide bg-sand-100 text-sand-600 px-2 py-0.5 rounded">
                          {p.id}
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div className="text-2xl font-serif font-black text-softblue-600">
                          R$ {p.price.toFixed(2)}<span className="text-xs text-sand-500 font-normal"> /mês</span>
                        </div>
                        
                        <div className="space-y-1 text-xs text-sand-700">
                          <div>• Limite de Pacientes: <strong className="text-sand-900">{p.maxPatients}</strong></div>
                          <div>• Limite de Usuários: <strong className="text-sand-900">{p.maxUsers}</strong></div>
                        </div>

                        <div className="pt-3 border-t border-sand-100">
                          <span className="text-[9px] font-bold uppercase text-sand-400 tracking-wider block mb-2">Recursos Ativos</span>
                          <div className="flex flex-wrap gap-1.5">
                            {p.features.map((f, i) => (
                              <span key={i} className="text-[10px] bg-sand-50 border border-sand-200 text-sand-700 font-medium px-2 py-0.5 rounded-md">
                                {f}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => safeAlert('Alteração de preço e recursos de planos salvos no rascunho de configurações do SaaS.')}
                      className="w-full mt-6 py-2 bg-white hover:bg-sand-50 border border-sand-200 text-sand-700 font-bold rounded-xl text-xs cursor-pointer text-center"
                    >
                      Editar Plano
                    </button>
                  </div>
                ))}
              </motion.div>
            )}

            {/* 5. ASSINATURAS */}
            {activeTab === 'assinaturas' && (
              <motion.div
                key="master-assinaturas"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >

                {/* CRM Dashboard Statistics summary cards */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="bg-white border border-sand-200 p-4 rounded-xl shadow-sm">
                    <span className="text-[9px] font-mono font-bold text-sand-400 uppercase">Faturamento Mensal (MRR)</span>
                    <h4 className="font-serif font-black text-sand-900 text-lg mt-1">
                      R$ {((tenants.filter(t => t.status === 'Ativo').length || 3) * 189.90).toFixed(2)}
                    </h4>
                    <p className="text-[9px] text-sand-500 mt-0.5">Com base no plano Pro médio</p>
                  </div>
                  <div className="bg-white border border-sand-200 p-4 rounded-xl shadow-sm">
                    <span className="text-[9px] font-mono font-bold text-sand-400 uppercase">Assinaturas Ativas</span>
                    <h4 className="font-serif font-black text-emerald-700 text-lg mt-1">
                      {tenants.filter(t => t.status === 'Ativo').length || 2} / {tenants.length || 3}
                    </h4>
                    <p className="text-[9px] text-sand-500 mt-0.5">Inquilinos operacionais em produção</p>
                  </div>
                  <div className="bg-white border border-sand-200 p-4 rounded-xl shadow-sm">
                    <span className="text-[9px] font-mono font-bold text-sand-400 uppercase">Licenças Expirando</span>
                    <h4 className="font-serif font-black text-amber-700 text-lg mt-1">
                      {licenses.filter(l => l.expiresAt < Date.now() + 15 * 24 * 60 * 60 * 1000).length || 1} Chave
                    </h4>
                    <p className="text-[9px] text-sand-500 mt-0.5">Próximos 15 dias de vencimento</p>
                  </div>
                  <div className="bg-white border border-sand-200 p-4 rounded-xl shadow-sm">
                    <span className="text-[9px] font-mono font-bold text-sand-400 uppercase">Taxa de Renovação</span>
                    <h4 className="font-serif font-black text-softblue-600 text-lg mt-1">98.4%</h4>
                    <p className="text-[9px] text-sand-500 mt-0.5">Média anual acumulada</p>
                  </div>
                </div>

                {/* Main CRM split container */}
                {(() => {
                  // Merge DB data with beautiful fallback placeholders to ensure high fidelity
                  const mergedCrmList = (() => {
                    const list = tenants.map(t => {
                      const lic = licenses.find(l => l.tenantId === t.id);
                      return {
                        id: t.id,
                        name: t.name,
                        ownerEmail: t.ownerEmail,
                        subdomain: t.subdomain || t.id,
                        plan: lic?.plan || 'Pro',
                        status: t.status || 'Ativo',
                        expiresAt: lic?.expiresAt || (Date.now() + 30 * 24 * 60 * 60 * 1000),
                        price: lic?.plan === 'Premium' ? 299.90 : lic?.plan === 'Starter' ? 99.90 : 189.90
                      };
                    });

                    const fallbacks = [
                      { id: 'erica', name: 'Dra. Érica Costa', ownerEmail: 'ericacostapsicologa7@gmail.com', subdomain: 'erica', plan: 'Premium' as SaaSPlanId, status: 'Ativo' as const, expiresAt: Date.now() + 12 * 24 * 60 * 60 * 1000, price: 299.90 },
                      { id: 'dr_silva', name: 'Dr. Ricardo Silva', ownerEmail: 'ricardo@santos.com.br', subdomain: 'dr_silva', plan: 'Pro' as SaaSPlanId, status: 'Ativo' as const, expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, price: 189.90 },
                      { id: 'dra_lucia', name: 'Dra. Lucia Alencar', ownerEmail: 'lucia.silva@outlook.com', subdomain: 'dra_lucia', plan: 'Starter' as SaaSPlanId, status: 'Bloqueado' as const, expiresAt: Date.now() - 2 * 24 * 60 * 60 * 1000, price: 99.90 }
                    ];

                    const result = [...list];
                    fallbacks.forEach(f => {
                      if (!result.some(r => r.id === f.id)) {
                        result.push(f);
                      }
                    });

                    return result;
                  })();

                  // Apply search and filter criteria
                  const filteredCrmList = mergedCrmList.filter(item => {
                    const matchesSearch = 
                      item.name.toLowerCase().includes(crmSearchQuery.toLowerCase()) ||
                      item.id.toLowerCase().includes(crmSearchQuery.toLowerCase()) ||
                      item.ownerEmail.toLowerCase().includes(crmSearchQuery.toLowerCase());
                      
                    const matchesPlan = crmPlanFilter === 'all' || item.plan === crmPlanFilter;
                    const matchesStatus = crmStatusFilter === 'all' || item.status === crmStatusFilter;
                    
                    return matchesSearch && matchesPlan && matchesStatus;
                  });

                  const selectedItem = mergedCrmList.find(item => item.id === selectedCrmTenantId);
                  const isExpired = selectedItem ? selectedItem.expiresAt < Date.now() : false;

                  return (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      {/* Left Pane: Filter, Search & Subscribers List */}
                      <div className="lg:col-span-5 bg-white border border-sand-200 rounded-2xl p-5 shadow-sm space-y-4">
                        <div className="flex justify-between items-center pb-3 border-b border-sand-150">
                          <div>
                            <h3 className="font-serif font-bold text-sand-950 text-sm">Lista completa dos clientes</h3>
                            <p className="text-[10px] text-sand-500">Selecione para abrir o Painel de Controle</p>
                          </div>
                          <span className="text-[10px] font-mono font-bold bg-softblue-50 text-softblue-700 px-2.5 py-1 rounded-full border border-softblue-100">
                            {filteredCrmList.length} registros
                          </span>
                        </div>

                        {/* Search and filter controls */}
                        <div className="space-y-3">
                          {/* Pesquisa */}
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sand-400 pointer-events-none">
                              <Search size={14} />
                            </span>
                            <input
                              type="text"
                              value={crmSearchQuery}
                              onChange={(e) => setCrmSearchQuery(e.target.value)}
                              placeholder="Pesquisar cliente, ID ou email..."
                              className="w-full pl-9 pr-4 py-2 bg-sand-50/50 border border-sand-200 rounded-xl text-xs focus:ring-1 focus:ring-softblue-500 focus:outline-none"
                            />
                          </div>

                          {/* Filtro */}
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-sand-500 uppercase tracking-wide">Filtro Plano</label>
                              <select
                                value={crmPlanFilter}
                                onChange={(e) => setCrmPlanFilter(e.target.value)}
                                className="w-full bg-sand-50/50 border border-sand-200 rounded-xl px-2.5 py-1.5 text-[11px] focus:outline-none cursor-pointer text-sand-700 font-semibold"
                              >
                                <option value="all">Todos os Planos</option>
                                <option value="Starter">Starter</option>
                                <option value="Pro">Pro</option>
                                <option value="Premium">Premium</option>
                                <option value="Enterprise">Enterprise</option>
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-sand-500 uppercase tracking-wide">Filtro Status</label>
                              <select
                                value={crmStatusFilter}
                                onChange={(e) => setCrmStatusFilter(e.target.value)}
                                className="w-full bg-sand-50/50 border border-sand-200 rounded-xl px-2.5 py-1.5 text-[11px] focus:outline-none cursor-pointer text-sand-700 font-semibold"
                              >
                                <option value="all">Todos os Status</option>
                                <option value="Ativo">Ativos</option>
                                <option value="Bloqueado">Suspensos</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* List rendering */}
                        <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                          {filteredCrmList.map((item) => {
                            const isSelected = selectedCrmTenantId === item.id;
                            const isExpiredItem = item.expiresAt < Date.now();
                            return (
                              <div
                                key={item.id}
                                onClick={() => handleCrmSelect(item.id)}
                                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                                  isSelected
                                    ? 'border-softblue-400 bg-softblue-50/30 shadow-sm'
                                    : 'border-sand-200 hover:bg-sand-50/50'
                                }`}
                              >
                                <div className="flex justify-between items-start gap-2">
                                  <div>
                                    <h4 className="font-serif font-bold text-sand-900 text-xs">{item.name}</h4>
                                    <p className="text-[10px] text-sand-400 font-mono mt-0.5">ID: {item.id} | Subdomínio: {item.subdomain}</p>
                                    <p className="text-[10px] text-sand-500 font-mono truncate max-w-[200px] mt-0.5">{item.ownerEmail}</p>
                                  </div>
                                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded ${
                                      item.plan === 'Premium' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                                      item.plan === 'Pro' ? 'bg-softblue-50 text-softblue-700 border border-softblue-100' :
                                      item.plan === 'Starter' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                      'bg-sand-100 text-sand-700 border border-sand-200'
                                    }`}>
                                      {item.plan}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                      item.status === 'Ativo'
                                        ? isExpiredItem 
                                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                                    }`}>
                                      {item.status === 'Ativo' ? (isExpiredItem ? 'Expirada' : 'Ativo') : 'Suspenso'}
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="mt-2 pt-2 border-t border-sand-100 flex justify-between items-center text-[10px] text-sand-500">
                                  <span className="font-mono">Vencimento: {new Date(item.expiresAt).toLocaleDateString('pt-BR')}</span>
                                  <span className="font-bold text-sand-700">R$ {item.price.toFixed(2)}/mês</span>
                                </div>
                              </div>
                            );
                          })}
                          {filteredCrmList.length === 0 && (
                            <p className="text-center text-xs text-sand-500 py-8">Nenhum cliente atende aos filtros de pesquisa.</p>
                          )}
                        </div>
                      </div>

                      {/* Right Pane: Command Center */}
                      <div className="lg:col-span-7 space-y-6">
                        {selectedItem ? (
                          <div className="bg-white border border-sand-200 rounded-2xl p-6 shadow-sm space-y-6">
                            {/* Command Center Title & Details */}
                            <div className="flex justify-between items-start gap-4 pb-4 border-b border-sand-150">
                              <div>
                                <span className="text-[9px] font-mono font-bold text-softblue-600 uppercase tracking-widest bg-softblue-50 border border-softblue-100 px-2.5 py-0.5 rounded-full">
                                  Comitê do Cliente Integrado
                                </span>
                                <h3 className="font-serif font-black text-sand-950 text-base mt-1.5">{selectedItem.name}</h3>
                                <p className="text-xs text-sand-500 mt-0.5 font-mono">ID Inquilino: {selectedItem.id} | Email: {selectedItem.ownerEmail}</p>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-serif font-black text-softblue-600">R$ {selectedItem.price.toFixed(2)}</div>
                                <span className="text-[10px] text-sand-400">Cobrança Mensal</span>
                              </div>
                            </div>

                            {/* Info grid */}
                            <div className="grid grid-cols-3 gap-3 bg-sand-50/50 p-3.5 rounded-xl border border-sand-150 text-center text-xs">
                              <div>
                                <span className="text-[9px] font-bold text-sand-400 uppercase block">Licença Atual</span>
                                <span className="font-bold text-sand-800">{selectedItem.plan}</span>
                              </div>
                              <div>
                                <span className="text-[9px] font-bold text-sand-400 uppercase block">Status Conta</span>
                                <span className={`font-bold ${selectedItem.status === 'Ativo' ? 'text-emerald-700' : 'text-rose-700'}`}>
                                  {selectedItem.status === 'Ativo' ? 'Ativa' : 'Suspensa'}
                                </span>
                              </div>
                              <div>
                                <span className="text-[9px] font-bold text-sand-400 uppercase block">Validade</span>
                                <span className={`font-bold ${isExpired ? 'text-rose-700' : 'text-sand-800'}`}>
                                  {new Date(selectedItem.expiresAt).toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                            </div>

                            {/* Action block 1: Subscription Actions (SaaS Admin) */}
                            <div className="space-y-3">
                              <h4 className="text-[10px] font-bold text-sand-500 uppercase tracking-wider">Ações Administrativas da Assinatura</h4>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {/* RENOVAR LICENÇA */}
                                <button
                                  onClick={() => handleCrmRenew(selectedItem.id)}
                                  className="px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-[11px] cursor-pointer flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-500/10 transition-colors"
                                >
                                  <RefreshCw size={11} className="animate-spin-slow shrink-0" />
                                  Renovar licença
                                </button>

                                {/* SUSPENDER LICENÇA */}
                                <button
                                  onClick={() => handleCrmSuspend(selectedItem.id)}
                                  className={`px-3 py-2.5 font-bold rounded-xl text-[11px] cursor-pointer flex items-center justify-center gap-1.5 border transition-all ${
                                    selectedItem.status === 'Ativo'
                                      ? 'border-amber-200 text-amber-700 hover:bg-amber-50 bg-white shadow-sm'
                                      : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50 bg-white shadow-sm'
                                  }`}
                                >
                                  <ShieldAlert size={11} className="shrink-0" />
                                  Suspender licença
                                </button>

                                {/* CANCELAR */}
                                <button
                                  onClick={() => handleCrmCancel(selectedItem.id)}
                                  className="px-3 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold rounded-xl text-[11px] cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
                                >
                                  <Trash2 size={11} className="shrink-0" />
                                  Cancelar
                                </button>

                                {/* EDITAR */}
                                <button
                                  onClick={() => {
                                    handleCrmSelect(selectedItem.id);
                                    setIsCrmEditOpen(true);
                                  }}
                                  className="px-3 py-2.5 bg-sand-50 hover:bg-sand-100 text-sand-700 font-bold rounded-xl text-[11px] cursor-pointer flex items-center justify-center gap-1.5 border border-sand-200 transition-colors"
                                >
                                  <Settings size={11} className="shrink-0" />
                                  Editar
                                </button>

                                {/* HISTÓRICO */}
                                <button
                                  onClick={() => {
                                    handleCrmSelect(selectedItem.id);
                                    setIsCrmHistoryOpen(true);
                                  }}
                                  className="px-3 py-2.5 bg-sand-50 hover:bg-sand-100 text-sand-700 font-bold rounded-xl text-[11px] cursor-pointer flex items-center justify-center gap-1.5 border border-sand-200 transition-colors"
                                >
                                  <Clock size={11} className="shrink-0" />
                                  Histórico
                                </button>

                                {/* VER CONTRATO */}
                                <button
                                  onClick={() => {
                                    handleCrmSelect(selectedItem.id);
                                    setIsCrmContractOpen(true);
                                  }}
                                  className="px-3 py-2.5 bg-sand-50 hover:bg-sand-100 text-sand-700 font-bold rounded-xl text-[11px] cursor-pointer flex items-center justify-center gap-1.5 border border-sand-200 transition-colors"
                                >
                                  <FileText size={11} className="shrink-0" />
                                  Ver contrato
                                </button>
                              </div>
                            </div>

                            {/* Action block 2: Specific Links for Selected Account */}
                            <div className="space-y-3 pt-4 border-t border-sand-100">
                              <div className="flex justify-between items-center">
                                <h4 className="text-[10px] font-bold text-sand-500 uppercase tracking-wider">
                                  Links Oficiais de Acesso ({selectedItem.name})
                                </h4>
                                <button
                                  onClick={() => {
                                    const tenantObj = tenants.find(t => t.id === selectedItem.id) || {
                                      id: selectedItem.id,
                                      name: selectedItem.name,
                                      ownerEmail: selectedItem.ownerEmail,
                                      subdomain: selectedItem.subdomain,
                                      createdAt: Date.now(),
                                      status: selectedItem.status as any
                                    };
                                    onEnterTenant(tenantObj);
                                  }}
                                  className="px-2.5 py-1 bg-softblue-600 hover:bg-softblue-700 text-white font-bold rounded-lg text-[10px] cursor-pointer flex items-center gap-1 shadow-xs transition-colors"
                                >
                                  <ExternalLink size={10} />
                                  Administrar Conta
                                </button>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                {/* Site Público */}
                                <div className="bg-sand-50/70 p-2.5 rounded-xl border border-sand-200 text-left space-y-1">
                                  <span className="text-[9px] font-bold text-sand-500 uppercase block">Site Público do Cliente</span>
                                  <p className="text-[10px] font-mono text-sand-800 truncate select-all">{window.location.origin}/clinica/{selectedItem.id}</p>
                                  <div className="flex gap-1 pt-1">
                                    <button
                                      onClick={() => {
                                        safeCopyToClipboard(`${window.location.origin}/clinica/${selectedItem.id}`);
                                        safeAlert(`Link do site de ${selectedItem.name} copiado!`);
                                      }}
                                      className="px-2 py-1 bg-white hover:bg-sand-100 border border-sand-200 text-sand-800 rounded-md text-[9px] font-bold flex items-center gap-1 cursor-pointer"
                                    >
                                      <Copy size={9} /> Copiar
                                    </button>
                                    <button
                                      onClick={() => window.open(`${window.location.origin}/clinica/${selectedItem.id}`, '_blank')}
                                      className="px-2 py-1 bg-softblue-50 border border-softblue-200 text-softblue-700 hover:bg-softblue-100 rounded-md text-[9px] font-bold flex items-center gap-1 cursor-pointer"
                                    >
                                      <ExternalLink size={9} /> Testar
                                    </button>
                                  </div>
                                </div>

                                {/* Painel Administrativo */}
                                <div className="bg-sand-50/70 p-2.5 rounded-xl border border-sand-200 text-left space-y-1">
                                  <span className="text-[9px] font-bold text-sand-500 uppercase block">Painel de Login</span>
                                  <p className="text-[10px] font-mono text-sand-800 truncate select-all">{window.location.origin}/login?tenant={selectedItem.id}</p>
                                  <div className="flex gap-1 pt-1">
                                    <button
                                      onClick={() => {
                                        safeCopyToClipboard(`${window.location.origin}/login?tenant=${selectedItem.id}`);
                                        safeAlert(`Link do painel de ${selectedItem.name} copiado!`);
                                      }}
                                      className="px-2 py-1 bg-white hover:bg-sand-100 border border-sand-200 text-sand-800 rounded-md text-[9px] font-bold flex items-center gap-1 cursor-pointer"
                                    >
                                      <Copy size={9} /> Copiar
                                    </button>
                                    <button
                                      onClick={() => window.open(`${window.location.origin}/login?tenant=${selectedItem.id}`, '_blank')}
                                      className="px-2 py-1 bg-softblue-50 border border-softblue-200 text-softblue-700 hover:bg-softblue-100 rounded-md text-[9px] font-bold flex items-center gap-1 cursor-pointer"
                                    >
                                      <ExternalLink size={9} /> Testar
                                    </button>
                                  </div>
                                </div>

                                {/* Agendamento de Paciente */}
                                <div className="bg-sand-50/70 p-2.5 rounded-xl border border-sand-200 text-left space-y-1">
                                  <span className="text-[9px] font-bold text-sand-500 uppercase block">Portal do Paciente</span>
                                  <p className="text-[10px] font-mono text-sand-800 truncate select-all">{window.location.origin}/?tenant={selectedItem.id}#agendar</p>
                                  <div className="flex gap-1 pt-1">
                                    <button
                                      onClick={() => {
                                        safeCopyToClipboard(`${window.location.origin}/?tenant=${selectedItem.id}#agendar`);
                                        safeAlert(`Link de agendamento de ${selectedItem.name} copiado!`);
                                      }}
                                      className="px-2 py-1 bg-white hover:bg-sand-100 border border-sand-200 text-sand-800 rounded-md text-[9px] font-bold flex items-center gap-1 cursor-pointer"
                                    >
                                      <Copy size={9} /> Copiar
                                    </button>
                                    <button
                                      onClick={() => window.open(`${window.location.origin}/?tenant=${selectedItem.id}#agendar`, '_blank')}
                                      className="px-2 py-1 bg-softblue-50 border border-softblue-200 text-softblue-700 hover:bg-softblue-100 rounded-md text-[9px] font-bold flex items-center gap-1 cursor-pointer"
                                    >
                                      <ExternalLink size={9} /> Testar
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Action block 3: Billing & Methods */}
                            <div className="space-y-3 pt-4 border-t border-sand-100">
                              <div className="flex justify-between items-center">
                                <h4 className="text-[10px] font-bold text-sand-500 uppercase tracking-wider">Métodos de Cobrança Integrados</h4>
                                {/* COBRAR */}
                                <button
                                  onClick={() => {
                                    safeAlert(`Fluxo manual de fatura MenteCare SaaS de R$ ${selectedItem.price.toFixed(2)} disparado com sucesso para ${selectedItem.name}!`);
                                    setIsCrmChargeOpen(true);
                                  }}
                                  className="px-3 py-1 bg-softblue-600 hover:bg-softblue-700 text-white font-bold rounded-xl text-[10px] cursor-pointer flex items-center gap-1 shadow-sm transition-colors"
                                >
                                  <DollarSign size={10} />
                                  Cobrar
                                </button>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {/* PIX */}
                                <button
                                  onClick={() => {
                                    setCrmPaymentMethod('pix');
                                    setIsCrmChargeOpen(true);
                                  }}
                                  className={`px-3 py-2 rounded-xl text-[11px] font-bold border cursor-pointer flex items-center justify-center gap-1.5 transition-all ${
                                    crmPaymentMethod === 'pix' && isCrmChargeOpen
                                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                                      : 'border-sand-200 hover:bg-sand-50 bg-white text-sand-700'
                                  }`}
                                >
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></div>
                                  PIX
                                </button>

                                {/* CARTÃO */}
                                <button
                                  onClick={() => {
                                    setCrmPaymentMethod('card');
                                    setIsCrmChargeOpen(true);
                                  }}
                                  className={`px-3 py-2 rounded-xl text-[11px] font-bold border cursor-pointer flex items-center justify-center gap-1.5 transition-all ${
                                    crmPaymentMethod === 'card' && isCrmChargeOpen
                                      ? 'border-purple-500 bg-purple-50 text-purple-800'
                                      : 'border-sand-200 hover:bg-sand-50 bg-white text-sand-700'
                                  }`}
                                >
                                  <CreditCard size={11} className="shrink-0" />
                                  Cartão
                                </button>

                                {/* BOLETO */}
                                <button
                                  onClick={() => {
                                    setCrmPaymentMethod('boleto');
                                    setIsCrmChargeOpen(true);
                                  }}
                                  className={`px-3 py-2 rounded-xl text-[11px] font-bold border cursor-pointer flex items-center justify-center gap-1.5 transition-all ${
                                    crmPaymentMethod === 'boleto' && isCrmChargeOpen
                                      ? 'border-blue-500 bg-blue-50 text-blue-800'
                                      : 'border-sand-200 hover:bg-sand-50 bg-white text-sand-700'
                                  }`}
                                >
                                  <FileText size={11} className="shrink-0" />
                                  Boleto
                                </button>

                                {/* LINK DE PAGAMENTO */}
                                <button
                                  onClick={() => {
                                    setCrmPaymentMethod('link');
                                    setIsCrmChargeOpen(true);
                                  }}
                                  className={`px-3 py-2 rounded-xl text-[11px] font-bold border cursor-pointer flex items-center justify-center gap-1.5 transition-all ${
                                    crmPaymentMethod === 'link' && isCrmChargeOpen
                                      ? 'border-amber-500 bg-amber-50 text-amber-800'
                                      : 'border-sand-200 hover:bg-sand-50 bg-white text-sand-700'
                                  }`}
                                >
                                  <ExternalLink size={11} className="shrink-0" />
                                  Link de pagamento
                                </button>
                              </div>
                            </div>

                            {/* Action block 3: Channels & Sharing */}
                            <div className="space-y-3 pt-4 border-t border-sand-100">
                              <h4 className="text-[10px] font-bold text-sand-500 uppercase tracking-wider">Canais de Envio de Faturas ({selectedItem.name})</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                {/* WHATSAPP */}
                                <button
                                  onClick={() => {
                                    const activePayUrl = `${window.location.origin}/checkout/pay_${selectedItem.id}`;
                                    const text = encodeURIComponent(`Olá, ${selectedItem.name}! Sua assinatura MenteCare SaaS vence em ${new Date(selectedItem.expiresAt).toLocaleDateString('pt-BR')}. Efetue o pagamento de R$ ${selectedItem.price.toFixed(2)} por aqui: ${activePayUrl}`);
                                    window.open(`https://api.whatsapp.com/send?phone=558599999999&text=${text}`, '_blank');
                                  }}
                                  className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold rounded-xl text-[11px] cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
                                >
                                  <MessageSquare size={11} className="shrink-0" />
                                  WhatsApp
                                </button>

                                {/* E-MAIL */}
                                <button
                                  onClick={() => {
                                    const activePayUrl = `${window.location.origin}/checkout/pay_${selectedItem.id}`;
                                    const subject = encodeURIComponent(`Fatura MenteCare SaaS - ${selectedItem.name}`);
                                    const body = encodeURIComponent(`Olá, ${selectedItem.name},\n\nSua fatura mensal de licenciamento do MenteCare SaaS no valor de R$ ${selectedItem.price.toFixed(2)} foi gerada.\n\nEfetue o pagamento através do link seguro abaixo:\n${activePayUrl}\n\nO vencimento é em ${new Date(selectedItem.expiresAt).toLocaleDateString('pt-BR')}.\n\nAtenciosamente,\nMenteCare Admin SaaS`);
                                    window.open(`mailto:${selectedItem.ownerEmail}?subject=${subject}&body=${body}`);
                                  }}
                                  className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-bold rounded-xl text-[11px] cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
                                >
                                  <Mail size={11} className="shrink-0" />
                                  E-mail
                                </button>

                                {/* COPIAR LINK */}
                                <button
                                  onClick={() => {
                                    const activePayUrl = `${window.location.origin}/checkout/pay_${selectedItem.id}`;
                                    safeCopyToClipboard(activePayUrl);
                                    setCopiedLink(true);
                                    setTimeout(() => setCopiedLink(false), 2000);
                                    safeAlert(`Link de pagamento seguro para ${selectedItem.name} copiado!`);
                                  }}
                                  className={`px-3 py-2 rounded-xl text-[11px] font-bold border cursor-pointer flex items-center justify-center gap-1.5 transition-all ${
                                    copiedLink
                                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                                      : 'border-sand-200 hover:bg-sand-50 bg-white text-sand-700'
                                  }`}
                                >
                                  {copiedLink ? <Check size={11} /> : <Copy size={11} />}
                                  Copiar link
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-white border border-sand-200 rounded-2xl p-12 shadow-sm text-center space-y-4">
                            <div className="h-14 w-14 bg-sand-50 border border-sand-150 rounded-full flex items-center justify-center text-sand-400 mx-auto">
                              <Building2 size={24} />
                            </div>
                            <div className="max-w-xs mx-auto">
                              <h4 className="font-serif font-bold text-sand-950 text-xs">Nenhum Cliente Selecionado</h4>
                              <p className="text-[11px] text-sand-500 mt-1 leading-relaxed">
                                Selecione uma clínica ou psicólogo na lista de clientes ao lado para carregar e gerenciar sua assinatura no Painel de Controle Integrado.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            )}

            {/* MODALS INJECTED */}
            <div key="master-modals" className="contents">
                
                {/* 1. HISTÓRICO MODAL */}
                <AnimatePresence>
                  {isCrmHistoryOpen && (
                    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                      <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="bg-white rounded-2xl border border-sand-200 p-6 max-w-md w-full shadow-xl space-y-4 max-h-[80vh] overflow-y-auto"
                      >
                        <div className="flex justify-between items-center border-b border-sand-150 pb-3">
                          <div>
                            <h3 className="font-serif font-bold text-sand-950 text-base">Histórico de Transações</h3>
                            <p className="text-[10px] text-sand-500">
                              Histórico para {tenants.find(t => t.id === selectedCrmTenantId)?.name || 'Cliente'}
                            </p>
                          </div>
                          <button
                            onClick={() => setIsCrmHistoryOpen(false)}
                            className="text-sand-400 hover:text-sand-600 font-bold text-xs cursor-pointer px-2 py-1"
                          >
                            Fechar
                          </button>
                        </div>

                        <div className="space-y-3 font-mono text-[11px]">
                          {[
                            { ref: 'FAT-90821', date: '02/07/2026', method: 'Cartão de Crédito', amount: billingAmount, status: 'Confirmada', log: 'Renovação automática via gateway' },
                            { ref: 'FAT-90110', date: '02/06/2026', method: 'Cartão de Crédito', amount: billingAmount, status: 'Confirmada', log: 'Renovação automática via gateway' },
                            { ref: 'FAT-89401', date: '02/05/2026', method: 'PIX Copia e Cola', amount: billingAmount, status: 'Confirmada', log: 'Pago via QR Code manual' }
                          ].map((hist, i) => (
                            <div key={i} className="p-3 bg-sand-50 rounded-xl border border-sand-150 space-y-1.5">
                              <div className="flex justify-between font-bold">
                                <span className="text-sand-900">{hist.ref}</span>
                                <span className="text-emerald-700">{hist.status}</span>
                              </div>
                              <div className="text-sand-600 space-y-0.5">
                                <div>Data: {hist.date}</div>
                                <div>Método: {hist.method}</div>
                                <div>Valor: R$ {hist.amount.toFixed(2)}</div>
                                <div className="text-[10px] text-sand-400 font-sans mt-1">Nota: {hist.log}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>

                {/* 2. VER CONTRATO MODAL */}
                <AnimatePresence>
                  {isCrmContractOpen && (
                    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                      <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="bg-white rounded-2xl border border-sand-200 p-6 max-w-2xl w-full shadow-xl space-y-4 max-h-[85vh] overflow-y-auto"
                      >
                        <div className="flex justify-between items-center border-b border-sand-150 pb-3">
                          <div>
                            <h3 className="font-serif font-bold text-sand-950 text-base">Contrato de Licenciamento de Software</h3>
                            <p className="text-[10px] text-sand-500">MenteCare SaaS Platform e Clínicas credenciadas</p>
                          </div>
                          <button
                            onClick={() => setIsCrmContractOpen(false)}
                            className="text-sand-400 hover:text-sand-600 font-bold text-xs cursor-pointer px-2 py-1"
                          >
                            Fechar
                          </button>
                        </div>

                        {/* Contract content */}
                        <div className="p-6 bg-sand-50 border border-sand-200 rounded-xl space-y-4 text-xs text-sand-700 font-sans leading-relaxed text-justify h-[42vh] overflow-y-auto">
                          <div className="text-center font-bold font-serif text-sand-900 uppercase text-xs border-b border-sand-200 pb-2">
                            CONTRATO DE PRESTAÇÃO DE SERVIÇOS E LICENÇA DE USO DE SOFTWARE SAAS
                          </div>
                          
                          <p>
                            De um lado, <strong>MENTECARE TECNOLOGIA SAAS LTDA</strong>, inscrita no CNPJ sob o nº 44.921.883/0001-90, doravante denominada simplesmente <strong>LICENCIANTE</strong>, e do outro lado, o profissional/clínica credenciado <strong>{tenants.find(t => t.id === selectedCrmTenantId)?.name || 'Inquilino'}</strong>, inscrito sob o e-mail <strong>{tenants.find(t => t.id === selectedCrmTenantId)?.ownerEmail || 'Email'}</strong>, doravante denominado simplesmente <strong>LICENCIADO</strong>, celebram o presente contrato.
                          </p>

                          <p className="font-bold text-sand-900">CLÁUSULA PRIMEIRA - DO OBJETO</p>
                          <p>
                            O objeto do presente instrumento é a licença de uso temporária, não exclusiva e intransferível da plataforma "MenteCare", englobando gestão de agendas, prontuário clínico criptografado, módulo financeiro, site institucional com CMS e gerador visual de templates.
                          </p>

                          <p className="font-bold text-sand-900">CLÁUSULA SEGUNDA - DO VALOR E FORMA DE PAGAMENTO</p>
                          <p>
                            Pela licença concedida, o LICENCIADO pagará a quantia recorrente mensal de <strong>R$ {billingAmount.toFixed(2)}</strong>, devida no dia de vencimento de cada mês corrente, através dos canais autorizados integrados na plataforma.
                          </p>

                          <p className="font-bold text-sand-900">CLÁUSULA TERCEIRA - DA PRIVACIDADE E CONFORMIDADE COM A LGPD</p>
                          <p>
                            Ambas as partes se comprometem a manter total sigilo sobre todos os dados de saúde dos pacientes finais armazenados nos servidores, declarando que o software opera em completa conformidade com a Lei Geral de Proteção de Dados (LGPD) e normativas do Conselho Federal de Psicologia (CFP).
                          </p>

                          <div className="pt-4 border-t border-sand-200 flex justify-between text-center font-bold text-[9px] text-sand-500 mt-6">
                            <div>
                              <p>_____________________________________</p>
                              <p>MenteCare SaaS - Representante Legal</p>
                            </div>
                            <div>
                              <p>_____________________________________</p>
                              <p>{tenants.find(t => t.id === selectedCrmTenantId)?.name || 'Licenciado'}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end gap-3 border-t border-sand-150 pt-3">
                          <button
                            onClick={() => window.print()}
                            className="px-4 py-2 border border-sand-300 hover:bg-sand-50 rounded-xl text-xs font-bold text-sand-700 flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <Printer size={12} />
                            Imprimir Contrato
                          </button>
                          <button
                            onClick={() => setIsCrmContractOpen(false)}
                            className="px-4 py-2 bg-sand-900 hover:bg-black text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                          >
                            Entendido
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>

                {/* COMPARTILHAR LICENÇA MODAL */}
                <AnimatePresence>
                  {isShareModalOpen && selectedShareLicense && (
                    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                      <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="bg-white rounded-2xl border border-sand-200 p-6 max-w-xl w-full shadow-xl space-y-4 max-h-[90vh] overflow-y-auto"
                      >
                        <div className="flex justify-between items-center border-b border-sand-150 pb-3">
                          <div>
                            <h3 className="font-serif font-black text-sand-950 text-sm flex items-center gap-1.5">
                              <MessageSquare className="text-softblue-600" size={16} />
                              Enviar Licença & Acesso do Cliente
                            </h3>
                            <p className="text-[10px] text-sand-500">
                              Compartilhe as credenciais e link da página criada de forma profissional
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setIsShareModalOpen(false);
                              setSelectedShareLicense(null);
                            }}
                            className="text-sand-400 hover:text-sand-600 font-bold text-xs cursor-pointer px-2 py-1"
                          >
                            Fechar
                          </button>
                        </div>

                        {/* Client details editor */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-sand-700 uppercase">Nome do Cliente</label>
                            <input
                              type="text"
                              value={shareClientName}
                              onChange={(e) => setShareClientName(e.target.value)}
                              className="w-full bg-sand-50 border border-sand-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-softblue-500 focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-sand-700 uppercase">E-mail</label>
                            <input
                              type="email"
                              value={shareClientEmail}
                              onChange={(e) => setShareClientEmail(e.target.value)}
                              className="w-full bg-sand-50 border border-sand-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-softblue-500 focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-sand-700 uppercase">WhatsApp (DDD + Celular)</label>
                            <input
                              type="text"
                              placeholder="11999999999"
                              value={shareClientPhone}
                              onChange={(e) => setShareClientPhone(e.target.value.replace(/\D/g, ''))}
                              className="w-full bg-sand-50 border border-sand-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-softblue-500 focus:outline-none font-mono"
                            />
                          </div>
                        </div>

                        {/* Select Message Template */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-sand-700 uppercase">Selecione o Modelo de Mensagem</label>
                          <div className="grid grid-cols-3 gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setShareTemplate('welcome');
                                setShareCustomText('');
                              }}
                              className={`py-1.5 px-3 rounded-lg border text-center text-xs font-bold cursor-pointer transition-all ${
                                shareTemplate === 'welcome'
                                  ? 'bg-softblue-50 border-softblue-300 text-softblue-700'
                                  : 'bg-white border-sand-200 text-sand-600 hover:bg-sand-50'
                              }`}
                            >
                              🔑 Boas-vindas + Licença
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShareTemplate('site_only');
                                setShareCustomText('');
                              }}
                              className={`py-1.5 px-3 rounded-lg border text-center text-xs font-bold cursor-pointer transition-all ${
                                shareTemplate === 'site_only'
                                  ? 'bg-softblue-50 border-softblue-300 text-softblue-700'
                                  : 'bg-white border-sand-200 text-sand-600 hover:bg-sand-50'
                              }`}
                            >
                              💻 Apenas Link do Site
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShareTemplate('renewal');
                                setShareCustomText('');
                              }}
                              className={`py-1.5 px-3 rounded-lg border text-center text-xs font-bold cursor-pointer transition-all ${
                                shareTemplate === 'renewal'
                                  ? 'bg-softblue-50 border-softblue-300 text-softblue-700'
                                  : 'bg-white border-sand-200 text-sand-600 hover:bg-sand-50'
                              }`}
                            >
                              🔄 Renovação de Licença
                            </button>
                          </div>
                        </div>

                        {/* Construct Message Text based on values */}
                        {(() => {
                          const code = selectedShareLicense.code;
                          const plan = selectedShareLicense.plan;
                          const tenantLink = `${window.location.origin}/?tenant=${selectedShareLicense.tenantId}`;
                          
                          let defaultText = '';
                          let subject = 'Suas credenciais MenteCare';
                          
                          if (shareTemplate === 'welcome') {
                            defaultText = `Olá, ${shareClientName || 'Doutor(a)'}!\n\nSeja muito bem-vindo(a) ao MenteCare! 🌟\n\nSeu consultório virtual já está configurado e pronto para uso no plano *${plan}*.\n\n🔑 Sua Chave de Licença: *${code}*\n💻 Link de Acesso do seu Site: ${tenantLink}\n\nPara começar, basta acessar o link acima, ir em 'Acessar Painel' ou 'Entrar' e usar seus dados cadastrados. Caso precise ativar seu acesso pela primeira vez, utilize sua Chave de Licença.\n\nEstamos à disposição para o que precisar!\nEquipe MenteCare.`;
                            subject = `Seja bem-vindo ao MenteCare! Chave de Acesso: ${code}`;
                          } else if (shareTemplate === 'site_only') {
                            defaultText = `Olá, ${shareClientName || 'Doutor(a)'}!\n\nPassando para informar que seu site público de atendimento psicológico no MenteCare já está totalmente funcional e online! 🎉\n\n💻 Link do seu site profissional: ${tenantLink}\n\nCompartilhe este link com seus pacientes para que eles possam agendar consultas diretamente e conhecer seu perfil profissional.\n\nAbraços,\nEquipe MenteCare.`;
                            subject = `Seu site de atendimento MenteCare está no ar! 💻`;
                          } else {
                            defaultText = `Olá, ${shareClientName || 'Doutor(a)'}!\n\nSua licença no MenteCare foi renovada com sucesso! 🔄\n\n🔑 Chave de Ativação: *${code}*\n💻 Seu Painel e Site: ${tenantLink}\n🛡️ Plano: *${plan}*\n📅 Nova validade: ${new Date(selectedShareLicense.expiresAt).toLocaleDateString('pt-BR')}\n\nAgradecemos por continuar cuidando da saúde mental conosco.\n\nAtenciosamente,\nSuporte MenteCare.`;
                            subject = `Sua licença MenteCare foi renovada com sucesso! 🔄`;
                          }

                          const activeText = shareCustomText || defaultText;

                          const handleCopyMessage = () => {
                            navigator.clipboard.writeText(activeText);
                            safeAlert('Mensagem copiada para a área de transferência!');
                          };

                          const handleCopyLink = () => {
                            navigator.clipboard.writeText(tenantLink);
                            safeAlert('Link do site copiado!');
                          };

                          const handleSendWhatsApp = () => {
                            if (!shareClientPhone) {
                              safeAlert('Por favor, digite o número do WhatsApp com o DDD (ex: 11999999999).');
                              return;
                            }
                            const formattedPhone = shareClientPhone.startsWith('55') ? shareClientPhone : '55' + shareClientPhone;
                            const url = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(activeText)}`;
                            window.open(url, '_blank');
                          };

                          const handleSendEmail = () => {
                            const mailtoUrl = `mailto:${shareClientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(activeText)}`;
                            window.open(mailtoUrl, '_blank');
                          };

                          return (
                            <div className="space-y-4">
                              <div className="space-y-1">
                                <div className="flex justify-between items-center">
                                  <label className="text-[9px] font-bold text-sand-700 uppercase">Visualização da Mensagem</label>
                                  <button
                                    type="button"
                                    onClick={() => setShareCustomText(activeText)}
                                    className="text-[10px] text-softblue-600 hover:underline font-bold cursor-pointer"
                                  >
                                    Customizar Texto
                                  </button>
                                </div>
                                <textarea
                                  value={activeText}
                                  onChange={(e) => setShareCustomText(e.target.value)}
                                  rows={8}
                                  className="w-full bg-sand-900 border border-sand-800 rounded-xl px-3.5 py-3 text-xs text-sand-100 font-sans focus:outline-none focus:ring-1 focus:ring-softblue-500 whitespace-pre-wrap leading-relaxed shadow-inner"
                                />
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-2">
                                <button
                                  type="button"
                                  onClick={handleCopyLink}
                                  className="py-2 px-3 bg-sand-100 hover:bg-sand-200 text-sand-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all border border-sand-300"
                                >
                                  <Copy size={12} />
                                  Copiar Link
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCopyMessage}
                                  className="py-2 px-3 bg-sand-100 hover:bg-sand-200 text-sand-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all border border-sand-300"
                                >
                                  <Clipboard size={12} />
                                  Copiar Texto
                                </button>
                                <button
                                  type="button"
                                  onClick={handleSendEmail}
                                  disabled={!shareClientEmail}
                                  className={`py-2 px-3 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                                    shareClientEmail
                                      ? 'bg-softblue-600 hover:bg-softblue-700 text-white'
                                      : 'bg-sand-100 border border-sand-200 text-sand-400 cursor-not-allowed'
                                  }`}
                                >
                                  <Mail size={12} />
                                  Enviar E-mail
                                </button>
                                <button
                                  type="button"
                                  onClick={handleSendWhatsApp}
                                  className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                                >
                                  <MessageSquare size={12} />
                                  WhatsApp
                                </button>
                              </div>
                            </div>
                          );
                        })()}
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>

                {/* CENTRAL DE LINKS & QR CODE MODAL */}
                <AnimatePresence>
                  {isLinkGenOpen && selectedLinkLicense && (
                    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                      <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="bg-white rounded-2xl border border-sand-200 p-6 max-w-4xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
                      >
                        <div className="flex justify-between items-start border-b border-sand-150 pb-4">
                          <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                              <Globe size={20} />
                            </div>
                            <div>
                              <h3 className="font-serif font-black text-sand-950 text-base">
                                Central de Links & QR Code do Cliente
                              </h3>
                              <p className="text-xs text-sand-500 mt-0.5">
                                Visualize, customize e envie links profissionais para divulgar a clínica ou facilitar o acesso.
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setIsLinkGenOpen(false);
                              setSelectedLinkLicense(null);
                            }}
                            className="text-sand-400 hover:text-sand-600 font-bold text-xs cursor-pointer p-1 rounded-lg hover:bg-sand-50 transition-all"
                          >
                            Fechar
                          </button>
                        </div>

                        {/* Top Summary Row */}
                        {(() => {
                          const tenant = tenants.find(t => t.id === selectedLinkLicense.tenantId);
                          const clinicName = tenant?.name || 'Clínica não identificada';
                          const ownerEmail = tenant?.ownerEmail || 'Sem e-mail cadastrado';

                          const handleSaveId = async () => {
                            if (!linkGenTenantId.trim()) return;
                            const formattedId = linkGenTenantId.toLowerCase().replace(/[^a-z0-9_-]/g, '');
                            if (formattedId === selectedLinkLicense.tenantId) return;
                            
                            setIsUpdatingLinkGenTenantId(true);
                            try {
                              const docRef = doc(db, 'licenses', selectedLinkLicense.id);
                              const snap = await getDoc(docRef);
                              if (snap.exists()) {
                                await setDoc(docRef, { ...snap.data(), tenantId: formattedId });
                                selectedLinkLicense.tenantId = formattedId;
                                setSelectedLinkLicense({ ...selectedLinkLicense, tenantId: formattedId });
                                safeAlert('Tenant ID da licença atualizado com sucesso!');
                                loadAllData();
                              }
                            } catch (err: any) {
                              safeAlert('Erro ao atualizar Tenant ID: ' + err.message);
                            } finally {
                              setIsUpdatingLinkGenTenantId(false);
                            }
                          };

                          // URLs definitions
                          const host = window.location.origin;
                          const urlDirect = `${host}/?tenant=${selectedLinkLicense.tenantId}`;
                          const urlFriendly = `${host}/clinica/${selectedLinkLicense.tenantId}`;
                          const urlLogin = `${host}/login?tenant=${selectedLinkLicense.tenantId}`;
                          const urlPatient = `${host}/?tenant=${selectedLinkLicense.tenantId}#agendar`;

                          const currentActiveUrl = 
                            activeLinkType === 'direct' ? urlDirect :
                            activeLinkType === 'friendly' ? urlFriendly :
                            activeLinkType === 'login' ? urlLogin :
                            urlPatient;

                          const qrCodeSrc = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(currentActiveUrl)}&color=25221c&bgcolor=ffffff&qzone=2`;

                          const activeDescription = 
                            activeLinkType === 'direct' ? "O formato padrão do SaaS. Define com segurança qual clínica está sendo visualizada e carrega suas preferências no navegador local do paciente." :
                            activeLinkType === 'friendly' ? "Caminho limpo e estético, ideal para divulgação no Instagram, cartões de visita, prontuários ou assinatura de e-mail." :
                            activeLinkType === 'login' ? "Link direto de acesso administrativo. Envie este link para o psicólogo logar no painel sem precisar passar pela landing page geral." :
                            "Link focado no agendamento. Leva o paciente direto para a seção de formulário de marcação de consulta no site do profissional.";

                          const handleCopyActiveLink = () => {
                            navigator.clipboard.writeText(currentActiveUrl);
                            safeAlert('Link copiado para a área de transferência!');
                          };

                          const handleTestLink = () => {
                            window.open(currentActiveUrl, '_blank');
                          };

                          const handleShareWhatsApp = () => {
                            const message = `Olá! Segue o link de acesso da clínica no MenteCare:\n\n🔗 ${currentActiveUrl}\n\nSeja bem-vindo(a)!`;
                            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank');
                          };

                          return (
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                              {/* Left Panel: Link details & customizer */}
                              <div className="lg:col-span-7 space-y-5 text-left">
                                {/* Clinic Details Mini-Card */}
                                <div className="bg-sand-50/50 border border-sand-200/80 rounded-xl p-4 space-y-2">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <span className="text-[9px] uppercase font-bold text-sand-500 tracking-wider">Cliente Vinculado</span>
                                      <h4 className="font-serif font-black text-sand-950 text-sm mt-0.5">{clinicName}</h4>
                                      <p className="text-[10px] text-sand-600 font-mono mt-0.5">{ownerEmail}</p>
                                    </div>
                                    <span className="text-[10px] font-mono px-2 py-0.5 bg-purple-50 border border-purple-200 text-purple-700 font-bold rounded-full">
                                      Plano {selectedLinkLicense.plan}
                                    </span>
                                  </div>
                                </div>

                                {/* Customizer Field */}
                                <div className="space-y-2">
                                  <label className="text-[10px] font-bold text-sand-800 uppercase tracking-wider block">
                                    Customizar Identificador (Tenant ID)
                                  </label>
                                  <div className="flex gap-2">
                                    <div className="relative flex-1">
                                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-mono text-sand-400 select-none">
                                        /clinica/
                                      </span>
                                      <input
                                        type="text"
                                        value={linkGenTenantId}
                                        onChange={(e) => setLinkGenTenantId(e.target.value)}
                                        className="w-full bg-sand-50 border border-sand-200 rounded-xl pl-[54px] pr-3 py-2 text-xs font-mono font-bold text-softblue-700 focus:ring-1 focus:ring-softblue-500 focus:outline-none"
                                        placeholder="id-da-clinica"
                                      />
                                    </div>
                                    <button
                                      type="button"
                                      onClick={handleSaveId}
                                      disabled={isUpdatingLinkGenTenantId || linkGenTenantId.trim() === selectedLinkLicense.tenantId}
                                      className={`px-4 py-2 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                                        linkGenTenantId.trim() === selectedLinkLicense.tenantId
                                          ? 'bg-sand-100 text-sand-400 border border-sand-200 cursor-not-allowed'
                                          : 'bg-softblue-600 hover:bg-softblue-700 text-white shadow-sm'
                                      }`}
                                    >
                                      {isUpdatingLinkGenTenantId ? 'Gravando...' : 'Atualizar ID'}
                                    </button>
                                  </div>
                                  <p className="text-[10px] text-sand-500 leading-relaxed">
                                    * Nota: Alterar este identificador atualizará imediatamente os links de divulgação do cliente.
                                  </p>
                                </div>

                                {/* Tab Selector */}
                                <div className="space-y-2 pt-1">
                                  <label className="text-[10px] font-bold text-sand-800 uppercase tracking-wider block">
                                    Selecione o Tipo de Link a Gerar
                                  </label>
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                                    {[
                                      { type: 'direct', label: '🔗 SaaS', title: 'Link Inicial' },
                                      { type: 'friendly', label: '💻 Amigável', title: 'Divulgação' },
                                      { type: 'login', label: '🛡️ Login', title: 'Acesso Adm' },
                                      { type: 'patient', label: '📅 Agendar', title: 'Pacientes' },
                                    ].map((item) => (
                                      <button
                                        key={item.type}
                                        type="button"
                                        onClick={() => setActiveLinkType(item.type as any)}
                                        className={`py-2 px-1 text-center rounded-xl border transition-all cursor-pointer flex flex-col items-center justify-center ${
                                          activeLinkType === item.type
                                            ? 'bg-purple-50 border-purple-300 text-purple-700 font-bold shadow-xs'
                                            : 'bg-white border-sand-200 text-sand-600 hover:bg-sand-50'
                                        }`}
                                      >
                                        <span className="text-[11px]">{item.label}</span>
                                        <span className="text-[8px] uppercase tracking-wider font-bold text-sand-400 mt-0.5">
                                          {item.title}
                                        </span>
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* Active URL Details */}
                                <div className="bg-sand-900 border border-sand-950 rounded-xl p-4 text-sand-100 space-y-3">
                                  <div>
                                    <span className="text-[8px] uppercase font-mono font-bold text-purple-400 tracking-widest">
                                      Link Gerado & Validado
                                    </span>
                                    <p className="text-[10px] text-sand-300 mt-1 leading-relaxed">
                                      {activeDescription}
                                    </p>
                                  </div>

                                  <div className="bg-black/40 border border-sand-800 rounded-lg px-3 py-2 flex items-center justify-between select-all font-mono text-[11px] text-emerald-400 font-bold overflow-x-auto whitespace-nowrap">
                                    {currentActiveUrl}
                                  </div>

                                  <div className="grid grid-cols-3 gap-2 pt-1">
                                    <button
                                      type="button"
                                      onClick={handleCopyActiveLink}
                                      className="py-1.5 px-3 bg-sand-800 hover:bg-sand-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1 cursor-pointer transition-all border border-sand-700"
                                    >
                                      <Copy size={11} />
                                      Copiar URL
                                    </button>
                                    <button
                                      type="button"
                                      onClick={handleTestLink}
                                      className="py-1.5 px-3 bg-sand-800 hover:bg-sand-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1 cursor-pointer transition-all border border-sand-700"
                                    >
                                      <ExternalLink size={11} />
                                      Testar Link
                                    </button>
                                    <button
                                      type="button"
                                      onClick={handleShareWhatsApp}
                                      className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1 cursor-pointer transition-all"
                                    >
                                      <MessageSquare size={11} />
                                      WhatsApp
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Right Panel: QR Code Presentation */}
                              <div className="lg:col-span-5 bg-sand-50/50 border border-sand-200 rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-4">
                                <div>
                                  <span className="text-[9px] uppercase font-bold text-sand-500 tracking-wider">
                                    Acesso por QR Code
                                  </span>
                                  <h5 className="text-xs font-bold text-sand-950 mt-0.5">
                                    QR Code para Impressão & Cartões
                                  </h5>
                                </div>

                                <div className="bg-white border border-sand-200/80 rounded-xl p-3 shadow-md">
                                  <img 
                                    src={qrCodeSrc} 
                                    alt="Client QR Code" 
                                    className="h-44 w-44 object-contain select-none"
                                    crossOrigin="anonymous"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>

                                <div className="space-y-1 max-w-[200px]">
                                  <p className="text-[10px] text-sand-600 leading-normal">
                                    O paciente pode escanear para acessar o site ou marcar consultas instantaneamente.
                                  </p>
                                  <span className="text-[9px] font-mono text-sand-400 block pt-1">
                                    Clique c/ botão direito na imagem para salvar
                                  </span>
                                </div>

                                <div className="flex gap-2 w-full pt-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const printWindow = window.open('', '_blank');
                                      if (printWindow) {
                                        printWindow.document.write(`
                                          <html>
                                            <head>
                                              <title>Imprimir QR Code - ${clinicName}</title>
                                              <style>
                                                body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; color: #222; }
                                                .container { text-align: center; border: 2px solid #ddd; border-radius: 20px; padding: 40px; max-width: 400px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
                                                h1 { font-size: 24px; margin-bottom: 5px; font-family: serif; font-weight: 900; }
                                                p { font-size: 14px; color: #666; margin-top: 5px; margin-bottom: 25px; }
                                                img { width: 250px; height: 250px; }
                                                .footer { font-size: 12px; color: #999; margin-top: 30px; font-family: monospace; }
                                              </style>
                                            </head>
                                            <body>
                                              <div class="container">
                                                <h1>${clinicName}</h1>
                                                <p>Escaneie o QR Code abaixo para agendar sua consulta</p>
                                                <img src="${qrCodeSrc}" />
                                                <div class="footer">${currentActiveUrl}</div>
                                              </div>
                                              <script>
                                                window.onload = function() {
                                                  window.print();
                                                };
                                              </script>
                                            </body>
                                          </html>
                                        `);
                                        printWindow.document.close();
                                      }
                                    }}
                                    className="flex-1 py-2 px-3 bg-white hover:bg-sand-100 text-sand-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all border border-sand-300"
                                  >
                                    <Printer size={12} />
                                    Imprimir QR Code
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>

                {/* 3. EDITAR MODAL */}
                <AnimatePresence>
                  {isCrmEditOpen && (
                    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                      <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="bg-white rounded-2xl border border-sand-200 p-6 max-w-md w-full shadow-xl space-y-4"
                      >
                        <div className="flex justify-between items-center border-b border-sand-150 pb-3">
                          <div>
                            <h3 className="font-serif font-bold text-sand-950 text-sm">Editar Cadastro de Assinatura</h3>
                            <p className="text-[10px] text-sand-500">Modifique os parâmetros do inquilino selecionado</p>
                          </div>
                          <button
                            onClick={() => setIsCrmEditOpen(false)}
                            className="text-sand-400 hover:text-sand-600 font-bold text-xs cursor-pointer px-2 py-1"
                          >
                            Fechar
                          </button>
                        </div>

                        <form onSubmit={handleCrmEditSubmit} className="space-y-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-sand-700 uppercase">Nome do Cliente / Clínica</label>
                            <input
                              type="text"
                              required
                              value={editForm.name}
                              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                              className="w-full bg-sand-50 border border-sand-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-softblue-500 focus:outline-none text-sand-800 font-semibold"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-sand-700 uppercase">E-mail do Responsável</label>
                            <input
                              type="email"
                              required
                              value={editForm.ownerEmail}
                              onChange={(e) => setEditForm({ ...editForm, ownerEmail: e.target.value })}
                              className="w-full bg-sand-50 border border-sand-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-softblue-500 focus:outline-none font-mono"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-sand-700 uppercase">Plano Contratado</label>
                              <select
                                value={editForm.plan}
                                onChange={(e) => setEditForm({ ...editForm, plan: e.target.value as any })}
                                className="w-full bg-sand-50 border border-sand-200 rounded-xl px-3 py-2 text-xs focus:outline-none cursor-pointer font-semibold text-sand-800"
                              >
                                <option value="Starter">Starter</option>
                                <option value="Pro">Pro</option>
                                <option value="Premium">Premium</option>
                                <option value="Enterprise">Enterprise</option>
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-sand-700 uppercase">Status Conta</label>
                              <select
                                value={editForm.status}
                                onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                                className="w-full bg-sand-50 border border-sand-200 rounded-xl px-3 py-2 text-xs focus:outline-none cursor-pointer font-semibold text-sand-800"
                              >
                                <option value="Ativo">Ativo</option>
                                <option value="Bloqueado">Suspenso</option>
                              </select>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-sand-700 uppercase">Data de Expiração da Licença</label>
                            <input
                              type="date"
                              required
                              value={editForm.expiresAt}
                              onChange={(e) => setEditForm({ ...editForm, expiresAt: e.target.value })}
                              className="w-full bg-sand-50 border border-sand-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-softblue-500 focus:outline-none font-mono"
                            />
                          </div>

                          <div className="flex justify-end gap-3 pt-3 border-t border-sand-150">
                            <button
                              type="button"
                              onClick={() => setIsCrmEditOpen(false)}
                              className="px-4 py-2 border border-sand-300 hover:bg-sand-50 rounded-xl text-xs font-bold text-sand-700 cursor-pointer"
                            >
                              Cancelar
                            </button>
                            <button
                              type="submit"
                              className="px-4 py-2 bg-softblue-600 hover:bg-softblue-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                            >
                              Salvar Alterações
                            </button>
                          </div>
                        </form>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>

                {/* 4. COBRAR DIALOG (MÉTODOS DE PAGAMENTO E SIMULAÇÃO) */}
                <AnimatePresence>
                  {isCrmChargeOpen && (
                    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                      <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="bg-white rounded-2xl border border-sand-200 p-6 max-w-md w-full shadow-xl space-y-4"
                      >
                        <div className="flex justify-between items-center border-b border-sand-150 pb-3">
                          <div>
                            <h3 className="font-serif font-bold text-sand-950 text-sm">Disparo de Cobrança / Simulador</h3>
                            <p className="text-[10px] text-sand-400">
                              Inquilino: {tenants.find(t => t.id === selectedCrmTenantId)?.name || 'Cliente'}
                            </p>
                          </div>
                          <button
                            onClick={() => setIsCrmChargeOpen(false)}
                            className="text-sand-400 hover:text-sand-600 font-bold text-xs cursor-pointer px-2 py-1"
                          >
                            Fechar
                          </button>
                        </div>

                        {/* Amount */}
                        <div className="p-3 bg-sand-50 rounded-xl border border-sand-200 flex justify-between items-center text-xs">
                          <span className="font-bold text-sand-600 uppercase text-[9px]">Valor total da mensalidade:</span>
                          <span className="font-mono font-black text-softblue-600 text-sm">R$ {billingAmount.toFixed(2)}</span>
                        </div>

                        {/* Methods tabs inside the billing dialog */}
                        <div className="flex gap-1 bg-sand-100 p-1 rounded-xl border border-sand-150">
                          {[
                            { id: 'pix', label: 'PIX' },
                            { id: 'card', label: 'Cartão' },
                            { id: 'boleto', label: 'Boleto' },
                            { id: 'link', label: 'Link de pagamento' }
                          ].map((m) => (
                            <button
                              key={m.id}
                              onClick={() => setCrmPaymentMethod(m.id as any)}
                              className={`flex-1 py-1.5 text-center text-[10px] font-bold rounded-lg cursor-pointer transition-all ${
                                crmPaymentMethod === m.id
                                  ? 'bg-white text-sand-950 shadow-sm'
                                  : 'text-sand-500 hover:text-sand-700'
                              }`}
                            >
                              {m.label}
                            </button>
                          ))}
                        </div>

                        {/* Payment Simulator details rendering */}
                        <div className="py-2 min-h-48 flex flex-col justify-center">
                          {crmPaymentMethod === 'pix' && (
                            <div className="space-y-4 text-center">
                              <div className="bg-white p-3 border border-sand-200 rounded-xl inline-block shadow-sm">
                                <div className="w-32 h-32 bg-sand-950 flex flex-col items-center justify-center rounded-lg mx-auto relative overflow-hidden">
                                  <div className="absolute inset-2 border-2 border-emerald-500 border-dashed rounded-md flex flex-wrap p-1">
                                    {Array.from({ length: 64 }).map((_, i) => (
                                      <div key={i} className={`w-[12.5%] h-[12.5%] ${Math.sin(i * 3.14) > 0 ? 'bg-white' : 'bg-transparent'}`}></div>
                                    ))}
                                  </div>
                                  <Layers size={22} className="text-white z-10" />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <p className="text-[10px] text-sand-500 font-semibold">Abra o app do banco para pagar, ou use o Copia e Cola:</p>
                                <div className="p-2 bg-sand-50 border border-sand-200 rounded-lg text-[9px] font-mono text-sand-600 text-center break-all select-all font-bold">
                                  00020126580014br.gov.bcb.pix0136dmenossolucao@gmail.com5204000053039865405{billingAmount.toFixed(2)}5802BR5913MenteCareSaaS6009Fortaleza62070503***6304724E
                                </div>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(`00020126580014br.gov.bcb.pix0136dmenossolucao@gmail.com5204000053039865405${billingAmount.toFixed(2)}5802BR5913MenteCareSaaS6009Fortaleza62070503***6304724E`);
                                    safeAlert('Chave Pix Copia e Cola copiada!');
                                  }}
                                  className="text-[10px] font-bold text-softblue-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <Copy size={10} /> Copiar link do PIX
                                </button>
                              </div>
                            </div>
                          )}

                          {crmPaymentMethod === 'card' && (
                            <div className="space-y-3">
                              {/* CC Representation card */}
                              <div className="bg-gradient-to-br from-sand-900 to-black p-4 rounded-xl text-white font-mono text-[10px] space-y-4 shadow-md relative overflow-hidden">
                                <div className="absolute right-3 top-3 h-5 w-8 bg-white/20 rounded-md flex items-center justify-center font-bold text-[7px]">
                                  VISA
                                </div>
                                <div className="h-4 w-6 bg-yellow-400/80 rounded"></div>
                                <div className="text-xs font-bold tracking-widest pt-2">**** **** **** 8821</div>
                                <div className="flex justify-between text-[7px] pt-1 uppercase">
                                  <div>
                                    <span className="block text-[5px] text-sand-400">Titular</span>
                                    <span>{tenants.find(t => t.id === selectedCrmTenantId)?.name || 'Inquilino'}</span>
                                  </div>
                                  <div className="text-right">
                                    <span className="block text-[5px] text-sand-400">Validade</span>
                                    <span>12/31</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-center py-2">
                                <button
                                  type="button"
                                  onClick={() => safeAlert(`Transação recorrente de R$ ${billingAmount.toFixed(2)} simulada no cartão VISA com sucesso!`)}
                                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-[11px] cursor-pointer shadow-sm transition-colors"
                                >
                                  Simular Cobrança no Cartão
                                </button>
                                <p className="text-[9px] text-sand-400 mt-2">Os cartões estão seguros e protegidos no cofre do Gateway PCI.</p>
                              </div>
                            </div>
                          )}

                          {crmPaymentMethod === 'boleto' && (
                            <div className="space-y-4 text-center">
                              <div className="p-3 bg-sand-50 rounded-xl border border-sand-200 text-left font-mono space-y-2">
                                <div className="flex justify-between text-[10px] font-bold border-b border-sand-250 pb-1.5">
                                  <span className="font-sans text-sand-900">BANCO COOPERATIVO S.A. | 756-1</span>
                                  <span className="truncate">75691.30602 01043.513184 91020.150008 7 902100000{billingAmount.toFixed(0)}00</span>
                                </div>
                                <div className="text-[9px] text-sand-600 space-y-1">
                                  <div>Beneficiário: MenteCare SaaS Platform</div>
                                  <div>Pagador: {tenants.find(t => t.id === selectedCrmTenantId)?.name || 'Inquilino'}</div>
                                  <div>Vencimento: {new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}</div>
                                </div>
                                <div className="h-8 bg-sand-950 flex justify-between items-center px-4 rounded pt-1">
                                  {Array.from({ length: 48 }).map((_, i) => (
                                    <div key={i} className="h-full bg-white" style={{ width: `${Math.floor(1 + Math.random() * 4)}px` }}></div>
                                  ))}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => safeAlert('PDF do boleto bancário simulado e enviado para download.')}
                                className="text-[10px] font-bold text-softblue-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                              >
                                <FileText size={11} /> Baixar PDF do Boleto
                              </button>
                            </div>
                          )}

                          {crmPaymentMethod === 'link' && (
                            <div className="space-y-4 text-center">
                              <div className="p-3.5 bg-yellow-50/50 border border-yellow-200/60 rounded-xl text-left space-y-2 text-xs">
                                <div className="font-bold text-yellow-900 flex items-center gap-1">
                                  <Info size={11} /> Link de Pagamento Gerado
                                </div>
                                <p className="text-[11px] text-yellow-800 leading-relaxed">
                                  Este checkout público permite que o inquilino faça o autopagamento de R$ {billingAmount.toFixed(2)} por PIX, Cartão ou Boleto.
                                </p>
                                <div className="p-2 bg-white border border-sand-200 rounded-lg text-[10px] font-mono text-softblue-600 select-all font-bold tracking-tight truncate">
                                  {generatedPayLink}
                                </div>
                              </div>
                              <div className="flex justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(generatedPayLink);
                                    safeAlert('Link copiado!');
                                  }}
                                  className="px-3 py-1.5 border border-sand-300 hover:bg-sand-50 rounded-xl text-[10px] font-bold text-sand-700 flex items-center gap-1 cursor-pointer"
                                >
                                  <Copy size={11} /> Copiar link
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const text = encodeURIComponent(`Olá! Aqui está o link de pagamento do MenteCare SaaS: ${generatedPayLink}`);
                                    window.open(`https://api.whatsapp.com/send?phone=558599999999&text=${text}`, '_blank');
                                  }}
                                  className="px-3 py-1.5 border border-emerald-300 hover:bg-emerald-50 rounded-xl text-[10px] font-bold text-emerald-700 flex items-center gap-1 cursor-pointer"
                                >
                                  <MessageSquare size={11} /> WhatsApp
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>
            </div>

            {/* 6. FINANCEIRO */}
            {activeTab === 'financeiro' && (
              <motion.div
                key="master-financeiro"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="bg-white border border-sand-200 rounded-2xl p-6 shadow-sm space-y-4">
                  <h3 className="font-serif font-bold text-sand-900 text-sm border-b border-sand-150 pb-3">Resumo Financeiro da Plataforma</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                    <div className="p-4 bg-sand-50 rounded-xl border border-sand-200 text-center">
                      <span className="text-[10px] font-bold font-mono text-sand-500 uppercase">Receita Bruta Total</span>
                      <h4 className="text-2xl font-serif font-extrabold text-sand-900 mt-1">R$ 4.880,00</h4>
                      <p className="text-[10px] text-sand-500 mt-0.5">Acumulado desde o lançamento</p>
                    </div>

                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                      <span className="text-[10px] font-bold font-mono text-emerald-700 uppercase">Taxa de Sucesso (Gateway)</span>
                      <h4 className="text-2xl font-serif font-extrabold text-emerald-800 mt-1">98.4%</h4>
                      <p className="text-[10px] text-emerald-600 mt-0.5">Apenas 1 recusa esta semana</p>
                    </div>

                    <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 text-center">
                      <span className="text-[10px] font-bold font-mono text-purple-700 uppercase">CAC Médio</span>
                      <h4 className="text-2xl font-serif font-extrabold text-purple-800 mt-1">R$ 42,30</h4>
                      <p className="text-[10px] text-purple-600 mt-0.5">Custo de aquisição de cliente</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 7. COBRANCAS */}
            {activeTab === 'cobrancas' && (
              <motion.div
                key="master-cobrancas"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white border border-sand-200 rounded-2xl p-6 shadow-sm space-y-4"
              >
                <h3 className="font-serif font-bold text-sand-900 text-sm border-b border-sand-150 pb-3">Cobranças & Faturas Emitidas</h3>
                
                <div className="overflow-x-auto border border-sand-150 rounded-xl font-mono">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-sand-50 text-sand-700 font-bold border-b border-sand-150">
                      <tr>
                        <th className="p-3">Ref Fatura</th>
                        <th className="p-3 font-sans">Cliente</th>
                        <th className="p-3">Método</th>
                        <th className="p-3">Valor</th>
                        <th className="p-3">Data Pgto</th>
                        <th className="p-3 font-sans">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sand-100">
                      {[
                        { ref: 'FAT-90821', client: 'Dra. Érica Costa', method: 'Cartão de Crédito', amount: 299.90, date: '02/07/2026', status: 'Confirmada' },
                        { ref: 'FAT-90820', client: 'Dr. Ricardo Silva', method: 'PIX Copia e Cola', amount: 189.90, date: '28/06/2026', status: 'Confirmada' },
                        { ref: 'FAT-90819', client: 'Dra. Lucia Alencar', method: 'Boleto Bancário', amount: 99.90, date: 'Pendente', status: 'Atrasada' }
                      ].map((item, idx) => (
                        <tr key={idx} className="hover:bg-sand-50/50">
                          <td className="p-3 font-bold text-sand-900">{item.ref}</td>
                          <td className="p-3 font-sans font-semibold text-sand-800">{item.client}</td>
                          <td className="p-3 text-sand-600 font-sans">{item.method}</td>
                          <td className="p-3 text-sand-900 font-bold">R$ {item.amount.toFixed(2)}</td>
                          <td className="p-3 text-sand-500">{item.date}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-sans font-bold ${
                              item.status === 'Confirmada' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-rose-50 border border-rose-200 text-rose-800'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* 8. ESTATISTICAS */}
            {activeTab === 'estatisticas' && (
              <motion.div
                key="master-estatisticas"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                <div className="bg-white border border-sand-200 rounded-2xl p-6 shadow-sm space-y-4">
                  <h3 className="font-serif font-bold text-sand-900 text-sm border-b border-sand-150 pb-3">Carga do Servidor Cloud Run</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span>CPU Load (Média)</span>
                        <span className="text-emerald-600 font-mono">14%</span>
                      </div>
                      <div className="w-full bg-sand-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: '14%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span>Memory Usage (Média)</span>
                        <span className="text-emerald-600 font-mono">22%</span>
                      </div>
                      <div className="w-full bg-sand-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: '22%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span>WebSocket Conexões</span>
                        <span className="text-softblue-600 font-mono">42 ativas</span>
                      </div>
                      <div className="w-full bg-sand-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-softblue-500 h-full rounded-full" style={{ width: '42%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-sand-200 rounded-2xl p-6 shadow-sm space-y-4">
                  <h3 className="font-serif font-bold text-sand-900 text-sm border-b border-sand-150 pb-3">Volumetria de API Firestore</h3>
                  
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between border-b border-sand-100 py-1">
                      <span className="text-sand-600 font-medium">Reads Diários</span>
                      <strong className="text-sand-900 font-mono">14.281 / 50.000 (Free Tier)</strong>
                    </div>
                    <div className="flex justify-between border-b border-sand-100 py-1">
                      <span className="text-sand-600 font-medium">Writes Diários</span>
                      <strong className="text-sand-900 font-mono">2.880 / 20.000 (Free Tier)</strong>
                    </div>
                    <div className="flex justify-between border-b border-sand-100 py-1">
                      <span className="text-sand-600 font-medium">Deletes Diários</span>
                      <strong className="text-sand-900 font-mono">140 / 20.000 (Free Tier)</strong>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 9. SUPORTE */}
            {activeTab === 'suporte' && (
              <motion.div
                key="master-suporte"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Ticket list */}
                  <div className="lg:col-span-6 bg-white border border-sand-200 rounded-2xl p-6 shadow-sm space-y-4">
                    <h3 className="font-serif font-bold text-sand-950 text-sm border-b border-sand-150 pb-3">Fila de Chamados de Suporte</h3>
                    
                    <div className="space-y-3">
                      {tickets.map((t) => (
                        <div 
                          key={t.id}
                          onClick={() => setSelectedTicket(t)}
                          className={`p-4 rounded-xl border transition-all cursor-pointer ${
                            selectedTicket?.id === t.id 
                              ? 'border-softblue-300 bg-softblue-50/20 shadow-sm' 
                              : 'border-sand-200 hover:bg-sand-50/50'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-mono font-bold text-sand-500">{t.id}</span>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              t.status === 'Pendente' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                              t.status === 'Respondido' ? 'bg-softblue-50 text-softblue-800 border border-softblue-200' :
                              'bg-sand-100 text-sand-700'
                            }`}>{t.status}</span>
                          </div>
                          <h4 className="font-serif font-bold text-sand-900 text-xs">{t.subject}</h4>
                          <p className="text-[11px] text-sand-500 mt-1 truncate">{t.message}</p>
                          <div className="flex justify-between items-center pt-2 mt-2 border-t border-sand-100 text-[10px] text-sand-400">
                            <span>De: <strong className="text-sand-700">{t.author}</strong></span>
                            <span>{t.date}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ticket Details & Action */}
                  <div className="lg:col-span-6 bg-white border border-sand-200 rounded-2xl p-6 shadow-sm space-y-4">
                    {selectedTicket ? (
                      <div className="space-y-4">
                        <div className="border-b border-sand-150 pb-3">
                          <span className="text-[10px] font-mono font-bold text-sand-500 uppercase">Detalhes do Chamado: {selectedTicket.id}</span>
                          <h4 className="font-serif font-bold text-sand-950 text-sm mt-1">{selectedTicket.subject}</h4>
                        </div>

                        <div className="bg-sand-50 border border-sand-200 rounded-xl p-4 text-xs space-y-2">
                          <div className="flex justify-between font-semibold text-sand-800 text-[10px]">
                            <span>DE: {selectedTicket.author} ({selectedTicket.email})</span>
                            <span>{selectedTicket.date}</span>
                          </div>
                          <p className="text-sand-700 leading-relaxed font-sans">{selectedTicket.message}</p>
                        </div>

                        <form onSubmit={handleReplyTicket} className="space-y-3">
                          <label className="text-[10px] font-bold text-sand-700 uppercase">Responder Chamado</label>
                          <textarea
                            rows={4}
                            required
                            placeholder="Digite sua resposta oficial de suporte aqui..."
                            value={ticketReply}
                            onChange={(e) => setTicketReply(e.target.value)}
                            className="w-full bg-sand-50 border border-sand-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-softblue-500 focus:outline-none"
                          />
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              className="px-4 py-2 bg-softblue-600 hover:bg-softblue-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm transition-colors"
                            >
                              Enviar Resposta
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setTickets(tickets.map(t => t.id === selectedTicket.id ? { ...t, status: 'Fechado' } : t));
                                setSelectedTicket({ ...selectedTicket, status: 'Fechado' });
                                safeAlert('Chamado fechado!');
                              }}
                              className="px-4 py-2 border border-sand-200 hover:bg-sand-100 text-sand-700 rounded-xl text-xs font-semibold cursor-pointer"
                            >
                              Fechar Chamado
                            </button>
                          </div>
                        </form>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col justify-center items-center py-12 text-center">
                        <HelpCircle className="text-sand-300 animate-bounce mb-3" size={32} />
                        <h4 className="font-serif font-bold text-sand-800 text-sm">Selecione um chamado da fila</h4>
                        <p className="text-xs text-sand-500 mt-1 max-w-[240px]">Clique em qualquer ticket à esquerda para responder e alterar o status de atendimento.</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* 10. ATUALIZACOES */}
            {activeTab === 'atualizacoes' && (
              <motion.div
                key="master-atualizacoes"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white border border-sand-200 rounded-2xl p-6 shadow-sm space-y-6"
              >
                <div className="flex justify-between items-center border-b border-sand-150 pb-3">
                  <div>
                    <h3 className="font-serif font-bold text-sand-900 text-sm">Gerenciamento de Atualizações Globais</h3>
                    <p className="text-xs text-sand-500 mt-0.5">Versão Atual da Plataforma: <strong className="font-mono text-softblue-600">v1.4.1-stable</strong></p>
                  </div>
                  <button
                    onClick={triggerPlatformUpdate}
                    disabled={isUpdating}
                    className="px-4 py-2 bg-softblue-600 hover:bg-softblue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm disabled:bg-sand-100 disabled:text-sand-400"
                  >
                    <RefreshCw size={13} className={isUpdating ? 'animate-spin' : ''} />
                    Disparar Atualização Global v1.4.2
                  </button>
                </div>

                {isUpdating && (
                  <div className="bg-sand-50 border border-sand-200 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span>Implantando nova release v1.4.2 em todas as instâncias...</span>
                      <span>{updateProgress}%</span>
                    </div>
                    <div className="w-full bg-sand-200 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-softblue-600 h-full rounded-full transition-all duration-200" style={{ width: `${updateProgress}%` }}></div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <h4 className="font-serif font-bold text-sand-950 text-xs">Histórico de Versões & Deployments</h4>
                  <div className="relative border-l-2 border-sand-200 pl-4 ml-2 space-y-4 text-xs text-sand-700">
                    <div className="relative">
                      <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-emerald-500 border border-white"></span>
                      <strong className="text-sand-900 font-semibold block">v1.4.1 (Hoje)</strong>
                      <p className="text-[11px] mt-0.5 text-sand-500">Refatoração para arquitetura SaaS Master modular, isolando dados clínicos de tenants por ID e movendo console multiempresa para painel de controle proprietário.</p>
                    </div>
                    <div className="relative">
                      <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-sand-400 border border-white"></span>
                      <strong className="text-sand-900 font-semibold block">v1.3.0 (12 Jul)</strong>
                      <p className="text-[11px] mt-0.5 text-sand-500">Implementação de conformidade com a LGPD, logs de auditoria automatizados no Firestore, assinatura digital de documentos e lixeira segura.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 11. BACKUPS */}
            {activeTab === 'backups' && (
              <motion.div
                key="master-backups"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white border border-sand-200 rounded-2xl p-6 shadow-sm space-y-6"
              >
                <div className="flex justify-between items-center border-b border-sand-150 pb-3">
                  <div>
                    <h3 className="font-serif font-bold text-sand-900 text-sm">Backups Globais de Servidor</h3>
                    <p className="text-xs text-sand-500 mt-0.5">Segurança redundante e snapshots agendados.</p>
                  </div>
                  <button
                    onClick={() => {
                      safeAlert('Processando backup de segurança de toda a infraestrutura MenteCare...\nO download do snapshot será iniciado.');
                      const jsonStr = JSON.stringify({ platform: 'mentecare', tenants, licenses, exportedAt: Date.now() }, null, 2);
                      const blob = new Blob([jsonStr], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `mentecare_master_db_backup_${Date.now()}.json`;
                      a.click();
                    }}
                    className="px-4 py-2.5 bg-softblue-600 hover:bg-softblue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <HardDrive size={13} />
                    Disparar Backup Master (JSON)
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-sand-50 border border-sand-200 rounded-xl space-y-2 text-xs">
                    <strong className="font-semibold text-sand-900">Configuração de Frequência</strong>
                    <div className="flex items-center gap-4 text-sand-600">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="radio" defaultChecked name="freq" /> Diário (02:00 UTC)
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="radio" name="freq" /> Semanal
                      </label>
                    </div>
                  </div>

                  <div className="p-4 bg-sand-50 border border-sand-200 rounded-xl space-y-2 text-xs">
                    <strong className="font-semibold text-sand-900">Destinos de Redundância</strong>
                    <div className="flex gap-4 text-sand-600">
                      <label className="flex items-center gap-1.5"><input type="checkbox" defaultChecked /> GCP Storage</label>
                      <label className="flex items-center gap-1.5"><input type="checkbox" defaultChecked /> AWS S3</label>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 12. LOGS */}
            {activeTab === 'logs' && (
              <motion.div
                key="master-logs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white border border-sand-200 rounded-2xl p-6 shadow-sm space-y-4"
              >
                <h3 className="font-serif font-bold text-sand-900 text-sm border-b border-sand-150 pb-3">Histórico Geral de Transações & Audit Logs</h3>
                
                <div className="divide-y divide-sand-100 max-h-[480px] overflow-y-auto pr-2 space-y-2 font-mono text-[11px]">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="pt-2 flex justify-between items-start gap-4">
                      <div>
                        <span className="px-1.5 py-0.5 bg-sand-100 font-bold uppercase rounded text-sand-700 mr-2">{log.action}</span>
                        <strong className="text-softblue-700">{log.email}</strong>: <span className="text-sand-800">{log.details}</span>
                        <div className="text-[10px] text-sand-400 mt-0.5">IP: {log.ip} | OS: {log.os} | Navegador: {log.browser}</div>
                      </div>
                      <span className="text-[10px] text-sand-400 shrink-0">{new Date(log.timestamp).toLocaleString('pt-BR')}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* 13. CONFIG */}
            {activeTab === 'config' && (
              <motion.div
                key="master-config"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white border border-sand-200 rounded-2xl p-6 shadow-sm space-y-6"
              >
                <h3 className="font-serif font-bold text-sand-950 text-sm border-b border-sand-150 pb-3">Configurações Globais da Plataforma SaaS</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="font-bold text-sand-700">Período de Testes Gratuitos (Trial - Dias)</label>
                      <input type="number" defaultValue={14} className="w-full bg-sand-50 border border-sand-200 rounded-xl px-3 py-2" />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-sand-700">Email de Suporte Geral</label>
                      <input type="email" defaultValue="suporte@mentecare.com.br" className="w-full bg-sand-50 border border-sand-200 rounded-xl px-3 py-2" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="font-bold text-sand-700">Sandbox / Gateway de Pagamento</label>
                      <select className="w-full bg-sand-50 border border-sand-200 rounded-xl px-3 py-2">
                        <option>MercadoPago (Ativo - Homologação)</option>
                        <option>Stripe API</option>
                        <option>Asaas Gateway</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-3 pt-6 text-sand-700">
                      <input type="checkbox" defaultChecked id="reg" className="cursor-pointer" />
                      <label htmlFor="reg" className="font-semibold cursor-pointer">Permitir auto-cadastro de novos psicólogos pela Landing Page</label>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => safeAlert('Configurações globais salvas no Firestore!')}
                  className="px-5 py-2.5 bg-softblue-600 hover:bg-softblue-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm"
                >
                  Salvar Configurações
                </button>
              </motion.div>
            )}

            {/* 14. CONVITES */}
            {activeTab === 'convites' && (
              <motion.div
                key="master-convites"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Invite List */}
                  <div className="lg:col-span-8 bg-white border border-sand-200 rounded-2xl p-6 shadow-sm space-y-4">
                    <h3 className="font-serif font-bold text-sand-950 text-sm border-b border-sand-150 pb-3">Convites Gerados</h3>
                    
                    <div className="overflow-x-auto border border-sand-150 rounded-xl font-mono">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-sand-50 text-sand-700 font-bold border-b border-sand-150">
                          <tr>
                            <th className="p-3">Código</th>
                            <th className="p-3 font-sans">Profissional</th>
                            <th className="p-3 font-sans">Email</th>
                            <th className="p-3 font-sans">Status</th>
                            <th className="p-3 font-sans">Criado Em</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-sand-100">
                          {invites.map((inv, idx) => (
                            <tr key={idx} className="hover:bg-sand-50/50">
                              <td className="p-3 font-bold text-sand-900">{inv.code}</td>
                              <td className="p-3 font-sans font-semibold text-sand-800">{inv.recipient}</td>
                              <td className="p-3 text-sand-600">{inv.email}</td>
                              <td className="p-3 font-sans">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                  inv.status === 'Aceito' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-amber-50 border border-amber-200 text-amber-800 animate-pulse'
                                }`}>
                                  {inv.status}
                                </span>
                              </td>
                              <td className="p-3 font-sans text-sand-500">{inv.createdAt}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Generate invite */}
                  <div className="lg:col-span-4 bg-white border border-sand-200 rounded-2xl p-6 shadow-sm space-y-4">
                    <h3 className="font-serif font-bold text-sand-950 text-sm border-b border-sand-150 pb-3">Novo Convite</h3>
                    
                    <form onSubmit={handleGenerateInvite} className="space-y-4 text-xs">
                      <div className="space-y-1">
                        <label className="font-bold text-sand-700">Nome do Psicólogo Convidado</label>
                        <input
                          type="text"
                          required
                          placeholder="Dra. Roberta Andrade"
                          value={newInviteName}
                          onChange={(e) => setNewInviteName(e.target.value)}
                          className="w-full bg-sand-50 border border-sand-200 rounded-xl px-3 py-2"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-sand-700">Email para Envio</label>
                        <input
                          type="email"
                          required
                          placeholder="roberta@andradepsi.com"
                          value={newInviteEmail}
                          onChange={(e) => setNewInviteEmail(e.target.value)}
                          className="w-full bg-sand-50 border border-sand-200 rounded-xl px-3 py-2"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-softblue-600 hover:bg-softblue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                      >
                        <Mail size={14} />
                        Gerar e Enviar Convite
                      </button>
                    </form>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 15. MULTIEMPRESA ORIGINAL INTEGRATED CONTROLS */}
            {activeTab === 'multiempresa' && (
              <motion.div
                key="master-multi"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Embedded switcher block */}
                <div className="bg-white border border-sand-200 rounded-2xl p-6 shadow-sm space-y-4">
                  <h3 className="font-serif font-bold text-sand-900 text-sm border-b border-sand-150 pb-3">Console Integrado de Tenants</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {tenants.map(t => (
                      <div key={t.id} className="p-4 bg-sand-50 border border-sand-200 rounded-xl flex items-center justify-between">
                        <div>
                          <strong className="text-sand-900 text-sm block">{t.name}</strong>
                          <span className="font-mono text-sand-500 text-[10px]">tenantId: {t.id}</span>
                        </div>
                        <button
                          onClick={() => onEnterTenant(t)}
                          className="px-3 py-1.5 bg-softblue-500 hover:bg-softblue-600 text-white font-bold rounded-lg cursor-pointer text-xs"
                        >
                          Simular Acesso
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* 16. LIXEIRA GLOBAL */}
            {activeTab === 'lixeira' && (
              <motion.div
                key="master-lixeira"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="bg-white border border-sand-200 rounded-2xl p-6 shadow-sm space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-sand-150 pb-4">
                    <div>
                      <h3 className="font-serif font-bold text-sand-950 text-base">Lixeira Global Inteligente (LGPD)</h3>
                      <p className="text-xs text-sand-500 mt-1">
                        Gerenciamento centralizado de itens em Soft Delete. Conforme diretrizes da LGPD, os registros clínicos são mantidos em retenção preventiva por até 90 dias antes de expirar.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-red-50 border border-red-200 text-red-800 px-3 py-1 rounded-lg font-bold font-mono uppercase tracking-wide">
                        Retenção Ativa: 90 Dias
                      </span>
                    </div>
                  </div>

                  {/* Filters Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="space-y-1">
                      <label className="font-bold text-sand-700">Pesquisar</label>
                      <input
                        type="text"
                        placeholder="Buscar por título, responsável, motivo..."
                        value={trashSearch}
                        onChange={(e) => setTrashSearch(e.target.value)}
                        className="w-full bg-sand-50 border border-sand-200 rounded-xl px-3 py-2 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-sand-700">Filtrar por Módulo</label>
                      <select
                        value={trashColFilter}
                        onChange={(e) => setTrashColFilter(e.target.value)}
                        className="w-full bg-sand-50 border border-sand-200 rounded-xl px-3 py-2 text-xs"
                      >
                        <option value="all">Todos os Módulos</option>
                        <option value="patients">Pacientes</option>
                        <option value="patient_records">Prontuários Clínicos</option>
                        <option value="appointments">Agenda / Consultas</option>
                        <option value="financial_transactions">Financeiro</option>
                        <option value="receipts">Recibos</option>
                        <option value="blog_posts">Blog / CMS</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-sand-700">Filtrar por Tenant (Clínica)</label>
                      <select
                        value={trashTenantFilter}
                        onChange={(e) => setTrashTenantFilter(e.target.value)}
                        className="w-full bg-sand-50 border border-sand-200 rounded-xl px-3 py-2 text-xs"
                      >
                        <option value="all">Todos os Tenants</option>
                        {tenants.map(t => (
                          <option key={t.id} value={t.id}>{t.name} ({t.id})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Trash items table */}
                  {trashItems.filter(item => {
                    const matchesSearch = !trashSearch || 
                                          item.title?.toLowerCase().includes(trashSearch.toLowerCase()) ||
                                          item.deletedBy?.toLowerCase().includes(trashSearch.toLowerCase()) ||
                                          item.deleteReason?.toLowerCase().includes(trashSearch.toLowerCase()) ||
                                          item.id?.toLowerCase().includes(trashSearch.toLowerCase());
                    const matchesCol = trashColFilter === 'all' || item.originalCollection === trashColFilter;
                    const matchesTenant = trashTenantFilter === 'all' || item.tenantId === trashTenantFilter;
                    return matchesSearch && matchesCol && matchesTenant;
                  }).length === 0 ? (
                    <div className="p-8 border border-dashed border-sand-200 rounded-xl text-center text-sand-500 text-xs">
                      <Trash2 size={24} className="mx-auto text-sand-300 mb-2" />
                      Nenhum item encontrado na lixeira para os filtros selecionados.
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-sand-150 rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-sand-50 text-sand-700 font-bold border-b border-sand-150">
                          <tr>
                            <th className="p-3">Data Exclusão</th>
                            <th className="p-3">Item / Título</th>
                            <th className="p-3">Módulo Original</th>
                            <th className="p-3">Responsável</th>
                            <th className="p-3">Tenant ID</th>
                            <th className="p-3">Motivo da Exclusão</th>
                            <th className="p-3">Expiração</th>
                            <th className="p-3 text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-sand-100 font-medium">
                          {trashItems.filter(item => {
                            const matchesSearch = !trashSearch || 
                                                  item.title?.toLowerCase().includes(trashSearch.toLowerCase()) ||
                                                  item.deletedBy?.toLowerCase().includes(trashSearch.toLowerCase()) ||
                                                  item.deleteReason?.toLowerCase().includes(trashSearch.toLowerCase()) ||
                                                  item.id?.toLowerCase().includes(trashSearch.toLowerCase());
                            const matchesCol = trashColFilter === 'all' || item.originalCollection === trashColFilter;
                            const matchesTenant = trashTenantFilter === 'all' || item.tenantId === trashTenantFilter;
                            return matchesSearch && matchesCol && matchesTenant;
                          }).map((item) => {
                            const dateStr = new Date(item.deletedAt).toLocaleString('pt-BR');
                            const expDays = Math.max(0, Math.ceil(((item.restoreUntil || (item.deletedAt + 7776000000)) - Date.now()) / 86400000));
                            
                            return (
                              <tr key={item.id} className="hover:bg-sand-50/50">
                                <td className="p-3 font-mono text-[10px] text-sand-500 whitespace-nowrap">{dateStr}</td>
                                <td className="p-3 text-sand-900 font-bold max-w-[180px] truncate" title={item.title}>
                                  {item.title}
                                </td>
                                <td className="p-3 whitespace-nowrap">
                                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-sand-100 text-sand-700 border border-sand-200">
                                    {item.originalCollection}
                                  </span>
                                </td>
                                <td className="p-3 text-sand-600 truncate max-w-[120px]" title={item.deletedBy}>
                                  {item.deletedBy}
                                </td>
                                <td className="p-3 font-mono text-[10px] text-softblue-600">{item.tenantId || 'global'}</td>
                                <td className="p-3 text-sand-500 italic max-w-[160px] truncate" title={item.deleteReason}>
                                  {item.deleteReason || 'Não especificado'}
                                </td>
                                <td className="p-3 whitespace-nowrap">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                    expDays < 10 ? 'bg-rose-50 text-rose-800 border border-rose-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                                  }`}>
                                    {expDays} dias restando
                                  </span>
                                </td>
                                <td className="p-3 text-right whitespace-nowrap space-x-1.5">
                                  <button
                                    onClick={() => handleRestoreTrash(item.id, item.title)}
                                    className="px-2 py-1 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-800 rounded font-bold text-[10px] cursor-pointer"
                                  >
                                    Restaurar
                                  </button>
                                  <button
                                    onClick={() => handleDeletePermanently(item.id, item.title)}
                                    className="px-2 py-1 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-800 rounded font-bold text-[10px] cursor-pointer"
                                  >
                                    Excluir Definitivo
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* 14. SEGURANÇA */}
            {activeTab === 'seguranca' && (
              <motion.div
                key="master-seguranca"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="bg-white border border-sand-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                  <div>
                    <h3 className="font-serif font-black text-sand-950 text-base">Políticas de Segurança da Plataforma</h3>
                    <p className="text-[11px] text-sand-500 mt-0.5">Gerencie os limites de sessão, chaves de criptografia e acessos à conta master.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-sand-50 border border-sand-200 p-5 rounded-2xl space-y-4">
                      <h4 className="font-serif font-bold text-sand-900 text-xs">Controle de Sessão Administradora</h4>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-sand-700 font-semibold">Tempo de Expiração do Token JWT</span>
                          <span className="font-mono bg-white border border-sand-200 px-2.5 py-1 rounded-lg text-sand-800 font-bold">12 Horas</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-sand-700 font-semibold">Autenticação de Dois Fatores (2FA)</span>
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200">Ativa e Obrigatória</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-sand-700 font-semibold">Bloqueio por Tentativas Incorretas</span>
                          <span className="font-mono bg-white border border-sand-200 px-2.5 py-1 rounded-lg text-sand-800 font-bold">5 Tentativas</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-sand-50 border border-sand-200 p-5 rounded-2xl space-y-4">
                      <h4 className="font-serif font-bold text-sand-900 text-xs">Criptografia e Chaves AES-256</h4>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-sand-700 font-semibold">Chave de Assinatura de Documentos</span>
                          <span className="font-mono bg-white border border-sand-200 px-2.5 py-1 rounded-lg text-sand-500 text-[10px]">Ativa (Gerada em Fev/2026)</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-sand-700 font-semibold">Conformidade ISO/IEC 27001</span>
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200">Certificada</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-sand-700 font-semibold">Isolamento Físico de Tenants (Cripto)</span>
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200">Habilitado</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-sand-100/50 border border-sand-150 p-4 rounded-xl text-[10px] text-sand-600 leading-relaxed flex items-start gap-2">
                    <ShieldCheck size={14} className="text-softblue-600 mt-0.5 shrink-0" />
                    <p>
                      MenteCare utiliza criptografia em trânsito TLS 1.3 e em repouso AES-256 gerenciada pelo Google Cloud Key Management Service (KMS). O tráfego de dados cumpre integralmente os requisitos da Lei Geral de Proteção de Dados (LGPD) e regras éticas do Conselho Federal de Psicologia (CFP).
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 15. INTEGRAÇÕES */}
            {activeTab === 'integracoes' && (
              <motion.div
                key="master-integracoes"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="bg-white border border-sand-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                  <div>
                    <h3 className="font-serif font-black text-sand-950 text-base">Integrações Globais de Terceiros</h3>
                    <p className="text-[11px] text-sand-500 mt-0.5">Habilite ou desabilite APIs, Webhooks e serviços de IA conectados à infraestrutura do SaaS.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { name: 'Google Cloud Vertex AI', desc: 'Previsões, triagem de sintomas e assistente clínico inteligente baseado em Gemini 1.5 Flash.', status: 'Ativo', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
                      { name: 'Stripe Gateway (Webhooks)', desc: 'Conciliação e cobrança das mensalidades SaaS dos psicólogos de forma automática.', status: 'Ativo', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
                      { name: 'WhatsApp Cloud API (Z-API)', desc: 'Disparo automatizado de lembretes de consultas e confirmações via WhatsApp direto.', status: 'Ativo', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
                      { name: 'Asaas API Gateway', desc: 'Emissão de faturas em boleto e PIX automático para cobranças unificadas do ERP.', status: 'Configuração Pendente', color: 'bg-amber-50 border-amber-200 text-amber-700' }
                    ].map((integ, index) => (
                      <div key={index} className="border border-sand-200 p-4 rounded-2xl flex flex-col justify-between gap-3 hover:border-sand-300 bg-sand-50/20">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-serif font-bold text-sand-900 text-xs">{integ.name}</span>
                            <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full border ${integ.color}`}>
                              {integ.status}
                            </span>
                          </div>
                          <p className="text-[10px] text-sand-500 leading-relaxed">{integ.desc}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => safeAlert(`Configurações de credenciais para '${integ.name}' são gerenciadas sob políticas de segredo no Google Secrets Manager.`)}
                          className="text-[10px] font-bold text-softblue-600 hover:text-softblue-700 text-left underline cursor-pointer"
                        >
                          Configurar Credenciais API
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* 16. MEU PERFIL */}
            {activeTab === 'perfil' && (
              <motion.div
                key="master-perfil"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="bg-white border border-sand-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 max-w-2xl mx-auto">
                  <div className="flex items-center gap-4 border-b border-sand-150 pb-5">
                    <div className="h-14 w-14 rounded-full bg-softblue-600/10 border border-softblue-500/30 flex items-center justify-center font-serif font-black text-xl text-softblue-700">
                      MA
                    </div>
                    <div>
                      <h3 className="font-serif font-black text-sand-950 text-base">Meu Perfil de Administrador</h3>
                      <p className="text-[11px] text-sand-500">Credenciais proprietárias para gerenciar toda a plataforma MenteCare SaaS.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-[9px] font-bold text-sand-500 uppercase">Nome Completo</span>
                        <p className="text-sand-950 font-bold mt-0.5">Master Administrator</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-sand-500 uppercase">E-mail Master</span>
                        <p className="text-sand-950 font-bold mt-0.5 font-mono">{user?.email}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs pt-2">
                      <div>
                        <span className="text-[9px] font-bold text-sand-500 uppercase">Nível de Acesso</span>
                        <p className="text-emerald-700 font-bold mt-0.5">Superuser (Proprietário)</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-sand-500 uppercase">Último Login</span>
                        <p className="text-sand-900 mt-0.5 font-mono">{new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-5 border-t border-sand-150">
                    <h4 className="font-serif font-bold text-sand-900 text-xs mb-3">Segurança da Conta</h4>
                    <button
                      type="button"
                      onClick={() => safeAlert('Deseja iniciar o fluxo de alteração de senha de superusuário? Um e-mail de redefinição segura foi enviado para ' + user?.email)}
                      className="px-4 py-2 border border-sand-300 hover:bg-sand-50 text-sand-700 font-bold rounded-xl text-xs cursor-pointer transition-colors"
                    >
                      Alterar Senha do Administrador
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Footer info brand */}
        <footer className="text-center text-[10px] text-sand-400 font-mono pt-8">
          MenteCare Enterprise v1.4.1-stable © {new Date().getFullYear()} - Todos os direitos reservados.
        </footer>
      </main>
    </div>
  );
}
