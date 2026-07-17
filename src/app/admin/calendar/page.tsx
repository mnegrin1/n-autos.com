export const runtime = "edge";
import { getEvents } from "@/actions/otherActions";
import { getVehicles } from "@/actions/autoActions";
import CalendarClient from "./CalendarClient";

export const dynamic = "force-dynamic";

export default async function AutoCalendarPage() {
  const allEvents = await getEvents();
  const vehicles = await getVehicles("demo-agency-id");

  // Filter events related to auto (type: test_drive or any appointment for auto)
  // Real Estate events have type: 'visita' | 'reunion' | 'llamada'
  // Auto will use 'visita' (rendered as test_drive), 'reunion' and 'llamada'.
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <CalendarClient initialEvents={allEvents} vehicles={vehicles} />
    </div>
  );
}