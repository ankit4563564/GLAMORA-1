"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { SalonDoc } from "@/lib/salons";
import Link from "next/link";
import { Star, MapPin } from "lucide-react";

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

// Component to handle map centering
function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
}

interface SalonMapProps {
  salons: SalonDoc[];
  center?: [number, number];
  zoom?: number;
}

export default function SalonMap({ salons, center = [12.9716, 77.5946], zoom = 12 }: SalonMapProps) {
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

  // Filter salons that actually have coordinates
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
          // Dark mode filter for OSM tiles to match project aesthetic
          className="map-tiles-dark"
        />
        
        {salonsWithCoords.map((salon) => (
          <Marker
            key={salon._id}
            position={[salon.coordinates!.lat, salon.coordinates!.lng]}
            icon={customIcon}
          >
            <Popup className="salon-popup">
              <div className="p-1 space-y-2 min-w-[150px]">
                <p className="font-display font-bold text-gray-900 leading-none">{salon.name}</p>
                <div className="flex items-center justify-between">
                   <p className="text-[10px] text-gray-600">{salon.area}</p>
                   <span className="flex items-center gap-0.5 text-xs text-amber-600 font-bold">
                    <Star className="h-3 w-3 fill-amber-500" />
                    {salon.rating}
                  </span>
                </div>
                <Link 
                  href={`/salons/${salon._id}`}
                  className="block w-full text-center py-1.5 text-[10px] font-bold uppercase tracking-wider bg-violet-600 text-white rounded hover:bg-violet-700 transition-colors"
                >
                  View Details
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
        
        <RecenterMap lat={center[0]} lng={center[1]} />
      </MapContainer>

      <style jsx global>{`
        .leaflet-container {
          background: #111218 !important;
        }
        .map-tiles-dark {
          filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
        }
        .salon-popup .leaflet-popup-content-wrapper {
          background: white;
          border-radius: 12px;
          padding: 4px;
        }
        .salon-popup .leaflet-popup-tip {
          background: white;
        }
      `}</style>
    </div>
  );
}
