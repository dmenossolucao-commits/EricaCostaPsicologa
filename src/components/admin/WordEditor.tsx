import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextAlign } from '@tiptap/extension-text-align';
import { Underline } from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Image } from '@tiptap/extension-image';
import { Link } from '@tiptap/extension-link';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { FontFamily } from '@tiptap/extension-font-family';
import { useSiteContent } from '../../context/SiteContext';
import { CopilotSidebar, DISCLAIMER_TEXT } from './CopilotSidebar';
import { TeleconsultaPanel } from './TeleconsultaPanel';

import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Subscript as SubIcon, Superscript as SuperIcon,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Undo2, Redo2, Type, Palette, Highlighter,
  Table as TableIcon, Image as ImageIcon, FileText, Download, Printer,
  Sparkles, Search, History, Moon, Sun, Maximize2, Minimize2,
  Check, ChevronDown, Plus, Trash2, Link as LinkIcon, Lock, Calendar,
  Clock, ShieldAlert, Sparkle, RefreshCw, Copy, Scissors, Clipboard,
  Indent, Outdent, FileCode, CheckSquare, Smile, HelpCircle, Layers,
  FileCheck, FileSpreadsheet, Eye, Save, CornerDownLeft, AlertCircle,
  Building, Phone, Mail, MapPin, CheckCircle2, ShieldCheck, Award, Video
} from 'lucide-react';

interface WordEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  title?: string;
  patientName?: string;
  patientPhone?: string;
  patientEmail?: string;
  patientId?: string;
  appointmentId?: string;
  initialMeetingLink?: string;
  autoSaveStatus?: 'saved' | 'saving' | 'idle';
  onSave?: () => void;
}

const FONTS = [
  { name: 'Arial (Padrão)', value: 'Arial, sans-serif' },
  { name: 'Times New Roman (Acadêmico)', value: "'Times New Roman', serif" },
  { name: 'Calibri (Corporativo)', value: 'Calibri, sans-serif' },
  { name: 'Inter (Moderno)', value: 'Inter, sans-serif' },
  { name: 'Georgia (Elegante)', value: 'Georgia, serif' },
  { name: 'Courier New (Técnico)', value: "'Courier New', monospace" },
  { name: 'Playfair Display (Serifado)', value: "'Playfair Display', serif" },
  { name: 'Trebuchet MS', value: "'Trebuchet MS', sans-serif" }
];

const FONT_SIZES = [
  '8px', '9px', '10px', '11px', '12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '48px', '72px'
];

const TEXT_COLORS = [
  '#000000', '#1e293b', '#334155', '#475569', '#1d4ed8', '#0284c7',
  '#047857', '#059669', '#b45309', '#d97706', '#be123c', '#e11d48', '#6b21a8'
];

const HIGHLIGHT_COLORS = [
  'transparent', '#fef08a', '#bbf7d0', '#bae6fd', '#fbcfe8', '#fed7aa', '#e9d5ff'
];

export const PAGE_SIZES = [
  { id: 'a4', name: 'A4', dimensions: '210 × 297 mm', widthPx: '794px', minHeightPx: '1123px', cssPageSize: 'A4', rulerTicks: ['0 cm', '5 cm', '10 cm', '15 cm', '20 cm', '21 cm'] },
  { id: 'letter', name: 'Carta / Letter', dimensions: '216 × 279 mm', widthPx: '816px', minHeightPx: '1056px', cssPageSize: 'letter', rulerTicks: ['0 cm', '5 cm', '10 cm', '15 cm', '20 cm', '21.6 cm'] },
  { id: 'legal', name: 'Ofício / Legal', dimensions: '216 × 356 mm', widthPx: '816px', minHeightPx: '1344px', cssPageSize: 'legal', rulerTicks: ['0 cm', '5 cm', '10 cm', '15 cm', '20 cm', '21.6 cm'] },
  { id: 'a5', name: 'A5 (Meia Folha)', dimensions: '148 × 210 mm', widthPx: '559px', minHeightPx: '794px', cssPageSize: 'A5', rulerTicks: ['0 cm', '4 cm', '8 cm', '12 cm', '14.8 cm'] },
  { id: 'a3', name: 'A3 (Ampliada)', dimensions: '297 × 420 mm', widthPx: '1123px', minHeightPx: '1587px', cssPageSize: 'A3', rulerTicks: ['0 cm', '5 cm', '10 cm', '15 cm', '20 cm', '25 cm', '29.7 cm'] },
  { id: 'executive', name: 'Executivo', dimensions: '184 × 267 mm', widthPx: '695px', minHeightPx: '1009px', cssPageSize: 'executive', rulerTicks: ['0 cm', '5 cm', '10 cm', '15 cm', '18.4 cm'] }
];

const CLINICAL_TEMPLATES = [
  {
    id: 'tcc_weekly',
    title: 'Sessão Semanal TCC',
    desc: 'Análise de pensamentos automáticos, esquemas cognitivos e tarefas de casa',
    content: `<h3>SESSÃO PSICOTERAPÊUTICA - ABORDAGEM TCC</h3><p><strong>1. Queixa Principal & Demanda Relatada:</strong><br>O(A) paciente relata que durante a semana vivenciou picos de ansiedade associados a...</p><p><strong>2. Análise Funcional & Cognitiva:</strong><br>Identificados pensamentos automáticos disfuncionais. Reestruturação cognitiva aplicada com identificação das distorções.</p><p><strong>3. Intervenções Técnicas Realizadas:</strong></p><ul><li>Psicoeducação sobre o modelo cognitivo.</li><li>Treino de respiração diafragmática.</li><li>Registro de Pensamentos Disfuncionais (RPD).</li></ul><p><strong>4. Tarefas de Casa & Plano Terapêutico:</strong><br>Preenchimento do diário de humor diário e prática de relaxamento muscular progressivo.</p>`
  },
  {
    id: 'anamnese_first',
    title: 'Primeira Consulta / Anamnese',
    desc: 'Acolhimento inicial, histórico de vida, rede de apoio e enquadre',
    content: `<h3>PRIMEIRA CONSULTA & ANAMNESE CLÍNICA</h3><p><strong>1. Acolhimento & Motivo da Busca:</strong><br>Paciente procurou o serviço de psicologia espontaneamente apresentando queixas de...</p><p><strong>2. Histórico Pessoal & Familiar:</strong><br>Sem histórico pregresso de internações psiquiátricas. Relata boa rede de apoio familiar.</p><p><strong>3. Exame do Estado Mental:</strong><br>Consciente, orientado no tempo e espaço, afeto congruente com o discurso, fala articulada.</p><p><strong>4. Contrato Terapêutico / Enquadre:</strong><br>Acordada frequência semanal de 50 minutos, definição de honorários e política de faltas conforme Código de Ética do Psicólogo.</p>`
  },
  {
    id: 'psicanalise',
    title: 'Sessão Psicanalítica',
    desc: 'Associação livre, livre expressão, conteúdos inconscientes e associação',
    content: `<h3>REGISTRO DE ESCUTA PSICANALÍTICA</h3><p><strong>1. Material Trazido em Associação Livre:</strong><br>Paciente inicia a sessão resgatando memórias e sonhos relacionados ao ambiente familiar e figura paterna...</p><p><strong>2. Posição Transferencial & Resistências:</strong><br>Observa-se postura reflexiva, com momentos de silêncio elaborativo.</p><p><strong>3. Apontamentos e Intervenções do Analista:</strong><br>Pontuações pontuais visando favorecer o deslizamento significante e o insight do sujeito.</p>`
  },
  {
    id: 'infantil',
    title: 'Sessão Infantil / Ludoterapia',
    desc: 'Expressão lúdica, jogos, comportamento e orientação aos pais',
    content: `<h3>ATENDIMENTO INFANTIL / LUDOTERAPIA</h3><p><strong>1. Atividade Lúdica Utilizada:</strong><br>Desenho livre, caixa de brinquedos e jogos de regras.</p><p><strong>2. Expressão Emocional na Brincadeira:</strong><br>A criança projetou dinâmicas de rivalidade e cooperação através dos personagens escolhidos.</p><p><strong>3. Orientação aos Pais / Responsáveis:</strong><br>Realizada devolutiva parcial fornecendo estratégias de manejo comportamental no ambiente escolar e doméstico.</p>`
  },
  {
    id: 'alta_clinica',
    title: 'Alta Clínica / Devolutiva',
    desc: 'Síntese do processo, autonomia alcançada e encerramento',
    content: `<h3>PARECER DE ALTA CLÍNICA E CONCLUSÃO DE ACOMPANHAMENTO</h3><p><strong>1. Objetivos Alcançados:</strong><br>Remissão significativa dos sintomas iniciais, desenvolvimento de estratégias saudáveis de enfrentamento e maior autonomia emocional.</p><p><strong>2. Recomendações Finais:</strong><br>Manutenção dos hábitos de autocuidado. Portas abertas para sessões de manutenção em caso de reavaliação futura.</p>`
  }
];

