import { useState, useRef } from "react";
import { useRouter } from "next/router";
import { ethers } from "ethers";
import Web3Modal from "web3modal";
import { NFTStorage } from "nft.storage";
import Image from "next/image";

import { dogTokenAddress, dogMarketAddress } from "../config";

import DogToken from "../artifacts/contracts/DogToken.sol/DogToken.json";
import DogMarket from "../artifacts/contracts/DogMarket.sol/DogMarket.json";

export default function CreateItem() {
  const router = useRouter();
  // form inputs
  const fileUpload = useRef(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [fileUrl, setFileUrl] = useState(null);
  // messages
  const [messageInfo, setMessageInfo] = useState(null);
  const [messageInfo1, setMessageInfo1] = useState(null);
  const [messageInfo2, setMessageInfo2] = useState(null);
  const [messageSuccess, setMessageSuccess] = useState(null);
  const [messageSuccess2, setMessageSuccess2] = useState(null);
  const [messageError, setMessageError] = useState(null);

  // nft storage
  const apiKey = process.env.NEXT_PUBLIC_NFT_STORAGE_API_KEY;
  const nftStorageClient = new NFTStorage({ token: apiKey });

  // deals with image upload from disc
  async function fileOnChange() {
    try {
      const url = URL.createObjectURL(fileUpload.current.files[0]);
      setFileUrl(url);
    } catch (e) {
      console.log("Error:", e);
      let errorMessage = e.message;
      if (e.message.includes("user rejected transaction")) {
        errorMessage = "User rejected transaction";
      }
      setMessageError(errorMessage);
      setTimeout(() => {
        setMessageError("");
      }, 4000);
      return;
    }
  }

  // creates item and saves it to ipfs
  async function createItem() {
    window.scrollTo({
      top: 0, 
      behavior: 'smooth'
      /* you can also use 'auto' behaviour
         in place of 'smooth' */
    });
    console.log("name: ", name);
    console.log("description: ", description);
    console.log("price: ", price);

    if (!name || !description || !price || !fileUrl) {
      let formErrorMessage = "Please fill out all fields and upload an image.";
      setMessageError(formErrorMessage);
      setTimeout(() => {
        setMessageError("");
      }, 4000);
      return;
    }

    try {
      let metaMaskMessage = `Please wait for the MetaMask wallet to appear. \nYou must accept both transactions.`;
      setMessageInfo(metaMaskMessage);
      setTimeout(() => {
        setMessageInfo("");
      }, 160000);
      const { fileName, type } = fileUpload.current.files[0];
      const nftStorageData = await nftStorageClient.store({
        name,
        description,
        image: new File(fileUpload.current.files, fileName, {
          type,
        }),
        properties: {
          price,
        },
      });
      const link = nftStorageData.url.split("ipfs://")[1];
      const url = `https://nftstorage.link/ipfs/${link}`;
      createSale(url);
    } catch (e) {
      console.log("Error uploading file: ", e);
      let errorMessage = e.message;
      if (e.message.includes("user rejected transaction")) {
        errorMessage = "User rejected the Wallet transaction.";
      }
      setMessageError(errorMessage);
      setTimeout(() => {
        setMessageError("");
      }, 4000);
      return;
    }
  }

  // create token and market listing
  async function createSale(nftStorageData) {
    console.log("nftStorageData: ", nftStorageData);
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    const tokenContract = new ethers.Contract(
      dogTokenAddress,
      DogToken.abi,
      signer
    );
    try {
      setMessageInfo1("#1\nCreate the token.");
      setTimeout(() => {
        setMessageInfo1("");
      }, 10000);
      const tokenTransaction = await tokenContract.createDogToken(
        nftStorageData
      );
      let tokenTxn = await tokenTransaction.wait();

      console.log("tokenTxn: ", tokenTxn);
      console.log("tokenTxn.gasUsed:", tokenTxn.gasUsed.toString());
      if (tokenTxn.byzantium == true) {
        setMessageSuccess("Token created successfully");
        setTimeout(() => {
          setMessageSuccess("");
        }, 6000);
      }
      let event = tokenTxn.events[0];
      let value = event.args[2];
      let tokenId = value.toNumber();

      const priceEthers = ethers.utils
        .parseUnits(price, "ether")
        .toString();

      const marketContract = new ethers.Contract(
        dogMarketAddress,
        DogMarket.abi,
        signer
      );
      let commissionFee = await marketContract.getCommissionFee();
      commissionFee = commissionFee.toString();

      setMessageInfo1();
      setMessageInfo2("#2\nCreate a Market item, and list for sale.");
      setTimeout(() => {
        setMessageInfo2("");
      }, 8000);
      // creation of market listing
      const marketTransaction = await marketContract.createDogNFT(
        dogTokenAddress,
        tokenId,
        priceEthers,
        {
          value: commissionFee,
        }
      );
      const marketTxn = await marketTransaction.wait();
      console.log("marketTxn", marketTxn);
      if (marketTxn.byzantium == true) {
        setName("");
        setDescription("");
        setPrice("");
        setFileUrl(null);
        setMessageInfo();
        setMessageInfo2();
        setMessageSuccess();
        setMessageSuccess2(
          "NFT Listing created successfully!\nRedirecting to the Market!"
        );
        setTimeout(() => {
          setMessageSuccess2("");
          reRouteMarket();
        }, 2500);
      }
    } catch (e) {
      console.log("Error:", e);
      let errorMessage = e.message;
      if (e.message.includes("user rejected transaction")) {
        errorMessage = "User rejected the Wallet transaction.";
      }
      setMessageInfo();
      setMessageInfo1();
      setMessageInfo2();
      setMessageError(errorMessage);
      setTimeout(() => {
        setMessageError("");
      }, 4000);
      return;
    }
  }

  const reRouteMarket = () => {
    router.push("/");
  };

  return (
    <>
      <div className="">
        <p className="text-4xl font-bold pt-8 text-center">Create an NFT</p>
        <div className="justify-center">
          <div className="">
            {messageInfo && (
              <h1 className="mt-6 mb-6 mr-20 ml-20 whitespace-pre-wrap place-items-center border border-black rounded bg-yellow-400 h-30 text-center p-6 text-xl">
                {messageInfo}
              </h1>
            )}
          </div>
          <div className="">
            {messageInfo1 && (
              <h1 className="mt-6 mb-6 mr-20 ml-20 whitespace-pre-wrap place-items-center border border-black rounded bg-yellow-200 h-30 text-center p-6 text-xl">
                {messageInfo1}
              </h1>
            )}
          </div>
          <div className="">
            {messageInfo2 && (
              <h1 className="mt-6 mb-6 mr-20 ml-20 whitespace-pre-wrap place-items-center border border-black rounded bg-yellow-200 h-30 text-center p-6 text-xl">
                {messageInfo2}
              </h1>
            )}
          </div>
          <div className="">
            {messageSuccess && (
              <h1 className="mt-6 mb-6 mr-20 ml-20 whitespace-pre-wrap place-items-center border border-black rounded bg-green-300 h-30 text-center p-6 text-xl">
                {messageSuccess}
              </h1>
            )}
          </div>
          <div className="">
            {messageSuccess2 && (
              <h1 className="mt-6 mb-6 mr-20 ml-20 whitespace-pre-wrap place-items-center border border-black rounded bg-green-300 h-30 text-center p-6 text-xl">
                {messageSuccess2}
              </h1>
            )}
          </div>
          <div className="">
            {messageError && (
              <h1 className="mt-6 mb-6 mr-20 ml-20 border border-black place-items-center rounded bg-red-500 h-30 text-center p-6 text-xl">
                {messageError}
              </h1>
            )}
          </div>
        </div>
        <div className="flex justify-center">
          <div className="w-1/2 flex flex-col pd-12">
            <label className="mt-8 text-xl" htmlFor="name">
              Name:
            </label>
            <input
              placeholder="Name Your NFT             ======> (maximum 30 characters)"
              maxLength="30"
              name="name"
              className="mt-2 border rounded p-4 bg-blue-200 font-black text-lg"
              value={name}
              onChange={(eventObj) => setName(eventObj.target.value)}
            />
            <label className="mt-4 text-xl" htmlFor="description">
              Description:
            </label>
            <input
              placeholder="Describe Your NFT         ======> (maximum 50 characters)"
              maxLength="50"
              name="description"
              className="mt-2 border rounded p-4 bg-blue-200 font-black text-lg"
              value={description}
              onChange={(eventObj) => setDescription(eventObj.target.value)}
            />
            <label className="mt-4 text-xl" htmlFor="price">
              Price:
            </label>
            <input
              placeholder="Set An Auction Price      ======> (in Ether)"
              className="mt-2 border rounded p-4 bg-blue-200 font-black text-lg"
              type="number"
              name="price"
              pattern="[0-9]"
              value={price}
              onChange={(eventObj) => setPrice(eventObj.target.value)}
            />
            <label className="mt-4 text-xl" htmlFor="file">
              File:
            </label>
            <input
              ref={fileUpload}
              type="file"
              name="file"
              className="mt-2 text-lg"
              onChange={fileOnChange}
            />
            {fileUrl && (
              <div className="my-4 p-4 bg-blue-200 border text-center border-4 border-black rounded-xl">
                <p className="mt-6 mb-2 text-2xl font-semi-bold">
                  File Preview:
                </p>
                <Image
                  priority
                  alt="fileUpload"
                  src={fileUrl}
                  className="rounded-lg border-black mt-6 mb-2 mx-auto"
                  style={{
                    width: "350px",
                    height: "350px",
                    objectFit: "cover",
                  }}
                  width={350}
                  height={350}
                />
              </div>
            )}
            <button
              onClick={createItem}
              className="font-bold mt-4 mb-10 bg-blue-700 text-white rounded p-4 shadow-lg"
            >
              Create Your NFT
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
