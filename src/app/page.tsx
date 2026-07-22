import Link from "next/link";
import Image from "next/image";
import styles from "./page.module.css";
import FreeTrialForm from "@/components/FreeTrialForm";
import AnimatedSection from "@/components/AnimatedSection";
import { MessageCircle, Shield, TrendingUp } from "lucide-react";

export default function Home() {
  return (
    <div className={styles.landingContainer}>
      <nav className={styles.nav}>
        <div className={styles.logo}>n-autos</div>
        <Link href="/admin" className="btn-primary">
          Acceso Demo
        </Link>
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
