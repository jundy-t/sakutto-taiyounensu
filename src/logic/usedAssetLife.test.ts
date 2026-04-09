/**
 * 中古資産の耐用年数計算ロジック テストケース
 *
 * テスト根拠:
 * - 国税庁タックスアンサー No.5404 の計算例
 * - 耐用年数省令 第3条
 * - 実務上の代表的なケース（4年落ち中古車等）
 */

import { calculateUsedAssetLife } from "./usedAssetLife";

// --- テスト実行用の簡易フレームワーク ---
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

function expect(actual: number) {
  return {
    toBe(expected: number) {
      if (actual !== expected) {
        throw new Error(`expected ${expected}, got ${actual}`);
      }
    },
  };
}

function expectMethod(actual: string) {
  return {
    toBe(expected: string) {
      if (actual !== expected) {
        throw new Error(`expected method "${expected}", got "${actual}"`);
      }
    },
  };
}

// ========================================
// テストケース
// ========================================

console.log("\n=== 国税庁No.5404 公式計算例 ===");

test("法定30年・経過10年 → 22年（No.5404の具体例そのまま）", () => {
  // No.5404: (30-10) + 10×20% = 20 + 2 = 22年
  const result = calculateUsedAssetLife({
    statutoryLife: 30,
    elapsedYears: 10,
    elapsedMonths: 0,
  });
  expectMethod(result.method).toBe("kanbenho");
  expect(result.usefulLife).toBe(22);
});

console.log("\n=== 一部経過（基本パターン） ===");

test("法定6年・経過4年（4年落ち普通自動車）→ 2年", () => {
  // (6-4) + 4×20% = 2 + 0.8 = 2.8 → 切り捨て2年
  const result = calculateUsedAssetLife({
    statutoryLife: 6,
    elapsedYears: 4,
    elapsedMonths: 0,
  });
  expect(result.usefulLife).toBe(2);
});

test("法定4年・経過2年（2年落ち軽自動車）→ 2年", () => {
  // (4-2) + 2×20% = 2 + 0.4 = 2.4 → 切り捨て2年
  const result = calculateUsedAssetLife({
    statutoryLife: 4,
    elapsedYears: 2,
    elapsedMonths: 0,
  });
  expect(result.usefulLife).toBe(2);
});

test("法定50年・経過15年（築15年RC造事務所）→ 38年", () => {
  // (50-15) + 15×20% = 35 + 3 = 38年
  const result = calculateUsedAssetLife({
    statutoryLife: 50,
    elapsedYears: 15,
    elapsedMonths: 0,
  });
  expect(result.usefulLife).toBe(38);
});

test("法定22年・経過10年（築10年木造住宅）→ 14年", () => {
  // (22-10) + 10×20% = 12 + 2 = 14年
  const result = calculateUsedAssetLife({
    statutoryLife: 22,
    elapsedYears: 10,
    elapsedMonths: 0,
  });
  expect(result.usefulLife).toBe(14);
});

test("法定15年・経過5年（5年落ち金属製事務机）→ 11年", () => {
  // (15-5) + 5×20% = 10 + 1 = 11年
  const result = calculateUsedAssetLife({
    statutoryLife: 15,
    elapsedYears: 5,
    elapsedMonths: 0,
  });
  expect(result.usefulLife).toBe(11);
});

console.log("\n=== 全部経過 ===");

test("法定6年・経過10年（10年落ち普通自動車）→ 2年", () => {
  // 全部経過: 6 × 20% = 1.2 → 切り捨て1年 → 最低2年
  const result = calculateUsedAssetLife({
    statutoryLife: 6,
    elapsedYears: 10,
    elapsedMonths: 0,
  });
  expect(result.usefulLife).toBe(2);
});

test("法定4年・経過10年（10年落ち軽自動車）→ 2年", () => {
  // 全部経過: 4 × 20% = 0.8 → 切り捨て0年 → 最低2年
  const result = calculateUsedAssetLife({
    statutoryLife: 4,
    elapsedYears: 10,
    elapsedMonths: 0,
  });
  expect(result.usefulLife).toBe(2);
});

test("法定22年・経過30年（築30年木造）→ 4年", () => {
  // 全部経過: 22 × 20% = 4.4 → 切り捨て4年
  const result = calculateUsedAssetLife({
    statutoryLife: 22,
    elapsedYears: 30,
    elapsedMonths: 0,
  });
  expect(result.usefulLife).toBe(4);
});

