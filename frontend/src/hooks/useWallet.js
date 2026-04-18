import { useCallback, useEffect, useState } from 'react'
import { BrowserProvider } from 'ethers'
import { MONAD_CHAIN_ID, MONAD_CHAIN_ID_HEX, MONAD_PARAMS } from '../constants/contract'

export function useWallet() {
  const [address, setAddress] = useState(null)
  const [chainId, setChainId] = useState(null)
  const [provider, setProvider] = useState(null)
  const [connecting, setConnecting] = useState(false)

  const hydrate = useCallback(async () => {
    if (!window.ethereum) return
    const bp = new BrowserProvider(window.ethereum)
    setProvider(bp)
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' })
      if (accounts?.[0]) setAddress(accounts[0])
      const cidHex = await window.ethereum.request({ method: 'eth_chainId' })
      setChainId(parseInt(cidHex, 16))
    } catch (e) {
      console.error('hydrate failed:', e)
    }
  }, [])

  const switchToMonad = useCallback(async () => {
    if (!window.ethereum) return
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: MONAD_CHAIN_ID_HEX }],
      })
    } catch (err) {
      // 4902 = chain not added
      if (err?.code === 4902 || String(err?.message || '').includes('Unrecognized chain')) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [MONAD_PARAMS],
          })
        } catch (addErr) {
          console.error('add chain failed:', addErr)
        }
      } else {
        console.error('switch failed:', err)
      }
    }
  }, [])

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      alert('MetaMask not detected. Install MetaMask to use RepChain.')
      return
    }
    setConnecting(true)
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      setAddress(accounts[0])
      const cidHex = await window.ethereum.request({ method: 'eth_chainId' })
      const cid = parseInt(cidHex, 16)
      setChainId(cid)
      if (cid !== MONAD_CHAIN_ID) await switchToMonad()
      setProvider(new BrowserProvider(window.ethereum))
    } catch (e) {
      console.error('connect failed:', e)
    } finally {
      setConnecting(false)
    }
  }, [switchToMonad])

  useEffect(() => {
    hydrate()
    if (!window.ethereum) return
    const onAccounts = (accounts) => setAddress(accounts?.[0] || null)
    const onChain = (hex) => {
      setChainId(parseInt(hex, 16))
      setProvider(new BrowserProvider(window.ethereum))
    }
    window.ethereum.on?.('accountsChanged', onAccounts)
    window.ethereum.on?.('chainChanged', onChain)
    return () => {
      window.ethereum.removeListener?.('accountsChanged', onAccounts)
      window.ethereum.removeListener?.('chainChanged', onChain)
    }
  }, [hydrate])

  const wrongNetwork = !!address && chainId !== null && chainId !== MONAD_CHAIN_ID

  return { address, chainId, provider, connect, connecting, switchToMonad, wrongNetwork }
}
