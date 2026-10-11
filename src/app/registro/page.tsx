import type { Metadata } from "next";
import RegisterClient from "./RegisterClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "n-autos.com | 14 Días de Prueba Gratis",
  description: "Crea tu cuenta en n-autos.com y pon en marcha la página web y el CRM para tu automotora en minutos. Sin tarjeta de crédito.",
};

export default function RegisterPage() {
  return <RegisterClient />;
}
