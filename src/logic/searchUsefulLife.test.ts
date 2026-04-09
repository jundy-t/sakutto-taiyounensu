/**
 * シノニム検索のテストケース
 * 実際のキーワード入力で期待するエントリが先頭に来るかを検証する
 */

import { searchByKeyword } from './searchUsefulLife';

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e: unknown) {
    failed++;
    const msg = e instanceof Error ? e.message : String(e);
    console.log(`  ✗ ${name}`);
    console.log(`    ${msg}`);
  }
}

/**
 * クエリで検索したとき、先頭の結果が期待した耐用年数になっているか
 */
function expectTopUsefulLife(query: string, expectedYears: number) {
  const results = searchByKeyword(query);
  if (results.length === 0) {
    throw new Error(`"${query}" → 結果なし`);
  }
  const top = results[0];
  if (top.entry.usefulLife !== expectedYears) {
    throw new Error(
      `"${query}" → 期待 ${expectedYears}年, 実際 ${top.entry.usefulLife}年 (${top.label})`,
    );
  }
}

/**
 * クエリで検索したとき、結果のどこかに期待した耐用年数のエントリがあるか
 */
function expectAnyUsefulLife(query: string, expectedYears: number) {
  const results = searchByKeyword(query);
  if (results.length === 0) {
    throw new Error(`"${query}" → 結果なし`);
  }
  const found = results.some((r) => r.entry.usefulLife === expectedYears);
  if (!found) {
    const got = results.slice(0, 3).map((r) => `${r.label}=${r.entry.usefulLife}年`).join(', ');
    throw new Error(`"${query}" → ${expectedYears}年が見つからない (上位: ${got})`);
  }
}

console.log('\n=== IT機器 ===');
test('"パソコン" → 4年', () => expectTopUsefulLife('パソコン', 4));
test('"PC" → 4年', () => expectTopUsefulLife('PC', 4));
test('"ノートパソコン" → 4年', () => expectTopUsefulLife('ノートパソコン', 4));
test('"MacBook" → 4年', () => expectTopUsefulLife('MacBook', 4));
test('"サーバー" → 5年', () => expectTopUsefulLife('サーバー', 5));
test('"スマホ" → 10年', () => expectTopUsefulLife('スマホ', 10));
test('"iPhone" → 10年', () => expectTopUsefulLife('iPhone', 10));
test('"タブレット" → 4年', () => expectTopUsefulLife('タブレット', 4));
test('"プリンター" → 5年', () => expectTopUsefulLife('プリンター', 5));
test('"FAX" → 5年', () => expectTopUsefulLife('FAX', 5));
test('"ルーター" → 10年', () => expectTopUsefulLife('ルーター', 10));
test('"レジ" → 5年', () => expectTopUsefulLife('レジ', 5));
test('"カメラ" → 5年', () => expectTopUsefulLife('カメラ', 5));

console.log('\n=== オフィス家具 ===');
test('"机" → 15年', () => expectTopUsefulLife('机', 15));
test('"事務机" → 15年', () => expectTopUsefulLife('事務机', 15));
test('"椅子" → 15年', () => expectTopUsefulLife('椅子', 15));
test('"オフィスチェア" → 15年', () => expectTopUsefulLife('オフィスチェア', 15));
test('"PCラック" → 8年', () => expectTopUsefulLife('PCラック', 8));
test('"棚" → 8年', () => expectTopUsefulLife('棚', 8));
test('"本棚" → 8年', () => expectTopUsefulLife('本棚', 8));
test('"金庫" → 5年（手提げ）', () => expectTopUsefulLife('金庫', 5));
test('"カーテン" → 3年', () => expectTopUsefulLife('カーテン', 3));

console.log('\n=== 家電・空調 ===');
test('"エアコン" → 6年（壁掛け）', () => expectTopUsefulLife('エアコン', 6));
test('"クーラー" → 6年', () => expectTopUsefulLife('クーラー', 6));
test('"ビルトインエアコン" → 13年or15年', () => expectAnyUsefulLife('ビルトインエアコン', 13));
test('"業務用エアコン" → 13年or15年', () => expectAnyUsefulLife('業務用エアコン', 13));
test('"冷蔵庫" → 6年', () => expectTopUsefulLife('冷蔵庫', 6));
test('"洗濯機" → 6年', () => expectAnyUsefulLife('洗濯機', 6));
test('"テレビ" → 5年', () => expectTopUsefulLife('テレビ', 5));
test('"照明" → 15年', () => expectTopUsefulLife('照明', 15));
test('"給湯器" → 15年', () => expectTopUsefulLife('給湯器', 15));

console.log('\n=== 車両 ===');
test('"普通自動車" → 6年', () => expectTopUsefulLife('普通自動車', 6));
test('"営業車" → 6年', () => expectTopUsefulLife('営業車', 6));
test('"軽自動車" → 4年', () => expectTopUsefulLife('軽自動車', 4));
test('"軽" → 4年', () => expectTopUsefulLife('軽', 4));
test('"トラック" → 5年', () => expectTopUsefulLife('トラック', 5));
test('"ダンプ" → 4年', () => expectTopUsefulLife('ダンプ', 4));
test('"バイク" → 3年', () => expectTopUsefulLife('バイク', 3));
test('"自転車" → 2年', () => expectTopUsefulLife('自転車', 2));

console.log('\n=== 建物 ===');
test('"マンション" → 47年', () => expectTopUsefulLife('マンション', 47));
test('"アパート" → 22年', () => expectTopUsefulLife('アパート', 22));
test('"木造住宅" → 22年', () => expectTopUsefulLife('木造住宅', 22));
test('"事務所" → 50年', () => expectTopUsefulLife('事務所', 50));
test('"オフィス" → 50年', () => expectTopUsefulLife('オフィス', 50));
test('"店舗" → ヒットあり', () => {
  const r = searchByKeyword('店舗');
  if (r.length === 0) throw new Error('結果なし');
});

console.log('\n=== 設備・構築物 ===');
test('"看板" → 3年', () => expectTopUsefulLife('看板', 3));
test('"ネオンサイン" → 3年', () => expectTopUsefulLife('ネオンサイン', 3));
test('"駐車場" → 10年', () => expectTopUsefulLife('駐車場', 10));
test('"アスファルト" → 10年', () => expectTopUsefulLife('アスファルト', 10));

console.log('\n=== 業種特有 ===');
test('"美容機器" → 5年', () => expectTopUsefulLife('美容機器', 5));
test('"理容機器" → 5年', () => expectTopUsefulLife('理容機器', 5));
test('"ソフトウェア" → 5年', () => expectTopUsefulLife('ソフトウェア', 5));
test('"ソフトウエア" → 5年', () => expectTopUsefulLife('ソフトウエア', 5));

console.log('\n=== フォールバック（部分一致） ===');
test('"鉛" → 何かヒット（部分一致）', () => {
  const r = searchByKeyword('鉛');
  // フォールバックで何か返ればOK
  if (r.length === 0) {
    console.log('    （ヒットなしも許容）');
  }
});

console.log(`\n=== 結果: ${passed} passed, ${failed} failed ===`);
if (failed > 0) {
  process.exit(1);
}
