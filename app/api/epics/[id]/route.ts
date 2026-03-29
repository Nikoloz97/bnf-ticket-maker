import { NextRequest, NextResponse } from "next/server";
import { getEpicById, updateEpic, deleteEpic } from "@/lib/db";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);
    if (isNaN(id))
      return NextResponse.json({ error: "Invalid epic ID" }, { status: 400 });
    const epic = await getEpicById(id);
    if (!epic)
      return NextResponse.json({ error: "Epic not found" }, { status: 404 });
    return NextResponse.json(epic);
  } catch (error) {
    console.error("Error fetching epic:", error);
    return NextResponse.json(
      { error: "Failed to fetch epic" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);
    if (isNaN(id))
      return NextResponse.json({ error: "Invalid epic ID" }, { status: 400 });

    const existing = await getEpicById(id);
    if (!existing)
      return NextResponse.json({ error: "Epic not found" }, { status: 404 });

    const body = await request.json();
    const updated = await updateEpic(id, {
      title: body.title,
      description: body.description,
      completed: body.completed,
      blockers: body.blockers,
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating epic:", error);
    return NextResponse.json(
      { error: "Failed to update epic" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);
    if (isNaN(id))
      return NextResponse.json({ error: "Invalid epic ID" }, { status: 400 });
    const existing = await getEpicById(id);
    if (!existing)
      return NextResponse.json({ error: "Epic not found" }, { status: 404 });
    await deleteEpic(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting epic:", error);
    return NextResponse.json(
      { error: "Failed to delete epic" },
      { status: 500 },
    );
  }
}
