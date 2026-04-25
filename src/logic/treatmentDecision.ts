/**
 * 取得価額・基礎情報から、適用できる経理処理の選択肢を判定する純粋関数。
 *
 * 根拠条文:
 * - 法人税法施行令第133条 / 所得税法施行令第138条 (10万円未満の即時損金)
 * - 法人税法施行令第133条の2 / 所得税法施行令第139条 (一括償却資産)
 * - 租税特別措置法第28条の2 (個人事業主の少額減価償却資産特例)
 * - 租税特別措置法第67条の5 (法人の少額減価償却資産特例)
 * - 国税庁タックスアンサー No.5403 / No.5408 / No.2100
 *
 * 令和8年度税制改正（2026-04-01 施行）:
 * - 令和8年4月1日以後取得分: 上限 40万円未満・期限 令和11年3月31日まで・対象法人 従業員400人以下
 * - 令和8年3月31日以前取得分: 上限 30万円未満（旧ルール、過去取得分のみ）
 *
 * 重要:
 * - 入力された金額は「経理方式に応じた金額」（税抜経理なら税抜、税込経理なら税込）であることが前提
 * - エッジケース（貸付用、通算法人、年累計超過など）はこの関数では判定せず、
 *   結果画面で「該当する場合は適用できない」と注意書きで補足する
 */

/** 確定申告の方式 */
export type ReturnType = "blue" | "white";

/** 消費税の経理方式 */
export type AccountingMethod = "tax_included" | "tax_excluded";

/** 事業形態（簡易版）。詳細な区分は注意書きで補足する */
export type EntityType = "sole_proprietor" | "small_corp" | "other";

/** 基礎情報 */
export interface UserProfile {
  /** 確定申告の方式 */
  returnType: ReturnType;
  /** 消費税の経理方式 */
  accountingMethod: AccountingMethod;
  /** 事業形態（小規模か否か） */
  entityType: EntityType;
  /**
   * 取得日。未指定の場合は今日とみなす（= 新ルール 40万円特例）。
   * 2026-04-01 以後 → 40万円未満が対象（令和11年3月31日まで）
   * 2026-03-31 以前 → 30万円未満が対象（旧ルール、過去取得分のみ）
   */
  acquisitionDate?: Date;
}

/** 判定の入力 */
export interface TreatmentInput {
  /** 取得価額（経理方式に応じた金額。税抜経理なら税抜、税込経理なら税込） */
  amount: number;
  /** ユーザー基礎情報 */
  profile: UserProfile;
}

/** 適用可能な処理オプション */
export type TreatmentOption =
  | "immediate_expense" // 全額即時経費（10万円未満）
  | "lump_sum" // 一括償却資産（3年均等）
  | "special_threshold" // 少額減価償却資産特例（30万 or 40万）
  | "regular_depreciation"; // 通常の減価償却

/** 1つの処理オプションの詳細 */
export interface TreatmentOptionDetail {
  type: TreatmentOption;
  /** 表示用ラベル */
  label: string;
  /** 簡単な説明 */
  description: string;
  /** 根拠条文 */
  legalBasis: string;
  /** 推奨度 (0-3) */
  recommendation: 0 | 1 | 2 | 3;
}

/** 判定結果 */
export interface TreatmentDecision {
  /** 入力金額 */
  amount: number;
  /** 金額の区分（新ルール 40万円基準） */
  bracket:
    | "under_100k"
    | "100k_to_200k"
    | "200k_to_300k"
    | "300k_to_400k"
    | "400k_or_more";
  /** 適用される特例ルール（新: 40万 / 旧: 30万） */
  ruleVariant: "new_400k" | "old_300k";
  /** 適用可能なオプション一覧 */
  options: TreatmentOptionDetail[];
  /** 通常の減価償却が必要か（耐用年数表示の必要性） */
  needsDepreciation: boolean;
  /** 青色申告ではないため特例が使えない場合などの理由 */
  unavailableReasons: string[];
}

/** 令和8年度税制改正の境界日（この日以降の取得から新ルール 40万円・令和11年3月31日まで） */
const RULE_BOUNDARY = new Date("2026-04-01T00:00:00+09:00");

function isNewRule(acquisitionDate?: Date): boolean {
  const date = acquisitionDate ?? new Date();
  return date >= RULE_BOUNDARY;
}

/**
 * メイン判定関数
 */
