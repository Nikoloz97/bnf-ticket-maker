import { NextRequest, NextResponse } from "next/server";
import { getAuditsByTicketId } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);
    if (isNaN(id))
      return NextResponse.json({ error: "Invalid ticket ID" }, { status: 400 });
    return NextResponse.json(await getAuditsByTicketId(id));
  } catch (error) {
    console.error("Error fetching audits:", error);
    return NextResponse.json(
      { error: "Failed to fetch audits" },
      { status: 500 },
    );
  }
}
