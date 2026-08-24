import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Truck, Building2, UserPlus, Users, Sparkles } from 'lucide-react';

interface DemoSwitcherProps {
  onOpenRegisterDriver?: () => void;
}

export const DemoSwitcher: React.FC<DemoSwitcherProps> = ({ onOpenRegisterDriver }) => {
  const { user, switchUser, availableDemoAccounts, loading } = useAuth();

  const presets = [
    {
      id: 'user-superadmin',
      label: 'Super Admin SaaS',
      role: 'SUPER_ADMIN',
      icon: ShieldCheck,
      color: 'bg-purple-600 hover:bg-purple-700 text-white'
    },
    {
      id: 'user-admin-1',
      label: 'Empresa Admin (Mariana)',
      role: 'ADMIN',
      icon: Building2,
      color: 'bg-blue-600 hover:bg-blue-700 text-white'
    },
    {
      id: 'user-driver-joao',
      label: 'Motorista (João - Truck)',
      role: 'MOTORISTA',
      icon: Truck,
      color: 'bg-emerald-600 hover:bg-emerald-700 text-white'
    },
    {
      id: 'user-driver-carlos',
      label: 'Motorista (Carlos - Toco)',
      role: 'MOTORISTA',
      icon: Truck,
      color: 'bg-teal-600 hover:bg-teal-700 text-white'
    },
    {
      id: 'user-supervisor-1',
      label: 'Supervisor (Roberto)',
      role: 'SUPERVISOR',
      icon: Users,
      color: 'bg-amber-600 hover:bg-amber-700 text-white'
    }
  ];

  return (
    <div id="demo-account-switcher" className="w-full max-w-full bg-slate-900 text-slate-200 px-3 py-2 text-xs border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm">
      <div className="flex items-center gap-2 font-medium shrink-0">
        <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
        <span className="text-slate-400 font-semibold tracking-wider uppercase text-[10px]">Alternar Perfil para Teste:</span>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 max-w-full">
        {presets.map(p => {
          const isActive = user?.id === p.id;
          const Icon = p.icon;
          return (
            <button
              id={`switch-to-${p.id}`}
              key={p.id}
              disabled={loading}
              onClick={() => switchUser(p.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all text-xs cursor-pointer shrink-0 ${
                isActive 
                  ? 'ring-2 ring-white/80 font-bold shadow-md ' + p.color
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="whitespace-nowrap">{p.label}</span>
              {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white ml-0.5 animate-ping"></span>}
            </button>
          );
        })}

        {onOpenRegisterDriver && (
          <button
            id="btn-open-register-driver"
            onClick={onOpenRegisterDriver}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md font-medium bg-emerald-700/80 hover:bg-emerald-600 text-emerald-100 border border-emerald-500/40 transition-colors cursor-pointer shrink-0 ml-1"
          >
            <UserPlus className="w-3.5 h-3.5 text-emerald-300" />
            <span className="whitespace-nowrap">+ Novo Motorista</span>
          </button>
        )}
      </div>
    </div>
  );
};
