import { getAllTickets, getEpicSummaries } from "@/lib/db";
import TicketListClient from "./TicketListClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [tickets, epics] = await Promise.all([getAllTickets(), getEpicSummaries()]);
  return <TicketListClient initialTickets={tickets} initialEpics={epics} />;
}
