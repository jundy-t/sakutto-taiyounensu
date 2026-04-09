import { useState } from "react";
import type { AccountingMethod } from "../../logic/treatmentDecision";
import { Button } from "../shared/Button";

interface Props {
  accountingMethod: AccountingMethod;
  onSubmit: (amount: number) => void;
  initialAmount?: number;
}

export function AmountInput({ accountingMethod, onSubmit, initialAmount }: Props) {
  const [value, setValue] = useState<string>(
    initialAmount ? String(initialAmount) : "",
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(value.replace(/[, ]/g, ""));
    if (!Number.isFinite(num) || num <= 0) return;
    onSubmit(num);
  };

  const isTaxExcluded = accountingMethod === "tax_excluded";
  const labelText = isTaxExcluded
    ? "税抜価額を入力してください"
    : "税込価額を入力してください";
  const noteText = isTaxExcluded
    ? "あなたは税抜経理を選択中です。消費税を抜いた金額を入力してください"
    : "あなたは税込経理を選択中です。消費税込みの金額を入力してください";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">
          いくらで買いましたか？
        </h2>
        <p className="text-sm text-gray-600">{noteText}</p>
      </div>

      <label className="block">
        <span className="text-sm font-medium text-gray-700">{labelText}</span>
        <div className="mt-2 flex items-center gap-2">
          <input
            type="text"
            inputMode="numeric"
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/[^\d]/g, ""))}
            placeholder="例：250000"
            className="flex-1 rounded-xl border border-border bg-white px-4 py-3 text-lg placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            autoFocus
          />
          <span className="text-base text-gray-600">円</span>
        </div>
        {value && Number(value) > 0 && (
          <div className="mt-1 text-xs text-gray-500">
            {Number(value).toLocaleString()} 円
          </div>
        )}
      </label>

      <Button
        variant="primary"
        type="submit"
        className="w-full"
        disabled={!value || Number(value) <= 0}
      >
        判定する →
      </Button>
    </form>
  );
}
