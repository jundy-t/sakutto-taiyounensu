import type { UsefulLifeEntry } from '../../data/usefulLifeTable';
import { Button } from '../shared/Button';
import { LegalBasis } from './LegalBasis';

interface Props {
  entry: UsefulLifeEntry;
  onBack: () => void;
  onUsedClick: () => void;
}

export function ResultCard({ entry, onBack, onUsedClick }: Props) {
  return (
    <section className="space-y-4">
      <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
        <div className="text-xs text-gray-500 mb-2">判定結果</div>

        <div className="space-y-1 mb-4">
          <div className="text-sm text-gray-600">{entry.type}</div>
          {entry.structureOrUsage && (
            <div className="text-sm text-gray-700 font-medium">
              {entry.structureOrUsage}
            </div>
          )}
          {entry.detailCategory && (
            <div className="text-sm text-gray-600">
              {entry.detailCategory}
            </div>
          )}
          <div className="text-base text-gray-900 font-bold pt-1">
            {entry.detail}
          </div>
        </div>

        <div className="flex items-baseline gap-2 py-3 border-t border-border">
          <span className="text-sm text-gray-600">法定耐用年数</span>
          <span className="text-4xl sm:text-5xl font-bold text-primary">
            {entry.usefulLife}
          </span>
          <span className="text-xl text-primary font-bold">年</span>
        </div>

      </div>

      <LegalBasis entry={entry} />

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
        <div className="font-bold text-amber-900 text-sm">中古資産ですか？</div>
        <p className="text-xs text-amber-800">
          中古資産の場合は、簡便法による短い耐用年数を使えます。経過年数を入力して計算できます。
        </p>
        <Button variant="outline" onClick={onUsedClick} className="w-full">
          中古資産として計算する
        </Button>
      </div>

      <Button variant="secondary" onClick={onBack} className="w-full">
        ← 別の資産を調べる
      </Button>
    </section>
  );
}
