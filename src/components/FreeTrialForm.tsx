"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createAgencyAndUser } from "@/actions/userActions";
import { addLandingInquiry } from "@/lib/inquiryStore";
import { CheckCircle2, Phone, Mail, User, Building, MessageSquare, ArrowRight } from "lucide-react";
import styles from "../app/page.module.css";

export default function FreeTrialForm() {
  const [agencyName, setAgencyName] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const subdomain = agencyName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .substring(0, 20) + "-" + Math.floor(Math.random() * 1000);

    // 1. Guardar la consulta en inquiryStore para recibirla en el portal de SuperAdmin
    addLandingInquiry({
      agencyName,
      userName,
      userEmail,
      phone,
      message
    });

    startTransition(async () => {
      // 2. Crear la agencia demo preliminar en la base de datos
      await createAgencyAndUser(agencyName, userName, userEmail, subdomain).catch(() => null);
      setIsSubmitted(true);
    });
  };

  if (isSubmitted) {
    return (
      <div className={styles.trialForm} style={{ textAlign: "center", padding: "2.5rem 1.5rem" }}>
        <div style={{
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          backgroundColor: "rgba(16, 185, 129, 0.15)",
          color: "#10b981",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 1.25rem auto"
        }}>
          <CheckCircle2 size={32} />
        </div>

        <h3 className={styles.formTitle} style={{ marginBottom: "0.5rem" }}>¡Solicitud Recibida!</h3>
        <p style={{ fontSize: "0.95rem", opacity: 0.85, lineHeight: "1.5", marginBottom: "1.5rem" }}>
          Muchas gracias, <strong>{userName}</strong>. Tu consulta para <strong>{agencyName}</strong> ha sido enviada al equipo de <strong>N-Autos SuperAdmin</strong>. Un asesor técnico se comunicará contigo a la brevedad.
        </p>

        <button 
          type="button" 
          onClick={() => router.push("/admin")} 
          className={styles.submitBtn}
          style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
        >
          Probar Panel Admin Demo <ArrowRight size={18} />
        </button>
      </div>
    );
  }

  return (
    <form className={styles.trialForm} onSubmit={handleSubmit}>
      <h3 className={styles.formTitle}>Solicitá una Demo y Asesoría</h3>
      <p style={{ fontSize: "0.88rem", opacity: 0.75, marginBottom: "1.25rem", textAlign: "center" }}>
        Ingresá tus datos para que nuestro equipo técnico prepare tu solución llave en mano.
      </p>
      
      {error && <div className={styles.errorAlert}>{error}</div>}

      <div className={styles.inputGroup}>
        <label>Nombre de la Automotora / Empresa</label>
        <input 
          type="text" 
          required 
          value={agencyName} 
          onChange={(e) => setAgencyName(e.target.value)} 
          placeholder="Ej: Automotores del Sur"
          disabled={isPending}
        />
      </div>

      <div className={styles.inputGroup}>
        <label>Nombre del Responsable</label>
        <input 
          type="text" 
          required 
          value={userName} 
          onChange={(e) => setUserName(e.target.value)} 
          placeholder="Tu nombre completo"
          disabled={isPending}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem" }}>
        <div className={styles.inputGroup}>
          <label>Correo Electrónico</label>
          <input 
            type="email" 
            required 
            value={userEmail} 
            onChange={(e) => setUserEmail(e.target.value)} 
            placeholder="tu@email.com"
            disabled={isPending}
          />
        </div>

        <div className={styles.inputGroup}>
          <label>Teléfono / WhatsApp</label>
          <input 
            type="tel" 
            value={phone} 
            onChange={(e) => setPhone(e.target.value)} 
            placeholder="099 123 456"
            disabled={isPending}
          />
        </div>
      </div>

      <div className={styles.inputGroup}>
        <label>Consulta o Requerimientos (Opcional)</label>
        <textarea 
          value={message} 
          onChange={(e) => setMessage(e.target.value)} 
          placeholder="Ej: Queremos conectar WhatsApp y publicar en MercadoLibre..."
          rows={2}
          disabled={isPending}
          style={{
            padding: "0.75rem",
            borderRadius: "8px",
            border: "1px solid var(--border-color)",
            backgroundColor: "var(--bg-color)",
            color: "var(--text-color)",
            fontSize: "0.9rem",
            resize: "vertical",
            fontFamily: "inherit"
          }}
        />
      </div>

      <button type="submit" className={styles.submitBtn} disabled={isPending}>
        {isPending ? "Enviando Solicitud..." : "Solicitar Demo y Acceso Directo"}
      </button>
      <p className={styles.formDisclaimer}>Montamos y configuramos la tecnología a la medida de tu automotora.</p>
    </form>
  );
}
