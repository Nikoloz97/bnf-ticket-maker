import { NextRequest, NextResponse } from "next/server";
import { getAllTickets, createTicket, createAudit } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tickets = await getAllTickets();
    return NextResponse.json(tickets);
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json(
      { error: "Failed to fetch tickets" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const title = formData.get("title") as string;
    const reported_by = formData.get("reported_by") as string;
    const description = formData.get("description") as string;
    const priority = formData.get("priority") as
      | "Urgent"
      | "Important"
      | "Backlog";
    const difficultyRaw = formData.get("difficulty") as string;
    const areasRaw = formData.get("areas") as string;
    const blockersRaw = formData.get("blockers") as string;
    const epicIdRaw = formData.get("epic_id") as string | null;
    const assignedTo = (formData.get("assigned_to") as string | null) || null;
    const progressRaw =
      (formData.get("progress") as string | null) || "Not Started";
    const resolution = (formData.get("resolution") as string | null) || null;

    // Validate required fields
    const errors: Record<string, string> = {};
    if (!title || title.trim() === "") errors.title = "Title is required";
    if (!reported_by || reported_by.trim() === "")
      errors.reported_by = "Reporter name is required";
    if (!description || description.trim() === "")
      errors.description = "Description is required";
    if (!priority || !["Urgent", "Important", "Backlog"].includes(priority)) {
      errors.priority = "Priority must be Urgent, Important, or Backlog";
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    const difficulty = parseInt(difficultyRaw || "1", 10);
    const areas: string[] = areasRaw ? JSON.parse(areasRaw) : [];
    const blockers: number[] = blockersRaw ? JSON.parse(blockersRaw) : [];
    const epicId = epicIdRaw ? parseInt(epicIdRaw, 10) : null;

    const VALID_PROGRESS = ["Not Started", "In Progress", "Completed"];
    const ticket = await createTicket({
      title: title.trim(),
      areas,
      reported_by: reported_by.trim(),
      assigned_to: assignedTo?.trim() || null,
      description: description.trim(),
      priority,
      difficulty: isNaN(difficulty) ? 1 : Math.min(5, Math.max(1, difficulty)),
      progress: VALID_PROGRESS.includes(progressRaw)
        ? (progressRaw as "Not Started" | "In Progress" | "Completed")
        : "Not Started",
      resolution: resolution?.trim() || null,
      blockers,
      screenshots: [],
      epic_id: epicId && !isNaN(epicId) ? epicId : null,
    });

    await createAudit({
      ticket_id: ticket.id,
      modification: "add",
    });

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    console.error("Error creating ticket:", error);
    return NextResponse.json(
      { error: "Failed to create ticket" },
      { status: 500 },
    );
  }
}
