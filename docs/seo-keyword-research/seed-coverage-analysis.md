# メインシード「耐用年数」の系統別カバレッジ分析（補助シード判断ログ）

**実施日**: 2026-04-25
**実施者**: ユーザー + Claude（経費判定の手順に倣う）
**対象 CSV**: [`rakko-taiyounensu-utf8.csv`](./rakko-taiyounensu-utf8.csv)（5,000 件、UTF-8 変換済み）
**目的**: メインシード「耐用年数」だけで主要 BP3 系統を網羅できているかを定量測定し、未網羅の BP3 系統を補助シードに加える判断材料を残す。

## 背景

経費判定で「メインシード『経費』だけで補助シード不要」と感覚で決めかけた → 実データを Grep で数えると**交際費 8 件・福利厚生費 5 件のみ未網羅**と判明し、補助シード「交際費」「福利厚生費」を追加 → FAQ 18→23 問拡充、という前例（[experience-notes.md 2026-04-25](../../../../knowledge/seo-knowledge/philosophy/experience-notes.md)）。同じ手順を耐用年数にも適用する。

## 方法

[`features/rakko-keyword-workflow.md`](../../../../knowledge/seo-knowledge/features/rakko-keyword-workflow.md) Step R2 に基づき、ツール機能・対象資産・関連概念から想定系統を 23 個列挙。Grep で `rakko-taiyounensu-utf8.csv` 5,000 件中の含有件数をカウント。

## 結果

| 系統 | 含有件数 | BP | volume サンプル | 評価 | 補助シード候補 |
|------|:--:|:--:|:--:|------|---------|
| 減価償却 | 516 | 3 | 5,400 (難度46) | ✅ 網羅 | ❌ 不要 |
| 車 / 自動車 | 207 | 3 | 1,600+ | ✅ 網羅 | ❌ 不要 |
| 中古 | 145 | 3 | 2,400 (難度24) | ✅ 網羅 | ❌ 不要 |
| 鉄骨 | 110 | 3 | 4,400 (難度29) | ✅ 網羅 | ❌ 不要 |
| 建物 | 106 | 3 | 3,600 (難度33) | ✅ 網羅 | ❌ 不要 |
| ソフトウェア / 機械 / 工具 | 87 | 3 | 1,600 | ⚠️ やや少 | △ |
| 木造 | 74 | 3 | 4,400 (難度31) | ⚠️ やや少 | ❌ 不要 |
| エアコン | 64 | 3 | 5,400 (難度27) | ⚠️ やや少 | ❌ 不要 |
| マンション | 57 | 3 | 2,900 (難度30) | ⚠️ やや少 | ❌ 不要 |
| 内装 / 店舗 / 看板 | 56 | 3 | 中 | ⚠️ やや少 | △ |
| 擁壁 / アスファルト / 舗装 | 50 | 3 | 1,600 (難度25) | ⚠️ 少 | △（synonyms 拡張要） |
| 太陽光 | 45 | 3 | 1,300 (難度26) | ⚠️ 少 | △（synonyms 拡張要） |
| パソコン / PC | 36 | 3 | 3,600 (難度33) | ⚠️ 少 | ❌ 不要 |
| ヘルメット | 36 | 3 | 2,900 (難度27-34) | ⚠️ 少 | △（synonyms 拡張要） |
| 鉄筋コンクリート / RC造 | 36 | 3 | 3,600 (難度27) | ⚠️ 少 | ❌ 不要 |
| 冷蔵庫 | 26 | 3 | 2,400 (難度29) | ⚠️ 少 | ❌ 不要 |
| **資本的支出 / 修繕** | **24** | **3** | 中 | 🔴 **少（独自強み）** | **🔥 採用** |
| 給湯器 | 24 | 3 | 1,300 (難度27) | 🔴 少 | △ |
| 簡便法 / 定額法 / 定率法 | 17 | 3 | 中 | 🔴 未網羅（独自強み） | 候補 |
| 洗濯機 | 14 | 3 | 1,600 (難度35) | 🔴 未網羅 | ❌（既 FAQ） |
| 家具 / 事務机 | 6 | 3 | 中 | 🔴 未網羅 | ❌（既 FAQ） |
| **少額 / 30万 / 10万 / 一括償却 / 特例** | **3** | **3** | 高（30万円特例は知名度大）| 🔴 **完全未網羅（独自強み）** | **🔥 採用** |
| 個人事業主 / フリーランス | 2 | 2 | 大 | 🔴 未網羅 | △（BP2 / 経費判定の前例で採用見送り） |

経費判定の「交際費 8 件・福利厚生費 5 件」と同じ基準で見ると、🔴 完全未網羅扱いの BP3 系統は:
- 少額 / 30万 / 10万 / 一括償却 / 特例: **3 件のみ**
- 資本的支出 / 修繕: **24 件**
- 簡便法 / 定額法 / 定率法: **17 件**

## 3 フィルタによる絞り込み

[`philosophy/seed-keyword-selection.md`](../../../../knowledge/seo-knowledge/philosophy/seed-keyword-selection.md) の 3 フィルタ:
- F1: 既存 CSV と被らない（含有件数 < 30 が良い）
- F2: volume 100+ の見込み
- F3: ツール判定範囲と整合

