import { ethers } from "ethers";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import Web3Modal from "web3modal";
import Image from "next/image";

// contract addresses
// import { dogTokenAddress, dogMarketAddress } from "../config";
import { dogTokenAddressGoerli, dogMarketAddressGoerli } from "../config";

// contracts
import DogToken from "../artifacts/contracts/DogToken.sol/DogToken.json";
import DogMarket from "../artifacts/contracts/DogMarket.sol/DogMarket.json";

export default function MyNFTs() {
  const [messageInfo, setMessageInfo] = useState(null);
  const [messageInfo1, setMessageInfo1] = useState(null);
  const [messageInfo2, setMessageInfo2] = useState(null);
  const [messageSuccess, setMessageSuccess] = useState(null);
  const [messageError, setMessageError] = useState(null);
  const [nfts, setNfts] = useState([]);
  const [transacting, setTransacting] = useState("not-transacting");
  const [loadingState, setLoadingState] = useState("not-loaded");
  const [salePrice, setSalePrice] = useState();
  const [buttonId, setButtonId] = useState(null);
  const router = useRouter();

  useEffect(() => {
    loadNFTs();
  }, []);

  const reRoute = () => {
    router.push("/");
  };

  const loadPrice = (id) => {
    setButtonId(id);
  };

  // load NFTs to page
  async function loadNFTs() {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    const marketContract = new ethers.Contract(
      dogMarketAddressGoerli,
      DogMarket.abi,
      signer
    );
    const tokenContract = new ethers.Contract(
      dogTokenAddressGoerli,
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
          marketId: token.marketId.toNumber(),
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
    let nftsSorted = myNFTs.sort((nft1, nft2) =>
      nft1.tokenId > nft2.tokenId ? 1 : nft1.tokenId < nft2.tokenId ? -1 : 0
    );
    console.log("myNFTs", nftsSorted);
    setNfts(nftsSorted);
    setLoadingState("loaded");
  }

  // sell an owned NFT back to market
  async function sellNFT(nft) {
    window.scrollTo({
      top: 0, 
      behavior: 'smooth'
      /* you can also use 'auto' behaviour
         in place of 'smooth' */
    });
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    const tokenId = nft.tokenId;
    const marketId = nft.marketId;
    console.log("marketId", marketId);
    console.log("salePrice", salePrice);
    console.log("price", nft.price);

    if (+salePrice <= 0 || salePrice === "" || salePrice === undefined) {
      let errorMessage = "Please enter a price to sell greater than 0 ETH!";
      setMessageError(errorMessage);
      setTimeout(() => {
        setMessageError("");
      }, 4000);
      return;
    }

    const price = ethers.utils.parseUnits(salePrice, "ether").toString();

    try {
      setMessageInfo(
        "Please wait for MetaMask to appear.\nYou must confirm both transactions."
      );
      setTimeout(() => {
        setMessageInfo("");
      }, 160000);
      const marketContract = new ethers.Contract(
        dogMarketAddressGoerli,
        DogMarket.abi,
        signer
      );

      const tokenContract = new ethers.Contract(
        dogTokenAddressGoerli,
        DogToken.abi,
        signer
      );

      setMessageInfo1(
        "#1\nGive permission for the market to transfer ownership."
      );
      setTimeout(() => {
        setMessageInfo1("");
      }, 100000);

      // approve the market contract to transfer the NFT
      const approveTx = await tokenContract.approve(dogMarketAddressGoerli, tokenId);
      setTransacting("transacting");
      await approveTx.wait();
      setTransacting("not-transacting");

      let commissionFee = await marketContract.getCommissionFee();
      commissionFee = commissionFee.toString();

      setMessageInfo1();
      setMessageInfo2("#2\nCreate a new market listing.");
      setTimeout(() => {
        setMessageInfo2("");
      }, 100000);

      // actual sale transaction
      const transaction = await marketContract.sellMyNFT(
        dogTokenAddressGoerli,
        marketId,
        price,
        {
          value: commissionFee,
        }
      );
      console.log("transaction", transaction);
      setTransacting("transacting");

      const marketTx = await transaction.wait();

      if (marketTx.byzantium == true) {
        setTransacting("not-transacting");
        setMessageInfo();
        setMessageInfo2();
        setMessageSuccess("Item successfully listed to the Market.");
        setTimeout(() => {
          setMessageSuccess("");
        }, 4000);
        setSalePrice();
      }
    } catch (e) {
      console.log("Error:", e);
      let errorMessage = e.message;
      if (e.message.includes("user rejected transaction")) {
        errorMessage = "User rejected the Wallet transaction.";
      }
      if (e.message.includes("ERC721: invalid token ID")) {
        errorMessage = "ERC721: invalid token ID.";
      }
      setMessageInfo();
      setMessageInfo1();
      setMessageInfo2();
      setMessageError(errorMessage);
      setTimeout(() => {
        setMessageError("");
      }, 4000);
      setSalePrice();
    }
    setTransacting("not-transacting");
    loadNFTs();
  }

  if (loadingState === "loaded" && !nfts.length)
    return (
      <div>
          <h1 className="py-10 px-20 text-4xl font-bold text-center">
        NFTs You Currently Own
      </h1>
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
              {messageError && (
                <h1 className="mt-6 mb-6 mr-20 ml-20 border border-black place-items-center rounded bg-red-500 h-30 text-center p-6 text-xl">
                  {messageError}
                </h1>
              )}
            </div>
          </div>
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
      </div>
    );
  return (
    <div>
      <h1 className="py-10 px-20 text-4xl font-bold text-center">
        NFTs You Currently Own
      </h1>
      <div className="justify-center">

        
      {transacting === "transacting" && (
          <div className="flex align-center text-center mr-20 ml-20 justify-center h-30 mt-6 mb-6 border border-black rounded bg-green-300 ">
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
          {messageError && (
            <h1 className="mt-6 mb-6 mr-20 ml-20 border border-black place-items-center rounded bg-red-500 h-30 text-center p-6 text-xl">
              {messageError}
            </h1>
          )}
        </div>
      </div>

      <div className="flex justify-center">
        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            {nfts.map((nft, i) => (
              <div
                key={i}
                className="border shadow rounded-xl overflow-hidden mb-10 mx-2"
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
                  priority
                  alt="nft"
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
  );
}
