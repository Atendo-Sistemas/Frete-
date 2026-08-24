import React, { useState } from 'react';
import { SaaSGlobalConfig, MapboxConfig } from '../../types';
import { api } from '../../services/api';
import { 
  Compass, 
  MapPin, 
  Key, 
  Eye, 
  EyeOff, 
  Check, 
  ShieldCheck, 
  Layers, 
  Radio, 
  Sparkles, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Sliders,
  Globe
} from 'lucide-react';

interface MapboxConfigPanelProps {
  config: SaaSGlobalConfig;
  onUpdateConfig: (updated: Partial<SaaSGlobalConfig>) => Promise<void>;
  saving: boolean;
}

const DEFAULT_MAPBOX_CONFIG: MapboxConfig = {
  enabled: false,
  apiKey: '',
  defaultZoom: 12,
  defaultStyle: 'streets-v12',
  enableLiveTracking: true,
  updateIntervalSeconds: 30
};

export const MapboxConfigPanel: React.FC<MapboxConfigPanelProps> = ({
  config,
  onUpdateConfig,
  saving
}) => {
  const [mapboxForm, setMapboxForm] = useState<MapboxConfig>(
    config.mapboxConfig || DEFAULT_MAPBOX_CONFIG
  );
  const [showToken, setShowToken] = useState(false);
  const [testingToken, setTestingToken] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTestToken = async () => {
    if (!mapboxForm.apiKey || mapboxForm.apiKey.trim().length < 10) {
      setTestResult({ success: false, message: 'Insira um token da API do Mapbox válido (ex: pk.eyJ1...)' });
      return;
    }

    setTestingToken(true);
    setTestResult(null);

    try {
      const res = await fetch(`https://api.mapbox.com/styles/v1/mapbox/streets-v12?access_token=${mapboxForm.apiKey.trim()}`);
      if (res.ok) {
        setTestResult({ success: true, message: 'Token do Mapbox verificado com sucesso! Conexão estabelecida.' });
      } else if (res.status === 401) {
        setTestResult({ success: false, message: 'Token inválido ou não autorizado (401 Unauthorized).' });
      } else {
        setTestResult({ success: true, message: 'Token testado com resposta da API Mapbox (Status: ' + res.status + ').' });
      }
    } catch (e: any) {
      setTestResult({ success: false, message: 'Erro de conexão ao testar Mapbox: ' + (e.message || 'Falha de rede') });
    } finally {
      setTestingToken(false);
    }
  };

  const handleSave = async () => {
    await onUpdateConfig({
      mapboxConfig: mapboxForm
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 text-white border border-slate-700 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Compass className="w-4 h-4" />
            </div>
            <h2 className="text-base font-extrabold tracking-tight">
              Configuração da API Mapbox • Rastreamento & Geolocalização
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 uppercase tracking-wider">
              Mapbox GL JS v3
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
            Integre a plataforma Mapbox para exibir mapas interativos em tempo real, rastreio GPS de frotas e otimização de rotas para motoristas e gestores.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="https://account.mapbox.com/access-tokens/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Obter Token no Mapbox</span>
          </a>
        </div>
      </div>

      {/* Main Configuration Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        
        {/* Enable Switch */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <div className="space-y-0.5">
            <div className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-sky-500" />
              <span>Ativar Mapbox para Rastreio de Veículos</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Quando ativado, os mapas interativos do sistema usarão o Mapbox GL e token configurado em vez dos fallbacks padrão.
            </div>
          </div>
          <input
            type="checkbox"
            checked={mapboxForm.enabled}
            onChange={(e) => setMapboxForm({ ...mapboxForm, enabled: e.target.checked })}
            className="w-5 h-5 text-sky-600 rounded cursor-pointer"
          />
        </div>

        {/* API Token Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Key className="w-4 h-4 text-sky-500" /> Mapbox Public Access Token (Access Token):
            </span>
            <span className="text-[11px] text-slate-400 font-normal">Ex: pk.eyJ1...</span>
          </label>

          <div className="relative flex items-center">
            <input
              type={showToken ? 'text' : 'password'}
              value={mapboxForm.apiKey}
              onChange={(e) => setMapboxForm({ ...mapboxForm, apiKey: e.target.value })}
              placeholder="pk.eyJ1... (cole seu token público do Mapbox aqui)"
              className="w-full pl-3.5 pr-24 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono shadow-inner"
            />
            <div className="absolute right-2 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                title={showToken ? 'Ocultar Token' : 'Mostrar Token'}
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Test Connection Result */}
        {testResult && (
          <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 animate-in fade-in duration-200 ${
            testResult.success 
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300' 
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
          }`}>
            {testResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />}
            <span className="font-bold">{testResult.message}</span>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleTestToken}
            disabled={testingToken || !mapboxForm.apiKey}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors shadow-sm"
          >
            {testingToken ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />}
            <span>Testar Conexão com Mapbox</span>
          </button>
        </div>

        <hr className="border-slate-200 dark:border-slate-800" />

        {/* Map Styles and Parameters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Estilo Padrão do Mapa (Mapbox Style)
            </label>
            <select
              value={mapboxForm.defaultStyle}
              onChange={(e) => setMapboxForm({ ...mapboxForm, defaultStyle: e.target.value as any })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
            >
              <option value="streets-v12">Mapbox Streets (Ruas e Rodovias - Padrão)</option>
              <option value="outdoors-v12">Mapbox Outdoors (Topográfico e Relevo)</option>
              <option value="light-v11">Mapbox Light (Claro Minimalista)</option>
              <option value="dark-v11">Mapbox Dark (Noturno Elegante)</option>
              <option value="satellite-streets-v12">Mapbox Satellite Streets (Satélite + Ruas)</option>
              <option value="navigation-night-v1">Mapbox Navigation Night (GPS Noturno)</option>
            </select>
            <p className="text-[10px] text-slate-400 mt-1">Define o tema visual renderizado no rastreio da frota</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Zoom Inicial do Mapa ({mapboxForm.defaultZoom}x)
            </label>
            <input
              type="range"
              min="5"
              max="18"
              step="1"
              value={mapboxForm.defaultZoom}
              onChange={(e) => setMapboxForm({ ...mapboxForm, defaultZoom: parseInt(e.target.value, 10) })}
              className="w-full accent-sky-600 mt-2"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>5 (Visão Regional)</span>
              <span className="font-bold text-sky-600">12 (Padrão Urbano/Estrada)</span>
              <span>18 (Zoom Máximo)</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Intervalo de Atualização de Posição GPS
            </label>
            <select
              value={mapboxForm.updateIntervalSeconds}
              onChange={(e) => setMapboxForm({ ...mapboxForm, updateIntervalSeconds: parseInt(e.target.value, 10) })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
            >
              <option value="10">A cada 10 segundos (Tempo real intenso)</option>
              <option value="30">A cada 30 segundos (Recomendado - Economia de Bateria)</option>
              <option value="60">A cada 1 minuto</option>
              <option value="300">A cada 5 minutos</option>
            </select>
          </div>

          <div className="flex items-center pt-5">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={mapboxForm.enableLiveTracking}
                onChange={(e) => setMapboxForm({ ...mapboxForm, enableLiveTracking: e.target.checked })}
                className="w-4 h-4 text-sky-600 rounded"
              />
              <span>Ativar telemetria e rastreio ativo para motoristas em viagem</span>
            </label>
          </div>

        </div>

        {/* Save Actions */}
        <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50 transition-colors shadow-sm flex items-center gap-2"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            <span>Salvar Configuração do Mapbox</span>
          </button>
        </div>

      </div>

    </div>
  );
};
