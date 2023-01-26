import axios from "axios";
import { ethers } from "ethers";
import Web3Modal from "web3modal";
import { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Image from "next/image";

import { dogTokenAddress, dogMarketAddress } from "../config";

import DogToken from "../artifacts/contracts/DogToken.sol/DogToken.json";
import DogMarket from "../artifacts/contracts/DogMarket.sol/DogMarket.json";

export default function Market() {
  const [nfts, setNfts] = useState([]);
  const [loadingState, setLoadingState] = useState("not-loaded");

  useEffect(() => {
    loadNFTs();
  }, []);

  async function loadNFTs() {
    const provider = new ethers.providers.JsonRpcProvider();
    const dogTokenContract = new ethers.Contract(dogTokenAddress, DogToken.abi, provider);
    const dogMarketContract = new ethers.Contract(
      dogMarketAddress,
      DogMarket.abi,
      provider
    );
    const data = await dogMarketContract.getAllNFTs();
    console.log("data", data);

    const items = await Promise.all(
      data.map(async (i) => {
        const tokenUri = await dogTokenContract.tokenURI(i.tokenId);
        const meta = await axios.get(tokenUri); // https://ipfs.....
        console.log("meta", meta);
        let price = ethers.utils.formatUnits(i.price.toString(), "ether");

        // change link for nft.storage format
        const link = meta.data?.image?.split("ipfs://")[1];
				const url = `https://nftstorage.link/ipfs/${link}`;
        // set up item for viewing on market
        let item = {
          price,
          tokenId: i.tokenId.toNumber(),
          seller: i.seller,
          owner: i.owner,
          image: url || " ",
          name: meta.data.name,
          description: meta.data.description,
        };
        console.log("item", item);
        return item;
      })
    );
    setNfts(items);
    console.log("nfts", nfts);
    setLoadingState("loaded");
  }

  async function buyNFT(nft) {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);

    const signer = provider.getSigner();
    const contract = new ethers.Contract(dogMarketAddress, DogMarket.abi, signer);

    const price = ethers.utils.parseUnits(nft.price.toString(), "ether");

    const transaction = await contract.sellDog(
      dogTokenAddress,
      nft.tokenId,
      {
        value: price,
      }
    );

    await transaction.wait();
    loadNFTs();
  }

  if (loadingState === "loaded" && !nfts.length)
  return (
    <h1 className="px-20 py-10 text-3xl">No items in marketplace</h1>
  );

return (
  <div>
    <ToastContainer position="top-center" pauseOnFocusLoss={false} />
    <div className="flex justify-center">
      <div className="px-4" style={{ maxWidth: "1600px" }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {nfts.map((nft, i) => (
            <div
              key={i}
              className="border shadow rounded-xl overflow-hidden"
            >
              <Image
                alt="nft"
                src={nft.image}
                style={{
                  width: "450px",
                  height: "250px",
                  objectFit: "cover",
                }}
                width={350}
                height={350}
              />
              <div className="p-4">
                <p
                  style={{ height: "64px" }}
                  className="text-2xl font-semibold"
                >
                  {nft.name}
                </p>
                <div
                  style={{
                    height: "70px",
                    //overflow: "hidden",
                  }}
                >
                  <p className="text-gray-400">
                    {nft.description}
                  </p>
                </div>
              </div>
              <div className="p-4 bg-black">
                <p className="text-2xl mb-4 font-bold text-white">
                  {nft.price} ETH
                </p>
                <button
                  className="w-full bg-pink-500 text-white font-bold py-2 px-12 rounded"
                  onClick={() => buyNft(nft)}
                >
                  Buy
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);
}