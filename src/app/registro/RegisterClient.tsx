"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Globe, 
  Building2, 
  Phone, 
  Sparkles, 
  ShieldCheck, 
  AlertCircle,
  Tag,
  CreditCard,
  Zap,
  Clock,
  KeyRound
} from "lucide-react";
import { 
  registerTrialAgency, 
  checkSubdomainAvailableAction,
  sendRegistrationVerificationAction,
  verifyRegistrationCodeAction
} from "@/actions/authActions";
import { notifySessionEvent } from "@/lib/sessionHelper";
import { syncTenantSessionForUser } from "@/lib/tenantStore";
import { 
  COUNTRIES_LIST, 
  CountryInfo, 
  detectUserCountry, 
  detectUserCountrySync, 
  formatVisitorPhoneForCRM 
} from "@/lib/countryHelper";
import styles from "./registro.module.css";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remueve acentos
    .replace(/[^a-z0-9]+/g, "-")      // Convierte caracteres especiales y espacios en guiones
    .replace(/^-+|-+$/g, "")          // Elimina guiones iniciales o finales
    .slice(0, 35);
}

export default function RegisterClient() {
  // Paso actual: 1 (Cuenta), 2 (Verificar Correo), 3 (Automotora y Web)
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Campos Paso 1: Cuenta
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Campos Paso 2: Verificación de Correo (OTP)
  const [otpCode, setOtpCode] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [devNotice, setDevNotice] = useState("");

  // Campos Paso 3: Automotora
  const [agencyName, setAgencyName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<CountryInfo>(detectUserCountrySync());
  const [phoneLocal, setPhoneLocal] = useState("");
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const countryDropdownRef = useRef<HTMLDivElement>(null);

  // Validación y disponibilidad de subdominio
  const [isCheckingSubdomain, setIsCheckingSubdomain] = useState(false);
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);
  const [subdomainErrorReason, setSubdomainErrorReason] = useState<string>("");

  // Estado general
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Opción de pagar durante el proceso de prueba gratis de 14 días
  const [showPaymentOption, setShowPaymentOption] = useState(false);
  const [registeredData, setRegisteredData] = useState<{ workspaceCode?: string; isSubdomainAdmin: boolean } | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Temporizador para reenvío de código
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  // Auto-detección inteligente del país en background
  useEffect(() => {
    let isMounted = true;
    detectUserCountry().then((detected) => {
      if (isMounted && detected) {
        setSelectedCountry(detected);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Cierre del menú de países al hacer clic fuera
  useEffect(() => {
    if (!isCountryDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(e.target as Node)) {
        setIsCountryDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isCountryDropdownOpen]);

  // Formato estandarizado de WhatsApp con código de país internacional
  const formattedWhatsapp = useMemo(() => {
    if (!phoneLocal.trim()) return "";
    return formatVisitorPhoneForCRM(selectedCountry.dialCode, phoneLocal);
  }, [phoneLocal, selectedCountry]);

  // Auto-generación estricta del subdominio al escribir el nombre de la automotora
  useEffect(() => {
    if (agencyName.trim()) {
      const generated = slugify(agencyName);
      setSubdomain(generated);
    } else {
      setSubdomain("");
    }
  }, [agencyName]);

  // Verificación en vivo de disponibilidad de subdominio con debounce
  useEffect(() => {
    if (step !== 3) return;

    const clean = subdomain.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");

    if (!clean || clean.length < 3) {
      setSubdomainAvailable(null);
      setSubdomainErrorReason("");
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setIsCheckingSubdomain(true);
    setSubdomainAvailable(null);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const res = await checkSubdomainAvailableAction(clean);
        setSubdomainAvailable(res.available);
        setSubdomainErrorReason(res.reason || "");
      } catch (err) {
        console.error("Error al validar subdominio:", err);
      } finally {
        setIsCheckingSubdomain(false);
      }
    }, 400);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [subdomain, step]);

  // Solicitud y envío del código OTP al correo (Paso 1 -> Paso 2)
  async function handleSendVerificationCode(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setError("");
    setDevNotice("");

    if (!name.trim() || name.trim().length < 2) {
      setError("Por favor ingresa tu nombre y apellido.");
      return;
    }

    if (!email.trim() || !email.includes("@") || !email.includes(".")) {
      setError("Por favor ingresa un correo electrónico válido.");
      return;
    }

    if (!password || password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setIsSendingOtp(true);
    try {
      const res = await sendRegistrationVerificationAction(email.trim(), name.trim());
      if (res.success) {
        setStep(2);
        setResendCountdown(45);
        if ((res as any).devCode) {
          setDevNotice(`Código de verificación generado: ${(res as any).devCode}`);
        }
      } else {
        setError(res.error || "No se pudo enviar el código de verificación.");
      }
    } catch (err: any) {
      console.error("Error al enviar código:", err);
      setError("Error de conexión al enviar el código. Intenta nuevamente.");
    } finally {
      setIsSendingOtp(false);
    }
  }

  // Verificación del código OTP de 6 dígitos (Paso 2 -> Paso 3)
  async function handleVerifyOtp(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setError("");

    const cleanOtp = otpCode.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setError("Por favor ingresa el código completo de 6 dígitos.");
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const res = await verifyRegistrationCodeAction(email.trim(), cleanOtp);
      if (res.success) {
        setStep(3);
        setError("");
      } else {
        setError(res.error || "El código ingresado es incorrecto o ha expirado.");
      }
    } catch (err: any) {
      console.error("Error al verificar código:", err);
      setError("Error al comprobar el código. Intenta nuevamente.");
    } finally {
      setIsVerifyingOtp(false);
    }
  }

  // Reenvío de código OTP
  async function handleResendOtp() {
    if (resendCountdown > 0 || isSendingOtp) return;
    setError("");
    setDevNotice("");
    setIsSendingOtp(true);
    try {
      const res = await sendRegistrationVerificationAction(email.trim(), name.trim());
      if (res.success) {
        setResendCountdown(45);
        if ((res as any).devCode) {
          setDevNotice(`Código de verificación generado: ${(res as any).devCode}`);
        }
      } else {
        setError(res.error || "No se pudo reenviar el código.");
      }
    } catch (err: any) {
      console.error("Error al reenviar código:", err);
      setError("Error de red al reenviar el código.");
    } finally {
      setIsSendingOtp(false);
    }
  }

  // Envío final del registro
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!agencyName.trim() || agencyName.trim().length < 2) {
      setError("Por favor ingresa el nombre de tu automotora.");
      return;
    }

    const cleanSubdomain = subdomain.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (!cleanSubdomain || cleanSubdomain.length < 3) {
      setError("El subdominio web debe tener al menos 3 caracteres alfanuméricos.");
      return;
    }

    if (subdomainAvailable === false) {
      setError(subdomainErrorReason || "El subdominio elegido ya está en uso. Por favor elige otro.");
      return;
    }

    if (!acceptedTerms) {
      setError("Debes aceptar los Términos y Condiciones para registrar tu automotora.");
      return;
    }

    setLoading(true);

    try {
      const res = await registerTrialAgency({
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
        agencyName: agencyName.trim(),
        subdomain: cleanSubdomain,
        whatsapp: formattedWhatsapp || undefined,
        acceptedTerms: true,
      });

      if (res.success && res.user) {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("n_sistemas_tab_user_id", res.user.id);
          sessionStorage.setItem("n_sistemas_tab_user_email", res.user.email);
          localStorage.setItem("n_autos_onboarding_pending", "true");
        }

        syncTenantSessionForUser({
          ...res.user,
          agency_name: agencyName.trim(),
          subdomain: cleanSubdomain,
        });
        notifySessionEvent("SESSION_SWITCH", res.user.id, res.user.email);

        // Dar la opción de pagar con Mercado Pago durante el proceso de prueba de 14 días
        const workspaceCode = res.user.workspace_code;
        const isSubdomainAdmin = typeof window !== "undefined" && window.location.hostname.startsWith("admin.");
        setRegisteredData({ workspaceCode, isSubdomainAdmin });
        setShowPaymentOption(true);
        setLoading(false);
      } else {
        setError(res.error || "Ocurrió un error al procesar el registro. Intenta nuevamente.");
        setLoading(false);
      }
    } catch (err: any) {
      console.error("Error en registro:", err);
      setError("Error de red inesperado. Por favor intenta nuevamente.");
      setLoading(false);
    }
  }

  // Previews dinámicos
  const displaySubdomain = subdomain.trim() ? slugify(subdomain) : "tuautomotora";
  const displayAgencyName = agencyName.trim() || "Tu Automotora";
  const displayDomain = displaySubdomain.replace(/[^a-z0-9]/g, "") || "tuautomotora";

  return (
    <div className={styles.container}>
      <div className={styles.glowSphere} />

      <div className={styles.card}>
        {/* Cabecera / Marca */}
        <div className={styles.header}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoMain}>n-autos</span>
            <span className={styles.logoDot}>.com</span>
          </Link>

          <div className={styles.trialBadge}>
            <Tag size={13} />
            <span>14 Días Gratis • Sin Tarjeta</span>
          </div>
        </div>

        {/* Barra de progreso de 3 pasos */}
        <div className={styles.stepperContainer}>
          <div className={styles.stepperLine}>
            <div 
              className={`${styles.stepperLineActive}`} 
              style={{ 
                width: step === 1 ? "0%" : step === 2 ? "50%" : "100%", 
                transition: "width 0.4s ease" 
              }} 
            />
          </div>

          <div className={styles.stepItem}>
            <div className={`${styles.stepCircle} ${step === 1 ? styles.stepCircleActive : styles.stepCircleCompleted}`}>
              {step > 1 ? <Check size={14} /> : "1"}
            </div>
            <span className={`${styles.stepLabel} ${step === 1 ? styles.stepLabelActive : ""}`}>
              Tu Cuenta
            </span>
          </div>

          <div className={styles.stepItem}>
            <div className={`${styles.stepCircle} ${step === 2 ? styles.stepCircleActive : step > 2 ? styles.stepCircleCompleted : ""}`}>
              {step > 2 ? <Check size={14} /> : "2"}
            </div>
            <span className={`${styles.stepLabel} ${step === 2 ? styles.stepLabelActive : ""}`}>
              Confirmar Correo
            </span>
          </div>

          <div className={styles.stepItem}>
            <div className={`${styles.stepCircle} ${step === 3 ? styles.stepCircleActive : ""}`}>
              3
            </div>
            <span className={`${styles.stepLabel} ${step === 3 ? styles.stepLabelActive : ""}`}>
              Tu Automotora
            </span>
          </div>
        </div>

        {/* Alerta de error si existe */}
        {error && (
          <div className={styles.errorBox}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* PASO 1: CREAR CUENTA DE ACCESO                           */}
        {/* ======================================================== */}
        {step === 1 && (
          <>
            <div className={styles.stepIntro}>
              <h2 className={styles.stepTitle}>Crea tu cuenta de acceso</h2>
              <p className={styles.stepDesc}>
                Ingresa tus datos personales para acceder a tu panel de administración.
              </p>
            </div>

            <form onSubmit={handleSendVerificationCode} className={styles.form}>
              {/* Nombre y Apellido */}
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="name">
                  <span>Tu Nombre y Apellido</span>
                </label>
                <div className={styles.inputWrapper}>
                  <User size={18} className={styles.inputIcon} />
                  <input
                    id="name"
                    type="text"
                    required
                    placeholder="Ej: Juan Pérez"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={styles.input}
                    autoFocus
                  />
                </div>
              </div>

              {/* Correo Electrónico */}
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="email">
                  <span>Correo Electrónico</span>
                  <span className={styles.labelHint}>Enviaremos un código de confirmación</span>
                </label>
                <div className={styles.inputWrapper}>
                  <Mail size={18} className={styles.inputIcon} />
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="ventas@tuautomotora.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={styles.input}
                  />
                </div>
              </div>

              {/* Contraseña */}
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="password">
                  <span>Contraseña</span>
                  <span className={styles.labelHint}>Mínimo 6 caracteres</span>
                </label>
                <div className={styles.inputWrapper}>
                  <Lock size={18} className={styles.inputIcon} />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={styles.input}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={styles.togglePasswordBtn}
                    aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Botón de continuar al paso 2 */}
              <div className={styles.buttonGroup}>
                <button 
                  type="submit" 
                  disabled={isSendingOtp}
                  className={styles.primaryBtn}
                >
                  {isSendingOtp ? (
                    <>
                      <div className={styles.spinner} />
                      <span>Enviando código...</span>
                    </>
                  ) : (
                    <>
                      <span>Continuar y verificar correo</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Garantías y enlaces de confianza */}
            <div className={styles.trustList}>
              <div className={styles.trustItem}>
                <ShieldCheck size={15} />
                <span>Sin tarjeta de crédito</span>
              </div>
              <div className={styles.trustItem}>
                <Sparkles size={15} />
                <span>Activación en 60 segundos</span>
              </div>
            </div>

            <div className={styles.footerText}>
              ¿Ya tienes una cuenta registrada? 
              <Link href="/admin/login" className={styles.footerLink}>
                Iniciar Sesión
              </Link>
            </div>
          </>
        )}

        {/* ======================================================== */}
        {/* PASO 2: CONFIRMAR CÓDIGO DE CORREO                       */}
        {/* ======================================================== */}
        {step === 2 && (
          <>
            <div className={styles.stepIntro}>
              <h2 className={styles.stepTitle}>Confirma tu correo electrónico</h2>
              <p className={styles.stepDesc}>
                Enviamos un código de seguridad de 6 dígitos a <strong style={{ color: "#ffffff" }}>{email}</strong> para validar tu identidad.
              </p>
            </div>

            {devNotice && (
              <div style={{
                backgroundColor: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.18)",
                borderRadius: "10px",
                padding: "0.6rem 0.9rem",
                fontSize: "0.82rem",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginTop: "0.5rem"
              }}>
                <KeyRound size={16} />
                <span>{devNotice}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className={styles.form}>
              <div className={styles.otpCard}>
                <div className={styles.otpIconBadge}>
                  <Mail size={26} />
                </div>

                <div className={styles.otpInputWrapper}>
                  <input
                    id="otpCode"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="000000"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className={styles.otpInput}
                    autoFocus
                    required
                  />
                </div>

                <div className={styles.otpActionsRow}>
                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setStep(1);
                    }}
                    className={styles.changeEmailBtn}
                  >
                    Modificar correo
                  </button>

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCountdown > 0 || isSendingOtp}
                    className={styles.resendBtn}
                  >
                    {isSendingOtp 
                      ? "Enviando..." 
                      : resendCountdown > 0 
                        ? `Reenviar código (${resendCountdown}s)` 
                        : "Reenviar código"}
                  </button>
                </div>
              </div>

              <div className={styles.buttonGroup}>
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setStep(1);
                  }}
                  disabled={isVerifyingOtp}
                  className={styles.secondaryBtn}
                >
                  <ArrowLeft size={16} />
                  <span>Volver</span>
                </button>

                <button
                  type="submit"
                  disabled={isVerifyingOtp || otpCode.trim().length !== 6}
                  className={styles.primaryBtn}
                >
                  {isVerifyingOtp ? (
                    <>
                      <div className={styles.spinner} />
                      <span>Verificando...</span>
                    </>
                  ) : (
                    <>
                      <span>Verificar y Continuar</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}

        {/* ======================================================== */}
        {/* PASO 3: TU AUTOMOTORA Y PRESENCIA WEB                    */}
        {/* ======================================================== */}
        {step === 3 && (
          <>
            <div className={styles.stepIntro}>
              <h2 className={styles.stepTitle}>Configura tu automotora y web</h2>
              <p className={styles.stepDesc}>
                Tu sitio web estará en línea y listo para publicar vehículos al instante.
              </p>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              {/* Nombre de la automotora */}
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="agencyName">
                  <span>Nombre de la Automotora</span>
                </label>
                <div className={styles.inputWrapper}>
                  <Building2 size={18} className={styles.inputIcon} />
                  <input
                    id="agencyName"
                    type="text"
                    required
                    placeholder="Ej: Automotora del Este"
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    className={styles.input}
                    autoFocus
                  />
                </div>
              </div>

              {/* Subdominio web asignado automáticamente */}
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="subdomain">
                  <span>Dirección web asignada</span>
                  <span className={styles.labelHint}>Automática según tu nombre</span>
                </label>
                <div 
                  className={styles.subdomainGroup}
                  style={{ 
                    backgroundColor: "rgba(255, 255, 255, 0.04)", 
                    borderColor: "var(--border-color)",
                    cursor: "not-allowed" 
                  }}
                >
                  <span className={styles.subdomainPrefix}>
                    <Globe size={14} /> https://
                  </span>
                  <input
                    id="subdomain"
                    type="text"
                    readOnly
                    tabIndex={-1}
                    placeholder="tu-automotora"
                    value={subdomain}
                    className={styles.subdomainInput}
                    style={{ cursor: "not-allowed", opacity: 0.9, fontWeight: 600 }}
                  />
                  <span className={styles.subdomainSuffix}>.n-autos.com</span>
                  <div 
                    style={{ display: "flex", alignItems: "center", paddingRight: "0.75rem", opacity: 0.6 }}
                    title="El enlace se genera automáticamente a partir del nombre de tu automotora"
                  >
                    <Lock size={14} />
                  </div>
                </div>

                {/* Feedback de disponibilidad en vivo */}
                {isCheckingSubdomain && (
                  <div className={`${styles.availFeedback} ${styles.availLoading}`}>
                    <div className={styles.spinnerSmall} />
                    <span>Verificando disponibilidad de la dirección web...</span>
                  </div>
                )}
                {!isCheckingSubdomain && subdomainAvailable === true && (
                  <div className={`${styles.availFeedback} ${styles.availSuccess}`}>
                    <Check size={14} />
                    <span>¡Dirección web disponible! (<b>https://{displaySubdomain}.n-autos.com</b>)</span>
                  </div>
                )}
                {!isCheckingSubdomain && subdomainAvailable === false && (
                  <div className={`${styles.availFeedback} ${styles.availError}`}>
                    <AlertCircle size={14} />
                    <span>{subdomainErrorReason || "Esta dirección web ya está ocupada. Prueba agregando una ciudad o distintivo al nombre de tu automotora."}</span>
                  </div>
                )}
                <p style={{ margin: "0.35rem 0 0 0", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  💡 Podrás conectar tu dominio propio personalizado (ej: <i>www.tuautomotora.com</i>) en cualquier momento desde Configuración.
                </p>
              </div>

              {/* WhatsApp de ventas / contacto con Selector de País */}
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="phoneLocal">
                  <span>WhatsApp de Ventas</span>
                  <span className={styles.labelHint}>Para consultas directas de compradores</span>
                </label>
                <div className={styles.phoneInputRow} ref={countryDropdownRef}>
                  {/* Selector de País */}
                  <button
                    type="button"
                    onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                    className={styles.countrySelectBtn}
                    title={`País: ${selectedCountry.name} (+${selectedCountry.dialCode})`}
                  >
                    <span>{selectedCountry.flag}</span>
                    <span style={{ fontWeight: 700 }}>+{selectedCountry.dialCode}</span>
                    <span style={{ fontSize: "0.7rem", opacity: 0.6 }}>▾</span>
                  </button>

                  {/* Menú Desplegable de Países */}
                  {isCountryDropdownOpen && (
                    <div className={styles.countryDropdownMenu}>
                      {COUNTRIES_LIST.map((c) => (
                        <button
                          key={c.code}
                          type="button"
                          onClick={() => {
                            setSelectedCountry(c);
                            setIsCountryDropdownOpen(false);
                          }}
                          className={`${styles.countryOptionItem} ${
                            selectedCountry.code === c.code ? styles.countryOptionActive : ""
                          }`}
                        >
                          <span style={{ fontSize: "1.05rem" }}>{c.flag}</span>
                          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {c.name}
                          </span>
                          <span style={{ opacity: 0.65, fontWeight: 600 }}>+{c.dialCode}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Input del Teléfono Local */}
                  <div className={styles.inputWrapper} style={{ flex: 1 }}>
                    <Phone size={18} className={styles.inputIcon} />
                    <input
                      id="phoneLocal"
                      type="tel"
                      placeholder={`Ej: ${selectedCountry.placeholder}`}
                      value={phoneLocal}
                      onChange={(e) => setPhoneLocal(e.target.value)}
                      className={styles.input}
                    />
                  </div>
                </div>

                <p style={{ margin: "0.3rem 0 0 0", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  {formattedWhatsapp ? (
                    <>Número asignado para tu web: <strong style={{ color: "#ffffff" }}>{formattedWhatsapp}</strong></>
                  ) : (
                    <>Selecciona tu país e ingresa tu número local. El código internacional (+{selectedCountry.dialCode}) se asignará automáticamente.</>
                  )}
                </p>
              </div>

              {/* ======================================================== */}
              {/* PREVIEW EN TIEMPO REAL DEL SITIO WEB                      */}
              {/* ======================================================== */}
              <div className={styles.previewContainer}>
                <div className={styles.previewLabel}>
                  <span>Vista previa de tu sitio web</span>
                  <span style={{ color: "#ffffff", fontWeight: 600 }}>En vivo</span>
                </div>

                <div className={styles.previewMockup}>
                  <div className={styles.previewBrowserBar}>
                    <div className={styles.mockupDots}>
                      <span className={`${styles.mockupDot} ${styles.dotRed}`} />
                      <span className={`${styles.mockupDot} ${styles.dotYellow}`} />
                      <span className={`${styles.mockupDot} ${styles.dotGreen}`} />
                    </div>
                    <div className={styles.previewUrlBar}>
                      <Lock size={11} style={{ color: "#ffffff", flexShrink: 0 }} />
                      <span>https://</span>
                      <span className={styles.previewUrlActive}>{displaySubdomain}</span>
                      <span>.n-autos.com</span>
                    </div>
                  </div>

                  <div className={styles.previewBody}>
                    <div className={styles.previewNav}>
                      <span className={styles.previewBrandTitle}>
                        {displayAgencyName}
                      </span>
                      <span className={styles.previewOnlineBadge}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#ffffff", display: "inline-block" }} />
                        Sitio Activo
                      </span>
                    </div>

                    <div className={styles.previewHero}>
                      <div className={styles.previewHeroText}>
                        <span className={styles.previewHeroTitle}>Encuentra tu próximo vehículo</span>
                        <span className={styles.previewHeroSub}>Catálogo oficial y consultas inmediatas</span>
                      </div>
                      <div className={styles.previewBtnWhatsApp}>
                        <Phone size={11} />
                        <span>{formattedWhatsapp ? formattedWhatsapp : "WhatsApp"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ======================================================== */}
              {/* CUADRITO DESTACADO: DOMINIO PERSONALIZADO                */}
              {/* ======================================================== */}
              <div className={styles.domainCallout}>
                <div className={styles.domainCalloutIcon}>
                  <Globe size={22} />
                </div>
                <div className={styles.domainCalloutContent}>
                  <div className={styles.domainCalloutTitle}>
                    Tu propio dominio personalizado
                  </div>
                  <p className={styles.domainCalloutText}>
                    Tu dominio personalizado <span className={styles.domainCalloutHighlight}>www.{displayDomain}.com</span> (o .com.uy) podrá integrarse luego sin costo adicional con certificado de seguridad SSL incluido desde tu panel.
                  </p>
                </div>
              </div>

              {/* Checkbox de Aceptación de Términos y Condiciones */}
              <div 
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.75rem",
                  padding: "0.85rem 1rem",
                  borderRadius: "12px",
                  backgroundColor: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  marginTop: "0.25rem",
                  marginBottom: "0.25rem",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
                onClick={() => setAcceptedTerms(!acceptedTerms)}
              >
                <input
                  type="checkbox"
                  id="acceptTermsCheckbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  onClick={(e) => e.stopPropagation()}
                  required
                  style={{
                    marginTop: "0.2rem",
                    width: "17px",
                    height: "17px",
                    accentColor: "#3b82f6",
                    cursor: "pointer",
                    flexShrink: 0
                  }}
                />
                <label 
                  htmlFor="acceptTermsCheckbox" 
                  style={{ 
                    fontSize: "0.82rem", 
                    color: "rgba(255, 255, 255, 0.8)", 
                    lineHeight: 1.5, 
                    cursor: "pointer", 
                    margin: 0,
                    userSelect: "none"
                  }}
                >
                  Acepto los{" "}
                  <Link 
                    href="/terminos" 
                    target="_blank" 
                    onClick={(e) => e.stopPropagation()}
                    style={{ color: "#38bdf8", textDecoration: "underline", fontWeight: 600 }}
                  >
                    Términos y Condiciones
                  </Link>{" "}
                  y la{" "}
                  <Link 
                    href="/privacidad" 
                    target="_blank" 
                    onClick={(e) => e.stopPropagation()}
                    style={{ color: "#38bdf8", textDecoration: "underline", fontWeight: 600 }}
                  >
                    Política de Privacidad
                  </Link>
                  . Autorizo el acceso técnico de la empresa para resolver incidencias bajo estricta confidencialidad y protección de datos.
                </label>
              </div>

              {/* Botones de acción */}
              <div className={styles.buttonGroup}>
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setStep(1);
                  }}
                  disabled={loading}
                  className={styles.secondaryBtn}
                >
                  <ArrowLeft size={16} />
                  <span>Volver</span>
                </button>

                <button
                  type="submit"
                  disabled={loading || subdomainAvailable === false || isCheckingSubdomain || !acceptedTerms}
                  className={styles.primaryBtn}
                >
                  {loading ? (
                    <>
                      <div className={styles.spinner} />
                      <span>Creando tu automotora...</span>
                    </>
                  ) : (
                    <>
                      <span>Comenzar mi prueba gratis</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </div>

              <p className={styles.legalNotice}>
                Al continuar aceptas los{" "}
                <Link href="/terminos" target="_blank">Términos de Servicio</Link> y la{" "}
                <Link href="/privacidad" target="_blank">Política de Privacidad</Link>.
              </p>
            </form>
          </>
        )}
      </div>

      {/* MODAL DE OPCIÓN DE PAGO EN PROCESO DE PRUEBA DE 14 DÍAS */}
      {showPaymentOption && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10000,
          padding: "1rem",
        }}>
          <div style={{
            backgroundColor: "#ffffff",
            borderRadius: "20px",
            width: "100%",
            maxWidth: "520px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            padding: "2rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
            color: "#0f172a",
            textAlign: "center",
          }}>
            <div style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              backgroundColor: "rgba(0, 0, 0, 0.06)",
              color: "#0f172a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto",
            }}>
              <Check size={32} />
            </div>

            <div>
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.25rem 0.75rem",
                borderRadius: "20px",
                backgroundColor: "rgba(245, 158, 11, 0.15)",
                color: "#d97706",
                fontWeight: 800,
                fontSize: "0.8rem",
                marginBottom: "0.5rem",
              }}>
                <Clock size={14} /> 14 DÍAS DE PRUEBA GRATIS ACTIVOS
              </div>
              <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "#0f172a" }}>
                ¡Tu automotora está lista!
              </h2>
              <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.9rem", color: "#64748b", lineHeight: "1.5" }}>
                Tu prueba de 14 días ya comenzó. Puedes vincular tu tarjeta con <strong>Mercado Pago</strong> ahora para asegurar tu membresía sin cortes, o explorar tu panel con la prueba gratuita.
              </p>
            </div>

            <div style={{
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "14px",
              padding: "1rem",
              textAlign: "left",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              fontSize: "0.85rem",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#0f172a", fontWeight: 600 }}>
                <Check size={16} color="#0f172a" />
                <span>Sitio web oficial en vivo con subdominio n-autos.com</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#0f172a", fontWeight: 600 }}>
                <Check size={16} color="#0f172a" />
                <span>Panel de control CRM para vehículos y contactos de WhatsApp</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#0f172a", fontWeight: 600 }}>
                <ShieldCheck size={16} color="#0f172a" />
                <span>Garantía de cancelación en cualquier momento sin penalizaciones</span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "0.5rem" }}>
              <button
                type="button"
                onClick={() => {
                  const targetUrl = registeredData?.workspaceCode
                    ? (registeredData.isSubdomainAdmin ? `/${registeredData.workspaceCode}/settings?tab=subscription&pay=true&tour=true` : `/admin/${registeredData.workspaceCode}/settings?tab=subscription&pay=true&tour=true`)
                    : (registeredData?.isSubdomainAdmin ? "/settings?tab=subscription&pay=true&tour=true" : "/admin/settings?tab=subscription&pay=true&tour=true");
                  window.location.href = targetUrl;
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  padding: "0.85rem 1.25rem",
                  borderRadius: "12px",
                  backgroundColor: "#000000",
                  color: "#ffffff",
                  border: "none",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.25)",
                }}
              >
                <CreditCard size={18} /> Pagar / Activar con Mercado Pago
              </button>

              <button
                type="button"
                onClick={() => {
                  const targetUrl = registeredData?.workspaceCode
                    ? (registeredData.isSubdomainAdmin ? `/${registeredData.workspaceCode}?tour=true&bienvenida=true` : `/admin/${registeredData.workspaceCode}?tour=true&bienvenida=true`)
                    : (registeredData?.isSubdomainAdmin ? "/?tour=true&bienvenida=true" : "/admin?tour=true&bienvenida=true");
                  window.location.href = targetUrl;
                }}
                style={{
                  padding: "0.75rem 1.25rem",
                  borderRadius: "12px",
                  backgroundColor: "transparent",
                  color: "#475569",
                  border: "1px solid #cbd5e1",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                }}
              >
                Continuar con los 14 días de prueba gratis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
