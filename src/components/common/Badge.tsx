import React from 'react';
import { FreightStatus, UserRole, VehicleType, CargoType } from '../../types';

interface BadgeProps {
  status?: FreightStatus;
  role?: UserRole;
  vehicleType?: VehicleType;
  cargoType?: CargoType;
  customText?: string;
  variant?: 'emerald' | 'blue' | 'amber' | 'purple' | 'slate' | 'rose';
  className?: string;
}

export const StatusBadge: React.FC<{ status: FreightStatus; className?: string }> = ({ status, className = '' }) => {
  const map: Record<FreightStatus, { label: string; bg: string; text: string; dot: string }> = {
    RASCUNHO: { label: 'Rascunho', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300', dot: 'bg-slate-400' },
    PUBLICADO: { label: 'Publicado', bg: 'bg-sky-50 dark:bg-sky-950/50', text: 'text-sky-700 dark:text-sky-300', dot: 'bg-sky-500' },
    DISPONIVEL: { label: 'Disponível', bg: 'bg-emerald-50 dark:bg-emerald-950/50', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500 animate-pulse' },
    RESERVADO: { label: 'Reservado', bg: 'bg-amber-50 dark:bg-amber-950/50', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
    EM_COLETA: { label: 'Em Coleta', bg: 'bg-indigo-50 dark:bg-indigo-950/50', text: 'text-indigo-700 dark:text-indigo-300', dot: 'bg-indigo-500' },
    COLETADO: { label: 'Coletado', bg: 'bg-cyan-50 dark:bg-cyan-950/50', text: 'text-cyan-700 dark:text-cyan-300', dot: 'bg-cyan-500' },
    EM_TRANSITO: { label: 'Em Trânsito', bg: 'bg-blue-50 dark:bg-blue-950/50', text: 'text-blue-700 dark:text-blue-300', dot: 'bg-blue-500 animate-pulse' },
    ENTREGUE: { label: 'Entregue', bg: 'bg-teal-50 dark:bg-teal-950/50', text: 'text-teal-700 dark:text-teal-300', dot: 'bg-teal-500' },
    FINALIZADO: { label: 'Finalizado', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300', dot: 'bg-slate-400' },
    CANCELADO: { label: 'Cancelado', bg: 'bg-rose-50 dark:bg-rose-950/50', text: 'text-rose-700 dark:text-rose-300', dot: 'bg-rose-500' },
  };

  const current = map[status] || { label: status, bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-400' };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide ${current.bg} ${current.text} border border-black/5 dark:border-white/5 ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`}></span>
      <span className="whitespace-nowrap">{current.label}</span>
    </span>
  );
};

export const RoleBadge: React.FC<{ role: UserRole }> = ({ role }) => {
  const map: Record<UserRole, { label: string; bg: string; text: string }> = {
    SUPER_ADMIN: { label: 'Super Admin SaaS', bg: 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300', text: '' },
    EMPRESA_SUPER_ADMIN: { label: 'Diretor / Super Admin', bg: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300', text: '' },
    ADMIN: { label: 'Gerente / Admin', bg: 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300', text: '' },
    SUPERVISOR: { label: 'Supervisor Operacional', bg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300', text: '' },
    USUARIO: { label: 'Operador', bg: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300', text: '' },
    MOTORISTA: { label: 'Motorista Autônomo', bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300', text: '' },
  };

  const item = map[role] || { label: role, bg: 'bg-slate-100 text-slate-800' };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${item.bg}`}>
      {item.label}
    </span>
  );
};

export const VehicleBadge: React.FC<{ type: VehicleType }> = ({ type }) => {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/40">
      🚛 {type}
    </span>
  );
};
