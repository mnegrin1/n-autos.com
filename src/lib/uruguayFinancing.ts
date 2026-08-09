/**
 * Módulo de Cálculo de Financiación Automotriz según Normativa y Sistema Bancario de Uruguay (BCU).
 */

export interface BankPreset {
  id: string;
  name: string;
  currency: "USD" | "UYU" | "UI";
  defaultTea: number; // Tasa Efectiva Anual en % (ej. 8.5)
  maxTermMonths: number; // Ej. 60 meses
  minDownPaymentPercent: number; // Ej. 20%
  adminFeeFlat: number; // Gastos administrativos fijos en la moneda
  adminFeePercent: number; // Gastos sobre monto financiado (ej. 1%)
  lifeInsuranceMonthlyPercent: number; // Seguro sobre saldo deudor (ej. 0.08%)
  description: string;
}

export const URUGUAY_BANK_PRESETS: BankPreset[] = [
  {
    id: "santander_usd",
    name: "Santander CrediAutos (USD)",
    currency: "USD",
    defaultTea: 8.5,
    maxTermMonths: 60,
    minDownPaymentPercent: 20,
    adminFeeFlat: 150,
    adminFeePercent: 1.0,
    lifeInsuranceMonthlyPercent: 0.08,
    description: "Financiación hasta el 80% en dólares a sola firma.",
  },
  {
    id: "scotiabank_usd",
    name: "Scotiabank AutoCrédito (USD)",
    currency: "USD",
    defaultTea: 8.9,
    maxTermMonths: 60,
    minDownPaymentPercent: 20,
    adminFeeFlat: 180,
    adminFeePercent: 1.0,
    lifeInsuranceMonthlyPercent: 0.09,
    description: "Financiación ágil en dólares con aprobación rápida.",
  },
  {
    id: "bbva_usd",
    name: "BBVA Crédito Auto (USD)",
    currency: "USD",
    defaultTea: 8.2,
    maxTermMonths: 60,
    minDownPaymentPercent: 20,
    adminFeeFlat: 160,
    adminFeePercent: 0.8,
    lifeInsuranceMonthlyPercent: 0.08,
    description: "Tasa preferencial para 0km y usados seleccionados.",
  },
  {
    id: "santander_ui",
    name: "Santander CrediAutos (UI / Pesos)",
    currency: "UI",
    defaultTea: 12.5,
    maxTermMonths: 60,
    minDownPaymentPercent: 30,
    adminFeeFlat: 200,
    adminFeePercent: 1.2,
    lifeInsuranceMonthlyPercent: 0.1,
    description: "Cuota fija en Unidades Indexadas reajustable por inflación.",
  },
  {
    id: "financiera_directa",
    name: "Financiación Propia de la Automotora",
    currency: "USD",
    defaultTea: 12.0,
    maxTermMonths: 36,
    minDownPaymentPercent: 50,
    adminFeeFlat: 100,
    adminFeePercent: 0.0,
    lifeInsuranceMonthlyPercent: 0.0,
    description: "Financiación directa de la automotora a sola firma o con prenda.",
  },
];

export interface AmortizationRow {
  month: number;
  payment: number;
  interest: number;
  principal: number;
  insurance: number;
  remainingBalance: number;
}

export interface FinancingCalculationResult {
  vehiclePrice: number;
  downPayment: number;
  downPaymentPercent: number;
  financedAmount: number;
  totalAdminFees: number;
  amountToAmortize: number;
  currency: string;
  tea: number;
  monthlyRate: number;
  termMonths: number;
  monthlyPayment: number;
  totalInterestPaid: number;
  totalPaidOverTerm: number;
  minRequiredIncomeMonthly: number;
  amortizationTable: AmortizationRow[];
  bankName: string;
}

/**
 * Calcula la financiación automotriz mediante el Sistema de Amortización Francés
 * cumpliendo con los estándares de la Ley de Inclusión Financiera y Crédito al Consumo BCU.
 */
