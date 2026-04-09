---
name: data-update
description: サクッと耐用年数の耐用年数データ更新スキル。e-Gov法令APIからXMLを取得してTSを自動生成する作業の手順とハマりポイント。データ更新、耐用年数表の更新、法令データ取得、build.mjsの実行に関する作業で使うこと。
---

# 耐用年数データ更新スキル

このスキルはe-Gov法令APIから耐用年数表のXMLデータを取得・パースする作業の手順書。年1回程度の更新作業で使う。

## 実行手順

### Step 1: ビルドスクリプトを実行

プロジェクトルートで実行：

```bash
npm run data:update
```

内部で `node ../_shared/data/sources/useful-life/build.mjs --force` + `sync-shared-sources.mjs` が実行される。

出力先:
- キャッシュ: `_shared/data/sources/useful-life/_cache/useful_life_raw.json`
- 生XML: `_shared/data/sources/useful-life/_raw/api-response.xml`
- 生成TS: `_shared/data/sources/useful-life/data.ts` → sync → `src/data/sources/useful-life/data.ts`

### Step 2: スポットチェック

以下の10資産が正しい耐用年数で出力されているか確認する。1つでもズレていたらパーサーのバグを疑う。

| 資産 | 期待値 | 別表 |
|------|--------|------|
| RC造事務所 | 50年 | 第一・建物 |
| 木造住宅 | 22年 | 第一・建物 |
| 鉄骨造(4mm超)事務所 | 38年 | 第一・建物 |
| PC（サーバー以外） | 4年 | 第一・器具及び備品 |
| サーバー | 5年 | 第一・器具及び備品 |
| 普通自動車 | 6年 | 第一・車両及び運搬具 |
| 軽自動車 | 4年 | 第一・車両及び運搬具 |
| 事務机（金属製） | 15年 | 第一・器具及び備品 |
| エアコン（壁掛け） | 6年 | 第一・器具及び備品 |
| ソフトウエア（自社利用） | 5年 | 第三・無形固定資産 |

### Step 3: 大分類の件数チェック

別表第一の件数が大きく変わっていないことを確認する（2026年4月時点の基準値）。

| 大分類 | 基準件数 |
|--------|---------|
| 建物 | 75 |
| 建物附属設備 | 16 |
| 構築物 | 143 |
| 船舶 | 26 |
| 航空機 | 6 |
| 車両及び運搬具 | 37 |
| 工具 | 15 |
| 器具及び備品 | 93 |
| **合計** | **411** |

件数が±10%以上変わった場合はXML構造変更かパーサーバグ。

### Step 4: テスト実行

```bash
npm test
```

全テストがパスすることを確認。

### Step 5: source.json の lastChecked を更新

`_shared/data/sources/useful-life/source.json` の `lastChecked` を今日の日付に更新する。

---

## データソース

- **API**: `https://elaws.e-gov.go.jp/api/1/lawdata/340M50000040015`
- リダイレクト先: `https://laws.e-gov.go.jp/api/1/lawdata/340M50000040015`（どちらでも可）
- **形式**: XML（約25,000行、1.7MB）
- **利用許諾**: 政府標準利用規約（第2.0版）。二次利用自由、出典表示のみ必要

---

## アーキテクチャ

データは共通データソース機構（`_shared/data/sources/useful-life/`）で管理。

```
_shared/data/sources/useful-life/
├── source.json          ← メタデータ（buildScript: "build.mjs" を指定）
├── build.mjs            ← e-Gov API → XMLパース → TS生成（Node.js、依存ゼロ）
├── _cache/
│   └── useful_life_raw.json   ← パース結果のJSONキャッシュ（git管理）
├── _raw/
│   └── api-response.xml       ← 生XMLダンプ
└── data.ts              ← 生成物（build.mjs が出力）

サクッと耐用年数/
├── data-sources.json            ← sources: ["useful-life"]
└── src/data/
    ├── usefulLifeTable.ts       ← re-export ラッパー
    └── sources/useful-life/     ← sync-shared-sources.mjs がコピー（.gitignore対象）
        ├── source.json
        └── data.ts
```

