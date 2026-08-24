import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { SaaSGlobalConfig, WhatsAppConfig, EmailConfig } from '../../types';
import { 
  Settings, 
  Globe, 
  ShieldAlert, 
  Sliders, 
  MessageSquare, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  Send, 
  DollarSign, 
  Users, 
  Truck, 
  Lock,
  Eye,
  EyeOff,
  Palette,
  FileText,
  Database,
  Compass,
  BookOpen
} from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { SqlAndInstallationConfig } from './SqlAndInstallationConfig';
import { MapboxConfigPanel } from './MapboxConfigPanel';

export const SaaSConfigPanel: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'branding' | 'plans' | 'rules' | 'gateway' | 'layout' | 'fields' | 'email' | 'sql-installation' | 'mapbox' | 'help'>('sql-installation');
  const [selectedForm, setSelectedForm] = useState<'userForm' | 'freightForm' | 'driverForm' | 'expenseForm'>('freightForm');
  const [showToken, setShowToken] = useState(false);

  // SaaS configuration state
  const [config, setConfig] = useState<SaaSGlobalConfig | null>(null);

  // Help state
  const [helpRole, setHelpRole] = useState<'ADMIN' | 'SUPERVISOR' | 'USER' | 'DRIVER'>('ADMIN');
  const [helpContent, setHelpContent] = useState<Record<string, string>>({
    ADMIN: '',
    SUPERVISOR: '',
    USER: '',
    DRIVER: ''
  });

  // WhatsApp configuration state
  const [waConfig, setWaConfig] = useState<WhatsAppConfig | null>(null);

  // Test states
  const [testPhone, setTestPhone] = useState('5517997451176');
  const [testMessage, setTestMessage] = useState('🚚 [ELO LOG] Teste de integração do gateway WhatsApp. Configurações globais salvas com sucesso!');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadAllConfigs();
  }, []);

  const loadAllConfigs = async () => {
    setLoading(true);
    try {
      const [saasData, waData, helpData] = await Promise.all([
        api.getSaaSGlobalConfig(),
        api.getWhatsAppConfig(),
        api.getHelp()
      ]);

      const contentMap: Record<string, string> = {};
      helpData.forEach((h: { role: string, content: string }) => {
        contentMap[h.role] = h.content;
      });
      setHelpContent(contentMap);

      // Ensure layout configuration has secure defaults
      if (!saasData.layout) {
        saasData.layout = {
          primaryColor: '#059669',
          borderRadius: 'xl',
          fontFamily: 'sans',
          navbarStyle: 'dark',
          logoText: 'ELO LOG',
          systemBackground: 'minimal',
          homeBadgeText: 'Solução Completa Multi-Tenant de Carga',
          homeTitle: 'Gestão e Publicação de Fretes em',
          homeTitleAccent: 'Tempo Real',
          homeSubtitle: 'O Elo Log conecta transportadoras e motoristas com total isolamento e segurança. Publique fretes, controle frotas, execute checklists eletrônicos e audite sua operação logística em uma plataforma ágil e offline-ready.'
        };
      } else {
        if (!saasData.layout.homeBadgeText) saasData.layout.homeBadgeText = 'Solução Completa Multi-Tenant de Carga';
        if (!saasData.layout.homeTitle) saasData.layout.homeTitle = 'Gestão e Publicação de Fretes em';
        if (!saasData.layout.homeTitleAccent) saasData.layout.homeTitleAccent = 'Tempo Real';
        if (!saasData.layout.homeSubtitle) saasData.layout.homeSubtitle = 'O Elo Log conecta transportadoras e motoristas com total isolamento e segurança. Publique fretes, controle frotas, execute checklists eletrônicos e audite sua operação logística em uma plataforma ágil e offline-ready.';
      }

      // Ensure form field settings are present and initialized
      if (!saasData.formFields) {
        saasData.formFields = {
          userForm: [
            { id: 'name', originalLabel: 'Nome Completo', label: 'Nome Completo', placeholder: 'Ex: Carlos Oliveira', enabled: true, required: true },
            { id: 'email', originalLabel: 'E-mail Corporativo', label: 'E-mail Corporativo', placeholder: 'carlos@translog.com.br', enabled: true, required: true },
            { id: 'phone', originalLabel: 'Telefone / WhatsApp', label: 'Telefone / WhatsApp', placeholder: '(11) 98765-4321', enabled: true, required: true },
            { id: 'role', originalLabel: 'Nível de Permissão (Role)', label: 'Nível de Permissão (Role)', placeholder: '', enabled: true, required: true }
          ],
          freightForm: [
            { id: 'cargoDescription', originalLabel: 'Descrição da Carga', label: 'Descrição da Carga', placeholder: 'Ex: Carga geral paletizada - Peças industriais', enabled: true, required: true },
            { id: 'cargoType', originalLabel: 'Tipo de Carga', label: 'Tipo de Carga', placeholder: '', enabled: true, required: true },
            { id: 'weight', originalLabel: 'Peso Total (Kg)', label: 'Peso Total (Kg)', placeholder: 'Ex: 8500', enabled: true, required: true },
            { id: 'volumes', originalLabel: 'Volumes', label: 'Volumes', placeholder: 'Ex: 16', enabled: true, required: true },
            { id: 'vehicleType', originalLabel: 'Tipo de Veículo', label: 'Tipo de Veículo', placeholder: '', enabled: true, required: true },
            { id: 'bodyType', originalLabel: 'Carroceria', label: 'Carroceria', placeholder: '', enabled: true, required: true },
            { id: 'brand', originalLabel: 'Montadora / Marca do Veículo', label: 'Montadora / Marca do Veículo', placeholder: '', enabled: true, required: true },
            { id: 'value', originalLabel: 'Valor do Frete (R$)', label: 'Valor do Frete (R$)', placeholder: 'Ex: 1850.00', enabled: true, required: true },
            { id: 'paymentMethod', originalLabel: 'Forma de Pagamento', label: 'Forma de Pagamento', placeholder: '', enabled: true, required: true },
            { id: 'originCity', originalLabel: 'Cidade Origem', label: 'Cidade Origem', placeholder: 'Ex: São José do Rio Preto', enabled: true, required: true },
            { id: 'originState', originalLabel: 'UF Origem', label: 'UF Origem', placeholder: 'SP', enabled: true, required: true },
            { id: 'originAddress', originalLabel: 'Endereço Origem', label: 'Endereço Origem', placeholder: 'Av. Alberto Andaló', enabled: true, required: true },
            { id: 'originNumber', originalLabel: 'Número Origem', label: 'Número Origem', placeholder: 'Ex: 3100', enabled: true, required: true },
            { id: 'destCity', originalLabel: 'Cidade Destino', label: 'Cidade Destino', placeholder: 'Ex: São Paulo', enabled: true, required: true },
            { id: 'destState', originalLabel: 'UF Destino', label: 'UF Destino', placeholder: 'SP', enabled: true, required: true },
            { id: 'destAddress', originalLabel: 'Endereço Destino', label: 'Endereço Destino', placeholder: 'Av. Paulista', enabled: true, required: true },
            { id: 'destNumber', originalLabel: 'Número Destino', label: 'Número Destino', placeholder: 'Ex: 1000', enabled: true, required: true }
          ],
          driverForm: [
            { id: 'name', originalLabel: 'Nome Completo', label: 'Nome Completo', placeholder: 'Ex: João da Silva', enabled: true, required: true },
            { id: 'email', originalLabel: 'E-mail', label: 'E-mail', placeholder: 'joao@translog.com', enabled: true, required: true },
            { id: 'phone', originalLabel: 'Telefone / WhatsApp', label: 'Telefone / WhatsApp', placeholder: '(11) 98888-7777', enabled: true, required: true },
            { id: 'cpf', originalLabel: 'CPF', label: 'CPF', placeholder: '123.456.789-00', enabled: true, required: true },
            { id: 'rg', originalLabel: 'RG', label: 'RG', placeholder: '12.345.678-9', enabled: true, required: false },
            { id: 'city', originalLabel: 'Cidade', label: 'Cidade', placeholder: 'São Paulo', enabled: true, required: true },
            { id: 'state', originalLabel: 'Estado (UF)', label: 'Estado (UF)', placeholder: 'SP', enabled: true, required: true },
            { id: 'cnh', originalLabel: 'CNH', label: 'CNH', placeholder: 'Nº CNH', enabled: true, required: true },
            { id: 'cnhCategory', originalLabel: 'Categoria', label: 'Categoria', placeholder: '', enabled: true, required: true }
          ],
          expenseForm: [
            { id: 'driverName', originalLabel: 'Nome do Motorista', label: 'Nome do Motorista', placeholder: 'Nome...', enabled: true, required: true },
            { id: 'clientName', originalLabel: 'Cliente', label: 'Cliente', placeholder: 'Nome do Cliente...', enabled: true, required: true },
            { id: 'vehicleModel', originalLabel: 'Modelo do Veículo', label: 'Modelo do Veículo', placeholder: 'Ex: FH 540', enabled: true, required: true },
            { id: 'vehiclePlate', originalLabel: 'Placa do Caminhão / Veículo', label: 'Placa do Caminhão / Veículo', placeholder: 'ABC-1234', enabled: true, required: true },
            { id: 'chassis', originalLabel: 'Placa / Chassis', label: 'Placa / Chassis', placeholder: 'Nº Chassis', enabled: true, required: true },
            { id: 'startDate', originalLabel: 'Data de Início da Viagem', label: 'Data de Início da Viagem', placeholder: '', enabled: true, required: true },
            { id: 'endDate', originalLabel: 'Data de Término da Viagem', label: 'Data de Término da Viagem', placeholder: '', enabled: true, required: true },
            { id: 'initialKm', originalLabel: 'Km Inicial', label: 'Km Inicial', placeholder: '0', enabled: true, required: true },
            { id: 'finalKm', originalLabel: 'Km Final', label: 'Km Final', placeholder: '0', enabled: true, required: true }
          ]
        };
      }

      setConfig(saasData);
      setWaConfig(waData);
    } catch (err: any) {
      setMessage({ text: err.message || 'Erro ao carregar configurações.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSaaSConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;

    setSaving(true);
    setMessage(null);
    try {
      const res = await api.updateSaaSGlobalConfig(config);
      if (res.success) {
        setConfig(res.config);
        setMessage({ text: 'Configurações do SaaS salvas e aplicadas globalmente com sucesso!', type: 'success' });
        setTimeout(() => setMessage(null), 5000);
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Erro ao salvar configurações do SaaS.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveWhatsAppConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waConfig) return;

    setSaving(true);
    setMessage(null);
    try {
      const res = await api.updateWhatsAppConfig(waConfig);
      if (res.success) {
        setWaConfig(res.config);
        setMessage({ text: 'Configurações de integração com WhatsApp salvas com sucesso!', type: 'success' });
        setTimeout(() => setMessage(null), 5000);
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Erro ao salvar configurações do WhatsApp.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestWhatsApp = async () => {
    if (!testPhone) {
      alert('Informe um celular válido para teste (formato: DDI + DDD + Número).');
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.testWhatsAppConnection({
        phone: testPhone,
        message: testMessage,
        baseUrl: waConfig?.baseUrl,
        token: waConfig?.token
      });
      setTestResult({
        success: res.success,
        message: res.message || 'Conexão testada com sucesso!'
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Erro de comunicação com o Gateway.'
      });
    } finally {
      setTesting(false);
    }
  };

  const updatePlanField = (index: number, field: string, value: any) => {
    if (!config) return;
    const updatedPlans = [...config.plans];
    updatedPlans[index] = {
      ...updatedPlans[index],
      [field]: value
    };
    setConfig({
      ...config,
      plans: updatedPlans
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Carregando painel de parametrização SaaS...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 space-y-6">
      
      {/* Header Banner */}
      <div className="p-6 bg-slate-900 text-white rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md border border-slate-800">
        <div className="space-y-1.5">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
            Painel do Proprietário
          </span>
          <h1 className="text-xl md:text-2xl font-black flex items-center gap-2">
            <Settings className="w-6 h-6 text-emerald-400 animate-pulse" /> Parametrização & Configurações SaaS
          </h1>
          <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
            Ambiente de alta segurança para gerenciamento de branding, limitação e preços dos planos corporativos, regras operacionais e integração com os canais de envio de códigos em tempo real.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={loadAllConfigs}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Recarregar Configurações"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-start gap-3 border ${
          message.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="text-xs font-semibold">{message.text}</div>
        </div>
      )}

      {/* Grid Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Navigation Sub-Menu */}
        <div className="space-y-2 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 h-fit shadow-xs">
          <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 mb-3 px-3">Ambientes de Ajuste</p>
          <button
            onClick={() => setActiveSubTab('branding')}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
              activeSubTab === 'branding'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Globe className="w-4 h-4 shrink-0" /> Branding & Apresentação
          </button>
          
          <button
            onClick={() => setActiveSubTab('plans')}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
              activeSubTab === 'plans'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Sliders className="w-4 h-4 shrink-0" /> Planos & Limites Corporativos
          </button>

          <button
            onClick={() => setActiveSubTab('rules')}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
              activeSubTab === 'rules'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <ShieldAlert className="w-4 h-4 shrink-0" /> Regras de Operação & Segurança
          </button>

          <button
            onClick={() => setActiveSubTab('gateway')}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
              activeSubTab === 'gateway'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <MessageSquare className="w-4 h-4 shrink-0" /> Integração Gateway WhatsApp
          </button>

          <button
            onClick={() => setActiveSubTab('layout')}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
              activeSubTab === 'layout'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Palette className="w-4 h-4 shrink-0" /> Layout & Design do Frontend
          </button>

          <button
            onClick={() => setActiveSubTab('fields')}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
              activeSubTab === 'fields'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <FileText className="w-4 h-4 shrink-0" /> Campos dos Formulários
          </button>
          
          <button
            onClick={() => setActiveSubTab('email')}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
              activeSubTab === 'email'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Send className="w-4 h-4 shrink-0" /> Configurações de E-mail
          </button>

          <button
            onClick={() => setActiveSubTab('sql-installation')}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
              activeSubTab === 'sql-installation'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Database className="w-4 h-4 shrink-0" /> SQL & Instalação VPS
          </button>

          <button
            onClick={() => setActiveSubTab('mapbox')}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
              activeSubTab === 'mapbox'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Compass className="w-4 h-4 shrink-0" /> Mapbox API & Rastreio
          </button>

          <button
            onClick={() => setActiveSubTab('help')}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
              activeSubTab === 'help'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <BookOpen className="w-4 h-4 shrink-0" /> Editor de Ajuda
          </button>
        </div>

        {/* Content Container */}
        <div className="md:col-span-3 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
          
          {/* TAB 1: BRANDING */}
          {activeSubTab === 'branding' && config && (
            <form onSubmit={handleSaveSaaSConfig} className="space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Visual & Contato de Suporte</h3>
                <p className="text-[11px] text-slate-400 mt-1">Configure o nome fantasia do sistema e os dados de atendimento exibidos publicamente para visitantes e clientes.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Nome Oficial da Plataforma</label>
                  <input
                    type="text"
                    required
                    value={config.systemName}
                    onChange={e => setConfig({ ...config, systemName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium focus:outline-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">E-mail de Contato Corporativo</label>
                  <input
                    type="email"
                    required
                    value={config.supportEmail}
                    onChange={e => setConfig({ ...config, supportEmail: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium focus:outline-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Celular/WhatsApp de Atendimento</label>
                  <input
                    type="text"
                    required
                    value={config.supportPhone}
                    onChange={e => setConfig({ ...config, supportPhone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium focus:outline-emerald-500"
                  />
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl flex items-start gap-2.5 text-[11px] text-slate-500 leading-relaxed">
                  <Globe className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Estes valores são refletidos dinamicamente no cabeçalho, rodapé de páginas e nos e-mails de notificação automática emitidos pelo sistema.</span>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Gravando...' : 'Salvar Alterações de Branding'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: PLANS & LIMITS */}
          {activeSubTab === 'plans' && config && (
            <form onSubmit={handleSaveSaaSConfig} className="space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Planos & Barreiras Limitadoras</h3>
                <p className="text-[11px] text-slate-400 mt-1">Defina preços mensais e cotas rígidas para evitar sobrecarga ou incentivar upgrades.</p>
              </div>

              <div className="space-y-5">
                {config.plans.map((p, idx) => (
                  <div key={p.id} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/50 dark:border-slate-800/50 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                        {p.id}
                      </span>
                      <label className="inline-flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={p.isActive}
                          onChange={e => updatePlanField(idx, 'isActive', e.target.checked)}
                          className="rounded text-emerald-600"
                        />
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Ativar Comercialização</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                      <div className="sm:col-span-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Nome Comercial</label>
                        <input
                          type="text"
                          required
                          value={p.name}
                          onChange={e => updatePlanField(idx, 'name', e.target.value)}
                          className="w-full px-2.5 py-1.5 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md font-semibold"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Mensalidade (R$)</label>
                        <div className="relative mt-1">
                          <input
                            type="number"
                            required
                            value={p.price}
                            onChange={e => updatePlanField(idx, 'price', parseFloat(e.target.value) || 0)}
                            className="w-full pl-6 pr-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md font-bold text-slate-800 dark:text-white"
                          />
                          <span className="absolute left-2.5 top-2 text-[10px] text-slate-400 font-bold">R$</span>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Fretes / Mês</label>
                        <input
                          type="number"
                          required
                          value={p.maxFreightsPerMonth}
                          onChange={e => updatePlanField(idx, 'maxFreightsPerMonth', parseInt(e.target.value) || 0)}
                          className="w-full px-2.5 py-1.5 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md font-semibold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="p-2.5 bg-white dark:bg-slate-800 rounded-lg flex items-center gap-2">
                        <Users className="w-4 h-4 text-indigo-500 shrink-0" />
                        <div className="flex-1">
                          <label className="text-[9px] font-bold text-slate-400 block uppercase">Limite de Usuários</label>
                          <input
                            type="number"
                            required
                            value={p.maxUsers}
                            onChange={e => updatePlanField(idx, 'maxUsers', parseInt(e.target.value) || 0)}
                            className="w-full bg-transparent border-b border-transparent focus:border-slate-300 outline-hidden font-bold py-0.5 text-slate-800 dark:text-white"
                          />
                        </div>
                      </div>

                      <div className="p-2.5 bg-white dark:bg-slate-800 rounded-lg flex items-center gap-2">
                        <Truck className="w-4 h-4 text-sky-500 shrink-0" />
                        <div className="flex-1">
                          <label className="text-[9px] font-bold text-slate-400 block uppercase">Limite de Motoristas</label>
                          <input
                            type="number"
                            required
                            value={p.maxDrivers}
                            onChange={e => updatePlanField(idx, 'maxDrivers', parseInt(e.target.value) || 0)}
                            className="w-full bg-transparent border-b border-transparent focus:border-slate-300 outline-hidden font-bold py-0.5 text-slate-800 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Gravando...' : 'Salvar Alterações nos Planos'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: OPERATING RULES */}
          {activeSubTab === 'rules' && config && (
            <form onSubmit={handleSaveSaaSConfig} className="space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Configurações de Regra de Negócio</h3>
                <p className="text-[11px] text-slate-400 mt-1">Ajuste regras operacionais, percentuais de lucro padrão e parâmetros de autenticação OTP.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Percentual Padrão de Intermediação (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={0}
                      max={100}
                      value={config.defaultCommissionPercent}
                      onChange={e => setConfig({ ...config, defaultCommissionPercent: parseFloat(e.target.value) || 0 })}
                      className="w-full pr-8 pl-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold focus:outline-emerald-500"
                    />
                    <span className="absolute right-3 top-2.5 text-slate-400 font-bold">%</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Percentual descontado de cada frete intermediado por padrão na criação.</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Idade Mínima para Cadastro de Motoristas</label>
                  <input
                    type="number"
                    required
                    min={18}
                    value={config.minDriverAge}
                    onChange={e => setConfig({ ...config, minDriverAge: parseInt(e.target.value) || 18 })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold focus:outline-emerald-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Idade civil legal para permitir o registro de motoristas de carga.</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Tempo de Validade do Código OTP (Minutos)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={config.otpExpirationMinutes}
                    onChange={e => setConfig({ ...config, otpExpirationMinutes: parseInt(e.target.value) || 5 })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold focus:outline-emerald-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Tempo em minutos até que os códigos OTP enviados expirem.</p>
                </div>

                <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Políticas Estritas</span>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.requireChecklistPhotos}
                      onChange={e => setConfig({ ...config, requireChecklistPhotos: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Exigir fotos no checklist de trânsito</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.allowSelfRegistration}
                      onChange={e => setConfig({ ...config, allowSelfRegistration: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Permitir auto-cadastro de empresas</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Gravando...' : 'Salvar Regras Operacionais'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 7: EMAIL CONFIG */}
          {activeSubTab === 'email' && config && (
            <form onSubmit={handleSaveSaaSConfig} className="space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Configurações de Servidor SMTP (E-mail)</h3>
                <p className="text-[11px] text-slate-400 mt-1">Configure os dados do servidor SMTP para envio de notificações e alertas do sistema.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Host SMTP</label>
                  <input
                    type="text"
                    required
                    value={config.emailConfig?.host || ''}
                    onChange={e => setConfig({ ...config, emailConfig: { ...config.emailConfig, host: e.target.value, port: config.emailConfig?.port || 587, user: config.emailConfig?.user || '', senderEmail: config.emailConfig?.senderEmail || '', isActive: config.emailConfig?.isActive || false } })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium focus:outline-emerald-500"
                    placeholder="smtp.exemplo.com"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Porta</label>
                  <input
                    type="number"
                    value={config.emailConfig?.port ?? ''}
                    onChange={e => {
                        const val = e.target.value === '' ? undefined : parseInt(e.target.value);
                        setConfig({
                            ...config,
                            emailConfig: {
                                ...(config.emailConfig || {} as EmailConfig),
                                port: val
                            }
                        });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium focus:outline-emerald-500"
                    placeholder="587"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Usuário</label>
                  <input
                    type="text"
                    required
                    value={config.emailConfig?.user || ''}
                    onChange={e => setConfig({ ...config, emailConfig: { ...config.emailConfig, host: config.emailConfig?.host || '', port: config.emailConfig?.port || 587, user: e.target.value, senderEmail: config.emailConfig?.senderEmail || '', isActive: config.emailConfig?.isActive || false } })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium focus:outline-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Senha</label>
                  <input
                    type="password"
                    value={config.emailConfig?.password || ''}
                    onChange={e => setConfig({ ...config, emailConfig: { ...config.emailConfig, host: config.emailConfig?.host || '', port: config.emailConfig?.port || 587, user: config.emailConfig?.user || '', password: e.target.value, senderEmail: config.emailConfig?.senderEmail || '', isActive: config.emailConfig?.isActive || false } })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium focus:outline-emerald-500"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">E-mail Remetente</label>
                  <input
                    type="email"
                    required
                    value={config.emailConfig?.senderEmail || ''}
                    onChange={e => setConfig({ ...config, emailConfig: { ...config.emailConfig, host: config.emailConfig?.host || '', port: config.emailConfig?.port || 587, user: config.emailConfig?.user || '', senderEmail: e.target.value, testEmail: config.emailConfig?.testEmail, isActive: config.emailConfig?.isActive || false } })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium focus:outline-emerald-500"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">E-mail para Teste</label>
                  <input
                    type="email"
                    value={config.emailConfig?.testEmail || ''}
                    onChange={e => setConfig({ ...config, emailConfig: { ...config.emailConfig, host: config.emailConfig?.host || '', port: config.emailConfig?.port || 587, user: config.emailConfig?.user || '', senderEmail: config.emailConfig?.senderEmail || '', testEmail: e.target.value, isActive: config.emailConfig?.isActive || false } })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium focus:outline-emerald-500"
                    placeholder="teste@dominio.com"
                  />
                </div>
                <div className="flex items-center pt-5 gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.emailConfig?.isActive || false}
                        onChange={e => setConfig({ ...config, emailConfig: { ...config.emailConfig, host: config.emailConfig?.host || '', port: config.emailConfig?.port || 587, user: config.emailConfig?.user || '', senderEmail: config.emailConfig?.senderEmail || '', isActive: e.target.checked } })}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Ativar</span>
                    </label>
                    <button
                        type="button"
                        onClick={async () => {
                            if (!config.emailConfig?.host || !config.emailConfig?.port || !config.emailConfig?.user || !config.emailConfig?.senderEmail) {
                                setMessage({ text: 'Preencha Host, Porta, Usuário e E-mail Remetente para testar.', type: 'error' });
                                return;
                            }
                            if (!config.emailConfig?.testEmail) {
                                setMessage({ text: 'Informe um e-mail para teste.', type: 'error' });
                                return;
                            }
                            setTesting(true);
                            try {
                                // Simulate API call to check SMTP
                                const res = await api.testEmailConnection(config.emailConfig);
                                if (res.success) {
                                    setMessage({ text: `E-mail de teste enviado para ${config.emailConfig.testEmail} com sucesso!`, type: 'success' });
                                } else {
                                    throw new Error(res.message || 'Erro desconhecido ao enviar e-mail.');
                                }
                            } catch (e: any) {
                                setMessage({ text: e.message || 'Erro ao conectar ao servidor SMTP ou enviar e-mail.', type: 'error' });
                            } finally {
                                setTesting(false);
                                setTimeout(() => setMessage(null), 10000); // Increased duration for readability
                            }
                        }}
                        disabled={testing}
                        className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50"
                    >
                        {testing ? 'Testando...' : 'Testar Conexão'}
                    </button>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                {message && message.type === 'success' && (
                  <div className="flex-1 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg p-2 mr-3 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" /> {message.text}
                  </div>
                )}
                {message && message.type === 'error' && (
                  <div className="flex-1 text-xs font-semibold text-rose-800 bg-rose-50 border border-rose-200 rounded-lg p-2 mr-3 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-2" /> {message.text}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50"
                  onClick={() => {
                      // Triggering form submission manually if needed, or relying on onSubmit
                      // The current form onSubmit is already handling it
                  }}
                >
                  {saving ? 'Gravando...' : 'Salvar Configurações de E-mail'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: WHATSAPP GATEWAY */}
          {activeSubTab === 'gateway' && waConfig && (
            <div className="space-y-6">
              <form onSubmit={handleSaveWhatsAppConfig} className="space-y-6">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Configuração de Disparos em Tempo Real</h3>
                  <p className="text-[11px] text-slate-400 mt-1">Conecte o sistema a um gateway de envios (ex: Twilio, Z-API, Evolution, API-Brasil) para disparar códigos OTP corporativos e alertas.</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-xl">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Habilitar Gateway de Produção</p>
                      <p className="text-[10px] text-slate-400">Ativa o envio real de mensagens de texto via rede de telefonia/WhatsApp.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={waConfig.isActive}
                        onChange={e => setWaConfig({ ...waConfig, isActive: e.target.checked })}
                      />
                      <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Base URL do Gateway</label>
                      <input
                        type="url"
                        placeholder="Ex: https://api.z-api.io/v1/instances/SUA_INSTANCIA"
                        value={waConfig.baseUrl}
                        onChange={e => setWaConfig({ ...waConfig, baseUrl: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono focus:outline-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Número do Canal Transmissor</label>
                      <input
                        type="text"
                        placeholder="Ex: 5517997451176"
                        value={waConfig.defaultChannelNumber || ''}
                        onChange={e => setWaConfig({ ...waConfig, defaultChannelNumber: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono focus:outline-emerald-500"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Token de Autorização / Client Secret</label>
                      <div className="relative">
                        <input
                          type={showToken ? 'text' : 'password'}
                          placeholder="Digite ou cole o Token de autenticação da sua instância API"
                          value={waConfig.token}
                          onChange={e => setWaConfig({ ...waConfig, token: e.target.value })}
                          className="w-full pl-3 pr-10 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono focus:outline-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowToken(!showToken)}
                          className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 focus:outline-hidden"
                        >
                          {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-2 text-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block tracking-wider">Políticas de Alerta e Notificação</span>
                    
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={waConfig.autoNotifyChecklist}
                        onChange={e => setWaConfig({ ...waConfig, autoNotifyChecklist: e.target.checked })}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">Notificar o motorista automaticamente ao aprovar/reprovar um checklist</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={waConfig.autoNotifyFreightStatus}
                        onChange={e => setWaConfig({ ...waConfig, autoNotifyFreightStatus: e.target.checked })}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">Notificar alterações de status de fretes aceitos no celular do motorista</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50"
                  >
                    {saving ? 'Gravando...' : 'Salvar Parâmetros do Gateway'}
                  </button>
                </div>
              </form>

              {/* Live Testing Box */}
              <div className="p-5 bg-slate-50 dark:bg-slate-800/20 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase">Disparar Envio de Teste</h4>
                  <p className="text-[10px] text-slate-400">Verifique a comunicação real com a API disparando um código de teste de segurança.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="sm:col-span-1">
                    <label className="text-[10px] font-bold text-slate-500">Destinatário (WhatsApp)</label>
                    <input
                      type="text"
                      placeholder="Ex: 5517997451176"
                      value={testPhone}
                      onChange={e => setTestPhone(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-2.5 py-1.5 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-500">Corpo do Conteúdo</label>
                    <input
                      type="text"
                      value={testMessage}
                      onChange={e => setTestMessage(e.target.value)}
                      className="w-full px-2.5 py-1.5 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md font-medium"
                    />
                  </div>
                </div>

                {testResult && (
                  <div className={`p-3 rounded-lg border text-xs font-semibold ${
                    testResult.success 
                      ? 'bg-green-50 border-green-200 text-green-800' 
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}>
                    <p className="font-bold flex items-center gap-1">
                      {testResult.success ? '✅ Envio Concluído!' : '❌ Erro de Transmissão'}
                    </p>
                    <p className="text-[11px] font-medium mt-0.5">{testResult.message}</p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleTestWhatsApp}
                  disabled={testing}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {testing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Conectando API...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" /> Disparar Mensagem de Teste Real
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: LAYOUT & DESIGN */}
          {activeSubTab === 'layout' && config && config.layout && (
            <form onSubmit={handleSaveSaaSConfig} className="space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Aparência & Identidade do Frontend</h3>
                <p className="text-[11px] text-slate-400 mt-1">Personalize toda a interface visual dos seus clientes. Cores, arredondamento de bordas, fontes e navegação são aplicados instantaneamente em tempo real sem precisar de recarregamento.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                {/* Cor Principal */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Cor Principal do Sistema (Primary)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={config.layout.primaryColor}
                      onChange={e => setConfig({
                        ...config,
                        layout: { ...config.layout!, primaryColor: e.target.value }
                      })}
                      className="w-10 h-10 p-1 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      maxLength={7}
                      value={config.layout.primaryColor}
                      onChange={e => setConfig({
                        ...config,
                        layout: { ...config.layout!, primaryColor: e.target.value }
                      })}
                      className="w-28 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold text-center text-slate-700 dark:text-slate-300"
                    />
                  </div>
                  
                  {/* Presets de Cor */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Presets de Marca Sugeridos</span>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {[
                        { name: 'Elo Log Green', value: '#059669' },
                        { name: 'Safira Blue', value: '#2563eb' },
                        { name: 'Esmeralda', value: '#10b981' },
                        { name: 'Obsidiana', value: '#334155' },
                        { name: 'Ruby', value: '#dc2626' },
                        { name: 'Solar Amber', value: '#d97706' },
                        { name: 'Ametista', value: '#7c3aed' }
                      ].map(preset => (
                        <button
                          key={preset.value}
                          type="button"
                          onClick={() => setConfig({
                            ...config,
                            layout: { ...config.layout!, primaryColor: preset.value }
                          })}
                          className={`px-2 py-1 rounded-md border text-[10px] font-bold transition-all ${
                            config.layout!.primaryColor === preset.value
                              ? 'border-slate-800 dark:border-white bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                              : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
                          }`}
                        >
                          <span className="inline-block w-2.5 h-2.5 rounded-full mr-1.5 align-middle" style={{ backgroundColor: preset.value }} />
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Texto do Logo */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Título/Marca do Topo da Página (Logo)</label>
                  <input
                    type="text"
                    required
                    value={config.layout.logoText || ''}
                    onChange={e => setConfig({
                      ...config,
                      layout: { ...config.layout!, logoText: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold focus:outline-emerald-500"
                    placeholder="Ex: ELO LOG"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Nome de exibição em destaque no cabeçalho e na tela de login.</p>
                </div>

                {/* Arredondamento de Cantos */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Borda & Arredondamento das Caixas (Border Radius)</label>
                  <select
                    value={config.layout.borderRadius}
                    onChange={e => setConfig({
                      ...config,
                      layout: { ...config.layout!, borderRadius: e.target.value as any }
                    })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold"
                  >
                    <option value="none">Reto / Sem Arredondamento (Estilo Clássico)</option>
                    <option value="sm">Mínimo / Suave (4px)</option>
                    <option value="md">Médio (8px)</option>
                    <option value="lg">Arredondado Elegante (12px)</option>
                    <option value="xl">Bordas Largas (16px - Padrão)</option>
                    <option value="2xl">Super Arredondado / Bold (24px)</option>
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">Define as curvas de botões, modais, cartões e campos de entrada.</p>
                </div>

                {/* Tipografia */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Família Tipográfica (Fonte Principal)</label>
                  <select
                    value={config.layout.fontFamily}
                    onChange={e => setConfig({
                      ...config,
                      layout: { ...config.layout!, fontFamily: e.target.value as any }
                    })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold"
                  >
                    <option value="sans">Plus Jakarta Sans / Sans-Serif (Moderna & Legível)</option>
                    <option value="display">Montserrat / Display (Robusta & Tecnológica)</option>
                    <option value="serif">Playfair Display / Serif (Clássica & Sofisticada)</option>
                    <option value="mono">Fira Code / Monospace (Técnica & Industrial)</option>
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">A fonte padrão utilizada nos menus, títulos e conteúdos.</p>
                </div>

                {/* Estilo do Navbar */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Estilo do Cabeçalho (Navbar Style)</label>
                  <select
                    value={config.layout.navbarStyle}
                    onChange={e => setConfig({
                      ...config,
                      layout: { ...config.layout!, navbarStyle: e.target.value as any }
                    })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold"
                  >
                    <option value="dark">Escuro de Alto Contraste (Fundo Escuro, Letras Claras)</option>
                    <option value="light">Claro Minimalista (Fundo Branco, Letras Escuras)</option>
                    <option value="colored">Injetar Cor Principal (Usa a cor de marca definida ao lado)</option>
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">Define o comportamento visual da barra superior do sistema.</p>
                </div>

                {/* Tom de Fundo do Sistema */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Fundo Base da Aplicação (System Background)</label>
                  <select
                    value={config.layout.systemBackground}
                    onChange={e => setConfig({
                      ...config,
                      layout: { ...config.layout!, systemBackground: e.target.value as any }
                    })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold"
                  >
                    <option value="minimal">Modo Neutro (Off-White Claro / Preto puro no Escuro)</option>
                    <option value="warm">Modo Acolhedor (Creme Quente / Fundo sépia escuro)</option>
                    <option value="slate">Modo Corporativo (Slate Azulado / Slate Escuro de alta legibilidade)</option>
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">Ajusta o tom de preenchimento das páginas de fundo do dashboard.</p>
                </div>
              </div>

              {/* Seção Nova: Conteúdo do Site Institucional */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-5 mt-6 space-y-4">
                <div className="pb-2">
                  <h4 className="text-xs font-extrabold text-slate-800 dark:text-white uppercase tracking-wider">Conteúdo da Página Inicial (Site Institucional / Home)</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Customize os slogans e informações de captação de clientes na tela de entrada do sistema.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Badge de destaque */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Texto do Distintivo (Badge Superior)</label>
                    <input
                      type="text"
                      required
                      value={config.layout.homeBadgeText || ''}
                      onChange={e => setConfig({
                        ...config,
                        layout: { ...config.layout!, homeBadgeText: e.target.value }
                      })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold focus:outline-emerald-500"
                      placeholder="Ex: Solução de Carga Inteligente"
                    />
                  </div>

                  {/* Título Principal */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Título de Introdução (Parte 1)</label>
                    <input
                      type="text"
                      required
                      value={config.layout.homeTitle || ''}
                      onChange={e => setConfig({
                        ...config,
                        layout: { ...config.layout!, homeTitle: e.target.value }
                      })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold focus:outline-emerald-500"
                      placeholder="Ex: Gestão e Publicação de Fretes em"
                    />
                  </div>

                  {/* Título Principal (Destacado em Verde) */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Título Destacado (Parte 2 - Cor Primária)</label>
                    <input
                      type="text"
                      required
                      value={config.layout.homeTitleAccent || ''}
                      onChange={e => setConfig({
                        ...config,
                        layout: { ...config.layout!, homeTitleAccent: e.target.value }
                      })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold focus:outline-emerald-500"
                      placeholder="Ex: Tempo Real"
                    />
                  </div>

                  {/* Subtítulo ou Parágrafo explicativo */}
                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Texto de Apresentação (Subtítulo da Landing Page)</label>
                    <textarea
                      required
                      rows={3}
                      value={config.layout.homeSubtitle || ''}
                      onChange={e => setConfig({
                        ...config,
                        layout: { ...config.layout!, homeSubtitle: e.target.value }
                      })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium focus:outline-emerald-500"
                      placeholder="Descreva o propósito da sua plataforma de fretes e as vantagens competitivas da sua marca..."
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Gravando...' : 'Salvar Alterações de Layout'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 6: FORM FIELDS CUSTOMIZATION */}
          {activeSubTab === 'fields' && config && config.formFields && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Customização de Campos de Formulários</h3>
                <p className="text-[11px] text-slate-400 mt-1">Selecione e edite os formulários em uso no sistema. Mude rótulos, adicione placeholders, ative ou desative campos e controle a obrigatoriedade de preenchimento.</p>
              </div>

              {/* Form Selector Header */}
              <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/60 rounded-xl w-fit">
                {[
                  { id: 'freightForm', name: 'Cadastro de Frete' },
                  { id: 'driverForm', name: 'Cadastro de Motorista' },
                  { id: 'userForm', name: 'Cadastro de Usuário' },
                  { id: 'expenseForm', name: 'Prestação de Contas (Despesas)' }
                ].map(formOpt => (
                  <button
                    key={formOpt.id}
                    type="button"
                    onClick={() => setSelectedForm(formOpt.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedForm === formOpt.id
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {formOpt.name}
                  </button>
                ))}
              </div>

              {/* Add New Field */}
              <button
                type="button"
                onClick={() => {
                  const id = prompt('Digite o ID interno do novo campo (ex: obs1):');
                  const label = prompt('Digite o nome exibido do campo:');
                  if (id && label) {
                    const updated = { ...config };
                    updated.formFields![selectedForm].push({
                      id,
                      originalLabel: label,
                      label,
                      placeholder: '',
                      enabled: true,
                      required: false
                    });
                    setConfig(updated);
                  }
                }}
                className="mb-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer"
              >
                + Adicionar Novo Campo
              </button>

              {/* Fields List */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto shadow-xs">
                <table className="w-full text-left text-xs min-w-[600px]">
                  <thead className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-black tracking-wider text-slate-500">
                    <tr>
                      <th className="py-3 px-4">Campo Original (Interno)</th>
                      <th className="py-3 px-4">Rótulo Personalizado (Label)</th>
                      <th className="py-3 px-4">Placeholder (Texto de Ajuda)</th>
                      <th className="py-3 px-4 text-center">Ativo</th>
                      <th className="py-3 px-4 text-center">Obrigatório</th>
                      <th className="py-3 px-4 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {config.formFields[selectedForm].map((field, idx) => (
                      <tr key={field.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                        {/* ID & Original Label */}
                        <td className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">
                          <div>{field.originalLabel}</div>
                          <span className="text-[10px] text-slate-400 font-mono font-medium">{field.id}</span>
                        </td>
                        
                        {/* Custom Label */}
                        <td className="py-2 px-4">
                          <input
                            type="text"
                            required
                            value={field.label}
                            onChange={e => {
                              const updated = { ...config };
                              updated.formFields![selectedForm][idx].label = e.target.value;
                              setConfig(updated);
                            }}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md font-semibold focus:outline-emerald-500"
                          />
                        </td>

                        {/* Custom Placeholder */}
                        <td className="py-2 px-4">
                          <input
                            type="text"
                            value={field.placeholder || ''}
                            onChange={e => {
                              const updated = { ...config };
                              updated.formFields![selectedForm][idx].placeholder = e.target.value;
                              setConfig(updated);
                            }}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md font-medium focus:outline-emerald-500"
                            placeholder="Digite um texto de instrução..."
                          />
                        </td>

                        {/* Enabled Switch */}
                        <td className="py-2 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={field.enabled}
                            onChange={e => {
                              const updated = { ...config };
                              updated.formFields![selectedForm][idx].enabled = e.target.checked;
                              setConfig(updated);
                            }}
                            className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                        </td>

                        {/* Required Switch */}
                        <td className="py-2 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={e => {
                              const updated = { ...config };
                              updated.formFields![selectedForm][idx].required = e.target.checked;
                              setConfig(updated);
                            }}
                            className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                        </td>

                        {/* Actions */}
                        <td className="py-2 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm('Deseja realmente excluir este campo?')) {
                                const updated = { ...config };
                                updated.formFields![selectedForm].splice(idx, 1);
                                setConfig(updated);
                              }
                            }}
                            className="text-rose-600 hover:text-rose-800 font-bold"
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleSaveSaaSConfig}
                  disabled={saving}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Gravando...' : 'Salvar Mapeamento de Campos'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 8: SQL & INSTALAÇÃO VPS */}
          {activeSubTab === 'sql-installation' && config && (
            <SqlAndInstallationConfig
              config={config}
              onUpdateConfig={async (updated) => {
                const newConfig = { ...config, ...updated };
                setConfig(newConfig);
                await api.updateSaaSGlobalConfig(newConfig);
                setMessage({ text: 'Configurações de SQL e Instalação salvas com sucesso!', type: 'success' });
                setTimeout(() => setMessage(null), 4000);
              }}
              saving={saving}
            />
          )}

          {/* TAB 9: MAPBOX API & RASTREIO */}
          {activeSubTab === 'mapbox' && config && (
            <MapboxConfigPanel
              config={config}
              onUpdateConfig={async (updated) => {
                const newConfig = { ...config, ...updated };
                setConfig(newConfig);
                await api.updateSaaSGlobalConfig(newConfig);
                setMessage({ text: 'Configurações do Mapbox salvas com sucesso!', type: 'success' });
                setTimeout(() => setMessage(null), 4000);
              }}
              saving={saving}
            />
          )}

          {/* TAB 10: HELP EDITOR */}
          {activeSubTab === 'help' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-500" />
                  Editor do Módulo de Ajuda
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  Gerencie o conteúdo de ajuda exibido para cada perfil de usuário do sistema.
                </p>
              </div>
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                {(['ADMIN', 'SUPERVISOR', 'USER', 'DRIVER'] as const).map(role => (
                  <button
                    key={role}
                    onClick={() => setHelpRole(role)}
                    className={`px-4 py-2 rounded-lg font-bold text-sm shrink-0 cursor-pointer transition-colors ${helpRole === role ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                  >
                    {role}
                  </button>
                ))}
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl">
                <ReactQuill 
                  theme="snow"
                  placeholder={`Escreva as instruções, regras ou guias de ajuda com suporte a imagens e HTML para o perfil ${helpRole}...`}
                  value={helpContent[helpRole] || ''}
                  onChange={value => setHelpContent(prev => ({ ...prev, [helpRole]: value }))}
                  className="h-80 mb-12"
                  modules={{
                    toolbar: [
                      [{ 'header': [1, 2, 3, false] }],
                      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                      [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
                      ['link', 'image'],
                      ['clean']
                    ],
                  }}
                />
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="text-xs text-slate-500 max-w-md">
                  <span>Para visualizar o resultado final, acesse a opção <strong>"Ajuda"</strong> no menu principal. O conteúdo exibido respeitará o perfil do usuário logado.</span>
                </div>
                <button 
                  onClick={async () => {
                    setSaving(true);
                    try {
                      await api.saveHelp(helpRole, helpContent[helpRole]);
                      setMessage({ text: `Ajuda para o perfil ${helpRole} salva com sucesso!`, type: 'success' });
                      setTimeout(() => setMessage(null), 4000);
                    } catch (err) {
                      setMessage({ text: 'Erro ao salvar ajuda', type: 'error' });
                      setTimeout(() => setMessage(null), 4000);
                    } finally {
                      setSaving(false);
                    }
                  }}
                  disabled={saving}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50 transition-colors shadow-xs"
                >
                  {saving ? 'Gravando...' : `Salvar Ajuda para ${helpRole}`}
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
