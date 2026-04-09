# サクッと耐用年数

個人事業主・中小企業向けの**減価償却 耐用年数 判定ツール**。
資産の種類を選ぶだけで耐用年数がわかる。中古資産の計算、修繕費 vs 資本的支出の判定にも対応。

> 🚧 **仕掛かり中**: フォルダ名に `_仕掛` サフィックスがついている。完成時にリネーム予定。

## 機能

- **耐用年数判定**: 国税庁の耐用年数表（e-Gov 法令API）に基づく
- **中古資産の耐用年数計算**: 簡便法による計算
- **修繕費 vs 資本的支出の判定**: ウィザード形式で誘導
- **税務処理の判定**: 個人事業主の青色申告対応

## 技術スタック

- React 19 + TypeScript 5.9
- Vite 8
- Tailwind CSS 4
- tsx（軽量テスト実行）

## 開発

```bash
npm install
npm run dev          # 開発サーバー
npm run build        # 本番ビルド
npm run lint         # ESLint
npm test             # 中古資産計算のテスト
npm run data:update  # 耐用年数データを e-Gov API から更新
```

## データ更新

耐用年数データの更新：
```bash
npm run data:update  # e-Gov API から再取得して同期
```
詳細は `.claude/skills/data-update/SKILL.md` を参照（Claude Code から自動起動）。

## 関連

- ワークスペース全体の説明: 親フォルダの [`../CLAUDE.md`](../CLAUDE.md)
- このプロジェクト固有のルール: [`CLAUDE.md`](CLAUDE.md)
- 共通テンプレート: [`../_template/`](../_template/)
