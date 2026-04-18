import { useState } from 'react'
import { MONAD_EXPLORER } from '../constants/contract.js'

function defaultDeadline() {
  const d = new Date(Date.now() + 7 * 86400 * 1000)
  // trim to minute precision, strip seconds+tz for datetime-local
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function PostCampaign({ wallet, rc }) {
  const [brief, setBrief] = useState('')
  const [budget, setBudget] = useState('0.1')
  const [deadline, setDeadline] = useState(defaultDeadline())
  const [busy, setBusy] = useState(false)
  const [txHash, setTxHash] = useState(null)
  const [error, setError] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setTxHash(null)
    if (!wallet.address) return wallet.connect()
    if (wallet.wrongNetwork) return wallet.switchToMonad()
    if (!brief.trim()) return setError('brief is empty')
    const b = Number(budget)
    if (!Number.isFinite(b) || b <= 0) return setError('budget must be > 0 MON')
    const deadlineTs = Math.floor(new Date(deadline).getTime() / 1000)
    if (!deadlineTs || deadlineTs <= Math.floor(Date.now() / 1000)) {
      return setError('deadline must be in the future')
    }
    setBusy(true)
    try {
      const hash = await rc.createCampaign(brief.trim(), deadlineTs, budget)
      setTxHash(hash)
      setBrief('')
      setBudget('0.1')
      setDeadline(defaultDeadline())
    } catch (e) {
      setError(e?.shortMessage || e?.info?.error?.message || e?.message || 'tx failed')
    } finally {
      setBusy(false)
    }
  }

  const fee = Number(budget || 0) * 0.05
  const payout = Number(budget || 0) * 0.95

  return (
    <section className="grid md:grid-cols-[1fr_280px] gap-6 items-start">
      <div className="max-w-2xl w-full">
        <div className="mono text-[11px] text-white/40 uppercase tracking-[0.3em]">// new_campaign</div>
        <h2 className="text-white text-2xl mt-2 mono">Deploy a campaign to the protocol</h2>
        <p className="text-white/40 text-sm mt-1 mb-6">
          Budget is escrowed by the contract until you confirm delivery.
        </p>

        <form onSubmit={submit} className="panel panel-accent p-6 flex flex-col gap-5 relative">
          <Field label="brief" hint="what the influencer must deliver">
            <textarea
              className="input min-h-[130px] resize-y"
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="Post a 60-second Reel featuring TokenXYZ, tag @tokenxyz, disclose #ad. Deliver link to post before deadline."
            />
          </Field>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="budget" hint="MON · escrowed on create">
              <input
                type="number"
                step="0.001"
                min="0"
                className="input"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="0.1"
              />
            </Field>
            <Field label="deadline" hint="delivery cutoff">
              <input
                type="datetime-local"
                className="input"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </Field>
          </div>

          {error && (
            <div className="mono text-xs text-red-400 border border-red-400/40 bg-red-400/5 px-3 py-2">
              ! {error}
            </div>
          )}

          <button disabled={busy} className="btn-primary self-start px-6">
            {busy ? <><span className="spinner" />deploying campaign…</> : 'launch campaign ↗'}
          </button>

          {txHash && (
            <div className="mono text-xs panel !border-rc-green/50 p-3 reveal">
              <div className="text-rc-green uppercase text-[10px] tracking-[0.2em] mb-1">
                ✓ tx_confirmed
              </div>
              <a
                href={`${MONAD_EXPLORER}/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
                className="text-white/80 hover:text-white underline break-all"
              >
                {txHash}
              </a>
            </div>
          )}
        </form>
      </div>

      {/* fee preview */}
      <aside className="panel p-5 sticky top-24">
        <div className="mono text-[10px] text-white/40 uppercase tracking-[0.2em] mb-3">
          // payout_breakdown
        </div>
        <Row label="budget escrowed" value={`${Number(budget || 0).toFixed(4)} MON`} />
        <Row label="protocol fee (5%)" value={`${fee.toFixed(4)} MON`} dim />
        <div className="border-t border-rc-border my-3" />
        <Row label="influencer payout" value={`${payout.toFixed(4)} MON`} green />
        <div className="mt-4 mono text-[10px] text-white/30 leading-relaxed">
          fee released atomically on <span className="text-white/60">confirmDelivery</span>. no payout if
          never confirmed.
        </div>
      </aside>
    </section>
  )
}

function Field({ label, hint, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <div className="mono text-[10px] text-white/50 uppercase tracking-[0.2em]">
        {label}
        {hint && <span className="text-white/25 normal-case ml-2">// {hint}</span>}
      </div>
      {children}
    </label>
  )
}

function Row({ label, value, green, dim }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="mono text-[11px] text-white/50 uppercase tracking-widest">{label}</span>
      <span className={`mono text-sm ${green ? 'text-rc-green' : dim ? 'text-white/50' : 'text-white'}`}>
        {value}
      </span>
    </div>
  )
}
