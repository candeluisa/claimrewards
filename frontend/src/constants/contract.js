// Paste your deployed contract address into VITE_CONTRACT_ADDRESS (.env)
// or replace the placeholder below.
export const CONTRACT_ADDRESS =
  import.meta.env.VITE_CONTRACT_ADDRESS || '[DEPLOYED_ADDRESS]'

export const MONAD_CHAIN_ID = 10143
export const MONAD_CHAIN_ID_HEX = '0x' + MONAD_CHAIN_ID.toString(16)
export const MONAD_RPC = 'https://testnet-rpc.monad.xyz'
export const MONAD_EXPLORER = 'https://testnet.monadexplorer.com'

export const MONAD_PARAMS = {
  chainId: MONAD_CHAIN_ID_HEX,
  chainName: 'Monad Testnet',
  nativeCurrency: { name: 'Monad', symbol: 'MON', decimals: 18 },
  rpcUrls: [MONAD_RPC],
  blockExplorerUrls: [MONAD_EXPLORER],
}

export const STATUS_LABEL = ['OPEN', 'ACTIVE', 'COMPLETED', 'DISPUTED']

// Human-readable ABI — parsed by ethers.js v6 at runtime.
export const ABI = [
  'function createCampaign(string briefHash, uint256 deadline) external payable returns (uint256)',
  'function acceptCampaign(uint256 campaignId) external',
  'function submitDelivery(uint256 campaignId, string deliverableHash) external',
  'function confirmDelivery(uint256 campaignId) external',
  'function getCampaign(uint256 campaignId) external view returns (tuple(uint256 id, address brand, address influencer, uint256 budget, string briefHash, string deliverableHash, uint256 deadline, uint8 status))',
  'function getReputation(address user) external view returns (tuple(uint256 campaignsCompleted, uint256 totalEarned, uint256 totalSpent, uint256 score))',
  'function getAllCampaigns() external view returns (tuple(uint256 id, address brand, address influencer, uint256 budget, string briefHash, string deliverableHash, uint256 deadline, uint8 status)[])',
  'function totalCampaigns() external view returns (uint256)',
  'function feeCollector() external view returns (address)',
  'event CampaignCreated(uint256 indexed id, address indexed brand, uint256 budget)',
  'event CampaignAccepted(uint256 indexed id, address indexed influencer)',
  'event DeliverySubmitted(uint256 indexed id, string deliverableHash)',
  'event DeliveryConfirmed(uint256 indexed id, address influencer, uint256 amount)',
]
