import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Términos y Condiciones | n-autos.com",
  description: "Términos y Condiciones del servicio n-autos.com desarrollado y operado por N-Sistemas.",
};

export default function TerminosPage() {
  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "4rem 2rem 6rem", color: "#e4e4e7", minHeight: "100vh" }}>
      <Link 
        href="/" 
        style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "#a1a1aa", textDecoration: "none", marginBottom: "2.5rem", fontSize: "0.95rem" }}
      >
        <ArrowLeft size={16} /> Volver al inicio
      </Link>

      <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "2.5rem", fontWeight: 300, color: "#ffffff", marginBottom: "1.5rem" }}>
        Términos y Condiciones
      </h1>
      <p style={{ color: "#a1a1aa", fontSize: "0.9rem", marginBottom: "2rem" }}>
        Última actualización: Octubre 2026
      </p>

      <section style={{ display: "flex", flexDirection: "column", gap: "1.75rem", lineHeight: 1.7, fontSize: "1rem", color: "#d4d4d8" }}>
        <div>
          <h2 style={{ fontSize: "1.25rem", color: "#ffffff", marginBottom: "0.5rem" }}>1. Identificación del Servicio</h2>
          <p>
            n-autos.com es una plataforma y solución tecnológica desarrollada y operada por N-Sistemas, diseñada para concesionarias y automotoras que buscan digitalizar su inventario, sitio web y canal de ventas.
          </p>
        </div>

        <div>
          <h2 style={{ fontSize: "1.25rem", color: "#ffffff", marginBottom: "0.5rem" }}>2. Prueba Gratis y Suscripción</h2>
          <p>
            El Plan Inicial incluye una prueba completa de 14 días sin necesidad de ingresar tarjeta de crédito. Finalizado el período de prueba, el cliente podrá contratar voluntariamente el plan mensual o anual para continuar con el servicio activo. No existen contratos de permanencia obligatorios en planes estándar.
          </p>
        </div>

        <div>
          <h2 style={{ fontSize: "1.25rem", color: "#ffffff", marginBottom: "0.5rem" }}>3. Uso del Servicio y Propiedad de Datos</h2>
          <p>
            Cada automotora mantiene en todo momento la titularidad total sobre la información de sus vehículos, precios, datos de clientes y fotografías cargadas en el sistema. N-Sistemas no comercializa ni comparte bases de datos con terceros.
          </p>
        </div>

        <div>
          <h2 style={{ fontSize: "1.25rem", color: "#ffffff", marginBottom: "0.5rem" }}>4. Acceso Técnico de Soporte y Privacidad de la Información</h2>
          <p style={{ marginBottom: "0.75rem" }}>
            Al registrarse y utilizar el servicio, el usuario y la organización autorizan expresamente a la empresa (N-Sistemas / n-autos.com) y a su personal técnico autorizado a acceder al portal y panel administrativo de la automotora con el fin exclusivo de brindar asistencia técnica, auditar configuraciones y resolver problemas o incidencias específicas que pudiesen presentarse durante la operación del sistema.
          </p>
          <p>
            La empresa asume el compromiso inquebrantable de mantener todos los datos del usuario (incluyendo de forma enunciativa pero no limitativa: información de contactos, leads y clientes, stock e inventario de vehículos, registros de ventas, cotizaciones y métricas comerciales) estrictamente seguros, confidenciales y privados. Esta información se encuentra protegida bajo protocolos de seguridad y encriptación de nivel bancario, y nunca será divulgada, transferida ni comercializada a terceros.
          </p>
        </div>

        <div>
          <h2 style={{ fontSize: "1.25rem", color: "#ffffff", marginBottom: "0.5rem" }}>5. Disponibilidad y Mantenimiento</h2>
          <p>
            N-Sistemas provee soporte técnico, infraestructura en la nube de alta disponibilidad y actualizaciones continuas para asegurar el óptimo rendimiento de la plataforma y de los sitios web de cada automotora.
          </p>
        </div>

        <div>
          <h2 style={{ fontSize: "1.25rem", color: "#ffffff", marginBottom: "0.5rem" }}>6. Contacto</h2>
          <p>
            Para consultas relacionadas con estos términos, comunicarse a <a href="mailto:contacto@n-sistemas.com" style={{ color: "#38bdf8" }}>contacto@n-sistemas.com</a> o al teléfono <a href="tel:+59891728722" style={{ color: "#38bdf8" }}>+598 91 728 722</a>.
          </p>
        </div>
      </section>
    </div>
  );
}
