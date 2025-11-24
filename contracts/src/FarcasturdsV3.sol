// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ERC721} from "lib/openzeppelin-contracts/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "lib/openzeppelin-contracts/contracts/access/Ownable.sol";
import {Pausable} from "lib/openzeppelin-contracts/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "lib/openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";
import {ECDSA} from "lib/openzeppelin-contracts/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "lib/openzeppelin-contracts/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title Farcasturds V3
 * @notice Backend-authorized minting with FID ownership verification
 * @dev Production contract with user-paid minting on Base mainnet
 *
 * Key Features:
 * - Backend signature authorization (prevents griefing)
 * - Payable mint function (users pay in ETH)
 * - Payment forwarding to treasury address
 * - One mint per Farcaster ID (FID)
 * - Non-transferable (soulbound)
 * - Pausable for emergency stops
 * - ReentrancyGuard protection
 * - Configurable mint price
 *
 * Security:
 * - Backend verifies FID ownership via SIWE + Neynar
 * - Backend signs authorization message
 * - Contract verifies signature on-chain
 * - Prevents griefing attacks (minting someone else's FID)
 */
contract FarcasturdsV3 is ERC721, Ownable, Pausable, ReentrancyGuard {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/

    error AlreadyMinted();
    error InsufficientPayment();
    error InvalidFID();
    error InvalidPrice();
    error TransferFailed();
    error NonTransferable();
    error InvalidSignature();
    error SignatureExpired();
    error InvalidTreasuryAddress();

    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/

    event FarcasturdMinted(uint256 indexed fid, address indexed to, uint256 tokenId);
    event MintPriceUpdated(uint256 oldPrice, uint256 newPrice);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event PaymentForwarded(address indexed treasury, uint256 amount);

    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    /// @notice Tracks which FIDs have minted
    mapping(uint256 => bool) public hasMinted;

    /// @notice Tracks which address owns each FID's NFT
    mapping(uint256 => address) public ownerOfFid;

    /// @notice Tracks used authorization signatures to prevent replay
    mapping(bytes32 => bool) public usedAuthorizations;

    /// @notice Price to mint in wei
    uint256 public mintPrice;

    /// @notice Base URI for token metadata
    string private _baseTokenURI;

    /// @notice Counter for total minted supply
    uint256 private _totalMinted;

    /// @notice Treasury address that receives mint payments
    address public treasury;

    /// @notice Authorization expiry time (default 5 minutes)
    uint256 public constant AUTHORIZATION_EXPIRY = 5 minutes;

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Initialize the Farcasturds V3 contract
     * @param baseURI_ Base URI for metadata (e.g., "https://farcasturds.vercel.app/api/metadata/")
     * @param _mintPrice Initial mint price in wei
     * @param _treasury Treasury address to receive payments
     */
    constructor(string memory baseURI_, uint256 _mintPrice, address _treasury)
        ERC721("Farcasturds", "TURD")
        Ownable(msg.sender)
    {
        if (_treasury == address(0)) revert InvalidTreasuryAddress();

        _baseTokenURI = baseURI_;
        mintPrice = _mintPrice;
        treasury = _treasury;

        emit MintPriceUpdated(0, _mintPrice);
        emit TreasuryUpdated(address(0), _treasury);
    }

    /*//////////////////////////////////////////////////////////////
                            MINT FUNCTION
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Mint a Farcasturd NFT with backend authorization
     * @dev Requires valid signature from owner proving FID ownership was verified
     * @param to Address to receive the NFT
     * @param fid Farcaster ID to mint for
     * @param deadline Timestamp when authorization expires
     * @param signature Backend signature authorizing this mint
     */
    function mintFor(
        address to,
        uint256 fid,
        uint256 deadline,
        bytes calldata signature
    )
        external
        payable
        whenNotPaused
        nonReentrant
    {
        // Validate FID
        if (fid == 0) revert InvalidFID();

        // Check if already minted
        if (hasMinted[fid]) revert AlreadyMinted();

        // Check payment
        if (msg.value != mintPrice) revert InsufficientPayment();

        // Check deadline
        if (block.timestamp > deadline) revert SignatureExpired();

        // Verify backend authorization signature
        bytes32 messageHash = keccak256(abi.encodePacked(to, fid, deadline));
        bytes32 authHash = messageHash.toEthSignedMessageHash();

        // Check if signature already used (prevent replay)
        if (usedAuthorizations[authHash]) revert InvalidSignature();

        // Verify signature is from owner (backend)
        address signer = authHash.recover(signature);
        if (signer != owner()) revert InvalidSignature();

        // Mark signature as used
        usedAuthorizations[authHash] = true;

        // Mark as minted
        hasMinted[fid] = true;
        ownerOfFid[fid] = to;

        // Increment total supply
        unchecked {
            ++_totalMinted;
        }

        // Forward payment to treasury
        (bool success, ) = treasury.call{value: msg.value}("");
        if (!success) revert TransferFailed();

        emit PaymentForwarded(treasury, msg.value);

        // Mint NFT (tokenId = fid for easy lookup)
        _safeMint(to, fid);

        emit FarcasturdMinted(fid, to, fid);
    }

    /*//////////////////////////////////////////////////////////////
                         OWNER FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Update the mint price
     * @param newPrice New price in wei
     */
    function setMintPrice(uint256 newPrice) external onlyOwner {
        if (newPrice > 1 ether) revert InvalidPrice(); // Sanity check: max 1 ETH

        uint256 oldPrice = mintPrice;
        mintPrice = newPrice;

        emit MintPriceUpdated(oldPrice, newPrice);
    }

    /**
     * @notice Update the treasury address
     * @param newTreasury New treasury address
     */
    function setTreasury(address newTreasury) external onlyOwner {
        if (newTreasury == address(0)) revert InvalidTreasuryAddress();

        address oldTreasury = treasury;
        treasury = newTreasury;

        emit TreasuryUpdated(oldTreasury, newTreasury);
    }

    /**
     * @notice Update the base URI for metadata
     * @param baseURI_ New base URI
     */
    function setBaseURI(string calldata baseURI_) external onlyOwner {
        _baseTokenURI = baseURI_;
    }

    /**
     * @notice Pause minting in case of emergency
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause minting
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Emergency withdrawal function (should not be needed due to forwarding)
     */
    function emergencyWithdraw() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        if (balance > 0) {
            (bool success, ) = treasury.call{value: balance}("");
            if (!success) revert TransferFailed();
            emit PaymentForwarded(treasury, balance);
        }
    }

    /*//////////////////////////////////////////////////////////////
                          VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Get total number of Farcasturds minted
     */
    function totalSupply() external view returns (uint256) {
        return _totalMinted;
    }

    /**
     * @notice Get base URI for metadata
     */
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    /**
     * @notice Verify an authorization signature (for frontend preview)
     * @param to Address that will receive NFT
     * @param fid Farcaster ID
     * @param deadline Authorization deadline
     * @param signature Backend signature
     * @return bool True if signature is valid
     */
    function verifyAuthorization(
        address to,
        uint256 fid,
        uint256 deadline,
        bytes calldata signature
    ) external view returns (bool) {
        if (block.timestamp > deadline) return false;

        bytes32 messageHash = keccak256(abi.encodePacked(to, fid, deadline));
        bytes32 authHash = messageHash.toEthSignedMessageHash();

        if (usedAuthorizations[authHash]) return false;

        address signer = authHash.recover(signature);
        return signer == owner();
    }

    /*//////////////////////////////////////////////////////////////
                       NON-TRANSFERABLE LOGIC
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Override _update to make NFTs non-transferable (soulbound)
     * @dev Allows minting and burning, but blocks transfers
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal virtual override returns (address) {
        address from = _ownerOf(tokenId);

        // Block transfers: only allow mint (from == 0) and burn (to == 0)
        if (from != address(0) && to != address(0)) {
            revert NonTransferable();
        }

        return super._update(to, tokenId, auth);
    }

    /**
     * @notice Explicitly disable approvals since NFTs are non-transferable
     */
    function approve(address, uint256) public pure override {
        revert NonTransferable();
    }

    /**
     * @notice Explicitly disable operator approvals since NFTs are non-transferable
     */
    function setApprovalForAll(address, bool) public pure override {
        revert NonTransferable();
    }
}
