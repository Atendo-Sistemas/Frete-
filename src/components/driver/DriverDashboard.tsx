import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Freight, FreightStatus, FormDefinition } from '../../types';
import { api } from '../../services/api';
import { StatusBadge, VehicleBadge } from '../common/Badge';
import { LiveRouteTrackingModal } from '../tracking/LiveRouteTrackingModal';
import { TripExpenseModal } from '../expenses/TripExpenseModal';
import confetti from 'canvas-confetti';
import { 
  Truck, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Weight, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  Phone, 
  FileText, 
  Navigation, 
  Check, 
  Sparkles,
  AlertCircle,
  X,
  Receipt
} from 'lucide-react';

interface DriverDashboardProps {
  onOpenFormModal?: (formId: string, freightId?: string) => void;
}

export const DriverDashboard: React.FC<DriverDashboardProps> = ({ onOpenFormModal }) => {
  const { user, driver, vehicles, refreshProfile } = useAuth();
  const [freights, setFreights] = useState<Freight[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'available' | 'my-freights' | 'completed'>('available');
  const [selectedFreight, setSelectedFreight] = useState<Freight | null>(null);
  const [trackingFreight, setTrackingFreight] = useState<Freight | null>(null);
  const [expenseModalFreight, setExpenseModalFreight] = useState<Freight | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [acceptMessage, setAcceptMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);

  // Offline-First status and queue state
  const [offline, setOffline] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const primaryVehicle = vehicles[0];

  const updateOfflineStatus = useCallback(() => {
    const isOff = (api as any).isOfflineMode ? (api as any).isOfflineMode() : !navigator.onLine;
    const queue = (api as any).getOfflineQueue ? (api as any).getOfflineQueue() : [];
    setOffline(isOff);
    setPendingCount(queue.length);
  }, []);

  const handleSyncQueue = useCallback(async () => {
    if (syncing) return;
    setSyncing(true);
    setSyncStatus('Sincronizando vistorias pendentes...');
    try {
      const res = await (api as any).syncOfflineQueue();
      if (res && res.syncedCount > 0) {
        setSyncStatus(`✓ ${res.syncedCount} vistorias offline sincronizadas com sucesso!`);
        setTimeout(() => setSyncStatus(null), 4000);
      } else {
        setSyncStatus(null);
      }
    } catch (err) {
      console.error('Erro ao sincronizar vistorias offline:', err);
      setSyncStatus('⚠️ Falha ao sincronizar. Tentando novamente em breve.');
      setTimeout(() => setSyncStatus(null), 4000);
    } finally {
      setSyncing(false);
    }
  }, [syncing]);

  useEffect(() => {
    updateOfflineStatus();

    window.addEventListener('online', updateOfflineStatus);
    window.addEventListener('offline', updateOfflineStatus);
    window.addEventListener('elolog_offline_queue_changed', updateOfflineStatus);

    return () => {
      window.removeEventListener('online', updateOfflineStatus);
      window.removeEventListener('offline', updateOfflineStatus);
      window.removeEventListener('elolog_offline_queue_changed', updateOfflineStatus);
    };
  }, [updateOfflineStatus]);

  // Automatic sync when online
  useEffect(() => {
    if (pendingCount > 0 && !offline && !syncing) {
      handleSyncQueue();
    }
  }, [pendingCount, offline, syncing, handleSyncQueue]);

  const toggleSimulateOffline = () => {
    const nextVal = !offline;
    if ((api as any).setSimulatedOffline) {
      (api as any).setSimulatedOffline(nextVal);
    } else {
      localStorage.setItem('elolog_simulate_offline', nextVal ? 'true' : 'false');
      window.dispatchEvent(new Event('elolog_offline_queue_changed'));
    }
  };

  const fetchFreights = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getFreights();
      setFreights(data);
    } catch (err) {
      console.error('Erro ao carregar fretes do motorista:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFreights();
  }, [fetchFreights]);

  // Handle atomic freight acceptance
  const handleAcceptFreight = async (freight: Freight) => {
    setIsAccepting(true);
    setAcceptMessage(null);
    try {
      const response = await api.acceptFreight(freight.id);
      
      // Celebrate with confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      setAcceptMessage({
        type: 'success',
        text: 'Frete aceito com sucesso! O administrador já foi notificado.'
      });

      // Update local state
      setFreights(prev => prev.map(f => f.id === freight.id ? response.freight : f));
      setSelectedFreight(response.freight);
      
      setTimeout(() => {
        setActiveTab('my-freights');
      }, 1200);

    } catch (err: any) {
      setAcceptMessage({
        type: 'error',
        text: err.message || 'Não foi possível aceitar o frete. Ele pode ter sido reservado por outro motorista.'
      });
    } finally {
      setIsAccepting(false);
    }
  };

  // Handle status update (EM_COLETA -> COLETADO -> EM_TRANSITO -> ENTREGUE)
  const handleUpdateStatus = async (freightId: string, newStatus: FreightStatus) => {
    try {
      setStatusUpdating(freightId);
      const updated = await api.updateFreightStatus(freightId, newStatus, `Atualizado pelo motorista ${driver?.name}`);
      setFreights(prev => prev.map(f => f.id === freightId ? updated : f));
      if (selectedFreight?.id === freightId) {
        setSelectedFreight(updated);
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar status do frete');
    } finally {
      setStatusUpdating(null);
    }
  };

  // Categorize freights
  const availableList = freights.filter(f => ['DISPONIVEL', 'PUBLICADO'].includes(f.status));
  const myActiveList = freights.filter(f => f.assignedDriverId === driver?.id && ['RESERVADO', 'EM_COLETA', 'COLETADO', 'EM_TRANSITO'].includes(f.status));
  const myCompletedList = freights.filter(f => f.assignedDriverId === driver?.id && ['ENTREGUE', 'FINALIZADO'].includes(f.status));

  // Compute metrics
  const totalEarned = myCompletedList.reduce((sum, f) => sum + (f.payment.price || 0), 0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      
      {/* Mobile-First Greeting Header */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-semibold mb-2 backdrop-blur-xs border border-emerald-400/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Motorista Conectado • {driver?.city}/{driver?.state}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Olá, {driver?.name?.split(' ')[0] || 'Motorista'}! 🚚
            </h1>
            <p className="text-emerald-100/80 text-xs sm:text-sm mt-1">
              Veículo Ativo: <strong className="text-white">{primaryVehicle ? `${primaryVehicle.brand} ${primaryVehicle.model} (${primaryVehicle.plate}) - ${primaryVehicle.type}` : 'Truck Padrão'}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10">
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider text-emerald-200 block font-semibold">Total Realizado</span>
              <span className="text-base sm:text-lg font-black text-white">
                R$ {totalEarned.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/30 flex items-center justify-center text-emerald-300 font-bold">
              {driver?.completedTrips || 0}
            </div>
          </div>
        </div>
      </div>

      {/* PWA Offline-First Status Controller */}
      <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className={`p-2.5 rounded-xl ${offline ? 'bg-amber-100 dark:bg-amber-950 text-amber-700' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700'}`}>
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                PWA Offline-First Ativo
              </span>
              <span className={`inline-block w-2 h-2 rounded-full ${offline ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`}></span>
            </div>
            <p className="text-[11px] text-slate-500">
              {offline 
                ? 'Você está operando em modo OFFLINE. Vistorias serão salvas localmente.' 
                : 'Sinal OK! Sincronização automática de dados habilitada.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {/* Offline simulator toggle button */}
          <button
            onClick={toggleSimulateOffline}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
              offline 
                ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' 
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700'
            }`}
          >
            {offline ? '⚡ Restaurar Sinal' : '🔌 Simular Sem Sinal'}
          </button>
        </div>
      </div>

      {/* Pending Sync Banner */}
      {pendingCount > 0 && (
        <div className="bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">📥</span>
            <div>
              <p className="text-xs font-extrabold text-amber-800 dark:text-amber-300">
                Vistorias Salvas Localmente ({pendingCount})
              </p>
              <p className="text-[11px] text-amber-600 dark:text-amber-400">
                Você preencheu {pendingCount} vistorias offline. {offline ? 'Restaure o sinal para sincronizá-las.' : 'Sincronização automática em andamento...'}
              </p>
            </div>
          </div>
          {!offline && (
            <button
              onClick={handleSyncQueue}
              disabled={syncing}
              className="w-full sm:w-auto px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shrink-0"
            >
              {syncing ? 'Sincronizando...' : 'Sincronizar Agora'}
            </button>
          )}
        </div>
      )}

      {/* Sync Status Toast/Notification */}
      {syncStatus && (
        <div className="bg-emerald-600 text-white rounded-xl p-3.5 text-xs font-bold shadow-lg flex items-center justify-between gap-3">
          <span>{syncStatus}</span>
          <button onClick={() => setSyncStatus(null)} className="text-white/80 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs Control */}
      <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-xl gap-1">
        <button
          id="tab-available-freights"
          onClick={() => setActiveTab('available')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'available'
              ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>Fretes Disponíveis</span>
          <span className="px-2 py-0.5 rounded-full text-[11px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold">
            {availableList.length}
          </span>
        </button>

        <button
          id="tab-my-freights"
          onClick={() => setActiveTab('my-freights')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'my-freights'
              ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>Meus Fretes</span>
          {myActiveList.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[11px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-extrabold">
              {myActiveList.length}
            </span>
          )}
        </button>

        <button
          id="tab-completed-freights"
          onClick={() => setActiveTab('completed')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'completed'
              ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>Histórico</span>
          <span className="px-2 py-0.5 rounded-full text-[11px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium">
            {myCompletedList.length}
          </span>
        </button>
      </div>

      {/* Main List Area */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-sm">
          <Truck className="w-8 h-8 mx-auto animate-bounce text-emerald-500 mb-2" />
          Carregando fretes...
        </div>
      ) : activeTab === 'available' ? (
        
        /* AVAILABLE FREIGHTS LIST */
        <div className="space-y-4">
          {availableList.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center border border-slate-200 dark:border-slate-800">
              <Truck className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Nenhum frete disponível no momento</h3>
              <p className="text-xs text-slate-500 mt-1">Fique atento às notificações para novas cargas publicadas na sua região.</p>
            </div>
          ) : (
            availableList.map((freight) => {
              const isCompatibleVehicle = !primaryVehicle || freight.requirements.vehicleType === primaryVehicle.type;

              return (
                <div
                  id={`freight-card-${freight.id}`}
                  key={freight.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-500/50 dark:hover:border-emerald-500/40 transition-all group"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={freight.status} />
                      <VehicleBadge type={freight.requirements.vehicleType} />
                      {isCompatibleVehicle && (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" /> Compatível com seu veículo
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-mono text-slate-400">#{freight.code}</span>
                  </div>

                  {/* Route Overview */}
                  <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-start gap-2.5">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 mt-1 shrink-0"></div>
                        <div>
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Origem</p>
                          <p className="text-base font-extrabold text-slate-900 dark:text-white">
                            {freight.origin.city}/{freight.origin.state}
                          </p>
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" /> Coleta: {new Date(freight.origin.date).toLocaleDateString()} ({freight.origin.timeWindow || 'Horário comercial'})
                          </p>
                        </div>
                      </div>

                      <div className="pl-1.5">
                        <div className="h-4 border-l-2 border-dashed border-slate-300 dark:border-slate-700 ml-0.5"></div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <div className="w-3 h-3 rounded-full bg-blue-500 mt-1 shrink-0"></div>
                        <div>
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Destino</p>
                          <p className="text-base font-extrabold text-slate-900 dark:text-white">
                            {freight.destination.city}/{freight.destination.state}
                          </p>
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" /> Previsão Entrega: {new Date(freight.destination.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Price & Action Area */}
                    <div className="sm:text-right bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30 sm:min-w-[220px]">
                      <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                        Valor Líquido Motorista
                      </span>
                      <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 block my-0.5">
                        R$ {freight.payment.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[11px] text-slate-500 block mb-3">
                        {freight.payment.paymentMethod} • {freight.distanceKm} km aprox.
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          id={`btn-view-freight-${freight.id}`}
                          onClick={() => setSelectedFreight(freight)}
                          className="flex-1 py-2 px-3 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                        >
                          Ver Detalhes
                        </button>
                        <button
                          id={`btn-accept-freight-${freight.id}`}
                          onClick={() => handleAcceptFreight(freight)}
                          disabled={isAccepting}
                          className="flex-1 py-2 px-3 rounded-lg text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-98 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                        >
                          Aceitar
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Cargo summary chip */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                      <Weight className="w-3.5 h-3.5 text-slate-400" />
                      {(freight.cargo.weightKg / 1000).toFixed(1)} toneladas ({freight.cargo.volumeCount} volumes)
                    </span>
                    <span>•</span>
                    <span className="truncate max-w-xs">{freight.cargo.description}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

      ) : activeTab === 'my-freights' ? (

        /* MY ACTIVE FREIGHTS TAB */
        <div className="space-y-4">
          {myActiveList.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center border border-slate-200 dark:border-slate-800">
              <CheckCircle2 className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Você não possui fretes em andamento</h3>
              <p className="text-xs text-slate-500 mt-1">Navegue na aba "Fretes Disponíveis" para reservar novas viagens.</p>
            </div>
          ) : (
            myActiveList.map((freight) => (
              <div
                id={`my-freight-card-${freight.id}`}
                key={freight.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-5 border-2 border-emerald-500/30 dark:border-emerald-500/20 shadow-md space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={freight.status} />
                    <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                      #{freight.code}
                    </span>
                  </div>
                  <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                    R$ {freight.payment.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Locations */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl text-xs">
                  <div>
                    <span className="font-bold text-slate-400 block uppercase text-[10px]">Origem (Coleta)</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{freight.origin.city}/{freight.origin.state}</p>
                    <p className="text-slate-500">{freight.origin.address}, {freight.origin.number}</p>
                    <p className="text-slate-500 mt-1">📅 {new Date(freight.origin.date).toLocaleDateString()} - {freight.origin.timeWindow}</p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-400 block uppercase text-[10px]">Destino (Entrega)</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{freight.destination.city}/{freight.destination.state}</p>
                    <p className="text-slate-500">{freight.destination.address}, {freight.destination.number}</p>
                    <p className="text-slate-500 mt-1">📅 Previsão: {new Date(freight.destination.date).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* State Machine Action Flow */}
                <div className="bg-emerald-50/60 dark:bg-emerald-950/30 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                      <Navigation className="w-4 h-4 text-emerald-600" />
                      Próxima Ação do Frete
                    </span>
                    <button
                      onClick={() => setSelectedFreight(freight)}
                      className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 underline cursor-pointer"
                    >
                      Ver todos os dados
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {freight.status === 'RESERVADO' && (
                      <button
                        id="btn-status-em-coleta"
                        disabled={statusUpdating === freight.id}
                        onClick={() => handleUpdateStatus(freight.id, 'EM_COLETA')}
                        className="py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <span>🚚 Iniciar Viagem p/ Coleta</span>
                      </button>
                    )}

                    {freight.status === 'EM_COLETA' && (
                      <>
                        <button
                          id="btn-status-coletado"
                          disabled={statusUpdating === freight.id}
                          onClick={() => handleUpdateStatus(freight.id, 'COLETADO')}
                          className="py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Confirmar Carga Coletada</span>
                        </button>
                        {onOpenFormModal && (
                          <>
                            <button
                              onClick={() => onOpenFormModal('form-checklist-elolog', freight.id)}
                              className="py-2.5 px-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 font-bold text-xs hover:bg-emerald-100 transition-colors cursor-pointer flex items-center gap-1.5"
                            >
                              <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>Vistoria / Checklist Elo Log</span>
                            </button>
                            <button
                              onClick={() => onOpenFormModal('form-checklist-coleta', freight.id)}
                              className="py-2.5 px-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium text-xs hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <FileText className="w-3.5 h-3.5 text-indigo-500" />
                              <span>Checklist Rápido</span>
                            </button>
                          </>
                        )}
                      </>
                    )}

                    {freight.status === 'COLETADO' && (
                      <button
                        id="btn-status-em-transito"
                        disabled={statusUpdating === freight.id}
                        onClick={() => handleUpdateStatus(freight.id, 'EM_TRANSITO')}
                        className="py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Navigation className="w-4 h-4" />
                        <span>Iniciar Viagem para Destino (Em Trânsito)</span>
                      </button>
                    )}

                    {freight.status === 'EM_TRANSITO' && (
                      <>
                        <button
                          id="btn-status-entregue"
                          disabled={statusUpdating === freight.id}
                          onClick={() => handleUpdateStatus(freight.id, 'ENTREGUE')}
                          className="py-2.5 px-4 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Confirmar Entrega no Destino</span>
                        </button>
                        {onOpenFormModal && (
                          <>
                            <button
                              onClick={() => onOpenFormModal('form-checklist-elolog', freight.id)}
                              className="py-2.5 px-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 font-bold text-xs hover:bg-emerald-100 transition-colors cursor-pointer flex items-center gap-1.5"
                            >
                              <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>Checklist Elo Log</span>
                            </button>
                            <button
                              onClick={() => onOpenFormModal('form-comprovante-entrega', freight.id)}
                              className="py-2.5 px-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium text-xs hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <FileText className="w-3.5 h-3.5 text-teal-500" />
                              <span>Canhoto & Assinatura</span>
                            </button>
                          </>
                        )}
                      </>
                    )}
                    {/* Live GPS Route Tracking Modal Trigger */}
                    <button
                      type="button"
                      onClick={() => setTrackingFreight(freight)}
                      className="py-2.5 px-3 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200 font-bold text-xs hover:bg-blue-100 transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Navigation className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>🛰️ Rastrear Trajeto GPS</span>
                    </button>

                    {/* Prestação de Contas & Despesas */}
                    <button
                      type="button"
                      onClick={() => setExpenseModalFreight(freight)}
                      className="py-2.5 px-3 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 font-bold text-xs hover:bg-amber-100 transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Receipt className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>💰 Prestação de Contas</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      ) : (

        /* COMPLETED FREIGHTS TAB */
        <div className="space-y-3">
          {myCompletedList.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center border border-slate-200 dark:border-slate-800">
              <CheckCircle2 className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Nenhum frete concluído ainda</h3>
              <p className="text-xs text-slate-500 mt-1">Seu histórico de fretes finalizados e faturados aparecerá aqui.</p>
            </div>
          ) : (
            myCompletedList.map(freight => (
              <div
                key={freight.id}
                className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={freight.status} />
                    <span className="text-xs font-mono text-slate-400">#{freight.code}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">
                    {freight.origin.city}/{freight.origin.state} ➡️ {freight.destination.city}/{freight.destination.state}
                  </p>
                  <p className="text-xs text-slate-500">{freight.cargo.description}</p>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3">
                  <div className="text-left sm:text-right">
                    <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 block">
                      R$ {freight.payment.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[11px] text-slate-400">Pago via {freight.payment.paymentMethod}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(freight.id, 'EM_TRANSITO')}
                    className="py-1.5 px-3 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 font-bold text-xs hover:bg-amber-100 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Navigation className="w-3.5 h-3.5 text-amber-600" />
                    <span>Reabrir</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpenseModalFreight(freight)}
                    className="py-1.5 px-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 font-bold text-xs hover:bg-emerald-100 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Despesas</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* DETAILED FREIGHT MODAL */}
      {selectedFreight && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <StatusBadge status={selectedFreight.status} />
                <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300">
                  #{selectedFreight.code}
                </span>
              </div>
              <button
                onClick={() => { setSelectedFreight(null); setAcceptMessage(null); }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Accept Alert Banner */}
            {acceptMessage && (
              <div className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                acceptMessage.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 dark:bg-rose-950 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
              }`}>
                {acceptMessage.type === 'success' ? <Sparkles className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{acceptMessage.text}</span>
              </div>
            )}

            {/* Route */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl space-y-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Coleta / Origem</span>
                <p className="text-base font-extrabold text-slate-900 dark:text-white">
                  {selectedFreight.origin.city}/{selectedFreight.origin.state}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {selectedFreight.origin.address}, nº {selectedFreight.origin.number} - {selectedFreight.origin.neighborhood || 'Centro'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  CEP: {selectedFreight.origin.zipCode} • Data: {new Date(selectedFreight.origin.date).toLocaleDateString()} ({selectedFreight.origin.timeWindow})
                </p>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700/60 pt-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Entrega / Destino</span>
                <p className="text-base font-extrabold text-slate-900 dark:text-white">
                  {selectedFreight.destination.city}/{selectedFreight.destination.state}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {selectedFreight.destination.address}, nº {selectedFreight.destination.number}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  CEP: {selectedFreight.destination.zipCode} • Previsão: {new Date(selectedFreight.destination.date).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Cargo & Requirements */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Carga</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{selectedFreight.cargo.description}</p>
                <p className="text-slate-500">{selectedFreight.cargo.weightKg} kg • {selectedFreight.cargo.volumeCount} volumes</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Veículo Exigido</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{selectedFreight.requirements.vehicleType}</p>
                <p className="text-slate-500">Carroceria: {selectedFreight.requirements.bodyTypeRequired || 'Livre'}</p>
              </div>
            </div>

            {/* Payment Box */}
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase">Valor do Frete</span>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  R$ {selectedFreight.payment.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Forma: {selectedFreight.payment.paymentMethod} {selectedFreight.payment.tollIncluded ? '• Pedágio incluso' : ''}
                </p>
              </div>
            </div>

            {/* Notes if any */}
            {selectedFreight.cargo.notes && (
              <div className="text-xs text-slate-600 dark:text-slate-400 bg-amber-50/50 dark:bg-amber-950/20 p-3 rounded-lg border border-amber-200/50 dark:border-amber-900/30">
                <strong className="text-amber-800 dark:text-amber-300 block mb-0.5">Observações:</strong>
                {selectedFreight.cargo.notes}
              </div>
            )}

            {/* Action Bar */}
            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={() => setSelectedFreight(null)}
                className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Voltar
              </button>

              {['DISPONIVEL', 'PUBLICADO'].includes(selectedFreight.status) && (
                <button
                  id="btn-modal-accept-freight"
                  disabled={isAccepting}
                  onClick={() => handleAcceptFreight(selectedFreight)}
                  className="flex-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isAccepting ? 'Garantindo reserva...' : 'ACEITAR FRETE'}</span>
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Live Route Tracking Modal */}
      {trackingFreight && (
        <LiveRouteTrackingModal
          freight={trackingFreight}
          onClose={() => setTrackingFreight(null)}
        />
      )}

      {/* Trip Expense & Accountability Modal */}
      {expenseModalFreight && (
        <TripExpenseModal
          freight={expenseModalFreight}
          isOpen={true}
          onClose={() => setExpenseModalFreight(null)}
          onSuccess={() => {
            setExpenseModalFreight(null);
          }}
        />
      )}

    </div>
  );
};
