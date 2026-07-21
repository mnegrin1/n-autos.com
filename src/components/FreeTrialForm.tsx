"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createAgencyAndUser } from "@/actions/userActions";
import styles from "../app/page.module.css";

export default function FreeTrialForm() {
  const [agencyName, setAgencyName] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Simple auto-generated subdomain logic
    const subdomain = agencyName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .substring(0, 20) + "-" + Math.floor(Math.random() * 1000);

    startTransition(async () => {
      const result = await createAgencyAndUser(agencyName, userName, userEmail, subdomain);
      if (result.success) {
        // Redirect to admin. Assuming we just push them to admin since we don't have auth session set up in this prototype.
        router.push(`/admin`);
      } else {
        setError(result.error || "Ocurrió un error al procesar la solicitud.");
      }
    });
  };

  return (
    <form className={styles.trialForm} onSubmit={handleSubmit}>
      <h3 className={styles.formTitle}>Comenzá tu Prueba Gratis</h3>
      
      {error && <div className={styles.errorAlert}>{error}</div>}

      <div className={styles.inputGroup}>
        <label>Nombre de la Organización</label>
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
        <label>Nombre del Administrador</label>
        <input 
          type="text" 
          required 
          value={userName} 
          onChange={(e) => setUserName(e.target.value)} 
          placeholder="Tu nombre completo"
          disabled={isPending}
        />
      </div>

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

      <button type="submit" className={styles.submitBtn} disabled={isPending}>
        {isPending ? "Creando cuenta..." : "Crear Cuenta y Acceder"}
      </button>
      <p className={styles.formDisclaimer}>Sin tarjeta de crédito. Cancelá cuando quieras.</p>
    </form>
  );
}
