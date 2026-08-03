import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, X, ChevronRight, Check, RefreshCw, Copy, Edit3, ShieldAlert, 
  Bot, FileText, Layers, LineChart, AlertCircle, Eye, EyeOff, Maximize2, 
  Minimize2, History, Wand2, BookOpen, Lock, ShieldCheck, CheckCircle2, ArrowRight
} from 'lucide-react';

interface CopilotSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  editorContent: string;
  onApplyText: (newText: string) => void;
  patientName?: string;
  recordsHistory?: any[];
  userEmail?: string;
  isPrivateMode: boolean;
  onTogglePrivateMode: (val: boolean) => void;
}

export const DISCLAIMER_TEXT = "Sugestão produzida por IA. Todo conteúdo deve ser revisado e validado pelo psicólogo responsável.";

export const CopilotSidebar: React.FC<CopilotSidebarProps> = ({
  isOpen,
  onClose,
  editorContent,
  onApplyText,
  patientName,
  recordsHistory = [],
  userEmail = 'psicologo@mentecare.com.br',
  isPrivateMode,
  onTogglePrivateMode
}) => {
  // Active Tab
  const [activeTab, setActiveTab] = useState<'sugestoes' | 'organizacao' | 'escrita' | 'observacoes' | 'linha_do_tempo' | 'historico'>('sugestoes');

  // Sidebar Layout width mode
  const [panelWidth, setPanelWidth] = useState<'normal' | 'wide'>('normal');

  // Loading & Error States
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Data States
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [observations, setObservations] = useState<any[]>([]);
  const [timelineData, setTimelineData] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Side-by-side comparison modal state
  const [comparisonModal, setComparisonModal] = useState<{
    isOpen: boolean;
    title: string;
    originalText: string;
    suggestedText: string;
    editableText: string;
    isEditing: boolean;
  } | null>(null);

  // Load audit logs on tab switch
  useEffect(() => {
    if (activeTab === 'historico') {
      fetchAuditLogs();
    }
  }, [activeTab]);

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch('/api/ai/audit-logs');
      const data = await res.json();
      if (data.success && data.logs) {
        setAuditLogs(data.logs);
      }
    } catch (err) {
      console.warn("Error fetching audit logs:", err);
    }
  };

  const saveAuditLog = async (actionUsed: string, durationMs: number) => {
    try {
      await fetch('/api/ai/audit-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail,
          actionUsed,
          durationMs,
          modelUsed: 'gemini-3.6-flash'
        })
      });
    } catch (err) {
      console.warn("Could not save audit log:", err);
    }
  };

  // Generic Copilot Action Handler
  const handleAction = async (actionName: string, subTab?: string) => {
    if (isPrivateMode) {
      alert("O Modo Privado está ATIVO. Desmarque 'Não enviar este prontuário para IA' para utilizar as funções do Copiloto.");
      return;
    }

    const plainText = editorContent.replace(/<[^>]*>?/gm, '').trim();
    if (!plainText && actionName !== 'timeline_analysis') {
      setErrorMessage("O prontuário está vazio. Digite algum trecho para que o Copiloto possa auxiliar.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);
      const startTime = Date.now();

      const res = await fetch('/api/ai/copilot-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionName,
          tab: subTab || activeTab,
          text: editorContent,
          recordsHistory
        })
      });

      const data = await res.json();
      const durationMs = Date.now() - startTime;

      if (!data.success) {
        setErrorMessage(data.error || "Erro ao processar solicitação no Copiloto IA.");
        return;
      }

      await saveAuditLog(actionName || subTab || 'copilot_action', durationMs);

      if (data.data) {
        if (data.data.suggestions) {
          setSuggestions(data.data.suggestions);
        }
        if (data.data.observations) {
          setObservations(data.data.observations);
        }
        if (subTab === 'linha_do_tempo' || actionName === 'timeline_analysis') {
          setTimelineData(data.data);
        }
      } else if (data.transformedText) {
        // Open side-by-side comparison
        openComparison(actionName, editorContent, data.transformedText);
      }
    } catch (err: any) {
      console.error("Copilot error:", err);
      setErrorMessage("Erro de conexão ao comunicar com o Copiloto Clínico.");
    } finally {
      setLoading(false);
    }
  };

  const openComparison = (actionTitle: string, orig: string, sugg: string) => {
    setComparisonModal({
      isOpen: true,
      title: formatActionTitle(actionTitle),
      originalText: orig,
      suggestedText: sugg,
      editableText: sugg,
      isEditing: false
    });
  };

  const formatActionTitle = (action: string) => {
    const map: Record<string, string> = {
      transform_soap: 'Estruturação em SOAP',
      organize_evolution: 'Organização em Tópicos Formais',
      clinical_summary: 'Resumo Clínico da Sessão',
      objective_evolution: 'Evolução Objetiva Neutra',
      narrative_evolution: 'Evolução Narrativa Fluida',
      technical_language: 'Aprimoramento para Linguagem Técnica (CFP)',
      simple_language: 'Simplificação de Linguagem',
      improve_text: 'Melhoria da Qualidade de Redação',
      correct_grammar: 'Correção Gramatical e Ortográfica',
      improve_clarity: 'Melhoria de Clareza e Coesão',
      remove_repetition: 'Remoção de Repetições',
      expand_text: 'Expansão Detalhada do Registro',
      summarize_text: 'Síntese Estruturada'
    };
    return map[action] || 'Sugestão de Aprimoramento da IA';
  };

  if (!isOpen) return null;

  return (
    <>
      <motion.aside
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 300 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={`bg-sand-50 border-l border-sand-300 shadow-xl flex flex-col h-full z-30 transition-all duration-300 ${
          panelWidth === 'wide' ? 'w-full md:w-[540px]' : 'w-full md:w-[400px]'
        }`}
      >
        {/* Header Panel */}
        <div className="p-4 bg-white border-b border-sand-200 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-softblue-600 to-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-extrabold font-serif text-sand-900 tracking-tight">Copiloto Clínico IA</h3>
                <span className="text-[9px] font-mono font-bold uppercase bg-softblue-100 text-softblue-800 px-1.5 py-0.5 rounded">MenteCare</span>
              </div>
              <p className="text-[10px] text-sand-500 font-medium">Assistente de Redação e Prontuários</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPanelWidth(panelWidth === 'normal' ? 'wide' : 'normal')}
              title={panelWidth === 'normal' ? 'Expandir painel' : 'Recolher painel'}
              className="p-1.5 text-sand-500 hover:text-sand-900 hover:bg-sand-100 rounded-lg cursor-pointer transition-colors"
            >
              {panelWidth === 'normal' ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
            </button>
            <button
              onClick={onClose}
              title="Fechar Copiloto"
              className="p-1.5 text-sand-500 hover:text-sand-900 hover:bg-sand-100 rounded-lg cursor-pointer transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Private Mode Banner / Toggle */}
        <div className="px-4 py-2.5 bg-amber-50/80 border-b border-amber-200/80 flex items-center justify-between gap-2 text-xs">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isPrivateMode}
              onChange={(e) => onTogglePrivateMode(e.target.checked)}
              className="rounded text-amber-700 focus:ring-amber-500 h-3.5 w-3.5"
            />
            <span className="text-[11px] font-bold text-amber-900">Não enviar este prontuário para IA</span>
          </label>
          {isPrivateMode && (
            <span className="text-[9px] font-mono font-bold bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded uppercase">
              Privacidade Ativa
            </span>
          )}
        </div>

        {/* Mandatory Disclaimer Box */}
        <div className="p-3 bg-sand-100/70 border-b border-sand-200 text-[10px] text-sand-600 flex items-start gap-2 leading-tight">
          <ShieldAlert size={14} className="text-amber-600 shrink-0 mt-0.5" />
          <p>
            <strong>Aviso Ético (CFP):</strong> {DISCLAIMER_TEXT} A IA não realiza diagnósticos e não substitui a conduta do psicólogo.
          </p>
        </div>

        {/* 5 Tab Navigation Bar */}
        <div className="flex border-b border-sand-200 bg-white overflow-x-auto text-[11px] font-bold scrollbar-none">
          {[
            { id: 'sugestoes', label: 'Sugestões', icon: Sparkles },
            { id: 'organizacao', label: 'Organização', icon: Layers },
            { id: 'escrita', label: 'Escrita', icon: Edit3 },
            { id: 'observacoes', label: 'Observações', icon: AlertCircle },
            { id: 'linha_do_tempo', label: 'Linha do Tempo', icon: LineChart },
            { id: 'historico', label: 'Histórico', icon: History }
          ].map(t => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`px-3 py-2.5 flex items-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'border-softblue-600 text-softblue-900 bg-sand-50 font-extrabold'
                    : 'border-transparent text-sand-600 hover:text-sand-900 hover:bg-sand-50/50'
                }`}
              >
                <Icon size={13} className={isActive ? 'text-softblue-600' : 'text-sand-400'} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <AlertCircle size={15} className="text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
              <button onClick={() => setErrorMessage(null)} className="font-bold text-rose-900 cursor-pointer">✕</button>
            </div>
          )}

          {/* TAB 1: SUGESTÕES */}
          {activeTab === 'sugestoes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-sand-600">
                  Sugestões dinâmicas de melhoria de clareza, coesão e formato:
                </p>
                <button
                  onClick={() => handleAction('get_suggestions', 'sugestoes')}
                  disabled={loading || isPrivateMode}
                  className="px-3 py-1.5 bg-softblue-600 hover:bg-softblue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                  <span>Analisar Texto</span>
                </button>
              </div>

              {suggestions.length === 0 && !loading && (
                <div className="p-6 text-center border-2 border-dashed border-sand-200 rounded-2xl bg-white space-y-2">
                  <Wand2 size={24} className="mx-auto text-sand-400" />
                  <p className="text-xs font-bold text-sand-700">Nenhuma sugestão pendente</p>
                  <p className="text-[11px] text-sand-500 leading-relaxed">
                    Clique em <strong>Analisar Texto</strong> para que o Copiloto identifique oportunidades de clareza, pontuação e concisão no rascunho.
                  </p>
                </div>
              )}

              {loading && (
                <div className="p-6 text-center bg-white rounded-2xl border border-sand-200 space-y-2">
                  <RefreshCw size={20} className="animate-spin text-softblue-600 mx-auto" />
                  <p className="text-xs font-bold text-sand-800">O Copiloto está analisando a redação do prontuário...</p>
                </div>
              )}

              {suggestions.map((sug, idx) => (
                <div key={sug.id || idx} className="bg-white p-4 rounded-2xl border border-sand-200 shadow-2xs space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase bg-softblue-50 text-softblue-800 border border-softblue-200 px-2 py-0.5 rounded-full">
                      {sug.title || 'Sugestão'}
                    </span>
                    <span className="text-[10px] text-sand-400 font-mono">Tipo: {sug.type || 'Clareza'}</span>
                  </div>
                  <p className="text-xs text-sand-700 font-medium leading-relaxed">{sug.description}</p>

                  <div className="p-2.5 bg-sand-50 border border-sand-200 rounded-xl text-xs text-sand-800 font-serif leading-relaxed">
                    <div dangerouslySetInnerHTML={{ __html: sug.suggestedText }} />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-sand-100">
                    <button
                      onClick={() => setSuggestions(prev => prev.filter((_, i) => i !== idx))}
                      className="px-2.5 py-1 text-sand-500 hover:bg-sand-100 rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Ignorar
                    </button>
                    <button
                      onClick={() => openComparison(sug.title, editorContent, sug.suggestedText)}
                      className="px-3 py-1 bg-softblue-50 text-softblue-800 border border-softblue-200 hover:bg-softblue-100 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Eye size={12} />
                      <span>Comparar Lado a Lado</span>
                    </button>
                    <button
                      onClick={() => {
                        onApplyText(sug.suggestedText);
                        setSuggestions(prev => prev.filter((_, i) => i !== idx));
                      }}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Check size={12} />
                      <span>Aceitar</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: ORGANIZAÇÃO */}
          {activeTab === 'organizacao' && (
            <div className="space-y-4">
              <p className="text-xs font-medium text-sand-600">
                Ações rápidas para reestruturar e formatar a evolução clínica:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { key: 'organize_evolution', label: 'Organizar Evolução', icon: Layers, color: 'bg-softblue-50 border-softblue-200 text-softblue-900' },
                  { key: 'transform_soap', label: 'Transformar em SOAP', icon: FileText, color: 'bg-emerald-50 border-emerald-200 text-emerald-900' },
                  { key: 'clinical_summary', label: 'Criar Resumo Clínico', icon: Wand2, color: 'bg-purple-50 border-purple-200 text-purple-900' },
                  { key: 'objective_evolution', label: 'Evolução Objetiva', icon: CheckCircle2, color: 'bg-amber-50 border-amber-200 text-amber-900' },
                  { key: 'narrative_evolution', label: 'Evolução Narrativa', icon: BookOpen, color: 'bg-rose-50 border-rose-200 text-rose-900' },
                  { key: 'separate_topics', label: 'Separar por Tópicos', icon: Layers, color: 'bg-sky-50 border-sky-200 text-sky-900' },
                  { key: 'technical_language', label: 'Linguagem Técnica (CFP)', icon: ShieldCheck, color: 'bg-indigo-50 border-indigo-200 text-indigo-900' },
                  { key: 'simple_language', label: 'Linguagem Simples', icon: Edit3, color: 'bg-sand-100 border-sand-300 text-sand-900' }
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.key}
                      onClick={() => handleAction(item.key)}
                      disabled={loading || isPrivateMode}
                      className={`p-3 rounded-xl border text-left flex items-center gap-2.5 hover:shadow-xs transition-all cursor-pointer font-bold text-xs disabled:opacity-50 ${item.color}`}
                    >
                      <Icon size={16} className="shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: ESCRITA */}
          {activeTab === 'escrita' && (
            <div className="space-y-4">
              <p className="text-xs font-medium text-sand-600">
                Aprimoramento estilístico, gramatical e de fluidez textual:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { key: 'improve_text', label: 'Melhorar Texto Geral', icon: Wand2, color: 'bg-softblue-50 border-softblue-200 text-softblue-900' },
                  { key: 'correct_grammar', label: 'Corrigir Português', icon: Check, color: 'bg-emerald-50 border-emerald-200 text-emerald-900' },
                  { key: 'improve_clarity', label: 'Melhorar Clareza', icon: Eye, color: 'bg-sky-50 border-sky-200 text-sky-900' },
                  { key: 'improve_cohesion', label: 'Melhorar Coesão', icon: Layers, color: 'bg-purple-50 border-purple-200 text-purple-900' },
                  { key: 'remove_repetition', label: 'Remover Repetições', icon: Edit3, color: 'bg-amber-50 border-amber-200 text-amber-900' },
                  { key: 'expand_text', label: 'Expandir Registro', icon: Maximize2, color: 'bg-indigo-50 border-indigo-200 text-indigo-900' },
                  { key: 'summarize_text', label: 'Resumir Sinteticamente', icon: Minimize2, color: 'bg-rose-50 border-rose-200 text-rose-900' }
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.key}
                      onClick={() => handleAction(item.key)}
                      disabled={loading || isPrivateMode}
                      className={`p-3 rounded-xl border text-left flex items-center gap-2.5 hover:shadow-xs transition-all cursor-pointer font-bold text-xs disabled:opacity-50 ${item.color}`}
                    >
                      <Icon size={16} className="shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: OBSERVAÇÕES E ESTRUTURA */}
          {activeTab === 'observacoes' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldAlert size={14} className="text-amber-700" />
                  <span>Análise Estrutural e Formal (CFP)</span>
                </p>
                <p className="text-[11px] text-amber-800">
                  O Copiloto verifica se o registro possui os elementos formais mínimos (descrição comportamental, objetivo da sessão, intervenção utilizada). É proibido emitir diagnósticos clínicos.
                </p>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sand-800">Aspectos Formais Verificados:</span>
                <button
                  onClick={() => handleAction('formal_observations', 'observacoes')}
                  disabled={loading || isPrivateMode}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                  <span>Verificar Estrutura</span>
                </button>
              </div>

              {observations.length === 0 && !loading && (
                <div className="p-6 text-center border-2 border-dashed border-sand-200 rounded-2xl bg-white space-y-2">
                  <CheckCircle2 size={24} className="mx-auto text-sand-400" />
                  <p className="text-xs font-bold text-sand-700">Nenhum alerta de estrutura pendente</p>
                  <p className="text-[11px] text-sand-500">
                    Clique em <strong>Verificar Estrutura</strong> para validar a completude formal segundo as diretrizes de documentação técnica.
                  </p>
                </div>
              )}

              {observations.map((obs, idx) => (
                <div key={obs.id || idx} className="bg-white p-4 rounded-2xl border border-sand-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md">
                      {obs.category || 'Estrutura'}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-sand-900">{obs.note}</p>
                  <p className="text-xs text-sand-600 font-medium leading-relaxed bg-sand-50 p-2.5 rounded-xl border border-sand-100">
                    💡 <strong>Recomendação:</strong> {obs.recommendation}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* TAB 5: LINHA DO TEMPO E EVOLUÇÃO */}
          {activeTab === 'linha_do_tempo' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-sand-900">Visão Longitudinal de Evolução</h4>
                  <p className="text-[10px] text-sand-500">Análise temática e estatística dos registros do paciente</p>
                </div>
                <button
                  onClick={() => handleAction('timeline_analysis', 'linha_do_tempo')}
                  disabled={loading || isPrivateMode}
                  className="px-3 py-1.5 bg-softblue-600 hover:bg-softblue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <LineChart size={12} className={loading ? 'animate-spin' : ''} />
                  <span>Analisar Histórico</span>
                </button>
              </div>

              {!timelineData && !loading && (
                <div className="p-6 text-center border-2 border-dashed border-sand-200 rounded-2xl bg-white space-y-2">
                  <LineChart size={24} className="mx-auto text-sand-400" />
                  <p className="text-xs font-bold text-sand-700">Sem análise temporal carregada</p>
                  <p className="text-[11px] text-sand-500">
                    Clique em <strong>Analisar Histórico</strong> para gerar a consolidação de temas recorrentes e trajetória de atendimentos.
                  </p>
                </div>
              )}

              {timelineData && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white p-3 rounded-2xl border border-sand-200 text-center">
                      <p className="text-[10px] font-mono text-sand-500 uppercase font-bold">Total Registrado</p>
                      <p className="text-lg font-extrabold text-softblue-800">{timelineData.totalSessions || recordsHistory.length || 1} sessões</p>
                    </div>
                    <div className="bg-white p-3 rounded-2xl border border-sand-200 text-center">
                      <p className="text-[10px] font-mono text-sand-500 uppercase font-bold">Frequência</p>
                      <p className="text-lg font-extrabold text-emerald-800">{timelineData.sessionFrequency || 'Semanal'}</p>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-sand-200 space-y-2">
                    <h5 className="text-xs font-bold text-sand-900 font-serif">Síntese Temporal</h5>
                    <p className="text-xs text-sand-700 leading-relaxed font-medium">{timelineData.summary}</p>
                  </div>

                  {timelineData.mainThemes && timelineData.mainThemes.length > 0 && (
                    <div className="bg-white p-4 rounded-2xl border border-sand-200 space-y-2">
                      <h5 className="text-xs font-bold text-sand-900 font-serif">Temas Recorrentes Relatados</h5>
                      <div className="flex flex-wrap gap-1.5">
                        {timelineData.mainThemes.map((theme: string, i: number) => (
                          <span key={i} className="text-[10px] font-bold bg-softblue-50 text-softblue-800 border border-softblue-200 px-2 py-0.5 rounded-full">
                            #{theme}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {timelineData.recurrentWords && (
                    <div className="bg-white p-4 rounded-2xl border border-sand-200 space-y-2">
                      <h5 className="text-xs font-bold text-sand-900 font-serif">Palavras Frequentes no Discurso</h5>
                      <div className="flex flex-wrap gap-1.5">
                        {timelineData.recurrentWords.map((word: string, i: number) => (
                          <span key={i} className="text-[10px] font-mono font-bold bg-sand-100 text-sand-800 px-2 py-0.5 rounded-md">
                            {word}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB: HISTÓRICO DE AUDITORIA */}
          {activeTab === 'historico' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-sand-900">Histórico de Uso da IA</h4>
                  <p className="text-[10px] text-sand-500">Registros auditáveis de execuções do Copiloto (LGPD)</p>
                </div>
                <button
                  onClick={fetchAuditLogs}
                  className="px-2.5 py-1 text-xs font-bold text-sand-700 bg-white border border-sand-200 rounded-lg hover:bg-sand-50 cursor-pointer"
                >
                  Atualizar
                </button>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-900 flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-700 shrink-0" />
                <span>Os dados dos prompts privados não são armazenados. Registram-se apenas data, usuário e função acionada.</span>
              </div>

              <div className="space-y-2">
                {auditLogs.length === 0 ? (
                  <p className="text-xs text-sand-500 italic text-center py-4">Nenhum registro de auditoria encontrado.</p>
                ) : (
                  auditLogs.map((log) => (
                    <div key={log.id} className="p-3 bg-white rounded-xl border border-sand-200 text-xs flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sand-900">{formatActionTitle(log.actionUsed)}</p>
                        <p className="text-[10px] text-sand-500 font-mono">
                          {log.userEmail} • {log.durationMs}ms • {log.modelUsed || 'gemini-3.6-flash'}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono text-sand-400">
                        {log.timestamp ? new Date(log.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Hoje'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>
      </motion.aside>

      {/* Side-by-Side Comparison Modal */}
      {comparisonModal && comparisonModal.isOpen && (
        <div className="fixed inset-0 bg-sand-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-5xl rounded-3xl border border-sand-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="p-5 bg-sand-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Sparkles size={20} className="text-amber-400" />
                <div>
                  <h3 className="text-sm font-serif font-bold text-white">{comparisonModal.title}</h3>
                  <p className="text-[10px] text-sand-300 font-mono">Comparativo Lado a Lado (Original vs Sugestão IA)</p>
                </div>
              </div>
              <button
                onClick={() => setComparisonModal(null)}
                className="p-1.5 text-sand-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Disclaimer Banner */}
            <div className="px-5 py-2.5 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs font-medium flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert size={14} className="text-amber-700 shrink-0" />
                <span>{DISCLAIMER_TEXT}</span>
              </div>
            </div>

            {/* Side-by-Side Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 flex-1 overflow-y-auto bg-sand-50">
              
              {/* Left Column: Original */}
              <div className="bg-white p-4 rounded-2xl border border-sand-200 space-y-2 flex flex-col">
                <span className="text-[10px] font-mono font-bold uppercase bg-sand-100 text-sand-800 px-2.5 py-1 rounded-md self-start">
                  📄 Texto Original no Prontuário
                </span>
                <div 
                  className="flex-1 p-3 bg-sand-50/50 rounded-xl border border-sand-100 text-xs font-serif text-sand-800 leading-relaxed overflow-y-auto max-h-[300px]"
                  dangerouslySetInnerHTML={{ __html: comparisonModal.originalText }}
                />
              </div>

              {/* Right Column: Suggested */}
              <div className="bg-white p-4 rounded-2xl border border-emerald-300 shadow-2xs space-y-2 flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase bg-emerald-100 text-emerald-900 px-2.5 py-1 rounded-md">
                    ✨ Sugestão Gerada pelo Copiloto
                  </span>
                  <button
                    onClick={() => setComparisonModal(prev => prev ? { ...prev, isEditing: !prev.isEditing } : null)}
                    className="text-[10px] font-bold text-softblue-700 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 size={12} />
                    <span>{comparisonModal.isEditing ? 'Visualizar HTML' : 'Editar Sugestão'}</span>
                  </button>
                </div>

                {comparisonModal.isEditing ? (
                  <textarea
                    rows={10}
                    value={comparisonModal.editableText}
                    onChange={(e) => setComparisonModal(prev => prev ? { ...prev, editableText: e.target.value } : null)}
                    className="w-full flex-1 p-3 bg-white border border-sand-300 rounded-xl text-xs font-mono text-sand-900 focus:outline-none focus:border-emerald-500"
                  />
                ) : (
                  <div 
                    className="flex-1 p-3 bg-emerald-50/30 rounded-xl border border-emerald-200 text-xs font-serif text-sand-900 leading-relaxed overflow-y-auto max-h-[300px]"
                    dangerouslySetInnerHTML={{ __html: comparisonModal.editableText }}
                  />
                )}
              </div>

            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-white border-t border-sand-200 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => setComparisonModal(null)}
                className="px-4 py-2 border border-sand-200 hover:bg-sand-50 rounded-xl text-xs font-bold text-sand-700 cursor-pointer"
              >
                Descartar
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(comparisonModal.editableText.replace(/<[^>]*>?/gm, ''));
                    alert('Texto da sugestão copiado para a área de transferência!');
                  }}
                  className="px-4 py-2 bg-sand-100 hover:bg-sand-200 text-sand-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy size={14} />
                  <span>Copiar Texto</span>
                </button>

                <button
                  onClick={() => {
                    onApplyText(comparisonModal.editableText);
                    setComparisonModal(null);
                  }}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Check size={16} />
                  <span>Aceitar e Aplicar no Prontuário</span>
                </button>
              </div>
            </div>

          </motion.div>
        </div>
      )}
    </>
  );
};
