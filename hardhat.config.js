require("@nomiclabs/hardhat-waffle");
require('solidity-coverage')
require('dotenv').config()


module.exports = {
  solidity: "0.8.0",
  networks: {
    rinkeby: {
      url: process.env.RENKEBY_URL || '',
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
  },
};
