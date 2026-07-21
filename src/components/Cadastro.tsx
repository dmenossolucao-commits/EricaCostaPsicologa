import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, ArrowRight, ShieldCheck, Mail, Lock, User, Phone, 
  Building2, Check, RefreshCw, AlertCircle, CheckCircle2, Clipboard, 
  Send, Printer, Palette, MapPin, Briefcase, CreditCard, Globe, Eye, EyeOff
} from 'lucide-react';
import { createUserWithEmailAndPassword, updatePassword } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { SaaSPlanId } from '../types';

interface CadastroProps {
  navigate: (to: string) => void;
}

export default function Cadastro({ navigate }: CadastroProps) {
  // Wizard Steps: 1, 2, 3, 4, 5 (Success)
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Identification
  const [clinicName, setClinicName] = useState('');
  const [professionalName, setProfessionalName] = useState('');
  const [crp, setCrp] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#0284c7');
  const [tenantId, setTenantId] = useState('');
  const [subdomain, setSubdomain] = useState('');

  // Step 1 Validation state
  const [checkingTenant, setCheckingTenant] = useState(false);
  const [tenantError, setTenantError] = useState('');

  // Step 2: Plan Selection
  const [selectedPlan, setSelectedPlan] = useState<SaaSPlanId>('Pro');
  const [trialPeriod, setTrialPeriod] = useState<'7' | '15' | '30' | '0'>('30');

  // Step 3: Admin Configuration
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [autoGeneratePassword, setAutoGeneratePassword] = useState(false);
  const [forcePasswordChange, setForcePasswordChange] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Step 4: Provisioning Checklist Progress
  const [provisionProgress, setProvisionProgress] = useState<{ label: string; status: 'pending' | 'loading' | 'done' | 'error' }[]>([
    { label: 'Criando usuário administrativo seguro no Firebase Auth', status: 'pending' },
    { label: 'Registrando dados da clínica em /tenants', status: 'pending' },
    { label: 'Gerando e ativando licença de uso do software', status: 'pending' },
    { label: 'Criando perfil administrativo em /admins', status: 'pending' },
    { label: 'Provisionando layouts e conteúdo do CMS (Draft & Published)', status: 'pending' },
    { label: 'Configurando gateway de pagamentos e Pix', status: 'pending' },
    { label: 'Registrando logs de auditoria e segurança', status: 'pending' }
  ]);

  // Modals / Extras
  const [showEmailPreview, setShowEmailPreview] = useState(false);

  // Sync inputs
  const handleClinicNameChange = (val: string) => {
    setClinicName(val);
    const clean = val.trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 16);
    setTenantId(clean);
    setSubdomain(clean ? `${clean}.mentecare.com.br` : '');
  };

  const handleTenantIdChange = (val: string) => {
    const clean = val.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    setTenantId(clean);
    setSubdomain(clean ? `${clean}.mentecare.com.br` : '');
  };

  const handleProfessionalNameChange = (val: string) => {
    setProfessionalName(val);
    setAdminName(val);
  };

  const handlePhoneChange = (val: string) => {
    setPhone(val);
    setWhatsapp(val);
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    setAdminEmail(val);
  };

  // Auto Password Generation
  useEffect(() => {
    if (autoGeneratePassword) {
      const generated = 'MC-' + Math.random().toString(36).substring(2, 8).toUpperCase() + Math.floor(100 + Math.random() * 900) + '!';
      setAdminPassword(generated);
      setConfirmPassword(generated);
    }
  }, [autoGeneratePassword]);

  // Live Tenant Validation (Debounced)
  useEffect(() => {
    if (!tenantId) {
      setTenantError('');
      return;
    }
    if (tenantId.length < 3) {
      setTenantError('O Tenant ID deve conter pelo menos 3 caracteres.');
      return;
    }
    if (!/^[a-z0-9_]+$/.test(tenantId)) {
      setTenantError('Apenas letras minúsculas, números e sublinhados (_) são permitidos.');
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingTenant(true);
      try {
        const docRef = doc(db, 'tenants', tenantId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() || tenantId === 'mentecare_platform') {
          setTenantError('Este identificador já está em uso.');
        } else {
          setTenantError('');
        }
      } catch (err) {
        console.error("Erro ao validar tenant:", err);
      } finally {
        setCheckingTenant(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [tenantId]);

  // Validators
  const validateCpfCnpj = (val: string) => {
    const clean = val.replace(/\D/g, '');
    return clean.length === 11 || clean.length === 14;
  };

  const validateCrp = (val: string) => {
    if (!val) return true;
    return /^\d{2}\/\d{4,8}$|^\d{4,8}$/.test(val.trim());
  };

  const isStep1Valid = () => {
    return (
      clinicName.trim() !== '' &&
      professionalName.trim() !== '' &&
      validateCpfCnpj(cpfCnpj) &&
      validateCrp(crp) &&
      phone.trim() !== '' &&
      whatsapp.trim() !== '' &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
      city.trim() !== '' &&
      state.trim() !== '' &&
      tenantId.trim() !== '' &&
      tenantError === '' &&
      !checkingTenant
    );
  };

  const isStep3Valid = () => {
    return (
      adminName.trim() !== '' &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail) &&
      adminPassword.length >= 6 &&
      adminPassword === confirmPassword
    );
  };

  // Execution
  const handleProvisioning = async () => {
    setLoading(true);
    setError('');
    
    // Update all progress to pending
    setProvisionProgress(prev => prev.map(p => ({ ...p, status: 'pending' })));

    const updateStepStatus = (index: number, status: 'loading' | 'done' | 'error') => {
      setProvisionProgress(prev => prev.map((p, i) => i === index ? { ...p, status } : p));
    };

    try {
      // Pre-check duplicates in Firestore
      const tenantDocRef = doc(db, 'tenants', tenantId);
      const tenantSnap = await getDoc(tenantDocRef);
      if (tenantSnap.exists()) {
        throw new Error('O identificador de clínica (Tenant ID) já está sendo utilizado.');
      }

      const qEmail = query(collection(db, 'admins'), where('email', '==', adminEmail.trim().toLowerCase()));
      const emailSnap = await getDocs(qEmail);
      if (!emailSnap.empty) {
        throw new Error('Este e-mail corporativo já está cadastrado.');
      }

      // Step 0: Create Auth user
      updateStepStatus(0, 'loading');
      const userCredential = await createUserWithEmailAndPassword(auth, adminEmail.trim().toLowerCase(), adminPassword);
      const uid = userCredential.user.uid;
      updateStepStatus(0, 'done');

      // Step 1: Create Tenant doc
      updateStepStatus(1, 'loading');
      await setDoc(doc(db, 'tenants', tenantId), {
        id: tenantId,
        name: clinicName.trim(),
        subdomain: subdomain.trim().toLowerCase(),
        createdAt: Date.now(),
        ownerEmail: adminEmail.trim().toLowerCase(),
        status: 'Ativo',
        city: city.trim(),
        state: state.trim(),
        logoUrl: logoUrl.trim() || null,
        primaryColor: primaryColor || '#0284c7',
        crp: crp.trim() || null,
        cpfCnpj: cpfCnpj.trim(),
        phone: phone.trim(),
        whatsapp: whatsapp.trim()
      });
      updateStepStatus(1, 'done');

      // Step 2: License calculation
      updateStepStatus(2, 'loading');
      const trialDays = trialPeriod === '0' ? 365 : parseInt(trialPeriod);
      const expiresAt = Date.now() + trialDays * 24 * 60 * 60 * 1000;
      const maxUsers = selectedPlan === 'Starter' ? 1 : selectedPlan === 'Pro' ? 3 : selectedPlan === 'Premium' ? 10 : 99;
      const maxPatients = selectedPlan === 'Starter' ? 50 : selectedPlan === 'Pro' ? 150 : selectedPlan === 'Premium' ? 500 : 9999;
      const features = selectedPlan === 'Starter' 
        ? ['dashboard', 'agenda', 'pacientes', 'financeiro']
        : selectedPlan === 'Pro'
        ? ['dashboard', 'agenda', 'pacientes', 'financeiro', 'blog', 'cms']
        : selectedPlan === 'Premium'
        ? ['dashboard', 'agenda', 'pacientes', 'financeiro', 'blog', 'cms', 'designer', 'custom_domain']
        : ['dashboard', 'agenda', 'pacientes', 'financeiro', 'blog', 'cms', 'designer', 'custom_domain', 'multiempresa', 'ia_clinica'];

      const licenseId = 'lic_' + tenantId + '_' + Date.now();
      await setDoc(doc(db, 'licenses', licenseId), {
        id: licenseId,
        code: `LIC-${tenantId.toUpperCase()}-${selectedPlan.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
        activatedAt: Date.now(),
        expiresAt: expiresAt,
        plan: selectedPlan,
        maxUsers,
        maxPatients,
        features,
        status: 'Ativa',
        tenantId
      });
      updateStepStatus(2, 'done');

      // Step 3: Admin registration
      updateStepStatus(3, 'loading');
      await setDoc(doc(db, 'admins', uid), {
        id: uid,
        name: adminName.trim(),
        email: adminEmail.trim().toLowerCase(),
        phone: phone.trim(),
        role: 'admin',
        profile: 'clinico',
        status: 'active',
        tenantId,
        forcePasswordChange,
        createdAt: Date.now(),
        crp: crp.trim() || null,
        cpfCnpj: cpfCnpj.trim()
      });
      updateStepStatus(3, 'done');

      // Step 4: CMS Init
      updateStepStatus(4, 'loading');
      const registeredName = professionalName.trim() || clinicName.trim() || 'Atendimento Psicológico';
      const initialContent = {
        psychologist_info: {
          name: registeredName,
          email: adminEmail.trim().toLowerCase(),
          phone: phone.trim(),
          whatsappMessage: `Olá, ${registeredName}! Gostaria de agendar uma consulta.`,
          footerText: `Psicoterapia online ética, sigilosa e acolhedora. Consultório: ${clinicName.trim()}`
        },
        cms_content: {
          hero: {
            tag: "Espaço Acolhedor & Ético",
            title: registeredName,
            subtitle: `Um espaço seguro no consultório ${clinicName.trim() || registeredName} para acolher sua história, fortalecer sua saúde emocional e promover seu bem-estar.`,
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
          title: `${registeredName} | ${clinicName.trim() || 'Psicologia'}`,
          description: `Espaço seguro de acolhimento e escuta qualificada. Psicoterapia online e presencial no consultório ${clinicName.trim()}.`,
          keywords: `psicóloga, terapia online, psicoterapia, ${registeredName}, ${clinicName.trim()}`
        },
        appearance: {
          primaryColor: primaryColor || '#0284c7',
          logoUrl: logoUrl.trim() || null,
          theme: 'Clean'
        },
        services: [
          { id: '1', title: 'Psicoterapia Individual', description: 'Atendimento clínico focado no autoconhecimento e desenvolvimento emocional.', duration: '50 min', price: 150 },
          { id: '2', title: 'Terapia de Casal', description: 'Orientação e mediação para melhoria do relacionamento e diálogo.', duration: '60 min', price: 220 }
        ],
        process_steps: [
          { id: '1', title: 'Acolhimento', description: 'Primeira conversa para compreender suas demandas e necessidades.' },
          { id: '2', title: 'Sessões Semanais', description: 'Encontros estruturados com foco no seu desenvolvimento pessoal.' }
        ],
        faqs: [
          { question: 'Como funciona a primeira sessão de terapia?', answer: 'É um momento de acolhimento onde nos conhecemos e estabelecemos os objetivos terapêuticos.' },
          { question: 'As sessões online são seguras?', answer: 'Sim, ocorrem em ambiente virtual seguro, criptografado e estritamente confidencial.' }
        ],
        testimonials: [
          { name: 'Maria Silva', text: 'A terapia mudou a minha perspectiva de vida. Profissional excelente e super humana.' }
        ]
      };
      await setDoc(doc(db, 'site_content', `${tenantId}_published`), initialContent);
      await setDoc(doc(db, 'site_content', `${tenantId}_draft`), initialContent);
      updateStepStatus(4, 'done');

      // Step 5: Payments Gateway
      updateStepStatus(5, 'loading');
      await setDoc(doc(db, 'pix_config', tenantId), {
        id: tenantId,
        keyType: 'email',
        key: adminEmail.trim().toLowerCase(),
        receiverName: professionalName.trim(),
        receiverCity: city.trim() || 'São Paulo',
        updatedAt: Date.now()
      });
      updateStepStatus(5, 'done');

      // Step 6: Security Audit
      updateStepStatus(6, 'loading');
      await setDoc(doc(db, 'audit_logs', 'audit_' + Date.now()), {
        userId: uid,
        email: adminEmail.trim().toLowerCase(),
        action: 'UPDATE',
        details: `Novo tenant provisionado pelo pro-wizard: '${clinicName}' (${tenantId}) no plano ${selectedPlan}.`,
        timestamp: Date.now(),
        ip: '127.0.0.1',
        browser: 'SaaS Pro Wizard',
        os: 'Linux',
        tenantId
      });
      updateStepStatus(6, 'done');

      // Complete and save active tenant id
      localStorage.setItem('active_tenant_id', tenantId);
      
      // Navigate to success screen
      setStep(5);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro durante o provisionamento de dados.');
      // Mark active loading steps as error
      setProvisionProgress(prev => prev.map(p => p.status === 'loading' ? { ...p, status: 'error' } : p));
    } finally {
      setLoading(false);
    }
  };

  const regeneratePassword = async () => {
    setLoading(true);
    try {
      const newPass = 'MC-' + Math.random().toString(36).substring(2, 8).toUpperCase() + Math.floor(100 + Math.random() * 900) + '!';
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPass);
        setAdminPassword(newPass);
        setConfirmPassword(newPass);
        alert('Senha temporária regenerada e atualizada no Firebase Auth!');
      } else {
        alert('Usuário atual não autenticado ou sessão expirada.');
      }
    } catch (err: any) {
      alert('Falha ao regenerar senha: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Clipboard Helpers
  const copyCredentials = () => {
    const text = `Credenciais de Acesso MenteCare:\nClínica: ${clinicName}\nPlano: ${selectedPlan}\nE-mail: ${adminEmail}\nSenha Temporária: ${adminPassword}\nTenant ID: ${tenantId}`;
    navigator.clipboard.writeText(text);
    alert('Credenciais copiadas com sucesso!');
  };

  const copyLinks = () => {
    const text = `Links MenteCare:\nSite Público: ${window.location.origin}/clinica/${tenantId}\nPainel Administrativo: ${window.location.origin}/login?tenant=${tenantId}`;
    navigator.clipboard.writeText(text);
    alert('Links de acesso copiados com sucesso!');
  };

  // WhatsApp Sender
  const sendWhatsApp = () => {
    const text = `Olá!\nSua clínica foi criada com sucesso no MenteCare.\n\nAcesse:\nSite:\n${window.location.origin}/clinica/${tenantId}\n\nPainel Administrativo:\n${window.location.origin}/login?tenant=${tenantId}\n\nE-mail:\n${adminEmail}\nSenha temporária:\n${adminPassword}\n\nNo primeiro acesso será solicitada a alteração da senha.\n\nEquipe MenteCare.`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Plans details list
  const plans = [
    {
      id: 'Starter',
      name: 'Starter',
      price: 'R$ 89',
      users: '1 Usuário',
      patients: '50 Pacientes',
      ia: false,
      whatsapp: false,
      finance: 'Básico',
      portal: false,
      crm: false,
      desc: 'Para psicólogos autônomos em início de carreira.'
    },
    {
      id: 'Pro',
      name: 'Corporate Pro',
      price: 'R$ 179',
      users: '3 Usuários',
      patients: '150 Pacientes',
      ia: false,
      whatsapp: false,
      finance: 'Completo',
      portal: true,
      crm: true,
      desc: 'Ideal para clínicas pequenas com gestão compartilhada.'
    },
    {
      id: 'Premium',
      name: 'Enterprise Multi',
      price: 'R$ 349',
      users: '10 Usuários',
      patients: '500 Pacientes',
      ia: true,
      whatsapp: true,
      finance: 'Multi-Contas',
      portal: true,
      crm: true,
      desc: 'Clínicas consolidadas buscando personalização e automação.'
    },
    {
      id: 'Enterprise',
      name: 'Unlimited Suite',
      price: 'R$ 699',
      users: 'Usuários Ilimitados',
      patients: 'Pacientes Ilimitados',
      ia: true,
      whatsapp: true,
      finance: 'Completo + Conciliação',
      portal: true,
      crm: true,
      desc: 'Grandes centros médicos ou franquias com white-label.'
    }
  ];

  const getPlanPriceValue = () => {
    const pl = plans.find(p => p.id === selectedPlan);
    return pl ? pl.price : 'R$ 0';
  };

  // HTML Email Layout Code
  const getEmailHtml = () => {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Sua Clínica está pronta no MenteCare!</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f6f8; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <!-- Header -->
          <tr style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);">
            <td style="padding: 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">MenteCare</h1>
              <p style="color: #e0f2fe; margin: 5px 0 0 0; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px;">Sistema de Gestão Clínica</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 40px; color: #1e293b;">
              <h2 style="margin-top: 0; font-size: 20px; font-weight: 700; color: #0f172a;">Parabéns! Sua clínica está ativa.</h2>
              <p style="font-size: 14px; line-height: 1.6; color: #475569;">Olá, <strong>${adminName}</strong>,</p>
              <p style="font-size: 14px; line-height: 1.6; color: #475569;">O provisionamento de infraestrutura para a clínica <strong>${clinicName}</strong> foi concluído com sucesso. Sua licença sob o plano <strong>${selectedPlan}</strong> já está ativa.</p>
              
              <!-- Credentials Card -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-radius: 12px; margin: 24px 0; border: 1px solid #e2e8f0;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b;">Credenciais de Acesso</h3>
                    <p style="margin: 6px 0; font-size: 13px;"><strong style="color: #475569;">E-mail:</strong> ${adminEmail}</p>
                    <p style="margin: 6px 0; font-size: 13px;"><strong style="color: #475569;">Senha Temporária:</strong> <span style="background-color: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 12px; font-weight: bold; color: #0f172a;">${adminPassword}</span></p>
                    <p style="margin: 6px 0; font-size: 13px;"><strong style="color: #475569;">Identificador (Tenant):</strong> ${tenantId}</p>
                  </td>
                </tr>
              </table>

              <!-- Links -->
              <h3 style="font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 8px;">Acesse sua plataforma:</h3>
              <p style="font-size: 13px; margin: 4px 0;"><strong style="color: #475569;">Site da Clínica:</strong> <a href="${window.location.origin}/clinica/${tenantId}" style="color: #0284c7; text-decoration: none; font-weight: 600;">Abrir Site</a></p>
              <p style="font-size: 13px; margin: 4px 0; margin-bottom: 24px;"><strong style="color: #475569;">Painel de Gestão:</strong> <a href="${window.location.origin}/login?tenant=${tenantId}" style="color: #0284c7; text-decoration: none; font-weight: 600;">Entrar no Painel</a></p>

              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="${window.location.origin}/login?tenant=${tenantId}" style="background-color: #0284c7; color: #ffffff; display: inline-block; padding: 14px 32px; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 8px; box-shadow: 0 4px 12px rgba(2,132,199,0.25);">Acessar Painel de Gestão</a>
                  </td>
                </tr>
              </table>

              <p style="margin-top: 30px; font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.5;">* Por questões de segurança, recomendamos alterar sua senha no primeiro acesso à plataforma.<br>© MenteCare Software Médico e Clínico SaaS.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  };

  // State colors list
  const stateColors = [
    { name: 'Soft Blue (MenteCare)', value: '#0284c7' },
    { name: 'Deep Indigo', value: '#4f46e5' },
    { name: 'Sage Emerald', value: '#059669' },
    { name: 'Dusty Rose', value: '#e11d48' },
    { name: 'Warm Amber', value: '#b45309' },
    { name: 'Sleek Dark', value: '#1e293b' }
  ];

  return (
    <div className="min-h-screen bg-sand-50 flex items-center justify-center p-4 font-sans text-sand-950 relative overflow-hidden" id="print-section">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
        }
      `}} />

      {/* Ambient backgrounds */}
      <div className="absolute top-1/4 -left-32 w-[30rem] h-[30rem] rounded-full bg-softblue-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-[30rem] h-[30rem] rounded-full bg-sage-500/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-4xl bg-white p-6 sm:p-10 rounded-3xl border border-sand-200 shadow-xl space-y-8 relative z-10 my-8">
        
        {/* Header - Hidden on success */}
        {step < 5 && (
          <div className="flex flex-col sm:flex-row items-center justify-between border-b border-sand-100 pb-6 gap-4">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-softblue-600 to-dusty-500 flex items-center justify-center text-white font-serif font-black shadow-lg shadow-softblue-500/10">
                MC
              </div>
              <div className="flex flex-col text-left">
                <span className="font-serif font-black text-lg tracking-tight text-sand-950 leading-none">MenteCare</span>
                <span className="text-[9px] font-mono tracking-widest text-softblue-600 font-bold uppercase mt-0.5">Enterprise Setup Wizard</span>
              </div>
            </div>
            
            {/* Step indicators */}
            <div className="flex items-center gap-1.5 sm:gap-3">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className="flex items-center">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step === s 
                      ? 'bg-softblue-600 text-white ring-4 ring-softblue-100' 
                      : step > s 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-sand-100 text-sand-400 border border-sand-200'
                  }`}>
                    {step > s ? <Check size={14} /> : s}
                  </div>
                  {s < 4 && <div className={`w-4 sm:w-10 h-0.5 ml-1.5 sm:ml-3 ${step > s ? 'bg-emerald-500' : 'bg-sand-200'}`} />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Global Errors */}
        {error && (
          <div className="p-4 bg-rose-50 text-rose-800 rounded-2xl border border-rose-200 text-xs flex gap-3 items-start leading-relaxed">
            <AlertCircle size={18} className="shrink-0 text-rose-600 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold">Houve um problema durante a validação ou gravação:</span>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* STEP 1: Identification */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-serif font-black text-sand-900 flex items-center gap-2">
                <Building2 className="text-softblue-600" size={22} />
                <span>Passo 1 — Identificação da Clínica & Branding</span>
              </h2>
              <p className="text-xs text-sand-500 mt-1">Preencha os dados institucionais, localidade e o identificador único para o site de sua clínica.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[10px] font-bold uppercase text-sand-500 font-mono mb-1">Nome da Clínica *</label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-3 text-sand-400" size={16} />
                  <input
                    type="text"
                    required
                    value={clinicName}
                    onChange={(e) => handleClinicNameChange(e.target.value)}
                    placeholder="Ex: Clínica MenteCare Paulista"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-sand-200 focus:outline-none text-xs focus:border-softblue-500 bg-sand-50 text-sand-950 font-medium placeholder-sand-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-sand-500 font-mono mb-1">Nome do Responsável Técnico *</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 text-sand-400" size={16} />
                  <input
                    type="text"
                    required
                    value={professionalName}
                    onChange={(e) => handleProfessionalNameChange(e.target.value)}
                    placeholder="Ex: Dra. Roberta Silva"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-sand-200 focus:outline-none text-xs focus:border-softblue-500 bg-sand-50 text-sand-950 font-medium placeholder-sand-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-sand-500 font-mono mb-1">CRP (Conselho Regional de Psicologia) <span className="text-sand-400 font-normal">(Opcional)</span></label>
                <div className="relative">
                  <Briefcase className="absolute left-3.5 top-3 text-sand-400" size={16} />
                  <input
                    type="text"
                    value={crp}
                    onChange={(e) => setCrp(e.target.value)}
                    placeholder="Ex: 06/123456"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-sand-200 focus:outline-none text-xs focus:border-softblue-500 bg-sand-50 text-sand-950 font-medium placeholder-sand-400"
                  />
                </div>
                {crp && !validateCrp(crp) && (
                  <p className="text-[10px] text-rose-600 mt-1">Formato de CRP inválido. Use XX/XXXX ou apenas números.</p>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-sand-500 font-mono mb-1">CPF ou CNPJ do Titular *</label>
                <div className="relative">
                  <CreditCard className="absolute left-3.5 top-3 text-sand-400" size={16} />
                  <input
                    type="text"
                    required
                    value={cpfCnpj}
                    onChange={(e) => setCpfCnpj(e.target.value.replace(/[^\d]/g, ''))}
                    placeholder="Apenas números (11 ou 14 dígitos)"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-sand-200 focus:outline-none text-xs focus:border-softblue-500 bg-sand-50 text-sand-950 font-medium placeholder-sand-400"
                  />
                </div>
                {cpfCnpj && !validateCpfCnpj(cpfCnpj) && (
                  <p className="text-[10px] text-rose-600 mt-1">Insira um CPF válido (11 dígitos) ou CNPJ (14 dígitos).</p>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-sand-500 font-mono mb-1">Telefone Fixo / Celular *</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 text-sand-400" size={16} />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="Ex: (11) 98765-4321"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-sand-200 focus:outline-none text-xs focus:border-softblue-500 bg-sand-50 text-sand-950 font-medium placeholder-sand-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-sand-500 font-mono mb-1">WhatsApp de Contato *</label>
                <div className="relative">
                  <Send className="absolute left-3.5 top-3 text-sand-400" size={16} />
                  <input
                    type="tel"
                    required
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="Ex: (11) 98765-4321"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-sand-200 focus:outline-none text-xs focus:border-softblue-500 bg-sand-50 text-sand-950 font-medium placeholder-sand-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-sand-500 font-mono mb-1">E-mail Comercial *</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 text-sand-400" size={16} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    placeholder="Ex: contato@suaclinica.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-sand-200 focus:outline-none text-xs focus:border-softblue-500 bg-sand-50 text-sand-950 font-medium placeholder-sand-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-sand-500 font-mono mb-1">Cidade *</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 text-sand-400" size={14} />
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Ex: São Paulo"
                      className="w-full pl-8 pr-2 py-2.5 rounded-xl border border-sand-200 focus:outline-none text-xs focus:border-softblue-500 bg-sand-50 text-sand-950 font-medium placeholder-sand-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-sand-500 font-mono mb-1">Estado *</label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="Ex: SP"
                    maxLength={2}
                    className="w-full px-3 py-2.5 rounded-xl border border-sand-200 focus:outline-none text-xs focus:border-softblue-500 bg-sand-50 text-sand-950 font-medium placeholder-sand-400 uppercase"
                  />
                </div>
              </div>

              {/* Logo and branding */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-sand-500 font-mono mb-1">Logotipo URL <span className="text-sand-400 font-normal">(Opcional)</span></label>
                <div className="relative">
                  <Globe className="absolute left-3.5 top-3 text-sand-400" size={16} />
                  <input
                    type="url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="Ex: https://suaclinica.com/logo.png"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-sand-200 focus:outline-none text-xs focus:border-softblue-500 bg-sand-50 text-sand-950 font-medium placeholder-sand-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-sand-500 font-mono mb-1">Cor Principal de Branding *</label>
                <div className="flex gap-2 items-center">
                  <div className="relative shrink-0">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-10 h-10 rounded-xl border border-sand-200 cursor-pointer overflow-hidden"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {stateColors.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setPrimaryColor(c.value)}
                        className={`h-6 w-6 rounded-full border transition-all ${
                          primaryColor === c.value ? 'ring-2 ring-softblue-500 border-white' : 'border-sand-200'
                        }`}
                        style={{ backgroundColor: c.value }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Tenant and Subdomain */}
              <div className="md:col-span-2 bg-sand-100 p-5 rounded-2xl border border-sand-200 space-y-4">
                <div className="flex items-center gap-2">
                  <Globe className="text-softblue-600" size={18} />
                  <h4 className="font-serif font-black text-xs text-sand-900 uppercase tracking-wide">Endereço Web e Isolamento (Tenant ID)</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-sand-500 font-mono mb-1">ID da URL (Tenant ID) *</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3 text-sand-400 font-mono text-xs font-bold">@</span>
                      <input
                        type="text"
                        required
                        value={tenantId}
                        onChange={(e) => handleTenantIdChange(e.target.value)}
                        placeholder="Ex: dralarissa"
                        className="w-full pl-8 pr-12 py-2.5 rounded-xl border border-sand-200 focus:outline-none text-xs focus:border-softblue-500 bg-white text-sand-950 font-mono font-bold"
                      />
                      {checkingTenant && (
                        <RefreshCw className="animate-spin absolute right-3.5 top-3 text-softblue-600" size={14} />
                      )}
                    </div>
                    {tenantError ? (
                      <p className="text-[10px] text-rose-600 font-bold mt-1">{tenantError}</p>
                    ) : tenantId && !checkingTenant ? (
                      <p className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                        <CheckCircle2 size={10} /> Identificador disponível!
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-sand-500 font-mono mb-1">Subdomínio Provisório *</label>
                    <div className="relative">
                      <input
                        type="text"
                        readOnly
                        value={subdomain}
                        className="w-full px-4 py-2.5 rounded-xl border border-sand-200 bg-sand-200 text-sand-600 text-xs font-mono font-bold focus:outline-none cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end pt-4">
              <button
                type="button"
                disabled={!isStep1Valid()}
                onClick={() => setStep(2)}
                className="px-6 py-3 bg-softblue-600 hover:bg-softblue-700 disabled:bg-sand-300 disabled:text-sand-400 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-softblue-500/10 hover:shadow-lg cursor-pointer"
              >
                <span>Avançar para Planos</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Plan Selection */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-serif font-black text-sand-900 flex items-center gap-2">
                <CreditCard className="text-softblue-600" size={22} />
                <span>Passo 2 — Seleção de Plano de Licenciamento</span>
              </h2>
              <p className="text-xs text-sand-500 mt-1">Escolha a escala ideal de usuários, faturamento e recursos inteligentes para o seu negócio.</p>
            </div>

            {/* Side-by-side table/cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {plans.map((p) => {
                const isSelected = selectedPlan === p.id;
                return (
                  <div 
                    key={p.id}
                    onClick={() => setSelectedPlan(p.id as SaaSPlanId)}
                    className={`p-5 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer text-left relative ${
                      isSelected 
                        ? 'border-softblue-600 bg-softblue-50/50 ring-2 ring-softblue-500/20 shadow-lg' 
                        : 'border-sand-200 bg-white hover:bg-sand-50 hover:shadow-md'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-softblue-600 text-white font-mono text-[9px] font-bold rounded-full uppercase tracking-wider">
                        Selecionado
                      </span>
                    )}

                    <div className="space-y-3">
                      <div>
                        <h4 className="font-serif font-black text-sand-950 text-sm">{p.name}</h4>
                        <p className="text-[10px] text-sand-500 mt-0.5 min-h-[30px] leading-snug">{p.desc}</p>
                      </div>

                      <div className="border-t border-b border-sand-100 py-2.5">
                        <span className="text-2xl font-serif font-black text-softblue-950">{p.price}</span>
                        <span className="text-[10px] text-sand-500 font-mono font-bold">/mês</span>
                      </div>

                      <ul className="space-y-1.5 text-[10px] text-sand-700 font-medium leading-relaxed">
                        <li className="flex items-center gap-1.5">
                          <Check size={11} className="text-emerald-600" />
                          <span>{p.users}</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Check size={11} className="text-emerald-600" />
                          <span>{p.patients}</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Check size={11} className="text-emerald-600" />
                          <span>Financeiro: {p.finance}</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          {p.portal ? (
                            <Check size={11} className="text-emerald-600" />
                          ) : (
                            <span className="text-sand-400 font-bold">✕</span>
                          )}
                          <span className={p.portal ? '' : 'text-sand-400 font-normal line-through'}>Portal do Paciente</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          {p.crm ? (
                            <Check size={11} className="text-emerald-600" />
                          ) : (
                            <span className="text-sand-400 font-bold">✕</span>
                          )}
                          <span className={p.crm ? '' : 'text-sand-400 font-normal line-through'}>CRM e Funis</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          {p.ia ? (
                            <Check size={11} className="text-emerald-600" />
                          ) : (
                            <span className="text-sand-400 font-bold">✕</span>
                          )}
                          <span className={p.ia ? '' : 'text-sand-400 font-normal line-through'}>MenteCare AI</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          {p.whatsapp ? (
                            <Check size={11} className="text-emerald-600" />
                          ) : (
                            <span className="text-sand-400 font-bold">✕</span>
                          )}
                          <span className={p.whatsapp ? '' : 'text-sand-400 font-normal line-through'}>Notificações WhatsApp</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Trial period selection */}
            <div className="bg-sand-100 p-5 rounded-2xl border border-sand-200 space-y-3">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="text-softblue-600" size={16} />
                <label className="text-[10px] font-bold uppercase text-sand-500 font-mono">Período de Demonstração (Trial Period)</label>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: '7', label: '7 Dias Grátis' },
                  { id: '15', label: '15 Dias Grátis' },
                  { id: '30', label: '30 Dias Grátis' },
                  { id: '0', label: 'Sem Teste (Ativar Direto)' }
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTrialPeriod(t.id as any)}
                    className={`p-3 rounded-xl border text-center transition-all font-mono text-xs font-bold cursor-pointer ${
                      trialPeriod === t.id 
                        ? 'border-softblue-600 bg-white ring-2 ring-softblue-500/10 text-softblue-950' 
                        : 'border-sand-200 bg-sand-50 hover:bg-sand-150 text-sand-600'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-4 border-t border-sand-100">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-2.5 border border-sand-200 hover:bg-sand-50 text-sand-600 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Voltar</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-6 py-3 bg-softblue-600 hover:bg-softblue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-softblue-500/10 hover:shadow-lg cursor-pointer"
              >
                <span>Avançar para Admin</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Admin Configuration */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-serif font-black text-sand-900 flex items-center gap-2">
                <ShieldCheck className="text-softblue-600" size={22} />
                <span>Passo 3 — Configurar Administrador Principal</span>
              </h2>
              <p className="text-xs text-sand-500 mt-1">Crie as credenciais seguras de login do administrador titular de sua clínica.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[10px] font-bold uppercase text-sand-500 font-mono mb-1">Nome Administrativo *</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 text-sand-400" size={16} />
                  <input
                    type="text"
                    required
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="Ex: Dra. Roberta Silva"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-sand-200 focus:outline-none text-xs focus:border-softblue-500 bg-sand-50 text-sand-950 font-medium placeholder-sand-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-sand-500 font-mono mb-1">E-mail de Login *</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 text-sand-400" size={16} />
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="Ex: roberta.admin@clinica.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-sand-200 focus:outline-none text-xs focus:border-softblue-500 bg-sand-50 text-sand-950 font-medium placeholder-sand-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-sand-500 font-mono mb-1">Senha de Acesso *</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 text-sand-400" size={16} />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    disabled={autoGeneratePassword}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-10 pr-12 py-2.5 rounded-xl border border-sand-200 focus:outline-none text-xs focus:border-softblue-500 bg-sand-50 text-sand-950 font-medium placeholder-sand-400 disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-sand-400 hover:text-sand-600"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {adminPassword && adminPassword.length < 6 && (
                  <p className="text-[10px] text-rose-600 mt-1">A senha deve conter no mínimo 6 caracteres para garantir conformidade legal.</p>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-sand-500 font-mono mb-1">Confirmar Senha de Acesso *</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 text-sand-400" size={16} />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    disabled={autoGeneratePassword}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirme sua senha"
                    className="w-full pl-10 pr-12 py-2.5 rounded-xl border border-sand-200 focus:outline-none text-xs focus:border-softblue-500 bg-sand-50 text-sand-950 font-medium placeholder-sand-400 disabled:opacity-60"
                  />
                </div>
                {confirmPassword && adminPassword !== confirmPassword && (
                  <p className="text-[10px] text-rose-600 mt-1">As senhas informadas não coincidem.</p>
                )}
              </div>

              {/* Password controls */}
              <div className="md:col-span-2 bg-sand-100 p-5 rounded-2xl border border-sand-200 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-sand-900 block">Gerar senha segura automaticamente</span>
                    <span className="text-[10px] text-sand-500">Cria uma senha de alta entropia para evitar ataques e vazamentos.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoGeneratePassword}
                    onChange={(e) => setAutoGeneratePassword(e.target.checked)}
                    className="h-4 w-4 text-softblue-600 border-sand-300 rounded focus:ring-softblue-500"
                  />
                </div>

                {autoGeneratePassword && (
                  <div className="flex gap-2 items-center bg-white p-3 rounded-xl border border-sand-200 justify-between">
                    <span className="font-mono text-xs font-bold text-softblue-950 bg-sand-100 px-3 py-1.5 rounded-lg select-all">
                      {adminPassword}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(adminPassword);
                        alert('Senha copiada com sucesso!');
                      }}
                      className="px-3 py-1.5 bg-softblue-100 text-softblue-700 hover:bg-softblue-200 text-[10px] font-bold rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                      <Clipboard size={12} />
                      <span>Copiar</span>
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-sand-200/60 pt-3">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-sand-900 block">Forçar troca de senha no primeiro acesso</span>
                    <span className="text-[10px] text-sand-500">Obrigatório pela LGPD e melhores práticas corporativas de segurança.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={forcePasswordChange}
                    onChange={(e) => setForcePasswordChange(e.target.checked)}
                    className="h-4 w-4 text-softblue-600 border-sand-300 rounded focus:ring-softblue-500"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-4 border-t border-sand-100">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-2.5 border border-sand-200 hover:bg-sand-50 text-sand-600 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Voltar</span>
              </button>
              <button
                type="button"
                disabled={!isStep3Valid()}
                onClick={() => setStep(4)}
                className="px-6 py-3 bg-softblue-600 hover:bg-softblue-700 disabled:bg-sand-300 disabled:text-sand-400 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-softblue-500/10 hover:shadow-lg cursor-pointer"
              >
                <span>Avançar para Resumo</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Summary / Provisioning */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-serif font-black text-sand-900 flex items-center gap-2">
                <Check className="text-softblue-600" size={22} />
                <span>Passo 4 — Resumo de Provisionamento e Execução</span>
              </h2>
              <p className="text-xs text-sand-500 mt-1">Valide todos os parâmetros de dados informados antes de prosseguir com a gravação.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 border-t border-sand-150 pt-4">
              
              {/* Summary Details */}
              <div className="space-y-4">
                <div className="bg-sand-100 p-5 rounded-2xl border border-sand-200 space-y-3.5">
                  <h4 className="font-serif font-black text-xs text-sand-950 uppercase tracking-wide">Dados da Clínica</h4>
                  <div className="space-y-2 text-xs">
                    <p className="flex justify-between"><span className="text-sand-500 font-bold uppercase text-[9px] font-mono mt-0.5">Clínica:</span> <span className="font-bold text-sand-900">{clinicName}</span></p>
                    <p className="flex justify-between"><span className="text-sand-500 font-bold uppercase text-[9px] font-mono mt-0.5">Responsável:</span> <span className="font-bold text-sand-900">{professionalName}</span></p>
                    <p className="flex justify-between"><span className="text-sand-500 font-bold uppercase text-[9px] font-mono mt-0.5">E-mail:</span> <span className="font-bold text-sand-900">{email}</span></p>
                    <p className="flex justify-between"><span className="text-sand-500 font-bold uppercase text-[9px] font-mono mt-0.5">Localização:</span> <span className="font-bold text-sand-900">{city} - {state}</span></p>
                    <p className="flex justify-between"><span className="text-sand-500 font-bold uppercase text-[9px] font-mono mt-0.5">ID Tenant:</span> <span className="font-mono font-bold text-softblue-700">{tenantId}</span></p>
                    <p className="flex justify-between"><span className="text-sand-500 font-bold uppercase text-[9px] font-mono mt-0.5">Subdomínio:</span> <span className="font-mono font-bold text-softblue-700">{subdomain}</span></p>
                  </div>
                </div>

                <div className="bg-sand-100 p-5 rounded-2xl border border-sand-200 space-y-3.5">
                  <h4 className="font-serif font-black text-xs text-sand-950 uppercase tracking-wide">Plano & Licença</h4>
                  <div className="space-y-2 text-xs">
                    <p className="flex justify-between"><span className="text-sand-500 font-bold uppercase text-[9px] font-mono mt-0.5">Plano Selecionado:</span> <span className="font-bold text-softblue-700 uppercase font-mono">{selectedPlan}</span></p>
                    <p className="flex justify-between"><span className="text-sand-500 font-bold uppercase text-[9px] font-mono mt-0.5">Valor do Plano:</span> <span className="font-serif font-black text-sand-950">{getPlanPriceValue()}/mês</span></p>
                    <p className="flex justify-between"><span className="text-sand-500 font-bold uppercase text-[9px] font-mono mt-0.5">Período de Teste:</span> <span className="font-bold text-sand-900">{trialPeriod === '0' ? 'Sem Teste' : `${trialPeriod} Dias`}</span></p>
                    <p className="flex justify-between"><span className="text-sand-500 font-bold uppercase text-[9px] font-mono mt-0.5">Data de Expiração:</span> <span className="font-bold text-sand-900 font-mono">{new Date(Date.now() + (trialPeriod === '0' ? 365 : parseInt(trialPeriod)) * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}</span></p>
                  </div>
                </div>
              </div>

              {/* Progress Tracker / Submit button */}
              <div className="bg-sand-50 p-5 rounded-2xl border border-sand-250 flex flex-col justify-between gap-5">
                <div className="space-y-3.5">
                  <h4 className="font-serif font-black text-xs text-sand-950 uppercase tracking-wide">Provisionamento em Tempo Real</h4>
                  
                  <div className="space-y-2.5">
                    {provisionProgress.map((p, i) => (
                      <div key={i} className="flex items-center gap-2.5 text-xs text-sand-700 font-medium">
                        <div className="shrink-0">
                          {p.status === 'pending' && (
                            <div className="h-4 w-4 rounded-full border border-sand-300 bg-white" />
                          )}
                          {p.status === 'loading' && (
                            <RefreshCw className="animate-spin text-softblue-600 h-4 w-4" />
                          )}
                          {p.status === 'done' && (
                            <CheckCircle2 className="text-emerald-500 h-4 w-4" />
                          )}
                          {p.status === 'error' && (
                            <AlertCircle className="text-rose-600 h-4 w-4" />
                          )}
                        </div>
                        <span className={p.status === 'done' ? 'text-sand-500 line-through' : p.status === 'loading' ? 'text-softblue-700 font-bold' : ''}>
                          {p.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {!loading ? (
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={handleProvisioning}
                      className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 hover:shadow-xl transition-all cursor-pointer"
                    >
                      <CheckCircle2 size={16} />
                      <span>Confirmar & Criar Cliente</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="w-full py-2.5 border border-sand-200 hover:bg-sand-100 text-sand-600 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <ArrowLeft size={14} />
                      <span>Voltar para Ajustes</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-4 space-y-2">
                    <RefreshCw className="animate-spin text-softblue-600 mx-auto h-7 w-7" />
                    <p className="text-xs text-sand-500 font-bold">Por favor, aguarde enquanto provisionamos de forma segura toda a sua estrutura corporativa...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Success Screen */}
        {step === 5 && (
          <div className="space-y-8" id="print-area">
            
            {/* Header Success info */}
            <div className="text-center space-y-3 max-w-xl mx-auto">
              <div className="inline-flex h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full items-center justify-center shadow-md animate-pulse">
                <CheckCircle2 size={36} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-black text-sand-900 tracking-tight">Clínica Provisionada com Sucesso!</h1>
              <p className="text-xs text-sand-500 leading-normal">
                Sua infraestrutura de dados foi criada de forma 100% segura e isolada. Os documentos de tenants, licenças e CMS já foram gerados.
              </p>
            </div>

            {/* Success Details Card */}
            <div className="bg-sand-100 p-6 sm:p-8 rounded-3xl border border-sand-250 grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-4">
                <h3 className="font-serif font-black text-sm text-sand-950 uppercase tracking-wide border-b border-sand-200 pb-2">Informações da Clínica</h3>
                <div className="space-y-2.5 text-xs">
                  <p className="flex justify-between"><span className="text-sand-500 font-bold font-mono">Clínica:</span> <span className="font-bold text-sand-900">{clinicName}</span></p>
                  <p className="flex justify-between"><span className="text-sand-500 font-bold font-mono">Titular:</span> <span className="font-bold text-sand-900">{professionalName}</span></p>
                  <p className="flex justify-between"><span className="text-sand-500 font-bold font-mono">Plano Ativo:</span> <span className="font-bold text-emerald-600 uppercase font-mono">{selectedPlan}</span></p>
                  <p className="flex justify-between"><span className="text-sand-500 font-bold font-mono">Tenant ID:</span> <span className="font-bold text-sand-900 font-mono">{tenantId}</span></p>
                  <p className="flex justify-between"><span className="text-sand-500 font-bold font-mono">Subdomínio:</span> <span className="font-bold text-sand-900 font-mono">{subdomain}</span></p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-serif font-black text-sm text-sand-950 uppercase tracking-wide border-b border-sand-200 pb-2">Credenciais do Administrador</h3>
                <div className="space-y-2.5 text-xs">
                  <p className="flex justify-between"><span className="text-sand-500 font-bold font-mono">E-mail:</span> <span className="font-bold text-sand-900">{adminEmail}</span></p>
                  <p className="flex justify-between">
                    <span className="text-sand-500 font-bold font-mono">Senha Temporária:</span> 
                    <span className="font-mono font-bold text-softblue-700 bg-white px-2 py-0.5 rounded border border-sand-200 select-all">{adminPassword}</span>
                  </p>
                  <p className="text-[10px] text-sand-500 leading-tight">Por segurança corporativa, a senha de provisionamento é exibida apenas uma vez nesta tela e não é gravada em texto puro no banco de dados.</p>
                </div>
              </div>

              {/* Links display */}
              <div className="md:col-span-2 bg-white p-5 rounded-2xl border border-sand-200 space-y-3.5">
                <h4 className="font-serif font-black text-xs text-sand-950 uppercase tracking-wide">Endereços Web Gerados</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 bg-sand-50 p-2.5 rounded-xl border border-sand-150">
                    <div>
                      <span className="text-[10px] text-sand-400 font-bold block uppercase font-mono">Site Institucional Público</span>
                      <a href={`${window.location.origin}/clinica/${tenantId}`} target="_blank" rel="noreferrer" className="font-mono text-softblue-700 font-bold hover:underline select-all">
                        {window.location.origin}/clinica/{tenantId}
                      </a>
                    </div>
                    <button
                      type="button"
                      onClick={() => window.open(`${window.location.origin}/clinica/${tenantId}`, '_blank')}
                      className="px-3 py-1.5 bg-softblue-50 text-softblue-600 font-bold text-[10px] rounded-lg hover:bg-softblue-100 transition-colors uppercase no-print"
                    >
                      Acessar Site
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 bg-sand-50 p-2.5 rounded-xl border border-sand-150">
                    <div>
                      <span className="text-[10px] text-sand-400 font-bold block uppercase font-mono">Painel de Gestão Clínica</span>
                      <a href={`${window.location.origin}/login?tenant=${tenantId}`} target="_blank" rel="noreferrer" className="font-mono text-softblue-700 font-bold hover:underline select-all">
                        {window.location.origin}/login?tenant={tenantId}
                      </a>
                    </div>
                    <button
                      type="button"
                      onClick={() => window.open(`${window.location.origin}/login?tenant=${tenantId}`, '_blank')}
                      className="px-3 py-1.5 bg-softblue-50 text-softblue-600 font-bold text-[10px] rounded-lg hover:bg-softblue-100 transition-colors uppercase no-print"
                    >
                      Acessar Painel
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Success Buttons Action bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 no-print pt-4 border-t border-sand-100">
              <button
                type="button"
                onClick={copyCredentials}
                className="p-3.5 bg-sand-100 hover:bg-sand-200 border border-sand-250 text-sand-700 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Clipboard size={14} />
                <span>📋 Copiar Credenciais</span>
              </button>

              <button
                type="button"
                onClick={copyLinks}
                className="p-3.5 bg-sand-100 hover:bg-sand-200 border border-sand-250 text-sand-700 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Globe size={14} />
                <span>📋 Copiar Links</span>
              </button>

              <button
                type="button"
                onClick={() => setShowEmailPreview(true)}
                className="p-3.5 bg-sand-100 hover:bg-sand-200 border border-sand-250 text-sand-700 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Mail size={14} />
                <span>📧 Enviar por E-mail</span>
              </button>

              <button
                type="button"
                onClick={sendWhatsApp}
                className="p-3.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Send size={14} />
                <span>📱 Enviar WhatsApp</span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={regeneratePassword}
                className="p-3.5 bg-amber-50 hover:bg-amber-100 border border-amber-250 text-amber-700 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={loading ? 'animate-spin' : ''} size={14} />
                <span>🔄 Gerar Nova Senha</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="p-3.5 bg-softblue-50 hover:bg-softblue-100 border border-softblue-200 text-softblue-700 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Printer size={14} />
                <span>🖨 Imprimir</span>
              </button>
            </div>

            {/* Back button to dashboard */}
            <div className="flex justify-center pt-4 no-print border-t border-sand-100">
              <button
                type="button"
                onClick={() => navigate('/admin/dashboard')}
                className="px-8 py-3.5 bg-softblue-600 hover:bg-softblue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-softblue-500/10 hover:shadow-lg cursor-pointer"
              >
                Entrar no Painel Administrativo agora
              </button>
            </div>
          </div>
        )}
      </div>

      {/* EMAIL PREVIEW MODAL */}
      {showEmailPreview && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto no-print">
          <div className="bg-white rounded-3xl border border-sand-200 shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-sand-100 pb-3">
              <h3 className="font-serif font-black text-base text-sand-900">📧 Visualizador de E-mail de Provisionamento</h3>
              <button
                onClick={() => setShowEmailPreview(false)}
                className="text-sand-400 hover:text-sand-600 text-sm font-bold cursor-pointer"
              >
                Fechar
              </button>
            </div>

            <p className="text-xs text-sand-500">
              Este é o modelo de e-mail HTML profissional que você pode copiar para o seu CRM ou enviar por e-mail para o cliente.
            </p>

            {/* Mock Mail client wrapper */}
            <div className="border border-sand-200 rounded-2xl overflow-hidden bg-sand-50 text-xs text-sand-900">
              <div className="bg-sand-200 p-3 border-b border-sand-250 font-mono text-[10px] space-y-1">
                <p><strong>De:</strong> MenteCare &lt;no-reply@mentecare.com.br&gt;</p>
                <p><strong>Para:</strong> {adminEmail}</p>
                <p><strong>Assunto:</strong> Sua Clínica está pronta no MenteCare!</p>
              </div>
              <div className="p-4 bg-white max-h-[300px] overflow-y-auto">
                <div dangerouslySetInnerHTML={{ __html: getEmailHtml() }} />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(getEmailHtml());
                  alert('HTML do e-mail copiado para a área de transferência!');
                }}
                className="flex-1 py-3 bg-softblue-600 hover:bg-softblue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Clipboard size={14} />
                <span>Copiar Código HTML</span>
              </button>

              <a
                href={`mailto:${adminEmail}?subject=${encodeURIComponent('Sua Clínica está pronta no MenteCare!')}&body=${encodeURIComponent(
                  `Olá ${adminName}!\n\nSua clínica ${clinicName} foi provisionada com sucesso no MenteCare.\n\nSuas credenciais de login:\nE-mail: ${adminEmail}\nSenha Temporária: ${adminPassword}\nTenant ID: ${tenantId}\n\nSite Público: ${window.location.origin}/clinica/${tenantId}\nPainel de Gestão: ${window.location.origin}/login?tenant=${tenantId}\n\nNo seu primeiro acesso, solicitaremos que troque sua senha temporária.\n\nAtenciosamente,\nEquipe MenteCare.`
                )}`}
                className="flex-1 py-3 border border-sand-200 hover:bg-sand-50 text-sand-700 font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition-colors text-center"
              >
                <Mail size={14} />
                <span>Enviar via Cliente Local</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
