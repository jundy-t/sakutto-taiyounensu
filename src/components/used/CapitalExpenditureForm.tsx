import { useState } from "react";
import {
  calculateUsedAssetLife,
  type UsedAssetResult,
} from "../../logic/usedAssetLife";
import type { UsefulLifeEntry } from "../../data/usefulLifeTable";
import { Button } from "../shared/Button";
import { trackCapitalTimingSelect, trackCapitalCalcDone } from "../../lib/gtag";

interface Props {
  /** 対象の中古資産（法定耐用年数を取得） */
  entry: UsefulLifeEntry;
  /** 経過年数（年）— 既にPhase 1で入力済みの値 */
  elapsedYears: number;
  /** 経過年数（月） */
  elapsedMonths: number;
  /** ウィザードから引き継いだリフォーム費用 */
  initialCapitalExpenditure: number;
  /** 取得価額の初期値（入口B経由の場合に渡される） */
  initialAcquisitionCost?: number;
  /** Phase 1 で算出済みの本体の中古耐用年数（事業供用後ブランチで案内表示に使用） */
  bodyUsefulLife: number;
  /** 戻る */
  onBack: () => void;
}

/** 資本的支出を行ったタイミング */
type Timing = "before_use" | "after_use" | null;

/**
 * 資本的支出ありの中古資産計算フォーム
 *
 * 国税庁No.5404の3パターン（簡便法・特別算式・法定耐用年数）を
 * usedAssetLife.ts の calculateUsedAssetLife に委任して計算する。
 *
 * 計算ロジックは141件のテストで検証済み。
 */
