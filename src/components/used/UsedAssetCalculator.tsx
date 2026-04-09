import { useState } from "react";
import {
  calculateUsedAssetLife,
  type UsedAssetResult,
} from "../../logic/usedAssetLife";
import type { UsefulLifeEntry } from "../../data/usefulLifeTable";
import { Button } from "../shared/Button";
import { RepairCapitalWizard } from "./RepairCapitalWizard";
import { CapitalExpenditureForm } from "./CapitalExpenditureForm";
import { trackUsedCalc } from "../../lib/gtag";

interface Props {
  /** 対象となる新品資産（法定耐用年数の取得元） */
  entry: UsefulLifeEntry;
  /** 結果画面に戻る */
  onBack: () => void;
  /** 取得価額の初期値（入口B経由の場合に渡される）。資本的支出計算フォームに引き継ぐ */
  initialAcquisitionCost?: number;
}

type SubScreen =
  | "main" // 経過年数入力 + 簡便法結果
  | "wizard" // 修繕費 vs 資本的支出 判定ウィザード
  | "capitalForm"; // 資本的支出ありの計算フォーム

/**
 * 資産タイプに応じてウィザードリンクの表示モードを返す。
 *
 * 実需調査の結果:
 * - 建物・建物附属設備・構築物: リフォーム頻度が高い → 大きく表示
 * - 船舶・航空機: 大規模整備が一定数発生 → 大きく表示
 * - 車両: キッチンカー改造などの特殊ケースのみ（1〜3%）→ 小さく表示
 * - 器具備品・工具・ソフトウエア: 資本的支出はほぼ発生しない → 非表示
 */
type WizardLinkMode = "prominent" | "minimal" | "hidden";

function getWizardLinkMode(entry: UsefulLifeEntry): {
  mode: WizardLinkMode;
  label: string;
} {
  const t = entry.type;
  if (t === "建物" || t === "建物附属設備" || t === "構築物") {
    return { mode: "prominent", label: "リフォーム・改造をした場合" };
  }
  if (t === "船舶" || t === "航空機") {
    return { mode: "prominent", label: "大規模整備・改造をした場合" };
  }
  if (t === "車両及び運搬具") {
    return {
      mode: "minimal",
      label: "特殊な改造（キッチンカー化など）をした場合",
    };
  }
  // 器具及び備品・工具・ソフトウエア等
  return { mode: "hidden", label: "" };
}

/**
 * 中古資産の耐用年数計算UI（Phase 1 + Phase 2 統合）
 *
 * Phase 1: 経過年数のみで簡便法計算
 * Phase 2: 「リフォームをした場合」リンクから判定ウィザード → 計算フォーム
 *
 * 計算ロジックは usedAssetLife.ts に委任（141件のテストで検証済み）。
 * 国税庁No.5404 + 通達7-8-1〜7-8-5 に基づく注意書きを表示。
 */
