/**
 * アプリケーション全体で使う型定義
 */

import type { UsefulLifeEntry } from '../data/usefulLifeTable';

/** 検索の絞り込み状態 */
export interface SearchState {
  /** 大分類（建物、器具及び備品など） */
  category: string | null;
  /** 構造または用途 */
  structureOrUsage: string | null;
  /** 細目の中分類（detail_category） */
  detailCategory: string | null;
}

/** 検索の最終結果 */
export type SearchResult = UsefulLifeEntry;

/** 画面の状態 */
export type Screen = 'top' | 'search' | 'result';

/** ショートカット用の人気資産 */
export interface PopularAsset {
  /** 表示名 */
  label: string;
  /** アイコン（絵文字） */
  icon: string;
  /** マッチ条件: type / structureOrUsage / detail のキーワード */
  matcher: (entry: UsefulLifeEntry) => boolean;
  /** カテゴリ説明 */
  description?: string;
}
