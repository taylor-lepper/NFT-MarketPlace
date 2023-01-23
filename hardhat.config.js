require("@nomiclabs/hardhat-waffle");
const fs = require("fs");

const privateKey = fs.readFileSync('.secret').toString();
const projectId = "84516ca20ad64919946349869d0a94cd";



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
  solidity: "0.8.4",
};
