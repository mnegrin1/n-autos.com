"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./page.module.css";
import FreeTrialForm from "@/components/FreeTrialForm";
import AnimatedSection from "@/components/AnimatedSection";
import { MessageCircle, Shield, TrendingUp, Check, Zap, Sparkles } from "lucide-react";
import { getPlans, PaymentPlan } from "@/lib/plansStore";

export default function Home() {
  const [plans, setPlans] = useState<PaymentPlan[]>([]);
  const [isYearly, setIsYearly] = useState(false);

  useEffect(() => {
    const loaded = getPlans().filter(p => p.active);
    setPlans(loaded);
  }, []);

  return (
    <div className={styles.landingContainer}>
      <nav className={styles.nav}>
        <div className={styles.logo}>n-autos</div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <a href="#planes" style={{ color: "var(--text-color)", textDecoration: "none", fontSize: "0.95rem", fontWeight: 600 }}>
            Planes y Precios
          </a>
          <Link href="/admin" className="btn-primary">
            Acceso Demo
          </Link>
        </div>
      </nav>

      <main>
        <AnimatedSection as="section" className={styles.heroSection} direction="down">
          <h1 className={styles.title}>
            Tomá el control de tus ventas y asegurá cada cliente
          </h1>
          <p className={styles.subtitle}>
            Plataforma tecnológica premium para automotoras. Automatizá tu seguimiento, respondé al instante y organizá a tu equipo de ventas sin depender de sistemas rígidos.
          </p>
          <div className={styles.ctaButtons}>
            <a href="#prueba" className="btn-primary" style={{ padding: "1rem 2rem", fontSize: "1.1rem" }}>
              Comenzar Prueba Gratis
            </a>
            <Link href="/admin" className="btn-secondary" style={{ padding: "1rem 2rem", fontSize: "1.1rem" }}>
              Ver Demo
            </Link>
          </div>
          
          <AnimatedSection direction="up" delay={0.4} className={styles.heroImageWrapper}>
            <Image 
              src="/images/dashboard_mockup.jpg" 
              alt="Dashboard n-autos" 
              width={1200} 
              height={675}
              className={styles.heroImage}
              priority
            />
          </AnimatedSection>
        </AnimatedSection>

        <AnimatedSection as="section" className={styles.featuresSection} delay={0.2}>
          <h2 className={styles.sectionTitle}>Módulos y Beneficios</h2>
          <div className={styles.featuresGrid}>
            <AnimatedSection delay={0.3} direction="up" className={styles.featureCard}>
              <MessageCircle className={styles.featureIcon} />
              <h3 className={styles.featureTitle}>Respuesta Inmediata</h3>
              <p>Quien responde primero se lleva la venta. Integración con WhatsApp para seguimiento automático en segundos.</p>
            </AnimatedSection>
            <AnimatedSection delay={0.4} direction="up" className={styles.featureCard}>
              <TrendingUp className={styles.featureIcon} />
              <h3 className={styles.featureTitle}>Aumentá tu Facturación</h3>
              <p>Evitá que los interesados se enfríen en un Excel. Organiza tu embudo de ventas y cierra más negocios.</p>
            </AnimatedSection>
            <AnimatedSection delay={0.5} direction="up" className={styles.featureCard}>
              <Shield className={styles.featureIcon} />
              <h3 className={styles.featureTitle}>Tu Propio Sistema</h3>
              <p>Sos el dueño de tus datos. Panel de control personalizado, tu imagen corporativa y soporte continuo.</p>
            </AnimatedSection>
          </div>
        </AnimatedSection>

        {/* Sección de Planes de Pago */}
        <AnimatedSection as="section" id="planes" className={styles.featuresSection} delay={0.3} style={{ backgroundColor: "var(--bg-color)" }}>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <h2 className={styles.sectionTitle} style={{ marginBottom: "0.5rem" }}>
              Planes a la medida de tu automotora
            </h2>
            <p style={{ fontSize: "1.1rem", opacity: 0.8, maxWidth: "600px", margin: "0 auto 1.5rem" }}>
              Elige la opción que mejor se adapte al tamaño de tu negocio. Transparente, sin contratos forzosos.
            </p>

            {/* Switch Mensual / Anual */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.75rem", backgroundColor: "var(--surface-color)", padding: "0.35rem 0.5rem", borderRadius: "30px", border: "1px solid var(--border-color)" }}>
              <button
                type="button"
                onClick={() => setIsYearly(false)}
                style={{
                  padding: "0.5rem 1.25rem",
                  borderRadius: "20px",
                  border: "none",
                  backgroundColor: !isYearly ? "var(--primary)" : "transparent",
                  color: !isYearly ? "#fff" : "var(--text-color)",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                Mensual
              </button>
              <button
                type="button"
                onClick={() => setIsYearly(true)}
                style={{
                  padding: "0.5rem 1.25rem",
                  borderRadius: "20px",
                  border: "none",
                  backgroundColor: isYearly ? "var(--primary)" : "transparent",
                  color: isYearly ? "#fff" : "var(--text-color)",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem"
                }}
              >
                Anual <span style={{ backgroundColor: "rgba(16, 185, 129, 0.2)", color: "#10b981", fontSize: "0.7rem", padding: "2px 6px", borderRadius: "10px" }}>Ahorra 20%</span>
              </button>
            </div>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "2rem",
            maxWidth: "1200px",
            width: "100%",
            margin: "0 auto"
          }}>
            {plans.map((plan) => {
              const price = isYearly ? plan.priceYearly : plan.priceMonthly;
              return (
                <div
                  key={plan.id}
                  style={{
                    backgroundColor: "var(--surface-color)",
                    borderRadius: "20px",
                    border: plan.isPopular ? "2px solid var(--primary)" : "1px solid var(--border-color)",
                    padding: "2.25rem 1.75rem",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                    boxShadow: plan.isPopular ? "0 20px 40px -10px rgba(37, 99, 235, 0.25)" : "0 10px 25px rgba(0,0,0,0.05)",
                    transition: "transform 0.3s ease"
                  }}
                >
                  {plan.badge && (
                    <span style={{
                      position: "absolute",
                      top: "1.25rem",
                      right: "1.25rem",
                      backgroundColor: plan.isPopular ? "var(--primary)" : "rgba(128,128,128,0.15)",
                      color: plan.isPopular ? "#fff" : "var(--text-color)",
                      padding: "0.3rem 0.85rem",
                      borderRadius: "20px",
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      letterSpacing: "0.03em"
                    }}>
                      {plan.badge}
                    </span>
                  )}

                  <h3 style={{ fontSize: "1.6rem", fontWeight: 800, margin: "0 0 0.5rem 0" }}>{plan.name}</h3>
                  <p style={{ fontSize: "0.9rem", opacity: 0.75, minHeight: "2.6rem", margin: "0 0 1.5rem 0" }}>
                    {plan.description}
                  </p>

                  <div style={{ marginBottom: "2rem", display: "flex", alignItems: "baseline", gap: "0.3rem" }}>
                    <span style={{ fontSize: "2.75rem", fontWeight: 900 }}>${price}</span>
                    <span style={{ fontSize: "0.95rem", opacity: 0.7 }}>USD / mes</span>
                  </div>

                  <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1.5rem", marginBottom: "2rem", flex: 1 }}>
                    <p style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", opacity: 0.6, marginBottom: "1rem" }}>
                      Incluido en este plan:
                    </p>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      {plan.features.map((feat, idx) => (
                        <li key={idx} style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.9rem" }}>
                          <div style={{
                            width: "20px",
                            height: "20px",
                            borderRadius: "50%",
                            backgroundColor: "rgba(16, 185, 129, 0.15)",
                            color: "#10b981",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0
                          }}>
                            <Check size={13} strokeWidth={3} />
                          </div>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <a
                    href="#prueba"
                    style={{
                      display: "block",
                      textAlign: "center",
                      padding: "0.85rem 1.5rem",
                      borderRadius: "10px",
                      backgroundColor: plan.isPopular ? "var(--primary)" : "transparent",
                      color: plan.isPopular ? "#fff" : "var(--text-color)",
                      border: plan.isPopular ? "none" : "1px solid var(--border-color)",
                      fontWeight: 700,
                      fontSize: "0.95rem",
                      textDecoration: "none",
                      transition: "all 0.2s ease"
                    }}
                  >
                    {plan.priceMonthly === 0 ? "Comenzar Gratis" : plan.isPopular ? "Elegir Plan Pro" : "Contactar Ventas"}
                  </a>
                </div>
              );
            })}
          </div>
        </AnimatedSection>

        <AnimatedSection as="section" id="prueba" className={styles.trialSection} delay={0.3} direction="up">
          <div className={styles.trialContainer}>
            <FreeTrialForm />
          </div>
        </AnimatedSection>
      </main>

      <footer className={styles.footer}>
        <p>© {new Date().getFullYear()} n-autos.com. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
