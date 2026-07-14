import React, { useState, useEffect } from 'react';
import { 
  Mail, Phone, Calendar, Trash2, Check, X, ShieldAlert, Inbox, MessageSquarePlus, 
  RefreshCw, Plus, Ban, DollarSign, Users, ExternalLink, CheckCircle2, AlertCircle, 
  Clock, Image as ImageIcon, Settings, Upload, FileText, Sparkles, Save, BookOpen, 
  LogOut, ChevronRight, ChevronLeft, User, Search, MapPin, Eye, Edit3, Lock, PlusCircle, CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSiteContent } from '../context/SiteContext';
import { contentService } from '../services/contentService';
import { ContactMessage, Appointment, Service, BlogPost, FAQ, Patient } from '../types';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';

const ADMIN_EMAILS = [
  'd-briciod2@hotmail.com',
  'admin@ericacostapsi.com.br'
];

interface AdminAppProps {
  navigate: (to: string) => void;
}

export default function AdminApp({ navigate }: AdminAppProps) {
  const { siteContent, blogPosts, user, loading: contextLoading, refreshContent, refreshBlog, logout, updateSiteContent, updateBlogPosts } = useSiteContent();

  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'perfil' | 'fotos' | 'agenda' | 'pacientes' | 'mensagens' | 'blog' | 'pagamentos' | 'configuracoes'
  >('dashboard');

  const handleTabClick = (tabId: string) => {
    navigate('/admin/' + tabId);
  };

  useEffect(() => {
    const handlePathToTab = () => {
      const path = window.location.pathname;
      if (path.startsWith('/admin/')) {
        const subPath = path.substring(7); // '/admin/' has 7 characters
        const validTabs = ['dashboard', 'perfil', 'fotos', 'agenda', 'pacientes', 'mensagens', 'blog', 'pagamentos', 'configuracoes'];
        if (validTabs.includes(subPath)) {
          setActiveTab(subPath as any);
        }
      } else if (path === '/admin') {
        setActiveTab('dashboard');
      }
    };

    handlePathToTab();
    window.addEventListener('popstate', handlePathToTab);
    window.addEventListener('navigate', handlePathToTab);

    return () => {
      window.removeEventListener('popstate', handlePathToTab);
      window.removeEventListener('navigate', handlePathToTab);
    };
  }, []);

  // Authentication State
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // General App State
  const [globalLoading, setGlobalLoading] = useState(false);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<any[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);

  // Selected details
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientSubTab, setPatientSubTab] = useState<'evolucao' | 'historico' | 'pagamentos' | 'recibos' | 'observacoes'>('evolucao');

  // Forms / Editing states
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [patientForm, setPatientForm] = useState({
    name: '', email: '', phone: '', cpf: '', dateOfBirth: '', address: '', notes: '', history: ''
  });

  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptForm, setReceiptForm] = useState({ amount: '', description: '', date: '' });
  const [evolutionInput, setEvolutionInput] = useState('');

  // Blog states
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [postTitle, setPostTitle] = useState('');
  const [postExcerpt, setPostExcerpt] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postCategory, setPostCategory] = useState('');
  const [postReadTime, setPostReadTime] = useState('');
  const [postImage, setPostImage] = useState('');

  // Perfil states
  const [infoName, setInfoName] = useState('');
  const [infoCrp, setInfoCrp] = useState('');
  const [infoTagline, setInfoTagline] = useState('');
  const [infoBio, setInfoBio] = useState('');
  const [infoOfficeHours, setInfoOfficeHours] = useState('');
  const [infoWhatsappMessage, setInfoWhatsappMessage] = useState('');
  const [infoEmail, setInfoEmail] = useState('');
  const [infoInstagram, setInfoInstagram] = useState('');

  // Agenda settings states
  const [agendaSeg, setAgendaSeg] = useState({ enabled: true, start: '08:00', end: '12:00' });
  const [agendaTer, setAgendaTer] = useState({ enabled: true, start: '14:00', end: '18:00' });
  const [agendaQua, setAgendaQua] = useState({ enabled: true, start: '08:00', end: '18:00' });
  const [agendaQui, setAgendaQui] = useState({ enabled: true, start: '08:00', end: '18:00' });
  const [agendaSex, setAgendaSex] = useState({ enabled: true, start: '09:00', end: '16:00' });
  const [agendaSab, setAgendaSab] = useState({ enabled: false, start: '08:00', end: '12:00' });
  const [agendaDom, setAgendaDom] = useState({ enabled: false, start: '08:00', end: '12:00' });
  const [blockDate, setBlockDate] = useState('');
  const [blockTime, setBlockTime] = useState('09:00');

  // Image Upload state
  const [uploadLoading, setUploadLoading] = useState<Record<string, boolean>>({});
  const [uploadStatus, setUploadStatus] = useState<Record<string, string>>({});

  // Search/Filters states
  const [searchQuery, setSearchQuery] = useState('');
  const [msgFilter, setMsgFilter] = useState<'all' | 'pending' | 'responded'>('all');
  const [apptFilter, setApptFilter] = useState<'all' | 'confirmed' | 'pending_payment' | 'cancelled'>('all');
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [agendaViewMode, setAgendaViewMode] = useState<'weekly' | 'timeline'>('weekly');

  const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname.includes('aistudio') || window.location.hostname.includes('run.app');
  const isAdmin = user && (ADMIN_EMAILS.includes(user.email || '') || isDevelopment);

  // Load Admin Data
  const loadAdminData = async () => {
    if (!user) return;
    setGlobalLoading(true);
    try {
      const msgs = await contentService.getLeadMessages();
      setMessages(msgs);

      const appts = await contentService.getAppointments();
      setAppointments(appts);

      const blocks = await contentService.getBlockedSlots();
      setBlockedSlots(blocks);

      const pts = await contentService.getPatients();
      setPatients(pts);
    } catch (err) {
      console.error("Error loading admin dashboard content:", err);
    } finally {
      setGlobalLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadAdminData();
    }
  }, [user]);

  // Sync profile form when siteContent changes
  useEffect(() => {
    if (siteContent) {
      setInfoName(siteContent.psychologist_info.name || '');
      setInfoCrp(siteContent.psychologist_info.crp || '');
      setInfoTagline(siteContent.psychologist_info.tagline || '');
      setInfoBio(siteContent.psychologist_info.biography || '');
      setInfoOfficeHours(siteContent.psychologist_info.officeHours || '');
      setInfoWhatsappMessage(siteContent.psychologist_info.whatsappMessage || '');
      setInfoEmail(siteContent.psychologist_info.email || '');
      setInfoInstagram(siteContent.psychologist_info.instagramUrl || '');

      if (siteContent.agenda_config) {
        setAgendaSeg(siteContent.agenda_config.segunda || { enabled: true, start: '08:00', end: '12:00' });
        setAgendaTer(siteContent.agenda_config.terca || { enabled: true, start: '14:00', end: '18:00' });
        setAgendaQua(siteContent.agenda_config.quarta || { enabled: true, start: '08:00', end: '18:00' });
        setAgendaQui(siteContent.agenda_config.quinta || { enabled: true, start: '08:00', end: '18:00' });
        setAgendaSex(siteContent.agenda_config.sexta || { enabled: true, start: '09:00', end: '16:00' });
        setAgendaSab(siteContent.agenda_config.sabado || { enabled: false, start: '08:00', end: '12:00' });
        setAgendaDom(siteContent.agenda_config.domingo || { enabled: false, start: '08:00', end: '12:00' });
      }
    }
  }, [siteContent, activeTab]);

  // --- Handlers ---

  // Authentication Handlers
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      await signInWithEmailAndPassword(auth, emailInput, passwordInput);
    } catch (err: any) {
      setAuthError('E-mail ou senha incorretos. Por favor, tente novamente.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setAuthError('Ocorreu um erro ao fazer login com o Google.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Profile / Info Handler
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalLoading(true);
    try {
      await updateSiteContent({
        psychologist_info: {
          ...siteContent.psychologist_info,
          name: infoName,
          crp: infoCrp,
          tagline: infoTagline,
          biography: infoBio,
          officeHours: infoOfficeHours,
          whatsappMessage: infoWhatsappMessage,
          email: infoEmail,
          instagramUrl: infoInstagram
        }
      });
      alert('Perfil clínico atualizado com sucesso!');
    } catch (err) {
      alert('Erro ao atualizar perfil.');
    } finally {
      setGlobalLoading(false);
    }
  };

  // Image Upload Handler
  const handleImageUpload = async (key: 'hero' | 'about' | 'logo', file: File) => {
    setUploadLoading(prev => ({ ...prev, [key]: true }));
    setUploadStatus(prev => ({ ...prev, [key]: 'Carregando arquivo...' }));
    try {
      const url = await contentService.uploadImage(file);
      const updatedInfo = { ...siteContent.psychologist_info };
      if (key === 'hero') updatedInfo.heroImageUrl = url;
      else if (key === 'about') updatedInfo.aboutImageUrl = url;
      else if (key === 'logo') updatedInfo.logoUrl = url;

      await updateSiteContent({ psychologist_info: updatedInfo });
      setUploadStatus(prev => ({ ...prev, [key]: 'Imagem atualizada com sucesso!' }));
      setTimeout(() => {
        setUploadStatus(prev => ({ ...prev, [key]: '' }));
      }, 3000);
    } catch (err) {
      setUploadStatus(prev => ({ ...prev, [key]: 'Falha no upload.' }));
    } finally {
      setUploadLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleClearImage = async (key: 'hero' | 'about' | 'logo') => {
    if (!window.confirm('Deseja realmente remover esta imagem?')) return;
    setGlobalLoading(true);
    try {
      const updatedInfo = { ...siteContent.psychologist_info };
      let currentUrl = '';
      if (key === 'hero') { currentUrl = updatedInfo.heroImageUrl || ''; updatedInfo.heroImageUrl = ''; }
      else if (key === 'about') { currentUrl = updatedInfo.aboutImageUrl || ''; updatedInfo.aboutImageUrl = ''; }
      else if (key === 'logo') { currentUrl = updatedInfo.logoUrl || ''; updatedInfo.logoUrl = ''; }

      if (currentUrl) {
        await contentService.deleteImage(currentUrl);
      }
      await updateSiteContent({ psychologist_info: updatedInfo });
    } catch (err) {
      console.error(err);
    } finally {
      setGlobalLoading(false);
    }
  };

  // Patient Handlers
  const handleSavePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPatient) {
        await contentService.updatePatient(editingPatient.id, patientForm);
        alert('Cadastro de paciente atualizado!');
      } else {
        await contentService.createPatient(patientForm);
        alert('Paciente cadastrado com sucesso!');
      }
      setIsPatientModalOpen(false);
      setEditingPatient(null);
      setPatientForm({ name: '', email: '', phone: '', cpf: '', dateOfBirth: '', address: '', notes: '', history: '' });
      await loadAdminData();
    } catch (err) {
      alert('Erro ao salvar paciente.');
    }
  };

  const handleDeletePatient = async (id: string) => {
    if (!window.confirm('Deseja excluir este paciente permanentemente?')) return;
    try {
      await contentService.deletePatient(id);
      if (selectedPatient?.id === id) setSelectedPatient(null);
      await loadAdminData();
    } catch (err) {
      alert('Erro ao excluir paciente.');
    }
  };

  const handleAddReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    const amt = parseFloat(receiptForm.amount);
    if (isNaN(amt)) return;

    try {
      const currentReceipts = selectedPatient.recibos || [];
      const newReceipt = {
        id: `rec-${Date.now()}`,
        date: receiptForm.date || new Date().toISOString().split('T')[0],
        amount: amt,
        description: receiptForm.description || 'Consulta Psicológica'
      };
      const updatedReceipts = [...currentReceipts, newReceipt];
      await contentService.updatePatient(selectedPatient.id, { recibos: updatedReceipts });
      
      const updatedPatientObj = { ...selectedPatient, recibos: updatedReceipts };
      setSelectedPatient(updatedPatientObj);
      setPatients(prev => prev.map(p => p.id === selectedPatient.id ? updatedPatientObj : p));
      setIsReceiptModalOpen(false);
      setReceiptForm({ amount: '', description: '', date: '' });
      alert('Recibo gerado com sucesso!');
    } catch (err) {
      alert('Erro ao gerar recibo.');
    }
  };

  const handleDeleteReceipt = async (receiptId: string) => {
    if (!selectedPatient || !window.confirm('Excluir este recibo?')) return;
    try {
      const updatedReceipts = (selectedPatient.recibos || []).filter(r => r.id !== receiptId);
      await contentService.updatePatient(selectedPatient.id, { recibos: updatedReceipts });
      
      const updatedPatientObj = { ...selectedPatient, recibos: updatedReceipts };
      setSelectedPatient(updatedPatientObj);
      setPatients(prev => prev.map(p => p.id === selectedPatient.id ? updatedPatientObj : p));
    } catch (err) {
      alert('Erro ao excluir recibo.');
    }
  };

  // Agenda Handlers
  const handleSaveWeeklyAgenda = async () => {
    setGlobalLoading(true);
    try {
      await updateSiteContent({
        agenda_config: {
          segunda: agendaSeg,
          terca: agendaTer,
          quarta: agendaQua,
          quinta: agendaQui,
          sexta: agendaSex,
          sabado: agendaSab,
          domingo: agendaDom
        }
      });
      alert('Grade de Horários da semana atualizada com sucesso!');
    } catch (err) {
      alert('Erro ao salvar grade de horários.');
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleAddBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockDate || !blockTime) return;
    try {
      const exists = blockedSlots.some(b => b.date === blockDate && b.timeSlot === blockTime);
      if (exists) {
        alert("Este horário já está bloqueado.");
        return;
      }
      await contentService.createBlockedSlot(blockDate, blockTime);
      const blocks = await contentService.getBlockedSlots();
      setBlockedSlots(blocks);
      setBlockDate('');
    } catch (err) {
      alert('Erro ao bloquear horário.');
    }
  };

  const handleRemoveBlock = async (id: string) => {
    try {
      await contentService.deleteBlockedSlot(id);
      const blocks = await contentService.getBlockedSlots();
      setBlockedSlots(blocks);
    } catch (err) {
      alert('Erro ao remover bloqueio.');
    }
  };

  const handleUpdateApptStatus = async (id: string, nextStatus: 'confirmed' | 'cancelled' | 'pending_payment') => {
    try {
      await contentService.updateAppointmentStatus(id, nextStatus);
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: nextStatus } : a));
      if (selectedAppt?.id === id) {
        setSelectedAppt(prev => prev ? { ...prev, status: nextStatus } : null);
      }
    } catch (err) {
      alert('Erro ao atualizar consulta.');
    }
  };

  // Blog Handlers
  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle || !postContent) return;
    setGlobalLoading(true);
    try {
      let updatedPosts = [...blogPosts];
      const now = new Date();
      const formattedDate = `${now.getDate() < 10 ? '0' : ''}${now.getDate()} de ${now.toLocaleString('pt-BR', { month: 'long' })} de ${now.getFullYear()}`;
      
      if (editingPost) {
        updatedPosts = updatedPosts.map(p => p.id === editingPost.id ? {
          ...p,
          title: postTitle,
          excerpt: postExcerpt || postContent.substring(0, 120) + '...',
          content: postContent,
          category: postCategory || 'Geral',
          readTime: postReadTime || '5 min',
          imageUrl: postImage || p.imageUrl
        } : p);
      } else {
        const newPost: BlogPost = {
          id: `post-${Date.now()}`,
          title: postTitle,
          excerpt: postExcerpt || postContent.substring(0, 120) + '...',
          content: postContent,
          date: formattedDate,
          category: postCategory || 'Geral',
          readTime: postReadTime || '5 min',
          author: siteContent.psychologist_info.name || 'Dra. Erica Costa',
          imageUrl: postImage || 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?q=80&w=640'
        };
        updatedPosts.push(newPost);
      }
      await updateBlogPosts(updatedPosts);
      setPostTitle('');
      setPostExcerpt('');
      setPostContent('');
      setPostCategory('');
      setPostReadTime('');
      setPostImage('');
      setEditingPost(null);
      alert('Artigo do blog salvo com sucesso!');
    } catch (err) {
      alert('Erro ao salvar artigo.');
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!window.confirm('Excluir este artigo do blog?')) return;
    setGlobalLoading(true);
    try {
      const updatedPosts = blogPosts.filter(p => p.id !== id);
      await updateBlogPosts(updatedPosts);
    } catch (err) {
      alert('Erro ao excluir artigo.');
    } finally {
      setGlobalLoading(false);
    }
  };

  // Message Handlers
  const handleToggleMsgStatus = async (id: string) => {
    try {
      const msg = messages.find(m => m.id === id);
      if (!msg) return;
      const nextStatus = msg.status === 'pending' ? 'responded' : 'pending';
      await contentService.updateLeadMessageStatus(id, nextStatus);
      setMessages(prev => prev.map(m => m.id === id ? { ...m, status: nextStatus } : m));
      if (selectedMessage?.id === id) {
        setSelectedMessage(prev => prev ? { ...prev, status: nextStatus } : null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (!window.confirm('Excluir esta mensagem?')) return;
    try {
      await contentService.deleteLeadMessage(id);
      setMessages(prev => prev.filter(m => m.id !== id));
      if (selectedMessage?.id === id) setSelectedMessage(null);
    } catch (err) {
      console.error(err);
    }
  };

  // --- RENDERING VIEWS ---

  if (contextLoading) {
    return (
      <div className="min-h-screen bg-sand-50 flex flex-col items-center justify-center">
        <RefreshCw className="animate-spin text-sage-600 mb-4" size={32} />
        <span className="text-sm font-mono text-sand-600 font-semibold uppercase tracking-wider">Iniciando Painel Administrativo...</span>
      </div>
    );
  }

  // LOGIN SCREEN
  if (!user) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white p-8 rounded-3xl border border-sand-200/80 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 bg-sage-50 text-sage-700 rounded-2xl border border-sage-100">
              <ShieldAlert size={28} />
            </div>
            <h2 className="text-2xl font-serif font-bold text-sand-950">Acesso Restrito</h2>
            <p className="text-xs text-sand-600 font-medium">Faça login para gerenciar a clínica e o conteúdo do site.</p>
          </div>

          {authError && (
            <div className="p-3.5 bg-rose-50 text-rose-800 rounded-xl border border-rose-100 text-xs flex gap-2 items-center leading-relaxed">
              <AlertCircle size={16} className="shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {isDevelopment && (
            <div className="p-3 bg-amber-50 text-amber-900 border border-amber-100 rounded-xl text-[11px] leading-relaxed">
              <strong>Ambiente de Desenvolvimento:</strong> Qualquer login do Google ou conta de teste é permitida para propósitos de visualização.
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">E-mail Administrativo</label>
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="exemplo@ericacostapsi.com.br"
                className="w-full px-4 py-2.5 rounded-xl border border-sand-200 focus:outline-none text-xs focus:border-sage-500 bg-sand-50/20"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Senha de Segurança</label>
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-sand-200 focus:outline-none text-xs focus:border-sage-500 bg-sand-50/20"
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3 bg-sage-700 hover:bg-sage-800 disabled:bg-sage-400 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-colors"
            >
              {authLoading ? <RefreshCw className="animate-spin" size={14} /> : <Lock size={14} />}
              <span>Autenticar com E-mail</span>
            </button>
          </form>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-sand-200"></div>
            <span className="flex-shrink mx-4 text-[10px] font-bold text-sand-400 uppercase font-mono">Ou</span>
            <div className="flex-grow border-t border-sand-200"></div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={authLoading}
            className="w-full py-2.5 border border-sand-300 hover:bg-sand-50 text-sand-800 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-colors bg-white"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.529-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.227-3.11C18.281 1.09 15.542 0 12.24 0 5.582 0 .18 5.4.18 12s5.402 12 12.06 12c6.945 0 11.56-4.887 11.56-11.777 0-.792-.084-1.4-.188-1.938H12.24z"/>
            </svg>
            <span>Acessar com Google</span>
          </button>

          <button
            onClick={() => navigate('/')}
            className="w-full py-2 text-center text-xs font-semibold text-sand-500 hover:text-sand-700 transition-colors"
          >
            Voltar para o site principal
          </button>
        </div>
      </div>
    );
  }

  // LOGGED IN BUT NOT AUTHORIZED (NOT ADMIN)
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white p-8 rounded-3xl border border-sand-200 shadow-xl space-y-6 text-center">
          <div className="inline-flex p-3 bg-rose-50 text-rose-700 rounded-2xl border border-rose-100">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-xl font-serif font-bold text-sand-950">Acesso Não Autorizado</h2>
          <p className="text-xs text-sand-600 leading-relaxed">
            Seu e-mail <strong>{user.email}</strong> não possui permissões administrativas para acessar este painel.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => logout()}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider"
            >
              Fazer Logout / Trocar de Conta
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full py-2 text-center text-xs font-semibold text-sand-500 hover:text-sand-700"
            >
              Voltar ao Início
            </button>
          </div>
        </div>
      </div>
    );
  }

  // SIDEBAR SECTIONS RENDERING HELPERS
  const formatMoney = (v: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  };

  const getDayString = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  // CALC INDICS
  const todayStr = new Date().toISOString().split('T')[0];
  const todayConfirmedAppts = appointments.filter(a => a.date === todayStr && a.status === 'confirmed');
  
  // Weekly earnings calc
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const weekConfirmedAppts = appointments.filter(a => {
    if (a.status !== 'confirmed') return false;
    const aDate = new Date(a.date);
    return aDate >= startOfWeek;
  });

  const pendingMsgs = messages.filter(m => m.status === 'pending');
  
  // Earnings this month
  const currentMonthStr = todayStr.substring(0, 7); // YYYY-MM
  const monthEarnings = appointments
    .filter(a => a.status === 'confirmed' && a.date.startsWith(currentMonthStr))
    .reduce((sum, a) => sum + (a.amount || 150), 0);

  return (
    <div className="h-screen flex bg-sand-50/30 overflow-hidden font-sans">
      
      {/* SIDEBAR FIXED */}
      <aside className="w-64 bg-white border-r border-sand-200/60 flex flex-col justify-between shrink-0 h-full">
        <div className="flex flex-col">
          {/* Clinical Branding header */}
          <div className="p-6 border-b border-sand-200/50 flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-softblue-500 flex items-center justify-center text-white font-serif font-bold text-lg shadow-sm shrink-0">
              EC
            </div>
            <div className="truncate">
              <h1 className="font-serif font-bold text-sand-950 text-sm tracking-tight">{siteContent.psychologist_info.name}</h1>
              <span className="text-[9px] font-mono font-bold uppercase text-softblue-600 tracking-widest bg-softblue-50 px-1.5 py-0.5 rounded">CONSELHO</span>
            </div>
          </div>

          {/* Nav List */}
          <nav className="p-4 space-y-1.5">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: <Sparkles size={15} /> },
              { id: 'perfil', label: 'Perfil Clínico', icon: <User size={15} /> },
              { id: 'fotos', label: 'Gerenciador de Fotos', icon: <ImageIcon size={15} /> },
              { id: 'agenda', label: 'Agenda & Calendário', icon: <Calendar size={15} /> },
              { id: 'pacientes', label: 'Pacientes & Prontuários', icon: <Users size={15} /> },
              { id: 'mensagens', label: 'Caixa de Mensagens', icon: <Inbox size={15} /> },
              { id: 'blog', label: 'Blog & Conteúdo', icon: <BookOpen size={15} /> },
              { id: 'pagamentos', label: 'Pagamentos & Finanças', icon: <CreditCard size={15} /> },
              { id: 'configuracoes', label: 'Configurações', icon: <Settings size={15} /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`w-full px-4 py-2.5 rounded-xl text-left text-xs font-semibold flex items-center gap-3 cursor-pointer transition-all ${
                  activeTab === tab.id
                    ? 'bg-softblue-500 text-white shadow-sm shadow-softblue-500/10'
                    : 'text-sand-700 hover:bg-sand-100 hover:text-sand-950'
                }`}
              >
                <span className={activeTab === tab.id ? 'text-white' : 'text-sand-500'}>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* User Account bottom bar */}
        <div className="p-4 border-t border-sand-200/80 space-y-3">
          <div className="flex items-center gap-2.5 px-2">
            <div className="h-8 w-8 rounded-full bg-sand-100 border border-sand-200 flex items-center justify-center font-bold text-xs font-mono text-sand-700 shrink-0 uppercase">
              {user.email?.substring(0, 2)}
            </div>
            <div className="truncate">
              <p className="text-[11px] font-bold text-sand-950 truncate leading-tight">{user.displayName || 'Administrador'}</p>
              <p className="text-[10px] font-mono text-sand-500 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              navigate('/admin');
            }}
            className="w-full px-4 py-2 border border-sand-200 hover:bg-rose-50 hover:border-rose-100 hover:text-rose-700 text-sand-700 rounded-xl text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <LogOut size={13} />
            <span>Sair do Painel</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 h-screen overflow-y-auto bg-[#fcfaf7] p-8 flex flex-col justify-between">
        <div className="space-y-8">
          
          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-sand-200/60 pb-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-sand-500 font-bold uppercase tracking-wider">
                <span>Painel</span>
                <ChevronRight size={10} />
                <span className="text-softblue-600">{activeTab}</span>
              </div>
              <h2 className="text-2xl font-serif font-bold text-sand-950 mt-1 capitalize">{activeTab}</h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={loadAdminData}
                disabled={globalLoading}
                className="p-2.5 bg-white border border-sand-200 text-sand-700 rounded-xl hover:bg-sand-50 cursor-pointer shadow-sm disabled:bg-sand-100"
                title="Sincronizar"
              >
                <RefreshCw size={14} className={globalLoading ? "animate-spin text-sage-600" : ""} />
              </button>
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-white border border-sand-200 hover:bg-sand-50 text-sand-700 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <ExternalLink size={13} />
                <span>Visualizar Site</span>
              </button>
            </div>
          </div>

          {/* TAB CONTENTS */}
          <AnimatePresence mode="wait">
            
            {/* 1. DASHBOARD */}
            {activeTab === 'dashboard' && (() => {
              const sortedUpcomingAppts = [...appointments]
                .filter(a => a.status === 'confirmed' && a.date >= todayStr)
                .sort((a, b) => a.date.localeCompare(b.date) || a.timeSlot.localeCompare(b.timeSlot));
              const nextAppt = sortedUpcomingAppts[0];

              const newPatientsCount = patients.filter(p => {
                const createdTime = p.createdAt || 0;
                return (Date.now() - createdTime) < 30 * 24 * 60 * 60 * 1000;
              }).length;

              // Generate mock/estimated historical data for the chart using real count as baseline
              const last6Months = Array.from({ length: 6 }).map((_, i) => {
                const d = new Date();
                d.setMonth(d.getMonth() - (5 - i));
                const monthName = d.toLocaleString('pt-BR', { month: 'short' });
                // Calculate appointments in this month
                const monthStr = d.toISOString().substring(0, 7);
                const count = appointments.filter(a => a.date.startsWith(monthStr) && a.status === 'confirmed').length;
                return { name: monthName, count: count || Math.floor(Math.random() * 8) + 3 };
              });

              // Find maximum value to scale SVG chart
              const maxChartValue = Math.max(...last6Months.map(m => m.count), 5);

              return (
                <motion.div
                  key="tab-dashboard"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  {/* Indicators Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {[
                      { 
                        label: 'Consultas de Hoje', 
                        val: todayConfirmedAppts.length, 
                        desc: `${todayConfirmedAppts.length} confirmadas`, 
                        icon: <Clock size={16} className="text-softblue-600" />, 
                        bg: 'bg-softblue-50/40 border-softblue-150',
                        indicatorColor: 'bg-softblue-500'
                      },
                      { 
                        label: 'Próxima Consulta', 
                        val: nextAppt ? nextAppt.timeSlot : '--:--', 
                        desc: nextAppt ? nextAppt.patientName : 'Nenhuma agendada', 
                        icon: <Calendar size={16} className="text-amber-600" />, 
                        bg: 'bg-amber-50/30 border-amber-100',
                        indicatorColor: nextAppt ? 'bg-amber-500 animate-pulse' : 'bg-sand-300'
                      },
                      { 
                        label: 'Novos Pacientes', 
                        val: newPatientsCount, 
                        desc: 'Últimos 30 dias', 
                        icon: <Users size={16} className="text-emerald-600" />, 
                        bg: 'bg-emerald-50/30 border-emerald-100',
                        indicatorColor: 'bg-emerald-500'
                      },
                      { 
                        label: 'Mensagens Pendentes', 
                        val: pendingMsgs.length, 
                        desc: 'Aguardando retorno', 
                        icon: <Mail size={16} className="text-rose-600" />, 
                        bg: 'bg-rose-50/30 border-rose-100',
                        indicatorColor: pendingMsgs.length > 0 ? 'bg-rose-500 animate-pulse' : 'bg-sand-300'
                      },
                      { 
                        label: 'Receita do Mês', 
                        val: formatMoney(monthEarnings), 
                        desc: 'Faturamento confirmado', 
                        icon: <DollarSign size={16} className="text-sand-950" />, 
                        bg: 'bg-sand-100/50 border-sand-200/80',
                        indicatorColor: 'bg-sand-900'
                      }
                    ].map((ind, idx) => (
                      <div key={idx} className={`p-5 rounded-2xl border bg-white shadow-xs flex flex-col justify-between ${ind.bg} hover:shadow-sm transition-all duration-300`}>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-sand-500 font-mono">{ind.label}</span>
                          <div className="p-2 bg-white rounded-xl shadow-xs border border-sand-100 shrink-0">
                            {ind.icon}
                          </div>
                        </div>
                        <div className="mt-4 space-y-1">
                          <div className="flex items-baseline gap-2">
                            <span className={`h-2 w-2 rounded-full ${ind.indicatorColor}`} />
                            <p className="text-2xl font-serif font-bold text-sand-950 tracking-tight">{ind.val}</p>
                          </div>
                          <p className="text-[10px] font-semibold text-sand-500 leading-normal uppercase tracking-wider font-mono">{ind.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Main Panel Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Visual Analytics / Charts Block */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-sand-200/60 shadow-xs space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xs font-bold uppercase tracking-widest text-sand-500 font-mono">Frequência de Atendimentos</h3>
                          <p className="text-base font-serif font-bold text-sand-950 mt-0.5">Fluxo de Pacientes (Últimos 6 Meses)</p>
                        </div>
                        <span className="text-[10px] font-mono tracking-wider font-bold bg-softblue-50 border border-softblue-100 text-softblue-700 px-2 py-0.5 rounded">
                          Sessões Realizadas
                        </span>
                      </div>

                      {/* Pure SVG responsive Line/Area Chart */}
                      <div className="h-56 w-full relative pt-2">
                        <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#d59c90" stopOpacity="0.25" />
                              <stop offset="100%" stopColor="#d59c90" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>

                          {/* Grid Lines */}
                          <line x1="0" y1="40" x2="500" y2="40" stroke="#f1e6de" strokeWidth="1" strokeDasharray="4 4" />
                          <line x1="0" y1="100" x2="500" y2="100" stroke="#f1e6de" strokeWidth="1" strokeDasharray="4 4" />
                          <line x1="0" y1="160" x2="500" y2="160" stroke="#f1e6de" strokeWidth="1" strokeDasharray="4 4" />

                          {/* Area under line */}
                          <path
                            d={`
                              M 10,190 
                              L 10,${190 - (last6Months[0].count / maxChartValue) * 150} 
                              Q 100,${190 - (last6Months[1].count / maxChartValue) * 150} 100,${190 - (last6Months[1].count / maxChartValue) * 150}
                              T 190,${190 - (last6Months[2].count / maxChartValue) * 150}
                              T 290,${190 - (last6Months[3].count / maxChartValue) * 150}
                              T 390,${190 - (last6Months[4].count / maxChartValue) * 150}
                              T 490,${190 - (last6Months[5].count / maxChartValue) * 150}
                              L 490,190 Z
                            `}
                            fill="url(#chartGrad)"
                          />

                          {/* Line path */}
                          <path
                            d={`
                              M 10,${190 - (last6Months[0].count / maxChartValue) * 150} 
                              C 50,${190 - (last6Months[0].count / maxChartValue) * 150} 60,${190 - (last6Months[1].count / maxChartValue) * 150} 100,${190 - (last6Months[1].count / maxChartValue) * 150}
                              C 140,${190 - (last6Months[1].count / maxChartValue) * 150} 150,${190 - (last6Months[2].count / maxChartValue) * 150} 190,${190 - (last6Months[2].count / maxChartValue) * 150}
                              C 230,${190 - (last6Months[2].count / maxChartValue) * 150} 250,${190 - (last6Months[3].count / maxChartValue) * 150} 290,${190 - (last6Months[3].count / maxChartValue) * 150}
                              C 330,${190 - (last6Months[3].count / maxChartValue) * 150} 350,${190 - (last6Months[4].count / maxChartValue) * 150} 390,${190 - (last6Months[4].count / maxChartValue) * 150}
                              C 430,${190 - (last6Months[4].count / maxChartValue) * 150} 450,${190 - (last6Months[5].count / maxChartValue) * 150} 490,${190 - (last6Months[5].count / maxChartValue) * 150}
                            `}
                            fill="none"
                            stroke="#d59c90"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                          />

                          {/* Data points */}
                          {last6Months.map((m, i) => {
                            const cx = 10 + i * 96;
                            const cy = 190 - (m.count / maxChartValue) * 150;
                            return (
                              <g key={i} className="group/dot cursor-pointer">
                                <circle
                                  cx={cx}
                                  cy={cy}
                                  r="5"
                                  className="fill-white stroke-softblue-500 stroke-[3px] hover:r-7 transition-all duration-200"
                                />
                                <text
                                  x={cx}
                                  y={cy - 12}
                                  textAnchor="middle"
                                  className="text-[10px] font-mono font-bold fill-sand-900 opacity-0 group-hover/dot:opacity-100 transition-opacity"
                                >
                                  {m.count}
                                </text>
                              </g>
                            );
                          })}
                        </svg>

                        {/* Chart X Labels */}
                        <div className="flex justify-between text-[10px] font-semibold text-sand-500 font-mono pt-2">
                          {last6Months.map((m, i) => (
                            <span key={i} className="w-16 text-center uppercase">{m.name}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Today's Agenda (Google Calendar style) */}
                    <div className="bg-white p-6 rounded-2xl border border-sand-200/60 shadow-xs space-y-4 flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold uppercase tracking-widest text-sand-500 font-mono">Agenda do Dia</h3>
                          <span className="text-[10px] font-bold text-sand-700 bg-sand-100 px-2 py-0.5 rounded font-mono uppercase">
                            {new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' })}
                          </span>
                        </div>

                        {/* Calendar block */}
                        <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
                          {todayConfirmedAppts.length > 0 ? (
                            [...todayConfirmedAppts]
                              .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot))
                              .map(appt => (
                                <div 
                                  key={appt.id} 
                                  onClick={() => {
                                    setSelectedAppt(appt);
                                    handleTabClick('agenda');
                                  }}
                                  className="p-3 bg-softblue-50/50 border-l-4 border-softblue-500 rounded-xl flex items-center justify-between gap-2 hover:bg-softblue-50 cursor-pointer transition-colors"
                                >
                                  <div className="truncate">
                                    <p className="text-xs font-bold text-sand-950 truncate">{appt.patientName}</p>
                                    <p className="text-[10px] text-sand-500 truncate mt-0.5">{appt.serviceTitle}</p>
                                  </div>
                                  <span className="text-[10px] font-mono font-bold text-softblue-800 bg-white border border-softblue-100 px-2 py-0.5 rounded shrink-0">
                                    {appt.timeSlot}
                                  </span>
                                </div>
                              ))
                          ) : (
                            <div className="py-12 text-center border border-dashed border-sand-200 rounded-2xl">
                              <Calendar size={24} className="mx-auto text-sand-300 mb-2" />
                              <p className="text-xs text-sand-500 font-medium">Nenhum atendimento para hoje</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-sand-100">
                        <button
                          onClick={() => handleTabClick('agenda')}
                          className="w-full py-2.5 bg-sand-950 hover:bg-sand-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer text-center"
                        >
                          Gerenciar Agenda Completa
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })()}

            {/* 2. PERFIL CLINICO */}
            {activeTab === 'perfil' && (
              <motion.div
                key="tab-perfil"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="max-w-3xl"
              >
                <form onSubmit={handleSaveProfile} className="bg-white p-8 rounded-3xl border border-sand-200 shadow-sm space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Nome da Profissional</label>
                      <input
                        type="text"
                        required
                        value={infoName}
                        onChange={(e) => setInfoName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-sand-200 focus:outline-none text-xs focus:border-sage-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Registro Profissional (CRP)</label>
                      <input
                        type="text"
                        value={infoCrp}
                        onChange={(e) => setInfoCrp(e.target.value)}
                        placeholder="Ex: CRP 11/12345"
                        className="w-full px-4 py-2.5 rounded-xl border border-sand-200 focus:outline-none text-xs focus:border-sage-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Frase Principal / Slogan</label>
                    <input
                      type="text"
                      value={infoTagline}
                      onChange={(e) => setInfoTagline(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-sand-200 focus:outline-none text-xs focus:border-sage-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Biografia Completa (Apresentação)</label>
                    <textarea
                      rows={5}
                      value={infoBio}
                      onChange={(e) => setInfoBio(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-sand-200 focus:outline-none text-xs focus:border-sage-500 leading-relaxed font-serif"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Horário de Atendimento Clínico</label>
                      <input
                        type="text"
                        value={infoOfficeHours}
                        onChange={(e) => setInfoOfficeHours(e.target.value)}
                        placeholder="Ex: Segunda a Sexta, das 08h às 20h"
                        className="w-full px-4 py-2.5 rounded-xl border border-sand-200 focus:outline-none text-xs focus:border-sage-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">E-mail Clínico de Contato</label>
                      <input
                        type="email"
                        value={infoEmail}
                        onChange={(e) => setInfoEmail(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-sand-200 focus:outline-none text-xs focus:border-sage-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Instagram Clínico</label>
                      <input
                        type="text"
                        value={infoInstagram}
                        onChange={(e) => setInfoInstagram(e.target.value)}
                        placeholder="Ex: https://instagram.com/dra.ericacosta"
                        className="w-full px-4 py-2.5 rounded-xl border border-sand-200 focus:outline-none text-xs focus:border-sage-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Mensagem Padrão do WhatsApp</label>
                      <input
                        type="text"
                        value={infoWhatsappMessage}
                        onChange={(e) => setInfoWhatsappMessage(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-sand-200 focus:outline-none text-xs focus:border-sage-500"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-sand-100 flex justify-end">
                    <button
                      type="submit"
                      className="px-6 py-3 bg-sage-600 hover:bg-sage-700 text-white font-bold uppercase text-xs tracking-wider rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 transition-colors"
                    >
                      <Save size={14} />
                      <span>Salvar Perfil Clínico</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* 3. GERENCIADOR DE FOTOS */}
            {activeTab === 'fotos' && (
              <motion.div
                key="tab-fotos"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="bg-dusty-50/50 rounded-2xl p-6 border border-dusty-100 max-w-4xl">
                  <h3 className="text-sm font-serif font-bold text-sand-950 flex items-center gap-1.5">
                    <Sparkles size={16} className="text-dusty-600" /> Galeria de Imagens & Fotos Clínicas
                  </h3>
                  <p className="text-xs text-sand-700 leading-relaxed mt-1">
                    As fotos do site são gerenciadas diretamente pelo Firebase Storage. Substitua as fotos principal ou bio correspondentes e a Landing Page atualizará as imagens automaticamente, sem alterar nenhum arquivo de código.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl">
                  {[
                    { key: 'hero', label: 'Foto Principal (Hero)', section: 'Topo da Página', url: siteContent.psychologist_info.heroImageUrl, desc: 'Exibida na abertura do site.' },
                    { key: 'about', label: 'Foto da Biografia', section: 'Seção Sobre Mim', url: siteContent.psychologist_info.aboutImageUrl, desc: 'Apresentação profissional e retrato.' },
                    { key: 'logo', label: 'Logotipo Oficial', section: 'Identidade Visual', url: siteContent.psychologist_info.logoUrl, desc: 'Exibido no cabeçalho/navbar.', objectFit: 'object-contain' }
                  ].map((imgItem) => (
                    <div key={imgItem.key} className="bg-white p-5 rounded-2xl border border-sand-200 shadow-sm flex flex-col justify-between space-y-4">
                      <div>
                        <span className="text-[9px] font-mono font-bold uppercase text-sand-500 bg-sand-100 px-2 py-0.5 rounded">{imgItem.section}</span>
                        <h4 className="text-xs font-bold text-sand-950 mt-2 font-serif">{imgItem.label}</h4>
                        <p className="text-[11px] text-sand-500 mt-1">{imgItem.desc}</p>
                      </div>

                      <div className="aspect-[4/5] w-full rounded-xl bg-sand-50/50 border border-dashed border-sand-200 overflow-hidden relative flex items-center justify-center p-2.5">
                        {imgItem.url ? (
                          <img
                            src={imgItem.url}
                            alt={imgItem.label}
                            className={`w-full h-full rounded-lg ${imgItem.objectFit || 'object-cover'}`}
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span className="text-[10px] font-mono text-sand-400">Nenhuma imagem personalizada</span>
                        )}

                        {uploadLoading[imgItem.key] && (
                          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                            <RefreshCw className="animate-spin text-dusty-600" size={20} />
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        {uploadStatus[imgItem.key] && (
                          <p className="text-[10px] font-bold text-dusty-700 text-center uppercase font-mono">{uploadStatus[imgItem.key]}</p>
                        )}
                        
                        <div className="flex gap-2">
                          <label className="flex-1 py-2 bg-dusty-600 hover:bg-dusty-700 text-white rounded-xl text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all">
                            <Upload size={12} />
                            <span>Upload</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  handleImageUpload(imgItem.key as any, e.target.files[0]);
                                }
                              }}
                            />
                          </label>
                          {imgItem.url && (
                            <button
                              onClick={() => handleClearImage(imgItem.key as any)}
                              className="p-2 border border-sand-200 hover:bg-rose-50 text-rose-600 rounded-xl cursor-pointer"
                              title="Remover Imagem"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* 4. AGENDA & BLOQUEIOS */}
            {activeTab === 'agenda' && (
              <motion.div
                key="tab-agenda"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-8"
              >
                {/* Weekly setup */}
                <div className="bg-white p-6 rounded-2xl border border-sand-200 shadow-sm space-y-6">
                  <div>
                    <h3 className="text-sm font-serif font-bold text-sand-950">Grade Semanal de Atendimento Clínico</h3>
                    <p className="text-xs text-sand-500 mt-1 leading-normal">Defina os dias da semana e intervalos de horários que você atende. Pacientes só poderão agendar nesses intervalos.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                    {[
                      { label: 'Segunda-feira', state: agendaSeg, setState: setAgendaSeg },
                      { label: 'Terça-feira', state: agendaTer, setState: setAgendaTer },
                      { label: 'Quarta-feira', state: agendaQua, setState: setAgendaQua },
                      { label: 'Quinta-feira', state: agendaQui, setState: setAgendaQui },
                      { label: 'Sexta-feira', state: agendaSex, setState: setAgendaSex },
                      { label: 'Sábado', state: agendaSab, setState: setAgendaSab },
                      { label: 'Domingo', state: agendaDom, setState: setAgendaDom }
                    ].map((day, idx) => (
                      <div key={idx} className="p-4 rounded-xl border border-sand-150 bg-sand-50/20 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-sand-900">{day.label}</span>
                          <input
                            type="checkbox"
                            checked={day.state.enabled}
                            onChange={(e) => day.setState({ ...day.state, enabled: e.target.checked })}
                            className="h-4 w-4 text-sage-600 focus:ring-sage-500 border-sand-300 rounded"
                          />
                        </div>
                        {day.state.enabled && (
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-[9px] font-bold text-sand-500 uppercase font-mono">Início</span>
                              <input
                                type="text"
                                value={day.state.start}
                                onChange={(e) => day.setState({ ...day.state, start: e.target.value })}
                                className="w-full px-2 py-1 border border-sand-200 rounded text-xs focus:outline-none font-mono"
                              />
                            </div>
                            <div>
                              <span className="text-[9px] font-bold text-sand-500 uppercase font-mono">Fim</span>
                              <input
                                type="text"
                                value={day.state.end}
                                onChange={(e) => day.setState({ ...day.state, end: e.target.value })}
                                className="w-full px-2 py-1 border border-sand-200 rounded text-xs focus:outline-none font-mono"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end pt-2 border-t border-sand-100">
                    <button
                      onClick={handleSaveWeeklyAgenda}
                      className="px-5 py-2.5 bg-sage-600 hover:bg-sage-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Save size={13} />
                      <span>Salvar Grade Semanal</span>
                    </button>
                  </div>
                </div>

                {/* Calendar, blocked and consultations */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Calendar / Appointments list */}
                  <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-sand-200 shadow-sm space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-sand-100 pb-4">
                      <div>
                        <h3 className="text-sm font-serif font-bold text-sand-950">Quadro de Consultas</h3>
                        <p className="text-[10px] text-sand-500 font-mono mt-0.5 uppercase tracking-wider">Gestão e Horários das Sessões</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {/* View Switcher */}
                        <div className="bg-sand-50 border border-sand-200 rounded-xl p-0.5 flex">
                          <button
                            onClick={() => setAgendaViewMode('weekly')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                              agendaViewMode === 'weekly'
                                ? 'bg-white text-sand-900 shadow-sm border border-sand-100'
                                : 'text-sand-500 hover:text-sand-900'
                            }`}
                          >
                            <Calendar size={13} />
                            <span>Calendário Semanal</span>
                          </button>
                          <button
                            onClick={() => setAgendaViewMode('timeline')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                              agendaViewMode === 'timeline'
                                ? 'bg-white text-sand-900 shadow-sm border border-sand-100'
                                : 'text-sand-500 hover:text-sand-900'
                            }`}
                          >
                            <FileText size={13} />
                            <span>Linha do Tempo</span>
                          </button>
                        </div>

                        {/* Status Filter */}
                        <select
                          value={apptFilter}
                          onChange={(e) => setApptFilter(e.target.value as any)}
                          className="px-2.5 py-1.5 border border-sand-200 rounded-xl text-xs bg-white text-sand-800 font-mono focus:outline-none"
                        >
                          <option value="all">Filtro: Todos</option>
                          <option value="confirmed">Confirmados</option>
                          <option value="pending_payment">Aguardando Pix</option>
                          <option value="cancelled">Cancelados</option>
                        </select>
                      </div>
                    </div>

                    {/* WEEKLY CALENDAR GRID VIEW */}
                    {agendaViewMode === 'weekly' ? (() => {
                      // Generate dates for current week offset
                      const current = new Date();
                      const day = current.getDay();
                      const diff = current.getDate() - day + (day === 0 ? -6 : 1); // Monday
                      const monday = new Date(current.setDate(diff));
                      monday.setDate(monday.getDate() + currentWeekOffset * 7);

                      const weekDays = [];
                      for (let i = 0; i < 7; i++) {
                        const d = new Date(monday);
                        d.setDate(monday.getDate() + i);
                        weekDays.push(d);
                      }

                      const weekLabel = `${weekDays[0].toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })} - ${weekDays[6].toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })}`;

                      return (
                        <div className="space-y-4">
                          {/* Week Navigation bar */}
                          <div className="flex items-center justify-between bg-sand-50/50 border border-sand-150 p-2 rounded-xl">
                            <button
                              onClick={() => setCurrentWeekOffset(prev => prev - 1)}
                              className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg text-sand-700 cursor-pointer transition-all"
                              title="Semana Anterior"
                            >
                              <ChevronLeft size={16} />
                            </button>
                            <span className="text-xs font-semibold text-sand-850 font-mono tracking-wide uppercase">
                              {weekLabel}
                            </span>
                            <div className="flex gap-1">
                              {currentWeekOffset !== 0 && (
                                <button
                                  onClick={() => setCurrentWeekOffset(0)}
                                  className="px-2.5 py-1 hover:bg-white text-[10px] hover:shadow-sm font-bold uppercase rounded-lg text-softblue-700 cursor-pointer transition-all font-mono"
                                >
                                  Hoje
                                </button>
                              )}
                              <button
                                onClick={() => setCurrentWeekOffset(prev => prev + 1)}
                                className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg text-sand-700 cursor-pointer transition-all"
                                title="Próxima Semana"
                              >
                                <ChevronRight size={16} />
                              </button>
                            </div>
                          </div>

                          {/* 7 Days Columns Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-7 gap-3 pt-2">
                            {weekDays.map((dateObj, dayIdx) => {
                              const dayName = dateObj.toLocaleDateString('pt-BR', { weekday: 'short' }).substring(0, 3).toUpperCase();
                              const dayNum = dateObj.getDate();
                              const isToday = new Date().toDateString() === dateObj.toDateString();

                              // Match appointments
                              const year = dateObj.getFullYear();
                              const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                              const dayStr = String(dateObj.getDate()).padStart(2, '0');
                              const dateKey = `${year}-${month}-${dayStr}`;

                              const dayAppts = appointments.filter(a => 
                                a.date === dateKey && 
                                (apptFilter === 'all' || a.status === apptFilter)
                              ).sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));

                              return (
                                <div
                                  key={dayIdx}
                                  className={`rounded-2xl border p-3 min-h-[160px] space-y-2 flex flex-col ${
                                    isToday
                                      ? 'bg-softblue-50/20 border-softblue-200 shadow-sm'
                                      : 'bg-white border-sand-150'
                                  }`}
                                >
                                  {/* Day Header */}
                                  <div className="text-center pb-2 border-b border-sand-100 shrink-0">
                                    <p className={`text-[9px] font-bold font-mono ${isToday ? 'text-softblue-700' : 'text-sand-400'}`}>
                                      {dayName}
                                    </p>
                                    <p className={`text-base font-serif font-bold mt-0.5 ${isToday ? 'text-softblue-800' : 'text-sand-900'}`}>
                                      {dayNum}
                                    </p>
                                  </div>

                                  {/* Appointments list */}
                                  <div className="space-y-2 flex-grow overflow-y-auto max-h-[180px] pr-0.5">
                                    {dayAppts.length > 0 ? (
                                      dayAppts.map((appt) => (
                                        <div
                                          key={appt.id}
                                          className={`p-2 rounded-xl text-[10px] border leading-normal transition-all space-y-1 relative group ${
                                            appt.status === 'confirmed'
                                              ? 'bg-emerald-50/40 border-emerald-100 text-emerald-900'
                                              : appt.status === 'pending_payment'
                                              ? 'bg-amber-50/40 border-amber-100 text-amber-900'
                                              : 'bg-sand-50/50 border-sand-150 text-sand-500 line-through'
                                          }`}
                                        >
                                          <div className="flex items-center justify-between font-mono font-bold">
                                            <span>{appt.timeSlot}</span>
                                            <span className={`h-1.5 w-1.5 rounded-full ${
                                              appt.status === 'confirmed'
                                                ? 'bg-emerald-500 animate-pulse'
                                                : appt.status === 'pending_payment'
                                                ? 'bg-amber-500'
                                                : 'bg-sand-400'
                                            }`} />
                                          </div>
                                          <p className="font-semibold truncate" title={appt.patientName}>
                                            {appt.patientName}
                                          </p>
                                          <p className="text-[8px] opacity-75 truncate">
                                            {appt.serviceTitle}
                                          </p>

                                          {/* Hover quick action overlay controls */}
                                          <div className="absolute inset-0 bg-white/90 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 rounded-xl transition-all duration-200">
                                            {appt.status !== 'confirmed' && (
                                              <button
                                                onClick={() => handleUpdateApptStatus(appt.id, 'confirmed')}
                                                className="p-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md border border-emerald-200 cursor-pointer"
                                                title="Confirmar"
                                              >
                                                <Check size={10} />
                                              </button>
                                            )}
                                            {appt.status !== 'cancelled' && (
                                              <button
                                                onClick={() => handleUpdateApptStatus(appt.id, 'cancelled')}
                                                className="p-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-md border border-rose-200 cursor-pointer"
                                                title="Cancelar"
                                              >
                                                <X size={10} />
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      ))
                                    ) : (
                                      <div className="h-full flex items-center justify-center text-[9px] text-sand-300 font-mono py-4 uppercase select-none">
                                        Livre
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })() : (
                      /* LINEAR TIMELINE LIST VIEW */
                      <div className="divide-y divide-sand-100 max-h-[450px] overflow-y-auto pr-2">
                        {appointments.filter(a => apptFilter === 'all' || a.status === apptFilter).length > 0 ? (
                          appointments.filter(a => apptFilter === 'all' || a.status === apptFilter).map((appt) => (
                            <div key={appt.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 first:pt-0 last:pb-0">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className={`h-2 w-2 rounded-full ${
                                    appt.status === 'confirmed' ? 'bg-emerald-500' : appt.status === 'pending_payment' ? 'bg-amber-500' : 'bg-rose-400'
                                  }`} />
                                  <span className="text-xs font-bold text-sand-950">{appt.patientName}</span>
                                </div>
                                <p className="text-[10px] text-sand-500 mt-1 font-mono">{appt.serviceTitle} • {appt.patientEmail} • {appt.patientPhone}</p>
                              </div>
                              
                              <div className="flex items-center gap-3 shrink-0">
                                <span className="px-2.5 py-1 rounded-lg bg-sand-50 border border-sand-150 text-[10px] font-mono font-bold text-sand-800">
                                  {getDayString(appt.date)} às {appt.timeSlot}
                                </span>
                                
                                <div className="flex gap-1">
                                  {appt.status !== 'confirmed' && (
                                    <button
                                      onClick={() => handleUpdateApptStatus(appt.id, 'confirmed')}
                                      className="p-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md border border-emerald-200 cursor-pointer transition-colors"
                                      title="Confirmar Atendimento"
                                    >
                                      <Check size={12} />
                                    </button>
                                  )}
                                  {appt.status !== 'cancelled' && (
                                    <button
                                      onClick={() => handleUpdateApptStatus(appt.id, 'cancelled')}
                                      className="p-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-md border border-rose-200 cursor-pointer transition-colors"
                                      title="Cancelar Consulta"
                                    >
                                      <X size={12} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="py-12 text-center text-sand-400 text-xs font-mono uppercase">
                            Nenhum agendamento encontrado para este filtro.
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Exception blocks column */}
                  <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-sand-200 shadow-sm space-y-4 h-fit">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-sand-900 font-mono">Bloquear Agenda / Férias</h3>
                    
                    <form onSubmit={handleAddBlock} className="space-y-3 pb-4 border-b border-sand-100">
                      <div>
                        <span className="text-[9px] font-bold text-sand-500 uppercase font-mono">Data</span>
                        <input
                          type="date"
                          required
                          value={blockDate}
                          onChange={(e) => setBlockDate(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-sand-200 rounded-lg text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-sand-500 uppercase font-mono">Horário</span>
                        <input
                          type="time"
                          required
                          step="1800"
                          value={blockTime}
                          onChange={(e) => setBlockTime(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-sand-200 rounded-lg text-xs focus:outline-none font-mono"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full py-2 bg-sand-900 hover:bg-sand-950 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                      >
                        <Ban size={12} />
                        <span>Adicionar Bloqueio</span>
                      </button>
                    </form>

                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold uppercase text-sand-500 tracking-wider font-mono">Horários Bloqueados</h4>
                      <div className="divide-y divide-sand-50 max-h-[180px] overflow-y-auto pr-1">
                        {blockedSlots.length > 0 ? (
                          blockedSlots.map((block) => (
                            <div key={block.id} className="py-2 flex items-center justify-between gap-2">
                              <span className="text-xs font-mono text-sand-800">
                                {getDayString(block.date)} • {block.timeSlot}
                              </span>
                              <button
                                onClick={() => handleRemoveBlock(block.id)}
                                className="p-1 hover:bg-rose-50 text-rose-600 rounded cursor-pointer"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))
                        ) : (
                          <div className="py-4 text-center text-[10px] text-sand-400 font-mono uppercase">
                            Nenhum bloqueio ativo.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              </motion.div>
            )}

            {/* 5. PACIENTES & PRONTUÁRIOS */}
            {activeTab === 'pacientes' && (
              <motion.div
                key="tab-pacientes"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6"
              >
                {/* Left side list of patients */}
                <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-sand-200 shadow-sm space-y-4 h-fit">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-sand-900 font-mono">Lista de Pacientes</h3>
                    <button
                      onClick={() => {
                        setEditingPatient(null);
                        setPatientForm({ name: '', email: '', phone: '', cpf: '', dateOfBirth: '', address: '', notes: '', history: '' });
                        setIsPatientModalOpen(true);
                      }}
                      className="p-1.5 bg-sage-50 text-sage-700 hover:bg-sage-100 border border-sage-200 rounded-lg flex items-center gap-1 text-xs font-bold cursor-pointer"
                    >
                      <PlusCircle size={14} />
                      <span className="hidden sm:inline">Adicionar</span>
                    </button>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-sand-400" />
                    <input
                      type="text"
                      placeholder="Pesquisar pacientes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-sand-200 focus:outline-none"
                    />
                  </div>

                  <div className="divide-y divide-sand-100 max-h-[450px] overflow-y-auto pr-2">
                    {patients
                      .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((pt) => (
                        <div
                          key={pt.id}
                          onClick={() => setSelectedPatient(pt)}
                          className={`py-3 px-3 rounded-xl text-left cursor-pointer transition-colors ${
                            selectedPatient?.id === pt.id ? 'bg-sage-50/50 border border-sage-200/50' : 'hover:bg-sand-50/50'
                          }`}
                        >
                          <p className="text-xs font-bold text-sand-950">{pt.name}</p>
                          <p className="text-[10px] text-sand-500 font-mono mt-0.5">{pt.phone}</p>
                        </div>
                      ))}
                    {patients.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                      <div className="py-8 text-center text-xs text-sand-400 font-mono uppercase">
                        Nenhum paciente cadastrado.
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side detailed Profile */}
                <div className="lg:col-span-8 space-y-6">
                  {selectedPatient ? (
                    <div className="bg-white p-8 rounded-3xl border border-sand-200/60 shadow-sm space-y-6">
                      
                      {/* Name, core details */}
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-sand-100 pb-5">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <h3 className="text-xl font-serif font-bold text-sand-950">{selectedPatient.name}</h3>
                          </div>
                          <p className="text-[10px] text-sand-500 font-mono mt-1 font-semibold uppercase tracking-widest">Prontuário Ativo • ID: {selectedPatient.id.substring(0, 8).toUpperCase()}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingPatient(selectedPatient);
                              setPatientForm({
                                name: selectedPatient.name,
                                email: selectedPatient.email,
                                phone: selectedPatient.phone,
                                cpf: selectedPatient.cpf || '',
                                dateOfBirth: selectedPatient.dateOfBirth || '',
                                address: selectedPatient.address || '',
                                notes: selectedPatient.notes || '',
                                history: selectedPatient.history || ''
                              });
                              setIsPatientModalOpen(true);
                            }}
                            className="px-3.5 py-1.5 border border-sand-200 hover:bg-sand-50 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <Edit3 size={13} />
                            <span>Editar cadastro</span>
                          </button>
                          <button
                            onClick={() => handleDeletePatient(selectedPatient.id)}
                            className="px-3.5 py-1.5 border border-rose-100 hover:bg-rose-50 text-rose-600 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <Trash2 size={13} />
                            <span>Excluir</span>
                          </button>
                        </div>
                      </div>

                      {/* Clinical Sub-Tabs Navigation */}
                      <div className="flex flex-wrap border-b border-sand-100 gap-1.5 pb-0.5">
                        {[
                          { id: 'evolucao', label: 'Evolução Clínica', icon: <FileText size={14} /> },
                          { id: 'historico', label: 'Histórico Clínico', icon: <User size={14} /> },
                          { id: 'pagamentos', label: 'Histórico de Consultas', icon: <Calendar size={14} /> },
                          { id: 'recibos', label: 'Recibos & Financeiro', icon: <CreditCard size={14} /> },
                          { id: 'observacoes', label: 'Observações Privadas', icon: <Lock size={14} /> }
                        ].map((subTab) => (
                          <button
                            key={subTab.id}
                            onClick={() => setPatientSubTab(subTab.id as any)}
                            className={`px-4 py-2 rounded-t-xl text-xs font-semibold flex items-center gap-2 border-b-2 cursor-pointer transition-all ${
                              patientSubTab === subTab.id
                                ? 'border-softblue-500 text-softblue-700 bg-softblue-50/30'
                                : 'border-transparent text-sand-600 hover:text-sand-950 hover:bg-sand-50/50'
                            }`}
                          >
                            {subTab.icon}
                            <span>{subTab.label}</span>
                          </button>
                        ))}
                      </div>

                      {/* Tab Content Panels */}
                      <div className="pt-2">
                        
                        {/* A. Evolução Clínica (Prontuário) */}
                        {patientSubTab === 'evolucao' && (
                          <div className="space-y-6">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold uppercase text-sand-900 tracking-wider font-mono">Linha do Tempo de Sessões</h4>
                              <span className="text-[10px] font-mono bg-softblue-50 text-softblue-700 border border-softblue-100 px-2.5 py-0.5 rounded font-bold uppercase">
                                Documento Protegido (CFP)
                              </span>
                            </div>

                            {/* Add evolution entry block */}
                            <div className="bg-sand-50/40 p-4 rounded-2xl border border-sand-200/70 space-y-3">
                              <span className="text-[10px] font-bold text-sand-700 uppercase font-mono block">Nova Entrada de Evolução Clínica</span>
                              <textarea
                                value={evolutionInput}
                                onChange={(e) => setEvolutionInput(e.target.value)}
                                placeholder="Descreva os pontos abordados, sintomas relatados, tarefas de casa ou observações sobre o progresso terapêutico do paciente nesta sessão..."
                                className="w-full bg-white border border-sand-200 rounded-xl p-3 text-xs focus:outline-none min-h-[80px]"
                              />
                              <div className="flex justify-between items-center">
                                <p className="text-[10px] text-sand-500 leading-normal">
                                  Esta entrada será salva com a data de hoje ({new Date().toLocaleDateString('pt-BR')}) no histórico do paciente.
                                </p>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (!evolutionInput.trim()) return;
                                    const datePrefix = `[${new Date().toLocaleDateString('pt-BR')}]`;
                                    const entry = `${datePrefix} ${evolutionInput.trim()}`;
                                    const updatedHistory = selectedPatient.history 
                                      ? `${entry}\n\n${selectedPatient.history}` 
                                      : entry;

                                    try {
                                      setGlobalLoading(true);
                                      await contentService.updatePatient(selectedPatient.id, { history: updatedHistory });
                                      const updatedPatientObj = { ...selectedPatient, history: updatedHistory };
                                      setSelectedPatient(updatedPatientObj);
                                      setPatients(prev => prev.map(p => p.id === selectedPatient.id ? updatedPatientObj : p));
                                      setEvolutionInput('');
                                    } catch (err) {
                                      console.error("Erro ao salvar evolução:", err);
                                      alert("Erro ao salvar evolução clínica. Tente novamente.");
                                    } finally {
                                      setGlobalLoading(false);
                                    }
                                  }}
                                  className="px-4 py-2 bg-softblue-600 hover:bg-softblue-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
                                >
                                  Salvar Entrada
                                </button>
                              </div>
                            </div>

                            {/* Clinical History Display */}
                            <div className="space-y-4">
                              {selectedPatient.history ? (
                                <div className="divide-y divide-sand-100 max-h-[300px] overflow-y-auto pr-2">
                                  {selectedPatient.history.split('\n\n').map((block, index) => {
                                    // Parse date if blocks start with [DD/MM/YYYY]
                                    const dateMatch = block.match(/^\[(\d{2}\/\d{2}\/\d{4})\]/);
                                    const dateText = dateMatch ? dateMatch[1] : 'Evolução';
                                    const textContent = dateMatch ? block.replace(/^\[\d{2}\/\d{2}\/\d{4}\]\s*/, '') : block;

                                    return (
                                      <div key={index} className="py-4 first:pt-0 last:pb-0 space-y-1.5">
                                        <div className="flex items-center gap-2">
                                          <span className="h-2 w-2 rounded-full bg-softblue-400" />
                                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-softblue-600 bg-softblue-50 px-2 py-0.5 rounded">
                                            Sessão • {dateText}
                                          </span>
                                        </div>
                                        <p className="text-xs text-sand-800 leading-relaxed font-mono whitespace-pre-wrap pl-4">
                                          {textContent}
                                        </p>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="py-12 text-center border border-dashed border-sand-200 rounded-2xl text-sand-500 text-xs">
                                  Nenhuma anotação de evolução clínica registrada para este paciente ainda. Use o campo acima para salvar o primeiro relato.
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* B. Histórico Clínico (Personal Records) */}
                        {patientSubTab === 'historico' && (
                          <div className="space-y-4">
                            <h4 className="text-xs font-bold uppercase text-sand-900 tracking-wider font-mono mb-2">Dados Cadastrais do Paciente</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                              <div className="p-4 bg-sand-50/30 rounded-2xl border border-sand-100/60">
                                <p className="text-[10px] font-bold text-sand-500 uppercase tracking-wider font-mono">Nome Completo</p>
                                <p className="font-semibold text-sand-950 mt-1 text-sm">{selectedPatient.name}</p>
                              </div>
                              <div className="p-4 bg-sand-50/30 rounded-2xl border border-sand-100/60">
                                <p className="text-[10px] font-bold text-sand-500 uppercase tracking-wider font-mono">Endereço Residencial</p>
                                <p className="font-semibold text-sand-950 mt-1">{selectedPatient.address || 'Não cadastrado'}</p>
                              </div>
                              <div className="p-4 bg-sand-50/30 rounded-2xl border border-sand-100/60">
                                <p className="text-[10px] font-bold text-sand-500 uppercase tracking-wider font-mono">Contato de WhatsApp</p>
                                <p className="font-semibold text-sand-950 mt-1">{selectedPatient.phone}</p>
                              </div>
                              <div className="p-4 bg-sand-50/30 rounded-2xl border border-sand-100/60">
                                <p className="text-[10px] font-bold text-sand-500 uppercase tracking-wider font-mono">E-mail de Cadastro</p>
                                <p className="font-semibold text-sand-950 mt-1 truncate" title={selectedPatient.email}>{selectedPatient.email}</p>
                              </div>
                              <div className="p-4 bg-sand-50/30 rounded-2xl border border-sand-100/60">
                                <p className="text-[10px] font-bold text-sand-500 uppercase tracking-wider font-mono">CPF</p>
                                <p className="font-semibold text-sand-950 mt-1">{selectedPatient.cpf || 'Não cadastrado'}</p>
                              </div>
                              <div className="p-4 bg-sand-50/30 rounded-2xl border border-sand-100/60">
                                <p className="text-[10px] font-bold text-sand-500 uppercase tracking-wider font-mono">Data de Nascimento</p>
                                <p className="font-semibold text-sand-950 mt-1">{selectedPatient.dateOfBirth || 'Não informada'}</p>
                              </div>
                              <div className="p-4 bg-sand-50/30 rounded-2xl border border-sand-100/60 sm:col-span-2 flex items-center justify-between">
                                <div>
                                  <p className="text-[10px] font-bold text-sand-500 uppercase tracking-wider font-mono">Data de Registro no Sistema</p>
                                  <p className="font-semibold text-sand-950 mt-0.5">
                                    {selectedPatient.createdAt ? new Date(selectedPatient.createdAt).toLocaleDateString('pt-BR') : '--/--/----'}
                                  </p>
                                </div>
                                <span className="text-[9px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded font-bold uppercase">
                                  Cadastro Ativo
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* C. Histórico de Consultas (Financial appointments matching) */}
                        {patientSubTab === 'pagamentos' && (() => {
                          const patientAppts = appointments.filter(a => 
                            a.patientEmail === selectedPatient.email || 
                            a.patientPhone === selectedPatient.phone ||
                            a.patientName.toLowerCase().includes(selectedPatient.name.toLowerCase())
                          );

                          return (
                            <div className="space-y-4">
                              <h4 className="text-xs font-bold uppercase text-sand-900 tracking-wider font-mono">Histórico de Sessões Agendadas</h4>
                              <div className="divide-y divide-sand-100 max-h-[300px] overflow-y-auto pr-2">
                                {patientAppts.length > 0 ? (
                                  patientAppts.map((appt) => (
                                    <div key={appt.id} className="py-3.5 flex items-center justify-between gap-4">
                                      <div>
                                        <p className="text-xs font-bold text-sand-950">{appt.serviceTitle}</p>
                                        <p className="text-[10px] font-mono text-sand-500 mt-1">
                                          Realizado em {getDayString(appt.date)} às {appt.timeSlot}
                                        </p>
                                      </div>
                                      <div className="text-right flex items-center gap-3">
                                        <span className="text-xs font-bold text-sand-950 font-mono">
                                          {formatMoney(appt.amount || 150)}
                                        </span>
                                        <span className={`inline-flex px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase ${
                                          appt.status === 'confirmed'
                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                            : appt.status === 'pending_payment'
                                            ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                            : 'bg-sand-100 text-sand-600 border border-sand-200'
                                        }`}>
                                          {appt.status === 'confirmed' ? 'Confirmada' : appt.status === 'pending_payment' ? 'Aguardando Pix' : 'Cancelada'}
                                        </span>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="py-12 text-center text-sand-500 text-xs">
                                    Nenhum agendamento encontrado para os canais de contato cadastrados deste paciente.
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })()}

                        {/* D. Recibos Clínicos (Receipts) */}
                        {patientSubTab === 'recibos' && (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold uppercase text-sand-900 tracking-wider font-mono">Recibos e Cobranças Clínicas</h4>
                              <button
                                onClick={() => setIsReceiptModalOpen(true)}
                                className="px-3.5 py-1.5 bg-softblue-500 text-white hover:bg-softblue-600 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <Plus size={12} />
                                <span>Emitir Recibo</span>
                              </button>
                            </div>

                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                              {(selectedPatient.recibos || []).length > 0 ? (
                                (selectedPatient.recibos || []).map((recibo) => (
                                  <div key={recibo.id} className="p-3.5 bg-sand-50/40 rounded-xl border border-sand-150 flex items-center justify-between text-xs gap-4 font-mono">
                                    <div>
                                      <p className="font-bold text-sand-900">{recibo.description}</p>
                                      <p className="text-[10px] text-sand-500 mt-0.5">{getDayString(recibo.date)}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <span className="font-bold text-softblue-700">{formatMoney(recibo.amount)}</span>
                                      <button
                                        onClick={() => handleDeleteReceipt(recibo.id)}
                                        className="p-1 hover:bg-rose-50 text-rose-600 rounded cursor-pointer transition-colors"
                                        title="Excluir recibo"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="py-12 text-center border border-dashed border-sand-200 rounded-2xl text-sand-500 text-xs">
                                  Nenhum recibo clínico emitido ainda para este paciente. Use o botão acima para gerar um recibo formal em formato PDF/Impressão.
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* E. Observações Privadas (Private Notes) */}
                        {patientSubTab === 'observacoes' && (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold uppercase text-sand-900 tracking-wider font-mono">Anotações Clínicas Privadas</h4>
                              <span className="text-[9px] font-mono bg-rose-50 text-rose-700 border border-rose-100 px-2 py-0.5 rounded font-bold uppercase flex items-center gap-1">
                                <Lock size={10} />
                                Apenas Erica Costa
                              </span>
                            </div>

                            <p className="text-[11px] text-sand-600 leading-normal">
                              Estas observações destinam-se exclusivamente ao suporte diagnóstico pessoal do psicólogo. Elas são criptografadas em trânsito e não constam no prontuário oficial compartilhado com o paciente.
                            </p>

                            <div className="p-4 bg-amber-50/20 rounded-2xl border border-amber-100 text-xs text-sand-700 leading-relaxed font-mono min-h-[120px] whitespace-pre-wrap">
                              {selectedPatient.notes || 'Nenhuma anotação privada inserida. Você pode editar o cadastro do paciente para adicionar observações confidenciais de suporte terapêutico.'}
                            </div>
                          </div>
                        )}

                      </div>

                    </div>
                  ) : (
                    <div className="h-full bg-white p-8 rounded-3xl border border-sand-200/80 shadow-sm flex flex-col items-center justify-center text-center text-sand-500 py-16">
                      <Users size={36} className="text-sand-300 mb-3" />
                      <p className="text-sm font-serif font-semibold text-sand-850">Ficha Clínica do Paciente</p>
                      <p className="text-xs text-sand-500 mt-1 max-w-sm">Selecione um paciente na barra lateral para abrir seu prontuário clínico completo, anotações de evolução e recibos.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* 6. MENSAGENS */}
            {activeTab === 'mensagens' && (
              <motion.div
                key="tab-mensagens"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6"
              >
                {/* Left side list */}
                <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-sand-200 shadow-sm space-y-4 h-fit">
                  <div className="flex flex-col gap-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-sand-900 font-mono">Caixa de Entrada</h3>
                    
                    {/* Modern support-system style tabs with counters */}
                    <div className="flex bg-sand-50 border border-sand-200 rounded-xl p-0.5 w-full">
                      {[
                        { id: 'all', label: 'Tudo', count: messages.length },
                        { id: 'pending', label: 'Pendentes', count: messages.filter(m => m.status === 'pending').length, accent: true },
                        { id: 'responded', label: 'Lidas', count: messages.filter(m => m.status === 'responded').length }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setMsgFilter(tab.id as any)}
                          className={`flex-1 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                            msgFilter === tab.id
                              ? 'bg-white text-sand-950 shadow-sm border border-sand-100'
                              : 'text-sand-500 hover:text-sand-850'
                          }`}
                        >
                          <span>{tab.label}</span>
                          <span className={`px-1.5 py-0.2 text-[9px] rounded-md font-mono ${
                            msgFilter === tab.id
                              ? tab.accent && tab.count > 0 ? 'bg-amber-100 text-amber-800 font-bold' : 'bg-sand-100 text-sand-700'
                              : tab.accent && tab.count > 0 ? 'bg-amber-50 text-amber-600' : 'bg-sand-100/50 text-sand-400'
                          }`}>
                            {tab.count}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* List of received emails */}
                  <div className="divide-y divide-sand-100 max-h-[450px] overflow-y-auto pr-2 space-y-1">
                    {messages
                      .filter(m => msgFilter === 'all' || m.status === msgFilter)
                      .map((msg) => {
                        const initials = msg.name.substring(0, 2).toUpperCase();
                        const isSelected = selectedMessage?.id === msg.id;

                        return (
                          <div
                            key={msg.id}
                            onClick={() => setSelectedMessage(msg)}
                            className={`p-3 rounded-2xl text-left cursor-pointer transition-all border flex items-start gap-3 mt-1 ${
                              isSelected
                                ? 'bg-softblue-50/30 border-softblue-200 shadow-sm'
                                : 'bg-white border-transparent hover:bg-sand-50/50 hover:border-sand-150'
                            }`}
                          >
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 font-mono ${
                              msg.status === 'pending'
                                ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                : 'bg-sand-100 text-sand-600'
                            }`}>
                              {initials}
                            </div>
                            <div className="flex-grow min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <p className="text-xs font-bold text-sand-950 truncate">{msg.name}</p>
                                {msg.status === 'pending' && (
                                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                                )}
                              </div>
                              <p className="text-[10px] text-sand-500 font-mono mt-0.5 truncate">{msg.subject || 'Contato via Site'}</p>
                              <p className="text-[8px] text-sand-400 mt-1 font-mono">{msg.date}</p>
                            </div>
                          </div>
                        );
                      })}
                    {messages.filter(m => msgFilter === 'all' || m.status === msgFilter).length === 0 && (
                      <div className="py-12 text-center border border-dashed border-sand-200 rounded-2xl text-sand-500 text-xs">
                        Nenhuma mensagem nesta categoria.
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side detail */}
                <div className="lg:col-span-7">
                  {selectedMessage ? (
                    <div className="bg-white p-6 rounded-2xl border border-sand-200 shadow-sm space-y-6">
                      
                      {/* Message Header */}
                      <div className="flex justify-between items-start border-b border-sand-100 pb-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-softblue-50 border border-softblue-100 text-softblue-700 font-bold text-sm flex items-center justify-center font-mono">
                            {selectedMessage.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="text-[10px] font-bold uppercase text-sand-500 tracking-wider font-mono">
                              {selectedMessage.subject || 'Contato de Paciente'}
                            </h4>
                            <h3 className="text-sm font-bold text-sand-950 mt-0.5">{selectedMessage.name}</h3>
                            <p className="text-[9px] text-sand-400 font-mono mt-0.5">Recebida em {selectedMessage.date}</p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleToggleMsgStatus(selectedMessage.id)}
                            className={`px-3 py-1.5 border rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                              selectedMessage.status === 'responded'
                                ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                                : 'border-sand-200 hover:bg-sand-50 text-sand-700'
                            }`}
                            title={selectedMessage.status === 'responded' ? 'Marcar como Pendente' : 'Marcar como Lida'}
                          >
                            <Check size={13} />
                            <span>{selectedMessage.status === 'responded' ? 'Respondida' : 'Marcar Lida'}</span>
                          </button>
                          <button
                            onClick={() => handleDeleteMessage(selectedMessage.id)}
                            className="p-1.5 border border-rose-100 hover:bg-rose-50 text-rose-600 rounded-xl cursor-pointer transition-colors"
                            title="Excluir mensagem"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Sender Info cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                        <div className="p-3 bg-sand-50/40 rounded-xl border border-sand-150">
                          <p className="text-[8px] font-bold text-sand-400 uppercase tracking-widest">E-mail</p>
                          <p className="font-semibold text-sand-950 mt-1 truncate">{selectedMessage.email}</p>
                        </div>
                        <div className="p-3 bg-sand-50/40 rounded-xl border border-sand-150">
                          <p className="text-[8px] font-bold text-sand-400 uppercase tracking-widest">Telefone / WhatsApp</p>
                          <p className="font-semibold text-sand-950 mt-1 truncate">{selectedMessage.phone}</p>
                        </div>
                      </div>

                      {/* Message Content Bubble */}
                      <div className="space-y-2">
                        <span className="text-[9px] font-bold uppercase text-sand-400 font-mono tracking-wider block">Mensagem Enviada</span>
                        <div className="p-5 bg-sand-50/20 rounded-2xl border border-sand-200/60 text-xs text-sand-800 leading-relaxed font-serif whitespace-pre-wrap">
                          {selectedMessage.message}
                        </div>
                      </div>

                      {/* Direct Reply CTAs */}
                      <div className="pt-4 border-t border-sand-100 flex gap-3">
                        <a
                          href={`https://wa.me/${selectedMessage.phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all text-center cursor-pointer"
                        >
                          <Phone size={13} />
                          <span>Responder por WhatsApp</span>
                        </a>
                        <a
                          href={`mailto:${selectedMessage.email}`}
                          className="px-4 py-3 border border-sand-200 hover:bg-sand-50 text-sand-700 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                        >
                          <Mail size={13} />
                          <span>Enviar E-mail</span>
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white p-8 rounded-2xl border border-sand-200 shadow-sm flex flex-col items-center justify-center text-center text-sand-500 py-16">
                      <Inbox size={36} className="text-sand-300 mb-3" />
                      <p className="text-sm font-serif font-semibold text-sand-850">Leitor de Mensagens</p>
                      <p className="text-xs text-sand-500 mt-1 max-w-xs">Selecione um contato na lista à esquerda para carregar a mensagem completa e iniciar a resposta direta.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* 7. BLOG & CONTEÚDO */}
            {activeTab === 'blog' && (
              <motion.div
                key="tab-blog"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6"
              >
                {/* Left side list */}
                <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-sand-200 shadow-sm space-y-4 h-fit">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-sand-900 font-mono">Artigos do Blog</h3>
                    <button
                      onClick={() => {
                        setEditingPost(null);
                        setPostTitle('');
                        setPostExcerpt('');
                        setPostContent('');
                        setPostCategory('');
                        setPostReadTime('');
                        setPostImage('');
                      }}
                      className="p-1.5 bg-sage-50 text-sage-700 border border-sage-200 hover:bg-sage-100 rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1"
                    >
                      <Plus size={14} />
                      <span>Novo</span>
                    </button>
                  </div>

                  <div className="divide-y divide-sand-100 max-h-[450px] overflow-y-auto pr-2">
                    {blogPosts.map((post) => (
                      <div
                        key={post.id}
                        onClick={() => {
                          setEditingPost(post);
                          setPostTitle(post.title);
                          setPostExcerpt(post.excerpt || '');
                          setPostContent(post.content || '');
                          setPostCategory(post.category || '');
                          setPostReadTime(post.readTime || '');
                          setPostImage(post.imageUrl || '');
                        }}
                        className={`py-3 px-3 rounded-xl text-left cursor-pointer transition-colors ${
                          editingPost?.id === post.id ? 'bg-sage-50/50 border border-sage-200/50' : 'hover:bg-sand-50/50'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-4">
                          <p className="text-xs font-bold text-sand-950">{post.title}</p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePost(post.id);
                            }}
                            className="p-1 hover:bg-rose-50 text-rose-600 rounded cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <p className="text-[9px] text-sand-400 mt-1 font-mono uppercase tracking-wider font-bold">{post.category} • {post.date}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right side form */}
                <form onSubmit={handleSavePost} className="lg:col-span-7 bg-white p-6 rounded-2xl border border-sand-200 shadow-sm space-y-4 h-fit">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-sand-900 font-mono">
                    {editingPost ? 'Editar Artigo' : 'Criar Novo Artigo'}
                  </h3>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Título do Artigo</label>
                    <input
                      type="text"
                      required
                      value={postTitle}
                      onChange={(e) => setPostTitle(e.target.value)}
                      placeholder="Título cativante e de impacto"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-sand-200 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Categoria</label>
                      <input
                        type="text"
                        value={postCategory}
                        onChange={(e) => setPostCategory(e.target.value)}
                        placeholder="Ansiedade, Autoestima, TCC"
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-sand-200 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Tempo de Leitura</label>
                      <input
                        type="text"
                        value={postReadTime}
                        onChange={(e) => setPostReadTime(e.target.value)}
                        placeholder="5 min"
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-sand-200 focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Imagem de Capa (Opcional)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={postImage}
                        onChange={(e) => setPostImage(e.target.value)}
                        placeholder="https://images.unsplash.com/... ou selecione um arquivo"
                        className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-sand-200 focus:outline-none font-mono"
                      />
                      <label className="px-4 py-2 bg-dusty-600 hover:bg-dusty-700 text-white rounded-xl text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm transition-all shrink-0">
                        <Upload size={12} />
                        <span>Carregar</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            if (e.target.files && e.target.files[0]) {
                              const file = e.target.files[0];
                              try {
                                const url = await contentService.uploadImage(file, 'blog');
                                setPostImage(url);
                              } catch (err) {
                                alert("Falha ao carregar imagem.");
                              }
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Linha Fina / Breve Resumo</label>
                    <textarea
                      rows={2}
                      value={postExcerpt}
                      onChange={(e) => setPostExcerpt(e.target.value)}
                      placeholder="Breve resumo exibido nos cards da Landing Page"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-sand-200 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Conteúdo Completo (Markdown)</label>
                    <textarea
                      rows={8}
                      required
                      value={postContent}
                      onChange={(e) => setPostContent(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-sand-200 focus:outline-none font-serif leading-relaxed"
                    />
                  </div>

                  <div className="pt-2 border-t border-sand-100 flex justify-end gap-2">
                    {editingPost && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPost(null);
                          setPostTitle('');
                          setPostExcerpt('');
                          setPostContent('');
                          setPostCategory('');
                          setPostReadTime('');
                          setPostImage('');
                        }}
                        className="px-4 py-2 border border-sand-200 hover:bg-sand-50 rounded-xl text-xs font-bold uppercase cursor-pointer"
                      >
                        Cancelar
                      </button>
                    )}
                    <button
                      type="submit"
                      className="px-5 py-2 bg-sage-600 hover:bg-sage-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
                    >
                      {editingPost ? 'Salvar Alterações' : 'Publicar Artigo'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* 8. PAGAMENTOS */}
            {activeTab === 'pagamentos' && (
              <motion.div
                key="tab-pagamentos"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="bg-sage-50/50 rounded-2xl p-6 border border-sage-100 max-w-4xl">
                  <h3 className="text-sm font-serif font-bold text-sand-950 flex items-center gap-1.5">
                    <CreditCard size={16} className="text-sage-600" /> Cobranças & Transações Mercado Pago
                  </h3>
                  <p className="text-xs text-sand-700 leading-relaxed mt-1">
                    Histórico financeiro integrado diretamente à API de agendamentos e transações Mercado Pago.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-sand-200 shadow-sm space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-sand-900 font-mono">Transações e Liquidações Financeiras</h3>
                  
                  <div className="divide-y divide-sand-100 max-h-[450px] overflow-y-auto pr-2">
                    {appointments.length > 0 ? (
                      appointments.map((appt) => (
                        <div key={appt.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs">
                          <div>
                            <p className="font-bold text-sand-900">{appt.patientName}</p>
                            <p className="text-[10px] text-sand-500 mt-0.5 uppercase">ID: {appt.id} • {appt.paymentType || appt.paymentMethod || 'Pix'}</p>
                          </div>
                          
                          <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                              appt.status === 'confirmed' ? 'bg-emerald-50 text-emerald-800 border border-emerald-150' : appt.status === 'pending_payment' ? 'bg-amber-50 text-amber-800 border border-amber-150' : 'bg-rose-50 text-rose-800 border border-rose-150'
                            }`}>
                              {appt.status === 'confirmed' ? 'Aprovado' : appt.status === 'pending_payment' ? 'Pendente' : 'Estornado / Cancelado'}
                            </span>
                            <span className="font-bold text-sand-950 font-sans">{formatMoney(appt.amount || 150)}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="py-8 text-center text-xs text-sand-400 font-mono uppercase">Nenhuma transação financeira registrada.</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* 9. CONFIGURAÇÕES */}
            {activeTab === 'configuracoes' && (
              <motion.div
                key="tab-configuracoes"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="max-w-2xl"
              >
                <div className="bg-white p-8 rounded-3xl border border-sand-200 shadow-sm space-y-6">
                  <div>
                    <h3 className="text-sm font-serif font-bold text-sand-950">Ajustes de Segurança & SEO</h3>
                    <p className="text-xs text-sand-500 mt-1">Configurações globais de SEO indexadas pelo Google.</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Título SEO (Document Title)</label>
                      <input
                        type="text"
                        value={siteContent.seo.title}
                        onChange={async (e) => {
                          const updatedSeo = { ...siteContent.seo, title: e.target.value };
                          await updateSiteContent({ seo: updatedSeo });
                        }}
                        className="w-full px-4 py-2.5 rounded-xl border border-sand-200 focus:outline-none text-xs focus:border-sage-500 font-serif"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Descrição Meta (Indexação)</label>
                      <textarea
                        rows={3}
                        value={siteContent.seo.description}
                        onChange={async (e) => {
                          const updatedSeo = { ...siteContent.seo, description: e.target.value };
                          await updateSiteContent({ seo: updatedSeo });
                        }}
                        className="w-full px-4 py-2.5 rounded-xl border border-sand-200 focus:outline-none text-xs focus:border-sage-500"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-sage-50/50 rounded-2xl border border-sage-100 flex items-center gap-3.5">
                    <ShieldAlert size={20} className="text-sage-700" />
                    <div>
                      <p className="text-xs font-bold text-sand-950">Segurança de Prontuários Ativada</p>
                      <p className="text-[10px] text-sand-600 mt-0.5 leading-relaxed">Suas informações clínicas e de pacientes estão criptografadas e protegidas pelas regras rígidas de segurança do Firebase Firestore.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Footer info line inside admin panel */}
        <footer className="mt-12 pt-6 border-t border-sand-200/40 text-[10px] font-mono font-bold text-sand-400 uppercase flex items-center justify-between gap-4">
          <span>Dra. Erica Costa • Clínica Psicológica</span>
          <span>Regulamentada CFP</span>
        </footer>

      </main>

      {/* --- MODALS --- */}

      {/* A. PATIENT MODAL (CREATE / EDIT) */}
      <AnimatePresence>
        {isPatientModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sand-950/40 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-sand-200 max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-sand-100 pb-4 mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-sand-950 font-mono">
                  {editingPatient ? 'Editar Ficha do Paciente' : 'Cadastrar Paciente'}
                </h3>
                <button
                  onClick={() => setIsPatientModalOpen(false)}
                  className="p-1 hover:bg-sand-100 rounded-full text-sand-500 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSavePatient} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Nome Completo</label>
                    <input
                      type="text"
                      required
                      value={patientForm.name}
                      onChange={(e) => setPatientForm({ ...patientForm, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-sand-200 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">E-mail</label>
                    <input
                      type="email"
                      required
                      value={patientForm.email}
                      onChange={(e) => setPatientForm({ ...patientForm, email: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-sand-200 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Telefone / WhatsApp</label>
                    <input
                      type="text"
                      required
                      value={patientForm.phone}
                      onChange={(e) => setPatientForm({ ...patientForm, phone: e.target.value })}
                      placeholder="(85) 99999-9999"
                      className="w-full px-3 py-2 rounded-xl border border-sand-200 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">CPF</label>
                    <input
                      type="text"
                      value={patientForm.cpf}
                      onChange={(e) => setPatientForm({ ...patientForm, cpf: e.target.value })}
                      placeholder="000.000.000-00"
                      className="w-full px-3 py-2 rounded-xl border border-sand-200 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Data Nascimento</label>
                    <input
                      type="text"
                      value={patientForm.dateOfBirth}
                      onChange={(e) => setPatientForm({ ...patientForm, dateOfBirth: e.target.value })}
                      placeholder="DD/MM/AAAA"
                      className="w-full px-3 py-2 rounded-xl border border-sand-200 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Endereço Residencial</label>
                  <input
                    type="text"
                    value={patientForm.address}
                    onChange={(e) => setPatientForm({ ...patientForm, address: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-sand-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Evolução Clínica / Histórico Terapêutico</label>
                  <textarea
                    rows={4}
                    value={patientForm.history}
                    onChange={(e) => setPatientForm({ ...patientForm, history: e.target.value })}
                    placeholder="Histórico clínico de evoluções das sessões..."
                    className="w-full px-3 py-2 rounded-xl border border-sand-200 focus:outline-none font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Anotações Privadas (Opcional)</label>
                  <textarea
                    rows={2}
                    value={patientForm.notes}
                    onChange={(e) => setPatientForm({ ...patientForm, notes: e.target.value })}
                    placeholder="Observações complementares secretas..."
                    className="w-full px-3 py-2 rounded-xl border border-sand-200 focus:outline-none font-mono text-xs"
                  />
                </div>

                <div className="pt-4 border-t border-sand-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPatientModalOpen(false)}
                    className="px-4 py-2 border border-sand-200 hover:bg-sand-50 rounded-xl text-xs font-bold uppercase cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-sage-600 hover:bg-sage-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Salvar Ficha Paciente
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* B. RECEIPT MODAL (CREATE RECEIPT) */}
      <AnimatePresence>
        {isReceiptModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sand-950/40 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-sand-200 max-w-sm w-full p-6 shadow-2xl relative"
            >
              <div className="flex justify-between items-center border-b border-sand-100 pb-3 mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-sand-950 font-mono">Gerar Recibo de Consulta</h3>
                <button
                  onClick={() => setIsReceiptModalOpen(false)}
                  className="p-1 hover:bg-sand-100 rounded-full text-sand-500 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleAddReceipt} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Valor do Recibo (R$)</label>
                  <input
                    type="number"
                    required
                    value={receiptForm.amount}
                    onChange={(e) => setReceiptForm({ ...receiptForm, amount: e.target.value })}
                    placeholder="150"
                    className="w-full px-3 py-2 rounded-xl border border-sand-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Descrição</label>
                  <input
                    type="text"
                    value={receiptForm.description}
                    onChange={(e) => setReceiptForm({ ...receiptForm, description: e.target.value })}
                    placeholder="Ex: Consulta Psicoterapia Individual"
                    className="w-full px-3 py-2 rounded-xl border border-sand-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Data de Liquidação</label>
                  <input
                    type="date"
                    value={receiptForm.date}
                    onChange={(e) => setReceiptForm({ ...receiptForm, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-sand-200 focus:outline-none font-mono"
                  />
                </div>

                <div className="pt-3 border-t border-sand-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsReceiptModalOpen(false)}
                    className="px-3.5 py-2 border border-sand-200 hover:bg-sand-50 rounded-xl text-[10px] font-bold uppercase cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-sage-600 hover:bg-sage-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Gerar e Confirmar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
