import { useCallback, useMemo, useState } from "react";
import { Header } from "./components/layout/Header";
import { Footer } from "./components/layout/Footer";
import { EntrySelector } from "./components/layout/EntrySelector";
import { SearchInput } from "./components/search/SearchInput";
import { PopularShortcuts } from "./components/search/PopularShortcuts";
import { CategorySelector } from "./components/search/CategorySelector";
import { StructureSelector } from "./components/search/StructureSelector";
import { DetailSelector } from "./components/search/DetailSelector";
import { ResultCard } from "./components/result/ResultCard";
import { AccountingMethodSelector } from "./components/treatment/AccountingMethodSelector";
import { AmountInput } from "./components/treatment/AmountInput";
import { BlueReturnQuestion } from "./components/treatment/BlueReturnQuestion";
import { TreatmentResult } from "./components/treatment/TreatmentResult";
import { UsedAssetCalculator } from "./components/used/UsedAssetCalculator";
import { Button } from "./components/shared/Button";
import type { UsefulLifeEntry } from "./data/usefulLifeTable";
import { useUserProfile } from "./logic/useUserProfile";
import { trackEntrySelect, trackSearchSelect } from "./lib/gtag";
import {
  decideTreatment,
  type TreatmentDecision,
  type UserProfile,
} from "./logic/treatmentDecision";

type Screen =
  | "entry" // トップ：入口A/Bの選択
  | "search_a" // 入口A：耐用年数だけを調べる
  | "browse" // 階層検索（カテゴリーから探す）
  | "result" // 耐用年数の結果表示
  | "used" // 中古資産計算（次フェーズで実装）
  | "b_method" // 入口B：経理方式選択
  | "b_amount" // 入口B：金額入力（金額が先）
  | "b_blue" // 入口B：青色申告/事業形態の追加質問（10〜30万のときだけ）
  | "b_result_small" // 入口B：10万円未満の即時経費（資産検索不要・終了）
  | "b_result_mid" // 入口B：10〜30万円の判定結果（選択肢提示）
  | "b_search_for_depreciation"; // 入口B：通常償却のため資産を検索する（30万円以上 or 通常償却を選んだとき）

