// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title RepChain — trustless influencer campaign escrow + on-chain reputation
/// @notice Single-contract campaign lifecycle: create (escrow) → accept → submit → confirm (payout + rep).
contract RepChain {
    enum Status { Open, Active, Completed, Disputed }

    struct Campaign {
        uint256 id;
        address brand;
        address influencer;
        uint256 budget;           // in wei (native MON)
        string briefHash;         // IPFS hash or plain brief text
        string deliverableHash;   // proof-of-delivery (URL / IPFS hash)
        uint256 deadline;         // unix timestamp
        Status status;
    }

    struct Reputation {
        uint256 campaignsCompleted;
        uint256 totalEarned;
        uint256 totalSpent;
        uint256 score;
    }

    address public immutable feeCollector;
    uint256 public constant FEE_BPS = 500;        // 5.00%
    uint256 public constant BPS_DENOM = 10_000;

    uint256 public nextCampaignId;
    uint256[] private _campaignIds;
    mapping(uint256 => Campaign) private _campaigns;
    mapping(address => Reputation) private _reputations;

    event CampaignCreated(uint256 indexed id, address indexed brand, uint256 budget);
    event CampaignAccepted(uint256 indexed id, address indexed influencer);
    event DeliverySubmitted(uint256 indexed id, string deliverableHash);
    event DeliveryConfirmed(uint256 indexed id, address influencer, uint256 amount);

    error ZeroBudget();
    error DeadlineInPast();
    error CampaignNotFound();
    error InvalidStatus();
    error NotBrand();
    error NotInfluencer();
    error BrandCannotAcceptOwn();
    error DeliveryMissing();
    error TransferFailed();
    error ZeroFeeCollector();

    constructor(address _feeCollector) {
        if (_feeCollector == address(0)) revert ZeroFeeCollector();
        feeCollector = _feeCollector;
    }

    function createCampaign(string calldata briefHash, uint256 deadline)
        external
        payable
        returns (uint256 campaignId)
    {
        if (msg.value == 0) revert ZeroBudget();
        if (deadline <= block.timestamp) revert DeadlineInPast();

        campaignId = nextCampaignId++;
        _campaigns[campaignId] = Campaign({
            id: campaignId,
            brand: msg.sender,
            influencer: address(0),
            budget: msg.value,
            briefHash: briefHash,
            deliverableHash: "",
            deadline: deadline,
            status: Status.Open
        });
        _campaignIds.push(campaignId);

        emit CampaignCreated(campaignId, msg.sender, msg.value);
    }

    function acceptCampaign(uint256 campaignId) external {
        Campaign storage c = _load(campaignId);
        if (c.status != Status.Open) revert InvalidStatus();
        if (msg.sender == c.brand) revert BrandCannotAcceptOwn();

        c.influencer = msg.sender;
        c.status = Status.Active;
        emit CampaignAccepted(campaignId, msg.sender);
    }

    function submitDelivery(uint256 campaignId, string calldata deliverableHash) external {
        Campaign storage c = _load(campaignId);
        if (msg.sender != c.influencer) revert NotInfluencer();
        if (c.status != Status.Active) revert InvalidStatus();

        c.deliverableHash = deliverableHash;
        emit DeliverySubmitted(campaignId, deliverableHash);
    }

    function confirmDelivery(uint256 campaignId) external {
        Campaign storage c = _load(campaignId);
        if (msg.sender != c.brand) revert NotBrand();
        if (c.status != Status.Active) revert InvalidStatus();
        if (bytes(c.deliverableHash).length == 0) revert DeliveryMissing();

        c.status = Status.Completed;

        uint256 fee = (c.budget * FEE_BPS) / BPS_DENOM;
        uint256 payout = c.budget - fee;

        Reputation storage infRep = _reputations[c.influencer];
        infRep.campaignsCompleted += 1;
        infRep.totalEarned += payout;
        infRep.score = infRep.campaignsCompleted * 10;

        Reputation storage brandRep = _reputations[c.brand];
        brandRep.campaignsCompleted += 1;
        brandRep.totalSpent += c.budget;
        brandRep.score = brandRep.campaignsCompleted * 10;

        (bool okInf, ) = payable(c.influencer).call{value: payout}("");
        if (!okInf) revert TransferFailed();
        (bool okFee, ) = payable(feeCollector).call{value: fee}("");
        if (!okFee) revert TransferFailed();

        emit DeliveryConfirmed(campaignId, c.influencer, payout);
    }

    function getCampaign(uint256 campaignId) external view returns (Campaign memory) {
        return _load(campaignId);
    }

    function getReputation(address user) external view returns (Reputation memory) {
        return _reputations[user];
    }

    function getAllCampaigns() external view returns (Campaign[] memory out) {
        uint256 len = _campaignIds.length;
        out = new Campaign[](len);
        for (uint256 i = 0; i < len; i++) {
            out[i] = _campaigns[_campaignIds[i]];
        }
    }

    function totalCampaigns() external view returns (uint256) {
        return _campaignIds.length;
    }

    function _load(uint256 campaignId) internal view returns (Campaign storage c) {
        c = _campaigns[campaignId];
        if (c.brand == address(0)) revert CampaignNotFound();
    }
}
