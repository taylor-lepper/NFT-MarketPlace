import { useState, useRef } from "react";
import { ethers } from "ethers";
import Web3Modal from "web3modal";
import { useRouter } from "next/router";
import { NFTStorage } from "nft.storage";
import { ToastContainer, toast } from "react-toastify";
import styles from "../styles/CreateNFT.module.css";
import "react-toastify/dist/ReactToastify.css";

import { dogTokenAddress, dogMarketAddress } from "../config";

import DogToken from "../artifacts/contracts/DogToken.sol/DogToken.json";
import DogMarket from "../artifacts/contracts/DogMarket.sol/DogMarket.json";

export default function CreateItem() {
  const fileUpload = useRef(null);
  const apiKey = process.env.NEXT_PUBLIC_NFT_STORAGE_API_KEY;
  const client = new NFTStorage({ token: apiKey });
  const [fileUrl, setFileUrl] = useState(null);
  const [formInput, updateFormInput] = useState({
    price: "",
    name: "",
    description: "",
  });
  const [nftTransactionHash, setNftTransactionHash] = useState("");
  const [marketTransactionHash, setMarketTransactionHash] = useState("");
  const [isTransacting, setIsTransacting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function onChange() {
    try {
      const url = URL.createObjectURL(fileUpload.current.files[0]);
      setFileUrl(url);
    } catch (e) {
      console.log("Error:", e);
      let errorMessage = "";
      if (e.message.includes("user rejected transaction")) {
        errorMessage = "User rejected transaction";
      }
      toast.error(errorMessage, {
        theme: "colored",
      });
    }
  }

  //creates item and saves it to ipfs
  async function createItem() {
    setIsLoading(true);
    const { name, description, price } = formInput;
    console.log("name", name);
    console.log("description", description);
    console.log("price", price);

    if (!name || !description || !price || !fileUrl) {
      let blankMessage = "Please fill out all fields";
      toast.error(blankMessage, {
        theme: "dark",
      });
    }

    try {
      const { fileName, type } = fileUpload.current.files[0];
      const metadata = await client.store({
        name,
        description,
        image: new File(fileUpload.current.files, fileName, {
          type,
        }),
        properties: {
          price,
        },
      });
      const link = metadata.url.split("ipfs://")[1];
      const url = `https://nftstorage.link/ipfs/${link}`;
      createSale(url);
      setIsLoading(false);
    } catch (e) {
      console.log("Error uploading file: ", e);
      let errorMessage = "Error uploading file";
      if (e.message.includes("user rejected transaction")) {
        errorMessage = "User rejected transaction";
      }
      toast.error(errorMessage, {
        theme: "colored",
      });
    }
  }

  async function createSale(metadata) {
    console.log("metadata: ", metadata);
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    let contract = new ethers.Contract(dogTokenAddress, DogToken.abi, signer);
    try {
      setIsTransacting(true);
      setIsLoading(true);
      let transaction = await contract.createDogToken(metadata);
      let tx = await transaction.wait();

      console.log("tx:", tx);
      console.log("tx.gasUsed:", tx.gasUsed.toString());
      if (tx.byzantium == true) {
        setNftTransactionHash(tx.transactionHash);
        toast.success("NFT created successfully", {
          theme: "colored",
        });
      }
      let event = tx.events[0];
      let value = event.args[2];
      let tokenId = value.toNumber();
      const price = ethers.utils
        .parseUnits(formInput.price, "ether")
        .toString();

      contract = new ethers.Contract(dogMarketAddress, DogMarket.abi, signer);
      let listFee = await contract.getCommissionFee();
      listFee = listFee.toString();

      transaction = await contract.createDogNFT(
        dogTokenAddress,
        tokenId,
        price,
        {
          value: listFee,
        }
      );

      const marketTx = await transaction.wait();
      if (marketTx.byzantium == true) {
        setMarketTransactionHash(marketTx.transactionHash);
        toast.success("Market Item Created successfully", {
          theme: "colored",
        });
      }
      setIsLoading(false);
    } catch (e) {
      console.log("Error:", e);
      setIsTransacting(false);
      setIsLoading(false);
      let errorMessage = "";
      if (e.message.includes("user rejected transaction")) {
        errorMessage = "User rejected transaction";
      }
      toast.error(errorMessage, {
        theme: "colored",
      });
    }
  }

  const handleButtonClick = () => {
    setIsTransacting(false);
    router.push("/");
  };

  return (
    <>
      <ToastContainer position="top-center" pauseOnFocusLoss={false} />
      {!isTransacting ? (
        <div className="flex justify-center">
          <div className="w-1/2 flex flex-col pd-12">
          <p className="text-4xl font-bold pt-4">Create an NFT</p>
            <input
              placeholder="Asset Name"
              className="mt-8 border rounded p-4"
              onChange={(e) =>
                updateFormInput({
                  ...formInput,
                  name: e.target.value,
                })
              }
            />
            <textarea
              placeholder="Asset Description"
              className="mt-2 border rounded p-4"
              onChange={(e) =>
                updateFormInput({
                  ...formInput,
                  description: e.target.value,
                })
              }
            />
            <input
              placeholder="Asset Price in Ether"
              className="mt-2 border rounded p-4"
              onChange={(e) =>
                updateFormInput({
                  ...formInput,
                  price: e.target.value,
                })
              }
            />
            <input
              ref={fileUpload}
              type="file"
              name="Asset"
              className="my-4"
              onChange={onChange}
            />
            {fileUrl && (
              <img className="rounded mt-4" width="350" src={fileUrl} />
            )}
            <button
              onClick={createItem}
              className={
                "font-bold mt-4 bg-purple-500 text-white rounded p-4 shadow-lg"
              }
            >
              Create Digital Asset
            </button>
          </div>
         
        </div>
      ) : (
        <div>
          {nftTransactionHash && (
            <div className="flex flex-col mt-2 border rounded p-4 flex-row-reverse">
              <div>
                <button
                  onClick={handleButtonClick}
                  className="border rounded px-4 py-3 bg-purple-600 text-white font-bold flex justify-right"
                >
                  Back to home
                </button>
              </div>
              <h1 className="flex justify-center">
                <font color="purple">
                  <b>Transaction Receipts</b>
                </font>
              </h1>
              <p className="flex justify-center">
                <strong>View your Transactions on Etherscan:</strong>
              </p>
              <br></br>
              {nftTransactionHash && (
                <p>
                  <a
                    href={`https://goerli.etherscan.io/tx/${nftTransactionHash}`}
                    target="_blank"
                  >
                    <strong>NFT transaction receipt: </strong>
                    <font color="blue">{` ${nftTransactionHash}`}</font>
                    <br></br>
                    <br></br>
                  </a>
                </p>
              )}
              {marketTransactionHash && (
                <p>
                  <a
                    href={`https://goerli.etherscan.io/tx/${marketTransactionHash}`}
                    target="_blank"
                  >
                    <strong>Market transaction receipt: </strong>
                    <font color="blue">{` ${marketTransactionHash}`} </font>
                  </a>
                </p>
              )}
            </div>
          )}

          {/* Transaction Instructions/Steps */}
          <h1 className="flex justify-center">
            <b>Transaction in progress. Please wait...</b>
          </h1>
          <div
            className={nftTransactionHash ? undefined : styles.loading}
          ></div>
          <h1 className="flex justify-center">
            <b>Step 1 :</b>
            <font> Confim wallet transaction in order to create the NFT</font>
          </h1>
          <br></br>
          <h1 className="flex justify-center">
            <b>Step 2 :</b>
            <font>
              (Optional) Confirm wallet transaction in order to list NFT in the
              Marketplace
            </font>
          </h1>
          <br></br>
          <h1 className="flex justify-center">
            <b>Step 3 :</b>
            <font>Wait for transaction to be mined...</font>
          </h1>
          <br></br>
          <h1 className="flex justify-center">
            <b>Step 4 :</b>
            <font>
              (Optional) Review transaction on Etherscan by clicking on the
              transaction hashes. Both of which are highlighted above in blue!
            </font>
          </h1>
        </div>
      )}
    </>
  );
}
