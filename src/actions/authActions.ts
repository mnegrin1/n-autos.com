"use server";

import { cookies } from "next/headers";
import { getDb } from "@/lib/localDb";

export async function login(email: string, password?: string) {
  if (!email) {
    return { success: false, error: "El correo electrónico es requerido." };
  }

  // Buscar el usuario en la base de datos local
  const db = getDb();
  const user = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    return { success: false, error: "El usuario no existe." };
  }

  if (password !== "admin") {
    return { success: false, error: "La contraseña es incorrecta." };
  }

  // Generar sesión serializada en base64
  const sessionData = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
  const token = Buffer.from(JSON.stringify(sessionData)).toString("base64");
  
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

    const decoded = JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
    return decoded;
  } catch (e) {
    return null;
  }
}
