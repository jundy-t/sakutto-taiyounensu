"""
e-Gov法令APIから「減価償却資産の耐用年数等に関する省令」のXMLを取得し、
別表第一〜第六をパースしてJSONファイルに変換するスクリプト。

データソース: https://elaws.e-gov.go.jp/api/1/lawdata/340M50000040015
利用許諾: 政府標準利用規約（第2.0版）に基づき二次利用自由
"""

import json
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

API_URL = "https://elaws.e-gov.go.jp/api/1/lawdata/340M50000040015"
OUTPUT_DIR = Path(__file__).parent.parent / "src" / "data"


def kanji_to_int(text: str) -> int | None:
    """漢数字をアラビア数字に変換する。"""
    text = text.strip().replace('\u3000', '').replace(' ', '')
    if not text:
        return None
    if text.isdigit():
        return int(text)
    zen = text.translate(str.maketrans('\uff10\uff11\uff12\uff13\uff14\uff15\uff16\uff17\uff18\uff19', '0123456789'))
    if zen.isdigit():
        return int(zen)

    kanji_map = {'\u3007': 0, '\u4e00': 1, '\u4e8c': 2, '\u4e09': 3, '\u56db': 4,
                 '\u4e94': 5, '\u516d': 6, '\u4e03': 7, '\u516b': 8, '\u4e5d': 9}
    result = 0
    current = 0
    for char in text:
        if char in kanji_map:
            current = current * 10 + kanji_map[char] if current > 0 else kanji_map[char]
        elif char == '\u5341':  # 十
            result += (current if current > 0 else 1) * 10
            current = 0
        elif char == '\u767e':  # 百
            result += (current if current > 0 else 1) * 100
            current = 0
        elif char == '\u5343':  # 千
            result += (current if current > 0 else 1) * 1000
            current = 0
        else:
            return None
    result += current
    return result if result > 0 else None


def get_column_text(column_element) -> str:
    """TableColumn要素からテキストを取得する。"""
    texts = []
    for sentence in column_element.iter('Sentence'):
        if sentence.text:
            texts.append(sentence.text.strip())
    result = ''.join(texts).strip()
    if result == '\u3000' or result == '':
        return ''
    return result


def parse_table_rows(table_element) -> list[list[str]]:
    """Table要素からTableRowをパースし、rowspanを展開した2次元配列を返す。"""
    rows = []
    carry_over: dict[int, list] = {}

    for table_row in table_element.findall('TableRow'):
        columns = table_row.findall('TableColumn')
        row_data = []
        source_idx = 0

        for logical_idx in range(20):
            if logical_idx in carry_over:
                entry = carry_over[logical_idx]
                row_data.append(entry[1])
                entry[0] -= 1
                if entry[0] <= 0:
                    del carry_over[logical_idx]
                continue

            if source_idx >= len(columns):
                break

            col_elem = columns[source_idx]
            text = get_column_text(col_elem)
            rowspan_attr = col_elem.get('rowspan')
            row_data.append(text)

            if rowspan_attr:
                span = int(rowspan_attr)
                if span > 1:
                    carry_over[logical_idx] = [span - 1, text]

            source_idx += 1

        if row_data:
            rows.append(row_data)

    return rows


def fill_empty_cells(entries: list[dict], fields: list[str]) -> None:
    """空欄のフィールドを前の行の値で補完する。"""
    last_values = {f: '' for f in fields}
    for entry in entries:
        for field in fields:
            val = entry.get(field, '')
            if val:
                last_values[field] = val
            else:
                entry[field] = last_values[field]


