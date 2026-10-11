"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Search, MapPin, Navigation, Check, Loader2 } from "lucide-react";
import "leaflet/dist/leaflet.css";

interface InteractiveMapPickerProps {
  latitude: number;
  longitude: number;
  primaryColor?: string;
  onChangeLocation: (lat: number, lng: number, suggestedAddress?: string) => void;
}

export default function InteractiveMapPicker({
  latitude,
  longitude,
  primaryColor = "#10B981",
  onChangeLocation,
}: InteractiveMapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const LRef = useRef<any>(null);

  const [currentLat, setCurrentLat] = useState(latitude || -34.9011);
  const [currentLng, setCurrentLng] = useState(longitude || -56.1645);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [detectedAddress, setDetectedAddress] = useState<string | null>(null);
  const [copiedStatus, setCopiedStatus] = useState(false);

  // Generador de ícono SVG dinámico con el color de la marca
  const createPinIcon = useCallback(
    (L: any, color: string) => {
      return L.divIcon({
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
            <!-- Anillo pulsante en la base del pin -->
            <div style="
              position: absolute;
              bottom: 0px;
              width: 14px;
              height: 14px;
              background-color: ${color};
              opacity: 0.5;
              border-radius: 50%;
              transform: scale(1.6);
            "></div>
            <!-- Pin en SVG con relieve -->
            <svg width="38" height="44" viewBox="0 0 24 28" fill="${color}" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5));">
              <path d="M12 2C7.58 2 4 5.58 4 10c0 5.25 8 13.5 8 13.5s8-8.25 8-13.5c0-4.42-3.58-8-8-8z"></path>
              <circle cx="12" cy="10" r="3.2" fill="#ffffff"></circle>
            </svg>
          </div>
        `,
        iconSize: [0, 0],
      });
    },
    []
  );

  // Geocodificación inversa con OpenStreetMap Nominatim
  const fetchAddressForCoords = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            "Accept-Language": "es",
          },
        }
      );
      if (!res.ok) return null;
      const data = await res.json();
      if (data && data.display_name) {
        // Extraer formato corto y legible
        const addr = data.address || {};
        const road = addr.road || addr.pedestrian || addr.suburb || "";
        const houseNumber = addr.house_number ? ` ${addr.house_number}` : "";
        const city = addr.city || addr.town || addr.village || addr.county || "";
        const country = addr.country || "";

        let formatted = [road ? `${road}${houseNumber}` : "", city, country]
          .filter(Boolean)
          .join(", ");
        if (!formatted || formatted.length < 5) {
          formatted = data.display_name.split(",").slice(0, 3).join(", ");
        }
        setDetectedAddress(formatted);
        return formatted;
      }
    } catch {
      // Ignorar fallas de geocodificación externa
    }
    return null;
  };

  // Inicializar Leaflet dinámicamente en el cliente
  useEffect(() => {
    let isCancelled = false;

    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    import("leaflet").then((LModule) => {
      if (isCancelled || !mapContainerRef.current) return;
      const L = LModule.default || LModule;
      LRef.current = L;

      const initialCoord: [number, number] = [
        latitude || -34.9011,
        longitude || -56.1645,
      ];

      const map = L.map(mapContainerRef.current, {
        center: initialCoord,
        zoom: 15,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      mapInstanceRef.current = map;

      // Capa de teselas (Tiles) claras y de alto rendimiento de OpenStreetMap
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Crear y colocar el marcador inicial
      const pinIcon = createPinIcon(L, primaryColor);
      const marker = L.marker(initialCoord, {
        icon: pinIcon,
        draggable: true,
      }).addTo(map);

      markerRef.current = marker;

      // Actualizar posición y notificar al arrastrar el marcador
      marker.on("dragend", async () => {
        const position = marker.getLatLng();
        setCurrentLat(position.lat);
        setCurrentLng(position.lng);
        const suggested = await fetchAddressForCoords(position.lat, position.lng);
        onChangeLocation(position.lat, position.lng, suggested || undefined);
      });

      // EVENTO PRINCIPAL: Clic en cualquier punto del mapa para mover la ubicación
      map.on("click", async (e: any) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        setCurrentLat(lat);
        setCurrentLng(lng);
        map.panTo([lat, lng], { animate: true, duration: 0.4 });

        const suggested = await fetchAddressForCoords(lat, lng);
        onChangeLocation(lat, lng, suggested || undefined);
      });

      // Redibujar mapa tras el montaje para evitar desfases de render
      setTimeout(() => {
        if (!isCancelled && map) {
          map.invalidateSize();
        }
      }, 250);
    });

    return () => {
      isCancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // montaje único

  // Actualizar ícono si cambia el color primario
  useEffect(() => {
    if (markerRef.current && LRef.current) {
      const pinIcon = createPinIcon(LRef.current, primaryColor);
      markerRef.current.setIcon(pinIcon);
    }
  }, [primaryColor, createPinIcon]);

  // Si las coordenadas cambian externamente y no coinciden con el estado local
  useEffect(() => {
    if (
      latitude &&
      longitude &&
      (Math.abs(latitude - currentLat) > 0.0001 ||
        Math.abs(longitude - currentLng) > 0.0001)
    ) {
      setCurrentLat(latitude);
      setCurrentLng(longitude);
      if (markerRef.current) {
        markerRef.current.setLatLng([latitude, longitude]);
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.panTo([latitude, longitude], { animate: true });
      }
    }
  }, [latitude, longitude]);

  // Función de búsqueda manual de dirección
  const handleSearchAddress = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&limit=1`,
        {
          headers: {
            "Accept-Language": "es",
          },
        }
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const newLat = parseFloat(data[0].lat);
        const newLng = parseFloat(data[0].lon);

        setCurrentLat(newLat);
        setCurrentLng(newLng);

        if (markerRef.current) {
          markerRef.current.setLatLng([newLat, newLng]);
        }
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([newLat, newLng], 16, { animate: true });
        }

        const suggested = await fetchAddressForCoords(newLat, newLng);
        onChangeLocation(newLat, newLng, suggested || undefined);
      } else {
        alert("No se encontró la dirección buscada. Intenta con una ciudad o avenida principal.");
      }
    } catch {
      alert("Error al conectar con el servicio de mapas.");
    } finally {
      setIsSearching(false);
    }
  };

  // Función para obtener la ubicación actual por GPS del dispositivo
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Tu navegador no soporta geolocalización.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const newLat = pos.coords.latitude;
        const newLng = pos.coords.longitude;

        setCurrentLat(newLat);
        setCurrentLng(newLng);

        if (markerRef.current) {
          markerRef.current.setLatLng([newLat, newLng]);
        }
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([newLat, newLng], 16, { animate: true });
        }

        const suggested = await fetchAddressForCoords(newLat, newLng);
        onChangeLocation(newLat, newLng, suggested || undefined);
        setIsLocating(false);
      },
      (err) => {
        console.warn("Error obteniendo ubicación:", err);
        alert("No se pudo obtener tu ubicación actual. Permite el acceso a la ubicación en tu navegador.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.6rem",
        width: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.2)",
        border: "1px solid var(--border-color)",
        borderRadius: "12px",
        padding: "0.75rem",
      }}
    >
      {/* Barra de Búsqueda y Botón GPS */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <form
          onSubmit={handleSearchAddress}
          style={{ display: "flex", flex: 1, minWidth: "220px", gap: "0.35rem" }}
        >
          <div
            style={{
              position: "relative",
              flex: 1,
              display: "flex",
              alignItems: "center",
            }}
          >
            <Search
              size={15}
              style={{
                position: "absolute",
                left: "10px",
                color: "var(--text-muted)",
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar dirección, calle o ciudad..."
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "0.5rem 0.65rem 0.5rem 2rem",
                borderRadius: "8px",
                border: "1px solid var(--border-color)",
                backgroundColor: "rgba(255, 255, 255, 0.04)",
                color: "var(--text-color)",
                fontSize: "0.82rem",
                outline: "none",
              }}
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            style={{
              padding: "0.5rem 0.85rem",
              borderRadius: "8px",
              border: "1px solid var(--border-color)",
              backgroundColor: "var(--surface-color)",
              color: "var(--text-color)",
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: isSearching ? "wait" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              whiteSpace: "nowrap",
            }}
          >
            {isSearching ? <Loader2 size={13} className="animate-spin" /> : "Buscar"}
          </button>
        </form>

        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={isLocating}
          title="Detectar mi ubicación actual"
          style={{
            padding: "0.5rem 0.85rem",
            borderRadius: "8px",
            border: `1px solid ${primaryColor}40`,
            backgroundColor: `${primaryColor}15`,
            color: primaryColor,
            fontSize: "0.8rem",
            fontWeight: 700,
            cursor: isLocating ? "wait" : "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            whiteSpace: "nowrap",
          }}
        >
          {isLocating ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Navigation size={13} />
          )}
          <span>Mi Ubicación</span>
        </button>
      </div>

      {/* Indicación interactiva */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "0.74rem",
          color: "var(--text-muted)",
          padding: "0.2rem 0.25rem",
        }}
      >
        <span>
          🎯 <strong>Haz clic en cualquier punto del mapa</strong> o arrastra el marcador para fijar la ubicación exacta.
        </span>
        <span style={{ fontFamily: "monospace", color: primaryColor, fontWeight: 700 }}>
          {currentLat.toFixed(5)}, {currentLng.toFixed(5)}
        </span>
      </div>

      {/* Contenedor del Mapa Leaflet */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "260px",
          borderRadius: "10px",
          overflow: "hidden",
          border: "1px solid var(--border-color)",
          backgroundColor: "#1a1d24",
        }}
      >
        <div
          ref={mapContainerRef}
          style={{
            width: "100%",
            height: "100%",
            zIndex: 1,
          }}
        />
      </div>

      {/* Barra inferior: Dirección detectada y botón para aplicar */}
      {detectedAddress && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "0.5rem",
            backgroundColor: "rgba(255, 255, 255, 0.03)",
            border: "1px solid var(--border-color)",
            borderRadius: "8px",
            padding: "0.45rem 0.75rem",
            fontSize: "0.78rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flex: 1, minWidth: "200px" }}>
            <MapPin size={14} style={{ color: primaryColor, flexShrink: 0 }} />
            <span style={{ color: "var(--text-color)", opacity: 0.9 }}>
              Ubicación aproximada: <strong>{detectedAddress}</strong>
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              onChangeLocation(currentLat, currentLng, detectedAddress);
              setCopiedStatus(true);
              setTimeout(() => setCopiedStatus(false), 2500);
            }}
            style={{
              padding: "0.25rem 0.65rem",
              borderRadius: "6px",
              border: `1px solid ${primaryColor}50`,
              backgroundColor: copiedStatus ? primaryColor : `${primaryColor}20`,
              color: copiedStatus ? "#ffffff" : primaryColor,
              fontSize: "0.72rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.3rem",
              transition: "all 0.2s ease",
            }}
          >
            {copiedStatus ? <Check size={12} /> : null}
            {copiedStatus ? "Dirección asignada" : "Copiar a texto de dirección"}
          </button>
        </div>
      )}
    </div>
  );
}
