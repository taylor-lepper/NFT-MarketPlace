// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract DogToken is ERC721URIStorage {
    // counters is openzeppelin utility for incrementing the token id (unique for each NFT)
    using Counters for Counters.Counter;
    Counters.Counter private _dogId;
    address contractAddress;

    // pass in the marketplace address and set as the smart contract address
    // deploy market first so you have the address
    constructor(address dogMarketAddress) ERC721("Dog Tokens", "DAWG"){
        contractAddress = dogMarketAddress;
    }

    // msg.sender will call this function
    function createDogToken(string memory tokenURI) public returns (uint){
        // create id for new token
        _dogId.increment();
        uint256 newDogId = _dogId.current();

        // ERC721 functions, setApproval gives market approval to transact token between users from other contracts
        _mint(msg.sender, newDogId);
        _setTokenURI(newDogId, tokenURI);
        setApprovalForAll(contractAddress, true);
        
        return newDogId;
    }

    function getContractAddress() public view returns(address){
        return contractAddress;
    }
}
