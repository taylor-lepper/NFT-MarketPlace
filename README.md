To Run Project Locally Through Hardhat:

Start a local node by opening a terminal in the project directory:
command = "npx hardhat node"

Then deploy the contracts in another terminal in the project directory:
command = "npx hardhat run scripts/deploy.js --network localhost"

<Update the config.js file with the new contract addresses if needed (they are logged in the console)>
<Note: you will have to overwrite the new Goerli contract addresses with the local ones in the config file, since the variables throughout the project have been changed to reflect testnet deploy>

Finally fire up the front end in another terminal in the project directory:
command = "npm run dev"



Project has now been deployed to the Goerli Test Net.

To run the project:

Open a terminal in the project directory and install the node_modules:
command = "npm install"

Finally, using the same terminal, fire up the the server for the front end:
command = "npm run dev"

