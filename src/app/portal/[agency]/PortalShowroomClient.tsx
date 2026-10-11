"use client";

import { useState } from "react";
import styles from "./home.module.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Fuel, Shield, Zap, Award, ArrowRight, Phone, MessageSquare, Clock, MapPin, CheckCircle2, Car, Mail, Sparkles, SlidersHorizontal, Calendar } from "lucide-react";
import AgencyBookingWidget from "@/components/portal/AgencyBookingWidget";

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
  agencyId?: string;
  agencySlug: string;
  agencyName: string;
  whatsappPhone?: string;
  logoUrl?: string;
  coverUrl?: string;
  publishSold: boolean;
  webTemplate?: string;
  primaryColor?: string;
  heroEyebrow?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  footerText?: string;
  locationAddress?: string;
  businessHours?: string;
  contactDescription?: string;
  aboutText?: string;
  showTrustSection?: boolean;
  trustPillar1Title?: string;
  trustPillar1Desc?: string;
  trustPillar2Title?: string;
  trustPillar2Desc?: string;
  trustPillar3Title?: string;
  trustPillar3Desc?: string;
  trustPillar4Title?: string;
  trustPillar4Desc?: string;
  contactEmail?: string;
  latitude?: number;
  longitude?: number;
}

export default function PortalShowroomClient({ 
  initialVehicles, 
  agencyId = "00000000-0000-0000-0000-000000000000",
  agencySlug, 
  agencyName, 
  whatsappPhone = "+598 99 123 456",
  logoUrl: _logoUrl,
  coverUrl,
  publishSold,
  webTemplate = "standard",
  primaryColor,
  heroEyebrow = "AUTOMOTORA OFICIAL",
  heroTitle = "Encuentra tu próximo vehículo",
  heroSubtitle = "Unidades seleccionadas que te brindan seguridad, potencia y tranquilidad en cada kilómetro.",
  footerText: _footerText = "Tu concesionario de confianza. Vehículos seleccionados con certificación de origen, garantía y la mejor atención personalizada.",
  locationAddress = "Av. Principal 1234, Montevideo, Uruguay",
  businessHours = "Lunes a Viernes: 09:00 - 19:00 hs | Sábados: 09:00 - 13:00 hs",
  contactDescription = "¿Tienes alguna duda sobre una unidad o deseas agendar una prueba de manejo? Escríbenos directamente o visita nuestro showroom.",
  aboutText = "Somos una automotora comprometida con la excelencia, la transparencia y la calidad. Ofrecemos vehículos seleccionados con certificación total, garantía y atención personalizada.",
  showTrustSection = true,
  trustPillar1Title = "Garantía Certificada",
  trustPillar1Desc = "Revisión mecánica rigurosa de 100 puntos.",
  trustPillar2Title = "Financiación a Medida",
  trustPillar2Desc = "Planes flexibles adaptados a tu presupuesto.",
  trustPillar3Title = "Tomamos Tu Usado",
  trustPillar3Desc = "Cotización justa e inmediata de tu vehículo como parte de pago de forma transparente.",
  trustPillar4Title = "Posventa Exclusiva",
  trustPillar4Desc = "Seguimiento personalizado antes, durante y después de la entrega de tu vehículo.",
  contactEmail = "contacto@automotorademo.com",
  latitude = -34.9011,
  longitude = -56.1645
}: PortalShowroomClientProps) {
  const [activeVehicles] = useState<Vehicle[]>(initialVehicles.filter(v => v.status !== "vendido"));
  const [soldVehicles] = useState<Vehicle[]>(initialVehicles.filter(v => v.status === "vendido"));
  const [search, setSearch] = useState("");
  const [transmissionTab, setTransmissionTab] = useState<"all" | "automatica" | "manual">("all");
  const [fuelFilter, setFuelFilter] = useState("all");
  const [priceRange, setPriceRange] = useState("all");

  // Contact form state
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactVehicle, setContactVehicle] = useState("");
  const [contactSent, setContactSent] = useState(false);

  const pathname = usePathname();
  const isDirectPortal = pathname.startsWith("/portal/");
  const basePath = isDirectPortal ? `/portal/${agencySlug}` : "";
  const catalogHref = `${basePath}/catalogo`;

  const cleanPhone = whatsappPhone.replace(/\D/g, "");

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

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSent(true);
    const msg = `Hola ${agencyName}, mi nombre es ${contactName}. Quisiera consultar sobre el vehículo: ${contactVehicle || 'su inventario'}. Mi teléfono de contacto es: ${contactPhone}.`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
    setTimeout(() => setContactSent(false), 5000);
  };

  const coverImage = coverUrl || "/hero_dealership_drone.jpg";

  // Template-specific root class & default accent color mapping
  const TEMPLATE_ACCENTS: Record<string, string> = {
    luxury: "#eab308",
    sport: "#ef4444",
    tech: "#06b6d4",
    editorial: "#8b5cf6",
    glassmorphism: "#34d399",
    standard: "#10b981",
  };
  const activeTemplate = webTemplate || "standard";
  const accentColor = primaryColor || TEMPLATE_ACCENTS[activeTemplate] || "#10b981";
  const templateClass = styles[`template_${activeTemplate}`] || styles.template_standard;

  return (
    <div 
      className={`${styles.homeContainer} tmpl-${activeTemplate} ${templateClass}`}
      style={{ '--primary': accentColor } as React.CSSProperties}
    >
      
      {/* Background decorations for Glassmorphism & Luxury templates */}
      {activeTemplate === "glassmorphism" && (
        <div className={styles.glassBackgroundGlows}>
          <div className={styles.glowBlob1} />
          <div className={styles.glowBlob2} />
        </div>
      )}

      {/* Hero Section */}
      <section 
        id="inicio"
        className={styles.heroSection}
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(11, 15, 23, 0.75) 0%, rgba(11, 15, 23, 0.92) 100%), url(${coverImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      >
        <div className={styles.heroContent}>
          {heroEyebrow && (
            <div className={styles.eyebrowWrapper}>
              <span className={styles.heroEyebrow}>
                {activeTemplate === "glassmorphism" && <Sparkles size={14} />}
                {activeTemplate === "luxury" && <Award size={14} />}
                {activeTemplate === "sport" && <Zap size={14} />}
                {activeTemplate === "tech" && <SlidersHorizontal size={14} />}
                {activeTemplate === "editorial" && <Shield size={14} />}
                {activeTemplate === "standard" && <Award size={14} />}
                {heroEyebrow}
              </span>
            </div>
          )}

          {activeTemplate === "luxury" && <div className={styles.goldFiligree} />}

          <h1 className={styles.heroTitle}>{heroTitle}</h1>
          <p className={styles.heroSubtitle}>{heroSubtitle}</p>
          
          {/* Hero Action Buttons */}
          <div className={styles.heroActions}>
            <Link href={catalogHref} className={styles.heroBtnPrimary}>
              <Car size={18} /> Ver Catálogo
            </Link>
            <a href="#agendar" className={styles.heroBtnSecondary}>
              <Calendar size={16} /> Visita al Local
            </a>
            <a href="#contacto" className={styles.heroBtnSecondary}>
              <Phone size={16} /> Contacto
            </a>
          </div>
        </div>
      </section>

      {/* Featured Section (Active Vehicle Inventory) */}
      <section id="vehiculos" className={styles.featuredSection}>
        <div className={styles.featuredHeader}>
          <div>
            <span className={styles.sectionCategoryTag}>CATÁLOGO DE UNIDADES</span>
            <h2>Vehículos Destacados</h2>
          </div>
          <Link href={catalogHref} className={styles.viewAllCatalogLink}>
            Ver catálogo completo ({activeVehicles.length}) →
          </Link>
        </div>

        <div className={styles.vehicleGrid}>
          {filteredActive.length === 0 ? (
            <div className={styles.emptyStateCard} style={{ gridColumn: "1/-1" }}>
              <div className={styles.emptyStateIconWrapper}>
                <Car size={36} />
              </div>
              <h3 style={{ margin: "0.5rem 0 0.25rem 0", fontSize: "1.25rem", fontWeight: 700 }}>
                No encontramos vehículos con esa búsqueda
              </h3>
              <p style={{ margin: "0 0 1.25rem 0", fontSize: "0.92rem", opacity: 0.8 }}>
                Prueba visitando el catálogo completo para explorar todas las opciones disponibles.
              </p>
              <Link href={catalogHref} className={styles.resetFiltersBtn}>
                <Car size={14} /> Explorar Catálogo Completo
              </Link>
            </div>
          ) : (
            filteredActive.map((v) => {
              const vehicleDetailHref = `${basePath}/${v.id}`;
              return (
                <Link 
                  href={vehicleDetailHref} 
                  key={v.id} 
                  className={styles.vehicleCard}
                >
                  <div className={styles.imageWrapper}>
                    <img 
                      src={v.images && v.images[0] ? v.images[0] : "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"} 
                      alt={`${v.brand} ${v.model}`} 
                      className={styles.vehicleImage} 
                    />
                    <span className={styles.vehicleTypeBadge}>
                      {v.transmission === "automatica" ? "Automático" : "Manual"}
                    </span>
                    {v.status === "reservado" && (
                      <span className={styles.reservedBadge}>
                        Reservado
                      </span>
                    )}
                  </div>

                  <div className={styles.vehicleInfo}>
                    <h3 className={styles.vehicleTitle}>{v.brand} {v.model}</h3>
                    
                    <div className={styles.vehicleSpecs}>
                      Año: {v.year} | {v.kms.toLocaleString()} km
                    </div>
                    <div className={styles.vehicleFeatures}>
                      <span>⛽ {v.fuel.toUpperCase()}</span>
                      {v.color && <span>🎨 {v.color}</span>}
                    </div>
                    
                    <div className={styles.cardFooterRow}>
                      <div className={styles.vehiclePrice}>
                        {v.currency} {v.price.toLocaleString()}
                      </div>
                      <span className={styles.cardDetailBtn}>
                        Ver Ficha <ArrowRight size={14} />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </section>

      {/* Sold Section */}
      {publishSold && soldVehicles.length > 0 && (
        <section className={styles.featuredSection} style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "3rem", marginTop: "3rem" }}>
          <div className={styles.featuredHeader}>
            <div>
              <span className={styles.sectionCategoryTag}>HISTORIAL DE ENTREGAS</span>
              <h2>Entregados Recientemente (Vendidos)</h2>
            </div>
            <span className={styles.viewAll} style={{ fontSize: "0.95rem", opacity: 0.7 }}>
              {filteredSold.length} unidades entregadas
            </span>
          </div>

          <div className={styles.vehicleGrid}>
            {filteredSold.length === 0 ? (
              <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "4rem", color: "var(--portal-text-muted, #94a3b8)" }}>
                No hay vehículos vendidos que coincidan con la búsqueda.
              </div>
            ) : (
              filteredSold.map((v) => {
              const vehicleDetailHref = `${basePath}/${v.id}`;
                return (
                  <Link 
                    href={vehicleDetailHref} 
                    key={v.id} 
                    className={styles.vehicleCard}
                    style={{ opacity: 0.85 }}
                  >
                  <div className={styles.imageWrapper} style={{ position: "relative", overflow: "hidden" }}>
                    <img 
                      src={v.images && v.images[0] ? v.images[0] : "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"} 
                      alt={`${v.brand} ${v.model}`} 
                      className={styles.vehicleImage} 
                    />
                    <span className={styles.vehicleTypeBadge} style={{ backgroundColor: "#ef4444", color: "white" }}>
                      Vendido
                    </span>
                    
                    {/* Barra diagonal de Vendido */}
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
                  <div className={styles.vehicleInfo}>
                    <h3 className={styles.vehicleTitle}>{v.brand} {v.model}</h3>
                    <div className={styles.vehicleSpecs}>
                      Año: {v.year} | {v.kms.toLocaleString()} km
                    </div>
                    <div className={styles.vehicleFeatures}>
                      <span>⛽ {v.fuel.toUpperCase()}</span>
                      {v.color && <span>🎨 {v.color}</span>}
                    </div>
                    <div className={styles.vehiclePrice} style={{ color: "#ef4444", fontSize: "1.1rem", fontWeight: "700" }}>
                      Vendido
                    </div>
                  </div>
                  </Link>
                );
              })
            )}
          </div>
        </section>
      )}

      {/* About Us Section */}
      <section id="nosotros" className={styles.aboutSection}>
        <div className={styles.aboutContent}>
          <span className={styles.aboutEyebrow}>TRANSPARENCIA & RESPALDO</span>
          <h2>Sobre {agencyName}</h2>
          <p className={styles.aboutHighlight}>
            {aboutText}
          </p>

          {showTrustSection && (
            <div className={styles.trustPillarsGrid}>
              <div className={styles.pillarCard}>
                <Shield size={28} className={styles.pillarIcon} />
                <h4>{trustPillar1Title}</h4>
                <p>{trustPillar1Desc}</p>
              </div>
              <div className={styles.pillarCard}>
                <Zap size={28} className={styles.pillarIcon} />
                <h4>{trustPillar2Title}</h4>
                <p>{trustPillar2Desc}</p>
              </div>
              <div className={styles.pillarCard}>
                <Car size={28} className={styles.pillarIcon} />
                <h4>{trustPillar3Title}</h4>
                <p>{trustPillar3Desc}</p>
              </div>
              <div className={styles.pillarCard}>
                <Award size={28} className={styles.pillarIcon} />
                <h4>{trustPillar4Title}</h4>
                <p>{trustPillar4Desc}</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Contact & Location Section */}
      <section id="contacto" className={styles.contactSection}>
        <div className={styles.contactHeaderCenter}>
          <span className={styles.contactEyebrow}>ATENCIÓN PERSONALIZADA</span>
          <h2>Contacto & Ubicación</h2>
          <p className={styles.contactDesc}>
            {contactDescription}
          </p>
        </div>

        <div className={styles.contactGridWide}>
          <div className={styles.contactDetailsList}>
            <a 
              href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hola ${agencyName}, me gustaría consultar sobre su catálogo de vehículos.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.contactDetailItem}
            >
              <div className={styles.contactDetailIconBadge}>
                <Phone className={styles.contactDetailIcon} size={20} />
              </div>
              <div>
                <strong>WhatsApp Oficial ↗</strong>
                <p className={styles.contactDetailHighlight}>{whatsappPhone}</p>
              </div>
            </a>

            <a 
              href={`mailto:${contactEmail}`}
              className={styles.contactDetailItem}
            >
              <div className={styles.contactDetailIconBadge}>
                <Mail className={styles.contactDetailIcon} size={20} />
              </div>
              <div>
                <strong>Correo de Contacto Preferido</strong>
                <p className={styles.contactDetailHighlight}>{contactEmail}</p>
              </div>
            </a>

            <div className={styles.contactDetailItem}>
              <div className={styles.contactDetailIconBadge}>
                <Clock className={styles.contactDetailIcon} size={20} />
              </div>
              <div>
                <strong>Horarios de Atención</strong>
                <p>{businessHours}</p>
              </div>
            </div>

            <div className={styles.contactDetailItem}>
              <div className={styles.contactDetailIconBadge}>
                <MapPin className={styles.contactDetailIcon} size={20} />
              </div>
              <div>
                <strong>Ubicación de {agencyName || "la Automotora"}</strong>
                <p>{locationAddress}</p>
              </div>
            </div>

            <a 
              href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hola ${agencyName}, quisiera información sobre un vehículo del catálogo.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.contactWhatsappBtn}
            >
              <MessageSquare size={18} /> Chatear por WhatsApp Ahora
            </a>
          </div>

          <div className={styles.mapCanvasWrapperWide}>
            <iframe
              width="100%"
              height="100%"
              frameBorder="0"
              scrolling="no"
              src={`https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`}
              style={{ border: "none", width: "100%", height: "100%", minHeight: "380px" }}
              title={`Ubicación de ${agencyName}`}
            />
          </div>
        </div>
      </section>

      {/* Sección de Agendamiento Online Inteligente (Google Calendar & Horarios) */}
      <section id="agendar" style={{ padding: "3rem 1.5rem", maxWidth: "1280px", margin: "0 auto", width: "100%", boxSizing: "border-box", overflowX: "hidden" }}>
        <AgencyBookingWidget
          agencyId={agencyId}
          agencySlug={agencySlug}
          agencyName={agencyName}
          whatsappPhone={whatsappPhone}
          locationAddress={locationAddress}
          vehicles={initialVehicles.map(v => ({
            id: String(v.id),
            brand: v.brand,
            model: v.model,
            year: Number(v.year) || new Date().getFullYear(),
          }))}
        />
      </section>

      {/* Dedicated Inquiry Form Section (A continuación de Contacto & Ubicación) */}
      <section id="consultas" className={styles.inquirySection}>
        <div className={styles.inquiryContainer}>
          <div className={styles.inquiryHeader}>
            <span className={styles.contactEyebrow}>FORMULARIO DIRECTO</span>
            <h2>Solicitar Información / Test Drive</h2>
            <p className={styles.inquirySubtitle}>
              Déjanos tus datos o el vehículo de tu interés y un asesor de {agencyName} se pondrá en contacto contigo a la brevedad.
            </p>
          </div>

          <div className={styles.inquiryCardWrapper}>
            <form onSubmit={handleContactSubmit} className={styles.contactForm}>
              <div className={styles.formGroup}>
                <label>Tu Nombre Completo *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Ej: Juan Pérez"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Teléfono de Contacto / WhatsApp *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Ej: +598 99 123 456"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Vehículo de Interés (Opcional)</label>
                <input 
                  type="text" 
                  placeholder="Ej: Audi A4, BMW 320, etc."
                  value={contactVehicle}
                  onChange={(e) => setContactVehicle(e.target.value)}
                />
              </div>

              <button type="submit" className={styles.submitFormBtn}>
                <MessageSquare size={16} /> {contactSent ? "¡Abriendo WhatsApp...!" : "Enviar Consulta Directa"}
              </button>

              {contactSent && (
                <span className={styles.formSuccessMsg}>
                  <CheckCircle2 size={16} /> Te redirigiremos a WhatsApp con la consulta preparada.
                </span>
              )}
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
