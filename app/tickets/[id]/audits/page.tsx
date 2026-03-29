'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

type Modification = 'add' | 'edit' | 'delete';
type AuditChanges = Record<string, { before: string; after: string }>;

interface Audit {
  id: number;
  ticket_id: number;
  modification: Modification;
  changes: AuditChanges | null;
  created_at: string;
}

function formatDate(s: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  }).format(new Date(s));
}

const MOD_STYLES: Record<Modification, string> = {
  add:    'bg-green-100 text-green-700',
  edit:   'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-red-700',
};
const MOD_LABELS: Record<Modification, string> = {
  add: 'Add', edit: 'Edit', delete: 'Delete',
};

function DetailsModal({ changes, onClose }: { changes: AuditChanges; onClose: () => void }) {
  const entries = Object.entries(changes);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">Change Details</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Before / After column headers */}
        <div className="grid grid-cols-[160px_1fr_1fr] gap-0 px-6 py-2 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
          <span>Field</span>
          <span className="pl-3">Before</span>
          <span className="pl-3">After</span>
        </div>

        {/* Rows */}
        <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
          {entries.map(([field, { before, after }]) => (
            <div key={field} className="grid grid-cols-[160px_1fr_1fr] gap-0 px-6 py-3 text-sm items-start">
              <span className="font-medium text-slate-600 pt-0.5">{field}</span>
              <div className="pl-3 pr-2">
                <span className="inline-block px-2 py-1 rounded bg-red-50 text-red-700 text-xs whitespace-pre-wrap break-words max-w-full">
                  {before}
                </span>
              </div>
              <div className="pl-3">
                <span className="inline-block px-2 py-1 rounded bg-green-50 text-green-700 text-xs whitespace-pre-wrap break-words max-w-full">
                  {after}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AuditsPage() {
  const params = useParams();
  const ticketId = params.id as string;

  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [ticketTitle, setTicketTitle] = useState('');
  const [activeChanges, setActiveChanges] = useState<AuditChanges | null>(null);

  useEffect(() => {
    fetch(`/api/tickets/${ticketId}/audits`)
      .then((r) => r.json())
      .then((data: Audit[]) => {
        setAudits(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [ticketId]);

  // Fetch ticket title from ticket API
  useEffect(() => {
    fetch(`/api/tickets/${ticketId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((t) => { if (t?.title) setTicketTitle(t.title); })
      .catch(() => {});
  }, [ticketId]);

  return (
    <div className="max-w-5xl mx-auto">
      {activeChanges && (
        <DetailsModal changes={activeChanges} onClose={() => setActiveChanges(null)} />
      )}

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link href="/" className="hover:text-brand-600 transition-colors">All Tickets</Link>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <Link href={`/tickets/${ticketId}`} className="hover:text-brand-600 transition-colors font-mono">
          #{ticketId}
        </Link>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-slate-400">Audits</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Audit Log</h1>
        {ticketTitle && (
          <p className="text-slate-500 text-sm mt-1">{ticketTitle}</p>
        )}
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-xl px-5 py-10 text-center text-sm text-slate-400 shadow-sm">
          Loading audits…
        </div>
      ) : audits.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl px-5 py-10 text-center shadow-sm">
          <p className="text-sm text-slate-400">No audit records yet for this ticket.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          {/* Table header */}
          <div className="grid grid-cols-[180px_120px_100px] gap-0 px-5 py-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <span>Date Changed</span>
            <span>Modification</span>
            <span>Details</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-slate-100">
            {audits.map((audit) => (
              <div
                key={audit.id}
                className="grid grid-cols-[180px_120px_100px] gap-0 px-5 py-3.5 items-center text-sm hover:bg-slate-50/50 transition-colors"
              >
                {/* Date */}
                <span className="text-slate-500 text-xs">{formatDate(audit.created_at)}</span>

                {/* Modification badge */}
                <span>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${MOD_STYLES[audit.modification]}`}>
                    {MOD_LABELS[audit.modification]}
                  </span>
                </span>

                {/* Details */}
                <span>
                  {audit.modification === 'edit' && audit.changes && Object.keys(audit.changes).length > 0 ? (
                    <button
                      onClick={() => setActiveChanges(audit.changes)}
                      className="text-xs font-medium text-brand-600 hover:text-brand-700 px-2.5 py-1 rounded-lg border border-brand-200 hover:bg-brand-50 transition-colors"
                    >
                      View Details
                    </button>
                  ) : (
                    <span className="text-slate-300 text-xs">—</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
