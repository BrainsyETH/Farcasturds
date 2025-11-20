// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {FarcasturdsV2} from "../src/FarcasturdsV2.sol";

contract FarcasturdsV2Test is Test {
    FarcasturdsV2 public farcasturds;

    address public owner = address(this);
    address public user1 = address(0x1);
    address public user2 = address(0x2);

    uint256 public constant MINT_PRICE = 0.001 ether;
    string public constant BASE_URI = "https://farcasturds.vercel.app/api/metadata/";

    event FarcasturdMinted(uint256 indexed fid, address indexed to, uint256 tokenId);
    event MintPriceUpdated(uint256 oldPrice, uint256 newPrice);
    event Withdrawal(address indexed to, uint256 amount);

    function setUp() public {
        farcasturds = new FarcasturdsV2(BASE_URI, MINT_PRICE);

        // Fund test users
        vm.deal(user1, 10 ether);
        vm.deal(user2, 10 ether);
    }

    /*//////////////////////////////////////////////////////////////
                            DEPLOYMENT TESTS
    //////////////////////////////////////////////////////////////*/

    function test_Deployment() public view {
        assertEq(farcasturds.name(), "Farcasturds");
        assertEq(farcasturds.symbol(), "TURD");
        assertEq(farcasturds.mintPrice(), MINT_PRICE);
        assertEq(farcasturds.owner(), owner);
        assertEq(farcasturds.totalSupply(), 0);
    }

    /*//////////////////////////////////////////////////////////////
                             MINTING TESTS
    //////////////////////////////////////////////////////////////*/

    function test_MintSuccess() public {
        uint256 fid = 123;

        vm.expectEmit(true, true, true, true);
        emit FarcasturdMinted(fid, user1, fid);

        vm.prank(user1);
        farcasturds.mintFor{value: MINT_PRICE}(user1, fid);

        assertEq(farcasturds.ownerOf(fid), user1);
        assertEq(farcasturds.hasMinted(fid), true);
        assertEq(farcasturds.ownerOfFid(fid), user1);
        assertEq(farcasturds.totalSupply(), 1);
        assertEq(farcasturds.balanceOf(user1), 1);
    }

    function test_MintMultipleUsers() public {
        vm.prank(user1);
        farcasturds.mintFor{value: MINT_PRICE}(user1, 123);

        vm.prank(user2);
        farcasturds.mintFor{value: MINT_PRICE}(user2, 456);

        assertEq(farcasturds.totalSupply(), 2);
        assertEq(farcasturds.ownerOf(123), user1);
        assertEq(farcasturds.ownerOf(456), user2);
    }

    function test_MintForDifferentRecipient() public {
        uint256 fid = 123;

        vm.prank(user1);
        farcasturds.mintFor{value: MINT_PRICE}(user2, fid); // user1 pays, user2 receives

        assertEq(farcasturds.ownerOf(fid), user2);
        assertEq(farcasturds.ownerOfFid(fid), user2);
    }

    function test_RevertMintInsufficientPayment() public {
        vm.prank(user1);
        vm.expectRevert(FarcasturdsV2.InsufficientPayment.selector);
        farcasturds.mintFor{value: MINT_PRICE - 1}(user1, 123);
    }

    function test_RevertMintExcessPayment() public {
        vm.prank(user1);
        vm.expectRevert(FarcasturdsV2.InsufficientPayment.selector);
        farcasturds.mintFor{value: MINT_PRICE + 1}(user1, 123);
    }

    function test_RevertMintAlreadyMinted() public {
        uint256 fid = 123;

        vm.prank(user1);
        farcasturds.mintFor{value: MINT_PRICE}(user1, fid);

        vm.prank(user2);
        vm.expectRevert(FarcasturdsV2.AlreadyMinted.selector);
        farcasturds.mintFor{value: MINT_PRICE}(user2, fid);
    }

    function test_RevertMintInvalidFID() public {
        vm.prank(user1);
        vm.expectRevert(FarcasturdsV2.InvalidFID.selector);
        farcasturds.mintFor{value: MINT_PRICE}(user1, 0);
    }

    function test_RevertMintWhenPaused() public {
        farcasturds.pause();

        vm.prank(user1);
        vm.expectRevert();
        farcasturds.mintFor{value: MINT_PRICE}(user1, 123);
    }

    /*//////////////////////////////////////////////////////////////
                          OWNERSHIP TESTS
    //////////////////////////////////////////////////////////////*/

    function test_SetMintPrice() public {
        uint256 newPrice = 0.002 ether;

        vm.expectEmit(true, true, true, true);
        emit MintPriceUpdated(MINT_PRICE, newPrice);

        farcasturds.setMintPrice(newPrice);
        assertEq(farcasturds.mintPrice(), newPrice);

        // Verify new price is enforced
        vm.prank(user1);
        farcasturds.mintFor{value: newPrice}(user1, 123);
    }

    function test_RevertSetMintPriceNonOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        farcasturds.setMintPrice(0.002 ether);
    }

    function test_RevertSetMintPriceTooHigh() public {
        vm.expectRevert(FarcasturdsV2.InvalidPrice.selector);
        farcasturds.setMintPrice(1.1 ether);
    }

    function test_SetBaseURI() public {
        string memory newURI = "https://new-uri.com/";
        farcasturds.setBaseURI(newURI);

        // Mint to verify URI
        vm.prank(user1);
        farcasturds.mintFor{value: MINT_PRICE}(user1, 123);

        // tokenURI should use new base
        assertEq(farcasturds.tokenURI(123), string.concat(newURI, "123"));
    }

    function test_RevertSetBaseURINonOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        farcasturds.setBaseURI("https://new-uri.com/");
    }

    /*//////////////////////////////////////////////////////////////
                           PAUSABLE TESTS
    //////////////////////////////////////////////////////////////*/

    function test_Pause() public {
        farcasturds.pause();

        vm.prank(user1);
        vm.expectRevert();
        farcasturds.mintFor{value: MINT_PRICE}(user1, 123);
    }

    function test_Unpause() public {
        farcasturds.pause();
        farcasturds.unpause();

        vm.prank(user1);
        farcasturds.mintFor{value: MINT_PRICE}(user1, 123);

        assertEq(farcasturds.totalSupply(), 1);
    }

    function test_RevertPauseNonOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        farcasturds.pause();
    }

    /*//////////////////////////////////////////////////////////////
                          WITHDRAWAL TESTS
    //////////////////////////////////////////////////////////////*/

    function test_Withdraw() public {
        // Mint some tokens to accumulate funds
        vm.prank(user1);
        farcasturds.mintFor{value: MINT_PRICE}(user1, 123);

        vm.prank(user2);
        farcasturds.mintFor{value: MINT_PRICE}(user2, 456);

        uint256 contractBalance = address(farcasturds).balance;
        assertEq(contractBalance, MINT_PRICE * 2);

        uint256 ownerBalanceBefore = owner.balance;

        vm.expectEmit(true, true, true, true);
        emit Withdrawal(owner, contractBalance);

        farcasturds.withdraw();

        assertEq(address(farcasturds).balance, 0);
        assertEq(owner.balance, ownerBalanceBefore + contractBalance);
    }

    function test_WithdrawTo() public {
        address payable recipient = payable(address(0x999));

        vm.prank(user1);
        farcasturds.mintFor{value: MINT_PRICE}(user1, 123);

        uint256 contractBalance = address(farcasturds).balance;

        vm.expectEmit(true, true, true, true);
        emit Withdrawal(recipient, contractBalance);

        farcasturds.withdrawTo(recipient);

        assertEq(address(farcasturds).balance, 0);
        assertEq(recipient.balance, contractBalance);
    }

    function test_RevertWithdrawNonOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        farcasturds.withdraw();
    }

    function test_RevertWithdrawToZeroAddress() public {
        vm.expectRevert(FarcasturdsV2.TransferFailed.selector);
        farcasturds.withdrawTo(payable(address(0)));
    }

    /*//////////////////////////////////////////////////////////////
                      NON-TRANSFERABLE TESTS
    //////////////////////////////////////////////////////////////*/

    function test_RevertTransfer() public {
        vm.prank(user1);
        farcasturds.mintFor{value: MINT_PRICE}(user1, 123);

        vm.prank(user1);
        vm.expectRevert(FarcasturdsV2.NonTransferable.selector);
        farcasturds.transferFrom(user1, user2, 123);
    }

    function test_RevertSafeTransfer() public {
        vm.prank(user1);
        farcasturds.mintFor{value: MINT_PRICE}(user1, 123);

        vm.prank(user1);
        vm.expectRevert(FarcasturdsV2.NonTransferable.selector);
        farcasturds.safeTransferFrom(user1, user2, 123);
    }

    function test_RevertApprove() public {
        vm.prank(user1);
        farcasturds.mintFor{value: MINT_PRICE}(user1, 123);

        vm.prank(user1);
        vm.expectRevert(FarcasturdsV2.NonTransferable.selector);
        farcasturds.approve(user2, 123);
    }

    function test_RevertSetApprovalForAll() public {
        vm.prank(user1);
        vm.expectRevert(FarcasturdsV2.NonTransferable.selector);
        farcasturds.setApprovalForAll(user2, true);
    }

    /*//////////////////////////////////////////////////////////////
                            FUZZ TESTS
    //////////////////////////////////////////////////////////////*/

    function testFuzz_MintValidFID(uint256 fid) public {
        vm.assume(fid > 0);
        vm.assume(fid < type(uint256).max);

        vm.prank(user1);
        farcasturds.mintFor{value: MINT_PRICE}(user1, fid);

        assertEq(farcasturds.ownerOf(fid), user1);
        assertEq(farcasturds.hasMinted(fid), true);
    }

    function testFuzz_SetMintPrice(uint256 newPrice) public {
        vm.assume(newPrice <= 1 ether);

        farcasturds.setMintPrice(newPrice);
        assertEq(farcasturds.mintPrice(), newPrice);
    }

    /*//////////////////////////////////////////////////////////////
                         INTEGRATION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_FullWorkflow() public {
        // Mint multiple tokens
        vm.prank(user1);
        farcasturds.mintFor{value: MINT_PRICE}(user1, 100);

        vm.prank(user2);
        farcasturds.mintFor{value: MINT_PRICE}(user2, 200);

        // Verify state
        assertEq(farcasturds.totalSupply(), 2);
        assertEq(address(farcasturds).balance, MINT_PRICE * 2);

        // Update price
        uint256 newPrice = 0.002 ether;
        farcasturds.setMintPrice(newPrice);

        // Mint with new price
        vm.prank(user1);
        farcasturds.mintFor{value: newPrice}(user1, 300);

        assertEq(farcasturds.totalSupply(), 3);

        // Pause and try to mint (should fail)
        farcasturds.pause();
        vm.prank(user2);
        vm.expectRevert();
        farcasturds.mintFor{value: newPrice}(user2, 400);

        // Unpause and mint
        farcasturds.unpause();
        vm.prank(user2);
        farcasturds.mintFor{value: newPrice}(user2, 400);

        assertEq(farcasturds.totalSupply(), 4);

        // Withdraw all funds
        uint256 expectedBalance = (MINT_PRICE * 2) + (newPrice * 2);
        assertEq(address(farcasturds).balance, expectedBalance);

        farcasturds.withdraw();
        assertEq(address(farcasturds).balance, 0);
    }

    receive() external payable {}
}