`predev`/`prebuild` フックで `sync-shared-sources.mjs` が自動実行され、`build.mjs`（キャッシュがあればTS生成のみ）→ ファイルコピーの順で処理される。

---

## ハマりポイント（重要度順）

### 1. 空欄補完とフィルタリングの順序が最重要

「器具及び備品」「船舶」「航空機」などの大分類は、rowspanではなく空白セル（全角スペース）で表現されている。小見出し行（耐用年数なし）もエントリに含めて空欄補完した後で、耐用年数ありだけをフィルタリングする必要がある。

順序を間違えると（先にフィルタ→後で補完）、これらの大分類が丸ごと消える。

確認方法: 大分類に「器具及び備品」「船舶」「航空機」が含まれていること。

### 2. rowspanの展開

「種類」「構造又は用途」列はrowspan属性で複数行にまたがる。2行目以降のXMLにはそのカラム自体が存在しないので、carryOverオブジェクトで値を引き継ぐ。

確認方法: 別表第一の合計件数が400件前後あること。100件台ならrowspan展開が壊れている。

### 3. 3階層ネスト（detail_category）

別表第一には「種類 > 構造又は用途 > 小見出し > 細目」の3階層がある。小見出し行は耐用年数が空の行として出現する。detailCategoryフィールドとして保持し、structureOrUsageが変わったらリセットする。

例: `器具及び備品 > 家具... > 事務机、事務いす及びキャビネット（小見出し） > 主として金属製のもの → 15年`

### 4. 耐用年数が漢数字

「五〇」「四七」「一五」等。kanjiToInt()で変換する。「一五」形式（位取りなし）が使われている。

### 5. 表記の罠

- 法令上は「ソフトウ**エ**ア」（大きいエ）。「ソフトウェア」では見つからない
- 別表ごとに列構成が異なる（第一は4列、第三〜六は3列）
- 別表第五（公害防止用）は構造が特殊で現在0件（放置可）

### 6. 普通乗用車「その他のもの 6年」の特別補正（要保持）

e-Gov XML では「車両及び運搬具 ＞ 前掲のもの以外のもの ＞ 自動車（二輪又は三輪自動車を除く。）」配下の「その他のもの 6年」（普通乗用車）の行が、**「貨物自動車」グループの後半に位置している**。さらに本来の位置（小型車の直後）の行は耐用年数セルが空欄。

そのままパースすると detail_category が「貨物自動車」になってしまい、結果画面の根拠表示が「貨物自動車として6年」と誤表示される。

`build.mjs` の `parseAppendixTable1` 関数末尾に**後処理パッチ**を入れて、以下の条件のエントリの detailCategory を「自動車（二輪又は三輪自動車を除く。）」に書き換えている：

- type=車両及び運搬具
- structure_or_usage=前掲のもの以外のもの
- detail_category=貨物自動車
- detail=その他のもの
- useful_life=6

データ更新時にこのパッチが残っているか必ず確認すること。削除するとシノニム検索の「普通自動車」テストが失敗する。

---

## 別表の構成

| 別表 | 列構成 | パース関数 |
|------|--------|-----------|
| 第一 | 種類/構造又は用途/細目/耐用年数 | parseAppendixTable1 |
| 第二 | 番号/設備の種類/細目/耐用年数 | parseAppendixTable2 |
| 第三〜六 | 種類/細目/耐用年数 | parseAppendixTableSimple |
| 第七〜十一 | 償却率表（スキップ） | — |

---

## トラブルシューティング

| 症状 | 原因の可能性 |
|------|------------|
| エントリ数が大幅に減った | XML構造変更。parseTableRowsのrowspan処理を確認 |
| 特定の大分類が消えた | 空欄補完の順序ミス。フィルタリング前に補完しているか確認 |
| 耐用年数がnullだらけ | 漢数字変換の失敗。新しい表記パターンが追加された可能性 |
| APIがエラー | e-GovのAPI仕様変更。URLやレスポンス形式を確認 |
| syncが失敗 | `data-sources.json` のキー名と `_shared/data/sources/` のディレクトリ名が一致しているか確認 |
