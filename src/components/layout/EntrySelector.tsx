interface Props {
  onSelectEntryA: () => void;
  onSelectEntryB: () => void;
}

export function EntrySelector({ onSelectEntryA, onSelectEntryB }: Props) {
  return (
    <section className="space-y-6">
      <div className="text-center space-y-2 py-2">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
          何を調べたいですか？
        </h2>
        <p className="text-sm text-gray-600">
          目的に合わせてお選びください
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 入口A */}
        <button
          type="button"
          onClick={onSelectEntryA}
          className="bg-white border-2 border-border rounded-2xl p-5 text-left hover:border-primary hover:shadow-md transition-all"
        >
          <div className="text-3xl mb-2">📅</div>
          <div className="font-bold text-gray-800 text-base">
            耐用年数を調べたい
          </div>
          <p className="text-xs text-gray-500 mt-2 leading-relaxed">
            「マンションの耐用年数を知りたい」<br />
            「中古車の減価償却年数を計算したい」<br />
            など、年数だけ知りたい方へ
          </p>
          <div className="text-xs text-primary mt-3 font-medium">
            シンプルに耐用年数を表示 →
          </div>
        </button>

        {/* 入口B */}
        <button
          type="button"
          onClick={onSelectEntryB}
          className="bg-white border-2 border-border rounded-2xl p-5 text-left hover:border-primary hover:shadow-md transition-all"
        >
          <div className="text-3xl mb-2">🤔</div>
          <div className="font-bold text-gray-800 text-base">
            固定資産か費用か分からない
          </div>
          <p className="text-xs text-gray-500 mt-2 leading-relaxed">
            「8万円のPCって減価償却するの？」<br />
            「20万円のカメラはどう経理すべき？」<br />
            「最も有利な処理を知りたい」方へ
          </p>
          <div className="text-xs text-primary mt-3 font-medium">
            金額から最適な処理を判定 →
          </div>
        </button>
      </div>

      <div className="text-center text-xs text-gray-500">
        どちらを選んでもいつでも切り替えられます
      </div>
    </section>
  );
}
