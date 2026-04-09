/**
 * シノニム辞書: ユーザーが入力する現代語 → 法令上の細目へのマッピング
 *
 * 国税庁の耐用年数表は昭和40年の言葉なので、ユーザーが入力する単語
 * （「PCラック」「クーラー」「軽自動車」等）と直接マッチしない。
 * この辞書は実需上位（Web調査ベース）のキーワードを法令上のエントリに紐づける。
 *
 * 設計方針:
 * - 1つのエントリは複数のキーワード候補を持つ（言い方の揺れに対応）
 * - matcher関数でusefulLifeTableのエントリを特定する
 * - 1つのキーワードが複数の法令エントリにマッチすることもある（例: エアコンは器具備品と建物附属設備の両方）
 */
import type { UsefulLifeEntry } from './usefulLifeTable';

export interface SynonymEntry {
  /** ユーザーが入力するキーワード（複数の言い方） */
  readonly keywords: readonly string[];
  /** マッチ対象のエントリを特定する条件 */
  readonly matcher: (entry: UsefulLifeEntry) => boolean;
  /** 候補一覧での表示用ラベル（現代語） */
  readonly displayLabel: string;
  /** 補足説明（任意） */
  readonly hint?: string;
}

// ヘルパー: 文字列に含まれるか
const includes = (s: string | undefined, kw: string): boolean =>
  !!s && s.includes(kw);

