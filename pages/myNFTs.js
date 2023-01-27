import { ethers } from "ethers";
import { useEffect, useState } from "react";
import axios from "axios";
import Web3Modal from "web3modal";
import { useRouter } from "next/router";
import Image from "next/image";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer, toast } from "react-toastify";

// contract addresses
import { dogTokenAddress, dogMarketAddress } from "../config";

// contracts
import DogToken from "../artifacts/contracts/DogToken.sol/DogToken.json";
import DogMarket from "../artifacts/contracts/DogMarket.sol/DogMarket.json";

export default function MyNFTs() {
  const [nfts, setNfts] = useState([]);
  const [loadingState, setLoadingState] = useState("not-loaded");
  const [isTransacting, setIsTransacting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPrice, setShowPrice] = useState(false);
  const [salePrice, setSalePrice] = useState();
  const router = useRouter();

  useEffect(() => {
    loadNFTs();
  }, []);

  const reRoute = () => {
    router.push("/");
  };

  const loadPrice = () => {
    setShowPrice(true);
  };

  async function loadNFTs() {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

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
    const data = await marketContract.getMyOwnedNfts();
    console.log("data", data);

    const myNFTs = await Promise.all(
      data.map(async (token) => {
        const tokenUri = await tokenContract.tokenURI(token.tokenId);
        const meta = await axios.get(tokenUri);

        const link = meta.data?.image?.split("ipfs://")[1];
        const url = `https://nftstorage.link/ipfs/${link}`;

        let price = ethers.utils.formatUnits(token.price.toString(), "ether");
        let item = {
          id: token.id.toNumber(),
          price,
          tokenId: token.tokenId.toNumber(),
          creator: token.creator,
          seller: token.seller,
          owner: token.owner,
          image: url || " ",
          name: meta.data.name,
          description: meta.data.description,
        };
        return item;
      })
    );
    console.log("myNFTs", myNFTs);
    setNfts(myNFTs);
    setLoadingState("loaded");
  }

  async function sellNFT(nft) {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    const tokenId = nft.tokenId;
    console.log("id", nft.id)

    console.log("salePrice", salePrice);
    const price = ethers.utils.parseUnits(salePrice, "ether").toString();

    try {
      const marketContract = new ethers.Contract(
        dogMarketAddress,
        DogMarket.abi,
        signer
      );

      const ownerOf = await marketContract.ownerOf(tokenId);
      console.log(ownerOf);
      
      let commissionFee = await marketContract.getCommissionFee();
      commissionFee = commissionFee.toString();

      const transaction = await marketContract.sellMyNFT(
        dogTokenAddress,
        tokenId,
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
      let errorMessage = "";
      if (e.message.includes("user rejected transaction")) {
        errorMessage = "User rejected transaction";
      }
      toast.error(errorMessage, {
        theme: "colored",
      });
    }
    loadNFTs();
  }

  if (loadingState === "loaded" && !nfts.length)
    return (
      <div className="grid place-items-center">
        <h1 className="mt-8 pt-8 px-20 text-3xl text-center">
          You don't currently own any NFTs.
        </h1>

        <div className="grid place-items-center border-solid border-2 rounded-lg border-blue-700 mt-20">
          <h1 className="pt-8 pb-8 px-20 text-3xl text-center">
            You can Purchase one from the Market page!
          </h1>
          <button
            className="w-80 items-center mb-8 font-bold mt-4 bg-blue-700 text-white rounded p-4 shadow-lg"
            onClick={reRoute}
          >
            Market
          </button>
        </div>
      </div>
    );
  return (
    <div>
      <h1 className="py-10 px-20 text-4xl font-bold text-center">
        NFTs You Currently Own
      </h1>
      <div className="flex justify-center">
        <div className="p-4">
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
                <div className="p-4 bg-blue-800">
                  <p className="text-xl font-semi-bold text-yellow-400">
                    Price:
                  </p>
                  <p className="text-2xl mb-4 font-bold text-yellow-400">
                    {nft.price} ETH
                  </p>
                  {!showPrice ? (
                    <div className="grid place-items-center">
                      <button
                        className="w-76 items-center bg-red-700 shadow-lg text-white font-bold py-3 px-10 rounded"
                        onClick={() => loadPrice()}
                      >
                        Sell
                      </button>
                    </div>
                  ) : (
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
                          onChange={(eventObj)=> setSalePrice(eventObj.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
