export const dynamic = "force-dynamic";

import { getCurrentUser } from "@/actions/authActions";
import { getVehicles } from "@/actions/autoActions";
import { getPrimaryAgency } from "@/actions/agencyActions";
import { getAgendaAppointments, getCalcomSettings } from "@/actions/agendaActions";
import AgendaClient from "./AgendaClient";

export default async function AgendaPage() {
  const currentUser = await getCurrentUser();
  const isDemoUser = !currentUser || currentUser.email === "mauricio@automotora.com";
  const agencyId = currentUser?.agency_id || (isDemoUser ? "00000000-0000-0000-0000-000000000000" : "00000000-0000-0000-0000-000000000000");

  const [appointments, calcomSettings, vehicles, agency] = await Promise.all([
    getAgendaAppointments(agencyId),
    getCalcomSettings(agencyId),
    getVehicles(agencyId),
    getPrimaryAgency(agencyId),
  ]);

  const agencyName = agency?.name || "Automotora";

  const simplifiedVehicles = (vehicles || []).map((v: any) => ({
    id: String(v.id),
    brand: v.brand || "Sin marca",
    model: v.model || "Sin modelo",
    year: Number(v.year) || new Date().getFullYear(),
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <AgendaClient
        initialAppointments={appointments}
        initialCalcomSettings={calcomSettings}
        vehicles={simplifiedVehicles}
        agencyId={agencyId}
        agencyName={agencyName}
      />
    </div>
  );
}
