"use client";

export default function WhatsAppFloatingButton({
  phone,
  agencyName,
}: {
  phone: string;
  agencyName: string;
}) {
  if (!phone) return null;

  // Limpiar el número de teléfono para wa.me (dejar solo dígitos)
  const cleanPhone = phone.replace(/\D/g, "");

  const messageText = `Hola, vengo del sitio web de ${agencyName} y me gustaría hacer una consulta.`;
  const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;

  return (
    <>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: "fixed",
          bottom: "2rem",
          right: "2rem",
          backgroundColor: "#25d366",
          color: "white",
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 10px rgba(0, 0, 0, 0.3)",
          zIndex: 9999,
          transition: "transform 0.2s ease-in-out, background-color 0.2s ease",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.1)";
          e.currentTarget.style.backgroundColor = "#22c35e";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.backgroundColor = "#25d366";
        }}
        title={`Chat por WhatsApp con ${agencyName}`}
      >
        {/* Logo de WhatsApp en SVG */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      </a>

      {/* Animación de pulso alrededor del botón */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes wapp-pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.5);
          }
          70% {
            box-shadow: 0 0 0 15px rgba(37, 211, 102, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(37, 211, 102, 0);
          }
        }
      `}} />
    </>
  );
}
