'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface TicketSummary {
  id: number;
  title: string;
  priority: 'Urgent' | 'Important' | 'Backlog';
}

interface Epic {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  blockers: number[];
  tickets: TicketSummary[];
  created_at: string;
  updated_at: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  Urgent: 'bg-red-100 text-red-700',
  Important: 'bg-amber-100 text-amber-700',
  Backlog: 'bg-slate-100 text-slate-600',
};

function formatDate(s: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(s));
}

// ─── Blocker multi-select (reusable within this file) ─────────────────────────
function BlockerSelect({
  allEpics,
  selfId,
  selected,
  onChange,
}: {
  allEpics: Epic[];
  selfId?: number;
  selected: number[];
  onChange: (ids: number[]) => void;
}) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const options = allEpics.filter(
    (e) =>
      e.id !== selfId &&
      !selected.includes(e.id) &&
      (search === '' || e.title.toLowerCase().includes(search.toLowerCase()) || String(e.id).includes(search))
  );

  function remove(id: number) {
    onChange(selected.filter((s) => s !== id));
  }

  function add(id: number) {
    onChange([...selected, id]);
    setSearch('');
    setOpen(false);
  }

  return (
    <div>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selected.map((id) => {
            const e = allEpics.find((x) => x.id === id);
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border bg-slate-100 border-slate-300 text-slate-700 font-medium"
              >
                <span className="font-mono text-slate-400">#{id}</span>
                {e?.title.slice(0, 28)}{e && e.title.length > 28 ? '…' : ''}
                <button type="button" onClick={() => remove(id)} className="ml-0.5 text-slate-400 hover:text-slate-600">×</button>
              </span>
            );
          })}
        </div>
      )}
      <div ref={ref} className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={allEpics.filter((e) => e.id !== selfId).length === 0 ? 'No other epics yet' : 'Search epics…'}
          disabled={allEpics.filter((e) => e.id !== selfId).length === 0}
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-400"
        />
        {open && options.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-40 overflow-y-auto">
            {options.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => add(e.id)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-brand-50 transition-colors flex items-center gap-2"
              >
                <span className="font-mono text-xs text-slate-400">#{e.id}</span>
                <span className="truncate text-slate-700">{e.title}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Create form ──────────────────────────────────────────────────────────────
function CreateEpicForm({
  allEpics,
  onCreated,
}: {
  allEpics: Epic[];
  onCreated: (epic: Epic) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [blockers, setBlockers] = useState<number[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required'); return; }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/epics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), description: description.trim(), blockers }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to create epic'); return; }
      onCreated(data);
      setTitle('');
      setDescription('');
      setBlockers([]);
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-700 mb-4">Create New Epic</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <input
            type="text"
            value={title}
            onChange={(e) => { setTitle(e.target.value); if (error) setError(''); }}
            placeholder="Epic title…"
            className={`w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent ${error ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
          />
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)…"
          rows={3}
          className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-y"
        />
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">
            Blocked by <span className="font-normal">(other epics blocking this one)</span>
          </label>
          <BlockerSelect allEpics={allEpics} selected={blockers} onChange={setBlockers} />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-60 shadow-sm"
          >
            {saving ? 'Creating…' : 'Create Epic'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Edit form (inline) ───────────────────────────────────────────────────────
function EditEpicForm({
  epic,
  allEpics,
  onSaved,
  onCancel,
}: {
  epic: Epic;
  allEpics: Epic[];
  onSaved: (epic: Epic) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(epic.title);
  const [description, setDescription] = useState(epic.description);
  const [completed, setCompleted] = useState(epic.completed);
  const [blockers, setBlockers] = useState<number[]>(epic.blockers);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required'); return; }
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/epics/${epic.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), description: description.trim(), completed, blockers }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to save'); return; }
      onSaved(data);
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-5 space-y-3 bg-brand-50/40 border-t border-brand-100">
      <div>
        <input
          type="text"
          value={title}
          onChange={(e) => { setTitle(e.target.value); if (error) setError(''); }}
          placeholder="Epic title…"
          autoFocus
          className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent ${error ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white'}`}
        />
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description…"
        rows={3}
        className="w-full px-3 py-2 text-sm border border-slate-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-y"
      />
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={completed}
          onChange={(e) => setCompleted(e.target.checked)}
          className="w-4 h-4 rounded accent-brand-600"
        />
        <span className="text-sm text-slate-700">Mark as completed</span>
      </label>
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1.5">
          Blocked by <span className="font-normal">(other epics blocking this one)</span>
        </label>
        <BlockerSelect allEpics={allEpics} selfId={epic.id} selected={blockers} onChange={setBlockers} />
      </div>
      <div className="flex gap-2 justify-end pt-1">
        <button type="button" onClick={onCancel} className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={saving} className="px-3 py-1.5 text-xs font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-60">
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}

// ─── Epic row ─────────────────────────────────────────────────────────────────
function EpicRow({
  epic,
  allEpics,
  onUpdated,
  onDeleted,
}: {
  epic: Epic;
  allEpics: Epic[];
  onUpdated: (epic: Epic) => void;
  onDeleted: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete epic "${epic.title}"? Tickets under it will be unlinked.`)) return;
    setDeleting(true);
    try {
      await fetch(`/api/epics/${epic.id}`, { method: 'DELETE' });
      onDeleted(epic.id);
    } catch {
      setDeleting(false);
    }
  }

  async function handleToggleCompleted() {
    try {
      const res = await fetch(`/api/epics/${epic.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !epic.completed }),
      });
      if (res.ok) onUpdated(await res.json());
    } catch {
      // ignore
    }
  }

  return (
    <li className="border-b border-slate-100 last:border-0">
      {/* Header row */}
      <div className="px-5 py-4 flex items-start gap-3">
        {/* Completed toggle */}
        <button
          onClick={handleToggleCompleted}
          title={epic.completed ? 'Mark incomplete' : 'Mark complete'}
          className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
            epic.completed
              ? 'bg-green-500 border-green-500 text-white'
              : 'border-slate-300 hover:border-green-400'
          }`}
        >
          {epic.completed && (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs text-slate-400">#{epic.id}</span>
            <span className={`text-sm font-semibold ${epic.completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>
              {epic.title}
            </span>
            {epic.completed && (
              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">Done</span>
            )}
          </div>
          {epic.description && (
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{epic.description}</p>
          )}
          <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
            <span>{epic.tickets.length} ticket{epic.tickets.length !== 1 ? 's' : ''}</span>
            {epic.blockers.length > 0 && (
              <span>{epic.blockers.length} blocker{epic.blockers.length !== 1 ? 's' : ''}</span>
            )}
            <span>Created {formatDate(epic.created_at)}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {epic.tickets.length > 0 && (
            <button
              onClick={() => setExpanded((p) => !p)}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              title={expanded ? 'Hide tickets' : 'Show tickets'}
            >
              <svg
                className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
          <button
            onClick={() => { setEditing((p) => !p); setExpanded(false); }}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            title="Edit"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
            title="Delete"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Ticket list */}
      {expanded && epic.tickets.length > 0 && (
        <div className="px-5 pb-3 ml-8">
          <div className="border border-slate-100 rounded-xl overflow-hidden">
            {epic.tickets.map((t) => (
              <Link
                key={t.id}
                href={`/tickets/${t.id}`}
                className="flex items-center gap-2 px-3 py-2.5 text-sm border-b border-slate-100 last:border-0 hover:bg-brand-50 transition-colors group"
              >
                <span className="font-mono text-xs text-slate-400">#{t.id}</span>
                <span className="flex-1 truncate text-slate-700 group-hover:text-brand-700">{t.title}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[t.priority]}`}>
                  {t.priority}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Blocker list */}
      {expanded && epic.blockers.length > 0 && (
        <div className="px-5 pb-3 ml-8">
          <p className="text-xs font-medium text-slate-400 mb-1.5">Blocked by</p>
          <div className="flex flex-wrap gap-2">
            {epic.blockers.map((bid) => {
              const be = allEpics.find((x) => x.id === bid);
              return (
                <span key={bid} className="text-xs px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-md text-slate-600 font-medium">
                  #{bid}{be ? ` ${be.title.slice(0, 24)}` : ''}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Edit form */}
      {editing && (
        <EditEpicForm
          epic={epic}
          allEpics={allEpics}
          onSaved={(updated) => { onUpdated(updated); setEditing(false); }}
          onCancel={() => setEditing(false)}
        />
      )}
    </li>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function EpicsPage() {
  const [epics, setEpics] = useState<Epic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/epics')
      .then((r) => r.json())
      .then(setEpics)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleCreated(epic: Epic) {
    setEpics((prev) => [epic, ...prev]);
  }

  function handleUpdated(updated: Epic) {
    setEpics((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
  }

  function handleDeleted(id: number) {
    setEpics((prev) => prev.filter((e) => e.id !== id));
  }

  const open = epics.filter((e) => !e.completed);
  const done = epics.filter((e) => e.completed);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Epics</h1>
        <p className="text-slate-500 text-sm mt-1">Group related tickets into larger initiatives.</p>
      </div>

      <CreateEpicForm allEpics={epics} onCreated={handleCreated} />

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-xl px-5 py-8 text-center text-sm text-slate-400 shadow-sm">
          Loading epics…
        </div>
      ) : epics.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl px-5 py-8 text-center text-sm text-slate-400 shadow-sm">
          No epics yet. Create one above.
        </div>
      ) : (
        <div className="space-y-4">
          {open.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Open — {open.length}
                </span>
              </div>
              <ul>
                {open.map((e) => (
                  <EpicRow
                    key={e.id}
                    epic={e}
                    allEpics={epics}
                    onUpdated={handleUpdated}
                    onDeleted={handleDeleted}
                  />
                ))}
              </ul>
            </div>
          )}
          {done.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm opacity-75">
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Completed — {done.length}
                </span>
              </div>
              <ul>
                {done.map((e) => (
                  <EpicRow
                    key={e.id}
                    epic={e}
                    allEpics={epics}
                    onUpdated={handleUpdated}
                    onDeleted={handleDeleted}
                  />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
