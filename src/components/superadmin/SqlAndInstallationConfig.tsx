import React, { useState, useEffect } from 'react';
import { SaaSGlobalConfig, SqlDatabaseConfig, ImageCompressionConfig } from '../../types';
import { api } from '../../services/api';
import { compressImage, formatBytes, DEFAULT_COMPRESSION_CONFIG, CompressionResult } from '../../utils/imageCompression';
import { 
  Database, 
  Terminal, 
  Layers, 
  Image as ImageIcon, 
  Copy, 
  Check, 
  Download, 
  Play, 
  Code, 
  Sparkles, 
  Server, 
  ShieldCheck, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  Sliders, 
  FileCode, 
  ExternalLink,
  Zap,
  HardDrive,
  UploadCloud
} from 'lucide-react';

interface SqlAndInstallationConfigProps {
  config: SaaSGlobalConfig;
  onUpdateConfig: (updated: Partial<SaaSGlobalConfig>) => Promise<void>;
  saving: boolean;
}

export const SqlAndInstallationConfig: React.FC<SqlAndInstallationConfigProps> = ({
  config,
  onUpdateConfig,
  saving
}) => {
  const [activeTab, setActiveTab] = useState<'ssh' | 'portainer' | 'database' | 'compression'>('ssh');
  const [copiedScript, setCopiedScript] = useState<string | null>(null);
  const [showDbPassword, setShowDbPassword] = useState(false);

  // Database status and test states
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [loadingDbStatus, setLoadingDbStatus] = useState(false);
  const [testingDb, setTestingDb] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latencyMs?: number; tablesCount?: number } | null>(null);
  const [migratingDb, setMigratingDb] = useState(false);
  const [migrationResult, setMigrationResult] = useState<{ success: boolean; message: string } | null>(null);

  // Scripts content
  const [sshScriptContent, setSshScriptContent] = useState<string>('');
  const [portainerYamlContent, setPortainerYamlContent] = useState<string>('');
  const [schemaSqlContent, setSchemaSqlContent] = useState<string>('');
  const [showSchemaModal, setShowSchemaModal] = useState(false);

  // Local config form states
  const [dbForm, setDbForm] = useState<SqlDatabaseConfig>(
    config.databaseConfig || {
      enabled: true,
      dbType: 'postgres',
      host: 'postgres',
      port: 5432,
      database: 'elolog',
      username: 'elolog_user',
      password: 'elolog_secret_password_2026',
      ssl: false,
      autoMigrate: true,
      connectionStatus: 'UNCONFIGURED'
    }
  );

  const [compressionForm, setCompressionForm] = useState<ImageCompressionConfig>(
    config.imageCompression || DEFAULT_COMPRESSION_CONFIG
  );

  // Interactive compression tester state
  const [testImageFile, setTestImageFile] = useState<File | null>(null);
  const [testImageResult, setTestImageResult] = useState<CompressionResult | null>(null);
  const [compressingTest, setCompressingTest] = useState(false);

  useEffect(() => {
    loadDatabaseStatus();
    loadScripts();
  }, []);

  const loadDatabaseStatus = async () => {
    setLoadingDbStatus(true);
    try {
      const status = await api.getDatabaseStatus();
      setDbStatus(status);
    } catch (e) {
      console.warn('Erro ao obter status do banco:', e);
    } finally {
      setLoadingDbStatus(false);
    }
  };

  const loadScripts = async () => {
    try {
      const [ssh, portainer, schema] = await Promise.all([
        api.getSshInstallScript().catch(() => ''),
        api.getPortainerStackYaml().catch(() => ''),
        api.getDatabaseSchema().catch(() => '')
      ]);
      setSshScriptContent(ssh);
      setPortainerYamlContent(portainer);
      setSchemaSqlContent(schema);
    } catch (e) {
      console.warn('Erro ao carregar scripts:', e);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedScript(id);
    setTimeout(() => setCopiedScript(null), 2500);
  };

  const handleDownloadFile = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleTestDatabase = async () => {
    setTestingDb(true);
    setTestResult(null);
    try {
      const res = await api.testDatabaseConnection(dbForm);
      setTestResult(res);
      if (res.success) {
        loadDatabaseStatus();
      }
    } catch (e: any) {
      setTestResult({ success: false, message: e.message || 'Erro de conexão com o banco.' });
    } finally {
      setTestingDb(false);
    }
  };

  const handleMigrateDatabase = async () => {
    if (!confirm('Deseja executar a migração SQL no banco configurado? Isso criará todas as tabelas (tenants, users, freights, checklists, trip_expenses, etc) e índices.')) {
      return;
    }
    setMigratingDb(true);
    setMigrationResult(null);
    try {
      const res = await api.migrateDatabase();
      setMigrationResult(res);
      loadDatabaseStatus();
    } catch (e: any) {
      setMigrationResult({ success: false, message: e.message || 'Erro ao executar migração.' });
    } finally {
      setMigratingDb(false);
    }
  };

  const handleSaveAll = async () => {
    await onUpdateConfig({
      databaseConfig: dbForm,
      imageCompression: compressionForm
    });
  };

  // Handle test image selection
  const handleTestImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setTestImageFile(file);
    setCompressingTest(true);
    try {
      const result = await compressImage(file, compressionForm);
      setTestImageResult(result);
    } catch (err) {
      console.error('Erro na compressão teste:', err);
    } finally {
      setCompressingTest(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white border border-slate-700 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Database className="w-4 h-4" />
            </div>
            <h2 className="text-base font-extrabold tracking-tight">
              Instalação Automatizada & Banco de Dados SQL
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
              PostgreSQL 16+
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
            Configure a persistência em banco relacional SQL, gerencie instaladores autônomos para VPS (SSH e Portainer) e controle a compressão automática de fotos e comprovantes.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={loadDatabaseStatus}
            disabled={loadingDbStatus}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Atualizar Status"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingDbStatus ? 'animate-spin' : ''}`} />
            <span>Verificar Conexão</span>
          </button>
        </div>
      </div>

      {/* Sub-tabs selector */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('ssh')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'ssh'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Terminal className="w-4 h-4" /> 🚀 Instalação via SSH (1-Click)
        </button>

        <button
          onClick={() => setActiveTab('portainer')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'portainer'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Layers className="w-4 h-4" /> 🐳 Instalação via Portainer (Stack)
        </button>

        <button
          onClick={() => setActiveTab('database')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'database'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Database className="w-4 h-4" /> 🗄️ Banco de Dados SQL
        </button>

        <button
          onClick={() => setActiveTab('compression')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'compression'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <ImageIcon className="w-4 h-4" /> 🖼️ Compressão de Imagens
        </button>
      </div>

      {/* =========================================================================
          SUB-TAB 1: INSTALAÇÃO VIA SSH
          ========================================================================= */}
      {activeTab === 'ssh' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed">
              <strong className="font-bold">Instalador Autônomo para VPS (Ubuntu / Debian / Rocky / CentOS):</strong> O instalador cria o container do PostgreSQL 16 com volume persistente, executa o script de criação de todas as tabelas SQL, configura variáveis de compressão e sobe a aplicação pronta para uso.
            </div>
          </div>

          {/* Quick Command Box */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Comando Único para Terminal SSH (Copie e cole na sua VPS):</span>
              <span className="text-[11px] text-slate-500 font-normal">Requer acesso root/sudo</span>
            </label>

            <div className="relative flex items-center">
              <div className="w-full bg-slate-950 text-emerald-400 font-mono text-xs p-4 rounded-xl border border-slate-800 overflow-x-auto shadow-inner select-all">
                curl -fsSL https://raw.githubusercontent.com/elolog/elolog/main/install.sh | sudo bash
              </div>
              <button
                onClick={() => handleCopy('curl -fsSL https://raw.githubusercontent.com/elolog/elolog/main/install.sh | sudo bash', 'ssh-cmd')}
                className="absolute right-3 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              >
                {copiedScript === 'ssh-cmd' ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copiar Comando
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Steps summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800 dark:text-slate-200">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">1</span>
                <span>Docker & Dependências</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Verifica ou instala automaticamente Docker Engine, Docker Compose Plugin e pacotes necessários.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800 dark:text-slate-200">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">2</span>
                <span>PostgreSQL 16 & SQL</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Cria o banco de dados <code className="text-emerald-600 font-bold">elolog</code> e roda a migração de todas as 12 tabelas e sementes iniciais.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800 dark:text-slate-200">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">3</span>
                <span>Build & Inicialização</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Compila os ativos, configura senhas seguras no .env e libera o acesso web na porta configurada.
              </p>
            </div>
          </div>

          {/* Bash Script Viewer */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileCode className="w-4 h-4 text-emerald-500" /> Conteúdo Completo do Script (install.sh):
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(sshScriptContent, 'ssh-script')}
                  className="px-2.5 py-1 text-xs font-bold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-lg text-slate-700 dark:text-slate-200 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {copiedScript === 'ssh-script' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copiar Script</span>
                </button>
                <button
                  onClick={() => handleDownloadFile(sshScriptContent, 'install.sh', 'text/x-sh')}
                  className="px-2.5 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar install.sh</span>
                </button>
              </div>
            </div>

            <div className="bg-slate-950 text-slate-300 font-mono text-[11px] p-4 rounded-xl border border-slate-800 max-h-72 overflow-y-auto">
              <pre className="whitespace-pre">{sshScriptContent || '# Carregando script install.sh...'}</pre>
            </div>
          </div>

        </div>
      )}

      {/* =========================================================================
          SUB-TAB 2: INSTALAÇÃO VIA PORTAINER
          ========================================================================= */}
      {activeTab === 'portainer' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 flex items-start gap-3">
            <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
              <strong className="font-bold">Instalação Visual via Portainer CE / Business:</strong> Utilize a stack pré-configurada abaixo. Ela contém o serviço do banco de dados relacional PostgreSQL e a aplicação Elo Log interconectados via rede interna isolada.
            </div>
          </div>

          {/* Portainer Steps Guide */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-3">
            <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Passo a Passo no Painel do Portainer
            </h4>
            <ol className="text-xs text-slate-600 dark:text-slate-300 space-y-2 list-decimal list-inside leading-relaxed">
              <li>Acesse seu painel Portainer e clique no menu lateral em <strong>Stacks</strong> &gt; <strong>Add stack</strong>.</li>
              <li>Defina o nome da stack como <code className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded font-mono text-emerald-600">elo-log</code>.</li>
              <li>Selecione o método <strong>Web editor</strong> e cole o conteúdo YAML abaixo.</li>
              <li>(Opcional) Altere a senha padrão do banco na variável <code className="font-mono text-blue-500">DB_PASSWORD</code>.</li>
              <li>Clique no botão inferior <strong>Deploy the stack</strong>. O banco e as tabelas serão provisionados automaticamente!</li>
            </ol>
          </div>

          {/* YAML Stack Viewer */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Code className="w-4 h-4 text-blue-500" /> Docker Compose Stack para Portainer (docker-compose.portainer.yml):
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(portainerYamlContent, 'portainer-yaml')}
                  className="px-2.5 py-1 text-xs font-bold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-lg text-slate-700 dark:text-slate-200 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {copiedScript === 'portainer-yaml' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copiar Stack YAML</span>
                </button>
                <button
                  onClick={() => handleDownloadFile(portainerYamlContent, 'docker-compose.portainer.yml', 'text/yaml')}
                  className="px-2.5 py-1 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar Stack YAML</span>
                </button>
              </div>
            </div>

            <div className="bg-slate-950 text-slate-300 font-mono text-[11px] p-4 rounded-xl border border-slate-800 max-h-96 overflow-y-auto">
              <pre className="whitespace-pre">{portainerYamlContent || '# Carregando docker-compose.portainer.yml...'}</pre>
            </div>
          </div>

        </div>
      )}

      {/* =========================================================================
          SUB-TAB 3: BANCO DE DADOS SQL (CONFIGURAÇÃO & MIGRAÇÃO)
          ========================================================================= */}
      {activeTab === 'database' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Status Badge Card */}
          <div className="p-4 rounded-xl bg-slate-900 text-white border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-3.5 h-3.5 rounded-full ${
                dbStatus?.status === 'CONNECTED' 
                  ? 'bg-emerald-500 ring-4 ring-emerald-500/20' 
                  : dbStatus?.status === 'ERROR'
                  ? 'bg-rose-500 ring-4 ring-rose-500/20'
                  : 'bg-amber-500 ring-4 ring-amber-500/20'
              }`} />
              <div>
                <div className="text-xs font-extrabold flex items-center gap-2">
                  <span>Status do Banco SQL:</span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono ${
                    dbStatus?.status === 'CONNECTED' 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                      : dbStatus?.status === 'ERROR'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    {dbStatus?.status === 'CONNECTED' ? 'CONECTADO E OPERACIONAL' : dbStatus?.status === 'ERROR' ? 'FALHA DE CONEXÃO' : 'NÃO INICIALIZADO'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Host: <code className="text-slate-200">{dbForm.host}:{dbForm.port}</code> | Base: <code className="text-slate-200">{dbForm.database}</code>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleTestDatabase}
                disabled={testingDb}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
              >
                {testingDb ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                <span>Testar Conexão</span>
              </button>

              <button
                type="button"
                onClick={handleMigrateDatabase}
                disabled={migratingDb}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
              >
                {migratingDb ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>Executar Migração DDL</span>
              </button>
            </div>
          </div>

          {/* Test or Migration Feedback */}
          {testResult && (
            <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
              testResult.success 
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300' 
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
            }`}>
              {testResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />}
              <div className="space-y-1">
                <p className="font-bold">{testResult.message}</p>
                {testResult.version && <p className="text-[11px] font-mono opacity-80">{testResult.version}</p>}
              </div>
            </div>
          )}

          {migrationResult && (
            <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
              migrationResult.success 
                ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300' 
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
            }`}>
              {migrationResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-indigo-600" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />}
              <p className="font-bold">{migrationResult.message}</p>
            </div>
          )}

          {/* Database Parameters Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Motor / Tipo de Banco de Dados
              </label>
              <select
                value={dbForm.dbType}
                onChange={(e) => setDbForm({ ...dbForm, dbType: e.target.value as any })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
              >
                <option value="postgres">PostgreSQL (Recomendado para Produção)</option>
                <option value="mysql">MySQL / MariaDB</option>
                <option value="sqlite">SQLite (Desenvolvimento local)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Host / IP do Servidor SQL
              </label>
              <input
                type="text"
                value={dbForm.host}
                onChange={(e) => setDbForm({ ...dbForm, host: e.target.value })}
                placeholder="Ex: postgres ou 127.0.0.1 ou db.servidor.com"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Porta do Banco
              </label>
              <input
                type="number"
                value={dbForm.port}
                onChange={(e) => setDbForm({ ...dbForm, port: parseInt(e.target.value, 10) || 5432 })}
                placeholder="5432"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nome da Base de Dados (Database)
              </label>
              <input
                type="text"
                value={dbForm.database}
                onChange={(e) => setDbForm({ ...dbForm, database: e.target.value })}
                placeholder="elolog"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Usuário do Banco (Username)
              </label>
              <input
                type="text"
                value={dbForm.username}
                onChange={(e) => setDbForm({ ...dbForm, username: e.target.value })}
                placeholder="elolog_user"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Senha do Banco (Password)
              </label>
              <div className="relative">
                <input
                  type={showDbPassword ? 'text' : 'password'}
                  value={dbForm.password || ''}
                  onChange={(e) => setDbForm({ ...dbForm, password: e.target.value })}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 pr-10 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowDbPassword(!showDbPassword)}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showDbPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

          </div>

          {/* SSL and Auto-migrate toggles */}
          <div className="flex flex-wrap items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={dbForm.ssl}
                onChange={(e) => setDbForm({ ...dbForm, ssl: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded"
              />
              <span>Ativar Conexão Segura SSL (Requerido para Cloud SQL / RDS / Neon)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={dbForm.autoMigrate}
                onChange={(e) => setDbForm({ ...dbForm, autoMigrate: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded"
              />
              <span>Auto-executar migrações ao iniciar o servidor</span>
            </label>
          </div>

          {/* Schema Viewer Trigger */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowSchemaModal(true)}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5 cursor-pointer"
            >
              <FileCode className="w-4 h-4" />
              <span>Ver Schema DDL Completo (schema.sql)</span>
            </button>

            <button
              type="button"
              onClick={handleSaveAll}
              disabled={saving}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Gravando...' : 'Salvar Configurações do Banco'}
            </button>
          </div>

        </div>
      )}

      {/* =========================================================================
          SUB-TAB 4: COMPRESSÃO DE IMAGENS & MÍDIA
          ========================================================================= */}
      {activeTab === 'compression' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50 flex items-start gap-3">
            <ImageIcon className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
            <div className="text-xs text-purple-900 dark:text-purple-200 leading-relaxed">
              <strong className="font-bold">Otimização & Compressão Inteligente de Mídia:</strong> Reduz fotos pesadas de celulares (5MB - 12MB) para 80KB - 250KB sem perda visível de nitidez para leitura de comprovantes e documentos (CNH, CRLV, Vistorias, Canhotos).
            </div>
          </div>

          {/* Compression Settings Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="md:col-span-2 flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">Ativar Compressão Automática</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Otimiza fotos na câmera e no upload de arquivos antes de enviar ao servidor</div>
              </div>
              <input
                type="checkbox"
                checked={compressionForm.enabled}
                onChange={(e) => setCompressionForm({ ...compressionForm, enabled: e.target.checked })}
                className="w-5 h-5 text-emerald-600 rounded cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Qualidade da Imagem ({Math.round((compressionForm.quality || 0.8) * 100)}%)
              </label>
              <input
                type="range"
                min="0.2"
                max="1.0"
                step="0.05"
                value={compressionForm.quality}
                onChange={(e) => setCompressionForm({ ...compressionForm, quality: parseFloat(e.target.value) })}
                className="w-full accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>20% (Mais leve)</span>
                <span className="font-bold text-emerald-600">80% (Recomendado)</span>
                <span>100% (Sem compressão)</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Formato de Saída Otimizado
              </label>
              <select
                value={compressionForm.format}
                onChange={(e) => setCompressionForm({ ...compressionForm, format: e.target.value as any })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
              >
                <option value="image/jpeg">JPEG (Máxima compatibilidade e alta compressão)</option>
                <option value="image/webp">WebP (Mais moderno e até 30% mais leve)</option>
                <option value="image/png">PNG (Preserva transparências)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Largura Máxima (Pixels)
              </label>
              <select
                value={compressionForm.maxWidth}
                onChange={(e) => setCompressionForm({ ...compressionForm, maxWidth: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
              >
                <option value="1280">1280 px (HD - Compacto)</option>
                <option value="1600">1600 px (Full HD Otimizado - Padrão)</option>
                <option value="1920">1920 px (1080p - Alta Definição)</option>
                <option value="2560">2560 px (2K - Ultra)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Altura Máxima (Pixels)
              </label>
              <select
                value={compressionForm.maxHeight}
                onChange={(e) => setCompressionForm({ ...compressionForm, maxHeight: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
              >
                <option value="1280">1280 px</option>
                <option value="1600">1600 px (Padrão)</option>
                <option value="1920">1920 px</option>
                <option value="2560">2560 px</option>
              </select>
            </div>

          </div>

          {/* Interactive Live Compression Tester */}
          <div className="mt-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                  Testador Interativo de Compressão em Tempo Real
                </h4>
              </div>
              <span className="text-[11px] text-slate-500">Selecione qualquer foto do seu computador para ver a economia</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <label className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm transition-colors">
                <UploadCloud className="w-4 h-4" />
                <span>Escolher Imagem de Teste</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleTestImageChange}
                  className="hidden"
                />
              </label>

              {testImageFile && (
                <span className="text-xs text-slate-600 dark:text-slate-300 font-medium truncate max-w-xs">
                  {testImageFile.name} ({formatBytes(testImageFile.size)})
                </span>
              )}
            </div>

            {/* Results Comparison */}
            {testImageResult && (
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-3 animate-in fade-in duration-200">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Tamanho Original</div>
                    <div className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">
                      {formatBytes(testImageResult.originalSize)}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                    <div className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Tamanho Otimizado</div>
                    <div className="text-sm font-extrabold text-emerald-700 dark:text-emerald-300 mt-0.5">
                      {formatBytes(testImageResult.compressedSize)}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800">
                    <div className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400">Economia / Redução</div>
                    <div className="text-sm font-extrabold text-purple-700 dark:text-purple-300 mt-0.5">
                      -{testImageResult.reductionPercent}%
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Dimensões Finais</div>
                    <div className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mt-0.5 font-mono">
                      {testImageResult.width} × {testImageResult.height}
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-center">
                  <img
                    src={testImageResult.dataUrl}
                    alt="Prévia Otimizada"
                    className="max-h-48 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm object-contain"
                  />
                </div>
              </div>
            )}

          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={saving}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50 transition-colors shadow-sm"
            >
              {saving ? 'Gravando...' : 'Salvar Configurações de Imagem'}
            </button>
          </div>

        </div>
      )}

      {/* =========================================================================
          MODAL: SCHEMA DDL VIEWER
          ========================================================================= */}
      {showSchemaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Schema de Banco de Dados Relacional (schema.sql)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(schemaSqlContent, 'schema-sql')}
                  className="px-2.5 py-1 text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-200 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {copiedScript === 'schema-sql' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copiar SQL</span>
                </button>
                <button
                  onClick={() => setShowSchemaModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-4 overflow-y-auto bg-slate-950 text-emerald-400 font-mono text-[11px] leading-relaxed">
              <pre className="whitespace-pre">{schemaSqlContent || '-- Carregando schema.sql...'}</pre>
            </div>

            <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
              <button
                onClick={() => setShowSchemaModal(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold cursor-pointer"
              >
                Fechar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
