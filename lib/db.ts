import { createClient, Client } from "@libsql/client";

export type TicketProgress = "Not Started" | "In Progress" | "Completed";

export interface Ticket {
  id: number;
  title: string;
  areas: string; // JSON array string
  reported_by: string;
  assigned_to: string | null;
  description: string;
  priority: "Urgent" | "Important" | "Backlog";
  difficulty: number; // 1-5
  progress: TicketProgress;
  resolution: string | null;
  blockers: string; // JSON array of ticket IDs
  screenshots: string; // JSON array of file paths
  epic_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface TicketRow {
  id: number;
  title: string;
  areas: string;
  reported_by: string;
  assigned_to: string | null;
  description: string;
  priority: "Urgent" | "Important" | "Backlog";
  difficulty: number;
  progress: TicketProgress;
  resolution: string | null;
  blockers: string;
  screenshots: string;
  epic_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface ParsedTicket {
  id: number;
  title: string;
  areas: string[];
  reported_by: string;
  assigned_to: string | null;
  description: string;
  priority: "Urgent" | "Important" | "Backlog";
  difficulty: number;
  progress: TicketProgress;
  resolution: string | null;
  blockers: number[];
  screenshots: string[];
  epic_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface EpicRow {
  id: number;
  title: string;
  description: string;
  completed: number; // 0 or 1
  blockers: string; // JSON array of epic IDs
  created_at: string;
  updated_at: string;
}

export interface ParsedEpic {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  blockers: number[];
  created_at: string;
  updated_at: string;
}

export interface ParsedEpicWithTickets extends ParsedEpic {
  tickets: Array<{
    id: number;
    title: string;
    priority: "Urgent" | "Important" | "Backlog";
  }>;
}

export interface User {
  id: number;
  name: string;
  created_at: string;
}

export type AuditModification = "add" | "edit" | "delete";
export type AuditChanges = Record<string, { before: string; after: string }>;

export interface ParsedAudit {
  id: number;
  ticket_id: number;
  modification: AuditModification;
  changes: AuditChanges | null;
  created_at: string;
}

let _db: Client | null = null;

export function getDb(): Client {
  if (_db) return _db;

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    throw new Error("TURSO_DATABASE_URL environment variable is required");
  }

  _db = createClient({
    url,
    authToken,
  });

  return _db;
}

export async function initializeDatabase(): Promise<void> {
  const db = getDb();

  await db.execute(`
    CREATE TABLE IF NOT EXISTS epics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      completed INTEGER NOT NULL DEFAULT 0,
      blockers TEXT NOT NULL DEFAULT '[]',
      created_at DATETIME NOT NULL DEFAULT (datetime('now')),
      updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      areas TEXT NOT NULL DEFAULT '[]',
      reported_by TEXT NOT NULL,
      description TEXT NOT NULL,
      priority TEXT NOT NULL CHECK(priority IN ('Urgent', 'Important', 'Backlog')),
      difficulty INTEGER NOT NULL DEFAULT 1 CHECK(difficulty >= 1 AND difficulty <= 5),
      blockers TEXT NOT NULL DEFAULT '[]',
      screenshots TEXT NOT NULL DEFAULT '[]',
      epic_id INTEGER REFERENCES epics(id) ON DELETE SET NULL,
      assigned_to TEXT,
      progress TEXT NOT NULL DEFAULT 'Not Started',
      resolution TEXT,
      created_at DATETIME NOT NULL DEFAULT (datetime('now')),
      updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at DATETIME NOT NULL DEFAULT (datetime('now'))
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS ticket_audits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL,
      modification TEXT NOT NULL,
      changes TEXT,
      created_at DATETIME NOT NULL DEFAULT (datetime('now'))
    )
  `);
}

const TICKET_COLS = `id, title, areas, reported_by, assigned_to, description, priority, difficulty, progress, resolution, blockers, screenshots, epic_id, created_at, updated_at`;

export async function getAllTickets(): Promise<ParsedTicket[]> {
  const db = getDb();
  const result = await db.execute(
    `SELECT ${TICKET_COLS} FROM tickets ORDER BY created_at DESC`,
  );
  return result.rows.map((row: any) => ({
    ...row,
    areas: JSON.parse(row.areas || "[]"),
    blockers: JSON.parse(row.blockers || "[]"),
    screenshots: JSON.parse(row.screenshots || "[]"),
  }));
}

export async function getTicketById(id: number): Promise<ParsedTicket | null> {
  const db = getDb();
  const result = await db.execute({
    sql: `SELECT ${TICKET_COLS} FROM tickets WHERE id = ?`,
    args: [id],
  });
  if (result.rows.length === 0) return null;
  const row: any = result.rows[0];
  return {
    ...row,
    areas: JSON.parse(row.areas || "[]"),
    blockers: JSON.parse(row.blockers || "[]"),
    screenshots: JSON.parse(row.screenshots || "[]"),
  };
}

export async function getTicketsByIds(ids: number[]): Promise<ParsedTicket[]> {
  if (ids.length === 0) return [];
  const db = getDb();
  const placeholders = ids.map(() => "?").join(", ");
  const result = await db.execute({
    sql: `SELECT ${TICKET_COLS} FROM tickets WHERE id IN (${placeholders})`,
    args: ids,
  });
  return result.rows.map((row: any) => ({
    ...row,
    areas: JSON.parse(row.areas || "[]"),
    blockers: JSON.parse(row.blockers || "[]"),
    screenshots: JSON.parse(row.screenshots || "[]"),
  }));
}

export async function getTicketsByEpicId(
  epicId: number,
): Promise<ParsedTicket[]> {
  const db = getDb();
  const result = await db.execute({
    sql: `SELECT ${TICKET_COLS} FROM tickets WHERE epic_id = ? ORDER BY created_at DESC`,
    args: [epicId],
  });
  return result.rows.map((row: any) => ({
    ...row,
    areas: JSON.parse(row.areas || "[]"),
    blockers: JSON.parse(row.blockers || "[]"),
    screenshots: JSON.parse(row.screenshots || "[]"),
  }));
}

export interface CreateTicketInput {
  title: string;
  areas: string[];
  reported_by: string;
  assigned_to?: string | null;
  description: string;
  priority: "Urgent" | "Important" | "Backlog";
  difficulty: number;
  progress?: TicketProgress;
  resolution?: string | null;
  blockers: number[];
  screenshots: string[];
  epic_id?: number | null;
}

export async function createTicket(
  input: CreateTicketInput,
): Promise<ParsedTicket> {
  const db = getDb();
  const result = await db.execute({
    sql: `
      INSERT INTO tickets (title, areas, reported_by, assigned_to, description, priority, difficulty, progress, resolution, blockers, screenshots, epic_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      input.title,
      JSON.stringify(input.areas),
      input.reported_by,
      input.assigned_to ?? null,
      input.description,
      input.priority,
      input.difficulty,
      input.progress ?? "Not Started",
      input.resolution?.trim() || null,
      JSON.stringify(input.blockers),
      JSON.stringify(input.screenshots),
      input.epic_id ?? null,
    ],
  });

  const ticket = await getTicketById(Number(result.lastInsertRowid));
  if (!ticket) throw new Error("Failed to create ticket");
  return ticket;
}

export interface UpdateTicketInput {
  title: string;
  areas: string[];
  reported_by: string;
  assigned_to: string | null;
  description: string;
  priority: "Urgent" | "Important" | "Backlog";
  difficulty: number;
  progress: TicketProgress;
  resolution: string | null;
  blockers: number[];
  screenshots: string[]; // final list of paths to store
  epic_id: number | null;
}

export async function updateTicket(
  id: number,
  input: UpdateTicketInput,
): Promise<ParsedTicket | null> {
  const db = getDb();
  await db.execute({
    sql: `
      UPDATE tickets SET
        title = ?, areas = ?, reported_by = ?, assigned_to = ?, description = ?,
        priority = ?, difficulty = ?, progress = ?, resolution = ?, blockers = ?, screenshots = ?,
        epic_id = ?, updated_at = datetime('now')
      WHERE id = ?
    `,
    args: [
      input.title,
      JSON.stringify(input.areas),
      input.reported_by,
      input.assigned_to ?? null,
      input.description,
      input.priority,
      input.difficulty,
      input.progress,
      input.resolution?.trim() || null,
      JSON.stringify(input.blockers),
      JSON.stringify(input.screenshots),
      input.epic_id ?? null,
      id,
    ],
  });
  return getTicketById(id);
}

export async function deleteTicket(id: number): Promise<void> {
  const db = getDb();
  await db.execute({
    sql: `DELETE FROM tickets WHERE id = ?`,
    args: [id],
  });
}

export async function getTicketSummaries(): Promise<
  Array<{ id: number; title: string }>
> {
  const db = getDb();
  const result = await db.execute(
    `SELECT id, title FROM tickets ORDER BY id DESC`,
  );
  return result.rows as unknown as Array<{ id: number; title: string }>;
}

// ─── Epic helpers ─────────────────────────────────────────────────────────────

function parseEpic(row: EpicRow): ParsedEpic {
  return {
    ...row,
    completed: row.completed === 1,
    blockers: JSON.parse(row.blockers || "[]"),
  };
}

export async function getAllEpics(): Promise<ParsedEpicWithTickets[]> {
  const db = getDb();
  const epicResult = await db.execute(
    `SELECT id, title, description, completed, blockers, created_at, updated_at FROM epics ORDER BY created_at DESC`,
  );

  const epics = await Promise.all(
    epicResult.rows.map(async (row: any) => {
      const epic = parseEpic(row);
      const ticketResult = await db.execute({
        sql: `SELECT id, title, priority FROM tickets WHERE epic_id = ? ORDER BY created_at DESC`,
        args: [epic.id],
      });
      const tickets = ticketResult.rows as unknown as Array<{
        id: number;
        title: string;
        priority: "Urgent" | "Important" | "Backlog";
      }>;
      return { ...epic, tickets };
    }),
  );

  return epics;
}

export async function getEpicById(
  id: number,
): Promise<ParsedEpicWithTickets | null> {
  const db = getDb();
  const epicResult = await db.execute({
    sql: `SELECT id, title, description, completed, blockers, created_at, updated_at FROM epics WHERE id = ?`,
    args: [id],
  });
  if (epicResult.rows.length === 0) return null;
  const epic = parseEpic(epicResult.rows[0] as unknown as EpicRow);
  const ticketResult = await db.execute({
    sql: `SELECT id, title, priority FROM tickets WHERE epic_id = ? ORDER BY created_at DESC`,
    args: [id],
  });
  const tickets = ticketResult.rows as unknown as Array<{
    id: number;
    title: string;
    priority: "Urgent" | "Important" | "Backlog";
  }>;
  return { ...epic, tickets };
}

export interface CreateEpicInput {
  title: string;
  description: string;
  completed?: boolean;
  blockers?: number[];
}

export async function createEpic(
  input: CreateEpicInput,
): Promise<ParsedEpicWithTickets> {
  const db = getDb();
  const result = await db.execute({
    sql: `INSERT INTO epics (title, description, completed, blockers) VALUES (?, ?, ?, ?)`,
    args: [
      input.title.trim(),
      input.description.trim(),
      input.completed ? 1 : 0,
      JSON.stringify(input.blockers ?? []),
    ],
  });
  const epic = await getEpicById(Number(result.lastInsertRowid));
  if (!epic) throw new Error("Failed to create epic");
  return epic;
}

export interface UpdateEpicInput {
  title?: string;
  description?: string;
  completed?: boolean;
  blockers?: number[];
}

export async function updateEpic(
  id: number,
  input: UpdateEpicInput,
): Promise<ParsedEpicWithTickets | null> {
  const db = getDb();
  const existing = await getEpicById(id);
  if (!existing) return null;

  await db.execute({
    sql: `
      UPDATE epics SET
        title = ?,
        description = ?,
        completed = ?,
        blockers = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `,
    args: [
      (input.title ?? existing.title).trim(),
      (input.description ?? existing.description).trim(),
      (input.completed ?? existing.completed) ? 1 : 0,
      JSON.stringify(input.blockers ?? existing.blockers),
      id,
    ],
  });

  return getEpicById(id);
}

export async function deleteEpic(id: number): Promise<void> {
  const db = getDb();
  await db.execute({
    sql: `UPDATE tickets SET epic_id = NULL WHERE epic_id = ?`,
    args: [id],
  });
  await db.execute({
    sql: `DELETE FROM epics WHERE id = ?`,
    args: [id],
  });
}

export async function getEpicSummaries(): Promise<
  Array<{ id: number; title: string }>
> {
  const db = getDb();
  const result = await db.execute(
    `SELECT id, title FROM epics ORDER BY title ASC`,
  );
  return result.rows as unknown as Array<{ id: number; title: string }>;
}

// ─── User helpers ─────────────────────────────────────────────────────────────

export async function getAllUsers(): Promise<User[]> {
  const db = getDb();
  const result = await db.execute(
    `SELECT id, name, created_at FROM users ORDER BY name ASC`,
  );
  return result.rows as unknown as User[];
}

export async function getUserById(id: number): Promise<User | null> {
  const db = getDb();
  const result = await db.execute({
    sql: `SELECT id, name, created_at FROM users WHERE id = ?`,
    args: [id],
  });
  return result.rows.length > 0 ? (result.rows[0] as unknown as User) : null;
}

export async function createUser(name: string): Promise<User> {
  const db = getDb();
  const result = await db.execute({
    sql: `INSERT INTO users (name) VALUES (?)`,
    args: [name.trim()],
  });
  const user = await getUserById(Number(result.lastInsertRowid));
  if (!user) throw new Error("Failed to create user");
  return user;
}

export async function updateUser(
  id: number,
  name: string,
): Promise<User | null> {
  const db = getDb();
  await db.execute({
    sql: `UPDATE users SET name = ? WHERE id = ?`,
    args: [name.trim(), id],
  });
  return getUserById(id);
}

export async function deleteUser(id: number): Promise<void> {
  const db = getDb();
  await db.execute({
    sql: `DELETE FROM users WHERE id = ?`,
    args: [id],
  });
}

// ─── Audit helpers ────────────────────────────────────────────────────────────

export async function createAudit(input: {
  ticket_id: number;
  modification: AuditModification;
  changes?: AuditChanges;
}): Promise<void> {
  const db = getDb();
  await db.execute({
    sql: `
      INSERT INTO ticket_audits (ticket_id, modification, changes)
      VALUES (?, ?, ?)
    `,
    args: [
      input.ticket_id,
      input.modification,
      input.changes && Object.keys(input.changes).length > 0
        ? JSON.stringify(input.changes)
        : null,
    ],
  });
}

export async function getAuditsByTicketId(
  ticketId: number,
): Promise<ParsedAudit[]> {
  const db = getDb();
  const result = await db.execute({
    sql: `
      SELECT id, ticket_id, modification, changes, created_at
      FROM ticket_audits WHERE ticket_id = ? ORDER BY created_at DESC
    `,
    args: [ticketId],
  });
  return result.rows.map((r: any) => ({
    ...r,
    changes: r.changes ? (JSON.parse(r.changes) as AuditChanges) : null,
  }));
}
