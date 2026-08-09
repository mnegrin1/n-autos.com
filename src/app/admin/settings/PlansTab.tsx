"use client";

import React, { useState, useEffect } from "react";
import { getTenantSession, switchTenantPlan, subscribeTenantSession, TenantSession } from "@/lib/tenantStore";
import { getPlans, PaymentPlan } from "@/lib/plansStore";
import { Sparkles, Check, CheckCircle2, Zap, Layers } from "lucide-react";
import { createMercadoPagoSubscription, createPayPalSubscription } from "@/actions/billingActions";

export default function PlansTab() {
  const [tenantSession, setTenantSession] = useState<TenantSession>(getTenantSession());
  const [plans, setPlans] = useState<PaymentPlan[]>([]);
  const [isYearly, setIsYearly] = useState(tenantSession.billingCycle === "yearly");
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    setPlans(getPlans());
    const unsubscribe = subscribeTenantSession((updated) => {
      setTenantSession(updated);
    });
    return () => unsubscribe();
  }, []);

  const handleSimulateSwitchPlan = (planId: string) => {
    const updated = switchTenantPlan(planId);
    setNotification(`¡Simulación exitosa! La automotora '${updated.agencyName}' opera bajo el Plan ${updated.planName}.`);
    setTimeout(() => setNotification(null), 5000);
  };

  const activePlan = plans.find((p) => p.id === tenantSession.planId) || plans[1] || {
    maxVehiclesCount: 20,
    maxUsersCount: 2,
    emailLimit: 500
  };

  const maxVehicles = activePlan.maxVehiclesCount || 20;
  const maxUsers = activePlan.maxUsersCount || 2;
  const vehiclePercentage = Math.min(100, Math.round((tenantSession.usedVehicles / maxVehicles) * 100));
  const userPercentage = Math.min(100, Math.round((tenantSession.usedUsers / maxUsers) * 100));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Resumen del Plan Actual */}
      <div
        style={{
          background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
          color: "#fff",
          borderRadius: "16px",
          padding: "2rem",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.3)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1.5rem", position: "relative", zIndex: 2 }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", backgroundColor: "rgba(56, 189, 248, 0.15)", color: "#38bdf8", padding: "0.35rem 0.85rem", borderRadius: "20px", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.75rem" }}>
              <Sparkles size={15} /> GESTIÓN DE PLANES Y LÍMITES MULTITENANT
            </div>
            <h2 style={{ fontSize: "1.75rem", fontWeight: 800, margin: "0 0 0.4rem 0" }}>
              {tenantSession.agencyName}
            </h2>
            <p style={{ color: "#94a3b8", fontSize: "0.9rem", margin: 0 }}>
              Subdominio: <strong style={{ color: "#f8fafc" }}>{tenantSession.subdomain}.n-sistemas.com</strong> | Estado: <span style={{ color: "#4ade80", fontWeight: 700 }}>Activo en Supabase DB</span>
            </p>
          </div>

          <div style={{ backgroundColor: "rgba(255, 255, 255, 0.1)", backdropFilter: "blur(10px)", border: "1px solid rgba(255, 255, 255, 0.15)", padding: "1.25rem 1.5rem", borderRadius: "14px", minWidth: "200px" }}>
            <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#94a3b8", fontWeight: 700 }}>PLAN ACTIVO</span>
            <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#38bdf8", margin: "0.2rem 0" }}>
              Plan {tenantSession.planName}
            </div>
            <span style={{ fontSize: "0.8rem", color: "#cbd5e1" }}>
              Ciclo: {tenantSession.billingCycle === "yearly" ? "Anual (-20%)" : "Mensual"}
            </span>
          </div>
        </div>
      </div>

      {notification && (
        <div
          style={{
            backgroundColor: "rgba(16, 185, 129, 0.12)",
            border: "1px solid #10b981",
            color: "#10b981",
            padding: "0.9rem 1.25rem",
            borderRadius: "12px",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            fontSize: "0.9rem"
          }}
        >
          <CheckCircle2 size={18} />
          {notification}
        </div>
      )}

      {/* Tarjetas de Medidores de Consumo */}
      <div>
        <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "1rem", color: "var(--text-color)" }}>
          Consumo de Recursos & Límites de Cuota
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.25rem" }}>
          {/* Vehículos */}
          <div style={{ backgroundColor: "var(--surface-hover)", border: "1px solid var(--border-color)", borderRadius: "14px", padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, opacity: 0.7 }}>INVENTARIO STOCK</span>
              <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "var(--primary)" }}>{vehiclePercentage}%</span>
            </div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: "0.5rem" }}>
              {tenantSession.usedVehicles} <span style={{ fontSize: "0.9rem", opacity: 0.6, fontWeight: 500 }}>/ {maxVehicles === 999999 ? "∞" : maxVehicles} Vehículos</span>
            </div>
            <div style={{ width: "100%", height: "8px", backgroundColor: "rgba(128,128,128,0.15)", borderRadius: "8px", overflow: "hidden", marginBottom: "0.5rem" }}>
              <div style={{ width: `${vehiclePercentage}%`, height: "100%", backgroundColor: vehiclePercentage > 85 ? "#ef4444" : "var(--primary)", transition: "width 0.4s" }} />
            </div>
            <span style={{ fontSize: "0.78rem", opacity: 0.7 }}>
              {maxVehicles === 999999 ? "Unidades ilimitadas" : `Quedan ${Math.max(0, maxVehicles - tenantSession.usedVehicles)} cupos disponibles`}
            </span>
          </div>

          {/* Usuarios */}
          <div style={{ backgroundColor: "var(--surface-hover)", border: "1px solid var(--border-color)", borderRadius: "14px", padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, opacity: 0.7 }}>USUARIOS DE VENTAS</span>
              <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "#10b981" }}>{userPercentage}%</span>
            </div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: "0.5rem" }}>
              {tenantSession.usedUsers} <span style={{ fontSize: "0.9rem", opacity: 0.6, fontWeight: 500 }}>/ {maxUsers === 999999 ? "∞" : maxUsers} Licencias</span>
            </div>
            <div style={{ width: "100%", height: "8px", backgroundColor: "rgba(128,128,128,0.15)", borderRadius: "8px", overflow: "hidden", marginBottom: "0.5rem" }}>
              <div style={{ width: `${userPercentage}%`, height: "100%", backgroundColor: "#10b981", transition: "width 0.4s" }} />
            </div>
            <span style={{ fontSize: "0.78rem", opacity: 0.7 }}>
              Admin: {tenantSession.adminEmail}
            </span>
          </div>

          {/* Emails */}
          <div style={{ backgroundColor: "var(--surface-hover)", border: "1px solid var(--border-color)", borderRadius: "14px", padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, opacity: 0.7 }}>EMAIL BROADCASTS (MES)</span>
              <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "#a855f7" }}>24%</span>
            </div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: "0.5rem" }}>
              {tenantSession.usedEmailsMonth} <span style={{ fontSize: "0.9rem", opacity: 0.6, fontWeight: 500 }}>/ 500 Envíos</span>
            </div>
            <div style={{ width: "100%", height: "8px", backgroundColor: "rgba(128,128,128,0.15)", borderRadius: "8px", overflow: "hidden", marginBottom: "0.5rem" }}>
              <div style={{ width: "24%", height: "100%", backgroundColor: "#a855f7" }} />
            </div>
            <span style={{ fontSize: "0.78rem", opacity: 0.7 }}>
              Reinicio el 1º del mes
            </span>
          </div>
        </div>
      </div>

      {/* Selección de Planes */}
      <div style={{ marginTop: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: "0 0 0.25rem 0", color: "var(--text-color)" }}>
              Planes Disponibles & Simulación 1-Clic
            </h3>
            <p style={{ color: "var(--text-color)", opacity: 0.7, margin: 0, fontSize: "0.88rem" }}>
              Selecciona cualquier plan para cambiar los límites del concesionario al instante.
            </p>
          </div>

          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", backgroundColor: "var(--surface-hover)", padding: "0.3rem", borderRadius: "30px", border: "1px solid var(--border-color)" }}>
            <button
              type="button"
              onClick={() => setIsYearly(false)}
              style={{
                padding: "0.35rem 0.85rem",
                borderRadius: "20px",
                border: "none",
                backgroundColor: !isYearly ? "var(--primary)" : "transparent",
                color: !isYearly ? "#fff" : "var(--text-color)",
                fontWeight: 700,
                fontSize: "0.8rem",
                cursor: "pointer"
              }}
            >
              Mensual
            </button>
            <button
              type="button"
              onClick={() => setIsYearly(true)}
              style={{
                padding: "0.35rem 0.85rem",
                borderRadius: "20px",
                border: "none",
                backgroundColor: isYearly ? "var(--primary)" : "transparent",
                color: isYearly ? "#fff" : "var(--text-color)",
                fontWeight: 700,
                fontSize: "0.8rem",
                cursor: "pointer"
              }}
            >
              Anual (-20%)
            </button>
          </div>
        </div>

        {/* Tarjetas de Planes */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem" }}>
          {plans.map((p) => {
            const isCurrent = p.id === tenantSession.planId;
            const price = isYearly ? p.priceYearly : p.priceMonthly;
            return (
              <div
                key={p.id}
                style={{
                  backgroundColor: isCurrent ? "var(--surface-hover)" : "var(--bg-color)",
                  border: isCurrent ? "2px solid var(--primary)" : "1px solid var(--border-color)",
                  borderRadius: "14px",
                  padding: "1.25rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  position: "relative",
                  boxShadow: isCurrent ? "0 4px 16px rgba(37, 99, 235, 0.15)" : "none"
                }}
              >
                {isCurrent && (
                  <span style={{ position: "absolute", top: "-10px", right: "16px", backgroundColor: "var(--primary)", color: "#fff", fontSize: "0.65rem", fontWeight: 800, padding: "2px 8px", borderRadius: "10px", textTransform: "uppercase" }}>
                    PLAN ACTUAL
                  </span>
                )}

                <div>
                  <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "1.1rem", fontWeight: 800 }}>{p.name}</h4>
                  <div style={{ fontSize: "1.6rem", fontWeight: 900, marginBottom: "1rem", color: "var(--text-color)" }}>
                    ${price} <span style={{ fontSize: "0.8rem", opacity: 0.6, fontWeight: 500 }}>/mes</span>
                  </div>

                  <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.25rem 0", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <li style={{ fontSize: "0.82rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <Check size={14} style={{ color: "var(--primary)", flexShrink: 0 }} />
                      <span>{p.maxVehicles}</span>
                    </li>
                    <li style={{ fontSize: "0.82rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <Check size={14} style={{ color: "var(--primary)", flexShrink: 0 }} />
                      <span>{p.maxUsers}</span>
                    </li>
                    <li style={{ fontSize: "0.82rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <Check size={14} style={{ color: "var(--primary)", flexShrink: 0 }} />
                      <span>MercadoLibre Auto-Sync</span>
                    </li>
                  </ul>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={async () => {
                      if (isCurrent) return;
                      const res = await createMercadoPagoSubscription(tenantSession.agencyId || "demo-agency", p.id as any);
                      if (res.success && res.init_point) {
                        window.open(res.init_point, "_blank");
                      } else {
                        handleSimulateSwitchPlan(p.id);
                      }
                    }}
                    disabled={isCurrent}
                    style={{
                      width: "100%",
                      padding: "0.6rem",
                      borderRadius: "8px",
                      border: "none",
                      backgroundColor: isCurrent ? "rgba(128,128,128,0.2)" : "#009ee3",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      cursor: isCurrent ? "default" : "pointer",
                      opacity: isCurrent ? 0.6 : 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.4rem"
                    }}
                  >
                    {isCurrent ? "Plan Activo" : `Pagar con MercadoPago (UYU)`}
                  </button>

                  {!isCurrent && (
                    <button
                      type="button"
                      onClick={async () => {
                        const res = await createPayPalSubscription(tenantSession.agencyId || "demo-agency", p.id as any);
                        if (res.success && res.approval_url) {
                          window.open(res.approval_url, "_blank");
                        } else {
                          handleSimulateSwitchPlan(p.id);
                        }
                      }}
                      style={{
                        width: "100%",
                        padding: "0.5rem",
                        borderRadius: "8px",
                        border: "1px solid #003087",
                        backgroundColor: "#ffc439",
                        color: "#003087",
                        fontWeight: 700,
                        fontSize: "0.8rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.4rem"
                      }}
                    >
                      Pagar con PayPal (USD)
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
