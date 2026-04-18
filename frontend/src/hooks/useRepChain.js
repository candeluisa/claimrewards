import { useCallback, useEffect, useRef, useState } from 'react'
import { Contract, JsonRpcProvider, parseEther } from 'ethers'
import { ABI, CONTRACT_ADDRESS, MONAD_RPC } from '../constants/contract'

function normalize(c) {
  return {
    id: Number(c.id),
    brand: c.brand,
    influencer: c.influencer,
    budget: c.budget,
    briefHash: c.briefHash,
    deliverableHash: c.deliverableHash,
    deadline: Number(c.deadline),
    status: Number(c.status),
  }
}

/**
 * Reads from a public Monad RPC so the feed loads even without a connected wallet.
 * Writes go through the injected provider's signer.
 */
export function useRepChain(provider, address, wrongNetwork) {
  const [campaigns, setCampaigns] = useState([])
  const [reputation, setReputation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const fallbackProvider = useRef(null)

  if (!fallbackProvider.current) {
    fallbackProvider.current = new JsonRpcProvider(MONAD_RPC)
  }

  const hasDeployment =
    typeof CONTRACT_ADDRESS === 'string' && CONTRACT_ADDRESS.startsWith('0x') && CONTRACT_ADDRESS.length === 42

  const readContract = useCallback(() => {
    if (!hasDeployment) return null
    const p = provider && !wrongNetwork ? provider : fallbackProvider.current
    return new Contract(CONTRACT_ADDRESS, ABI, p)
  }, [provider, wrongNetwork, hasDeployment])

  const writeContract = useCallback(async () => {
    if (!hasDeployment) throw new Error('Contract address not set. Update VITE_CONTRACT_ADDRESS.')
    if (!provider) throw new Error('Connect wallet first.')
    const signer = await provider.getSigner()
    return new Contract(CONTRACT_ADDRESS, ABI, signer)
  }, [provider, hasDeployment])

  const refresh = useCallback(async () => {
    const c = readContract()
    if (!c) {
      setLoading(false)
      setError(hasDeployment ? null : 'Deploy the contract and set VITE_CONTRACT_ADDRESS in frontend/.env')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const list = await c.getAllCampaigns()
      setCampaigns(list.map(normalize))
      if (address) {
        const r = await c.getReputation(address)
        setReputation({
          campaignsCompleted: Number(r.campaignsCompleted),
          totalEarned: r.totalEarned,
          totalSpent: r.totalSpent,
          score: Number(r.score),
        })
      } else {
        setReputation(null)
      }
    } catch (e) {
      console.error('refresh failed:', e)
      setError(e?.shortMessage || e?.message || 'read failed')
    } finally {
      setLoading(false)
    }
  }, [readContract, address, hasDeployment])

  useEffect(() => {
    refresh()
  }, [refresh])

  // periodic auto-refresh (30s) so multiple wallets see each other during demos
  useEffect(() => {
    const id = setInterval(() => {
      refresh()
    }, 30_000)
    return () => clearInterval(id)
  }, [refresh])

  const createCampaign = useCallback(async (briefHash, deadline, budgetMon) => {
    const c = await writeContract()
    const tx = await c.createCampaign(briefHash, deadline, {
      value: parseEther(String(budgetMon)),
    })
    await tx.wait()
    await refresh()
    return tx.hash
  }, [writeContract, refresh])

  const acceptCampaign = useCallback(async (id) => {
    const c = await writeContract()
    const tx = await c.acceptCampaign(id)
    await tx.wait()
    await refresh()
    return tx.hash
  }, [writeContract, refresh])

  const submitDelivery = useCallback(async (id, hash) => {
    const c = await writeContract()
    const tx = await c.submitDelivery(id, hash)
    await tx.wait()
    await refresh()
    return tx.hash
  }, [writeContract, refresh])

  const confirmDelivery = useCallback(async (id) => {
    const c = await writeContract()
    const tx = await c.confirmDelivery(id)
    await tx.wait()
    await refresh()
    return tx.hash
  }, [writeContract, refresh])

  return {
    campaigns,
    reputation,
    loading,
    error,
    hasDeployment,
    refresh,
    createCampaign,
    acceptCampaign,
    submitDelivery,
    confirmDelivery,
  }
}
