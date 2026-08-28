"use client";

import { useState } from "react";
import styles from "./InteractiveDashboardPreview.module.css";
import { trackButtonClick } from "@/lib/landingTracker";
import { 
  LayoutDashboard,
  Car, 
  MessageSquare, 
  BarChart3, 
  RefreshCw, 
  CheckCircle2, 
  Search, 
  Zap, 
  Globe, 
  Users,
  Plus,
  MousePointerClick,
  TrendingUp,
  Settings,
  Moon,
  ChevronDown,
  ExternalLink,
  Bot,
  Sliders
} from "lucide-react";

type TabType = "dashboard" | "inventario" | "leads" | "sync" | "web" | "contactos" | "automatizaciones";

export default function InteractiveDashboardPreview() {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [inventoryFilter, setInventoryFilter] = useState<"todos" | "disponibles" | "reservados">("todos");
  const [contactFilter, setContactFilter] = useState<"todos" | "calientes" | "vip">("todos");
  const [activeTheme, setActiveTheme] = useState<"oscuro" | "blanco" | "deportivo">("oscuro");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);
  const [repliedLeads, setRepliedLeads] = useState<Record<number, boolean>>({});

  // Estado interactivo de automatizaciones (ON/OFF)
  const [automationsState, setAutomationsState] = useState({
    wppAutoReply: true,
    roundRobinLeads: true,
    reInterestAlert: true,
    autoMeliPublish: true
  });

  const toggleAutomation = (key: keyof typeof automationsState) => {
    setAutomationsState(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const cars = [
    {
      id: 1,
      title: "Porsche 911 GT3 RS",
      price: "$295.000 USD",
      status: "disponibles",
      statusLabel: "Disponible",
      statusClass: styles.statusAvailable,
      image: "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=300&q=80"
    },
    {
      id: 2,
      title: "BMW M3 Competition 2023",
      price: "$125.000 USD",
      status: "disponibles",
      statusLabel: "En MercadoLibre",
      statusClass: styles.statusMeli,
      image: "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=300&q=80"
    },
    {
      id: 3,
      title: "Audi RS6 Avant Carbon",
      price: "$168.000 USD",
      status: "reservados",
      statusLabel: "Reservado",
      statusClass: styles.statusReserved,
      image: "https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&w=300&q=80"
    },
    {
      id: 4,
      title: "Mercedes-AMG C63 S",
      price: "$115.000 USD",
      status: "disponibles",
      statusLabel: "Disponible",
      statusClass: styles.statusAvailable,
      image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=300&q=80"
    }
  ];

  const leads = [
    {
      id: 1,
      name: "Martín E. González",
      channel: "WhatsApp",
      channelClass: styles.channelWpp,
      time: "Hace 4 min",
      msg: "Hola! Sigue disponible el Porsche 911? Toman permuta?",
      car: "Porsche 911 GT3 RS"
    },
    {
      id: 2,
      name: "Lucía B. Morales",
      channel: "MercadoLibre",
      channelClass: styles.channelMeli,
      time: "Hace 12 min",
      msg: "Buenas tardes, ¿qué tasa de financiación tienen para el BMW M3?",
      car: "BMW M3 Competition"
    },
    {
      id: 3,
      name: "Diego M. Silva",
      channel: "Instagram Direct",
      channelClass: styles.channelIg,
      time: "Hace 35 min",
      msg: "Me interesa coordinar una prueba de manejo del Audi RS6 mañana",
      car: "Audi RS6 Avant"
    }
  ];

  const contacts = [
    {
      id: 1,
      name: "Carlos Rodríguez",
      phone: "099 876 543",
      interest: "Porsche 911 GT3 RS",
      channel: "WhatsApp",
      tag: "Prospecto Caliente",
      tagColor: "rgba(239, 68, 68, 0.2)",
      tagText: "#fca5a5",
      type: "calientes"
    },
    {
      id: 2,
      name: "Alejandro Silva",
      phone: "091 234 567",
      interest: "BMW M3 Competition",
      channel: "MercadoLibre",
      tag: "Permuta en Evaluación",
      tagColor: "rgba(234, 179, 8, 0.2)",
      tagText: "#fde047",
      type: "todos"
    },
    {
      id: 3,
      name: "Mariana Costa",
      phone: "098 112 233",
      interest: "Audi RS6 Avant",
      channel: "Instagram",
      tag: "Prueba de Manejo Agendada",
      tagColor: "rgba(59, 130, 246, 0.2)",
      tagText: "#93c5fd",
      type: "calientes"
    },
    {
      id: 4,
      name: "Gonzalo Martínez",
      phone: "099 554 433",
      interest: "Mercedes-AMG C63 S",
      channel: "Presencial",
      tag: "Cliente VIP",
      tagColor: "rgba(16, 185, 129, 0.2)",
      tagText: "#6ee7b7",
      type: "vip"
    }
  ];

  const filteredCars = cars.filter(car => {
    if (inventoryFilter === "todos") return true;
    return car.status === inventoryFilter;
  });

  const filteredContacts = contacts.filter(contact => {
    if (contactFilter === "todos") return true;
    return contact.type === contactFilter;
  });

  const handleSyncClick = () => {
    trackButtonClick("preview_sync_all", "Sincronizar Todo en 1-Clic", "Demo CRM Interactivo");
    setIsSyncing(true);
    setSyncDone(false);
    setTimeout(() => {
      setIsSyncing(false);
      setSyncDone(true);
      setTimeout(() => setSyncDone(false), 3000);
    }, 1200);
  };

  const handleReplyClick = (leadId: number) => {
    trackButtonClick("preview_reply_lead", `Responder Lead #${leadId}`, "Demo CRM Interactivo");
    setRepliedLeads(prev => ({ ...prev, [leadId]: true }));
  };

  return (
    <div className={styles.monitorContainer}>
      <div className={styles.monitorFrame}>
        <div className={styles.screen}>
          <div className={styles.dashLayout}>
            {/* BARRA LATERAL IZQUIERDA (SIDEBAR) */}
            <aside className={styles.sidebar}>
              {/* Header de la marca / concesionario */}
              <div className={styles.sidebarHeader}>
                <div className={styles.brandLogoCircle}>T</div>
                <div className={styles.brandDetails}>
                  <span className={styles.brandTitle}>Tu Automotora</span>
                  <span className={styles.brandSubtitle}>ADMINISTRACIÓN</span>
                </div>
              </div>

              {/* Buscador de CRM */}
              <div className={styles.searchBox}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <Search size={12} />
                  <span>Buscar en el CRM...</span>
                </div>
                <span className={styles.shortcutBadge}>⌘K</span>
              </div>

              {/* Botón Nuevo */}
              <button className={styles.newBtn}>
                <Plus size={14} /> Nuevo <ChevronDown size={12} />
              </button>

              {/* Navegación Vertical en Sidebar */}
              <nav className={styles.sidebarNav}>
                <button 
                  className={`${styles.sidebarItem} ${activeTab === "dashboard" ? styles.sidebarItemActive : ""}`}
                  onClick={() => {
                    setActiveTab("dashboard");
                    trackButtonClick("preview_tab_dashboard", "Tab Dashboard (Preview)", "Demo CRM Interactivo");
                  }}
                >
                  <div className={styles.itemLeft}>
                    <LayoutDashboard size={14} />
                    <span>Dashboard</span>
                  </div>
                </button>

                <button 
                  className={`${styles.sidebarItem} ${activeTab === "inventario" ? styles.sidebarItemActive : ""}`}
                  onClick={() => {
                    setActiveTab("inventario");
                    trackButtonClick("preview_tab_inventario", "Tab Inventario Stock (Preview)", "Demo CRM Interactivo");
                  }}
                >
                  <div className={styles.itemLeft}>
                    <Car size={14} />
                    <span>Inventario Stock</span>
                  </div>
                  <span className={styles.sidebarBadge} style={{ background: "rgba(255,255,255,0.15)", color: "#ffffff" }}>38</span>
                </button>

                <button 
                  className={`${styles.sidebarItem} ${activeTab === "leads" ? styles.sidebarItemActive : ""}`}
                  onClick={() => {
                    setActiveTab("leads");
                    trackButtonClick("preview_tab_leads", "Tab Bandeja de Entrada (Preview)", "Demo CRM Interactivo");
                  }}
                >
                  <div className={styles.itemLeft}>
                    <MessageSquare size={14} />
                    <span>Bandeja de Entrada</span>
                  </div>
                  <span className={styles.sidebarBadge}>3</span>
                </button>

                <button 
                  className={`${styles.sidebarItem} ${activeTab === "sync" ? styles.sidebarItemActive : ""}`}
                  onClick={() => {
                    setActiveTab("sync");
                    trackButtonClick("preview_tab_sync", "Tab Publicaciones (Preview)", "Demo CRM Interactivo");
                  }}
                >
                  <div className={styles.itemLeft}>
                    <Zap size={14} />
                    <span>Publicaciones</span>
                  </div>
                </button>

                <button 
                  className={`${styles.sidebarItem} ${activeTab === "web" ? styles.sidebarItemActive : ""}`}
                  onClick={() => {
                    setActiveTab("web");
                    trackButtonClick("preview_tab_web", "Tab Página Web (Preview)", "Demo CRM Interactivo");
                  }}
                >
                  <div className={styles.itemLeft}>
                    <Globe size={14} />
                    <span>Página Web</span>
                  </div>
                </button>

                <button 
                  className={`${styles.sidebarItem} ${activeTab === "contactos" ? styles.sidebarItemActive : ""}`}
                  onClick={() => {
                    setActiveTab("contactos");
                    trackButtonClick("preview_tab_contactos", "Tab Contactos (Preview)", "Demo CRM Interactivo");
                  }}
                >
                  <div className={styles.itemLeft}>
                    <Users size={14} />
                    <span>Contactos</span>
                  </div>
                </button>

                <button 
                  className={`${styles.sidebarItem} ${activeTab === "automatizaciones" ? styles.sidebarItemActive : ""}`}
                  onClick={() => {
                    setActiveTab("automatizaciones");
                    trackButtonClick("preview_tab_automatizaciones", "Tab Automatizaciones (Preview)", "Demo CRM Interactivo");
                  }}
                >
                  <div className={styles.itemLeft}>
                    <Bot size={14} color="#eab308" />
                    <span>Automatizaciones</span>
                  </div>
                </button>
              </nav>

              {/* Perfil de usuario en pie de Sidebar */}
              <div className={styles.sidebarFooter}>
                <div className={styles.userProfile}>
                  <div className={styles.userAvatar}>Tú</div>
                  <div>
                    <div className={styles.userName}>Tú</div>
                    <div className={styles.userSub}>Tu Automotora</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.3rem", color: "#6b7280" }}>
                  <Settings size={12} />
                  <Moon size={12} />
                </div>
              </div>
            </aside>

            {/* ÁREA PRINCIPAL DERECHA */}
            <main className={styles.mainContent}>
              {/* Header Principal */}
              <div className={styles.contentHeader}>
                <div>
                  <h3 className={styles.contentTitle}>
                    {activeTab === "dashboard" && "Dashboard General"}
                    {activeTab === "inventario" && "Inventario Stock"}
                    {activeTab === "leads" && "Bandeja de Entrada - CRM"}
                    {activeTab === "sync" && "Publicaciones & Sincronización"}
                    {activeTab === "web" && "Configuración de Portal Web"}
                    {activeTab === "contactos" && "Gestión de Contactos & Leads"}
                    {activeTab === "automatizaciones" && "Reglas & Automatizaciones IA"}
                  </h3>
                  <p className={styles.contentSubtitle}>
                    {activeTab === "dashboard" && "Resumen operativo de tu concesionario en tiempo real."}
                    {activeTab === "inventario" && "Gestión completa de vehículos, precios y estados."}
                    {activeTab === "leads" && "Consultas unificadas de WhatsApp, MercadoLibre e Instagram."}
                    {activeTab === "sync" && "Sincronización en 1-clic con redes y portales."}
                    {activeTab === "web" && "Personalización visual del portal web de Tu Automotora."}
                    {activeTab === "contactos" && "Base unificada de clientes con etiquetado inteligente."}
                    {activeTab === "automatizaciones" && "Respuestas automáticas fuera de hora y asignación de prospectos."}
                  </p>
                </div>
                <div className={styles.headerActions}>
                  <span>En vivo</span>
                </div>
              </div>

              {/* Cuerpo interactivo del contenido */}
              <div className={styles.contentBody}>
                {/* VISTA: DASHBOARD GENERAL */}
                {activeTab === "dashboard" && (
                  <>
                    <div className={styles.metricsGrid}>
                      <div className={styles.metricItem}>
                        <span className={styles.metricLabel}>Consultas / Mes</span>
                        <span className={styles.metricVal}>142</span>
                        <span className={styles.metricSub}>+18.4% este mes</span>
                      </div>
                      <div className={styles.metricItem}>
                        <span className={styles.metricLabel}>Vehículos Disponibles</span>
                        <span className={styles.metricVal}>32</span>
                        <span className={styles.metricSub}>100% Sincronizado</span>
                      </div>
                      <div className={styles.metricItem}>
                        <span className={styles.metricLabel}>Respuesta WhatsApp</span>
                        <span className={styles.metricVal}>4.2 m</span>
                        <span className={styles.metricSub}>⚡ Ultrarrápido</span>
                      </div>
                      <div className={styles.metricItem}>
                        <span className={styles.metricLabel}>Visitas Web</span>
                        <span className={styles.metricVal}>4.8k</span>
                        <span className={styles.metricSub}>+32% este mes</span>
                      </div>
                    </div>

                    <div className={styles.dashboardGrid}>
                      {/* Widget 1: Prospectos en el tiempo */}
                      <div className={styles.widgetCard}>
                        <div className={styles.widgetHeader}>
                          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Prospectos en el Tiempo</span>
                          <span style={{ fontSize: "0.58rem", color: "#3b82f6", background: "rgba(59,130,246,0.12)", padding: "0.08rem 0.35rem", borderRadius: "4px", whiteSpace: "nowrap", flexShrink: 0 }}>7 Días</span>
                        </div>
                        <svg className={styles.chartSvg} viewBox="0 0 400 80">
                          <defs>
                            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>
                          <path d="M 20 60 Q 80 45 140 50 T 260 20 T 380 12 L 380 75 L 20 75 Z" fill="url(#chartGrad)" />
                          <path d="M 20 60 Q 80 45 140 50 T 260 20 T 380 12" fill="none" stroke="#3b82f6" strokeWidth="2.5" />
                          <circle cx="140" cy="50" r="3.5" fill="#3b82f6" stroke="#ffffff" strokeWidth="1.5" />
                          <circle cx="260" cy="20" r="3.5" fill="#3b82f6" stroke="#ffffff" strokeWidth="1.5" />
                          <circle cx="380" cy="12" r="4.5" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
                        </svg>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.58rem", color: "#6b7280" }}>
                          <span>Jue 6</span><span>Vie 7</span><span>Sáb 8</span><span>Dom 9</span><span>Lun 10</span><span>Mar 11</span><span>Mié 12</span>
                        </div>
                      </div>

                      {/* Widget 2: Feed de Comunicación */}
                      <div className={styles.widgetCard}>
                        <div className={styles.widgetHeader}>
                          <span>Communication Feed</span>
                          <span className={styles.widgetLink} onClick={() => setActiveTab("leads")}>Ver Inbox →</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                          {leads.slice(0, 2).map((lead) => (
                            <div key={lead.id} style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.68rem" }}>
                              <span className={`${styles.channelIcon} ${lead.channelClass}`} style={{ width: "20px", height: "20px", fontSize: "0.6rem" }}>
                                {lead.channel === "WhatsApp" ? "WA" : "ML"}
                              </span>
                              <div style={{ flex: 1, overflow: "hidden" }}>
                                <div style={{ color: "#ffffff", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{lead.name}</div>
                                <div style={{ color: "#9ca3af", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>"{lead.msg}"</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* VISTA: INVENTARIO */}
                {activeTab === "inventario" && (
                  <>
                    <div className={styles.subFilters}>
                      <button 
                        className={`${styles.filterChip} ${inventoryFilter === "todos" ? styles.filterChipActive : ""}`}
                        onClick={() => setInventoryFilter("todos")}
                      >
                        Todos (38)
                      </button>
                      <button 
                        className={`${styles.filterChip} ${inventoryFilter === "disponibles" ? styles.filterChipActive : ""}`}
                        onClick={() => setInventoryFilter("disponibles")}
                      >
                        Disponibles (32)
                      </button>
                      <button 
                        className={`${styles.filterChip} ${inventoryFilter === "reservados" ? styles.filterChipActive : ""}`}
                        onClick={() => setInventoryFilter("reservados")}
                      >
                        Reservados (6)
                      </button>
                    </div>

                    <div className={styles.vehiclesGrid}>
                      {filteredCars.map((car) => (
                        <div key={car.id} className={styles.carCard}>
                          <img src={car.image} alt={car.title} className={styles.carThumb} />
                          <div className={styles.carInfo}>
                            <span className={styles.carTitle}>{car.title}</span>
                            <span className={styles.carPrice}>{car.price}</span>
                            <span className={`${styles.statusPill} ${car.statusClass}`}>{car.statusLabel}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* VISTA: CONSULTAS LEADS */}
                {activeTab === "leads" && (
                  <div className={styles.leadsContainer}>
                    {leads.map((lead) => {
                      const isReplied = repliedLeads[lead.id];
                      return (
                        <div key={lead.id} className={styles.leadCard}>
                          <div className={styles.leadMain}>
                            <div className={`${styles.channelIcon} ${lead.channelClass}`}>
                              {lead.channel === "WhatsApp" ? "WA" : lead.channel === "MercadoLibre" ? "ML" : "IG"}
                            </div>
                            <div className={styles.leadText}>
                              <span className={styles.leadName}>{lead.name} • <span style={{ fontWeight: 400, color: "#9ca3af" }}>{lead.car}</span></span>
                              <span className={styles.leadMessage}>"{lead.msg}"</span>
                            </div>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.2rem" }}>
                            <span className={styles.leadTime}>{lead.time}</span>
                            <button 
                              className={styles.replyBtn}
                              onClick={() => handleReplyClick(lead.id)}
                            >
                              {isReplied ? "✓ Respondido" : "Responder"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* VISTA: SYNC */}
                {activeTab === "sync" && (
                  <div className={styles.syncContainer}>
                    <div className={styles.syncRow}>
                      <div className={styles.syncLeft}>
                        <div className={styles.syncIcon} style={{ color: "#facc15" }}>ML</div>
                        <div>
                          <div className={styles.syncTitle}>MercadoLibre Automotores</div>
                          <div className={styles.syncDesc}>Sincronización bidireccional activa de stock y precios</div>
                        </div>
                      </div>
                      <div className={styles.syncStatus}>
                        <CheckCircle2 size={12} /> Conectado
                      </div>
                    </div>

                    <div className={styles.syncRow}>
                      <div className={styles.syncLeft}>
                        <div className={styles.syncIcon} style={{ color: "#2563eb" }}>FB</div>
                        <div>
                          <div className={styles.syncTitle}>Facebook & Instagram Shop</div>
                          <div className={styles.syncDesc}>Publicación en catálogo Meta para anuncios automotores</div>
                        </div>
                      </div>
                      <div className={styles.syncStatus}>
                        <CheckCircle2 size={12} /> Conectado
                      </div>
                    </div>

                    <div className={styles.syncRow}>
                      <div className={styles.syncLeft}>
                        <div className={styles.syncIcon} style={{ color: "#38bdf8" }}>WEB</div>
                        <div>
                          <div className={styles.syncTitle}>Portal Oficial de Tu Automotora</div>
                          <div className={styles.syncDesc}>Catálogo web optimizado con dominio propio y WhatsApp</div>
                        </div>
                      </div>
                      <div className={styles.syncStatus}>
                        <CheckCircle2 size={12} /> En Línea
                      </div>
                    </div>

                    <button 
                      className={styles.triggerSyncBtn}
                      onClick={handleSyncClick}
                      disabled={isSyncing}
                    >
                      <RefreshCw size={14} className={isSyncing ? styles.spinningIcon : ""} />
                      {isSyncing ? "Sincronizando inventario..." : syncDone ? "¡Todo Sincronizado Exitosamente!" : "Sincronizar Todo en 1-Clic"}
                    </button>
                  </div>
                )}

                {/* VISTA: PÁGINA WEB */}
                {activeTab === "web" && (
                  <div className={styles.webPreviewBox}>
                    <div className={styles.webStatusRow}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <Globe size={16} style={{ color: "#3b82f6" }} />
                        <div>
                          <div style={{ fontWeight: 600, color: "#ffffff", fontSize: "0.78rem" }}>tu-automotora.com</div>
                          <div style={{ fontSize: "0.65rem", color: "#34d399" }}>● Dominio Oficial • SSL Seguro Activo</div>
                        </div>
                      </div>
                      <button style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)", color: "#60a5fa", padding: "0.2rem 0.5rem", borderRadius: "4px", fontSize: "0.65rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        Ver Mi Sitio <ExternalLink size={10} />
                      </button>
                    </div>

                    <div>
                      <div style={{ fontSize: "0.72rem", color: "#9ca3af", fontWeight: 600, marginBottom: "0.3rem" }}>Personalizar Tema de Tu Portal:</div>
                      <div className={styles.themeSelector}>
                        <button 
                          className={`${styles.themeBtn} ${activeTheme === "oscuro" ? styles.themeBtnActive : ""}`}
                          onClick={() => setActiveTheme("oscuro")}
                        >
                          Oscuro Premium
                        </button>
                        <button 
                          className={`${styles.themeBtn} ${activeTheme === "blanco" ? styles.themeBtnActive : ""}`}
                          onClick={() => setActiveTheme("blanco")}
                        >
                          Blanco Minimalista
                        </button>
                        <button 
                          className={`${styles.themeBtn} ${activeTheme === "deportivo" ? styles.themeBtnActive : ""}`}
                          onClick={() => setActiveTheme("deportivo")}
                        >
                          Deportivo
                        </button>
                      </div>
                    </div>

                    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "6px", padding: "0.6rem", fontSize: "0.7rem", color: "#d1d5db" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.2rem" }}>
                        <span>Estadística de Visitas Web</span>
                        <span style={{ color: "#10b981", fontWeight: 700 }}>4.812 visitas / mes</span>
                      </div>
                      <div style={{ fontSize: "0.65rem", color: "#9ca3af" }}>
                        Portal optimizado con botón directo de WhatsApp y cálculo de financiación instantáneo.
                      </div>
                    </div>
                  </div>
                )}

                {/* VISTA: CONTACTOS */}
                {activeTab === "contactos" && (
                  <div className={styles.leadsContainer}>
                    <div className={styles.subFilters}>
                      <button 
                        className={`${styles.filterChip} ${contactFilter === "todos" ? styles.filterChipActive : ""}`}
                        onClick={() => setContactFilter("todos")}
                      >
                        Todos ({contacts.length})
                      </button>
                      <button 
                        className={`${styles.filterChip} ${contactFilter === "calientes" ? styles.filterChipActive : ""}`}
                        onClick={() => setContactFilter("calientes")}
                      >
                        Calientes (2)
                      </button>
                      <button 
                        className={`${styles.filterChip} ${contactFilter === "vip" ? styles.filterChipActive : ""}`}
                        onClick={() => setContactFilter("vip")}
                      >
                        VIP (1)
                      </button>
                    </div>

                    <div className={styles.contactsTable}>
                      {filteredContacts.map((contact) => (
                        <div key={contact.id} className={styles.contactRow}>
                          <div>
                            <div style={{ fontWeight: 600, color: "#ffffff", fontSize: "0.78rem" }}>{contact.name}</div>
                            <div style={{ fontSize: "0.65rem", color: "#9ca3af" }}>{contact.phone} • Interés: {contact.interest}</div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                            <span 
                              className={styles.contactBadge} 
                              style={{ backgroundColor: contact.tagColor, color: contact.tagText }}
                            >
                              {contact.tag}
                            </span>
                            <span style={{ fontSize: "0.62rem", color: "#6b7280" }}>{contact.channel}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* VISTA: AUTOMATIZACIONES */}
                {activeTab === "automatizaciones" && (
                  <div className={styles.automationsList}>
                    <div className={styles.automationCard} onClick={() => toggleAutomation("wppAutoReply")}>
                      <div>
                        <div style={{ fontWeight: 600, color: "#ffffff", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                          💬 Respuesta WhatsApp fuera de horario
                        </div>
                        <div style={{ fontSize: "0.65rem", color: "#9ca3af" }}>
                          Responde automáticamente con catálogo y link para agendar visita (20:00 a 08:00).
                        </div>
                      </div>
                      <div className={`${styles.toggleSwitch} ${automationsState.wppAutoReply ? styles.toggleSwitchActive : ""}`}>
                        <div className={styles.toggleCircle}></div>
                      </div>
                    </div>

                    <div className={styles.automationCard} onClick={() => toggleAutomation("roundRobinLeads")}>
                      <div>
                        <div style={{ fontWeight: 600, color: "#ffffff", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                          ⚡ Asignación rotativa de prospectos
                        </div>
                        <div style={{ fontSize: "0.65rem", color: "#9ca3af" }}>
                          Asigna nuevos contactos de MercadoLibre/Web al vendedor libre de turno.
                        </div>
                      </div>
                      <div className={`${styles.toggleSwitch} ${automationsState.roundRobinLeads ? styles.toggleSwitchActive : ""}`}>
                        <div className={styles.toggleCircle}></div>
                      </div>
                    </div>

                    <div className={styles.automationCard} onClick={() => toggleAutomation("reInterestAlert")}>
                      <div>
                        <div style={{ fontWeight: 600, color: "#ffffff", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                          🔔 Alerta por re-interés de cliente
                        </div>
                        <div style={{ fontSize: "0.65rem", color: "#9ca3af" }}>
                          Notifica al vendedor si un prospecto revisa la ficha del vehículo 3+ veces.
                        </div>
                      </div>
                      <div className={`${styles.toggleSwitch} ${automationsState.reInterestAlert ? styles.toggleSwitchActive : ""}`}>
                        <div className={styles.toggleCircle}></div>
                      </div>
                    </div>

                    <div className={styles.automationCard} onClick={() => toggleAutomation("autoMeliPublish")}>
                      <div>
                        <div style={{ fontWeight: 600, color: "#ffffff", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                          🚀 Sincronización instantánea con MercadoLibre
                        </div>
                        <div style={{ fontSize: "0.65rem", color: "#9ca3af" }}>
                          Publica e iguala precios automáticamente en la cuenta vinculada de MercadoLibre.
                        </div>
                      </div>
                      <div className={`${styles.toggleSwitch} ${automationsState.autoMeliPublish ? styles.toggleSwitchActive : ""}`}>
                        <div className={styles.toggleCircle}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </main>
          </div>

          {/* Pie del Dashboard con hint */}
          <div className={styles.dashFooterHint}>
            <span>Demostración del CRM Tu Automotora / n-autos.com</span>
            <span className={styles.clickHint}>
              <MousePointerClick size={12} /> Hacé clic en la barra lateral para navegar
            </span>
          </div>
        </div>
      </div>

      {/* Soporte / Stand del Monitor */}
      <div className={styles.monitorStand}>
        <div className={styles.monitorNeck}></div>
        <div className={styles.monitorBase}></div>
      </div>
    </div>
  );
}
