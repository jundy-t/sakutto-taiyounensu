import { useMemo } from 'react';
import {
  getDetailCategoriesInStructure,
  getDetailsInStructure,
  hasDetailCategories,
} from '../../logic/searchUsefulLife';
import type { UsefulLifeEntry } from '../../data/usefulLifeTable';

interface Props {
  category: string;
  structure: string;
  selectedDetailCategory: string | null;
  onSelectDetailCategory: (dc: string | null) => void;
  onSelectEntry: (entry: UsefulLifeEntry) => void;
}

export function DetailSelector({
  category,
  structure,
  selectedDetailCategory,
  onSelectDetailCategory,
  onSelectEntry,
}: Props) {
  const detailCategories = useMemo(
    () => getDetailCategoriesInStructure(category, structure),
    [category, structure],
  );

  const hasCategories = useMemo(
    () => hasDetailCategories(category, structure),
    [category, structure],
  );

  // detail一覧
  const details = useMemo(() => {
    if (hasCategories && !selectedDetailCategory) {
      // 中分類なしのエントリを表示（直接細目を持つもの）
      return getDetailsInStructure(category, structure, null);
    }
    return getDetailsInStructure(category, structure, selectedDetailCategory);
  }, [category, structure, selectedDetailCategory, hasCategories]);

  return (
    <section className="space-y-4">
      {hasCategories && (
        <div className="space-y-2">
          <h3 className="text-sm sm:text-base font-bold text-gray-800">
            ③ 種類（中分類）を選んでください
          </h3>
          <div className="flex flex-wrap gap-2">
            {detailCategories.map((dc) => {
              const isSelected = selectedDetailCategory === dc;
              return (
                <button
                  key={dc}
                  type="button"
                  onClick={() => onSelectDetailCategory(isSelected ? null : dc)}
                  className={`px-3 py-2 rounded-full text-xs sm:text-sm transition-all border ${
                    isSelected
                      ? 'border-primary bg-primary text-white'
                      : 'border-border bg-white text-gray-800 hover:border-primary'
                  }`}
                >
                  {dc}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {details.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm sm:text-base font-bold text-gray-800">
            {hasCategories ? '④' : '③'} 細目を選んでください（耐用年数が確定します）
          </h3>
          <div className="space-y-2">
            {details.map((entry, idx) => (
              <button
                key={`${entry.detail}-${idx}`}
                type="button"
                onClick={() => onSelectEntry(entry)}
                className="w-full p-3 rounded-lg border border-border bg-white text-left hover:border-primary hover:bg-primary/5 transition-all flex items-center justify-between gap-3"
              >
                <span className="text-sm text-gray-800 flex-1">
                  {entry.detail || '（細目なし）'}
                </span>
                <span className="text-primary font-bold whitespace-nowrap">
                  {entry.usefulLife}年
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
