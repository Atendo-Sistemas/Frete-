import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Freight, FreightStatus, VehicleType } from '../../types';
import { api } from '../../services/api';
import { StatusBadge, VehicleBadge } from '../common/Badge';
import { FreightFormModal } from '../freight/FreightFormModal';
import { FreightDetailModal } from '../freight/FreightDetailModal';
import { WhatsAppConfigModal } from '../common/WhatsAppConfigModal';
import { 
  Truck, 
  Package, 
  Search, 
  Filter, 
  Plus, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  ArrowUpDown,
  RefreshCw,
  UserCheck,
  MessageCircle,
  Trash2,
  Pencil
} from 'lucide-react';

export const CompanyDashboard: React.FC = () => {
  const { user, tenant } = useAuth();
  const [freights, setFreights] = useState<Freight[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchCity, setSearchCity] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState<string>('ALL');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingFreight, setEditingFreight] = useState<Freight | null>(null);
  const [selectedFreight, setSelectedFreight] = useState<Freight | null>(null);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);

  const fetchFreights = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getFreights();
      setFreights(data);
    } catch (err) {
      console.error('Erro ao carregar fretes:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFreights();
  }, [fetchFreights]);

  const handleDeleteFreight = async (id: string, code: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o frete ${code}?`)) return;
    try {
      await api.deleteFreight(id);
      setFreights(prev => prev.filter(f => f.id !== id));
      if (selectedFreight?.id === id) {
        setSelectedFreight(null);
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir frete');
    }
  };

  // Compute summary stats
  const totalFreights = freights.length;
  const availableCount = freights.filter(f => ['PUBLICADO', 'DISPONIVEL'].includes(f.status)).length;
  const reservedCount = freights.filter(f => f.status === 'RESERVADO').length;
  const inProgressCount = freights.filter(f => ['EM_COLETA', 'COLETADO', 'EM_TRANSITO'].includes(f.status)).length;
  const completedCount = freights.filter(f => ['ENTREGUE', 'FINALIZADO'].includes(f.status)).length;
  const totalValue = freights.reduce((acc, f) => acc + (f.payment?.price || 0), 0);

  // Filtered freights
  const filteredFreights = freights.filter(f => {
    if (statusFilter !== 'ALL' && f.status !== statusFilter) return false;
    if (vehicleFilter !== 'ALL' && f.requirements.vehicleType !== vehicleFilter) return false;
    if (searchCity) {
      const term = searchCity.toLowerCase();
      const matchOrigin = f.origin.city.toLowerCase().includes(term) || f.origin.state.toLowerCase().includes(term);
      const matchDest = f.destination.city.toLowerCase().includes(term) || f.destination.state.toLowerCase().includes(term);
      const matchCode = f.code.toLowerCase().includes(term);
      const matchDriver = (f.assignedDriverName || '').toLowerCase().includes(term);
      if (!matchOrigin && !matchDest && !matchCode && !matchDriver) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <span>Gestão Operacional de Fretes</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Empresa: <strong className="text-slate-800 dark:text-slate-200">{tenant?.name || 'TransLog Brasil'}</strong> • {totalFreights} fretes cadastrados
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchFreights}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Atualizar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {user?.role === 'SUPER_ADMIN' && (
            <button
              onClick={() => setIsWhatsAppModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 font-semibold text-xs sm:text-sm transition-colors cursor-pointer flex items-center gap-1.5"
              title="Configurar e testar API de WhatsApp / Canal"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>WhatsApp API</span>
            </button>
          )}
          
          <button
            id="btn-create-new-freight-main"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Novo Frete</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Geral</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white block mt-1">{totalFreights}</span>
          <span className="text-[11px] text-slate-500 font-medium">cadastros</span>
        </div>

        <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 block">Disponíveis</span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 block mt-1">{availableCount}</span>
          <span className="text-[11px] text-emerald-600/70 font-medium">aguardando motorista</span>
        </div>

        <div className="bg-amber-50/50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-100 dark:border-amber-900/30 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 block">Reservados</span>
          <span className="text-2xl font-black text-amber-600 dark:text-amber-400 block mt-1">{reservedCount}</span>
          <span className="text-[11px] text-amber-600/70 font-medium">motorista aceitou</span>
        </div>

        <div className="bg-blue-50/50 dark:bg-blue-950/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 block">Em Trânsito</span>
          <span className="text-2xl font-black text-blue-600 dark:text-blue-400 block mt-1">{inProgressCount}</span>
          <span className="text-[11px] text-blue-600/70 font-medium">em rota de entrega</span>
        </div>

        <div className="bg-teal-50/50 dark:bg-teal-950/20 p-4 rounded-xl border border-teal-100 dark:border-teal-900/30 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300 block">Concluídos</span>
          <span className="text-2xl font-black text-teal-600 dark:text-teal-400 block mt-1">{completedCount}</span>
          <span className="text-[11px] text-teal-600/70 font-medium">entregas finalizadas</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">Faturamento Fretes</span>
          <span className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 block mt-1 truncate">
            R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">valor total operado</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por cidade, código #FRT ou motorista..."
            value={searchCity}
            onChange={e => setSearchCity(e.target.value)}
            className="w-full bg-transparent text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <option value="ALL">Todos os Status</option>
            <option value="DISPONIVEL">Disponível</option>
            <option value="RESERVADO">Reservado</option>
            <option value="EM_COLETA">Em Coleta</option>
            <option value="EM_TRANSITO">Em Trânsito</option>
            <option value="ENTREGUE">Entregue</option>
            <option value="FINALIZADO">Finalizado</option>
            <option value="CANCELADO">Cancelado</option>
          </select>

          {/* Vehicle Filter */}
          <select
            value={vehicleFilter}
            onChange={e => setVehicleFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <option value="ALL">Todos os Veículos</option>
            <option value="TRUCK">Truck</option>
            <option value="TOCO">Toco</option>
            <option value="CARRETA">Carreta</option>
            <option value="BITREM">Bitrem</option>
            <option value="VUC">VUC</option>
            <option value="FIORINO">Fiorino</option>
          </select>
        </div>
      </div>

      {/* Main Freights Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Código</th>
                <th className="py-3.5 px-4">Rota (Origem ➡️ Destino)</th>
                <th className="py-3.5 px-4">Data Coleta</th>
                <th className="py-3.5 px-4">Veículo / Carga</th>
                <th className="py-3.5 px-4">Valor (R$)</th>
                <th className="py-3.5 px-4">Motorista Vinculado</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredFreights.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Nenhum frete encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredFreights.map((freight) => (
                  <tr 
                    key={freight.id} 
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                      {freight.code}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {freight.origin.city}/{freight.origin.state} ➡️ {freight.destination.city}/{freight.destination.state}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {freight.distanceKm} km aprox.
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                      {new Date(freight.origin.date).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1">
                        <VehicleBadge type={freight.requirements.vehicleType} />
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[150px]">
                        {(freight.cargo.weightKg / 1000).toFixed(1)}t • {freight.cargo.description}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-black text-emerald-600 dark:text-emerald-400">
                      R$ {freight.payment.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3.5 px-4">
                      {freight.assignedDriverId ? (
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">{freight.assignedDriverName}</span>
                            <span className="text-[11px] text-slate-500">{freight.assignedVehiclePlate}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Disponível / Aberto</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={freight.status} />
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedFreight(freight)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer inline-flex items-center gap-1 font-semibold text-xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver</span>
                        </button>
                        {['RASCUNHO', 'PUBLICADO', 'DISPONIVEL'].includes(freight.status) && (
                          <button
                            onClick={() => setEditingFreight(freight)}
                            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 transition-colors cursor-pointer"
                            title="Editar frete"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteFreight(freight.id, freight.code)}
                          className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 transition-colors cursor-pointer"
                          title="Excluir frete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Freight Modal */}
      <FreightFormModal
        isOpen={isCreateModalOpen || editingFreight !== null}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingFreight(null);
        }}
        freightToEdit={editingFreight}
        onSuccess={(saved) => {
          setFreights(prev => {
            const exists = prev.some(f => f.id === saved.id);
            if (exists) {
              return prev.map(f => f.id === saved.id ? saved : f);
            }
            return [saved, ...prev];
          });
          setEditingFreight(null);
        }}
      />

      {/* Detail Freight Modal */}
      {selectedFreight && (
        <FreightDetailModal
          freight={selectedFreight}
          isAdmin={true}
          onClose={() => setSelectedFreight(null)}
          onEdit={(f) => setEditingFreight(f)}
          onUpdateSuccess={(updated) => {
            setFreights(prev => prev.map(f => f.id === updated.id ? updated : f));
            setSelectedFreight(updated);
          }}
          onDeleteSuccess={(id) => {
            setFreights(prev => prev.filter(f => f.id !== id));
            setSelectedFreight(null);
          }}
        />
      )}

      {/* WhatsApp Gateway Config & Test Modal */}
      <WhatsAppConfigModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
      />

    </div>
  );
};
