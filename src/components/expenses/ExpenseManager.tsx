import React, { useState, useEffect } from 'react';
import { TripExpenseReport, User } from '../../types';
import { api } from '../../services/api';
import { TripExpenseModal } from './TripExpenseModal';
import { generateExpenseReportPdf, CATEGORY_LABELS } from '../../utils/expensePdfGenerator';
import { 
  Receipt, 
  Plus, 
  FileDown, 
  MessageCircle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  DollarSign, 
  Search, 
  Filter, 
  Fuel, 
  Gauge, 
  TrendingDown, 
  TrendingUp, 
  Eye, 
  Trash2, 
  Calendar,
  User as UserIcon,
  Truck,
  Sparkles,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

interface ExpenseManagerProps {
  currentUser: User | null;
}

export const ExpenseManager: React.FC<ExpenseManagerProps> = ({ currentUser }) => {
  const [reports, setReports] = useState<TripExpenseReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  
  const [selectedReport, setSelectedReport] = useState<TripExpenseReport | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<TripExpenseReport | null>(null);

  const isDriver = currentUser?.role === 'MOTORISTA';

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await api.getTripExpenses();
      setReports(data);
    } catch (err) {
      console.error('Erro ao carregar prestações de contas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [currentUser]);

  // Status updates
  const handleUpdateStatus = async (id: string, status: TripExpenseReport['status']) => {
    try {
      await api.updateTripExpense(id, { status });
      await loadReports();
      alert(`Status da prestação de contas alterado para: ${status}`);
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      alert('Erro ao atualizar status.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja excluir este relatório de prestação de contas?')) {
      try {
        await api.deleteTripExpense(id);
        await loadReports();
      } catch (err) {
        console.error('Erro ao excluir:', err);
      }
    }
  };

  const filteredReports = reports.filter(rep => {
    const matchesSearch = 
      (rep.driverName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rep.freightCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rep.vehiclePlate || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      rep.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || rep.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // KPIs
  const totalExpensesSum = reports.reduce((acc, r) => acc + (r.totalExpenses || 0), 0);
  const totalAdvancesSum = reports.reduce((acc, r) => acc + (r.advanceAmount || 0), 0);
  const pendingReportsCount = reports.filter(r => ['ENVIADO', 'EM_ANALISE'].includes(r.status)).length;
  const totalKmSum = reports.reduce((acc, r) => acc + (r.totalKm || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black shadow-md">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Prestação de Contas & Despesas de Viagem
                </h1>
                <span className="text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                  ELO LOG
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Gestão integrada de abastecimentos, hospedagens, pedágios, locomoção urbana e conciliação de adiantamentos
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setEditingReport(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nova Prestação de Contas</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
              Total de Despesas Lançadas
            </span>
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 block">
              R$ {totalExpensesSum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block font-medium">
              Em {reports.length} prestações cadastradas
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
              Adiantamentos Concedidos
            </span>
            <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
              R$ {totalAdvancesSum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block font-medium">
              Recursos transferidos aos motoristas
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
              Aguardando Auditoria
            </span>
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 block">
              {pendingReportsCount}
            </span>
            <span className="text-[10px] text-amber-600/80 dark:text-amber-400/80 mt-1 block font-medium">
              Prestações pendentes de aprovação
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
              Km Total Auditado
            </span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
              {totalKmSum.toLocaleString('pt-BR')} km
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block font-medium">
              Quilometragem monitorada e conciliada
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Gauge className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar por motorista, frete, placa..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          {[
            { key: 'ALL', label: 'Todos' },
            { key: 'ENVIADO', label: 'Enviados' },
            { key: 'EM_ANALISE', label: 'Em Análise' },
            { key: 'APROVADO', label: 'Aprovados' },
            { key: 'QUITADO', label: 'Quitados' },
            { key: 'RASCUNHO', label: 'Rascunhos' }
          ].map(st => (
            <button
              key={st.key}
              type="button"
              onClick={() => setStatusFilter(st.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                statusFilter === st.key
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reports Table / Card List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs font-medium">
            Carregando prestações de contas...
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
              <Receipt className="w-6 h-6" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold">
              Nenhuma prestação de contas encontrada com os filtros selecionados.
            </p>
            <button
              type="button"
              onClick={() => {
                setEditingReport(null);
                setIsModalOpen(true);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Criar Prestação de Contas</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredReports.map(rep => {
              const balance = rep.balanceAmount;
              const isDevolver = balance >= 0;

              return (
                <div key={rep.id} className="p-4.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                  
                  {/* Left Column: Driver, Freight & Trip Meta */}
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {rep.driverName}
                      </span>
                      {rep.freightCode && (
                        <span className="text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                          Frete: {rep.freightCode}
                        </span>
                      )}
                      {rep.vehiclePlate && (
                        <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-2 py-0.5 rounded">
                          🚚 {rep.vehiclePlate}
                        </span>
                      )}

                      {/* Status Badge */}
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        rep.status === 'APROVADO' || rep.status === 'QUITADO'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : rep.status === 'EM_ANALISE' || rep.status === 'ENVIADO'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : rep.status === 'REJEITADO'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {rep.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{rep.startDate} ➔ {rep.endDate} ({rep.tripDays} dias)</span>
                      </span>

                      <span className="flex items-center gap-1">
                        <Gauge className="w-3.5 h-3.5 text-slate-400" />
                        <span>{rep.totalKm} km ({rep.initialKm} ➔ {rep.finalKm})</span>
                      </span>

                      {rep.averageKmPerLiter > 0 && (
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                          <Fuel className="w-3.5 h-3.5" />
                          <span>{rep.averageKmPerLiter.toFixed(2)} km/L</span>
                        </span>
                      )}

                      <span>
                        🧾 <strong>{rep.items.length}</strong> itens lançados
                      </span>
                    </div>
                  </div>

                  {/* Middle Column: Financial Apuration */}
                  <div className="flex items-center gap-4 text-xs shrink-0">
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block font-medium">Despesas / Adiantamento</span>
                      <div className="flex items-center gap-1.5 justify-end">
                        <span className="font-extrabold text-rose-600 dark:text-rose-400">
                          R$ {rep.totalExpenses.toFixed(2)}
                        </span>
                        <span className="text-slate-400">/</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          R$ {rep.advanceAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className={`p-2.5 rounded-xl border text-right min-w-[130px] ${
                      isDevolver 
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                        : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                    }`}>
                      <span className="text-[10px] font-bold uppercase block">
                        {isDevolver ? 'A Devolver' : 'Reembolso'}
                      </span>
                      <span className="text-sm font-black">
                        R$ {Math.abs(balance).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    
                    <button
                      type="button"
                      onClick={() => generateExpenseReportPdf(rep, { download: true })}
                      className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      title="Baixar Laudo PDF"
                    >
                      <FileDown className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingReport(rep);
                        setIsModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      title="Editar / Ver Detalhes"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Abrir</span>
                    </button>

                    {/* Admin Status Actions */}
                    {!isDriver && (
                      <div className="flex items-center gap-1">
                        {rep.status !== 'APROVADO' && rep.status !== 'QUITADO' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(rep.id, 'APROVADO')}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 rounded-lg text-xs font-bold cursor-pointer"
                            title="Aprovar Prestação de Contas"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}

                        {rep.status === 'APROVADO' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(rep.id, 'QUITADO')}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-extrabold cursor-pointer"
                            title="Marcar como Quitado / Liquidado"
                          >
                            Quitar
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDelete(rep.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                          title="Excluir Relatório"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal for Creating / Editing Trip Expense */}
      {isModalOpen && (
        <TripExpenseModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingReport(null);
          }}
          existingReport={editingReport}
          onSuccess={() => {
            loadReports();
          }}
        />
      )}

    </div>
  );
};