export function CapitalExpenditureForm({
  entry,
  elapsedYears,
  elapsedMonths,
  initialCapitalExpenditure,
  initialAcquisitionCost,
  bodyUsefulLife,
  onBack,
}: Props) {
  const [timing, setTiming] = useState<Timing>(null);
  const [acquisitionStr, setAcquisitionStr] = useState(
    initialAcquisitionCost && initialAcquisitionCost > 0
      ? String(initialAcquisitionCost)
      : "",
  );
  const [capitalStr, setCapitalStr] = useState(
    initialCapitalExpenditure > 0 ? String(initialCapitalExpenditure) : "",
  );
  const [reacquisitionStr, setReacquisitionStr] = useState("");
  const [result, setResult] = useState<UsedAssetResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const acquisition = Number(acquisitionStr || "0");
  const capital = Number(capitalStr || "0");
  const reacquisition = reacquisitionStr ? Number(reacquisitionStr) : undefined;

  // 資本的支出が取得価額の50%超かどうか（再取得価額の入力が必要かの判定用）
  const exceedsAcquisition50 =
    acquisition > 0 && capital > acquisition * 0.5;

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (acquisition <= 0) {
      setError("取得価額を入力してください");
      return;
    }
    if (capital <= 0) {
      setError("資本的支出の金額を入力してください");
      return;
    }
    if (exceedsAcquisition50 && (!reacquisition || reacquisition <= 0)) {
      setError(
        "資本的支出が取得価額の50%を超えるため、再取得価額（同じ新品の価格）も入力してください",
      );
      return;
    }

    const r = calculateUsedAssetLife({
      statutoryLife: entry.usefulLife,
      elapsedYears,
      elapsedMonths,
      acquisitionCost: acquisition,
      capitalExpenditure: capital,
      reacquisitionCost: reacquisition,
    });
    setResult(r);
    trackCapitalCalcDone(r.method);
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
  };

  return (
    <section className="space-y-5">
      {/* 対象資産の確認 */}
      <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
        <div className="text-xs text-gray-500 mb-1">対象資産</div>
        <div className="text-base font-bold text-gray-800">{entry.detail}</div>
        <div className="text-xs text-gray-600 mt-1">
          法定耐用年数 {entry.usefulLife}年 / 経過 {elapsedYears}年{elapsedMonths > 0 && ` ${elapsedMonths}ヶ月`}
        </div>
      </div>

      {/* タイミング選択（最初に必ず聞く） */}
      {!result && (
        <div className="bg-white border border-border rounded-2xl p-5 shadow-sm space-y-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">
              この資本的支出はいつ行いましたか？
            </h2>
            <p className="text-xs text-gray-600 mt-1">
              タイミングによって税務上の取扱い・計算方法が大きく変わります
            </p>
          </div>
          <div className="space-y-2">
            <label
              className={`block border-2 rounded-xl p-3 cursor-pointer transition ${
                timing === "before_use"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="flex items-start gap-2">
                <input
                  type="radio"
                  name="timing"
                  checked={timing === "before_use"}
                  onChange={() => { setTiming("before_use"); trackCapitalTimingSelect("before_use"); }}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="text-sm font-bold text-gray-800">
                    取得時（事業供用前）
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5">
                    中古資産を取得してから事業に使い始めるまでの間に実施した
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    例：中古アパートを買って、リフォームしてから貸し出し開始
                  </p>
                </div>
              </div>
            </label>
            <label
              className={`block border-2 rounded-xl p-3 cursor-pointer transition ${
                timing === "after_use"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="flex items-start gap-2">
                <input
                  type="radio"
                  name="timing"
                  checked={timing === "after_use"}
                  onChange={() => { setTiming("after_use"); trackCapitalTimingSelect("after_use"); }}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="text-sm font-bold text-gray-800">
                    事業供用後
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5">
                    既に事業で使っていた中古資産にあとからリフォーム・改造した
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    例：賃貸中のアパートを3年後にリフォーム
                  </p>
                </div>
              </div>
            </label>
          </div>
        </div>
      )}

      {/*
        事業供用後ブランチ：計算スキップして案内
        ──────────────────────────────────────────────
        【ルール】事業供用後の資本的支出は、新たな固定資産の取得とみなされ、
        中古本体と同じ耐用年数で別資産として減価償却する。
        50%ルール（耐用年数省令第3条）は事業供用「前」の支出のみが対象であり、
        事業供用後の支出には適用されない。

        【根拠通達】
        - 耐用年数取扱通達 1-1-2（資本的支出は新たな資産取得とみなす）
        - 耐用年数取扱通達 1-5-2（事後改良の場合は簡便法を継続する）

        【調査済み出典・実例】
        - 税研オンライン 第224回（税務研究会）:
          「事業の用に供した後に事後的に改良等を行った場合には（50%ルールは）適用されません」
          https://www.zeiken.co.jp/news/21323491.php
        - 川崎公認会計士・税理士事務所:
          法定22年・築30年木造（全経過）にユニットバス設置 → 本体4年（22×0.2切捨）と同じ4年で別資産計上
          https://xn--ihq79i060b5de9s8a.jp/tyuukosisan-taiyounensuu/
        - INVEST ONLINE:
          法定22年・築25年木造（全経過）・取得600万・追加250万・再取得50%以下
          → 本体4年と同じ4年で別資産計上
          https://invest-online.jp/qanda/qanda-tax-399-26486/
        - みかげ税理士事務所:
          「本体取得時から事業供用時の間」と「稼働後の改修等」で取扱いが異なることを明示
          https://www.mikagecpa.com/archives/5262/
        - CSアカウンティング:
          建物の「増築」は資本的支出ではなく新たな建物取得 → 法定耐用年数を適用
          （リフォーム＝資本的支出と区別されることに注意）
          https://www.cs-acctg.com/column/kaikei_keiri/045704.html

        【テストを書かない理由】
        この分岐の処理は「本体の中古耐用年数（Phase 1で算出済み）をそのまま表示する」だけで、
        計算ロジックが存在しない（f(x) = x）。本体の耐用年数自体は usedAssetLife.test.ts の
        55ケースで検証済みのため、ここで重複したテストを追加する価値はない。
        代わりに本コメントが「なぜ計算しないことが正しいのか」の証跡となる。
      */}
      {!result && timing === "after_use" && (
        <div className="bg-white border-2 border-accent rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-start gap-3">
            <span className="text-3xl">✅</span>
            <div className="flex-1">
              <div className="text-base font-bold text-gray-800">
                別資産として計上してください
              </div>
              <p className="text-xs text-gray-600 mt-1">
                事業供用後の資本的支出は、新たな固定資産の取得とみなされます
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="text-xs text-gray-500">本体資産</div>
            <div className="text-sm font-bold text-gray-800">{entry.detail}</div>
            <div className="text-xs text-gray-500 mt-2">本体の中古耐用年数（Phase 1で算出済み）</div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-primary">{bodyUsefulLife}</span>
              <span className="text-base text-primary font-bold">年</span>
            </div>
            {initialCapitalExpenditure > 0 && (
              <>
                <div className="text-xs text-gray-500 mt-2">資本的支出の金額</div>
                <div className="text-base font-bold text-gray-800">
                  {initialCapitalExpenditure.toLocaleString()} 円
                </div>
              </>
            )}
            <div className="pt-2 mt-2 border-t border-gray-200 text-sm text-gray-800">
              → この資本的支出も <strong className="text-primary">同じ {bodyUsefulLife} 年</strong> で
              <strong>別資産として</strong>減価償却します
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-900 space-y-1.5">
            <div className="font-bold">📖 根拠</div>
            <ul className="list-disc list-inside space-y-1">
              <li>
                耐用年数取扱通達 1-1-2：資本的支出は新たな資産取得とみなす
              </li>
              <li>
                耐用年数省令第3条の50%判定は<strong>事業供用「前」</strong>の支出のみが対象。事業供用後の支出には50%ルールは適用されません
              </li>
            </ul>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 space-y-1.5">
            <div className="font-bold">⚠ ご注意</div>
            <ul className="list-disc list-inside space-y-1">
              <li>別資産として固定資産台帳に登録してください</li>
              <li>償却方法（定額法/定率法）は本体と揃えるのが原則です</li>
              <li>金額が大きい場合や判断に迷う場合は税理士にご相談ください</li>
            </ul>
          </div>
        </div>
      )}

      {!result && timing === "before_use" && (
        <form onSubmit={handleCalculate} className="space-y-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">
              資本的支出ありの計算
            </h2>
            <p className="text-sm text-gray-600">
              リフォーム・改造の費用と中古資産の取得価額を入力してください
            </p>
          </div>

          <div className="bg-white border border-border rounded-xl p-4 space-y-4">
            {/* 取得価額 */}
            <label className="block">
              <span className="text-sm font-medium text-gray-700">
                取得価額（中古で買った時の値段）
              </span>
              <div className="mt-1 flex items-end gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  value={acquisitionStr}
                  onChange={(e) =>
                    setAcquisitionStr(e.target.value.replace(/[^\d]/g, ""))
                  }
                  placeholder="例：10000000"
                  className="flex-1 rounded-lg border border-border bg-white px-3 py-2 text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <span className="text-base text-gray-600 pb-2">円</span>
              </div>
              {acquisition > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  {acquisition.toLocaleString()} 円
                </div>
              )}
            </label>

            {/* 資本的支出 */}
            <label className="block">
              <span className="text-sm font-medium text-gray-700">
                資本的支出の金額（リフォーム・改造費）
              </span>
              <div className="mt-1 flex items-end gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  value={capitalStr}
                  onChange={(e) =>
                    setCapitalStr(e.target.value.replace(/[^\d]/g, ""))
                  }
                  placeholder="例：5000000"
                  className="flex-1 rounded-lg border border-border bg-white px-3 py-2 text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <span className="text-base text-gray-600 pb-2">円</span>
              </div>
              {capital > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  {capital.toLocaleString()} 円
                </div>
              )}
            </label>

            {/* 再取得価額（条件付き表示） */}
            {exceedsAcquisition50 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-3">
                {/* 見出しとサブタイトル */}
                <div>
                  <div className="text-sm font-medium text-amber-900">
                    再取得価額（同じ新品を買うとおおよそいくら？）
                  </div>
                  <p className="text-xs text-amber-800 mt-1">
                    ※ 資本的支出が取得価額の50%を超えるケースは、大規模リフォーム等の特殊な場合です
                  </p>
                </div>

                {/* なぜ必要か */}
                <div className="bg-white/70 border border-amber-200 rounded p-2 text-xs text-amber-900 leading-relaxed">
                  <strong>💡 なぜ再取得価額が必要なのか</strong>
                  <p className="mt-1">
                    「資本的支出が大きいかどうか」の判定には、その資産を新品で買い直した場合の価格（再取得価額）と比べる必要があります。
                    これは耐用年数取扱通達1-5-6で定められた判定方法です。
                  </p>
                </div>

                {/* 入力欄 */}
                <label className="block">
                  <div className="flex items-end gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={reacquisitionStr}
                      onChange={(e) =>
                        setReacquisitionStr(e.target.value.replace(/[^\d]/g, ""))
                      }
                      placeholder="例：30000000"
                      className="flex-1 rounded-lg border border-amber-300 bg-white px-3 py-2 text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <span className="text-base text-amber-900 pb-2">円</span>
                  </div>
                  {reacquisition && reacquisition > 0 && (
                    <div className="text-xs text-amber-800 mt-1">
                      {reacquisition.toLocaleString()} 円
                    </div>
                  )}
                </label>

                {/* 調べ方ヘルプ（折りたたみ） */}
                <details className="text-xs text-amber-900">
                  <summary className="cursor-pointer hover:underline font-medium">
                    ▼ 再取得価額の調べ方
                  </summary>
                  <div className="mt-2 p-2 bg-white/70 rounded space-y-2 leading-relaxed">
                    <div>
                      <strong>建物の場合</strong>
                      <p>
                        同じ規模・構造の建物を新築するとおおよそいくらか<br />
                        → 不動産業者・建設業者に問い合わせ<br />
                        → 坪単価×面積で概算（一般的な目安：木造30〜50万円/坪、RC造60〜100万円/坪）
                      </p>
                    </div>
                    <div>
                      <strong>車両の場合</strong>
                      <p>
                        同じ車種の新車価格<br />
                        → メーカー公式サイト、ディーラーに確認
                      </p>
                    </div>
                    <div>
                      <strong>機械装置の場合</strong>
                      <p>
                        同型新品の見積価格<br />
                        → メーカーまたは商社に問い合わせ
                      </p>
                    </div>
                  </div>
                </details>

                {/* 税理士相談CTA */}
                <p className="text-xs text-amber-700">
                  ※ 再取得価額がわからない場合は、税理士へのご相談をおすすめします
                </p>
              </div>
            )}

            {/* 50%・10%の状況表示（参考） */}
            {acquisition > 0 && capital > 0 && (
              <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-700 space-y-1">
                <div>取得価額の50%: {(acquisition * 0.5).toLocaleString()} 円</div>
                <div>
                  資本的支出 / 取得価額 ={" "}
                  {((capital / acquisition) * 100).toFixed(1)}%
                  {capital > acquisition * 0.5 ? " （50%超）" : "（50%以下）"}
                </div>
                {reacquisition && reacquisition > 0 && (
                  <>
                    <div>
                      再取得価額の50%: {(reacquisition * 0.5).toLocaleString()} 円
                    </div>
                    <div>
                      資本的支出 / 再取得価額 ={" "}
                      {((capital / reacquisition) * 100).toFixed(1)}%
                      {capital > reacquisition * 0.5
                        ? " （50%超 → 法定耐用年数）"
                        : "（50%以下 → 特別算式）"}
                    </div>
                  </>
                )}
              </div>
            )}
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
      )}

      {result && (
        <>
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
                <div className="text-xs text-gray-500">
                  適用方式:{" "}
                  <strong className="text-gray-800">
                    {result.method === "kanbenho" && "簡便法（資本的支出は別途資産計上）"}
                    {result.method === "special" && "特別算式（耐用年数取扱通達1-5-6）"}
                    {result.method === "statutory" && "法定耐用年数（再取得価額の50%超）"}
                  </strong>
                </div>
                {"formula" in result && (
                  <div className="text-sm text-gray-800 font-mono bg-gray-50 rounded-lg p-2 break-all">
                    {result.formula}
                  </div>
                )}
                {"reason" in result && (
                  <div className="text-sm text-gray-700">{result.reason}</div>
                )}
                <div className="text-xs text-gray-500 pt-1">
                  根拠: 国税庁No.5404 / 耐用年数省令第3条 / 耐用年数取扱通達1-5-6
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

          {/* 重要な注意書き */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
            <div className="font-bold text-amber-900 text-sm">⚠ 重要なご注意</div>
            <ul className="text-xs text-amber-800 space-y-1.5 list-disc list-inside">
              <li>
                この計算は、その中古資産を <strong>事業の用に供した最初の事業年度（年分）でのみ</strong>
                適用できます。一度法定耐用年数で申告した場合、後から変更することはできません。
              </li>
              <li>
                資本的支出と修繕費の判定は通達の例示に基づく一般的な目安です。個別の事情により異なる場合があります。
              </li>
              <li>
                最終的な税務判断は税理士または所轄税務署にご確認ください。
              </li>
            </ul>
          </div>

          <Button variant="outline" onClick={handleReset} className="w-full">
            ← 入力し直す
          </Button>
        </>
      )}

      <Button variant="secondary" onClick={onBack} className="w-full">
        ← 判定ウィザードに戻る
      </Button>
    </section>
  );
}
