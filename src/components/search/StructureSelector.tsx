import { getStructuresInCategory } from '../../logic/searchUsefulLife';

interface Props {
  category: string;
  selected: string | null;
  onSelect: (structure: string) => void;
}

export function StructureSelector({ category, selected, onSelect }: Props) {
  const structures = getStructuresInCategory(category);

  return (
    <section className="space-y-3">
      <h2 className="text-base sm:text-lg font-bold text-gray-800">
        ② 構造または用途を選んでください
      </h2>
      <div className="space-y-2">
        {structures.map((s) => {
          const isSelected = selected === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => onSelect(s)}
              className={`w-full p-3 sm:p-4 rounded-lg text-left transition-all border ${
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-white hover:border-primary'
              }`}
            >
              <span className="text-sm sm:text-base text-gray-800">{s}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
