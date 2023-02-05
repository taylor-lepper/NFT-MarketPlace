const { expect } = require("chai");
const { ethers } = require("hardhat");


let owner, buyer, dogMarket, dogToken;

beforeEach(async () => {
    // deploy market contract
    const DogMarket = await ethers.getContractFactory("DogMarket");
    dogMarket = await DogMarket.deploy();
    await dogMarket.deployed();
    const dogMarketAddress = dogMarket.address;

    // deploy token contract
    const DogToken = await ethers.getContractFactory("DogToken");
    dogToken = await DogToken.deploy(dogMarketAddress);
    await dogToken.deployed();

     [owner, buyer] = await ethers.getSigners();
});

describe("Token and Market contract deployment", function () {
  it("Should pass the market contract address to the token contract", async function () {
    expect(await dogToken.getContractAddress()).to.be.eq(dogMarket.address);
  });
});

describe("Dog NFT Creation", function () {
  let tokenIds = [];

  it("Should emit a transfer event", async function () {
    const token = await dogToken
      .connect(buyer)
      .createDogToken(`https://www.ipfs/token.com`);
    const tx = await token.wait();
    const event = tx.events[0].event;
    expect(event).to.be.eq("Transfer");
  });  


  it("Should set msg.sender as the owner of the token", async function () {
    const token = await dogToken
      .connect(buyer)
      .createDogToken(`https://www.ipfs/token.com`);
    const tx = await token.wait();
    const event = tx.events[0];
    const value = event.args[2];
    const tokenId = value.toNumber();
    const tokenOwner = await dogToken.ownerOf(tokenId);
    expect(buyer.address).to.be.eq(tokenOwner);
  });


  
  it("Should increment the count of tokenIds", async function () {
    for (i = 0; i < 2; i++) {
      const nft = await dogToken
        .connect(buyer)
        .createDogToken(`https://www.ipfs/token/${i}.com`);
      let tx = await nft.wait();
      let event = tx.events[0];
      let value = event.args[2];
      let tokenId = value.toNumber();
      tokenIds.push(tokenId);
    }
    expect(tokenIds[0]).to.be.eq(tokenIds[1] - 1);
  });

});