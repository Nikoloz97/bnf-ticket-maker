import { notFound } from "next/navigation";
import Link from "next/link";
import { getTicketById, getTicketsByIds, getEpicById } from "@/lib/db";
import PriorityBadge from "@/components/PriorityBadge";
import DifficultyDots from "@/components/DifficultyDots";
import AreaTag from "@/components/AreaTag";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default async function TicketDetailPage({ params }: PageProps) {
  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  if (isNaN(id)) notFound();

  const ticket = await getTicketById(id);
  if (!ticket) notFound();

  const [blockerTickets, epic] = await Promise.all([
    getTicketsByIds(ticket.blockers),
    ticket.epic_id ? getEpicById(ticket.epic_id) : Promise.resolve(null),
  ]);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link href="/" className="hover:text-brand-600 transition-colors">
          All Tickets
        </Link>
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-slate-400 font-mono">#{ticket.id}</span>
      </nav>

      {/* Main card */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {/* Header */}
        <div className="px-6 pt-6 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-mono text-slate-400">
              #{ticket.id}
            </span>
            <PriorityBadge priority={ticket.priority} size="md" />
            {epic && (
              <span className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-violet-100 text-violet-700 border border-violet-200">
                {epic.title}
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-slate-900 leading-snug">
            {ticket.title}
          </h1>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4 text-sm text-slate-500">
            <div className="flex items-center gap-1.5">
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
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span>{ticket.reported_by}</span>
            </div>
            {ticket.assigned_to && (
              <div className="flex items-center gap-1.5">
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Assigned to {ticket.assigned_to}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              {
                {
                  "Not Started": (
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-600">
                      Not Started
                    </span>
                  ),
                  "In Progress": (
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                      In Progress
                    </span>
                  ),
                  Completed: (
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
                      Completed
                    </span>
                  ),
                }[ticket.progress]
              }
            </div>
            <div className="flex items-center gap-1.5">
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
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>{formatDate(ticket.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-6">
          {/* Metadata grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
                Difficulty
              </div>
              <DifficultyDots difficulty={ticket.difficulty} size="md" />
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
                Areas
              </div>
              {ticket.areas.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {ticket.areas.map((area) => (
                    <AreaTag key={area} area={area} size="md" />
                  ))}
                </div>
              ) : (
                <span className="text-sm text-slate-400">
                  No areas assigned
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <h2 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">
              Description
            </h2>
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {ticket.description}
              </p>
            </div>
          </div>

          {/* Resolution */}
          {ticket.resolution && (
            <div>
              <h2 className="text-xs font-medium text-green-600 uppercase tracking-wide mb-3">
                Resolution
              </h2>
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-sm text-green-800 leading-relaxed whitespace-pre-wrap">
                  {ticket.resolution}
                </p>
              </div>
            </div>
          )}

          {/* Blockers */}
          {blockerTickets.length > 0 && (
            <div>
              <h2 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">
                Blocked by ({blockerTickets.length})
              </h2>
              <div className="space-y-2">
                {blockerTickets.map((blocker) => (
                  <Link
                    key={blocker.id}
                    href={`/tickets/${blocker.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 hover:border-brand-300 hover:bg-brand-50 transition-all group"
                  >
                    <span className="font-mono text-xs text-slate-400">
                      #{blocker.id}
                    </span>
                    <span className="text-sm text-slate-700 group-hover:text-brand-700 flex-1 truncate font-medium">
                      {blocker.title}
                    </span>
                    <PriorityBadge priority={blocker.priority} />
                    <svg
                      className="w-4 h-4 text-slate-400 group-hover:text-brand-500 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Screenshots */}
          {ticket.screenshots.length > 0 && (
            <div>
              <h2 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">
                Screenshots ({ticket.screenshots.length})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {ticket.screenshots.map((src, index) => (
                  <a
                    key={index}
                    href={src}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-xl overflow-hidden border border-slate-200 hover:border-brand-300 transition-colors shadow-sm"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`Screenshot ${index + 1}`}
                      className="w-full h-40 object-cover hover:opacity-90 transition-opacity"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer actions */}
      <div className="mt-6 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
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
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to all tickets
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/tickets/${ticket.id}/audits`}
            className="inline-flex items-center gap-2 text-sm text-slate-600 bg-white border border-slate-200 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors font-medium"
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
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
              />
            </svg>
            View Audits
          </Link>
          <Link
            href={`/tickets/${ticket.id}/edit`}
            className="inline-flex items-center gap-2 text-sm text-slate-600 bg-white border border-slate-200 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors font-medium"
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
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Edit
          </Link>
          <Link
            href="/new"
            className="inline-flex items-center gap-2 text-sm bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors font-medium"
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
      </div>
    </div>
  );
}
