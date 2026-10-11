export interface CountryInfo {
  code: string;       // ISO 2-letter (e.g. "UY")
  name: string;       // Nombre común (e.g. "Uruguay")
  dialCode: string;   // Prefijo numérico sin + (e.g. "598")
  flag: string;       // Emoji de bandera (e.g. "🇺🇾")
  placeholder: string;// Formato sugerido (e.g. "99 123 456")
}

export const COUNTRIES_LIST: CountryInfo[] = [
  { code: "UY", name: "Uruguay", dialCode: "598", flag: "🇺🇾", placeholder: "99 123 456" },
  { code: "AR", name: "Argentina", dialCode: "54", flag: "🇦🇷", placeholder: "9 11 1234 5678" },
  { code: "BR", name: "Brasil", dialCode: "55", flag: "🇧🇷", placeholder: "11 91234 5678" },
  { code: "CL", name: "Chile", dialCode: "56", flag: "🇨🇱", placeholder: "9 1234 5678" },
  { code: "PY", name: "Paraguay", dialCode: "595", flag: "🇵🇾", placeholder: "981 123 456" },
  { code: "BO", name: "Bolivia", dialCode: "591", flag: "🇧🇴", placeholder: "7123 4567" },
  { code: "PE", name: "Perú", dialCode: "51", flag: "🇵🇪", placeholder: "912 345 678" },
  { code: "CO", name: "Colombia", dialCode: "57", flag: "🇨🇴", placeholder: "300 123 4567" },
  { code: "EC", name: "Ecuador", dialCode: "593", flag: "🇪🇨", placeholder: "99 123 4567" },
  { code: "VE", name: "Venezuela", dialCode: "58", flag: "🇻🇪", placeholder: "412 123 4567" },
  { code: "MX", name: "México", dialCode: "52", flag: "🇲🇽", placeholder: "55 1234 5678" },
  { code: "US", name: "Estados Unidos", dialCode: "1", flag: "🇺🇸", placeholder: "555 123 4567" },
  { code: "ES", name: "España", dialCode: "34", flag: "🇪🇸", placeholder: "612 345 678" },
  { code: "PA", name: "Panamá", dialCode: "507", flag: "🇵🇦", placeholder: "6123 4567" },
  { code: "CR", name: "Costa Rica", dialCode: "506", flag: "🇨🇷", placeholder: "8123 4567" },
  { code: "GT", name: "Guatemala", dialCode: "502", flag: "🇬🇹", placeholder: "5123 4567" },
  { code: "DO", name: "Rep. Dominicana", dialCode: "1809", flag: "🇩🇴", placeholder: "809 123 4567" },
  { code: "HN", name: "Honduras", dialCode: "504", flag: "🇭🇳", placeholder: "9123 4567" },
  { code: "SV", name: "El Salvador", dialCode: "503", flag: "🇸🇻", placeholder: "7123 4567" },
  { code: "NI", name: "Nicaragua", dialCode: "505", flag: "🇳🇮", placeholder: "8123 4567" },
];

export const DEFAULT_COUNTRY: CountryInfo = COUNTRIES_LIST[0]; // Uruguay

// Mapeo de Zonas Horarias frecuentes a Código de País
const TIMEZONE_TO_COUNTRY: Record<string, string> = {
  "America/Montevideo": "UY",
  "America/Argentina/Buenos_Aires": "AR",
  "America/Buenos_Aires": "AR",
  "America/Cordoba": "AR",
  "America/Argentina/Cordoba": "AR",
  "America/Mendoza": "AR",
  "America/Rosario": "AR",
  "America/Sao_Paulo": "BR",
  "America/Bahia": "BR",
  "America/Belem": "BR",
  "America/Fortaleza": "BR",
  "America/Recife": "BR",
  "America/Manaus": "BR",
  "America/Santiago": "CL",
  "America/Punta_Arenas": "CL",
  "America/Asuncion": "PY",
  "America/La_Paz": "BO",
  "America/Lima": "PE",
  "America/Bogota": "CO",
  "America/Guayaquil": "EC",
  "America/Caracas": "VE",
  "America/Mexico_City": "MX",
  "America/Cancun": "MX",
  "America/Monterrey": "MX",
  "America/Tijuana": "MX",
  "Europe/Madrid": "ES",
  "Atlantic/Canary": "ES",
  "America/New_York": "US",
  "America/Chicago": "US",
  "America/Denver": "US",
  "America/Los_Angeles": "US",
  "America/Miami": "US",
  "America/Panama": "PA",
  "America/Costa_Rica": "CR",
  "America/Guatemala": "GT",
  "America/Santo_Domingo": "DO",
  "America/Tegucigalpa": "HN",
  "America/El_Salvador": "SV",
  "America/Managua": "NI",
};

