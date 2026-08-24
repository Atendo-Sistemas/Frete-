import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSaaS } from '../../context/SaaSContext';
import { RoleBadge } from '../common/Badge';
import { ThemeToggle } from '../common/ThemeToggle';
import { UserProfileModal } from '../common/UserProfileModal';
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
  Send,
  LogOut,
  User as UserIcon,
  Edit3
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
  const { user, tenant, driver, notifications, unreadCount, markNotificationAsRead, markAllNotificationsAsRead, logout } = useAuth();
  const { config } = useSaaS();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
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
    <header id="navbar-main-container" className="sticky top-0 z-40 w-full max-w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-1 sm:gap-4">
          
          {/* Brand Logo & Tenant Name */}
          <div className="flex items-center gap-2 min-w-0 shrink">
            <button 
              onClick={() => setActiveTab(isDriver ? 'driver-portal' : 'freights')}
              className="flex items-center gap-2 text-left group cursor-pointer focus:outline-none min-w-0"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-sm sm:text-base font-black tracking-tight text-slate-900 dark:text-white block leading-tight uppercase truncate">
                    {config?.layout?.logoText || config?.systemName || 'ELO LOG'}
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-[9px] bg-emerald-50 dark:bg-emerald-950/40 px-1 py-0.5 rounded border border-emerald-200/50 dark:border-emerald-800/50 shrink-0">
                    SaaS
                  </span>
                </div>
                <span className="text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400 block truncate max-w-[100px] sm:max-w-[200px]">
                  {isSuperAdmin ? 'Painel Global' : (tenant?.name || 'Portal de Fretes')}
                </span>
              </div>
            </button>
          </div>


          {/* Right Action Area */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            
            {/* Quick Action Button for Company & Super Admin */}
            {(isCompanyStaff || isSuperAdmin) && onOpenCreateFreight && (
              <button
                id="btn-navbar-new-freight"
                onClick={onOpenCreateFreight}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs text-white bg-emerald-600 hover:bg-emerald-700 active:scale-98 transition-all shadow-xs cursor-pointer"
              >
                <span>+ Novo Frete</span>
              </button>
            )}

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Notification Bell with Dropdown */}
            <div className="relative">
              <button
                id="btn-notification-bell"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center"
                title="Notificações"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover */}
              {showNotifications && (
                <>
                  <div 
                    className="fixed inset-0 z-40 bg-black/20 md:hidden"
                    onClick={() => setShowNotifications(false)}
                  />
                  <div className="fixed inset-x-3 top-18 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-80 md:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
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
                          Marcar todas
                        </button>
                      )}
                    </div>

                    {/* Web Push Banner */}
                    <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/30 border-b border-emerald-100 dark:border-emerald-900/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 dark:text-emerald-200">
                          <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
                          <span>Notificações Push</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-1">
                        Receba alertas instantâneos de novos fretes.
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
                </>
              )}
            </div>

            {/* User Profile Pill - Clickable to edit profile */}
            <button
              onClick={() => setIsProfileOpen(true)}
              className="group flex items-center gap-2 pl-1 sm:pl-2 pr-2 py-1 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all cursor-pointer shrink-0 text-left"
              title="Clique para ver e editar seu perfil"
            >
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-xs shadow-xs group-hover:scale-105 transition-transform shrink-0">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-[7px] text-white">
                  <Edit3 className="w-2 h-2" />
                </span>
              </div>
              <div className="hidden lg:block text-left">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight truncate max-w-[130px] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {user?.name}
                  </span>
                </div>
                {user && <RoleBadge role={user.role} />}
              </div>
            </button>

            {/* Logout button */}
            <button
              onClick={() => {
                logout();
              }}
              className="p-2 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              title="Sair do Sistema"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              type="button"
              className="md:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all cursor-pointer flex items-center justify-center shadow-xs active:scale-95 shrink-0"
              title={showMobileMenu ? 'Fechar Menu' : 'Abrir Menu'}
              aria-label="Menu Principal"
            >
              {showMobileMenu ? <X className="w-5 h-5 text-rose-500" /> : <Menu className="w-5 h-5 text-slate-700 dark:text-slate-200" />}
            </button>

          </div>
        </div>
      </div>

      {/* Secondary Row for Navigation Menu - Placed below the main header row */}
      <div className="hidden md:block border-t border-slate-200/50 dark:border-slate-800/50 bg-slate-50/80 dark:bg-slate-900/40 transition-colors">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2">
          <nav className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {isDriver ? (
              <>
                <button
                  onClick={() => setActiveTab('driver-portal')}
                  className={`px-3 py-1.5 rounded-lg text-xs lg:text-sm font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                    activeTab === 'driver-portal'
                      ? 'bg-emerald-600 text-white font-extrabold shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  🚚 Fretes Disponíveis & Meus Fretes
                </button>
                <button
                  onClick={() => setActiveTab('driver-profile')}
                  className={`px-3 py-1.5 rounded-lg text-xs lg:text-sm font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                    activeTab === 'driver-profile'
                      ? 'bg-emerald-600 text-white font-extrabold shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  👤 Meu Perfil & Veículos
                </button>
                <button
                  onClick={() => setActiveTab('expenses')}
                  className={`px-3 py-1.5 rounded-lg text-xs lg:text-sm font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                    activeTab === 'expenses'
                      ? 'bg-emerald-600 text-white font-extrabold shadow-xs'
                      : 'text-emerald-700 dark:text-emerald-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  💰 Prestação de Contas
                </button>
                <button
                  onClick={() => setActiveTab('help')}
                  className={`px-3 py-1.5 rounded-lg text-xs lg:text-sm font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                    activeTab === 'help'
                      ? 'bg-amber-500 text-white font-extrabold shadow-xs'
                      : 'text-amber-700 dark:text-amber-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  📖 Ajuda
                </button>
              </>
            ) : isSuperAdmin ? (
              <>
                <button
                  onClick={() => setActiveTab('saas-tenants')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs lg:text-sm font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                    activeTab === 'saas-tenants'
                      ? 'bg-purple-600 text-white font-bold shadow-xs'
                      : 'text-purple-700 dark:text-purple-300 hover:bg-slate-200 dark:hover:bg-slate-800/60'
                  }`}
                >
                  👑 Empresas SaaS
                </button>
                <button
                  onClick={() => setActiveTab('saas-config')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs lg:text-sm font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                    activeTab === 'saas-config'
                      ? 'bg-emerald-600 text-white font-bold shadow-xs'
                      : 'text-emerald-700 dark:text-emerald-300 hover:bg-slate-200 dark:hover:bg-slate-800/60'
                  }`}
                >
                  ⚙️ Configurações
                </button>
                <button
                  onClick={() => setActiveTab('freights')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs lg:text-sm font-medium whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                    activeTab === 'freights'
                      ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800/60'
                  }`}
                >
                  Fretes
                </button>
                <button
                  onClick={() => setActiveTab('drivers')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs lg:text-sm font-medium whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                    activeTab === 'drivers'
                      ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800/60'
                  }`}
                >
                  Motoristas
                </button>
                <button
                  onClick={() => setActiveTab('expenses')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs lg:text-sm font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                    activeTab === 'expenses'
                      ? 'bg-emerald-600 text-white font-bold shadow-xs'
                      : 'text-emerald-700 dark:text-emerald-400 hover:bg-slate-200 dark:hover:bg-slate-800/60'
                  }`}
                >
                  💰 Contas
                </button>
                <button
                  onClick={() => setActiveTab('forms')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs lg:text-sm font-medium whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                    activeTab === 'forms'
                      ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800/60'
                  }`}
                >
                  Formulários
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs lg:text-sm font-medium whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                    activeTab === 'users'
                      ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800/60'
                  }`}
                >
                  Usuários
                </button>
                <button
                  onClick={() => setActiveTab('audit')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs lg:text-sm font-medium whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                    activeTab === 'audit'
                      ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800/60'
                  }`}
                >
                  Auditoria
                </button>
                <button
                  onClick={() => setActiveTab('help')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs lg:text-sm font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                    activeTab === 'help'
                      ? 'bg-amber-500 text-white font-semibold shadow-xs'
                      : 'text-amber-700 dark:text-amber-300 hover:bg-slate-200 dark:hover:bg-slate-800/60'
                  }`}
                >
                  📖 Ajuda
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setActiveTab('freights')}
                  className={`px-3 py-1.5 rounded-lg text-xs lg:text-sm font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                    activeTab === 'freights'
                      ? 'bg-emerald-600 text-white font-extrabold shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-250 dark:hover:bg-slate-800/60'
                  }`}
                >
                  Fretes
                </button>
                <button
                  onClick={() => setActiveTab('drivers')}
                  className={`px-3 py-1.5 rounded-lg text-xs lg:text-sm font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                    activeTab === 'drivers'
                      ? 'bg-emerald-600 text-white font-extrabold shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-250 dark:hover:bg-slate-800/60'
                  }`}
                >
                  Motoristas
                </button>
                <button
                  onClick={() => setActiveTab('expenses')}
                  className={`px-3 py-1.5 rounded-lg text-xs lg:text-sm font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                    activeTab === 'expenses'
                      ? 'bg-emerald-600 text-white font-extrabold shadow-xs'
                      : 'text-emerald-700 dark:text-emerald-400 hover:bg-slate-250 dark:hover:bg-slate-800/60'
                  }`}
                >
                  💰 Prestação de Contas
                </button>
                <button
                  onClick={() => setActiveTab('forms')}
                  className={`px-3 py-1.5 rounded-lg text-xs lg:text-sm font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                    activeTab === 'forms'
                      ? 'bg-emerald-600 text-white font-extrabold shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-250 dark:hover:bg-slate-800/60'
                  }`}
                >
                  Formulários & Checklists
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`px-3 py-1.5 rounded-lg text-xs lg:text-sm font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                    activeTab === 'users'
                      ? 'bg-emerald-600 text-white font-extrabold shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-250 dark:hover:bg-slate-800/60'
                  }`}
                >
                  Usuários
                </button>
                <button
                  onClick={() => setActiveTab('audit')}
                  className={`px-3 py-1.5 rounded-lg text-xs lg:text-sm font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                    activeTab === 'audit'
                      ? 'bg-emerald-600 text-white font-extrabold shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-250 dark:hover:bg-slate-800/60'
                  }`}
                >
                  Auditoria
                </button>
                <button
                  onClick={() => setActiveTab('help')}
                  className={`px-3 py-1.5 rounded-lg text-xs lg:text-sm font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                    activeTab === 'help'
                      ? 'bg-amber-500 text-white font-semibold shadow-xs'
                      : 'text-amber-700 dark:text-amber-300 hover:bg-slate-250 dark:hover:bg-slate-800/60'
                  }`}
                >
                  📖 Ajuda
                </button>
              </>
            )}
          </nav>
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
              <button
                onClick={() => { setActiveTab('expenses'); setShowMobileMenu(false); }}
                className="w-full text-left px-3 py-2 rounded-md text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950"
              >
                💰 Prestação de Contas
              </button>
              <button
                onClick={() => { setActiveTab('help'); setShowMobileMenu(false); }}
                className="w-full text-left px-3 py-2 rounded-md text-sm font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950"
              >
                📖 Ajuda
              </button>
            </>
          ) : isSuperAdmin ? (
            <>
              <button
                onClick={() => { setActiveTab('saas-tenants'); setShowMobileMenu(false); }}
                className="w-full text-left px-3 py-2 rounded-md text-sm font-bold text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950"
              >
                👑 Gestão de Empresas SaaS
              </button>
              <button
                onClick={() => { setActiveTab('saas-config'); setShowMobileMenu(false); }}
                className="w-full text-left px-3 py-2 rounded-md text-sm font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950"
              >
                ⚙️ Configurações SaaS
              </button>
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
                onClick={() => { setActiveTab('expenses'); setShowMobileMenu(false); }}
                className="w-full text-left px-3 py-2 rounded-md text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950"
              >
                💰 Prestação de Contas & Despesas
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
                👥 Usuários do Sistema
              </button>
              <button
                onClick={() => { setActiveTab('audit'); setShowMobileMenu(false); }}
                className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                🛡️ Logs de Auditoria
              </button>
              <button
                onClick={() => { setActiveTab('help'); setShowMobileMenu(false); }}
                className="w-full text-left px-3 py-2 rounded-md text-sm font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950"
              >
                📖 Ajuda
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
                onClick={() => { setActiveTab('expenses'); setShowMobileMenu(false); }}
                className="w-full text-left px-3 py-2 rounded-md text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950"
              >
                💰 Prestação de Contas & Despesas
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
              <button
                onClick={() => { setActiveTab('help'); setShowMobileMenu(false); }}
                className="w-full text-left px-3 py-2 rounded-md text-sm font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950"
              >
                📖 Ajuda
              </button>
            </>
          )}

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1">
            <button
              onClick={() => { setIsProfileOpen(true); setShowMobileMenu(false); }}
              className="w-full text-left px-3 py-2 rounded-md text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950 flex items-center gap-2"
            >
              <UserIcon className="w-4 h-4" />
              <span>👤 Meu Perfil (Editar Dados)</span>
            </button>
            <button
              onClick={() => { logout(); setShowMobileMenu(false); }}
              className="w-full text-left px-3 py-2 rounded-md text-sm font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950 flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>🚪 Sair do Sistema</span>
            </button>
          </div>
        </div>
      )}

      {/* Universal User Profile Edit Modal */}
      <UserProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
      />
    </header>
  );
};
