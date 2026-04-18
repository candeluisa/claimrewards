import { formatEther } from 'ethers'

export default function MyReputation({ wallet, rc }) {
  if (!wallet.address) {
    return (
      <div className="panel p-14 text-center reveal">
        <div className="mono text-[11px] text-white/30 tracking-widest uppercase">connect_required</div>
        <div className="mt-2 text-white/70">Connect a wallet to view your on-chain reputation.</div>
        <button onClick={wallet.connect} className="btn-primary mt-5">connect wallet</button>
      </div>
    )
  }

  const rep = rc.reputation || { campaignsCompleted: 0, totalEarned: 0n, totalSpent: 0n, score: 0 }
  const asInfluencer = rc.campaigns.filter(
    (c) => c.influencer?.toLowerCase() === wallet.address.toLowerCase()
  )
  const asBrand = rc.campaigns.filter(
    (c) => c.brand.toLowerCase() === wallet.address.toLowerCase()
  )

  return (
    <section>
      <div className="mono text-[11px] text-white/40 uppercase tracking-[0.3em]">// reputation</div>
      <h2 className="text-white text-2xl mt-2 mono">On-chain proof of performance</h2>
      <p className="text-white/40 text-sm mt-1 mb-6">
        Every completed campaign mints +10 REP. Portable across every future brand.
      </p>

      {/* hero score */}
      <div className="panel p-6 md:p-10 relative overflow-hidden reveal">
        <div className="mono text-[10px] text-white/40 uppercase tracking-[0.3em]">
          reputation_score
        </div>

        <div className="flex items-end justify-between gap-6 mt-4 flex-wrap">
          <div className="flex items-baseline gap-4">
            <div
              className="mono text-rc-green"
              style={{
                fontSize: 'clamp(80px, 16vw, 180px)',
                lineHeight: 0.9,
                letterSpacing: '-0.04em',
                textShadow: '0 0 40px rgba(57,255,20,0.25)',
              }}
            >
              {String(rep.score).padStart(3, '0')}
            </div>
            <div className="mono text-rc-green/60 text-xs tracking-[0.4em] uppercase pb-3">
              rep
            </div>
          </div>

          <div className="text-right mono text-[10px] text-white/30 leading-relaxed">
            <div>address</div>
            <div className="text-white/70 mt-0.5">
              {wallet.address.slice(0, 6)}…{wallet.address.slice(-4)}
            </div>
            <div className="mt-3">formula</div>
            <div className="text-white/50 mt-0.5">completed × 10</div>
          </div>
        </div>

        {/* tick marks decoration */}
        <div className="absolute bottom-0 left-0 right-0 h-1 flex">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="flex-1"
              style={{
                background:
                  i < Math.min(rep.score, 40)
                    ? '#39FF14'
                    : 'rgba(255,255,255,0.08)',
                marginRight: i < 39 ? 2 : 0,
              }}
            />
          ))}
        </div>
      </div>

      {/* stats row */}
      <div className="grid sm:grid-cols-3 gap-4 mt-4">
        <Stat label="campaigns_completed" value={rep.campaignsCompleted} />
        <Stat
          label="total_earned"
          value={`${formatEther(rep.totalEarned)} MON`}
          sub="net of 5% fee"
          accent="green"
        />
        <Stat
          label="total_spent"
          value={`${formatEther(rep.totalSpent)} MON`}
          sub="gross escrowed"
        />
      </div>

      {/* history breakdown */}
      <div className="grid md:grid-cols-2 gap-4 mt-6">
        <Sidebar title="as influencer" rows={asInfluencer} emptyLabel="No campaigns accepted yet." />
        <Sidebar title="as brand" rows={asBrand} emptyLabel="No campaigns posted yet." />
      </div>
    </section>
  )
}

function Stat({ label, value, sub, accent }) {
  const color =
    accent === 'green' ? 'text-rc-green' : accent === 'purple' ? 'text-rc-purple' : 'text-white'
  return (
    <div className="panel p-5">
      <div className="mono text-[10px] text-white/30 uppercase tracking-[0.2em]">{label}</div>
      <div className={`mono text-xl mt-2 ${color}`}>{value}</div>
      {sub && <div className="mono text-[10px] text-white/30 mt-1">// {sub}</div>}
    </div>
  )
}

function Sidebar({ title, rows, emptyLabel }) {
  return (
    <div className="panel p-5">
      <div className="mono text-[10px] text-white/40 uppercase tracking-[0.25em] mb-3">
        // {title}
      </div>
      {rows.length === 0 ? (
        <div className="mono text-xs text-white/30 py-3">{emptyLabel}</div>
      ) : (
        <ul className="divide-y divide-rc-border">
          {rows.slice(0, 6).map((c) => (
            <li key={c.id} className="py-2.5 flex items-center justify-between gap-4">
              <span className="mono text-xs text-white/60 truncate">
                #{String(c.id).padStart(3, '0')} · {c.briefHash?.slice(0, 42) || '—'}
                {c.briefHash && c.briefHash.length > 42 ? '…' : ''}
              </span>
              <span
                className={`mono text-[10px] uppercase tracking-widest shrink-0 ${
                  c.status === 2
                    ? 'text-rc-green'
                    : c.status === 1
                    ? 'text-rc-purple'
                    : c.status === 0
                    ? 'text-yellow-400'
                    : 'text-red-400'
                }`}
              >
                {['open', 'active', 'done', 'disputed'][c.status]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
