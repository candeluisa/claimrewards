import { useMemo, useState } from 'react'
import CampaignCard from './CampaignCard.jsx'

const FILTERS = [
  { id: 'all', label: 'all' },
  { id: 'open', label: 'open', status: 0 },
  { id: 'active', label: 'active', status: 1 },
  { id: 'done', label: 'completed', status: 2 },
]

export default function CampaignList({ wallet, rc }) {
  const [filter, setFilter] = useState('all')

  const filtered = useMemo(() => {
    const f = FILTERS.find((x) => x.id === filter)
    const list = [...rc.campaigns].sort((a, b) => b.id - a.id)
    if (!f || f.status === undefined) return list
    return list.filter((c) => c.status === f.status)
  }, [rc.campaigns, filter])

  return (
    <section>
      <div className="flex items-end justify-between mb-6 gap-4 flex-wrap">
        <div>
          <div className="mono text-[11px] text-white/40 uppercase tracking-[0.3em]">// active_feed</div>
          <h2 className="text-white text-2xl mt-2 mono">All campaigns on-chain</h2>
          <p className="text-white/40 text-sm mt-1">
            Pulled live from Monad testnet. Up to 50 campaigns per read.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={rc.refresh} className="btn-ghost" disabled={rc.loading}>
            {rc.loading ? <><span className="spinner" /> syncing</> : '↻ refresh'}
          </button>
          <div className="mono text-[11px] text-white/30 tracking-widest">
            [{String(rc.campaigns.length).padStart(3, '0')}] records
          </div>
        </div>
      </div>

      {/* filters */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {FILTERS.map((f) => {
          const active = filter === f.id
          const count =
            f.status === undefined
              ? rc.campaigns.length
              : rc.campaigns.filter((c) => c.status === f.status).length
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`mono text-[11px] uppercase tracking-widest px-3 py-1.5 border transition-colors ${
                active
                  ? 'border-rc-purple text-white bg-rc-purple/15'
                  : 'border-rc-border text-white/50 hover:text-white/80 hover:border-white/30'
              }`}
            >
              {f.label} <span className="text-white/30 ml-1">· {count}</span>
            </button>
          )
        })}
      </div>

      {rc.loading && rc.campaigns.length === 0 && (
        <div className="panel p-10 text-center mono text-white/40 text-sm reveal">
          <span className="spinner mr-2" /> fetching chain state…
        </div>
      )}

      {!rc.loading && filtered.length === 0 && (
        <div className="panel p-14 text-center reveal">
          <div className="mono text-white/30 text-[11px] tracking-widest">NO_CAMPAIGNS_FOUND</div>
          <div className="mt-2 text-white/60 text-sm">
            {rc.campaigns.length === 0
              ? 'Be the first to post a campaign — switch to the Post Campaign tab.'
              : 'No campaigns match this filter.'}
          </div>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((c) => (
            <CampaignCard key={c.id} c={c} wallet={wallet} rc={rc} />
          ))}
        </div>
      )}
    </section>
  )
}
