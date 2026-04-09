import type { UsefulLifeEntry } from '../../data/usefulLifeTable';

interface Props {
  entry: UsefulLifeEntry;
}

/**
 * 結果に対する法的根拠を表示する。
 *
 * 経費判定ツールの LegalBasis を参考にしているが、
 * 耐用年数の場合は「条文 + 別表上の位置」を示すのが最も具体的な根拠になる。
 */
export function LegalBasis({ entry }: Props) {
  const lawName = '減価償却資産の耐用年数等に関する省令';

  // 別表上の位置を組み立てる
  const breadcrumb = [
    entry.source,
    entry.type,
    entry.structureOrUsage,
    entry.detailCategory,
    entry.detail,
  ]
    .filter((s) => s && s.length > 0)
    .join(' ＞ ');

  return (
    <div className="bg-gray-50 border border-border rounded-xl p-4 space-y-3">
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
        根拠条文
      </h3>

      <div className="space-y-1">
        <div className="text-sm font-bold text-primary-dark">
          {lawName}（昭和40年大蔵省令第15号）
        </div>
        <div className="text-xs text-gray-600">
          {breadcrumb}
        </div>
      </div>

      <div className="text-xs text-gray-500 border-t border-border pt-2">
        <p>
          所得税法施行令第129条・法人税法施行令第56条に基づく省令の別表で
          定められた法定耐用年数です。
        </p>
      </div>
    </div>
  );
}
