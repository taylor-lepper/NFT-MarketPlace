import axios from "axios";
import { ethers } from "ethers";
import Web3Modal from "web3modal";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";

import { dogTokenAddress, dogMarketAddress } from "../config";

import DogToken from "../artifacts/contracts/DogToken.sol/DogToken.json";
import DogMarket from "../artifacts/contracts/DogMarket.sol/DogMarket.json";

export default function Market() {
  const [messageInfo, setMessageInfo] = useState(null);
  const [messageSuccess, setMessageSuccess] = useState(null);
  const [messageError, setMessageError] = useState(null);
  const [nfts, setNfts] = useState([]);
  const [loadingState, setLoadingState] = useState("not-loaded");
  const router = useRouter();

  useEffect(() => {
    loadNFTs();
  }, []);

  const reRouteToCreate = () => {
    router.push("/createNFT");
  };
  const reRouteToMyNFTs = () => {
    router.push("/myNFTs");
  };

  async function loadNFTs() {
    const provider = new ethers.providers.JsonRpcProvider();
    const dogTokenContract = new ethers.Contract(
      dogTokenAddress,
      DogToken.abi,
      provider
    );
    const dogMarketContract = new ethers.Contract(
      dogMarketAddress,
      DogMarket.abi,
      provider
    );
    const data = await dogMarketContract.getAllNFTs();
    console.log("data", data);

    const nftsForSale = await Promise.all(
      data.map(async (token) => {
        const tokenUri = await dogTokenContract.tokenURI(token.tokenId);
        const meta = await axios.get(tokenUri); // https://ipfs.....
        console.log("meta", meta);
        let price = ethers.utils.formatUnits(token.price.toString(), "ether");

        // change link for nft.storage format
        const link = meta.data?.image?.split("ipfs://")[1];
        const url = `https://nftstorage.link/ipfs/${link}`;
        // set up item for viewing on market
        let item = {
          contractId: token.contractId.toNumber(),
          price,
          tokenId: token.tokenId.toNumber(),
          seller: token.seller,
          owner: token.owner,
          creator: token.creator,
          image: url || " ",
          name: meta.data.name,
          description: meta.data.description,
        };
        console.log("item", item);
        return item;
      })
    );
    let nftsSorted = nftsForSale.sort((nft1, nft2) =>
      nft1.tokenId > nft2.tokenId ? 1 : nft1.tokenId < nft2.tokenId ? -1 : 0
    );
    setNfts(nftsSorted);
    console.log("nfts", nftsSorted);
    setLoadingState("loaded");
  }

  async function buyNFT(nft) {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);

    const signer = provider.getSigner();
    const contract = new ethers.Contract(
      dogMarketAddress,
      DogMarket.abi,
      signer
    );

    console.log("contractId", nft.contractId);
    const price = ethers.utils.parseUnits(nft.price.toString(), "ether");

    try {
      setMessageInfo("Confirm the transaction to purchase the NFT.\nIf you've changed your mind, simply click 'reject.'");
      setTimeout(() => {
        setMessageInfo("");
      }, 6000);
      const purchaseTxn = await contract.transferDogNFT(
        dogTokenAddress,
        nft.contractId,
        {
          value: price,
        }
      );
      await purchaseTxn.wait();
      loadNFTs();

      setMessageSuccess("Purchase successful. View under My NFTs.");
      setTimeout(() => {
        setMessageSuccess("");
      }, 4000);
    } catch (e) {
      console.log("Purchase error: ", e);
      let errorMessage = e.message;
      if (e.message.includes("user rejected transaction")) {
        errorMessage = "User rejected the Wallet transaction";
      }
      setMessageError(errorMessage);
      setTimeout(() => {
        setMessageError("");
      }, 4000);
      return;
    }
  }

  if (loadingState === "loaded" && !nfts.length)
    return (
      <div className="grid place-items-center">
        <h1 className="pt-8 pb-8 px-20 text-4xl font-bold text-center">
          NFTs Currently For Sale
        </h1>
        <h1 className="px-20 py-10 text-3xl text-center">
          No items in marketplace!
        </h1>
        <div className="grid place-items-center border-solid border-2 rounded-lg border-blue-700 mt-20">
          <h1 className="pt-8 pb-8 px-20 text-3xl text-center">
            You can Create one from the Create NFT page!
          </h1>
          <div className="justify-center">
            <button
              className="w-80 items-center font-bold mt-4 mb-8 bg-blue-700 text-white rounded p-4 shadow-lg"
              onClick={reRouteToCreate}
            >
              Create NFT
            </button>
          </div>
          <h1 className="pt-4 pb-8 px-20 text-3xl text-center">
            Or put one of your NFTs up for sale!
          </h1>
          <div className="justify-center">
            <button
              className="w-80 items-center font-bold mt-4 mb-8 bg-blue-700 text-white rounded p-4 shadow-lg"
              onClick={reRouteToMyNFTs}
            >
              My NFTs
            </button>
          </div>
        </div>
      </div>
    );

  return (
    <div>
      <h1 className="pt-8 pb-8 px-20 text-4xl font-bold text-center">
        NFTs Currently For Sale
      </h1>
      <div className="">
        {messageInfo && (
          <h1 className="mt-6 mb-6 mr-20 ml-20 whitespace-pre-wrap border border-black rounded bg-yellow-400 h-30 text-center p-6 text-xl">
            {messageInfo}
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
        {messageError && (
          <h1 className="mt-6 mb-6 mr-20 ml-20 border border-black rounded bg-red-500 h-30 text-center p-6 text-xl">
            {messageError}
          </h1>
        )}
      </div>
      <div className="flex justify-center">
        <div className="px-4" style={{ maxWidth: "1600px" }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            {nfts.map((nft, i) => (
              <div key={i} className="border shadow rounded-xl overflow-hidden mx-2">
                <div className="p-4 bg-black">
                  <p
                    style={{ height: "32px" }}
                    className="text-2xl text-white font-semibold text-ellipsis overflow-hidden"
                  >
                    {nft.name}
                  </p>
                  <p className="text-xl text-white font-semibold">
                    ID: {nft.tokenId}
                  </p>
                </div>
                <Image
                  alt="nft"
                  priority
                  src={nft.image}
                  style={{
                    width: "350px",
                    height: "350px",
                    objectFit: "cover",
                  }}
                  width={350}
                  height={350}
                />
                <div
                  className="p-4 bg-gray-400"
                  style={{
                    height: "132px",
                  }}
                >
                  <p className="text-xl font-semi-bold text-white">
                    Description:
                  </p>
                  <p className="text-white text-ellipsis overflow-hidden">
                    {nft.description}
                  </p>
                </div>
                <div className="p-4 bg-blue-800">
                  <p className="text-xl font-semi-bold text-yellow-400">
                    Price:
                  </p>
                  <p className="text-2xl mb-4 font-bold text-yellow-400">
                    {nft.price} ETH
                  </p>

                  <div className="grid place-items-center">
                    <button
                      className="w-76 items-center bg-green-700 shadow-lg text-white font-bold py-3 px-10 rounded"
                      onClick={() => buyNFT(nft)}
                    >
                      Purchase NFT
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
