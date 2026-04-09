/**
 * 経理処理判定ロジックのテストケース
 * 国税庁No.5403, No.5408, 法令133, 法令133の2, 措置法28条の2 に基づく境界値テスト
 */
import {
  decideTreatment,
  type TreatmentInput,
  type UserProfile,
} from "./treatmentDecision";

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e: unknown) {
    failed++;
    const msg = e instanceof Error ? e.message : String(e);
    console.log(`  ✗ ${name}`);
    console.log(`    ${msg}`);
  }
}

function expect<T>(actual: T) {
  return {
    toBe(expected: T) {
      if (actual !== expected) {
        throw new Error(`expected ${String(expected)}, got ${String(actual)}`);
      }
    },
    toContain(value: T extends readonly (infer U)[] ? U : never) {
      if (!Array.isArray(actual) || !actual.includes(value)) {
        throw new Error(`expected to contain ${String(value)}`);
      }
    },
    toHaveLength(n: number) {
      if (!Array.isArray(actual)) throw new Error("not an array");
      if (actual.length !== n) {
        throw new Error(`expected length ${n}, got ${actual.length}`);
      }
    },
  };
}

const blueIndividual: UserProfile = {
  returnType: "blue",
  accountingMethod: "tax_included",
  entityType: "sole_proprietor",
};

const whiteIndividual: UserProfile = {
  returnType: "white",
  accountingMethod: "tax_included",
  entityType: "sole_proprietor",
};

const blueSmallCorp: UserProfile = {
  returnType: "blue",
  accountingMethod: "tax_included",
  entityType: "small_corp",
};

const blueLargeCorp: UserProfile = {
  returnType: "blue",
  accountingMethod: "tax_included",
  entityType: "other",
};

function input(amount: number, profile: UserProfile = blueIndividual): TreatmentInput {
  return { amount, profile };
}

function optionTypes(decision: ReturnType<typeof decideTreatment>): string[] {
  return decision.options.map((o) => o.type);
}

console.log("\n=== 10万円未満（即時経費・誰でも）===");

test("99,999円（青色個人）→ 即時経費のみ", () => {
  const r = decideTreatment(input(99_999));
  expect(r.bracket).toBe("under_100k");
  expect(r.options).toHaveLength(1);
  expect(optionTypes(r)).toContain("immediate_expense");
  expect(r.needsDepreciation).toBe(false);
});

test("99,999円（白色個人）→ 即時経費のみ（青色不要）", () => {
  const r = decideTreatment(input(99_999, whiteIndividual));
  expect(r.bracket).toBe("under_100k");
  expect(r.options).toHaveLength(1);
  expect(optionTypes(r)).toContain("immediate_expense");
});

test("1円（極小金額）→ 即時経費", () => {
  const r = decideTreatment(input(1));
  expect(r.bracket).toBe("under_100k");
  expect(optionTypes(r)).toContain("immediate_expense");
});

console.log("\n=== 10万円ちょうど（境界値）===");

test("100,000円（青色個人）→ 一括償却 + 30万円特例 + 通常償却", () => {
  const r = decideTreatment(input(100_000));
  expect(r.bracket).toBe("100k_to_200k");
  expect(r.options).toHaveLength(3);
  expect(optionTypes(r)).toContain("lump_sum");
  expect(optionTypes(r)).toContain("special_300k");
  expect(optionTypes(r)).toContain("regular_depreciation");
});

test("100,000円（白色個人）→ 一括償却 + 通常償却（30万円特例なし）", () => {
  const r = decideTreatment(input(100_000, whiteIndividual));
  expect(r.bracket).toBe("100k_to_200k");
  expect(r.options).toHaveLength(2);
  expect(optionTypes(r)).toContain("lump_sum");
  expect(optionTypes(r)).toContain("regular_depreciation");
});

test("100,000円（青色大法人）→ 一括償却 + 通常償却（30万円特例なし）", () => {
  const r = decideTreatment(input(100_000, blueLargeCorp));
  expect(r.bracket).toBe("100k_to_200k");
  expect(r.options).toHaveLength(2);
  expect(optionTypes(r)).toContain("lump_sum");
  expect(optionTypes(r)).toContain("regular_depreciation");
});

console.log("\n=== 10万〜20万円 ===");

test("150,000円（青色個人）→ 3択", () => {
  const r = decideTreatment(input(150_000));
  expect(r.options).toHaveLength(3);
});

