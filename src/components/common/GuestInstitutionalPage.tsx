import React, { useState, useEffect } from 'react';
import { Truck, ShieldCheck, Mail, Phone, Lock, User as UserIcon, Building2, FileText, Send, CheckCircle2, ArrowRight, AlertTriangle, MessageSquare } from 'lucide-react';
import { api, setAuthToken } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSaaS } from '../../context/SaaSContext';
import { ThemeToggle } from './ThemeToggle';

import { TermsOfUse } from './TermsOfUse';
import { PrivacyPolicy } from './PrivacyPolicy';

interface GuestInstitutionalPageProps {
  onLoginSuccess: () => void;
}

export const GuestInstitutionalPage: React.FC<GuestInstitutionalPageProps> = ({ onLoginSuccess }) => {
  const { refreshProfile, refreshNotifications } = useAuth();
  const { config } = useSaaS();
  const [activeSubTab, setActiveSubTab] = useState<'inicio' | 'contato' | 'login' | 'cadastro'>('inicio');

  // Terms and Privacy View
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  // Dynamic layout / institutional home text config with fallbacks
  const logoName = config?.layout?.logoText || 'Elo Log';
  const homeBadge = config?.layout?.homeBadgeText || 'Solução Completa Multi-Tenant de Carga';
  const homeTitle = config?.layout?.homeTitle || 'Gestão e Publicação de Fretes em';
  const homeTitleAccent = config?.layout?.homeTitleAccent || 'Tempo Real';
  const homeSubtitle = config?.layout?.homeSubtitle || 'O Elo Log conecta transportadoras e motoristas com total isolamento e segurança. Publique fretes, controle frotas, execute checklists eletrônicos e audite sua operação logística em uma plataforma ágil e offline-ready.';
  
  // Login Form States
  const [loginMode, setLoginMode] = useState<'email' | 'phone'>('email');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginPhone, setLoginPhone] = useState('');
  const [loginOtpSent, setLoginOtpSent] = useState(false);
  const [loginOtpCode, setLoginOtpCode] = useState('');
  const [loginTimer, setLoginTimer] = useState(300); // 5 minutes in seconds
  const [loginTimerActive, setLoginTimerActive] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Register Form States
  const [regCompanyName, setRegCompanyName] = useState('');
  const [regCnpj, setRegCnpj] = useState('');
  const [regResponsibleName, setRegResponsibleName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regTermsAccepted, setRegTermsAccepted] = useState(false);
  const [regPrivacyAccepted, setRegPrivacyAccepted] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');
  const [regStep, setRegStep] = useState<'form' | 'verify' | 'success'>('form');
  const [regOtpCode, setRegOtpCode] = useState('');

  // Contact Form States
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);

  // Countdown timer effect for WhatsApp OTP
  useEffect(() => {
    let interval: any = null;
    if (loginTimerActive && loginTimer > 0) {
      interval = setInterval(() => {
        setLoginTimer(prev => prev - 1);
      }, 1000);
    } else if (loginTimer === 0) {
      setLoginTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [loginTimerActive, loginTimer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Format phone number dynamically (Brazilian format)
  const handlePhoneChange = (value: string, setter: (val: string) => void) => {
    const clean = value.replace(/\D/g, '');
    let formatted = clean;
    if (clean.length > 2) {
      formatted = `(${clean.substring(0, 2)}) `;
      if (clean.length > 7) {
        formatted += `${clean.substring(2, 7)}-${clean.substring(7, 11)}`;
      } else {
        formatted += clean.substring(2);
      }
    }
    setter(formatted);
  };

  // Format CNPJ dynamically
  const handleCnpjChange = (value: string) => {
    const clean = value.replace(/\D/g, '');
    let formatted = clean;
    if (clean.length > 2) {
      formatted = `${clean.substring(0, 2)}.${clean.substring(2)}`;
      if (clean.length > 5) {
        formatted = `${clean.substring(0, 2)}.${clean.substring(2, 5)}.${clean.substring(5)}`;
        if (clean.length > 8) {
          formatted = `${clean.substring(0, 2)}.${clean.substring(2, 5)}.${clean.substring(5, 8)}/${clean.substring(8)}`;
          if (clean.length > 12) {
            formatted = `${clean.substring(0, 2)}.${clean.substring(2, 5)}.${clean.substring(5, 8)}/${clean.substring(8, 12)}-${clean.substring(12, 14)}`;
          }
        }
      }
    }
    setRegCnpj(formatted);
  };

  // Login via Email and Password
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setLoginError('Preencha o e-mail e a senha.');
      return;
    }

    setLoginLoading(true);
    setLoginError('');

    try {
      const res = await api.login(loginEmail, undefined, loginPassword);
      setAuthToken(res.token);
      await refreshProfile();
      await refreshNotifications();
      onLoginSuccess();
    } catch (err: any) {
      setLoginError(err.message || 'Falha na autenticação. Verifique suas credenciais.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Request Phone OTP via simulated WhatsApp
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginPhone) {
      setLoginError('Digite o seu número de telefone.');
      return;
    }

    setLoginLoading(true);
    setLoginError('');

    try {
      await api.requestOtp(loginPhone);
      setLoginOtpSent(true);
      setLoginTimer(300); // 5 minutes
      setLoginTimerActive(true);
    } catch (err: any) {
      setLoginError(err.message || 'Telefone não encontrado ou erro ao enviar código.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Confirm OTP Code
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginOtpCode) {
      setLoginError('Insira o código de 6 dígitos enviado.');
      return;
    }

    setLoginLoading(true);
    setLoginError('');

    try {
      const res = await api.verifyOtp(loginPhone, loginOtpCode);
      setAuthToken(res.token);
      await refreshProfile();
      await refreshNotifications();
      onLoginSuccess();
    } catch (err: any) {
      setLoginError(err.message || 'Código incorreto ou expirado.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Register Company Form Submit
  const handleRegisterCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!regCompanyName || !regCnpj || !regResponsibleName || !regEmail || !regPhone || !regPassword) {
      setRegError('Preencha todos os campos obrigatórios.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError('As senhas não coincidem.');
      return;
    }

    if (!regTermsAccepted || !regPrivacyAccepted) {
      setRegError('Você deve aceitar os Termos de Uso e a Política de Privacidade.');
      return;
    }

    setRegLoading(true);

    try {
      await api.registerCompany({
        companyName: regCompanyName,
        cnpj: regCnpj,
        responsibleName: regResponsibleName,
        email: regEmail,
        phone: regPhone,
        password: regPassword
      });

      setRegStep('verify');
    } catch (err: any) {
      setRegError(err.message || 'Erro ao realizar cadastro.');
    } finally {
      setRegLoading(false);
    }
  };

  // Verify Registration OTP Code
  const handleVerifyRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!regOtpCode) {
      setRegError('Digite o código de verificação recebido.');
      return;
    }

    setRegLoading(true);

    try {
      await api.verifyRegistration(regEmail, regOtpCode);
      setRegStep('success');
    } catch (err: any) {
      setRegError(err.message || 'Código de verificação inválido ou expirado.');
    } finally {
      setRegLoading(false);
    }
  };

  // Contact Form Submit
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMessage) {
      alert('Por favor, preencha todos os campos.');
      return;
    }

    setContactLoading(true);
    setTimeout(() => {
      setContactLoading(false);
      setContactSuccess(true);
      setContactName('');
      setContactEmail('');
      setContactMessage('');
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between">
      
      {/* Institutional Top Navbar */}
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white block leading-tight">
                  {logoName} <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">SaaS</span>
                </span>
                <span className="text-[10px] font-medium text-slate-500 block">
                  Logística Inteligente & Conectada
                </span>
              </div>
            </div>

            {/* Menu Links */}
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => setActiveSubTab('inicio')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeSubTab === 'inicio'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                Início
              </button>
              <button
                onClick={() => setActiveSubTab('contato')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeSubTab === 'contato'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                Contato
              </button>
              <div className="pl-2 border-l border-slate-200 dark:border-slate-800">
                <ThemeToggle />
              </div>

              <button
                onClick={() => {
                  setLoginOtpSent(false);
                  setLoginError('');
                  setActiveSubTab('login');
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeSubTab === 'login'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                Entrar
              </button>
              <button
                onClick={() => {
                  setRegStep('form');
                  setRegError('');
                  setActiveSubTab('cadastro');
                }}
                className={`px-4 py-2 rounded-lg text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors ${
                  activeSubTab === 'cadastro' ? 'ring-2 ring-emerald-500 ring-offset-2' : ''
                }`}
              >
                Cadastrar Empresa
              </button>
            </div>

            {/* Mobile Actions Header */}
            <div className="flex sm:hidden items-center gap-1">
              <button 
                onClick={() => setActiveSubTab('login')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800"
              >
                Entrar
              </button>
              <button 
                onClick={() => setActiveSubTab('cadastro')}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white"
              >
                Criar Conta
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Sections */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* TAB INICIO */}
        {activeSubTab === 'inicio' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center py-6">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                {homeBadge}
              </div>
              
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                {homeTitle} <span className="text-emerald-600">{homeTitleAccent}</span>
              </h1>
              
              <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl">
                {homeSubtitle}
              </p>

              {/* Feature grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <div className="flex gap-3 items-start p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Controle de Tenants</h4>
                    <p className="text-xs text-slate-500">Dados individuais e blindados para cada transportadora.</p>
                  </div>
                </div>

                <div className="flex gap-3 items-start p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Checklists de Trânsito</h4>
                    <p className="text-xs text-slate-500">Formulários eletrônicos para inspeções em tempo real.</p>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  onClick={() => setActiveSubTab('cadastro')}
                  className="px-6 py-3 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white text-base shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 group cursor-pointer"
                >
                  Cadastrar Minha Transportadora
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => setActiveSubTab('contato')}
                  className="px-6 py-3 rounded-xl font-semibold bg-white dark:bg-slate-900 hover:bg-slate-50 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-base flex items-center justify-center cursor-pointer"
                >
                  Falar com Comercial
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500 to-teal-500 rounded-3xl rotate-3 blur-md opacity-10"></div>
              <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <Truck className="text-emerald-600 w-5 h-5" />
                  Acesso Rápido ao Portal
                </h3>
                <p className="text-sm text-slate-500 mb-6">
                  Se você já possui cadastro como transportadora ou motorista, acesse sua conta por email ou telefone.
                </p>

                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setLoginMode('email');
                      setActiveSubTab('login');
                    }}
                    className="w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 font-semibold flex items-center justify-between text-sm cursor-pointer"
                  >
                    <span>Entrar por E-mail</span>
                    <Mail className="w-4.5 h-4.5 text-slate-400" />
                  </button>

                  <button
                    onClick={() => {
                      setLoginMode('phone');
                      setActiveSubTab('login');
                    }}
                    className="w-full py-3 px-4 rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/40 hover:bg-emerald-50 text-emerald-800 dark:text-emerald-300 font-semibold flex items-center justify-between text-sm cursor-pointer"
                  >
                    <span>Entrar com Telefone (WhatsApp OTP)</span>
                    <MessageSquare className="w-4.5 h-4.5 text-emerald-600" />
                  </button>
                </div>

                <div className="mt-8 border-t border-slate-100 dark:border-slate-800 pt-6 text-center">
                  <span className="text-xs text-slate-500">Não possui conta? </span>
                  <button
                    onClick={() => setActiveSubTab('cadastro')}
                    className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
                  >
                    Cadastre-se como Transportadora
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB CONTATO */}
        {activeSubTab === 'contato' && (
          <div className="max-w-xl mx-auto py-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-md">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <Mail className="text-emerald-600 w-6 h-6" />
                Entre em Contato
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                Fale com nossos especialistas em logística SaaS para tirar dúvidas ou solicitar suporte customizado.
              </p>

              {contactSuccess ? (
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Mensagem Enviada!</h3>
                  <p className="text-sm text-slate-500">
                    Agradecemos seu contato. Nossa equipe comercial responderá ao seu e-mail em até 24 horas.
                  </p>
                  <button
                    onClick={() => setContactSuccess(false)}
                    className="px-5 py-2 rounded-lg bg-emerald-600 text-white font-semibold text-sm cursor-pointer"
                  >
                    Enviar Outra Mensagem
                  </button>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Seu Nome</label>
                    <input
                      type="text"
                      required
                      value={contactName}
                      onChange={e => setContactName(e.target.value)}
                      placeholder="Ex: João da Silva"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:outline-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">E-mail Corporativo</label>
                    <input
                      type="email"
                      required
                      value={contactEmail}
                      onChange={e => setContactEmail(e.target.value)}
                      placeholder="Ex: joao@suatransportadora.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:outline-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Mensagem</label>
                    <textarea
                      required
                      rows={4}
                      value={contactMessage}
                      onChange={e => setContactMessage(e.target.value)}
                      placeholder="Como podemos te ajudar? (Ex: gostaria de solicitar uma demonstração comercial)"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:outline-emerald-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={contactLoading}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-2 text-sm shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {contactLoading ? 'Enviando...' : 'Enviar Mensagem'}
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* TAB LOGIN */}
        {activeSubTab === 'login' && (
          <div className="max-w-md mx-auto py-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-md">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 text-center">
                Acesse o Elo Log
              </h2>
              <p className="text-xs text-slate-500 text-center mb-6">
                Escolha o método de autenticação corporativa de sua preferência
              </p>

              {/* Toggle Login Mode */}
              <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setLoginMode('email');
                    setLoginError('');
                    setLoginOtpSent(false);
                  }}
                  className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    loginMode === 'email'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  E-mail & Senha
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginMode('phone');
                    setLoginError('');
                    setLoginOtpSent(false);
                  }}
                  className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    loginMode === 'phone'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Celular (WhatsApp OTP)
                </button>
              </div>

              {loginError && (
                <div className="p-3.5 bg-red-50 border border-red-100 text-red-700 rounded-xl text-xs flex items-start gap-2 mb-4 leading-relaxed">
                  <AlertTriangle className="w-4.5 h-4.5 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              {/* Login Mode: Email */}
              {loginMode === 'email' && (
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Seu E-mail</label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={e => setLoginEmail(e.target.value)}
                        placeholder="Ex: joao@transportadora.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:outline-emerald-500"
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">Senha de Acesso</label>
                    </div>
                    <div className="relative">
                      <input
                        type="password"
                        required
                        value={loginPassword}
                        onChange={e => setLoginPassword(e.target.value)}
                        placeholder="Digite sua senha"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:outline-emerald-500"
                      />
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {loginLoading ? 'Acessando...' : 'Entrar no Sistema'}
                  </button>
                </form>
              )}

              {/* Login Mode: Phone WhatsApp OTP */}
              {loginMode === 'phone' && (
                <div className="space-y-4">
                  {!loginOtpSent ? (
                    <form onSubmit={handleRequestOtp} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Número de Celular (WhatsApp)</label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            value={loginPhone}
                            onChange={e => handlePhoneChange(e.target.value, setLoginPhone)}
                            placeholder="(17) 99999-9999"
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:outline-emerald-500"
                          />
                          <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Enviaremos um código OTP de uso único para validação segura via WhatsApp.
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={loginLoading}
                        className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {loginLoading ? 'Enviando...' : 'Receber Código no WhatsApp'}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900 rounded-xl text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2 leading-relaxed">
                        <span className="text-lg">💬</span>
                        <span>Código de segurança enviado via WhatsApp para o seu número. Verifique suas mensagens.</span>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Código de Segurança</label>
                        <div className="relative">
                          <input
                            type="text"
                            maxLength={6}
                            required
                            value={loginOtpCode}
                            onChange={e => setLoginOtpCode(e.target.value.replace(/\D/g, ''))}
                            placeholder="Digite o código de 6 dígitos"
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm text-center font-mono tracking-widest focus:outline-emerald-500"
                          />
                          <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                        </div>
                        <div className="flex justify-between items-center mt-1.5">
                          <span className="text-[10px] text-slate-500">
                            Código expira em: <strong className="text-slate-700">{formatTime(loginTimer)}</strong>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setLoginOtpSent(false);
                              setLoginOtpCode('');
                            }}
                            className="text-[10px] font-bold text-emerald-600 hover:underline cursor-pointer"
                          >
                            Alterar Telefone
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loginLoading}
                        className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md cursor-pointer disabled:opacity-50"
                      >
                        {loginLoading ? 'Verificando...' : 'Confirmar Código e Entrar'}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB CADASTRO */}
        {activeSubTab === 'cadastro' && (
          <div className="max-w-xl mx-auto py-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-md">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 text-center">
                Cadastre sua Empresa
              </h2>
              <p className="text-xs text-slate-500 text-center mb-6">
                Tenha dados isolados e gerencie sua operação logística de forma segura
              </p>

              {regError && (
                <div className="p-3.5 bg-red-50 border border-red-100 text-red-700 rounded-xl text-xs flex items-start gap-2 mb-5 leading-relaxed">
                  <AlertTriangle className="w-4.5 h-4.5 shrink-0" />
                  <span>{regError}</span>
                </div>
              )}

              {/* STEP 1: Registration Form */}
              {regStep === 'form' && (
                <>
                  {showTerms ? (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
                        <TermsOfUse />
                        <button onClick={() => setShowTerms(false)} className="mt-4 w-full py-2 bg-slate-200 rounded-lg font-bold">Fechar</button>
                      </div>
                    </div>
                  ) : null}
                  {showPrivacy ? (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
                        <PrivacyPolicy />
                        <button onClick={() => setShowPrivacy(false)} className="mt-4 w-full py-2 bg-slate-200 rounded-lg font-bold">Fechar</button>
                      </div>
                    </div>
                  ) : null}
                  <form onSubmit={handleRegisterCompany} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Nome Fantasia da Empresa *</label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={regCompanyName}
                          onChange={e => setRegCompanyName(e.target.value)}
                          placeholder="Ex: TransLog Brasil"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:outline-emerald-500"
                        />
                        <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">CNPJ da Empresa *</label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={regCnpj}
                          onChange={e => handleCnpjChange(e.target.value)}
                          placeholder="00.000.000/0001-00"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:outline-emerald-500"
                        />
                        <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800 my-2 pt-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-3">Dados do Responsável</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Nome do Responsável *</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={regResponsibleName}
                        onChange={e => setRegResponsibleName(e.target.value)}
                        placeholder="Ex: Carlos Alberto Ferreira"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:outline-emerald-500"
                      />
                      <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">E-mail de Contato *</label>
                      <div className="relative">
                        <input
                          type="email"
                          required
                          value={regEmail}
                          onChange={e => setRegEmail(e.target.value)}
                          placeholder="Ex: responsavel@email.com"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:outline-emerald-500"
                        />
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Celular (WhatsApp) *</label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={regPhone}
                          onChange={e => handlePhoneChange(e.target.value, setRegPhone)}
                          placeholder="(17) 99999-9999"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:outline-emerald-500"
                        />
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Senha de Acesso *</label>
                      <div className="relative">
                        <input
                          type="password"
                          required
                          value={regPassword}
                          onChange={e => setRegPassword(e.target.value)}
                          placeholder="Mínimo 6 caracteres"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:outline-emerald-500"
                        />
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Confirmação de Senha *</label>
                      <div className="relative">
                        <input
                          type="password"
                          required
                          value={regConfirmPassword}
                          onChange={e => setRegConfirmPassword(e.target.value)}
                          placeholder="Repita sua senha"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:outline-emerald-500"
                        />
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <input 
                        type="checkbox" 
                        required
                        checked={regTermsAccepted} 
                        onChange={e => setRegTermsAccepted(e.target.checked)}
                        className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Li e concordo com os <button type="button" onClick={() => setShowTerms(true)} className="text-emerald-600 hover:underline font-bold">Termos de Uso</button></span>
                    </label>
                    <label className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <input 
                        type="checkbox" 
                        required
                        checked={regPrivacyAccepted} 
                        onChange={e => setRegPrivacyAccepted(e.target.checked)}
                        className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Li e concordo com a <button type="button" onClick={() => setShowPrivacy(true)} className="text-emerald-600 hover:underline font-bold">Política de Privacidade</button></span>
                    </label>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={regLoading}
                      className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md cursor-pointer disabled:opacity-50"
                    >
                      {regLoading ? 'Processando Cadastro...' : 'Enviar Cadastro de Empresa'}
                    </button>
                  </div>
                </form>
                </>
              )}

              {/* STEP 2: Verification of registration */}
              {regStep === 'verify' && (
                <form onSubmit={handleVerifyRegistration} className="space-y-4">
                  <div className="text-center space-y-2 mb-6">
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Enviamos um código de segurança de 6 dígitos para o e-mail <strong>{regEmail}</strong> e WhatsApp <strong>{regPhone}</strong> do responsável. Insira-o abaixo para confirmar o cadastro da sua empresa.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 text-center">Código de Verificação de Cadastro</label>
                    <div className="relative">
                      <input
                        type="text"
                        maxLength={6}
                        required
                        value={regOtpCode}
                        onChange={e => setRegOtpCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="Digite o código de 6 dígitos"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm text-center font-mono tracking-widest focus:outline-emerald-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={regLoading}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {regLoading ? 'Verificando...' : 'Confirmar e Concluir Verificação'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegStep('form')}
                    className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
                  >
                    Voltar para o Formulário
                  </button>
                </form>
              )}

              {/* STEP 3: Verification Success & Pending Approval Display */}
              {regStep === 'success' && (
                <div className="text-center py-6 space-y-6">
                  <div className="w-16 h-16 bg-amber-50 border border-amber-200 rounded-full flex items-center justify-center mx-auto text-amber-600 shadow-md">
                    <AlertTriangle className="w-10 h-10" />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Cadastro Verificado com Sucesso!</h3>
                    <p className="text-emerald-600 font-bold text-sm">✓ E-mail e WhatsApp confirmados.</p>
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-md mx-auto">
                    Por motivos de segurança e para garantir o isolamento da arquitetura Multi-Tenant, <strong>sua conta foi registrada no estado pendente</strong>. 
                  </p>

                  <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl text-left max-w-md mx-auto text-amber-800 text-xs space-y-1.5 leading-relaxed">
                    <span className="font-bold block text-sm">⏳ Status: Aguardando Aprovação</span>
                    <span>Nossa equipe de Super Administradores foi notificada. Seu cadastro será revisado e liberado em breve. Você receberá um e-mail de confirmação assim que puder acessar a plataforma.</span>
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={() => setActiveSubTab('inicio')}
                      className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition-colors cursor-pointer"
                    >
                      Voltar ao Início
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Institutional Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Elo Log • Gestão Logística Integrada © 2026</span>
          <span className="font-mono text-[10px] text-slate-400">Plataforma SaaS Segura • Conectividade Offline Garantida</span>
        </div>
      </footer>
    </div>
  );
};
