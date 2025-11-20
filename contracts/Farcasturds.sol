// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Farcasturds
 * @notice NFT contract for Farcaster users - one mint per FID
 * @dev Implements payable minting with configurable mint price
 */
contract Farcasturds is ERC721, Ownable {
    // Mapping from FID to whether it has minted
    mapping(uint256 => bool) public hasMinted;

    // Mapping from FID to token ID
    mapping(uint256 => uint256) public fidToTokenId;

    // Base URI for token metadata
    string private _baseTokenURI;

    // Mint price in wei
    uint256 public mintPrice;

    // Address authorized to mint on behalf of users
    address public minter;

    // Token ID counter
    uint256 private _tokenIdCounter;

    // Events
    event FarcasturdMinted(uint256 indexed fid, address indexed to, uint256 tokenId);
    event MintPriceUpdated(uint256 oldPrice, uint256 newPrice);
    event MinterUpdated(address indexed oldMinter, address indexed newMinter);
    event Withdrawal(address indexed to, uint256 amount);

    constructor(
        address _minter,
        string memory baseURI_,
        uint256 _mintPrice
    ) ERC721("Farcasturds", "TURD") Ownable(msg.sender) {
        minter = _minter;
        _baseTokenURI = baseURI_;
        mintPrice = _mintPrice;
    }

    /**
     * @notice Mint a Farcasturd NFT for a specific FID
     * @param to Address to receive the NFT
     * @param fid Farcaster ID
     */
    function mintFor(address to, uint256 fid) external payable {
        require(msg.sender == minter, "Only minter can mint");
        require(!hasMinted[fid], "FID already minted");
        require(msg.value >= mintPrice, "Insufficient payment");
        require(to != address(0), "Invalid recipient");
        require(fid > 0, "Invalid FID");

        // Mark FID as minted
        hasMinted[fid] = true;

        // Increment token ID (start from 1)
        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;

        // Store FID to token ID mapping
        fidToTokenId[fid] = tokenId;

        // Mint the NFT
        _safeMint(to, tokenId);

        // Refund excess payment
        if (msg.value > mintPrice) {
            (bool refundSuccess, ) = payable(msg.sender).call{value: msg.value - mintPrice}("");
            require(refundSuccess, "Refund failed");
        }

        emit FarcasturdMinted(fid, to, tokenId);
    }

    /**
     * @notice Update the mint price (owner only)
     * @param newPrice New mint price in wei
     */
    function setMintPrice(uint256 newPrice) external onlyOwner {
        uint256 oldPrice = mintPrice;
        mintPrice = newPrice;
        emit MintPriceUpdated(oldPrice, newPrice);
    }

    /**
     * @notice Update the authorized minter address (owner only)
     * @param newMinter New minter address
     */
    function setMinter(address newMinter) external onlyOwner {
        require(newMinter != address(0), "Invalid minter address");
        address oldMinter = minter;
        minter = newMinter;
        emit MinterUpdated(oldMinter, newMinter);
    }

    /**
     * @notice Update base URI (owner only)
     * @param baseURI_ New base URI
     */
    function setBaseURI(string memory baseURI_) external onlyOwner {
        _baseTokenURI = baseURI_;
    }

    /**
     * @notice Withdraw collected funds (owner only)
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");

        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");

        emit Withdrawal(owner(), balance);
    }

    /**
     * @notice Get token URI for a given token ID
     * @param tokenId Token ID
     * @return Token URI string
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);

        string memory baseURI = _baseURI();

        // Find FID for this token ID
        for (uint256 fid = 1; fid <= 1000000; fid++) {
            if (fidToTokenId[fid] == tokenId) {
                return bytes(baseURI).length > 0
                    ? string(abi.encodePacked(baseURI, uint256ToString(fid)))
                    : "";
            }
        }

        revert("Token ID not found");
    }

    /**
     * @notice Get base URI
     * @return Base URI string
     */
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    /**
     * @notice Get the owner of a token by FID
     * @param fid Farcaster ID
     * @return Owner address (0x0 if not minted)
     */
    function ownerOfFid(uint256 fid) external view returns (address) {
        if (!hasMinted[fid]) {
            return address(0);
        }
        return ownerOf(fidToTokenId[fid]);
    }

    /**
     * @notice Get total supply of minted NFTs
     * @return Total number of minted tokens
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter;
    }

    /**
     * @notice Helper function to convert uint to string
     * @param value Number to convert
     * @return String representation
     */
    function uint256ToString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }

        uint256 temp = value;
        uint256 digits;

        while (temp != 0) {
            digits++;
            temp /= 10;
        }

        bytes memory buffer = new bytes(digits);

        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }

        return string(buffer);
    }

    /**
     * @notice Allow contract to receive ETH
     */
    receive() external payable {}
}