test("法定6年・経過6年（ちょうど全部経過）→ 2年", () => {
  // 経過年数 = 法定耐用年数 → 全部経過扱い: 6 × 20% = 1.2 → 最低2年
  const result = calculateUsedAssetLife({
    statutoryLife: 6,
    elapsedYears: 6,
    elapsedMonths: 0,
  });
  expect(result.usefulLife).toBe(2);
});

console.log("\n=== 端数処理 ===");

test("法定6年・経過3年 → 3年（端数切り捨て確認）", () => {
  // (6-3) + 3×20% = 3 + 0.6 = 3.6 → 切り捨て3年
  const result = calculateUsedAssetLife({
    statutoryLife: 6,
    elapsedYears: 3,
    elapsedMonths: 0,
  });
  expect(result.usefulLife).toBe(3);
});

test("法定47年・経過20年 → 31年", () => {
  // (47-20) + 20×20% = 27 + 4 = 31年
  const result = calculateUsedAssetLife({
    statutoryLife: 47,
    elapsedYears: 20,
    elapsedMonths: 0,
  });
  expect(result.usefulLife).toBe(31);
});

console.log("\n=== 月数を含む経過年数（耐通1-5-3） ===");

test("法定6年・経過3年6ヶ月 → 3年", () => {
  // 月数ベース: (72 - 42) + 42×20% = 30 + 8.4 = 38.4ヶ月 = 3.2年 → 切り捨て3年
  const result = calculateUsedAssetLife({
    statutoryLife: 6,
    elapsedYears: 3,
    elapsedMonths: 6,
  });
  expect(result.usefulLife).toBe(3);
});

test("法定4年・経過1年6ヶ月 → 2年", () => {
  // 月数ベース: (48 - 18) + 18×20% = 30 + 3.6 = 33.6ヶ月 = 2.8年 → 切り捨て2年
  const result = calculateUsedAssetLife({
    statutoryLife: 4,
    elapsedYears: 1,
    elapsedMonths: 6,
  });
  expect(result.usefulLife).toBe(2);
});

test("法定22年・経過5年3ヶ月 → 17年", () => {
  // 月数ベース: (264 - 63) + 63×20% = 201 + 12.6 = 213.6ヶ月 = 17.8年 → 切り捨て17年
  const result = calculateUsedAssetLife({
    statutoryLife: 22,
    elapsedYears: 5,
    elapsedMonths: 3,
  });
  expect(result.usefulLife).toBe(17);
});

console.log("\n=== 最低2年ルール ===");

test("法定3年・経過3年 → 2年（最低2年）", () => {
  // 全部経過: 3 × 20% = 0.6 → 切り捨て0年 → 最低2年
  const result = calculateUsedAssetLife({
    statutoryLife: 3,
    elapsedYears: 3,
    elapsedMonths: 0,
  });
  expect(result.usefulLife).toBe(2);
});

test("法定2年・経過2年 → 2年（最低2年）", () => {
  // 全部経過: 2 × 20% = 0.4 → 切り捨て0年 → 最低2年
  const result = calculateUsedAssetLife({
    statutoryLife: 2,
    elapsedYears: 2,
    elapsedMonths: 0,
  });
  expect(result.usefulLife).toBe(2);
});

console.log("\n=== 資本的支出 ===");

test("資本的支出が取得価額の50%以下 → 簡便法OK", () => {
  const result = calculateUsedAssetLife({
    statutoryLife: 22,
    elapsedYears: 10,
    elapsedMonths: 0,
    acquisitionCost: 10_000_000,
    capitalExpenditure: 4_000_000, // 40% < 50%
  });
  expectMethod(result.method).toBe("kanbenho");
  expect(result.usefulLife).toBe(14);
});

test("資本的支出が取得価額の50%超・再取得価額の50%以下 → 特別算式", () => {
  // 耐通1-5-6の特別算式
  // 取得1000万、資本的支出800万、再取得2200万、法定22年、経過10年
  // 簡便法年数: (22-10) + 10×20% = 14年
  // 特別算式: 1800万 / (1000万/14 + 800万/22)
  //         = 1800万 / (714,285.7 + 363,636.4)
  //         = 1800万 / 1,077,922.1
  //         = 16.7 → 16年
  const result = calculateUsedAssetLife({
    statutoryLife: 22,
    elapsedYears: 10,
    elapsedMonths: 0,
    acquisitionCost: 10_000_000,
    capitalExpenditure: 8_000_000,
    reacquisitionCost: 22_000_000,
  });
  expectMethod(result.method).toBe("special");
  expect(result.usefulLife).toBe(16);
});

