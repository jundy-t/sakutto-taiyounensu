import { ThemeToggle } from '../shared/ThemeToggle';

interface HeaderProps {
  onHomeClick?: () => void;
}

export function Header({ onHomeClick }: HeaderProps) {
  return (
    <header className="bg-card border-b border-border">
      <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onHomeClick}
          className="min-w-0 flex-1 text-left hover:opacity-80 transition-opacity"
        >
          <h1 className="text-base sm:text-xl font-bold text-primary-light tracking-tight truncate">
            サクッと耐用年数
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-0.5 truncate">
            減価償却の耐用年数を3クリックで判定
          </p>
        </button>
        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
