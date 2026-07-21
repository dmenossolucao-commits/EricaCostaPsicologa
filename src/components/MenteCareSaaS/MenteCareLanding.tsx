import React, { useState } from 'react';
import { 
  ArrowRight, ShieldCheck, Brain, Sparkles, Calendar, DollarSign, 
  Globe, FileText, Users, Layers, Video, Smartphone, HardDrive, 
  Check, Lock, Activity, ChevronDown, CheckCircle2, Star, Menu, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MenteCareLandingProps {
  navigate: (to: string) => void;
}

export default function MenteCareLanding({ navigate }: MenteCareLandingProps) {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const features = [
    {
      icon: <Calendar className="text-softblue-600" size={24} />,
      title: "Agenda Inteligente",
      description: "Agendamento online automatizado, lembretes automáticos por WhatsApp e gestão de ausências."
    },
    {
      icon: <FileText className="text-softblue-600" size={24} />,
      title: "Prontuário Eletrônico",
      description: "Histórico clínico completo, evolução estruturada e anamneses totalmente digitais e seguras."
    },
    {
      icon: <DollarSign className="text-softblue-600" size={24} />,
      title: "Financeiro & PIX",
      description: "Controle de fluxo de caixa, geração de recibos em PDF e cobrança integrada via PIX."
    },
    {
      icon: <Sparkles className="text-softblue-600" size={24} />,
      title: "IA Clínica & LUMA",
      description: "Auxiliar virtual de inteligência artificial para resumos clínicos estruturados e insights terapêuticos."
    },
    {
      icon: <Video className="text-softblue-600" size={24} />,
      title: "Sala Virtual Integrada",
      description: "Ambiente de teleconsulta criptografado de ponta a ponta, sem necessidade de aplicativos adicionais."
    },
    {
      icon: <Globe className="text-softblue-600" size={24} />,
      title: "CMS & Designer Visual",
      description: "Crie o site da sua clínica em minutos com nosso editor de arrastar-e-soltar e templates incríveis."
    },
    {
      icon: <Users className="text-softblue-600" size={24} />,
      title: "Portal do Paciente",
      description: "Canal exclusivo para o paciente visualizar agendamentos, documentos compartilhados e recibos."
    },
    {
      icon: <Smartphone className="text-softblue-600" size={24} />,
      title: "Plataforma Omnichannel",
      description: "Experiência nativa em computadores (Windows/Mac/Linux), dispositivos móveis e navegadores."
    },
    {
      icon: <ShieldCheck className="text-softblue-600" size={24} />,
      title: "Segurança LGPD",
      description: "Criptografia de nível militar, controle rígido de acesso e total conformidade com as leis de dados médicos."
    },
    {
      icon: <HardDrive className="text-softblue-600" size={24} />,
      title: "Backup Automatizado",
      description: "Backups automatizados diários e recuperação granular instantânea de informações clínicas."
    },
    {
      icon: <Layers className="text-softblue-600" size={24} />,
      title: "Multiempresa / Multiclínica",
      description: "Ideal para consultórios que gerenciam múltiplas marcas ou profissionais em ambientes isolados."
    }
  ];

  const plans = [
    {
      name: "Starter",
      price: "R$ 79",
      period: "/mês",
      description: "Essencial para profissionais independentes iniciando suas clínicas.",
      features: [
        "1 Usuário / Psicólogo",
        "Até 50 Pacientes Ativos",
        "Agenda Online Integrada",
        "Prontuários Clínicos",
        "Financeiro Básico",
        "Suporte por E-mail",
        "Segurança LGPD"
      ],
      popular: false,
      buttonText: "Começar Agora"
    },
    {
      name: "Pro",
      price: "R$ 149",
      period: "/mês",
      description: "Ideal para consultórios em crescimento com demanda por CMS.",
      features: [
        "Até 3 Usuários / Psicólogos",
        "Até 150 Pacientes Ativos",
        "Agenda Online Inteligada",
        "Prontuários Clínicos",
        "Financeiro & PIX Integrado",
        "CMS (Blog & Site Próprio)",
        "Suporte em até 12 horas",
        "Backups de Segurança"
      ],
      popular: true,
      buttonText: "Escolher Pro"
    },
    {
      name: "Premium",
      price: "R$ 299",
      period: "/mês",
      description: "Completo para clínicas estruturadas que necessitam de domínio próprio.",
      features: [
        "Até 10 Usuários / Psicólogos",
        "Até 500 Pacientes Ativos",
        "Tudo do Plano Pro",
        "CMS Avançado & Designer",
        "Domínio Personalizado",
        "Sala Virtual de Telemedicina",
        "Suporte Prioritário WhatsApp",
        "Relatórios Clínicos de Auditoria"
      ],
      popular: false,
      buttonText: "Escolher Premium"
    },
    {
      name: "Enterprise",
      price: "R$ 599",
      period: "/mês",
      description: "Para grandes clínicas, redes de franquia e hospitais psiquiátricos.",
      features: [
        "Usuários Ilimitados",
        "Pacientes Ilimitados",
        "Tudo do Plano Premium",
        "Inteligência Artificial LUMA",
        "Gestão Multiempresa Ativa",
        "Customização Completa (White-label)",
        "Gerente de Conta Dedicado",
        "Backups Globais Granulares"
      ],
      popular: false,
      buttonText: "Falar com Consultor"
    }
  ];

  const testimonials = [
    {
      name: "Dr. Marcos Alencar",
      role: "Psicólogo Clínico & Diretor de Clínica",
      stars: 5,
      text: "A transição para o MenteCare mudou completamente o fluxo da nossa clínica de psicologia. A facilidade para gerenciar múltiplos terapeutas com prontuários blindados pela LGPD é fantástica."
    },
    {
      name: "Dra. Carolina Mendes",
      role: "Psicoterapeuta Familiar",
      stars: 5,
      text: "Eu adorava o prontuário de papel, mas o MenteCare me trouxe a segurança de que eu precisava. O módulo de IA ajuda demais a redigir as notas após cada sessão sem perder tempo."
    },
    {
      name: "Clinica VivaMente",
      role: "SaaS Enterprise Tenant",
      stars: 5,
      text: "Utilizamos a solução Multiempresa deles. Cada uma de nossas 4 franquias opera com total isolamento de dados e faturamento, enquanto a matriz tem visibilidade master das métricas."
    }
  ];

  const faqs = [
    {
      q: "O MenteCare atende a LGPD e resoluções do CFP?",
      a: "Sim, absolutamente. O MenteCare foi concebido em total conformidade com a Lei Geral de Proteção de Dados (LGPD) e as resoluções vigentes do Conselho Federal de Psicologia (CFP) para o armazenamento e tratamento seguro de prontuários psicológicos, com criptografia de ponta a ponta."
    },
    {
      q: "Como funciona o isolamento Multiempresa (Multi-tenant)?",
      a: "Cada clínica cadastrada na plataforma opera em um Tenant isolado. Isso significa que pacientes, prontuários, faturamentos, chaves de PIX e sites criados por uma clínica são absolutamente inacessíveis por qualquer outro usuário de outro Tenant, garantindo 100% de sigilo profissional."
    },
    {
      q: "Os pacientes pagam alguma taxa extra pelo Portal?",
      a: "Não. O Portal do Paciente está integrado na plataforma. O paciente recebe um link criptografado único para ver suas consultas e recibos sem custo algum, aumentando a satisfação e fidelização do seu serviço."
    },
    {
      q: "Posso utilizar meu próprio domínio no site institucional?",
      a: "Sim! A partir do plano Premium, você pode associar o seu domínio profissional (ex: clinicaexemplo.com.br) para que os seus pacientes acessem o seu portal de agendamentos e blog de forma personalizada e profissional."
    }
  ];

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  return (
    <div className="bg-[#faf8f5] min-h-screen font-sans flex flex-col justify-between text-sand-950">
      
      {/* SaaS Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/85 backdrop-blur-md border-b border-sand-100 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => navigate('/')}>
              <div className="h-10 w-10 rounded-xl bg-softblue-600 flex items-center justify-center text-white font-serif font-black shadow-md shadow-softblue-100">
                M
              </div>
              <div>
                <span className="font-serif font-black text-xl tracking-tight text-sand-950">MenteCare</span>
                <span className="block text-[9px] font-bold text-softblue-600 font-mono tracking-widest uppercase">Enterprise SaaS</span>
              </div>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8 font-medium text-sm text-sand-700">
              <button onClick={() => scrollToSection('recursos')} className="hover:text-softblue-600 transition-colors cursor-pointer">Recursos</button>
              <button onClick={() => scrollToSection('planos')} className="hover:text-softblue-600 transition-colors cursor-pointer">Planos</button>
              <button onClick={() => scrollToSection('depoimentos')} className="hover:text-softblue-600 transition-colors cursor-pointer">Depoimentos</button>
              <button onClick={() => scrollToSection('faq')} className="hover:text-softblue-600 transition-colors cursor-pointer">FAQ</button>
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center space-x-3.5">
              <button 
                onClick={() => navigate('/login')} 
                className="px-4.5 py-2.5 text-sm font-semibold text-sand-700 hover:text-softblue-600 transition-colors cursor-pointer"
              >
                Entrar
              </button>
              <button 
                onClick={() => navigate('/cadastro')} 
                className="px-5 py-2.5 bg-softblue-600 hover:bg-softblue-700 text-white text-sm font-bold rounded-xl shadow-md shadow-softblue-100 hover:shadow-lg transition-all duration-300 cursor-pointer"
              >
                Criar conta
              </button>
            </div>

            {/* Mobile Hamburger */}
            <div className="md:hidden flex items-center">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-sand-800">
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu container */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-b border-sand-100 overflow-hidden px-4 py-4 space-y-4 text-sm font-semibold text-sand-700"
            >
              <button onClick={() => scrollToSection('recursos')} className="block w-full text-left py-2 hover:text-softblue-600 cursor-pointer">Recursos</button>
              <button onClick={() => scrollToSection('planos')} className="block w-full text-left py-2 hover:text-softblue-600 cursor-pointer">Planos</button>
              <button onClick={() => scrollToSection('depoimentos')} className="block w-full text-left py-2 hover:text-softblue-600 cursor-pointer">Depoimentos</button>
              <button onClick={() => scrollToSection('faq')} className="block w-full text-left py-2 hover:text-softblue-600 cursor-pointer">FAQ</button>
              <div className="pt-4 border-t border-sand-100 flex flex-col gap-2">
                <button 
                  onClick={() => navigate('/login')} 
                  className="w-full py-2.5 text-center border border-sand-200 rounded-xl hover:bg-sand-50 cursor-pointer"
                >
                  Entrar
                </button>
                <button 
                  onClick={() => navigate('/cadastro')} 
                  className="w-full py-2.5 text-center bg-softblue-600 hover:bg-softblue-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  Criar conta
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-36 pb-20 overflow-hidden bg-gradient-to-br from-softblue-50/70 via-[#faf8f5] to-white">
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[60rem] h-[30rem] rounded-full bg-softblue-100/30 blur-[120px] -z-10" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="inline-flex items-center space-x-2 bg-softblue-50 text-softblue-800 px-4 py-1.5 rounded-full text-xs font-bold border border-softblue-100 tracking-wide uppercase">
            <Sparkles size={12} className="fill-softblue-200 text-softblue-600 animate-spin" />
            <span>SaaS Multiclínicas de Alta Performance</span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-serif text-sand-950 tracking-tight leading-[1.05] max-w-4xl mx-auto">
            Mente<span className="text-softblue-600 font-medium italic">Care</span>
          </h1>

          <p className="text-xl sm:text-2xl font-serif text-sand-800 max-w-2xl mx-auto font-light">
            A plataforma completa para psicólogos. Do agendamento inteligente ao prontuário eletrônico em total conformidade com a LGPD.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <button 
              onClick={() => navigate('/cadastro')}
              className="w-full sm:w-auto px-8 py-4 bg-softblue-600 hover:bg-softblue-700 text-white font-bold rounded-2xl shadow-xl shadow-softblue-100 hover:shadow-2xl hover:scale-[1.01] transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 group"
            >
              <span>Experimentar Grátis</span>
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </button>
            <button 
              onClick={() => scrollToSection('recursos')}
              className="w-full sm:w-auto px-8 py-4 bg-white border border-sand-300 hover:bg-sand-100 text-sand-950 font-semibold rounded-2xl transition-colors cursor-pointer"
            >
              Conhecer recursos
            </button>
            <button 
              onClick={() => scrollToSection('planos')}
              className="w-full sm:w-auto px-8 py-4 bg-transparent hover:text-softblue-600 text-sand-800 font-semibold rounded-2xl transition-colors cursor-pointer"
            >
              Ver planos
            </button>
          </div>

          {/* SaaS Frame Placeholder */}
          <div className="pt-12 max-w-5xl mx-auto">
            <div className="bg-white border border-sand-200 p-2 sm:p-3.5 rounded-[2.5rem] shadow-2xl">
              <div className="bg-sand-50/80 rounded-[1.8rem] aspect-[16/9] border border-sand-150 overflow-hidden relative flex flex-col items-center justify-center p-6 text-center space-y-4">
                <div className="h-14 w-14 rounded-2xl bg-softblue-50 text-softblue-600 flex items-center justify-center shadow-inner">
                  <Activity size={32} className="animate-pulse" />
                </div>
                <h3 className="font-serif font-black text-xl text-sand-900">Dashboard Administrativo Seguro</h3>
                <p className="text-xs text-sand-600 max-w-md">
                  Isolamento robusto por clínica (Tenant), backups automatizados em conformidade com a LGPD e Prontuários Eletrônicos com criptografia em repouso.
                </p>
                <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center text-[10px] text-sand-400 font-mono">
                  <span>SSL SECURE CONNECTION</span>
                  <span>LGPD CERTIFIED</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Resources / Features Section */}
      <section id="recursos" className="py-24 bg-white border-y border-sand-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-20">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-sand-950 tracking-tight">
              Recursos construídos para Clínicas Modernas
            </h2>
            <p className="text-sm text-sand-600">
              Gerencie todo o seu negócio clínico em uma única ferramenta extremamente integrada, protegida e fácil de usar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feat, index) => (
              <div key={index} className="p-6 border border-sand-200/75 rounded-2xl hover:border-softblue-200 hover:shadow-lg hover:shadow-softblue-50/30 transition-all duration-300 space-y-4">
                <div className="p-3 bg-softblue-50 border border-softblue-100 rounded-xl w-fit">
                  {feat.icon}
                </div>
                <h3 className="font-serif font-bold text-sand-900 text-lg">{feat.title}</h3>
                <p className="text-xs text-sand-600 leading-relaxed">{feat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing / Planos Section */}
      <section id="planos" className="py-24 bg-[#faf8f5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-20">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-sand-950 tracking-tight">
              Nossos Planos de Licenciamento
            </h2>
            <p className="text-sm text-sand-600">
              Escolha a licença perfeita para a sua clínica ou consultório individual de psicologia.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((p, index) => (
              <div 
                key={index} 
                className={`bg-white border p-6 rounded-3xl flex flex-col justify-between space-y-6 relative transition-transform hover:scale-[1.01] ${
                  p.popular ? 'border-softblue-600 ring-4 ring-softblue-100 shadow-xl' : 'border-sand-200 shadow-sm'
                }`}
              >
                {p.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-softblue-600 text-white font-mono text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Mais Popular
                  </span>
                )}
                <div className="space-y-4">
                  <div>
                    <h3 className="font-serif font-bold text-sand-900 text-xl">{p.name}</h3>
                    <p className="text-xs text-sand-500 mt-1 leading-relaxed min-h-[32px]">{p.description}</p>
                  </div>
                  <div className="flex items-baseline text-sand-950">
                    <span className="text-4xl font-serif font-black">{p.price}</span>
                    <span className="text-xs text-sand-500 font-bold ml-1">{p.period}</span>
                  </div>
                  
                  <div className="border-t border-sand-100 pt-4">
                    <ul className="space-y-2.5">
                      {p.features.map((f, fIdx) => (
                        <li key={fIdx} className="flex items-center text-xs text-sand-700 gap-2 font-medium">
                          <Check size={14} className="text-softblue-600 shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <button 
                  onClick={() => navigate('/cadastro?plan=' + p.name)}
                  className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                    p.popular 
                      ? 'bg-softblue-600 hover:bg-softblue-700 text-white shadow-md' 
                      : 'bg-sand-50 border border-sand-300 hover:bg-sand-100 text-sand-800'
                  }`}
                >
                  {p.buttonText}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="depoimentos" className="py-24 bg-white border-y border-sand-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-20">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-sand-950 tracking-tight">
              O que dizem os donos de clínicas
            </h2>
            <p className="text-sm text-sand-600">
              Profissionais reais que escalaram seu atendimento com o MenteCare SaaS.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((test, index) => (
              <div key={index} className="p-6 bg-sand-50/50 border border-sand-200/80 rounded-2xl space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex text-amber-500">
                    {Array.from({ length: test.stars }).map((_, i) => (
                      <Star key={i} size={14} className="fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs text-sand-700 italic leading-relaxed">"{test.text}"</p>
                </div>
                <div className="border-t border-sand-200/50 pt-4">
                  <h4 className="font-bold text-sand-900 text-xs">{test.name}</h4>
                  <p className="text-[10px] text-sand-500">{test.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 bg-[#faf8f5]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-sand-950 tracking-tight">
              Dúvidas Frequentes
            </h2>
            <p className="text-sm text-sand-600">
              Respostas rápidas sobre segurança, transição, backups e planos.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className="bg-white border border-sand-200 rounded-2xl overflow-hidden shadow-sm"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                  className="w-full text-left p-5 flex justify-between items-center gap-4 hover:bg-sand-50/50 transition-colors cursor-pointer"
                >
                  <span className="font-serif font-bold text-sand-900 text-sm">{faq.q}</span>
                  <ChevronDown 
                    size={16} 
                    className={`text-sand-500 transition-transform duration-300 ${activeFaq === index ? 'rotate-180' : ''}`} 
                  />
                </button>
                <AnimatePresence>
                  {activeFaq === index && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className="p-5 pt-0 text-xs text-sand-600 leading-relaxed border-t border-sand-100">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="bg-sand-950 text-sand-300 py-16 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-softblue-600 flex items-center justify-center text-white font-serif font-black">
                M
              </div>
              <span className="font-serif font-bold text-white text-base">MenteCare</span>
            </div>
            <p className="text-sand-400 text-[11px] leading-relaxed">
              Plataforma SaaS Multiempresa inteligente e segura para gestão de consultórios e clínicas de psicologia.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-mono text-[10px] font-bold text-sand-400 uppercase tracking-widest">Produto</h4>
            <ul className="space-y-2 text-sand-300">
              <li><button onClick={() => scrollToSection('recursos')} className="hover:text-white transition-colors">Recursos</button></li>
              <li><button onClick={() => scrollToSection('planos')} className="hover:text-white transition-colors">Planos</button></li>
              <li><button onClick={() => navigate('/login')} className="hover:text-white transition-colors">Acessar Painel</button></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-mono text-[10px] font-bold text-sand-400 uppercase tracking-widest">Segurança</h4>
            <ul className="space-y-2 text-sand-300">
              <li className="flex items-center gap-1.5"><ShieldCheck size={12} className="text-softblue-400" /><span>Conformidade LGPD</span></li>
              <li className="flex items-center gap-1.5"><Lock size={12} className="text-softblue-400" /><span>Criptografia SSL/TLS</span></li>
              <li className="flex items-center gap-1.5"><HardDrive size={12} className="text-softblue-400" /><span>Backups Diários</span></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-mono text-[10px] font-bold text-sand-400 uppercase tracking-widest">Institucional</h4>
            <p className="text-sand-400 text-[11px] leading-relaxed">
              MenteCare Soluções Clínicas Ltda.<br />
              Fortaleza - CE, Brasil<br />
              suporte@mentecare.com.br
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-sand-800 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sand-500 text-[10px] font-mono">
          <span>&copy; {new Date().getFullYear()} MenteCare Enterprise SaaS. Todos os direitos reservados.</span>
          <span>FEITO COM ÉTICA CLÍNICA NO BRASIL</span>
        </div>
      </footer>

    </div>
  );
}
