/**
 * 外部ソース（税理士サイト・国税庁）から集めた計算例との突合テスト
 *
 * 目的: 中古資産の計算ロジックが、実在する税理士・国税庁の計算例と一致するか確認する。
 * 不一致が出たら、まず国税庁の一次情報に戻ってどちらが正しいか検証する。
 */

import { calculateUsedAssetLife } from "./usedAssetLife";

let passed = 0;
let failed = 0;
const failures: string[] = [];

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
    failures.push(`${name}: ${msg}`);
  }
}

function expectLife(actual: number, expected: number, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}年, got ${actual}年`);
  }
}

console.log("\n=== ① 国税庁No.5404 公式例 ===");
test("法定30年・経過10年 → 22年", () => {
  const r = calculateUsedAssetLife({
    statutoryLife: 30,
    elapsedYears: 10,
    elapsedMonths: 0,
  });
  if (r.method !== "kanbenho") throw new Error("method違い");
  expectLife(r.usefulLife, 22, "国税庁No.5404公式例");
});

console.log("\n=== ② みかげ税理士事務所の計算例 ===");
test("法定6年・経過7年（7年落ち普通車） → 2年", () => {
  const r = calculateUsedAssetLife({
    statutoryLife: 6,
    elapsedYears: 7,
    elapsedMonths: 0,
  });
  if (r.method !== "kanbenho") throw new Error("method違い");
  expectLife(r.usefulLife, 2, "みかげ税理士-7年落ち");
});

test("法定6年・経過1年5ヶ月（1年5ヶ月落ち普通車） → 4年", () => {
  const r = calculateUsedAssetLife({
    statutoryLife: 6,
    elapsedYears: 1,
    elapsedMonths: 5,
  });
  if (r.method !== "kanbenho") throw new Error("method違い");
  expectLife(r.usefulLife, 4, "みかげ税理士-1年5ヶ月落ち");
});

test("法定6年・経過3年10ヶ月（3年10ヶ月落ち普通車） → 2年", () => {
  const r = calculateUsedAssetLife({
    statutoryLife: 6,
    elapsedYears: 3,
    elapsedMonths: 10,
  });
  if (r.method !== "kanbenho") throw new Error("method違い");
  expectLife(r.usefulLife, 2, "みかげ税理士-3年10ヶ月落ち");
});

console.log("\n=== ③ 鈴木税理士事務所の計算例 ===");
test("法定6年・経過6年（全経過） → 2年", () => {
  const r = calculateUsedAssetLife({
    statutoryLife: 6,
    elapsedYears: 6,
    elapsedMonths: 0,
  });
  expectLife(r.usefulLife, 2, "鈴木税理士-6年全経過");
});

test("法定4年・経過6年（軽自動車・全経過） → 2年", () => {
  const r = calculateUsedAssetLife({
    statutoryLife: 4,
    elapsedYears: 6,
    elapsedMonths: 0,
  });
  expectLife(r.usefulLife, 2, "鈴木税理士-4年全経過");
});

// 重要: 鈴木税理士の記事は「法定6年・経過2年9ヶ月 → 2年」と書いているが、
// (72-33) + 33×0.2 = 39 + 6.6 = 45.6ヶ月 = 3.8年 → 切り捨て3年が正解
// 記事側の誤りと判定。私のロジックは3年が正解。
test("法定6年・経過2年9ヶ月 → 3年（鈴木税理士の記事は2年と誤記）", () => {
  const r = calculateUsedAssetLife({
    statutoryLife: 6,
    elapsedYears: 2,
    elapsedMonths: 9,
  });
  // 国税庁の式: (72-33) + 33×0.2 = 39 + 6.6 = 45.6ヶ月 = 3.8年 → 3年
  expectLife(r.usefulLife, 3, "鈴木税理士-2年9ヶ月（記事は誤り）");
});

console.log("\n=== ④ 検索結果から（半年経過の中古車） ===");
// 「新車登録から半年経過の中古車：6 - 0.5 + 0.5×0.2 = 5.6 → 5年」と検索結果にあった
// 月数換算で検証: (72-6) + 6×0.2 = 66 + 1.2 = 67.2ヶ月 = 5.6年 → 切り捨て5年
test("法定6年・経過6ヶ月（半年落ち普通車） → 5年", () => {
  const r = calculateUsedAssetLife({
    statutoryLife: 6,
    elapsedYears: 0,
    elapsedMonths: 6,
  });
  expectLife(r.usefulLife, 5, "半年落ち普通車");
});

console.log("\n=== ⑤ 和田税理士事務所（不動産投資・全経過） ===");
test("法定22年・経過30年（築30年木造・全経過） → 4年", () => {
  const r = calculateUsedAssetLife({
    statutoryLife: 22,
    elapsedYears: 30,
    elapsedMonths: 0,
  });
  // 全経過: 22 × 0.2 = 4.4 → 切り捨て4年
  expectLife(r.usefulLife, 4, "和田税理士-築30年木造全経過");
});

console.log("\n=== ⑥ 東京メトロポリタン税理士（中古建物・一部経過） ===");
test("法定22年・経過20年（築20年木造） → 6年", () => {
  const r = calculateUsedAssetLife({
    statutoryLife: 22,
    elapsedYears: 20,
    elapsedMonths: 0,
  });
  // (22-20) + 20×0.2 = 2 + 4 = 6年
  expectLife(r.usefulLife, 6, "東京メトロポリタン-築20年木造");
});

console.log("\n=== ⑦ 東京メトロポリタン税理士（特別算式） ===");
test("法定22年・経過20年・取得500万・資本支出500万（再取得未指定→ not_applicable）", () => {
  const r = calculateUsedAssetLife({
    statutoryLife: 22,
    elapsedYears: 20,
    elapsedMonths: 0,
    acquisitionCost: 5_000_000,
    capitalExpenditure: 5_000_000,
    // 再取得価額未指定
  });
  // 資本支出が取得価額の50%超だが再取得価額未指定 → not_applicable
  if (r.method !== "not_applicable") {
    throw new Error(`method違い: ${r.method}`);
  }
});

// 東京メトロポリタン税理士の例: 法定22年・経過20年・取得500万・資本支出500万 → 9年
// ただしこの例は再取得価額が明示されていない。記事の計算式を見ると
// (500+500) ÷ (500/6 + 500/22) = 1000 ÷ (83.3 + 22.7) = 1000 ÷ 106 = 9.43 → 9年
// これは耐通1-5-6の特別算式そのもの
// 私のロジックでこの計算結果が出ることを確認するには、再取得価額を「資本的支出が再取得の50%以下」になる範囲で
// 設定する必要がある。再取得2000万円なら 500万 < 1000万なのでOK
test("法定22年・経過20年・取得500万・資本支出500万・再取得2000万 → 9年（東京メトロポリタン税理士）", () => {
  const r = calculateUsedAssetLife({
    statutoryLife: 22,
    elapsedYears: 20,
    elapsedMonths: 0,
    acquisitionCost: 5_000_000,
    capitalExpenditure: 5_000_000,
    reacquisitionCost: 20_000_000,
  });
  if (r.method !== "special") {
    throw new Error(`method違い: ${r.method}`);
  }
  // 簡便法年数: (22-20) + 20×0.2 = 6年
  // 特別算式: (500+500)万 ÷ (500/6 + 500/22) = 1000 ÷ (83.33 + 22.73) = 1000 ÷ 106.06 = 9.43 → 切り捨て9年
  expectLife(r.usefulLife, 9, "東京メトロポリタン-築20年木造+リフォーム");
});

console.log("\n=== ⑧ 和田税理士事務所（特別算式・ボロ物件） ===");
// 1000万で取得した築30年木造に600万のリフォーム、再取得3000万
// 和田税理士の記事は「約6年」と概算で書かれているが、厳密に国税庁の原則
// （「最終結果のみ切り捨て、途中では切り捨てない」）で計算すると6年。
//
// 理由:
// - 簡便法年数の生の値: 22 × 0.2 = 4.4年（切り捨て前）
// - 特別算式の中で簡便法年数として 4.4年 を使う（途中切り捨てなし原則）
// - 分母: 1000/4.4 + 600/22 = 227.27 + 27.27 = 254.54万
// - 結果: (1000+600)万 ÷ 254.54万 = 6.286 → 切り捨て6年
//
// もし途中で切り捨てて4年を使うと: 1600 ÷ 277.27 = 5.77 → 5年になるが、
// これは国税庁の体系的な「途中では切り捨てない」原則に反する。
// 和田税理士の記事は「約6年」と曖昧に書いているので、税理士側が
// 厳密に計算しておらず概算表現になっていると判定。
//
// 判断の根拠:
// - 国税庁No.5404・耐通1-5-3の「最終結果のみ切り捨て」原則
// - みかげ税理士・東京メトロポリタン税理士など他の税理士はこの原則に従っている
// - 和田税理士の記事だけが「約」表記 → 概算
test("法定22年・経過30年（全経過）・取得1000万・資本支出600万・再取得3000万 → 6年（和田税理士の『約6年』を厳密化）", () => {
  const r = calculateUsedAssetLife({
    statutoryLife: 22,
    elapsedYears: 30,
    elapsedMonths: 0,
    acquisitionCost: 10_000_000,
    capitalExpenditure: 6_000_000,
    reacquisitionCost: 30_000_000,
  });
  // 600万 ÷ 1000万 = 60% > 50% → 特別算式
  // 600万 ÷ 3000万 = 20% ≤ 50% → 特別算式OK
  if (r.method !== "special") {
    throw new Error(`method違い: ${r.method}`);
  }
  // 厳密計算: (1000+600)万 ÷ (1000/4.4 + 600/22) = 1600 ÷ 254.54 = 6.286 → 6年
  expectLife(r.usefulLife, 6, "和田税理士-ボロ物件");
});

console.log("\n=== ⑨ DKKT税理士事務所（資本的支出 - 国税庁QA同等の例） ===");
// 国税庁No.5404のQAページにある計算例と同じ数値設定
// 法定22年・経過10年・取得1000万・資本的支出800万・再取得2200万
// 800万 ÷ 1000万 = 80% > 50% → 特別算式
// 800万 ÷ 2200万 = 36% ≤ 50% → 特別算式OK
// 簡便法年数: (22-10) + 10×0.2 = 14年（端数なし）
// 特別算式: (1000+800)万 ÷ (1000/14 + 800/22) = 1800 ÷ (71.43 + 36.36) = 1800 ÷ 107.79 = 16.7 → 16年
// → DKKT税理士の記事は「16年」と明記
test("法定22年・経過10年・取得1000万・資本支出800万・再取得2200万 → 16年（DKKT税理士・国税庁QA例）", () => {
  const r = calculateUsedAssetLife({
    statutoryLife: 22,
    elapsedYears: 10,
    elapsedMonths: 0,
    acquisitionCost: 10_000_000,
    capitalExpenditure: 8_000_000,
    reacquisitionCost: 22_000_000,
  });
  if (r.method !== "special") {
    throw new Error(`method違い: ${r.method}`);
  }
  expectLife(r.usefulLife, 16, "DKKT-国税庁QA例");
});

console.log("\n=== ⑩ DKKT税理士事務所（再取得価額50%超 → 法定耐用年数） ===");
// 取得1000万・改修1200万・再取得2200万
// 1200万 ÷ 1000万 = 120% > 50% → 特別算式 or 法定
// 1200万 ÷ 2200万 = 54.5% > 50% → 法定耐用年数を適用
test("法定22年・取得1000万・改修1200万・再取得2200万 → 法定22年（DKKT税理士・再取得50%超）", () => {
  const r = calculateUsedAssetLife({
    statutoryLife: 22,
    elapsedYears: 30,
    elapsedMonths: 0,
    acquisitionCost: 10_000_000,
    capitalExpenditure: 12_000_000,
    reacquisitionCost: 22_000_000,
  });
  if (r.method !== "statutory") {
    throw new Error(`method違い: ${r.method}`);
  }
  expectLife(r.usefulLife, 22, "DKKT-再取得50%超");
});

console.log("\n=== ⑪ INVEST ONLINE（築25年木造アパート・通常の簡便法） ===");
// 築25年木造アパート（法定22年）取得600万円、資本的支出250万円
// 250万 ÷ 600万 = 41.67% ≤ 50% → 簡便法のまま使える
// 簡便法年数: 22年×0.2 = 4.4 → 切り捨て4年（全経過）
// 結果: 4年で償却（記事は「4年で償却」と明記）
test("法定22年・経過25年（全経過）・取得600万・資本支出250万 → 4年（INVEST ONLINE・簡便法のまま）", () => {
  const r = calculateUsedAssetLife({
    statutoryLife: 22,
    elapsedYears: 25,
    elapsedMonths: 0,
    acquisitionCost: 6_000_000,
    capitalExpenditure: 2_500_000,
    // 再取得価額は不要（取得価額の50%以下なので簡便法のまま）
  });
  if (r.method !== "kanbenho") {
    throw new Error(`method違い: ${r.method}`);
  }
  expectLife(r.usefulLife, 4, "INVEST ONLINE-築25年木造");
});

console.log("\n=== ⑫ 資本的支出ゼロ（境界値）===");
test("法定6年・経過4年・資本的支出ゼロ → 簡便法で2年", () => {
  const r = calculateUsedAssetLife({
    statutoryLife: 6,
    elapsedYears: 4,
    elapsedMonths: 0,
    acquisitionCost: 1_000_000,
    capitalExpenditure: 0,
  });
  if (r.method !== "kanbenho") {
    throw new Error(`method違い: ${r.method}`);
  }
  expectLife(r.usefulLife, 2, "資本的支出ゼロ");
});

console.log("\n=== ⑬ 取得価額の50%ちょうど（境界値）===");
// 取得1000万、資本的支出500万 = 50%ちょうど → 「超える」場合は特別算式なので、ちょうど50%は簡便法のまま
test("法定22年・経過10年・取得1000万・資本支出500万（50%ちょうど）→ 簡便法14年", () => {
  const r = calculateUsedAssetLife({
    statutoryLife: 22,
    elapsedYears: 10,
    elapsedMonths: 0,
    acquisitionCost: 10_000_000,
    capitalExpenditure: 5_000_000,
  });
  if (r.method !== "kanbenho") {
    throw new Error(`method違い: ${r.method}`);
  }
  // (22-10) + 10×0.2 = 14年
  expectLife(r.usefulLife, 14, "取得価額50%ちょうど");
});

console.log("\n=== ⑭ 再取得価額の50%ちょうど（境界値）===");
// 再取得2000万、資本的支出1000万 = 50%ちょうど → 法定耐用年数ではなく特別算式
test("法定22年・経過10年・取得500万・資本支出1000万・再取得2000万（再取得50%ちょうど）→ 特別算式", () => {
  const r = calculateUsedAssetLife({
    statutoryLife: 22,
    elapsedYears: 10,
    elapsedMonths: 0,
    acquisitionCost: 5_000_000,
    capitalExpenditure: 10_000_000,
    reacquisitionCost: 20_000_000,
  });
  // 1000万 ÷ 500万 = 200% > 50% → 特別算式 or 法定
  // 1000万 ÷ 2000万 = 50%ちょうど → 「超える」ではないので特別算式
  if (r.method !== "special") {
    throw new Error(`method違い: ${r.method}`);
  }
  // 簡便法年数: (22-10) + 10×0.2 = 14年
  // 特別算式: (500+1000)万 ÷ (500/14 + 1000/22) = 1500 ÷ (35.71 + 45.45) = 1500 ÷ 81.17 = 18.48 → 18年
  expectLife(r.usefulLife, 18, "再取得50%ちょうど");
});

// 結果サマリー
console.log(`\n=== 結果: ${passed} passed, ${failed} failed ===`);
if (failed > 0) {
  console.log("\n失敗したテスト:");
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
