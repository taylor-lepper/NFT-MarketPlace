const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GetMyNFTs", function () {
  it("Should create NFT and transfer owner of one thru a purchase, and then post for sale, leaving 0 in market, and 1 in myNFTs", async function () {
    // deploy market contract
    const DogMarket = await ethers.getContractFactory("DogMarket");
    const dogMarket = await DogMarket.deploy();
    await dogMarket.deployed();
    const dogMarketAddress = dogMarket.address;

    // deploy token contract
    const DogToken = await ethers.getContractFactory("DogToken");
    const dogToken = await DogToken.deploy(dogMarketAddress);
    await dogToken.deployed();
    const dogTokenAddress = dogToken.address;

    // set listingPrice (market owner commission)
    let commissionFee = await dogMarket.getCommissionFee();
    commissionFee = commissionFee.toString();

    // create auction price
    const auctionPrice = ethers.utils.parseUnits("1", "ether");

    // create NFT
    await dogToken.createDogToken("https://www.token.com");

    // get test address from ethers, add more for more addresses [_, buyerAddress, thirdAddress, fourthAddress, etc] (underscore is sellerAddress, skip with _)
    const [sellerAddress, buyerAddress] = await ethers.getSigners();

    // place NFT for sale on market
    await dogMarket.connect(sellerAddress).createDogNFT(dogTokenAddress, 1, auctionPrice, {
        value: commissionFee,
      });

    // use buyerAddress to connect to market, sell item 1
    await dogMarket
      .connect(buyerAddress)
      .transferDogNFT(dogTokenAddress, 1, { value: auctionPrice });

    // check all market items (NFT has been sold, should show nothing)
    let nfts = await dogMarket.getAllNFTs();
    // make items more readable
    nfts = await Promise.all(
      nfts.map(async (token) => {
        const tokenURI = await dogToken.tokenURI(token.tokenId);
        let nft = {
          price: token.price.toString(),
          tokenId: token.tokenId.toString(),
          creator: token.creator,
          seller: token.seller,
          owner: token.owner,
          tokenURI,
        };
        return nft;
      })
    );
    console.log("nfts", nfts);

    // check my NFTs for buyer
    let myNFTs = await dogMarket.connect(buyerAddress).getMyOwnedNfts();
    myNFTs = await Promise.all(
      myNFTs.map(async (token) => {
        const tokenURI = await dogToken.tokenURI(token.tokenId);
        let nft = {
          price: token.price.toString(),
          tokenId: token.tokenId.toString(),
          creator: token.creator,
          seller: token.seller,
          owner: token.owner,
          tokenURI,
        };
        return nft;
      })
    );
    console.log("myNFTs", myNFTs);
    expect(myNFTs.length).to.be.equal(1);
    expect(nfts.length).to.be.equal(0);
  });
});
