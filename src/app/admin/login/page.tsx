import type { Metadata } from "next";
import LoginClient from "./LoginClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "n-autos.com | Iniciar Sesión",
  description: "Plataforma de Gestión Automotriz - n-autos.com",
};

export default function LoginPage() {
  return <LoginClient />;
}