def parse_appendix_table_1(rows: list[list[str]]) -> list[dict]:
    """別表第一（有形固定資産）をパースする。
    列: 種類 / 構造又は用途 / 細目 / 耐用年数

    小見出し行（耐用年数なし）もエントリに含め、fill_empty_cellsでtype/structureを
    正しく伝搬させた後、耐用年数ありのエントリだけを返す。
    """
    entries = []

    for row in rows:
        if len(row) < 4:
            continue

        asset_type = row[0].strip()
        structure = row[1].strip()
        detail = row[2].strip()
        life_str = row[3].strip()

        # ヘッダー行のみスキップ
        if asset_type == '\u7a2e\u985e' or life_str == '\u8010\u7528\u5e74\u6570':
            continue
        if not asset_type and not structure and not detail and life_str == '\u5e74':
            continue

        useful_life = kanji_to_int(life_str) if life_str else None

        entries.append({
            "type": asset_type,
            "structure_or_usage": structure,
            "detail": detail,
            "useful_life": useful_life,
            "source": "\u5225\u8868\u7b2c\u4e00",
        })

    fill_empty_cells(entries, ["type", "structure_or_usage"])

    # detail_category: detailの小見出しを追跡する
    # 耐用年数なしの行でdetailに値がある場合、それは小見出し（例: 事務机、事務いす及びキャビネット）
    # structure_or_usageが変わったらリセット
    detail_category = ''
    last_structure = ''
    for entry in entries:
        # structure_or_usageが変わったらdetail_categoryをリセット
        if entry["structure_or_usage"] != last_structure:
            detail_category = ''
            last_structure = entry["structure_or_usage"]

        if entry["useful_life"] is None and entry["detail"]:
            detail_category = entry["detail"]
        elif entry["useful_life"] is not None:
            entry["detail_category"] = detail_category

    result = [e for e in entries if e["useful_life"] is not None]

    # detail_categoryが空文字の場合はフィールドを削除
    for e in result:
        if not e.get("detail_category"):
            e.pop("detail_category", None)

    # ===== 後処理パッチ: 普通乗用車（その他のもの 6年）の補正 =====
    #
    # 法令上、車両及び運搬具 ＞ 前掲のもの以外のもの ＞「自動車（二輪又は三輪自動車を除く。）」
    # 配下には「小型車（〇・六六リットル以下）4年」と「その他のもの 6年（普通乗用車）」の
    # 2つの細目があるが、e-Gov XML では「その他のもの 6年」の行が「貨物自動車」グループの
    # 後半（報道通信用5年の直後）に位置しており、しかも本来の位置（小型車の直後）の行は
    # 耐用年数が空欄になっている。
    #
    # この結果、現在のパース後処理では「その他のもの 6年」のdetail_categoryが
    # 「貨物自動車」になってしまい、根拠表示が誤る。
    #
    # 国税庁の確定申告コーナーやNo.5404を参照すると、この6年は普通乗用車であり、
    # 「自動車（二輪又は三輪自動車を除く。）」配下の「その他のもの」が法令上の正解。
    # よってここで detail_category を書き換える。
    #
    # 対象: type=車両及び運搬具 / structure=前掲のもの以外のもの /
    #       detail_category=貨物自動車 / detail=その他のもの / useful_life=6
    for e in result:
        if (
            e.get("type") == "\u8eca\u4e21\u53ca\u3073\u904b\u642c\u5177"
            and e.get("structure_or_usage") == "\u524d\u63b2\u306e\u3082\u306e\u4ee5\u5916\u306e\u3082\u306e"
            and e.get("detail_category") == "\u8ca8\u7269\u81ea\u52d5\u8eca"
            and e.get("detail") == "\u305d\u306e\u4ed6\u306e\u3082\u306e"
            and e.get("useful_life") == 6
        ):
            e["detail_category"] = "\u81ea\u52d5\u8eca\uff08\u4e8c\u8f2a\u53c8\u306f\u4e09\u8f2a\u81ea\u52d5\u8eca\u3092\u9664\u304f\u3002\uff09"

    return result


def parse_appendix_table_2(rows: list[list[str]]) -> list[dict]:
    """別表第二（機械装置）をパースする。"""
    entries = []

    for row in rows:
        if len(row) < 4:
            continue

        number_str = row[0].strip()
        equipment_type = row[1].strip()
        detail = row[2].strip()
        life_str = row[3].strip()

        if number_str == '\u756a\u53f7' or life_str == '\u8010\u7528\u5e74\u6570':
            continue
        if not number_str and not equipment_type and not detail and life_str == '\u5e74':
            continue

        useful_life = kanji_to_int(life_str) if life_str else None

        entries.append({
            "number": kanji_to_int(number_str) if number_str else None,
            "equipment_type": equipment_type,
            "detail": detail,
            "useful_life": useful_life,
            "source": "\u5225\u8868\u7b2c\u4e8c",
        })

    fill_empty_cells(entries, ["equipment_type"])
    last_num = None
    for entry in entries:
        if entry["number"] is not None:
            last_num = entry["number"]
        else:
            entry["number"] = last_num

    return [e for e in entries if e["useful_life"] is not None]


def parse_appendix_table_simple(rows: list[list[str]], source_name: str) -> list[dict]:
    """別表第三〜第六をパースする。"""
    entries = []

    for row in rows:
        if len(row) < 3:
            continue

        asset_type = row[0].strip()
        detail = row[1].strip() if len(row) > 2 else ""
        life_str = row[-1].strip()

        if life_str in ('\u8010\u7528\u5e74\u6570', '\u5e74', ''):
            continue
        if asset_type in ('\u7a2e\u985e', '\u5206\u985e'):
            continue

        useful_life = kanji_to_int(life_str)
        if useful_life is None:
            continue

        entries.append({
            "type": asset_type,
            "detail": detail,
            "useful_life": useful_life,
            "source": source_name,
        })

    fill_empty_cells(entries, ["type"])
    return entries