| 候補シード | F1 | F2 | F3 | tool 実装 | 総合 |
|---------|:--:|:--:|:--:|---------|------|
| **少額減価償却資産** | ✅(3件) | ✅ | ✅ | [`treatmentDecision.ts`](../../src/logic/treatmentDecision.ts) 完全整合 | 🔥 最有力 |
| **資本的支出**（or「修繕費」）| ✅(24件) | ✅ | ✅ | [`repairCapitalJudge.ts`](../../src/logic/repairCapitalJudge.ts) 完全整合 | 🔥 強い候補 |
| 簡便法 | ✅(17件) | ✅ | ✅ | [`usedAssetLife.ts`](../../src/logic/usedAssetLife.ts) 完全整合 | 候補 |
| 太陽光発電設備 | ✅(45件) | ✅ | ❌（synonyms 未登録） | 拡張要 | 棄却（synonyms 拡張は別タスク） |
| 擁壁 | ✅(50件) | ✅ | ❌ | 拡張要 | 棄却 |
| ヘルメット | ✅(36件) | ✅(2,900) | ❌ | 拡張要 | 棄却 |
| 給湯器 | ✅(24件) | ✅ | ✅(synonyms 登録済) | △ | 候補だが ROI 中 |
| 個人事業主 | ✅(2件) | ✅ | ✅ | BP2 | priority 中（経費判定で BP2 は採用見送り） |

## 確定: 採用する補助シード

ユーザー判断（2026-04-25）: 経費判定の前例「補助シード 2 本パターン」に倣う。

🔥 **採用 1**: `少額減価償却資産`
- 既存 CSV 含有 3 件のみ（経費判定の福利厚生費 5 件より未網羅度高い）
- ツール `treatmentDecision.ts` の 10万・20万・30万特例ロジックと完全整合
- 「30万円特例」「10万円未満」「一括償却資産」「20万円未満」「青色申告 特例」等の sweet spot 取得が見込める

🔥 **採用 2**: `資本的支出`
- 既存 CSV 含有 24 件のみ（独自強み系統で🔴扱い）
- ツール `repairCapitalJudge.ts` の修繕費 vs 資本的支出 判定と完全整合
- 「修繕費 vs 資本的支出」「資本的支出 通達」「修繕費 認定」等の sweet spot 取得が見込める

「修繕費」シードでも同領域を取れるが、`資本的支出` の方が **税務・会計用語として独自性が高く、経費判定との領域オーバーラップが少ない**。「修繕費」を主軸にすると経費判定 CSV と被るリスクあり。

## 棄却した候補と理由

- **太陽光発電設備 / 擁壁 / ヘルメット**: F3 違反（[`synonyms.ts`](../../src/data/synonyms.ts) 未登録、ツールでキーワード検索しても該当資産にヒットしない）。これらを SEO で誘導すると Helpful Content 違反 + 離脱率上昇リスク。synonyms 拡張は別タスクとして切り出す。
- **簡便法 / 定額法 / 定率法**: 採用候補だが 17 件で完全未網羅ではない、かつ「資本的支出」と独自強み軸が重複。経費判定の前例「2 本パターン」に絞ると優先度低。
- **給湯器**: synonyms 登録済だが、シードで 5,000 件展開すると BP0（メーカー名・故障対応）が混ざる懸念。耐用年数語の単独 volume も中（1,300）。
- **個人事業主**: BP2。経費判定でも BP2 系統（フリーランス 39 件）は補助シード採用しなかった前例に倣う。

## 次の作業（Phase B）

ユーザーがラッコキーワードで以下 2 本のシードで CSV 取得 → 本フォルダに保存:
1. `少額減価償却資産`
2. `資本的支出`

ファイル名規則: `rakko-<seed>-utf8.csv`（[`rakko-keyword-workflow.md`](../../../../knowledge/seo-knowledge/features/rakko-keyword-workflow.md) Step R1 準拠）。

CSV 受領後の作業:
- BP 4 層振り分け（既存「耐用年数」CSV と重複しない sweet spot のみ抽出）
- title / meta / OGP / JSON-LD / Header subtitle に sweet spot 追加
- FAQ 拡充（独自論点ありの語のみ採用、過学習警戒）
- ASSET_CATEGORIES 補強
- 重複統合点検

## 関連

- [`rakko-taiyounensu-utf8.csv`](./rakko-taiyounensu-utf8.csv) - 本分析の対象 CSV
- [`README.md`](./README.md) - キーワード調査の進め方
- [`philosophy/seed-keyword-selection.md`](../../../../knowledge/seo-knowledge/philosophy/seed-keyword-selection.md) - 補助シード選定の判断軸
- [`features/rakko-keyword-workflow.md`](../../../../knowledge/seo-knowledge/features/rakko-keyword-workflow.md) - ラッコ実務手順
- [`philosophy/tool-centric-keyword-strategy.md`](../../../../knowledge/seo-knowledge/philosophy/tool-centric-keyword-strategy.md) - BP 4 層配置とツール起点フィルタ
- [`philosophy/experience-notes.md`](../../../../knowledge/seo-knowledge/philosophy/experience-notes.md) - 経費判定の補助シード追加結果
