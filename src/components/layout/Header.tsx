interface HeaderProps {
  onHomeClick?: () => void;
}

export function Header({ onHomeClick }: HeaderProps) {
  return (
    <header className="bg-white border-b border-border">
      <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
        <button
          type="button"
          onClick={onHomeClick}
          className="text-left hover:opacity-80 transition-opacity"
        >
          <h1 className="text-xl sm:text-2xl font-bold text-primary">
            サクッと耐用年数
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            減価償却の耐用年数を3クリックで判定
          </p>
        </button>
      </div>
    </header>
  );
}
