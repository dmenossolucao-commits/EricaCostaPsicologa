import React, { useState, useEffect } from 'react';
import { Video, CheckCircle2, LogOut, RefreshCw, ShieldCheck, AlertCircle } from 'lucide-react';
import { googleOAuthManager, GoogleUserMetadata } from '../../services/googleOAuthManager';

export const GoogleIntegrationsPanel: React.FC = () => {
  const [googleMeta, setGoogleMeta] = useState<GoogleUserMetadata>(googleOAuthManager.getMetadata());
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setGoogleMeta(googleOAuthManager.getMetadata());
  }, []);

  const handleConnect = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const meta = await googleOAuthManager.loginGoogle();
      setGoogleMeta(meta);
      setMessage({
        type: 'success',
        text: `Conta Google (${meta.googleEmail || 'conectada'}) vinculada com sucesso! A geração do Google Meet utiliza a API oficial. Nenhum token é gravado no banco de dados.`
      });
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err?.message || 'Falha ao conectar com a conta Google.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      const meta = await googleOAuthManager.logoutGoogle();
      setGoogleMeta(meta);
      setMessage({
        type: 'success',
        text: 'Conta Google desconectada com sucesso.'
      });
    } catch {
      setMessage({
        type: 'error',
        text: 'Erro ao desconectar conta Google.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-3xl border border-sand-200 shadow-xs space-y-6 max-w-3xl">
      <div className="flex items-center justify-between pb-4 border-b border-sand-150">
        <div>
          <h3 className="text-base font-serif font-bold text-sand-950 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <Video size={16} />
            </span>
            <span>Integração Google Workspace & Google Meet</span>
          </h3>
          <p className="text-xs text-sand-600 mt-1">
            Conecte sua conta Google para gerar salas de videochamada oficiais do Google Meet e sincronizar eventos com o Google Calendar.
          </p>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl text-xs font-medium flex items-center gap-2.5 ${
          message.type === 'success' 
            ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' 
            : 'bg-rose-50 text-rose-900 border border-rose-200'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={16} className="text-emerald-600 shrink-0" /> : <AlertCircle size={16} className="text-rose-600 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Google Card */}
      <div className="p-6 rounded-2xl border border-sand-200 bg-sand-50/50 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-sand-200 shadow-2xs flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-sand-950">Google Workspace & Meet</span>
                {googleMeta.googleConnected ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    🟢 Google conectado
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sand-200 text-sand-700 text-[11px] font-bold">
                    <span className="w-2 h-2 rounded-full bg-sand-400" />
                    ○ Desconectado
                  </span>
                )}
              </div>
              <p className="text-xs text-sand-600 mt-0.5">
                {googleMeta.googleConnected ? `Conta: ${googleMeta.googleEmail}` : 'Nenhuma conta Google vinculada no momento.'}
              </p>
            </div>
          </div>

          <div>
            {googleMeta.googleConnected ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleConnect}
                  disabled={loading}
                  className="px-3.5 py-2 rounded-xl bg-sand-100 hover:bg-sand-200 text-sand-800 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                  <span>Trocar conta</span>
                </button>
                <button
                  type="button"
                  onClick={handleDisconnect}
                  disabled={loading}
                  className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <LogOut size={13} />
                  <span>Desconectar</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleConnect}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Video size={15} />
                <span>[ Conectar conta Google ]</span>
              </button>
            )}
          </div>
        </div>

        {/* Detailed Status Box when connected */}
        {googleMeta.googleConnected && (
          <div className="pt-4 border-t border-sand-200 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-white rounded-xl border border-sand-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-sand-500 font-mono block">Conta</span>
              <p className="font-bold text-sand-900 truncate">{googleMeta.googleEmail}</p>
            </div>
            <div className="p-3 bg-white rounded-xl border border-sand-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-sand-500 font-mono block">Última sincronização</span>
              <p className="font-bold text-sand-900">{googleMeta.lastSync || 'Sincronizado agora'}</p>
            </div>
          </div>
        )}
      </div>

      {/* LGPD & Security Box */}
      <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-3">
        <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs">
          <ShieldCheck size={16} className="text-emerald-700" />
          <span>Arquitetura de Segurança Enterprise e LGPD:</span>
        </div>
        <ul className="space-y-2 text-xs text-emerald-900 leading-relaxed list-disc list-inside font-sans">
          <li><strong>Zero Persistência de Tokens:</strong> Access Tokens são armazenados estritamente na memória da sessão web. Nenhum token é gravado no Firestore ou localStorage.</li>
          <li><strong>Geração do Meet Oficial:</strong> A API oficial do Google Calendar é chamada diretamente com escopos restritos.</li>
          <li><strong>Auditoria em 1-Clique:</strong> Apenas metadados de auditoria (ex: horário de conexão e IDs de evento) são mantidos para fins de auditoria LGPD.</li>
        </ul>
      </div>
    </div>
  );
};
