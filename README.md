To Run Locally Through Hardhat:

Start a node with terminal in project directory.
npx hardhat node

Then deploy contracts in another terminal:
npx hardhat run scripts/deploy.js --network localhost

Update the config.js file with the new contract addresses if needed (they are in the console)

Then fire up the front end in another terminal:
npm run dev