export const dynamic = "force-dynamic";

import { getCurrentUser } from "@/actions/authActions";
import { getVehicles } from "@/actions/autoActions";
import { getPrimaryAgency } from "@/actions/agencyActions";
import { getAgendaAppointments, getAgencyCalendarSettings } from "@/actions/agendaActions";
import AgendaClient from "./AgendaClient";

export default async function AgendaPage() {
  const currentUser = await getCurrentUser();
  const isDemoUser = !currentUser || currentUser.email === "mauricio@automotora.com";
  const agencyId = currentUser?.agency_id || (isDemoUser ? "00000000-0000-0000-0000-000000000000" : "00000000-0000-0000-0000-000000000000");

  const [appointments, calendarSettings, vehicles, agency] = await Promise.all([
    getAgendaAppointments(agencyId),
    getAgencyCalendarSettings(agencyId),
    getVehicles(agencyId),
    getPrimaryAgency(agencyId),
  ]);

  const agencyName = agency?.name || "Automotora";
  const agencySlug = agency?.subdomain || "hola";

  const simplifiedVehicles = (vehicles || []).map((v: any) => ({
    id: String(v.id),
    brand: v.brand || "Sin marca",
    model: v.model || "Sin modelo",
    year: Number(v.year) || new Date().getFullYear(),
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", width: "100%", maxWidth: "100%", boxSizing: "border-box", overflowX: "hidden" }}>
      <AgendaClient
        initialAppointments={appointments}
        initialCalendarSettings={calendarSettings}
        vehicles={simplifiedVehicles}
        agencyId={agencyId}
        agencySlug={agencySlug}
        agencyName={agencyName}
      />
    </div>
  );
}
