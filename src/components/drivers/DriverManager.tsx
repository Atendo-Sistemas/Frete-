import React, { useState, useEffect } from 'react';
import { Driver, Vehicle } from '../../types';
import { api } from '../../services/api';
import { useSaaS } from '../../context/SaaSContext';
import { VehicleBadge } from '../common/Badge';
import { 
  Users, 
  Truck, 
  Search, 
  Phone, 
  MapPin, 
  Award, 
  ShieldCheck, 
  CheckCircle, 
  FileText, 
  Plus,
  Car,
  Trash2,
  Pencil,
  X
} from 'lucide-react';

export const DriverManager: React.FC = () => {
  const { getField } = useSaaS();
  const fName = getField('driverForm', 'name') || { label: 'Nome Completo', placeholder: 'Ex: João da Silva', enabled: true, required: true };
  const fEmail = getField('driverForm', 'email') || { label: 'E-mail', placeholder: 'joao@translog.com', enabled: true, required: true };
  const fPhone = getField('driverForm', 'phone') || { label: 'Telefone / WhatsApp', placeholder: '(11) 98888-7777', enabled: true, required: true };
  const fCpf = getField('driverForm', 'cpf') || { label: 'CPF', placeholder: '123.456.789-00', enabled: true, required: true };
  const fRg = getField('driverForm', 'rg') || { label: 'RG', placeholder: '12.345.678-9', enabled: true, required: false };
  const fCity = getField('driverForm', 'city') || { label: 'Cidade', placeholder: 'São Paulo', enabled: true, required: true };
  const fState = getField('driverForm', 'state') || { label: 'Estado (UF)', placeholder: 'SP', enabled: true, required: true };
  const fCnh = getField('driverForm', 'cnh') || { label: 'CNH', placeholder: 'Nº CNH', enabled: true, required: true };
  const fCnhCategory = getField('driverForm', 'cnhCategory') || { label: 'Categoria', placeholder: '', enabled: true, required: true };

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');
  const [rg, setRg] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('SP');
  const [cnh, setCnh] = useState('');
  const [cnhCategory, setCnhCategory] = useState('E');
  
  // Vehicle fields for creation
  const [vehicleType, setVehicleType] = useState('TRUCK');
  const [vehicleBrand, setVehicleBrand] = useState('Volkswagen');
  const [vehicleModel, setVehicleModel] = useState('Constellation');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [capacityKg, setCapacityKg] = useState('14000');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dList, vList] = await Promise.all([api.getDrivers(), api.getVehicles()]);
      setDrivers(dList);
      setVehicles(vList);
    } catch (err) {
      console.error('Erro ao carregar motoristas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingDriver(null);
    setName('');
    setEmail('');
    setPhone('');
    setCpf('');
    setRg('');
    setCity('');
    setState('SP');
    setCnh('');
    setCnhCategory('E');
    setVehicleType('TRUCK');
    setVehicleBrand('Volkswagen');
    setVehicleModel('Constellation');
    setVehiclePlate('');
    setCapacityKg('14000');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (driver: Driver) => {
    setEditingDriver(driver);
    setName(driver.name);
    setEmail(driver.email || '');
    setPhone(driver.phone || '');
    setCpf(driver.cpf || '');
    setRg(driver.rg || '');
    setCity(driver.city || '');
    setState(driver.state || 'SP');
    setCnh(driver.cnh || '');
    setCnhCategory(driver.cnhCategory || 'E');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDriver) {
        await api.updateDriver(editingDriver.id, {
          name,
          email,
          phone,
          cpf,
          rg,
          city,
          state,
          cnh,
          cnhCategory
        });
        alert('Motorista atualizado com sucesso!');
      } else {
        await api.registerDriver({
          name,
          email,
          phone,
          cpf,
          rg,
          city,
          state,
          cnh,
          cnhCategory,
          vehicleType,
          vehicleBrand,
          vehicleModel,
          vehiclePlate,
          capacityKg: Number(capacityKg)
        });
        alert('Motorista cadastrado com sucesso!');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar motorista');
    }
  };

  const handleDeleteDriver = async (id: string, name: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o motorista ${name}? Veículos associados também serão removidos.`)) return;
    try {
      await api.deleteDriver(id);
      setDrivers(prev => prev.filter(d => d.id !== id));
      setVehicles(prev => prev.filter(v => v.driverId !== id));
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir motorista');
    }
  };

  const filtered = drivers.filter(d => {
    const term = searchTerm.toLowerCase();
    return (
      d.name.toLowerCase().includes(term) ||
      d.cpf.includes(term) ||
      d.city.toLowerCase().includes(term) ||
      d.state.toLowerCase().includes(term) ||
      d.cnh.includes(term)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-emerald-600" />
            <span>Gestão de Motoristas & Frotistas</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Cadastre, edite e gerencie motoristas autônomos e agregados, CNH, documentos e veículos aptos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold px-3 py-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
            {drivers.length} motorista(s) habilitado(s)
          </span>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Novo Motorista</span>
          </button>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por nome, CPF, CNH ou cidade do motorista..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full bg-transparent text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
        />
      </div>

      {/* Driver Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(driver => {
          const driverVehicles = vehicles.filter(v => v.driverId === driver.id);

          return (
            <div
              key={driver.id}
              className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 hover:border-emerald-500/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-base">
                      {driver.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">{driver.name}</h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {driver.city}/{driver.state}
                      </p>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                    ★ {driver.rating.toFixed(1)}
                  </span>
                </div>

                {/* Contact & Docs */}
                <div className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <p className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{driver.phone}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>CNH Cat. {driver.cnhCategory} ({driver.cnh})</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>RNTRC: {driver.rntrc || 'Ativo'}</span>
                  </p>
                </div>

                {/* Vehicles list */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                    Veículos Vinculados ({driverVehicles.length})
                  </span>
                  <div className="space-y-1.5">
                    {driverVehicles.map(v => (
                      <div key={v.id} className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-xs flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Car className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-bold text-slate-800 dark:text-slate-200">{v.plate}</span>
                          <span className="text-slate-500">• {v.brand} {v.model}</span>
                        </div>
                        <VehicleBadge type={v.type} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">
                  {driver.completedTrips} viagens concluídas
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(driver)}
                    className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 transition-colors cursor-pointer"
                    title="Editar motorista"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteDriver(driver.id, driver.name)}
                    className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 transition-colors cursor-pointer"
                    title="Excluir motorista"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Criar / Editar Motorista */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {editingDriver ? 'Editar Motorista' : 'Cadastrar Novo Motorista'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {fName.enabled && (
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      {fName.label} {fName.required && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      required={fName.required}
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                      placeholder={fName.placeholder}
                    />
                  </div>
                )}
                {fEmail.enabled && (
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      {fEmail.label} {fEmail.required && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="email"
                      required={fEmail.required}
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                      placeholder={fEmail.placeholder}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {fPhone.enabled && (
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      {fPhone.label} {fPhone.required && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      required={fPhone.required}
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                      placeholder={fPhone.placeholder}
                    />
                  </div>
                )}
                {fCpf.enabled && (
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      {fCpf.label} {fCpf.required && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      required={fCpf.required}
                      value={cpf}
                      onChange={e => setCpf(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                      placeholder={fCpf.placeholder}
                    />
                  </div>
                )}
                {fRg.enabled && (
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      {fRg.label} {fRg.required && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      required={fRg.required}
                      value={rg}
                      onChange={e => setRg(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                      placeholder={fRg.placeholder}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {fCity.enabled && (
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      {fCity.label} {fCity.required && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      required={fCity.required}
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                      placeholder={fCity.placeholder}
                    />
                  </div>
                )}
                {fState.enabled && (
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      {fState.label} {fState.required && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      required={fState.required}
                      maxLength={2}
                      value={state}
                      onChange={e => setState(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                      placeholder={fState.placeholder}
                    />
                  </div>
                )}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">CNH / Categoria</label>
                  <div className="flex gap-2">
                    {fCnh.enabled && (
                      <input
                        type="text"
                        required={fCnh.required}
                        value={cnh}
                        onChange={e => setCnh(e.target.value)}
                        className="w-2/3 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                        placeholder={fCnh.placeholder}
                      />
                    )}
                    {fCnhCategory.enabled && (
                      <select
                        value={cnhCategory}
                        required={fCnhCategory.required}
                        onChange={e => setCnhCategory(e.target.value)}
                        className="w-1/3 px-2 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
                      >
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                        <option value="E">E</option>
                      </select>
                    )}
                  </div>
                </div>
              </div>

              {!editingDriver && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Dados do Veículo Principal</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Tipo de Veículo</label>
                      <select
                        value={vehicleType}
                        onChange={e => setVehicleType(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold"
                      >
                        <option value="TRUCK">Truck (14t)</option>
                        <option value="CARRETA">Carreta (25t)</option>
                        <option value="BITREM">Bitrem (37t)</option>
                        <option value="TOCO">Toco (8t)</option>
                        <option value="VAN">Van / Fiorino</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Marca / Modelo</label>
                      <input
                        type="text"
                        value={vehicleModel}
                        onChange={e => setVehicleModel(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                        placeholder="Ex: Volvo FH / Atego"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Placa</label>
                      <input
                        type="text"
                        required
                        value={vehiclePlate}
                        onChange={e => setVehiclePlate(e.target.value.toUpperCase())}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium uppercase"
                        placeholder="ABC1D23"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md cursor-pointer"
                >
                  {editingDriver ? 'Salvar Alterações' : 'Cadastrar Motorista'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
