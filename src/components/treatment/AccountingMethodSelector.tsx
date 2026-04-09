import type { AccountingMethod } from "../../logic/treatmentDecision";
import { Button } from "../shared/Button";

interface Props {
  current: AccountingMethod | undefined;
  onSelect: (method: AccountingMethod) => void;
}

export function AccountingMethodSelector({ current, onSelect }: Props) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">
          消費税の経理方式を教えてください
        </h2>
        <p className="text-sm text-gray-600">
          経理方式によって、10万円・20万円・30万円の境界判定が変わります。
        </p>
      </div>

      <div className="space-y-2">
        <button
          type="button"
          onClick={() => onSelect("tax_included")}
          className={`w-full text-left p-4 rounded-xl border transition-all ${
            current === "tax_included"
              ? "border-primary bg-primary/5"
              : "border-border bg-white hover:border-primary"
          }`}
        >
          <div className="font-bold text-gray-800">税込経理</div>
          <div className="text-xs text-gray-500 mt-1">
            個人事業主の大半・免税事業者はこちら。消費税込みで判定します
          </div>
        </button>

        <button
          type="button"
          onClick={() => onSelect("tax_excluded")}
          className={`w-full text-left p-4 rounded-xl border transition-all ${
            current === "tax_excluded"
              ? "border-primary bg-primary/5"
              : "border-border bg-white hover:border-primary"
          }`}
        >
          <div className="font-bold text-gray-800">税抜経理</div>
          <div className="text-xs text-gray-500 mt-1">
            会計ソフトで税抜入力している方。消費税抜きで判定します
          </div>
        </button>
      </div>

      <details className="text-xs text-gray-600">
        <summary className="cursor-pointer hover:text-primary">
          わからない方はこちら
        </summary>
        <div className="mt-2 p-3 bg-gray-50 rounded-lg space-y-1">
          <p>個人事業主の大半は <strong>税込経理</strong> です。</p>
          <p>免税事業者（消費税の納税義務がない方）は税込経理しか選べません。</p>
          <p>会計ソフトで「税抜」設定にしている方は税抜経理です。</p>
          <p>判断がつかない場合は、安全側として「税込経理」を選んでください。</p>
        </div>
      </details>

      {current && (
        <Button
          variant="primary"
          onClick={() => onSelect(current)}
          className="w-full"
        >
          次へ →
        </Button>
      )}
    </section>
  );
}
