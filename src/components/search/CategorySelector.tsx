import { TABLE_1_CATEGORIES, TABLE_1 } from '../../data/usefulLifeTable';

interface Props {
  selected: string | null;
  onSelect: (category: string) => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  建物: '🏢',
  建物附属設備: '🔌',
  構築物: '🏗️',
  船舶: '🚢',
  航空機: '✈️',
  車両及び運搬具: '🚗',
  工具: '🔧',
  器具及び備品: '🪑',
};

export function CategorySelector({ selected, onSelect }: Props) {
  return (
    <section className="space-y-3">
      <h2 className="text-base sm:text-lg font-bold text-gray-800">
        ① 大分類を選んでください
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {TABLE_1_CATEGORIES.map((cat) => {
          const count = TABLE_1.filter((e) => e.type === cat).length;
          const isSelected = selected === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => onSelect(cat)}
              className={`p-4 rounded-xl text-left transition-all border ${
                isSelected
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border bg-white hover:border-primary'
              }`}
            >
              <div className="text-2xl mb-1">{CATEGORY_ICONS[cat] ?? '📦'}</div>
              <div className="font-bold text-gray-800 text-sm sm:text-base">{cat}</div>
              <div className="text-xs text-gray-500 mt-0.5">{count}件</div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
