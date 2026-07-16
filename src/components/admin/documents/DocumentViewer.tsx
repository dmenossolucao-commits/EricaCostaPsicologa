import React from 'react';
import { X, Download, FileText, Calendar, User, HardDrive, Paperclip, Music } from 'lucide-react';
import { PatientDocument } from '../../../types';
import { auth } from '../../../firebase';

interface DocumentViewerProps {
  document: PatientDocument;
  onClose: () => void;
  onDownload?: () => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  document: doc,
  onClose,
  onDownload,
}) => {
  // Check authorization - only active authenticated admin users can open clinical files
  const isAuthorized = auth.currentUser && (
    auth.currentUser.email === 'ericacostapsicologa7@gmail.com' ||
    auth.currentUser.email === 'd-briciod2@hotmail.com' ||
    auth.currentUser.email === 'admin@ericacostapsi.com.br'
  );

  if (!isAuthorized) {
    return (
      <div className="fixed inset-0 bg-sand-950/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl border border-rose-200 shadow-2xl p-8 max-w-md w-full text-center space-y-4">
          <div className="h-16 w-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto border border-rose-100">
            <X size={32} />
          </div>
          <h3 className="text-lg font-serif font-bold text-rose-950">Acesso Negado</h3>
          <p className="text-xs text-sand-600 leading-relaxed">
            Sessão expirada ou não autorizada. Cada documento clínico do MenteCare deve ser validado e autorizado individualmente por um administrador autenticado antes de ser exibido.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold font-mono uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  const isImage = doc.fileType.startsWith('image/');
  const isPdf = doc.fileType === 'application/pdf';
  const isAudio = doc.fileType.startsWith('audio/') || ['mp3', 'wav', 'm4a'].includes(doc.fileType.split('/')[1] || '');

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 bg-sand-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        id="document-viewer-modal"
        className="bg-white rounded-3xl border border-sand-200/80 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        
        {/* 1. Header with Metadata */}
        <div className="p-5 border-b border-sand-100 flex items-center justify-between bg-sand-50/50">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 bg-softblue-50 text-softblue-700 border border-softblue-100 rounded">
                {doc.category}
              </span>
              <span className="text-xs text-sand-400 font-mono">•</span>
              <span className="text-xs text-sand-500 font-mono truncate max-w-[150px] sm:max-w-xs">
                {doc.originalName}
              </span>
            </div>
            <h3 className="text-sm font-bold text-sand-950 font-serif truncate mt-1">
              {doc.fileName}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {onDownload && (
              <button
                onClick={onDownload}
                className="p-2 hover:bg-sand-100 text-sand-600 rounded-xl transition-colors cursor-pointer"
                title="Fazer Download"
              >
                <Download size={16} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-sand-100 text-sand-600 hover:text-sand-950 rounded-xl transition-colors cursor-pointer"
              title="Fechar Visualizador"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 2. Primary Media Player / Viewport */}
        <div className="flex-1 bg-sand-950/20 p-6 overflow-y-auto flex items-center justify-center min-h-[300px]">
          {isImage ? (
            <div className="relative group max-w-full max-h-[50vh] rounded-xl overflow-hidden shadow-md">
              <img
                src={doc.downloadURL}
                alt={doc.fileName}
                referrerPolicy="no-referrer"
                className="max-h-[50vh] max-w-full object-contain rounded-xl"
              />
            </div>
          ) : isPdf ? (
            <iframe
              src={`${doc.downloadURL}#toolbar=0`}
              title={doc.fileName}
              referrerPolicy="no-referrer"
              className="w-full h-[50vh] rounded-xl border border-sand-200 bg-white"
            />
          ) : isAudio ? (
            <div className="bg-white p-6 rounded-2xl shadow-md border border-sand-200/60 max-w-md w-full text-center space-y-4">
              <div className="h-14 w-14 rounded-full bg-softblue-50 text-softblue-600 flex items-center justify-center mx-auto border border-softblue-100 animate-pulse">
                <Music size={24} />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-mono text-sand-500 uppercase">Reprodutor de Áudio Clínico</p>
                <p className="text-xs font-bold text-sand-900 truncate">{doc.fileName}</p>
              </div>
              <audio 
                src={doc.downloadURL} 
                controls 
                className="w-full"
                controlsList="nodownload"
              />
            </div>
          ) : (
            <div className="bg-white p-8 rounded-3xl shadow-md border border-sand-200/60 max-w-md text-center space-y-4">
              <div className="h-16 w-16 bg-sand-100 rounded-full flex items-center justify-center mx-auto text-sand-400">
                <FileText size={32} />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-sand-950 font-serif">Visualização Indisponível</h4>
                <p className="text-xs text-sand-600 leading-relaxed">
                  Este arquivo ({doc.fileType}) não pode ser pré-visualizado diretamente no navegador. Por favor, faça o download para abri-lo localmente.
                </p>
              </div>
              {onDownload && (
                <button
                  onClick={onDownload}
                  className="px-4 py-2 bg-sand-900 hover:bg-sand-950 text-white rounded-xl text-xs font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 mx-auto transition-colors cursor-pointer"
                >
                  <Download size={14} />
                  <span>Baixar Arquivo</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* 3. Detailed File Metadata Sidebar/Footer */}
        <div className="p-5 border-t border-sand-100 bg-sand-50/40 text-xs text-sand-700 grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-sand-400 uppercase font-mono tracking-wider block">
              Descrição Clínica
            </span>
            <p className="text-[11px] text-sand-800 font-mono italic leading-relaxed">
              {doc.description || 'Nenhuma descrição fornecida.'}
            </p>
          </div>

          <div className="space-y-1.5 font-mono text-[11px]">
            <span className="text-[10px] font-bold text-sand-400 uppercase tracking-wider block">
              Histórico de Upload
            </span>
            <div className="space-y-1">
              <p className="flex items-center gap-1.5 text-sand-600">
                <Calendar size={12} className="text-sand-400" />
                <span>Enviado em: {formatDate(doc.uploadedAt)}</span>
              </p>
              <p className="flex items-center gap-1.5 text-sand-600">
                <User size={12} className="text-sand-400" />
                <span>Por: {doc.uploadedBy}</span>
              </p>
            </div>
          </div>

          <div className="space-y-1.5 font-mono text-[11px]">
            <span className="text-[10px] font-bold text-sand-400 uppercase tracking-wider block">
              Especificações Técnicas
            </span>
            <div className="space-y-1">
              <p className="flex items-center gap-1.5 text-sand-600">
                <HardDrive size={12} className="text-sand-400" />
                <span>Tamanho: {formatSize(doc.fileSize)}</span>
              </p>
              <p className="flex items-center gap-1.5 text-sand-600">
                <Paperclip size={12} className="text-sand-400" />
                <span>Tipo MIME: {doc.fileType}</span>
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
