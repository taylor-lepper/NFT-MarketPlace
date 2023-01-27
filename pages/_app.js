import "../styles/globals.css";
import Link from "next/link";

function NftApp({ Component, pageProps }) {
  return (
    <div className="">
       
      <nav className="border-b pl-6 bg-blue-400">
        <p className="text-4xl font-bold text-left pt-6">Taylor Made Market for NFTs</p>
    
        <div className="text-right justify-center pb-4">
          <Link legacyBehavior href="/">
            <a className="mr-10 text-lg text-yellow-200 hover:text-yellow-500 hover:text-xl">Market</a>
          </Link>
          <Link legacyBehavior href="/createNFT">
            <a className="mr-10 text-lg text-yellow-200 hover:text-yellow-500 hover:text-xl">Create NFT</a>
          </Link>
          <Link legacyBehavior href="/myNFTs">
            <a className="mr-10 text-lg text-yellow-200 hover:text-yellow-500 hover:text-xl">My NFTs</a>
          </Link>
          <Link legacyBehavior href="/profilePage">
            <a className="mr-10 text-lg text-yellow-200 hover:text-yellow-500 hover:text-xl">My Profile</a>
          </Link>
        </div>
      </nav>
      <div className="bg-gray-200 h-screen">
      <Component {...pageProps} />
      </div>
    </div>
  );
}

export default NftApp;
