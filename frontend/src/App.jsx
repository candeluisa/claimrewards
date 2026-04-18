import { useState } from 'react'
import Header from './components/Header.jsx'
import CampaignList from './components/CampaignList.jsx'
import PostCampaign from './components/PostCampaign.jsx'
import MyReputation from './components/MyReputation.jsx'
import { useWallet } from './hooks/useWallet.js'
import { useRepChain } from './hooks/useRepChain.js'
import { CONTRACT_ADDRESS } from './constants/contract.js'

const TABS = [
  { id: 'campaigns', label: 'campaigns' },
  { id: 'post', label: 'post_campaign' },
  { id: 'rep', label: 'my_reputation' },
]

export default function App() {
  const [tab, setTab] = useState('campaigns')
  const wallet = useWallet()
  const rc = useRepChain(wallet.provider, wallet.address, wallet.wrongNetwork)

  const needsDeploy =
    !CONTRACT_ADDRESS.startsWith('0x') || CONTRACT_ADDRESS.length !== 42

  return (
    <div className="min-h-screen flex flex-col">
      <Header wallet={wallet} />

      <nav className="border-b border-rc-border sticky top-0 bg-rc-bg/90 backdrop-blur-sm z-10">
        <div className="max-w-6xl mx-auto flex items-stretch">
          {TABS.map((t, i) => {
            const active = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`mono uppercase text-[11px] tracking-[0.15em] px-6 py-4 border-r border-rc-border transition-colors relative ${
                  active ? 'text-white bg-[#111]' : 'text-white/40 hover:text-white/80'
                }`}
              >
                <span className="text-white/20 mr-2">0{i + 1}</span>
                {t.label}
                {active && (
                  <span className="absolute left-0 right-0 bottom-0 h-[2px] bg-rc-purple" />
                )}
              </button>
            )
          })}
          <div className="flex-1 border-r border-rc-border" />
          <div className="hidden md:flex items-center px-6 mono text-[10px] text-white/30 tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-rc-green pulse-green mr-2" />
            LIVE · MONAD_TESTNET
          </div>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-8">
        {needsDeploy && (
          <div className="panel border-yellow-500/40 p-4 mb-6 reveal">
            <div className="mono text-[10px] text-yellow-500 uppercase tracking-widest mb-1">! config_required</div>
            <div className="text-sm text-white/80">
              Deploy <span className="mono">RepChain.sol</span> and set{' '}
              <span className="mono text-rc-purple">VITE_CONTRACT_ADDRESS</span> in{' '}
              <span className="mono">frontend/.env</span>. The UI is live-wired — it'll connect as soon as the address resolves.
            </div>
          </div>
        )}

        {wallet.wrongNetwork && (
          <div className="panel border-yellow-500/40 p-3 mb-6 mono text-xs flex items-center justify-between reveal">
            <span className="text-yellow-500">! wrong_network // switch to monad testnet (chain_id 10143)</span>
            <button onClick={wallet.switchToMonad} className="btn-ghost">switch</button>
          </div>
        )}

        {rc.error && (
          <div className="panel border-red-500/30 p-3 mb-6 mono text-xs text-red-400 reveal">
            ! {rc.error}
          </div>
        )}

        <div key={tab} className="reveal">
          {tab === 'campaigns' && <CampaignList wallet={wallet} rc={rc} />}
          {tab === 'post' && <PostCampaign wallet={wallet} rc={rc} />}
          {tab === 'rep' && <MyReputation wallet={wallet} rc={rc} />}
        </div>
      </main>

      <footer className="border-t border-rc-border mt-8">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-2 mono text-[10px] text-white/30 tracking-widest uppercase">
          <span>claimrewards // 0x_escrow_protocol // v0.1.0</span>
          <span>
            contract:{' '}
            {CONTRACT_ADDRESS.startsWith('0x') ? (
              <a
                className="text-white/50 hover:text-rc-purple"
                target="_blank"
                rel="noreferrer"
                href={`https://testnet.monadexplorer.com/address/${CONTRACT_ADDRESS}`}
              >
                {CONTRACT_ADDRESS.slice(0, 6)}…{CONTRACT_ADDRESS.slice(-4)}
              </a>
            ) : (
              <span className="text-white/30">[not_deployed]</span>
            )}
          </span>
        </div>
      </footer>
    </div>
  )
}
