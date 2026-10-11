"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Copy,
  X,
  ArrowLeft as ArrowPointerLeftIcon,
  ArrowUp as ArrowPointerUpIcon,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import styles from "./onboardingTour.module.css";

interface OnboardingTourProps {
  agencyName?: string;
  subdomain?: string;
  userName?: string;
  userRole?: string;
  adminPrefix?: string;
}

export default function OnboardingTour({
  agencyName = "Tu Automotora",
  subdomain = "demo",
  userName = "Administrador",
  adminPrefix = "/admin",
}: OnboardingTourProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Estados del tour (8 Pasos guiados + 1 Celebración)
  // 1: Pestaña Página Web (Sidebar)
  // 2: Editor Web (Muestra inicial de configuración + URL)
  // 3: Pestaña Inventario Stock (Sidebar)
  // 4: Stock de Vehículos (+ Agregar Auto)
  // 5: Pestaña Contactos (Sidebar)
  // 6: Contactos y Clientes CRM (+ Nuevo Contacto / Importar)
  // 7: Pestaña Agenda / Turnos (Sidebar)
  // 8: Calendario y Turnos (Google Calendar & Citas)
  // 9: Celebración final
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9>(1);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [windowDimensions, setWindowDimensions] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1920,
    height: typeof window !== "undefined" ? window.innerHeight : 1080,
  });

  // Refs de estado para evitar cualquier desfase por stale closure
  const isOpenRef = useRef(false);
  const stepRef = useRef<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9>(1);
  const trackingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const trackingEndTimeRef = useRef<number>(0);
  const isBackNavigationRef = useRef(false);
  const prevPathnameRef = useRef(pathname);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  // URL pública de la automotora
  const publicWebUrl =
    typeof window !== "undefined" &&
    window.location.hostname.endsWith(".localhost")
      ? `http://${subdomain || "demo"}.localhost:3000`
      : `https://${subdomain || "demo"}.n-autos.com`;

  const getAdminUrl = (subpath: string = "") => {
    const clean = subpath.replace(/^\/+/, "");
    if (!clean) return adminPrefix || "/admin";
    return adminPrefix ? `${adminPrefix}/${clean}` : `/admin/${clean}`;
  };

  const getSelectorForStep = (s: number): string => {
    switch (s) {
      case 1:
        return '[data-tour="website-nav"]';
      case 2:
        return '[data-tour="web-config-top"]';
      case 3:
        return '[data-tour="vehicles-nav"]';
      case 4:
        return '[data-tour="vehicles-actions"]';
      case 5:
        return '[data-tour="crm-nav"]';
      case 6:
        return '[data-tour="crm-actions"]';
      case 7:
        return '[data-tour="agenda-nav"]';
      case 8:
        return '[data-tour="agenda-action-bar"]';
      default:
        return "";
    }
  };

  // Función de medición precisa y actualización del recorte
  const updateTargetPosition = (forcedStep?: number): boolean => {
    const currentStep = forcedStep ?? stepRef.current;
    if (!isOpenRef.current || currentStep === 9) {
      setTargetRect(null);
      return false;
    }

    if (typeof window !== "undefined") {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    const selector = getSelectorForStep(currentStep);
    if (!selector) {
      setTargetRect(null);
      return false;
    }

    const el = document.querySelector(selector);
    if (el) {
      const rect = el.getBoundingClientRect();

      // Solo centrar en pantalla los pasos de contenido interno (2, 4, 6, 8) si están fuera de vista
      const isSidebarStep =
        currentStep === 1 ||
        currentStep === 3 ||
        currentStep === 5 ||
        currentStep === 7;
      if (
        !isSidebarStep &&
        (rect.top < 60 || rect.bottom > window.innerHeight - 60)
      ) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }

      setTargetRect((prev) => {
        if (!prev) return rect;
        // Solo actualizar si hay un cambio real de posición/tamaño > 1px
        if (
          Math.abs(prev.top - rect.top) < 1 &&
          Math.abs(prev.left - rect.left) < 1 &&
          Math.abs(prev.width - rect.width) < 1 &&
          Math.abs(prev.height - rect.height) < 1
        ) {
          return prev;
        }
        return rect;
      });
      return true;
    }

    return false;
  };

  // Rastreo continuo adaptativo: acompaña transiciones CSS (apertura de sidebar, render de Next.js)
  const startContinuousTracking = (forcedStep?: number) => {
    if (trackingTimerRef.current) {
      clearInterval(trackingTimerRef.current);
      trackingTimerRef.current = null;
    }

    const targetStep = forcedStep ?? stepRef.current;
    trackingEndTimeRef.current = Date.now() + 1000;

    // Medición inmediata sin delay: si la página está cargando, limpiar halo viejo
    const foundImmediately = updateTargetPosition(targetStep);
    if (!foundImmediately) {
      setTargetRect(null);
    }

    trackingTimerRef.current = setInterval(() => {
      if (!isOpenRef.current || stepRef.current === 9) {
        if (trackingTimerRef.current) clearInterval(trackingTimerRef.current);
        trackingTimerRef.current = null;
        return;
      }

      const found = updateTargetPosition(targetStep);

      // Si concluyó la ventana de transición (1s) y el elemento ya fue encontrado, detener el intervalo
      if (Date.now() > trackingEndTimeRef.current) {
        if (found) {
          if (trackingTimerRef.current) clearInterval(trackingTimerRef.current);
          trackingTimerRef.current = null;
        } else if (Date.now() > trackingEndTimeRef.current + 4000) {
          if (trackingTimerRef.current) clearInterval(trackingTimerRef.current);
          trackingTimerRef.current = null;
        }
      }
    }, 25);
  };

  // Escuchar evento manual para abrir el tour desde la barra lateral o botón
  useEffect(() => {
    const handleOpenTour = () => {
      isOpenRef.current = true;
      stepRef.current = 1;
      setIsOpen(true);
      setStep(1);
      startContinuousTracking(1);
    };

    window.addEventListener("open-onboarding-tour", handleOpenTour);
    return () =>
      window.removeEventListener("open-onboarding-tour", handleOpenTour);
  }, []);

  // Detectar si el usuario debe ver el tour al cargar según URL o estado inicial
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isTourParam = searchParams.get("tour") === "true";
      const isBienvenida = searchParams.get("bienvenida") === "true";
      const isPending =
        localStorage.getItem("n_autos_onboarding_pending") === "true";
      const isCompleted =
        localStorage.getItem("n_autos_onboarding_completed") === "true";

      if (isTourParam || isPending || (isBienvenida && !isCompleted)) {
        isOpenRef.current = true;
        stepRef.current = 1;
        setIsOpen(true);
        setStep(1);
        startContinuousTracking(1);
      }
    }
  }, [searchParams]);

  // Sincronizar automáticamente el paso si el usuario navega haciendo clic directamente en los menús
  useEffect(() => {
    if (!isOpen) return;

    // Si la navegación fue provocada por el botón Atrás, no auto-avanzar hacia adelante
    if (isBackNavigationRef.current) {
      const timer = setTimeout(() => {
        isBackNavigationRef.current = false;
      }, 700);
      return () => clearTimeout(timer);
    }

    // Solo avanzar si la ruta realmente cambió (evita que un cambio de paso por Atrás dispare avance)
    if (prevPathnameRef.current === pathname) {
      return;
    }
    prevPathnameRef.current = pathname;

    if (step === 1 && pathname.includes("/website")) {
      setStep(2);
      stepRef.current = 2;
      startContinuousTracking(2);
    } else if (step === 3 && pathname.includes("/vehicles")) {
      setStep(4);
      stepRef.current = 4;
      startContinuousTracking(4);
    } else if (step === 5 && pathname.includes("/crm")) {
      setStep(6);
      stepRef.current = 6;
      startContinuousTracking(6);
    } else if (
      step === 7 &&
      (pathname.includes("/agenda") || pathname.includes("/calendar"))
    ) {
      setStep(8);
      stepRef.current = 8;
      startContinuousTracking(8);
    }
  }, [pathname, isOpen, step]);

  // Re-lanzar rastreo al cambiar paso o al cambiar ruta (cuando la nueva página termina de renderizarse)
  useEffect(() => {
    if (!isOpen) {
      setTargetRect(null);
      if (trackingTimerRef.current) {
        clearInterval(trackingTimerRef.current);
        trackingTimerRef.current = null;
      }
      return;
    }

    startContinuousTracking(step);

    const handleUpdate = () => {
      if (!isOpenRef.current || stepRef.current === 9) return;
      updateTargetPosition();
    };

    window.addEventListener("resize", handleUpdate);
    // IMPORTANTE: capture=true para recibir eventos scroll de contenedores internos (.contentArea)
    window.addEventListener("scroll", handleUpdate, {
      capture: true,
      passive: true,
    });

    return () => {
      window.removeEventListener("resize", handleUpdate);
      window.removeEventListener("scroll", handleUpdate, {
        capture: true,
      } as any);
    };
  }, [isOpen, step, pathname]);

  // Generar path SVG con regla evenodd para recortar limpiamente el elemento señalado
  const getCutoutPath = () => {
    const W = windowDimensions.width;
    const H = windowDimensions.height;
    const outerPath = `M 0 0 H ${W} V ${H} H 0 Z`;

    if (!targetRect || step === 9) {
      return outerPath;
    }

    const padding = 6;
    const x = Math.max(0, targetRect.left - padding);
    const y = Math.max(0, targetRect.top - padding);
    const w = targetRect.width + padding * 2;
    const h = targetRect.height + padding * 2;
    const r = Math.min(12, Math.floor(Math.min(w, h) / 2));

    // Subpath redondeado en sentido horario
    const innerPath =
      `M ${x + r} ${y} ` +
      `H ${x + w - r} ` +
      `A ${r} ${r} 0 0 1 ${x + w} ${y + r} ` +
      `V ${y + h - r} ` +
      `A ${r} ${r} 0 0 1 ${x + w - r} ${y + h} ` +
      `H ${x + r} ` +
      `A ${r} ${r} 0 0 1 ${x} ${y + h - r} ` +
      `V ${y + r} ` +
      `A ${r} ${r} 0 0 1 ${x + r} ${y} ` +
      `Z`;

    return `${outerPath} ${innerPath}`;
  };

  // Manejo de avance de pasos
  const handleNext = () => {
    isBackNavigationRef.current = false;
    if (step === 1) {
      // Paso 1 -> Ir al Editor Web (Paso 2)
      router.push(getAdminUrl("website"));
      setStep(2);
      stepRef.current = 2;
      startContinuousTracking(2);
    } else if (step === 2) {
      // Paso 2 -> Enfocar pestaña de Inventario en la barra lateral (Paso 3)
      setStep(3);
      stepRef.current = 3;
      startContinuousTracking(3);
    } else if (step === 3) {
      // Paso 3 -> Ir a la página de Inventario de Vehículos (Paso 4)
      router.push(getAdminUrl("vehicles"));
      setStep(4);
      stepRef.current = 4;
      startContinuousTracking(4);
    } else if (step === 4) {
      // Paso 4 -> Enfocar pestaña de Contactos en la barra lateral (Paso 5)
      setStep(5);
      stepRef.current = 5;
      startContinuousTracking(5);
    } else if (step === 5) {
      // Paso 5 -> Ir a la página de Contactos CRM (Paso 6)
      router.push(getAdminUrl("crm"));
      setStep(6);
      stepRef.current = 6;
      startContinuousTracking(6);
    } else if (step === 6) {
      // Paso 6 -> Enfocar pestaña de Agenda en la barra lateral (Paso 7)
      setStep(7);
      stepRef.current = 7;
      startContinuousTracking(7);
    } else if (step === 7) {
      // Paso 7 -> Ir a la página de Agenda (Paso 8)
      router.push(getAdminUrl("agenda"));
      setStep(8);
      stepRef.current = 8;
      startContinuousTracking(8);
    } else if (step === 8) {
      // Paso 8 -> Celebración final (Paso 9)
      setStep(9);
      stepRef.current = 9;
      setTargetRect(null);
    } else if (step === 9) {
      handleClose();
      router.push(getAdminUrl(""));
    }
  };

  // Manejo de retroceso
  const handleBack = () => {
    isBackNavigationRef.current = true;
    if (step === 2) {
      // Paso 2 (Editor Web) -> Regresa al Paso 1 (Dashboard señalando Página Web en menú lateral)
      router.push(getAdminUrl(""));
      setStep(1);
      stepRef.current = 1;
      startContinuousTracking(1);
    } else if (step === 3) {
      // Paso 3 (Sidebar Inventario) -> Regresa al Paso 2 (Editor Web arriba)
      if (!pathname.includes("/website")) {
        router.push(getAdminUrl("website"));
      }
      setStep(2);
      stepRef.current = 2;
      startContinuousTracking(2);
    } else if (step === 4) {
      // Paso 4 (Stock Vehículos) -> Regresa al Paso 3 (Editor Web señalando Inventario en menú lateral)
      router.push(getAdminUrl("website"));
      setStep(3);
      stepRef.current = 3;
      startContinuousTracking(3);
    } else if (step === 5) {
      // Paso 5 (Sidebar Contactos) -> Regresa al Paso 4 (Stock Vehículos arriba)
      if (!pathname.includes("/vehicles")) {
        router.push(getAdminUrl("vehicles"));
      }
      setStep(4);
      stepRef.current = 4;
      startContinuousTracking(4);
    } else if (step === 6) {
      // Paso 6 (Contactos CRM) -> Regresa al Paso 5 (Stock Vehículos señalando Contactos en menú lateral)
      router.push(getAdminUrl("vehicles"));
      setStep(5);
      stepRef.current = 5;
      startContinuousTracking(5);
    } else if (step === 7) {
      // Paso 7 (Sidebar Agenda) -> Regresa al Paso 6 (Contactos CRM arriba)
      if (!pathname.includes("/crm")) {
        router.push(getAdminUrl("crm"));
      }
      setStep(6);
      stepRef.current = 6;
      startContinuousTracking(6);
    } else if (step === 8) {
      // Paso 8 (Calendario Agenda) -> Regresa al Paso 7 (Contactos CRM señalando Agenda en menú lateral)
      router.push(getAdminUrl("crm"));
      setStep(7);
      stepRef.current = 7;
      startContinuousTracking(7);
    } else if (step === 9) {
      // Paso 9 (Celebración) -> Regresa al Paso 8 (Calendario Agenda)
      router.push(getAdminUrl("agenda"));
      setStep(8);
      stepRef.current = 8;
      startContinuousTracking(8);
    }
  };

  // Cerrar y marcar como completado
  const handleClose = () => {
    setIsOpen(false);
    isOpenRef.current = false;
    if (trackingTimerRef.current) {
      clearInterval(trackingTimerRef.current);
      trackingTimerRef.current = null;
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("n_autos_onboarding_completed", "true");
      localStorage.removeItem("n_autos_onboarding_pending");

      if (window.history && window.history.replaceState) {
        const url = new URL(window.location.href);
        url.searchParams.delete("tour");
        url.searchParams.delete("bienvenida");
        window.history.replaceState({}, "", url.toString());
      }
    }
  };

  const handleCopyUrl = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(publicWebUrl);
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2500);
      }
    } catch (_) {}
  };

  if (!isOpen) return null;

  // Posicionamiento inteligente del popover: NUNCA se corta en la parte inferior
  const cardWidth = 360;
  const cardEstimatedHeight = 280;
  const margin = 16;
  const winWidth = windowDimensions.width;
  const winHeight = windowDimensions.height;

  let popoverLeft = Math.max(margin, (winWidth - cardWidth) / 2);
  let popoverTop = Math.max(margin, (winHeight - cardEstimatedHeight) / 2);
  let arrowDirection: "left" | "top" = "left";
  let arrowOffsetY = 24;
  const hasTarget = !!targetRect && step !== 9;

  if (hasTarget && targetRect && typeof window !== "undefined") {
    const spaceRight = winWidth - targetRect.right;
    const targetCenterY = targetRect.top + targetRect.height / 2;

    // Límite superior seguro para que la tarjeta completa quede SIEMPRE dentro de la pantalla
    const maxSafeTop = Math.max(
      margin,
      winHeight - cardEstimatedHeight - margin,
    );

    if (spaceRight >= cardWidth + 24) {
      // Posición a la derecha del elemento (lateral)
      arrowDirection = "left";
      popoverLeft = targetRect.right + 16;
      popoverTop = Math.max(margin, Math.min(maxSafeTop, targetCenterY - 45));
      arrowOffsetY = Math.max(
        12,
        Math.min(cardEstimatedHeight - 50, targetCenterY - popoverTop - 18),
      );
    } else {
      // Posición abajo o arriba si el espacio lateral es estrecho
      popoverLeft = Math.max(
        margin,
        Math.min(winWidth - cardWidth - margin, targetRect.left),
      );

      if (targetRect.bottom + 16 + cardEstimatedHeight <= winHeight - margin) {
        // Cabe abajo
        arrowDirection = "top";
        popoverTop = targetRect.bottom + 16;
      } else {
        // Colocar arriba
        arrowDirection = "left";
        popoverTop = Math.max(
          margin,
          targetRect.top - cardEstimatedHeight - 16,
        );
      }
      arrowOffsetY = 0;
    }
  }

  return (
    <>
      {/* Fondo oscurecedor con recorte transparente (Spotlight Cutout) */}
      <svg
        className={styles.backdropSvg}
        width={windowDimensions.width}
        height={windowDimensions.height}
        viewBox={`0 0 ${windowDimensions.width} ${windowDimensions.height}`}
        preserveAspectRatio="none"
      >
        <path
          d={getCutoutPath()}
          fillRule="evenodd"
          className={styles.backdropPath}
          onClick={handleClose}
        />
      </svg>

      {/* Halo sobre el elemento objetivo (si no es el paso 9 de celebración) */}
      {targetRect && step !== 9 && (
        <div
          className={styles.highlightHalo}
          style={{
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
          }}
        />
      )}

      {/* Zona activa para clic directo sobre pestañas de la barra lateral (Pasos 1, 3, 5, 7) */}
      {targetRect && (step === 1 || step === 3 || step === 5 || step === 7) && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            isBackNavigationRef.current = false;
            if (step === 1) {
              router.push(getAdminUrl("website"));
              setStep(2);
              stepRef.current = 2;
              startContinuousTracking(2);
            } else if (step === 3) {
              router.push(getAdminUrl("vehicles"));
              setStep(4);
              stepRef.current = 4;
              startContinuousTracking(4);
            } else if (step === 5) {
              router.push(getAdminUrl("crm"));
              setStep(6);
              stepRef.current = 6;
              startContinuousTracking(6);
            } else if (step === 7) {
              router.push(getAdminUrl("agenda"));
              setStep(8);
              stepRef.current = 8;
              startContinuousTracking(8);
            }
          }}
          style={{
            position: "fixed",
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
            zIndex: 99996,
            cursor: "pointer",
            background: "transparent",
            borderRadius: "10px",
          }}
          title={
            step === 1
              ? "Haz clic para entrar a Página Web"
              : step === 3
                ? "Haz clic para entrar a Inventario Stock"
                : step === 5
                  ? "Haz clic para entrar a Contactos"
                  : "Haz clic para entrar a Agenda / Turnos"
          }
        />
      )}

      {/* PASO 9: Modal de Celebración Final Centrado */}
      {step === 9 ? (
        <div className={styles.celebrationContainer} onClick={handleClose}>
          <div
            className={styles.celebrationCard}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.cardGlowBar} />

            <div className={styles.celebrationHeader}>
              <div className={styles.celebrationIcon}>
                <Sparkles size={28} />
              </div>
              <span className={styles.stepBadge}>
                ¡Guía Inicial Completada!
              </span>
              <h2 className={styles.celebrationTitle}>
                ¡Todo listo para comenzar, {userName}!
              </h2>
              <p className={styles.celebrationSubtitle}>
                <strong>{agencyName}</strong> ya cuenta con los pilares
                comerciales listos para operar y recibir clientes.
              </p>
            </div>

            <div className={styles.checklist}>
              <div className={styles.checklistItem}>
                <CheckCircle2 size={18} className={styles.checkIcon} />
                <span>
                  <strong>Página Web Oficial:</strong> Ubicación satelital, mapa
                  y contacto directo de WhatsApp listos.
                </span>
              </div>
              <div className={styles.checklistItem}>
                <CheckCircle2 size={18} className={styles.checkIcon} />
                <span>
                  <strong>Inventario Stock:</strong> Carga vehículos con sus
                  fotos, ficha técnica y precios en un clic.
                </span>
              </div>
              <div className={styles.checklistItem}>
                <CheckCircle2 size={18} className={styles.checkIcon} />
                <span>
                  <strong>Contactos y Clientes:</strong> Gestión comercial
                  centralizada de prospectos y leads de WhatsApp.
                </span>
              </div>
              <div className={styles.checklistItem}>
                <CheckCircle2 size={18} className={styles.checkIcon} />
                <span>
                  <strong>Agenda Comercial:</strong> Turnos de visita y reservas
                  coordinadas con tu Google Calendar.
                </span>
              </div>
            </div>

            <div className={styles.celebrationFooter}>
              <button
                type="button"
                onClick={handleNext}
                className={styles.primaryActionBtn}
              >
                <span>¡Comenzar a usar el CRM!</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* PASOS 1 a 8: Cartelito flotante guiado simple y directo */
        <div
          className={styles.popoverContainer}
          style={{
            top: `${popoverTop}px`,
            left: `${popoverLeft}px`,
            flexDirection: arrowDirection === "top" ? "column" : "row",
          }}
        >
          {/* Flecha animada apuntando al objetivo: SOLO si hay un objetivo real iluminado */}
          {hasTarget &&
            (arrowDirection === "left" ? (
              <div
                className={styles.pointerArrow}
                style={{ marginTop: `${arrowOffsetY}px` }}
                title="Sección señalada"
              >
                <ArrowPointerLeftIcon size={20} strokeWidth={2.8} />
              </div>
            ) : (
              <div className={styles.pointerArrowTop} title="Sección señalada">
                <ArrowPointerUpIcon size={20} strokeWidth={2.8} />
              </div>
            ))}

          {/* Cartelito flotante */}
          <div className={styles.tourCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.cardGlowBar} />

            {/* Encabezado */}
            <div className={styles.cardHeader}>
              <div>
                <span className={styles.stepBadge}>Paso {step} de 8</span>
                <h3 className={styles.cardTitle}>
                  {step === 1 && "1. Pestaña Página Web"}
                  {step === 2 && "2. Editor de tu Página Web"}
                  {step === 3 && "3. Pestaña Inventario Stock"}
                  {step === 4 && "4. Stock de Vehículos"}
                  {step === 5 && "5. Pestaña Contactos"}
                  {step === 6 && "6. Contactos y Clientes CRM"}
                  {step === 7 && "7. Pestaña Agenda / Turnos"}
                  {step === 8 && "8. Calendario y Turnos"}
                </h3>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className={styles.closeBtn}
                title="Cerrar guía"
              >
                <X size={14} />
              </button>
            </div>

            {/* Cuerpo instructivo simple con texto claro */}
            <div className={styles.cardBody}>
              {/* PASO 1: BARRA LATERAL - PÁGINA WEB */}
              {step === 1 && (
                <div className={styles.instructionList}>
                  <p className={styles.simpleHighlightText}>
                    ¡Hola <strong>{userName}</strong>! Haz clic en{" "}
                    <strong>"Página Web"</strong> en el menú lateral para
                    ingresar al editor visual de tu automotora.
                  </p>
                </div>
              )}

              {/* PASO 2: DENTRO DE PÁGINA WEB */}
              {step === 2 && (
                <div className={styles.instructionList}>
                  <p className={styles.simpleHighlightText}>
                    Aquí puedes modificar la ubicación, WhatsApp y horarios de
                    visita, así como los textos y apariencia de tu página web.
                  </p>

                  {/* Caja de URL en vivo */}
                  <div className={styles.urlBox}>
                    <span className={styles.urlText} title={publicWebUrl}>
                      {publicWebUrl}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyUrl}
                      className={`${styles.copyBtn} ${copiedUrl ? styles.copyBtnActive : ""}`}
                    >
                      {copiedUrl ? (
                        <>
                          <Check size={12} /> Copiado
                        </>
                      ) : (
                        <>
                          <Copy size={12} /> Copiar
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* PASO 3: BARRA LATERAL - INVENTARIO */}
              {step === 3 && (
                <div className={styles.instructionList}>
                  <p className={styles.simpleHighlightText}>
                    Haz clic en <strong>"Inventario Stock"</strong> en el menú
                    lateral para administrar tu catálogo de coches.
                  </p>
                </div>
              )}

              {/* PASO 4: DENTRO DE VEHÍCULOS */}
              {step === 4 && (
                <div className={styles.instructionList}>
                  <p className={styles.simpleHighlightText}>
                    Aquí puedes presionar <strong>+ Agregar Auto</strong> para
                    cargar tus vehículos con fotos, precios y ficha técnica para
                    publicarlos en tu web.
                  </p>
                </div>
              )}

              {/* PASO 5: BARRA LATERAL - CONTACTOS */}
              {step === 5 && (
                <div className={styles.instructionList}>
                  <p className={styles.simpleHighlightText}>
                    Haz clic en <strong>"Contactos"</strong> en el menú lateral
                    para acceder a la gestión de prospectos y clientes.
                  </p>
                </div>
              )}

              {/* PASO 6: DENTRO DE CONTACTOS CRM */}
              {step === 6 && (
                <div className={styles.instructionList}>
                  <p className={styles.simpleHighlightText}>
                    Aquí centralizas todas las consultas recibidas por WhatsApp
                    y tu web, creando nuevos contactos y organizando el
                    seguimiento de cada comprador.
                  </p>
                </div>
              )}

              {/* PASO 7: BARRA LATERAL - AGENDA */}
              {step === 7 && (
                <div className={styles.instructionList}>
                  <p className={styles.simpleHighlightText}>
                    Haz clic en <strong>"Agenda / Turnos"</strong> en el menú
                    lateral para coordinar visitas al local y citas.
                  </p>
                </div>
              )}

              {/* PASO 8: DENTRO DE AGENDA */}
              {step === 8 && (
                <div className={styles.instructionList}>
                  <p className={styles.simpleHighlightText}>
                    Aquí coordinas visitas al local y puedes sincronizar tu
                    calendario con Google Calendar.
                  </p>
                </div>
              )}
            </div>

            {/* Pie de acciones */}
            <div className={styles.cardFooter}>
              <div className={styles.navButtons}>
                {step > 1 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className={styles.backBtn}
                    title="Paso anterior"
                  >
                    <ArrowLeft size={13} />
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleNext}
                  className={styles.nextBtn}
                >
                  <span>
                    {step === 1 && "Entrar al Editor"}
                    {step === 2 && "Siguiente: Inventario"}
                    {step === 3 && "Entrar a Inventario"}
                    {step === 4 && "Siguiente: Contactos"}
                    {step === 5 && "Entrar a Contactos"}
                    {step === 6 && "Siguiente: Agenda"}
                    {step === 7 && "Entrar a Agenda"}
                    {step === 8 && "Finalizar Guía"}
                  </span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