export function UsedAssetCalculator({ entry, onBack, initialAcquisitionCost }: Props) {
  const [subScreen, setSubScreen] = useState<SubScreen>("main");
  const [yearsStr, setYearsStr] = useState<string>("");
  const [monthsStr, setMonthsStr] = useState<string>("0");
  const [result, setResult] = useState<UsedAssetResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [capitalAmount, setCapitalAmount] = useState<number>(0);

  const elapsedYears = Number(yearsStr || "0");
  const elapsedMonths = Number(monthsStr || "0");
  const wizardLink = getWizardLinkMode(entry);

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const years = Number(yearsStr || "0");
    const months = Number(monthsStr || "0");

    if (!Number.isFinite(years) || years < 0) {
      setError("経過年数は0以上の整数を入力してください");
      return;
    }
    if (!Number.isFinite(months) || months < 0 || months > 11) {
      setError("経過月数は0〜11の整数を入力してください");
      return;
    }
    if (years === 0 && months === 0) {
      setError(
        "経過年数を入力してください。新品の場合は通常の耐用年数（前の画面）をご利用ください",
      );
      return;
    }

    const r = calculateUsedAssetLife({
      statutoryLife: entry.usefulLife,
      elapsedYears: years,
      elapsedMonths: months,
    });
    setResult(r);
    if ("usefulLife" in r) {
      trackUsedCalc({
        statutoryLife: entry.usefulLife,
        elapsedYears: years,
        elapsedMonths: months,
        usefulLife: r.usefulLife,
      });
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
  };

  // === 判定ウィザード画面 ===
  if (subScreen === "wizard") {
    return (
      <RepairCapitalWizard
        onProceedToCapital={(info) => {
          setCapitalAmount(info.amount);
          setSubScreen("capitalForm");
        }}
        onCancel={() => setSubScreen("main")}
      />
    );
  }

  // === 資本的支出計算フォーム画面 ===
  if (subScreen === "capitalForm") {
    return (
      <CapitalExpenditureForm
        entry={entry}
        elapsedYears={elapsedYears}
        elapsedMonths={elapsedMonths}
        initialCapitalExpenditure={capitalAmount}
        initialAcquisitionCost={initialAcquisitionCost}
        bodyUsefulLife={
          result && "usefulLife" in result ? result.usefulLife : entry.usefulLife
        }
        onBack={() => setSubScreen("wizard")}
      />
    );
  }

  // === メイン画面（経過年数入力 + 簡便法計算） ===
  return (
    <section className="space-y-5">
      {/* 対象資産の確認 */}
      <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
        <div className="text-xs text-gray-500 mb-2">対象資産</div>
        <div className="space-y-1 mb-3">
          <div className="text-sm text-gray-600">{entry.type}</div>
          {entry.structureOrUsage && (
            <div className="text-sm text-gray-700">{entry.structureOrUsage}</div>
          )}
          {entry.detailCategory && (
            <div className="text-sm text-gray-600">{entry.detailCategory}</div>
          )}
          <div className="text-base font-bold text-gray-900">{entry.detail}</div>
        </div>
        <div className="flex items-baseline gap-2 pt-3 border-t border-border">
          <span className="text-xs text-gray-600">法定耐用年数</span>
          <span className="text-2xl font-bold text-primary">
            {entry.usefulLife}
          </span>
          <span className="text-base text-primary font-bold">年</span>
        </div>
      </div>

      {!result && (
        <>
          {/* 入力フォーム */}
          <form onSubmit={handleCalculate} className="space-y-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">
                何年経過した中古ですか？
              </h2>
              <p className="text-sm text-gray-600">
                中古で買った時点で、すでにその資産が使われていた期間を入力してください
              </p>
            </div>

            <div className="bg-white border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-end gap-2">
                <label className="flex-1">
                  <span className="text-xs text-gray-600 block mb-1">経過年数</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={yearsStr}
                    onChange={(e) =>
                      setYearsStr(e.target.value.replace(/[^\d]/g, ""))
                    }
                    placeholder="例：3"
                    className="w-full rounded-lg border border-border bg-white px-3 py-2 text-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    autoFocus
                  />
                </label>
                <span className="text-base text-gray-600 pb-2">年</span>

                <label className="flex-1">
                  <span className="text-xs text-gray-600 block mb-1">月数</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={monthsStr}
                    onChange={(e) =>
                      setMonthsStr(e.target.value.replace(/[^\d]/g, ""))
                    }
                    placeholder="0"
                    className="w-full rounded-lg border border-border bg-white px-3 py-2 text-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </label>
                <span className="text-base text-gray-600 pb-2">ヶ月</span>
              </div>
              <p className="text-xs text-gray-500">
                例：3年6ヶ月使われた中古車の場合 → 3年・6ヶ月
              </p>
            </div>

            {error && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                {error}
              </div>
            )}

            <Button variant="primary" type="submit" className="w-full">
              計算する →
            </Button>
          </form>
        </>
      )}

      {result && (
        <>
          {/* 計算結果 */}
          {(result.method === "kanbenho" ||
            result.method === "special" ||
            result.method === "statutory") && (
            <div className="bg-white border-2 border-accent rounded-2xl p-5 shadow-sm">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-3xl">✅</span>
                <div className="flex-1">
                  <div className="text-xs text-gray-500">中古資産の耐用年数</div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-4xl sm:text-5xl font-bold text-primary">
                      {result.usefulLife}
                    </span>
                    <span className="text-xl text-primary font-bold">年</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-border space-y-2">
                <div className="text-xs text-gray-500">計算式</div>
                {"formula" in result && (
                  <div className="text-sm text-gray-800 font-mono bg-gray-50 rounded-lg p-2 break-all">
                    {result.formula}
                  </div>
                )}
                {"reason" in result && (
                  <div className="text-sm text-gray-700">{result.reason}</div>
                )}
                <div className="text-xs text-gray-500 pt-1">
                  根拠: 国税庁No.5404 / 耐用年数省令 第3条
                </div>
              </div>
            </div>
          )}

          {result.method === "not_applicable" && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="font-bold text-amber-900 text-sm mb-2">
                計算できませんでした
              </div>
              <p className="text-xs text-amber-800">{result.reason}</p>
            </div>
          )}

          {/* 重要な注意書き（国税庁No.5404の原文より） */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
            <div className="font-bold text-amber-900 text-sm">
              ⚠ 重要なご注意
            </div>
            <ul className="text-xs text-amber-800 space-y-1.5 list-disc list-inside">
              <li>
                この計算は、その中古資産を <strong>事業の用に供した最初の事業年度（年分）でのみ</strong>
                適用できます。一度法定耐用年数で申告した場合、後から簡便法に変更することはできません（国税庁No.5404）。
              </li>
              <li>
                経過年数の根拠書類（製造年月、初年度登録日等）を保管してください。税務調査で経過年数の根拠を求められることがあります。
              </li>
            </ul>
          </div>

          {/* リフォーム・改造をした場合の判定ウィザードへの導線（資産タイプによって表示を切り替え） */}
          {wizardLink.mode === "prominent" && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
              <div className="font-bold text-blue-900 text-sm">
                🔧 {wizardLink.label}
              </div>
              <p className="text-xs text-blue-800">
                修繕費か資本的支出か、また取得時か事業供用後かによって計算が変わります。
                通達7-8-1〜7-8-5に基づく判定ウィザードでチェックできます。
              </p>
              <Button
                variant="outline"
                onClick={() => setSubScreen("wizard")}
                className="w-full"
              >
                修繕費 / 資本的支出を判定する →
              </Button>
            </div>
          )}

          {wizardLink.mode === "minimal" && (
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setSubScreen("wizard")}
                className="text-xs text-gray-500 hover:text-primary hover:underline"
              >
                ※ {wizardLink.label}は判定ウィザードへ →
              </button>
            </div>
          )}

          <Button variant="outline" onClick={handleReset} className="w-full">
            ← 経過年数を入力し直す
          </Button>
        </>
      )}

      <Button variant="secondary" onClick={onBack} className="w-full">
        ← 結果画面に戻る
      </Button>
    </section>
  );
}
