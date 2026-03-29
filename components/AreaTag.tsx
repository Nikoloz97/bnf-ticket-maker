interface AreaTagProps {
  area: string;
  size?: 'sm' | 'md';
}

const areaColors: Record<string, { bg: string; text: string; border: string }> = {
  Frontend: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  Backend: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  Design: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  DevOps: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  Database: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  API: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  Mobile: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
  Docs: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
};

const defaultColor = { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };

export default function AreaTag({ area, size = 'sm' }: AreaTagProps) {
  const color = areaColors[area] || defaultColor;
  const sizeClasses = size === 'md' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md border ${color.bg} ${color.text} ${color.border} ${sizeClasses}`}
    >
      {area}
    </span>
  );
}