export default function App() {
  const { profile, setAccountingMethod, setReturnType, setEntityType } =
    useUserProfile();
  const [screen, setScreen] = useState<Screen>("entry");

  // 検索系の状態
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [structure, setStructure] = useState<string | null>(null);
  const [detailCategory, setDetailCategory] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<UsefulLifeEntry | null>(null);

  // 入口Bの状態
  const [bAmount, setBAmount] = useState<number | null>(null);

  // 判定結果（メモ化）
  const decision: TreatmentDecision | null = useMemo(() => {
    if (bAmount === null || !profile.accountingMethod) return null;
    // 30万円特例の判定に必要なreturnType/entityTypeが未入力の場合、
    // 一旦白色・大法人としてプレースホルダ判定（10万円未満や30万円以上は影響しない）
    const userProfile: UserProfile = {
      accountingMethod: profile.accountingMethod,
      returnType: profile.returnType ?? "white",
      entityType: profile.entityType ?? "other",
    };
    return decideTreatment({ amount: bAmount, profile: userProfile });
  }, [bAmount, profile]);

  // 共通リセット
  const resetSearchState = useCallback(() => {
    setKeyword("");
    setCategory(null);
    setStructure(null);
    setDetailCategory(null);
    setSelectedEntry(null);
  }, []);

  const goHome = useCallback(() => {
    setScreen("entry");
    resetSearchState();
    setBAmount(null);
    window.scrollTo(0, 0);
  }, [resetSearchState]);

  // === 入口A: 耐用年数のみ ===
  const goEntryA = useCallback(() => {
    trackEntrySelect("A");
    setScreen("search_a");
    resetSearchState();
    window.scrollTo(0, 0);
  }, [resetSearchState]);

  // === 入口B: 経費か固定資産か判定（金額が先のフロー） ===
  const goEntryB = useCallback(() => {
    trackEntrySelect("B");
    if (!profile.accountingMethod) {
      setScreen("b_method");
    } else {
      setScreen("b_amount");
    }
    resetSearchState();
    setBAmount(null);
    window.scrollTo(0, 0);
  }, [profile.accountingMethod, resetSearchState]);

  // 入口Aの結果表示
  const handleSelectEntryA = useCallback((entry: UsefulLifeEntry) => {
    trackSearchSelect(entry.detail);
    setSelectedEntry(entry);
    setScreen("result");
    window.scrollTo(0, 0);
  }, []);

  // 階層検索画面（入口Aの中の補助）
  const goBrowse = useCallback(() => {
    setScreen("browse");
    setCategory(null);
    setStructure(null);
    setDetailCategory(null);
    window.scrollTo(0, 0);
  }, []);

  // 入口Bの金額入力後の遷移（金額の区分で分岐）
  const handleAmountSubmit = useCallback(
    (amount: number) => {
      setBAmount(amount);

      if (amount < 100_000) {
        // 10万円未満 → 即時経費で終了。資産検索は不要
        setScreen("b_result_small");
      } else if (amount >= 300_000) {
        // 30万円以上 → 通常償却必須 → 資産検索へ
        setScreen("b_search_for_depreciation");
      } else {
        // 10〜30万円 → 青色申告/事業形態を聞いてから判定結果
        const needsBlueReturnInfo =
          !profile.returnType || !profile.entityType;
        if (needsBlueReturnInfo) {
          setScreen("b_blue");
        } else {
          setScreen("b_result_mid");
        }
      }
      window.scrollTo(0, 0);
    },
    [profile.returnType, profile.entityType],
  );

  // 入口Bで資産選択 → 既存の耐用年数結果画面へ
  const handleSelectEntryForDepreciation = useCallback(
    (entry: UsefulLifeEntry) => {
      setSelectedEntry(entry);
      setScreen("result");
      window.scrollTo(0, 0);
    },
    [],
  );

  // === 既存の中古計算プレースホルダ ===
  const handleUsedClick = useCallback(() => {
    setScreen("used");
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <Header onHomeClick={goHome} />

      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8 space-y-6">
          {/* === トップ画面（入口選択） === */}
          {screen === "entry" && (
            <EntrySelector
              onSelectEntryA={goEntryA}
              onSelectEntryB={goEntryB}
            />
          )}

          {/* === 入口A: 耐用年数を調べたい === */}
          {screen === "search_a" && (
            <>
              <div className="text-center space-y-2 py-2">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                  この資産、何年で償却する？
                </h2>
                <p className="text-sm text-gray-600">
                  資産名を入力するだけで、国税庁の耐用年数表から候補が表示されます
                </p>
              </div>

              <SearchInput
                value={keyword}
                onChange={setKeyword}
                onSelect={handleSelectEntryA}
              />

              {!keyword.trim() && (
                <>
                  <PopularShortcuts onSelect={handleSelectEntryA} />
                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={goBrowse}
                      className="text-sm text-primary hover:underline"
                    >
                      カテゴリーから探す →
                    </button>
                  </div>
                </>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 space-y-1">
                <div className="font-bold">💡 知っておくと便利</div>
                <p>取得価額が10万円未満なら、固定資産ではなく全額経費にできます。</p>
                <p>
                  20万円・30万円の特例で即時経費にできる場合もあります。詳しくは
                  <button
                    type="button"
                    onClick={goEntryB}
                    className="underline font-bold mx-1"
                  >
                    こちら
                  </button>
                  から判定できます。
                </p>
              </div>

              <div className="pt-2">
                <Button variant="secondary" onClick={goHome} className="w-full">
                  ← トップに戻る
                </Button>
              </div>
            </>
          )}

          {/* === 階層検索（入口Aから） === */}
          {screen === "browse" && (
            <>
              <CategorySelector selected={category} onSelect={setCategory} />

              {category && (
                <StructureSelector
                  category={category}
                  selected={structure}
                  onSelect={setStructure}
                />
              )}

              {category && structure && (
                <DetailSelector
                  category={category}
                  structure={structure}
                  selectedDetailCategory={detailCategory}
                  onSelectDetailCategory={setDetailCategory}
                  onSelectEntry={handleSelectEntryA}
                />
              )}

              <div className="pt-4">
                <Button variant="secondary" onClick={goEntryA} className="w-full">
                  ← 入力で探す
                </Button>
              </div>
            </>
          )}

          {/* === 耐用年数の結果（入口A） === */}
          {screen === "result" && selectedEntry && (
            <ResultCard
              entry={selectedEntry}
              onBack={goEntryA}
              onUsedClick={handleUsedClick}
            />
          )}

          {/* === 中古資産計算（Phase 1: 経過年数のみ） === */}
          {screen === "used" && selectedEntry && (
            <UsedAssetCalculator
              entry={selectedEntry}
              initialAcquisitionCost={bAmount ?? undefined}
              onBack={() => {
                setScreen("result");
                window.scrollTo(0, 0);
              }}
            />
          )}

          {/* === 入口B: 経理方式選択（初回のみ） === */}
          {screen === "b_method" && (
            <>
              <AccountingMethodSelector
                current={profile.accountingMethod}
                onSelect={(method) => {
                  setAccountingMethod(method);
                  setScreen("b_amount");
                  window.scrollTo(0, 0);
                }}
              />
              <Button variant="secondary" onClick={goHome} className="w-full">
                ← トップに戻る
              </Button>
            </>
          )}

          {/* === 入口B: 金額入力（金額が先のフロー） === */}
          {screen === "b_amount" && profile.accountingMethod && (
            <>
              <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
                経理方式:{" "}
                {profile.accountingMethod === "tax_excluded"
                  ? "税抜経理"
                  : "税込経理"}
                <button
                  type="button"
                  onClick={() => setScreen("b_method")}
                  className="ml-2 text-primary hover:underline"
                >
                  変更
                </button>
              </div>

              <AmountInput
                accountingMethod={profile.accountingMethod}
                onSubmit={handleAmountSubmit}
                initialAmount={bAmount ?? undefined}
              />

              <Button variant="secondary" onClick={goHome} className="w-full">
                ← トップに戻る
              </Button>
            </>
          )}

          {/* === 入口B: 10万円未満（即時経費・終了） === */}
          {screen === "b_result_small" && bAmount !== null && (
            <section className="space-y-5">
              <div className="bg-white border-2 border-accent rounded-2xl p-6 shadow-sm">
                <div className="text-xs text-gray-500 mb-1">判定結果</div>
                <div className="text-2xl font-bold text-primary mt-1 mb-3">
                  {bAmount.toLocaleString()} 円
                </div>
                <div className="flex items-start gap-3 pt-3 border-t border-border">
                  <span className="text-3xl">✅</span>
                  <div>
                    <div className="font-bold text-gray-800 text-lg">
                      全額その年の経費にできます
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      取得価額が10万円未満なので、固定資産として計上する必要はありません。
                      消耗品費などで全額損金算入できます。
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      根拠: 法人税法施行令第133条 / 所得税法施行令第138条
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 space-y-1">
                <div className="font-bold">⚠ 例外</div>
                <p>
                  貸付け（主要な事業として行われるものを除く）の用に供する資産は、この特例の対象外です。
                </p>
              </div>

              <Button
                variant="secondary"
                onClick={() => setScreen("b_amount")}
                className="w-full"
              >
                ← 金額を入力し直す
              </Button>
              <Button variant="secondary" onClick={goHome} className="w-full">
                トップに戻る
              </Button>
            </section>
          )}

          {/* === 入口B: 青色申告/事業形態の追加質問（10〜30万のとき） === */}
          {screen === "b_blue" && (
            <>
              <BlueReturnQuestion
                currentReturnType={profile.returnType}
                currentEntityType={profile.entityType}
                onSelectReturnType={setReturnType}
                onSelectEntityType={setEntityType}
                onConfirm={() => {
                  setScreen("b_result_mid");
                  window.scrollTo(0, 0);
                }}
              />
              <Button
                variant="secondary"
                onClick={() => setScreen("b_amount")}
                className="w-full"
              >
                ← 金額入力に戻る
              </Button>
            </>
          )}

          {/* === 入口B: 10〜30万円の判定結果 === */}
          {screen === "b_result_mid" && decision && (
            <TreatmentResult
              decision={decision}
              assetLabel={`${bAmount?.toLocaleString() ?? ""}円の資産`}
              returnType={profile.returnType}
              entityType={profile.entityType}
              onChangeProfile={() => {
                setScreen("b_blue");
                window.scrollTo(0, 0);
              }}
              onShowDepreciation={() => {
                setScreen("b_search_for_depreciation");
                window.scrollTo(0, 0);
              }}
              onRestart={goHome}
            />
          )}

          {/* === 入口B: 通常償却を選択 → 資産検索 === */}
          {screen === "b_search_for_depreciation" && (
            <>
              <div className="text-center space-y-2 py-2">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                  何を買いましたか？
                </h2>
                <p className="text-sm text-gray-600">
                  耐用年数を調べるために、買ったものを選んでください
                </p>
              </div>

              <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
                {bAmount !== null && (
                  <>
                    金額: {bAmount.toLocaleString()}円 →{" "}
                    {bAmount >= 300_000 ? "通常の減価償却が必要" : "通常償却を選択"}
                  </>
                )}
              </div>

              <SearchInput
                value={keyword}
                onChange={setKeyword}
                onSelect={handleSelectEntryForDepreciation}
              />

              {!keyword.trim() && (
                <PopularShortcuts onSelect={handleSelectEntryForDepreciation} />
              )}

              <Button
                variant="secondary"
                onClick={() => {
                  if (bAmount !== null && bAmount >= 100_000 && bAmount < 300_000) {
                    setScreen("b_result_mid");
                  } else {
                    setScreen("b_amount");
                  }
                }}
                className="w-full"
              >
                ← 戻る
              </Button>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
