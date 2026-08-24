import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { VehicleBadge } from '../common/Badge';
import { UserProfileModal } from '../common/UserProfileModal';
import { Truck, User, FileText, Phone, MapPin, Award, Shield, CheckCircle, Plus, Edit3 } from 'lucide-react';

export const DriverProfileView: React.FC = () => {
  const { user, driver, vehicles } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const primaryVehicle = vehicles[0];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      
      {/* Profile Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white text-2xl font-bold shadow-md">
              {driver?.name?.charAt(0) || 'M'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">{driver?.name}</h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  ★ {driver?.rating.toFixed(1) || '5.0'}
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> {driver?.city}/{driver?.state} • {driver?.address}
              </p>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> {driver?.phone} • {driver?.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 cursor-pointer flex items-center gap-1.5 transition-all"
            >
              <Edit3 className="w-4 h-4" />
              <span>Editar Meu Perfil</span>
            </button>
            <div className="hidden sm:flex items-center gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50">
              <Award className="w-6 h-6 text-amber-500" />
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Viagens Concluídas</span>
                <span className="text-base font-black text-slate-900 dark:text-white">{driver?.completedTrips || 0} entregas</span>
              </div>
            </div>
          </div>
        </div>

        {/* Documentation details */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 block uppercase font-bold text-[10px]">CPF / RG</span>
            <p className="font-bold text-slate-800 dark:text-slate-200 mt-1">{driver?.cpf}</p>
            <p className="text-slate-500 text-[11px]">{driver?.rg || 'RG em processo'}</p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 block uppercase font-bold text-[10px]">Habilitação CNH</span>
            <p className="font-bold text-slate-800 dark:text-slate-200 mt-1">Categoria: {driver?.cnhCategory} (CNH: {driver?.cnh})</p>
            <p className="text-slate-500 text-[11px]">Validade: {driver?.cnhExpiresAt ? new Date(driver.cnhExpiresAt).toLocaleDateString() : '2028'}</p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 block uppercase font-bold text-[10px]">Registro RNTRC / ANTT</span>
            <p className="font-bold text-slate-800 dark:text-slate-200 mt-1">RNTRC: {driver?.rntrc || 'Ativo / Regular'}</p>
            <p className="text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Habilitado p/ Cargas
            </p>
          </div>
        </div>
      </div>

      {/* Fleet / Vehicles */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Meus Veículos Cadastrados</h3>
          </div>
          <span className="text-xs text-slate-400">{vehicles.length} veículo(s) ativo(s)</span>
        </div>

        {vehicles.length === 0 ? (
          <p className="text-xs text-slate-400">Nenhum veículo vinculado.</p>
        ) : (
          vehicles.map((v) => (
            <div
              key={v.id}
              className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {v.brand} {v.model} ({v.year})
                  </span>
                  <VehicleBadge type={v.type} />
                </div>
                <p className="text-xs text-slate-500">
                  Placa: <strong className="text-slate-700 dark:text-slate-300">{v.plate}</strong> • Renavam: {v.renavam}
                </p>
                <p className="text-xs text-slate-500">
                  Capacidade: <strong className="text-slate-700 dark:text-slate-300">{(v.capacityKg / 1000).toFixed(1)} ton</strong> • Carroceria: {v.bodyType}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  Ativo e Vistoriado
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Driver Profile Edit Modal */}
      <UserProfileModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
      />

    </div>
  );
};
