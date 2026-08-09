"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./page.module.css";
import FreeTrialForm from "@/components/FreeTrialForm";
import AnimatedSection from "@/components/AnimatedSection";
import CheckoutModal from "@/components/CheckoutModal";
import { MessageCircle, Shield, TrendingUp, Check, Zap, Sparkles, ChevronDown, ChevronUp, Layers, CheckCircle2, Minus } from "lucide-react";
import { getPlans, PaymentPlan } from "@/lib/plansStore";

export default function Home() {
  const [plans, setPlans] = useState<PaymentPlan[]>([]);
  const [isYearly, setIsYearly] = useState(false);
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<PaymentPlan | null>(null);
  const [showMatrix, setShowMatrix] = useState(true);

  useEffect(() => {
    const loaded = getPlans().filter(p => p.active);
    setPlans(loaded);
  }, []);

  const handleSelectPlan = (plan: PaymentPlan) => {
    setSelectedPlanForCheckout(plan);
  };

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
            <a href="#planes" className="btn-primary" style={{ padding: "1rem 2rem", fontSize: "1.1rem" }}>
              Ver Planes y Probar Starter
            </a>
            <Link href="/admin" className="btn-secondary" style={{ padding: "1rem 2rem", fontSize: "1.1rem" }}>
              Ver Demo Admin
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
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", backgroundColor: "rgba(37, 99, 235, 0.1)", color: "#2563eb", padding: "0.35rem 0.85rem", borderRadius: "20px", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.75rem" }}>
              <Sparkles size={16} /> 4 NIVELES DE POTENCIA PARA TU NEGOCIO
            </div>
            <h2 className={styles.sectionTitle} style={{ marginBottom: "0.5rem" }}>
              Planes a la medida de tu automotora
            </h2>
            <p style={{ fontSize: "1.1rem", opacity: 0.8, maxWidth: "650px", margin: "0 auto 1.5rem" }}>
              Elige entre <strong>Gratis, Starter, Premium o Ultra</strong>. Escala funciones según tu volumen de vehículos y agentes de ventas.
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

          {/* Cards Grid de los 4 Planes */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "1.5rem",
            maxWidth: "1280px",
            width: "100%",
            margin: "0 auto 3rem auto"
          }}>
            {plans.map((plan) => {
              const price = isYearly ? plan.priceYearly : plan.priceMonthly;
              const isStarter = plan.id === "plan-starter";
              return (
                <div
                  key={plan.id}
                  style={{
                    backgroundColor: "var(--surface-color)",
                    borderRadius: "20px",
                    border: isStarter 
                      ? "2px solid #2563eb" 
                      : plan.isPopular 
                        ? "2px solid #a855f7" 
                        : "1px solid var(--border-color)",
                    padding: "2rem 1.5rem",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                    boxShadow: isStarter 
                      ? "0 20px 35px -10px rgba(37, 99, 235, 0.3)" 
                      : plan.isPopular 
                        ? "0 20px 35px -10px rgba(168, 85, 247, 0.25)" 
                        : "0 10px 25px rgba(0,0,0,0.04)",
                    transition: "transform 0.3s ease"
                  }}
                >
                  {plan.badge && (
                    <span style={{
                      position: "absolute",
                      top: "1.25rem",
                      right: "1.25rem",
                      backgroundColor: isStarter 
                        ? "#2563eb" 
                        : plan.isPopular 
                          ? "#a855f7" 
                          : "rgba(128,128,128,0.15)",
                      color: isStarter || plan.isPopular ? "#fff" : "var(--text-color)",
                      padding: "0.3rem 0.85rem",
                      borderRadius: "20px",
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      letterSpacing: "0.03em"
                    }}>
                      {plan.badge}
                    </span>
                  )}

                  <h3 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0 0 0.4rem 0" }}>{plan.name}</h3>
                  <p style={{ fontSize: "0.85rem", opacity: 0.75, minHeight: "2.8rem", margin: "0 0 1.25rem 0", lineHeight: "1.4" }}>
                    {plan.description}
                  </p>

                  <div style={{ marginBottom: "1.5rem", display: "flex", alignItems: "baseline", gap: "0.3rem" }}>
                    <span style={{ fontSize: "2.5rem", fontWeight: 900 }}>${price}</span>
                    <span style={{ fontSize: "0.85rem", opacity: 0.7 }}>USD / mes</span>
                  </div>

                  <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1.25rem", marginBottom: "1.75rem", flex: 1 }}>
                    <p style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", opacity: 0.6, marginBottom: "0.85rem" }}>
                      Características clave:
                    </p>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                      {plan.features.map((feat, idx) => (
                        <li key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", fontSize: "0.85rem", lineHeight: "1.3" }}>
                          <div style={{
                            width: "18px",
                            height: "18px",
                            borderRadius: "50%",
                            backgroundColor: isStarter ? "rgba(37, 99, 235, 0.15)" : "rgba(16, 185, 129, 0.15)",
                            color: isStarter ? "#2563eb" : "#10b981",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            marginTop: "2px"
                          }}>
                            <Check size={12} strokeWidth={3} />
                          </div>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSelectPlan(plan)}
                    style={{
                      width: "100%",
                      padding: "0.85rem 1.25rem",
                      borderRadius: "10px",
                      backgroundColor: isStarter 
                        ? "#2563eb" 
                        : plan.isPopular 
                          ? "#a855f7" 
                          : "transparent",
                      color: isStarter || plan.isPopular ? "#fff" : "var(--text-color)",
                      border: isStarter || plan.isPopular ? "none" : "1px solid var(--border-color)",
                      fontWeight: 700,
                      fontSize: "0.95rem",
                      cursor: "pointer",
                      transition: "all 0.2s ease"
                    }}
                  >
                    {plan.priceMonthly === 0 
                      ? "Comenzar Gratis" 
                      : isStarter 
                        ? "Probar Plan Starter (Simular)" 
                        : plan.isPopular 
                          ? "Elegir Plan Premium" 
                          : "Contratar Ultra"}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Botón & Matriz Comparativa Detallada */}
          <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
            <button
              onClick={() => setShowMatrix(!showMatrix)}
              style={{
                width: "100%",
                padding: "1rem 1.5rem",
                backgroundColor: "var(--surface-color)",
                border: "1px solid var(--border-color)",
                borderRadius: "14px",
                fontWeight: 700,
                fontSize: "1rem",
                color: "var(--text-color)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1.5rem",
                boxShadow: "0 4px 6px rgba(0,0,0,0.02)"
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <Layers size={20} style={{ color: "#2563eb" }} />
                Matriz Comparativa de Características (Gratis vs Starter vs Premium vs Ultra)
              </span>
              {showMatrix ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>

            {showMatrix && (
              <div
                style={{
                  backgroundColor: "var(--surface-color)",
                  borderRadius: "16px",
                  border: "1px solid var(--border-color)",
                  overflowX: "auto",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.04)"
                }}
              >
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border-color)", backgroundColor: "rgba(0,0,0,0.02)" }}>
                      <th style={{ padding: "1.25rem 1.5rem", width: "28%", fontWeight: 800 }}>Función / Capacidad</th>
                      <th style={{ padding: "1.25rem 1rem", width: "18%", textAlign: "center" }}>🆓 Gratis</th>
                      <th style={{ padding: "1.25rem 1rem", width: "18%", textAlign: "center", backgroundColor: "rgba(37, 99, 235, 0.06)" }}>
                        <span style={{ color: "#2563eb", fontWeight: 800 }}>🚀 Starter (Simulado)</span>
                      </th>
                      <th style={{ padding: "1.25rem 1rem", width: "18%", textAlign: "center" }}>⭐ Premium</th>
                      <th style={{ padding: "1.25rem 1rem", width: "18%", textAlign: "center" }}>👑 Ultra</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                      <td style={{ padding: "1rem 1.5rem", fontWeight: 700 }}>Límite de Vehículos</td>
                      <td style={{ padding: "1rem", textAlign: "center" }}>Hasta 5</td>
                      <td style={{ padding: "1rem", textAlign: "center", backgroundColor: "rgba(37, 99, 235, 0.04)", fontWeight: 800, color: "#2563eb" }}>Hasta 20</td>
                      <td style={{ padding: "1rem", textAlign: "center" }}>Hasta 100</td>
                      <td style={{ padding: "1rem", textAlign: "center", fontWeight: 700 }}>Ilimitados</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                      <td style={{ padding: "1rem 1.5rem", fontWeight: 700 }}>Usuarios de Ventas</td>
                      <td style={{ padding: "1rem", textAlign: "center" }}>1 usuario</td>
                      <td style={{ padding: "1rem", textAlign: "center", backgroundColor: "rgba(37, 99, 235, 0.04)", fontWeight: 800, color: "#2563eb" }}>Hasta 2 usuarios</td>
                      <td style={{ padding: "1rem", textAlign: "center" }}>Hasta 5 usuarios</td>
                      <td style={{ padding: "1rem", textAlign: "center", fontWeight: 700 }}>Ilimitados</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                      <td style={{ padding: "1rem 1.5rem", fontWeight: 700 }}>CRM & Pipeline de Leads</td>
                      <td style={{ padding: "1rem", textAlign: "center" }}>Básico</td>
                      <td style={{ padding: "1rem", textAlign: "center", backgroundColor: "rgba(37, 99, 235, 0.04)" }}>Estándar (Pipeline + Asignación)</td>
                      <td style={{ padding: "1rem", textAlign: "center" }}>Avanzado (Embudos + Metas)</td>
                      <td style={{ padding: "1rem", textAlign: "center" }}>Custom + API & Webhooks</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                      <td style={{ padding: "1rem 1.5rem", fontWeight: 700 }}>Inbox WhatsApp</td>
                      <td style={{ padding: "1rem", textAlign: "center", opacity: 0.5 }}>No disponible</td>
                      <td style={{ padding: "1rem", textAlign: "center", backgroundColor: "rgba(37, 99, 235, 0.04)" }}>1 Canal Conectado</td>
                      <td style={{ padding: "1rem", textAlign: "center" }}>Multicanal (Meta API)</td>
                      <td style={{ padding: "1rem", textAlign: "center" }}>Ilimitado + Agentes IA</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                      <td style={{ padding: "1rem 1.5rem", fontWeight: 700 }}>Email Broadcasts</td>
                      <td style={{ padding: "1rem", textAlign: "center", opacity: 0.5 }}>No disponible</td>
                      <td style={{ padding: "1rem", textAlign: "center", backgroundColor: "rgba(37, 99, 235, 0.04)" }}>500 emails / mes</td>
                      <td style={{ padding: "1rem", textAlign: "center" }}>5,000 emails / mes</td>
                      <td style={{ padding: "1rem", textAlign: "center" }}>Ilimitados + IP propia</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                      <td style={{ padding: "1rem 1.5rem", fontWeight: 700 }}>Publicación Multicanal</td>
                      <td style={{ padding: "1rem", textAlign: "center" }}>Manual</td>
                      <td style={{ padding: "1rem", textAlign: "center", backgroundColor: "rgba(37, 99, 235, 0.04)" }}>MercadoLibre + Redes</td>
                      <td style={{ padding: "1rem", textAlign: "center" }}>Publicación Ilimitada 1-Clic</td>
                      <td style={{ padding: "1rem", textAlign: "center" }}>Automatización Total</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                      <td style={{ padding: "1rem 1.5rem", fontWeight: 700 }}>Asistente IA & Respuestas</td>
                      <td style={{ padding: "1rem", textAlign: "center", opacity: 0.5 }}>No disponible</td>
                      <td style={{ padding: "1rem", textAlign: "center", backgroundColor: "rgba(37, 99, 235, 0.04)" }}>Respuestas IA + Plantillas</td>
                      <td style={{ padding: "1rem", textAlign: "center" }}>IA Agente Completo</td>
                      <td style={{ padding: "1rem", textAlign: "center" }}>IA Custom / Fine-tune</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                      <td style={{ padding: "1rem 1.5rem", fontWeight: 700 }}>Dominio Propio</td>
                      <td style={{ padding: "1rem", textAlign: "center" }}>Subdominio .n-sistemas.com</td>
                      <td style={{ padding: "1rem", textAlign: "center", backgroundColor: "rgba(37, 99, 235, 0.04)" }}>Subdominio + CNAME</td>
                      <td style={{ padding: "1rem", textAlign: "center" }}>Dominio .com + SSL</td>
                      <td style={{ padding: "1rem", textAlign: "center" }}>Dominio + Email Verificado</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "1rem 1.5rem", fontWeight: 700 }}>Soporte Técnico</td>
                      <td style={{ padding: "1rem", textAlign: "center" }}>Email estándar</td>
                      <td style={{ padding: "1rem", textAlign: "center", backgroundColor: "rgba(37, 99, 235, 0.04)" }}>Email & Chat Prioritario</td>
                      <td style={{ padding: "1rem", textAlign: "center" }}>Soporte 24/7 WhatsApp</td>
                      <td style={{ padding: "1rem", textAlign: "center" }}>Ejecutivo Dedicado VIP</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </AnimatedSection>

        <AnimatedSection as="section" id="prueba" className={styles.trialSection} delay={0.3} direction="up">
          <div className={styles.trialContainer}>
            <FreeTrialForm />
          </div>
        </AnimatedSection>
      </main>

      <footer className={styles.footer}>
        <p>© {new Date().getFullYear()} n-sistemas.com. Todos los derechos reservados.</p>
      </footer>

      {/* Checkout Modal Simulation */}
      {selectedPlanForCheckout && (
        <CheckoutModal
          plan={selectedPlanForCheckout}
          isYearly={isYearly}
          onClose={() => setSelectedPlanForCheckout(null)}
        />
      )}
    </div>
  );
}