export function decideTreatment(input: TreatmentInput): TreatmentDecision {
  const { amount, profile } = input;
  const reasons: string[] = [];
  const useNewRule = isNewRule(profile.acquisitionDate);
  const ruleVariant: TreatmentDecision["ruleVariant"] = useNewRule
    ? "new_400k"
    : "old_300k";
  const specialThreshold = useNewRule ? 400_000 : 300_000;
  const specialLabel = useNewRule ? "40万円特例" : "30万円特例";
  const specialDescription = useNewRule
    ? "青色申告の中小事業者等は、40万円未満の資産を全額その年の経費にできます。年間累計300万円まで（令和8年4月1日以後取得分・令和11年3月31日まで）"
    : "青色申告の中小事業者等は、30万円未満の資産を全額その年の経費にできます。年間累計300万円まで（令和8年3月31日以前取得分の旧ルール）";

  // 区分の判定（新ルール 40万円基準で 5 区分に統一）
  let bracket: TreatmentDecision["bracket"];
  if (amount < 100_000) {
    bracket = "under_100k";
  } else if (amount < 200_000) {
    bracket = "100k_to_200k";
  } else if (amount < 300_000) {
    bracket = "200k_to_300k";
  } else if (amount < 400_000) {
    bracket = "300k_to_400k";
  } else {
    bracket = "400k_or_more";
  }

  const options: TreatmentOptionDetail[] = [];

  // === 10万円未満: 全額即時経費（誰でも）===
  if (bracket === "under_100k") {
    options.push({
      type: "immediate_expense",
      label: "全額その年の経費にする",
      description: "10万円未満は少額の減価償却資産として全額損金算入できます",
      legalBasis: "法人税法施行令第133条 / 所得税法施行令第138条",
      recommendation: 3,
    });
    return {
      amount,
      bracket,
      ruleVariant,
      options,
      needsDepreciation: false,
      unavailableReasons: [],
    };
  }

  // === 特例上限以上: 通常の減価償却のみ ===
  // 新ルール(40万): bracket === "400k_or_more"
  // 旧ルール(30万): bracket in ["300k_to_400k", "400k_or_more"]
  const isAboveSpecialThreshold = amount >= specialThreshold;
  if (isAboveSpecialThreshold) {
    options.push({
      type: "regular_depreciation",
      label: "通常の減価償却",
      description: "法定耐用年数に基づいて毎年費用化します",
      legalBasis: "所得税法第49条 / 法人税法第31条",
      recommendation: 3,
    });
    return {
      amount,
      bracket,
      ruleVariant,
      options,
      needsDepreciation: true,
      unavailableReasons: [],
    };
  }

  // === 10万〜20万円: 一括償却資産（誰でも） ===
  if (bracket === "100k_to_200k") {
    options.push({
      type: "lump_sum",
      label: "一括償却資産（3年で均等償却）",
      description: `取得価額を3年で均等に費用化します。年あたり約${Math.round(
        amount / 3,
      ).toLocaleString()}円`,
      legalBasis: "法人税法施行令第133条の2 / 所得税法施行令第139条",
      recommendation: 2,
    });
  }

  // === 10万〜特例上限: 少額減価償却資産特例（青色申告 + 中小事業者等） ===
  const isEligibleEntity =
    profile.entityType === "sole_proprietor" || profile.entityType === "small_corp";
  const isBlueReturn = profile.returnType === "blue";

  if (isBlueReturn && isEligibleEntity) {
    options.push({
      type: "special_threshold",
      label: `${specialLabel}（即時経費）`,
      description: specialDescription,
      legalBasis: "租税特別措置法第28条の2（個人）/ 第67条の5（法人）",
      recommendation: 3,
    });
  } else {
    if (!isBlueReturn) {
      reasons.push(
        `${specialLabel}は青色申告の事業者のみ適用可能です（白色申告では使えません）`,
      );
    }
    if (!isEligibleEntity) {
      const employeeLimit = useNewRule ? "400人以下" : "500人以下";
      reasons.push(
        `${specialLabel}は個人事業主または中小法人（従業員${employeeLimit}）のみ適用可能です`,
      );
    }
  }

  // 通常の減価償却は常に選択可能
  options.push({
    type: "regular_depreciation",
    label: "通常の減価償却",
    description: "法定耐用年数に基づいて毎年費用化します",
    legalBasis: "所得税法第49条 / 法人税法第31条",
    recommendation: 1,
  });

  return {
    amount,
    bracket,
    ruleVariant,
    options,
    needsDepreciation: true,
    unavailableReasons: reasons,
  };
}
