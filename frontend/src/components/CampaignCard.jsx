import { useState, useEffect } from 'react'
import { formatEther } from 'ethers'
import { STATUS_LABEL } from '../constants/contract.js'

const STATUS_STYLES = [
  'text-yellow-400 border-yellow-400/50 bg-yellow-400/5',      // Open
  'text-rc-purple border-rc-purple/50 bg-rc-purple/5',         // Active
  'text-rc-green border-rc-green/50 bg-rc-green/5',            // Completed
  'text-red-400 border-red-400/50 bg-red-400/5',               // Disputed
]

const ZERO = '0x0000000000000000000000000000000000000000'
const short = (a) =>
  a && a.toLowerCase() !== ZERO ? `${a.slice(0, 6)}…${a.slice(-4)}` : '—'

function Countdown({ deadline }) {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000))
  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 30_000)
    return () => clearInterval(id)
  }, [])
  const diff = deadline - now
  if (diff <= 0) return <span className="text-red-400">expired</span>
  const d = Math.floor(diff / 86400)
  const h = Math.floor((diff % 86400) / 3600)
  const m = Math.floor((diff % 3600) / 60)
  if (d > 0) return <span>{d}d {h}h</span>
  if (h > 0) return <span>{h}h {m}m</span>
  return <span>{m}m</span>
}

