# election-contract
Simple educational smart contract                                                                                                 
      
#### Clone test ```election-contract``` repo
```     
git clone https://github.com/PavlovIvan/election-contract.git
cd election-contract
npm install hardhat
npm install
```        
#### Make tests run
```     
npx harhdat test
npx hardhat coverage
```

### Deploy local
```
npx hardhat node
npx hardhat run --network localhost scripts/deploy.js
```

### Deploy rinkeby
Create in the root of your project a ```.env``` file:
```
RENKEBY_URL=https://eth-rinkeby.alchemyapi.io/v2/<YOUR_ALCHEMY_APP_ID>
PRIVATE_KEY=<YOUR_BURNER_WALLET_PRIVATE_KEY>
```

```
npx hardhat run --network rinkeby scripts/deploy.js
```
