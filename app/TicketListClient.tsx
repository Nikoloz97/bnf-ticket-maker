"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import TicketCard from "@/components/TicketCard";

interface Ticket {
  id: number;
  title: string;
  priority: "Urgent" | "Important" | "Backlog";
  areas: string[];
  reported_by: string;
  difficulty: number;
  created_at: string;
  description: string;
  progress: "Not Started" | "In Progress" | "Completed";
  epic_id: number | null;
}

interface Epic {
  id: number;
  title: string;
}

const PRESET_AREAS = [
  "Frontend",
  "Backend",
  "Design",
  "DevOps",
  "Database",
  "API",
  "Mobile",
  "Docs",
];

interface TicketListClientProps {
  initialTickets: Ticket[];
  initialEpics: Epic[];
}

export default function TicketListClient({
  initialTickets,
  initialEpics,
}: TicketListClientProps) {
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [areaFilter, setAreaFilter] = useState<string>("");
  const [progressFilter, setProgressFilter] = useState<string>("");
  const [epicFilter, setEpicFilter] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  const allAreas = useMemo(() => {
    const areaSet = new Set<string>();
    initialTickets.forEach((t) => t.areas.forEach((a) => areaSet.add(a)));
    return Array.from(areaSet).sort();
  }, [initialTickets]);

  const epicMap = useMemo(() => {
    const map = new Map<number, string>();
    initialEpics.forEach((e) => map.set(e.id, e.title));
    return map;
  }, [initialEpics]);

  const filtered = useMemo(() => {
    return initialTickets.filter((ticket) => {
      if (priorityFilter && ticket.priority !== priorityFilter) return false;
      if (areaFilter && !ticket.areas.includes(areaFilter)) return false;
      if (progressFilter && ticket.progress !== progressFilter) return false;
      if (epicFilter) {
        if (epicFilter === "none") {
          if (ticket.epic_id !== null) return false;
        } else if (ticket.epic_id !== Number(epicFilter)) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        if (
          !ticket.title.toLowerCase().includes(q) &&
          !ticket.reported_by.toLowerCase().includes(q) &&
          !ticket.description.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [initialTickets, priorityFilter, areaFilter, progressFilter, epicFilter, search]);

  const counts = useMemo(() => {
    return {
      urgent: initialTickets.filter((t) => t.priority === "Urgent").length,
      important: initialTickets.filter((t) => t.priority === "Important")
        .length,
      backlog: initialTickets.filter((t) => t.priority === "Backlog").length,
    };
  }, [initialTickets]);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tickets</h1>
          <p className="text-slate-500 text-sm mt-1">
            {initialTickets.length} ticket
            {initialTickets.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <Link
          href="/new"
          className="inline-flex items-center gap-2 bg-brand-600 text-white px-5 py-2.5 rounded-lg hover:bg-brand-700 transition-colors font-medium shadow-sm text-sm"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
          New Ticket
        </Link>
      </div>

      {/* Stats row */}
      {initialTickets.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <button
            onClick={() =>
              setPriorityFilter(priorityFilter === "Urgent" ? "" : "Urgent")
            }
            className={`rounded-xl p-4 border text-left transition-all ${
              priorityFilter === "Urgent"
                ? "bg-red-50 border-red-300 shadow-sm"
                : "bg-white border-slate-200 hover:border-red-200 hover:bg-red-50/50"
            }`}
          >
            <div className="text-2xl font-bold text-red-600">
              {counts.urgent}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Urgent</div>
          </button>
          <button
            onClick={() =>
              setPriorityFilter(
                priorityFilter === "Important" ? "" : "Important",
              )
            }
            className={`rounded-xl p-4 border text-left transition-all ${
              priorityFilter === "Important"
                ? "bg-amber-50 border-amber-300 shadow-sm"
                : "bg-white border-slate-200 hover:border-amber-200 hover:bg-amber-50/50"
            }`}
          >
            <div className="text-2xl font-bold text-amber-600">
              {counts.important}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Important</div>
          </button>
          <button
            onClick={() =>
              setPriorityFilter(priorityFilter === "Backlog" ? "" : "Backlog")
            }
            className={`rounded-xl p-4 border text-left transition-all ${
              priorityFilter === "Backlog"
                ? "bg-slate-100 border-slate-400 shadow-sm"
                : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            <div className="text-2xl font-bold text-slate-600">
              {counts.backlog}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Backlog</div>
          </button>
        </div>
      )}

      {/* Filters */}
      {initialTickets.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search tickets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white"
            />
          </div>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-slate-700"
          >
            <option value="">All Priorities</option>
            <option value="Urgent">Urgent</option>
            <option value="Important">Important</option>
            <option value="Backlog">Backlog</option>
          </select>
          <select
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-slate-700"
          >
            <option value="">All Areas</option>
            {allAreas.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
          <select
            value={progressFilter}
            onChange={(e) => setProgressFilter(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-slate-700"
          >
            <option value="">All Progress</option>
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
          {initialEpics.length > 0 && (
            <select
              value={epicFilter}
              onChange={(e) => setEpicFilter(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-slate-700"
            >
              <option value="">All Epics</option>
              <option value="none">No Epic</option>
              {initialEpics.map((epic) => (
                <option key={epic.id} value={String(epic.id)}>
                  {epic.title}
                </option>
              ))}
            </select>
          )}
          {(priorityFilter || areaFilter || progressFilter || epicFilter || search) && (
            <button
              onClick={() => {
                setPriorityFilter("");
                setAreaFilter("");
                setProgressFilter("");
                setEpicFilter("");
                setSearch("");
              }}
              className="text-sm text-slate-500 hover:text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Ticket list */}
      {initialTickets.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
          <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
            <svg
              className="w-8 h-8 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-1">
            No tickets yet
          </h3>
          <p className="text-slate-400 text-sm mb-6">
            Get started by creating your first ticket.
          </p>
          <Link
            href="/new"
            className="inline-flex items-center gap-2 bg-brand-600 text-white px-5 py-2.5 rounded-lg hover:bg-brand-700 transition-colors font-medium text-sm"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create First Ticket
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <p className="text-slate-500 text-sm">
            No tickets match your filters.
          </p>
          <button
            onClick={() => {
              setPriorityFilter("");
              setAreaFilter("");
              setProgressFilter("");
              setEpicFilter("");
              setSearch("");
            }}
            className="mt-3 text-sm text-brand-600 hover:text-brand-700 font-medium"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              epicName={ticket.epic_id ? epicMap.get(ticket.epic_id) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