export default function CampaignCard({ c, wallet, rc }) {
  const [busy, setBusy] = useState(false)
  const [deliverable, setDeliverable] = useState('')
  const [txHash, setTxHash] = useState(null)

  const addr = wallet.address?.toLowerCase()
  const isBrand = addr && addr === c.brand.toLowerCase()
  const isInfluencer = addr && c.influencer && addr === c.influencer.toLowerCase()

  const guard = async (fn) => {
    if (!wallet.address) return wallet.connect()
    if (wallet.wrongNetwork) return wallet.switchToMonad()
    setBusy(true)
    setTxHash(null)
    try {
      const hash = await fn()
      setTxHash(hash)
    } catch (e) {
      alert(e?.shortMessage || e?.info?.error?.message || e?.message || 'transaction failed')
    } finally {
      setBusy(false)
    }
  }

  const deliveryHref = (() => {
    const h = c.deliverableHash?.trim() || ''
    if (!h) return null
    if (h.startsWith('http://') || h.startsWith('https://')) return h
    if (h.startsWith('ipfs://')) return `https://ipfs.io/ipfs/${h.slice(7)}`
    return null
  })()
  const deliveryIsImage = c.deliverableHash?.startsWith('data:image/')

  const onFile = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 80_000) {
      alert('Image too large for on-chain storage. Use < 80KB or paste a link instead.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setDeliverable(String(reader.result))
    reader.readAsDataURL(f)
  }

  return (
    <div className="panel p-5 flex flex-col gap-4 reveal hover:border-white/20 transition-colors">
      {/* header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="mono text-[10px] text-white/30 uppercase tracking-[0.2em]">
            campaign_#{String(c.id).padStart(3, '0')}
          </div>
          <div className="mt-1.5 text-white/90 text-[15px] leading-snug break-words line-clamp-3">
            {c.briefHash || <span className="text-white/30">no brief provided</span>}
          </div>
        </div>
        <div
          className={`mono text-[10px] px-2 py-1 border uppercase tracking-[0.15em] shrink-0 ${STATUS_STYLES[c.status]}`}
        >
          {STATUS_LABEL[c.status]}
        </div>
      </div>

      {/* stats grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-rc-border pt-4">
        <Stat
          label="budget"
          value={<span className="text-rc-green mono">{formatEther(c.budget)} MON</span>}
        />
        <Stat
          label="deadline"
          value={<span className="mono text-white/80"><Countdown deadline={c.deadline} /></span>}
        />
        <Stat label="brand" value={<span className="mono text-white/70">{short(c.brand)}</span>} />
        <Stat
          label="influencer"
          value={<span className="mono text-white/70">{short(c.influencer)}</span>}
        />
      </div>

      {/* delivery proof */}
      {c.deliverableHash && (
        <div className="border-t border-rc-border pt-3">
          <div className="mono text-[10px] text-white/30 uppercase tracking-[0.2em] mb-1.5">
            delivery_proof
          </div>
          {deliveryIsImage ? (
            <img
              src={c.deliverableHash}
              alt="delivery proof"
              className="max-h-48 w-auto border border-rc-border"
            />
          ) : deliveryHref ? (
            <a
              href={deliveryHref}
              target="_blank"
              rel="noreferrer"
              className="mono text-xs text-rc-purple hover:underline break-all"
            >
              {c.deliverableHash}
            </a>
          ) : (
            <div className="mono text-xs text-white/70 break-all">{c.deliverableHash}</div>
          )}
        </div>
      )}

      {/* actions */}
      <div className="flex flex-col gap-2">
        {c.status === 0 && !isBrand && (
          <button
            disabled={busy}
            onClick={() => guard(() => rc.acceptCampaign(c.id))}
            className="btn-primary w-full"
          >
            {busy ? <><span className="spinner" />waiting for tx…</> : 'accept campaign →'}
          </button>
        )}
        {c.status === 0 && isBrand && (
          <div className="mono text-[10px] text-white/30 uppercase tracking-widest border-t border-rc-border pt-3">
            status: awaiting influencer acceptance
          </div>
        )}

        {c.status === 1 && isInfluencer && !c.deliverableHash && (
          <div className="flex flex-col gap-2 border-t border-rc-border pt-3">
            <div className="mono text-[10px] text-white/40 uppercase tracking-[0.2em]">
              attach_proof // link or image
            </div>
            <input
              className="input"
              placeholder="https://x.com/you/status/… or ipfs://…"
              value={deliverable.startsWith('data:') ? '' : deliverable}
              onChange={(e) => setDeliverable(e.target.value)}
            />
            <label className="btn-ghost cursor-pointer text-center">
              {deliverable.startsWith('data:') ? '✓ image attached · replace' : '📎 or upload image (< 80KB)'}
              <input type="file" accept="image/*" className="hidden" onChange={onFile} />
            </label>
            {deliverable.startsWith('data:image/') && (
              <img src={deliverable} alt="preview" className="max-h-32 w-auto border border-rc-border" />
            )}
            <button
              disabled={busy || !deliverable.trim()}
              onClick={() => guard(() => rc.submitDelivery(c.id, deliverable.trim()))}
              className="btn-primary w-full"
            >
              {busy ? <><span className="spinner" />waiting for tx…</> : 'submit delivery →'}
            </button>
          </div>
        )}

        {c.status === 1 && isBrand && c.deliverableHash && (
          <button
            disabled={busy}
            onClick={() => guard(() => rc.confirmDelivery(c.id))}
            className="btn-green w-full"
          >
            {busy ? <><span className="spinner" />releasing escrow…</> : 'confirm // release escrow'}
          </button>
        )}

        {c.status === 1 && isBrand && !c.deliverableHash && (
          <div className="mono text-[10px] text-white/30 uppercase tracking-widest border-t border-rc-border pt-3">
            status: awaiting delivery from influencer
          </div>
        )}
        {c.status === 1 && isInfluencer && c.deliverableHash && (
          <div className="mono text-[10px] text-rc-purple uppercase tracking-widest border-t border-rc-border pt-3">
            delivered · waiting for brand confirmation
          </div>
        )}
        {c.status === 1 && !isBrand && !isInfluencer && (
          <div className="mono text-[10px] text-white/30 uppercase tracking-widest border-t border-rc-border pt-3">
            status: in progress
          </div>
        )}

        {c.status === 2 && (
          <div className="mono text-[10px] text-rc-green uppercase tracking-widest border-t border-rc-border pt-3">
            ✓ settled on-chain · {formatEther((c.budget * 95n) / 100n)} MON paid out
          </div>
        )}

        {txHash && (
          <a
            href={`https://testnet.monadexplorer.com/tx/${txHash}`}
            target="_blank"
            rel="noreferrer"
            className="mono text-[10px] text-rc-green/80 uppercase tracking-widest underline break-all"
          >
            tx: {txHash.slice(0, 10)}…{txHash.slice(-6)} ↗
          </a>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div>
      <div className="mono text-[10px] text-white/30 uppercase tracking-[0.2em]">{label}</div>
      <div className="mt-0.5 text-sm">{value}</div>
    </div>
  )
}
