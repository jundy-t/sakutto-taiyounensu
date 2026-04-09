import { useMemo } from 'react';
import { searchByKeyword } from '../../logic/searchUsefulLife';
import type { UsefulLifeEntry } from '../../data/usefulLifeTable';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSelect: (entry: UsefulLifeEntry) => void;
}

const TYPE_ICONS: Record<string, string> = {
  建物: '🏢',
  建物附属設備: '🔌',
  構築物: '🏗️',
  船舶: '🚢',
  航空機: '✈️',
  車両及び運搬具: '🚗',
  工具: '🔧',
  器具及び備品: '🪑',
  ソフトウエア: '💿',
};

export function SearchInput({ value, onChange, onSelect }: Props) {
  const candidates = useMemo(() => searchByKeyword(value), [value]);

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="text-sm font-medium text-gray-700">
          買ったものを入力してください
        </span>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="例：パソコン、エアコン、軽自動車、事務机、マンション..."
          className="mt-2 w-full rounded-xl border border-border bg-white px-4 py-3 text-base placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          autoFocus
        />
      </label>

      {value.trim() && (
        <div className="space-y-2">
          {candidates.length === 0 ? (
            <div className="text-sm text-gray-500 px-2 py-4 text-center bg-white rounded-lg border border-border">
              該当する資産が見つかりません。<br />
              別のキーワードで試すか、「カテゴリーから探す」をご利用ください。
            </div>
          ) : (
            <>
              <div className="text-xs text-gray-500 px-1">
                {candidates.length}件の候補（クリックで耐用年数を確認）
              </div>
              <ul className="space-y-1.5 max-h-[60vh] overflow-y-auto">
                {candidates.map((item, idx) => {
                  const { entry, label, hint } = item;
                  return (
                    <li key={idx}>
                      <button
                        type="button"
                        onClick={() => onSelect(entry)}
                        className="w-full text-left p-3 rounded-lg border border-border bg-white hover:border-primary hover:bg-primary/5 transition-all"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-xl shrink-0">
                            {TYPE_ICONS[entry.type] ?? '📦'}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-gray-800 font-bold">
                              {label}
                            </div>
                            {hint && (
                              <div className="text-xs text-gray-500 mt-0.5">
                                {hint}
                              </div>
                            )}
                            <div className="text-xs text-gray-400 mt-1">
                              {entry.type}
                              {entry.structureOrUsage && ` ＞ ${entry.structureOrUsage}`}
                              {entry.detailCategory && ` ＞ ${entry.detailCategory}`}
                              {entry.detail && ` ＞ ${entry.detail}`}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-2xl font-bold text-primary leading-none">
                              {entry.usefulLife}
                            </div>
                            <div className="text-xs text-primary">年</div>
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