/**
 * Detecta de forma instantánea el país del usuario mediante zona horaria del navegador,
 * idioma del sistema y fallback a Uruguay.
 */
export function detectUserCountrySync(): CountryInfo {
  if (typeof window === "undefined") return DEFAULT_COUNTRY;

  try {
    // 1. Detección por zona horaria de alta precisión
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timeZone && TIMEZONE_TO_COUNTRY[timeZone]) {
      const code = TIMEZONE_TO_COUNTRY[timeZone];
      const found = COUNTRIES_LIST.find((c) => c.code === code);
      if (found) return found;
    }

    // 2. Detección por idioma del navegador (ej: es-UY, es-AR, pt-BR)
    const languages = navigator.languages || [navigator.language || ""];
    for (const lang of languages) {
      if (lang && lang.includes("-")) {
        const countryCode = lang.split("-")[1]?.toUpperCase();
        if (countryCode) {
          const found = COUNTRIES_LIST.find((c) => c.code === countryCode);
          if (found) return found;
        }
      }
    }
  } catch {
    // Fallback silencioso
  }

  return DEFAULT_COUNTRY;
}

/**
 * Detecta el país del usuario, consultando además opcionalmente /api/geo con caché en memoria.
 */
let cachedDetectedCountry: CountryInfo | null = null;

export async function detectUserCountry(): Promise<CountryInfo> {
  if (cachedDetectedCountry) return cachedDetectedCountry;

  // Detección síncrona inmediata
  const local = detectUserCountrySync();

  if (typeof window === "undefined") return local;

  // Si ya obtuvimos un país específico distinto al default, usarlo
  if (local.code !== "UY") {
    cachedDetectedCountry = local;
    return local;
  }

  try {
    const res = await fetch("/api/geo", { cache: "force-cache" });
    if (res.ok) {
      const data = await res.json();
      if (data?.country) {
        const found = COUNTRIES_LIST.find(
          (c) => c.code === String(data.country).toUpperCase()
        );
        if (found) {
          cachedDetectedCountry = found;
          return found;
        }
      }
    }
  } catch {
    // Si la llamada de red falla, mantenemos la detección local
  }

  cachedDetectedCountry = local;
  return local;
}

/**
 * Normaliza y formatea el número de la automotora para el enlace wa.me/{cleanPhone}.
 * Elimina caracteres no numéricos, ceros iniciales de llamadas locales y garantiza
 * que el número empiece con el código internacional del país correspondiente.
 */
export function formatAgencyPhoneForWhatsApp(
  rawPhone: string,
  defaultDialCode = "598"
): string {
  if (!rawPhone) return "";
  let digits = rawPhone.replace(/\D/g, "");
  if (!digits) return "";

  // Si el teléfono se guardó con "+" explícito al inicio (ej: +59899123456 o +54911...),
  // entonces los dígitos ya corresponden al número internacional completo.
  if (rawPhone.trim().startsWith("+")) {
    return digits;
  }

  // Lista de prefijos conocidos para detectar si ya contiene código de país
  const knownPrefixes = [
    "598", "595", "591", "593", "54", "55", "56", "51", "57", "58", "52", "34", "1809", "507", "506", "502", "504", "503", "505", "1"
  ];

  for (const prefix of knownPrefixes) {
    if (digits.startsWith(prefix) && digits.length >= prefix.length + 7) {
      return digits;
    }
  }

  // Si comienza con '0' (ejemplo en Uruguay móvil local '099123456'), quitamos el 0
  if (digits.startsWith("0")) {
    digits = digits.substring(1);
  }

  return `${defaultDialCode}${digits}`;
}

/**
 * Formatea el número del cliente para guardarlo ordenadamente en el CRM:
 * Ej: "+598 99 123 456"
 */
export function formatVisitorPhoneForCRM(
  dialCode: string,
  localPhone: string
): string {
  let cleanLocal = localPhone.replace(/\D/g, "");
  if (cleanLocal.startsWith("0")) {
    cleanLocal = cleanLocal.substring(1);
  }
  return `+${dialCode} ${cleanLocal}`;
}
