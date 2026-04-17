const LAST_UPDATED = '2026-04-16';

const FAQS = [
  {
    q: '検索してもヒットしない資産があります。どうすればよいですか？',
    a: '「該当する資産が見つかりません」と表示された場合は、別のキーワード（例: 「PC」→「パソコン」など表記ゆれ）や、「カテゴリーから探す」画面からの検索をお試しください。ヒットしなかった検索ワードは個人を特定できない形で匿名集計し、今後の辞書拡充の参考にさせていただきます。',
  },
  {
    q: '入力した内容は外部に送信されますか？',
    a: '判定処理はすべてブラウザ内で完結し、入力された資産名や金額は外部サーバーへ送信されません。ただし、検索ワードは Google Analytics 経由で匿名集計（個人を特定できない形）しており、辞書拡充や利用状況の把握に活用しています。',
  },
];

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="bg-card border border-border rounded-xl group">
      <summary className="cursor-pointer select-none px-4 py-3 hover:bg-card-hover rounded-xl flex justify-between items-center text-text">
        <span role="heading" aria-level={3} className="font-medium">{title}</span>
        <svg className="w-4 h-4 transition-transform group-open:rotate-180 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </summary>
      <div className="px-4 pb-4 pt-2 text-sm text-text-muted space-y-3">
        {children}
      </div>
    </details>
  );
}

export function SeoExpandableSections() {
  return (
    <section className="space-y-3 mt-8">
      <h2 className="text-lg font-bold text-text mb-2">このツールについて</h2>
      <DetailSection title="よくある質問（FAQ）">
        <div className="space-y-4">
          {FAQS.map((faq, i) => (
            <div key={i}>
              <p className="font-medium text-text">Q. {faq.q}</p>
              <p className="mt-1">{faq.a}</p>
            </div>
          ))}
        </div>
      </DetailSection>

      <DetailSection title="根拠となる法令・情報源">
        <ul className="space-y-1">
          <li><a href="https://laws.e-gov.go.jp/law/340M50000040015" target="_blank" rel="noopener noreferrer" className="underline hover:text-text">e-Gov 法令検索 — 減価償却資産の耐用年数等に関する省令</a>（別表第一・第三）</li>
        </ul>
        <p className="text-xs opacity-70 mt-2">データは政府標準利用規約に基づき二次利用しています。</p>
      </DetailSection>

      <DetailSection title="運営者情報">
        <ul className="space-y-1">
          <li><strong>サービス名:</strong> サクッと耐用年数</li>
          <li><strong>運営:</strong> <a href="https://haraochi.jp/" target="_blank" rel="noopener noreferrer" className="underline hover:text-text">サクッと</a>（個人事業主・フリーランス向け無料ツール集）</li>
          <li><strong>最終更新:</strong> {LAST_UPDATED}</li>

        </ul>
      </DetailSection>
    </section>
  );
}
