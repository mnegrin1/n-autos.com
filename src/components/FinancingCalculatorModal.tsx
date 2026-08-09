"use client";

import React, { useState, useMemo } from "react";
import {
  calculateUruguayFinancing,
  URUGUAY_BANK_PRESETS,
  BankPreset,
  FinancingCalculationResult,
} from "@/lib/uruguayFinancing";
import {
  Calculator,
  X,
  Building2,
  Percent,
  Calendar,
  DollarSign,
  Info,
  Copy,
  Check,
  Printer,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
} from "lucide-react";

interface FinancingCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: {
    brand: string;
    model: string;
    year: number;
    price: number;
    currency?: string;
  };
}

export default function FinancingCalculatorModal({
  isOpen,
  onClose,
  vehicle,
}: FinancingCalculatorModalProps) {
  const [selectedBankId, setSelectedBankId] = useState<string>("santander_usd");
  const [downPaymentPercent, setDownPaymentPercent] = useState<number>(30);
  const [termMonths, setTermMonths] = useState<number>(36);
  const [customTea, setCustomTea] = useState<number | null>(null);
  const [showAmortizationTable, setShowAmortizationTable] = useState<boolean>(false);
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);

  const currentBank: BankPreset = useMemo(() => {
    return (
      URUGUAY_BANK_PRESETS.find((b) => b.id === selectedBankId) ||
      URUGUAY_BANK_PRESETS[0]
    );
  }, [selectedBankId]);

  const activeTea = customTea !== null ? customTea : currentBank.defaultTea;

  const result: FinancingCalculationResult = useMemo(() => {
    return calculateUruguayFinancing({
      vehiclePrice: vehicle.price || 15000,
      downPaymentPercent,
      termMonths,
      tea: activeTea,
      currency: vehicle.currency || currentBank.currency,
      adminFeeFlat: currentBank.adminFeeFlat,
      adminFeePercent: currentBank.adminFeePercent,
      lifeInsuranceMonthlyPercent: currentBank.lifeInsuranceMonthlyPercent,
      bankName: currentBank.name,
    });
  }, [vehicle.price, vehicle.currency, downPaymentPercent, termMonths, activeTea, currentBank]);

  if (!isOpen) return null;

  const handleBankChange = (bankId: string) => {
    setSelectedBankId(bankId);
    const bank = URUGUAY_BANK_PRESETS.find((b) => b.id === bankId);
    if (bank) {
      setCustomTea(bank.defaultTea);
      if (downPaymentPercent < bank.minDownPaymentPercent) {
        setDownPaymentPercent(bank.minDownPaymentPercent);
      }
    }
  };

  const copyWhatsAppQuote = () => {
    const text = `🚗 *Cotización de Financiación - N-Autos*
📌 *Vehículo:* ${vehicle.brand} ${vehicle.model} (${vehicle.year})
💰 *Precio Total:* ${result.currency} ${result.vehiclePrice.toLocaleString()}

🟢 *Entrega Inicial (${result.downPaymentPercent}%):* ${result.currency} ${result.downPayment.toLocaleString()}
🏦 *Financiado en:* ${result.termMonths} cuotas de *${result.currency} ${result.monthlyPayment.toLocaleString()} / mes*
📊 *Tasa Anual (TEA BCU):* ${result.tea}% (${result.bankName})
💼 *Ingreso Mínimo Familiar Requerido (Estimado):* ${result.currency} ${result.minRequiredIncomeMonthly.toLocaleString()}

*Requisitos BCU:*
• Cédula de Identidad Vigente
• Constancia de domicilio (UTE, OSE, Antel)
• 3 últimos recibos de sueldo / Constancia de ingresos
• Antigüedad laboral mínima de 6 meses`;

    navigator.clipboard.writeText(text);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 3000);
  };

  const printFinancingQuote = () => {
    window.print();
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(6px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        style={{
          backgroundColor: "#0f172a",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          borderRadius: "20px",
          width: "100%",
          maxWidth: "850px",
          maxHeight: "90vh",
          overflowY: "auto",
          color: "#f8fafc",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "1.5rem 2rem",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                backgroundColor: "rgba(37, 99, 235, 0.2)",
                color: "#3b82f6",
                padding: "0.6rem",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
              }}
            >
              <Calculator size={24} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800 }}>
                Simulador de Financiación Bancaria (Uruguay / BCU)
              </h3>
              <p style={{ margin: "0.2rem 0 0 0", fontSize: "0.85rem", color: "#94a3b8" }}>
                {vehicle.brand} {vehicle.model} ({vehicle.year}) — Precio:{" "}
                <strong style={{ color: "#38bdf8" }}>
                  {result.currency} {vehicle.price.toLocaleString()}
                </strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              padding: "0.4rem",
              borderRadius: "8px",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "1.75rem 2rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          {/* Selección de Banco / Plan */}
          <div>
            <label
              style={{
                fontSize: "0.82rem",
                fontWeight: 700,
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                marginBottom: "0.6rem",
              }}
            >
              <Building2 size={16} style={{ color: "#38bdf8" }} /> Entidad Bancaria / Financiera en Uruguay
            </label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "0.75rem",
              }}
            >
              {URUGUAY_BANK_PRESETS.map((b) => {
                const isSelected = b.id === selectedBankId;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => handleBankChange(b.id)}
                    style={{
                      padding: "0.85rem 1rem",
                      borderRadius: "12px",
                      border: isSelected ? "2px solid #3b82f6" : "1px solid rgba(255, 255, 255, 0.1)",
                      backgroundColor: isSelected ? "rgba(59, 130, 246, 0.15)" : "rgba(255, 255, 255, 0.03)",
                      color: "#fff",
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: "0.9rem", color: isSelected ? "#38bdf8" : "#f8fafc" }}>
                      {b.name}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: "0.2rem" }}>
                      TEA: {b.defaultTea}% | Hasta {b.maxTermMonths}m
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ajuste de Variables (Entrega Inicial, Plazo, TEA) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "1.25rem",
              backgroundColor: "rgba(255, 255, 255, 0.03)",
              padding: "1.25rem",
              borderRadius: "14px",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            {/* Entrega Inicial */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#94a3b8" }}>
                  Entrega Inicial ({downPaymentPercent}%)
                </span>
                <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#4ade80" }}>
                  {result.currency} {result.downPayment.toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min={currentBank.minDownPaymentPercent}
                max={80}
                step={5}
                value={downPaymentPercent}
                onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#3b82f6", cursor: "pointer" }}
              />
              <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                Mínimo bancario requerido: {currentBank.minDownPaymentPercent}%
              </span>
            </div>

            {/* Plazo en Meses */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#94a3b8" }}>Plazo de Pago</span>
                <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#38bdf8" }}>
                  {termMonths} Meses ({Math.round(termMonths / 12 * 10) / 10} años)
                </span>
              </div>
              <select
                value={termMonths}
                onChange={(e) => setTermMonths(Number(e.target.value))}
                style={{
                  width: "100%",
                  padding: "0.6rem",
                  borderRadius: "8px",
                  backgroundColor: "#1e293b",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                }}
              >
                {[12, 18, 24, 36, 48, 60].filter(m => m <= currentBank.maxTermMonths).map((m) => (
                  <option key={m} value={m}>
                    {m} Cuotas Mensuales
                  </option>
                ))}
              </select>
            </div>

            {/* Tasa Efectiva Anual (TEA %) */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#94a3b8" }}>
                  Tasa Anual (TEA BCU)
                </span>
                <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#f59e0b" }}>
                  {activeTea}%
                </span>
              </div>
              <input
                type="number"
                step="0.1"
                min="0"
                max="50"
                value={activeTea}
                onChange={(e) => setCustomTea(Number(e.target.value))}
                style={{
                  width: "100%",
                  padding: "0.55rem",
                  borderRadius: "8px",
                  backgroundColor: "#1e293b",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                }}
              />
              <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                Ajustable según convenio automotora
              </span>
            </div>
          </div>

          {/* Resultado Principal: Cuota Calculada */}
          <div
            style={{
              background: "linear-gradient(135deg, #1e3a8a 0%, #1e1b4b 100%)",
              border: "1px solid #3b82f6",
              borderRadius: "16px",
              padding: "1.5rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1rem",
              boxShadow: "0 10px 25px -5px rgba(30, 58, 138, 0.4)",
            }}
          >
            <div>
              <span
                style={{
                  fontSize: "0.78rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#93c5fd",
                  fontWeight: 800,
                }}
              >
                ESTIMACIÓN DE CUOTA MENSUAL (SISTEMA FRANCÉS)
              </span>
              <div style={{ fontSize: "2.4rem", fontWeight: 900, color: "#ffffff", margin: "0.2rem 0" }}>
                {result.currency} {result.monthlyPayment.toLocaleString()}{" "}
                <span style={{ fontSize: "1rem", fontWeight: 500, color: "#93c5fd" }}>/ mes</span>
              </div>
              <span style={{ fontSize: "0.82rem", color: "#cbd5e1" }}>
                Monto Financiado: <strong>{result.currency} {result.financedAmount.toLocaleString()}</strong> | Gastos adm: {result.currency} {result.totalAdminFees}
              </span>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ backgroundColor: "rgba(255, 255, 255, 0.1)", padding: "0.6rem 1rem", borderRadius: "10px" }}>
                <span style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 700 }}>INGRESO MÍNIMO NÚCLEO FAMILIAR</span>
                <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#4ade80" }}>
                  {result.currency} {result.minRequiredIncomeMonthly.toLocaleString()}
                </div>
                <span style={{ fontSize: "0.7rem", color: "#cbd5e1" }}>Normativa BCU: Cuota ≤ 30% ingreso</span>
              </div>
            </div>
          </div>

          {/* Desglose del Proceso de Cálculo */}
          <div>
            <h4 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "0.75rem", color: "#f8fafc" }}>
              Desglose del Proceso de Cálculo Bancario
            </h4>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "1rem",
              }}
            >
              <div style={{ backgroundColor: "rgba(255,255,255,0.03)", padding: "1rem", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)" }}>
                <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>1. Valor Vehículo</span>
                <div style={{ fontSize: "1.1rem", fontWeight: 800 }}>{result.currency} {result.vehiclePrice.toLocaleString()}</div>
              </div>
              <div style={{ backgroundColor: "rgba(255,255,255,0.03)", padding: "1rem", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)" }}>
                <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>2. Entrega Inicial</span>
                <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#4ade80" }}>- {result.currency} {result.downPayment.toLocaleString()}</div>
              </div>
              <div style={{ backgroundColor: "rgba(255,255,255,0.03)", padding: "1rem", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)" }}>
                <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>3. Capital a Financiar</span>
                <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#38bdf8" }}>{result.currency} {result.financedAmount.toLocaleString()}</div>
              </div>
              <div style={{ backgroundColor: "rgba(255,255,255,0.03)", padding: "1rem", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)" }}>
                <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>4. Total Intereses Pagados</span>
                <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#f59e0b" }}>{result.currency} {result.totalInterestPaid.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Toggle Tabla de Amortización */}
          <div>
            <button
              type="button"
              onClick={() => setShowAmortizationTable(!showAmortizationTable)}
              style={{
                background: "none",
                border: "none",
                color: "#38bdf8",
                fontWeight: 700,
                fontSize: "0.88rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: 0,
              }}
            >
              {showAmortizationTable ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              {showAmortizationTable ? "Ocultar Tabla de Amortización Francés" : "Ver Tabla de Amortización Mes a Mes"}
            </button>

            {showAmortizationTable && (
              <div style={{ marginTop: "1rem", maxHeight: "250px", overflowY: "auto", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem", textAlign: "left" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#1e293b", color: "#94a3b8" }}>
                      <th style={{ padding: "0.5rem 0.75rem" }}>Mes</th>
                      <th style={{ padding: "0.5rem 0.75rem" }}>Cuota Total</th>
                      <th style={{ padding: "0.5rem 0.75rem" }}>Capital</th>
                      <th style={{ padding: "0.5rem 0.75rem" }}>Interés</th>
                      <th style={{ padding: "0.5rem 0.75rem" }}>Saldo Residual</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.amortizationTable.map((row) => (
                      <tr key={row.month} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <td style={{ padding: "0.4rem 0.75rem" }}>{row.month}</td>
                        <td style={{ padding: "0.4rem 0.75rem", fontWeight: 700 }}>{result.currency} {row.payment.toLocaleString()}</td>
                        <td style={{ padding: "0.4rem 0.75rem", color: "#4ade80" }}>{result.currency} {row.principal.toLocaleString()}</td>
                        <td style={{ padding: "0.4rem 0.75rem", color: "#f59e0b" }}>{result.currency} {row.interest.toLocaleString()}</td>
                        <td style={{ padding: "0.4rem 0.75rem", opacity: 0.7 }}>{result.currency} {row.remainingBalance.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Botones de Acción */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "1rem",
              paddingTop: "1rem",
              borderTop: "1px solid rgba(255, 255, 255, 0.1)",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={copyWhatsAppQuote}
              style={{
                padding: "0.7rem 1.25rem",
                borderRadius: "10px",
                border: "none",
                backgroundColor: "#25d366",
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.88rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              {copiedNotification ? <Check size={18} /> : <Copy size={18} />}
              {copiedNotification ? "¡Cotización Copiada!" : "Copiar Cotización para WhatsApp"}
            </button>

            <button
              type="button"
              onClick={printFinancingQuote}
              style={{
                padding: "0.7rem 1.25rem",
                borderRadius: "10px",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.88rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <Printer size={18} /> Imprimir Cotización
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
