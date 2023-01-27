import { ethers } from "ethers";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import Web3Modal from "web3modal";
import Image from "next/image";

import { dogTokenAddress, dogMarketAddress } from "../config";

import DogToken from "../artifacts/contracts/DogToken.sol/DogToken.json";
import DogMarket from "../artifacts/contracts/DogMarket.sol/DogMarket.json";

export default function CreatorDashboard() {
  const [nfts, setNfts] = useState([]);
  const [sold, setSold] = useState([]);
  const [loadingState, setLoadingState] = useState("not-loaded");
  const router = useRouter();

  useEffect(() => {
    loadNFTs();
  }, []);

  const reRoute = () => {
    router.push("/createNFT");
  };

  async function loadNFTs() {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    const dogMarketContract = new ethers.Contract(
      dogMarketAddress,
      DogMarket.abi,
      signer
    );
    const dogTokenContract = new ethers.Contract(
      dogTokenAddress,
      DogToken.abi,
      signer
    );
    const data = await dogMarketContract.getNFTsMinted();
    console.log("data", data);

    const myCreatedNFTs = await Promise.all(
      data.map(async (token) => {
        const tokenUri = await dogTokenContract.tokenURI(token.tokenId);
        const meta = await axios.get(tokenUri);
        console.log("meta", meta);
        const link = meta.data?.image?.split("ipfs://")[1];
        const url = `https://nftstorage.link/ipfs/${link}`;
        let price = ethers.utils.formatUnits(token.price.toString(), "ether");
        let item = {
          price,
          tokenId: token.tokenId.toNumber(),
          seller: token.seller,
          owner: token.owner,
          image: url || " ",
          name: meta.data.name,
          description: meta.data.description,
          sold: token.sold,
        };
        return item;
      })
    );
    console.log("myCreatedNFTs", myCreatedNFTs);
    const soldNFTs = myCreatedNFTs.filter((token) => token.sold);
    console.log("soldNFTs", soldNFTs);
    setSold(soldNFTs);
    setNfts(myCreatedNFTs);
    setLoadingState("loaded");
  }
  if (loadingState === "loaded" && !nfts.length)
    return (
      <div className="grid place-items-center">
        <h1 className="mt-8 pt-8 px-20 text-3xl text-center">
          You haven't created any NFTs.
        </h1>

        <div className="grid place-items-center border-solid border-2 rounded-lg border-blue-700 mt-20">
          <h1 className="pt-8 pb-8 px-20 text-3xl text-center">
            You can do so from the Create NFT page!
          </h1>
          <button
            className="w-80 items-center mb-8 font-bold mt-4 bg-blue-700 text-white rounded p-4 shadow-lg"
            onClick={reRoute}
          >
            Create NFT
          </button>
        </div>
      </div>
    );
  return (
    <div>
      <h1 className="py-10 px-20 text-4xl font-bold  text-center">
        NFTs You Have Created
      </h1>
      <div className="flex justify-center">
        <div className="px-4" style={{ maxWidth: "1600px" }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            {nfts.map((nft, i) => (
              <div key={i} className="border shadow rounded-xl overflow-hidden">
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
                    width: "450px",
                    height: "250px",
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
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="px-4">
        {Boolean(sold.length) && (
          <div>
            <h2 className="text-2xl py-2">Items Sold</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
              {sold.map((nft, i) => (
                <div
                  key={i}
                  className="border shadow rounded-xl overflow-hidden"
                >
                  <img src={nft.image} className="rounded" />
                  <div className="p-4 bg-black">
                    <p className="text-2xl font-bold text-white">
                      {nft.price} Eth
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