export const SYNONYMS: SynonymEntry[] = [
  // ========== IT機器・電子機器 ==========
  {
    keywords: ['パソコン', 'PC', 'ノートPC', 'ノートパソコン', 'デスクトップ', 'Mac', 'MacBook', 'Windows'],
    displayLabel: 'パソコン',
    hint: 'サーバー以外のPC・ノートPC',
    matcher: (e) =>
      e.type === '器具及び備品' &&
      includes(e.detail, 'パーソナルコンピュータ'),
  },
  {
    keywords: ['サーバー', 'サーバ', 'Server', 'NAS'],
    displayLabel: 'サーバー',
    hint: 'サーバー用コンピュータ',
    matcher: (e) =>
      e.type === '器具及び備品' &&
      e.detailCategory === '電子計算機' &&
      e.detail === 'その他のもの',
  },
  {
    keywords: ['スマホ', 'スマートフォン', 'iPhone', 'Android', '携帯電話', 'ガラケー', '電話機'],
    displayLabel: 'スマートフォン・電話機',
    hint: '電話設備その他の通信機器（その他）',
    matcher: (e) =>
      e.type === '器具及び備品' &&
      e.detailCategory === '電話設備その他の通信機器' &&
      e.detail === 'その他のもの',
  },
  {
    keywords: ['タブレット', 'iPad'],
    displayLabel: 'タブレット',
    hint: 'パソコン扱い（パーソナルコンピュータ）',
    matcher: (e) =>
      e.type === '器具及び備品' &&
      includes(e.detail, 'パーソナルコンピュータ'),
  },
  {
    keywords: ['プリンター', 'プリンタ', '複合機', 'コピー機', 'スキャナー', 'スキャナ'],
    displayLabel: 'プリンター・複合機',
    hint: '複写機・計算機等',
    matcher: (e) =>
      e.type === '器具及び備品' &&
      includes(e.detail, '複写機'),
  },
  {
    keywords: ['FAX', 'ファックス', 'ファクシミリ', 'テレックス'],
    displayLabel: 'ファクシミリ',
    matcher: (e) =>
      e.type === '器具及び備品' &&
      includes(e.detail, 'ファクシミリ'),
  },
  {
    keywords: ['ルーター', 'ルータ', 'ハブ', 'スイッチ', 'WiFi', 'Wi-Fi', 'ネットワーク機器', 'LAN機器', 'アクセスポイント'],
    displayLabel: 'ネットワーク機器',
    hint: '電話設備その他の通信機器',
    matcher: (e) =>
      e.type === '器具及び備品' &&
      e.detailCategory === '電話設備その他の通信機器' &&
      e.detail === 'その他のもの',
  },
  {
    keywords: ['レジ', 'レジスター', 'POS', 'タイムレコーダー', '計算機'],
    displayLabel: 'レジスター・タイムレコーダー',
    matcher: (e) =>
      e.type === '器具及び備品' &&
      includes(e.detail, '金銭登録機'),
  },
  {
    keywords: ['カメラ', 'デジカメ', '一眼レフ', 'ビデオカメラ', 'ミラーレス', '映写機', '望遠鏡'],
    displayLabel: 'カメラ・映像機器',
    matcher: (e) =>
      e.type === '器具及び備品' &&
      includes(e.detail, 'カメラ'),
  },

  // ========== オフィス家具 ==========
  {
    keywords: ['机', 'デスク', '事務机', 'オフィスデスク', '会議テーブル', '作業台'],
    displayLabel: '事務机（金属製）',
    hint: '事務机、事務いす及びキャビネット - 主として金属製',
    matcher: (e) =>
      e.type === '器具及び備品' &&
      e.detailCategory === '事務机、事務いす及びキャビネット' &&
      includes(e.detail, '金属'),
  },
  {
    keywords: ['椅子', 'イス', 'いす', 'チェア', 'オフィスチェア', '事務いす'],
    displayLabel: '事務いす（金属製）',
    hint: '事務机、事務いす及びキャビネット - 主として金属製',
    matcher: (e) =>
      e.type === '器具及び備品' &&
      e.detailCategory === '事務机、事務いす及びキャビネット' &&
      includes(e.detail, '金属'),
  },
  {
    keywords: ['キャビネット', 'ロッカー', '書庫', 'ファイル保管庫', 'ファイリングキャビネット'],
    displayLabel: 'キャビネット',
    matcher: (e) =>
      e.type === '器具及び備品' &&
      e.detailCategory === '事務机、事務いす及びキャビネット' &&
      includes(e.detail, '金属'),
  },
  {
    keywords: ['棚', 'ラック', 'シェルフ', '本棚', '陳列棚', 'PCラック', 'スチールラック', 'ショーケース'],
    displayLabel: '陳列だな・陳列ケース',
    hint: '冷凍機なしの棚は8年（その他のもの）',
    matcher: (e) =>
      e.type === '器具及び備品' &&
      e.detailCategory === '陳列だな及び陳列ケース' &&
      e.detail === 'その他のもの',
  },
  {
    keywords: ['応接セット', 'ソファ', 'ソファー'],
    displayLabel: '応接セット',
    matcher: (e) =>
      e.type === '器具及び備品' &&
      e.detailCategory === '応接セット' &&
      includes(e.detail, '接客'),
  },
  {
    keywords: ['カーテン', 'ブラインド', '寝具', '布団', 'ふとん'],
    displayLabel: 'カーテン・寝具・繊維製品',
    matcher: (e) =>
      e.type === '器具及び備品' &&
      includes(e.detail, 'カーテン'),
  },
  {
    keywords: ['金庫', '手提げ金庫'],
    displayLabel: '金庫（手さげ）',
    hint: '据置型は20年',
    matcher: (e) =>
      e.type === '器具及び備品' &&
      e.detailCategory === '金庫' &&
      includes(e.detail, '手さげ'),
  },

  // ========== 家電・空調 ==========
  {
    keywords: ['エアコン', 'クーラー', '冷房', '暖房', '壁掛けエアコン', '据置エアコン', '冷暖房機器'],
    displayLabel: 'エアコン（壁掛け・据置）',
    hint: '据置型は器具備品扱い（6年）',
    matcher: (e) =>
      e.type === '器具及び備品' &&
      includes(e.detail, '冷房用又は暖房用機器'),
  },
  {
    keywords: ['ビルトインエアコン', '業務用エアコン', '埋込エアコン', 'ダクト式空調', '空調設備', 'セントラル空調'],
    displayLabel: '業務用エアコン（建物附属設備）',
    hint: '建物に固定された空調設備（13年または15年）',
    matcher: (e) =>
      e.type === '建物附属設備' &&
      includes(e.structureOrUsage, '冷房') &&
      includes(e.detail, '冷暖房設備'),
  },
  {
    keywords: ['冷蔵庫', '業務用冷蔵庫', '電気冷蔵庫'],
    displayLabel: '電気冷蔵庫・冷蔵機器',
    matcher: (e) =>
      e.type === '器具及び備品' &&
      includes(e.detail, '電気冷蔵庫'),
  },
  {
    keywords: ['洗濯機', 'ドラム式洗濯機'],
    displayLabel: '電気洗濯機',
    matcher: (e) =>
      e.type === '器具及び備品' &&
      includes(e.detail, '電気洗濯機'),
  },
  {
    keywords: ['テレビ', 'TV', 'モニター', 'テレビジョン', 'ラジオ', 'スピーカー', 'オーディオ', '音響機器'],
    displayLabel: 'テレビ・音響機器',
    matcher: (e) =>
      e.type === '器具及び備品' &&
      includes(e.detail, 'テレビジョン'),
  },
  {
    keywords: ['照明', 'LED', '蛍光灯', '照明設備', 'ライト'],
    displayLabel: '電気設備（照明）',
    hint: '建物附属設備の電気設備',
    matcher: (e) =>
      e.type === '建物附属設備' &&
      includes(e.structureOrUsage, '電気設備') &&
      e.detail === 'その他のもの',
  },
  {
    keywords: ['給湯器', 'ボイラー', '給排水', '衛生設備', 'ガス設備', 'トイレ', '洗面台'],
    displayLabel: '給排水・衛生設備・ガス設備',
    matcher: (e) =>
      e.type === '建物附属設備' &&
      includes(e.structureOrUsage, '給排水'),
  },

  // ========== 車両 ==========
  {
    keywords: ['普通自動車', '普通車', '乗用車', '営業車', '社用車', 'セダン', 'SUV', 'ミニバン'],
    displayLabel: '普通自動車（乗用車）',
    hint: '排気量0.66リットル超の乗用車：6年',
    // パーサーの後処理パッチで detail_category が
    // 「自動車（二輪又は三輪自動車を除く。）」に補正されている
    matcher: (e) =>
      e.type === '車両及び運搬具' &&
      e.structureOrUsage === '前掲のもの以外のもの' &&
      e.detailCategory === '自動車（二輪又は三輪自動車を除く。）' &&
      e.detail === 'その他のもの' &&
      e.usefulLife === 6,
  },
  {
    keywords: ['軽自動車', '軽', '軽四'],
    displayLabel: '軽自動車',
    hint: '総排気量0.66リットル以下',
    matcher: (e) =>
      e.type === '車両及び運搬具' &&
      e.structureOrUsage === '前掲のもの以外のもの' &&
      includes(e.detail, '〇・六六リットル以下'),
  },
  {
    keywords: ['トラック', '貨物自動車', '貨物車', '配送車', 'バン'],
    displayLabel: '貨物自動車（一般）',
    matcher: (e) =>
      e.type === '車両及び運搬具' &&
      e.structureOrUsage === '前掲のもの以外のもの' &&
      e.detailCategory === '貨物自動車' &&
      e.detail === 'その他のもの' &&
      e.usefulLife === 5,
  },
  {
    keywords: ['ダンプ', 'ダンプカー', 'ダンプトラック'],
    displayLabel: 'ダンプ式トラック',
    matcher: (e) =>
      e.type === '車両及び運搬具' &&
      e.structureOrUsage === '前掲のもの以外のもの' &&
      e.detailCategory === '貨物自動車' &&
      includes(e.detail, 'ダンプ'),
  },
  {
    keywords: ['バイク', 'オートバイ', '二輪', '原付', 'スクーター', '三輪'],
    displayLabel: '二輪・三輪自動車',
    matcher: (e) =>
      e.type === '車両及び運搬具' &&
      e.structureOrUsage === '前掲のもの以外のもの' &&
      e.detailCategory === '貨物自動車' &&
      includes(e.detail, '二輪又は三輪'),
  },
  {
    keywords: ['自転車', 'ロードバイク', 'クロスバイク', 'ママチャリ'],
    displayLabel: '自転車',
    matcher: (e) =>
      e.type === '車両及び運搬具' &&
      e.structureOrUsage === '前掲のもの以外のもの' &&
      e.detail === '自転車',
  },

  // ========== 建物 ==========
  {
    keywords: ['マンション', 'RC', '鉄筋コンクリート', 'RC造', '分譲マンション'],
    displayLabel: 'RC造の住宅・マンション',
    hint: '住宅用：47年',
    matcher: (e) =>
      e.type === '建物' &&
      includes(e.structureOrUsage, '鉄筋コンクリート') &&
      includes(e.detail, '住宅'),
  },
  {
    keywords: ['アパート', '木造アパート', '木造住宅', '戸建て', '一戸建て', '木造'],
    displayLabel: '木造住宅・アパート',
    hint: '木造の住宅・店舗等：22年',
    matcher: (e) =>
      e.type === '建物' &&
      includes(e.structureOrUsage, '木造又は合成樹脂') &&
      includes(e.detail, '住宅'),
  },
  {
    keywords: ['鉄骨造', '軽量鉄骨', '重量鉄骨', '鉄骨'],
    displayLabel: '鉄骨造の住宅（4mm超）',
    hint: '骨格材4mm超：38年',
    matcher: (e) =>
      e.type === '建物' &&
      includes(e.structureOrUsage, '四ミリメートルを超える') &&
      includes(e.detail, '事務所'),
  },
  {
    keywords: ['事務所', 'オフィス', 'オフィスビル', '事務所ビル'],
    displayLabel: 'RC造の事務所',
    hint: 'RC造の事務所：50年',
    matcher: (e) =>
      e.type === '建物' &&
      includes(e.structureOrUsage, '鉄筋コンクリート') &&
      includes(e.detail, '事務所'),
  },
  {
    keywords: ['店舗', '飲食店', 'レストラン', 'カフェ', '居酒屋'],
    displayLabel: 'RC造の飲食店',
    hint: 'RC造の飲食店：41年（木造内装3割超は34年）',
    matcher: (e) =>
      e.type === '建物' &&
      includes(e.structureOrUsage, '鉄筋コンクリート') &&
      includes(e.detail, '飲食店') &&
      includes(e.detail, 'その他'),
  },

  // ========== 設備・構築物 ==========
  {
    keywords: ['看板', 'ネオンサイン', 'ネオン', '広告塔', '広告器具'],
    displayLabel: '看板・ネオンサイン',
    hint: '5項 看板及び広告器具（3年）',
    matcher: (e) =>
      e.type === '器具及び備品' &&
      includes(e.detail, '看板'),
  },
  {
    keywords: ['駐車場', 'アスファルト', '舗装', '舗装路面', 'コンクリート舗装'],
    displayLabel: '舗装道路（アスファルト）',
    hint: 'アスファルト敷：10年（コンクリート敷は15年）',
    matcher: (e) =>
      e.type === '構築物' &&
      includes(e.structureOrUsage, '舗装') &&
      includes(e.detail, 'アスファルト'),
  },

  // ========== 業種特有 ==========
  {
    keywords: ['美容機器', '理容機器', 'シャンプー台', 'パーマ機', '脱毛機', '美容', '理容'],
    displayLabel: '理容・美容機器',
    matcher: (e) =>
      e.type === '器具及び備品' &&
      includes(e.structureOrUsage, '理容又は美容'),
  },
  {
    keywords: ['医療機器', '手術機器', '歯科ユニット', '歯科'],
    displayLabel: '医療機器（手術機器）',
    matcher: (e) =>
      e.type === '器具及び備品' &&
      includes(e.structureOrUsage, '医療機器') &&
      e.detail === '手術機器',
  },
  {
    keywords: ['レントゲン', 'X線', 'MRI', 'CT', 'エコー'],
    displayLabel: 'レントゲン等の電子装置医療機器',
    matcher: (e) =>
      e.type === '器具及び備品' &&
      includes(e.structureOrUsage, '医療機器') &&
      includes(e.detailCategory, 'レントゲン') &&
      e.detail === 'その他のもの',
  },
  {
    keywords: ['工作機械', '旋盤', 'フライス盤', 'マシニングセンタ', '測定工具', '検査工具'],
    displayLabel: '測定工具・検査工具',
    matcher: (e) =>
      e.type === '工具' &&
      includes(e.structureOrUsage, '測定工具'),
  },
  {
    keywords: ['ソフトウェア', 'ソフトウエア', 'アプリ', 'システム', 'プログラム'],
    displayLabel: 'ソフトウエア（自社利用）',
    hint: '自社利用は5年、複写販売の原本は3年',
    matcher: (e) =>
      e.type === 'ソフトウエア' &&
      e.detail === 'その他のもの',
  },
];
