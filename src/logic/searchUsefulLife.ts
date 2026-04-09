/**
 * 耐用年数表の検索ロジック
 *
 * 検索戦略:
 * 1. シノニム辞書による完全一致 → 高優先度（現代語 → 法令上の細目）
 * 2. シノニム辞書のキーワードに対する部分一致 → 中優先度
 * 3. 法令上の細目テキストへの部分一致 → 低優先度（フォールバック）
 *
 * 重複は除外し、優先度の高い順に最大50件返す。
 */

import { TABLE_1, ALL_ENTRIES, type UsefulLifeEntry } from '../data/usefulLifeTable';
import { SYNONYMS, type SynonymEntry } from '../data/synonyms';

// ========== 階層検索（カテゴリーから探す画面用） ==========

export function getStructuresInCategory(category: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const e of TABLE_1) {
    if (e.type === category && e.structureOrUsage && !seen.has(e.structureOrUsage)) {
      seen.add(e.structureOrUsage);
      result.push(e.structureOrUsage);
    }
  }
  return result;
}

export function getDetailCategoriesInStructure(
  category: string,
  structure: string,
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const e of TABLE_1) {
    if (e.type === category && e.structureOrUsage === structure && e.detailCategory) {
      if (!seen.has(e.detailCategory)) {
        seen.add(e.detailCategory);
        result.push(e.detailCategory);
      }
    }
  }
  return result;
}

export function getDetailsInStructure(
  category: string,
  structure: string,
  detailCategory: string | null,
): UsefulLifeEntry[] {
  return TABLE_1.filter((e) => {
    if (e.type !== category) return false;
    if (e.structureOrUsage !== structure) return false;
    if (detailCategory !== null) {
      return e.detailCategory === detailCategory;
    }
    return !e.detailCategory;
  });
}

export function hasDetailCategories(category: string, structure: string): boolean {
  return TABLE_1.some(
    (e) => e.type === category && e.structureOrUsage === structure && !!e.detailCategory,
  );
}

// ========== シノニム辞書ベースの検索 ==========

/**
 * シノニム辞書に対するマッチ判定
 * - 完全一致（小文字化して比較）
 * - 部分一致（キーワードがクエリに含まれる、またはクエリがキーワードに含まれる）
 *
 * 戻り値の score が大きいほど優先度が高い:
 *   3: クエリと完全一致
 *   2: キーワードがクエリに含まれる（例: クエリ「PCラック」、キーワード「ラック」）
 *   1: クエリがキーワードに含まれる（例: クエリ「ラック」、キーワード「PCラック」）
 *   0: マッチしない
 */
function matchSynonym(query: string, syn: SynonymEntry): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;

  for (const kw of syn.keywords) {
    const k = kw.toLowerCase();
    if (q === k) return 3;
  }
  for (const kw of syn.keywords) {
    const k = kw.toLowerCase();
    if (q.includes(k) && k.length >= 2) return 2;
  }
  for (const kw of syn.keywords) {
    const k = kw.toLowerCase();
    if (k.includes(q) && q.length >= 2) return 1;
  }
  return 0;
}

/** 検索結果（表示用に追加情報を持つ） */
export interface SearchResultItem {
  entry: UsefulLifeEntry;
  /** 表示ラベル（シノニム辞書の場合は現代語、それ以外は細目） */
  label: string;
  /** 補足説明（任意） */
  hint?: string;
  /** 検索スコア（デバッグ・並び順用） */
  score: number;
}

/**
 * メイン検索関数: シノニム辞書 + 部分一致をマージして返す
 */
export function searchByKeyword(query: string): SearchResultItem[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const results: SearchResultItem[] = [];
  const seenKeys = new Set<string>();

  // ① シノニム辞書から候補を集める
  for (const syn of SYNONYMS) {
    const score = matchSynonym(trimmed, syn);
    if (score === 0) continue;

    // matcher で該当エントリを取得
    const matched = ALL_ENTRIES.filter(syn.matcher);
    for (const entry of matched) {
      const key = entryKey(entry);
      if (seenKeys.has(key)) continue;
      seenKeys.add(key);
      results.push({
        entry,
        label: syn.displayLabel,
        hint: syn.hint,
        // シノニム経由は基本スコア+10して優先表示
        score: score + 10,
      });
    }
  }

  // ② 法令テキストへの部分一致（フォールバック）
  const q = trimmed.toLowerCase();
  if (q.length >= 2) {
    for (const entry of ALL_ENTRIES) {
      const key = entryKey(entry);
      if (seenKeys.has(key)) continue;

      const haystack = [
        entry.type,
        entry.structureOrUsage,
        entry.detailCategory ?? '',
        entry.detail,
      ]
        .join(' ')
        .toLowerCase();

      if (haystack.includes(q)) {
        seenKeys.add(key);
        results.push({
          entry,
          label: entry.detail || entry.detailCategory || entry.type,
          score: 1,
        });
      }
    }
  }

  // スコア降順 → 上位50件
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, 50);
}

/** エントリの一意キー（重複除去用） */
function entryKey(entry: UsefulLifeEntry): string {
  return `${entry.type}|${entry.structureOrUsage}|${entry.detailCategory ?? ''}|${entry.detail}|${entry.usefulLife}`;
}
