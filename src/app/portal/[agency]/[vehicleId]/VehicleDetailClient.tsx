"use client";

import { useState, useTransition } from "react";
import styles from "./detail.module.css";
import { createAutoLead } from "@/actions/autoActions";
import { MessageSquare, Phone, Mail, User, CheckCircle, Image as ImageIcon } from "lucide-react";
import VehicleGallery, { type UnifiedMediaItem } from "./VehicleGallery";

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
  color?: string;
  engine?: string;
  doors?: number;
  plate?: string;
  description?: string;
  images: string[];
  videos?: string[];
  youtube_videos?: string | null;
  status: "disponible" | "reservado" | "vendido";
}

interface VehicleDetailClientProps {
  vehicle: Vehicle;
  agencyName: string;
  whatsappPhone: string;
}

export default function VehicleDetailClient({ vehicle, agencyName, whatsappPhone }: VehicleDetailClientProps) {
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [formState, setFormState] = useState({
    name: "",
    email: "",
    phone: "",
    message: `Hola, me interesa el vehículo "${vehicle.brand} ${vehicle.model} (${vehicle.year})" (Ref: ${vehicle.id}). ¿Me pueden brindar más información?`,
  });

  const cleanPhone = whatsappPhone.replace(/\D/g, "");
  const whatsappMsg = `Hola, me interesa el vehículo "${vehicle.brand} ${vehicle.model} (${vehicle.year})" (Ref: ${vehicle.id}).`;
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappMsg)}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name) return;

    startTransition(async () => {
      const res = await createAutoLead({
        name: formState.name,
        email: formState.email,
        phone: formState.phone,
        vehicle: `${vehicle.brand} ${vehicle.model}`,
        vehicleId: vehicle.id,
        message: formState.message,
      });

      if (res.success) {
        setSuccess(true);
        setFormState({
          name: "",
          email: "",
          phone: "",
          message: "",
        });
      } else {
        alert("Ocurrió un error al enviar tu consulta.");
      }
    });
  };

  // Reconstruct unified media
  const media: UnifiedMediaItem[] = [];
  const ytVideoStr = vehicle.youtube_videos;

  if (ytVideoStr && typeof ytVideoStr === "string" && ytVideoStr.trim().startsWith("[")) {
    try {
      const parsed = JSON.parse(ytVideoStr);
      if (Array.isArray(parsed)) {
        parsed.forEach((item: any) => {
          if (item.type === "youtube") {
            media.push({
              type: "youtube",
              src: item.url,
              embedId: item.embedId,
            });
          } else if (item.type === "video" || item.type === "image") {
            media.push({
              type: item.type,
              src: item.url,
            });
          }
        });
      }
    } catch (e) {
      console.error("Error parsing vehicle media:", e);
    }
  }

  // Fallback if no unified layout stored yet (legacy formats)
  if (media.length === 0) {
    const rawImages = vehicle.images || [];
    rawImages.forEach((img: string) => {
      media.push({ type: "image", src: img });
    });
    const rawVideos = vehicle.videos || [];
    rawVideos.forEach((vid: string) => {
      media.push({ type: "video", src: vid });
    });
  }

  return (
    <div className={styles.detailContainer}>
      
      {/* Top Section: Media Gallery (styled like real estate gallery) */}
      <div className={styles.galleryWrapper}>
        <VehicleGallery media={media} title={`${vehicle.brand} ${vehicle.model}`} />
      </div>

      {/* Main Content Layout Grid */}
      <div className={styles.contentWrapper}>
        
        {/* Left Column: Info, Specs and Description */}
        <div className={styles.mainInfo}>
          
          <div className={styles.headerInfo}>
            <span className={styles.badge}>
              {vehicle.transmission === "automatica" ? "Automático" : "Manual"}
            </span>
            <h1 className={styles.title}>{vehicle.brand} {vehicle.model}</h1>
            <div className={styles.location}>
              Año {vehicle.year} • Estado: {vehicle.status.toUpperCase()}
            </div>
          </div>

          {/* Quick Specs Grid */}
          <div className={styles.features}>
            <div className={styles.featureItem}>
              <span className={styles.featureLabel}>Kilómetros</span>
              <span className={styles.featureValue}>{vehicle.kms.toLocaleString()} km</span>
            </div>
            <div className={styles.featureItem}>
              <span className={styles.featureLabel}>Motor</span>
              <span className={styles.featureValue}>{vehicle.engine || "N/D"}</span>
            </div>
            <div className={styles.featureItem}>
              <span className={styles.featureLabel}>Combustible</span>
              <span className={styles.featureValue} style={{ textTransform: "capitalize" }}>{vehicle.fuel}</span>
            </div>
            {vehicle.doors && (
              <div className={styles.featureItem}>
                <span className={styles.featureLabel}>Puertas</span>
                <span className={styles.featureValue}>{vehicle.doors}</span>
              </div>
            )}
          </div>

          {/* Technical Specs Detailed Table */}
          <div className={styles.specsCard}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 1rem 0" }}>Ficha Técnica</h3>
            <table className={styles.specsTable}>
              <tbody>
                <tr>
                  <td>Marca</td>
                  <td>{vehicle.brand}</td>
                </tr>
                <tr>
                  <td>Modelo</td>
                  <td>{vehicle.model}</td>
                </tr>
                <tr>
                  <td>Año</td>
                  <td>{vehicle.year}</td>
                </tr>
                <tr>
                  <td>Kilometraje</td>
                  <td>{vehicle.kms.toLocaleString()} km</td>
                </tr>
                {vehicle.color && (
                  <tr>
                    <td>Color</td>
                    <td>{vehicle.color}</td>
                  </tr>
                )}
                {vehicle.plate && (
                  <tr>
                    <td>Matrícula / Patente</td>
                    <td style={{ textTransform: "uppercase" }}>{vehicle.plate}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Description Paragraph */}
          {vehicle.description && (
            <div className={styles.descriptionSection}>
              <h2>Sobre este vehículo</h2>
              <p>{vehicle.description}</p>
            </div>
          )}
        </div>

        {/* Right Column: Sidebar (Pricing & Contact Form) */}
        <div className={styles.sidebar}>
          
          <div className={styles.priceContainer}>
            <span className={styles.priceLabel}>Precio de Lista</span>
            <div className={styles.price}>
              {vehicle.currency} {vehicle.price.toLocaleString()}
            </div>
          </div>

          {vehicle.status === "vendido" ? (
            <div style={{ textAlign: "center", padding: "2rem", backgroundColor: "rgba(239, 68, 68, 0.08)", borderRadius: "16px", border: "1px solid #ef4444", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "1.25rem", fontWeight: "800", color: "#ef4444" }}>UNIDAD VENDIDA</span>
              <span style={{ fontSize: "0.85rem", opacity: 0.8 }}>Este vehículo ya ha sido vendido y entregado. Visita nuestro catálogo para encontrar unidades similares.</span>
            </div>
          ) : success ? (
            <div style={{ textAlign: "center", padding: "1.5rem", backgroundColor: "rgba(16, 185, 129, 0.1)", borderRadius: "16px", border: "1px solid var(--success)", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
              <CheckCircle size={24} style={{ color: "var(--success)", marginBottom: "0.5rem" }} />
              <span style={{ fontSize: "1rem", fontWeight: "700", color: "var(--success)" }}>¡Mensaje Enviado!</span>
              <span style={{ fontSize: "0.8rem", opacity: 0.8 }}>Tu consulta ha sido ingresada en nuestro sistema CRM. Te responderemos pronto.</span>
            </div>
          ) : (
            <div className={styles.contactForm}>
              <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: "700" }}>Consultar por esta unidad</h3>
              
              <a 
                href={whatsappUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className={styles.whatsAppBtn}
              >
                <MessageSquare size={16} /> Contactar por WhatsApp
              </a>

              <div style={{ textAlign: "center", fontSize: "0.75rem", opacity: 0.5, margin: "0.25rem 0" }}>
                o envía un mensaje a nuestro CRM
              </div>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                <input 
                  type="text" 
                  required
                  placeholder="Tu Nombre *" 
                  className={styles.formInput}
                  value={formState.name}
                  onChange={(e) => setFormState(prev => ({ ...prev, name: e.target.value }))}
                />
                
                <input 
                  type="text" 
                  placeholder="Tu Teléfono" 
                  className={styles.formInput}
                  value={formState.phone}
                  onChange={(e) => setFormState(prev => ({ ...prev, phone: e.target.value }))}
                />

                <input 
                  type="email" 
                  placeholder="Tu Email" 
                  className={styles.formInput}
                  value={formState.email}
                  onChange={(e) => setFormState(prev => ({ ...prev, email: e.target.value }))}
                />

                <textarea 
                  required
                  className={styles.formTextarea}
                  value={formState.message}
                  onChange={(e) => setFormState(prev => ({ ...prev, message: e.target.value }))}
                />

                <button 
                  type="submit" 
                  className={styles.btnSubmit}
                  disabled={isPending}
                >
                  {isPending ? "Enviando..." : "Enviar Consulta"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
