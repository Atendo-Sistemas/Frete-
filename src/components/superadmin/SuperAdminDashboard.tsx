import React, { useState, useEffect } from 'react';
import { Tenant } from '../../types';
import { api } from '../../services/api';
import { Building2, Shield, Plus, CheckCircle, TrendingUp, Users, Truck, DollarSign } from 'lucide-react';

export const SuperAdminDashboard: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const list = await api.getTenants();
        setTenants(list);
      } catch (err) {
        console.error('Erro ao carregar tenants:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-950 p-6 rounded-2xl text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-200 border border-purple-400/30">
              SaaS Multi-Tenant Global Control
            </span>
            <h1 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">
              Painel do Super Administrador
            </h1>
            <p className="text-xs sm:text-sm text-purple-200/80 mt-1">
              Visão macro de todas as transportadoras contratantes, isolamento de dados e faturamento global.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 text-right">
            <span className="text-[10px] uppercase tracking-wider text-purple-200 font-bold block">Tenants Ativos</span>
            <span className="text-2xl font-black text-white">{tenants.length} empresas</span>
          </div>
        </div>
      </div>

      {/* Tenants Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tenants.map(t => (
          <div
            key={t.id}
            className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 flex items-center justify-center font-bold text-lg">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{t.name}</h3>
                  <p className="text-xs text-slate-500 font-mono">CNPJ: {t.cnpj}</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                {t.plan}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <span className="text-slate-400 block font-semibold text-[10px] uppercase">ID / Tenant Scope</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200 truncate block">{t.id}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <span className="text-slate-400 block font-semibold text-[10px] uppercase">Isolamento DB</span>
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Ativo ({t.status})
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
