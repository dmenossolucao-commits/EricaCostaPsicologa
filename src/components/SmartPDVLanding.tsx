import React, { useState } from 'react';
import { 
  ArrowRight, ShieldCheck, Sparkles, DollarSign, 
  Globe, FileText, Users, Layers, Video, Smartphone, HardDrive, 
  Check, Lock, Activity, ChevronDown, CheckCircle2, Star, Menu, X,
  TrendingUp, ShoppingCart, Package, HeartHandshake, ShieldAlert, BadgeCheck, HelpCircle, Laptop
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SmartPDVLandingProps {
  navigate: (to: string) => void;
}

export default function SmartPDVLanding({ navigate }: SmartPDVLandingProps) {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [simulatedCart, setSimulatedCart] = useState<any[]>([
    { id: 1, name: "Produto Exemplo A", qty: 2, price: 45.00 },
    { id: 2, name: "Serviço Adicional B", qty: 1, price: 120.00 }
  ]);
  const [simulatedDiscount, setSimulatedDiscount] = useState<number>(10);
  const [isDemoPaid, setIsDemoPaid] = useState<boolean>(false);

  const features = [
    {
      icon: <ShoppingCart className="text-blue-600" size={24} />,
      title: "PDV de Alta Performance",
      description: "Interface ultrarrápida projetada para checkout instantâneo. Emissão fiscal automática, suporte a múltiplos caixas e vendas em contingência."
    },
    {
      icon: <Package className="text-blue-600" size={24} />,
      title: "Estoque Inteligente",
      description: "Gerenciamento em tempo real com alertas de estoque mínimo, sugestões automatizadas de compra e controle avançado de lotes e validades."
    },
    {
      icon: <DollarSign className="text-blue-600" size={24} />,
      title: "Financeiro & Fluxo de Caixa",
      description: "Controle absoluto de contas a pagar/receber, conciliação bancária nativa, relatórios DRE estruturados e cobranças em lote."
    },
    {
      icon: <Users className="text-blue-600" size={24} />,
      title: "CRM & Fidelização de Clientes",
      description: "Histórico completo de consumo, réguas de relacionamento automatizadas, clubes de pontos de fidelidade e cashback integrado."
    },
    {
      icon: <Layers className="text-blue-600" size={24} />,
      title: "Arquitetura Multiempresa SaaS",
      description: "Controle todas as suas filiais ou marcas em uma única interface master, garantindo total isolamento de dados e cache independente por tenant."
    },
    {
      icon: <Sparkles className="text-blue-600" size={24} />,
      title: "IA Preditiva de Demanda",
      description: "Algoritmos inteligentes baseados em aprendizado de máquina que preveem tendências de consumo e otimizam seu estoque futuro."
    },
    {
      icon: <ShieldCheck className="text-blue-600" size={24} />,
      title: "Segurança de Nível Bancário",
      description: "Criptografia de ponta a ponta, backups incrementais a cada hora, autenticação multifator (2FA) e trilha de auditoria completa (LGPD)."
    },
    {
      icon: <Smartphone className="text-blue-600" size={24} />,
      title: "Plataforma Omnichannel",
      description: "Acesse e gerencie suas operações de qualquer lugar: computadores desktop, terminais dedicados de PDV, tablets e celulares."
    }
  ];

  const plans = [
    {
      name: "Professional",
      price: "R$ 89",
      period: "/mês",
      description: "Essencial para pequenos lojistas e profissionais autônomos.",
      features: [
        "1 Usuário / Operador",
        "Até 500 Clientes Cadastrados",
        "PDV de Vendas Completo",
        "Controle de Estoque Básico",
        "Financeiro Simplificado",
        "Suporte por E-mail",
        "Backups Diários"
      ],
      popular: false,
      buttonText: "Iniciar Teste Grátis"
    },
    {
      name: "Corporate Pro",
      price: "R$ 179",
      period: "/mês",
      description: "Completo para comércios em expansão com múltiplos caixas.",
      features: [
        "Até 3 Usuários / Operadores",
        "Clientes Ilimitados",
        "PDV Multi-Caixa Sincronizado",
        "Estoque Inteligente + Alertas",
        "Financeiro & DRE Completo",
        "CRM & Regras de Cashback",
        "Suporte por WhatsApp (12h)",
        "API Pública Integrada"
      ],
      popular: true,
      buttonText: "Escolher Pro"
    },
    {
      name: "Enterprise Multi",
      price: "R$ 349",
      period: "/mês",
      description: "Sob medida para redes de lojas, franquias e corporações.",
      features: [
        "Até 10 Usuários Administrativos",
        "Operadores Ilimitados",
        "Arquitetura Multiempresa Ativa",
        "Módulo de Produção / Fichas Técnicas",
        "IA Preditiva de Demanda",
        "Log de Auditoria SaaS",
        "Suporte Prioritário 24/7 SLA",
        "Integração White-label Parcial"
      ],
      popular: false,
      buttonText: "Escolher Enterprise"
    },
    {
      name: "Unlimited Suite",
      price: "R$ 699",
      period: "/mês",
      description: "Para grandes corporações que exigem customização máxima.",
      features: [
        "Usuários Ilimitados",
        "Empresas / Filiais Ilimitadas",
        "Todos os Recursos Ativos",
        "Faturamento & Notas Ilimitados",
        "Gerente de Conta Dedicado",
        "Implantação Guiada Premium",
        "Contrato de Nível de Serviço (SLA)",
        "White-label Completo (Domínio Próprio)"
      ],
      popular: false,
      buttonText: "Falar com Consultor"
    }
  ];

  const testimonials = [
    {
      name: "Ricardo Mendes",
      role: "Diretor Comercial - Redes Atacado Forte",
      stars: 5,
      text: "A migração para o SmartPDV mudou de patamar as nossas 6 filiais. O isolamento de faturamento e estoque de cada filial é 100% estanque, e o painel consolidado da matriz nos dá números exatos em tempo real."
    },
    {
      name: "Daniela Soares",
      role: "Proprietária - Delícias Gourmet",
      stars: 5,
      text: "Eu usava planilhas e sempre perdia dinheiro com vencimento de estoque. O SmartPDV me avisa com antecedência, gerencia minhas fichas técnicas de panificação e o faturamento via PIX QR Code funciona que é uma beleza!"
    },
    {
      name: "Marcos Vinícius",
      role: "Gestor de Tecnologia - Grupo Sul Franquias",
      stars: 5,
      text: "O grande diferencial é a integridade. A sessão isola as filiais de forma nativa e segura, os operadores não conseguem acessar dados fiscais das outras marcas, o que nos blinda juridicamente em relação à LGPD."
    }
  ];

  const faqs = [
    {
      q: "O SmartPDV V5.0 suporta controle multiempresa de verdade?",
      a: "Sim, absolutamente! Desenvolvido sob uma robusta arquitetura multitenant isolada, o SmartPDV permite criar e gerenciar múltiplas filiais ou empresas independentes dentro de uma mesma conta. Cada tenant possui seu próprio banco de dados, estoque, regras fiscais, operadores e relatórios totalmente lacrados, evitando vazamento ou mistura de informações."
    },
    {
      q: "Como funciona a segurança e o controle de operadores no PDV?",
      a: "O sistema elimina completamente operadores e contas genéricas ou fictícias. Toda e qualquer ação de abertura de caixa, registro de vendas, descontos ou cancelamentos é autenticada eletronicamente através do Firebase Auth e vinculada estritamente ao CPF/UID e nome do operador ativo, gravando registros de auditoria à prova de fraudes."
    },
    {
      q: "O PDV funciona mesmo se a internet oscilar ou cair?",
      a: "Sim. O SmartPDV Enterprise possui tecnologia offline híbrida resiliente. Caso ocorra queda de conectividade, o PDV local mantém as vendas abertas e os registros ativos em cache local criptografado. Assim que a rede é restabelecida, a sincronização com o banco de dados do Firebase Firestore ocorre automaticamente de forma transparente."
    },
    {
      q: "Posso utilizar minha própria marca e domínio personalizado?",
      a: "No plano Unlimited Suite, fornecemos suporte nativo a White-Label. Isso significa que você pode configurar o sistema de faturamento para rodar sob o seu próprio domínio (exemplo: erp.suamarca.com.br) com sua logo, cores e assinatura institucional."
    }
  ];

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  const simulatedTotal = simulatedCart.reduce((acc, curr) => acc + (curr.qty * curr.price), 0);
  const simulatedFinal = Math.max(0, simulatedTotal - simulatedDiscount);

  return (
    <div className="bg-[#f8fafc] min-h-screen font-sans flex flex-col justify-between text-slate-900 leading-normal">
      
      {/* Dynamic Header */}
      <nav id="landing-nav" className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            
            {/* Logo */}
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => scrollToSection('landing-hero')}>
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white font-sans font-black shadow-lg shadow-blue-200">
                SP
              </div>
              <div className="flex flex-col">
                <span className="font-sans font-black text-lg sm:text-xl tracking-tight text-slate-950">SmartPDV</span>
                <span className="text-[10px] font-mono tracking-widest text-blue-600 font-bold uppercase -mt-1">Enterprise V5.0</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <button onClick={() => scrollToSection('landing-features')} className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors cursor-pointer">Recursos</button>
              <button onClick={() => scrollToSection('landing-demo')} className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors cursor-pointer">Demonstração</button>
              <button onClick={() => scrollToSection('landing-plans')} className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors cursor-pointer">Planos</button>
              <button onClick={() => scrollToSection('landing-testimonials')} className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors cursor-pointer">Clientes</button>
              <button onClick={() => scrollToSection('landing-faq')} className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors cursor-pointer">Ajuda</button>
            </div>

            {/* Action Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <button 
                onClick={() => navigate('/login')}
                className="px-5 py-2.5 rounded-xl border border-slate-300 hover:border-slate-400 text-slate-800 text-sm font-bold transition-all hover:bg-slate-50 cursor-pointer"
              >
                Entrar
              </button>
              <button 
                onClick={() => navigate('/cadastro')}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-all shadow-md shadow-blue-100 hover:shadow-lg hover:shadow-blue-200 cursor-pointer"
              >
                Criar Conta
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-xl text-slate-600 hover:text-slate-900 focus:outline-none"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Dropdown Panel */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-slate-200 bg-white"
            >
              <div className="px-4 py-6 space-y-4 flex flex-col">
                <button onClick={() => scrollToSection('landing-features')} className="text-left text-sm font-bold text-slate-700">Recursos</button>
                <button onClick={() => scrollToSection('landing-demo')} className="text-left text-sm font-bold text-slate-700">Demonstração</button>
                <button onClick={() => scrollToSection('landing-plans')} className="text-left text-sm font-bold text-slate-700">Planos</button>
                <button onClick={() => scrollToSection('landing-testimonials')} className="text-left text-sm font-bold text-slate-700">Clientes</button>
                <button onClick={() => scrollToSection('landing-faq')} className="text-left text-sm font-bold text-slate-700">Ajuda</button>
                <hr className="border-slate-200" />
                <div className="flex gap-4">
                  <button onClick={() => navigate('/login')} className="w-1/2 py-3 rounded-xl border border-slate-300 text-slate-800 text-sm font-bold text-center">Entrar</button>
                  <button onClick={() => navigate('/cadastro')} className="w-1/2 py-3 rounded-xl bg-blue-600 text-white text-sm font-bold text-center">Criar Conta</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section id="landing-hero" className="relative py-16 sm:py-24 overflow-hidden bg-slate-50 border-b border-slate-200">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none">
          <div className="absolute top-10 left-10 w-96 h-96 rounded-full bg-blue-400/10 blur-[100px]" />
          <div className="absolute bottom-10 right-10 w-[30rem] h-[30rem] rounded-full bg-indigo-500/10 blur-[120px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Hero Content */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold tracking-wide uppercase">
                <Sparkles size={13} />
                <span>Gestão Empresarial Unificada</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-sans font-black tracking-tight text-slate-900 leading-[1.1]">
                O ERP SaaS <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-600">Definitivo</span> para sua Empresa Decolar
              </h1>
              <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
                Controle vendas, estoque, relacionamento, faturamento e produção de forma 100% segura. Projetado com isolamento multiempresa e auditoria corporativa.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 pt-2">
                <button 
                  onClick={() => navigate('/cadastro')}
                  className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Iniciar Avaliação Gratuita</span>
                  <ArrowRight size={16} />
                </button>
                <button 
                  onClick={() => scrollToSection('landing-demo')}
                  className="px-8 py-4 bg-white hover:bg-slate-50 text-slate-800 rounded-xl text-sm font-bold border border-slate-300 hover:border-slate-400 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Laptop size={16} className="text-slate-500" />
                  <span>Ver Demonstração</span>
                </button>
              </div>

              {/* Badges / Trust */}
              <div className="pt-6 grid grid-cols-3 gap-4 max-w-md mx-auto lg:mx-0 border-t border-slate-200/80">
                <div className="flex items-center gap-2">
                  <BadgeCheck size={18} className="text-emerald-600 shrink-0" />
                  <span className="text-xs font-semibold text-slate-700">LGPD Safe</span>
                </div>
                <div className="flex items-center gap-2">
                  <BadgeCheck size={18} className="text-emerald-600 shrink-0" />
                  <span className="text-xs font-semibold text-slate-700">Multiempresa</span>
                </div>
                <div className="flex items-center gap-2">
                  <BadgeCheck size={18} className="text-emerald-600 shrink-0" />
                  <span className="text-xs font-semibold text-slate-700">NFC-e Prontos</span>
                </div>
              </div>

            </div>

            {/* Right Hero High-Fidelity Mockup (Bento Grid Style Dashboard) */}
            <div className="lg:col-span-6 relative">
              <div className="relative bg-slate-900 rounded-3xl p-4 sm:p-6 shadow-2xl border border-slate-800 overflow-hidden text-white font-mono text-xs">
                {/* Simulated Web Shell header */}
                <div className="flex justify-between items-center pb-4 border-b border-slate-800 mb-4 font-sans">
                  <div className="flex space-x-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-500" />
                    <span className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold bg-slate-800 px-3 py-1 rounded-lg">smartpdv-v5.cloud</span>
                  <span className="text-slate-500"><Activity size={14} className="animate-pulse text-emerald-500" /></span>
                </div>

                {/* Dashboard grid inside mockup */}
                <div className="grid grid-cols-2 gap-4 font-sans">
                  {/* Card 1: Live Faturamento */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Faturamento Hoje</span>
                    <div className="text-lg font-black text-emerald-400">R$ 14.850,30</div>
                    <span className="text-[9px] text-slate-400 flex items-center gap-1"><TrendingUp size={10} className="text-emerald-500" /> +14.2% vs ontem</span>
                  </div>

                  {/* Card 2: Caixa Aberto */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Status do Caixa</span>
                    <div className="text-sm font-bold text-blue-400 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping shrink-0" />
                      <span>Caixa Aberto (Sessão)</span>
                    </div>
                    <span className="text-[9px] text-slate-400">Operador: Daniel S. (UID: op_402)</span>
                  </div>

                  {/* Card 3: Stock Alert */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1.5 col-span-2">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-500 font-bold uppercase tracking-wider">Alertas Críticos de Estoque</span>
                      <span className="px-1.5 py-0.5 rounded bg-amber-900/40 text-amber-400 border border-amber-800 text-[9px] font-bold font-mono">3 Itens</span>
                    </div>
                    <div className="space-y-1 text-[11px] font-mono text-slate-300">
                      <div className="flex justify-between bg-slate-900 p-1.5 rounded">
                        <span>• Bobina Térmica 80mm</span>
                        <span className="text-rose-400 font-bold">Estoque: 2 un (Mín: 10)</span>
                      </div>
                      <div className="flex justify-between bg-slate-900 p-1.5 rounded">
                        <span>• Sacola Oxi-Biodegradável</span>
                        <span className="text-amber-400 font-bold">Estoque: 45 un (Mín: 100)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subtitle in mockup representing tenant separation */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-500 font-sans">
                  <span>Tenant ID: <strong className="text-slate-300 font-mono">ericacosta_clinica</strong></span>
                  <span className="flex items-center gap-1 text-emerald-500"><ShieldCheck size={12} /> Dados Criptografados (AES-256)</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Feature Bento Showcase */}
      <section id="landing-features" className="py-20 sm:py-28 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider">
              <span>Recursos Completos</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-sans font-black tracking-tight text-slate-950">
              Absolutamente tudo o que sua empresa precisa em um só lugar
            </h2>
            <p className="text-sm sm:text-base text-slate-600 font-medium">
              Esqueça dezenas de ferramentas desintegradas e custos astronômicos. Nós entregamos todas as funções essenciais para a operação e aceleração do seu negócio.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feat, index) => (
              <div 
                key={index}
                className="bg-slate-50 hover:bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/60 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-50/50 transition-all duration-300 flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className="inline-flex p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                    {feat.icon}
                  </div>
                  <h3 className="text-base sm:text-lg font-sans font-extrabold text-slate-900 group-hover:text-blue-700 transition-colors">{feat.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">{feat.description}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Live POS Widget Simulator Section */}
      <section id="landing-demo" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Explanatory text */}
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider">
                <Video size={13} className="text-blue-600" />
                <span>Simulador Interativo</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-sans font-black text-slate-950 tracking-tight leading-[1.15]">
                Experimente o PDV do SmartPDV em tempo real
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-medium">
                Esta é uma simulação ao vivo do fluxo de checkout do nosso PDV de Alta Performance. Brinque com os produtos, altere as quantidades, aplique descontos e veja como a emissão instantânea do pedido e baixa automática de estoque funcionam de forma fluida.
              </p>
              
              <div className="space-y-3 font-sans text-sm text-slate-700 font-semibold">
                <div className="flex items-center gap-2"><CheckCircle2 className="text-emerald-600 shrink-0" size={18} /> Sincronização offline-first</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="text-emerald-600 shrink-0" size={18} /> Emissão instantânea de PIX Dinâmico</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="text-emerald-600 shrink-0" size={18} /> Auditoria de operadores ativa no log</div>
              </div>
            </div>

            {/* Interactive POS Widget Simulator */}
            <div className="lg:col-span-7">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col justify-between">
                {/* Header */}
                <div className="p-4 sm:p-5 bg-slate-900 text-white flex justify-between items-center font-sans">
                  <div className="flex items-center gap-2">
                    <div className="h-6.5 w-6.5 bg-blue-600 rounded-lg flex items-center justify-center text-white text-[11px] font-black">SP</div>
                    <span className="text-xs font-extrabold tracking-wide uppercase">SmartPDV Terminal #02</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Conectado (Firebase Cloud)</span>
                  </div>
                </div>

                {/* Simulated Content */}
                <div className="p-5 sm:p-6 space-y-4 font-sans">
                  <div className="text-xs text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100 pb-2 flex justify-between">
                    <span>Itens do Pedido Ativo</span>
                    <span>2 Produtos</span>
                  </div>

                  <div className="space-y-2 max-h-[180px] overflow-y-auto">
                    {simulatedCart.map(item => (
                      <div key={item.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                        <div>
                          <strong className="text-slate-950 font-bold">{item.name}</strong>
                          <div className="text-slate-500 font-mono">Unitário: R$ {item.price.toFixed(2)}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden">
                            <button 
                              onClick={() => {
                                setSimulatedCart(prev => prev.map(p => p.id === item.id ? { ...p, qty: Math.max(1, p.qty - 1) } : p));
                              }}
                              className="px-2 py-1 hover:bg-slate-50 border-r border-slate-200 text-[13px] font-bold cursor-pointer"
                            >
                              -
                            </button>
                            <span className="px-3 font-bold text-slate-800">{item.qty}</span>
                            <button 
                              onClick={() => {
                                setSimulatedCart(prev => prev.map(p => p.id === item.id ? { ...p, qty: p.qty + 1 } : p));
                              }}
                              className="px-2 py-1 hover:bg-slate-50 border-l border-slate-200 text-[13px] font-bold cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                          <strong className="text-slate-950 font-mono font-bold w-16 text-right">R$ {(item.qty * item.price).toFixed(2)}</strong>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Calculations */}
                  <div className="space-y-1.5 text-xs border-t border-slate-100 pt-3">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal bruto:</span>
                      <span className="font-mono">R$ {simulatedTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Desconto Aplicado (R$):</span>
                      <div className="flex items-center gap-1.5">
                        <button 
                          onClick={() => setSimulatedDiscount(prev => Math.max(0, prev - 5))}
                          className="p-1 rounded bg-slate-100 hover:bg-slate-200 font-bold cursor-pointer"
                        >
                          -5
                        </button>
                        <span className="font-mono font-bold px-1.5 text-slate-800">R$ {simulatedDiscount}</span>
                        <button 
                          onClick={() => setSimulatedDiscount(prev => prev + 5)}
                          className="p-1 rounded bg-slate-100 hover:bg-slate-200 font-bold cursor-pointer"
                        >
                          +5
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm font-extrabold text-slate-950 border-t border-dashed border-slate-200 pt-2.5">
                      <span>VALOR LÍQUIDO FINAL:</span>
                      <span className="font-mono text-blue-700">R$ {simulatedFinal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions / Simulated Button */}
                <div className="p-5 sm:p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between gap-4">
                  <div className="text-[10px] text-slate-500 max-w-sm font-sans flex items-center gap-2">
                    <Lock size={12} className="text-blue-600 shrink-0" />
                    <span>Toda transação gera um faturamento automático no Firebase e é logada na auditoria SaaS.</span>
                  </div>
                  
                  <button 
                    onClick={() => {
                      setIsDemoPaid(true);
                      setTimeout(() => setIsDemoPaid(false), 3000);
                    }}
                    className={`px-6 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider text-center transition-all cursor-pointer ${
                      isDemoPaid 
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-100' 
                        : 'bg-slate-900 hover:bg-slate-800 text-white shadow-md shadow-slate-100'
                    }`}
                  >
                    {isDemoPaid ? '✓ Pedido Transmitido!' : 'Simular Fechamento'}
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Pricing / Planos */}
      <section id="landing-plans" className="py-20 sm:py-28 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider">
              <span>Planos e Assinaturas</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-sans font-black tracking-tight text-slate-950">
              O plano perfeito para a maturidade do seu negócio
            </h2>
            <p className="text-sm sm:text-base text-slate-600 font-medium">
              Transparência total: sem taxas ocultas, sem fidelidade obrigatória. Altere ou cancele sua assinatura a qualquer momento com apenas 1 clique no painel administrativo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {plans.map((pl, index) => (
              <div 
                key={index}
                className={`rounded-3xl border p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 relative ${
                  pl.popular 
                    ? 'bg-slate-900 text-white border-blue-600 shadow-xl shadow-blue-50/20 scale-105 z-10 lg:-translate-y-2' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 hover:border-slate-300 hover:bg-white'
                }`}
              >
                {pl.popular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-blue-600 text-white text-[10px] font-sans font-black uppercase tracking-widest shadow-md">
                    Mais Escolhido
                  </span>
                )}

                <div className="space-y-6">
                  <div>
                    <h3 className={`text-lg sm:text-xl font-sans font-black ${pl.popular ? 'text-white' : 'text-slate-950'}`}>{pl.name}</h3>
                    <p className={`text-xs mt-1 leading-relaxed ${pl.popular ? 'text-slate-400' : 'text-slate-600'}`}>{pl.description}</p>
                  </div>

                  <div className="flex items-baseline gap-1.5 border-b border-slate-200 pb-5">
                    <span className={`text-3xl sm:text-4xl font-sans font-black ${pl.popular ? 'text-white' : 'text-slate-950'}`}>{pl.price}</span>
                    <span className={`text-xs ${pl.popular ? 'text-slate-400' : 'text-slate-600'}`}>{pl.period}</span>
                  </div>

                  <ul className="space-y-3.5 text-xs sm:text-sm font-medium">
                    {pl.features.map((feat, idx) => (
                      <li key={idx} className="flex items-center gap-2.5">
                        <Check size={16} className={pl.popular ? "text-blue-400 shrink-0" : "text-blue-600 shrink-0"} />
                        <span className={pl.popular ? "text-slate-300" : "text-slate-700"}>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-8">
                  <button 
                    onClick={() => navigate(`/cadastro?plan=${pl.name}`)}
                    className={`w-full py-3 sm:py-3.5 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all cursor-pointer text-center ${
                      pl.popular 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/35 hover:shadow-xl hover:shadow-blue-600/50' 
                        : 'bg-white border border-slate-300 text-slate-800 hover:bg-slate-100 hover:border-slate-400'
                    }`}
                  >
                    {pl.buttonText}
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Testimonials */}
      <section id="landing-testimonials" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider">
              <span>Depoimentos Reais</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-sans font-black tracking-tight text-slate-950">
              Quem usa o SmartPDV Enterprise aprova e recomenda
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((test, index) => (
              <div key={index} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-md hover:shadow-lg transition-all flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex text-amber-500">
                    {[...Array(test.stars)].map((_, i) => (
                      <Star key={i} size={15} fill="currentColor" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 italic leading-relaxed font-medium">"{test.text}"</p>
                </div>
                <div className="flex items-center gap-3 pt-6 border-t border-slate-100 mt-6">
                  <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                    {test.name[0]}
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-950">{test.name}</h4>
                    <span className="text-[10px] text-slate-500 font-semibold">{test.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* FAQ / Ajuda */}
      <section id="landing-faq" className="py-20 sm:py-28 bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          
          <div className="text-center space-y-4 mb-16">
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider">
              <HelpCircle size={13} className="text-indigo-600" />
              <span>Dúvidas Frequentes</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-sans font-black tracking-tight text-slate-950">
              Perguntas e Respostas Rápidas
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Selecione uma dúvida abaixo para ler a resposta de nossa equipe técnica e de suporte comercial.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div 
                  key={idx}
                  className="rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden transition-all duration-300"
                >
                  <button 
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full px-5 py-4 sm:py-5 flex justify-between items-center text-left text-xs sm:text-sm font-extrabold text-slate-950 hover:bg-slate-100/50 transition-colors focus:outline-none cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown size={16} className={`text-slate-500 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-5 pb-5 font-medium text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-200 pt-3 bg-white"
                      >
                        {faq.a}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* Interactive Footer */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-900 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-slate-900 text-xs font-semibold">
            
            {/* Branding */}
            <div className="space-y-4 md:col-span-1">
              <div className="flex items-center space-x-2.5">
                <div className="h-8.5 w-8.5 rounded-xl bg-blue-600 flex items-center justify-center text-white text-xs font-sans font-black shadow-lg">
                  SP
                </div>
                <span className="font-sans font-black text-base text-white tracking-tight">SmartPDV Enterprise</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-500">
                A tecnologia comercial que conecta sua empresa ao sucesso. Plataforma SaaS de alta integridade com faturamento, estoque, CRM e relatórios consolidados em nuvem segura.
              </p>
            </div>

            {/* Links 1 */}
            <div>
              <h4 className="text-slate-200 font-bold uppercase tracking-wider mb-3">Plataforma</h4>
              <ul className="space-y-2 text-[11px]">
                <li><button onClick={() => scrollToSection('landing-features')} className="hover:text-white transition-colors cursor-pointer">Funcionalidades</button></li>
                <li><button onClick={() => scrollToSection('landing-demo')} className="hover:text-white transition-colors cursor-pointer">Demonstração</button></li>
                <li><button onClick={() => scrollToSection('landing-plans')} className="hover:text-white transition-colors cursor-pointer">Tabela de Preços</button></li>
              </ul>
            </div>

            {/* Links 2 */}
            <div>
              <h4 className="text-slate-200 font-bold uppercase tracking-wider mb-3">Empresa</h4>
              <ul className="space-y-2 text-[11px]">
                <li><a href="#" className="hover:text-white transition-colors">Quem Somos</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Política de Privacidade</a></li>
              </ul>
            </div>

            {/* Contact / Help */}
            <div className="space-y-3">
              <h4 className="text-slate-200 font-bold uppercase tracking-wider mb-3">Suporte Oficial</h4>
              <p className="text-[11px] text-slate-500">
                Segunda a Sexta, das 08h às 18h.<br />
                E-mail: <a href="mailto:suporte@smartpdv.com.br" className="text-blue-400 hover:underline">suporte@smartpdv.com.br</a>
              </p>
              <div className="flex gap-2">
                <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400 font-mono">Status: Online</span>
                <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400 font-mono">v5.0-stable</span>
              </div>
            </div>

          </div>

          <div className="pt-8 flex flex-col sm:flex-row justify-between items-center text-[11px] text-slate-600 font-semibold gap-4">
            <span>&copy; {new Date().getFullYear()} SmartPDV Enterprise SaaS. Todos os direitos reservados.</span>
            <span>Segurança garantida por Firebase Auth, Firestore e Storage em conformidade com a LGPD.</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
