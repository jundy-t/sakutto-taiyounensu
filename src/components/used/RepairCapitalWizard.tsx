import { useState } from "react";
import {
  judgeRepairCapital,
  type RepairCapitalResult,
} from "../../logic/repairCapitalJudge";
import { Button } from "../shared/Button";
import { trackRepairCapitalJudge } from "../../lib/gtag";

interface Props {
  /** 「資本的支出」と判定されたとき → 計算フォームへ進む */
  onProceedToCapital: (info: { amount: number }) => void;
  /** ウィザードを閉じる */
  onCancel: () => void;
}

type WizardStep =
  | "amount" // ステップ1: 金額入力
  | "periodic" // ステップ2: 周期質問
  | "clearlyCapital" // ステップ3: 明らかに資本的支出か
  | "clearlyRepair" // ステップ4: 明らかに修繕費か
  | "bookValue" // ステップ5: 取得価額入力（10%判定用）
  | "result"; // 結果表示

/**
 * 修繕費 vs 資本的支出 判定ウィザード
 *
 * 国税庁の通達順序（7-8-3 → 7-8-1 → 7-8-2 → 7-8-4 → 7-8-5）に従って
 * ユーザーに段階的に質問し、最終判定を行う。
 */
export function RepairCapitalWizard({ onProceedToCapital, onCancel }: Props) {
  const [step, setStep] = useState<WizardStep>("amount");

  // 入力状態
  const [amountStr, setAmountStr] = useState("");
  const [bookValueStr, setBookValueStr] = useState("");
  const [result, setResultRaw] = useState<RepairCapitalResult | null>(null);

  // setResult を計装つきラッパに置き換え（GA4 イベント送信）
  const setResult = (r: RepairCapitalResult | null) => {
    setResultRaw(r);
    if (r) {
      trackRepairCapitalJudge({
        type: r.type,
        step: "step" in r ? r.step : "consult",
      });
    }
  };

  const amount = Number(amountStr || "0");

  // 金額入力後の遷移判定
  const handleAmountSubmit = () => {
    if (!amount || amount <= 0) return;
    if (amount < 200_000) {
      // Step 1で確定
      const r = judgeRepairCapital({
        amount,
        isPeriodic: false,
        isClearlyCapital: false,
        isClearlyRepair: false,
      });
      setResult(r);
      setStep("result");
    } else {
      setStep("periodic");
    }
  };

  // 周期質問の回答
  const handlePeriodicAnswer = (answer: boolean) => {
    if (answer) {
      // Step 2で確定
      const r = judgeRepairCapital({
        amount,
        isPeriodic: true,
        isClearlyCapital: false,
        isClearlyRepair: false,
      });
      setResult(r);
      setStep("result");
    } else {
      setStep("clearlyCapital");
    }
  };

  // 明らかに資本的支出か
  const handleClearlyCapitalAnswer = (answer: boolean) => {
    if (answer) {
      // Step 3で確定（資本的支出）
      const r = judgeRepairCapital({
        amount,
        isPeriodic: false,
        isClearlyCapital: true,
        isClearlyRepair: false,
      });
      setResult(r);
      setStep("result");
    } else {
      setStep("clearlyRepair");
    }
  };

  // 明らかに修繕費か
  const handleClearlyRepairAnswer = (answer: boolean) => {
    if (answer) {
      // Step 4で確定
      const r = judgeRepairCapital({
        amount,
        isPeriodic: false,
        isClearlyCapital: false,
        isClearlyRepair: true,
      });
      setResult(r);
      setStep("result");
    } else {
      // 取得価額の入力ステップへ
      setStep("bookValue");
    }
  };

  // 取得価額入力後の最終判定
  const handleBookValueSubmit = () => {
    const bookValue = bookValueStr ? Number(bookValueStr) : undefined;
    const r = judgeRepairCapital({
      amount,
      isPeriodic: false,
      isClearlyCapital: false,
      isClearlyRepair: false,
      assetBookValue: bookValue,
    });
    setResult(r);
    setStep("result");
  };

  const handleReset = () => {
    setStep("amount");
    setAmountStr("");
    setBookValueStr("");
    setResult(null);
  };

  return (
    <section className="space-y-5">
      <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
        <div className="text-xs text-gray-500 mb-1">修繕費 / 資本的支出 判定ウィザード</div>
        <h2 className="text-lg sm:text-xl font-bold text-gray-800">
          改良工事・改造の費用を判定します
        </h2>
        <p className="text-xs text-gray-600 mt-2">
          国税庁の通達（法人税基本通達7-8-1〜7-8-5 / 所得税基本通達37-12〜37-14）に基づく一般的な判定の目安を示します。
        </p>
      </div>

      {/* ステップ1: 金額入力 */}
      {step === "amount" && (
        <div className="bg-white border border-border rounded-xl p-4 space-y-3">
          <h3 className="text-base font-bold text-gray-800">
            ステップ1: 改良工事・改造の費用はいくらですか？
          </h3>
          <p className="text-xs text-gray-600">
            一の修理・改良等のために要した費用の合計額を入力してください
          </p>
          <div className="flex items-end gap-2">
            <input
              type="text"
              inputMode="numeric"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value.replace(/[^\d]/g, ""))}
              placeholder="例：300000"
              className="flex-1 rounded-lg border border-border bg-white px-3 py-2 text-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              autoFocus
            />
            <span className="text-base text-gray-600 pb-2">円</span>
          </div>
          {amount > 0 && (
            <div className="text-xs text-gray-500">{amount.toLocaleString()} 円</div>
          )}
          <Button
            variant="primary"
            onClick={handleAmountSubmit}
            disabled={amount <= 0}
            className="w-full"
          >
            次へ →
          </Button>
        </div>
      )}

      {/* ステップ2: 3年周期 */}
      {step === "periodic" && (
        <div className="bg-white border border-border rounded-xl p-4 space-y-3">
          <h3 className="text-base font-bold text-gray-800">
            ステップ2: 周期的な修理ですか？
          </h3>
          <p className="text-xs text-gray-600">
            過去にも同じような修理・改良を、おおむね3年以内の周期で行っていますか？
          </p>
          <div className="text-xs text-gray-500 bg-gray-50 rounded p-2">
            例：定期点検、定期交換、毎年の塗装など
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={() => handlePeriodicAnswer(true)}
              className="w-full"
            >
              はい
            </Button>
            <Button
              variant="outline"
              onClick={() => handlePeriodicAnswer(false)}
              className="w-full"
            >
              いいえ
            </Button>
          </div>
        </div>
      )}

      {/* ステップ3: 明らかに資本的支出か */}
      {step === "clearlyCapital" && (
        <div className="bg-white border border-border rounded-xl p-4 space-y-3">
          <h3 className="text-base font-bold text-gray-800">
            ステップ3: 明らかに資本的支出に該当しますか？
          </h3>
          <p className="text-xs text-gray-600">
            通達7-8-1の例示。以下のいずれかに該当しますか？
          </p>
          <ul className="text-xs text-gray-700 space-y-1 list-disc list-inside bg-gray-50 rounded p-2">
            <li>避難階段の新設など、物理的に新しい設備を付加した</li>
            <li>用途変更のための模様替え・改造・改装をした</li>
            <li>部品を通常より品質・性能の高いものに取り替えた</li>
          </ul>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={() => handleClearlyCapitalAnswer(true)}
              className="w-full"
            >
              該当する
            </Button>
            <Button
              variant="outline"
              onClick={() => handleClearlyCapitalAnswer(false)}
              className="w-full"
            >
              該当しない
            </Button>
          </div>
        </div>
      )}

      {/* ステップ4: 明らかに修繕費か */}
      {step === "clearlyRepair" && (
        <div className="bg-white border border-border rounded-xl p-4 space-y-3">
          <h3 className="text-base font-bold text-gray-800">
            ステップ4: 明らかに修繕費に該当しますか？
          </h3>
          <p className="text-xs text-gray-600">
            通達7-8-2の例示。以下のいずれかに該当しますか？
          </p>
          <ul className="text-xs text-gray-700 space-y-1 list-disc list-inside bg-gray-50 rounded p-2">
            <li>建物の移設・解体移築</li>
            <li>機械装置の移設</li>
            <li>地盤沈下した土地の地盛り</li>
            <li>砂利・砕石の敷設・補充</li>
            <li>雨漏り修理など現状回復のみ</li>
            <li>通常の維持・補修</li>
          </ul>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={() => handleClearlyRepairAnswer(true)}
              className="w-full"
            >
              該当する
            </Button>
            <Button
              variant="outline"
              onClick={() => handleClearlyRepairAnswer(false)}
              className="w-full"
            >
              該当しない
            </Button>
          </div>
        </div>
      )}

      {/* ステップ5: 取得価額入力（形式基準10%） */}
      {step === "bookValue" && (
        <div className="bg-white border border-border rounded-xl p-4 space-y-3">
          <h3 className="text-base font-bold text-gray-800">
            ステップ5: 修理対象の資産の取得価額を教えてください
          </h3>
          <p className="text-xs text-gray-600">
            通達7-8-4の形式基準（10%以下なら修繕費）の判定に使います。
            <br />
            （任意：わからない場合は空欄でも可。60万円未満かどうかだけで判定します）
          </p>
          <div className="flex items-end gap-2">
            <input
              type="text"
              inputMode="numeric"
              value={bookValueStr}
              onChange={(e) =>
                setBookValueStr(e.target.value.replace(/[^\d]/g, ""))
              }
              placeholder="例：10000000"
              className="flex-1 rounded-lg border border-border bg-white px-3 py-2 text-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <span className="text-base text-gray-600 pb-2">円</span>
          </div>
          {bookValueStr && Number(bookValueStr) > 0 && (
            <div className="text-xs text-gray-500">
              取得価額 {Number(bookValueStr).toLocaleString()} 円 の10% ={" "}
              {(Number(bookValueStr) * 0.1).toLocaleString()} 円
            </div>
          )}
          <Button
            variant="primary"
            onClick={handleBookValueSubmit}
            className="w-full"
          >
            判定する →
          </Button>
        </div>
      )}

      {/* 結果表示 */}
      {step === "result" && result && (
        <>
          {result.type === "repair" && (
            <div className="bg-white border-2 border-accent rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-3xl">✅</span>
                <div className="flex-1">
                  <div className="font-bold text-gray-800 text-lg">
                    修繕費として処理できます
                  </div>
                  <div className="text-2xl font-bold text-primary mt-1">
                    {amount.toLocaleString()} 円
                  </div>
                </div>
              </div>
              <div className="pt-3 border-t border-border space-y-2">
                <p className="text-sm text-gray-700">{result.reason}</p>
                <p className="text-xs text-gray-500">根拠: {result.basis}</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-900">
                💡 この場合、改良工事・改造の費用は<strong>全額その年の経費</strong>として処理できます。
                中古資産そのものの耐用年数は、前の画面で計算した<strong>簡便法の年数</strong>のままです。
              </div>
            </div>
          )}

          {result.type === "capital" && (
            <div className="bg-white border-2 border-amber-400 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-3xl">⚠</span>
                <div className="flex-1">
                  <div className="font-bold text-gray-800 text-lg">
                    資本的支出として処理が必要です
                  </div>
                  <div className="text-2xl font-bold text-amber-700 mt-1">
                    {amount.toLocaleString()} 円
                  </div>
                </div>
              </div>
              <div className="pt-3 border-t border-border space-y-2">
                <p className="text-sm text-gray-700">{result.reason}</p>
                <p className="text-xs text-gray-500">根拠: {result.basis}</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 space-y-1">
                <div>💡 次の画面で「<strong>いつ実施したか</strong>」をお選びください。タイミングによって扱いが変わります：</div>
                <ul className="list-disc list-inside ml-1 space-y-0.5">
                  <li><strong>取得時（事業供用前）</strong>：取得価額・再取得価額を入力 → 自動で耐用年数を再計算</li>
                  <li><strong>事業供用後</strong>：本体と同じ耐用年数で<strong>別資産として計上</strong>（再計算なし）</li>
                </ul>
              </div>
              <Button
                variant="primary"
                onClick={() => onProceedToCapital({ amount })}
                className="w-full"
              >
                計算フォームへ進む →
              </Button>
            </div>
          )}

          {result.type === "consult" && (
            <div className="bg-white border-2 border-gray-400 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-3xl">📋</span>
                <div className="flex-1">
                  <div className="font-bold text-gray-800 text-lg">
                    税理士へのご相談をおすすめします
                  </div>
                  <div className="text-xl font-bold text-gray-700 mt-1">
                    {amount.toLocaleString()} 円
                  </div>
                </div>
              </div>
              <div className="pt-3 border-t border-border space-y-2">
                <p className="text-sm text-gray-700">{result.reason}</p>
                <p className="text-xs text-gray-500">根拠: {result.basis}</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-700">
                💡 通達7-8-5の「30%/10%按分」基準は<strong>継続適用</strong>が条件のため、本ツールでは自動判定を行いません。
                判定が難しいケースなので、税理士または所轄税務署にご相談ください。
              </div>
            </div>
          )}

          {/* 共通の注意書き */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
            <div className="font-bold text-amber-900 text-sm">⚠ 重要なご注意</div>
            <ul className="text-xs text-amber-800 space-y-1 list-disc list-inside">
              <li>
                本ツールの判定は国税庁の通達（7-8-1〜7-8-5）に基づく一般的な目安です。
                個別の事情により異なる場合があります。
              </li>
              <li>
                「明らかに資本的支出」「明らかに修繕費」の判定は通達の例示に基づきますが、
                実際の事案では税務上の解釈が分かれることがあります。
              </li>
              <li>
                最終的な税務判断は税理士または所轄税務署にご確認ください。
              </li>
            </ul>
          </div>

          <Button variant="outline" onClick={handleReset} className="w-full">
            ← もう一度判定する
          </Button>
        </>
      )}

      <Button variant="secondary" onClick={onCancel} className="w-full">
        ← 中古計算結果に戻る
      </Button>
    </section>
  );
}
