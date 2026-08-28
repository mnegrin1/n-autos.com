"use client";

import { useState, useTransition } from "react";
import { createAgencyAndUser } from "@/actions/userActions";
import { submitLandingInquiryAction } from "@/actions/inquiryActions";
import { addLandingInquiry } from "@/lib/inquiryStore";
import { addRegisteredTenant } from "@/lib/superadminStore";
import { createSupportTicket } from "@/lib/supportStore";
import { trackButtonClick } from "@/lib/landingTracker";
import { CheckCircle2, RotateCcw, ArrowLeft, ArrowRight } from "lucide-react";
import styles from "../app/page.module.css";

export default function FreeTrialForm() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [agencyName, setAgencyName] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [urgentContact, setUrgentContact] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleStepSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (step === 1) {
      if (!agencyName.trim() || !userName.trim()) {
        setError("Por favor completa el nombre de tu automotora y tu nombre.");
        return;
      }
      trackButtonClick("form_step_1_next", "Siguiente Paso 1->2", "Formulario de Contacto", { agencyName, userName });
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!userEmail.trim()) {
        setError("Por favor ingresa tu correo electrónico.");
        return;
      }
      trackButtonClick("form_step_2_next", "Siguiente Paso 2->3", "Formulario de Contacto", { userEmail, phone });
      setStep(3);
      return;
    }

    if (step === 3) {
      trackButtonClick("form_submit_consultar", "Consultar al equipo (Formulario Final)", "Formulario de Contacto", { agencyName, userEmail, urgentContact });

      const subdomain = agencyName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .substring(0, 20) || `automotora-${Date.now().toString().slice(-4)}`;

      const agencyId = `agency-${Date.now()}`;

      // 1. Guardar localmente en el navegador
      addLandingInquiry({
        agencyName,
        userName,
        userEmail,
        phone,
        message: message + (urgentContact ? " [Contacto Urgente]" : "")
      });

      addRegisteredTenant({
        agencyId,
        agencyName,
        subdomain,
        adminName: userName,
        adminEmail: userEmail,
        planName: "Starter"
      });

      createSupportTicket(
        userEmail,
        userName,
        agencyName,
        `Consulta desde Landing Page (${agencyName})`,
        message || `Consulta enviada desde el formulario de contacto por ${userName} (${userEmail}) para la automotora ${agencyName}.`
      );

      // 2. Guardar en el servidor para que llegue a superadmin.n-autos.com
      startTransition(async () => {
        await submitLandingInquiryAction({
          agencyName,
          userName,
          userEmail,
          phone,
          message: message + (urgentContact ? " [Contacto Urgente]" : "")
        });

        await createAgencyAndUser(agencyName, userName, userEmail, subdomain).catch(() => null);
        setIsSubmitted(true);
      });
    }
  };

  const handleReset = () => {
    trackButtonClick("form_reset_otra_consulta", "Enviar otra consulta", "Formulario de Contacto");
    setAgencyName("");
    setUserName("");
    setUserEmail("");
    setPhone("");
    setMessage("");
    setUrgentContact(false);
    setStep(1);
    setIsSubmitted(false);
  };

  if (isSubmitted) {
    return (
      <div className={styles.trialForm} style={{ textAlign: "center", padding: "1.5rem 0.5rem" }}>
        <div style={{
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          backgroundColor: "#ecfdf5",
          color: "#10b981",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 1.25rem auto",
          border: "1px solid #a7f3d0"
        }}>
          <CheckCircle2 size={36} />
        </div>

        <h3 className={styles.formTitle} style={{ marginBottom: "0.5rem" }}>¡Consulta Recibida!</h3>
        <p style={{ fontSize: "0.95rem", color: "#4b5563", lineHeight: "1.6", marginBottom: "1.5rem" }}>
          Muchas gracias, <strong>{userName}</strong>. Recibimos tu consulta para <strong>{agencyName}</strong>. Nuestro equipo se comunicará contigo a la brevedad.
        </p>

        <button 
          type="button" 
          onClick={handleReset} 
          className={styles.submitBtn}
          style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", width: "auto", margin: "0 auto 1.5rem auto", padding: "0.75rem 1.5rem" }}
        >
          <RotateCcw size={16} /> Enviar otra consulta
        </button>

        <p className={styles.formDisclaimer}>
          Sus datos están seguros. No compartiremos su información ni nos interesa molestarlo.
        </p>
      </div>
    );
  }

  return (
    <form className={styles.trialForm} onSubmit={handleStepSubmit}>
      <div className={styles.stepHeader}>
        <h3 className={styles.formTitle}>Hablar con el Equipo</h3>
        <div className={styles.stepIndicatorRow}>
          <span className={styles.stepBadge}>Paso {step} de 3 ( {step}/3 )</span>
          <div className={styles.stepProgressTrack}>
            <div 
              className={styles.stepProgressBar} 
              style={{ width: step === 1 ? "33.3%" : step === 2 ? "66.6%" : "100%" }} 
            />
          </div>
        </div>
      </div>
      
      {error && <div className={styles.errorAlert}>{error}</div>}

      {step === 1 && (
        <>
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

          <button type="submit" className={styles.submitBtn} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
            Siguiente <ArrowRight size={16} />
          </button>
        </>
      )}

      {step === 2 && (
        <>
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
              required
              value={phone} 
              onChange={(e) => setPhone(e.target.value)} 
              placeholder="099 123 456"
              disabled={isPending}
            />
          </div>

          <div className={styles.buttonRow}>
            <button 
              type="button" 
              onClick={() => { setError(null); setStep(1); }} 
              className={styles.secondaryBtn}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}
            >
              <ArrowLeft size={16} /> Atrás
            </button>
            <button 
              type="submit" 
              className={styles.submitBtn}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}
            >
              Siguiente <ArrowRight size={16} />
            </button>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <div className={styles.inputGroup}>
            <label>Consulta o Requerimientos (Opcional)</label>
            <textarea 
              value={message} 
              onChange={(e) => setMessage(e.target.value)} 
              placeholder="Ej: Queremos conectar WhatsApp y publicar en MercadoLibre..."
              rows={3}
              disabled={isPending}
            />
          </div>

          <div className={styles.checkboxGroup}>
            <label className={styles.checkboxLabel}>
              <input 
                type="checkbox" 
                checked={urgentContact} 
                onChange={(e) => setUrgentContact(e.target.checked)}
                className={styles.checkboxInput}
                disabled={isPending}
              />
              <span>Contácteme lo antes posible</span>
            </label>
          </div>

          <div className={styles.buttonRow}>
            <button 
              type="button" 
              onClick={() => { setError(null); setStep(2); }} 
              className={styles.secondaryBtn}
              disabled={isPending}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}
            >
              <ArrowLeft size={16} /> Atrás
            </button>
            <button type="submit" className={styles.submitBtn} disabled={isPending}>
              {isPending ? "Enviando Consulta..." : "Consultar al equipo"}
            </button>
          </div>
        </>
      )}

      <p className={styles.formDisclaimer}>
        Sus datos están seguros. No compartiremos su información ni nos interesa molestarlo.
      </p>
    </form>
  );
}
