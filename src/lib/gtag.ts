/**
 * Google Analytics 4 イベント送信ヘルパー
 *
 * 測定ID: G-01K8H96D3G
 * gtag.js は index.html で読み込み済み。本ファイルは型定義 + イベント関数のみ。
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export const GA_MEASUREMENT_ID = "G-01K8H96D3G";

function trackEvent(action: string, params?: Record<string, string | number>) {
  if (typeof window.gtag === "function") {
    window.gtag("event", action, params);
  }
}

// === 入口選択 ===
export function trackEntrySelect(entry: "A" | "B") {
  trackEvent("entry_select", { entry });
}

// === 検索/候補選択 ===
export function trackSearchSelect(entryId: string) {
  trackEvent("search_select", { entry_id: entryId });
}

// === 中古資産の簡便法計算 ===
export function trackUsedCalc(params: {
  statutoryLife: number;
  elapsedYears: number;
  elapsedMonths: number;
  usefulLife: number;
}) {
  trackEvent("used_calc", {
    statutory_life: params.statutoryLife,
    elapsed_years: params.elapsedYears,
    elapsed_months: params.elapsedMonths,
    useful_life: params.usefulLife,
  });
}

// === 修繕費 vs 資本的支出 判定結果 ===
export function trackRepairCapitalJudge(params: {
  type: "repair" | "capital" | "consult";
  step: number | "consult";
}) {
  trackEvent("repair_capital_judge", {
    judge_type: params.type,
    judge_step: String(params.step),
  });
}

// === 資本的支出のタイミング選択(取得時 vs 事業供用後) ===
export function trackCapitalTimingSelect(timing: "before_use" | "after_use") {
  trackEvent("capital_timing_select", { timing });
}

// === 資本的支出ありの計算完了 ===
export function trackCapitalCalcDone(method: "kanbenho" | "special" | "statutory" | "not_applicable") {
  trackEvent("capital_calc_done", { method });
}

// === 入口B: 税務処理判定 ===
export function trackTreatmentDecision(amount: number, kind: string) {
  trackEvent("treatment_decision", { amount, kind });
}

// === 辞書検索(0件ヒット検出用) ===
export function trackSearch(searchTerm: string, resultCount: number) {
  if (typeof window.gtag !== "function") return;
  window.gtag("event", "search", { search_term: searchTerm });
  if (resultCount === 0) {
    window.gtag("event", "search_no_results", { search_term: searchTerm });
  }
}
