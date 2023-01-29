import { ethers } from "ethers";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import Web3Modal from "web3modal";
import Image from "next/image";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer, toast } from "react-toastify";

import { dogTokenAddress, dogMarketAddress } from "../config";

import DogToken from "../artifacts/contracts/DogToken.sol/DogToken.json";
import DogMarket from "../artifacts/contracts/DogMarket.sol/DogMarket.json";


export default function CreatorDashboard() {
  const [nfts, setNfts] = useState([]);
  const [sold, setSold] = useState([]);
  const [owned, setOwned] = useState([]);
  const [buttonId, setButtonId] = useState(null);
  const [salePrice, setSalePrice] = useState();
  const [loadingState, setLoadingState] = useState("not-loaded");
  const [marketTransactionHash, setMarketTransactionHash] = useState("");
  const [isTransacting, setIsTransacting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadNFTs();
  }, []);

  const loadPrice = (id) => {
    setButtonId(id);
  };

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
          contractId: token.contractId.toNumber(),
          price,
          tokenId: token.tokenId.toNumber(),
          seller: token.seller,
          owner: token.owner,
          creator: token.creator,
          image: url || " ",
          name: meta.data.name,
          description: meta.data.description,
          sold: token.sold,
        };
        return item;
      })
    );

    let nftsSorted = myCreatedNFTs.sort((nft1, nft2) =>
      nft1.tokenId > nft2.tokenId ? 1 : nft1.tokenId < nft2.tokenId ? -1 : 0
    );
    console.log("myCreatedNFTs", nftsSorted);
    setNfts(nftsSorted);

    const soldNFTs = myCreatedNFTs.filter((nft) => nft.creator !== nft.owner);
    console.log("soldNFTs", soldNFTs);
    setSold(soldNFTs);

    const ownedNFTs = myCreatedNFTs.filter((nft) => nft.creator === nft.owner);
    console.log("ownedNFTs", ownedNFTs);
    setOwned(ownedNFTs);

    setLoadingState("loaded");
  }

  async function sellNFT(nft) {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    const tokenId = nft.tokenId;
    const contractId = nft.contractId;
    console.log("contractId", contractId);
    console.log("salePrice", salePrice);
    console.log("price", nft.price);

    if (+salePrice <= 0 || salePrice === "" || salePrice === undefined) {
      let errorMessage = "Please enter a price to sell greater than 0 ETH!";
      toast.error(errorMessage, {
        theme: "colored",
      });
      return;
    }

    const price = ethers.utils.parseUnits(salePrice, "ether").toString();

    try {
      const marketContract = new ethers.Contract(
        dogMarketAddress,
        DogMarket.abi,
        signer
      );

      const tokenContract = new ethers.Contract(
        dogTokenAddress,
        DogToken.abi,
        signer
      );

      //approve the market contract to transfer the NFT
      const approveTx = await tokenContract.approve(dogMarketAddress, tokenId);
      await approveTx.wait();

      let commissionFee = await marketContract.getCommissionFee();
      commissionFee = commissionFee.toString();

      const transaction = await marketContract.sellMyNFT(
        dogTokenAddress,
        contractId,
        price,
        {
          value: commissionFee,
        }
      );
      console.log("transaction", transaction);

      const marketTx = await transaction.wait();
      if (marketTx.byzantium == true) {
        setMarketTransactionHash(marketTx.transactionHash);
        toast.success("Market Item Created successfully", {
          theme: "colored",
        });
      }
    } catch (e) {
      console.log("Error:", e);
      setIsTransacting(false);
      setIsLoading(false);
      let errorMessage = e.message;
      if (e.message.includes("user rejected transaction")) {
        errorMessage = "User rejected transaction";
      }
      if (e.message.includes("ERC721: invalid token ID")) {
        errorMessage = "ERC721: invalid token ID";
      }
      

      toast.error(errorMessage, {
        theme: "colored",
      });
    }
    loadNFTs();
  }
  if (loadingState === "loaded" && !nfts.length)
    return (
      <div className="grid place-items-center h-screen">
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
    <div className="h-full">
      <h1 className="py-10 px-20 text-4xl font-bold text-center">
        NFTs You Have Created
      </h1>
      <div className="flex justify-center">
        <div className="px-4" style={{ maxWidth: "1600px" }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            {nfts.map((nft, i) => (
              <div key={i} className="border shadow rounded-xl overflow-hidden mb-10">
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
            <h1 className="py-10 px-20 text-4xl font-bold  text-center">
              NFTs You Have Sold
            </h1>
            <div className="flex justify-center">
              <div className="px-4" style={{ maxWidth: "1600px" }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                  {sold.map((nft, i) => (
                    <div
                      key={i}
                      className="border shadow rounded-xl overflow-hidden mb-10"
                    >
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
          </div>
        )}
      </div>
      <div className="px-4">
        {Boolean(owned.length) && (
          <div>
            <h1 className="py-10 px-20 text-4xl font-bold  text-center">
              NFTs You Currently Own
            </h1>
            <div className="flex justify-center">
              <div className="px-4" style={{ maxWidth: "1600px" }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                {owned.map((nft, i) => (
              <div key={i} className="border shadow rounded-xl overflow-hidden mb-10">
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
                  priority
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

                {buttonId !== nft.tokenId ? (
                  <div className="p-4 bg-blue-800 h-full">
                    <p className="text-xl font-semi-bold text-yellow-400">
                      Price:
                    </p>
                    <p className="text-2xl mb-4 font-bold text-yellow-400">
                      {nft.price} ETH
                    </p>
                    <div className="grid place-items-center">
                      <button
                        className="w-76 items-center bg-red-700 shadow-lg text-white font-bold py-3 px-10 rounded"
                        onClick={() => loadPrice(nft.tokenId)}
                      >
                        Sell
                      </button>
                    </div>
                  </div>
                ) : buttonId === nft.tokenId ? (
                  <div className="p-4 bg-blue-800 h-full">
                    <p className="text-xl font-semi-bold text-yellow-400">
                      Price:
                    </p>
                    <p className="text-2xl mb-4 font-bold text-yellow-400">
                      {nft.price} ETH
                    </p>
                    <div className="flex mb-4">
                      <div className="w-1/2 h-12">
                        <button
                          className="w-11/12 ml-2 bg-red-700 shadow-lg text-white font-bold h-10 rounded-lg"
                          onClick={() => sellNFT(nft)}
                        >
                          List NFT
                        </button>
                      </div>
                      <div className="w-1/2 h-12">
                        <input
                          type="number"
                          name="price"
                          value={salePrice}
                          pattern="[0-9]"
                          placeholder="Price in ETH"
                          className="text-center w-11/12 mr-2 h-10 rounded-lg justfity-center"
                          onChange={(eventObj) =>
                            setSalePrice(eventObj.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
