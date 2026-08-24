import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Truck, MapPin, Compass, AlertCircle, Navigation } from 'lucide-react';

interface InteractiveMapboxViewProps {
  apiKey: string;
  defaultStyle?: string;
  defaultZoom?: number;
  originCoords?: { lat: number; lng: number; name: string };
  destCoords?: { lat: number; lng: number; name: string };
  currentCoords?: { lat: number; lng: number; speed: number; heading?: number };
  vehiclePlate?: string;
  driverName?: string;
}

export const InteractiveMapboxView: React.FC<InteractiveMapboxViewProps> = ({
  apiKey,
  defaultStyle = 'streets-v12',
  defaultZoom = 12,
  originCoords = { lat: -23.5505, lng: -46.6333, name: 'Origem (São Paulo)' },
  destCoords = { lat: -22.9068, lng: -43.1729, name: 'Destino (Rio de Janeiro)' },
  currentCoords = { lat: -23.2237, lng: -45.8953, speed: 68 },
  vehiclePlate = 'ABC-1234',
  driverName = 'Motorista'
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!apiKey || !mapContainerRef.current) {
      setMapError('Token da API Mapbox não configurado ou inválido.');
      return;
    }

    try {
      mapboxgl.accessToken = apiKey.trim();

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: `mapbox://styles/mapbox/${defaultStyle}`,
        center: [currentCoords.lng, currentCoords.lat],
        zoom: defaultZoom,
        attributionControl: false
      });

      mapInstanceRef.current = map;

      map.on('load', () => {
        setMapLoaded(true);

        // Add Navigation controls (+ / - zoom / compass)
        map.addControl(new mapboxgl.NavigationControl(), 'top-right');

        // Add Origin Marker
        const originEl = document.createElement('div');
        originEl.className = 'w-7 h-7 rounded-full bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-lg ring-4 ring-emerald-500/30 border-2 border-white';
        originEl.innerHTML = 'A';
        new mapboxgl.Marker(originEl)
          .setLngLat([originCoords.lng, originCoords.lat])
          .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`<div style="color:#0f172a; font-weight:bold; font-size:12px;">Origem: ${originCoords.name}</div>`))
          .addTo(map);

        // Add Destination Marker
        const destEl = document.createElement('div');
        destEl.className = 'w-7 h-7 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-lg ring-4 ring-blue-600/30 border-2 border-white';
        destEl.innerHTML = 'B';
        new mapboxgl.Marker(destEl)
          .setLngLat([destCoords.lng, destCoords.lat])
          .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`<div style="color:#0f172a; font-weight:bold; font-size:12px;">Destino: ${destCoords.name}</div>`))
          .addTo(map);

        // Add Live Truck / Vehicle Marker
        const truckEl = document.createElement('div');
        truckEl.className = 'flex flex-col items-center animate-bounce';
        truckEl.innerHTML = `
          <div style="background: #10b981; color: #022c22; width: 36px; height: 36px; border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 25px rgba(16,185,129,0.5); border: 2px solid #ffffff;">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
          </div>
          <div style="background: #090d16; color: #34d399; font-size: 10px; font-weight: 900; padding: 2px 8px; border-radius: 9999px; border: 1px solid rgba(52,211,153,0.4); margin-top: 4px; white-space: nowrap; box-shadow: 0 4px 12px rgba(0,0,0,0.5);">
            ${vehiclePlate} • ${currentCoords.speed} km/h
          </div>
        `;

        const marker = new mapboxgl.Marker({ element: truckEl, anchor: 'center' })
          .setLngLat([currentCoords.lng, currentCoords.lat])
          .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div style="color:#0f172a; padding: 4px;">
              <strong style="font-size: 13px; display: block; margin-bottom: 2px;">Veículo: ${vehiclePlate}</strong>
              <span style="font-size: 11px; color: #475569;">Motorista: ${driverName}</span><br/>
              <span style="font-size: 11px; color: #059669; font-weight: bold;">Velocidade: ${currentCoords.speed} km/h</span>
            </div>
          `))
          .addTo(map);

        markerRef.current = marker;

        // Draw connecting route line (GeoJSON source)
        try {
          map.addSource('route-line', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: [
                  [originCoords.lng, originCoords.lat],
                  [currentCoords.lng, currentCoords.lat],
                  [destCoords.lng, destCoords.lat]
                ]
              }
            }
          });

          map.addLayer({
            id: 'route-line-layer',
            type: 'line',
            source: 'route-line',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#10b981',
              'line-width': 5,
              'line-opacity': 0.85,
              'line-dasharray': [1, 2]
            }
          });
        } catch (err) {
          console.error('Error drawing route line:', err);
        }
      });

      map.on('error', (e) => {
        console.error('Mapbox error event:', e);
        setMapError('Erro ao carregar renderizador Mapbox. Verifique se o token é válido.');
      });

    } catch (err: any) {
      console.error('Initialization error for Mapbox:', err);
      setMapError('Erro ao inicializar Mapbox: ' + (err.message || 'Erro desconhecido'));
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [apiKey, defaultStyle, defaultZoom]);

  // Update marker position when coords change
  useEffect(() => {
    if (markerRef.current && currentCoords) {
      markerRef.current.setLngLat([currentCoords.lng, currentCoords.lat]);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.easeTo({
          center: [currentCoords.lng, currentCoords.lat],
          duration: 1000
        });
      }
    }
  }, [currentCoords]);

  if (mapError) {
    return (
      <div className="w-full h-[320px] sm:h-[380px] rounded-2xl bg-slate-950 border border-amber-500/30 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3 border border-amber-500/30">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-white mb-1">Aviso do Mapa Mapbox</h4>
        <p className="text-xs text-slate-400 max-w-md leading-relaxed mb-4">
          {mapError}. Configure um token válido na aba <strong>Mapbox API & Rastreio</strong> no painel de Super Admin ou utilize o modo simulado abaixo.
        </p>
        <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
          <Navigation className="w-4 h-4 animate-spin" />
          <span>Telemetria GPS Ativa em Tempo Real</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[320px] sm:h-[380px] rounded-2xl overflow-hidden border border-slate-700/80 shadow-inner">
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />
      {!mapLoaded && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center gap-2 text-xs font-bold text-sky-400">
          <Navigation className="w-4 h-4 animate-spin text-sky-400" />
          <span>Carregando Satélite Mapbox GL...</span>
        </div>
      )}
    </div>
  );
};
