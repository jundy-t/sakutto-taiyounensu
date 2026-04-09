import { POPULAR_ASSETS } from '../../data/popularAssets';
import { TABLE_1 } from '../../data/usefulLifeTable';
import type { UsefulLifeEntry } from '../../data/usefulLifeTable';

interface Props {
  onSelect: (entry: UsefulLifeEntry) => void;
}

export function PopularShortcuts({ onSelect }: Props) {
  // 各人気資産について、該当する最初のエントリを取得
  const matched = POPULAR_ASSETS.map((p) => {
    const entry = TABLE_1.find(p.matcher);
    return { popular: p, entry };
  }).filter((x): x is { popular: typeof POPULAR_ASSETS[number]; entry: UsefulLifeEntry } => !!x.entry);

  return (
    <section className="space-y-3">
      <h2 className="text-base sm:text-lg font-bold text-gray-800">
        よく調べられる資産
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {matched.map(({ popular, entry }) => (
          <button
            key={popular.label}
            type="button"
            onClick={() => onSelect(entry)}
            className="bg-white border border-border rounded-xl p-4 text-left hover:border-primary hover:shadow-sm transition-all"
          >
            <div className="text-2xl mb-1">{popular.icon}</div>
            <div className="font-bold text-gray-800">{popular.label}</div>
            {popular.description && (
              <div className="text-xs text-gray-500 mt-0.5">
                {popular.description}
              </div>
            )}
            <div className="text-sm text-primary font-bold mt-2">
              {entry.usefulLife}年
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
