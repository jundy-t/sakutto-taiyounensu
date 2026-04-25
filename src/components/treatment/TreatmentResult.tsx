import type {
  EntityType,
  ReturnType,
  TreatmentDecision,
} from "../../logic/treatmentDecision";
import { Button } from "../shared/Button";

interface Props {
  decision: TreatmentDecision;
  assetLabel: string;
  /** 現在の青色申告設定（変更ボタン表示用） */
  returnType?: ReturnType;
  /** 現在の事業形態（変更ボタン表示用） */
  entityType?: EntityType;
  /** 青色申告/事業形態を変更したいとき */
  onChangeProfile?: () => void;
  /** 通常の減価償却を選んだとき → 既存の耐用年数結果へ */
  onShowDepreciation: () => void;
  /** 別の資産を調べる */
  onRestart: () => void;
}

const RETURN_TYPE_LABEL: Record<ReturnType, string> = {
  blue: "青色申告",
  white: "白色申告",
};

const ENTITY_TYPE_LABEL: Record<EntityType, string> = {
  sole_proprietor: "個人事業主",
  small_corp: "中小法人",
  other: "大法人・通算法人",
};

const OPTION_ICONS = {
  immediate_expense: "✅",
  lump_sum: "📅",
  special_threshold: "⭐",
  regular_depreciation: "📊",
} as const;

export function TreatmentResult({
  decision,
  assetLabel,
  returnType,
  entityType,
  onChangeProfile,
  onShowDepreciation,
  onRestart,
}: Props) {
  const { amount, options, needsDepreciation, unavailableReasons } = decision;

  return (
    <section className="space-y-5">
      {/* 現在の設定（変更可能） */}
      {(returnType || entityType) && onChangeProfile && (
        <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2 flex items-center justify-between gap-2">
          <span>
            設定:{" "}
            {returnType && RETURN_TYPE_LABEL[returnType]}
            {returnType && entityType && " / "}
            {entityType && ENTITY_TYPE_LABEL[entityType]}
          </span>
          <button
            type="button"
            onClick={onChangeProfile}
            className="text-primary hover:underline font-medium"
          >
            変更
          </button>
        </div>
      )}

      {/* ヘッダー */}
      <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
        <div className="text-xs text-gray-500 mb-1">判定結果</div>
        <div className="text-base font-bold text-gray-800">{assetLabel}</div>
        <div className="text-2xl font-bold text-primary mt-1">
          {amount.toLocaleString()} 円
        </div>
      </div>

      {/* オプション一覧 */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-gray-700">
          適用できる経理処理（{options.length}つ）
        </h3>
        {options.map((opt) => {
          const isImmediate =
            opt.type === "immediate_expense" || opt.type === "special_threshold";
          const isRecommended = opt.recommendation === 3;
          return (
            <div
              key={opt.type}
              className={`bg-white border-2 rounded-xl p-4 ${
                isRecommended ? "border-accent" : "border-border"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl shrink-0">{OPTION_ICONS[opt.type]}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-gray-800">{opt.label}</span>
                    {isRecommended && (
                      <span className="text-xs bg-accent text-white px-2 py-0.5 rounded-full font-bold">
                        おすすめ
                      </span>
                    )}
                    {isImmediate && opt.type !== "immediate_expense" && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                        即時経費
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{opt.description}</p>
                  <p className="text-xs text-gray-400 mt-1">根拠: {opt.legalBasis}</p>

                  {opt.type === "regular_depreciation" && needsDepreciation && (
                    <Button
                      variant="outline"
                      onClick={onShowDepreciation}
                      className="mt-3 text-sm"
                    >
                      耐用年数を確認する →
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 少額減価償却資産特例の追加注意（青色＋中小法人/個人で特例が含まれる時のみ） */}
      {options.some((o) => o.type === "special_threshold") && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
          <div className="font-bold text-amber-900 text-sm">
            ⚠ {decision.ruleVariant === "new_400k" ? "40万円特例" : "30万円特例"}の注意事項
          </div>
          <p className="text-xs text-amber-800">
            以下のいずれかに該当する場合は適用できません：
          </p>
          <ul className="text-xs text-amber-800 space-y-1 list-disc list-inside">
            <li>
              常時使用する従業員数が
              {decision.ruleVariant === "new_400k" ? "400人" : "500人"}
              を超える法人（個人事業主は1,000人）
            </li>
            <li>通算法人</li>
            <li>貸付用の資産（主要事業を除く）</li>
            <li>今年度の特例累計が300万円を超える</li>
            <li>
              {decision.ruleVariant === "new_400k"
                ? "令和11年4月1日以降に取得した資産（適用期限切れ）"
                : "令和8年4月1日以降に取得した資産（旧30万円ルールの期限切れ・新40万円ルールへ移行）"}
            </li>
          </ul>
          <p className="text-xs text-amber-700 pt-1">
            該当する場合は税理士・税務署にご相談ください。
          </p>
        </div>
      )}

      {/* 適用不可理由 */}
      {unavailableReasons.length > 0 && (
        <div className="bg-gray-50 border border-border rounded-xl p-4 space-y-2">
          <div className="font-bold text-gray-700 text-sm">適用できない選択肢</div>
          <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
            {unavailableReasons.map((reason, idx) => (
              <li key={idx}>{reason}</li>
            ))}
          </ul>
        </div>
      )}

      <Button variant="secondary" onClick={onRestart} className="w-full">
        ← 別の資産を調べる
      </Button>
    </section>
  );
}
