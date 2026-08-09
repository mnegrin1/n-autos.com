"use client";

import React, { useState } from "react";
import {
  Search,
  Plus,
  Calendar,
  Car,
  Users,
  TrendingUp,
  DollarSign,
  Phone,
  Mail,
  MessageSquare,
  Clock,
  ChevronRight,
  Filter,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Building2,
  Sparkles,
  ArrowUpRight,
  SlidersHorizontal,
  X,
} from "lucide-react";

// Datos reales de la plataforma de Automotoras para la demo
const REAL_KPI_SUMMARY = [
  { label: "Vehículos en Stock", value: "42", change: "+3 esta semana", isPositive: true, icon: Car },
  { label: "Leads Nuevos", value: "14", change: "6 requieren contacto hoy", isPositive: true, icon: Users },
  { label: "Pruebas de Manejo", value: "5", change: "2 programadas hoy", isPositive: true, icon: Calendar },
  { label: "Ventas del Mes", value: "9", change: "+12% vs mes anterior", isPositive: true, icon: TrendingUp },
];

const REAL_CRM_LEADS = [
  {
    id: "lead-1",
    clientName: "Matías Rossi",
    phone: "099 123 456",
    email: "matias.rossi@email.com",
    channel: "MercadoLibre",
    vehicle: "Toyota Hilux 2.8 SRV 4x4 AT (2021)",
    vehiclePrice: "U$S 38,900",
    status: "Nuevo",
    statusColor: "#2563EB",
    agent: "Carlos Mendoza",
    lastContact: "Hace 15 min",
    lastMessage: "Consulta por financiación y recepción de permuta Chevrolet Tracker 2018.",
    isUrgent: true,
  },
  {
    id: "lead-2",
    clientName: "Laura Fernández",
    phone: "098 765 432",
    email: "l.fernandez@email.com",
    channel: "Sitio Web",
    vehicle: "Volkswagen Amarok V6 Highline (2022)",
    vehiclePrice: "U$S 46,500",
    status: "Prueba de Manejo",
    statusColor: "#D97706",
    agent: "Sofía Gutiérrez",
    lastContact: "Hace 1 hora",
    lastMessage: "Test drive agendado para hoy a las 16:30 hs en sucursal Carrasco.",
    isUrgent: false,
  },
  {
    id: "lead-3",
    clientName: "Gonzalo Benítez",
    phone: "091 888 999",
    email: "gbenitez@empresa.com",
    channel: "WhatsApp",
    vehicle: "Ford Ranger 3.2 Limited 4x4 (2020)",
    vehiclePrice: "U$S 34,200",
    status: "En Negociación",
    statusColor: "#7C3AED",
    agent: "Carlos Mendoza",
    lastContact: "Hace 3 horas",
    lastMessage: "Solicitó propuesta de leasing corporativo por 2 unidades.",
    isUrgent: false,
  },
  {
    id: "lead-4",
    clientName: "Esteban Prieto",
    phone: "094 555 123",
    email: "esteban.p@email.com",
    channel: "Instagram Ads",
    vehicle: "Jeep Compass 1.3 T270 Longitude (2023)",
    vehiclePrice: "U$S 32,800",
    status: "Ganado / Cierre",
    statusColor: "#059669",
    agent: "Martín Rodríguez",
    lastContact: "Hace 5 horas",
    lastMessage: "Boleto de compraventa firmado. Transferencia bancaria recibida.",
    isUrgent: false,
  },
];

const REAL_VEHICLES_STOCK = [
  {
    id: "v-101",
    brand: "Toyota",
    model: "Hilux 2.8 SRV 4x4 AT",
    year: 2021,
    km: "45,000 km",
    fuel: "Diésel",
    transmission: "Automática",
    price: "U$S 38,900",
    status: "Disponible",
    mlStatus: "Sincronizado ML",
    leadsCount: 5,
  },
  {
    id: "v-102",
    brand: "Volkswagen",
    model: "Amarok V6 Highline 4Motion",
    year: 2022,
    km: "28,000 km",
    fuel: "Diésel",
    transmission: "Automática",
    price: "U$S 46,500",
    status: "Reservado",
    mlStatus: "Pausado ML",
    leadsCount: 8,
  },
  {
    id: "v-103",
    brand: "Chevrolet",
    model: "Tracker 1.2 Turbo LTZ",
    year: 2020,
    km: "52,000 km",
    fuel: "Nafta",
    transmission: "Manual",
    price: "U$S 21,400",
    status: "Disponible",
    mlStatus: "Sincronizado ML",
    leadsCount: 3,
  },
];

