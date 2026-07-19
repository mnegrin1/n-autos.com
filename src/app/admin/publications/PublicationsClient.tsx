"use client";

import { useState } from "react";
import { Link2, ExternalLink, Eye, MessageSquare, Car } from "lucide-react";
import Link from "next/link";

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  currency: string;
  images: string[];
  status: string;
}

interface Publication {
  id?: string;
  vehicle_id: string;
  channel: 'mercadolibre' | 'facebook' | 'instagram' | 'whatsapp';
  status: 'published' | 'pending' | 'failed';
  external_id?: string;
  external_url?: string;
  views?: number;
  questions_count?: number;
  published_at?: string;
}

interface PublicationsClientProps {
  vehicles: Vehicle[];
  publications: Publication[];
}

export default function PublicationsClient({ vehicles, publications }: PublicationsClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  
  const filteredPubs = publications.filter(pub => {
    const v = vehicles.find(v => v.id === pub.vehicle_id);
    if (!v) return false;
    const searchStr = `${v.brand} ${v.model} ${pub.channel}`.toLowerCase();
    return searchStr.includes(searchTerm.toLowerCase());
  });

  return (
    <div style={{ padding: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-color)", margin: "0 0 0.5rem 0" }}>
            Publicaciones Activas
          </h1>
          <p style={{ color: "var(--text-color)", opacity: 0.7, margin: 0 }}>
            Listado de vehículos actualmente publicados en tus redes y plataformas.
          </p>
        </div>
        
        <input 
          type="text"
          placeholder="Buscar por vehículo o canal..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "8px",
            border: "1px solid var(--border-color)",
            backgroundColor: "var(--bg-color)",
            color: "var(--text-color)",
            width: "250px"
          }}
        />
      </div>

      <div style={{ display: "grid", gap: "1rem" }}>
        {filteredPubs.length === 0 ? (
          <div style={{ 
            textAlign: "center", 
            padding: "3rem", 
            backgroundColor: "var(--surface-color)", 
            borderRadius: "12px",
            border: "1px dashed var(--border-color)"
          }}>
            <p style={{ color: "var(--text-color)", opacity: 0.7, margin: 0 }}>No hay publicaciones activas que coincidan con la búsqueda.</p>
          </div>
        ) : (
          filteredPubs.map(pub => {
            const v = vehicles.find(v => v.id === pub.vehicle_id);
            if (!v) return null;

            return (
              <div 
                key={`${pub.channel}-${pub.vehicle_id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "1rem",
                  backgroundColor: "var(--surface-color)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "12px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  {v.images && v.images[0] ? (
                    <img 
                      src={v.images[0]} 
                      alt={v.brand} 
                      style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "8px" }} 
                    />
                  ) : (
                    <div style={{ width: "60px", height: "60px", backgroundColor: "var(--border-color)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Car size={24} color="var(--text-color)" opacity={0.5} />
                    </div>
                  )}
                  
                  <div>
                    <h3 style={{ margin: "0 0 0.25rem 0", fontSize: "1rem", color: "var(--text-color)" }}>
                      {v.brand} {v.model} <span style={{ opacity: 0.7, fontSize: "0.85rem" }}>{v.year}</span>
                    </h3>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ 
                        fontSize: "0.75rem", 
                        padding: "0.2rem 0.5rem", 
                        borderRadius: "4px", 
                        backgroundColor: pub.channel === 'mercadolibre' ? '#FFE600' : pub.channel === 'facebook' ? '#1877F2' : pub.channel === 'instagram' ? '#E1306C' : '#25D366',
                        color: pub.channel === 'mercadolibre' ? '#333' : '#fff',
                        fontWeight: 600,
                        textTransform: "capitalize"
                      }}>
                        {pub.channel}
                      </span>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-color)", opacity: 0.7 }}>
                        {v.currency} {v.price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                  <div style={{ display: "flex", gap: "1rem", color: "var(--text-color)", opacity: 0.7 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }} title="Visitas">
                      <Eye size={16} />
                      <span style={{ fontSize: "0.85rem", fontWeight: 500 }}>{pub.views || 0}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }} title="Preguntas">
                      <MessageSquare size={16} />
                      <span style={{ fontSize: "0.85rem", fontWeight: 500 }}>{pub.questions_count || 0}</span>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    {pub.external_url ? (
                      <a 
                        href={pub.external_url} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.25rem",
                          padding: "0.4rem 0.75rem",
                          backgroundColor: "transparent",
                          border: "1px solid var(--border-color)",
                          borderRadius: "6px",
                          color: "var(--text-color)",
                          fontSize: "0.8rem",
                          textDecoration: "none",
                          fontWeight: 500
                        }}
                      >
                        <ExternalLink size={14} /> Ver 
                      </a>
                    ) : (
                      <span style={{ fontSize: "0.8rem", color: "var(--text-color)", opacity: 0.5 }}>Sin URL</span>
                    )}
                    
                    <Link
                      href={`/admin/vehicles?action=edit&id=${v.id}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "0.4rem 0.75rem",
                        backgroundColor: "var(--primary-light)",
                        border: "1px solid var(--primary-light)",
                        borderRadius: "6px",
                        color: "var(--primary)",
                        fontSize: "0.8rem",
                        textDecoration: "none",
                        fontWeight: 600
                      }}
                    >
                      Editar
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
