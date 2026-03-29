'use client';

import { useState, useEffect } from 'react';

interface User {
  id: number;
  name: string;
  created_at: string;
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(dateString));
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [addError, setAddError] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editError, setEditError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/users')
      .then((r) => r.json())
      .then((data) => setUsers(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) {
      setAddError('Name is required');
      return;
    }
    setAdding(true);
    setAddError('');
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddError(data.error || 'Failed to add user');
        return;
      }
      setUsers((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName('');
    } catch {
      setAddError('An unexpected error occurred');
    } finally {
      setAdding(false);
    }
  }

  function startEdit(user: User) {
    setEditingId(user.id);
    setEditName(user.name);
    setEditError('');
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName('');
    setEditError('');
  }

  async function handleSave(id: number) {
    const name = editName.trim();
    if (!name) {
      setEditError('Name is required');
      return;
    }
    setSaving(true);
    setEditError('');
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditError(data.error || 'Failed to update user');
        return;
      }
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? data : u)).sort((a, b) => a.name.localeCompare(b.name))
      );
      setEditingId(null);
    } catch {
      setEditError('An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (!res.ok) return;
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Manage Users</h1>
        <p className="text-slate-500 text-sm mt-1">Add, edit, or remove users who can report tickets.</p>
      </div>

      {/* Add user form */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Add New User</h2>
        <form onSubmit={handleAdd} className="flex gap-2">
          <div className="flex-1">
            <input
              type="text"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                if (addError) setAddError('');
              }}
              placeholder="Full name..."
              className={`w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors ${
                addError ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white'
              }`}
            />
            {addError && <p className="mt-1 text-xs text-red-600">{addError}</p>}
          </div>
          <button
            type="submit"
            disabled={adding}
            className="px-4 py-2.5 text-sm font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm flex-shrink-0"
          >
            {adding ? 'Adding…' : 'Add User'}
          </button>
        </form>
      </div>

      {/* User list */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="px-5 py-8 text-center text-sm text-slate-400">Loading users…</div>
        ) : users.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-slate-400">
            No users yet. Add one above.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {users.map((user) => (
              <li key={user.id} className="px-5 py-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>

                {editingId === user.id ? (
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => {
                          setEditName(e.target.value);
                          if (editError) setEditError('');
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSave(user.id);
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        autoFocus
                        className={`w-full px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent ${
                          editError ? 'border-red-300 bg-red-50' : 'border-slate-200'
                        }`}
                      />
                      {editError && <p className="mt-1 text-xs text-red-600">{editError}</p>}
                    </div>
                    <button
                      onClick={() => handleSave(user.id)}
                      disabled={saving}
                      className="px-3 py-1.5 text-xs font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-60"
                    >
                      {saving ? 'Saving…' : 'Save'}
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900">{user.name}</div>
                      <div className="text-xs text-slate-400">Added {formatDate(user.created_at)}</div>
                    </div>
                    <button
                      onClick={() => startEdit(user)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      disabled={deletingId === user.id}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
