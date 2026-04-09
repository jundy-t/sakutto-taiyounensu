/**
 * 修繕費 vs 資本的支出 の判定ロジック
 *
 * 根拠条文（国税庁・通達原文で確認済み）:
 * - 法人税基本通達7-8-1（資本的支出の例示）
 * - 法人税基本通達7-8-2（修繕費の例示）
 * - 法人税基本通達7-8-3（少額または周期の短い費用）
 * - 法人税基本通達7-8-4（形式基準による修繕費の判定）
 * - 法人税基本通達7-8-5（区分の特例 - 30%/10%按分、継続適用が条件）
 * - 国税庁No.1379（個人事業主向け、内容は法人と同じ）
 *
 * 判定の優先順位:
 * Step 1: 20万円未満 → 無条件で修繕費（7-8-3）
 * Step 2: 3年以内の周期 → 無条件で修繕費（7-8-3）
 * Step 3: 明らかに資本的支出か？（7-8-1の例示）
 * Step 4: 明らかに修繕費か？（7-8-2の例示）
 * Step 5: 形式基準（60万円 or 10%）→ 「明らかでない場合のみ」修繕費（7-8-4）
 * Step 6: それ以外 → 税理士相談を推奨（7-8-5の30%/10%按分は継続適用が条件で自動判定不可）
 *
 * 重要:
 * - Step 1, 2 は無条件（性質判定不要）
 * - Step 3, 4 は性質判定
 * - Step 5 は「明らかでない場合に限り」適用される救済措置
 */

/** 判定の入力 */
export interface RepairCapitalJudgeInput {
  /** 修理・改良等の費用（円） */
  amount: number;
  /** 3年以内の周期で同様の修理・改良が行われているか */
  isPeriodic: boolean;
  /** 明らかに資本的支出に該当するか（避難階段の取付・用途変更・品質向上など） */
  isClearlyCapital: boolean;
  /** 明らかに修繕費に該当するか（移設・地盛り・現状回復など） */
  isClearlyRepair: boolean;
  /** 修理対象資産の前期末取得価額（円）。形式基準の判定で使う。不明なら未指定 */
  assetBookValue?: number;
}

/** 判定結果のタイプ */
export type RepairCapitalResult =
  /** 修繕費として全額損金算入できる */
  | {
      type: "repair";
      reason: string;
      basis: string;
      step: 1 | 2 | 4 | 5;
    }
  /** 資本的支出として処理が必要 */
  | {
      type: "capital";
      reason: string;
      basis: string;
      step: 3;
    }
  /** 判定が困難・税理士相談を推奨 */
  | {
      type: "consult";
      reason: string;
      basis: string;
    };

/**
 * 修繕費 vs 資本的支出を判定する純粋関数
 *
 * 通達の優先順位通りに判定を行う。
 */
export function judgeRepairCapital(
  input: RepairCapitalJudgeInput,
): RepairCapitalResult {
  const { amount, isPeriodic, isClearlyCapital, isClearlyRepair, assetBookValue } =
    input;

  // Step 1: 20万円未満 → 無条件で修繕費（7-8-3）
  if (amount < 200_000) {
    return {
      type: "repair",
      reason: `${amount.toLocaleString()}円は20万円未満なので、無条件で修繕費として全額損金算入できます`,
      basis: "法人税基本通達7-8-3 / 所得税基本通達37-12（少額または周期の短い費用）",
      step: 1,
    };
  }

  // Step 2: 3年以内の周期 → 無条件で修繕費（7-8-3）
  if (isPeriodic) {
    return {
      type: "repair",
      reason: "おおむね3年以内の周期で行われる修理・改良なので、無条件で修繕費として全額損金算入できます",
      basis: "法人税基本通達7-8-3 / 所得税基本通達37-12（少額または周期の短い費用）",
      step: 2,
    };
  }

  // Step 3: 明らかに資本的支出（7-8-1）
  if (isClearlyCapital) {
    return {
      type: "capital",
      reason: "通達7-8-1の例示に該当するため、資本的支出として処理する必要があります",
      basis: "法人税基本通達7-8-1（資本的支出の例示）",
      step: 3,
    };
  }

  // Step 4: 明らかに修繕費（7-8-2）
  if (isClearlyRepair) {
    return {
      type: "repair",
      reason: "通達7-8-2の例示（移設・現状回復など）に該当するため、修繕費として全額損金算入できます",
      basis: "法人税基本通達7-8-2（修繕費の例示）",
      step: 4,
    };
  }

  // Step 5: 形式基準（明らかでない場合のみ）（7-8-4）
  // 60万円未満 OR 前期末取得価額の10%以下
  const under60Man = amount < 600_000;
  const under10Percent =
    assetBookValue !== undefined && amount <= assetBookValue * 0.1;

  if (under60Man || under10Percent) {
    let reason = "「明らかに資本的支出」「明らかに修繕費」のいずれでもない場合の形式基準により、修繕費として認められます";
    if (under60Man && under10Percent) {
      reason += `（60万円未満かつ取得価額${assetBookValue!.toLocaleString()}円の10%以下）`;
    } else if (under60Man) {
      reason += `（60万円未満）`;
    } else {
      reason += `（取得価額${assetBookValue!.toLocaleString()}円の10%以下）`;
    }
    return {
      type: "repair",
      reason,
      basis: "法人税基本通達7-8-4 / 所得税基本通達37-13(2)（形式基準による修繕費の判定）",
      step: 5,
    };
  }

  // Step 6: それ以外 → 税理士相談を推奨
  return {
    type: "consult",
    reason:
      "形式基準（60万円未満・取得価額の10%以下）も性質判定の例示も該当しないため、判定が難しいケースです。通達7-8-5の30%/10%按分基準は継続適用が必要なため、本ツールでは自動判定を行いません。",
    basis: "法人税基本通達7-8-5 / 所得税基本通達37-14（資本的支出と修繕費の区分の特例）",
  };
}
