"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { SalonDoc } from "@/lib/salons";
import Link from "next/link";
import { Star, MapPin, Navigation, ArrowRight, ExternalLink } from "lucide-react";
import Image from "next/image";

// Fix for default marker icons in Leaflet + Next.js
const customIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const userIcon = L.divIcon({
  className: "user-location-marker",
  html: `<div class="relative flex h-5 w-5">
    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
    <span class="relative inline-flex rounded-full h-5 w-5 bg-violet-600 border-2 border-white"></span>
  </div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 13, { duration: 1.5 });
  }, [lat, lng, map]);
  return null;
}

function MapEvents({ onBoundsChange }: { onBoundsChange: (bounds: L.LatLngBounds) => void }) {
  const map = useMapEvents({
    moveend: () => {
      onBoundsChange(map.getBounds());
    },
    zoomend: () => {
      onBoundsChange(map.getBounds());
    },
  });
  return null;
}

interface SalonMapProps {
  salons: SalonDoc[];
  center?: [number, number];
  zoom?: number;
  onSalonSelect?: (salonId: string) => void;
  onBoundsChange?: (salonsInView: SalonDoc[]) => void;
}

export default function SalonMap({ 
  salons, 
  center = [12.9716, 77.5946], 
  zoom = 12,
  onSalonSelect,
  onBoundsChange
}: SalonMapProps) {
  const [mounted, setMounted] = useState(false);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(center);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLocateMe = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setUserPos(newPos);
          setMapCenter(newPos);
        },
        (err) => console.error("Geolocation error:", err)
      );
    }
  };

  const handleBoundsChange = useCallback((bounds: L.LatLngBounds) => {
    if (onBoundsChange) {
      const inView = salons.filter(s => 
        s.coordinates && 
        bounds.contains([s.coordinates.lat, s.coordinates.lng])
      );
      onBoundsChange(inView);
    }
  }, [salons, onBoundsChange]);

  if (!mounted) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#1A1C29]/50 rounded-2xl border border-white/10">
        <div className="text-center space-y-3">
          <MapPin className="h-8 w-8 text-violet-400 mx-auto animate-pulse" />
          <p className="text-sm text-cream-muted">Initializing Map...</p>
        </div>
      </div>
    );
  }

  const salonsWithCoords = salons.filter(s => s.coordinates?.lat && s.coordinates?.lng);

  return (
    <div className="h-full w-full overflow-hidden rounded-2xl border border-white/10 shadow-glass relative z-0 group">
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="map-tiles-dark"
        />
        
        {userPos && (
          <Marker position={userPos} icon={userIcon}>
            <Popup>You are here</Popup>
          </Marker>
        )}

        {salonsWithCoords.map((salon) => (
          <Marker
            key={salon._id}
            position={[salon.coordinates!.lat, salon.coordinates!.lng]}
            icon={customIcon}
            eventHandlers={{
                click: () => onSalonSelect?.(salon._id)
            }}
          >
            <Popup className="salon-popup" maxWidth={280}>
              <div className="p-0 overflow-hidden rounded-lg">
                <div className="relative h-24 w-full">
                  {salon.images?.[0] && (
                    <Image 
                      src={salon.images[0]} 
                      alt={salon.name} 
                      fill 
                      className="object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                    <p className="font-display font-bold text-white text-sm truncate">{salon.name}</p>
                    <span className="flex items-center gap-0.5 text-[10px] text-gold font-bold bg-black/40 px-1.5 py-0.5 rounded-full backdrop-blur-sm">
                        <Star className="h-2.5 w-2.5 fill-gold" />
                        {salon.rating}
                    </span>
                  </div>
                </div>
                
                <div className="p-3 space-y-3 bg-white">
                  <div className="flex items-start gap-1.5">
                    <MapPin className="h-3 w-3 text-violet-600 mt-0.5" />
                    <p className="text-[10px] text-gray-600 leading-tight">
                        {salon.area}, Bangalore
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Link 
                      href={`/salons/${salon._id}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-bold uppercase tracking-wider bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors shadow-sm"
                    >
                      Book Now
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                    <Link 
                      href={`/salons/${salon._id}`}
                      className="w-10 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <ExternalLink className="h-3 w-3 text-gray-400" />
                    </Link>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
        
        <RecenterMap lat={mapCenter[0]} lng={mapCenter[1]} />
        <MapEvents onBoundsChange={handleBoundsChange} />
      </MapContainer>

      {/* Locate Me Floating Button */}
      <button
        onClick={handleLocateMe}
        className="absolute bottom-6 right-6 z-[1000] flex h-12 w-12 items-center justify-center rounded-full bg-violet-600 text-white shadow-lg shadow-violet-900/40 border border-white/20 transition-all hover:scale-110 active:scale-95 group/locate"
      >
        <Navigation className="h-5 w-5 transition-transform group-hover/locate:-rotate-12" />
        <span className="absolute right-full mr-3 whitespace-nowrap rounded-lg bg-black/80 px-2 py-1 text-[10px] text-white opacity-0 transition-opacity group-hover/locate:opacity-100 backdrop-blur-sm">
            Find salons near me
        </span>
      </button>

      {/* Legend / Status Overlay */}
      <div className="absolute top-4 left-4 z-[1000] rounded-xl bg-black/60 px-3 py-2 backdrop-blur-md border border-white/10 flex items-center gap-3">
          <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-violet-500 animate-pulse" />
              <p className="text-[10px] font-bold text-white uppercase tracking-widest">{salonsWithCoords.length} Active Hubs</p>
          </div>
          <div className="h-3 w-[1px] bg-white/20" />
          <p className="text-[10px] text-cream-muted">Move map to filter enclaves</p>
      </div>

      <style jsx global>{`
        .leaflet-container {
          background: #111218 !important;
        }
        .map-tiles-dark {
          filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
        }
        .salon-popup .leaflet-popup-content-wrapper {
          background: transparent;
          border-radius: 12px;
          padding: 0;
          overflow: hidden;
          box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
        }
        .salon-popup .leaflet-popup-content {
            margin: 0;
            width: 280px !important;
        }
        .salon-popup .leaflet-popup-tip-container {
            display: none;
        }
        .user-location-marker {
            background: none !important;
            border: none !important;
        }
      `}</style>
    </div>
  );
}
