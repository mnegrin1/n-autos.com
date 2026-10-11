/**
 * Helper para normalización de color y cálculo de contraste accesible (WCAG 2.1)
 * para los portales de automotoras.
 *
 * Previene bugs visuales de texto blanco sobre fondo blanco o negro sobre negro,
 * calculando el contraste óptimo para el color seleccionado por el usuario en
 * Modo Claro y Modo Oscuro.
 */

export interface ThemeTokens {
  primary: string;
  primaryContrast: string;
  primaryHover: string;
  primaryLight: string;
  primaryBorder: string;
  accentDark: string;
  accentLight: string;
}

export function parseHex(hex: string): { r: number; g: number; b: number } | null {
  if (!hex || typeof hex !== "string") return null;
  let clean = hex.trim().replace(/^#/, "");

  if (clean.length === 3) {
    clean = clean.split("").map((c) => c + c).join("");
  }

  if (clean.length !== 6) return null;

  const num = parseInt(clean, 16);
  if (isNaN(num)) return null;

  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const toHex = (v: number) => clamp(v).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function getRelativeLuminance(r: number, g: number, b: number): number {
  const toLinear = (c: number) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;

  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0);
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      case bn:
        h = (rn - gn) / d + 4;
        break;
    }
    h /= 6;
  }

  return { h: h * 360, s, l };
}

export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  const hn = (((h % 360) + 360) % 360) / 360;

  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v };
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    let tn = t;
    if (tn < 0) tn += 1;
    if (tn > 1) tn -= 1;
    if (tn < 1 / 6) return p + (q - p) * 6 * tn;
    if (tn < 1 / 2) return q;
    if (tn < 2 / 3) return p + (q - p) * (2 / 3 - tn) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  const r = hue2rgb(p, q, hn + 1 / 3);
  const g = hue2rgb(p, q, hn);
  const b = hue2rgb(p, q, hn - 1 / 3);

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/**
 * Genera el set completo de tokens de tema accesibles basados en el color primario ingresado.
 */
export function generateAccessibleThemeTokens(inputHex?: string | null): ThemeTokens {
  const defaultHex = "#10b981";
  const rgb = parseHex(inputHex || "") || parseHex(defaultHex)!;
  const normalizedPrimary = rgbToHex(rgb.r, rgb.g, rgb.b);

  const luminance = getRelativeLuminance(rgb.r, rgb.g, rgb.b);

  // Determinar color de texto con máximo contraste para botones con fondo primario
  // Ratio WCAG: Si la luminancia es mayor a 0.42, el fondo es claro y se usa texto oscuro (#0f172a);
  // si es menor o igual, se usa texto blanco (#ffffff).
  const primaryContrast = luminance > 0.42 ? "#0f172a" : "#ffffff";

  // Hover color: Si es muy claro se oscurece un 10%, si es oscuro se aclara un 10%
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const hoverL = luminance > 0.5 ? Math.max(0.15, hsl.l - 0.1) : Math.min(0.85, hsl.l + 0.1);
  const hoverRgb = hslToRgb(hsl.h, hsl.s, hoverL);
  const primaryHover = rgbToHex(hoverRgb.r, hoverRgb.g, hoverRgb.b);

  // Tinte sutil para fondos de badges y acentos
  const primaryLight = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.14)`;
  const primaryBorder = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.32)`;

  // Calibración para texto/iconos en Modo Oscuro (superficie ~ #0b0f17)
  // Si el color es muy oscuro (ej. #111827 o azul marino profundo), se ilumina para que no desaparezca.
  let accentDark = normalizedPrimary;
  if (luminance < 0.22) {
    if (hsl.s < 0.15) {
      accentDark = "#94a3b8"; // Plata neutro para tonos negros/grises
    } else {
      const brightRgb = hslToRgb(hsl.h, Math.max(0.6, hsl.s), 0.68);
      accentDark = rgbToHex(brightRgb.r, brightRgb.g, brightRgb.b);
    }
  }

  // Calibración para texto/iconos en Modo Claro (superficie ~ #ffffff o #f8fafc)
  // Si el color es muy claro (ej. amarillo, verde lima o blanco), se profundiza para que tenga alto contraste.
  let accentLight = normalizedPrimary;
  if (luminance > 0.44) {
    if (hsl.s < 0.15) {
      accentLight = "#1e293b"; // Carbón neutro para tonos blancos/claros
    } else {
      const darkRgb = hslToRgb(hsl.h, Math.max(0.7, hsl.s), 0.38);
      accentLight = rgbToHex(darkRgb.r, darkRgb.g, darkRgb.b);
    }
  }

  return {
    primary: normalizedPrimary,
    primaryContrast,
    primaryHover,
    primaryLight,
    primaryBorder,
    accentDark,
    accentLight,
  };
}
