// SPDX-License-Identifier: WTFPL

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract UniqueBidAuction is Ownable {

    // ToDo: Maybe have a list of accepted ERC20 token addresses
    address public acceptedERC20tokenAddress;

    uint public round = 0;

    bool public biddingPhase = true;

    // ToDo: Make these private?
    mapping(address => bytes32) public blindedBids;
    address[] public bidders;

    // ToDo: Make these private?
    // ToDo: Tests
    mapping(address => uint) public revealedBids;
    mapping(uint => address[]) public numbersAdrressesMap;
    uint[] public numbers;


    constructor(address ownerAddress, address stableCoinAddress) {
        transferOwnership(ownerAddress);
        acceptedERC20tokenAddress = stableCoinAddress;

        emit BiddingPhaseStarted(round);
    }

    //Todo: Proper naming? 
    event BiddingPhaseStarted(uint indexed round);
    event Bid(uint indexed round, address indexed from, bytes32 blindedBid);
    event RevealPhaseStarted(uint indexed round);
    event RevealBid(uint indexed round, address indexed from, uint indexed number);
    event AuctionEnded(uint indexed round);
    event LowestUniqueBidder(uint indexed round, address indexed lowestUniqueBidder, uint indexed number);

    modifier onlyInBiddingPhase() {
        require(biddingPhase, "You can only do this in bidding phase");
        _;
    }

    modifier onlyInRevealPhase() {
        require(!biddingPhase, "You can only do this in reveal phase");
        _;
    }

    // ToDo: Maybe check if this is an ERC20 address
    // https://stackoverflow.com/questions/45364197/how-to-detect-if-an-ethereum-address-is-an-erc20-token-contract
    function setAcceptedERC20tokenAddress(address tokenAddress) public onlyOwner {
        acceptedERC20tokenAddress = tokenAddress;
    }

    function getBidders() external view returns (address[] memory)  {
        return bidders;
    }

    function getNumbers() external view returns (uint[] memory)  {
        return numbers;
    }

    // ToDo: Maybe make it possible to send false bids?
    function bid(bytes32 blindedBid) external onlyInBiddingPhase {
        IERC20 stableCoin = IERC20(acceptedERC20tokenAddress);

        // Todo: Maybe let people bid multiple times?
        require(blindedBids[msg.sender] == 0, "You can only have one magic number");
        
        stableCoin.transferFrom(msg.sender, address(this), 10**18);

        blindedBids[msg.sender] = blindedBid;
        bidders.push(msg.sender);

        emit Bid(round, msg.sender, blindedBid);
    }

    // ToDo: This should be called by anyone, when we reached the end of the bidding phase
    function startRevealPhase() public onlyOwner onlyInBiddingPhase {
        biddingPhase = false;
        emit RevealPhaseStarted(round);
    }

    // ToDo: Reentracy?
    function revealBid (
        uint number, string memory secret) external onlyInRevealPhase {

        require(number > 0, "Only positive numbers are accepted");

        bytes32 blindedBid = blindedBids[msg.sender];
        require(blindedBid != 0, "There was no bid from this address");

        require (blindedBid == keccak256(abi.encodePacked(number, secret)), "Secret and number do not match");

        numbersAdrressesMap[number].push(msg.sender);
        if (numbersAdrressesMap[number].length == 1) {
            numbers.push(number);
        }

        revealedBids[msg.sender] = number;

        emit RevealBid(round, msg.sender, number);
    }

    // ToDo: This should be called by anyone, when we reached the end of the bidding phase
    function endAuction() public onlyOwner onlyInRevealPhase {
        uint lowestUniqueNumber;
        address lowestUniqueBidderAddress;
        uint lowestUniqueBidCount;

        for (uint i = 0; i < numbers.length; i++) {
            uint number = numbers[i];
            address[] memory addresses = numbersAdrressesMap[number];
            uint count = addresses.length;

            if ((lowestUniqueBidCount != 0) && count > lowestUniqueBidCount) {
                continue;
            }
            if (count == lowestUniqueBidCount) {
                if (number > lowestUniqueNumber) {
                    continue;
                }
            }

            lowestUniqueNumber = number;
            lowestUniqueBidderAddress = addresses[0];
            lowestUniqueBidCount = count;
        }

        if (lowestUniqueBidderAddress != address(0)) {
            _transferToLowestUniqueBidderAddress(lowestUniqueBidderAddress);

            emit LowestUniqueBidder(round, lowestUniqueBidderAddress, lowestUniqueNumber);
        }

        _startNextRound();
    }

    // ToDo: Implement a fee
    // Maybe have a price as well, e.g. an NFT
    function _transferToLowestUniqueBidderAddress(address lowestUniqueBidderAddress) private {
        IERC20 stableCoin = IERC20(acceptedERC20tokenAddress);

        uint balance = stableCoin.balanceOf(address(this));

        stableCoin.transfer(lowestUniqueBidderAddress, balance);
    }

    function _startNextRound() private {
        for (uint i = 0; i < bidders.length; i++) {
            delete blindedBids[bidders[i]];
            delete revealedBids[bidders[i]];
        }
        delete bidders; 

        for (uint i = 0; i < numbers.length; i++) {
            delete numbersAdrressesMap[numbers[i]];
        }
        delete numbers;

        emit AuctionEnded(round);

        round = round + 1;

        biddingPhase = true;
        emit BiddingPhaseStarted(round);
    }
}
