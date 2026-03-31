import Link from 'next/link';
import PriorityBadge from './PriorityBadge';
import DifficultyDots from './DifficultyDots';
import AreaTag from './AreaTag';

interface TicketCardProps {
  ticket: {
    id: number;
    title: string;
    priority: 'Urgent' | 'Important' | 'Backlog';
    areas: string[];
    reported_by: string;
    difficulty: number;
    created_at: string;
    description: string;
  };
  epicName?: string;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export default function TicketCard({ ticket, epicName }: TicketCardProps) {
  return (
    <Link href={`/tickets/${ticket.id}`} className="block group">
      <div className="bg-white border border-slate-200 rounded-xl p-5 hover:border-brand-300 hover:shadow-md transition-all duration-150 group-hover:shadow-brand-100">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-slate-400">#{ticket.id}</span>
              <PriorityBadge priority={ticket.priority} />
              {epicName && (
                <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-violet-100 text-violet-700 border border-violet-200">
                  {epicName}
                </span>
              )}
            </div>
            <h3 className="text-base font-semibold text-slate-900 group-hover:text-brand-700 transition-colors truncate">
              {ticket.title}
            </h3>
            <p className="mt-1 text-sm text-slate-500 line-clamp-2">{ticket.description}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {ticket.areas.slice(0, 4).map((area) => (
            <AreaTag key={area} area={area} />
          ))}
          {ticket.areas.length > 4 && (
            <span className="text-xs text-slate-400">+{ticket.areas.length - 4} more</span>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {ticket.reported_by}
            </span>
            <DifficultyDots difficulty={ticket.difficulty} />
          </div>
          <span className="text-slate-400">{formatDate(ticket.created_at)}</span>
        </div>
      </div>
    </Link>
  );
}
