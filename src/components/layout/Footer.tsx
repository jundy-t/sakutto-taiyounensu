import { META } from '../../data/usefulLifeTable';

export function Footer() {
  return (
    <footer className="bg-white border-t border-border mt-auto">
      <div className="max-w-3xl mx-auto px-4 py-6 text-xs text-gray-600 space-y-2">
        <p>
          <strong>出典：</strong>{META.source}
          （政府標準利用規約に基づき二次利用）
        </p>
        <p>
          本ツールの計算結果は参考情報です。最終的な税務判断は税理士または所轄税務署にご確認ください。
        </p>
        <p className="text-gray-400">
          © {new Date().getFullYear()} サクッと耐用年数
        </p>
      </div>
    </footer>
  );
}
