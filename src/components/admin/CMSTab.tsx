import React, { useState, useEffect } from 'react';
import { 
  Layout, Paintbrush, Settings, Layers, FolderOpen, Plus, Trash2, 
  Eye, Check, RotateCcw, FileText, ChevronUp, ChevronDown, 
  BookOpen, HelpCircle, Heart, Phone, MapPin, Sparkles, Copy, 
  History, Diff, Undo2, Save, Send, AlertCircle, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSiteContent } from '../../context/SiteContext';
import { RichTextEditor } from './RichTextEditor';
import { contentService, logAuditAction } from '../../services/contentService';

type CmsSubTab = 'textos' | 'estilo' | 'secoes' | 'versoes';

export default function CMSTab() {
  const { 
    siteContent, 
    updateSiteContent, 
    publishContent, 
    cancelDraftChanges, 
    refreshContent 
  } = useSiteContent();

  const [activeSubTab, setActiveSubTab] = useState<CmsSubTab>('textos');
  const [selectedCategory, setSelectedCategory] = useState<string>('hero');
  const [localCms, setLocalCms] = useState<any>(null);
  const [localAppearance, setLocalAppearance] = useState<any>(null);
  const [localSections, setLocalSections] = useState<any[]>([]);
  const [versions, setVersions] = useState<any[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishComment, setPublishComment] = useState('');
  const [selectedVersionForCompare, setSelectedVersionForCompare] = useState<any>(null);
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Sync state from siteContent draft when loaded
  useEffect(() => {
    if (siteContent) {
      setLocalCms(JSON.parse(JSON.stringify(siteContent.cms_content || {})));
      setLocalAppearance(JSON.parse(JSON.stringify(siteContent.appearance || {})));
      setLocalSections(JSON.parse(JSON.stringify(siteContent.sections || [])));
    }
  }, [siteContent]);

  // Load version history
  const loadVersions = async () => {
    setLoadingVersions(true);
    try {
      // site_content versions
      const list = await contentService.getDocumentVersions('site_content', 'main_published');
      setVersions(list);
    } catch (err) {
      console.error("Error loading versions:", err);
    } finally {
      setLoadingVersions(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'versoes') {
      loadVersions();
    }
  }, [activeSubTab]);

  if (!localCms || !localAppearance) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw size={24} className="text-sage-500 animate-spin mr-2" />
        <span className="text-sm font-mono text-sand-600">Carregando dados do CMS...</span>
      </div>
    );
  }

  // Handle saving of draft changes
  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    try {
      await updateSiteContent({
        cms_content: localCms,
        appearance: localAppearance,
        sections: localSections
      });
      await logAuditAction('UPDATE', `Rascunho de alterações do CMS salvo pelo usuário.`);
    } catch (err) {
      console.error("Error saving draft:", err);
      alert("Erro ao salvar rascunho: " + (err as any).message);
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Handle publishing of draft live
  const handlePublishLive = async () => {
    setIsPublishing(true);
    try {
      await handleSaveDraft(); // Save draft first
      await publishContent(publishComment || `Publicação CMS em ${new Date().toLocaleString('pt-BR')}`);
      setShowPublishModal(false);
      setPublishComment('');
      alert("Alterações publicadas com sucesso! Seu site está atualizado em produção.");
      await loadVersions();
    } catch (err) {
      console.error("Error publishing content:", err);
      alert("Erro ao publicar alterações: " + (err as any).message);
    } finally {
      setIsPublishing(false);
    }
  };

  // Cancel draft changes (resets draft to production contents)
  const handleCancelDraft = async () => {
    if (window.confirm("Deseja realmente cancelar todas as alterações não publicadas? Isso redefinirá seu rascunho para corresponder ao site de produção.")) {
      try {
        await cancelDraftChanges();
        alert("Alterações do rascunho canceladas com sucesso.");
      } catch (err) {
        console.error("Error cancelling draft:", err);
        alert("Erro ao cancelar rascunho.");
      }
    }
  };

  // Preview draft changes in new tab with ?preview=true
  const handlePreview = () => {
    const tenantId = (localStorage.getItem('active_tenant_id') && localStorage.getItem('active_tenant_id') !== 'mentecare_platform')
      ? localStorage.getItem('active_tenant_id')
      : '';
    const previewUrl = tenantId 
      ? `${window.location.origin}/?tenant=${tenantId}&preview=true`
      : `${window.location.origin}/?preview=true`;
    window.open(previewUrl, '_blank');
  };

  // Version Restore
  const handleRestoreVersion = async (v: any) => {
    if (window.confirm(`Deseja restaurar as configurações do site para a Versão #${v.versionNumber}? Isso substituirá seu rascunho atual.`)) {
      try {
        const restoredData = v.data;
        await updateSiteContent(restoredData);
        alert(`Versão #${v.versionNumber} restaurada no rascunho com sucesso! Clique em "Publicar" para torná-la ativa na produção.`);
        setActiveSubTab('textos');
      } catch (err) {
        console.error("Error restoring version:", err);
        alert("Erro ao restaurar versão.");
      }
    }
  };

  // Update specific text field
  const updateCmsField = (category: string, field: string, value: string) => {
    setLocalCms((prev: any) => ({
      ...prev,
      [category]: {
        ...(prev[category] || {}),
        [field]: value
      }
    }));
  };

  // Update appearance fields
  const updateAppearanceField = (field: string, value: string) => {
    setLocalAppearance((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  // Sections management helper actions
  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...localSections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSections.length) return;

    // Swap elements
    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;

    // Recalculate orders
    newSections.forEach((s, i) => {
      s.order = i;
    });

    setLocalSections(newSections);
  };

  const toggleSectionVisibility = (index: number) => {
    const newSections = [...localSections];
    newSections[index].visible = !newSections[index].visible;
    setLocalSections(newSections);
  };

  const duplicateSection = (index: number) => {
    const source = localSections[index];
    const newSections = [...localSections];
    const duplicated = {
      ...source,
      id: `${source.id}_dup_${Date.now().toString().slice(-4)}`,
      title: `${source.title} (Cópia)`,
      order: source.order + 1
    };

    newSections.splice(index + 1, 0, duplicated);
    newSections.forEach((s, i) => {
      s.order = i;
    });
    setLocalSections(newSections);
  };

  const deleteSection = (index: number) => {
    if (window.confirm("Tem certeza que deseja excluir esta seção? Esta ação não pode ser desfeita.")) {
      const newSections = localSections.filter((_, i) => i !== index);
      newSections.forEach((s, i) => {
        s.order = i;
      });
      setLocalSections(newSections);
    }
  };

  const createCustomSection = () => {
    const title = window.prompt("Nome da nova seção personalizada:");
    if (!title) return;

    const newSections = [...localSections];
    const customId = `custom_section_${Date.now()}`;
    const newSec = {
      id: customId,
      type: 'custom',
      title: title,
      visible: true,
      order: newSections.length,
      customContent: '<h2>Nova Seção</h2><p>Clique para editar o conteúdo usando o editor Word.</p>'
    };

    newSections.push(newSec);
    setLocalSections(newSections);
  };

  const updateCustomSectionContent = (id: string, htmlContent: string) => {
    const idx = localSections.findIndex(s => s.id === id);
    if (idx !== -1) {
      const updated = [...localSections];
      updated[idx].customContent = htmlContent;
      setLocalSections(updated);
    }
  };

  const categories = [
    { id: 'hero', name: 'Banner Principal (Hero)', icon: <Layout size={14} /> },
    { id: 'about', name: 'Sobre Mim (Biografia)', icon: <BookOpen size={14} /> },
    { id: 'benefits', name: 'Especialidades / Diferenciais', icon: <Heart size={14} /> },
    { id: 'services', name: 'Serviços Oferecidos', icon: <Sparkles size={14} /> },
    { id: 'howitworks', name: 'Processo de Consulta', icon: <Layers size={14} /> },
    { id: 'faqs', name: 'Dúvidas Comuns (FAQ)', icon: <HelpCircle size={14} /> },
    { id: 'testimonials', name: 'Depoimentos', icon: <Heart size={14} /> },
    { id: 'contact', name: 'Formulário & Contato', icon: <Phone size={14} /> },
    { id: 'footer', name: 'Rodapé & Alertas CFP', icon: <FolderOpen size={14} /> },
    { id: 'policies', name: 'Políticas & Termos', icon: <FileText size={14} /> },
    { id: 'system_messages', name: 'Mensagens do Sistema', icon: <AlertCircle size={14} /> },
  ];

  return (
    <div className="bg-white p-6 rounded-3xl border border-sand-200 shadow-sm space-y-6">
      
      {/* CMS Workspace Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-sand-150">
        <div>
          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">
            Rascunho de Conteúdo Ativo (Draft)
          </span>
          <h2 className="text-xl font-serif font-bold text-sand-950 mt-1.5">Gerenciador de Conteúdo CMS Enterprise</h2>
          <p className="text-xs text-sand-500">Altere textos, mídias, cores, fontes, seções e mensagens globais sem tocar no código.</p>
        </div>

        {/* Action Controls for Publish Flow */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handlePreview}
            className="inline-flex items-center text-xs bg-sand-100 hover:bg-sand-200 text-sand-800 px-3.5 py-2 rounded-xl transition-all font-semibold border border-sand-300/40 cursor-pointer"
          >
            <Eye size={14} className="mr-1.5" />
            Visualizar Rascunho
          </button>
          <button
            onClick={handleCancelDraft}
            className="inline-flex items-center text-xs bg-red-50 hover:bg-red-100 text-red-700 px-3.5 py-2 rounded-xl transition-all font-semibold border border-red-200/50 cursor-pointer"
          >
            <RotateCcw size={14} className="mr-1.5" />
            Descartar Rascunho
          </button>
          <button
            onClick={handleSaveDraft}
            disabled={isSavingDraft}
            className="inline-flex items-center text-xs bg-sage-50 hover:bg-sage-100 text-sage-800 px-3.5 py-2 rounded-xl transition-all font-semibold border border-sage-200 cursor-pointer disabled:opacity-50"
          >
            {isSavingDraft ? <RefreshCw size={14} className="animate-spin mr-1.5" /> : <Save size={14} className="mr-1.5" />}
            Salvar Rascunho
          </button>
          <button
            onClick={() => setShowPublishModal(true)}
            className="inline-flex items-center text-xs bg-softblue-600 hover:bg-softblue-700 text-white px-4 py-2 rounded-xl transition-all font-semibold shadow-md cursor-pointer"
          >
            <Send size={14} className="mr-1.5" />
            Publicar Alterações (Go Live)
          </button>
        </div>
      </div>

      {/* Primary Sub-tabs */}
      <div className="flex border-b border-sand-150 gap-6">
        {[
          { id: 'textos', label: 'Editar Textos do Site', icon: <FileText size={14} /> },
          { id: 'estilo', label: 'Identidade Visual & Cores', icon: <Paintbrush size={14} /> },
          { id: 'secoes', label: 'Organização de Seções', icon: <Layers size={14} /> },
          { id: 'versoes', label: 'Histórico & Versões', icon: <History size={14} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as CmsSubTab)}
            className={`flex items-center pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 gap-1.5 cursor-pointer ${
              activeSubTab === tab.id
                ? 'border-softblue-600 text-softblue-600'
                : 'border-transparent text-sand-500 hover:text-sand-900'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* SUB-TAB PANELS */}
      <div className="pt-2">
        
        {/* SUB-TAB 1: TEXTOS (BY CATEGORY) */}
        {activeSubTab === 'textos' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Category Selector Side Rail */}
            <div className="lg:col-span-3 space-y-1 border-r border-sand-100 pr-4">
              <span className="text-[9px] font-bold text-sand-400 uppercase tracking-widest font-mono block px-2 mb-2">Seções do Site</span>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`w-full flex items-center justify-between text-left text-xs px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-softblue-50 text-softblue-900 font-bold border-l-4 border-softblue-600'
                      : 'text-sand-700 hover:bg-sand-50/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {cat.icon}
                    <span>{cat.name}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Editing Form Column */}
            <div className="lg:col-span-9 space-y-6">
              <div className="bg-sand-50/40 p-4 rounded-2xl border border-sand-200/50 mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-sand-800 font-mono">
                  Editando Categoria: {categories.find(c => c.id === selectedCategory)?.name}
                </h3>
                <p className="text-[11px] text-sand-500 mt-0.5">Altere os textos abaixo. Eles são salvos localmente e propagados ao salvar o rascunho.</p>
              </div>

              {/* Dynamic Inputs per Category */}
              {selectedCategory === 'hero' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Tag Superior</label>
                    <input
                      type="text"
                      value={localCms.hero?.tag || ''}
                      onChange={(e) => updateCmsField('hero', 'tag', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-sand-200 focus:outline-none text-xs text-sand-900 focus:border-softblue-500 font-serif"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Título Principal (H1)</label>
                    <input
                      type="text"
                      value={localCms.hero?.title || ''}
                      onChange={(e) => updateCmsField('hero', 'title', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-sand-200 focus:outline-none text-xs text-sand-900 focus:border-softblue-500 font-serif"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Subtítulo Emocional</label>
                    <textarea
                      rows={2}
                      value={localCms.hero?.subtitle || ''}
                      onChange={(e) => updateCmsField('hero', 'subtitle', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-sand-200 focus:outline-none text-xs text-sand-900 focus:border-softblue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Texto de Apoio (Body)</label>
                    <textarea
                      rows={3}
                      value={localCms.hero?.body || ''}
                      onChange={(e) => updateCmsField('hero', 'body', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-sand-200 focus:outline-none text-xs text-sand-900 focus:border-softblue-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Texto Botão Principal</label>
                      <input
                        type="text"
                        value={localCms.hero?.button_primary || ''}
                        onChange={(e) => updateCmsField('hero', 'button_primary', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-sand-200 focus:outline-none text-xs text-sand-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Texto Botão Secundário</label>
                      <input
                        type="text"
                        value={localCms.hero?.button_secondary || ''}
                        onChange={(e) => updateCmsField('hero', 'button_secondary', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-sand-200 focus:outline-none text-xs text-sand-900"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-sand-100 pt-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Métrica 1 Título</label>
                      <input
                        type="text"
                        value={localCms.hero?.stat1_title || ''}
                        onChange={(e) => updateCmsField('hero', 'stat1_title', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-sand-200 focus:outline-none text-xs text-sand-900"
                      />
                      <input
                        type="text"
                        value={localCms.hero?.stat1_desc || ''}
                        onChange={(e) => updateCmsField('hero', 'stat1_desc', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-sand-200 focus:outline-none text-[10px] text-sand-600 mt-1"
                        placeholder="Descrição"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Métrica 2 Título</label>
                      <input
                        type="text"
                        value={localCms.hero?.stat2_title || ''}
                        onChange={(e) => updateCmsField('hero', 'stat2_title', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-sand-200 focus:outline-none text-xs text-sand-900"
                      />
                      <input
                        type="text"
                        value={localCms.hero?.stat2_desc || ''}
                        onChange={(e) => updateCmsField('hero', 'stat2_desc', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-sand-200 focus:outline-none text-[10px] text-sand-600 mt-1"
                        placeholder="Descrição"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Métrica 3 Título</label>
                      <input
                        type="text"
                        value={localCms.hero?.stat3_title || ''}
                        onChange={(e) => updateCmsField('hero', 'stat3_title', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-sand-200 focus:outline-none text-xs text-sand-900"
                      />
                      <input
                        type="text"
                        value={localCms.hero?.stat3_desc || ''}
                        onChange={(e) => updateCmsField('hero', 'stat3_desc', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-sand-200 focus:outline-none text-[10px] text-sand-600 mt-1"
                        placeholder="Descrição"
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedCategory === 'about' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Tag Superior</label>
                      <input
                        type="text"
                        value={localCms.about?.tag || ''}
                        onChange={(e) => updateCmsField('about', 'tag', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-sand-200 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Título da Seção</label>
                      <input
                        type="text"
                        value={localCms.about?.title || ''}
                        onChange={(e) => updateCmsField('about', 'title', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-sand-200 text-xs font-serif"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Biografia Completa (Estilo Word - WYSIWYG)</label>
                    <RichTextEditor
                      value={localCms.about?.bioLong || ''}
                      onChange={(html) => updateCmsField('about', 'bioLong', html)}
                      placeholder="Escreva sua biografia clínica..."
                    />
                  </div>
                  <div className="border-t border-sand-100 pt-4 space-y-4">
                    <h4 className="text-xs font-bold uppercase text-sand-800 font-mono">Valores e Pilares Clínicos</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Título de Valores</label>
                        <input
                          type="text"
                          value={localCms.about?.valuesTitle || ''}
                          onChange={(e) => updateCmsField('about', 'valuesTitle', e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-sand-200 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Subtítulo de Valores</label>
                        <input
                          type="text"
                          value={localCms.about?.valuesSubtitle || ''}
                          onChange={(e) => updateCmsField('about', 'valuesSubtitle', e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-sand-200 text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Breve Descrição de Valores</label>
                      <textarea
                        rows={2}
                        value={localCms.about?.valuesDescription || ''}
                        onChange={(e) => updateCmsField('about', 'valuesDescription', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-sand-200 text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedCategory === 'benefits' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Tag Superior</label>
                      <input
                        type="text"
                        value={localCms.benefits?.tag || ''}
                        onChange={(e) => updateCmsField('benefits', 'tag', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-sand-200 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Título Seção</label>
                      <input
                        type="text"
                        value={localCms.benefits?.title || ''}
                        onChange={(e) => updateCmsField('benefits', 'title', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-sand-200 text-xs font-serif"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Subtítulo de Benefícios</label>
                    <textarea
                      rows={2}
                      value={localCms.benefits?.subtitle || ''}
                      onChange={(e) => updateCmsField('benefits', 'subtitle', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-sand-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Texto do Botão de Agendamento</label>
                    <input
                      type="text"
                      value={localCms.benefits?.button_label || ''}
                      onChange={(e) => updateCmsField('benefits', 'button_label', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-sand-200 text-xs"
                    />
                  </div>
                </div>
              )}

              {selectedCategory === 'services' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Tag Superior</label>
                      <input
                        type="text"
                        value={localCms.services?.tag || ''}
                        onChange={(e) => updateCmsField('services', 'tag', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-sand-200 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Título Seção</label>
                      <input
                        type="text"
                        value={localCms.services?.title || ''}
                        onChange={(e) => updateCmsField('services', 'title', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-sand-200 text-xs font-serif"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Subtítulo de Serviços</label>
                    <textarea
                      rows={2}
                      value={localCms.services?.subtitle || ''}
                      onChange={(e) => updateCmsField('services', 'subtitle', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-sand-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Texto Padrão do Botão de Agendar</label>
                    <input
                      type="text"
                      value={localCms.services?.button_label || ''}
                      onChange={(e) => updateCmsField('services', 'button_label', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-sand-200 text-xs"
                    />
                  </div>
                </div>
              )}

              {selectedCategory === 'howitworks' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Tag Superior</label>
                      <input
                        type="text"
                        value={localCms.howitworks?.tag || ''}
                        onChange={(e) => updateCmsField('howitworks', 'tag', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-sand-200 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Título Seção</label>
                      <input
                        type="text"
                        value={localCms.howitworks?.title || ''}
                        onChange={(e) => updateCmsField('howitworks', 'title', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-sand-200 text-xs font-serif"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Subtítulo explicativo</label>
                    <textarea
                      rows={3}
                      value={localCms.howitworks?.subtitle || ''}
                      onChange={(e) => updateCmsField('howitworks', 'subtitle', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-sand-200 text-xs"
                    />
                  </div>
                </div>
              )}

              {selectedCategory === 'faqs' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Tag Superior</label>
                      <input
                        type="text"
                        value={localCms.faqs?.tag || ''}
                        onChange={(e) => updateCmsField('faqs', 'tag', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-sand-200 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Título Seção</label>
                      <input
                        type="text"
                        value={localCms.faqs?.title || ''}
                        onChange={(e) => updateCmsField('faqs', 'title', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-sand-200 text-xs font-serif"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Subtítulo explicativo</label>
                    <textarea
                      rows={2}
                      value={localCms.faqs?.subtitle || ''}
                      onChange={(e) => updateCmsField('faqs', 'subtitle', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-sand-200 text-xs"
                    />
                  </div>
                </div>
              )}

              {selectedCategory === 'testimonials' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Tag Superior</label>
                      <input
                        type="text"
                        value={localCms.testimonials?.tag || ''}
                        onChange={(e) => updateCmsField('testimonials', 'tag', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-sand-200 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Título Seção</label>
                      <input
                        type="text"
                        value={localCms.testimonials?.title || ''}
                        onChange={(e) => updateCmsField('testimonials', 'title', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-sand-200 text-xs font-serif"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Subtítulo explicativo</label>
                    <textarea
                      rows={2}
                      value={localCms.testimonials?.subtitle || ''}
                      onChange={(e) => updateCmsField('testimonials', 'subtitle', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-sand-200 text-xs"
                    />
                  </div>
                </div>
              )}

              {selectedCategory === 'contact' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Tag Superior</label>
                      <input
                        type="text"
                        value={localCms.contact?.tag || ''}
                        onChange={(e) => updateCmsField('contact', 'tag', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-sand-200 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Título Seção</label>
                      <input
                        type="text"
                        value={localCms.contact?.title || ''}
                        onChange={(e) => updateCmsField('contact', 'title', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-sand-200 text-xs font-serif"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Subtítulo explicativo</label>
                    <textarea
                      rows={2}
                      value={localCms.contact?.subtitle || ''}
                      onChange={(e) => updateCmsField('contact', 'subtitle', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-sand-200 text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-sand-100 pt-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Placeholder: Campo Nome</label>
                      <input
                        type="text"
                        value={localCms.contact?.form_name || ''}
                        onChange={(e) => updateCmsField('contact', 'form_name', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-sand-200 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Placeholder: Campo E-mail</label>
                      <input
                        type="text"
                        value={localCms.contact?.form_email || ''}
                        onChange={(e) => updateCmsField('contact', 'form_email', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-sand-200 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Placeholder: Campo Telefone</label>
                      <input
                        type="text"
                        value={localCms.contact?.form_phone || ''}
                        onChange={(e) => updateCmsField('contact', 'form_phone', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-sand-200 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Placeholder: Campo Mensagem</label>
                      <input
                        type="text"
                        value={localCms.contact?.form_message || ''}
                        onChange={(e) => updateCmsField('contact', 'form_message', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-sand-200 text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Texto do Botão de Envio</label>
                    <input
                      type="text"
                      value={localCms.contact?.form_submit || ''}
                      onChange={(e) => updateCmsField('contact', 'form_submit', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-sand-200 text-xs"
                    />
                  </div>
                </div>
              )}

              {selectedCategory === 'footer' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Alerta do CFP / Texto Geral de Rodapé</label>
                    <textarea
                      rows={3}
                      value={localCms.footer?.crp_warning || ''}
                      onChange={(e) => updateCmsField('footer', 'crp_warning', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-sand-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Texto de Direitos Autorais (Copyright)</label>
                    <input
                      type="text"
                      value={localCms.footer?.copyright || ''}
                      onChange={(e) => updateCmsField('footer', 'copyright', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-sand-200 text-xs"
                    />
                  </div>
                </div>
              )}

              {selectedCategory === 'policies' && (
                <div className="space-y-4">
                  <div className="border border-sand-150 p-4 rounded-2xl bg-sand-50/50">
                    <h4 className="text-xs font-bold text-sand-800 font-mono uppercase mb-3">Política de Privacidade</h4>
                    <div className="mb-3">
                      <label className="block text-[10px] font-bold uppercase text-sand-600 font-mono mb-1">Título Principal</label>
                      <input
                        type="text"
                        value={localCms.policies?.privacy_title || ''}
                        onChange={(e) => updateCmsField('policies', 'privacy_title', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-sand-200 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-sand-600 font-mono mb-1">Conteúdo Regulatório (Estilo Word - WYSIWYG)</label>
                      <RichTextEditor
                        value={localCms.policies?.privacy_content || ''}
                        onChange={(html) => updateCmsField('policies', 'privacy_content', html)}
                        placeholder="Escreva os termos de privacidade aqui..."
                      />
                    </div>
                  </div>

                  <div className="border border-sand-150 p-4 rounded-2xl bg-sand-50/50">
                    <h4 className="text-xs font-bold text-sand-800 font-mono uppercase mb-3">Termos de Uso</h4>
                    <div className="mb-3">
                      <label className="block text-[10px] font-bold uppercase text-sand-600 font-mono mb-1">Título Principal</label>
                      <input
                        type="text"
                        value={localCms.policies?.terms_title || ''}
                        onChange={(e) => updateCmsField('policies', 'terms_title', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-sand-200 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-sand-600 font-mono mb-1">Conteúdo Legal (Estilo Word - WYSIWYG)</label>
                      <RichTextEditor
                        value={localCms.policies?.terms_content || ''}
                        onChange={(html) => updateCmsField('policies', 'terms_content', html)}
                        placeholder="Escreva os termos de uso aqui..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedCategory === 'system_messages' && (
                <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 bg-blue-50 text-blue-800 p-3 rounded-xl text-[11px] border border-blue-100 mb-2">
                    Aqui você pode personalizar todas as mensagens internas que os pacientes ou administradores veem ao usar o sistema MenteCare.
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Agendamento Realizado (Sucesso)</label>
                    <textarea
                      rows={2}
                      value={localCms.system_messages?.success_appointment || ''}
                      onChange={(e) => updateCmsField('system_messages', 'success_appointment', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-sand-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Erro no Agendamento</label>
                    <textarea
                      rows={2}
                      value={localCms.system_messages?.error_appointment || ''}
                      onChange={(e) => updateCmsField('system_messages', 'error_appointment', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-sand-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Formulário Contato Enviado (Sucesso)</label>
                    <textarea
                      rows={2}
                      value={localCms.system_messages?.success_contact || ''}
                      onChange={(e) => updateCmsField('system_messages', 'success_contact', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-sand-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Erro Formulário Contato</label>
                    <textarea
                      rows={2}
                      value={localCms.system_messages?.error_contact || ''}
                      onChange={(e) => updateCmsField('system_messages', 'error_contact', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-sand-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Pagamento Pix Aprovado</label>
                    <textarea
                      rows={2}
                      value={localCms.system_messages?.success_pix || ''}
                      onChange={(e) => updateCmsField('system_messages', 'success_pix', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-sand-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Pix Gerado (Aguardando Pagamento)</label>
                    <textarea
                      rows={2}
                      value={localCms.system_messages?.pending_pix || ''}
                      onChange={(e) => updateCmsField('system_messages', 'pending_pix', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-sand-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Prontuário Salvo (Sucesso)</label>
                    <textarea
                      rows={2}
                      value={localCms.system_messages?.success_record || ''}
                      onChange={(e) => updateCmsField('system_messages', 'success_record', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-sand-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Lançamento Financeiro Salvo (Sucesso)</label>
                    <textarea
                      rows={2}
                      value={localCms.system_messages?.success_finance || ''}
                      onChange={(e) => updateCmsField('system_messages', 'success_finance', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-sand-200 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SUB-TAB 2: ESTILO (APPEARANCE) */}
        {activeSubTab === 'estilo' && (
          <div className="space-y-6">
            <div className="bg-sand-50/40 p-4 rounded-2xl border border-sand-200/50">
              <h3 className="text-xs font-bold uppercase tracking-wider text-sand-800 font-mono">Identidade Visual & Paleta de Cores</h3>
              <p className="text-[11px] text-sand-500 mt-0.5">Customize o visual do seu consultório virtual em tempo real.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Visual Theme Properties */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-sand-800 font-mono uppercase border-b pb-1">Cores da Interface</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Cor Primária (Sálvia/Marca)</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={localAppearance.primaryColor || '#5c6f68'}
                        onChange={(e) => updateAppearanceField('primaryColor', e.target.value)}
                        className="w-10 h-10 border border-sand-300 rounded-xl cursor-pointer"
                      />
                      <input
                        type="text"
                        value={localAppearance.primaryColor || ''}
                        onChange={(e) => updateAppearanceField('primaryColor', e.target.value)}
                        className="flex-1 px-3 py-1.5 border border-sand-200 rounded-xl text-xs font-mono uppercase"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Cor do Fundo Geral (Background)</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={localAppearance.backgroundColor || '#fcfaf7'}
                        onChange={(e) => updateAppearanceField('backgroundColor', e.target.value)}
                        className="w-10 h-10 border border-sand-300 rounded-xl cursor-pointer"
                      />
                      <input
                        type="text"
                        value={localAppearance.backgroundColor || ''}
                        onChange={(e) => updateAppearanceField('backgroundColor', e.target.value)}
                        className="flex-1 px-3 py-1.5 border border-sand-200 rounded-xl text-xs font-mono uppercase"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Cor dos Botões Principais</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={localAppearance.buttonColor || '#b36f64'}
                        onChange={(e) => updateAppearanceField('buttonColor', e.target.value)}
                        className="w-10 h-10 border border-sand-300 rounded-xl cursor-pointer"
                      />
                      <input
                        type="text"
                        value={localAppearance.buttonColor || ''}
                        onChange={(e) => updateAppearanceField('buttonColor', e.target.value)}
                        className="flex-1 px-3 py-1.5 border border-sand-200 rounded-xl text-xs font-mono uppercase"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Cor dos Títulos Principais</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={localAppearance.titleColor || '#1c1a16'}
                        onChange={(e) => updateAppearanceField('titleColor', e.target.value)}
                        className="w-10 h-10 border border-sand-300 rounded-xl cursor-pointer"
                      />
                      <input
                        type="text"
                        value={localAppearance.titleColor || ''}
                        onChange={(e) => updateAppearanceField('titleColor', e.target.value)}
                        className="flex-1 px-3 py-1.5 border border-sand-200 rounded-xl text-xs font-mono uppercase"
                      />
                    </div>
                  </div>
                </div>

                <h4 className="text-xs font-bold text-sand-800 font-mono uppercase border-b pb-1 pt-4">Tipografia & Fontes</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Fonte Sans-Serif (Textos)</label>
                    <select
                      value={localAppearance.fontFamily || 'Poppins'}
                      onChange={(e) => updateAppearanceField('fontFamily', e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-sand-200 text-xs bg-white focus:outline-none"
                    >
                      <option value="Poppins">Poppins</option>
                      <option value="Inter">Inter (Suiça)</option>
                      <option value="Space Grotesk">Space Grotesk (Tech)</option>
                      <option value="Outfit">Outfit</option>
                      <option value="JetBrains Mono">JetBrains Mono</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">Tamanho Base do Texto</label>
                    <select
                      value={localAppearance.fontSize || '16px'}
                      onChange={(e) => updateAppearanceField('fontSize', e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-sand-200 text-xs bg-white focus:outline-none"
                    >
                      <option value="14px">Pequeno (14px)</option>
                      <option value="16px">Normal (16px)</option>
                      <option value="18px">Médio (18px)</option>
                      <option value="20px">Grande (20px)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Right Column: Custom Branding & Logos */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-sand-800 font-mono uppercase border-b pb-1">Identidade Gráfica (Logos & Favicons)</h4>
                
                <div>
                  <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">URL da Imagem do Logotipo</label>
                  <input
                    type="text"
                    value={siteContent.psychologist_info.logoUrl || ''}
                    onChange={(e) => {
                      const updatedInfo = { ...siteContent.psychologist_info, logoUrl: e.target.value };
                      updateSiteContent({ psychologist_info: updatedInfo });
                    }}
                    placeholder="Cole a URL ou Base64 do logotipo"
                    className="w-full px-4 py-2.5 rounded-xl border border-sand-200 text-xs"
                  />
                  <p className="text-[9px] text-sand-500 mt-1">Deixe em branco para usar o cabeçalho padrão em texto da clínica.</p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">URL do Favicon (Ícone do Navegador)</label>
                  <input
                    type="text"
                    value={siteContent.psychologist_info.faviconUrl || ''}
                    onChange={(e) => {
                      const updatedInfo = { ...siteContent.psychologist_info, faviconUrl: e.target.value };
                      updateSiteContent({ psychologist_info: updatedInfo });
                    }}
                    placeholder="Cole a URL ou Base64 do favicon (.ico, .png, etc.)"
                    className="w-full px-4 py-2.5 rounded-xl border border-sand-200 text-xs"
                  />
                  <p className="text-[9px] text-sand-500 mt-1">Este ícone será atualizado dinamicamente na aba do navegador de todos os pacientes.</p>
                </div>

                <div className="border border-sand-150 p-4 rounded-2xl bg-sand-50/40 space-y-2 mt-4">
                  <h5 className="text-[10px] font-bold text-sand-900 uppercase font-mono">Visualizador de Amostra de Estilo</h5>
                  <div 
                    className="p-4 rounded-xl border flex flex-col justify-between items-center text-center space-y-2 transition-all"
                    style={{ 
                      backgroundColor: localAppearance.backgroundColor, 
                      borderColor: localAppearance.borderColor,
                      fontFamily: localAppearance.fontFamily,
                      color: localAppearance.fontColor
                    }}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: localAppearance.primaryColor }}>Amostra de Título</span>
                    <h5 className="text-lg font-bold font-serif leading-tight" style={{ color: localAppearance.titleColor }}>
                      Minha Clínica Virtual
                    </h5>
                    <p className="text-[11px] leading-normal" style={{ fontSize: localAppearance.fontSize }}>
                      A psicoterapia é um processo único de conexão humana e embasamento científico.
                    </p>
                    <button 
                      className="px-4 py-2 rounded-lg text-xs font-medium text-white shadow-sm"
                      style={{ backgroundColor: localAppearance.buttonColor }}
                    >
                      Agendar Consulta
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUB-TAB 3: ORGANIZAÇÃO DE SEÇÕES (LAYOUT FLOW) */}
        {activeSubTab === 'secoes' && (
          <div className="space-y-6">
            <div className="bg-sand-50/40 p-4 rounded-2xl border border-sand-200/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-sand-800 font-mono">Estruturação e Ordem das Seções</h3>
                <p className="text-[11px] text-sand-500 mt-0.5">Defina quais seções aparecem na página principal, reordene sua disposição ou crie seções personalizadas com editores ricos.</p>
              </div>
              <button
                onClick={createCustomSection}
                className="inline-flex items-center text-xs bg-softblue-50 text-softblue-800 border border-softblue-200/50 hover:bg-softblue-100 px-3 py-2 rounded-xl transition-all font-semibold cursor-pointer shrink-0"
              >
                <Plus size={14} className="mr-1" />
                Criar Seção Personalizada
              </button>
            </div>

            {/* List of sections with action controls */}
            <div className="space-y-3">
              {localSections.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-sand-300 rounded-2xl">
                  <span className="text-xl">📭</span>
                  <p className="text-xs text-sand-500 font-mono mt-2">Nenhuma seção configurada no layout. Clique em redefinir ou crie uma personalizada.</p>
                </div>
              ) : (
                localSections.map((sec, idx) => (
                  <div 
                    key={sec.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border transition-all ${
                      sec.visible 
                        ? 'bg-white border-sand-200 shadow-xs' 
                        : 'bg-sand-50/40 border-sand-200/40 opacity-70'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Drag / Rank indicator */}
                      <div className="text-[10px] font-mono font-bold bg-sand-100 text-sand-600 w-6 h-6 rounded-full flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-sand-950 font-sans">{sec.title}</h4>
                          <span className="text-[9px] uppercase tracking-wider font-mono px-1.5 py-0.5 rounded bg-sand-100 text-sand-600 font-bold border border-sand-200">
                            {sec.type}
                          </span>
                        </div>
                        <p className="text-[10px] text-sand-500 font-mono mt-0.5">Identificador único: {sec.id}</p>
                      </div>
                    </div>

                    {/* Section actions control panel */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-3 sm:mt-0">
                      
                      {/* Move controls */}
                      <button
                        onClick={() => moveSection(idx, 'up')}
                        disabled={idx === 0}
                        title="Mover para cima"
                        className="p-1.5 hover:bg-sand-100 rounded-lg text-sand-500 hover:text-sand-900 transition-colors cursor-pointer disabled:opacity-40"
                      >
                        <ChevronUp size={16} />
                      </button>
                      <button
                        onClick={() => moveSection(idx, 'down')}
                        disabled={idx === localSections.length - 1}
                        title="Mover para baixo"
                        className="p-1.5 hover:bg-sand-100 rounded-lg text-sand-500 hover:text-sand-900 transition-colors cursor-pointer disabled:opacity-40 mr-2"
                      >
                        <ChevronDown size={16} />
                      </button>

                      {/* Visible/Hidden switch */}
                      <button
                        onClick={() => toggleSectionVisibility(idx)}
                        className={`text-xs px-2.5 py-1.5 rounded-lg border font-semibold transition-all cursor-pointer ${
                          sec.visible
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-sand-100 text-sand-700 border-sand-200 hover:bg-sand-200'
                        }`}
                      >
                        {sec.visible ? "Visível" : "Oculto"}
                      </button>

                      {/* Duplicate action */}
                      <button
                        onClick={() => duplicateSection(idx)}
                        title="Duplicar Seção"
                        className="p-1.5 hover:bg-sand-100 rounded-lg text-sand-600 hover:text-sand-900 transition-all cursor-pointer border border-sand-200"
                      >
                        <Copy size={13} />
                      </button>

                      {/* Delete action */}
                      <button
                        onClick={() => deleteSection(idx)}
                        title="Excluir Seção"
                        className="p-1.5 hover:bg-red-50 hover:text-red-700 rounded-lg text-red-500 transition-all cursor-pointer border border-red-100"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    {/* Custom editor panel inside Custom Sections */}
                    {sec.type === 'custom' && (
                      <div className="w-full mt-4 pt-4 border-t border-sand-100 space-y-2">
                        <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">
                          Conteúdo HTML / Markdown Customizado (Estilo Word)
                        </label>
                        <RichTextEditor
                          value={sec.customContent || ''}
                          onChange={(html) => updateCustomSectionContent(sec.id, html)}
                          placeholder="Digite o conteúdo rico da sua seção personalizada aqui..."
                        />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* SUB-TAB 4: HISTÓRICO & VERSÕES (VERSIONING ENGINE) */}
        {activeSubTab === 'versoes' && (
          <div className="space-y-6">
            <div className="bg-sand-50/40 p-4 rounded-2xl border border-sand-200/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-sand-800 font-mono">Motor de Versionamento de Produção</h3>
                <p className="text-[11px] text-sand-500 mt-0.5">Revise o histórico completo de publicações, compare alterações de dados ou restaure versões anteriores do site com facilidade.</p>
              </div>
              <button
                onClick={loadVersions}
                className="inline-flex items-center text-xs bg-sand-100 hover:bg-sand-200 text-sand-800 px-3 py-2 rounded-xl transition-all cursor-pointer shrink-0"
              >
                <RefreshCw size={14} className={`mr-1.5 ${loadingVersions ? 'animate-spin' : ''}`} />
                Atualizar Lista
              </button>
            </div>

            {loadingVersions ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw size={20} className="animate-spin text-softblue-600 mr-2" />
                <span className="text-xs text-sand-600 font-mono">Buscando versões históricas do banco...</span>
              </div>
            ) : versions.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-sand-300 rounded-2xl">
                <span className="text-xl">📜</span>
                <p className="text-xs text-sand-500 font-mono mt-2">Nenhuma versão arquivada encontrada no Firestore. Publique novas alterações para iniciar o histórico.</p>
              </div>
            ) : (
              <div className="border border-sand-200 rounded-2xl overflow-hidden divide-y divide-sand-100">
                {versions.map((v) => (
                  <div key={v.id} className="p-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-sand-50/40 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="bg-softblue-50 text-softblue-800 text-xs font-bold font-mono px-2.5 py-1 rounded-lg shrink-0">
                        V#{v.versionNumber}
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="text-xs font-bold text-sand-950 font-sans">
                            {v.changes || 'Alteração sem comentários'}
                          </span>
                          <span className="text-[9px] bg-sand-100 text-sand-600 px-1.5 py-0.5 rounded font-mono font-semibold">
                            por {v.updatedBy || 'Sistema'}
                          </span>
                        </div>
                        <p className="text-[10px] text-sand-500 font-mono">
                          {new Date(v.updatedAt).toLocaleString('pt-BR')} — ID do Documento: {v.id}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setSelectedVersionForCompare(v);
                          setShowCompareModal(true);
                        }}
                        className="inline-flex items-center text-xs bg-sand-100 hover:bg-sand-200 text-sand-800 px-3 py-1.5 rounded-xl border border-sand-300/30 transition-all font-semibold cursor-pointer"
                      >
                        <Diff size={12} className="mr-1" />
                        Ver / Comparar
                      </button>
                      <button
                        onClick={() => handleRestoreVersion(v)}
                        className="inline-flex items-center text-xs bg-softblue-50 hover:bg-softblue-100 text-softblue-800 px-3 py-1.5 rounded-xl border border-softblue-200/50 transition-all font-semibold cursor-pointer"
                      >
                        <Undo2 size={12} className="mr-1" />
                        Restaurar Versão
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* DIALOG MODAL 1: PUBLISH DIALOG */}
      <AnimatePresence>
        {showPublishModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in select-text">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-sand-200 max-w-lg w-full p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 border-b pb-3 border-sand-100">
                <div className="p-2 bg-softblue-50 text-softblue-600 rounded-xl">
                  <Send size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-serif font-bold text-sand-950">Publicar Alterações (Ir para Produção)</h3>
                  <p className="text-[10px] text-sand-500 mt-0.5">Isto moverá todas as alterações do seu rascunho para o site principal e criará uma nova versão no histórico.</p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-bold uppercase text-sand-700 font-mono mb-1">
                  O que foi alterado nesta versão? (Histórico)
                </label>
                <textarea
                  rows={4}
                  value={publishComment}
                  onChange={(e) => setPublishComment(e.target.value)}
                  placeholder="Ex: Corrigido o erro gramatical na biografia, alterado o azul primário para tom sálvia e reordenado a seção depoimentos."
                  className="w-full px-4 py-2.5 rounded-xl border border-sand-200 focus:outline-none text-xs focus:border-softblue-500 text-sand-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t pt-3 border-sand-100">
                <button
                  type="button"
                  onClick={() => setShowPublishModal(false)}
                  className="px-4 py-2 text-xs bg-sand-100 hover:bg-sand-200 text-sand-800 rounded-xl font-semibold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handlePublishLive}
                  disabled={isPublishing}
                  className="inline-flex items-center px-4 py-2 text-xs bg-softblue-600 hover:bg-softblue-700 text-white rounded-xl font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isPublishing && <RefreshCw size={12} className="animate-spin mr-1.5" />}
                  Confirmar e Publicar (Go Live)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DIALOG MODAL 2: COMPARE/DETAILS VIEW */}
      <AnimatePresence>
        {showCompareModal && selectedVersionForCompare && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in select-text">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-sand-200 max-w-3xl w-full p-6 shadow-2xl flex flex-col max-h-[85vh]"
            >
              <div className="flex items-center justify-between border-b pb-3 border-sand-100 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="bg-softblue-100 text-softblue-900 text-xs font-bold font-mono px-2 py-0.5 rounded">
                    Versão #{selectedVersionForCompare.versionNumber}
                  </span>
                  <div>
                    <h3 className="text-sm font-serif font-bold text-sand-950">Visualizador de Dados de Auditoria</h3>
                    <p className="text-[10px] text-sand-500 font-mono">Salvo por {selectedVersionForCompare.updatedBy} em {new Date(selectedVersionForCompare.updatedAt).toLocaleString('pt-BR')}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCompareModal(false)}
                  className="text-sand-400 hover:text-sand-900 font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              {/* JSON code representation scroll container */}
              <div className="flex-1 overflow-y-auto my-4 p-4 bg-sand-950 text-sand-100 font-mono text-[10px] rounded-xl whitespace-pre-wrap select-text leading-relaxed">
                <h4 className="text-[9px] uppercase tracking-wider text-sand-500 font-bold mb-2">Comentário de Publicação: {selectedVersionForCompare.changes}</h4>
                {JSON.stringify(selectedVersionForCompare.data, null, 2)}
              </div>

              <div className="flex items-center justify-between border-t pt-3 border-sand-100 shrink-0">
                <span className="text-[10px] text-sand-500 font-mono">Restaurar esta versão substituirá seu rascunho de trabalho.</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCompareModal(false)}
                    className="px-4 py-2 text-xs bg-sand-100 hover:bg-sand-200 text-sand-800 rounded-xl font-semibold transition-all cursor-pointer"
                  >
                    Fechar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCompareModal(false);
                      handleRestoreVersion(selectedVersionForCompare);
                    }}
                    className="inline-flex items-center px-4 py-2 text-xs bg-softblue-600 hover:bg-softblue-700 text-white rounded-xl font-bold transition-all shadow-md cursor-pointer"
                  >
                    <Undo2 size={12} className="mr-1" />
                    Restaurar esta versão
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
