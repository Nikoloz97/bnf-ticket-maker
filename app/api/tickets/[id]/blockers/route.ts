import { NextRequest, NextResponse } from "next/server";
import { getTicketById, getTicketsByIds } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ticket ID" }, { status: 400 });
    }

    const ticket = await getTicketById(id);
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const blockerTickets = await getTicketsByIds(ticket.blockers);
    return NextResponse.json(blockerTickets);
  } catch (error) {
    console.error("Error fetching blockers:", error);
    return NextResponse.json(
      { error: "Failed to fetch blockers" },
      { status: 500 },
    );
  }
}
