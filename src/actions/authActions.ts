"use server";

import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";

export async function login(email: string, password?: string) {
  if (!email) {
    return { success: false, error: "El correo electrónico es requerido." };
  }

  let { data: user, error } = await (supabase.from("users") as any)
    .select("*")
    .ilike("email", email)
    .maybeSingle();

  // Fallback para el usuario de demostración
  if ((error || !user) && email.toLowerCase() === "mauricio@automotora.com") {
    user = {
      id: "demo-user-id",
      email: "mauricio@automotora.com",
      name: "Mauricio Negrin",
      role: "admin",
    };
    error = null;
  }

  if (error || !user) {
    return { success: false, error: "El usuario no existe." };
  }

  if (password !== "admin") {
    return { success: false, error: "La contraseña es incorrecta." };
  }

  // Generar sesión serializada en base64 en forma compatible con UTF-8
  const sessionData = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    agency_id: user.agency_id,
  };
  const bytes = new TextEncoder().encode(JSON.stringify(sessionData));
  const binString = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  const token = btoa(binString);
  
  const cookieStore = await cookies();
  cookieStore.set("admin-session", token, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 1 semana
  });

  return { success: true, user: sessionData };
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("admin-session");
  return { success: true };
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin-session")?.value;
    if (!token) return null;

    const binString = atob(token);
    const bytes = Uint8Array.from(binString, (m) => m.charCodeAt(0));
    const decoded = JSON.parse(new TextDecoder().decode(bytes));
    return decoded;
  } catch (e) {
    return null;
  }
}