test("資本的支出が再取得価額の50%超 → 法定耐用年数", () => {
  const result = calculateUsedAssetLife({
    statutoryLife: 22,
    elapsedYears: 10,
    elapsedMonths: 0,
    acquisitionCost: 10_000_000,
    capitalExpenditure: 12_000_000,
    reacquisitionCost: 22_000_000,
  });
  expectMethod(result.method).toBe("statutory");
  expect(result.usefulLife).toBe(22);
});

test("資本的支出が取得価額の50%超・再取得価額未入力 → not_applicable", () => {
  const result = calculateUsedAssetLife({
    statutoryLife: 22,
    elapsedYears: 10,
    elapsedMonths: 0,
    acquisitionCost: 10_000_000,
    capitalExpenditure: 6_000_000,
    // reacquisitionCost未入力
  });
  expectMethod(result.method).toBe("not_applicable");
});

test("資本的支出0（なし）→ 簡便法", () => {
  const result = calculateUsedAssetLife({
    statutoryLife: 6,
    elapsedYears: 4,
    elapsedMonths: 0,
    acquisitionCost: 1_000_000,
    capitalExpenditure: 0,
  });
  expectMethod(result.method).toBe("kanbenho");
  expect(result.usefulLife).toBe(2);
});

console.log("\n=== 外部ソース検証（税理士サイト・公式情報） ===");

test("みかげ税理士: 7年落ち普通車 → 2年", () => {
  // 全部経過: 6×20% = 1.2 → 切り捨て1 → 最低2年
  const result = calculateUsedAssetLife({
    statutoryLife: 6, elapsedYears: 7, elapsedMonths: 0,
  });
  expect(result.usefulLife).toBe(2);
});

test("みかげ税理士: 1年5ヶ月落ち普通車 → 4年", () => {
  // 月数: (72-17) + 17×0.2 = 55 + 3.4 = 58.4ヶ月 = 4.87年 → 切り捨て4年
  const result = calculateUsedAssetLife({
    statutoryLife: 6, elapsedYears: 1, elapsedMonths: 5,
  });
  expect(result.usefulLife).toBe(4);
});

test("みかげ税理士: 3年10ヶ月落ち普通車 → 2年", () => {
  // 月数: (72-46) + 46×0.2 = 26 + 9.2 = 35.2ヶ月 = 2.93年 → 切り捨て2年
  const result = calculateUsedAssetLife({
    statutoryLife: 6, elapsedYears: 3, elapsedMonths: 10,
  });
  expect(result.usefulLife).toBe(2);
});

console.log("\n=== 追加のエッジケース ===");

test("経過0年（新品扱い）→ 法定耐用年数そのまま", () => {
  // (6-0) + 0×0.2 = 6年
  const result = calculateUsedAssetLife({
    statutoryLife: 6, elapsedYears: 0, elapsedMonths: 0,
  });
  expect(result.usefulLife).toBe(6);
});

test("経過0年6ヶ月（半年使用）→ 月数換算", () => {
  // 月数: (72-6) + 6×0.2 = 66 + 1.2 = 67.2ヶ月 = 5.6年 → 切り捨て5年
  const result = calculateUsedAssetLife({
    statutoryLife: 6, elapsedYears: 0, elapsedMonths: 6,
  });
  expect(result.usefulLife).toBe(5);
});

test("経過11ヶ月（1年弱）→ 月数換算", () => {
  // 月数: (72-11) + 11×0.2 = 61 + 2.2 = 63.2ヶ月 = 5.27年 → 切り捨て5年
  const result = calculateUsedAssetLife({
    statutoryLife: 6, elapsedYears: 0, elapsedMonths: 11,
  });
  expect(result.usefulLife).toBe(5);
});

test("経過5年11ヶ月（あと1ヶ月で全経過）→ 2年", () => {
  // 月数: (72-71) + 71×0.2 = 1 + 14.2 = 15.2ヶ月 = 1.27年 → 切り捨て1年 → 最低2年
  const result = calculateUsedAssetLife({
    statutoryLife: 6, elapsedYears: 5, elapsedMonths: 11,
  });
  expect(result.usefulLife).toBe(2);
});

