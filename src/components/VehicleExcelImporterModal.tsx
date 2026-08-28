"use client";

import React, { useState, useRef } from "react";
import { FileSpreadsheet, Upload, Check, AlertCircle, Download, X, Loader2 } from "lucide-react";
import { createVehicle } from "@/actions/autoActions";

interface VehicleExcelImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ParsedVehicle {
  brand: string;
  model: string;
  year: number;
  kms: number;
  price: number;
  currency: string;
  transmission: "manual" | "automatica";
  fuel: "nafta" | "diesel" | "hibrido" | "electrico";
  color?: string;
  plate?: string;
  description?: string;
}

export default function VehicleExcelImporterModal({
  isOpen,
  onClose,
  onSuccess,
}: VehicleExcelImporterModalProps) {
  const [parsedData, setParsedData] = useState<ParsedVehicle[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [importedCount, setImportedCount] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMsg(null);
    setImportedCount(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const xlsx = await import("xlsx");
        const workbook = xlsx.read(bstr, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

        if (!rows || rows.length < 2) {
          setErrorMsg("El archivo no contiene filas de datos o está vacío.");
          return;
        }

        const headers = rows[0].map((h) => String(h).toLowerCase().trim());

        const brandIdx = headers.findIndex((h) => h.includes("marca") || h.includes("brand"));
        const modelIdx = headers.findIndex((h) => h.includes("modelo") || h.includes("model"));
        const yearIdx = headers.findIndex((h) => h.includes("año") || h.includes("year") || h.includes("anio"));
        const kmsIdx = headers.findIndex((h) => h.includes("km") || h.includes("kilometra"));
        const priceIdx = headers.findIndex((h) => h.includes("precio") || h.includes("valor") || h.includes("price"));
        const currencyIdx = headers.findIndex((h) => h.includes("moneda") || h.includes("curr"));
        const transIdx = headers.findIndex((h) => h.includes("transm") || h.includes("caja"));
        const fuelIdx = headers.findIndex((h) => h.includes("combust") || h.includes("nafta") || h.includes("fuel"));
        const colorIdx = headers.findIndex((h) => h.includes("color"));
        const plateIdx = headers.findIndex((h) => h.includes("matr") || h.includes("patente") || h.includes("chapa"));

        if (brandIdx === -1 || modelIdx === -1 || priceIdx === -1) {
          setErrorMsg("El archivo debe contener al menos las columnas: Marca, Modelo y Precio.");
          return;
        }

        const vehicles: ParsedVehicle[] = [];

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0 || !row[brandIdx]) continue;

          const brand = String(row[brandIdx] || "").trim();
          const model = String(row[modelIdx] || "").trim();
          const year = Number(row[yearIdx]) || new Date().getFullYear();
          const kms = Number(row[kmsIdx]) || 0;
          const price = Number(row[priceIdx]) || 0;
          let currency = String(row[currencyIdx] || "USD").toUpperCase().trim();
          if (currency !== "UYU" && currency !== "USD") currency = "USD";

          let rawTrans = String(row[transIdx] || "").toLowerCase();
          const transmission = rawTrans.includes("auto") ? "automatica" : "manual";

          let rawFuel = String(row[fuelIdx] || "").toLowerCase();
          let fuel: "nafta" | "diesel" | "hibrido" | "electrico" = "nafta";
          if (rawFuel.includes("diesel") || rawFuel.includes("Gasoil")) fuel = "diesel";
          else if (rawFuel.includes("hibrid")) fuel = "hibrido";
          else if (rawFuel.includes("electr")) fuel = "electrico";

          const color = colorIdx !== -1 ? String(row[colorIdx] || "") : "";
          const plate = plateIdx !== -1 ? String(row[plateIdx] || "") : "";

          if (brand && model && price > 0) {
            vehicles.push({
              brand,
              model,
              year,
              kms,
              price,
              currency,
              transmission,
              fuel,
              color,
              plate,
            });
          }
        }

        if (vehicles.length === 0) {
          setErrorMsg("No se encontraron vehículos válidos en las filas importadas.");
        } else {
          setParsedData(vehicles);
        }
      } catch (err: any) {
        console.error("Error al leer el archivo Excel:", err);
        setErrorMsg("Error al procesar el archivo Excel. Revisa el formato de la planilla.");
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleConfirmImport = async () => {
    if (parsedData.length === 0) return;
    setIsProcessing(true);

    let successCount = 0;

    for (const v of parsedData) {
      try {
        const formData = new FormData();
        formData.append("brand", v.brand);
        formData.append("model", v.model);
        formData.append("year", String(v.year));
        formData.append("kms", String(v.kms));
        formData.append("price", String(v.price));
        formData.append("currency", v.currency);
        formData.append("transmission", v.transmission);
        formData.append("fuel", v.fuel);
        formData.append("color", v.color || "");
        formData.append("plate", v.plate || "");
        formData.append("status", "disponible");

        const res = await createVehicle(formData);
        if (res.success) {
          successCount++;
        }
      } catch (e) {
        console.error("Error registrando vehículo desde Excel:", e);
      }
    }

    setIsProcessing(false);
    setImportedCount(successCount);
    setTimeout(() => {
      onSuccess();
      onClose();
    }, 1800);
  };

  const downloadExcelTemplate = async () => {
    const templateData = [
      ["Marca", "Modelo", "Año", "Kms", "Precio", "Moneda", "Transmision", "Combustible", "Color", "Matricula"],
      ["Toyota", "Corolla Cross 1.8", 2022, 35000, 28900, "USD", "Automatica", "Hibrido", "Gris", "SAB1234"],
      ["Chevrolet", "Onix LTZ 1.0T", 2021, 48000, 16500, "USD", "Manual", "Nafta", "Blanco", "SBC5678"],
      ["Volkswagen", "Nivus Highline 200 TSI", 2023, 15000, 25900, "USD", "Automatica", "Nafta", "Negro", "AA123BB"],
    ];

    const xlsx = await import("xlsx");
    const ws = xlsx.utils.aoa_to_sheet(templateData);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Plantilla_Vehiculos");
    xlsx.writeFile(wb, "Plantilla_Importar_Vehiculos_N_Autos.xlsx");
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
          maxWidth: "750px",
          maxHeight: "85vh",
          overflowY: "auto",
          color: "#f8fafc",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
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
            <div style={{ backgroundColor: "rgba(16, 185, 129, 0.2)", color: "#10b981", padding: "0.6rem", borderRadius: "12px" }}>
              <FileSpreadsheet size={24} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800 }}>Importador Masivo de Stock (Excel / CSV)</h3>
              <p style={{ margin: "0.2rem 0 0 0", fontSize: "0.85rem", color: "#94a3b8" }}>
                Cargá todo el catálogo de vehículos de la automotora en segundos.
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "1.75rem 2rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          {/* Plantilla y Carga */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", backgroundColor: "rgba(255,255,255,0.03)", padding: "1.25rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div>
              <h4 style={{ margin: "0 0 0.3rem 0", fontSize: "0.95rem", fontWeight: 700 }}>¿No tenés el formato?</h4>
              <p style={{ margin: 0, fontSize: "0.82rem", color: "#94a3b8" }}>Descargá la plantilla Excel con las columnas requeridas.</p>
            </div>
            <button
              type="button"
              onClick={downloadExcelTemplate}
              style={{
                padding: "0.55rem 1rem",
                borderRadius: "8px",
                border: "1px solid #38bdf8",
                backgroundColor: "rgba(56, 189, 248, 0.1)",
                color: "#38bdf8",
                fontWeight: 700,
                fontSize: "0.82rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              <Download size={16} /> Descargar Plantilla Excel
            </button>
          </div>

          {/* Selector de Archivo */}
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: "2px dashed rgba(56, 189, 248, 0.4)",
              borderRadius: "14px",
              padding: "2rem",
              textAlign: "center",
              cursor: "pointer",
              backgroundColor: "rgba(56, 189, 248, 0.03)",
              transition: "all 0.2s",
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileUpload}
              style={{ display: "none" }}
            />
            <Upload size={32} style={{ color: "#38bdf8", marginBottom: "0.75rem" }} />
            <h4 style={{ margin: "0 0 0.4rem 0", fontSize: "1rem", fontWeight: 700 }}>
              {fileName ? `Archivo seleccionado: ${fileName}` : "Haz clic o arrastra tu archivo Excel aquí"}
            </h4>
            <p style={{ margin: 0, fontSize: "0.82rem", color: "#94a3b8" }}>Formatos soportados: .xlsx, .xls, .csv</p>
          </div>

          {errorMsg && (
            <div style={{ backgroundColor: "rgba(239, 68, 68, 0.15)", border: "1px solid #ef4444", color: "#ef4444", padding: "0.75rem 1rem", borderRadius: "10px", fontSize: "0.88rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <AlertCircle size={18} /> {errorMsg}
            </div>
          )}

          {importedCount !== null && (
            <div style={{ backgroundColor: "rgba(16, 185, 129, 0.15)", border: "1px solid #10b981", color: "#10b981", padding: "0.75rem 1rem", borderRadius: "10px", fontSize: "0.88rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Check size={18} /> ¡Importación exitosa! Se cargaron {importedCount} vehículos al inventario.
            </div>
          )}

          {/* Vista previa de datos parseados */}
          {parsedData.length > 0 && importedCount === null && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700 }}>Vista Previa ({parsedData.length} vehículos detectados)</h4>
              </div>
              <div style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem", textAlign: "left" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#1e293b", color: "#94a3b8" }}>
                      <th style={{ padding: "0.5rem 0.75rem" }}>Marca</th>
                      <th style={{ padding: "0.5rem 0.75rem" }}>Modelo</th>
                      <th style={{ padding: "0.5rem 0.75rem" }}>Año</th>
                      <th style={{ padding: "0.5rem 0.75rem" }}>Precio</th>
                      <th style={{ padding: "0.5rem 0.75rem" }}>Kms</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.map((v, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <td style={{ padding: "0.4rem 0.75rem", fontWeight: 700 }}>{v.brand}</td>
                        <td style={{ padding: "0.4rem 0.75rem" }}>{v.model}</td>
                        <td style={{ padding: "0.4rem 0.75rem" }}>{v.year}</td>
                        <td style={{ padding: "0.4rem 0.75rem", color: "#38bdf8", fontWeight: 700 }}>{v.currency} {v.price.toLocaleString()}</td>
                        <td style={{ padding: "0.4rem 0.75rem" }}>{v.kms.toLocaleString()} km</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            <button type="button" onClick={onClose} style={{ padding: "0.6rem 1.25rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)", backgroundColor: "transparent", color: "#fff", cursor: "pointer" }}>
              Cancelar
            </button>
            <button
              type="button"
              disabled={parsedData.length === 0 || isProcessing}
              onClick={handleConfirmImport}
              style={{
                padding: "0.6rem 1.5rem",
                borderRadius: "8px",
                border: "none",
                backgroundColor: parsedData.length > 0 ? "#10b981" : "rgba(128,128,128,0.3)",
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.88rem",
                cursor: parsedData.length > 0 ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              {isProcessing && <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />}
              Confirmar Importación ({parsedData.length})
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
