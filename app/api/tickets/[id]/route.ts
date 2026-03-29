import { NextRequest, NextResponse } from "next/server";
import {
  getTicketById,
  updateTicket,
  deleteTicket,
  createAudit,
  ParsedTicket,
  AuditChanges,
} from "@/lib/db";

function diffTickets(before: ParsedTicket, after: ParsedTicket): AuditChanges {
  const changes: AuditChanges = {};
  const ser = (v: unknown): string => {
    if (v === null || v === undefined || v === "") return "—";
    if (Array.isArray(v)) {
      if (v.length === 0) return "—";
      return (v as (string | number)[])
        .slice()
        .sort((a, b) => String(a).localeCompare(String(b)))
        .map((x) => (typeof x === "number" ? `#${x}` : x))
        .join(", ");
    }
    return String(v);
  };
  const FIELDS: Array<[keyof ParsedTicket, string]> = [
    ["title", "Title"],
    ["reported_by", "Reported By"],
    ["assigned_to", "Assigned To"],
    ["description", "Description"],
    ["priority", "Priority"],
    ["difficulty", "Difficulty"],
    ["progress", "Progress"],
    ["resolution", "Resolution"],
    ["areas", "Areas"],
    ["blockers", "Blockers"],
    ["epic_id", "Epic"],
  ];
  for (const [key, label] of FIELDS) {
    const b = ser(before[key]);
    const a = ser(after[key]);
    if (b !== a) changes[label] = { before: b, after: a };
  }
  return changes;
}

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

    return NextResponse.json(ticket);
  } catch (error) {
    console.error("Error fetching ticket:", error);
    return NextResponse.json(
      { error: "Failed to fetch ticket" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);
    if (isNaN(id))
      return NextResponse.json({ error: "Invalid ticket ID" }, { status: 400 });

    const existing = await getTicketById(id);
    if (!existing)
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

    const formData = await request.formData();

    const title = (formData.get("title") as string)?.trim();
    const reported_by = (formData.get("reported_by") as string)?.trim();
    const description = (formData.get("description") as string)?.trim();
    const priority = formData.get("priority") as
      | "Urgent"
      | "Important"
      | "Backlog";
    const difficultyRaw = formData.get("difficulty") as string;
    const areasRaw = formData.get("areas") as string;
    const blockersRaw = formData.get("blockers") as string;
    const epicIdRaw = formData.get("epic_id") as string | null;
    const assignedTo = (formData.get("assigned_to") as string | null) || null;
    const progressRaw = (formData.get("progress") as string) || "Not Started";
    const resolution = (formData.get("resolution") as string | null) || null;
    const existingScreenshotsRaw = formData.get(
      "existing_screenshots",
    ) as string;

    const errors: Record<string, string> = {};
    if (!title) errors.title = "Title is required";
    if (!reported_by) errors.reported_by = "Reporter name is required";
    if (!description) errors.description = "Description is required";
    if (!["Urgent", "Important", "Backlog"].includes(priority))
      errors.priority = "Invalid priority";
    if (Object.keys(errors).length > 0)
      return NextResponse.json({ errors }, { status: 400 });

    const difficulty = parseInt(difficultyRaw || "1", 10);
    const areas: string[] = areasRaw ? JSON.parse(areasRaw) : [];
    const blockers: number[] = blockersRaw ? JSON.parse(blockersRaw) : [];
    const epicId = epicIdRaw ? parseInt(epicIdRaw, 10) : null;

    const VALID_PROGRESS = ["Not Started", "In Progress", "Completed"];

    const ticket = await updateTicket(id, {
      title,
      areas,
      reported_by,
      assigned_to: assignedTo?.trim() || null,
      description,
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

    if (ticket) {
      const diff = diffTickets(existing, ticket);
      await createAudit({
        ticket_id: id,
        modification: "edit",
        changes: diff,
      });
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error("Error updating ticket:", error);
    return NextResponse.json(
      { error: "Failed to update ticket" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);
    if (isNaN(id))
      return NextResponse.json({ error: "Invalid ticket ID" }, { status: 400 });

    const existing = await getTicketById(id);
    if (!existing)
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

    // Record audit before deleting
    await createAudit({
      ticket_id: id,
      modification: "delete",
    });

    await deleteTicket(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting ticket:", error);
    return NextResponse.json(
      { error: "Failed to delete ticket" },
      { status: 500 },
    );
  }
}
