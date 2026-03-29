import { getAllTickets } from "@/lib/db";
import TicketListClient from "./TicketListClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const tickets = await getAllTickets();
  return <TicketListClient initialTickets={tickets} />;
}
