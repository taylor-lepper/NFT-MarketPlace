const hre = require("hardhat");

async function main() {

  const DogMarket = await hre.ethers.getContractFactory("DogMarket");
  const dogMarket = await  DogMarket.deploy();
  await dogMarket.deployed();
  console.log("dogMarket deployed to: ", dogMarket.address);

  const DogToken = await hre.ethers.getContractFactory("DogToken");
  const dogToken = await DogToken.deploy(dogMarket.address);
  await dogToken.deployed();
  console.log("dogToken deployed to: ", dogToken.address)


}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
