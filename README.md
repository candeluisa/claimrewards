# RepChain

Trustless influencer campaign marketplace for LATAM crypto brands + nano-influencers. Escrow, delivery attestation, and portable reputation — all settled on Monad in one transaction per step.

---

## Problem → Solution

**Problem.** Nano-influencers in LATAM can't prove past performance to brands, and brands have no way to pay conditionally on delivery. Traditional marketplaces charge 20–30% and can still exit-scam either side.

**Solution.** RepChain escrows the campaign budget in a smart contract. Influencer accepts → submits proof → brand confirms → funds release atomically. Both sides earn an on-chain reputation score (`score = completed × 10`) that travels across every future deal.

---

## Why Monad

LATAM campaigns are small — $2 to $50 typical spend per nano-influencer. Mainnet gas would eat 30–60% of a $5 budget on a single tx. Monad's low fees + fast finality are what make **sub-$5 micro-campaigns economically viable on-chain at all**. This isn't a nice-to-have optimization — it's the only reason the product can exist.

---

## Stack

- Solidity `^0.8.24` · Foundry
- React + Vite + Tailwind
- ethers.js v6
- Monad testnet (chainId `10143`, RPC `https://testnet-rpc.monad.xyz`)

---

## File layout

```
repchain/
├── contracts/RepChain.sol         # single-contract protocol
├── script/Deploy.s.sol            # Foundry deploy script
├── foundry.toml
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── index.css
│   │   ├── components/
│   │   │   ├── Header.jsx
│   │   │   ├── CampaignCard.jsx
│   │   │   ├── CampaignList.jsx
│   │   │   ├── PostCampaign.jsx
│   │   │   └── MyReputation.jsx
│   │   ├── hooks/
│   │   │   ├── useWallet.js
│   │   │   └── useRepChain.js
│   │   └── constants/contract.js  # ABI + chain + address placeholder
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
└── README.md
```

---

## 1 · Deploy the contract

Install Foundry (one-time):

```bash
curl -L https://foundry.paradigm.xyz | bash && foundryup
```

Install `forge-std` so the deploy script compiles:

```bash
cd repchain
forge install foundry-rs/forge-std --no-commit
```

### Option A — one-liner

```bash
export PRIVATE_KEY=0xYourTestnetKey
forge create --rpc-url https://testnet-rpc.monad.xyz \
  --private-key $PRIVATE_KEY \
  contracts/RepChain.sol:RepChain \
  --constructor-args 0xYourFeeCollectorAddress
```

### Option B — via deploy script

```bash
export PRIVATE_KEY=0xYourTestnetKey
export FEE_COLLECTOR=0xYourFeeCollectorAddress
forge script script/Deploy.s.sol:Deploy \
  --rpc-url monad_testnet \
  --broadcast
```

Copy the printed address. You'll paste it in step 2.

---

## 2 · Run the frontend

```bash
cd frontend
npm install
echo "VITE_CONTRACT_ADDRESS=0xYourDeployedAddressHere" > .env
npm run dev
```

Open `http://localhost:5173`. Connect MetaMask — the app auto-prompts to add/switch to Monad testnet. Get testnet MON from the [Monad faucet](https://faucet.monad.xyz) before interacting.

---

## Deployed contract

`0x6a2AC3Df2707665AaC3Ef34173cdbEFA543ce49E` → explorer: https://testnet.monadexplorer.com/address/0x6a2AC3Df2707665AaC3Ef34173cdbEFA543ce49E

Deployed on Monad testnet. Fee collector: `0x71FD066F7Bf5972d9e290f19D64ee94Af8BD94e2`.

---

## Revenue model

**5% protocol fee** on `confirmDelivery`. Deducted in `wei` from the escrowed budget and forwarded in the same tx to the `feeCollector` address set in the constructor. The influencer receives the remaining **95%**. Fee is immutable post-deploy.

Example: 0.100 MON budget → **0.095 MON** to influencer, **0.005 MON** to feeCollector.

---

## Demo flow (≤ 90 seconds)

1. **Brand** wallet connects → Post Campaign → 0.1 MON budget → `createCampaign()` tx confirms.
2. **Influencer** wallet (different account) connects → clicks Accept on the new campaign card.
3. Influencer pastes a delivery URL → Submit Delivery.
4. Brand clicks Confirm Delivery → escrow releases atomically.
5. Influencer wallet receives **0.095 MON**; feeCollector receives **0.005 MON**.
6. Both wallets see updated **Reputation Score** on Tab 3.

Everything is on-chain. No backend. No indexer. One `getAllCampaigns()` read powers the feed.

---

## Contract interface

```solidity
function createCampaign(string briefHash, uint256 deadline) external payable returns (uint256)
function acceptCampaign(uint256 campaignId) external
function submitDelivery(uint256 campaignId, string deliverableHash) external
function confirmDelivery(uint256 campaignId) external
function getCampaign(uint256 campaignId) external view returns (Campaign memory)
function getReputation(address user) external view returns (Reputation memory)
function getAllCampaigns() external view returns (Campaign[] memory)
```

Events: `CampaignCreated`, `CampaignAccepted`, `DeliverySubmitted`, `DeliveryConfirmed`.

---

## Known limits (hackathon scope)

- `getAllCampaigns()` is an unbounded loop — fine for ≤ 50 demo campaigns, must be paginated for production.
- No dispute resolution yet (`Status.Disputed` is reserved but not wired). v2 adds brand-declined + community arbitration.
- No off-chain storage — `briefHash` and `deliverableHash` are stored as plain strings; swap for real IPFS CIDs in production.

---

## License

MIT
