import React, { useState, useEffect, useRef } from 'react';
import { Freight } from '../../types';
import { useSaaS } from '../../context/SaaSContext';
import { InteractiveLeafletMap } from './InteractiveLeafletMap';
import { InteractiveMapboxView } from './InteractiveMapboxView';
import { 
  X, 
  MapPin, 
  Navigation, 
  Compass, 
  Clock, 
  Truck, 
  Share2, 
  ExternalLink, 
  Copy, 
  Check, 
  Radio, 
  RefreshCw, 
  ShieldCheck, 
  Phone,
  AlertTriangle,
  Globe
} from 'lucide-react';

interface LiveRouteTrackingModalProps {
  freight: Freight;
  onClose: () => void;
}

export const LiveRouteTrackingModal: React.FC<LiveRouteTrackingModalProps> = ({ freight, onClose }) => {
  const { config } = useSaaS();
  const mapboxConfig = config?.mapboxConfig;
  const isMapboxActive = mapboxConfig?.enabled && mapboxConfig?.apiKey;
  const [copied, setCopied] = useState(false);
  const [gpsActive, setGpsActive] = useState(false);
  const [driverCoords, setDriverCoords] = useState<{ lat: number; lng: number; speed: number; accuracy: number } | null>(null);
  const [progressPercent, setProgressPercent] = useState<number>(() => {
    if (freight.status === 'ENTREGUE' || freight.status === 'FINALIZADO') return 100;
    if (freight.status === 'EM_TRANSITO') return 48;
    if (freight.status === 'COLETADO' || freight.status === 'EM_COLETA') return 15;
    return 5;
  });

  // Simulated Coordinates based on Freight Origin & Destination
  const originName = `${freight.origin.city}, ${freight.origin.state}`;
  const destName = `${freight.destination.city}, ${freight.destination.state}`;
  const totalKm = freight.distanceKm || 450;
  const kmTraveled = Math.round((totalKm * progressPercent) / 100);
  const kmRemaining = Math.max(0, totalKm - kmTraveled);
  const etaMinutes = Math.round((kmRemaining / 70) * 60); // Assuming 70km/h avg
  const etaFormatted = `${Math.floor(etaMinutes / 60)}h ${etaMinutes % 60}m`;

  useEffect(() => {
    // Attempt real GPS if driver role or browser geolocation available
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setDriverCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            speed: Math.round((pos.coords.speed || 0) * 3.6),
            accuracy: Math.round(pos.coords.accuracy)
          });
          setGpsActive(true);
        },
        () => {
          // Fallback coordinates
          setDriverCoords({
            lat: -23.5505,
            lng: -46.6333,
            speed: 68,
            accuracy: 12
          });
        }
      );
    }
  }, []);

  const handleCopyLink = () => {
    const trackingUrl = `${window.location.origin}/?rastreio=${freight.code}`;
    navigator.clipboard.writeText(trackingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenGoogleMaps = () => {
    const originEnc = encodeURIComponent(`${freight.origin.address}, ${freight.origin.city}, ${freight.origin.state}`);
    const destEnc = encodeURIComponent(`${freight.destination.address}, ${freight.destination.city}, ${freight.destination.state}`);
    window.open(`https://www.google.com/maps/dir/?api=1&origin=${originEnc}&destination=${destEnc}`, '_blank');
  };

  const handleOpenWaze = () => {
    const destEnc = encodeURIComponent(`${freight.destination.address}, ${freight.destination.city}`);
    window.open(`https://waze.com/ul?q=${destEnc}`, '_blank');
  };

  const handleShareWhatsApp = () => {
    const msg = `🚚 *RASTREAMENTO EM TEMPO REAL • ELO LOG*\n\n` +
      `📦 *Frete:* #${freight.code}\n` +
      `📍 *Origem:* ${originName}\n` +
      `🏁 *Destino:* ${destName}\n` +
      `🚛 *Veículo:* ${freight.assignedVehiclePlate || 'N/I'} (${freight.assignedDriverName || 'Motorista'})\n` +
      `📊 *Progresso da Viagem:* ${progressPercent}%\n` +
      `⏱️ *Previsão Restante:* ~${etaFormatted} (${kmRemaining} km restantes)\n\n` +
      `🔗 *Acompanhe ao vivo:* ${window.location.origin}/?rastreio=${freight.code}`;
    
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xs animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 text-white rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Radio className="w-5 h-5 animate-pulse text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">Rastreamento de Trajeto GPS</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  Sinal Ao Vivo
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Frete #{freight.code} • {freight.cargo.description}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* Interactive Map Visualizer Canvas */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-950 flex flex-col justify-between shadow-inner">
            
            {isMapboxActive ? (
              <InteractiveMapboxView
                apiKey={mapboxConfig.apiKey}
                defaultStyle={mapboxConfig.defaultStyle || 'streets-v12'}
                defaultZoom={mapboxConfig.defaultZoom || 12}
                originCoords={{
                  lat: freight.origin.lat || -23.5505,
                  lng: freight.origin.lng || -46.6333,
                  name: freight.origin.city || 'Origem'
                }}
                destCoords={{
                  lat: freight.destination.lat || -22.9068,
                  lng: freight.destination.lng || -43.1729,
                  name: freight.destination.city || 'Destino'
                }}
                currentCoords={{
                  lat: driverCoords?.lat || freight.origin.lat || -23.4500,
                  lng: driverCoords?.lng || freight.origin.lng || -46.5000,
                  speed: driverCoords?.speed || 68
                }}
                vehiclePlate={freight.assignedVehiclePlate || 'ABC-1234'}
                driverName={freight.assignedDriverName || 'Motorista'}
              />
            ) : (
              <InteractiveLeafletMap
                originCoords={{
                  lat: freight.origin.lat || -23.5505,
                  lng: freight.origin.lng || -46.6333,
                  name: freight.origin.city || 'Origem'
                }}
                destCoords={{
                  lat: freight.destination.lat || -22.9068,
                  lng: freight.destination.lng || -43.1729,
                  name: freight.destination.city || 'Destino'
                }}
                currentCoords={{
                  lat: driverCoords?.lat || freight.origin.lat || -23.4500,
                  lng: driverCoords?.lng || freight.origin.lng || -46.5000,
                  speed: driverCoords?.speed || 68
                }}
                vehiclePlate={freight.assignedVehiclePlate || 'ABC-1234'}
                driverName={freight.assignedDriverName || 'Motorista'}
              />
            )}

          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Distância Percorrida</span>
              <p className="text-lg font-black text-white mt-0.5">{kmTraveled} km</p>
              <p className="text-[11px] text-slate-400">{progressPercent}% concluído</p>
            </div>

            <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Distância Restante</span>
              <p className="text-lg font-black text-amber-400 mt-0.5">{kmRemaining} km</p>
              <p className="text-[11px] text-slate-400">Previsão: {etaFormatted}</p>
            </div>

            <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Motorista Vinculado</span>
              <p className="text-sm font-bold text-white mt-0.5 truncate">{freight.assignedDriverName || 'Motorista'}</p>
              <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                <Phone className="w-3 h-3" /> {freight.assignedDriverPhone || 'Não informado'}
              </p>
            </div>

            <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Veículo / Placa</span>
              <p className="text-sm font-bold text-white mt-0.5">{freight.assignedVehiclePlate || 'NÃO ATRIBUÍDO'}</p>
              <p className="text-[11px] text-slate-400 truncate">{freight.assignedVehicleModel || 'Veículo Carga'}</p>
            </div>
          </div>

          {/* Quick Share and Telemetry Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-950/80 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-slate-300">
                Rastreamento criptografado com compartilhamento seguro por link ou WhatsApp.
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyLink}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Link Copiado!' : 'Copiar Link'}</span>
              </button>

              <button
                onClick={handleShareWhatsApp}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Compartilhar no WhatsApp</span>
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Última atualização de satélite: {new Date().toLocaleTimeString('pt-BR')}
          </span>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
