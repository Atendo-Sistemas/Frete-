import React, { useState } from 'react';
import { Freight, FreightStatus, FormResponse } from '../../types';
import { StatusBadge, VehicleBadge } from '../common/Badge';
import { LiveRouteTrackingModal } from '../tracking/LiveRouteTrackingModal';
import { TripExpenseModal } from '../expenses/TripExpenseModal';
import { api } from '../../services/api';
import { 
  Truck, 
  MapPin, 
  Calendar, 
  DollarSign, 
  User, 
  Phone, 
  Clock, 
  CheckCircle2, 
  FileText, 
  ShieldCheck, 
  X, 
  ChevronRight,
  AlertCircle,
  Car,
  Trash2,
  Pencil,
  Navigation,
  Receipt
} from 'lucide-react';

interface FreightDetailModalProps {
  freight: Freight | null;
  onClose: () => void;
  onUpdateSuccess?: (updated: Freight) => void;
  onDeleteSuccess?: (id: string) => void;
  onEdit?: (freight: Freight) => void;
  onOpenFormModal?: (formId: string, freightId?: string) => void;
  isAdmin?: boolean;
}

export const FreightDetailModal: React.FC<FreightDetailModalProps> = ({ 
  freight, 
  onClose, 
  onUpdateSuccess,
  onDeleteSuccess,
  onEdit,
  onOpenFormModal,
  isAdmin = false 
}) => {
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [formResponses, setFormResponses] = useState<FormResponse[]>([]);
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);

  if (!freight) return null;

  const handleAdminStatusChange = async (newStatus: FreightStatus) => {
    setUpdatingStatus(true);
    try {
      const updated = await api.updateFreightStatus(freight.id, newStatus, `Alterado via painel administrativo`);
      if (onUpdateSuccess) onUpdateSuccess(updated);
    } catch (err: any) {
      alert(err.message || 'Erro ao alterar status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDeleteFreight = async () => {
    if (!window.confirm(`Tem certeza que deseja excluir o frete ${freight.code}?`)) return;
    try {
      await api.deleteFreight(freight.id);
      if (onDeleteSuccess) onDeleteSuccess(freight.id);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir frete');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Frete #{freight.code}</h2>
                <StatusBadge status={freight.status} />
                {freight.operationType === 'LOGISTICA_VEICULOS' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                    LOGÍSTICA DE VEÍCULOS
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Criado por {freight.createdByName} em {new Date(freight.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsExpenseOpen(true)}
              className="py-1.5 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              title="Prestação de Contas & Despesas da Viagem"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">💰 Despesas</span>
            </button>
            <button
              type="button"
              onClick={() => setIsTrackingOpen(true)}
              className="py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              title="Abrir Rastreamento do Trajeto no Mapa em Tempo Real"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">🛰️ Rastreamento GPS</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Assigned Driver Card (If Reserved/In Transit/Completed) */}
        {freight.assignedDriverId ? (
          <div className="bg-emerald-50/70 dark:bg-emerald-950/30 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                <User className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block">
                  Motorista Vinculado (Confirmado)
                </span>
                <p className="text-base font-extrabold text-slate-900 dark:text-white">{freight.assignedDriverName}</p>
                <p className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2 mt-0.5">
                  <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {freight.assignedDriverPhone}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                    <Car className="w-3.5 h-3.5" /> Placa: {freight.assignedVehiclePlate} ({freight.assignedVehicleModel})
                  </span>
                </p>
              </div>
            </div>

            <div className="text-right sm:border-l sm:border-emerald-200 dark:sm:border-emerald-800/60 sm:pl-4">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Aceito em</span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {freight.assignedAt ? new Date(freight.assignedAt).toLocaleString() : 'Recentemente'}
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Aguardando aceite de motorista elegível na plataforma.
            </p>
          </div>
        )}

        {/* Route Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> Origem / Coleta
            </span>
            <p className="text-base font-extrabold text-slate-900 dark:text-white">
              {freight.origin.city}/{freight.origin.state}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {freight.origin.address}, nº {freight.origin.number}
            </p>
            <p className="text-xs text-slate-500">
              CEP: {freight.origin.zipCode} • Data: {new Date(freight.origin.date).toLocaleDateString()} ({freight.origin.timeWindow})
            </p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> Destino / Entrega
            </span>
            <p className="text-base font-extrabold text-slate-900 dark:text-white">
              {freight.destination.city}/{freight.destination.state}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {freight.destination.address}, nº {freight.destination.number}
            </p>
            <p className="text-xs text-slate-500">
              CEP: {freight.destination.zipCode} • Previsão: {new Date(freight.destination.date).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Cargo & Requirements & Payment */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 uppercase font-bold text-[10px]">Carga</span>
            <p className="font-bold text-slate-800 dark:text-slate-200 mt-1">{freight.cargo.description}</p>
            <p className="text-slate-500">{freight.cargo.weightKg} kg • {freight.cargo.volumeCount} volumes</p>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 uppercase font-bold text-[10px]">Veículo Necessário</span>
            <div className="mt-1 flex items-center gap-1.5 flex-wrap">
              <VehicleBadge type={freight.requirements.vehicleType} />
              {freight.requirements.vehicleBrand && (
                <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold text-[11px]">
                  {freight.requirements.vehicleBrand}
                </span>
              )}
              <span className="text-slate-600 dark:text-slate-300">{freight.requirements.bodyTypeRequired}</span>
            </div>
            <p className="text-slate-500 mt-1">Capacidade mín: {freight.requirements.minCapacityKg} kg</p>
          </div>

          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
            {freight.operationType === 'LOGISTICA_VEICULOS' ? (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-emerald-800 dark:text-emerald-300 uppercase font-bold text-[10px]">NF ao Cliente</span>
                  <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                    R$ {(freight.payment.clientRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <span className="text-orange-800 dark:text-orange-300 uppercase font-bold text-[10px]">Repasse Motorista</span>
                  <p className="text-sm font-black text-orange-600 dark:text-orange-400 mt-0.5">
                    R$ {(freight.payment.driverCost || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            ) : (
              <>
                <span className="text-emerald-800 dark:text-emerald-300 uppercase font-bold text-[10px]">Valor do Frete</span>
                <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                  R$ {freight.payment.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </>
            )}
            <p className="text-slate-500 text-xs mt-1">Pgto: {freight.payment.paymentMethod}</p>
          </div>
        </div>

        {/* Detalhes do Veículo Transportado (Liberado após aceite) */}
        {freight.cargo.type === 'VEICULO' && freight.status !== 'PUBLISHED' && freight.status !== 'DRAFT' && (
          <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800/30">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300 flex items-center gap-1.5 mb-3">
              <Car className="w-4 h-4 text-blue-600" /> Detalhes do Veículo Transportado
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block font-semibold mb-0.5">Produto Veículo</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{freight.cargo.vehicleProduct || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 block font-semibold mb-0.5">Chassi</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{freight.cargo.chassis || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 block font-semibold mb-0.5">Status Rastreador</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{freight.cargo.trackerStatus || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 block font-semibold mb-0.5">NF Venda Veículo</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{freight.cargo.nfVehicleSale || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 block font-semibold mb-0.5">NF Venda Facchini</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{freight.cargo.nfFacchini || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 block font-semibold mb-0.5">Placas</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{freight.cargo.platesStatus || '-'}</span>
              </div>
            </div>
          </div>
        )}

        {/* State Machine Status History Timeline */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-emerald-600" /> Histórico de Transições de Status
          </h3>

          <div className="relative pl-6 space-y-4 border-l-2 border-slate-200 dark:border-slate-700 ml-3">
            {freight.statusHistory.map((entry, index) => (
              <div key={index} className="relative">
                <span className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-slate-900"></span>
                <div className="flex items-center gap-2">
                  <StatusBadge status={entry.status} />
                  <span className="text-xs text-slate-400">
                    {new Date(entry.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 mt-1">
                  {entry.notes || `Transição para ${entry.status}`}
                </p>
                <p className="text-[11px] text-slate-400">
                  Por: {entry.changedByName}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Administrator Quick Actions */}
        {isAdmin && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Ações Rápidas Admin:</span>
              {freight.status === 'RASCUNHO' && (
                <button
                  disabled={updatingStatus}
                  onClick={() => handleAdminStatusChange('DISPONIVEL')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Publicar Frete
                </button>
              )}
              {freight.status === 'ENTREGUE' && (
                <button
                  disabled={updatingStatus}
                  onClick={() => handleAdminStatusChange('FINALIZADO')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Finalizar e Baixar
                </button>
              )}
              {['RASCUNHO', 'PUBLICADO', 'DISPONIVEL'].includes(freight.status) && onEdit && (
                <button
                  disabled={updatingStatus}
                  onClick={() => {
                    onEdit(freight);
                    onClose();
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold cursor-pointer inline-flex items-center gap-1"
                >
                  <Pencil className="w-3.5 h-3.5" /> Editar Frete
                </button>
              )}
              {['RASCUNHO', 'PUBLICADO', 'DISPONIVEL'].includes(freight.status) && (
                <button
                  disabled={updatingStatus}
                  onClick={() => handleAdminStatusChange('CANCELADO')}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Cancelar Frete
                </button>
              )}
              <button
                disabled={updatingStatus}
                onClick={handleDeleteFreight}
                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-bold cursor-pointer inline-flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Excluir Frete
              </button>
            </div>

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-200 cursor-pointer"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Live Route Tracking Modal */}
        {isTrackingOpen && (
          <LiveRouteTrackingModal
            freight={freight}
            onClose={() => setIsTrackingOpen(false)}
          />
        )}

        {/* Trip Expense & Accountability Modal */}
        {isExpenseOpen && (
          <TripExpenseModal
            freight={freight}
            isOpen={true}
            onClose={() => setIsExpenseOpen(false)}
          />
        )}

      </div>
    </div>
  );
};
