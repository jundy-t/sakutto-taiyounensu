import type { ReturnType, EntityType } from "../../logic/treatmentDecision";
import { Button } from "../shared/Button";

interface Props {
  currentReturnType: ReturnType | undefined;
  currentEntityType: EntityType | undefined;
  onSelectReturnType: (type: ReturnType) => void;
  onSelectEntityType: (type: EntityType) => void;
  onConfirm: () => void;
}

export function BlueReturnQuestion({
  currentReturnType,
  currentEntityType,
  onSelectReturnType,
  onSelectEntityType,
  onConfirm,
}: Props) {
  const canProceed = !!currentReturnType && !!currentEntityType;

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">
          もう少し教えてください
        </h2>
        <p className="text-sm text-gray-600">
          少額減価償却資産特例（即時経費・40万円未満）の適用判定に必要です。
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-bold text-gray-700">確定申告の方式は？</h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onSelectReturnType("blue")}
            className={`p-3 rounded-lg border text-sm transition-all ${
              currentReturnType === "blue"
                ? "border-primary bg-primary/5 font-bold text-primary"
                : "border-border bg-white hover:border-primary"
            }`}
          >
            青色申告
          </button>
          <button
            type="button"
            onClick={() => onSelectReturnType("white")}
            className={`p-3 rounded-lg border text-sm transition-all ${
              currentReturnType === "white"
                ? "border-primary bg-primary/5 font-bold text-primary"
                : "border-border bg-white hover:border-primary"
            }`}
          >
            白色申告
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-bold text-gray-700">事業形態は？</h3>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => onSelectEntityType("sole_proprietor")}
            className={`w-full p-3 rounded-lg border text-sm text-left transition-all ${
              currentEntityType === "sole_proprietor"
                ? "border-primary bg-primary/5 font-bold text-primary"
                : "border-border bg-white hover:border-primary"
            }`}
          >
            個人事業主・フリーランス
          </button>
          <button
            type="button"
            onClick={() => onSelectEntityType("small_corp")}
            className={`w-full p-3 rounded-lg border text-sm text-left transition-all ${
              currentEntityType === "small_corp"
                ? "border-primary bg-primary/5 font-bold text-primary"
                : "border-border bg-white hover:border-primary"
            }`}
          >
            中小法人（従業員500人以下）
          </button>
          <button
            type="button"
            onClick={() => onSelectEntityType("other")}
            className={`w-full p-3 rounded-lg border text-sm text-left transition-all ${
              currentEntityType === "other"
                ? "border-primary bg-primary/5 font-bold text-primary"
                : "border-border bg-white hover:border-primary"
            }`}
          >
            大法人・通算法人
          </button>
        </div>
      </div>

      <Button
        variant="primary"
        onClick={onConfirm}
        disabled={!canProceed}
        className="w-full"
      >
        判定結果を見る →
      </Button>
    </section>
  );
}
