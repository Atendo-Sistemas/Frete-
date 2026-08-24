import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useSaaS } from '../../context/SaaSContext';
import { useAuth } from '../../context/AuthContext';
import { VehicleType, CargoType, PaymentMethod, BodyType, Freight, OperationType } from '../../types';
import { Truck, MapPin, DollarSign, Calendar, Package, X, Sparkles, AlertCircle, Split } from 'lucide-react';

interface FreightFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (freight: Freight) => void;
  freightToEdit?: Freight | null;
}

export const FreightFormModal: React.FC<FreightFormModalProps> = ({ isOpen, onClose, onSuccess, freightToEdit }) => {
  const { getField } = useSaaS();
  const { tenant } = useAuth();
  const allowedOps = tenant?.allowedOperations || ['CARGA_GERAL'];

  const fCargoDesc = getField('freightForm', 'cargoDescription') || { label: 'Descrição da Carga', placeholder: 'Ex: Carga de milho ensacado', enabled: true, required: true };
  const fCargoType = getField('freightForm', 'cargoType') || { label: 'Tipo de Carga', placeholder: 'Selecione o tipo', enabled: true, required: true };
  const fWeight = getField('freightForm', 'weight') || { label: 'Peso Total (Kg)', placeholder: 'Ex: 15000', enabled: true, required: true };
  const fVolumes = getField('freightForm', 'volumes') || { label: 'Volumes', placeholder: 'Ex: 30', enabled: true, required: true };
  const fVehicleType = getField('freightForm', 'vehicleType') || { label: 'Tipo de Veículo', placeholder: 'Selecione o veículo', enabled: true, required: true };
  const fBodyType = getField('freightForm', 'bodyType') || { label: 'Carroceria', placeholder: 'Selecione a carroceria', enabled: true, required: true };
  const fBrand = getField('freightForm', 'brand') || { label: 'Marca do Veículo', placeholder: 'Selecione a marca', enabled: true, required: true };
  const fValue = getField('freightForm', 'value') || { label: 'Valor do Frete (R$)', placeholder: '0.00', enabled: true, required: true };
  const fPaymentMethod = getField('freightForm', 'paymentMethod') || { label: 'Forma de Pagamento', placeholder: 'Selecione a forma', enabled: true, required: true };
  
  const fOriginCity = getField('freightForm', 'originCity') || { label: 'Cidade Origem', placeholder: 'Cidade de coleta', enabled: true, required: true };
  const fOriginState = getField('freightForm', 'originState') || { label: 'UF Origem', placeholder: 'UF', enabled: true, required: true };
  const fOriginAddress = getField('freightForm', 'originAddress') || { label: 'Endereço Origem', placeholder: 'Rua, Avenida, etc.', enabled: true, required: true };
  const fOriginNumber = getField('freightForm', 'originNumber') || { label: 'Número Origem', placeholder: 'Número', enabled: true, required: true };
  
  const fDestCity = getField('freightForm', 'destCity') || { label: 'Cidade Destino', placeholder: 'Cidade de entrega', enabled: true, required: true };
  const fDestState = getField('freightForm', 'destState') || { label: 'UF Destino', placeholder: 'UF', enabled: true, required: true };
  const fDestAddress = getField('freightForm', 'destAddress') || { label: 'Endereço Destino', placeholder: 'Rua, Avenida, etc.', enabled: true, required: true };
  const fDestNumber = getField('freightForm', 'destNumber') || { label: 'Número Destino', placeholder: 'Número', enabled: true, required: true };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [originCity, setOriginCity] = useState('São José do Rio Preto');
  const [originState, setOriginState] = useState('SP');
  const [originZip, setOriginZip] = useState('15015-000');
  const [originAddress, setOriginAddress] = useState('Av. Alberto Andaló');
  const [originNumber, setOriginNumber] = useState('3100');
  const [originDate, setOriginDate] = useState('2026-08-25');
  const [originTimeWindow, setOriginTimeWindow] = useState('08:00 às 12:00');

  const [destCity, setDestCity] = useState('São Paulo');
  const [destState, setDestState] = useState('SP');
  const [destZip, setDestZip] = useState('01001-000');
  const [destAddress, setDestAddress] = useState('Av. Paulista');
  const [destNumber, setDestNumber] = useState('1000');
  const [destDate, setDestDate] = useState('2026-08-26');
  const [destTimeWindow, setDestTimeWindow] = useState('14:00 às 18:00');

  const [operationType, setOperationType] = useState<OperationType>(
    freightToEdit?.operationType || (allowedOps.includes('CARGA_GERAL') ? 'CARGA_GERAL' : 'LOGISTICA_VEICULOS')
  );
  const [clientRevenue, setClientRevenue] = useState('');
  const [driverCost, setDriverCost] = useState('');

  const [cargoDesc, setCargoDesc] = useState('Carga geral paletizada - Peças automotivas');
  const [cargoType, setCargoType] = useState<CargoType>(allowedOps.includes('CARGA_GERAL') ? 'GERAL' : 'VEICULO');
  const [weightKg, setWeightKg] = useState('8500');
  const [volumeCount, setVolumeCount] = useState('16');
  const [cargoNotes, setCargoNotes] = useState('Carga com NF e Manifesto emitidos. Carga segurada.');
  
  // Detalhes da Carga / Veículo Transportado
  const [vehicleProduct, setVehicleProduct] = useState('');
  const [chassis, setChassis] = useState('');
  const [nfVehicleSale, setNfVehicleSale] = useState('');
  const [nfFacchini, setNfFacchini] = useState('');
  const [trackerStatus, setTrackerStatus] = useState('INSTALADO');
  const [platesStatus, setPlatesStatus] = useState('S/ PLACA');

  const [vehicleType, setVehicleType] = useState<VehicleType>('TRUCK');
  const [vehicleBrand, setVehicleBrand] = useState('Volkswagen');
  const [otherVehicleBrand, setOtherVehicleBrand] = useState('');
  const [bodyType, setBodyType] = useState<BodyType>('BAU');
  const [minCapacityKg, setMinCapacityKg] = useState('8000');

  const [price, setPrice] = useState('1850.00');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX');
  const [tollIncluded, setTollIncluded] = useState(true);
  const [paymentNotes, setPaymentNotes] = useState('70% adiantamento no carregamento e 30% na entrega.');

  const [publishImmediately, setPublishImmediately] = useState(true);

  useEffect(() => {
    if (freightToEdit) {
      setOriginCity(freightToEdit.origin.city);
      setOriginState(freightToEdit.origin.state);
      setOriginZip(freightToEdit.origin.zipCode);
      setOriginAddress(freightToEdit.origin.address);
      setOriginNumber(freightToEdit.origin.number);
      setOriginDate(freightToEdit.origin.date);
      setOriginTimeWindow(freightToEdit.origin.timeWindow || '08:00 às 12:00');

      setDestCity(freightToEdit.destination.city);
      setDestState(freightToEdit.destination.state);
      setDestZip(freightToEdit.destination.zipCode);
      setDestAddress(freightToEdit.destination.address);
      setDestNumber(freightToEdit.destination.number);
      setDestDate(freightToEdit.destination.date);
      setDestTimeWindow(freightToEdit.destination.timeWindow || '14:00 às 18:00');

      setOperationType(freightToEdit.operationType || 'CARGA_GERAL');
      if (freightToEdit.payment.clientRevenue) setClientRevenue(String(freightToEdit.payment.clientRevenue));
      if (freightToEdit.payment.driverCost) setDriverCost(String(freightToEdit.payment.driverCost));

      setCargoDesc(freightToEdit.cargo.description);
      setCargoType(freightToEdit.cargo.type);
      setWeightKg(String(freightToEdit.cargo.weightKg));
      setVolumeCount(String(freightToEdit.cargo.volumeCount || 1));
      setCargoNotes(freightToEdit.cargo.notes || '');
      setVehicleProduct(freightToEdit.cargo.vehicleProduct || '');
      setChassis(freightToEdit.cargo.chassis || '');
      setNfVehicleSale(freightToEdit.cargo.nfVehicleSale || '');
      setNfFacchini(freightToEdit.cargo.nfFacchini || '');
      setTrackerStatus(freightToEdit.cargo.trackerStatus || 'INSTALADO');
      setPlatesStatus(freightToEdit.cargo.platesStatus || 'S/ PLACA');

      setVehicleType(freightToEdit.requirements.vehicleType);
      if (freightToEdit.requirements.vehicleBrand) {
        const brand = freightToEdit.requirements.vehicleBrand;
        const standardBrands = ['Volkswagen', 'Mercedes-Benz', 'Iveco', 'Scania', 'Ford', 'Volvo'];
        if (standardBrands.includes(brand)) {
          setVehicleBrand(brand);
        } else {
          setVehicleBrand('Outro');
          setOtherVehicleBrand(brand);
        }
      }
      setBodyType(freightToEdit.requirements.bodyTypeRequired || 'BAU');
      setMinCapacityKg(String(freightToEdit.requirements.minCapacityKg || 5000));

      setPrice(String(freightToEdit.payment.price));
      setPaymentMethod(freightToEdit.payment.paymentMethod);
      setTollIncluded(freightToEdit.payment.tollIncluded);
      setPaymentNotes(freightToEdit.payment.notes || '');
    } else if (isOpen) {
      // Reset form if opening for a new freight
      setOperationType(allowedOps.includes('CARGA_GERAL') ? 'CARGA_GERAL' : 'LOGISTICA_VEICULOS');
      setCargoType(allowedOps.includes('CARGA_GERAL') ? 'GERAL' : 'VEICULO');
      setClientRevenue('');
      setDriverCost('');
    }
  }, [isOpen, freightToEdit]);

  if (!isOpen) return null;

  // Preset fill for quick demo testing
  const handleApplyPreset = (type: 'sao-jose-sp' | 'campinas-curitiba' | 'ribeirao-bh') => {
    if (type === 'sao-jose-sp') {
      setOriginCity('São José do Rio Preto');
      setOriginState('SP');
      setOriginZip('15015-000');
      setDestCity('São Paulo');
      setDestState('SP');
      setDestZip('01001-000');
      setPrice('1800.00');
      setVehicleType('TRUCK');
      setWeightKg('8000');
      setCargoDesc('Carga geral paletizada');
    } else if (type === 'campinas-curitiba') {
      setOriginCity('Campinas');
      setOriginState('SP');
      setOriginZip('13080-000');
      setDestCity('Curitiba');
      setDestState('PR');
      setDestZip('80010-000');
      setPrice('3200.00');
      setVehicleType('TOCO');
      setWeightKg('6000');
      setCargoDesc('Eletroeletrônicos e insumos');
    } else {
      setOriginCity('Ribeirão Preto');
      setOriginState('SP');
      setOriginZip('14055-000');
      setDestCity('Belo Horizonte');
      setDestState('MG');
      setDestZip('30110-000');
      setPrice('4500.00');
      setVehicleType('CARRETA');
      setWeightKg('24000');
      setCargoDesc('Bebidas e alimentos');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        operationType,
        origin: {
          zipCode: originZip,
          address: originAddress,
          number: originNumber,
          city: originCity,
          state: originState,
          date: originDate,
          timeWindow: originTimeWindow
        },
        destination: {
          zipCode: destZip,
          address: destAddress,
          number: destNumber,
          city: destCity,
          state: destState,
          date: destDate,
          timeWindow: destTimeWindow
        },
        cargo: {
          description: cargoDesc,
          type: cargoType,
          weightKg: Number(weightKg),
          volumeCount: Number(volumeCount),
          notes: cargoNotes,
          requiresInsurance: true,
          vehicleProduct,
          chassis,
          nfVehicleSale,
          nfFacchini,
          trackerStatus,
          platesStatus
        },
        requirements: {
          vehicleType,
          vehicleBrand: vehicleBrand === 'Outro' ? otherVehicleBrand : vehicleBrand,
          bodyTypeRequired: bodyType,
          minCapacityKg: Number(minCapacityKg),
          trackerRequired: true
        },
        payment: {
          price: Number(price),
          clientRevenue: operationType === 'LOGISTICA_VEICULOS' ? Number(clientRevenue) : undefined,
          driverCost: operationType === 'LOGISTICA_VEICULOS' ? Number(driverCost) : undefined,
          paymentMethod,
          tollIncluded,
          notes: paymentNotes
        },
        distanceKm: 440,
        publishImmediately
      };

      let resFreight;
      if (freightToEdit) {
        resFreight = await api.updateFreight(freightToEdit.id, payload);
      } else {
        resFreight = await api.createFreight(payload);
      }
      onSuccess(resFreight);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar frete');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {freightToEdit ? `Editar Frete #${freightToEdit.code}` : 'Cadastrar Novo Frete'}
              </h2>
              <p className="text-xs text-slate-500">Preencha os detalhes da carga, origem, destino e veículo exigido conforme normas Elo Log.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Fill Presets */}
        <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs">
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="font-semibold text-slate-700 dark:text-slate-300">Preencher Exemplo:</span>
          <div className="flex flex-wrap gap-1.5 ml-auto">
            <button
              type="button"
              onClick={() => handleApplyPreset('sao-jose-sp')}
              className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 cursor-pointer"
            >
              SJ Rio Preto ➡️ SP (Truck)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('campinas-curitiba')}
              className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 cursor-pointer"
            >
              Campinas ➡️ Curitiba (Toco)
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Operation Type Selector */}
          {allowedOps.length > 1 && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
              <label className="text-xs font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300 flex items-center gap-1.5 mb-3">
                <Split className="w-4 h-4" /> Tipo de Operação Logística
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {allowedOps.includes('CARGA_GERAL') && (
                  <button
                    type="button"
                    onClick={() => setOperationType('CARGA_GERAL')}
                    className={`py-3 px-4 rounded-lg border-2 text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                      operationType === 'CARGA_GERAL' 
                        ? 'border-blue-600 bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 shadow-sm' 
                        : 'border-transparent bg-blue-100/50 dark:bg-slate-800/50 text-slate-500 hover:bg-blue-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Package className="w-4 h-4" /> Carga Geral (Tradicional)
                  </button>
                )}
                {allowedOps.includes('LOGISTICA_VEICULOS') && (
                  <button
                    type="button"
                    onClick={() => {
                      setOperationType('LOGISTICA_VEICULOS');
                      setCargoType('VEICULO'); // Force cargo type
                    }}
                    className={`py-3 px-4 rounded-lg border-2 text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                      operationType === 'LOGISTICA_VEICULOS' 
                        ? 'border-blue-600 bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 shadow-sm' 
                        : 'border-transparent bg-blue-100/50 dark:bg-slate-800/50 text-slate-500 hover:bg-blue-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Truck className="w-4 h-4" /> Logística de Veículos (Cegonha/Guincho)
                  </button>
                )}
              </div>
              {operationType === 'LOGISTICA_VEICULOS' && (
                <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-2">
                  No modo Logística de Veículos, os valores financeiros são divididos entre a <strong>Nota Fiscal ao Cliente</strong> e o <strong>Repasse ao Motorista</strong>.
                </p>
              )}
            </div>
          )}
          
          {/* Section 1: Origem e Destino */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Origem */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> 1. Origem (Coleta)
              </span>
              
              <div className="grid grid-cols-3 gap-2">
                {fOriginCity.enabled && (
                  <div className="col-span-2">
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      {fOriginCity.label} {fOriginCity.required && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      required={fOriginCity.required}
                      value={originCity}
                      onChange={e => setOriginCity(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                      placeholder={fOriginCity.placeholder}
                    />
                  </div>
                )}
                {fOriginState.enabled && (
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      {fOriginState.label} {fOriginState.required && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      required={fOriginState.required}
                      maxLength={2}
                      value={originState}
                      onChange={e => setOriginState(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium uppercase"
                      placeholder={fOriginState.placeholder}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                {fOriginAddress.enabled && (
                  <div className="col-span-2">
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      {fOriginAddress.label} {fOriginAddress.required && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      required={fOriginAddress.required}
                      value={originAddress}
                      onChange={e => setOriginAddress(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                      placeholder={fOriginAddress.placeholder}
                    />
                  </div>
                )}
                {fOriginNumber.enabled && (
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      {fOriginNumber.label} {fOriginNumber.required && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      required={fOriginNumber.required}
                      value={originNumber}
                      onChange={e => setOriginNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                      placeholder={fOriginNumber.placeholder}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">Data Coleta</label>
                  <input
                    type="date"
                    required
                    value={originDate}
                    onChange={e => setOriginDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">Janela de Horário</label>
                  <input
                    type="text"
                    value={originTimeWindow}
                    onChange={e => setOriginTimeWindow(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                    placeholder="08:00 às 12:00"
                  />
                </div>
              </div>
            </div>

            {/* Destino */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 block flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> 2. Destino (Entrega)
              </span>

              <div className="grid grid-cols-3 gap-2">
                {fDestCity.enabled && (
                  <div className="col-span-2">
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      {fDestCity.label} {fDestCity.required && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      required={fDestCity.required}
                      value={destCity}
                      onChange={e => setDestCity(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                      placeholder={fDestCity.placeholder}
                    />
                  </div>
                )}
                {fDestState.enabled && (
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      {fDestState.label} {fDestState.required && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      required={fDestState.required}
                      maxLength={2}
                      value={destState}
                      onChange={e => setDestState(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium uppercase"
                      placeholder={fDestState.placeholder}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                {fDestAddress.enabled && (
                  <div className="col-span-2">
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      {fDestAddress.label} {fDestAddress.required && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      required={fDestAddress.required}
                      value={destAddress}
                      onChange={e => setDestAddress(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                      placeholder={fDestAddress.placeholder}
                    />
                  </div>
                )}
                {fDestNumber.enabled && (
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      {fDestNumber.label} {fDestNumber.required && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      required={fDestNumber.required}
                      value={destNumber}
                      onChange={e => setDestNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                      placeholder={fDestNumber.placeholder}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">Data Prevista</label>
                  <input
                    type="date"
                    required
                    value={destDate}
                    onChange={e => setDestDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">Janela de Horário</label>
                  <input
                    type="text"
                    value={destTimeWindow}
                    onChange={e => setDestTimeWindow(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                    placeholder="14:00 às 18:00"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Carga e Transporte */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
              3. Detalhes da Carga e Veículo Exigido
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {fCargoDesc.enabled && (
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    {fCargoDesc.label} {fCargoDesc.required && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    required={fCargoDesc.required}
                    value={cargoDesc}
                    onChange={e => setCargoDesc(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                    placeholder={fCargoDesc.placeholder}
                  />
                </div>
              )}
              {fCargoType.enabled && (
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    {fCargoType.label} {fCargoType.required && <span className="text-red-500">*</span>}
                  </label>
                  <select
                    value={cargoType}
                    required={fCargoType.required}
                    onChange={e => setCargoType(e.target.value as CargoType | 'VEICULO')}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                  >
                    <option value="VEICULO">Veículo / Caminhão / Implemento</option>
                    <option value="GERAL">Carga Geral</option>
                    <option value="ALIMENTOS">Alimentos / Bebidas</option>
                    <option value="REFRIGERADA">Refrigerada / Congelada</option>
                    <option value="FRAGIL">Frágil</option>
                    <option value="CONSTRUCAO">Material Construção</option>
                    <option value="MAQUINARIO">Maquinário / Peças</option>
                    <option value="PERIGOSA">Perigosa (Química)</option>
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {fWeight.enabled && (
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    {fWeight.label} {fWeight.required && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="number"
                    required={fWeight.required}
                    value={weightKg}
                    onChange={e => setWeightKg(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                    placeholder={fWeight.placeholder}
                  />
                </div>
              )}
              {fVolumes.enabled && (
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    {fVolumes.label} {fVolumes.required && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="number"
                    required={fVolumes.required}
                    value={volumeCount}
                    onChange={e => setVolumeCount(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                    placeholder={fVolumes.placeholder}
                  />
                </div>
              )}
              {fVehicleType.enabled && (
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    {fVehicleType.label} {fVehicleType.required && <span className="text-red-500">*</span>}
                  </label>
                  <select
                    value={vehicleType}
                    required={fVehicleType.required}
                    onChange={e => setVehicleType(e.target.value as VehicleType)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-emerald-700 dark:text-emerald-400"
                  >
                    <option value="TRUCK">Truck (14 ton)</option>
                    <option value="TOCO">Toco (8 ton)</option>
                    <option value="CARRETA">Carreta (28 ton)</option>
                    <option value="BITREM">Bitrem (38 ton)</option>
                    <option value="VUC">VUC / 3/4 (3.5 ton)</option>
                    <option value="FIORINO">Fiorino / Utilitário</option>
                    <option value="VAN">Van de Carga</option>
                  </select>
                </div>
              )}
              {fBodyType.enabled && (
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    {fBodyType.label} {fBodyType.required && <span className="text-red-500">*</span>}
                  </label>
                  <select
                    value={bodyType}
                    required={fBodyType.required}
                    onChange={e => setBodyType(e.target.value as BodyType)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                  >
                    <option value="BAU">Baú Fechado</option>
                    <option value="SIDER">Sider (Lona)</option>
                    <option value="GRADE_BAIXA">Grade Baixa</option>
                    <option value="GRANELEIRO">Graneleiro</option>
                    <option value="REFRIGERADO">Refrigerado</option>
                    <option value="PLATAFORMA">Plataforma</option>
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {fBrand.enabled && (
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    {fBrand.label} {fBrand.required && <span className="text-red-500">*</span>}
                  </label>
                  <select
                    value={vehicleBrand}
                    required={fBrand.required}
                    onChange={e => setVehicleBrand(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold"
                  >
                    <option value="Volkswagen">Volkswagen</option>
                    <option value="Mercedes-Benz">Mercedes-Benz</option>
                    <option value="Iveco">Iveco</option>
                    <option value="Scania">Scania</option>
                    <option value="Ford">Ford</option>
                    <option value="Volvo">Volvo</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
              )}
              {vehicleBrand === 'Outro' && (
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">Especifique a Marca / Veículo</label>
                  <input
                    type="text"
                    required={vehicleBrand === 'Outro'}
                    value={otherVehicleBrand}
                    onChange={e => setOtherVehicleBrand(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                    placeholder="Digite a marca..."
                  />
                </div>
              )}
            </div>

            {/* Campos de Transporte de Veículos */}
            {cargoType === 'VEICULO' && (
              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 mt-2 space-y-3">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">Detalhes do Veículo Transportado (Ocultos até o aceite)</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Produto Veículo</label>
                    <input
                      type="text"
                      value={vehicleProduct}
                      onChange={e => setVehicleProduct(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                      placeholder="Ex: CR REBAIXADA ALUMÍNIO"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Chassi</label>
                    <input
                      type="text"
                      value={chassis}
                      onChange={e => setChassis(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                      placeholder="Nº do Chassi"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Status Rastreador</label>
                    <input
                      type="text"
                      value={trackerStatus}
                      onChange={e => setTrackerStatus(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                      placeholder="Ex: INSTALADO"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">NF Venda Veículo</label>
                    <input
                      type="text"
                      value={nfVehicleSale}
                      onChange={e => setNfVehicleSale(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                      placeholder="Ex: 2588891"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">NF Venda Facchini</label>
                    <input
                      type="text"
                      value={nfFacchini}
                      onChange={e => setNfFacchini(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                      placeholder="Ex: 0365381"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Placas</label>
                    <input
                      type="text"
                      value={platesStatus}
                      onChange={e => setPlatesStatus(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                      placeholder="Ex: S/ PLACA"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Pagamento */}
          <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-900/40 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-600" /> 4. Pagamento do Motorista
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {fValue.enabled && operationType === 'CARGA_GERAL' && (
                <div>
                  <label className="text-[11px] font-bold text-emerald-900 dark:text-emerald-200 block mb-1">
                    {fValue.label} {fValue.required && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required={fValue.required}
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border-2 border-emerald-400 dark:border-emerald-600 rounded-lg text-sm font-extrabold text-emerald-700 dark:text-emerald-300"
                    placeholder={fValue.placeholder}
                  />
                </div>
              )}
              {fValue.enabled && operationType === 'LOGISTICA_VEICULOS' && (
                <div className="col-span-1 sm:col-span-2 grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-blue-900 dark:text-blue-200 block mb-1">
                      Valor Cobrado do Cliente (NF) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={clientRevenue}
                      onChange={e => {
                        setClientRevenue(e.target.value);
                        setPrice(e.target.value); // fallback
                      }}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border-2 border-blue-400 dark:border-blue-600 rounded-lg text-sm font-extrabold text-blue-700 dark:text-blue-300"
                      placeholder="Ex: 2500.00"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-orange-900 dark:text-orange-200 block mb-1">
                      Valor Repasse ao Motorista <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={driverCost}
                      onChange={e => setDriverCost(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border-2 border-orange-400 dark:border-orange-600 rounded-lg text-sm font-extrabold text-orange-700 dark:text-orange-300"
                      placeholder="Ex: 1200.00"
                    />
                  </div>
                </div>
              )}
              {fPaymentMethod.enabled && (
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    {fPaymentMethod.label} {fPaymentMethod.required && <span className="text-red-500">*</span>}
                  </label>
                  <select
                    value={paymentMethod}
                    required={fPaymentMethod.required}
                    onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                  >
                    <option value="PIX">PIX Direto</option>
                    <option value="TRANSFERENCIA">Transferência Bancária</option>
                    <option value="A_VISTA">À Vista na Descarga</option>
                    <option value="FATURADO_30D">Faturado 30 Dias</option>
                  </select>
                </div>
              )}
              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tollIncluded}
                    onChange={e => setTollIncluded(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span>Pedágio incluso no valor</span>
                </label>
              </div>
            </div>
          </div>

          {/* Instant Publish Toggle */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">Publicar Imediatamente</span>
              <span className="text-[11px] text-slate-500">Notifica instantaneamente todos os motoristas elegíveis cadastrados.</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={publishImmediately}
                onChange={e => setPublishImmediately(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Cadastrando...' : publishImmediately ? 'Publicar Frete Agora 🚀' : 'Salvar como Rascunho'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
