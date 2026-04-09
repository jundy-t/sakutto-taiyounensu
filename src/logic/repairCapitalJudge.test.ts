/**
 * 修繕費 vs 資本的支出 判定ロジックのテスト
 *
 * 通達ベースの判定順序を境界値も含めて網羅的にテストする。
 */
import { judgeRepairCapital, type RepairCapitalJudgeInput } from "./repairCapitalJudge";

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

function expectType(actual: string, expected: string) {
  if (actual !== expected) {
    throw new Error(`expected type "${expected}", got "${actual}"`);
  }
}

function expectStep(result: ReturnType<typeof judgeRepairCapital>, expected: number) {
  if (!("step" in result)) {
    throw new Error(`step情報なし (type=${result.type})`);
  }
  if (result.step !== expected) {
    throw new Error(`expected step ${expected}, got ${result.step}`);
  }
}

const baseInput: RepairCapitalJudgeInput = {
  amount: 0,
  isPeriodic: false,
  isClearlyCapital: false,
  isClearlyRepair: false,
};

console.log("\n=== Step 1: 20万円未満（無条件で修繕費）===");

test("99,999円・性質質問なし → 修繕費（Step 1）", () => {
  const r = judgeRepairCapital({ ...baseInput, amount: 99_999 });
  expectType(r.type, "repair");
  expectStep(r, 1);
});

test("199,999円・性質質問なし → 修繕費（Step 1）", () => {
  const r = judgeRepairCapital({ ...baseInput, amount: 199_999 });
  expectType(r.type, "repair");
  expectStep(r, 1);
});

test("199,999円・明らかに資本的支出フラグONでも → 修繕費（Step 1優先）", () => {
  // Step 1は無条件なので、明らかに資本的支出でも修繕費にできる
  const r = judgeRepairCapital({
    ...baseInput,
    amount: 199_999,
    isClearlyCapital: true,
  });
  expectType(r.type, "repair");
  expectStep(r, 1);
});

test("1円（極小金額）→ 修繕費", () => {
  const r = judgeRepairCapital({ ...baseInput, amount: 1 });
  expectType(r.type, "repair");
  expectStep(r, 1);
});

console.log("\n=== Step 1境界: 20万円ちょうど ===");

test("200,000円ちょうど → Step 2以降へ進む（20万円未満ではない）", () => {
  const r = judgeRepairCapital({ ...baseInput, amount: 200_000 });
  // Step 2のisPeriodic=falseなのでStep 5以降へ
  // 性質判定がfalse、形式基準は60万円未満なのでStep 5でrepair
  expectType(r.type, "repair");
  expectStep(r, 5);
});

console.log("\n=== Step 2: 3年周期（無条件で修繕費）===");

test("300,000円・3年周期YES → 修繕費（Step 2）", () => {
  const r = judgeRepairCapital({
    ...baseInput,
    amount: 300_000,
    isPeriodic: true,
  });
  expectType(r.type, "repair");
  expectStep(r, 2);
});

test("1,000,000円・3年周期YES → 修繕費（Step 2 - 高額でも周期的なら無条件OK）", () => {
  const r = judgeRepairCapital({
    ...baseInput,
    amount: 1_000_000,
    isPeriodic: true,
  });
  expectType(r.type, "repair");
  expectStep(r, 2);
});

test("1,000,000円・3年周期YES・明らかに資本的支出 → 修繕費（Step 2が優先）", () => {
  // Step 2は無条件なので、明らかに資本的支出でも修繕費にできる
  const r = judgeRepairCapital({
    ...baseInput,
    amount: 1_000_000,
    isPeriodic: true,
    isClearlyCapital: true,
  });
  expectType(r.type, "repair");
  expectStep(r, 2);
});

console.log("\n=== Step 3: 明らかに資本的支出 ===");

test("500,000円・明らかに資本的支出 → 資本的支出（Step 3）", () => {
  const r = judgeRepairCapital({
    ...baseInput,
    amount: 500_000,
    isClearlyCapital: true,
  });
  expectType(r.type, "capital");
  expectStep(r, 3);
});

test("10,000,000円・明らかに資本的支出 → 資本的支出（高額）", () => {
  const r = judgeRepairCapital({
    ...baseInput,
    amount: 10_000_000,
    isClearlyCapital: true,
  });
  expectType(r.type, "capital");
  expectStep(r, 3);
});

test("500,000円・明らかに資本的支出YES・明らかに修繕費YES → 資本的支出が優先", () => {
  // Step 3が先に来るので、両方YESでもcapitalになる
  const r = judgeRepairCapital({
    ...baseInput,
    amount: 500_000,
    isClearlyCapital: true,
    isClearlyRepair: true,
  });
  expectType(r.type, "capital");
  expectStep(r, 3);
});

console.log("\n=== Step 4: 明らかに修繕費 ===");

