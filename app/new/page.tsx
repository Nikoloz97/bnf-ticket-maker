"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import AreaTag from "@/components/AreaTag";

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

interface TicketSummary {
  id: number;
  title: string;
}

interface User {
  id: number;
  name: string;
}

interface EpicSummary {
  id: number;
  title: string;
}

interface FormErrors {
  title?: string;
  reported_by?: string;
  description?: string;
  priority?: string;
  general?: string;
}

export default function NewTicketPage() {
  const router = useRouter();

  // Form fields
  const [title, setTitle] = useState("");
  const [reportedBy, setReportedBy] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"Urgent" | "Important" | "Backlog">(
    "Backlog",
  );
  const [difficulty, setDifficulty] = useState(3);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [customAreaInput, setCustomAreaInput] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [progress, setProgress] = useState<
    "Not Started" | "In Progress" | "Completed"
  >("Not Started");
  const [resolution, setResolution] = useState("");
  const [selectedBlockers, setSelectedBlockers] = useState<number[]>([]);
  const [epicId, setEpicId] = useState<string>("");

  // UI state
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [allTickets, setAllTickets] = useState<TicketSummary[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [epics, setEpics] = useState<EpicSummary[]>([]);
  const [blockerSearch, setBlockerSearch] = useState("");
  const [blockerDropdownOpen, setBlockerDropdownOpen] = useState(false);
  const blockerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/ticket-summaries")
      .then((r) => r.json())
      .then((data) => setAllTickets(data))
      .catch(() => {});
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => setUsers(data))
      .catch(() => {});
    fetch("/api/epics")
      .then((r) => r.json())
      .then((data: Array<{ id: number; title: string }>) => setEpics(data))
      .catch(() => {});
  }, []);

  // Close blocker dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        blockerRef.current &&
        !blockerRef.current.contains(e.target as Node)
      ) {
        setBlockerDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const toggleArea = (area: string) => {
    setSelectedAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area],
    );
  };

  const addCustomArea = () => {
    const area = customAreaInput.trim();
    if (area && !selectedAreas.includes(area)) {
      setSelectedAreas((prev) => [...prev, area]);
    }
    setCustomAreaInput("");
  };

  const removeArea = (area: string) => {
    setSelectedAreas((prev) => prev.filter((a) => a !== area));
  };

  const toggleBlocker = (id: number) => {
    setSelectedBlockers((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id],
    );
  };

  const removeBlocker = (id: number) => {
    setSelectedBlockers((prev) => prev.filter((b) => b !== id));
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!title.trim()) newErrors.title = "Title is required";
    if (!reportedBy.trim()) newErrors.reported_by = "Reported by is required";
    if (!description.trim()) newErrors.description = "Description is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setErrors({});

    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("reported_by", reportedBy.trim());
      if (assignedTo) formData.append("assigned_to", assignedTo);
      formData.append("progress", progress);
      if (resolution.trim()) formData.append("resolution", resolution.trim());
      formData.append("description", description.trim());
      formData.append("priority", priority);
      formData.append("difficulty", String(difficulty));
      formData.append("areas", JSON.stringify(selectedAreas));
      formData.append("blockers", JSON.stringify(selectedBlockers));
      if (epicId) formData.append("epic_id", epicId);

      const res = await fetch("/api/tickets", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.errors) {
          setErrors(data.errors);
        } else {
          setErrors({ general: data.error || "Failed to create ticket" });
        }
        return;
      }

      const ticket = await res.json();
      router.push(`/tickets/${ticket.id}`);
    } catch {
      setErrors({ general: "An unexpected error occurred. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredBlockerOptions = allTickets.filter(
    (t) =>
      !selectedBlockers.includes(t.id) &&
      (blockerSearch === "" ||
        t.title.toLowerCase().includes(blockerSearch.toLowerCase()) ||
        String(t.id).includes(blockerSearch)),
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Create New Ticket</h1>
        <p className="text-slate-500 text-sm mt-1">
          Fill in the details below to submit a new ticket.
        </p>
      </div>

      {errors.general && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Brief, descriptive title..."
            className={`w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors ${
              errors.title
                ? "border-red-300 bg-red-50"
                : "border-slate-200 bg-white"
            }`}
          />
          {errors.title && (
            <p className="mt-1.5 text-xs text-red-600">{errors.title}</p>
          )}
        </div>

        {/* Reported By */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Reported by <span className="text-red-500">*</span>
          </label>
          {users.length === 0 ? (
            <div
              className={`w-full px-4 py-2.5 text-sm border rounded-lg bg-slate-50 text-slate-400 ${errors.reported_by ? "border-red-300" : "border-slate-200"}`}
            >
              No users yet —{" "}
              <a
                href="/users"
                className="text-brand-600 hover:underline font-medium"
              >
                add users first
              </a>
            </div>
          ) : (
            <select
              value={reportedBy}
              onChange={(e) => setReportedBy(e.target.value)}
              className={`w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors bg-white ${
                errors.reported_by
                  ? "border-red-300 bg-red-50"
                  : "border-slate-200"
              }`}
            >
              <option value="">Reported by…</option>
              {users.map((u) => (
                <option key={u.id} value={u.name}>
                  {u.name}
                </option>
              ))}
            </select>
          )}
          {errors.reported_by && (
            <p className="mt-1.5 text-xs text-red-600">{errors.reported_by}</p>
          )}
        </div>

        {/* Assigned To */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Assigned To{" "}
            <span className="text-slate-400 font-normal text-xs">
              (optional)
            </span>
          </label>
          {users.length === 0 ? (
            <div className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-400">
              No users yet —{" "}
              <a
                href="/users"
                className="text-brand-600 hover:underline font-medium"
              >
                add users first
              </a>
            </div>
          ) : (
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors bg-white"
            >
              <option value="">Unassigned</option>
              {users.map((u) => (
                <option key={u.id} value={u.name}>
                  {u.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Progress */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Progress
          </label>
          <div className="flex gap-3">
            {(["Not Started", "In Progress", "Completed"] as const).map((p) => {
              const isSelected = progress === p;
              const colorMap = {
                "Not Started": isSelected
                  ? "bg-slate-600 border-slate-600 text-white"
                  : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50",
                "In Progress": isSelected
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50",
                Completed: isSelected
                  ? "bg-green-600 border-green-600 text-white"
                  : "bg-white border-slate-200 text-slate-700 hover:border-green-300 hover:bg-green-50",
              };
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setProgress(p)}
                  className={`flex-1 py-2.5 text-sm font-medium border rounded-lg transition-all ${colorMap[p]}`}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>

        {/* Resolution */}
        <div>
          <label
            className={`block text-sm font-medium mb-1.5 ${progress === "Completed" ? "text-slate-700" : "text-slate-400"}`}
          >
            Resolution
            <span className="ml-2 text-xs font-normal text-slate-400">
              {progress === "Completed"
                ? "(optional)"
                : "(available when Completed)"}
            </span>
          </label>
          <textarea
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            disabled={progress !== "Completed"}
            placeholder={
              progress === "Completed"
                ? "Describe how this ticket was resolved…"
                : "Set progress to Completed to add a resolution…"
            }
            rows={3}
            className={`w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors resize-y ${
              progress !== "Completed"
                ? "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
                : "border-slate-200 bg-white"
            }`}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue, feature request, or task in detail..."
            rows={5}
            className={`w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors resize-y ${
              errors.description
                ? "border-red-300 bg-red-50"
                : "border-slate-200 bg-white"
            }`}
          />
          {errors.description && (
            <p className="mt-1.5 text-xs text-red-600">{errors.description}</p>
          )}
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Priority <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-3">
            {(["Urgent", "Important", "Backlog"] as const).map((p) => {
              const isSelected = priority === p;
              const colorMap = {
                Urgent: isSelected
                  ? "bg-red-600 border-red-600 text-white"
                  : "bg-white border-slate-200 text-slate-700 hover:border-red-300 hover:bg-red-50",
                Important: isSelected
                  ? "bg-amber-500 border-amber-500 text-white"
                  : "bg-white border-slate-200 text-slate-700 hover:border-amber-300 hover:bg-amber-50",
                Backlog: isSelected
                  ? "bg-slate-600 border-slate-600 text-white"
                  : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50",
              };
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`flex-1 py-2.5 text-sm font-medium border rounded-lg transition-all ${colorMap[p]}`}
                >
                  {p}
                </button>
              );
            })}
          </div>
          {errors.priority && (
            <p className="mt-1.5 text-xs text-red-600">{errors.priority}</p>
          )}
        </div>

        {/* Difficulty */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Difficulty{" "}
            <span className="text-slate-400 font-normal text-xs">
              (1 = easy, 5 = very hard)
            </span>
          </label>
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setDifficulty(level)}
                  title={`Difficulty ${level}`}
                  className={`w-10 h-10 rounded-lg border-2 text-sm font-semibold transition-all ${
                    level <= difficulty
                      ? "bg-brand-600 border-brand-600 text-white shadow-sm"
                      : "bg-white border-slate-200 text-slate-400 hover:border-brand-300"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
            <span className="text-sm text-slate-500">
              {difficulty === 1 && "Very easy"}
              {difficulty === 2 && "Easy"}
              {difficulty === 3 && "Moderate"}
              {difficulty === 4 && "Hard"}
              {difficulty === 5 && "Very hard"}
            </span>
          </div>
        </div>

        {/* Areas */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Areas
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {PRESET_AREAS.map((area) => {
              const isSelected = selectedAreas.includes(area);
              return (
                <button
                  key={area}
                  type="button"
                  onClick={() => toggleArea(area)}
                  className={`text-xs px-3 py-1.5 rounded-md border font-medium transition-all ${
                    isSelected
                      ? "bg-brand-600 border-brand-600 text-white"
                      : "bg-white border-slate-200 text-slate-600 hover:border-brand-300 hover:bg-brand-50"
                  }`}
                >
                  {area}
                </button>
              );
            })}
          </div>
          {selectedAreas.filter((a) => !PRESET_AREAS.includes(a)).length >
            0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedAreas
                .filter((a) => !PRESET_AREAS.includes(a))
                .map((area) => (
                  <span
                    key={area}
                    className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-md border bg-brand-600 border-brand-600 text-white font-medium"
                  >
                    {area}
                    <button
                      type="button"
                      onClick={() => removeArea(area)}
                      className="ml-0.5 hover:text-brand-200"
                    >
                      ×
                    </button>
                  </span>
                ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={customAreaInput}
              onChange={(e) => setCustomAreaInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustomArea();
                }
              }}
              placeholder="Add custom area..."
              className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={addCustomArea}
              disabled={!customAreaInput.trim()}
              className="px-4 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium"
            >
              Add
            </button>
          </div>
        </div>

        {/* Blockers */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Blocked by{" "}
            <span className="text-slate-400 font-normal text-xs">
              (other tickets blocking this one)
            </span>
          </label>

          {selectedBlockers.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedBlockers.map((id) => {
                const ticket = allTickets.find((t) => t.id === id);
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border bg-slate-100 border-slate-300 text-slate-700 font-medium"
                  >
                    <span className="font-mono text-slate-400">#{id}</span>
                    {ticket?.title.slice(0, 30)}
                    {ticket && ticket.title.length > 30 ? "…" : ""}
                    <button
                      type="button"
                      onClick={() => removeBlocker(id)}
                      className="ml-0.5 text-slate-400 hover:text-slate-600"
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
          )}

          <div ref={blockerRef} className="relative">
            <input
              type="text"
              value={blockerSearch}
              onChange={(e) => {
                setBlockerSearch(e.target.value);
                setBlockerDropdownOpen(true);
              }}
              onFocus={() => setBlockerDropdownOpen(true)}
              placeholder={
                allTickets.length === 0
                  ? "No other tickets yet"
                  : "Search tickets by ID or title..."
              }
              disabled={allTickets.length === 0}
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-400"
            />
            {blockerDropdownOpen && filteredBlockerOptions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto scrollbar-thin">
                {filteredBlockerOptions.map((ticket) => (
                  <button
                    key={ticket.id}
                    type="button"
                    onClick={() => {
                      toggleBlocker(ticket.id);
                      setBlockerSearch("");
                      setBlockerDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-brand-50 transition-colors flex items-center gap-2"
                  >
                    <span className="font-mono text-xs text-slate-400">
                      #{ticket.id}
                    </span>
                    <span className="text-slate-700 truncate">
                      {ticket.title}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Epic */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Epic{" "}
            <span className="text-slate-400 font-normal text-xs">
              (optional)
            </span>
          </label>
          {epics.length === 0 ? (
            <div className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-400">
              No epics yet —{" "}
              <a
                href="/epics"
                className="text-brand-600 hover:underline font-medium"
              >
                create an epic first
              </a>
            </div>
          ) : (
            <select
              value={epicId}
              onChange={(e) => setEpicId(e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors bg-white"
            >
              <option value="">None</option>
              {epics.map((ep) => (
                <option key={ep.id} value={String(ep.id)}>
                  {ep.title}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-2.5 text-sm font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Creating ticket…
              </>
            ) : (
              "Create Ticket"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
