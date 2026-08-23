import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { WhatsAppConfig } from '../../types';
import { 
  MessageCircle, 
  X, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Lock, 
  Globe, 
  Phone, 
  Sliders, 
  Radio, 
  Code2, 
  Copy,
  ExternalLink
} from 'lucide-react';

interface WhatsAppConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WhatsAppConfigModal: React.FC<WhatsAppConfigModalProps> = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  
  // Config state
  const [baseUrl, setBaseUrl] = useState('');
  const [token, setToken] = useState('');
  const [defaultChannelNumber, setDefaultChannelNumber] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [autoNotifyChecklist, setAutoNotifyChecklist] = useState(true);
  const [autoNotifyFreightStatus, setAutoNotifyFreightStatus] = useState(true);

  // Test state
  const [testPhone, setTestPhone] = useState('5517997451176');
  const [testMessage, setTestMessage] = useState('🚚 [ELO LOG] Teste de integração com a API de Atendimento WhatsApp. Gateway conectado com sucesso!');
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    recipient?: string;
    details?: any;
  } | null>(null);

  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    const loadConfig = async () => {
      setLoading(true);
      try {
        const config = await api.getWhatsAppConfig();
        setBaseUrl(config.baseUrl || '');
        setToken(config.token || '');
        setDefaultChannelNumber(config.defaultChannelNumber || '5517997451176');
        setIsActive(config.isActive !== undefined ? config.isActive : true);
        setAutoNotifyChecklist(config.autoNotifyChecklist !== undefined ? config.autoNotifyChecklist : true);
        setAutoNotifyFreightStatus(config.autoNotifyFreightStatus !== undefined ? config.autoNotifyFreightStatus : true);
      } catch (err) {
        console.error('Erro ao carregar configurações do WhatsApp:', err);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccessMsg('');
    try {
      await api.updateWhatsAppConfig({
        baseUrl: baseUrl.trim(),
        token: token.trim(),
        defaultChannelNumber: defaultChannelNumber.trim(),
        isActive,
        autoNotifyChecklist,
        autoNotifyFreightStatus
      });
      setSaveSuccessMsg('Configurações salvas com sucesso!');
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar configurações do WhatsApp');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!testPhone) {
      alert('Informe o número de telefone de destino para o teste.');
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.testWhatsAppConnection({
        phone: testPhone,
        message: testMessage,
        baseUrl: baseUrl.trim(),
        token: token.trim()
      });
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Falha ao testar conexão com o Gateway'
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col my-8">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-800/80 rounded-xl">
              <MessageCircle className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Configuração da API de WhatsApp / Canal</h2>
              <p className="text-xs text-emerald-100">
                Integração direta com o Gateway de Atendimento (Postman Coleção API)
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-emerald-200 hover:text-white hover:bg-emerald-800/60 rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500">
              <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
              <p className="text-sm font-medium">Carregando configurações do Gateway...</p>
            </div>
          ) : (
            <>
              {/* Form Settings */}
              <form onSubmit={handleSave} className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-emerald-600" />
                      Parâmetros do Gateway de Atendimento
                    </h3>
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                      Bearer Token Auth
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      URL Base da API (<code>base_url</code>):
                    </label>
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2">
                      <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                      <input
                        type="url"
                        value={baseUrl}
                        onChange={e => setBaseUrl(e.target.value)}
                        placeholder="https://api.atendimento.com.br"
                        className="w-full text-xs bg-transparent text-slate-900 dark:text-white focus:outline-hidden font-mono"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Endpoint raiz da sua instância do Postman (ex: <code>https://seu-servidor-whatsapp.com</code>).
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Token Bearer (<code>token</code>):
                    </label>
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2">
                      <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                      <input
                        type="text"
                        value={token}
                        onChange={e => setToken(e.target.value)}
                        placeholder="Cole seu token JWT / Bearer aqui"
                        className="w-full text-xs bg-transparent text-slate-900 dark:text-white focus:outline-hidden font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Canal / Número Padrão:
                      </label>
                      <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2">
                        <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                        <input
                          type="text"
                          value={defaultChannelNumber}
                          onChange={e => setDefaultChannelNumber(e.target.value)}
                          placeholder="5517997451176"
                          className="w-full text-xs bg-transparent text-slate-900 dark:text-white focus:outline-hidden font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 sm:pt-0">
                      <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={autoNotifyChecklist}
                          onChange={e => setAutoNotifyChecklist(e.target.checked)}
                          className="w-4 h-4 text-emerald-600 rounded"
                        />
                        Disparar aviso ao salvar Checklist
                      </label>
                      <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={autoNotifyFreightStatus}
                          onChange={e => setAutoNotifyFreightStatus(e.target.checked)}
                          className="w-4 h-4 text-emerald-600 rounded"
                        />
                        Disparar aviso em mudanças de frete
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  {saveSuccessMsg ? (
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 animate-in fade-in">
                      <CheckCircle2 className="w-4 h-4" />
                      {saveSuccessMsg}
                    </span>
                  ) : <span />}

                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-2 transition-colors"
                  >
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>Salvar Configuração</span>
                  </button>
                </div>
              </form>

              {/* Test Sandbox Section */}
              <div className="bg-slate-900 text-white p-4 rounded-xl space-y-3 border border-slate-800 text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                    <h3 className="font-bold text-slate-100">Testador de Disparo em Tempo Real</h3>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">POST {'{{base_url}}'}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Número de Destino (com DDD):</label>
                    <input
                      type="text"
                      value={testPhone}
                      onChange={e => setTestPhone(e.target.value)}
                      placeholder="5517997451176"
                      className="w-full bg-slate-800 border border-slate-700 text-white px-2.5 py-1.5 rounded focus:outline-hidden font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 font-semibold mb-1">Mensagem de Teste:</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={testMessage}
                        onChange={e => setTestMessage(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-white px-2.5 py-1.5 rounded focus:outline-hidden truncate"
                      />
                      <button
                        type="button"
                        onClick={handleTestConnection}
                        disabled={testing}
                        className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded shrink-0 cursor-pointer flex items-center gap-1 transition-colors"
                      >
                        {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        <span>{testing ? 'Testando...' : 'Testar Envio'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {testResult && (
                  <div className={`p-3 rounded-lg border ${testResult.success ? 'bg-emerald-950/80 border-emerald-700 text-emerald-200' : 'bg-rose-950/80 border-rose-700 text-rose-200'} space-y-1.5`}>
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1.5">
                        {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
                        {testResult.success ? 'Resposta do Gateway: Sucesso' : 'Falha na Transmissão'}
                      </span>
                    </div>
                    <p className="text-xs">{testResult.message}</p>
                    {testResult.details && (
                      <pre className="text-[10px] bg-slate-950/90 p-2 rounded overflow-x-auto text-slate-300 font-mono">
                        {JSON.stringify(testResult.details, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </div>

              {/* API Capabilities Reference */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-400 space-y-1.5">
                <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-emerald-600" />
                  Formatos Suportados da Coleção Postman:
                </div>
                <p>
                  • <strong>Texto Direto:</strong> <code>{`{ body: "...", number: "55...", externalKey: "..." }`}</code><br />
                  • <strong>Mídia / Documentos:</strong> <code>{`{ body: "...", number: "55...", mediaUrl: "..." }`}</code><br />
                  • <strong>API Plus / Botões Interativos:</strong> <code>/apiplus</code> com <code>{`{ contents: { type: "button", action: { buttons: [...] } } }`}</code>
                </p>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
