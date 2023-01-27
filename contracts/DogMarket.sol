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
        bool isOwned;
        uint256 tokenId;
        address creator;
        address payable seller;
        address payable owner;
        address tokenContractAddress;
    }

    // DogNFT id => struct DogNFT
    mapping(uint256 => DogNFT) private idToNFT;

    event NftCreationEvent(
        uint256 indexed id,
        uint256 price,
        bool isOwned,
        uint256 indexed tokenId,
        address creator,
        address seller,
        address owner,
        address indexed tokenContractAddress
    );

    event NftForSaleEvent(
        uint256 indexed id,
        uint256 price,
        bool isOwned,
        uint256 indexed tokenId,
        address creator,
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
            msg.sender, // creator
            payable(msg.sender), // seller
            payable(address(this)), // new owner (marketplace)
            tokenContractAddress
        );

        // send item to smart contract address and emit event
        IERC721(tokenContractAddress).transferFrom(
            msg.sender,
            address(this),
            tokenId
        );
        emit NftCreationEvent(
            id,
            price,
            false,
            tokenId,
            msg.sender, // creator
            msg.sender, // seller
            address(this), // new owner (marketplace)
            tokenContractAddress
        );
    }

    // put an owned NFT up for sale
    function sellMyNFT(
        address tokenContractAddress,
        uint256 tokenId,
        uint256 price
    ) public payable nonReentrant {
        require(price > 0, "Price must be greater than 0 ETH");
        require(
            msg.value == commissionFee,
            "Price must be equal to commision fee price"
        );

        // grab info from id
        address creator = idToNFT[tokenId].creator;
        address payable previousOwner = idToNFT[tokenId].owner;

        // send item to smart contract address and emit event
        IERC721(tokenContractAddress).transferFrom(
            msg.sender,
            address(this),
            tokenId
        );

        // modify the nft ownership
        idToNFT[tokenId].owner = payable(address(this));
        idToNFT[tokenId].seller = previousOwner;
        idToNFT[tokenId].isOwned = false;
        // increment total nfts sold 
        _nftsSold.increment();

        // emit event for front end
        emit NftForSaleEvent(
            tokenId,
            price,
            false, // is not owned anymore (for sale)
            tokenId,
            creator, // creator always remains same
            msg.sender, // msg.sender posts the dog for sale (seller)
            address(this), // market takes ownership
            tokenContractAddress
        );
    }

    // create array of nfts that user currently owns
    function getMyOwnedNfts() public view returns (DogNFT[] memory) {
        uint256 nftTotalCount = _nftIds.current();
        uint256 ownedNftCount = 0;
        uint256 index = 0;

        // loop over all nfts and check if msg.sender is owner (me)
        for (uint256 i = 0; i < nftTotalCount; i++) {
            // increment nfts owned by msg.sender
            if (idToNFT[i + 1].owner == msg.sender) {
                ownedNftCount++;
            }
        }
        // populate array of DogNFTs with amount of nfts msg.sender owns
        DogNFT[] memory nfts = new DogNFT[](ownedNftCount);

        // loop all nfts again and check if msg.sender is owner (me)
        for (uint256 i = 0; i < nftTotalCount; i++) {
            if (idToNFT[i + 1].owner == msg.sender) {
                uint256 currentId = idToNFT[i + 1].id;
                // get id
                DogNFT storage currentItem = idToNFT[currentId];
                // get reference to item from id
                nfts[index] = currentItem;
                index++;
            }
        }
        return nfts;
    }

    // transfers owner of DogNFT and moves funds in transaction
    function transferDogNFT(address tokenContractAddress, uint256 id)
        public
        payable
        nonReentrant
    {
        // grab price, id, owner from struct
        uint256 price = idToNFT[id].price;
        uint256 tokenId = idToNFT[id].tokenId;
        address payable previousOwner = idToNFT[id].owner;

        require(
            msg.value == price,
            "Your offer must be equal to the asking price!"
        );

        // transfer money to seller
        idToNFT[id].seller.transfer(msg.value);
        // transfer asset to owner from smart contract address
        IERC721(tokenContractAddress).transferFrom(
            address(this),
            msg.sender,
            tokenId
        );
        // set owner of item to msg.sender and mark as sold
        idToNFT[id].owner = payable(msg.sender);
        idToNFT[id].seller = previousOwner;
        idToNFT[id].isOwned = true;
        // increment total nfts sold and give commission to contract owner
        _nftsSold.increment();
        payable(owner).transfer(commissionFee);
    }

    // returns all nfts for sale
    function getAllNFTs() public view returns (DogNFT[] memory) {
        uint256 nftAmount = _nftIds.current();
        uint256 availableNFTs = _nftIds.current() - _nftsSold.current();
        uint256 index = 0;

        // create array from NFT struct, length is unsold item count
        DogNFT[] memory nfts = new DogNFT[](availableNFTs);

        // loop over nfts and check if it has been sold, if not add to array
        for (uint256 i = 0; i < nftAmount; i++) {
            // address "this" means not sold
            if (idToNFT[i + 1].owner == address(this)) {
                uint256 currentId = idToNFT[i + 1].id;
                DogNFT storage currentItem = idToNFT[currentId];
                nfts[index] = currentItem;
                index++;
            }
        }
        return nfts;
    }

    // create array of nfts user has listed for sale
    function getNFTsMinted() public view returns (DogNFT[] memory) {
        uint256 nftTotalCount = _nftIds.current();
        uint256 mintedNftCount = 0;
        uint256 index = 0;

        // loop over all nfts and check if msg.sender is seller(creator) (me)
        for (uint256 i = 0; i < nftTotalCount; i++) {
            // increment nfts owned by creator
            if (idToNFT[i + 1].creator == msg.sender) {
                mintedNftCount++;
            }
        }

        // create item array and populate length with amount of nfts created
        DogNFT[] memory nfts = new DogNFT[](mintedNftCount);

        // loop over all nfts and add those created by message.sender (me) to array
        for (uint256 i = 0; i < nftTotalCount; i++) {
            // check if seller (creator) is msg.sender
            if (idToNFT[i + 1].creator == msg.sender) {
                // get current id
                uint256 currentId = idToNFT[i + 1].id;
                // get reference to the current id by its id
                DogNFT storage currentItem = idToNFT[currentId];
                // add to array and increase index
                nfts[index] = currentItem;
                index++;
            }
        }
        return nfts;
    }

    // return the listing free (commision for market owner)
    function getCommissionFee() public view returns (uint256) {
        return commissionFee;
    }

    // return the full NFT data by id
    function getNftById(uint256 tokenId) public view returns (DogNFT memory) {
        return idToNFT[tokenId];
    }

       // return owner of token
    function ownerOf(uint256 tokenId) public view returns (address) {
        return idToNFT[tokenId].owner;
    }
}
