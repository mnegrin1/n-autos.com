"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./page.module.css";
import FreeTrialForm from "@/components/FreeTrialForm";
import BookingCalendlyWidget from "@/components/BookingCalendlyWidget";
import AnimatedSection from "@/components/AnimatedSection";
import { MessageCircle, Shield, TrendingUp, Sparkles, CheckCircle2, Building2, Wrench, Headset, Rocket, Menu, X, ShieldCheck, Video, CalendarClock } from "lucide-react";

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className={styles.landingContainer}>
      <nav className={styles.nav}>
        <div className={styles.logo}>n-autos</div>

        {/* Desktop Navigation */}
        <div className={styles.desktopNav}>
          <a href="#agendar" style={{ color: "var(--primary)", textDecoration: "none", fontSize: "0.95rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <Video size={16} /> Agendar Meet
          </a>
          <a href="#servicio" style={{ color: "var(--text-color)", textDecoration: "none", fontSize: "0.95rem", fontWeight: 600 }}>
            Servicios
          </a>
          <a href="#contacto" style={{ color: "var(--text-color)", textDecoration: "none", fontSize: "0.95rem", fontWeight: 600 }}>
            Contacto
          </a>
          <Link href="/admin" className="btn-primary">
            Acceso Demo
          </Link>
        </div>

        {/* Mobile Menu Toggle Button */}
        <button 
          className={styles.mobileMenuToggle}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Abrir menú"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className={styles.mobileMenuOverlay}>
          <a 
            href="#agendar" 
            onClick={() => setMobileMenuOpen(false)}
            style={{ color: "var(--primary)", textDecoration: "none", fontSize: "1.1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            <Video size={18} /> Agendar Reunión Meet
          </a>
          <a 
            href="#servicio" 
            onClick={() => setMobileMenuOpen(false)}
            style={{ color: "var(--text-color)", textDecoration: "none", fontSize: "1.1rem", fontWeight: 700 }}
          >
            Servicios
          </a>
          <a 
            href="#contacto" 
            onClick={() => setMobileMenuOpen(false)}
            style={{ color: "var(--text-color)", textDecoration: "none", fontSize: "1.1rem", fontWeight: 700 }}
          >
            Contacto
          </a>
          <Link 
            href="/admin" 
            className="btn-primary"
            onClick={() => setMobileMenuOpen(false)}
            style={{ width: "100%", textAlign: "center", padding: "0.85rem" }}
          >
            Acceso Demo
          </Link>
        </div>
      )}

      <main>
        <AnimatedSection as="section" className={styles.heroSection} direction="down">
          <h1 className={styles.title}>
            Montamos y gestionamos la tecnología de tu automotora
          </h1>
          <p className={styles.subtitle}>
            Servicio tipo agencia 360°. Desarrollamos tu portal web, configuramos tu CRM de ventas, automatizamos WhatsApp e integramos MercadoLibre para que tu equipo se enfoque en cerrar operaciones.
          </p>
          <div className={styles.ctaButtons}>
            <a href="#agendar" className="btn-primary" style={{ padding: "1rem 2rem", fontSize: "1.1rem", display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
              <Video size={20} /> Agendar Videollamada
            </a>
            <a href="#contacto" className="btn-secondary" style={{ padding: "1rem 2rem", fontSize: "1.1rem" }}>
              Solicitar Asesoría
            </a>
          </div>
          
          <AnimatedSection direction="up" delay={0.4} className={styles.heroImageWrapper}>
            <Image 
              src="/dashboard-preview.png" 
              alt="Dashboard N-Autos" 
              width={1000} 
              height={500} 
              style={{ width: "100%", height: "auto", borderRadius: "12px", boxShadow: "0 20px 40px rgba(0,0,0,0.15)" }}
              priority
            />
          </AnimatedSection>
        </AnimatedSection>

        {/* Pilares del Servicio Tipo Agencia */}
        <AnimatedSection as="section" id="servicio" className={styles.featuresSection} delay={0.2}>
          <h2 className={styles.sectionTitle}>Servicio Llave en Mano para tu Automotora</h2>
          <div className={styles.featuresGrid}>
            <AnimatedSection className={styles.featureCard} delay={0.1}>
              <Building2 className={styles.featureIcon} />
              <h3 className={styles.featureTitle}>Portal Web a Medida</h3>
              <p>Diseño corporativo exclusivo, catálogo de vehículos en tiempo real con ficha detallada, fotos HD, videos y calculadora de financiación.</p>
            </AnimatedSection>

            <AnimatedSection className={styles.featureCard} delay={0.2}>
              <MessageCircle className={styles.featureIcon} />
              <h3 className={styles.featureTitle}>CRM & Inbox Multicanal</h3>
              <p>Centralizá todas tus consultas de WhatsApp, Meta y formulario web en un solo pipeline comercial asignado a tus vendedores.</p>
            </AnimatedSection>

            <AnimatedSection className={styles.featureCard} delay={0.3}>
              <Wrench className={styles.featureIcon} />
              <h3 className={styles.featureTitle}>Integración y Automatizaciones</h3>
              <p>Sincronización automática de publicaciones en MercadoLibre y redes sociales, junto con respuestas automáticas por Inteligencia Artificial.</p>
            </AnimatedSection>

            <AnimatedSection className={styles.featureCard} delay={0.4}>
              <Headset className={styles.featureIcon} />
              <h3 className={styles.featureTitle}>Soporte e Implementación</h3>
              <p>Nos encargamos del montaje técnico, migración de inventario, mantenimiento y soporte directo para que no tengas que preocuparte por nada.</p>
            </AnimatedSection>
          </div>
        </AnimatedSection>

        {/* Sección de Propuesta de Valor Agencia */}
        <AnimatedSection as="section" className={styles.featuresSection} delay={0.3} style={{ backgroundColor: "var(--bg-color)" }}>
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", backgroundColor: "rgba(37, 99, 235, 0.1)", color: "#2563eb", padding: "0.35rem 0.85rem", borderRadius: "20px", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.75rem" }}>
              <Rocket size={16} /> TECNOLOGÍA PERSONALIZADA SIN COMPLICACIONES
            </div>
            <h2 className={styles.sectionTitle} style={{ marginBottom: "0.5rem" }}>
              Tu socio tecnológico en el sector automotor
            </h2>
            <p style={{ fontSize: "1.1rem", opacity: 0.8, maxWidth: "650px", margin: "0 auto 1.5rem" }}>
              Analizamos las necesidades de tu empresa y desplegamos la infraestructura digital perfecta para potenciar las ventas de tu inventario.
            </p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "1.5rem",
            maxWidth: "1100px",
            margin: "0 auto"
          }}>
            <div style={{ backgroundColor: "var(--surface-color)", padding: "1.75rem", borderRadius: "16px", border: "1px solid var(--border-color)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                <CheckCircle2 size={24} style={{ color: "#10b981" }} />
                <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700 }}>Despliegue Rápido</h3>
              </div>
              <p style={{ margin: 0, fontSize: "0.9rem", opacity: 0.8, lineHeight: "1.5" }}>
                Tené tu sitio web y CRM funcionando en días, con dominio propio y estética alineada a tu marca.
              </p>
            </div>

            <div style={{ backgroundColor: "var(--surface-color)", padding: "1.75rem", borderRadius: "16px", border: "1px solid var(--border-color)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                <CheckCircle2 size={24} style={{ color: "#10b981" }} />
                <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700 }}>Sin Límites de Uso</h3>
              </div>
              <p style={{ margin: 0, fontSize: "0.9rem", opacity: 0.8, lineHeight: "1.5" }}>
                Cargá todos los vehículos que necesites y añadí a todo tu equipo comercial sin restricciones de inventario.
              </p>
            </div>

            <div style={{ backgroundColor: "var(--surface-color)", padding: "1.75rem", borderRadius: "16px", border: "1px solid var(--border-color)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                <CheckCircle2 size={24} style={{ color: "#10b981" }} />
                <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700 }}>Acompañamiento Continuo</h3>
              </div>
              <p style={{ margin: 0, fontSize: "0.9rem", opacity: 0.8, lineHeight: "1.5" }}>
                Cuentas con soporte técnico directo, optimización constante e incorporación de nuevas herramientas a medida.
              </p>
            </div>
          </div>
        </AnimatedSection>

        {/* Sección de Agendamiento por Google Meet estilo Calendly */}
        <AnimatedSection as="section" id="agendar" className={styles.featuresSection} delay={0.2} style={{ backgroundColor: "var(--bg-color)" }}>
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#10b981", padding: "0.35rem 0.85rem", borderRadius: "20px", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.75rem" }}>
              <Video size={16} /> REUNIÓN 1 A 1 CON EL EQUIPO FUNDADOR
            </div>
            <h2 className={styles.sectionTitle} style={{ marginBottom: "0.5rem" }}>
              Agendá tu Videollamada o Consulta por Google Meet
            </h2>
            <p style={{ fontSize: "1.1rem", opacity: 0.8, maxWidth: "680px", margin: "0 auto" }}>
              Elegí el día y horario que mejor te convenga. Nuestro calendario está sincronizado en tiempo real para que reserves una sesión de asesoría estratégica sin esperas.
            </p>
          </div>

          <BookingCalendlyWidget />
        </AnimatedSection>

        {/* Sección de Contacto */}
        <AnimatedSection as="section" id="contacto" className={styles.trialSection} delay={0.3} direction="up">
          <div className={styles.trialContainer}>
            <FreeTrialForm />
          </div>
        </AnimatedSection>
      </main>

      <footer className={styles.footer}>
        <p>© {new Date().getFullYear()} n-autos. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
