/**
 * 一時的なスクリプト: シノニム辞書の各エントリが、国税庁データから
 * 実際にどの耐用年数を引いてくるかを一覧化する。
 *
 * このスクリプトの目的は「ネット調査で集めたキーワード→耐用年数」の対応が
 * 国税庁の公式データと照合して矛盾していないかを確認すること。
 */
import { SYNONYMS } from '../data/synonyms';
import { ALL_ENTRIES } from '../data/usefulLifeTable';

console.log('=== シノニム辞書 vs 国税庁データ 照合 ===\n');

for (const syn of SYNONYMS) {
  const matched = ALL_ENTRIES.filter(syn.matcher);
  const lives = matched.map((e) => e.usefulLife);
  const unique = [...new Set(lives)].sort((a, b) => a - b);
  const kw = syn.keywords.slice(0, 4).join(' / ');
  const hint = syn.hint ?? '';
  console.log(`■ ${syn.displayLabel}`);
  console.log(`  キーワード: ${kw}`);
  console.log(`  hint: ${hint}`);
  console.log(`  → 実データ: ${unique.join('年, ')}年 (ヒット数:${matched.length})`);
  if (matched.length > 0 && matched.length <= 3) {
    for (const e of matched) {
      const path = [e.type, e.structureOrUsage, e.detailCategory, e.detail]
        .filter(Boolean)
        .join(' ＞ ');
      console.log(`     - ${path}: ${e.usefulLife}年`);
    }
  } else if (matched.length > 3) {
    console.log(`     (...${matched.length}件のうち3件以上)`);
  }
  console.log('');
}
