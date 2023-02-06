require("@nomiclabs/hardhat-waffle");
require('@nomiclabs/hardhat-ethers');
require("@nomiclabs/hardhat-etherscan");

const fs = require("fs");

const privateKey = fs.readFileSync('.secret').toString();
const projectId = "84516ca20ad64919946349869d0a94cd";
const etherScanAPI = "2J3N9EVZVTM2BP9ZHU72GJQ9R4FIYYSZPK";


module.exports = {
  networks:{
    hardhat: {
      chainId: 1337
    },
    goerli: {
      url: `https://goerli.infura.io/v3/${projectId}`,
      accounts: [privateKey]
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${projectId}`,
      accounts: [privateKey]
    },
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: etherScanAPI,
  },
  solidity: "0.8.4",
};