export const WordEditor: React.FC<WordEditorProps> = ({
  value,
  onChange,
  placeholder = 'Digite o texto do prontuário ou evolução clínica aqui...',
  className = '',
  title = 'Evolução Clínica do Prontuário',
  patientName,
  patientPhone,
  patientEmail,
  patientId,
  appointmentId,
  initialMeetingLink,
  autoSaveStatus = 'saved',
  onSave
}) => {
  // Site Content & Clinic Branding
  const { siteContent } = useSiteContent();
  const clinicInfo = siteContent?.psychologist_info;
  const appearanceInfo = siteContent?.appearance;

  const clinicName = clinicInfo?.clinicName || clinicInfo?.name || 'Clínica MenteCare de Psicologia';
  const psychologistName = clinicInfo?.name || 'Dr(a). Psicólogo(a)';
  const professionalTitle = clinicInfo?.title || 'Psicólogo(a) Clínico(a)';
  const crpNumber = clinicInfo?.crp ? (clinicInfo.crp.toUpperCase().startsWith('CRP') ? clinicInfo.crp : `CRP ${clinicInfo.crp}`) : 'CRP 00/00000';
  const logoUrl = clinicInfo?.logoUrl || appearanceInfo?.logoUrl;
  const contactEmail = clinicInfo?.email || 'contato@mentecare.com.br';
  const contactPhone = clinicInfo?.phoneFormatted || clinicInfo?.phone || '(11) 99999-9999';
  const contactLocation = clinicInfo?.location || 'Atendimento Online & Presencial';

  // Active Ribbon Tab state
  const [activeTab, setActiveTab] = useState<'arquivo' | 'inicio' | 'teleconsulta' | 'inserir' | 'formatar' | 'ia' | 'exibir' | 'pesquisa' | 'historico'>('teleconsulta');
  
  // Teleconsulta Panel Visibility
  const [isTeleconsultaVisible, setIsTeleconsultaVisible] = useState<boolean>(true);

  // Display modes & Theme
  const [editorTheme, setEditorTheme] = useState<'light' | 'dark'>('light');
  const [focusMode, setFocusMode] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [showRuler, setShowRuler] = useState(true);
  const [watermark, setWatermark] = useState<'CONFIDENCIAL' | 'PRONTUARIO' | 'RESTRITO' | 'NONE'>('NONE');
  const [pageMargin, setPageMargin] = useState<'normal' | 'narrow' | 'wide'>('normal');
  const [pageSize, setPageSize] = useState<'a4' | 'letter' | 'legal' | 'a5' | 'a3' | 'executive'>('a4');
  
  // Sheet Template Layout Options
  const [sheetLayoutMode, setSheetLayoutMode] = useState<'timbrado' | 'compacto' | 'simples'>('timbrado');
  const [showSignatureBlock, setShowSignatureBlock] = useState(true);
  const [isDigitalSignatureChecked, setIsDigitalSignatureChecked] = useState(true);

  // Copiloto Clínico IA States
  const [isCopilotOn, setIsCopilotOn] = useState<boolean>(true);
  const [isCopilotSidebarOpen, setIsCopilotSidebarOpen] = useState<boolean>(false);
  const [isPrivateMode, setIsPrivateMode] = useState<boolean>(false);

  const activePageConfig = PAGE_SIZES.find(p => p.id === pageSize) || PAGE_SIZES[0];

  // AI Modal & Processing
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiSuccessMessage, setAiSuccessMessage] = useState<string | null>(null);

  // Search & Replace state
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [searchResultsCount, setSearchResultsCount] = useState<number | null>(null);

  // History snapshots
  const [historySnapshots, setHistorySnapshots] = useState<{ id: string; time: string; text: string }[]>([]);

  // Selected Font & Color state for Dropdowns
  const [showFontDropdown, setShowFontDropdown] = useState(false);
  const [showSizeDropdown, setShowSizeDropdown] = useState(false);
  const [showColorDropdown, setShowColorDropdown] = useState(false);
  const [showHighlightDropdown, setShowHighlightDropdown] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');

  // Setup TipTap Editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Subscript,
      Superscript,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      FontFamily,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
      Image,
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: value || '<p></p>',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html === '<p></p>' ? '' : html);
    },
  });

  // Sync editor content with incoming external value if out of sync
  useEffect(() => {
    if (editor && value !== undefined) {
      if (editor.getHTML() !== value) {
        editor.commands.setContent(value || '<p></p>');
      }
    }
  }, [value, editor]);

  // Save history snapshot every time value changes significantly
  useEffect(() => {
    if (!value || value === '<p></p>') return;
    const nowStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setHistorySnapshots(prev => {
      if (prev.length > 0 && prev[0].text === value) return prev;
      return [{ id: Date.now().toString(), time: nowStr, text: value }, ...prev.slice(0, 9)];
    });
  }, [value]);

  if (!editor) {
    return <div className="p-8 text-center text-sand-500 font-mono text-xs">Carregando Editor Word MenteCare...</div>;
  }

  // Calculate statistics
  const textContent = editor.getText();
  const wordCount = textContent.trim() === '' ? 0 : textContent.trim().split(/\s+/).length;
  const charCount = textContent.length;
  const pageEstimate = Math.max(1, Math.ceil(wordCount / 350));

  // AI Operations Handler
  const handleAiAction = async (action: string) => {
    try {
      setAiLoading(true);
      setAiSuccessMessage(null);
      const selectedOrFullText = editor.state.selection.empty
        ? editor.getText()
        : editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to, ' ');

      if (!selectedOrFullText || selectedOrFullText.trim() === '') {
        alert('Por favor, digite algum texto ou selecione um trecho para aplicar a inteligência artificial.');
        setAiLoading(false);
        return;
      }

      const res = await fetch('/api/ai/transform-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, text: selectedOrFullText }),
      });

      const data = await res.json();
      if (data.success && data.transformedText) {
        if (!editor.state.selection.empty) {
          editor.commands.insertContent(data.transformedText);
        } else {
          editor.commands.setContent(data.transformedText);
        }
        setAiSuccessMessage('Texto processado e atualizado com sucesso via IA!');
        setTimeout(() => setAiSuccessMessage(null), 4000);
      } else {
        alert('Erro ao processar IA: ' + (data.error || 'Falha ao comunicar com o servidor'));
      }
    } catch (err: any) {
      console.error('AI Error:', err);
      alert('Ocorreu um erro ao executar o assistente de IA.');
    } finally {
      setAiLoading(false);
    }
  };

  // Export Document functions
  const exportAsFile = (type: 'pdf' | 'docx' | 'txt' | 'html' | 'odt') => {
    const filename = `Prontuario_${patientName ? patientName.replace(/\s+/g, '_') : 'Evolucao'}_${new Date().toISOString().split('T')[0]}`;
    
    if (type === 'txt') {
      const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.txt`;
      a.click();
    } else if (type === 'html') {
      const fullHtml = `<!DOCTYPE html><html><head><title>${title}</title><style>body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }</style></head><body><h2>${title}</h2>${editor.getHTML()}</body></html>`;
      const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.html`;
      a.click();
    } else if (type === 'docx' || type === 'odt') {
      const docxHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>${title}</title>
      <style>body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.5; padding: 2cm; }</style>
      </head><body><h2 style='color:#1e293b;'>${title}</h2><hr/>${editor.getHTML()}</body></html>`;
      const blob = new Blob([docxHtml], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.${type}`;
      a.click();
    } else if (type === 'pdf') {
      handlePrint();
    }
  };

  // Print Window / A4 Document Output
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title} - ${clinicName}</title>
          <style>
            @page { size: ${activePageConfig.cssPageSize}; margin: 15mm; }
            body { font-family: 'Calibri', Arial, sans-serif; color: #1e293b; line-height: 1.6; padding: 0; margin: 0; }
            .top-bar { height: 4px; background: linear-gradient(90deg, #0284c7, #10b981, #f59e0b); margin-bottom: 16px; }
            .header-container { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 20px; }
            .clinic-logo-box { display: flex; align-items: center; gap: 12px; max-width: 65%; }
            .clinic-logo { height: 50px; width: auto; object-fit: contain; }
            .clinic-name { font-size: 16px; font-weight: bold; color: #0f172a; text-transform: uppercase; margin: 0; letter-spacing: 0.5px; }
            .clinic-sub { font-size: 11px; color: #0284c7; font-weight: 600; margin-top: 2px; }
            .clinic-contacts { font-size: 9px; color: #64748b; font-family: monospace; margin-top: 4px; }
            .patient-box { background: #f8fafc; border: 1px solid #cbd5e1; padding: 8px 12px; border-radius: 6px; text-align: right; min-width: 180px; }
            .patient-box-title { font-size: 8px; font-weight: bold; color: #0369a1; text-transform: uppercase; font-family: monospace; }
            .patient-name { font-size: 12px; font-weight: bold; color: #0f172a; margin: 2px 0; }
            .doc-date { font-size: 10px; color: #64748b; font-family: monospace; }
            .content { font-size: 13px; min-height: 520px; color: #0f172a; line-height: 1.7; }
            .signature-section { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: flex-end; page-break-inside: avoid; }
            .sig-info { max-width: 250px; font-size: 9px; color: #64748b; background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px; border-radius: 6px; }
            .sig-box { text-align: center; }
            .sig-digital-badge { display: inline-block; font-size: 9px; font-weight: bold; color: #047857; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 3px 8px; border-radius: 4px; margin-bottom: 6px; font-family: monospace; }
            .sig-line { width: 220px; border-bottom: 1.5px solid #334155; margin: 0 auto 6px auto; }
            .sig-name { font-size: 12px; font-weight: bold; color: #0f172a; margin: 0; }
            .sig-title { font-size: 10px; color: #0284c7; font-family: monospace; margin-top: 2px; font-weight: bold; }
            .footer-sub { border-top: 1px solid #f1f5f9; margin-top: 20px; padding-top: 8px; font-size: 8px; color: #94a3b8; font-family: monospace; text-align: center; }
            .watermark { position: fixed; top: 40%; left: 12%; transform: rotate(-30deg); font-size: 55px; font-weight: bold; color: rgba(226, 232, 240, 0.45); pointer-events: none; z-index: -1; text-transform: uppercase; }
            table { width: 100%; border-collapse: collapse; margin: 12px 0; }
            th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
            th { background-color: #f8fafc; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="top-bar"></div>
          ${watermark !== 'NONE' ? `<div class="watermark">${watermark === 'CONFIDENCIAL' ? 'CONFIDENCIAL • SIGILO CFP' : watermark === 'PRONTUARIO' ? 'PRONTUÁRIO ELETRÔNICO' : 'USO RESTRITO DA CLÍNICA'}</div>` : ''}
          
          <div class="header-container">
            <div class="clinic-logo-box">
              ${logoUrl ? `<img src="${logoUrl}" class="clinic-logo" alt="Logo da Clínica" />` : ''}
              <div>
                <h1 class="clinic-name">${clinicName}</h1>
                <div class="clinic-sub">${professionalTitle}</div>
                <div class="clinic-contacts">${contactPhone} • ${contactEmail} • ${contactLocation}</div>
              </div>
            </div>
            <div class="patient-box">
              <div class="patient-box-title">REGISTRO DE EVOLUÇÃO CLÍNICA</div>
              <div class="patient-name">${patientName ? `Paciente: ${patientName}` : 'Paciente: Não informado'}</div>
              <div class="doc-date">Data: ${new Date().toLocaleDateString('pt-BR')} • ${crpNumber}</div>
            </div>
          </div>

          <div class="content">
            ${editor.getHTML()}
          </div>

          ${showSignatureBlock ? `
          <div class="signature-section">
            <div class="sig-info">
              <strong>DOCUMENTO DO PRONTUÁRIO ELETRÔNICO</strong><br/>
              Protegido pelo sigilo profissional (Resolução CFP Nº 01/2009 e Código de Ética do Psicólogo).
            </div>
            <div class="sig-box">
              ${isDigitalSignatureChecked ? `<div class="sig-digital-badge">✓ Assinado Digitalmente • Validade Jurídica</div>` : ''}
              <div class="sig-line"></div>
              <div class="sig-name">${psychologistName}</div>
              .
              <div class="sig-title">${professionalTitle} • ${crpNumber}</div>
            </div>
          </div>
          ` : ''}

          <div class="footer-sub">
            ${clinicName} • ${crpNumber} • DOCUMENTO EMITIDO VIA MENTECARE PRONTUÁRIO ELETRÔNICO
          </div>

          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Search & Replace execution
  const executeSearchReplace = (replaceSingle: boolean = true) => {
    if (!searchQuery) return;
    const html = editor.getHTML();
    const regex = new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = html.match(regex);
    
    setSearchResultsCount(matches ? matches.length : 0);

    if (replaceQuery !== undefined && matches && matches.length > 0) {
      let newHtml = html;
      if (replaceSingle) {
        newHtml = html.replace(regex, replaceQuery);
      } else {
        newHtml = html.replace(regex, replaceQuery);
      }
      editor.commands.setContent(newHtml);
    }
  };

  // Insert signature block
  const insertSignatureBlock = () => {
    const todayStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    const signatureHtml = `
      <div style="margin-top: 30px; padding: 16px; border: 1px solid #cbd5e1; border-radius: 12px; background-color: #f8fafc; max-width: 400px;">
        <p style="margin: 0; font-size: 11px; font-weight: bold; color: #0f172a; font-family: monospace;">ASSINATURA DIGITAL DO PROFISSIONAL</p>
        <p style="margin: 4px 0 0 0; font-size: 12px; font-weight: bold; color: #0284c7;">Psicóloga Erica Costa</p>
        <p style="margin: 0; font-size: 10px; color: #64748b;">CRP 11/XXXXX • Psicóloga Clínica MenteCare</p>
        <p style="margin: 8px 0 0 0; font-size: 9px; color: #10b981; font-weight: bold; font-family: monospace;">
          ✓ VALIDADO DIGITALMENTE EM ${todayStr.toUpperCase()}
        </p>
      </div>
    `;
    editor.commands.insertContent(signatureHtml);
  };

  return (
    <div className={`flex flex-col border border-sand-300 rounded-2xl bg-sand-100 overflow-hidden shadow-xl transition-all ${editorTheme === 'dark' ? 'bg-sand-950 text-white border-sand-800' : 'bg-sand-100 text-sand-900'} ${focusMode ? 'fixed inset-0 z-50 rounded-none border-none' : 'w-full'} ${className}`}>

      {/* 1. TOP WINDOW BAR (MS WORD 365 RIBBON HEADER) */}
      <div className="bg-softblue-900 text-white px-3 py-2 sm:px-4 flex flex-wrap items-center justify-between gap-2 border-b border-softblue-950 select-none">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-7 w-7 rounded-lg bg-softblue-600 flex items-center justify-center font-bold text-xs font-serif shadow-xs shrink-0">
            W
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold font-serif tracking-wide truncate max-w-[160px] sm:max-w-none">{title}</span>
              <span className="text-[9px] font-mono bg-softblue-800 text-softblue-200 px-2 py-0.5 rounded-full border border-softblue-700 font-semibold shrink-0">
                Word 365 MenteCare
              </span>
            </div>
            {patientName && (
              <p className="text-[10px] text-softblue-300 font-mono truncate">Paciente: {patientName}</p>
            )}
          </div>
        </div>

        {/* Top Actions & Save Status */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* COPILOTO CLÍNICO INTERACTIVE TOGGLE */}
          <div className="flex items-center gap-2 bg-softblue-950/90 border border-amber-500/40 rounded-xl px-2.5 py-1 shadow-2xs">
            <Sparkles size={14} className={isCopilotOn ? "text-amber-400 animate-pulse shrink-0" : "text-softblue-400 shrink-0"} />
            <span className="text-[11px] font-extrabold text-amber-200 font-serif tracking-tight whitespace-nowrap">Copiloto IA</span>
            
            {/* Toggle Switch Button */}
            <button
              type="button"
              onClick={() => {
                const nextState = !isCopilotOn;
                setIsCopilotOn(nextState);
                if (nextState) {
                  setIsCopilotSidebarOpen(true);
                } else {
                  setIsCopilotSidebarOpen(false);
                }
              }}
              title={isCopilotOn ? "Desativar Copiloto Clínico IA" : "Ativar Copiloto Clínico IA"}
              className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isCopilotOn ? 'bg-emerald-500' : 'bg-softblue-800'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  isCopilotOn ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-[10px] font-mono font-bold uppercase shrink-0 ${isCopilotOn ? 'text-emerald-300' : 'text-softblue-400'}`}>
              {isCopilotOn ? '● On' : '○ Off'}
            </span>

            {isCopilotOn && (
              <button
                type="button"
                onClick={() => setIsCopilotSidebarOpen(!isCopilotSidebarOpen)}
                className="ml-0.5 px-2 py-0.5 bg-amber-500 hover:bg-amber-600 text-sand-950 rounded-md text-[10px] font-extrabold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs shrink-0"
              >
                <span>{isCopilotSidebarOpen ? 'Painel' : 'Abrir Painel'}</span>
              </button>
            )}
          </div>

          {/* Auto Save Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-softblue-950/80 border border-softblue-800 font-mono text-[10px]">
            {autoSaveStatus === 'saving' ? (
              <>
                <RefreshCw size={11} className="animate-spin text-amber-400" />
                <span className="text-amber-300 font-bold">Salvando...</span>
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-300 font-bold">Salvo no Firebase</span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setFocusMode(!focusMode)}
            title={focusMode ? 'Sair do Modo Foco' : 'Modo Foco / Tela Cheia'}
            className="p-1.5 hover:bg-softblue-800 rounded-lg text-softblue-200 hover:text-white transition-colors cursor-pointer"
          >
            {focusMode ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>
      </div>

      {/* 2. RIBBON TABS MENU */}
      <div className="bg-white border-b border-sand-250 select-none">
        <div className="flex items-center px-2 gap-1 border-b border-sand-150 text-xs font-medium text-sand-700 bg-sand-50/80">
          {[
            { id: 'teleconsulta', label: '📹 Teleconsulta Meet', icon: <Video size={13} className="text-emerald-600 animate-pulse" /> },
            { id: 'arquivo', label: 'Arquivo', icon: <FileText size={13} /> },
            { id: 'inicio', label: 'Página Inicial', icon: <Type size={13} /> },
            { id: 'inserir', label: 'Inserir', icon: <Plus size={13} /> },
            { id: 'formatar', label: 'Formatar & Estilo', icon: <Palette size={13} /> },
            { id: 'ia', label: 'IA Clínica', icon: <Sparkles size={13} className="text-amber-500" /> },
            { id: 'exibir', label: 'Exibir & Zoom', icon: <Eye size={13} /> },
            { id: 'pesquisa', label: 'Localizar', icon: <Search size={13} /> },
            { id: 'historico', label: 'Histórico', icon: <History size={13} /> }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-2 flex items-center gap-1.5 border-b-2 font-semibold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'border-softblue-600 text-softblue-800 bg-white font-bold shadow-2xs'
                  : 'border-transparent hover:text-sand-950 hover:bg-sand-100/60'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* 3. RIBBON TOOLBAR PANEL CONTENT */}
        <div className="p-2.5 bg-white flex flex-wrap items-center gap-2 text-xs min-h-[52px]">

          {/* TAB: TELECONSULTA */}
          {activeTab === 'teleconsulta' && (
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setIsTeleconsultaVisible(!isTeleconsultaVisible)}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer text-xs transition-colors ${
                  isTeleconsultaVisible 
                    ? 'bg-emerald-600 text-white shadow-xs' 
                    : 'bg-sand-100 text-sand-800 hover:bg-sand-200'
                }`}
              >
                <Video size={14} />
                <span>{isTeleconsultaVisible ? 'Painel de Vídeo Ativo' : 'Exibir Painel de Teleconsulta'}</span>
              </button>

              <div className="h-5 w-[1px] bg-sand-200" />

              <span className="text-[11px] font-mono text-sand-600">
                Sessão por vídeo via Google Meet integrada com prontuário e Copiloto IA.
              </span>
            </div>
          )}

          {/* TAB: ARQUIVO */}
          {activeTab === 'arquivo' && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowTemplatesModal(true)}
                className="px-3 py-1.5 bg-softblue-600 hover:bg-softblue-700 text-white rounded-lg font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Layers size={14} />
                <span>Modelos de Prontuário</span>
              </button>

              <div className="h-5 w-[1px] bg-sand-200 mx-1" />

              <span className="text-[10px] font-bold text-sand-400 uppercase font-mono">Exportar:</span>
              
              <button
                type="button"
                onClick={() => exportAsFile('pdf')}
                className="px-2.5 py-1.5 border border-sand-200 hover:bg-sand-100 rounded-lg font-bold text-sand-800 flex items-center gap-1 cursor-pointer text-[11px]"
              >
                <Download size={13} className="text-rose-600" />
                <span>PDF (Imprimir)</span>
              </button>

              <button
                type="button"
                onClick={() => exportAsFile('docx')}
                className="px-2.5 py-1.5 border border-sand-200 hover:bg-sand-100 rounded-lg font-bold text-sand-800 flex items-center gap-1 cursor-pointer text-[11px]"
              >
                <FileText size={13} className="text-softblue-600" />
                <span>DOCX (Word)</span>
              </button>

              <button
                type="button"
                onClick={() => exportAsFile('txt')}
                className="px-2.5 py-1.5 border border-sand-200 hover:bg-sand-100 rounded-lg font-bold text-sand-800 flex items-center gap-1 cursor-pointer text-[11px]"
              >
                <FileCode size={13} className="text-emerald-600" />
                <span>TXT</span>
              </button>

              <button
                type="button"
                onClick={() => exportAsFile('html')}
                className="px-2.5 py-1.5 border border-sand-200 hover:bg-sand-100 rounded-lg font-bold text-sand-800 flex items-center gap-1 cursor-pointer text-[11px]"
              >
                <FileSpreadsheet size={13} className="text-amber-600" />
                <span>HTML</span>
              </button>

              <div className="h-5 w-[1px] bg-sand-200 mx-1" />

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-sand-500 uppercase font-mono">Tamanho da Folha:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(e.target.value as any)}
                  className="text-xs font-bold bg-sand-50 border border-sand-200 rounded-lg px-2 py-1 text-sand-800 outline-none cursor-pointer focus:border-softblue-500"
                >
                  {PAGE_SIZES.map(p => (
                    <option key={p.id} value={p.id}>
                      📄 {p.name} ({p.dimensions})
                    </option>
                  ))}
                </select>
              </div>

              <div className="h-5 w-[1px] bg-sand-200 mx-1" />

              <button
                type="button"
                onClick={handlePrint}
                className="px-3 py-1.5 bg-sand-900 hover:bg-sand-950 text-white rounded-lg font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer size={14} />
                <span>Imprimir A4</span>
              </button>
            </div>
          )}

          {/* TAB: PÁGINA INICIAL */}
          {activeTab === 'inicio' && (
            <div className="flex flex-wrap items-center gap-1.5">
              
              {/* Undo / Redo */}
              <div className="flex items-center bg-sand-50 rounded-lg p-0.5 border border-sand-200">
                <button
                  type="button"
                  onClick={() => editor.chain().focus().undo().run()}
                  disabled={!editor.can().undo()}
                  title="Desfazer (Ctrl+Z)"
                  className="p-1.5 hover:bg-sand-200/60 rounded disabled:opacity-30 text-sand-700 cursor-pointer"
                >
                  <Undo2 size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().redo().run()}
                  disabled={!editor.can().redo()}
                  title="Refazer (Ctrl+Y)"
                  className="p-1.5 hover:bg-sand-200/60 rounded disabled:opacity-30 text-sand-700 cursor-pointer"
                >
                  <Redo2 size={14} />
                </button>
              </div>

              <div className="h-5 w-[1px] bg-sand-200 mx-1" />

              {/* Font Family Dropdown */}
              <div className="relative">
                <select
                  onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
                  className="text-xs font-semibold bg-white border border-sand-200 rounded-lg px-2.5 py-1 text-sand-800 outline-none hover:border-sand-300 focus:ring-1 focus:ring-softblue-500 cursor-pointer h-7"
                >
                  {FONTS.map(f => (
                    <option key={f.value} value={f.value}>{f.name}</option>
                  ))}
                </select>
              </div>

              {/* Font Size Selector */}
              <div className="relative">
                <select
                  onChange={(e) => editor.chain().focus().run()} // Note: size applied via custom style
                  className="text-xs font-semibold bg-white border border-sand-200 rounded-lg px-2 py-1 text-sand-800 outline-none hover:border-sand-300 focus:ring-1 focus:ring-softblue-500 cursor-pointer h-7"
                >
                  {FONT_SIZES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="h-5 w-[1px] bg-sand-200 mx-1" />

              {/* Bold, Italic, Underline, Strikethrough, Subscript, Superscript */}
              <div className="flex items-center bg-sand-50 rounded-lg p-0.5 border border-sand-200 gap-0.5">
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  title="Negrito"
                  className={`p-1.5 rounded cursor-pointer ${editor.isActive('bold') ? 'bg-softblue-600 text-white font-bold' : 'hover:bg-sand-200/60 text-sand-800'}`}
                >
                  <Bold size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  title="Itálico"
                  className={`p-1.5 rounded cursor-pointer ${editor.isActive('italic') ? 'bg-softblue-600 text-white' : 'hover:bg-sand-200/60 text-sand-800'}`}
                >
                  <Italic size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleUnderline().run()}
                  title="Sublinhado"
                  className={`p-1.5 rounded cursor-pointer ${editor.isActive('underline') ? 'bg-softblue-600 text-white' : 'hover:bg-sand-200/60 text-sand-800'}`}
                >
                  <UnderlineIcon size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleStrike().run()}
                  title="Tachado"
                  className={`p-1.5 rounded cursor-pointer ${editor.isActive('strike') ? 'bg-softblue-600 text-white' : 'hover:bg-sand-200/60 text-sand-800'}`}
                >
                  <Strikethrough size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleSubscript().run()}
                  title="Subscrito"
                  className={`p-1.5 rounded cursor-pointer ${editor.isActive('subscript') ? 'bg-softblue-600 text-white' : 'hover:bg-sand-200/60 text-sand-800'}`}
                >
                  <SubIcon size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleSuperscript().run()}
                  title="Sobrescrito"
                  className={`p-1.5 rounded cursor-pointer ${editor.isActive('superscript') ? 'bg-softblue-600 text-white' : 'hover:bg-sand-200/60 text-sand-800'}`}
                >
                  <SuperIcon size={14} />
                </button>
              </div>

              <div className="h-5 w-[1px] bg-sand-200 mx-1" />

              {/* Text Color & Highlight Pickers */}
              <div className="relative flex items-center gap-1">
                <input
                  type="color"
                  title="Cor do Texto"
                  onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
                  className="w-7 h-7 p-0 border border-sand-200 rounded-lg cursor-pointer overflow-hidden"
                />
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleHighlight({ color: '#fef08a' }).run()}
                  title="Marca-Texto Amarelo"
                  className="p-1.5 bg-yellow-100 hover:bg-yellow-200 text-yellow-900 border border-yellow-300 rounded-lg cursor-pointer"
                >
                  <Highlighter size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().unsetAllMarks().run()}
                  title="Limpar Formatação"
                  className="p-1.5 hover:bg-sand-100 text-sand-600 rounded-lg cursor-pointer border border-sand-200"
                >
                  <Type size={14} className="line-through" />
                </button>
              </div>

              <div className="h-5 w-[1px] bg-sand-200 mx-1" />

              {/* Alignments */}
              <div className="flex items-center bg-sand-50 rounded-lg p-0.5 border border-sand-200 gap-0.5">
                <button
                  type="button"
                  onClick={() => editor.chain().focus().setTextAlign('left').run()}
                  title="Alinhar à Esquerda"
                  className={`p-1.5 rounded cursor-pointer ${editor.isActive({ textAlign: 'left' }) ? 'bg-softblue-600 text-white' : 'hover:bg-sand-200/60 text-sand-800'}`}
                >
                  <AlignLeft size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().setTextAlign('center').run()}
                  title="Centralizar"
                  className={`p-1.5 rounded cursor-pointer ${editor.isActive({ textAlign: 'center' }) ? 'bg-softblue-600 text-white' : 'hover:bg-sand-200/60 text-sand-800'}`}
                >
                  <AlignCenter size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().setTextAlign('right').run()}
                  title="Alinhar à Direita"
                  className={`p-1.5 rounded cursor-pointer ${editor.isActive({ textAlign: 'right' }) ? 'bg-softblue-600 text-white' : 'hover:bg-sand-200/60 text-sand-800'}`}
                >
                  <AlignRight size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                  title="Justificar"
                  className={`p-1.5 rounded cursor-pointer ${editor.isActive({ textAlign: 'justify' }) ? 'bg-softblue-600 text-white' : 'hover:bg-sand-200/60 text-sand-800'}`}
                >
                  <AlignJustify size={14} />
                </button>
              </div>

              <div className="h-5 w-[1px] bg-sand-200 mx-1" />

              {/* Bullet and Numbered Lists */}
              <div className="flex items-center bg-sand-50 rounded-lg p-0.5 border border-sand-200 gap-0.5">
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleBulletList().run()}
                  title="Lista com Marcadores"
                  className={`p-1.5 rounded cursor-pointer ${editor.isActive('bulletList') ? 'bg-softblue-600 text-white' : 'hover:bg-sand-200/60 text-sand-800'}`}
                >
                  <List size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleOrderedList().run()}
                  title="Lista Numerada"
                  className={`p-1.5 rounded cursor-pointer ${editor.isActive('orderedList') ? 'bg-softblue-600 text-white' : 'hover:bg-sand-200/60 text-sand-800'}`}
                >
                  <ListOrdered size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleBlockquote().run()}
                  title="Bloco de Citação"
                  className={`p-1.5 rounded cursor-pointer ${editor.isActive('blockquote') ? 'bg-softblue-600 text-white' : 'hover:bg-sand-200/60 text-sand-800'}`}
                >
                  <FileText size={14} />
                </button>
              </div>

            </div>
          )}

          {/* TAB: INSERIR */}
          {activeTab === 'inserir' && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                className="px-2.5 py-1.5 border border-sand-200 hover:bg-sand-100 rounded-lg font-bold text-sand-800 flex items-center gap-1 cursor-pointer text-xs"
              >
                <TableIcon size={14} className="text-softblue-600" />
                <span>Tabela (3x3)</span>
              </button>

              <button
                type="button"
                onClick={() => setShowImageModal(true)}
                className="px-2.5 py-1.5 border border-sand-200 hover:bg-sand-100 rounded-lg font-bold text-sand-800 flex items-center gap-1 cursor-pointer text-xs"
              >
                <ImageIcon size={14} className="text-emerald-600" />
                <span>Inserir Imagem</span>
              </button>

              <button
                type="button"
                onClick={insertSignatureBlock}
                className="px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg font-bold text-emerald-800 flex items-center gap-1 cursor-pointer text-xs"
              >
                <Lock size={13} className="text-emerald-600" />
                <span>Assinatura Digital CFP</span>
              </button>

              <button
                type="button"
                onClick={() => editor.chain().focus().setHorizontalRule().run()}
                className="px-2.5 py-1.5 border border-sand-200 hover:bg-sand-100 rounded-lg font-bold text-sand-800 flex items-center gap-1 cursor-pointer text-xs"
              >
                <CornerDownLeft size={13} />
                <span>Linha Divisória</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const nowStr = new Date().toLocaleDateString('pt-BR') + ' às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                  editor.commands.insertContent(` <strong>[${nowStr}]</strong> `);
                }}
                className="px-2.5 py-1.5 border border-sand-200 hover:bg-sand-100 rounded-lg font-bold text-sand-800 flex items-center gap-1 cursor-pointer text-xs"
              >
                <Calendar size={13} className="text-amber-600" />
                <span>Data/Hora Atual</span>
              </button>
            </div>
          )}

          {/* TAB: FORMATAR */}
          {activeTab === 'formatar' && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-sand-500 uppercase font-mono">Timbrado:</span>
                <select
                  value={sheetLayoutMode}
                  onChange={(e) => setSheetLayoutMode(e.target.value as any)}
                  className="text-xs font-bold bg-amber-50 border border-amber-300 rounded-lg px-2.5 py-1 text-amber-900 outline-none cursor-pointer focus:border-amber-500 shadow-2xs"
                >
                  <option value="timbrado">🏛️ Timbrado Oficial da Clínica</option>
                  <option value="compacto">📑 Cabeçalho Compacto</option>
                  <option value="simples">📄 Folha Simples</option>
                </select>
              </div>

              <div className="h-5 w-[1px] bg-sand-200" />

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-sand-500 uppercase font-mono">Tamanho da Folha:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(e.target.value as any)}
                  className="text-xs font-bold bg-softblue-50 border border-softblue-200 rounded-lg px-2.5 py-1 text-softblue-900 outline-none cursor-pointer focus:border-softblue-500 shadow-2xs"
                >
                  {PAGE_SIZES.map(p => (
                    <option key={p.id} value={p.id}>
                      📄 {p.name} ({p.dimensions})
                    </option>
                  ))}
                </select>
              </div>

              <div className="h-5 w-[1px] bg-sand-200" />

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-sand-500 uppercase font-mono">Margens:</span>
                <select
                  value={pageMargin}
                  onChange={(e) => setPageMargin(e.target.value as any)}
                  className="text-xs font-semibold bg-white border border-sand-200 rounded-lg px-2 py-1 text-sand-800 outline-none cursor-pointer"
                >
                  <option value="normal">Normal (2.5 cm)</option>
                  <option value="narrow">Estreita (1.2 cm)</option>
                  <option value="wide">Larga (3.8 cm)</option>
                </select>
              </div>

              <div className="h-5 w-[1px] bg-sand-200" />

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-sand-500 uppercase font-mono">Marca d'água:</span>
                <select
                  value={watermark}
                  onChange={(e) => setWatermark(e.target.value as any)}
                  className="text-xs font-semibold bg-white border border-sand-200 rounded-lg px-2 py-1 text-sand-800 outline-none cursor-pointer"
                >
                  <option value="CONFIDENCIAL">CONFIDENCIAL • CFP</option>
                  <option value="PRONTUARIO">PRONTUÁRIO ELETRÔNICO</option>
                  <option value="RESTRITO">USO RESTRITO</option>
                  <option value="NONE">Sem marca d'água</option>
                </select>
              </div>

              <div className="h-5 w-[1px] bg-sand-200" />

              {/* Signature Toggle Controls */}
              <label className="flex items-center gap-1.5 text-xs font-bold text-sand-800 cursor-pointer select-none bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                <input
                  type="checkbox"
                  checked={showSignatureBlock}
                  onChange={(e) => setShowSignatureBlock(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                />
                <span>Bloco de Assinatura</span>
              </label>

              {showSignatureBlock && (
                <label className="flex items-center gap-1.5 text-xs font-semibold text-emerald-900 cursor-pointer select-none bg-white px-2 py-1 rounded-lg border border-emerald-200">
                  <input
                    type="checkbox"
                    checked={isDigitalSignatureChecked}
                    onChange={(e) => setIsDigitalSignatureChecked(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                  />
                  <span>Selo Digital</span>
                </label>
              )}
            </div>
          )}

          {/* TAB: IA CLINICA */}
          {activeTab === 'ia' && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsCopilotOn(true);
                  setIsCopilotSidebarOpen(!isCopilotSidebarOpen);
                }}
                className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-sand-950 font-extrabold rounded-lg flex items-center gap-1.5 cursor-pointer text-xs shadow-xs"
              >
                <Sparkles size={14} className="text-sand-950" />
                <span>{isCopilotSidebarOpen ? 'Fechar Painel Copiloto' : '✨ Abrir Copiloto Clínico IA'}</span>
              </button>

              <div className="h-5 w-[1px] bg-sand-200 mx-1" />

              <button
                type="button"
                onClick={() => handleAiAction('improve')}
                disabled={aiLoading}
                className="px-2.5 py-1.5 bg-softblue-50 hover:bg-softblue-100 text-softblue-800 border border-softblue-200 rounded-lg font-bold flex items-center gap-1 cursor-pointer text-xs"
              >
                <span>✨ Melhorar Texto</span>
              </button>

              <button
                type="button"
                onClick={() => handleAiAction('grammar')}
                disabled={aiLoading}
                className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg font-bold flex items-center gap-1 cursor-pointer text-xs"
              >
                <span>✍️ Corrigir Gramática</span>
              </button>

              <button
                type="button"
                onClick={() => handleAiAction('summarize')}
                disabled={aiLoading}
                className="px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-lg font-bold flex items-center gap-1 cursor-pointer text-xs"
              >
                <span>📝 Resumir Evolução</span>
              </button>

              <button
                type="button"
                onClick={() => handleAiAction('expand')}
                disabled={aiLoading}
                className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-lg font-bold flex items-center gap-1 cursor-pointer text-xs"
              >
                <span>🔍 Expandir Texto</span>
              </button>

              <button
                type="button"
                onClick={() => handleAiAction('rewrite')}
                disabled={aiLoading}
                className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg font-bold flex items-center gap-1 cursor-pointer text-xs"
              >
                <span>🔄 Tom Formal / Técnico</span>
              </button>
            </div>
          )}

          {/* TAB: EXIBIR & ZOOM */}
          {activeTab === 'exibir' && (
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setEditorTheme(editorTheme === 'light' ? 'dark' : 'light')}
                className="px-3 py-1.5 border border-sand-200 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer text-xs"
              >
                {editorTheme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
                <span>{editorTheme === 'light' ? 'Modo Escuro' : 'Modo Claro'}</span>
              </button>

              <div className="h-5 w-[1px] bg-sand-200" />

              <button
                type="button"
                onClick={() => setShowRuler(!showRuler)}
                className={`px-3 py-1.5 border rounded-lg font-bold flex items-center gap-1.5 cursor-pointer text-xs ${showRuler ? 'bg-softblue-50 border-softblue-300 text-softblue-800' : 'border-sand-200'}`}
              >
                <span>Régua Superior</span>
              </button>

              <div className="h-5 w-[1px] bg-sand-200" />

              {/* Zoom Buttons */}
              <div className="flex items-center gap-1 font-mono text-xs">
                <span className="text-[10px] font-bold text-sand-500 uppercase">Zoom:</span>
                <button
                  type="button"
                  onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))}
                  className="px-2 py-0.5 border border-sand-200 bg-sand-50 rounded hover:bg-sand-100 font-bold"
                >
                  -
                </button>
                <span className="font-bold w-12 text-center">{zoomLevel}%</span>
                <button
                  type="button"
                  onClick={() => setZoomLevel(Math.min(200, zoomLevel + 10))}
                  className="px-2 py-0.5 border border-sand-200 bg-sand-50 rounded hover:bg-sand-100 font-bold"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel(100)}
                  className="px-2 py-0.5 text-[10px] font-bold text-softblue-600 underline cursor-pointer"
                >
                  100%
                </button>
              </div>
            </div>
          )}

          {/* TAB: PESQUISA */}
          {activeTab === 'pesquisa' && (
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder="Localizar palavra..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-2.5 py-1 border border-sand-200 rounded-lg text-xs bg-white focus:outline-none focus:border-softblue-500 w-40"
              />
              <input
                type="text"
                placeholder="Substituir por..."
                value={replaceQuery}
                onChange={(e) => setReplaceQuery(e.target.value)}
                className="px-2.5 py-1 border border-sand-200 rounded-lg text-xs bg-white focus:outline-none focus:border-softblue-500 w-40"
              />
              <button
                type="button"
                onClick={() => executeSearchReplace(true)}
                className="px-3 py-1 bg-softblue-600 text-white rounded-lg font-bold text-xs hover:bg-softblue-700 cursor-pointer"
              >
                Substituir
              </button>
              {searchResultsCount !== null && (
                <span className="text-[10px] font-mono text-sand-500">
                  {searchResultsCount > 0 ? `${searchResultsCount} ocorrência(s) encontrada(s)` : 'Nenhuma ocorrência encontrada'}
                </span>
              )}
            </div>
          )}

          {/* TAB: HISTÓRICO */}
          {activeTab === 'historico' && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold text-sand-500 uppercase font-mono">Versões do Prontuário:</span>
              {historySnapshots.length === 0 ? (
                <span className="text-xs text-sand-400 italic font-mono">Sem histórico recente salvo</span>
              ) : (
                <div className="flex gap-1.5 overflow-x-auto max-w-xl">
                  {historySnapshots.map((snap, i) => (
                    <button
                      key={snap.id}
                      type="button"
                      onClick={() => {
                        if (confirm(`Deseja restaurar a versão gravada às ${snap.time}?`)) {
                          editor.commands.setContent(snap.text);
                        }
                      }}
                      className="px-2 py-1 bg-sand-50 hover:bg-sand-100 border border-sand-200 rounded-md text-[10px] font-mono font-bold text-sand-800 flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <History size={10} className="text-softblue-600" />
                      <span>{i === 0 ? 'Atual' : snap.time}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* AI Success Notification Toast */}
      {aiSuccessMessage && (
        <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-bold font-mono flex items-center justify-between shadow-inner">
          <div className="flex items-center gap-2">
            <Check size={16} />
            <span>{aiSuccessMessage}</span>
          </div>
          <button onClick={() => setAiSuccessMessage(null)} className="cursor-pointer font-bold">✕</button>
        </div>
      )}

      {/* AI Loading Banner */}
      {aiLoading && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-900 font-mono font-bold flex items-center gap-2">
          <RefreshCw size={14} className="animate-spin text-amber-600" />
          <span>O Assistente Inteligente MenteCare está processando o documento...</span>
        </div>
      )}

      {/* 4. MAIN EDITOR WORKSPACE CONTAINER (CANVAS + COPILOT SIDEBAR) */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* CLEAN TYPING CANVAS CONTAINER */}
        <div className={`flex-1 overflow-y-auto p-4 sm:p-8 md:p-12 flex justify-center relative ${editorTheme === 'dark' ? 'bg-sand-900 text-sand-100' : 'bg-white text-sand-900'}`}>
          
          {/* White Background Editor Container */}
          <div className="w-full max-w-5xl mx-auto flex flex-col justify-between min-h-full">

            {/* INTEGRATED TELECONSULTA PANEL (GOOGLE MEET + TIMER + VIDEO) */}
            {isTeleconsultaVisible && (
              <TeleconsultaPanel
                patientName={patientName}
                patientPhone={patientPhone}
                patientEmail={patientEmail}
                patientId={patientId}
                appointmentId={appointmentId}
                initialMeetingLink={initialMeetingLink}
                onSaveProntuario={onSave}
                onAppendEvolutionRecord={(recordText) => {
                  if (editor) {
                    editor.commands.insertContent(`<div style="background:#f8fafc; border:1px solid #cbd5e1; padding:12px; border-radius:12px; margin:16px 0; font-family:monospace; font-size:12px; color:#1e293b;"><strong style="color:#059669;">[REGISTRO AUTOMÁTICO DE TELECONSULTA]</strong><pre style="white-space:pre-wrap; margin-top:8px;">${recordText}</pre></div><p></p>`);
                  }
                }}
                isCopilotActive={isCopilotOn}
                onToggleCopilot={() => {
                  setIsCopilotOn(prev => !prev);
                  setIsCopilotSidebarOpen(prev => !prev);
                }}
              />
            )}

            {/* Watermark Overlay (Only if explicitly enabled) */}
            {watermark !== 'NONE' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden z-0">
                <span className="text-sand-100 font-serif font-black text-6xl md:text-7xl -rotate-45 tracking-widest text-center uppercase">
                  {watermark === 'CONFIDENCIAL' ? 'CONFIDENCIAL • CFP' : watermark === 'PRONTUARIO' ? 'PRONTUÁRIO ELETRÔNICO' : 'USO RESTRITO'}
                </span>
              </div>
            )}

            {/* Printed Header Line on Canvas */}
            {sheetLayoutMode === 'timbrado' && (
              <div className="z-10 select-none mb-6">
                {/* Decorative Top Accent Bar */}
                <div className="h-1.5 w-full mb-5 bg-gradient-to-r from-softblue-600 via-emerald-500 to-amber-400 rounded-sm" />
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b-2 border-sand-200">
                  {/* Clinic Logo & Info */}
                  <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt="Logo da Clínica"
                        className="h-12 sm:h-14 w-auto max-w-[140px] object-contain shrink-0 rounded-lg p-1 bg-white border border-sand-200/60 shadow-2xs"
                      />
                    ) : (
                      <div className="w-11 h-11 sm:w-12 sm:h-12 bg-gradient-to-br from-softblue-600 to-softblue-800 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-softblue-400/30">
                        <Building size={20} className="text-amber-300" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h2 className="text-base sm:text-lg font-extrabold font-serif text-sand-900 tracking-tight leading-snug uppercase break-words">
                        {clinicName}
                      </h2>
                      <p className="text-xs font-bold text-softblue-700 tracking-wide mt-0.5 break-words">
                        {professionalTitle}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono text-sand-600 mt-1.5 leading-tight">
                        {contactPhone && <span className="flex items-center gap-1.5 whitespace-nowrap"><Phone size={11} className="text-softblue-600 shrink-0" />{contactPhone}</span>}
                        {contactEmail && <span className="flex items-center gap-1.5 break-all"><Mail size={11} className="text-softblue-600 shrink-0" />{contactEmail}</span>}
                        {contactLocation && <span className="flex items-center gap-1.5 whitespace-nowrap"><MapPin size={11} className="text-softblue-600 shrink-0" />{contactLocation}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Patient & Document Clinical Badge */}
                  <div className="bg-sand-50/90 border border-sand-200 rounded-xl p-3.5 text-left sm:text-right shadow-2xs min-w-[200px] shrink-0 w-full sm:w-auto">
                    <span className="text-[9px] font-extrabold text-softblue-800 uppercase tracking-widest font-mono block">
                      PRONTUÁRIO CLÍNICO
                    </span>
                    <p className="text-xs sm:text-sm font-bold text-sand-900 mt-0.5 font-serif break-words">
                      {patientName ? `Paciente: ${patientName}` : 'Paciente: Não informado'}
                    </p>
                    <div className="flex items-center justify-start sm:justify-end gap-2 text-[10px] font-mono text-sand-500 mt-1">
                      <span>Data: <strong>{new Date().toLocaleDateString('pt-BR')}</strong></span>
                      <span className="text-sand-300">•</span>
                      <span className="font-bold text-emerald-700">{crpNumber}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {sheetLayoutMode === 'compacto' && (
              <div className="border-b border-sand-200 pb-3 mb-6 flex justify-between items-center text-[11px] font-mono text-sand-600 select-none z-10">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sand-900 uppercase font-serif">{clinicName}</span>
                  <span>•</span>
                  <span className="text-softblue-700 font-bold">{psychologistName} ({crpNumber})</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-sand-800">{patientName ? `PACIENTE: ${patientName.toUpperCase()}` : 'EVOLUÇÃO DE PRONTUÁRIO'}</span>
                </div>
              </div>
            )}

            {sheetLayoutMode === 'simples' && (
              <div className="border-b border-sand-200 pb-2 mb-6 flex justify-between items-center text-[10px] font-mono text-sand-400 select-none z-10">
                <span>SISTEMA MENTECARE • PRONTUÁRIO</span>
                <span className="font-bold text-softblue-700 uppercase">DOCUMENTO PROTEGIDO (SIGILO PROFISSIONAL)</span>
              </div>
            )}

            {/* Main Content Editable Area */}
            <div className="flex-1 z-10 prose prose-base max-w-none text-sand-900 focus:outline-none selection:bg-softblue-200 leading-relaxed font-sans min-h-[550px] py-2">
              <EditorContent editor={editor} />
            </div>

            {/* Signature Section */}
            {showSignatureBlock && (
              <div className="mt-12 pt-6 border-t border-sand-200/90 grid grid-cols-1 md:grid-cols-2 gap-6 items-end select-none z-10">
                {/* Left Column: Clinical Confidentiality Sigil */}
                <div className="flex items-start gap-2.5 p-3.5 bg-sand-50/80 border border-sand-200/70 rounded-xl">
                  <ShieldCheck size={20} className="text-softblue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-sand-800 font-mono uppercase tracking-wider">
                      Prontuário Psicológico Protegido
                    </p>
                    <p className="text-[9px] text-sand-500 leading-tight mt-0.5">
                      Sigilo profissional assegurado pelo Código de Ética do Psicólogo (CFP). Conteúdo confidencial de uso restrito em prontuário.
                    </p>
                  </div>
                </div>

                {/* Right Column: Signature Line & Professional Info */}
                <div className="flex flex-col items-center md:items-end text-center md:text-right">
                  {isDigitalSignatureChecked && (
                    <div className="mb-2 px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-[9px] font-bold font-mono flex items-center gap-1 shadow-2xs">
                      <CheckCircle2 size={12} className="text-emerald-600" />
                      <span>Assinado Digitalmente • Validade Jurídica (ICP-Brasil)</span>
                    </div>
                  )}
                  
                  {/* Signature Line */}
                  <div className="w-60 border-b-2 border-sand-800/60 my-1.5" />
                  
                  <p className="text-sm font-bold text-sand-900 font-serif leading-tight">
                    {psychologistName}
                  </p>
                  <p className="text-[11px] font-bold text-softblue-700 font-mono mt-0.5">
                    {professionalTitle} • {crpNumber}
                  </p>
                  <p className="text-[10px] font-mono text-sand-400 uppercase tracking-widest mt-0.5">
                    {clinicName}
                  </p>
                </div>
              </div>
            )}

            {/* Printed Footer Line on Canvas */}
            <div className="border-t border-sand-150 pt-3 mt-6 flex justify-between items-center text-[10px] font-mono text-sand-400 select-none z-10">
              <span>{clinicName} • {crpNumber} • DOCUMENTO PROTEGIDO DE ACORDO COM CFP N.º 01/2009</span>
              <span className="font-bold text-softblue-700">MODO DIGITAÇÃO LUTA CONTINUA</span>
            </div>

          </div>
        </div>

        {/* COPILOTO CLÍNICO SIDE PANEL */}
        {isCopilotOn && (
          <CopilotSidebar
            isOpen={isCopilotSidebarOpen}
            onClose={() => setIsCopilotSidebarOpen(false)}
            editorContent={editor.getHTML()}
            onApplyText={(newText) => {
              editor.commands.setContent(newText);
            }}
            patientName={patientName}
            isPrivateMode={isPrivateMode}
            onTogglePrivateMode={(val) => setIsPrivateMode(val)}
          />
        )}

      </div>

      {/* 6. WORD STATUS BAR (FOOTER) */}
      <div className="bg-softblue-950 text-white text-[11px] font-mono px-4 py-1.5 flex flex-wrap items-center justify-between border-t border-softblue-900 select-none">
        
        {/* Left Stats */}
        <div className="flex items-center gap-4">
          <span>Página <strong className="text-softblue-200">1 de {pageEstimate}</strong></span>
          <div className="h-3 w-[1px] bg-softblue-800" />
          <span>Folha: <strong className="text-amber-300 font-bold">{activePageConfig.name} ({activePageConfig.dimensions})</strong></span>
          <div className="h-3 w-[1px] bg-softblue-800" />
          <span>Palavras: <strong className="text-softblue-200">{wordCount}</strong></span>
          <div className="h-3 w-[1px] bg-softblue-800" />
          <span>Caracteres: <strong className="text-softblue-200">{charCount}</strong></span>
          <div className="h-3 w-[1px] bg-softblue-800" />
          <span className="text-emerald-400 font-bold">Português (Brasil)</span>
        </div>

        {/* Right Zoom Control */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-softblue-300">Zoom:</span>
          <input
            type="range"
            min="50"
            max="200"
            step="5"
            value={zoomLevel}
            onChange={(e) => setZoomLevel(Number(e.target.value))}
            className="w-24 h-1 accent-softblue-500 cursor-pointer"
          />
          <span className="font-bold text-softblue-200 w-10 text-right">{zoomLevel}%</span>
        </div>

      </div>

      {/* MODAL: TEMPLATES DE EVOLUÇÃO */}
      {showTemplatesModal && (
        <div className="fixed inset-0 z-50 bg-sand-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full border border-sand-300 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-sand-150 pb-3">
              <h3 className="text-sm font-bold font-serif text-sand-950 flex items-center gap-2">
                <Layers className="text-softblue-600" size={18} />
                <span>Biblioteca de Modelos de Prontuário</span>
              </h3>
              <button onClick={() => setShowTemplatesModal(false)} className="text-sand-400 hover:text-sand-700 font-bold cursor-pointer">✕</button>
            </div>

            <p className="text-xs text-sand-600">
              Selecione um modelo pronto abaixo para preencher automaticamente o documento com a estrutura recomendada:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {CLINICAL_TEMPLATES.map((tmpl) => (
                <div
                  key={tmpl.id}
                  onClick={() => {
                    if (confirm(`Deseja carregar o modelo '${tmpl.title}'? O conteúdo atual do editor será substituído.`)) {
                      editor.commands.setContent(tmpl.content);
                      setShowTemplatesModal(false);
                    }
                  }}
                  className="p-4 rounded-xl border border-sand-200 hover:border-softblue-500 hover:bg-softblue-50/40 transition-all cursor-pointer space-y-1 bg-sand-50/50"
                >
                  <h4 className="text-xs font-bold text-sand-900 flex items-center justify-between">
                    <span>{tmpl.title}</span>
                    <span className="text-[9px] font-mono bg-softblue-100 text-softblue-800 px-2 py-0.5 rounded">Usar</span>
                  </h4>
                  <p className="text-[10px] text-sand-500 leading-normal">{tmpl.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: INSERIR IMAGEM */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 bg-sand-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-sand-300 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-sand-150 pb-2">
              <h3 className="text-xs font-bold font-serif text-sand-950 flex items-center gap-1.5">
                <ImageIcon className="text-emerald-600" size={16} />
                <span>Inserir Imagem / Exame no Documento</span>
              </h3>
              <button onClick={() => setShowImageModal(false)} className="text-sand-400 hover:text-sand-700 font-bold cursor-pointer">✕</button>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-sand-600 font-mono mb-1">Cole a URL da imagem ou documento</label>
              <input
                type="text"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                placeholder="https://exemplo.com/exame.jpg"
                className="w-full px-3 py-2 border border-sand-200 rounded-xl text-xs bg-white focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="px-3 py-1.5 border border-sand-200 text-sand-700 rounded-lg text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (imageUrlInput.trim()) {
                    editor.chain().focus().setImage({ src: imageUrlInput.trim() }).run();
                    setImageUrlInput('');
                    setShowImageModal(false);
                  }
                }}
                className="px-4 py-1.5 bg-softblue-600 hover:bg-softblue-700 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Inserir
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