test("経過6年0ヶ月（ちょうど全経過）→ 2年", () => {
  // 全部経過: 6×0.2 = 1.2 → 切り捨て1 → 最低2年
  const result = calculateUsedAssetLife({
    statutoryLife: 6, elapsedYears: 6, elapsedMonths: 0,
  });
  expect(result.usefulLife).toBe(2);
});

test("法定50年・経過25年・端数0ヶ月", () => {
  // (50-25) + 25×0.2 = 25 + 5 = 30年
  const result = calculateUsedAssetLife({
    statutoryLife: 50, elapsedYears: 25, elapsedMonths: 0,
  });
  expect(result.usefulLife).toBe(30);
});

test("法定50年・経過49年11ヶ月（限界ギリギリ）", () => {
  // 月数: (600-599) + 599×0.2 = 1 + 119.8 = 120.8ヶ月 = 10.07年 → 切り捨て10年
  const result = calculateUsedAssetLife({
    statutoryLife: 50, elapsedYears: 49, elapsedMonths: 11,
  });
  expect(result.usefulLife).toBe(10);
});

test("法定50年・経過50年（ちょうど全経過）→ 10年", () => {
  // 全部経過: 50×0.2 = 10年
  const result = calculateUsedAssetLife({
    statutoryLife: 50, elapsedYears: 50, elapsedMonths: 0,
  });
  expect(result.usefulLife).toBe(10);
});

test("法定50年・経過60年（10年超過）→ 10年", () => {
  // 全部経過: 50×0.2 = 10年
  const result = calculateUsedAssetLife({
    statutoryLife: 50, elapsedYears: 60, elapsedMonths: 0,
  });
  expect(result.usefulLife).toBe(10);
});

test("法定10年・経過5年 → 6年", () => {
  // (10-5) + 5×0.2 = 5 + 1 = 6年
  const result = calculateUsedAssetLife({
    statutoryLife: 10, elapsedYears: 5, elapsedMonths: 0,
  });
  expect(result.usefulLife).toBe(6);
});

test("法定8年・経過4年 → 4年", () => {
  // (8-4) + 4×0.2 = 4 + 0.8 = 4.8 → 切り捨て4年
  const result = calculateUsedAssetLife({
    statutoryLife: 8, elapsedYears: 4, elapsedMonths: 0,
  });
  expect(result.usefulLife).toBe(4);
});

test("法定5年・経過2年 → 3年", () => {
  // (5-2) + 2×0.2 = 3 + 0.4 = 3.4 → 切り捨て3年
  const result = calculateUsedAssetLife({
    statutoryLife: 5, elapsedYears: 2, elapsedMonths: 0,
  });
  expect(result.usefulLife).toBe(3);
});

console.log("\n=== 国税庁QA特別算式（再検証） ===");

test("国税庁QA: 取得1000万・資本支出800万・再取得2200万・法定22年・経過10年", () => {
  // 国税庁QAの数値例（最終結果は画像のため未確認だが計算は耐通1-5-6に従う）
  // 簡便法年数: (22-10) + 10×0.2 = 14年
  // 800万 ÷ 2200万 = 36.4% < 50% → 簡便法...と思いきや
  // 800万 ÷ 1000万 = 80% > 50% → 特別算式適用
  // 特別算式: (1000+800)万 ÷ (1000万/14 + 800万/22)
  //         = 1800万 ÷ (714,285.7 + 363,636.4)
  //         = 1800万 ÷ 1,077,922.1
  //         = 16.69... → 切り捨て16年
  const result = calculateUsedAssetLife({
    statutoryLife: 22,
    elapsedYears: 10,
    elapsedMonths: 0,
    acquisitionCost: 10_000_000,
    capitalExpenditure: 8_000_000,
    reacquisitionCost: 22_000_000,
  });
  expectMethod(result.method).toBe("special");
  expect(result.usefulLife).toBe(16);
});

console.log("\n=== 資本的支出の境界値テスト ===");

test("資本的支出 = 取得価額のちょうど50% → 簡便法OK", () => {
  // 50% = 取得価額の50%（"超える"場合に簡便法不可なので、ちょうど50%はOK）
  const result = calculateUsedAssetLife({
    statutoryLife: 6,
    elapsedYears: 4,
    elapsedMonths: 0,
    acquisitionCost: 1_000_000,
    capitalExpenditure: 500_000,
  });
  expectMethod(result.method).toBe("kanbenho");
  expect(result.usefulLife).toBe(2);
});

