const shorten = (a) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : '')

export default function Header({ wallet }) {
  return (
    <header className="border-b border-rc-border">
      <div className="max-w-6xl mx-auto px-6 py-6 flex items-start justify-between gap-6">
        <div className="flex items-start gap-4">
          {/* mark */}
          <div className="mono text-[10px] text-white/30 tracking-[0.3em] pt-1 hidden sm:block">
            ◼◼◼<br />◼◻◼<br />◼◼◼
          </div>
          <div>
            <h1 className="mono text-[28px] sm:text-[32px] font-bold leading-none tracking-tight">
              Claim<span className="text-rc-purple">Rewards</span>
              <span className="text-rc-green text-xs ml-2 align-top">●</span>
            </h1>
            <p className="text-white/40 text-[13px] mt-2 tracking-wide">
              create and monetize with crypto · on monad
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {wallet.address ? (
            <div className="flex items-center gap-2">
              <div className="mono text-[10px] text-white/40 uppercase tracking-widest hidden sm:block">
                wallet
              </div>
              <span className="mono text-xs text-white/90 px-3 py-2 border border-rc-border bg-[#0f0f0f]">
                <span className="text-rc-green mr-2">●</span>
                {shorten(wallet.address)}
              </span>
            </div>
          ) : (
            <button onClick={wallet.connect} disabled={wallet.connecting} className="btn-primary">
              {wallet.connecting ? <><span className="spinner" />connecting…</> : 'connect wallet'}
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
