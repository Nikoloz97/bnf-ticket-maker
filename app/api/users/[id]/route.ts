import { NextRequest, NextResponse } from "next/server";
import { getUserById, updateUser, deleteUser } from "@/lib/db";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);
    if (isNaN(id))
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });

    const body = await request.json();
    const name = (body.name as string)?.trim();
    if (!name)
      return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const existing = await getUserById(id);
    if (!existing)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const updated = await updateUser(id, name);
    return NextResponse.json(updated);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "";
    if (msg.includes("UNIQUE constraint failed")) {
      return NextResponse.json(
        { error: "A user with that name already exists" },
        { status: 409 },
      );
    }
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);
    if (isNaN(id))
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });

    const existing = await getUserById(id);
    if (!existing)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    await deleteUser(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 },
    );
  }
}