def main():
    print("e-Gov API fetching...")
    req = urllib.request.Request(API_URL)
    with urllib.request.urlopen(req) as response:
        xml_data = response.read()

    print(f"XML: {len(xml_data):,} bytes")

    root = ET.fromstring(xml_data)

    result_code = root.find('.//Result/Code')
    if result_code is not None and result_code.text != '0':
        print(f"API error: {result_code.text}")
        return

    all_data = {
        "meta": {
            "source": "\u6e1b\u4fa1\u511f\u5374\u8cc7\u7523\u306e\u8010\u7528\u5e74\u6570\u7b49\u306b\u95a2\u3059\u308b\u7701\u4ee4",
            "law_id": "340M50000040015",
            "api_url": API_URL,
            "license": "\u653f\u5e9c\u6a19\u6e96\u5229\u7528\u898f\u7d04\uff08\u7b2c2.0\u7248\uff09\u306b\u57fa\u3065\u304d\u4e8c\u6b21\u5229\u7528",
        },
        "tables": {}
    }

    table_num_map = {
        '\u5225\u8868\u7b2c\u4e00': 'table_1',
        '\u5225\u8868\u7b2c\u4e8c': 'table_2',
        '\u5225\u8868\u7b2c\u4e09': 'table_3',
        '\u5225\u8868\u7b2c\u56db': 'table_4',
        '\u5225\u8868\u7b2c\u4e94': 'table_5',
        '\u5225\u8868\u7b2c\u516d': 'table_6',
    }

    appendix_tables = root.findall('.//AppdxTable')
    print(f"Tables found: {len(appendix_tables)}")

    for appdx in appendix_tables:
        title_elem = appdx.find('AppdxTableTitle')
        related_elem = appdx.find('RelatedArticleNum')

        title = title_elem.text.strip() if title_elem is not None and title_elem.text else ""
        related = related_elem.text.strip() if related_elem is not None and related_elem.text else ""

        key = table_num_map.get(title)
        if key is None:
            print(f"  Skip: {title}")
            continue

        table = appdx.find('.//Table')
        if table is None:
            continue

        rows = parse_table_rows(table)
        print(f"  {title}: {len(rows)} rows")

        if title == '\u5225\u8868\u7b2c\u4e00':
            entries = parse_appendix_table_1(rows)
        elif title == '\u5225\u8868\u7b2c\u4e8c':
            entries = parse_appendix_table_2(rows)
        else:
            entries = parse_appendix_table_simple(rows, title)

        all_data["tables"][key] = {
            "title": title,
            "description": related.strip(),
            "entries": entries,
        }
        print(f"    -> {len(entries)} entries")

    # JSON output
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    output_path = OUTPUT_DIR / "useful_life_raw.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)

    print(f"\nOutput: {output_path}")

    # Summary
    print("\n=== Summary ===")
    for key, table_data in all_data["tables"].items():
        entries = table_data["entries"]
        print(f"{table_data['title']}: {len(entries)} entries")

        if key == "table_1":
            types = {}
            for e in entries:
                t = e.get("type", "?")
                types[t] = types.get(t, 0) + 1
            for t, count in types.items():
                print(f"  - {t}: {count}")

    # Spot check
    print("\n=== Spot Check ===")
    if "table_1" in all_data["tables"]:
        entries = all_data["tables"]["table_1"]["entries"]
        checks = [
            ("RC office (expect 50)", lambda e: '\u30b3\u30f3\u30af\u30ea\u30fc\u30c8' in e.get('structure_or_usage', '') and '\u4e8b\u52d9\u6240' in e.get('detail', '')),
            ("Wood house (expect 22)", lambda e: e.get('type') == '\u5efa\u7269' and '\u6728\u9020' in e.get('structure_or_usage', '') and '\u4f4f\u5b85' in e.get('detail', '')),
            ("PC (expect 4)", lambda e: '\u96fb\u5b50\u8a08\u7b97\u6a5f' in e.get('structure_or_usage', '') and '\u30d1\u30fc\u30bd\u30ca\u30eb' in e.get('detail', '')),
            ("Car general (expect 6)", lambda e: e.get('type') == '\u8eca\u4e21\u53ca\u3073\u904b\u642c\u5177' and e.get('detail', '') == '\u305d\u306e\u4ed6\u306e\u3082\u306e' and e.get('useful_life') == 6),
            ("Desk metal (expect 15)", lambda e: '\u4e8b\u52d9\u673a' in e.get('detail', '') and '\u91d1\u5c5e' in e.get('detail', '')),
            ("Desk metal2 (expect 15)", lambda e: '\u4e8b\u52d9\u673a' in str(e) and '\u91d1\u5c5e' in str(e)),
        ]
        for label, check_fn in checks:
            found = [e for e in entries if check_fn(e)]
            if found:
                e = found[0]
                print(f"  OK: {label} -> {e['useful_life']}y [{e['type']}/{e.get('structure_or_usage','')[:30]}/{e.get('detail','')[:30]}]")
            else:
                print(f"  NG: {label}")


if __name__ == "__main__":
    main()
