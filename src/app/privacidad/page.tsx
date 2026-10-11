import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Política de Privacidad | n-autos.com",
  description: "Política de Privacidad de n-autos.com desarrollada y operada por N-Sistemas.",
};

export default function PrivacidadPage() {
  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "4rem 2rem 6rem", color: "#e4e4e7", minHeight: "100vh" }}>
      <Link 
        href="/" 
        style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "#a1a1aa", textDecoration: "none", marginBottom: "2.5rem", fontSize: "0.95rem" }}
      >
        <ArrowLeft size={16} /> Volver al inicio
      </Link>

      <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "2.5rem", fontWeight: 300, color: "#ffffff", marginBottom: "1.5rem" }}>
        Política de Privacidad
      </h1>
      <p style={{ color: "#a1a1aa", fontSize: "0.9rem", marginBottom: "2rem" }}>
        Última actualización: Octubre 2026
      </p>

      <section style={{ display: "flex", flexDirection: "column", gap: "1.75rem", lineHeight: 1.7, fontSize: "1rem", color: "#d4d4d8" }}>
        <div>
          <h2 style={{ fontSize: "1.25rem", color: "#ffffff", marginBottom: "0.5rem" }}>1. Compromiso de Confidencialidad</h2>
          <p>
            En n-autos.com (N-Sistemas), nos comprometemos a resguardar la privacidad y los datos de nuestros clientes y de los visitantes de sus portales web. No vendemos, alquilamos ni divulgamos información privada a terceros.
          </p>
        </div>

        <div>
          <h2 style={{ fontSize: "1.25rem", color: "#ffffff", marginBottom: "0.5rem" }}>2. Datos Recopilados</h2>
          <p>
            Únicamente recopilamos los datos que usted nos proporciona voluntariamente a través de los formularios de registro y uso del servicio (nombre, nombre de la automotora, teléfono, correo electrónico, inventario y gestión comercial) con el fin de poner en marcha su plataforma web y herramientas operativas.
          </p>
        </div>

        <div>
          <h2 style={{ fontSize: "1.25rem", color: "#ffffff", marginBottom: "0.5rem" }}>3. Seguridad de la Información</h2>
          <p>
            Implementamos protocolos de seguridad estándar en la industria, incluyendo cifrado HTTPS/SSL en todas las comunicaciones, arquitectura multitenant aislada por cliente y almacenamiento seguro para garantizar la máxima protección de su inventario, ventas y datos de contacto.
          </p>
        </div>

        <div>
          <h2 style={{ fontSize: "1.25rem", color: "#ffffff", marginBottom: "0.5rem" }}>4. Acceso Técnico Autorizado para Soporte e Incidencias</h2>
          <p>
            Para garantizar la continuidad operativa del servicio, el usuario y la organización autorizan al personal técnico y de soporte de N-Sistemas a acceder a su instancia y panel administrativo con el propósito exclusivo de brindar soporte técnico, resolver problemas operativos o diagnosticar incidencias específicas que pudiesen suscitarse. N-Sistemas mantendrá todos los datos del usuario (contactos, stock de vehículos, ventas y transacciones) estrictamente confidenciales, seguros y privados, sin utilizarlos para ningún otro fin.
          </p>
        </div>

        <div>
          <h2 style={{ fontSize: "1.25rem", color: "#ffffff", marginBottom: "0.5rem" }}>5. Canales de Contacto</h2>
          <p>
            Para ejercer sus derechos de acceso, rectificación o eliminación de sus datos, puede contactarnos en <a href="mailto:contacto@n-sistemas.com" style={{ color: "#38bdf8" }}>contacto@n-sistemas.com</a> o al teléfono <a href="tel:+59891728722" style={{ color: "#38bdf8" }}>+598 91 728 722</a>.
          </p>
        </div>
      </section>
    </div>
  );
}
