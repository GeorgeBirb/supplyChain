module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // for more about customizing your Truffle configuration!
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "5777",
      accounts: ["0x6E9f1e700bdC288beda0c6002C9ba438830Ad2ad", "0x7cCc9ec979b41Dc414D8Ad7B6480F7C830B94269", "0xbf0C9650869c5DC0589a13DbB42dB6fd6c51C20f"] 
    }
  },
  compilers: {
    solc: {
      version: '0.8.0',
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  }
};