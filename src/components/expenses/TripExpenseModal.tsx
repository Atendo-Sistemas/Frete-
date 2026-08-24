import React, { useState, useEffect, useRef } from 'react';
import { TripExpenseReport, TripExpenseItem, ExpenseCategory, Freight } from '../../types';
import { api } from '../../services/api';
import { useSaaS } from '../../context/SaaSContext';
import { generateExpenseReportPdf, CATEGORY_LABELS, PAYMENT_METHOD_LABELS } from '../../utils/expensePdfGenerator';
import { CameraCaptureModal } from '../common/CameraCaptureModal';
import { compressImageFile } from '../../utils/imageCompression';
import { 
  DollarSign, 
  Fuel, 
  Hotel, 
  Car, 
  Plane, 
  Bus, 
  Utensils, 
  Wrench, 
  ParkingCircle, 
  Plus, 
  Trash2, 
  Camera, 
  Upload, 
  FileDown, 
  MessageCircle, 
  Check, 
  X, 
  Calendar, 
  Gauge, 
  Calculator, 
  Sparkles, 
  Receipt,
  FileText,
  AlertCircle,
  Clock,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Image as ImageIcon
} from 'lucide-react';

interface TripExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  freight?: Freight | null;
  existingReport?: TripExpenseReport | null;
  onSuccess?: (report: TripExpenseReport) => void;
}

