import axios from "axios";
import { ethers } from "ethers";
import Web3Modal from "web3modal";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";

// import { dogTokenAddress, dogMarketAddress } from "../config";
import { dogTokenAddressGoerli, dogMarketAddressGoerli } from "../config";

import DogToken from "../artifacts/contracts/DogToken.sol/DogToken.json";
import DogMarket from "../artifacts/contracts/DogMarket.sol/DogMarket.json";

export default function Market() {
  const [messageInfo, setMessageInfo] = useState(null);
  const [messageSuccess, setMessageSuccess] = useState(null);
  const [messageError, setMessageError] = useState(null);
  const [nfts, setNfts] = useState([]);
  const [floor, setFloor] = useState("");
  const [loadingState, setLoadingState] = useState("not-loaded");
  const [transacting, setTransacting] = useState("not-transacting");
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
    // const provider = new ethers.providers.JsonRpcProvider();
    const INFURA_PROJECT_ID = "84516ca20ad64919946349869d0a94cd";
		const provider = new ethers.providers.InfuraProvider(
			"goerli",
			INFURA_PROJECT_ID
		);
    const dogTokenContract = new ethers.Contract(
      dogTokenAddressGoerli,
      DogToken.abi,
      provider
    );
    const dogMarketContract = new ethers.Contract(
      dogMarketAddressGoerli,
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
          marketId: token.marketId.toNumber(),
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
    if (nftsForSale.length > 0) {
      getFloorPrice(nftsForSale);
    }
    let nftsSorted = nftsForSale.sort((nft1, nft2) =>
      nft1.tokenId > nft2.tokenId ? 1 : nft1.tokenId < nft2.tokenId ? -1 : 0
    );
    setNfts(nftsSorted);
    console.log("nfts", nftsSorted);
    setLoadingState("loaded");
  }

  async function buyNFT(nft) {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
      /* you can also use 'auto' behaviour
         in place of 'smooth' */
    });
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);

    const signer = provider.getSigner();
    const contract = new ethers.Contract(
      dogMarketAddressGoerli,
      DogMarket.abi,
      signer
    );

    console.log("marketId", nft.marketId);
    const price = ethers.utils.parseUnits(nft.price.toString(), "ether");

    try {
     
      setMessageInfo(
        "Confirm the transaction to purchase the NFT.\nIf you've changed your mind, simply click 'reject.'"
      );
      setTimeout(() => {
        setMessageInfo("");
      }, 160000);
      const purchaseTxn = await contract.transferDogNFT(
        dogTokenAddressGoerli,
        nft.marketId,
        {
          value: price,
        }
      );
      setTransacting("transacting");
      await purchaseTxn.wait();
      setTransacting("not-transacting");
      loadNFTs();
      setMessageInfo();
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
      if (e.message.includes("insufficient funds")) {
        errorMessage = "You have insufficient funds to complete the transaction";
      }
      setMessageInfo();
      setMessageError(errorMessage);
      setTimeout(() => {
        setMessageError("");
      }, 4000);
      return;
    }
    setTransacting("not-transacting");
  }

  const getFloorPrice = (nfts) => {
    let nftSortByPrice = nfts.sort((nft1, nft2) =>
      +nft1.price > +nft2.price ? 1 : +nft1.price < +nft2.price ? -1 : 0
    );
    console.log("nftSortByPrice", nftSortByPrice);
    let floorPrice = nftSortByPrice[0].price;
    console.log("floorPrice: ", floorPrice, "ETH");
    setFloor(floorPrice);
  };

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
      {transacting === "transacting" && (
          <div className="flex align-center text-center mr-20 ml-20 justify-center h-30 mt-2 mb-6 border border-black rounded bg-green-300 ">
            <h1 className="text-center p-6 text-3xl font-semi-bold">
              Transacting...{" "}
            </h1>
            <div className="my-5 w-12 h-12 animate-spin rounded-full bg-gradient-to-r from-purple-400 via-blue-500 to-red-400">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-gray-200 rounded-full border-2 border-white"></div>
            </div>
          </div>
        )}

        {loadingState === "not-loaded" && (
          <div className="flex align-center justify-center h-30 mt-2 mb-6 mr-20 ml-20 border border-black rounded bg-yellow-400 ">
            <h1 className="text-center p-6 text-3xl font-semi-bold">
              Loading...{" "}
            </h1>
            <div className="my-5 w-12 h-12 animate-spin rounded-full bg-gradient-to-r from-purple-400 via-blue-500 to-red-400">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-gray-200 rounded-full border-2 border-white"></div>
            </div>
          </div>
        )}
 
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
              <div
                key={i}
                className="border shadow rounded-xl overflow-hidden mx-2"
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
                    width: "400px",
                    height: "400px",
                    objectFit: "cover",
                  }}
                  width={400}
                  height={400}
                />
                <div
                  className="p-4 bg-gray-400"
                  style={{
                    height: "100px",
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

                  <p className="text-lg font-semi-bold text-yellow-400">
                    Collection Floor Price:
                  </p>
                  <p className="text-xl mb-4 font-bold text-yellow-400">
                    {floor} ETH
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
