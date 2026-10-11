"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./catalog.module.css";
import { Search, X, ArrowLeft, ArrowRight, Car, SlidersHorizontal, Fuel } from "lucide-react";

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  kms: number;
  transmission: "manual" | "automatica";
  fuel: "nafta" | "diesel" | "hibrido" | "electrico";
  price: number;
  currency: string;
  images: string[];
  status: "disponible" | "reservado" | "vendido";
  color?: string;
}

interface PortalCatalogClientProps {
  initialVehicles: Vehicle[];
  agencySlug: string;
  agencyName: string;
  whatsappPhone?: string;
  publishSold?: boolean;
}

export default function PortalCatalogClient({
  initialVehicles,
  agencySlug,
  agencyName,
  whatsappPhone: _whatsappPhone = "+598 99 123 456",
  publishSold = false,
}: PortalCatalogClientProps) {
  const pathname = usePathname();
  const isDirectPortal = pathname.startsWith("/portal/");
  const basePath = isDirectPortal ? `/portal/${agencySlug}` : "";
  const homeHref = basePath ? `${basePath}` : "/";

  const [search, setSearch] = useState("");
  const [transmissionFilter, setTransmissionFilter] = useState<"all" | "automatica" | "manual">("all");
  const [fuelFilter, setFuelFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"available" | "sold">("available");

  // Filtrar vehículos disponibles y vendidos
  const availableVehicles = useMemo(
    () => initialVehicles.filter((v) => v.status !== "vendido"),
    [initialVehicles]
  );
  const soldVehicles = useMemo(
    () => initialVehicles.filter((v) => v.status === "vendido"),
    [initialVehicles]
  );

  const activePool = viewMode === "available" ? availableVehicles : soldVehicles;

  const filteredVehicles = useMemo(() => {
    const q = search.trim().toLowerCase();
    return activePool.filter((v) => {
      const matchText =
        !q ||
        `${v.brand} ${v.model} ${v.year} ${v.color || ""}`.toLowerCase().includes(q);

      const matchTrans =
        transmissionFilter === "all" || v.transmission === transmissionFilter;

      const matchFuel = fuelFilter === "all" || v.fuel === fuelFilter;

      return matchText && matchTrans && matchFuel;
    });
  }, [activePool, search, transmissionFilter, fuelFilter]);

  const handleResetFilters = () => {
    setSearch("");
    setTransmissionFilter("all");
    setFuelFilter("all");
  };

  return (
    <div className={styles.catalogContainer}>
      {/* Breadcrumb de regreso */}
      <Link href={homeHref} className={styles.catalogBreadcrumb}>
        <ArrowLeft size={16} /> Volver al Inicio
      </Link>

      {/* Encabezado del catálogo */}
      <div className={styles.catalogHeader}>
        <span className={styles.catalogCategoryTag}>
          <Car size={13} /> INVENTARIO EN VIVO
        </span>
        <h1 className={styles.catalogTitle}>Catálogo de Vehículos</h1>
        <p className={styles.catalogSubtitle}>
          Encuentra tu próxima unidad en {agencyName}. Vehículos inspeccionados y seleccionados con respaldo total.
        </p>
      </div>

      {/* Buscador Simple y Filtros Rápidos */}
      <div className={styles.searchSection}>
        <div className={styles.searchInputWrapper}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar por marca, modelo o año (Ej: BMW, Audi, 2022...)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className={styles.clearSearchBtn}
              title="Limpiar búsqueda"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Chips de filtro rápido */}
        <div className={styles.filterControlsRow}>
          <div className={styles.filterChipsGroup}>
            <button
              type="button"
              className={`${styles.filterChip} ${
                transmissionFilter === "all" ? styles.activeChip : ""
              }`}
              onClick={() => setTransmissionFilter("all")}
            >
              Todas las cajas
            </button>
            <button
              type="button"
              className={`${styles.filterChip} ${
                transmissionFilter === "automatica" ? styles.activeChip : ""
              }`}
              onClick={() => setTransmissionFilter("automatica")}
            >
              Automáticos
            </button>
            <button
              type="button"
              className={`${styles.filterChip} ${
                transmissionFilter === "manual" ? styles.activeChip : ""
              }`}
              onClick={() => setTransmissionFilter("manual")}
            >
              Manuales
            </button>

            {publishSold && soldVehicles.length > 0 && (
              <>
                <span style={{ opacity: 0.3, margin: "0 0.25rem" }}>|</span>
                <button
                  type="button"
                  className={`${styles.filterChip} ${
                    viewMode === "available" ? styles.activeChip : ""
                  }`}
                  onClick={() => setViewMode("available")}
                >
                  Disponibles ({availableVehicles.length})
                </button>
                <button
                  type="button"
                  className={`${styles.filterChip} ${
                    viewMode === "sold" ? styles.activeChip : ""
                  }`}
                  onClick={() => setViewMode("sold")}
                >
                  Entregados ({soldVehicles.length})
                </button>
              </>
            )}
          </div>

          <div className={styles.resultsCount}>
            {filteredVehicles.length === 1
              ? "1 vehículo encontrado"
              : `${filteredVehicles.length} vehículos encontrados`}
          </div>
        </div>
      </div>

      {/* Grilla de Resultados */}
      <div className={styles.vehicleGrid}>
        {filteredVehicles.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>
              <Car size={28} />
            </div>
            <h3 className={styles.emptyStateTitle}>
              No encontramos unidades con esos criterios
            </h3>
            <p className={styles.emptyStateDesc}>
              Intenta buscar por otro término o limpia los filtros activos para ver todo el inventario de {agencyName}.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className={styles.resetBtn}
            >
              <SlidersHorizontal size={14} /> Restablecer Búsqueda
            </button>
          </div>
        ) : (
          filteredVehicles.map((v) => {
            const detailHref = `${basePath}/${v.id}`;
            const coverImg =
              v.images && v.images[0]
                ? v.images[0]
                : "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80";

            return (
              <Link href={detailHref} key={v.id} className={styles.vehicleCard}>
                <div className={styles.imageWrapper}>
                  <img
                    src={coverImg}
                    alt={`${v.brand} ${v.model}`}
                    className={styles.vehicleImage}
                  />
                  <span className={styles.badgeTransmission}>
                    {v.transmission === "automatica" ? "Automático" : "Manual"}
                  </span>
                  {v.status === "reservado" && (
                    <span className={styles.badgeReserved}>Reservado</span>
                  )}
                  {v.status === "vendido" && (
                    <span
                      className={styles.badgeReserved}
                      style={{ backgroundColor: "#ef4444" }}
                    >
                      Vendido
                    </span>
                  )}
                </div>

                <div className={styles.vehicleInfo}>
                  <h3 className={styles.vehicleTitle}>
                    {v.brand} {v.model}
                  </h3>
                  <div className={styles.vehicleSpecs}>
                    Año: {v.year} | {v.kms.toLocaleString()} km
                  </div>

                  <div className={styles.vehicleFeatures}>
                    <span className={styles.featureTag}>
                      <Fuel size={12} style={{ display: "inline", marginRight: "4px" }} />
                      {v.fuel ? v.fuel.toUpperCase() : "NAFTA"}
                    </span>
                    {v.color && (
                      <span className={styles.featureTag}>🎨 {v.color}</span>
                    )}
                  </div>

                  <div className={styles.cardFooter}>
                    <div className={styles.vehiclePrice}>
                      {v.status === "vendido"
                        ? "Vendido"
                        : `${v.currency} ${v.price.toLocaleString()}`}
                    </div>
                    <span className={styles.viewDetailBtn}>
                      Ver Ficha <ArrowRight size={13} />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