export function calculateUruguayFinancing(params: {
  vehiclePrice: number;
  downPaymentPercent?: number;
  downPaymentAmount?: number;
  termMonths: number;
  tea: number;
  currency?: string;
  adminFeeFlat?: number;
  adminFeePercent?: number;
  lifeInsuranceMonthlyPercent?: number;
  bankName?: string;
}): FinancingCalculationResult {
  const {
    vehiclePrice,
    termMonths,
    tea,
    currency = "USD",
    adminFeeFlat = 150,
    adminFeePercent = 1.0,
    lifeInsuranceMonthlyPercent = 0.08,
    bankName = "Banco Seleccionado",
  } = params;

  // Entrega Inicial
  let downPayment = 0;
  let downPaymentPercent = 0;

  if (params.downPaymentAmount !== undefined && params.downPaymentAmount >= 0) {
    downPayment = Math.min(params.downPaymentAmount, vehiclePrice);
    downPaymentPercent = Math.round((downPayment / (vehiclePrice || 1)) * 100);
  } else {
    downPaymentPercent = params.downPaymentPercent !== undefined ? params.downPaymentPercent : 20;
    downPayment = Math.round(vehiclePrice * (downPaymentPercent / 100));
  }

  const financedAmount = Math.max(0, vehiclePrice - downPayment);
  const totalAdminFees = adminFeeFlat + (financedAmount * (adminFeePercent / 100));
  const amountToAmortize = financedAmount + totalAdminFees;

  // Tasa mensual efectiva a partir de TEA: r = (1 + TEA/100)^(1/12) - 1
  const monthlyRate = Math.pow(1 + tea / 100, 1 / 12) - 1;

  // Cuota base Francés: C = P * [r(1+r)^n] / [(1+r)^n - 1]
  let baseMonthlyPayment = 0;
  if (monthlyRate > 0 && termMonths > 0) {
    const compound = Math.pow(1 + monthlyRate, termMonths);
    baseMonthlyPayment = amountToAmortize * ((monthlyRate * compound) / (compound - 1));
  } else if (termMonths > 0) {
    baseMonthlyPayment = amountToAmortize / termMonths;
  }

  // Tabla de Amortización
  let currentBalance = amountToAmortize;
  const amortizationTable: AmortizationRow[] = [];
  let totalInterestPaid = 0;
  let totalInsurancePaid = 0;

  for (let month = 1; month <= termMonths; month++) {
    const interestPayment = currentBalance * monthlyRate;
    const insurancePayment = currentBalance * (lifeInsuranceMonthlyPercent / 100);
    const principalPayment = baseMonthlyPayment - interestPayment;

    currentBalance = Math.max(0, currentBalance - principalPayment);
    totalInterestPaid += interestPayment;
    totalInsurancePaid += insurancePayment;

    amortizationTable.push({
      month,
      payment: Math.round(baseMonthlyPayment + insurancePayment),
      interest: Math.round(interestPayment),
      principal: Math.round(principalPayment),
      insurance: Math.round(insurancePayment),
      remainingBalance: Math.round(currentBalance),
    });
  }

  const averageMonthlyInsurance = termMonths > 0 ? totalInsurancePaid / termMonths : 0;
  const finalMonthlyPayment = Math.round(baseMonthlyPayment + averageMonthlyInsurance);
  const totalPaidOverTerm = Math.round(downPayment + (finalMonthlyPayment * termMonths));

  // Requisito BCU: La cuota no debe superar el 30% del ingreso líquido del núcleo familiar
  const minRequiredIncomeMonthly = Math.round(finalMonthlyPayment / 0.3);

  return {
    vehiclePrice,
    downPayment,
    downPaymentPercent,
    financedAmount,
    totalAdminFees: Math.round(totalAdminFees),
    amountToAmortize: Math.round(amountToAmortize),
    currency,
    tea,
    monthlyRate,
    termMonths,
    monthlyPayment: finalMonthlyPayment,
    totalInterestPaid: Math.round(totalInterestPaid),
    totalPaidOverTerm,
    minRequiredIncomeMonthly,
    amortizationTable,
    bankName,
  };
}
