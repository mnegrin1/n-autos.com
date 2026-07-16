"use client";

import { useState } from "react";
import styles from "./home.module.css";
import Link from "next/link";
import { Search, Fuel } from "lucide-react";

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

interface PortalShowroomClientProps {
  initialVehicles: Vehicle[];
  agencySlug: string;
  agencyName: string;
  publishSold: boolean;
}

export default function PortalShowroomClient({ 
  initialVehicles, 
  agencySlug, 
  agencyName, 
  publishSold 
}: PortalShowroomClientProps) {
  const [activeVehicles] = useState<Vehicle[]>(initialVehicles.filter(v => v.status !== "vendido"));
  const [soldVehicles] = useState<Vehicle[]>(initialVehicles.filter(v => v.status === "vendido"));
  const [search, setSearch] = useState("");
  const [transmissionTab, setTransmissionTab] = useState<"all" | "automatica" | "manual">("all");
  const [fuelFilter, setFuelFilter] = useState("all");
  const [priceRange, setPriceRange] = useState("all");

  // Filter Active Vehicles
  const filteredActive = activeVehicles.filter((v) => {
    const matchesSearch = 
      v.brand.toLowerCase().includes(search.toLowerCase()) ||
      v.model.toLowerCase().includes(search.toLowerCase());
      
    const matchesTrans = transmissionTab === "all" || v.transmission === transmissionTab;
    const matchesFuel = fuelFilter === "all" || v.fuel === fuelFilter;
    
    let matchesPrice = true;
    if (priceRange === "low") matchesPrice = v.price < 25000;
    else if (priceRange === "mid") matchesPrice = v.price >= 25000 && v.price <= 50000;
    else if (priceRange === "high") matchesPrice = v.price > 50000;

    return matchesSearch && matchesTrans && matchesFuel && matchesPrice;
  });

  // Filter Sold Vehicles if publishing is enabled
  const filteredSold = soldVehicles.filter((v) => {
    const matchesSearch = 
      v.brand.toLowerCase().includes(search.toLowerCase()) ||
      v.model.toLowerCase().includes(search.toLowerCase());
      
    const matchesTrans = transmissionTab === "all" || v.transmission === transmissionTab;
    const matchesFuel = fuelFilter === "all" || v.fuel === fuelFilter;
    
    let matchesPrice = true;
    if (priceRange === "low") matchesPrice = v.price < 25000;
    else if (priceRange === "mid") matchesPrice = v.price >= 25000 && v.price <= 50000;
    else if (priceRange === "high") matchesPrice = v.price > 50000;

    return matchesSearch && matchesTrans && matchesFuel && matchesPrice;
  });

  const coverImage = "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80";

  return (
    <div className={styles.homeContainer}>
      {/* Hero Section */}
      <section 
        className={styles.heroSection}
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0.55)), url(${coverImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      >
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Encuentra tu próximo vehículo</h1>
          <p className={styles.heroSubtitle}>Unidades seleccionadas que te brindan seguridad, potencia y tranquilidad en cada kilómetro.</p>
          
          {/* Search box with tab controls */}
          <div className={styles.searchContainer}>
            <div className={styles.searchTabs}>
              <button 
                type="button"
                className={`${styles.tabButton} ${transmissionTab === "all" ? styles.activeTab : ""}`}
                onClick={() => setTransmissionTab("all")}
              >
                Todos
              </button>
              <button 
                type="button"
                className={`${styles.tabButton} ${transmissionTab === "automatica" ? styles.activeTab : ""}`}
                onClick={() => setTransmissionTab("automatica")}
              >
                Automáticos
              </button>
              <button 
                type="button"
                className={`${styles.tabButton} ${transmissionTab === "manual" ? styles.activeTab : ""}`}
                onClick={() => setTransmissionTab("manual")}
              >
                Manuales
              </button>
            </div>

            <div className={styles.searchBox}>
              <div className={styles.inputGroup}>
                <Search className={styles.inputIcon} size={18} />
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Buscar marca o modelo (Chevrolet, Cruze...)"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className={styles.inputGroup}>
                <Fuel className={styles.inputIcon} size={18} />
                <select
                  className={styles.searchSelect}
                  value={fuelFilter}
                  onChange={(e) => setFuelFilter(e.target.value)}
                >
                  <option value="all">Combustible (Todos)</option>
                  <option value="nafta">Nafta</option>
                  <option value="diesel">Diesel</option>
                  <option value="hibrido">Híbrido</option>
                  <option value="electrico">Eléctrico</option>
                </select>
              </div>

              <div className={styles.inputGroup}>
                <select
                  className={styles.searchSelect}
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  style={{ paddingLeft: "1.25rem" }}
                >
                  <option value="all">Rango de Precio (Todos)</option>
                  <option value="low">Menos de USD 25,000</option>
                  <option value="mid">USD 25,000 - USD 50,000</option>
                  <option value="high">Más de USD 50,000</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Section (Active Inventory) */}
      <section className={styles.featuredSection}>
        <div className={styles.featuredHeader}>
          <h2>Vehículos Destacados</h2>
          <span className={styles.viewAll} style={{ fontSize: "0.95rem" }}>
            {filteredActive.length} unidades disponibles
          </span>
        </div>

        <div className={styles.propertyGrid}>
          {filteredActive.length === 0 ? (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "4rem", opacity: 0.6 }}>
              No hay vehículos en exhibición que coincidan con la búsqueda.
            </div>
          ) : (
            filteredActive.map((v) => (
              <Link 
                href={`/portal/${agencySlug}/${v.id}`} 
                key={v.id} 
                className={styles.propertyCard}
              >
                <div className={styles.imageWrapper}>
                  <img 
                    src={v.images && v.images[0] ? v.images[0] : "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"} 
                    alt={`${v.brand} ${v.model}`} 
                    className={styles.propertyImage} 
                  />
                  <span className={styles.propertyTypeBadge} style={{ backgroundColor: "var(--primary)", color: "white" }}>
                    {v.transmission === "automatica" ? "Automático" : "Manual"}
                  </span>
                  {v.status === "reservado" && (
                    <span 
                      style={{ 
                        position: "absolute", 
                        bottom: "10px", 
                        left: "10px", 
                        backgroundColor: "#f59e0b", 
                        color: "white", 
                        padding: "0.2rem 0.6rem", 
                        borderRadius: "4px", 
                        fontSize: "0.75rem", 
                        fontWeight: 700,
                        textTransform: "uppercase" 
                      }}
                    >
                      Reservado
                    </span>
                  )}
                </div>
                <div className={styles.propertyInfo}>
                  <h3 className={styles.propertyTitle}>{v.brand} {v.model}</h3>
                  <div className={styles.propertyLocation}>
                    Año: {v.year} | {v.kms.toLocaleString()} km
                  </div>
                  <div className={styles.propertyFeatures} style={{ display: "flex", gap: "0.75rem", fontSize: "0.8rem", opacity: 0.7 }}>
                    <span>⛽ {v.fuel.toUpperCase()}</span>
                    {v.color && <span>🎨 {v.color}</span>}
                  </div>
                  <div className={styles.propertyPrice}>
                    {v.currency} {v.price.toLocaleString()}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* Sold Section */}
      {publishSold && soldVehicles.length > 0 && (
        <section className={styles.featuredSection} style={{ borderTop: "1px solid var(--border-color)", paddingTop: "3rem", marginTop: "3rem" }}>
          <div className={styles.featuredHeader}>
            <h2>Entregados Recientemente (Vendidos)</h2>
            <span className={styles.viewAll} style={{ fontSize: "0.95rem", opacity: 0.7 }}>
              {filteredSold.length} unidades entregadas
            </span>
          </div>

          <div className={styles.propertyGrid}>
            {filteredSold.length === 0 ? (
              <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "4rem", opacity: 0.6 }}>
                No hay vehículos vendidos que coincidan con la búsqueda.
              </div>
            ) : (
              filteredSold.map((v) => (
                <Link 
                  href={`/portal/${agencySlug}/${v.id}`} 
                  key={v.id} 
                  className={styles.propertyCard}
                  style={{ opacity: 0.8 }}
                >
                  <div className={styles.imageWrapper} style={{ position: "relative", overflow: "hidden" }}>
                    <img 
                      src={v.images && v.images[0] ? v.images[0] : "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"} 
                      alt={`${v.brand} ${v.model}`} 
                      className={styles.propertyImage} 
                    />
                    <span className={styles.propertyTypeBadge} style={{ backgroundColor: "#ef4444", color: "white" }}>
                      Vendido
                    </span>
                    
                    {/* Barra diagonal roja de Vendido */}
                    <div 
                      style={{
                        position: "absolute",
                        top: "18px",
                        right: "-33px",
                        backgroundColor: "#ef4444",
                        color: "white",
                        textTransform: "uppercase",
                        fontSize: "0.65rem",
                        fontWeight: 900,
                        padding: "0.25rem 2.25rem",
                        transform: "rotate(45deg)",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                        zIndex: 10,
                        letterSpacing: "0.05em"
                      }}
                    >
                      Vendido
                    </div>
                  </div>
                  <div className={styles.propertyInfo}>
                    <h3 className={styles.propertyTitle}>{v.brand} {v.model}</h3>
                    <div className={styles.propertyLocation}>
                      Año: {v.year} | {v.kms.toLocaleString()} km
                    </div>
                    <div className={styles.propertyFeatures} style={{ display: "flex", gap: "0.75rem", fontSize: "0.8rem", opacity: 0.7 }}>
                      <span>⛽ {v.fuel.toUpperCase()}</span>
                      {v.color && <span>🎨 {v.color}</span>}
                    </div>
                    <div className={styles.propertyPrice} style={{ color: "#ef4444", fontSize: "1.1rem", fontWeight: "700" }}>
                      Vendido
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>
      )}

      {/* About Section */}
      <section className={styles.aboutSection}>
        <div className={styles.aboutContent}>
          <h2>Sobre Nosotros</h2>
          <p className={styles.aboutHighlight}>
            Tu Automotora... Un espacio dedicado a brindarte confianza y respaldo mecánico en cada unidad seleccionada.
          </p>
          <p className={styles.aboutText}>
            Contamos con un equipo de profesionales listos para asesorarte en la financiación, permuta o test drive de tu próximo vehículo. Ven y descubre que el auto de tus sueños está aquí con nosotros.
          </p>
        </div>
      </section>
    </div>
  );
}
