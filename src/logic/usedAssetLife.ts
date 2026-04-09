/**
 * 中古資産の耐用年数計算ロジック
 *
 * 根拠法令:
 * - 耐用年数省令 第3条（中古資産の耐用年数）
 * - 国税庁タックスアンサー No.5404「中古資産の耐用年数」
 * - 耐用年数通達 1-5-1〜1-5-6
 *
 * 公式ルール（国税庁No.5404より）:
 * ■ 簡便法の計算式
 *   (A) 法定耐用年数の全部を経過: 法定耐用年数 × 20%
 *   (B) 法定耐用年数の一部を経過: (法定耐用年数 − 経過年数) + 経過年数 × 20%
 * ■ 端数処理: 計算結果に1年未満の端数があるときは切り捨て
 * ■ 最低年数: 2年に満たない場合は2年
 * ■ 簡便法が使えないケース:
 *   - 資本的支出 > 取得価額の50% → 特別算式 or 法定耐用年数
 *   - 資本的支出 > 再取得価額の50% → 法定耐用年数のみ
 */

/** 簡便法の計算結果 */
export type UsedAssetResult =
  | { method: "kanbenho"; usefulLife: number; formula: string }
  | { method: "special"; usefulLife: number; formula: string }
  | { method: "statutory"; usefulLife: number; reason: string }
  | { method: "not_applicable"; reason: string };

/** 簡便法の入力 */
export interface UsedAssetInput {
  /** 法定耐用年数（年） */
  statutoryLife: number;
  /** 経過年数（年） */
  elapsedYears: number;
  /** 経過年数の端数月（0〜11） */
  elapsedMonths: number;
  /** 取得価額（円）。省略時は資本的支出の判定をスキップ */
  acquisitionCost?: number;
  /** 事業供用のための資本的支出額（円）。0または省略で資本的支出なし */
  capitalExpenditure?: number;
  /** 再取得価額（円）。資本的支出が取得価額の50%超の場合に必要 */
  reacquisitionCost?: number;
}

/**
 * 中古資産の耐用年数を計算する
 *
 * 国税庁No.5404に基づく計算フロー:
 * 1. 資本的支出のチェック（簡便法の適用可否）
 * 2. 経過年数を月数に変換して計算（途中の端数は切り捨てない）
 * 3. 最終結果のみ1年未満切り捨て
 * 4. 2年未満なら2年
 */
