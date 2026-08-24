import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Truck, MapPin } from 'lucide-react';

interface InteractiveLeafletMapProps {
  originCoords: { lat: number; lng: number; name: string };
  destCoords: { lat: number; lng: number; name: string };
  currentCoords: { lat: number; lng: number; speed: number };
  vehiclePlate?: string;
  driverName?: string;
}

export const InteractiveLeafletMap: React.FC<InteractiveLeafletMapProps> = ({
  originCoords,
  destCoords,
  currentCoords,
  vehiclePlate = 'ABC-1234',
  driverName = 'Motorista'
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Leaflet Map
    const map = L.map(mapContainerRef.current, {
      center: [currentCoords.lat, currentCoords.lng],
      zoom: 11,
      zoomControl: true
    });

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map);

    // Origin Marker
    const originIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color: #10b981; color: #0f172a; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 12px; border: 2px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">A</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    L.marker([originCoords.lat, originCoords.lng], { icon: originIcon })
      .addTo(map)
      .bindPopup(`<b>Origem:</b> ${originCoords.name}`);

    // Destination Marker
    const destIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color: #3b82f6; color: #ffffff; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 12px; border: 2px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">B</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    L.marker([destCoords.lat, destCoords.lng], { icon: destIcon })
      .addTo(map)
      .bindPopup(`<b>Destino:</b> ${destCoords.name}`);

    // Vehicle / Driver Marker
    const truckIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color: #059669; color: #ffffff; width: 36px; height: 36px; border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 20px rgba(5,150,105,0.5); border: 2px solid white;">🚚</div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    const vehicleMarker = L.marker([currentCoords.lat, currentCoords.lng], { icon: truckIcon })
      .addTo(map)
      .bindPopup(`<b>Veículo:</b> ${vehiclePlate}<br/><b>Motorista:</b> ${driverName}<br/><b>Status:</b> ${currentCoords.speed > 0 ? `${currentCoords.speed} km/h` : 'Parado'}`);

    markerRef.current = vehicleMarker;

    // Draw polyline between origin, current, and destination
    const polyline = L.polyline([
      [originCoords.lat, originCoords.lng],
      [currentCoords.lat, currentCoords.lng],
      [destCoords.lat, destCoords.lng]
    ], {
      color: '#10b981',
      weight: 4,
      opacity: 0.8,
      dashArray: '8, 8'
    }).addTo(map);

    mapInstanceRef.current = map;
    
    // Store polyline reference to update it later if needed
    (map as any)._routePolyline = polyline;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []); // Only run on mount

  // Update marker position dynamically
  useEffect(() => {
    if (markerRef.current && mapInstanceRef.current) {
      markerRef.current.setLatLng([currentCoords.lat, currentCoords.lng]);
      mapInstanceRef.current.setView([currentCoords.lat, currentCoords.lng], mapInstanceRef.current.getZoom(), { animate: true });
    }
  }, [currentCoords]);

  return (
    <div className="relative w-full h-[320px] sm:h-[380px] rounded-2xl overflow-hidden border border-slate-700/80 shadow-inner">
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-10" />
    </div>
  );
};
