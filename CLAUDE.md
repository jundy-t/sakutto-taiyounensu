# サクッと耐用年数

個人事業主・中小企業向けの**減価償却 耐用年数 判定ツール**。
資産の種類を選ぶだけで耐用年数がわかる。中古資産の計算、修繕費 vs 資本的支出の判定、取得時/事業供用後のタイミング分岐にも対応。
React 19 + TypeScript + Vite + Tailwind 4 + ConoHa WING（FTPS デプロイ）。

公開URL: https://sakutto-taiyounensu.haraochi.jp/

> ワークスペース全体の構成は親フォルダの [`../CLAUDE.md`](../CLAUDE.md) を参照。

## 絶対に守るルール

### 1. 耐用年数データの取得元は e-Gov 法令 API
- 正本: `_shared/data/sources/useful-life/`（共通データソース機構）
- ビルドスクリプト: `_shared/data/sources/useful-life/build.mjs`（e-Gov API → XML → TS 自動生成）
- `src/data/usefulLifeTable.ts` は `src/data/sources/useful-life/data.ts` への re-export ラッパー
- `predev`/`prebuild` で `sync-shared-sources.mjs` が自動コピー
- **手動編集は避ける**。
- **日常更新の実行**: `npm run data:update`（= `build.mjs --force` + sync）
- **手順とハマりポイント**: Skill `data-update` を起動して参照（年 1 回程度の更新作業向けの詳細手順書）

### 2. テストは tsx で直接実行
vitest ではなく軽量に tsx で動かす設計：
```bash
npm test  # 5 本のテストを順次実行
```
対象: usedAssetLife / searchUsefulLife / repairCapitalJudge / treatmentDecision / externalAudit。
1 本でも失敗したら以降は走らない（`&&` チェイン）。
将来 vitest に移行する選択肢もあり（仕掛かり中なので未決定）。

### 3. 共通データソース機構を使用
他の3ツールと同様に `_shared/data/sources/useful-life/` を正本として使用。
`data-sources.json` → `sync-shared-sources.mjs` → `src/data/sources/useful-life/data.ts` の流れ。
ただし他ソースと異なり `buildScript`（`build.mjs`）で e-Gov API から自動生成する仕組み。
キャッシュ（`_cache/useful_life_raw.json`）がある場合は API を叩かずに TS 生成のみ実行。

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
npm run data:update  # e-Gov API から最新データを再取得して同期
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