export const TripExpenseModal: React.FC<TripExpenseModalProps> = ({
  isOpen,
  onClose,
  freight,
  existingReport,
  onSuccess
}) => {
  const { getField } = useSaaS();
  
  const fDriverName = getField('expenseForm', 'driverName') || { label: 'Nome do Motorista', enabled: true, required: true };
  const fDriverPhone = getField('expenseForm', 'driverPhone') || { label: 'Celular / WhatsApp (Opcional)', enabled: true, required: false };
  const fVehiclePlate = getField('expenseForm', 'vehiclePlate') || { label: 'Placa do Caminhão / Veículo', enabled: true, required: true };
  const fChassis = getField('expenseForm', 'chassis') || { label: 'Placa / Chassis', enabled: true, required: true };
  const fVehicleModel = getField('expenseForm', 'vehicleModel') || { label: 'Modelo do Veículo', enabled: true, required: true };
  const fClientName = getField('expenseForm', 'clientName') || { label: 'Cliente', enabled: true, required: true };
  const fStartDate = getField('expenseForm', 'startDate') || { label: 'Data de Início da Viagem', enabled: true, required: true };
  const fEndDate = getField('expenseForm', 'endDate') || { label: 'Data de Término da Viagem', enabled: true, required: true };
  const fInitialKm = getField('expenseForm', 'initialKm') || { label: 'Km Inicial', enabled: true, required: true };
  const fFinalKm = getField('expenseForm', 'finalKm') || { label: 'Km Final', enabled: true, required: true };
  const fAdvance = getField('expenseForm', 'advanceAmount') || { label: 'Adiantamento Pago pela Empresa (R$)', enabled: true, required: true };
  const fLabor = getField('expenseForm', 'driverLaborAmount') || { label: 'Mão de Obra Motorista (R$)', enabled: true, required: true };

  const [freightsList, setFreightsList] = useState<Freight[]>([]);
  const [selectedFreightId, setSelectedFreightId] = useState<string>(freight?.id || existingReport?.freightId || '');
  
  // Trip General State
  const [driverName, setDriverName] = useState(existingReport?.driverName || freight?.assignedDriverName || '');
  const [driverPhone, setDriverPhone] = useState(existingReport?.driverPhone || '');
  const [vehiclePlate, setVehiclePlate] = useState(existingReport?.vehiclePlate || freight?.vehicleType || '');
  const [chassis, setChassis] = useState(existingReport?.chassis || '');
  const [vehicleModel, setVehicleModel] = useState(existingReport?.vehicleModel || '');
  const [clientName, setClientName] = useState(existingReport?.clientName || freight?.clientName || '');
  const [startDate, setStartDate] = useState(existingReport?.startDate || new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(existingReport?.endDate || new Date().toISOString().split('T')[0]);
  const [initialKm, setInitialKm] = useState<number | ''>(existingReport?.initialKm || '');
  const [finalKm, setFinalKm] = useState<number | ''>(existingReport?.finalKm || '');
  const [advanceAmount, setAdvanceAmount] = useState<number | ''>(existingReport?.advanceAmount || (freight?.payment?.advanceAmount || 0));
  const [driverLaborAmount, setDriverLaborAmount] = useState<number | ''>(existingReport?.driverLaborAmount || '');
  const [generalNotes, setGeneralNotes] = useState(existingReport?.generalNotes || '');

  // Expense Items State
  const [items, setItems] = useState<TripExpenseItem[]>(existingReport?.items || []);
  
  // Active Item Form (for adding)
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategory, setNewCategory] = useState<ExpenseCategory>('ABASTECIMENTO');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newDescription, setNewDescription] = useState('');
  const [newEstablishment, setNewEstablishment] = useState('');
  const [newDocNumber, setNewDocNumber] = useState('');
  const [newAmount, setNewAmount] = useState<number | ''>('');
  const [newPaymentMethod, setNewPaymentMethod] = useState<TripExpenseItem['paymentMethod']>('ADIANTAMENTO_EMPRESA');
  
  // Specific category inputs
  const [newLiters, setNewLiters] = useState<number | ''>('');
  const [newPricePerLiter, setNewPricePerLiter] = useState<number | ''>('');
  const [newOdometerKm, setNewOdometerKm] = useState<number | ''>('');
  const [newFuelType, setNewFuelType] = useState<TripExpenseItem['fuelType']>('DIESEL_S10');
  const [newArlaLiters, setNewArlaLiters] = useState<number | ''>('');
  const [newArlaAmount, setNewArlaAmount] = useState<number | ''>('');
  
  const [newNightsCount, setNewNightsCount] = useState<number | ''>(1);
  const [newOrigin, setNewOrigin] = useState('');
  const [newDest, setNewDest] = useState('');
  const [newReceiptPhotos, setNewReceiptPhotos] = useState<string[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const [saving, setSaving] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'items' | 'summary'>('items');
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load freights for dropdown
  useEffect(() => {
    if (isOpen) {
      api.getFreights().then(list => setFreightsList(list)).catch(console.error);
    }
  }, [isOpen]);

  // Sync when freight is selected
  useEffect(() => {
    if (selectedFreightId) {
      const selected = freightsList.find(f => f.id === selectedFreightId);
      if (selected) {
        if (!driverName && selected.assignedDriverName) setDriverName(selected.assignedDriverName);
        if (selected.payment?.advanceAmount && advanceAmount === '') {
          setAdvanceAmount(selected.payment.advanceAmount);
        }
        if (selected.payment?.price && driverLaborAmount === '') {
          setDriverLaborAmount(selected.payment.price);
        }
        if (!clientName && selected.tenantName) {
          setClientName(selected.tenantName);
        }
        if (!vehiclePlate && selected.assignedVehiclePlate) {
          setVehiclePlate(selected.assignedVehiclePlate);
        }
        if (!chassis && selected.cargo?.chassis) {
          setChassis(selected.cargo.chassis);
        }
        if (!vehicleModel && selected.cargo?.vehicleProduct) {
          setVehicleModel(selected.cargo.vehicleProduct);
        }
        // Sync KM Dates
        if (selected.startedAt && startDate === '') {
          setStartDate(selected.startedAt.split('T')[0]);
        }
        if (selected.deliveredAt && endDate === '') {
          setEndDate(selected.deliveredAt.split('T')[0]);
        }
        // Assuming freight doesn't have explicit KM, maybe we need to fetch it from history or checklist.
        // Assuming for now they might be in customData or we don't have them yet.
        // I will add placeholders for now as I don't see km fields in Freight interface.
        // The user asked to sync km. If they are not in Freight, they might be in another service.
      }
    }
  }, [selectedFreightId, freightsList]);

  // Auto-calculate liters * price per liter + Arla
  useEffect(() => {
    if (newCategory === 'ABASTECIMENTO') {
      const fuelTotal = (Number(newLiters) || 0) * (Number(newPricePerLiter) || 0);
      const arlaTotal = Number(newArlaAmount) || 0;
      if (fuelTotal > 0 || arlaTotal > 0) {
        setNewAmount(Number((fuelTotal + arlaTotal).toFixed(2)));
      }
    }
  }, [newLiters, newPricePerLiter, newArlaAmount, newCategory]);

  if (!isOpen) return null;

  // Derived Calculations
  const calculatedTotalKm = (Number(finalKm) > Number(initialKm)) ? Number(finalKm) - Number(initialKm) : 0;
  
  // Calculate Trip Days
  const calculateDays = () => {
    if (!startDate || !endDate) return 1;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return isNaN(diffDays) || diffDays < 1 ? 1 : diffDays;
  };
  const tripDays = calculateDays();

  const totalExpenses = items.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);
  const totalLiters = items
    .filter(it => it.category === 'ABASTECIMENTO' && it.liters)
    .reduce((acc, it) => acc + (Number(it.liters) || 0), 0);

  const averageKmPerLiter = totalLiters > 0 && calculatedTotalKm > 0 ? calculatedTotalKm / totalLiters : 0;
  const costPerKm = calculatedTotalKm > 0 ? totalExpenses / calculatedTotalKm : 0;

  const currentAdvance = Number(advanceAmount) || 0;
  
  const isDriverPaidMethod = (m: string) => ['ADIANTAMENTO_EMPRESA', 'DINHEIRO_PROPRIO', 'PIX_PROPRIO'].includes(m);
  const driverPaidExpenses = items.filter(it => isDriverPaidMethod(it.paymentMethod)).reduce((acc, it) => acc + (Number(it.amount) || 0), 0);
  const driverLabor = Number(driverLaborAmount) || 0;
  const totalB = driverPaidExpenses + driverLabor;

  const balance = currentAdvance - totalB;
  const isDevolver = balance >= 0;

  // Handle Photo Capture/Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      files.forEach(async (file) => {
        try {
          const compressed = await compressImageFile(file as File, { quality: 0.8, maxWidth: 1600, maxHeight: 1600 });
          setNewReceiptPhotos(prev => [...prev, compressed]);
        } catch {
          const reader = new FileReader();
          reader.onload = () => {
            setNewReceiptPhotos(prev => [...prev, reader.result as string]);
          };
          reader.readAsDataURL(file as Blob);
        }
      });
    }
  };

  const removePhoto = (index: number) => {
    setNewReceiptPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // Add Item to list
  const handleAddItem = () => {
    if (!newAmount || Number(newAmount) <= 0) {
      alert('Informe o valor da despesa.');
      return;
    }

    const defaultDesc = 
      newCategory === 'ABASTECIMENTO' ? `Combustível ${newFuelType || ''} (${newLiters ? `${newLiters}L` : ''})${newArlaLiters ? ` + Arla (${newArlaLiters}L)` : ''}` :
      newCategory === 'HOSPEDAGEM' ? `Hospedagem (${newNightsCount} noites)` :
      newCategory === 'PEDAGIO' ? 'Tarifa de Pedágio' :
      newCategory === 'LOCOMOCAO_URBANA' ? `Locomoção Urbana (${newOrigin || 'Origem'} > ${newDest || 'Destino'})` :
      newCategory === 'PASSAGEM_AEREA' ? `Voo ${newOrigin} > ${newDest}` :
      newCategory === 'PASSAGEM_RODOVIARIA' ? `Ônibus ${newOrigin} > ${newDest}` :
      newCategory === 'ALIMENTACAO' ? 'Alimentação / Refeição' :
      newCategory === 'MANUTENCAO_BORRACHARIA' ? 'Manutenção / Borracharia' :
      newCategory === 'ESTACIONAMENTO' ? 'Estacionamento / Pernoite' : 'Outra Despesa';

    const newItem: TripExpenseItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      category: newCategory,
      date: newDate,
      description: newDescription || defaultDesc,
      establishmentName: newEstablishment,
      documentNumber: newDocNumber,
      amount: Number(newAmount),
      paymentMethod: newPaymentMethod,
      liters: newLiters !== '' ? Number(newLiters) : undefined,
      pricePerLiter: newPricePerLiter !== '' ? Number(newPricePerLiter) : undefined,
      odometerKm: newOdometerKm !== '' ? Number(newOdometerKm) : undefined,
      fuelType: newFuelType,
      arlaLiters: newArlaLiters !== '' ? Number(newArlaLiters) : undefined,
      arlaAmount: newArlaAmount !== '' ? Number(newArlaAmount) : undefined,
      nightsCount: newNightsCount !== '' ? Number(newNightsCount) : undefined,
      transportOrigin: newOrigin || undefined,
      transportDestination: newDest || undefined,
      receiptPhotoUrl: newReceiptPhotos[0] || undefined, // keep first one for legacy
      receiptPhotoUrls: newReceiptPhotos,
      createdAt: new Date().toISOString()
    };

    setItems([newItem, ...items]);

    // Reset form
    setNewDescription('');
    setNewEstablishment('');
    setNewDocNumber('');
    setNewAmount('');
    setNewLiters('');
    setNewPricePerLiter('');
    setNewOdometerKm('');
    setNewArlaLiters('');
    setNewArlaAmount('');
    setNewOrigin('');
    setNewDest('');
    setNewReceiptPhotos([]);
    setShowAddForm(false);
  };

  const handleRemoveItem = (id: string) => {
    if (confirm('Deseja remover esta despesa da prestação de contas?')) {
      setItems(items.filter(it => it.id !== id));
    }
  };

  // Build Report Object
  const buildReportObject = (status: TripExpenseReport['status'] = 'ENVIADO'): TripExpenseReport => {
    const selectedFreight = freightsList.find(f => f.id === selectedFreightId);
    return {
      id: existingReport?.id || `exp-${Date.now()}`,
      tenantId: existingReport?.tenantId,
      freightId: selectedFreightId || undefined,
      freightCode: selectedFreight?.code || existingReport?.freightCode || undefined,
      driverId: existingReport?.driverId || 'driver-current',
      driverName: driverName || 'Motorista ELO',
      driverPhone: driverPhone || undefined,
      vehiclePlate: vehiclePlate || undefined,
      chassis: chassis || undefined,
      vehicleModel: vehicleModel || undefined,
      clientName: clientName || undefined,
      startDate,
      endDate,
      tripDays,
      initialKm: Number(initialKm) || 0,
      finalKm: Number(finalKm) || 0,
      totalKm: calculatedTotalKm,
      totalLiters,
      averageKmPerLiter,
      costPerKm,
      advanceAmount: currentAdvance,
      driverLaborAmount: driverLabor,
      totalExpenses,
      balanceAmount: balance,
      balanceStatus: isDevolver ? 'A_DEVOLVER' : 'REEMBOLSO_A_RECEBER',
      status,
      items,
      generalNotes,
      createdAt: existingReport?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  };

  // Save / Submit
  const handleSave = async (status: TripExpenseReport['status'] = 'ENVIADO') => {
    setSaving(true);
    try {
      const reportPayload = buildReportObject(status);
      let saved: TripExpenseReport;

      if (existingReport?.id) {
        saved = await api.updateTripExpense(existingReport.id, reportPayload);
      } else {
        saved = await api.createTripExpense(reportPayload);
      }

      if (onSuccess) onSuccess(saved);
      alert(`✓ Prestação de contas ${status === 'RASCUNHO' ? 'salva como rascunho' : 'enviada com sucesso'}!`);
      onClose();
    } catch (err: any) {
      console.error('Erro ao salvar prestação de contas:', err);
      alert('Erro ao salvar: ' + (err.message || 'Falha na conexão'));
    } finally {
      setSaving(false);
    }
  };

  // PDF Export
  const handleExportPdf = () => {
    setIsExportingPdf(true);
    try {
      const report = buildReportObject();
      generateExpenseReportPdf(report, { download: true });
    } catch (err) {
      console.error('Erro ao gerar PDF de despesas:', err);
      alert('Erro ao gerar laudo em PDF.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // WhatsApp Share with manager or dispatch
  const handleShareWhatsApp = () => {
    const report = buildReportObject();
    const balanceText = isDevolver 
      ? `🟢 *Saldo a Devolver à Empresa:* R$ ${Math.abs(balance).toFixed(2)}`
      : `🟡 *Reembolso a Receber pelo Motorista:* R$ ${Math.abs(balance).toFixed(2)}`;

    const appDomain = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'https://portaldefretes.com.br';

    const text = `📋 *PRESTAÇÃO DE CONTAS & DESPESAS • ELO LOG*\n` +
      `-----------------------------------------\n` +
      `👤 *Motorista:* ${report.driverName}\n` +
      `🚚 *Placa:* ${report.vehiclePlate || 'N/D'} | *Frete:* ${report.freightCode || 'Avulso'}\n` +
      `📅 *Período:* ${report.startDate} a ${report.endDate} (${report.tripDays} dias)\n` +
      `🛣️ *Km Rodado:* ${report.totalKm} km (${report.initialKm} ➔ ${report.finalKm})\n` +
      `⛽ *Média Combustível:* ${report.averageKmPerLiter > 0 ? `${report.averageKmPerLiter.toFixed(2)} km/L` : 'N/D'}\n` +
      `-----------------------------------------\n` +
      `💰 *Adiantamento Recebido:* R$ ${report.advanceAmount.toFixed(2)}\n` +
      `🧾 *Total Despesas (${report.items.length} itens):* R$ ${report.totalExpenses.toFixed(2)}\n` +
      `${balanceText}\n` +
      `-----------------------------------------\n` +
      `🌐 *Acesse o Documento / Portal:* ${appDomain}\n` +
      `_Enviado pelo Sistema ELO LOG em ${new Date().toLocaleString('pt-BR')}_`;

    const encoded = encodeURIComponent(text);
    const phone = driverPhone ? driverPhone.replace(/\D/g, '') : '';
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="p-4 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black shadow-md">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base tracking-tight text-white uppercase">
                  Prestação de Contas & Despesas
                </h2>
                <span className="text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/40">
                  ELO LOG
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Lançamento de combustível, hospedagem, pedágios, locomoção e apuração de saldo
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Baixar Laudo de Prestação de Contas em PDF"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Baixar PDF</span>
            </button>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Enviar Resumo para o WhatsApp do Bot/Central"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 pt-2 gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('items')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'items'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Despesas Lançadas ({items.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'info'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Gauge className="w-4 h-4" />
            <span>Dados da Viagem & Km</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('summary')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'summary'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>Apuração de Saldo & Adiantamento</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-slate-100 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                Gastos + Serviços
              </span>
              <span className="text-base font-extrabold text-rose-600 dark:text-rose-400">
                R$ {totalB.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="bg-slate-100 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                Adiantamento Recebido
              </span>
              <span className="text-base font-extrabold text-slate-900 dark:text-white">
                R$ {currentAdvance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="bg-slate-100 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                {isDevolver ? '🟢 Saldo a Devolver' : '🟡 Reembolso a Receber'}
              </span>
              <span className={`text-base font-black ${isDevolver ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                R$ {Math.abs(balance).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="bg-slate-100 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                Km Total • Média
              </span>
              <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                {calculatedTotalKm > 0 ? `${calculatedTotalKm} km` : '-'} 
                {averageKmPerLiter > 0 && <span className="text-xs text-slate-500 block font-normal">{averageKmPerLiter.toFixed(2)} km/L</span>}
              </span>
            </div>
          </div>

          {/* TAB 1: DESPESAS LANÇADAS & FORMULÁRIO DE ADIÇÃO */}
          {activeTab === 'items' && (
            <div className="space-y-4">
              
              {/* Add Expense Toggle / Form */}
              {!showAddForm ? (
                <button
                  type="button"
                  onClick={() => setShowAddForm(true)}
                  className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-100/50 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Lançar Nova Despesa (Combustível, Hospedagem, Pedágio, Uber, etc.)</span>
                </button>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                    <h3 className="font-extrabold text-xs uppercase text-slate-900 dark:text-white flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-emerald-500" />
                      <span>Novo Lançamento de Despesa</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white"
                    >
                      Cancelar
                    </button>
                  </div>

                  {/* Category Selector Chips */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                      Tipo / Categoria de Despesa:
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { key: 'ABASTECIMENTO', label: '⛽ Combustível / Posto', color: 'bg-emerald-600' },
                        { key: 'HOSPEDAGEM', label: '🏨 Hospedagem', color: 'bg-indigo-600' },
                        { key: 'PEDAGIO', label: '🛣️ Pedágio', color: 'bg-blue-600' },
                        { key: 'LOCOMOCAO_URBANA', label: '🚖 Uber / Táxi / Ônibus', color: 'bg-amber-600' },
                        { key: 'PASSAGEM_AEREA', label: '✈️ Passagem Aérea', color: 'bg-sky-600' },
                        { key: 'PASSAGEM_RODOVIARIA', label: '🚌 Passagem Rodoviária', color: 'bg-teal-600' },
                        { key: 'ALIMENTACAO', label: '🍽️ Alimentação', color: 'bg-orange-600' },
                        { key: 'MANUTENCAO_BORRACHARIA', label: '🔧 Borracharia / Manutenção', color: 'bg-purple-600' },
                        { key: 'ESTACIONAMENTO', label: '🅿️ Estacionamento', color: 'bg-slate-700' },
                        { key: 'OUTROS', label: '📦 Outros', color: 'bg-slate-600' }
                      ].map(cat => (
                        <button
                          key={cat.key}
                          type="button"
                          onClick={() => setNewCategory(cat.key as ExpenseCategory)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            newCategory === cat.key
                              ? `${cat.color} text-white shadow-xs scale-102`
                              : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dynamic Fields Based on Category */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                        Data da Despesa
                      </label>
                      <input
                        type="date"
                        value={newDate}
                        onChange={e => setNewDate(e.target.value)}
                        className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                        Nome do Estabelecimento / Posto
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Posto Graal, Hotel Ibis, Uber..."
                        value={newEstablishment}
                        onChange={e => setNewEstablishment(e.target.value)}
                        className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                        Nº Cupom Fiscal / NF / Bilhete
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: NF-e 49201 / Cupom 882"
                        value={newDocNumber}
                        onChange={e => setNewDocNumber(e.target.value)}
                        className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Specific Abastecimento Fields */}
                  {newCategory === 'ABASTECIMENTO' && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/40 space-y-3">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div>
                          <label className="text-[11px] font-bold text-emerald-900 dark:text-emerald-300 block mb-1">
                            Tipo de Combustível
                          </label>
                          <select
                            value={newFuelType}
                            onChange={e => setNewFuelType(e.target.value as any)}
                            className="w-full text-xs p-2 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                          >
                            <option value="DIESEL_S10">Diesel S10</option>
                            <option value="DIESEL_S500">Diesel S500</option>
                            <option value="ARLA_32">Arla 32</option>
                            <option value="GASOLINA">Gasolina</option>
                            <option value="ETANOL">Etanol</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-emerald-900 dark:text-emerald-300 block mb-1">
                            Litros Abastecidos
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Ex: 350.5"
                            value={newLiters}
                            onChange={e => setNewLiters(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full text-xs p-2 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-emerald-900 dark:text-emerald-300 block mb-1">
                            Preço por Litro (R$)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Ex: 6.19"
                            value={newPricePerLiter}
                            onChange={e => setNewPricePerLiter(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full text-xs p-2 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-emerald-900 dark:text-emerald-300 block mb-1">
                            Km no Momento do Posto
                          </label>
                          <input
                            type="number"
                            placeholder="Ex: 142800"
                            value={newOdometerKm}
                            onChange={e => setNewOdometerKm(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full text-xs p-2 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>

                      {/* Arla Fields */}
                      <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-emerald-200/50 dark:border-emerald-800/50">
                        <div>
                          <label className="text-[11px] font-bold text-emerald-900 dark:text-emerald-300 block mb-1">
                            Arla 32 (Litros) <span className="text-[9px] font-normal opacity-75">(Opcional)</span>
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Liters (L)"
                            value={newArlaLiters}
                            onChange={e => setNewArlaLiters(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full text-xs p-2 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-emerald-900 dark:text-emerald-300 block mb-1">
                            Arla 32 (Valor R$)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Valor Total Arla"
                            value={newArlaAmount}
                            onChange={e => setNewArlaAmount(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full text-xs p-2 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Specific Hospedagem Fields */}
                  {newCategory === 'HOSPEDAGEM' && (
                    <div className="grid grid-cols-2 gap-3 p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl border border-indigo-200 dark:border-indigo-800/40">
                      <div>
                        <label className="text-[11px] font-bold text-indigo-900 dark:text-indigo-300 block mb-1">
                          Quantidade de Diárias / Noites
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={newNightsCount}
                          onChange={e => setNewNightsCount(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full text-xs p-2 rounded-lg border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-indigo-900 dark:text-indigo-300 block mb-1">
                          Tipo de Acomodação / Pernoite
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Quarto individual + Estacionamento caminhão"
                          value={newDescription}
                          onChange={e => setNewDescription(e.target.value)}
                          className="w-full text-xs p-2 rounded-lg border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  )}

                  {/* Specific Locomoção / Passagens Fields */}
                  {['LOCOMOCAO_URBANA', 'PASSAGEM_AEREA', 'PASSAGEM_RODOVIARIA'].includes(newCategory) && (
                    <div className="grid grid-cols-2 gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800/40">
                      <div>
                        <label className="text-[11px] font-bold text-amber-900 dark:text-amber-300 block mb-1">
                          Origem do Deslocamento
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Aeroporto GRU, Pátio Transportadora..."
                          value={newOrigin}
                          onChange={e => setNewOrigin(e.target.value)}
                          className="w-full text-xs p-2 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-amber-900 dark:text-amber-300 block mb-1">
                          Destino do Deslocamento
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Hotel Central, Terminal Rodoviário..."
                          value={newDest}
                          onChange={e => setNewDest(e.target.value)}
                          className="w-full text-xs p-2 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  )}

                  {/* Amount, Payment Method & Receipt Upload */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Valor Total da Despesa (R$) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={newAmount}
                          onChange={e => setNewAmount(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full text-xs p-2 pl-8 font-bold text-rose-600 dark:text-rose-400 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Forma de Pagamento Utilizada
                      </label>
                      <select
                        value={newPaymentMethod}
                        onChange={e => setNewPaymentMethod(e.target.value as any)}
                        className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      >
                        <option value="ADIANTAMENTO_EMPRESA">Adiantamento da Empresa</option>
                        <option value="CARTAO_CORPORATIVO">Cartão Corporativo</option>
                        <option value="TAG_AUTOMATICA">Tag Automática (Sem Parar/Veloe)</option>
                        <option value="DINHEIRO_PROPRIO">Dinheiro Próprio (Reembolso)</option>
                        <option value="PIX_PROPRIO">Pix Próprio (Reembolso)</option>
                      </select>
                    </div>

                    {/* Receipt Photo Attachment */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between mb-1.5">
                        <span>
                          {newCategory === 'ALIMENTACAO' ? 'Foto de Comprovantes (Opcional)' : 'Foto de Comprovantes / Notas Fiscais'}
                        </span>
                        {newReceiptPhotos.length > 0 && (
                          <span className="text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full font-bold">
                            {newReceiptPhotos.length} {newReceiptPhotos.length === 1 ? 'Foto Anexada' : 'Fotos Anexadas'}
                          </span>
                        )}
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        ref={fileInputRef}
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                      
                      {newReceiptPhotos.length > 0 ? (
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2 items-center">
                            {newReceiptPhotos.map((photo, idx) => (
                              <div key={idx} className="relative group">
                                <img
                                  src={photo}
                                  alt={`Comprovante ${idx + 1}`}
                                  className="w-12 h-12 rounded-xl object-cover border-2 border-emerald-500 cursor-pointer shadow-xs"
                                  onClick={() => setPreviewPhoto(photo)}
                                />
                                <button
                                  type="button"
                                  onClick={() => removePhoto(idx)}
                                  className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-0.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-rose-600"
                                  title="Remover foto"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>

                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setIsCameraOpen(true)}
                              className="px-2.5 py-1.5 rounded-lg border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-100 transition-colors cursor-pointer"
                              title="Tirar mais fotos com a câmera"
                            >
                              <Camera className="w-3.5 h-3.5" />
                              <span>+ Câmera</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-200 transition-colors cursor-pointer"
                              title="Adicionar fotos da galeria"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>+ Galeria / Arquivo</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setIsCameraOpen(true)}
                            className="p-2.5 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
                          >
                            <Camera className="w-4 h-4" />
                            <span>Tirar Foto (Câmera)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="p-2.5 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors"
                          >
                            <Upload className="w-4 h-4" />
                            <span>Galeria / Arquivo</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Add Button */}
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Confirmar e Adicionar Despesa</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Items List Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
                <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-between">
                  <span>Itens Lançados ({items.length})</span>
                  <span>Total: R$ {totalExpenses.toFixed(2)}</span>
                </div>

                {items.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    Nenhuma despesa adicionada ainda. Clique no botão acima para lançar combustível, pedágios, alimentação, etc.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {items.map((item, index) => (
                      <div key={item.id} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                            {item.category === 'ABASTECIMENTO' && <Fuel className="w-4 h-4 text-emerald-500" />}
                            {item.category === 'HOSPEDAGEM' && <Hotel className="w-4 h-4 text-indigo-500" />}
                            {item.category === 'PEDAGIO' && <Car className="w-4 h-4 text-blue-500" />}
                            {item.category === 'LOCOMOCAO_URBANA' && <Car className="w-4 h-4 text-amber-500" />}
                            {item.category === 'PASSAGEM_AEREA' && <Plane className="w-4 h-4 text-sky-500" />}
                            {item.category === 'PASSAGEM_RODOVIARIA' && <Bus className="w-4 h-4 text-teal-500" />}
                            {item.category === 'ALIMENTACAO' && <Utensils className="w-4 h-4 text-orange-500" />}
                            {item.category === 'MANUTENCAO_BORRACHARIA' && <Wrench className="w-4 h-4 text-purple-500" />}
                            {item.category === 'ESTACIONAMENTO' && <ParkingCircle className="w-4 h-4 text-slate-500" />}
                            {item.category === 'OUTROS' && <Receipt className="w-4 h-4 text-slate-500" />}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                                {CATEGORY_LABELS[item.category] || item.category}
                              </span>
                              {item.establishmentName && (
                                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded truncate">
                                  {item.establishmentName}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-2">
                              <span>📅 {item.date.split('-').reverse().join('/')}</span>
                              {item.liters && <span>⛽ {item.liters} L {item.odometerKm ? `(${item.odometerKm} km)` : ''}</span>}
                              {item.arlaLiters && <span>💧 Arla: {item.arlaLiters} L</span>}
                              {item.nightsCount && <span>🏨 {item.nightsCount} noite(s)</span>}
                              {item.transportOrigin && <span>📍 {item.transportOrigin} &gt; {item.transportDestination}</span>}
                              <span className="font-semibold text-slate-600 dark:text-slate-400">💳 {PAYMENT_METHOD_LABELS[item.paymentMethod] || item.paymentMethod}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {((item.receiptPhotoUrls && item.receiptPhotoUrls.length > 0) || item.receiptPhotoUrl) && (
                            <div className="flex -space-x-1">
                              {(item.receiptPhotoUrls || [item.receiptPhotoUrl]).map((url, i) => url && (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => setPreviewPhoto(url)}
                                  className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 hover:bg-blue-100 border border-slate-200 dark:border-slate-700 flex items-center justify-center cursor-pointer shadow-xs z-10 hover:z-20 relative"
                                  title={`Visualizar Cupom Fiscal ${i + 1}`}
                                >
                                  <ImageIcon className="w-3 h-3" />
                                </button>
                              ))}
                            </div>
                          )}

                          <span className="text-xs font-black text-rose-600 dark:text-rose-400">
                            R$ {item.amount.toFixed(2)}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-1 text-slate-400 hover:text-rose-500 rounded cursor-pointer"
                            title="Remover Despesa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: DADOS DA VIAGEM, KM & MOTORISTA */}
          {activeTab === 'info' && (
            <div className="space-y-4">
              
              {/* Vinculação de Frete e Motorista */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase flex items-center gap-2">
                  <Car className="w-4 h-4 text-blue-500" />
                  <span>Identificação da Viagem & Veículo</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      Vincular a Frete Cadastrado
                    </label>
                    <select
                      value={selectedFreightId}
                      onChange={e => setSelectedFreightId(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    >
                      <option value="">Frete Avulso / Viagem Não Vinculada</option>
                      {freightsList.map(f => (
                        <option key={f.id} value={f.id}>
                          {f.code} - {f.origin?.city}/{f.origin?.state} ➔ {f.destination?.city}/{f.destination?.state}
                        </option>
                      ))}
                    </select>
                  </div>

                  {fDriverName.enabled && (
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                        {fDriverName.label} {fDriverName.required && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type="text"
                        placeholder={fDriverName.placeholder || "Nome completo"}
                        value={driverName}
                        required={fDriverName.required}
                        onChange={e => setDriverName(e.target.value)}
                        className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                    </div>
                  )}
                  
                  {fClientName.enabled && (
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                        {fClientName.label} {fClientName.required && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type="text"
                        placeholder={fClientName.placeholder || "Nome do cliente"}
                        value={clientName}
                        required={fClientName.required}
                        onChange={e => setClientName(e.target.value.toUpperCase())}
                        className="w-full text-xs p-2 uppercase font-bold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                    </div>
                  )}

                  {fVehicleModel.enabled && (
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                        {fVehicleModel.label} {fVehicleModel.required && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type="text"
                        placeholder={fVehicleModel.placeholder || "Ex: MB SPRINTER"}
                        value={vehicleModel}
                        required={fVehicleModel.required}
                        onChange={e => setVehicleModel(e.target.value.toUpperCase())}
                        className="w-full text-xs p-2 uppercase font-bold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                    </div>
                  )}

                  {fVehiclePlate.enabled && (
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                        {fVehiclePlate.label} {fVehiclePlate.required && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type="text"
                        placeholder={fVehiclePlate.placeholder || "Ex: ABC1D23"}
                        value={vehiclePlate}
                        required={fVehiclePlate.required}
                        onChange={e => setVehiclePlate(e.target.value.toUpperCase())}
                        className="w-full text-xs p-2 uppercase font-bold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                    </div>
                  )}

                  {fChassis.enabled && (
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                        {fChassis.label} {fChassis.required && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type="text"
                        placeholder={fChassis.placeholder || "Nº Chassis"}
                        value={chassis}
                        required={fChassis.required}
                        onChange={e => setChassis(e.target.value.toUpperCase())}
                        className="w-full text-xs p-2 uppercase font-bold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Datas da Viagem & Duração */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-500" />
                  <span>Datas da Viagem & Duração</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {fStartDate.enabled && (
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                        {fStartDate.label} {fStartDate.required && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type="date"
                        required={fStartDate.required}
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                    </div>
                  )}
                  {fEndDate.enabled && (
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                        {fEndDate.label} {fEndDate.required && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type="date"
                        required={fEndDate.required}
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                    </div>
                  )}
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      Duração Calculada
                    </label>
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{tripDays} dia(s) de viagem</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quilometragem Inicial, Final e Consumo */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-amber-500" />
                  <span>Quilometragem & Cálculo de Média de Combustível</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {fInitialKm.enabled && (
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                        {fInitialKm.label} {fInitialKm.required && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type="number"
                        placeholder={fInitialKm.placeholder || "Ex: 142000"}
                        required={fInitialKm.required}
                        value={initialKm}
                        onChange={e => setInitialKm(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                      />
                    </div>
                  )}
                  {fFinalKm.enabled && (
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                        {fFinalKm.label} {fFinalKm.required && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type="number"
                        placeholder={fFinalKm.placeholder || "Ex: 143800"}
                        required={fFinalKm.required}
                        value={finalKm}
                        onChange={e => setFinalKm(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      Km Total Rodado
                    </label>
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                      {calculatedTotalKm > 0 ? `${calculatedTotalKm.toLocaleString('pt-BR')} km rodados` : 'Informe Km inicial e final'}
                    </div>
                  </div>
                </div>

                {/* Telemetry metrics banner */}
                <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/50 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Fuel className="w-4 h-4 text-emerald-600" />
                    <span className="text-slate-700 dark:text-slate-300 font-semibold">
                      Combustível Total Lançado: <strong>{totalLiters.toFixed(1)} L</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-300">
                    <span>Média de Consumo:</span>
                    <span className="text-sm bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-700">
                      {averageKmPerLiter > 0 ? `${averageKmPerLiter.toFixed(2)} km/L` : 'Cadastre abastecimentos'}
                    </span>
                  </div>
                </div>
              </div>

              {/* General Notes */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  Observações Gerais da Viagem (Ocorrências, Rota, etc.)
                </label>
                <textarea
                  rows={3}
                  value={generalNotes}
                  onChange={e => setGeneralNotes(e.target.value)}
                  placeholder="Ex: Trecho com pedágios manuais, desvio por obras, etc."
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

            </div>
          )}

          {/* TAB 3: APURAÇÃO FINANCEIRA & ADIANTAMENTOS */}
          {activeTab === 'summary' && (
            <div className="space-y-4">
              
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
                <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-emerald-500" />
                  <span>Demonstrativo Financeiro da Viagem</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  <div className="space-y-4">
                    {/* Adiantamento input */}
                    {fAdvance.enabled && (
                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          {fAdvance.label} {fAdvance.required && <span className="text-red-500">*</span>}
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">R$</span>
                          <input
                            type="number"
                            step="0.01"
                            placeholder={fAdvance.placeholder || "0.00"}
                            required={fAdvance.required}
                            value={advanceAmount}
                            onChange={e => setAdvanceAmount(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full text-sm font-extrabold p-2 pl-9 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 mt-1 block">
                          Valor depositado ou adiantado no início da viagem para custos operacionais.
                        </span>
                      </div>
                    )}

                    {/* Mão de Obra do Motorista input */}
                    {fLabor.enabled && (
                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          {fLabor.label} {fLabor.required && <span className="text-red-500">*</span>}
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">R$</span>
                          <input
                            type="number"
                            step="0.01"
                            placeholder={fLabor.placeholder || "0.00"}
                            required={fLabor.required && !selectedFreightId}
                            value={driverLaborAmount}
                            onChange={e => setDriverLaborAmount(e.target.value === '' ? '' : Number(e.target.value))}
                            disabled={!!selectedFreightId}
                            className={`w-full text-sm font-extrabold p-2 pl-9 rounded-xl border ${selectedFreightId ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 cursor-not-allowed' : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white'}`}
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 mt-1 block">
                          {selectedFreightId ? 'Valor vinculado automaticamente ao frete selecionado.' : 'Valor total cobrado pelo serviço do motorista (Km Rodado).'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Resumo visual de saldo */}
                  <div className={`p-4 rounded-xl border flex flex-col justify-between ${
                    isDevolver 
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800' 
                      : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {isDevolver ? '🟢 Elo Log Recebe / Motorista Devolve:' : '🟡 Elo Log Deve / Motorista Recebe:'}
                      </span>
                      {isDevolver ? <TrendingDown className="w-4 h-4 text-emerald-600" /> : <TrendingUp className="w-4 h-4 text-amber-600" />}
                    </div>

                    <div className="mt-2">
                      <span className={`text-2xl font-black ${isDevolver ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}`}>
                        R$ {Math.abs(balance).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-1">
                        {isDevolver 
                          ? 'O valor do adiantamento foi maior que os gastos + mão de obra. O motorista deve restituir a sobra.' 
                          : 'As despesas + mão de obra excederam o adiantamento. A empresa deve pagar o saldo ao motorista.'}
                      </p>
                    </div>
                  </div>

                </div>

                {/* Categories Breakdown */}
                <div className="pt-2">
                  <h4 className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">
                    Detalhamento por Categoria de Custo:
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    {Object.entries(CATEGORY_LABELS).map(([catKey, catName]) => {
                      const catTotal = items
                        .filter(it => it.category === catKey)
                        .reduce((acc, it) => acc + (Number(it.amount) || 0), 0);
                      if (catTotal === 0) return null;
                      return (
                        <div key={catKey} className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                          <span className="text-slate-600 dark:text-slate-400 text-[11px] truncate max-w-[120px]">{catName}</span>
                          <span className="font-bold text-slate-900 dark:text-white">R$ {catTotal.toFixed(2)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>

        {/* Footer Actions Bar */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSave('RASCUNHO')}
              disabled={saving}
              className="py-2 px-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold cursor-pointer transition-colors"
            >
              Salvar Rascunho
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Gerar PDF Oficial</span>
            </button>

            <button
              type="button"
              onClick={() => handleSave('ENVIADO')}
              disabled={saving}
              className="py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-98"
            >
              <Check className="w-4 h-4" />
              <span>{saving ? 'Enviando...' : 'Finalizar e Enviar Prestação'}</span>
            </button>
          </div>

        </div>

        {/* Photo Preview Modal */}
        {previewPhoto && (
          <div className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4">
            <div className="max-w-xl w-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl p-2 flex flex-col items-center">
              <div className="w-full flex justify-between items-center p-2 text-white text-xs font-bold">
                <span>Comprovante / Cupom Fiscal</span>
                <button type="button" onClick={() => setPreviewPhoto(null)} className="p-1 hover:bg-slate-800 rounded">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <img src={previewPhoto} alt="Cupom" className="max-h-[70vh] rounded object-contain" />
            </div>
          </div>
        )}

        {/* Live Camera Capture Modal */}
        <CameraCaptureModal
          isOpen={isCameraOpen}
          onClose={() => setIsCameraOpen(false)}
          onCapture={(photo) => setNewReceiptPhotos(prev => [...prev, photo])}
          title="Fotografar Comprovante / Cupom Fiscal"
          subtitle="Aponte a câmera para o documento ou cupom com boa iluminação"
          preferredFacingMode="environment"
        />

      </div>
    </div>
  );
};
