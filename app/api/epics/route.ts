import { NextRequest, NextResponse } from "next/server";
import { getAllEpics, createEpic } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await getAllEpics());
  } catch (error) {
    console.error("Error fetching epics:", error);
    return NextResponse.json(
      { error: "Failed to fetch epics" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const title = (body.title as string)?.trim();
    if (!title)
      return NextResponse.json({ error: "Title is required" }, { status: 400 });

    const epic = await createEpic({
      title,
      description: (body.description as string) ?? "",
      completed: Boolean(body.completed),
      blockers: Array.isArray(body.blockers) ? body.blockers : [],
    });
    return NextResponse.json(epic, { status: 201 });
  } catch (error) {
    console.error("Error creating epic:", error);
    return NextResponse.json(
      { error: "Failed to create epic" },
      { status: 500 },
    );
  }
}
