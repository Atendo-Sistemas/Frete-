import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { RoleBadge } from '../common/Badge';
import { registerPushNotifications, testPushNotification } from '../../services/pushClient';
import { 
  Truck, 
  Building2, 
  Bell, 
  CheckCheck, 
  Layers, 
  Users, 
  FileText, 
  ShieldCheck, 
  History, 
  SlidersHorizontal,
  ChevronDown,
  Menu,
  X,
  Radio,
  Send
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenCreateFreight?: () => void;
  onOpenRegisterDriver?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  activeTab, 
  setActiveTab, 
  onOpenCreateFreight,
  onOpenRegisterDriver
}) => {
  const { user, tenant, driver, notifications, unreadCount, markNotificationAsRead, markAllNotificationsAsRead } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [pushStatus, setPushStatus] = useState<string | null>(null);
  const [pushLoading, setPushLoading] = useState(false);

  const handleEnablePush = async () => {
    setPushLoading(true);
    setPushStatus(null);
    const res = await registerPushNotifications();
    setPushLoading(false);
    setPushStatus(res.message);
  };

  const handleTestPush = async () => {
    setPushLoading(true);
    setPushStatus(null);
    const res = await testPushNotification();
    setPushLoading(false);
    setPushStatus(res.message);
  };

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isDriver = user?.role === 'MOTORISTA';
  const isCompanyStaff = !isDriver && !isSuperAdmin;

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Tenant Name */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setActiveTab(isDriver ? 'driver-portal' : 'freights')}
              className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white block leading-tight">
                  FreteFácil <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">SaaS</span>
                </span>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block truncate max-w-[200px] sm:max-w-xs">
                  {isSuperAdmin ? '🌐 Painel Global Multi-Tenant' : (tenant?.name || 'Portal de Fretes')}
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {isDriver ? (
              <>
                <button
                  onClick={() => setActiveTab('driver-portal')}
                  className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                    activeTab === 'driver-portal'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  🚚 Fretes Disponíveis & Meus Fretes
                </button>
                <button
                  onClick={() => setActiveTab('driver-profile')}
                  className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                    activeTab === 'driver-profile'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  👤 Meu Perfil & Veículos
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setActiveTab('freights')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    activeTab === 'freights'
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  Fretes
                </button>
                <button
                  onClick={() => setActiveTab('drivers')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    activeTab === 'drivers'
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  Motoristas
                </button>
                <button
                  onClick={() => setActiveTab('forms')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    activeTab === 'forms'
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  Formulários & Checklists
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    activeTab === 'users'
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  Usuários
                </button>
                <button
                  onClick={() => setActiveTab('audit')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    activeTab === 'audit'
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  Auditoria
                </button>

                {isSuperAdmin && (
                  <button
                    onClick={() => setActiveTab('saas-tenants')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                      activeTab === 'saas-tenants'
                        ? 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300'
                        : 'text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40'
                    }`}
                  >
                    👑 Empresas SaaS
                  </button>
                )}
              </>
            )}
          </nav>

          {/* Right Action Area */}
          <div className="flex items-center gap-2.5">
            
            {/* Quick Action Button for Company */}
            {isCompanyStaff && onOpenCreateFreight && (
              <button
                id="btn-navbar-new-freight"
                onClick={onOpenCreateFreight}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-semibold text-xs text-white bg-emerald-600 hover:bg-emerald-700 active:scale-98 transition-all shadow-xs cursor-pointer"
              >
                <span>+ Novo Frete</span>
              </button>
            )}

            {/* Notification Bell with Dropdown */}
            <div className="relative">
              <button
                id="btn-notification-bell"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Notificações"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">Notificações</span>
                      {unreadCount > 0 && (
                        <span className="text-xs bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 px-1.5 py-0.5 rounded-full font-medium">
                          {unreadCount} novas
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllNotificationsAsRead}
                        className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        Marcar todas lidas
                      </button>
                    )}
                  </div>

                  {/* Web Push Banner */}
                  <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/30 border-b border-emerald-100 dark:border-emerald-900/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 dark:text-emerald-200">
                        <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
                        <span>Notificações Push em Tempo Real</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-1">
                      Receba alertas instantâneos de novos fretes diretamente no seu navegador.
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        disabled={pushLoading}
                        onClick={handleEnablePush}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        {pushLoading ? 'Ativando...' : 'Ativar Push'}
                      </button>
                      <button
                        disabled={pushLoading}
                        onClick={handleTestPush}
                        className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded text-[11px] font-medium cursor-pointer disabled:opacity-50 flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" /> Testar
                      </button>
                    </div>
                    {pushStatus && (
                      <p className="text-[10px] text-emerald-800 dark:text-emerald-300 font-medium mt-1.5">
                        {pushStatus}
                      </p>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs">
                        Nenhuma notificação no momento.
                      </div>
                    ) : (
                      notifications.slice(0, 10).map((n) => (
                        <div
                          key={n.id}
                          onClick={() => markNotificationAsRead(n.id)}
                          className={`p-3.5 transition-colors cursor-pointer ${
                            n.read 
                              ? 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50' 
                              : 'bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug">
                              {n.title}
                            </p>
                            {!n.read && <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1"></span>}
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                            {n.message}
                          </p>
                          <span className="text-[10px] text-slate-400 mt-2 block">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(n.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Pill */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-200">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="hidden lg:block text-left">
                <span className="text-xs font-semibold text-slate-900 dark:text-white block leading-tight truncate max-w-[130px]">
                  {user?.name}
                </span>
                {user && <RoleBadge role={user.role} />}
              </div>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {showMobileMenu && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-2 pb-4 space-y-1">
          {isDriver ? (
            <>
              <button
                onClick={() => { setActiveTab('driver-portal'); setShowMobileMenu(false); }}
                className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                🚚 Fretes & Meus Fretes
              </button>
              <button
                onClick={() => { setActiveTab('driver-profile'); setShowMobileMenu(false); }}
                className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                👤 Meu Perfil & Veículos
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => { setActiveTab('freights'); setShowMobileMenu(false); }}
                className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                📦 Fretes
              </button>
              <button
                onClick={() => { setActiveTab('drivers'); setShowMobileMenu(false); }}
                className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                🚛 Motoristas
              </button>
              <button
                onClick={() => { setActiveTab('forms'); setShowMobileMenu(false); }}
                className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                📝 Formulários & Checklists
              </button>
              <button
                onClick={() => { setActiveTab('users'); setShowMobileMenu(false); }}
                className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                👥 Usuários da Empresa
              </button>
              <button
                onClick={() => { setActiveTab('audit'); setShowMobileMenu(false); }}
                className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                🛡️ Logs de Auditoria
              </button>
              {isSuperAdmin && (
                <button
                  onClick={() => { setActiveTab('saas-tenants'); setShowMobileMenu(false); }}
                  className="w-full text-left px-3 py-2 rounded-md text-sm font-bold text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950"
                >
                  👑 Gestão de Empresas SaaS
                </button>
              )}
            </>
          )}
        </div>
      )}
    </header>
  );
};
