interface DifficultyDotsProps {
  difficulty: number;
  size?: 'sm' | 'md';
}

export default function DifficultyDots({ difficulty, size = 'sm' }: DifficultyDotsProps) {
  const dotSize = size === 'md' ? 'w-3 h-3' : 'w-2.5 h-2.5';

  return (
    <div className="flex items-center gap-1" title={`Difficulty: ${difficulty}/5`}>
      {[1, 2, 3, 4, 5].map((level) => (
        <div
          key={level}
          className={`${dotSize} rounded-full border transition-colors ${
            level <= difficulty
              ? 'bg-brand-500 border-brand-500'
              : 'bg-transparent border-slate-300'
          }`}
        />
      ))}
      <span className="ml-1 text-xs text-slate-500">{difficulty}/5</span>
    </div>
  );
}
