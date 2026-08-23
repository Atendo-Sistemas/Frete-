import React, { useState, useEffect } from 'react';
import { Driver, Vehicle } from '../../types';
import { api } from '../../services/api';
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
  Trash2
} from 'lucide-react';

export const DriverManager: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  useEffect(() => {
    const load = async () => {
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
    load();
  }, []);

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
            Visualize a base de motoristas autônomos e agregados cadastrados, documentos, CNH e veículos aptos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
            {drivers.length} motorista(s) habilitado(s)
          </span>
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
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Aprovado
                  </span>
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

    </div>
  );
};
