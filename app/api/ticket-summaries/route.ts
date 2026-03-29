import { NextResponse } from "next/server";
import { getTicketSummaries } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const summaries = await getTicketSummaries();
    return NextResponse.json(summaries);
  } catch (error) {
    console.error("Error fetching ticket summaries:", error);
    return NextResponse.json(
      { error: "Failed to fetch ticket summaries" },
      { status: 500 },
    );
  }
}
