// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ERC721} from "lib/openzeppelin-contracts/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "lib/openzeppelin-contracts/contracts/access/Ownable.sol";

contract Farcasturds is ERC721, Ownable {
    mapping(uint256 => bool) public hasMinted; // fid => minted
    address public minter;
    string private _baseTokenURI;

    event MinterUpdated(address indexed newMinter);
    event FarcasturdMinted(uint256 indexed fid, address indexed to);

    constructor(address _minter, string memory baseURI_)
        ERC721("Farcasturds", "FARCASTURD")
        Ownable(msg.sender) // OZ v5 requires initial owner
    {
        minter = _minter;
        _baseTokenURI = baseURI_;
    }

    function setMinter(address _minter) external onlyOwner {
        minter = _minter;
        emit MinterUpdated(_minter);
    }

    function setBaseURI(string calldata baseURI_) external onlyOwner {
        _baseTokenURI = baseURI_;
    }

    function mintFor(address to, uint256 fid) external {
        require(msg.sender == minter, "Not authorized");
        require(!hasMinted[fid], "Farcasturd already minted for fid");

        hasMinted[fid] = true;
        _safeMint(to, fid); // tokenId = fid

        emit FarcasturdMinted(fid, to);
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    // 🔒 NON-TRANSFERABLE (correct for OpenZeppelin v5)
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal virtual override returns (address) {
        // from address before transfer/mint
        address from = _ownerOf(tokenId);

        // Block transfers: any from != 0 (mint) and to != 0 (burn)
        if (from != address(0) && to != address(0)) {
            revert("Farcasturds are non-transferable");
        }

        return super._update(to, tokenId, auth);
    }
}
