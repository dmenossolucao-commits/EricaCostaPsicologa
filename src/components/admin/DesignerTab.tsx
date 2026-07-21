import React, { useState, useEffect, useRef } from 'react';
import { 
  Monitor, Smartphone, ChevronUp, ChevronDown, Eye, EyeOff, Trash2, Copy, Plus, 
  Save, RotateCcw, Paintbrush, Sliders, Type, Image as ImageIcon, Box, 
  HelpCircle, CheckCircle2, AlertCircle, RefreshCw, Layers, Move, Sparkles, Send, Eye as EyeIcon, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSiteContent } from '../../context/SiteContext';
import { contentService, logAuditAction } from '../../services/contentService';
import { getStylesForElement } from '../../utils/designerStyles';

// Import our preview section components
import Hero from '../Hero';
import About from '../About';
import Benefits from '../Benefits';
import Services from '../Services';
import HowItWorks from '../HowItWorks';
import Faqs from '../Faqs';
import Testimonials from '../Testimonials';
import BookingSection from '../BookingSection';
import Contact from '../Contact';

export default function DesignerTab() {
  const { 
    siteContent, 
    updateSiteContent, 
    publishContent, 
    cancelDraftChanges, 
    refreshContent,
    isDesignerMode,
    setIsDesignerMode,
    selectedElementId,
    setSelectedElementId
  } = useSiteContent();

  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [localSections, setLocalSections] = useState<any[]>([]);
  const [localStyles, setLocalStyles] = useState<Record<string, any>>({});
  const [localCms, setLocalCms] = useState<Record<string, any>>({});
  const [activePropertyTab, setActivePropertyTab] = useState<'text' | 'bg' | 'spacing' | 'border' | 'shadow' | 'button' | 'image'>('text');
  
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishComment, setPublishComment] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Activate Designer Mode when tab mounts, and clean up when it unmounts
  useEffect(() => {
    setIsDesignerMode(true);
    return () => {
      setIsDesignerMode(false);
      setSelectedElementId('');
    };
  }, []);

  // Sync state from siteContent draft when loaded
  useEffect(() => {
    if (siteContent) {
      setLocalSections(JSON.parse(JSON.stringify(siteContent.sections || [])));
      setLocalStyles(JSON.parse(JSON.stringify((siteContent as any).designer_styles || {})));
      setLocalCms(JSON.parse(JSON.stringify(siteContent.cms_content || {})));
    }
  }, [siteContent]);

  // Fallback to default sections if database does not contain them yet
  const ensureSections = () => {
    if (localSections.length === 0 && siteContent?.sections) {
      setLocalSections(JSON.parse(JSON.stringify(siteContent.sections)));
    }
  };
  useEffect(() => {
    ensureSections();
  }, [localSections]);

  // Section managers (reorder, duplicate, hide, delete)
  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= localSections.length) return;

    const updated = [...localSections];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;

    // Refresh orders
    const reordered = updated.map((sec, idx) => ({ ...sec, order: idx }));
    setLocalSections(reordered);
    autoSaveDraft(reordered, localStyles, localCms);
  };

  const toggleSectionVisibility = (id: string) => {
    const updated = localSections.map(sec => 
      sec.id === id ? { ...sec, visible: !sec.visible } : sec
    );
    setLocalSections(updated);
    autoSaveDraft(updated, localStyles, localCms);
  };

  const duplicateSection = (id: string) => {
    const targetIdx = localSections.findIndex(sec => sec.id === id);
    if (targetIdx === -1) return;

    const target = localSections[targetIdx];
    const newId = `${target.id}_copy_${Date.now().toString().slice(-4)}`;
    const newSection = {
      ...target,
      id: newId,
      title: `${target.title} (Cópia)`,
      order: targetIdx + 1
    };

    const updated = [...localSections];
    updated.splice(targetIdx + 1, 0, newSection);

    // Reorder subsequent
    const reordered = updated.map((sec, idx) => ({ ...sec, order: idx }));
    setLocalSections(reordered);

    // Copy styles from target to duplicate
    const newStyles = { ...localStyles };
    Object.keys(localStyles).forEach(key => {
      if (key.startsWith(`${target.id}.`)) {
        const subKey = key.replace(`${target.id}.`, '');
        newStyles[`${newId}.${subKey}`] = JSON.parse(JSON.stringify(localStyles[key]));
      }
    });

    // Copy cms texts
    const newCms = { ...localCms };
    if (localCms[target.type]) {
      newCms[newId] = JSON.parse(JSON.stringify(localCms[target.type]));
    }

    setLocalStyles(newStyles);
    setLocalCms(newCms);
    autoSaveDraft(reordered, newStyles, newCms);
  };

  const deleteSection = (id: string) => {
    if (window.confirm('Tem certeza de que deseja excluir esta seção? Esta alteração será salva no rascunho.')) {
      const updated = localSections.filter(sec => sec.id !== id)
        .map((sec, idx) => ({ ...sec, order: idx }));
      
      setLocalSections(updated);

      // Clean up styles
      const newStyles = { ...localStyles };
      Object.keys(newStyles).forEach(key => {
        if (key.startsWith(`${id}.`)) {
          delete newStyles[key];
        }
      });

      setLocalStyles(newStyles);
      autoSaveDraft(updated, newStyles, localCms);
      if (selectedElementId.startsWith(`${id}.`)) {
        setSelectedElementId('');
      }
    }
  };

  const addNewSection = () => {
    const sectionTypes = [
      { type: 'custom_banner', title: 'Banner de Destaque' },
      { type: 'custom_text', title: 'Sessão de Texto Livre' },
      { type: 'custom_gallery', title: 'Galeria de Mídia' },
      { type: 'custom_cta', title: 'Chamada para Ação (CTA)' }
    ];

    const typeChoice = window.prompt(
      "Selecione um tipo de seção:\n" +
      sectionTypes.map((t, i) => `${i + 1}. ${t.title}`).join('\n')
    );

    if (typeChoice === null) return;
    const choiceIdx = parseInt(typeChoice, 10) - 1;

    if (isNaN(choiceIdx) || choiceIdx < 0 || choiceIdx >= sectionTypes.length) {
      alert("Seleção inválida.");
      return;
    }

    const selectedType = sectionTypes[choiceIdx];
    const newId = `${selectedType.type}_${Date.now().toString().slice(-4)}`;
    
    const newSection = {
      id: newId,
      type: selectedType.type,
      title: selectedType.title,
      visible: true,
      order: localSections.length
    };

    const updated = [...localSections, newSection];
    setLocalSections(updated);
    autoSaveDraft(updated, localStyles, localCms);
  };

  // Drag and Drop reordering implementation
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (isNaN(sourceIndex) || sourceIndex === targetIndex) return;

    const reordered = [...localSections];
    const [removed] = reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, removed);

    const updated = reordered.map((sec, idx) => ({ ...sec, order: idx }));
    setLocalSections(updated);
    autoSaveDraft(updated, localStyles, localCms);
  };

  // Handle saving to DB
  const autoSaveDraft = async (sectionsList = localSections, stylesMap = localStyles, cmsData = localCms) => {
    setIsSavingDraft(true);
    try {
      await updateSiteContent({
        sections: sectionsList,
        cms_content: cmsData,
        // Spread is used to bypass Firestore direct typing if required
        ...{ designer_styles: stylesMap }
      } as any);
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error("Error saving designer draft:", err);
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Live save properties edited in the panel
  const handlePropertyChange = (field: string, value: any) => {
    if (!selectedElementId) return;

    const updatedStyles = {
      ...localStyles,
      [selectedElementId]: {
        ...(localStyles[selectedElementId] || {}),
        [field]: value
      }
    };

    setLocalStyles(updatedStyles);
    
    // Propagate changes to parent preview context
    const updatedContent = {
      ...siteContent,
      designer_styles: updatedStyles
    };
    
    // Run autoSave after a tiny debounce to keep user inputs smooth
    autoSaveDraft(localSections, updatedStyles, localCms);
  };

  // Update text content from designer properties
  const handleTextContentChange = (value: string) => {
    if (!selectedElementId) return;
    const parts = selectedElementId.split('.');
    if (parts.length < 2) return;

    const sectionKey = parts[0];
    const fieldKey = parts[1];

    const updatedCms = {
      ...localCms,
      [sectionKey]: {
        ...(localCms[sectionKey] || {}),
        [fieldKey]: value
      }
    };

    setLocalCms(updatedCms);
    autoSaveDraft(localSections, localStyles, updatedCms);
  };

  // Publish all changes Live
  const handlePublishLive = async () => {
    setIsPublishing(true);
    try {
      await autoSaveDraft(); // Save draft first
      await publishContent(publishComment || `Publicação Designer Visual em ${new Date().toLocaleString('pt-BR')}`);
      await logAuditAction('UPDATE', `Alterações do Designer do Site publicadas.`);
      setShowPublishModal(false);
      alert("Design publicado com sucesso no site de produção!");
      refreshContent();
    } catch (err) {
      console.error("Error publishing layout:", err);
      alert("Erro ao publicar design: " + (err as any).message);
    } finally {
      setIsPublishing(false);
    }
  };

  // Reset Draft
  const handleResetDraft = async () => {
    if (window.confirm('Deseja descartar as alterações do rascunho atual e reverter para a última versão publicada?')) {
      setIsSavingDraft(true);
      try {
        await cancelDraftChanges();
        await refreshContent(true);
        alert('Rascunho revertido para a última versão publicada!');
      } catch (err) {
        console.error("Error resetting draft:", err);
      } finally {
        setIsSavingDraft(false);
      }
    }
  };

  // Get active styling for selected element
  const getActiveStyles = () => {
    if (!selectedElementId) return {};
    return localStyles[selectedElementId] || {};
  };

  const getActiveTextContent = () => {
    if (!selectedElementId) return '';
    const parts = selectedElementId.split('.');
    if (parts.length < 2) return '';
    return localCms[parts[0]]?.[parts[1]] || '';
  };

  const activeStyles = getActiveStyles();
  const activeTextContent = getActiveTextContent();

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] border border-sand-200/80 rounded-2xl overflow-hidden bg-sand-50/50 shadow-inner">
      {/* Top designer control bar */}
      <div className="bg-white border-b border-sand-200/80 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-softblue-50 text-softblue-600 rounded-xl">
            <Paintbrush size={18} />
          </div>
          <div>
            <h2 className="text-sm font-serif font-bold text-sand-950">Designer do Site</h2>
            <p className="text-[10px] font-mono text-sand-500">Ajustes visuais, ordenamento de seções e propriedades Figma-like</p>
          </div>
        </div>

        {/* Responsive viewport settings */}
        <div className="hidden md:flex items-center bg-sand-100 rounded-xl p-1 border border-sand-200/50">
          <button 
            onClick={() => setPreviewMode('desktop')}
            className={`p-1.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-all ${previewMode === 'desktop' ? 'bg-white text-sand-950 shadow-xs' : 'text-sand-600 hover:text-sand-950'}`}
          >
            <Monitor size={14} />
            Desktop
          </button>
          <button 
            onClick={() => setPreviewMode('mobile')}
            className={`p-1.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-all ${previewMode === 'mobile' ? 'bg-white text-sand-950 shadow-xs' : 'text-sand-600 hover:text-sand-950'}`}
          >
            <Smartphone size={14} />
            Mobile
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="text-[10px] font-mono font-bold text-green-600 bg-green-50 border border-green-100 px-2 py-1 rounded-lg flex items-center gap-1">
              <CheckCircle2 size={10} /> Salvo!
            </span>
          )}
          {isSavingDraft && (
            <span className="text-[10px] font-mono text-sand-500 flex items-center gap-1.5 animate-pulse">
              <RefreshCw size={10} className="animate-spin" /> Salvando...
            </span>
          )}

          <button
            onClick={handleResetDraft}
            title="Descartar rascunho"
            className="p-2 bg-sand-100 hover:bg-sand-200 text-sand-700 hover:text-sand-950 rounded-xl border border-sand-200/50 cursor-pointer transition-all flex items-center justify-center"
          >
            <RotateCcw size={14} />
          </button>

          <button
            onClick={() => setShowPublishModal(true)}
            className="bg-softblue-600 hover:bg-softblue-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 transition-all"
          >
            <Send size={13} />
            Publicar Design
          </button>
        </div>
      </div>

      {/* Editor Split Layout */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* COL 1: LEFT PANEL (Sections & Ordering) */}
        <div className="w-80 bg-white border-r border-sand-200/80 flex flex-col shrink-0 overflow-hidden">
          <div className="p-4 border-b border-sand-100 bg-sand-50/50 shrink-0">
            <h3 className="text-xs font-bold uppercase tracking-wider text-sand-500 font-mono flex items-center gap-1.5">
              <Layers size={13} /> Seções da Página
            </h3>
            <p className="text-[10px] text-sand-400 mt-1">Arraste para ordenar ou utilize os botões rápidos.</p>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {localSections
              .sort((a, b) => a.order - b.order)
              .map((section, idx) => (
                <div
                  key={section.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, idx)}
                  className={`group relative flex flex-col p-3 rounded-xl border border-sand-200 bg-white hover:border-softblue-200 transition-all ${
                    !section.visible ? 'opacity-50 bg-sand-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 cursor-grab active:cursor-grabbing">
                      <Move size={12} className="text-sand-400 group-hover:text-softblue-400 transition-colors" />
                      <span className="text-xs font-semibold text-sand-900">{section.title}</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => moveSection(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 text-sand-400 hover:text-sand-950 disabled:opacity-20 transition-colors cursor-pointer"
                        title="Mover para cima"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button 
                        onClick={() => moveSection(idx, 'down')}
                        disabled={idx === localSections.length - 1}
                        className="p-1 text-sand-400 hover:text-sand-950 disabled:opacity-20 transition-colors cursor-pointer"
                        title="Mover para baixo"
                      >
                        <ChevronDown size={14} />
                      </button>
                      <button 
                        onClick={() => toggleSectionVisibility(section.id)}
                        className={`p-1 transition-colors cursor-pointer ${section.visible ? 'text-sage-600 hover:text-sage-800' : 'text-red-400 hover:text-red-600'}`}
                        title={section.visible ? 'Ocultar Seção' : 'Exibir Seção'}
                      >
                        {section.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                      <button 
                        onClick={() => duplicateSection(section.id)}
                        className="p-1 text-sand-400 hover:text-sand-950 transition-colors cursor-pointer"
                        title="Duplicar Seção"
                      >
                        <Copy size={13} />
                      </button>
                      <button 
                        onClick={() => deleteSection(section.id)}
                        className="p-1 text-sand-400 hover:text-red-600 transition-colors cursor-pointer"
                        title="Excluir Seção"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Subtle info pill */}
                  <div className="flex justify-between items-center mt-2 pt-1 border-t border-sand-100/50 text-[9px] font-mono text-sand-400">
                    <span>ID: {section.id}</span>
                    <span className="capitalize px-1 bg-sand-100 rounded">{section.type}</span>
                  </div>
                </div>
              ))}
          </div>

          <div className="p-4 border-t border-sand-100 bg-sand-50/50 shrink-0">
            <button
              onClick={addNewSection}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-sand-300 border-dashed rounded-xl text-xs font-semibold text-sand-700 hover:text-softblue-600 hover:border-softblue-300 hover:bg-softblue-50/30 cursor-pointer transition-all"
            >
              <Plus size={14} />
              Adicionar Nova Seção
            </button>
          </div>
        </div>

        {/* COL 2: CENTER PANEL (Real-Time Visual Preview) */}
        <div className="flex-1 bg-sand-100/50 p-6 overflow-y-auto flex items-start justify-center">
          <div 
            className={`transition-all duration-300 relative bg-white border border-sand-200/80 shadow-md overflow-hidden ${
              previewMode === 'mobile' 
                ? 'w-[375px] h-[780px] rounded-[32px] ring-12 ring-sand-950 border-4 border-sand-950' 
                : 'w-full min-h-[1200px] rounded-2xl'
            }`}
          >
            {/* If mobile, show fake phone status notch/bar */}
            {previewMode === 'mobile' && (
              <div className="bg-sand-950 h-6 w-full flex justify-between items-center px-6 text-white text-[9px] font-sans">
                <span>09:41</span>
                <div className="h-4 w-20 bg-sand-900 rounded-full mx-auto -mt-1 shrink-0"></div>
                <div className="flex gap-1.5">
                  <span>📶</span>
                  <span>🔋</span>
                </div>
              </div>
            )}

            <div className={`overflow-y-auto w-full h-full ${previewMode === 'mobile' ? 'h-[750px] overflow-x-hidden' : ''}`}>
              {/* Dynamic rendering of pages / order of sections */}
              <div className="flex flex-col space-y-0 select-none">
                {/* Visual indicator for interactive selection */}
                <div className="bg-blue-50 border-y border-blue-200 px-4 py-2 text-[10px] font-sans font-bold text-blue-700 text-center flex items-center justify-center gap-1 shrink-0">
                  <Sparkles size={11} />
                  Modo Designer Ativo. Clique em qualquer elemento para abrir o editor de estilos.
                </div>

                {localSections
                  .filter(sec => sec.visible)
                  .sort((a, b) => a.order - b.order)
                  .map((section) => {
                    switch (section.type) {
                      case 'hero':
                        return <div key={section.id} id={section.id}><Hero /></div>;
                      case 'about':
                        return <div key={section.id} id={section.id}><About /></div>;
                      case 'benefits':
                        return <div key={section.id} id={section.id}><Benefits /></div>;
                      case 'services':
                        return <div key={section.id} id={section.id}><Services /></div>;
                      case 'howitworks':
                        return <div key={section.id} id={section.id}><HowItWorks /></div>;
                      case 'faqs':
                        return <div key={section.id} id={section.id}><Faqs /></div>;
                      case 'testimonials':
                        return <div key={section.id} id={section.id}><Testimonials /></div>;
                      case 'booking':
                        return <div key={section.id} id={section.id}><BookingSection /></div>;
                      case 'contact':
                        return <div key={section.id} id={section.id}><Contact /></div>;
                      default:
                        // Custom layouts rendering placeholder so it loads beautifully
                        return (
                          <div 
                            key={section.id} 
                            id={section.id}
                            className="bg-sand-50/50 p-12 border border-dashed border-sand-300 rounded-xl text-center flex flex-col items-center justify-center space-y-2 m-4"
                          >
                            <ImageIcon size={28} className="text-sand-400" />
                            <h4 className="text-sm font-bold text-sand-950 font-serif">{section.title}</h4>
                            <p className="text-xs text-sand-600 max-w-sm">Esta é uma seção customizada ({section.type}). O conteúdo detalhado de personalização ficará disponível nas próximas fases de expansão.</p>
                          </div>
                        );
                    }
                  })}
              </div>
            </div>
          </div>
        </div>

        {/* COL 3: RIGHT PANEL (Property Editor) */}
        <div className="w-80 bg-white border-l border-sand-200/80 flex flex-col shrink-0 overflow-hidden">
          <div className="p-4 border-b border-sand-100 bg-sand-50/50 shrink-0">
            <h3 className="text-xs font-bold uppercase tracking-wider text-sand-500 font-mono flex items-center gap-1.5">
              <Sliders size={13} /> Propriedades do Elemento
            </h3>
            <p className="text-[10px] text-sand-400 mt-1">Selecione um elemento na página para editar.</p>
          </div>

          {selectedElementId ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Selected Element Label Header */}
              <div className="p-3.5 bg-blue-50/40 border-b border-blue-100 shrink-0 flex items-center justify-between">
                <div>
                  <span className="text-[8px] font-mono font-bold text-blue-600 uppercase tracking-widest">Elemento Selecionado</span>
                  <h4 className="text-xs font-bold text-blue-900 font-mono truncate max-w-[180px]">{selectedElementId}</h4>
                </div>
                <button 
                  onClick={() => setSelectedElementId('')}
                  className="p-1 hover:bg-blue-100 text-blue-500 hover:text-blue-700 rounded transition-colors cursor-pointer"
                  title="Desmarcar elemento"
                >
                  <X size={12} />
                </button>
              </div>

              {/* Property Tabs */}
              <div className="flex border-b border-sand-200 text-[10px] font-bold uppercase tracking-wider bg-sand-50/30 shrink-0 overflow-x-auto">
                <button 
                  onClick={() => setActivePropertyTab('text')}
                  className={`flex-1 py-2 text-center border-b-2 cursor-pointer ${activePropertyTab === 'text' ? 'border-softblue-500 text-softblue-700' : 'border-transparent text-sand-500 hover:text-sand-900'}`}
                >
                  Texto
                </button>
                <button 
                  onClick={() => setActivePropertyTab('bg')}
                  className={`flex-1 py-2 text-center border-b-2 cursor-pointer ${activePropertyTab === 'bg' ? 'border-softblue-500 text-softblue-700' : 'border-transparent text-sand-500 hover:text-sand-900'}`}
                >
                  Fundo
                </button>
                <button 
                  onClick={() => setActivePropertyTab('spacing')}
                  className={`flex-1 py-2 text-center border-b-2 cursor-pointer ${activePropertyTab === 'spacing' ? 'border-softblue-500 text-softblue-700' : 'border-transparent text-sand-500 hover:text-sand-900'}`}
                >
                  Espaço
                </button>
                <button 
                  onClick={() => setActivePropertyTab('border')}
                  className={`flex-1 py-2 text-center border-b-2 cursor-pointer ${activePropertyTab === 'border' ? 'border-softblue-500 text-softblue-700' : 'border-transparent text-sand-500 hover:text-sand-900'}`}
                >
                  Borda
                </button>
              </div>

              {/* Properties Editor Fields */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                
                {/* 1. TYPOGRAPHY / TEXT PROPERTIES */}
                {activePropertyTab === 'text' && (
                  <div className="space-y-4">
                    {/* Content text */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-sand-500 font-mono flex items-center gap-1">
                        <Type size={11} /> Conteúdo do Texto
                      </label>
                      <textarea
                        value={activeTextContent}
                        onChange={(e) => handleTextContentChange(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-sand-200 bg-sand-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-softblue-500 transition-all font-sans"
                        rows={4}
                      />
                    </div>

                    {/* Font Family */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-sand-500 font-mono">Fonte</label>
                      <select
                        value={activeStyles.fontFamily || ''}
                        onChange={(e) => handlePropertyChange('fontFamily', e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-sand-200 bg-white cursor-pointer"
                      >
                        <option value="">Padrão do tema</option>
                        <option value="Inter">Inter (Sans-Serif)</option>
                        <option value="Poppins">Poppins (Geométrica)</option>
                        <option value="Space Grotesk">Space Grotesk (Tech)</option>
                        <option value="Outfit">Outfit (Moderna)</option>
                        <option value="Playfair Display">Playfair Display (Serif)</option>
                        <option value="JetBrains Mono">JetBrains Mono (Mono)</option>
                      </select>
                    </div>

                    {/* Font Size & Weight */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-sand-500 font-mono">Tamanho (px)</label>
                        <input
                          type="number"
                          value={activeStyles.fontSize || ''}
                          onChange={(e) => handlePropertyChange('fontSize', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                          placeholder="e.g. 16"
                          className="w-full text-xs p-2.5 rounded-xl border border-sand-200"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-sand-500 font-mono">Peso</label>
                        <select
                          value={activeStyles.fontWeight || ''}
                          onChange={(e) => handlePropertyChange('fontWeight', e.target.value)}
                          className="w-full text-xs p-2.5 rounded-xl border border-sand-200 bg-white cursor-pointer"
                        >
                          <option value="">Padrão</option>
                          <option value="300">Fino (300)</option>
                          <option value="400">Regular (400)</option>
                          <option value="500">Médio (500)</option>
                          <option value="600">Semibold (600)</option>
                          <option value="700">Negrito (700)</option>
                          <option value="900">Black (900)</option>
                        </select>
                      </div>
                    </div>

                    {/* Text Color */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-sand-500 font-mono">Cor do Texto</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={activeStyles.color || '#000000'}
                          onChange={(e) => handlePropertyChange('color', e.target.value)}
                          className="h-9 w-9 p-0 rounded-lg overflow-hidden border border-sand-200 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={activeStyles.color || ''}
                          onChange={(e) => handlePropertyChange('color', e.target.value)}
                          placeholder="#000000"
                          className="flex-1 text-xs px-2.5 border border-sand-200 rounded-xl"
                        />
                      </div>
                    </div>

                    {/* Text Align */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-sand-500 font-mono">Alinhamento</label>
                      <div className="grid grid-cols-4 gap-1 bg-sand-100 p-1 rounded-xl">
                        {['left', 'center', 'right', 'justify'].map((align) => (
                          <button
                            key={align}
                            onClick={() => handlePropertyChange('textAlign', align)}
                            className={`py-1 rounded text-[10px] font-bold uppercase transition-all cursor-pointer ${activeStyles.textAlign === align ? 'bg-white text-sand-950 shadow-xs' : 'text-sand-500 hover:text-sand-900'}`}
                          >
                            {align.slice(0, 3)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Line height & letter spacing */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-sand-500 font-mono">Altura da Linha</label>
                        <input
                          type="text"
                          value={activeStyles.lineHeight || ''}
                          onChange={(e) => handlePropertyChange('lineHeight', e.target.value)}
                          placeholder="e.g. 1.5"
                          className="w-full text-xs p-2.5 rounded-xl border border-sand-200"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-sand-500 font-mono">Espaçamento (px)</label>
                        <input
                          type="number"
                          value={activeStyles.letterSpacing || ''}
                          onChange={(e) => handlePropertyChange('letterSpacing', e.target.value ? parseFloat(e.target.value) : undefined)}
                          placeholder="e.g. 0.5"
                          className="w-full text-xs p-2.5 rounded-xl border border-sand-200"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. BACKGROUND PROPERTIES */}
                {activePropertyTab === 'bg' && (
                  <div className="space-y-4">
                    {/* Background Color */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-sand-500 font-mono">Cor de Fundo</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={activeStyles.backgroundColor || '#ffffff'}
                          onChange={(e) => handlePropertyChange('backgroundColor', e.target.value)}
                          className="h-9 w-9 p-0 rounded-lg overflow-hidden border border-sand-200 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={activeStyles.backgroundColor || ''}
                          onChange={(e) => handlePropertyChange('backgroundColor', e.target.value)}
                          placeholder="#ffffff"
                          className="flex-1 text-xs px-2.5 border border-sand-200 rounded-xl"
                        />
                      </div>
                    </div>

                    {/* Background Gradient */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-sand-500 font-mono">Gradiente de Fundo</label>
                      <input
                        type="text"
                        value={activeStyles.backgroundGradient || ''}
                        onChange={(e) => handlePropertyChange('backgroundGradient', e.target.value)}
                        placeholder="linear-gradient(to right, ...)"
                        className="w-full text-xs p-2.5 rounded-xl border border-sand-200 font-mono"
                      />
                    </div>

                    {/* Image Background */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-sand-500 font-mono">Imagem de Fundo (URL)</label>
                      <input
                        type="text"
                        value={activeStyles.backgroundImage || ''}
                        onChange={(e) => handlePropertyChange('backgroundImage', e.target.value)}
                        placeholder="https://exemplo.com/imagem.jpg"
                        className="w-full text-xs p-2.5 rounded-xl border border-sand-200"
                      />
                    </div>

                    {/* Opacity slider */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-sand-500 font-mono">Transparência / Opacidade</label>
                        <span className="text-[10px] font-mono text-sand-500">{Math.round((activeStyles.opacity ?? 1) * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={activeStyles.opacity ?? 1}
                        onChange={(e) => handlePropertyChange('opacity', parseFloat(e.target.value))}
                        className="w-full accent-softblue-500"
                      />
                    </div>
                  </div>
                )}

                {/* 3. SPACING PROPERTIES */}
                {activePropertyTab === 'spacing' && (
                  <div className="space-y-4">
                    {/* Padding Box */}
                    <div className="bg-sand-50/50 p-3 rounded-xl border border-sand-200 space-y-3">
                      <span className="text-[9px] font-mono font-bold uppercase text-sand-400">Paddings (Espaçamento Interno)</span>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[9px] text-sand-500 font-bold">Superior</label>
                          <input
                            type="number"
                            value={activeStyles.paddingTop ?? ''}
                            onChange={(e) => handlePropertyChange('paddingTop', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                            className="w-full text-xs p-2 border border-sand-200 rounded-lg"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] text-sand-500 font-bold">Inferior</label>
                          <input
                            type="number"
                            value={activeStyles.paddingBottom ?? ''}
                            onChange={(e) => handlePropertyChange('paddingBottom', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                            className="w-full text-xs p-2 border border-sand-200 rounded-lg"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] text-sand-500 font-bold">Esquerda</label>
                          <input
                            type="number"
                            value={activeStyles.paddingLeft ?? ''}
                            onChange={(e) => handlePropertyChange('paddingLeft', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                            className="w-full text-xs p-2 border border-sand-200 rounded-lg"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] text-sand-500 font-bold">Direita</label>
                          <input
                            type="number"
                            value={activeStyles.paddingRight ?? ''}
                            onChange={(e) => handlePropertyChange('paddingRight', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                            className="w-full text-xs p-2 border border-sand-200 rounded-lg"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Margins Box */}
                    <div className="bg-sand-50/50 p-3 rounded-xl border border-sand-200 space-y-3">
                      <span className="text-[9px] font-mono font-bold uppercase text-sand-400">Margins (Espaçamento Externo)</span>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[9px] text-sand-500 font-bold">Superior</label>
                          <input
                            type="number"
                            value={activeStyles.marginTop ?? ''}
                            onChange={(e) => handlePropertyChange('marginTop', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                            className="w-full text-xs p-2 border border-sand-200 rounded-lg"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] text-sand-500 font-bold">Inferior</label>
                          <input
                            type="number"
                            value={activeStyles.marginBottom ?? ''}
                            onChange={(e) => handlePropertyChange('marginBottom', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                            className="w-full text-xs p-2 border border-sand-200 rounded-lg"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] text-sand-500 font-bold">Esquerda</label>
                          <input
                            type="number"
                            value={activeStyles.marginLeft ?? ''}
                            onChange={(e) => handlePropertyChange('marginLeft', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                            className="w-full text-xs p-2 border border-sand-200 rounded-lg"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] text-sand-500 font-bold">Direita</label>
                          <input
                            type="number"
                            value={activeStyles.marginRight ?? ''}
                            onChange={(e) => handlePropertyChange('marginRight', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                            className="w-full text-xs p-2 border border-sand-200 rounded-lg"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. BORDERS & SHADOW PROPERTIES */}
                {activePropertyTab === 'border' && (
                  <div className="space-y-4">
                    {/* Border Layout */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-sand-500 font-mono">Espessura (px)</label>
                        <input
                          type="number"
                          value={activeStyles.borderWidth ?? ''}
                          onChange={(e) => handlePropertyChange('borderWidth', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                          className="w-full text-xs p-2.5 rounded-xl border border-sand-200"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-sand-500 font-mono">Estilo</label>
                        <select
                          value={activeStyles.borderStyle || ''}
                          onChange={(e) => handlePropertyChange('borderStyle', e.target.value)}
                          className="w-full text-xs p-2.5 rounded-xl border border-sand-200 bg-white"
                        >
                          <option value="">Sem borda</option>
                          <option value="solid">Sólido</option>
                          <option value="dashed">Tracejado (Dashed)</option>
                          <option value="dotted">Pontilhado (Dotted)</option>
                        </select>
                      </div>
                    </div>

                    {/* Border Color */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-sand-500 font-mono">Cor da Borda</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={activeStyles.borderColor || '#000000'}
                          onChange={(e) => handlePropertyChange('borderColor', e.target.value)}
                          className="h-9 w-9 p-0 rounded-lg overflow-hidden border border-sand-200 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={activeStyles.borderColor || ''}
                          onChange={(e) => handlePropertyChange('borderColor', e.target.value)}
                          placeholder="#000000"
                          className="flex-1 text-xs px-2.5 border border-sand-200 rounded-xl"
                        />
                      </div>
                    </div>

                    {/* Rounded radius */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-sand-500 font-mono">Raio dos Cantos (Radius)</label>
                      <input
                        type="number"
                        value={activeStyles.borderRadius ?? ''}
                        onChange={(e) => handlePropertyChange('borderRadius', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                        placeholder="e.g. 12"
                        className="w-full text-xs p-2.5 rounded-xl border border-sand-200"
                      />
                    </div>

                    {/* Shadow Preset selection */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-sand-500 font-mono">Preset de Sombra</label>
                      <select
                        value={activeStyles.boxShadow || ''}
                        onChange={(e) => handlePropertyChange('boxShadow', e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-sand-200 bg-white"
                      >
                        <option value="">Sem Sombra</option>
                        <option value="0 1px 2px 0 rgba(0, 0, 0, 0.05)">Sombra Pequena (xs)</option>
                        <option value="0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)">Sombra Média (md)</option>
                        <option value="0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)">Sombra Grande (lg)</option>
                        <option value="0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)">Sombra Extra Grande (xl)</option>
                        <option value="inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)">Sombra Interna (Inset)</option>
                      </select>
                    </div>
                  </div>
                )}

              </div>
            </div>
          ) : (
            // No element selected placeholder
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-sand-100 flex items-center justify-center text-sand-400">
                <Paintbrush size={20} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-sand-900 font-serif">Nenhum elemento ativo</h4>
                <p className="text-[10px] text-sand-500 max-w-[180px] mx-auto mt-1">Clique em qualquer título, imagem ou botão da visualização para configurar suas cores e estilos.</p>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Publish Comment Modal */}
      <AnimatePresence>
        {showPublishModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sand-950/40 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-sand-200 p-6 max-w-md w-full shadow-xl space-y-4"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-softblue-50 text-softblue-600 rounded-xl">
                  <Send size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-serif font-bold text-sand-950">Publicar Alterações Visuais</h3>
                  <p className="text-[10px] text-sand-500 font-mono">Deseja liberar o novo visual para os pacientes?</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-sand-500 font-mono">Nota de Versão (opcional)</label>
                <textarea
                  value={publishComment}
                  onChange={(e) => setPublishComment(e.target.value)}
                  placeholder="Ex: Novo design da seção Sobre Mim e ajuste nas cores dos botões de agendamento."
                  className="w-full text-xs p-2.5 rounded-xl border border-sand-200 bg-sand-50 focus:bg-white focus:outline-hidden"
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => setShowPublishModal(false)}
                  className="flex-1 py-2.5 bg-sand-100 hover:bg-sand-200 text-sand-800 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handlePublishLive}
                  disabled={isPublishing}
                  className="flex-1 py-2.5 bg-softblue-600 hover:bg-softblue-700 text-white text-xs font-bold rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isPublishing ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" /> Publicando...
                    </>
                  ) : (
                    <>Confirmar Publicação</>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