export function calculateUsedAssetLife(input: UsedAssetInput): UsedAssetResult {
  const {
    statutoryLife,
    elapsedYears,
    elapsedMonths = 0,
    acquisitionCost,
    capitalExpenditure = 0,
    reacquisitionCost,
  } = input;

  // --- 資本的支出のチェック ---
  if (capitalExpenditure > 0 && acquisitionCost !== undefined) {
    // 再取得価額の50%超 → 法定耐用年数のみ
    if (
      reacquisitionCost !== undefined &&
      capitalExpenditure > reacquisitionCost * 0.5
    ) {
      return {
        method: "statutory",
        usefulLife: statutoryLife,
        reason:
          "資本的支出が再取得価額の50%を超えるため、法定耐用年数を適用します（耐用年数省令第3条第1項第2号）",
      };
    }

    // 取得価額の50%超 → 特別算式（耐通1-5-6）
    if (capitalExpenditure > acquisitionCost * 0.5) {
      if (reacquisitionCost === undefined) {
        return {
          method: "not_applicable",
          reason:
            "資本的支出が取得価額の50%を超えています。再取得価額（同じ新品を取得する場合の価格）を入力してください",
        };
      }

      // 特別算式: まず簡便法の耐用年数を求める
      const kanbenLife = calcKanbenho(statutoryLife, elapsedYears, elapsedMonths);
      const totalCost = acquisitionCost + capitalExpenditure;

      // 特別算式: 総取得価額 / {(中古取得価額 / 簡便法年数) + (資本的支出 / 法定耐用年数)}
      const denominator =
        acquisitionCost / kanbenLife + capitalExpenditure / statutoryLife;
      if (denominator === 0) {
        return {
          method: "statutory",
          usefulLife: statutoryLife,
          reason: "計算不能のため法定耐用年数を適用します",
        };
      }

      const rawLife = totalCost / denominator;
      const finalLife = applyMinimum(Math.floor(rawLife));

      return {
        method: "special",
        usefulLife: finalLife,
        formula: `(${totalCost.toLocaleString()} ÷ (${acquisitionCost.toLocaleString()} ÷ ${kanbenLife} + ${capitalExpenditure.toLocaleString()} ÷ ${statutoryLife})) = ${rawLife.toFixed(2)} → ${finalLife}年`,
      };
    }
  }

  // --- 簡便法 ---
  const rawLife = calcKanbenho(statutoryLife, elapsedYears, elapsedMonths);
  const finalLife = applyMinimum(Math.floor(rawLife));

  // 全部経過か一部経過かで計算式の表示を分ける
  const totalElapsedMonths = elapsedYears * 12 + elapsedMonths;
  const statutoryMonths = statutoryLife * 12;
  const isFullyElapsed = totalElapsedMonths >= statutoryMonths;

  let formula: string;
  if (isFullyElapsed) {
    formula = `${statutoryLife} × 20% = ${(statutoryLife * 0.2).toFixed(1)} → ${finalLife}年`;
  } else {
    if (elapsedMonths === 0) {
      const remaining = statutoryLife - elapsedYears;
      const addition = elapsedYears * 0.2;
      formula = `(${statutoryLife} − ${elapsedYears}) + ${elapsedYears} × 20% = ${remaining} + ${addition.toFixed(1)} = ${(remaining + addition).toFixed(1)} → ${finalLife}年`;
    } else {
      // 月数で計算した場合
      const elapsedTotal = elapsedYears * 12 + elapsedMonths;
      const remainingMonths = statutoryMonths - elapsedTotal;
      const additionMonths = elapsedTotal * 0.2;
      const totalMonths = remainingMonths + additionMonths;
      formula = `(${statutoryMonths}ヶ月 − ${elapsedTotal}ヶ月) + ${elapsedTotal}ヶ月 × 20% = ${totalMonths.toFixed(1)}ヶ月 = ${(totalMonths / 12).toFixed(2)}年 → ${finalLife}年`;
    }
  }

  return {
    method: "kanbenho",
    usefulLife: finalLife,
    formula,
  };
}

/**
 * 簡便法の生の計算結果（端数切り捨て前）
 *
 * 国税庁No.5404:
 * - 全部経過: 法定耐用年数 × 20%
 * - 一部経過: (法定耐用年数 − 経過年数) + 経過年数 × 20%
 *
 * 耐通1-5-3: 経過年数に1年未満の端数がある場合は月数に換算して計算
 * 重要: 計算途中の端数は切り捨てない（最終結果のみ切り捨て）
 */
function calcKanbenho(
  statutoryLife: number,
  elapsedYears: number,
  elapsedMonths: number,
): number {
  const totalElapsedMonths = elapsedYears * 12 + elapsedMonths;
  const statutoryMonths = statutoryLife * 12;

  if (totalElapsedMonths >= statutoryMonths) {
    // 全部経過: 法定耐用年数 × 20%
    return statutoryLife * 0.2;
  }

  // 一部経過: 月数ベースで計算
  // (法定月数 − 経過月数) + 経過月数 × 20%
  const remainingMonths = statutoryMonths - totalElapsedMonths;
  const additionMonths = totalElapsedMonths * 0.2;
  const totalMonths = remainingMonths + additionMonths;

  return totalMonths / 12;
}

/**
 * 最低2年ルール適用
 * 国税庁No.5404: 「その年数が2年に満たない場合には2年とします」
 */
function applyMinimum(years: number): number {
  return Math.max(years, 2);
}