test("199,999円（青色中小法人）→ 3択", () => {
  const r = decideTreatment(input(199_999, blueSmallCorp));
  expect(r.bracket).toBe("100k_to_200k");
  expect(r.options).toHaveLength(3);
});

console.log("\n=== 20万円ちょうど（境界値）===");

test("200,000円（青色個人）→ 30万円特例 + 通常償却（一括償却NG）", () => {
  const r = decideTreatment(input(200_000));
  expect(r.bracket).toBe("200k_to_300k");
  expect(r.options).toHaveLength(2);
  expect(optionTypes(r)).toContain("special_300k");
  expect(optionTypes(r)).toContain("regular_depreciation");
});

test("200,000円（白色個人）→ 通常償却のみ", () => {
  const r = decideTreatment(input(200_000, whiteIndividual));
  expect(r.bracket).toBe("200k_to_300k");
  expect(r.options).toHaveLength(1);
  expect(optionTypes(r)).toContain("regular_depreciation");
});

console.log("\n=== 20万〜30万円 ===");

test("250,000円（青色個人）→ 30万円特例 + 通常償却", () => {
  const r = decideTreatment(input(250_000));
  expect(r.options).toHaveLength(2);
});

test("299,999円（青色個人）→ 30万円特例 + 通常償却", () => {
  const r = decideTreatment(input(299_999));
  expect(r.bracket).toBe("200k_to_300k");
  expect(r.options).toHaveLength(2);
  expect(optionTypes(r)).toContain("special_300k");
});

test("299,999円（青色大法人）→ 通常償却のみ", () => {
  const r = decideTreatment(input(299_999, blueLargeCorp));
  expect(r.bracket).toBe("200k_to_300k");
  expect(r.options).toHaveLength(1);
  expect(optionTypes(r)).toContain("regular_depreciation");
});

console.log("\n=== 30万円ちょうど（境界値）===");

test("300,000円（青色個人）→ 通常償却のみ", () => {
  const r = decideTreatment(input(300_000));
  expect(r.bracket).toBe("300k_or_more");
  expect(r.options).toHaveLength(1);
  expect(optionTypes(r)).toContain("regular_depreciation");
  expect(r.needsDepreciation).toBe(true);
});

console.log("\n=== 30万円超 ===");

test("500,000円（青色個人）→ 通常償却のみ", () => {
  const r = decideTreatment(input(500_000));
  expect(r.options).toHaveLength(1);
  expect(optionTypes(r)).toContain("regular_depreciation");
});

test("1,000,000円（青色個人）→ 通常償却のみ", () => {
  const r = decideTreatment(input(1_000_000));
  expect(r.options).toHaveLength(1);
});

test("1億円（青色個人・高額）→ 通常償却のみ", () => {
  const r = decideTreatment(input(100_000_000));
  expect(r.options).toHaveLength(1);
});

console.log("\n=== 適用不可理由（白色申告）===");

test("白色個人・150,000円 → 30万円特例NGの理由が表示", () => {
  const r = decideTreatment(input(150_000, whiteIndividual));
  if (r.unavailableReasons.length === 0) {
    throw new Error("unavailableReasonsが空");
  }
});

test("白色個人・250,000円 → 30万円特例NGの理由が表示", () => {
  const r = decideTreatment(input(250_000, whiteIndividual));
  if (r.unavailableReasons.length === 0) {
    throw new Error("unavailableReasonsが空");
  }
});

test("青色大法人・250,000円 → 中小事業者NGの理由が表示", () => {
  const r = decideTreatment(input(250_000, blueLargeCorp));
  if (r.unavailableReasons.length === 0) {
    throw new Error("unavailableReasonsが空");
  }
});

console.log("\n=== 30万円未満は青色なら必ず特例が含まれる ===");

test("青色個人・10万円 → 30万円特例含む", () => {
  const r = decideTreatment(input(100_000));
  expect(optionTypes(r)).toContain("special_300k");
});

test("青色中小法人・10万円 → 30万円特例含む", () => {
  const r = decideTreatment(input(100_000, blueSmallCorp));
  expect(optionTypes(r)).toContain("special_300k");
});

test("青色個人・29万円 → 30万円特例含む", () => {
  const r = decideTreatment(input(290_000));
  expect(optionTypes(r)).toContain("special_300k");
});

console.log(`\n=== 結果: ${passed} passed, ${failed} failed ===`);
if (failed > 0) {
  process.exit(1);
}
