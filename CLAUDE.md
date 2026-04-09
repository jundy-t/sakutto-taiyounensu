# サクッと耐用年数

個人事業主・中小企業向けの**減価償却 耐用年数 判定ツール**。
資産の種類を選ぶだけで耐用年数がわかる。中古資産の計算、修繕費 vs 資本的支出の判定、取得時/事業供用後のタイミング分岐にも対応。
React 19 + TypeScript + Vite + Tailwind 4 + ConoHa WING（FTPS デプロイ）。

公開URL: https://sakutto-taiyounensu.haraochi.jp/

> ワークスペース全体の構成は親フォルダの [`../CLAUDE.md`](../CLAUDE.md) を参照。

## 絶対に守るルール

### 1. 耐用年数データの取得元は e-Gov 法令 API
- 正本: e-Gov 法令API（減価償却資産の耐用年数等に関する省令）
- 取り込み: `scripts/parse-xml.py` で XML を取得・パース
- 出力: `src/data/usefulLifeTable.ts`（生成物だが現状は git 管理対象）
- **手動編集は避ける**。
- **日常更新の実行**: npm script `data:update`（= `npm run data:update`）
- **手順とハマりポイント**: Skill `data-update` を起動して参照（年 1 回程度の更新作業向けの詳細手順書）

### 2. テストは tsx で直接実行
vitest ではなく軽量に tsx で動かす設計：
```bash
npm test  # 5 本のテストを順次実行
```
対象: usedAssetLife / searchUsefulLife / repairCapitalJudge / treatmentDecision / externalAudit。
1 本でも失敗したら以降は走らない（`&&` チェイン）。
将来 vitest に移行する選択肢もあり（仕掛かり中なので未決定）。

### 3. 共通データソース機構を**使っていない**
他の3ツール（届出/経費判定/法人化シミュ）が使う `_shared/data/sources/` 経由ではなく、
プロジェクト内に `src/data/usefulLifeTable.ts` を直接持つ設計。
理由: e-Gov API は法令番号で直接取れるので `_shared` を経由する必要性が薄い。
将来的に `_shared` 化する選択肢もあり。

## 主要機能

- **耐用年数判定** (`src/logic/searchUsefulLife.ts`)
- **中古資産の耐用年数計算** (`src/logic/usedAssetLife.ts`)
- **修繕費 vs 資本的支出の判定** (`src/logic/repairCapitalJudge.ts`)
- **税務処理の判定** (`src/logic/treatmentDecision.ts`)
- **シノニム監査** (`src/logic/auditSynonyms.ts` / `externalAudit.test.ts`)

## 開発コマンド

```bash
npm run dev          # 開発サーバー
npm run build        # 本番ビルド
npm test             # tsx で usedAssetLife.test.ts を実行
npm run data:update  # e-Gov API から最新データを取得
npm run deploy       # ConoHa WING へ FTPS デプロイ
```

## デプロイ

ConoHa WING に **FTPS で自動デプロイ**:
```bash
npm run deploy
```
内部で `npm run build && node --env-file=.env scripts/deploy.mjs` を実行。
`.env` に `FTP_HOST` / `FTP_USER` / `FTP_PASSWORD` / `FTP_REMOTE_DIR` が必要（[.env.example](.env.example) 参照）。

> **⚠ `.env` には FTP パスワードが入っている**。絶対に git にコミットしない・Read もしない。
> `.gitignore` で除外済み。
