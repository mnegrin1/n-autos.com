"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./page.module.css";
import FreeTrialForm from "@/components/FreeTrialForm";
import AnimatedSection from "@/components/AnimatedSection";
import InteractiveDashboardPreview from "@/components/InteractiveDashboardPreview";
import {
  Check,
  Clock,
  ChevronDown,
  Menu,
  X,
  ArrowRight,
  Tag,
  Phone,
  Mail,
  ArrowUpRight,
  HelpCircle,
} from "lucide-react";

const FAQ_ITEMS = [
  {
    question: "¿Qué es un CRM?",
    answer:
      "Un CRM (Customer Relationship Management, o Sistema de Gestión de Clientes) es una plataforma digital diseñada para centralizar, ordenar y hacer seguimiento a todas las oportunidades de venta de tu automotora en un solo lugar. En lugar de tener consultas dispersas en chats personales de WhatsApp, números anotados en papeles o planillas de Excel que nadie actualiza, el CRM registra a cada comprador potencial, el vehículo exacto que busca, su presupuesto y el historial de cada conversación. Te permite saber qué vendedor está atendiendo a cada cliente y programar recordatorios automáticos para que ninguna venta se pierda por falta de seguimiento.",
  },
  {
    question:
      "¿Por qué necesito un CRM si hoy ya me manejo con WhatsApp y cuadernos o Excel?",
    answer:
      "Atender por WhatsApp personal o anotar en cuadernos funciona cuando recibís pocas consultas por semana, pero cuando el volumen crece se vuelve caótico e ineficiente. Los mensajes se pierden entre chats familiares o de amigos, no recordás qué modelo buscaba cada cliente semanas atrás y, si un vendedor renuncia o cambia de teléfono, se lleva los contactos consigo. Con un CRM, la información es patrimonio exclusivo de tu automotora: cada consulta entra directo vinculada al auto de interés, tus vendedores reciben tareas claras de seguimiento y vos como dueño tenés visibilidad en tiempo real de cuántas cotizaciones y ventas se están gestionando.",
  },
  {
    question:
      "¿Es difícil de usar o me va a costar que mis vendedores se adapten?",
    answer:
      "No, justamente fue diseñado para ser lo opuesto a los sistemas complejos y pesados. En n-autos.com eliminamos los campos innecesarios y la burocracia típica de los CRM genéricos para enfocarnos en la dinámica real de una automotora: podés cargar un vehículo o registrar un interesado en segundos desde el celular o la computadora. Cualquier vendedor aprende a utilizarlo el primer día sin necesidad de capacitaciones complejas, y contás con nuestro soporte técnico directo ante cualquier consulta.",
  },
  {
    question: "¿Cómo se conecta el CRM con mi stock de autos y mi página web?",
    answer:
      "Todo funciona sincronizado de manera 100% automática. Cuando cargás o modificás un auto en tu inventario (con fotos, precio en pesos o dólares, ficha técnica y kilometraje), se actualiza al instante en tu sitio web público. Y cuando un comprador navega tu catálogo y envía una consulta por WhatsApp o formulario, la oportunidad de venta entra directo a tu panel de CRM asociada a esa unidad específica. De esta manera, nunca tenés que cargar la información dos veces ni copiar y pegar datos a mano entre distintas pantallas.",
  },
  {
    question:
      "¿Los datos y la cartera de clientes están seguros y son privados de mi negocio?",
    answer:
      "Totalmente. La base de datos de compradores, presupuestos y ventas es propiedad exclusiva de tu automotora. Tu información se almacena con altos estándares de cifrado y copias de seguridad continuas en la nube. Ningún competidor ni tercero puede acceder a tus contactos, y además podés definir permisos para que cada vendedor acceda únicamente a sus operaciones, manteniendo la privacidad y protección total de tu negocio.",
  },
];

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    "monthly",
  );
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div className={styles.landingContainer}>
      <nav className={styles.nav}>
        <div className={styles.logo}>
          <span className={styles.logoMain}>n-autos</span>
          <span className={styles.logoDot}>.com</span>
        </div>

        {/* Desktop Navigation matching screenshot */}
        <div className={styles.desktopNav}>
          <a
            href="#que-es"
            style={{
              color: "var(--text-color)",
              textDecoration: "none",
              fontSize: "0.95rem",
              fontWeight: 500,
            }}
          >
            Qué es
          </a>
          <Link
            href="/doc"
            style={{
              color: "var(--text-color)",
              textDecoration: "none",
              fontSize: "0.95rem",
              fontWeight: 500,
            }}
          >
            Artículos
          </Link>
          <a
            href="#precios"
            style={{
              color: "var(--text-color)",
              textDecoration: "none",
              fontSize: "0.95rem",
              fontWeight: 500,
            }}
          >
            Precios
          </a>
          <a
            href="#faq"
            style={{
              color: "var(--text-color)",
              textDecoration: "none",
              fontSize: "0.95rem",
              fontWeight: 500,
            }}
          >
            Preguntas Frecuentes
          </a>
          <a
            href="#contacto"
            style={{
              color: "var(--text-color)",
              textDecoration: "none",
              fontSize: "0.95rem",
              fontWeight: 500,
            }}
          >
            Contacto
          </a>
          <Link href="/admin/login" className={styles.loginBtn}>
            Ingresar
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
            href="#precios"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              color: "var(--primary)",
              textDecoration: "none",
              fontSize: "1.1rem",
              fontWeight: 700,
            }}
          >
            Ver Planes ($50/mes)
          </a>
          <a
            href="#que-es"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              color: "var(--text-color)",
              textDecoration: "none",
              fontSize: "1.1rem",
              fontWeight: 700,
            }}
          >
            Qué es
          </a>
          <Link
            href="/doc"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              color: "var(--text-color)",
              textDecoration: "none",
              fontSize: "1.1rem",
              fontWeight: 700,
            }}
          >
            Artículos
          </Link>
          <a
            href="#faq"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              color: "var(--text-color)",
              textDecoration: "none",
              fontSize: "1.1rem",
              fontWeight: 700,
            }}
          >
            Preguntas Frecuentes
          </a>
          <a
            href="#contacto"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              color: "var(--text-color)",
              textDecoration: "none",
              fontSize: "1.1rem",
              fontWeight: 700,
            }}
          >
            Contacto
          </a>
          <Link
            href="/admin/login"
            className="btn-primary"
            onClick={() => setMobileMenuOpen(false)}
            style={{ width: "100%", textAlign: "center", padding: "0.85rem" }}
          >
            Ingresar
          </Link>
        </div>
      )}

      <main>
        {/* Hero Section matching screenshot with Interactive Dashboard Monitor */}
        <AnimatedSection
          as="section"
          className={styles.heroSection}
          direction="down"
        >
          <div className={styles.heroLeftContent}>
            <h1 className={styles.title}>
              Los Sistemas que Tu Automotora Necesita.
              <br />
              Empieza Hoy Gratis.
            </h1>
            <p className={styles.subtitle}>
              Tu Portal web, CRM de Ventas, Calendario, Stock Actualizado, y
              más... <br />
              Todo listo en minutos con{" "}
              <span className={styles.highlight}>Soporte Técnico Incluido</span>
              .
            </p>
            <div className={styles.ctaButtons}>
              <Link href="/registro" className={styles.darkCtaBtn}>
                Probar 14 Días Gratis
              </Link>
            </div>
          </div>

          <div className={styles.heroRightImage}>
            <InteractiveDashboardPreview />
          </div>

          <div className={styles.scrollIndicatorContainer}>
            <a href="#que-es" className={styles.scrollIndicatorLink}>
              <div className={styles.scrollMouse}>
                <div className={styles.scrollWheel} />
              </div>
              <span>Desplazá para explorar más</span>
              <ChevronDown size={14} className={styles.chevronAnim} />
            </a>
          </div>
        </AnimatedSection>

        {/* Sección: ¿Qué es n-autos.com? */}
        <AnimatedSection
          as="section"
          id="que-es"
          direction="up"
          className={styles.simpleAboutSection}
          delay={0.2}
        >
          <h2 className={styles.simpleAboutTitle}>
            ¿Qué es n-autos<span className={styles.logoDot}>.com</span>?
          </h2>
          <p className={styles.simpleAboutDesc}>
            Es la plataforma que te permite controlar la
            <b> Página Web, el Stock, los Contactos, y la Agenda </b>
            de tu automotora.
            <br />
            <br />
            De la forma más fácil y rápida para que no pierdas más tiempo en
            operaciones y te enfoques en lo que realmente importa: vender autos.
            <br />
            <br />
            Aprendé a usarla una sóla vez y{" "}
            <strong>controlá todo tu negocio desde el primer día</strong>.
          </p>
        </AnimatedSection>

        {/* Sección: n-autos.com te permite: */}
        <AnimatedSection
          as="section"
          direction="up"
          className={styles.simpleBulletsSection}
          delay={0.2}
        >
          <h2 className={styles.simpleBulletsTitle}>
            Con <span className={styles.logoMain}>n-autos</span>
            <span className={styles.logoDot}>.com</span> consigues:
          </h2>

          <div className={styles.bulletsCard}>
            <ul className={styles.bulletsGrid}>
              <li className={styles.bulletItem}>
                <Check size={18} className={styles.bulletIconCheck} />
                <span>
                  Tu página web lista al instante. Tu stock y ventas
                  actualizadas.
                </span>
              </li>
              <li className={styles.bulletItem}>
                <Check size={18} className={styles.bulletIconCheck} />
                <span>
                  Recibir consultas directas de compradores a tu WhatsApp desde
                  cada auto.
                </span>
              </li>
              <li className={styles.bulletItem}>
                <Check size={18} className={styles.bulletIconCheck} />
                <span>
                  Cargar y actualizar tu stock con fotos y videos fácilmente.
                </span>
              </li>
              <li className={styles.bulletItem}>
                <Check size={18} className={styles.bulletIconCheck} />
                <span>
                  Integrar tu propio dominio web <i>(www.tu-automotora.com)</i>{" "}
                  rápidamente.
                </span>
              </li>
              <li className={styles.bulletItem}>
                <Check size={18} className={styles.bulletIconCheck} />
                <span>
                  Agendar visitas conectadas directamente a tu calendario
                  personal.
                </span>
              </li>
              <li className={styles.bulletItem}>
                <Check size={18} className={styles.bulletIconCheck} />
                <span>
                  Gestionar todos tus prospectos y clientes en un solo lugar
                  organizado.
                </span>
              </li>
              <li className={styles.bulletItem}>
                <Check size={18} className={styles.bulletIconCheck} />
                <span>
                  Asistencia técnica de{" "}
                  <span
                    style={{
                      fontFamily: "Test Tiempos Headline Light serif",
                      fontSize: "1.1rem",
                      fontWeight: "400",
                      color: "#ffffff",
                    }}
                  >
                    n-sistemas
                  </span>
                  <span
                    style={{
                      fontFamily: "Test Tiempos Headline Light serif",
                      fontSize: ".75em",
                      fontWeight: "400",
                      color: "#ffffff",
                    }}
                  >
                    .com
                  </span>{" "}
                  incluido en todos los planes.
                </span>
              </li>
            </ul>

            <div className={styles.bulletsDivider} />

            <div className={styles.workingOnHeader}>
              <h3 className={styles.workingOnTitleInCard}>
                ¿En qué estamos trabajando?
              </h3>
              <span className={styles.workingOnBadge}>Próximamente</span>
            </div>

            <ul className={styles.workingOnGrid}>
              <li className={styles.workingOnItem}>
                <Clock size={17} className={styles.workingOnIconClock} />
                <span>
                  Publicación y sincronización de vehículos en Instagram,
                  Facebook y MercadoLibre en un clic.
                </span>
              </li>
              <li className={styles.workingOnItem}>
                <Clock size={17} className={styles.workingOnIconClock} />
                <span>
                  Calculadora de financiación personalizada e interactiva para
                  cada comprador.
                </span>
              </li>
              <li className={styles.workingOnItem}>
                <Clock size={17} className={styles.workingOnIconClock} />
                <span>
                  Chats unificados para responder WhatsApp, Instagram y Facebook
                  en una sola bandeja.
                </span>
              </li>
              <li className={styles.workingOnItem}>
                <Clock size={17} className={styles.workingOnIconClock} />
                <span>
                  Asistente inteligente con Inteligencia Artificial para
                  calificar consultas y agendar 24/7.
                </span>
              </li>
              <li className={styles.workingOnItem}>
                <Clock size={17} className={styles.workingOnIconClock} />
                <span>
                  Reportes automáticos sobre el rendimiento de tus vendedores y
                  canales comerciales.
                </span>
              </li>
            </ul>
          </div>
        </AnimatedSection>

        {/* Sección de Precios y Planes - Estilo Eden.so */}
        <AnimatedSection
          as="section"
          id="precios"
          className={styles.pricingSection}
          delay={0.2}
        >
          <div className={styles.pricingHeader}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                backgroundColor: "rgba(255, 255, 255, 0.08)",
                color: "#ffffff",
                border: "1px solid rgba(255, 255, 255, 0.14)",
                padding: "0.35rem 0.85rem",
                borderRadius: "9999px",
                fontSize: "0.82rem",
                fontWeight: 600,
                marginBottom: "0.85rem",
                letterSpacing: "0.02em",
              }}
            >
              <Tag size={15} /> 14 DÍAS DE PRUEBA GRATIS • SIN TARJETA
            </div>
            <h2
              className={styles.simpleAboutTitle}
              style={{ marginBottom: "0.75rem" }}
            >
              Probá <span className={styles.logoMain}>n-autos</span>
              <span className={styles.logoDot}>.com</span> 14 días gratis en tu
              automotora
            </h2>
            <p
              style={{
                fontSize: "1.05rem",
                color: "#a1a1aa",
                maxWidth: "660px",
                margin: "0 auto 1.5rem",
                lineHeight: 1.6,
              }}
            >
              Cargá tus autos, conectá tu WhatsApp y tené tu página web
              funcionando hoy mismo. Sin contratos, sin letra chica y sin
              ingresar tarjeta de crédito.
            </p>
          </div>

          {/* Toggle Mensual / Anual estilo Eden.so */}
          <div className={styles.pricingToggleContainer}>
            <div className={styles.pricingToggle}>
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`${styles.pricingToggleBtn} ${billingCycle === "monthly" ? styles.pricingToggleBtnActive : ""}`}
              >
                Facturación Mensual
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("annual")}
                className={`${styles.pricingToggleBtn} ${billingCycle === "annual" ? styles.pricingToggleBtnActive : ""}`}
              >
                Facturación Anual
                <span className={styles.pricingSaveBadge}>Ahorrá 20%</span>
              </button>
            </div>
          </div>

          <div className={styles.pricingGrid}>
            {/* Card 1: Plan Inicial - DESTACADO CON PRUEBA GRATIS */}
            <div
              className={`${styles.pricingCard} ${styles.pricingCardFeatured}`}
            >
              <div className={styles.popularBadge}>Más popular</div>

              <div className={styles.cardTop}>
                <h3 className={styles.planTier}>Plan Inicial</h3>
                <p className={styles.planDesc}>
                  Tu automotora en internet HOY, con inventario al día y
                  consultas de compradores directo a tu WhatsApp.
                </p>
              </div>

              <div
                className={styles.priceBox}
                style={{ alignItems: "baseline" }}
              >
                <span className={styles.priceStrikethrough}>$50</span>
                <span className={styles.priceFreeText}>Gratis</span>
                <span className={styles.priceTrialSub}>por 14 días</span>
              </div>

              <div className={styles.priceTrialNote}>
                {billingCycle === "monthly" ? (
                  <>
                    Luego <strong>$50 USD / mes</strong> • Sin tarjeta de
                    crédito • Cancelá cuando quieras
                  </>
                ) : (
                  <>
                    Luego <strong>$40 USD / mes</strong> ($480/año, ahorrás
                    $120) • Sin tarjeta de crédito
                  </>
                )}
              </div>

              <Link href="/registro" className={styles.pricingBtnPillPrimary}>
                Empezar Prueba Gratis de 14 Días{" "}
                <ArrowRight size={15} className={styles.pricingBtnIcon} />
              </Link>

              <div style={{ margin: "0.85rem 0 0.25rem", textAlign: "center" }}>
                <span className={styles.noCardRequiredBadge}>
                  ✓ No se requiere tarjeta de crédito
                </span>
              </div>

              <ul className={styles.featuresList}>
                <li className={styles.featureItem}>
                  <Check size={16} className={styles.featureIconCheck} />
                  <span>
                    <strong>14 días de prueba completa</strong> sin costo para
                    probar con tus propios autos
                  </span>
                </li>
                <li className={styles.featureItem}>
                  <Check size={16} className={styles.featureIconCheck} />
                  <span>
                    <strong>Tu propia página web sincronizada</strong> con tus
                    autos
                  </span>
                </li>
                <li className={styles.featureItem}>
                  <Check size={16} className={styles.featureIconCheck} />
                  <span>
                    <strong>Consultas directas a tu whatsapp</strong> en cada
                    vehículo
                  </span>
                </li>
                <li className={styles.featureItem}>
                  <Check size={16} className={styles.featureIconCheck} />
                  <span>
                    <strong>Integra tu Dominio Personalizado</strong> (.com o
                    .uy seguro)
                  </span>
                </li>
                <li className={styles.featureItem}>
                  <Check size={16} className={styles.featureIconCheck} />
                  <span>
                    <strong>Control de stock con fotos y ficha</strong> de cada
                    auto en dólares o pesos
                  </span>
                </li>
                <li className={styles.featureItem}>
                  <Check size={16} className={styles.featureIconCheck} />
                  <span>
                    <strong>Registro simple de clientes y consultas</strong>
                  </span>
                </li>
                <li className={styles.featureItem}>
                  <Check size={16} className={styles.featureIconCheck} />
                  <span>
                    <strong>
                      Agenda de visitas al local conectadas a tu calendario
                    </strong>
                  </span>
                </li>
                <li
                  className={`${styles.featureItem} ${styles.featureItemDisabled}`}
                >
                  <Clock size={16} className={styles.featureIconClock} />
                  <span>
                    Calculadora de cuotas y financiación (Próximamente)
                  </span>
                </li>
                <li
                  className={`${styles.featureItem} ${styles.featureItemDisabled}`}
                >
                  <Clock size={16} className={styles.featureIconClock} />
                  <span>
                    Publicación en Facebook, Instagram y MercadoLibre
                    (Próximamente)
                  </span>
                </li>
              </ul>
            </div>

            {/* Card 2: A Medida */}
            <div className={styles.pricingCard}>
              <div className={styles.cardTop}>
                <h3 className={styles.planTier}>A Medida</h3>
                <p className={styles.planDesc}>
                  Para concesionarias con varias sucursales, equipo de múltiples
                  vendedores o sistemas de gestión que requieren integración
                  directa.
                </p>
              </div>

              <div className={styles.priceBox}>
                <span
                  className={styles.priceAmount}
                  style={{ fontSize: "2.4rem" }}
                >
                  A Medida
                </span>
              </div>

              <div className={styles.priceNote}>
                Puesta en marcha personalizada junto a nuestro equipo técnico
              </div>

              <a href="#contacto" className={styles.pricingBtnPill}>
                Hablar con el equipo{" "}
                <ArrowRight size={15} className={styles.pricingBtnIcon} />
              </a>

              <div style={{ margin: "0.85rem 0 0.25rem", textAlign: "center" }}>
                <span style={{ fontSize: "0.75rem", color: "#a1a1aa" }}>
                  Escribinos para analizar tu caso con nuestro equipo
                </span>
              </div>

              <ul className={styles.featuresList}>
                <li className={styles.featureItem}>
                  <Check size={16} className={styles.featureIconCheck} />
                  <span>
                    <strong>
                      Manejo de múltiples locales y salones de venta
                    </strong>
                  </span>
                </li>
                <li className={styles.featureItem}>
                  <Check size={16} className={styles.featureIconCheck} />
                  <span>
                    <strong>
                      Cuentas y accesos independientes para cada vendedor
                    </strong>
                  </span>
                </li>
                <li className={styles.featureItem}>
                  <Check size={16} className={styles.featureIconCheck} />
                  <span>
                    <strong>Conexión con tu sistema actual</strong> de
                    facturación, stock o DMS
                  </span>
                </li>
                <li className={styles.featureItem}>
                  <Check size={16} className={styles.featureIconCheck} />
                  <span>
                    <strong>
                      Asistente virtual con Inteligencia Artificial
                    </strong>{" "}
                    que atiende y agenda 24/7
                  </span>
                </li>
                <li className={styles.featureItem}>
                  <Check size={16} className={styles.featureIconCheck} />
                  <span>
                    <strong>Servidor dedicado de alta velocidad</strong> para
                    grandes catálogos
                  </span>
                </li>
                <li className={styles.featureItem}>
                  <Check size={16} className={styles.featureIconCheck} />
                  <span>
                    <strong>
                      Acompañamiento y asesor tecnológico asignado
                    </strong>{" "}
                    a tu automotora
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </AnimatedSection>

        {/* Sección de Preguntas Frecuentes (FAQ) */}
        <AnimatedSection
          as="section"
          id="faq"
          className={styles.faqSection}
          delay={0.2}
          direction="up"
        >
          <div className={styles.faqHeader}>
            <div className={styles.faqBadge}>
              <HelpCircle size={15} /> PREGUNTAS FRECUENTES
            </div>
            <h2 className={styles.simpleAboutTitle}>
              Todo lo que te preguntás antes de dar el salto
            </h2>
            <p className={styles.faqSubtitle}>
              Respuestas claras y directas a las dudas más comunes de los dueños
              de automotoras antes de implementar un CRM en su negocio.
            </p>
          </div>

          <div className={styles.faqList}>
            {FAQ_ITEMS.map((item, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className={`${styles.faqItem} ${isOpen ? styles.faqItemActive : ""}`}
                >
                  <button
                    type="button"
                    className={styles.faqQuestionBtn}
                    onClick={() => toggleFaq(index)}
                    aria-expanded={isOpen}
                  >
                    <div className={styles.faqQuestionContent}>
                      <span className={styles.faqNumber}>
                        0{index + 1}
                      </span>
                      <span className={styles.faqQuestionText}>
                        {item.question}
                      </span>
                    </div>
                    <div
                      className={`${styles.faqChevronWrapper} ${isOpen ? styles.faqChevronRotated : ""}`}
                    >
                      <ChevronDown size={18} />
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{
                          duration: 0.25,
                          ease: [0.25, 0.1, 0.25, 1],
                        }}
                        style={{ overflow: "hidden" }}
                      >
                        <div className={styles.faqAnswer}>
                          <p>{item.answer}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Banner de Consulta adicional */}
          <div className={styles.faqCtaCard}>
            <div>
              <h3 className={styles.faqCtaTitle}>
                ¿Tenés alguna otra consulta sobre tu automotora?
              </h3>
              <p className={styles.faqCtaDesc}>
                Escribinos sin compromiso y te explicamos en detalle cómo
                resolver los desafíos específicos de tu negocio.
              </p>
            </div>
            <a href="#contacto" className={styles.faqCtaBtn}>
              Consultar con un asesor <ArrowRight size={15} />
            </a>
          </div>
        </AnimatedSection>

        {/* Sección de Consulta & Activación de Prueba */}
        <AnimatedSection
          as="section"
          id="contacto"
          className={styles.trialSection}
          delay={0.2}
          direction="up"
        >
          <div className={styles.trialContainer}>
            <FreeTrialForm />
          </div>
        </AnimatedSection>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerContactRow}>
            <a href="tel:+59891728722" className={styles.footerContactItem}>
              <Phone size={14} />
              <span>+598 91 728 722</span>
            </a>
            <span className={styles.footerDot}>•</span>
            <a
              href="mailto:contacto@n-sistemas.com"
              className={styles.footerContactItem}
            >
              <Mail size={14} />
              <span>contacto@n-sistemas.com</span>
            </a>
          </div>

          <div className={styles.footerLinksRow}>
            <a href="#faq" className={styles.footerLink}>
              Preguntas Frecuentes
            </a>
            <span className={styles.footerDot}>•</span>
            <Link href="/terminos" className={styles.footerLink}>
              Términos y Condiciones
            </Link>
            <span className={styles.footerDot}>•</span>
            <Link href="/privacidad" className={styles.footerLink}>
              Política de Privacidad
            </Link>
            <span className={styles.footerDot}>•</span>
            <a
              href="https://n-sistemas.com"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.footerLink}
            >
              n-sistemas.com <ArrowUpRight size={14} />
            </a>
          </div>

          <div className={styles.footerCopyrightRow}>
            © 2026 n-sistemas.com. Todos los derechos reservados.{" "}
            <span className={styles.footerBrandHighlight}>n-autos.com</span> es
            una solución desarrollada y operada por N-Sistemas.
          </div>
        </div>
      </footer>
    </div>
  );
}