test("資本的支出 = 取得価額の50%+1円 → 特別算式", () => {
  const result = calculateUsedAssetLife({
    statutoryLife: 22,
    elapsedYears: 10,
    elapsedMonths: 0,
    acquisitionCost: 10_000_000,
    capitalExpenditure: 5_000_001,
    reacquisitionCost: 22_000_000,
  });
  expectMethod(result.method).toBe("special");
});

test("資本的支出 = 再取得価額のちょうど50% → 特別算式（statutoryではない）", () => {
  // ちょうど50%は"超えていない"ので特別算式
  const result = calculateUsedAssetLife({
    statutoryLife: 22,
    elapsedYears: 10,
    elapsedMonths: 0,
    acquisitionCost: 10_000_000,
    capitalExpenditure: 11_000_000,
    reacquisitionCost: 22_000_000,
  });
  expectMethod(result.method).toBe("special");
});

test("資本的支出 = 再取得価額の50%+1円 → 法定耐用年数", () => {
  const result = calculateUsedAssetLife({
    statutoryLife: 22,
    elapsedYears: 10,
    elapsedMonths: 0,
    acquisitionCost: 10_000_000,
    capitalExpenditure: 11_000_001,
    reacquisitionCost: 22_000_000,
  });
  expectMethod(result.method).toBe("statutory");
  expect(result.usefulLife).toBe(22);
});

console.log("\n=== 不動産（建物）の現実的なケース ===");

test("RC造マンション（法定47年）築20年", () => {
  // (47-20) + 20×0.2 = 27 + 4 = 31年
  const result = calculateUsedAssetLife({
    statutoryLife: 47, elapsedYears: 20, elapsedMonths: 0,
  });
  expect(result.usefulLife).toBe(31);
});

test("木造アパート（法定22年）築25年（全経過）→ 4年", () => {
  // 22×0.2 = 4.4 → 切り捨て4年
  const result = calculateUsedAssetLife({
    statutoryLife: 22, elapsedYears: 25, elapsedMonths: 0,
  });
  expect(result.usefulLife).toBe(4);
});

test("鉄骨造（法定34年）築15年", () => {
  // (34-15) + 15×0.2 = 19 + 3 = 22年
  const result = calculateUsedAssetLife({
    statutoryLife: 34, elapsedYears: 15, elapsedMonths: 0,
  });
  expect(result.usefulLife).toBe(22);
});

console.log("\n=== 特別算式の上限不変条件 ===");

test("特別算式の結果は法定耐用年数を超えない（極端ケース1: 経過0年）", () => {
  const result = calculateUsedAssetLife({
    statutoryLife: 22,
    elapsedYears: 0,
    elapsedMonths: 0,
    acquisitionCost: 10_000_000,
    capitalExpenditure: 9_000_000,
    reacquisitionCost: 22_000_000,
  });
  expectMethod(result.method).toBe("special");
  if (result.usefulLife > 22) throw new Error(`expected ≤22, got ${result.usefulLife}`);
});

test("特別算式の結果は法定耐用年数を超えない（極端ケース2: 資本支出が圧倒的）", () => {
  const result = calculateUsedAssetLife({
    statutoryLife: 47,
    elapsedYears: 30,
    elapsedMonths: 0,
    acquisitionCost: 1_000_000,
    capitalExpenditure: 900_000,
    reacquisitionCost: 50_000_000,
  });
  expectMethod(result.method).toBe("special");
  if (result.usefulLife > 47) throw new Error(`expected ≤47, got ${result.usefulLife}`);
});

test("特別算式の結果は簡便法より長くなる（下限の不変条件）", () => {
  // 簡便法単独なら(22-10)+10×0.2=14年。特別算式は14年以上になるはず。
  const result = calculateUsedAssetLife({
    statutoryLife: 22,
    elapsedYears: 10,
    elapsedMonths: 0,
    acquisitionCost: 10_000_000,
    capitalExpenditure: 8_000_000,
    reacquisitionCost: 22_000_000,
  });
  expectMethod(result.method).toBe("special");
  if (result.usefulLife < 14) throw new Error(`expected ≥14, got ${result.usefulLife}`);
});

console.log("\n=== ギャップ補完：資本的支出の難所 ===");

