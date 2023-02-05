import "../styles/globals.css";
import Link from "next/link";

function NftApp({ Component, pageProps }) {
  return (
    <div className="">
      <nav className="border-b pl-6 bg-blue-700">
        <div className="flex">
          <div className="flex">
            <p className="text-4xl font-bold text-left pt-6">
              Taylor Made Market for NFTs
            </p>
            <img
              className="w-14 pb-4 mx-5 mt-5"
              src="nftIcon.png"
              alt="nft icon image"
            />
          </div>
          <div className="flex">
          <div className="absolute right-0 justify-end pb-4 pt-10">
            <Link legacyBehavior href="/">
              <a className="mr-10 text-lg text-yellow-400 hover:text-yellow-600 hover:text-xl hover:mr-8">
                Market
              </a>
            </Link>
            <Link legacyBehavior href="/createNFT">
              <a className="mr-10 text-lg text-yellow-400 hover:text-yellow-600 hover:text-xl hover:mr-8">
                Create NFT
              </a>
            </Link>
            <Link legacyBehavior href="/myNFTs">
              <a className="mr-10 text-lg text-yellow-400 hover:text-yellow-600 hover:text-xl hover:mr-8">
                My NFTs
              </a>
            </Link>
            <Link legacyBehavior href="/profilePage">
              <a className="mr-10 text-lg text-yellow-400 hover:text-yellow-600 hover:text-xl hover:mr-8">
                My Profile
              </a>
            </Link>
          </div>
          </div>
         
        </div>
      </nav>
      <div className="">
        <Component {...pageProps} />
      </div>
    </div>
  );
}

export default NftApp;
