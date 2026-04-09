/**
 * よく検索される人気資産のショートカット定義
 *
 * matcher関数で UsefulLifeEntry を絞り込み、最初にマッチしたエントリを「該当」として表示。
 * 順序は表示順を意味する。
 */
import type { PopularAsset } from '../logic/types';

export const POPULAR_ASSETS: PopularAsset[] = [
  {
    label: 'パソコン',
    icon: '💻',
    description: 'サーバー以外のPC・ノートPC',
    matcher: (e) =>
      e.type === '器具及び備品' &&
      e.detail.includes('パーソナルコンピュータ') &&
      e.detail.includes('サーバー用'),
  },
  {
    label: 'サーバー',
    icon: '🖥️',
    description: 'サーバー用コンピュータ',
    matcher: (e) =>
      e.type === '器具及び備品' &&
      e.detailCategory === '電子計算機' &&
      e.detail === 'その他のもの',
  },
  {
    label: '普通自動車',
    icon: '🚗',
    description: '一般的な営業車・社用車',
    matcher: (e) =>
      e.type === '車両及び運搬具' &&
      e.structureOrUsage === '前掲のもの以外のもの' &&
      e.detail === 'その他のもの' &&
      e.usefulLife === 6,
  },
  {
    label: '軽自動車',
    icon: '🚙',
    description: '総排気量0.66リットル以下',
    matcher: (e) =>
      e.type === '車両及び運搬具' && e.detail.includes('〇・六六リットル以下'),
  },
  {
    label: 'エアコン（壁掛け）',
    icon: '❄️',
    description: '据置・壁掛けタイプ',
    matcher: (e) =>
      e.type === '器具及び備品' && e.detail.includes('冷房用又は暖房用機器'),
  },
  {
    label: '事務机（金属製）',
    icon: '🪑',
    description: 'スチール製のオフィス家具',
    matcher: (e) =>
      e.type === '器具及び備品' &&
      e.detailCategory === '事務机、事務いす及びキャビネット' &&
      e.detail.includes('金属'),
  },
];
