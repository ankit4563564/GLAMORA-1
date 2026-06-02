"use client";

import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { SalonDoc } from "@/lib/salons";
import Link from "next/link";
import { Star, MapPin, Zap, Navigation } from "lucide-react";

// Custom CSS for pulse animation
const markerHtml = `
  <div class="relative">
    <div class="absolute -inset-2 rounded-full bg-violet-500/30 animate-ping"></div>
    <div class="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-violet-600 shadow-lg">
      <div class="h-2 w-2 rounded-full bg-white"></div>
    </div>
  </div>
`;

const customIcon = typeof window !== 'undefined' ? L.divIcon({
  html: markerHtml,
  className: "custom-div-icon",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
}) : null;

// User location icon
const userIconHtml = `
  <div class="relative flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-cyan-500 shadow-ai-glow-sm">
    <div class="h-2 w-2 rounded-full bg-white"></div>
  </div>
`;

const userIcon = typeof window !== 'undefined' ? L.divIcon({
  html: userIconHtml,
  className: "user-div-icon",
  iconSize: [24, 24],
  iconAnchor: [12, 12],
}) : null;

// Component to handle map centering with flyTo
function MapController({ lat, lng, zoom }: { lat: number; lng: number; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], zoom, {
      duration: 1.5,
      easeLinearity: 0.25
    });
  }, [lat, lng, zoom, map]);
  return null;
}

interface SalonMapProps {
  salons: SalonDoc[];
  center?: [number, number];
  zoom?: number;
  highlightedId?: string;
}

export default function SalonMap({ 
  salons, 
  center = [12.9716, 77.5946], 
  zoom = 12,
  highlightedId
}: SalonMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    <div className="h-full w-full overflow-hidden rounded-2xl border border-white/10 shadow-glass relative z-0">
      <MapContainer
        center={center}
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

        {/* Visual Distance Rings for high-tech feel */}
        <Circle 
          center={center} 
          radius={2000} 
          pathOptions={{ color: '#8b5cf6', fillColor: '#8b5cf6', fillOpacity: 0.03, weight: 1, dashArray: '5, 10' }} 
        />
        <Circle 
          center={center} 
          radius={5000} 
          pathOptions={{ color: '#06b6d4', fillColor: '#06b6d4', fillOpacity: 0.02, weight: 1, dashArray: '10, 20' }} 
        />
        
        {/* Simulated User Location */}
        <Marker position={center} icon={userIcon as L.DivIcon}>
          <Popup className="user-popup">
            <div className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Your Position</div>
          </Popup>
        </Marker>
        
        {salonsWithCoords.map((salon) => (
          <Marker
            key={salon._id}
            position={[salon.coordinates!.lat, salon.coordinates!.lng]}
            icon={customIcon as L.DivIcon}
          >
            <Popup className="salon-popup">
              <div className="p-2 space-y-3 min-w-[180px]">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-display font-bold text-white text-base leading-none">{salon.name}</p>
                    <p className="text-[10px] text-cream-muted mt-1">{salon.area}</p>
                  </div>
                  <Badge variant="secondary" className="bg-violet-500/20 text-violet-300 text-[10px] border-none">
                    {salon.specialty.split(' ')[0]}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-xs">
                   <span className="flex items-center gap-0.5 text-amber-400 font-bold">
                    <Star className="h-3 w-3 fill-amber-400" />
                    {salon.rating}
                  </span>
                  <span className="text-cream-muted font-mono">{salon.priceRange.split('–')[0]}</span>
                </div>

                <div className="flex gap-2 pt-1">
                  <Link 
                    href={`/salons/${salon._id}`}
                    className="flex-1 text-center py-2 text-[10px] font-bold uppercase tracking-wider bg-white/5 text-white border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    Profile
                  </Link>
                  <Link 
                    href={`/book/${salon._id}`}
                    className="flex-1 text-center py-2 text-[10px] font-bold uppercase tracking-wider bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors shadow-lg shadow-violet-600/20"
                  >
                    Book
                  </Link>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
        
        <MapController lat={center[0]} lng={center[1]} zoom={zoom} />
      </MapContainer>

      {/* Map Overlay Controls for flavor */}
      <div className="absolute top-4 right-4 z-10 space-y-2">
        <div className="glass-card p-2 flex flex-col items-center gap-2 border-white/10">
          <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
          <Navigation className="h-4 w-4 text-cream-muted" />
        </div>
      </div>

      <style jsx global>{`
        .leaflet-container {
          background: #0B0C10 !important;
        }
        .map-tiles-dark {
          filter: invert(100%) hue-rotate(180deg) brightness(85%) contrast(110%);
        }
        .salon-popup .leaflet-popup-content-wrapper,
        .user-popup .leaflet-popup-content-wrapper {
          background: #16161A;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          padding: 4px;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5);
        }
        .salon-popup .leaflet-popup-tip,
        .user-popup .leaflet-popup-tip {
          background: #16161A;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .leaflet-popup-content {
          margin: 8px !important;
        }
        .leaflet-bar {
          border: none !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5) !important;
        }
        .leaflet-bar a {
          background-color: #1A1C29 !important;
          color: #9B9188 !important;
          border-bottom: 1px solid rgba(255,255,255,0.05) !important;
        }
        .leaflet-bar a:hover {
          background-color: #252836 !important;
          color: white !important;
        }
      `}</style>
    </div>
  );
}

function Badge({ children, className, variant }: { children: React.ReactNode, className?: string, variant?: string }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${className}`}>
      {children}
    </span>
  );
}
