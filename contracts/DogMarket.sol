// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";


contract DogMarket is ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private _nftIds;
    Counters.Counter private _nftsSold;

    address payable owner;
    uint256 commissionFee = 0.01 ether;

    constructor() {
        owner = payable(msg.sender);
    }

    // "object" for each DogNFT
    struct DogNFT {
        uint256 id;
        uint256 price;
        bool isSold;
        uint256 tokenId;
        address payable seller;
        address payable owner;
        address tokenContractAddress;
    }

    // DogNFT id => struct DogNFT
    mapping(uint256 => DogNFT) private idToNFT;

    event NftCreationEvent(
        uint256 indexed id,
        uint256 price,
        bool isSold,
        uint256 indexed tokenId,
        address seller,
        address owner,
        address indexed tokenContractAddress
    );


    // create a DogNFT
    function createDogNFT(
        address tokenContractAddress,
        uint256 tokenId,
        uint256 price
    ) public payable nonReentrant {
        require(price > 0, "Price must be greater than 0 ETH");
        require(
            msg.value == commissionFee,
            "Price must be equal to commision fee price"
        );

        // create new item id for listing
        _nftIds.increment();
        uint256 id = _nftIds.current();

        // create struct of the new item
        idToNFT[id] = DogNFT(
            id,
            price,
            false,
            tokenId,
            payable(msg.sender), // owner
            payable(address(this)), // address of nftmarketplace (seller)
            tokenContractAddress
        );

        // send item to smart contract address and emit event
        IERC721(tokenContractAddress).transferFrom(msg.sender, address(this), tokenId);
        emit NftCreationEvent(
            id,
            price,
            false,
            tokenId,
            msg.sender,
            address(this),
            tokenContractAddress
        );
    }

     // create array of nfts that user currently owns
    function getMyOwnedNfts() public view returns (DogNFT[] memory) {
        uint256 totalItemCount = _nftIds.current();
        uint256 itemCount = 0;
        uint256 currentIndex = 0;

        // loop over all nfts and check if msg.sender is owner (me)
        for (uint256 i = 0; i < totalItemCount; i++) {
            // increment nfts owned by msg.sender
            if (idToNFT[i + 1].owner == msg.sender) {
                itemCount++;
            }
        }
        // populate array of DogNFTs with amount of nfts msg.sender owns
        DogNFT[] memory nfts = new DogNFT[](itemCount);

        // loop all nfts again and check if msg.sender is owner (me)
        for (uint256 i = 0; i < totalItemCount; i++) {
            if (idToNFT[i + 1].owner == msg.sender) {
                uint256 currentId = idToNFT[i + 1].id;
                // get id
                DogNFT storage currentItem = idToNFT[currentId];
                // get reference to item from id
                nfts[currentIndex] = currentItem;
                currentIndex++;
            }
        }
        return nfts;
    }


    // transfers owner of DogNFT and moves funds in transaction
    function sellDog(address tokenContractAddress, uint256 id)
        public
        payable
        nonReentrant
    {
        // grab price and id from struct
        uint256 price = idToNFT[id].price;
        uint256 tokenId = idToNFT[id].tokenId;

        require(
            msg.value == price,
            "Your offer must be equal to the asking price!"
        );

        // transfer money to seller
        idToNFT[id].seller.transfer(msg.value);
        // transfer asset to owner from smart contract address
        IERC721(tokenContractAddress).transferFrom(address(this), msg.sender, tokenId);
        // set owner of item to msg.sender and mark as sold
        idToNFT[id].owner = payable(msg.sender);
        idToNFT[id].isSold = true;
        // increment total nfts sold and give commission to contract owner
        _nftsSold.increment();
        payable(owner).transfer(commissionFee);
    }

    // returns all nfts for sale
    function getAllNFTs() public view returns (DogNFT[] memory) {
        uint256 itemCount = _nftIds.current();
        uint256 unsoldItemCount = _nftIds.current() - _nftsSold.current();
        uint256 currentIndex = 0;

        // create array from NFT struct, length is unsold item count
        DogNFT[] memory nfts = new DogNFT[](unsoldItemCount);

        // loop over nfts and check if it has been sold, if not add to array
        for (uint256 i = 0; i < itemCount; i++) {
            // address "this" means not sold
            if (idToNFT[i + 1].owner == address(this)) {
                uint256 currentId = idToNFT[i + 1].id;
                DogNFT storage currentItem = idToNFT[currentId];
                nfts[currentIndex] = currentItem;
                currentIndex++;
            }
        }
        return nfts;
    }

   
    // create array of nfts user has listed for sale
    function getNFTsMinted() public view returns (DogNFT[] memory) {
        uint256 totalItemCount = _nftIds.current();
        uint256 itemCount = 0;
        uint256 currentIndex = 0;

        // loop over all nfts and check if msg.sender is seller(creator) (me)
        for (uint256 i = 0; i < totalItemCount; i++) {
            // increment nfts owned by seller(creator)
            if (idToNFT[i + 1].seller == msg.sender) {
                itemCount++;
            }
        }

        // create item array and populate length with amount of nfts created
        DogNFT[] memory nfts = new DogNFT[](itemCount);

        // loop over all nfts and add those created by message.sender (me) to array
        for(uint i = 0; i < totalItemCount; i++){
                // check if seller (creator) is msg.sender 
              if (idToNFT[i + 1].seller == msg.sender) {
                // get current id
                uint currentId = idToNFT[i + 1].id;
                // get reference to the current id by its id
                DogNFT storage currentItem = idToNFT[currentId];
                // add to array and increase index
                nfts[currentIndex] = currentItem;
                currentIndex++;
            }
        }
        return nfts;
    }

    // return the listing free (commision for market owner)
    function getCommissionFee() public view returns (uint256) {
        return commissionFee;
    }
}
