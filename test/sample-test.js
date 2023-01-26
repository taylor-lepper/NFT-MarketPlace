const { expect } = require("chai");
const { ethers } = require("hardhat");


describe("NFTMarket", function () {
  it("Should create NFT and transact sales", async function () {

    // deploy market contract
    const Market = await ethers.getContractFactory("NFTMarket");
    const market = await Market.deploy();
    await market.deployed();
    const marketAddress = market.address;

    // deploy token contract
    const NFT = await ethers.getContractFactory("NFT");
    const nft = await NFT.deploy(marketAddress);
    await nft.deployed();
    const nftContractAddress = nft.address;

    // set listingPrice (market owner commission)
    let listingPrice = await market.getListingPrice();
    listingPrice = listingPrice.toString();


    // create auction price
    const auctionPrice = ethers.utils.parseUnits("1", "ether");


    // create 2 NFTs
    await nft.createToken("https://mytokenLocation.com");
    await nft.createToken("https://mytokenLocation2.com");

    // place 2 NFTs for sale on market
    await market.createMarketItem(nftContractAddress, 1, auctionPrice, {value: listingPrice});
    await market.createMarketItem(nftContractAddress, 2, auctionPrice, {value: listingPrice});

    // get test address from ethers, add more for more addresses [_, buyerAddress, thirdAddress, fourthAddress, etc] (underscore is sellerAddress, skip with _)
    const [_, buyerAddress] = await ethers.getSigners();

    // use buyerAddress to connect to market, sell item 1
    await market.connect(buyerAddress).createMarketSale(nftContractAddress, 1, {value: auctionPrice});

    // check all market items (1 has been sold, should show 2)
    let items = await market.getAllMarketItems();
    // make items more readable
    items = await Promise.all(items.map(async i => {
      const tokenURI = await nft.tokenURI(i.tokenId);
      let item = {
        price: i.price.toString(),
        tokenId: i.tokenId.toString(),
        seller: i.seller,
        owner: i.owner,
        tokenURI
      }
      return item;
    }))
    console.log("items", items);
  });
});