test("500,000円・明らかに修繕費 → 修繕費（Step 4）", () => {
  const r = judgeRepairCapital({
    ...baseInput,
    amount: 500_000,
    isClearlyRepair: true,
  });
  expectType(r.type, "repair");
  expectStep(r, 4);
});

test("10,000,000円・明らかに修繕費 → 修繕費（高額でも例示該当ならOK）", () => {
  const r = judgeRepairCapital({
    ...baseInput,
    amount: 10_000_000,
    isClearlyRepair: true,
  });
  expectType(r.type, "repair");
  expectStep(r, 4);
});

console.log("\n=== Step 5: 形式基準（60万円・10%）===");

test("500,000円・性質判定なし → 修繕費（60万円未満・Step 5）", () => {
  // 60万円未満なので修繕費OK
  const r = judgeRepairCapital({
    ...baseInput,
    amount: 500_000,
  });
  expectType(r.type, "repair");
  expectStep(r, 5);
});

test("599,999円・性質判定なし → 修繕費（60万円未満・Step 5）", () => {
  const r = judgeRepairCapital({
    ...baseInput,
    amount: 599_999,
  });
  expectType(r.type, "repair");
  expectStep(r, 5);
});

test("600,000円ちょうど → 税理士相談（60万円未満ではない）", () => {
  const r = judgeRepairCapital({
    ...baseInput,
    amount: 600_000,
  });
  expectType(r.type, "consult");
});

test("700,000円・取得価額1000万 → 修繕費（10%以下・Step 5）", () => {
  // 取得価額の10% = 100万円。70万円 ≤ 100万円 なので修繕費OK
  const r = judgeRepairCapital({
    ...baseInput,
    amount: 700_000,
    assetBookValue: 10_000_000,
  });
  expectType(r.type, "repair");
  expectStep(r, 5);
});

test("1,000,000円・取得価額1000万 → 修繕費（10%ちょうど・Step 5）", () => {
  // 100万 ≤ 100万 なので修繕費OK
  const r = judgeRepairCapital({
    ...baseInput,
    amount: 1_000_000,
    assetBookValue: 10_000_000,
  });
  expectType(r.type, "repair");
  expectStep(r, 5);
});

test("1,000,001円・取得価額1000万 → 税理士相談（10%超過・60万円超）", () => {
  // 100万 < 1,000,001 なので10%基準NG、かつ60万円超
  const r = judgeRepairCapital({
    ...baseInput,
    amount: 1_000_001,
    assetBookValue: 10_000_000,
  });
  expectType(r.type, "consult");
});

console.log("\n=== Step 6: 税理士相談 ===");

test("700,000円・取得価額不明・性質判定なし → 税理士相談", () => {
  // 60万円超かつ取得価額不明 → consult
  const r = judgeRepairCapital({
    ...baseInput,
    amount: 700_000,
  });
  expectType(r.type, "consult");
});

test("5,000,000円・取得価額1000万・性質判定なし → 税理士相談", () => {
  // 500万 > 100万（10%超）、500万 > 60万 → consult
  const r = judgeRepairCapital({
    ...baseInput,
    amount: 5_000_000,
    assetBookValue: 10_000_000,
  });
  expectType(r.type, "consult");
});

console.log("\n=== 実例ベース ===");

test("中古車取得後の10万円カーナビ取付（明らかに資本的支出だが20万円未満）→ 修繕費", () => {
  // 100,000 < 200,000 → Step 1で修繕費（性質に関係なく）
  const r = judgeRepairCapital({
    ...baseInput,
    amount: 100_000,
    isClearlyCapital: true,
  });
  expectType(r.type, "repair");
  expectStep(r, 1);
});

test("中古アパート取得後のリフォーム100万円・性質判定なし → 修繕費（60万円超だが取得600万なら10%以下）", () => {
  // 100万 > 60万、しかし取得600万なら 100万 > 60万（10%）
  // → 60万も10%もダメ → consult
  const r = judgeRepairCapital({
    ...baseInput,
    amount: 1_000_000,
    assetBookValue: 6_000_000,
  });
  expectType(r.type, "consult");
});

test("中古マンション避難階段新設300万円 → 資本的支出（明らかに付加）", () => {
  const r = judgeRepairCapital({
    ...baseInput,
    amount: 3_000_000,
    isClearlyCapital: true,
  });
  expectType(r.type, "capital");
  expectStep(r, 3);
});

test("機械装置の移設費50万円 → 修繕費（明らかに修繕費の例示）", () => {
  const r = judgeRepairCapital({
    ...baseInput,
    amount: 500_000,
    isClearlyRepair: true,
  });
  expectType(r.type, "repair");
  expectStep(r, 4);
});

test("外壁塗装30万円・性質判定なし → 修繕費（Step 5: 60万円未満）", () => {
  const r = judgeRepairCapital({
    ...baseInput,
    amount: 300_000,
  });
  expectType(r.type, "repair");
  expectStep(r, 5);
});

console.log(`\n=== 結果: ${passed} passed, ${failed} failed ===`);
if (failed > 0) {
  process.exit(1);
}
