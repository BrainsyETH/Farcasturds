// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ERC721} from "lib/openzeppelin-contracts/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "lib/openzeppelin-contracts/contracts/access/Ownable.sol";
import {Pausable} from "lib/openzeppelin-contracts/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "lib/openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Farcasturds V2
 * @notice Soulbound NFTs for Farcaster users - one per FID, non-transferable
 * @dev Production-ready contract with user-paid minting on Base mainnet
 *
 * Key Features:
 * - Payable mint function (users pay in ETH)
 * - One mint per Farcaster ID (FID)
 * - Non-transferable (soulbound)
 * - Pausable for emergency stops
 * - ReentrancyGuard protection
 * - Configurable mint price
 * - Owner withdrawal of collected fees
 */
contract FarcasturdsV2 is ERC721, Ownable, Pausable, ReentrancyGuard {
    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/

    error AlreadyMinted();
    error InsufficientPayment();
    error InvalidFID();
    error InvalidPrice();
    error TransferFailed();
    error NonTransferable();

    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/

    event FarcasturdMinted(uint256 indexed fid, address indexed to, uint256 tokenId);
    event MintPriceUpdated(uint256 oldPrice, uint256 newPrice);
    event Withdrawal(address indexed to, uint256 amount);

    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    /// @notice Tracks which FIDs have minted
    mapping(uint256 => bool) public hasMinted;

    /// @notice Tracks which address owns each FID's NFT
    mapping(uint256 => address) public ownerOfFid;

    /// @notice Price to mint in wei
    uint256 public mintPrice;

    /// @notice Base URI for token metadata
    string private _baseTokenURI;

    /// @notice Counter for total minted supply
    uint256 private _totalMinted;

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Initialize the Farcasturds contract
     * @param baseURI_ Base URI for metadata (e.g., "https://farcasturds.vercel.app/api/metadata/")
     * @param _mintPrice Initial mint price in wei
     */
    constructor(string memory baseURI_, uint256 _mintPrice)
        ERC721("Farcasturds", "TURD")
        Ownable(msg.sender)
    {
        _baseTokenURI = baseURI_;
        mintPrice = _mintPrice;

        emit MintPriceUpdated(0, _mintPrice);
    }

    /*//////////////////////////////////////////////////////////////
                            MINT FUNCTION
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Mint a Farcasturd NFT for a specific Farcaster ID
     * @dev Payable function - must send exact mintPrice in ETH
     * @param to Address to receive the NFT
     * @param fid Farcaster ID to mint for
     */
    function mintFor(address to, uint256 fid)
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

        // Mark as minted
        hasMinted[fid] = true;
        ownerOfFid[fid] = to;

        // Increment total supply
        unchecked {
            ++_totalMinted;
        }

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
     * @notice Withdraw collected mint fees to owner
     */
    function withdraw() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;

        (bool success, ) = payable(owner()).call{value: balance}("");
        if (!success) revert TransferFailed();

        emit Withdrawal(owner(), balance);
    }

    /**
     * @notice Withdraw to a specific address (for multisig support)
     * @param to Address to send funds to
     */
    function withdrawTo(address payable to) external onlyOwner nonReentrant {
        if (to == address(0)) revert TransferFailed();

        uint256 balance = address(this).balance;

        (bool success, ) = to.call{value: balance}("");
        if (!success) revert TransferFailed();

        emit Withdrawal(to, balance);
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
