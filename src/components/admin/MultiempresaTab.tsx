import React, { useState, useEffect } from 'react';
import { 
  Building2, Key, Smartphone, Monitor, ShieldAlert, CheckCircle2, 
  HelpCircle, RefreshCw, Plus, ArrowRight, UserPlus, FileText, 
  Layers, Database, Smartphone as PhoneIcon, Chrome, ExternalLink, Download, Check, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { contentService } from '../../services/contentService';
import { Tenant, License } from '../../types';
import { useTenant } from '../../context/TenantContext';

interface MultiempresaTabProps {
  onTenantSwitch?: () => void;
}

export default function MultiempresaTab({ onTenantSwitch }: MultiempresaTabProps) {
  const { tenants, licenses, deleteTenant: removeTenantGlobal } = useTenant();
  const [activeTenantId, setActiveTenantId] = useState<string>('mentecare_platform');
  const [deleteTenantConfirm, setDeleteTenantConfirm] = useState<{ id: string; name: string } | null>(null);
  const [deletingTenant, setDeletingTenant] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  
  // Create Tenant Form State
  const [newTenantId, setNewTenantId] = useState('');
  const [newTenantName, setNewTenantName] = useState('');
  const [newTenantEmail, setNewTenantEmail] = useState('');
  const [newTenantSubdomain, setNewTenantSubdomain] = useState('');
  const [tenantError, setTenantError] = useState('');
  const [tenantSuccess, setTenantSuccess] = useState('');
  const [createdClientInfo, setCreatedClientInfo] = useState<{
    id: string;
    name: string;
    email: string;
    subdomain: string;
    licenseCode: string;
  } | null>(null);

  // Activate License Key Form State
  const [licenseCode, setLicenseCode] = useState('');
  const [licenseError, setLicenseError] = useState('');
  const [licenseSuccess, setLicenseSuccess] = useState('');

  useEffect(() => {
    const current = localStorage.getItem('active_tenant_id') || 'mentecare_platform';
    setActiveTenantId(current);
  }, []);

  const handleResetNewClientForm = () => {
    setCreatedClientInfo(null);
    setTenantSuccess('');
    setTenantError('');
    setNewTenantId('');
    setNewTenantName('');
    setNewTenantEmail('');
    setNewTenantSubdomain('');
  };

  const handleSwitchTenant = (tenantId: string) => {
    localStorage.setItem('active_tenant_id', tenantId);
    setActiveTenantId(tenantId);
    
    // Notify parent or trigger full refresh to reload all context-sensitive data
    if (onTenantSwitch) {
      onTenantSwitch();
    }
  };

  const confirmDeleteTenant = async () => {
    if (!deleteTenantConfirm) return;
    const target = { ...deleteTenantConfirm };
    setDeletingTenant(true);
    setDeleteTenantConfirm(null);
    try {
      await removeTenantGlobal(target.id);
      await contentService.deleteTenant(target.id);
      if (activeTenantId === target.id) {
        handleSwitchTenant('mentecare_platform');
      } else if (onTenantSwitch) {
        onTenantSwitch();
      }
    } catch (err: any) {
      console.error("Erro ao excluir cliente:", err);
    } finally {
      setDeletingTenant(false);
    }
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setTenantError('');
    setTenantSuccess('');

    if (!newTenantId || !newTenantName) {
      setTenantError('Preencha os campos obrigatórios (ID e Nome).');
      return;
    }

    const cleanId = newTenantId.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    const cleanEmail = newTenantEmail.trim().toLowerCase();
    const cleanName = newTenantName.trim();
    const cleanSubdomain = newTenantSubdomain.trim().toLowerCase() || cleanId;

    if (!cleanId) {
      setTenantError('O Identificador do Cliente (tenantId) deve conter caracteres válidos (letras, números ou _).');
      return;
    }

    // 1. Check ID / Subdomain duplicate
    const duplicateId = tenants.find(t => 
      (t.id && t.id.toLowerCase() === cleanId) || 
      (t.subdomain && t.subdomain.toLowerCase() === cleanId) ||
      (t.subdomain && t.subdomain.toLowerCase() === cleanSubdomain)
    );
    if (duplicateId) {
      setTenantError(`Não foi possível criar: Já existe um cliente cadastrado com o ID/Subdomínio '${cleanId}'.`);
      return;
    }

    // 2. Check Email duplicate (if email is provided)
    if (cleanEmail) {
      const duplicateEmail = tenants.find(t => 
        (t.ownerEmail && t.ownerEmail.trim().toLowerCase() === cleanEmail) ||
        ((t as any).email && (t as any).email.trim().toLowerCase() === cleanEmail)
      );
      if (duplicateEmail) {
        setTenantError(`Não foi possível criar: Já existe um cliente cadastrado com o e-mail '${cleanEmail}' (${duplicateEmail.name}).`);
        return;
      }
    }

    // 3. Check Name duplicate
    const duplicateName = tenants.find(t => 
      (t.name && t.name.trim().toLowerCase() === cleanName.toLowerCase()) ||
      (t.clinicName && t.clinicName.trim().toLowerCase() === cleanName.toLowerCase())
    );
    if (duplicateName) {
      setTenantError(`Não foi possível criar: Já existe um cliente cadastrado com o nome '${cleanName}'.`);
      return;
    }

    const newTenant: Tenant = {
      id: cleanId,
      name: cleanName,
      subdomain: cleanSubdomain,
      createdAt: Date.now(),
      ownerEmail: cleanEmail,
      status: 'Ativo'
    };

    try {
      await contentService.createTenant(newTenant);
      
      // Also automatically create a default Pro license for this new tenant
      const newLicense: License = {
        id: 'lic_' + cleanId + '_' + Date.now(),
        code: `LIC-${cleanId.toUpperCase()}-PRO-${Math.floor(1000 + Math.random() * 9000)}`,
        activatedAt: Date.now(),
        expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
        plan: 'Pro',
        maxUsers: 3,
        maxPatients: 100,
        features: ['dashboard', 'agenda', 'pacientes', 'financeiro'],
        status: 'Ativa',
        tenantId: cleanId
      };
      await contentService.createLicense(newLicense);

      setTenantSuccess(`✅ Cliente '${newTenant.name}' salvo com sucesso! Licença ativada.`);
      setCreatedClientInfo({
        id: cleanId,
        name: newTenant.name,
        email: newTenant.ownerEmail || cleanEmail || 'Não informado',
        subdomain: newTenant.subdomain || cleanId,
        licenseCode: newLicense.code
      });

      setNewTenantId('');
      setNewTenantName('');
      setNewTenantEmail('');
      setNewTenantSubdomain('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setTenantError(err?.message || 'Falha ao criar tenant no banco de dados. Verifique se o cliente já existe.');
    }
  };

  const handleActivateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    setLicenseError('');
    setLicenseSuccess('');

    if (!licenseCode) {
      setLicenseError('Por favor, informe a chave da licença.');
      return;
    }

    try {
      const updatedLic = await contentService.activateLicense(licenseCode.trim(), activeTenantId);
      setLicenseSuccess(`Licença ativa com sucesso! Plano: ${updatedLic.plan}`);
      setLicenseCode('');
    } catch (err) {
      setLicenseError('Falha ao ativar a licença.');
    }
  };

  const simulateOfflineSync = () => {
    setSyncing(true);
    setSyncSuccess(false);
    setTimeout(() => {
      setSyncing(false);
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 3000);
    }, 2500);
  };

  const activeTenant = tenants.find(t => t.id === activeTenantId) || {
    id: 'mentecare_platform',
    name: 'MenteCare Enterprise Platform',
    subdomain: 'platform',
    ownerEmail: 'suporte@mentecare.com.br',
    status: 'Ativo'
  };

  const activeLicense = licenses.find(l => l.tenantId === activeTenantId) || {
    code: 'SEM LICENÇA ATIVA',
    plan: 'Starter' as const,
    activatedAt: Date.now(),
    expiresAt: Date.now(),
    maxUsers: 1,
    maxPatients: 10,
    status: 'Ativa' as const,
    features: ['dashboard']
  };

  return (
    <div className="space-y-6">
      {/* SaaS Notice Card */}
      <div className="bg-gradient-to-r from-softblue-500/10 to-dusty-800/10 border border-softblue-200 rounded-2xl p-5 shadow-sm">
        <div className="flex gap-4">
          <div className="p-3 bg-white rounded-xl shadow-sm text-softblue-600 shrink-0 h-fit">
            <Layers size={24} />
          </div>
          <div>
            <h3 className="font-serif font-bold text-sand-950 text-base">Arquitetura Multiempresa & SaaS Enterprise</h3>
            <p className="text-xs text-sand-700 mt-1 leading-relaxed">
              O sistema possui uma estrutura multi-inquilino (Multi-tenant). Cada psicólogo é um <strong>Tenant (cliente)</strong> com isolamento completo de dados por <strong>tenantId</strong>. 
              Isso permite que você venda assinaturas e configure licenças customizadas. Abaixo você pode simular o funcionamento sob a perspectiva de diferentes inquilinos e testar o isolamento absoluto da Agenda, Pacientes, Finanças e CMS.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Tenant Management & Switching */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Tenant Switcher & List */}
          <div className="bg-white rounded-2xl border border-sand-200 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-sand-150 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="text-softblue-600" size={18} />
                <h4 className="font-serif font-bold text-sand-950 text-sm">Clientes / Tenants Ativos</h4>
              </div>
              <span className="text-[10px] bg-sand-100 px-2 py-0.5 rounded-full text-sand-600 font-mono font-bold">
                {tenants.length} cadastrados
              </span>
            </div>

            {/* Active Switcher Banner */}
            <div className="bg-sand-50 border border-sand-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[9px] text-softblue-600 font-mono font-bold uppercase tracking-wider block">Ambiente Ativo</span>
                <p className="font-bold text-sand-950 text-sm">{activeTenant.name}</p>
                <p className="text-[10px] text-sand-500 font-mono">tenantId: <span className="bg-sand-200 px-1 py-0.5 rounded font-bold text-sand-800">{activeTenant.id}</span></p>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs text-sand-600">Simular como:</span>
                <select
                  value={activeTenantId}
                  onChange={(e) => handleSwitchTenant(e.target.value)}
                  className="bg-white border border-sand-200 rounded-lg text-xs px-2.5 py-1.5 focus:ring-1 focus:ring-softblue-500 focus:outline-none cursor-pointer font-semibold text-sand-800"
                >
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.id})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Micro Tenant Table */}
            <div className="overflow-hidden border border-sand-150 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-sand-50 text-sand-700 font-bold border-b border-sand-150">
                  <tr>
                    <th className="p-3">Nome / ID</th>
                    <th className="p-3">Email do Responsável</th>
                    <th className="p-3">Subdomínio</th>
                    <th className="p-3">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-100">
                  {tenants.map((t) => (
                    <tr 
                      key={t.id} 
                      className={`hover:bg-sand-50/50 transition-colors ${t.id === activeTenantId ? 'bg-softblue-500/5' : ''}`}
                    >
                      <td className="p-3 font-semibold text-sand-950">
                        <div>{t.name}</div>
                        <div className="text-[9px] text-sand-500 font-mono">ID: {t.id}</div>
                      </td>
                      <td className="p-3 text-sand-600 font-mono text-[10px]">{t.ownerEmail}</td>
                      <td className="p-3 text-sand-600 font-mono text-[10px]">
                        <span className="text-softblue-600 font-bold">{t.subdomain}</span>.saas.com
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {t.id === activeTenantId ? (
                            <span className="text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                              <CheckCircle2 size={10} /> Ativo
                            </span>
                          ) : (
                            <button
                              onClick={() => handleSwitchTenant(t.id)}
                              className="px-2 py-1 bg-white hover:bg-sand-100 border border-sand-200 text-sand-700 font-bold rounded text-[10px] cursor-pointer"
                            >
                              Selecionar
                            </button>
                          )}
                          {t.id !== 'mentecare_platform' && t.id !== 'main' && (
                            <button
                              onClick={() => setDeleteTenantConfirm({ id: t.id, name: t.name })}
                              className="p-1 hover:bg-rose-50 text-sand-400 hover:text-rose-600 rounded transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                              title="Excluir Empresa / Tenant"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* New Tenant Creation Form */}
          <div className="bg-white rounded-2xl border border-sand-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-sand-150 pb-3">
              <UserPlus className="text-softblue-600 animate-pulse" size={18} />
              <h4 className="font-serif font-bold text-sand-950 text-sm">Adicionar Novo Cliente (SaaS Sign-up)</h4>
            </div>

            <form onSubmit={handleCreateTenant} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-sand-700 uppercase">Identificador ID Único</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: dr_ricardo"
                    value={newTenantId}
                    onChange={(e) => setNewTenantId(e.target.value)}
                    className="w-full bg-sand-50 border border-sand-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-softblue-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-sand-700 uppercase">Nome do Profissional</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Dr. Ricardo Santos"
                    value={newTenantName}
                    onChange={(e) => setNewTenantName(e.target.value)}
                    className="w-full bg-sand-50 border border-sand-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-softblue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-sand-700 uppercase">Email Administrativo (Opcional)</label>
                  <input
                    type="email"
                    placeholder="ex: ricardo@gmail.com (opcional)"
                    value={newTenantEmail}
                    onChange={(e) => setNewTenantEmail(e.target.value)}
                    className="w-full bg-sand-50 border border-sand-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-softblue-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-sand-700 uppercase">Subdomínio Desejado</label>
                  <input
                    type="text"
                    placeholder="ex: drricardosantos"
                    value={newTenantSubdomain}
                    onChange={(e) => setNewTenantSubdomain(e.target.value)}
                    className="w-full bg-sand-50 border border-sand-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-softblue-500 focus:outline-none"
                  />
                </div>
              </div>

              {tenantError && (
                <p className="text-[11px] text-red-600 font-semibold">{tenantError}</p>
              )}
              {tenantSuccess && (
                <p className="text-[11px] text-emerald-700 font-semibold">{tenantSuccess}</p>
              )}

              <button
                type="submit"
                className="w-full py-2 bg-softblue-600 hover:bg-softblue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-softblue-500/10"
              >
                <span>Cadastrar Novo Psicólogo</span>
                <ArrowRight size={13} />
              </button>
            </form>
          </div>

        </div>

        {/* Right Column: Licensing Details & Multi-Platform */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* License Configuration (Phase 3) */}
          <div className="bg-white rounded-2xl border border-sand-200 p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b border-sand-150 pb-3">
              <Key className="text-softblue-600" size={18} />
              <h4 className="font-serif font-bold text-sand-950 text-sm">Licença Ativa do Cliente</h4>
            </div>

            {/* License details card */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-sand-600">Plano contratado:</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                  activeLicense.plan === 'Premium' 
                    ? 'bg-purple-50 text-purple-700 border-purple-200' 
                    : activeLicense.plan === 'Pro'
                    ? 'bg-softblue-50 text-softblue-700 border-softblue-200'
                    : 'bg-sand-100 text-sand-700 border-sand-300'
                }`}>
                  Plano {activeLicense.plan}
                </span>
              </div>

              <div className="p-3.5 bg-sand-50 border border-sand-200 rounded-xl space-y-1.5 relative overflow-hidden">
                <div className="absolute right-2 top-2">
                  <span className="text-[9px] bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold px-2 py-0.5 rounded">
                    {activeLicense.status}
                  </span>
                </div>
                <span className="text-[10px] text-sand-500 font-mono font-bold block uppercase">Chave da Licença</span>
                <span className="font-mono text-xs font-bold text-sand-900 select-all tracking-wider">
                  {activeLicense.code}
                </span>
                
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-sand-200/80 mt-2 text-[10px]">
                  <div>
                    <span className="text-sand-500 block">Ativação</span>
                    <span className="font-bold text-sand-800">
                      {new Date(activeLicense.activatedAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div>
                    <span className="text-sand-500 block">Vencimento</span>
                    <span className="font-bold text-sand-800">
                      {new Date(activeLicense.expiresAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Limits and quotas */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-sand-700 uppercase">Limites e Cotas da Licença</span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="border border-sand-150 rounded-xl p-3 text-center">
                    <span className="text-[10px] text-sand-500 block">Máx. Pacientes</span>
                    <span className="text-lg font-serif font-bold text-sand-900 font-mono">{activeLicense.maxPatients}</span>
                  </div>
                  <div className="border border-sand-150 rounded-xl p-3 text-center">
                    <span className="text-[10px] text-sand-500 block">Usuários Perm.</span>
                    <span className="text-lg font-serif font-bold text-sand-900 font-mono">{activeLicense.maxUsers}</span>
                  </div>
                </div>
              </div>

              {/* Features list */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-sand-700 uppercase block">Módulos Liberados</span>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-sand-700">
                  {[
                    { id: 'dashboard', label: 'Dashboard' },
                    { id: 'agenda', label: 'Agenda & Calendário' },
                    { id: 'pacientes', label: 'Prontuários' },
                    { id: 'financeiro', label: 'Módulo Financeiro' },
                    { id: 'cms', label: 'CMS Enterprise' },
                    { id: 'designer', label: 'Designer Visual' },
                  ].map(f => (
                    <div key={f.id} className="flex items-center gap-1.5">
                      {activeLicense.features?.includes(f.id) ? (
                        <Check className="text-emerald-600 shrink-0" size={12} />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-sand-300 shrink-0" />
                      )}
                      <span className={activeLicense.features?.includes(f.id) ? 'font-semibold text-sand-900' : 'text-sand-400 line-through'}>
                        {f.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form to activate new license */}
              <form onSubmit={handleActivateLicense} className="border-t border-sand-150 pt-4 space-y-2">
                <label className="text-[10px] font-bold text-sand-700 uppercase block">Ativar Nova Licença / Upgrade</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="LIC-XXXX-XXXX-XXXX"
                    value={licenseCode}
                    onChange={(e) => setLicenseCode(e.target.value)}
                    className="bg-sand-50 border border-sand-200 rounded-xl px-3 py-2 text-xs flex-1 uppercase font-mono tracking-wider focus:outline-none focus:ring-1 focus:ring-softblue-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-dusty-800 hover:bg-dusty-900 text-white rounded-xl text-xs font-bold cursor-pointer shrink-0"
                  >
                    Ativar
                  </button>
                </div>
                {licenseError && <p className="text-[10px] text-red-600 font-semibold">{licenseError}</p>}
                {licenseSuccess && <p className="text-[10px] text-emerald-700 font-semibold">{licenseSuccess}</p>}
              </form>
            </div>
          </div>

          {/* Desktop & Mobile Readiness (Phase 4 & 5) */}
          <div className="bg-white rounded-2xl border border-sand-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-sand-150 pb-3">
              <Monitor className="text-softblue-600" size={18} />
              <h4 className="font-serif font-bold text-sand-950 text-sm">Sincronização & Aplicações Multiplataforma</h4>
            </div>

            <div className="space-y-4">
              {/* Desktop App Sim */}
              <div className="p-4 border border-sand-200 rounded-xl space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Monitor size={16} className="text-sand-700" />
                    <div>
                      <h5 className="font-bold text-sand-950 text-xs">Versão Desktop (Win & macOS)</h5>
                      <p className="text-[9px] text-sand-500">Desenvolvido em Tauri / Electron para funcionamento offline</p>
                    </div>
                  </div>
                  <span className="text-[9px] bg-emerald-50 border border-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded font-mono">OFFLINE-READY</span>
                </div>

                <div className="flex items-center justify-between text-[10px] bg-sand-50 p-2.5 rounded-lg border border-sand-150">
                  <div className="flex items-center gap-1.5">
                    <Database size={12} className="text-softblue-600" />
                    <span className="text-sand-700">Banco de Dados Local (indexedDB):</span>
                  </div>
                  <span className="font-bold text-emerald-800">Sincronizado</span>
                </div>

                {/* Progress simulator */}
                {syncing ? (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] text-sand-500">
                      <span>Sincronizando registros clínicos e finanças...</span>
                      <span className="font-bold animate-pulse">Aguarde</span>
                    </div>
                    <div className="w-full bg-sand-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-softblue-500 h-1.5 rounded-full animate-bar" style={{ width: '100%' }}></div>
                    </div>
                  </div>
                ) : syncSuccess ? (
                  <div className="text-[10px] text-emerald-800 font-bold bg-emerald-50 border border-emerald-100 p-2 rounded-lg text-center">
                    Sincronização concluída com sucesso! Banco local e nuvem em paridade.
                  </div>
                ) : null}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={simulateOfflineSync}
                    disabled={syncing}
                    className="flex-1 py-1.5 border border-sand-200 hover:bg-sand-50 text-sand-700 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-55"
                  >
                    <RefreshCw size={11} className={syncing ? 'animate-spin' : ''} />
                    <span>Sincronizar Dados Offline</span>
                  </button>

                  <a
                    href="#download-desktop"
                    onClick={(e) => { e.preventDefault(); alert("Iniciando simulação de download do instalador Tauri (.msi / .dmg)!"); }}
                    className="px-2.5 py-1.5 bg-sand-950 text-white hover:bg-sand-900 rounded-lg text-[10px] font-bold flex items-center gap-1 shrink-0"
                  >
                    <Download size={11} />
                    <span>Instalador</span>
                  </a>
                </div>
              </div>

              {/* Mobile App Sim */}
              <div className="p-4 border border-sand-200 rounded-xl space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone size={16} className="text-sand-700" />
                    <div>
                      <h5 className="font-bold text-sand-950 text-xs">Aplicativos Móveis (iOS & Android)</h5>
                      <p className="text-[9px] text-sand-500">Acesse agenda, pacientes e finanças no celular</p>
                    </div>
                  </div>
                  <span className="text-[9px] bg-purple-50 border border-purple-100 text-purple-800 font-bold px-1.5 py-0.5 rounded font-mono">MOBILE APP</span>
                </div>

                <div className="flex items-center justify-between gap-3 text-xs bg-sand-50/50 p-2.5 rounded-lg border border-sand-150">
                  <div className="space-y-1 max-w-[170px]">
                    <span className="text-[9px] font-bold text-sand-700 block uppercase">Vincular Dispositivo</span>
                    <p className="text-[10px] text-sand-600 leading-tight">Escaneie o QR Code abaixo para baixar o app e conectar diretamente à conta do tenant <strong>{activeTenant.id}</strong>.</p>
                  </div>
                  <div className="bg-white p-1 rounded-md border border-sand-200 shadow-xs shrink-0">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`${window.location.origin}/clinica/${activeTenant.id}`)}&color=25221c&bgcolor=ffffff`} 
                      alt="Link do Tenant" 
                      className="w-14 h-14 object-contain"
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Confirmation Modal when Client is Created */}
      {createdClientInfo && (
        <div className="fixed inset-0 bg-sand-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-emerald-200 shadow-2xl space-y-5"
          >
            <div className="flex items-center gap-3 text-emerald-600">
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl">
                <CheckCircle2 size={28} className="text-emerald-600" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-sand-950 text-lg">Cliente Criado com Sucesso!</h3>
                <p className="text-xs text-sand-500">Novo cliente/tenant registrado no MenteCare</p>
              </div>
            </div>

            <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl text-xs space-y-3">
              <div>
                <span className="text-sand-500 text-[10px] uppercase tracking-wider font-semibold block">Nome / Clínica</span>
                <p className="font-bold text-sand-950 text-sm">{createdClientInfo.name}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-sand-500 text-[10px] uppercase tracking-wider font-semibold block">Identificador</span>
                  <p className="font-mono font-bold text-emerald-800 text-xs bg-white px-2 py-1 rounded-lg border border-emerald-200">{createdClientInfo.id}</p>
                </div>
                <div>
                  <span className="text-sand-500 text-[10px] uppercase tracking-wider font-semibold block">Subdomínio</span>
                  <p className="font-mono font-bold text-emerald-800 text-xs bg-white px-2 py-1 rounded-lg border border-emerald-200">{createdClientInfo.subdomain}</p>
                </div>
              </div>

              <div>
                <span className="text-sand-500 text-[10px] uppercase tracking-wider font-semibold block">E-mail Proprietário</span>
                <p className="font-medium text-sand-800 text-xs">{createdClientInfo.email}</p>
              </div>

              <div>
                <span className="text-sand-500 text-[10px] uppercase tracking-wider font-semibold block">Licença Pro Gerada</span>
                <p className="font-mono font-bold text-emerald-900 text-xs bg-emerald-100/80 px-2 py-1.5 rounded-lg border border-emerald-300">
                  {createdClientInfo.licenseCode}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                onClick={handleResetNewClientForm}
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-2xl text-xs cursor-pointer shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Check size={16} />
                <span>Voltar / Cadastrar Novo Cliente</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Tenant Confirmation Modal */}
      {deleteTenantConfirm && (
        <div className="fixed inset-0 bg-sand-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-sand-200 shadow-2xl space-y-5"
          >
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="font-serif font-bold text-sand-950 text-base">Excluir Cliente / Empresa</h3>
                <p className="text-[11px] text-sand-500">Esta ação apaga o tenant do banco de dados.</p>
              </div>
            </div>

            <div className="p-4 bg-sand-50 border border-sand-200 rounded-2xl text-xs space-y-2">
              <p className="text-sand-800">Deseja realmente remover o cliente:</p>
              <p className="font-bold text-sand-950 font-mono text-sm bg-white p-2 rounded-xl border border-sand-200">
                {deleteTenantConfirm.name} ({deleteTenantConfirm.id})
              </p>
              <p className="text-[10px] text-rose-600 font-semibold">
                ⚠️ O cliente e todas as suas licenças associadas serão permanentemente excluídos.
              </p>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setDeleteTenantConfirm(null)}
                disabled={deletingTenant}
                className="px-4 py-2 border border-sand-300 hover:bg-sand-50 text-sand-700 font-bold rounded-xl text-xs cursor-pointer transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteTenant}
                disabled={deletingTenant}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {deletingTenant ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                <span>{deletingTenant ? 'Excluindo...' : 'Confirmar Exclusão'}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