export default function CrmSkoolPrinciplesTestPage() {
  const [activeTab, setActiveTab] = useState("crm");
  const [activeFilter, setActiveFilter] = useState("Todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [newLeadModal, setNewLeadModal] = useState(false);

  const filteredLeads = REAL_CRM_LEADS.filter((l) => {
    const matchesFilter = activeFilter === "Todos" || l.status.includes(activeFilter);
    const matchesSearch =
      l.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.vehicle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.phone.includes(searchQuery);
    return matchesFilter && matchesSearch;
  });

  return (
    <div style={{ backgroundColor: "#F8F7F5", minHeight: "100vh", fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color: "#202124" }}>
      
      {/* BARRA SUPERIOR DE CONTEXTO */}
      <div style={{ backgroundColor: "#202124", color: "#FFFFFF", padding: "10px 24px", fontSize: "13px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Sparkles size={15} style={{ color: "#F8D481" }} />
          <span><strong>CRM Automotor con Filosofía de Diseño Skool</strong> — Simplicidad, bajo ruido visual y máxima funcionalidad operativa</span>
        </div>
        <span style={{ backgroundColor: "#34353A", padding: "3px 10px", borderRadius: "999px", color: "#F8D481", fontSize: "12px", fontWeight: 600 }}>
          Demostración en /test
        </span>
      </div>

      {/* 1. APP SHELL - HEADER PERSISTENTE DE 2 FILAS */}
      <header style={{ backgroundColor: "#FFFFFF", borderBottom: "1px solid #E4E4E4", position: "sticky", top: 0, zIndex: 100 }}>
        
        {/* Fila 1 (60px): Marca de Automotora + Buscador Transversal Universal + Acciones Rápidas */}
        <div style={{ maxWidth: "1160px", margin: "0 auto", height: "60px", padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "24px" }}>
          
          {/* Identidad del Concesionario */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "38px", height: "38px", borderRadius: "8px", backgroundColor: "#202124", color: "#FFFFFF", display: "grid", placeItems: "center", fontWeight: 800, fontSize: "15px" }}>
              N
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "15px", color: "#202124", lineHeight: 1.2 }}>AutoMax Motors</div>
              <div style={{ fontSize: "12px", color: "#707174" }}>Sucursal Casa Central</div>
            </div>
          </div>

          {/* Buscador Transversal de CRM (46px alto, gris #E4E4E4, radio 10px) */}
          <div style={{ flex: 1, maxWidth: "560px", position: "relative" }}>
            <Search size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#707174" }} />
            <input
              type="text"
              placeholder="Buscar cliente, teléfono, auto o patente... (Presiona ⌘K)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                height: "44px",
                backgroundColor: "#E4E4E4",
                border: "none",
                borderRadius: "10px",
                paddingLeft: "42px",
                paddingRight: "16px",
                fontSize: "14px",
                color: "#202124",
                outline: "none",
              }}
            />
          </div>

          {/* Botón "+ Nuevo Lead / Vehículo" + Usuario */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              onClick={() => setNewLeadModal(true)}
              style={{
                height: "40px",
                paddingInline: "16px",
                borderRadius: "999px",
                backgroundColor: "#202124",
                color: "#FFFFFF",
                border: "none",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Plus size={16} /> Nuevo Registró
            </button>

            <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#E4E4E4", color: "#202124", fontWeight: 700, fontSize: "13px", display: "grid", placeItems: "center" }}>
              CM
            </div>
          </div>
        </div>

        {/* Fila 2 (60px): Navegación Transversal en Pestañas (Subrayado activo de 4px) */}
        <div style={{ maxWidth: "1160px", margin: "0 auto", paddingInline: "16px" }}>
          <nav style={{ display: "flex", gap: "32px", height: "60px", alignItems: "center" }}>
            {[
              { id: "crm", label: "Gestión de Leads (CRM)" },
              { id: "stock", label: "Inventario de Autos" },
              { id: "inbox", label: "Inbox WhatsApp / Email" },
              { id: "ml", label: "Sincronización MercadoLibre" },
              { id: "reports", label: "Métricas & Reportes" },
              { id: "settings", label: "Configuración" },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    position: "relative",
                    height: "60px",
                    display: "inline-flex",
                    alignItems: "center",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? "#202124" : "#707174",
                    padding: 0,
                  }}
                >
                  {tab.label}
                  {isActive && (
                    <span
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: "4px",
                        backgroundColor: "#202124",
                        borderRadius: "4px 4px 0 0",
                      }}
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* MODAL INGRESAR NUEVO LEAD */}
      {newLeadModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", zIndex: 300, display: "grid", placeItems: "center", padding: "16px" }}>
          <div style={{ width: "100%", maxWidth: "480px", backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #E4E4E4", padding: "24px", boxShadow: "0 14px 34px rgba(0,0,0,0.12)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "#202124" }}>Registrar Nuevo Lead / Consulta</h3>
              <button onClick={() => setNewLeadModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#707174" }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#707174", display: "block", marginBottom: "4px" }}>Nombre del Cliente</label>
                <input type="text" placeholder="Ej: Roberto Gómez" style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #E4E4E4", fontSize: "14px", outline: "none" }} />
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#707174", display: "block", marginBottom: "4px" }}>Teléfono / WhatsApp</label>
                <input type="text" placeholder="Ej: 099 123 456" style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #E4E4E4", fontSize: "14px", outline: "none" }} />
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#707174", display: "block", marginBottom: "4px" }}>Vehículo de Interés</label>
                <input type="text" placeholder="Ej: Toyota Hilux 2021" style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #E4E4E4", fontSize: "14px", outline: "none" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                <button onClick={() => setNewLeadModal(false)} style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #E4E4E4", background: "#fff", cursor: "pointer", fontSize: "14px" }}>
                  Cancelar
                </button>
                <button onClick={() => setNewLeadModal(false)} style={{ padding: "8px 20px", borderRadius: "8px", border: "none", background: "#202124", color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: "14px" }}>
                  Guardar Registro
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. ESTRUCTURA DE 2 COLUMNAS (1160px max width, 42px gap) */}
      <main
        style={{
          maxWidth: "1160px",
          margin: "34px auto",
          padding: "0 16px",
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 292px",
          columnGap: "42px",
          alignItems: "start",
        }}
      >
        {/* COLUMNA PRINCIPAL DEL CRM (71% / ~824px) */}
        <section style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* TARJETAS DE KPIS OPERATIVOS (ESTILO LIMPIO SKOOL: FONDO BLANCO, BORDE 1PX, TIPOGRAFÍA JERÁRQUICA) */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
            {REAL_KPI_SUMMARY.map((kpi, idx) => {
              const IconComp = kpi.icon;
              return (
                <div
                  key={idx}
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: "12px",
                    border: "1px solid #E4E4E4",
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "#707174" }}>{kpi.label}</span>
                    <IconComp size={16} style={{ color: "#202124" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: "24px", fontWeight: 700, color: "#202124", lineHeight: 1.1 }}>{kpi.value}</div>
                    <div style={{ fontSize: "11px", color: kpi.isPositive ? "#059669" : "#707174", marginTop: "4px", fontWeight: 500 }}>
                      {kpi.change}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* BANNER MINIMALISTA TIPO PRÓXIMO COMPROMISO */}
          <div
            style={{
              padding: "12px 18px",
              backgroundColor: "#FFFFFF",
              borderRadius: "10px",
              border: "1px solid #E4E4E4",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Clock size={18} style={{ color: "#202124" }} />
              <span style={{ fontWeight: 600, color: "#202124" }}>Próximo Test Drive:</span>
              <span style={{ color: "#707174" }}>Laura Fernández — Volkswagen Amarok V6 (Hoy 16:30 hs)</span>
            </div>
            <span style={{ backgroundColor: "#FBE3A7", color: "#202124", padding: "4px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: 600 }}>
              Faltan 45 mins
            </span>
          </div>

          {/* BARRA DE FILTROS POR ESTADO DEL EMBUDO (CHIPS EN PÍLDORA) */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {["Todos", "Nuevo", "En Negociación", "Prueba de Manejo", "Cierre"].map((filter) => {
                const isActive = activeFilter === filter;
                return (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    style={{
                      height: "38px",
                      paddingInline: "16px",
                      borderRadius: "999px",
                      border: isActive ? "1px solid #202124" : "1px solid #E0E0E0",
                      backgroundColor: isActive ? "#202124" : "#FFFFFF",
                      color: isActive ? "#FFFFFF" : "#707174",
                      fontSize: "13px",
                      fontWeight: isActive ? 600 : 400,
                      cursor: "pointer",
                      transition: "all 120ms ease",
                    }}
                  >
                    {filter}
                  </button>
                );
              })}
            </div>
            <span style={{ fontSize: "13px", color: "#707174" }}>
              Mostrando <strong>{filteredLeads.length}</strong> consultas activas
            </span>
          </div>

          {/* VISTA PRINCIPAL: LISTADO EDITORIAL DE LEADS DEL CRM */}
          {activeTab === "crm" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {filteredLeads.map((lead) => (
                <div
                  key={lead.id}
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: "12px",
                    border: lead.isUrgent ? "1px solid #F8D481" : "1px solid #E4E4E4",
                    padding: "18px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    transition: "border-color 120ms ease",
                  }}
                >
                  {/* Encabezado del Lead: Cliente + Origen + Estado */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "50%",
                          backgroundColor: "#F4F3F0",
                          color: "#202124",
                          display: "grid",
                          placeItems: "center",
                          fontWeight: 700,
                          fontSize: "14px",
                          border: "1px solid #E4E4E4",
                        }}
                      >
                        {lead.clientName.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div>
                        <div style={{ fontSize: "15px", fontWeight: 700, color: "#202124", display: "flex", alignItems: "center", gap: "8px" }}>
                          {lead.clientName}
                          <span style={{ fontSize: "11px", backgroundColor: "#F8F7F5", border: "1px solid #E4E4E4", padding: "2px 8px", borderRadius: "999px", color: "#707174", fontWeight: 500 }}>
                            {lead.channel}
                          </span>
                        </div>
                        <div style={{ fontSize: "13px", color: "#707174", marginTop: "2px" }}>
                          {lead.phone} · {lead.email}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          padding: "4px 10px",
                          borderRadius: "999px",
                          backgroundColor: lead.isUrgent ? "#FBE3A7" : "#F8F7F5",
                          color: "#202124",
                          border: "1px solid #E4E4E4",
                        }}
                      >
                        {lead.status}
                      </span>
                      <div style={{ fontSize: "12px", color: "#707174", marginTop: "4px" }}>
                        Asignado a: <strong>{lead.agent}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Vehículo de Interés y Precio */}
                  <div style={{ backgroundColor: "#F8F7F5", padding: "10px 14px", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", color: "#707174", fontWeight: 600, display: "block" }}>
                        Unidad de Interés
                      </span>
                      <span style={{ fontSize: "14px", fontWeight: 700, color: "#202124" }}>
                        {lead.vehicle}
                      </span>
                    </div>
                    <span style={{ fontSize: "15px", fontWeight: 700, color: "#202124" }}>
                      {lead.vehiclePrice}
                    </span>
                  </div>

                  {/* Resumen del último contacto */}
                  <p style={{ fontSize: "14px", color: "#202124", margin: 0, lineHeight: 1.45 }}>
                    "{lead.lastMessage}"
                  </p>

                  {/* Pie de tarjeta con tiempo transcurrido y acciones en azul */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #ECEBEA", paddingTop: "12px" }}>
                    <span style={{ fontSize: "12px", color: "#707174" }}>
                      Última interacción: <strong>{lead.lastContact}</strong>
                    </span>
                    <div style={{ display: "flex", gap: "12px" }}>
                      <button style={{ background: "none", border: "none", color: "#2E6EF5", fontWeight: 600, fontSize: "13px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <Phone size={14} /> Llamar
                      </button>
                      <button style={{ background: "none", border: "none", color: "#2E6EF5", fontWeight: 600, fontSize: "13px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <MessageSquare size={14} /> Abrir WhatsApp →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* VISTA SECUNDARIA DE MUESTRA: INVENTARIO DE AUTOS */}
          {activeTab === "stock" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {REAL_VEHICLES_STOCK.map((item) => (
                <div key={item.id} style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #E4E4E4", padding: "18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: "#202124" }}>
                      {item.brand} {item.model} ({item.year})
                    </div>
                    <div style={{ fontSize: "13px", color: "#707174", marginTop: "4px" }}>
                      {item.km} · {item.fuel} · {item.transmission}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "18px", fontWeight: 700, color: "#202124" }}>{item.price}</div>
                    <span style={{ fontSize: "12px", color: "#059669", fontWeight: 600 }}>{item.mlStatus}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* SIDEBAR CONTEXTUAL DE CONTROL (292px) */}
        <aside style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* TARJETA 1: FICHA DE CONTROL DEL CONCESIONARIO */}
          <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #E4E4E4", padding: "18px" }}>
            <h3 style={{ margin: "0 0 4px 0", fontSize: "15px", fontWeight: 700, color: "#202124" }}>
              Resumen de Operaciones
            </h3>
            <p style={{ fontSize: "13px", color: "#707174", margin: "0 0 14px 0" }}>
              Sucursal Casa Central — Estado en tiempo real del inventario y canales de venta.
            </p>

            <div style={{ borderTop: "1px solid #ECEBEA", margin: "12px 0" }} />

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#707174" }}>MercadoLibre Sync:</span>
                <span style={{ color: "#059669", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                  <CheckCircle2 size={14} /> Activo (42 autos)
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#707174" }}>WhatsApp Business API:</span>
                <span style={{ color: "#059669", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                  <CheckCircle2 size={14} /> Conectado
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#707174" }}>Reserva vencida hoy:</span>
                <span style={{ color: "#202124", fontWeight: 600 }}>0 unidades</span>
              </div>
            </div>

            <div style={{ borderTop: "1px solid #ECEBEA", margin: "14px 0" }} />

            <button
              style={{
                width: "100%",
                height: "42px",
                borderRadius: "8px",
                border: "1px solid #E4E4E4",
                backgroundColor: "#FFFFFF",
                color: "#202124",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Exportar Informe a Excel
            </button>
          </div>

          {/* TARJETA 2: VENDEDORES CON MAYOR ACTIVIDAD */}
          <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #E4E4E4", padding: "18px" }}>
            <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: 700, color: "#202124" }}>
              Rendimiento Comercial (Mes)
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
              {[
                { name: "Carlos Mendoza", leads: "18 leads", sales: "4 ventas" },
                { name: "Sofía Gutiérrez", leads: "14 leads", sales: "3 ventas" },
                { name: "Martín Rodríguez", leads: "10 leads", sales: "2 ventas" },
              ].map((v, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: i < 2 ? "1px solid #F4F3F0" : "none", paddingBottom: i < 2 ? "8px" : 0 }}>
                  <div>
                    <div style={{ fontWeight: 600, color: "#202124" }}>{v.name}</div>
                    <div style={{ fontSize: "12px", color: "#707174" }}>{v.leads} atendidos</div>
                  </div>
                  <span style={{ fontWeight: 700, color: "#202124" }}>{v.sales}</span>
                </div>
              ))}
            </div>
          </div>

        </aside>
      </main>

    </div>
  );
}
