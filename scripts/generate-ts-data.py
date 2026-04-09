"""
useful_life_raw.json を TypeScript モジュールに変換するスクリプト。
src/data/usefulLifeTable.ts を生成する。
"""
import json
from pathlib import Path

ROOT = Path(__file__).parent.parent
RAW_JSON = ROOT / "src" / "data" / "useful_life_raw.json"
OUTPUT_TS = ROOT / "src" / "data" / "usefulLifeTable.ts"


def escape_ts_string(s: str | None) -> str:
    if s is None:
        return "null"
    s = s.replace("\\", "\\\\").replace('"', '\\"')
    return f'"{s}"'


def main():
    with open(RAW_JSON, encoding="utf-8") as f:
        data = json.load(f)

    lines = [
        "/**",
        " * 耐用年数表データ（自動生成）",
        " * ",
        " * 出典: 国税庁「減価償却資産の耐用年数等に関する省令」(法令ID: 340M50000040015)",
        " * ライセンス: 政府標準利用規約（第2.0版）",
        " * ",
        " * このファイルは scripts/parse-xml.py + scripts/generate-ts-data.py で",
        " * e-Gov法令APIから自動生成されています。手動編集しないでください。",
        " */",
        "",
        "export interface UsefulLifeEntry {",
        "  /** 大分類（例: 建物、車両及び運搬具、器具及び備品） */",
        "  type: string;",
        "  /** 構造または用途（例: 鉄筋コンクリート造、家具・電気機器） */",
        "  structureOrUsage: string;",
        "  /** 細目（例: 事務所用、パーソナルコンピュータ） */",
        "  detail: string;",
        "  /** 細目の中分類（例: 事務机、電子計算機）。あれば設定 */",
        "  detailCategory?: string;",
        "  /** 法定耐用年数（年） */",
        "  usefulLife: number;",
        "  /** 出典（別表番号） */",
        "  source: string;",
        "}",
        "",
        "export interface UsefulLifeMeta {",
        "  source: string;",
        "  lawId: string;",
        "  apiUrl: string;",
        "  license: string;",
        "}",
        "",
        f"export const META: UsefulLifeMeta = {{",
        f"  source: {escape_ts_string(data['meta']['source'])},",
        f"  lawId: {escape_ts_string(data['meta']['law_id'])},",
        f"  apiUrl: {escape_ts_string(data['meta']['api_url'])},",
        f"  license: {escape_ts_string(data['meta']['license'])},",
        f"}};",
        "",
    ]

    # 別表第一（メイン）
    table_1_entries = data["tables"]["table_1"]["entries"]
    lines.append("/** 別表第一: 機械及び装置以外の有形減価償却資産の耐用年数表 */")
    lines.append("export const TABLE_1: UsefulLifeEntry[] = [")
    for e in table_1_entries:
        parts = [
            f"type: {escape_ts_string(e['type'])}",
            f"structureOrUsage: {escape_ts_string(e['structure_or_usage'])}",
            f"detail: {escape_ts_string(e['detail'])}",
        ]
        if e.get("detail_category"):
            parts.append(f"detailCategory: {escape_ts_string(e['detail_category'])}")
        parts.append(f"usefulLife: {e['useful_life']}")
        parts.append(f"source: {escape_ts_string(e['source'])}")
        lines.append("  { " + ", ".join(parts) + " },")
    lines.append("];")
    lines.append("")

    # 別表第三（無形固定資産）— ソフトウェア等
    if "table_3" in data["tables"]:
        table_3_entries = data["tables"]["table_3"]["entries"]
        lines.append("/** 別表第三: 無形減価償却資産の耐用年数表 */")
        lines.append("export const TABLE_3: UsefulLifeEntry[] = [")
        for e in table_3_entries:
            parts = [
                f'type: {escape_ts_string(e["type"])}',
                f'structureOrUsage: ""',
                f'detail: {escape_ts_string(e.get("detail", ""))}',
                f"usefulLife: {e['useful_life']}",
                f'source: {escape_ts_string(e["source"])}',
            ]
            lines.append("  { " + ", ".join(parts) + " },")
        lines.append("];")
        lines.append("")

    # 全テーブル統合（検索用）
    lines.append("/** 全エントリ統合（検索用） */")
    lines.append("export const ALL_ENTRIES: UsefulLifeEntry[] = [...TABLE_1, ...TABLE_3];")
    lines.append("")

    # 大分類リスト（別表第一）
    types_set = []
    seen = set()
    for e in table_1_entries:
        t = e["type"]
        if t and t not in seen:
            seen.add(t)
            types_set.append(t)

    lines.append("/** 別表第一の大分類一覧（出現順） */")
    lines.append("export const TABLE_1_CATEGORIES: readonly string[] = [")
    for t in types_set:
        lines.append(f"  {escape_ts_string(t)},")
    lines.append("] as const;")

    OUTPUT_TS.write_text("\n".join(lines) + "\n", encoding="utf-8")

    # サマリー
    print(f"Generated: {OUTPUT_TS}")
    print(f"  TABLE_1 entries: {len(table_1_entries)}")
    if "table_3" in data["tables"]:
        print(f"  TABLE_3 entries: {len(data['tables']['table_3']['entries'])}")
    print(f"  Categories in TABLE_1: {len(types_set)}")
    for t in types_set:
        count = sum(1 for e in table_1_entries if e["type"] == t)
        print(f"    - {t}: {count}")


if __name__ == "__main__":
    main()