test("G1: 全経過した中古資産にリフォーム→特別算式（calcKanbenho が小数返り値）", () => {
  // 法定22年・経過25年(全経過) → 簡便年=22*0.2=4.4
  // 取得500万・資本支出400万(80%>50%)・再取得2000万(20%<50%)
  // total=900万。denom = 500万/4.4 + 400万/22 = 1,136,363.6 + 181,818.2 = 1,318,181.8
  // raw = 900万/1,318,181.8 ≒ 6.83 → 6年
  const result = calculateUsedAssetLife({
    statutoryLife: 22, elapsedYears: 25, elapsedMonths: 0,
    acquisitionCost: 5_000_000,
    capitalExpenditure: 4_000_000,
    reacquisitionCost: 20_000_000,
  });
  expectMethod(result.method).toBe("special");
  expect(result.usefulLife).toBe(6);
});

test("G2: 取得価額0円・資本的支出あり → クラッシュしないこと", () => {
  const result = calculateUsedAssetLife({
    statutoryLife: 22, elapsedYears: 10, elapsedMonths: 0,
    acquisitionCost: 0,
    capitalExpenditure: 1_000_000,
    reacquisitionCost: 22_000_000,
  });
  if (!Number.isFinite(result.usefulLife)) {
    throw new Error(`expected finite, got ${result.usefulLife}`);
  }
});

test("G3: acquisitionCost 未指定なら capitalExpenditure は無視されて簡便法", () => {
  const result = calculateUsedAssetLife({
    statutoryLife: 22, elapsedYears: 10, elapsedMonths: 0,
    capitalExpenditure: 8_000_000,
  });
  expectMethod(result.method).toBe("kanbenho");
  expect(result.usefulLife).toBe(14);
});

test("G4: 特別算式の極小結果に最低2年ルールが効く", () => {
  // 法定2年・経過2年(全経過)・取得100万・資本支出90万・再取得200万
  // 簡便年=0.4。total=190万。denom=100万/0.4 + 90万/2 = 2,500,000 + 450,000 = 2,950,000
  // raw=190万/2,950,000 ≒ 0.64 → floor 0 → 最低2年
  const result = calculateUsedAssetLife({
    statutoryLife: 2, elapsedYears: 2, elapsedMonths: 0,
    acquisitionCost: 1_000_000,
    capitalExpenditure: 900_000,
    reacquisitionCost: 2_000_000,
  });
  expect(result.usefulLife).toBe(2);
});

test("G5: 取得価額より資本的支出が大きい(中古ボロ物件 + 大規模リフォーム)", () => {
  // 取得300万・資本支出500万(167%>50%)・再取得3000万(17%<50%)
  // 法定22年・経過30年(全経過) → 簡便年=4.4
  // total=800万。denom=300万/4.4 + 500万/22 = 681,818.2 + 227,272.7 = 909,090.9
  // raw=800万/909,090.9 ≒ 8.8 → 8年
  const result = calculateUsedAssetLife({
    statutoryLife: 22, elapsedYears: 30, elapsedMonths: 0,
    acquisitionCost: 3_000_000,
    capitalExpenditure: 5_000_000,
    reacquisitionCost: 30_000_000,
  });
  expectMethod(result.method).toBe("special");
  expect(result.usefulLife).toBe(8);
});

test("G6: マイナス経過年数 → クラッシュしないこと(現状の挙動を固定)", () => {
  const result = calculateUsedAssetLife({
    statutoryLife: 6, elapsedYears: -1, elapsedMonths: 0,
  });
  if (!Number.isFinite(result.usefulLife)) {
    throw new Error(`expected finite, got ${result.usefulLife}`);
  }
});

test("G7: 資本支出=取得価額(100%)でも再取得価額50%以下なら特別算式", () => {
  // 取得500万・資本支出500万(100%>50%)・再取得3000万(17%<50%)
  // 法定22年・経過10年 → 簡便年=14
  // total=1000万。denom=500万/14 + 500万/22 = 357,142.9 + 227,272.7 = 584,415.6
  // raw=1000万/584,415.6 ≒ 17.11 → 17年
  const result = calculateUsedAssetLife({
    statutoryLife: 22, elapsedYears: 10, elapsedMonths: 0,
    acquisitionCost: 5_000_000,
    capitalExpenditure: 5_000_000,
    reacquisitionCost: 30_000_000,
  });
  expectMethod(result.method).toBe("special");
  expect(result.usefulLife).toBe(17);
});

// --- 結果表示 ---
console.log(`\n=== 結果: ${passed} passed, ${failed} failed ===`);
if (failed > 0) {
  process.exit(1);
}
