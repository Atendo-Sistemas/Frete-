import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { VehicleType, CargoType, PaymentMethod, BodyType, Freight } from '../../types';
import { Truck, MapPin, DollarSign, Calendar, Package, X, Sparkles, AlertCircle } from 'lucide-react';

interface FreightFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (freight: Freight) => void;
  freightToEdit?: Freight | null;
}

export const FreightFormModal: React.FC<FreightFormModalProps> = ({ isOpen, onClose, onSuccess, freightToEdit }) => {
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

  const [cargoDesc, setCargoDesc] = useState('Carga geral paletizada - Peças automotivas');
  const [cargoType, setCargoType] = useState<CargoType>('GERAL');
  const [weightKg, setWeightKg] = useState('8500');
  const [volumeCount, setVolumeCount] = useState('16');
  const [cargoNotes, setCargoNotes] = useState('Carga com NF e Manifesto emitidos. Carga segurada.');

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

      setCargoDesc(freightToEdit.cargo.description);
      setCargoType(freightToEdit.cargo.type);
      setWeightKg(String(freightToEdit.cargo.weightKg));
      setVolumeCount(String(freightToEdit.cargo.volumeCount || 1));
      setCargoNotes(freightToEdit.cargo.notes || '');

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
    }
  }, [freightToEdit]);

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
          requiresInsurance: true
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
          
          {/* Section 1: Origem e Destino */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Origem */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> 1. Origem (Coleta)
              </span>
              
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">Cidade</label>
                  <input
                    type="text"
                    required
                    value={originCity}
                    onChange={e => setOriginCity(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                    placeholder="Ex: São José do Rio Preto"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">UF</label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    value={originState}
                    onChange={e => setOriginState(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium uppercase"
                    placeholder="SP"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">Endereço</label>
                  <input
                    type="text"
                    value={originAddress}
                    onChange={e => setOriginAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                    placeholder="Av. Alberto Andaló"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">Número</label>
                  <input
                    type="text"
                    value={originNumber}
                    onChange={e => setOriginNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                    placeholder="3100"
                  />
                </div>
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
                <div className="col-span-2">
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">Cidade</label>
                  <input
                    type="text"
                    required
                    value={destCity}
                    onChange={e => setDestCity(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                    placeholder="Ex: São Paulo"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">UF</label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    value={destState}
                    onChange={e => setDestState(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium uppercase"
                    placeholder="SP"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">Endereço</label>
                  <input
                    type="text"
                    value={destAddress}
                    onChange={e => setDestAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                    placeholder="Av. Paulista"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">Número</label>
                  <input
                    type="text"
                    value={destNumber}
                    onChange={e => setDestNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                    placeholder="1000"
                  />
                </div>
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
              <div className="sm:col-span-2">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">Descrição da Carga</label>
                <input
                  type="text"
                  required
                  value={cargoDesc}
                  onChange={e => setCargoDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                  placeholder="Ex: Carga geral paletizada - Peças industriais"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">Tipo de Carga</label>
                <select
                  value={cargoType}
                  onChange={e => setCargoType(e.target.value as CargoType)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                >
                  <option value="GERAL">Carga Geral</option>
                  <option value="ALIMENTOS">Alimentos / Bebidas</option>
                  <option value="REFRIGERADA">Refrigerada / Congelada</option>
                  <option value="FRAGIL">Frágil</option>
                  <option value="CONSTRUCAO">Material Construção</option>
                  <option value="MAQUINARIO">Maquinário / Peças</option>
                  <option value="PERIGOSA">Perigosa (Química)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">Peso Total (Kg)</label>
                <input
                  type="number"
                  required
                  value={weightKg}
                  onChange={e => setWeightKg(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                  placeholder="8500"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">Volumes</label>
                <input
                  type="number"
                  value={volumeCount}
                  onChange={e => setVolumeCount(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                  placeholder="16"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">Tipo de Veículo</label>
                <select
                  value={vehicleType}
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
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">Carroceria</label>
                <select
                  value={bodyType}
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">Montadora / Marca do Veículo</label>
                <select
                  value={vehicleBrand}
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
          </div>

          {/* Section 3: Pagamento */}
          <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-900/40 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-600" /> 4. Pagamento do Motorista
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-emerald-900 dark:text-emerald-200 block mb-1">Valor do Frete (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border-2 border-emerald-400 dark:border-emerald-600 rounded-lg text-sm font-extrabold text-emerald-700 dark:text-emerald-300"
                  placeholder="1850.00"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">Forma de Pagamento</label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                >
                  <option value="PIX">PIX Direto</option>
                  <option value="TRANSFERENCIA">Transferência Bancária</option>
                  <option value="A_VISTA">À Vista na Descarga</option>
                  <option value="FATURADO_30D">Faturado 30 Dias</option>
                </select>
              </div>
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
