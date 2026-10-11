"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Search, Loader2, Navigation } from "lucide-react";
import "leaflet/dist/leaflet.css";

interface InteractiveLocationPickerProps {
  lat: number;
  lng: number;
  locationAddress: string;
  agencyName?: string;
  onChangeLocation: (lat: number, lng: number, address?: string) => void;
}

export default function InteractiveLocationPicker({
  lat,
  lng,
  locationAddress,
  agencyName,
  onChangeLocation
}: InteractiveLocationPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerInstanceRef = useRef<any>(null);
  
  const [searching, setSearching] = useState(false);
  const [addressInput, setAddressInput] = useState(locationAddress || "");

  useEffect(() => {
    setAddressInput(locationAddress);
  }, [locationAddress]);

  // Reverse Geocoding helper
  const performReverseGeocode = async (latitude: number, longitude: number) => {
    try {
      setSearching(true);
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
      const data = await res.json();
      if (data && data.display_name) {
        setAddressInput(data.display_name);
        onChangeLocation(latitude, longitude, data.display_name);
      } else {
        onChangeLocation(latitude, longitude);
      }
    } catch (e) {
      console.warn("Reverse geocode failed:", e);
      onChangeLocation(latitude, longitude);
    } finally {
      setSearching(false);
    }
  };

  // Forward Geocoding helper (Address -> Lat/Lng)
  const handleAddressSearch = async (addressQuery: string) => {
    if (!addressQuery.trim()) return;
    try {
      setSearching(true);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressQuery)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const first = data[0];
        const newLat = parseFloat(first.lat);
        const newLng = parseFloat(first.lon);

        if (mapInstanceRef.current && markerInstanceRef.current) {
          mapInstanceRef.current.setView([newLat, newLng], 16);
          markerInstanceRef.current.setLatLng([newLat, newLng]);
        }
        onChangeLocation(newLat, newLng, first.display_name || addressQuery);
      }
    } catch (e) {
      console.warn("Address search failed:", e);
    } finally {
      setSearching(false);
    }
  };

  // Initialize Leaflet Map
  useEffect(() => {
    let isCancelled = false;
    if (!mapContainerRef.current) return;

    import("leaflet").then((LModule) => {
      if (isCancelled || !mapContainerRef.current) return;
      const L = LModule.default || LModule;

      if (!mapInstanceRef.current) {
        const initialLat = lat || -34.9011;
        const initialLng = lng || -56.1645;

        const map = L.map(mapContainerRef.current).setView([initialLat, initialLng], 15);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        const pinIcon = L.divIcon({
          className: "custom-interactive-map-pin",
          html: `
            <div style="
              position: relative;
              width: 38px;
              height: 44px;
              transform: translate(-19px, -44px);
              display: flex;
              align-items: center;
              justify-content: center;
              pointer-events: none;
            ">
              <div style="
                position: absolute;
                bottom: 0px;
                width: 14px;
                height: 14px;
                background-color: #2563eb;
                opacity: 0.5;
                border-radius: 50%;
                transform: scale(1.6);
              "></div>
              <svg width="38" height="44" viewBox="0 0 24 28" fill="#2563eb" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5));">
                <path d="M12 2C7.58 2 4 5.58 4 10c0 5.25 8 13.5 8 13.5s8-8.25 8-13.5c0-4.42-3.58-8-8-8z"></path>
                <circle cx="12" cy="10" r="3.2" fill="#ffffff"></circle>
              </svg>
            </div>
          `,
          iconSize: [0, 0],
        });

        const marker = L.marker([initialLat, initialLng], { draggable: true, icon: pinIcon }).addTo(map);

        // Click event on map to reposition marker
        map.on("click", (e: any) => {
          const clickedLat = e.latlng.lat;
          const clickedLng = e.latlng.lng;
          marker.setLatLng([clickedLat, clickedLng]);
          performReverseGeocode(clickedLat, clickedLng);
        });

        // Drag event on marker
        marker.on("dragend", () => {
          const pos = marker.getLatLng();
          performReverseGeocode(pos.lat, pos.lng);
        });

        mapInstanceRef.current = map;
        markerInstanceRef.current = marker;
      }
    });

    return () => {
      isCancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", width: "100%" }}>
      
      {/* Address Search Bar */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <label style={{ fontSize: "0.85rem", fontWeight: "600" }}>
            Dirección Física de {agencyName || "la Automotora"}
          </label>
          {searching && (
            <span style={{ fontSize: "0.75rem", color: "var(--primary)", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <Loader2 size={12} className="animate-spin" /> Buscando ubicación...
            </span>
          )}
        </div>
        
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            type="text"
            placeholder="Escribe la dirección o haz clic directo en el mapa..."
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddressSearch(addressInput);
              }
            }}
            onBlur={() => {
              if (addressInput !== locationAddress) {
                handleAddressSearch(addressInput);
              }
            }}
            style={{
              padding: "0.75rem 1rem",
              borderRadius: "8px",
              border: "1px solid var(--border-color)",
              backgroundColor: "var(--bg-color)",
              color: "var(--text-color)",
              fontSize: "0.9rem",
              flex: 1
            }}
          />
          <button
            type="button"
            onClick={() => handleAddressSearch(addressInput)}
            disabled={searching}
            style={{
              backgroundColor: "var(--primary)",
              color: "white",
              border: "none",
              padding: "0.75rem 1.1rem",
              borderRadius: "8px",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem"
            }}
          >
            <Search size={15} /> Buscar en Mapa
          </button>
        </div>
      </div>

      {/* Interactive Canvas */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--primary)", display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <MapPin size={15} /> Ubicación de {agencyName || "la Automotora"} (haz clic en el mapa para posicionar el marcador):
          </span>
          <span style={{ fontSize: "0.75rem", opacity: 0.7 }}>
            📍 Lat: {lat.toFixed(4)}, Lng: {lng.toFixed(4)}
          </span>
        </div>

        <div
          ref={mapContainerRef}
          style={{
            width: "100%",
            height: "320px",
            borderRadius: "12px",
            border: "2px solid var(--border-color)",
            boxShadow: "0 4px 15px rgba(0,0,0,0.15)",
            zIndex: 1
          }}
        />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.75rem", opacity: 0.6 }}>
            💡 Consejo: También puedes hacer clic y arrastrar el pin azul para ajustar la ubicación exacta.
          </span>
          <button
            type="button"
            onClick={() => {
              const defaultLat = -34.9011;
              const defaultLng = -56.1645;
              if (mapInstanceRef.current && markerInstanceRef.current) {
                mapInstanceRef.current.setView([defaultLat, defaultLng], 15);
                markerInstanceRef.current.setLatLng([defaultLat, defaultLng]);
              }
              performReverseGeocode(defaultLat, defaultLng);
            }}
            style={{
              backgroundColor: "var(--surface-color)",
              border: "1px solid var(--border-color)",
              color: "var(--text-color)",
              padding: "0.35rem 0.75rem",
              borderRadius: "6px",
              fontSize: "0.76rem",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.3rem"
            }}
          >
            <Navigation size={12} /> Restablecer a Montevideo Centro
          </button>
        </div>
      </div>

    </div>
  );
}
