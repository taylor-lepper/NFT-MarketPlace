import "../styles/globals.css";
import Link from "next/link";

function NftApp({ Component, pageProps }) {
  return (
    <div className="h-screen">
       
      <nav className="border-b pl-6 bg-blue-700">
        <p className="text-4xl font-bold text-left pt-6">Taylor Made Market for NFTs</p>
    
        <div className="text-right justify-center pb-4">
          <Link legacyBehavior href="/">
            <a className="mr-10 text-lg text-yellow-400 hover:text-yellow-600 hover:text-xl hover:mr-8">Market</a>
          </Link>
          <Link legacyBehavior href="/createNFT">
            <a className="mr-10 text-lg text-yellow-400 hover:text-yellow-600 hover:text-xl hover:mr-8">Create NFT</a>
          </Link>
          <Link legacyBehavior href="/myNFTs">
            <a className="mr-10 text-lg text-yellow-400 hover:text-yellow-600 hover:text-xl hover:mr-8">My NFTs</a>
          </Link>
          <Link legacyBehavior href="/profilePage">
            <a className="mr-10 text-lg text-yellow-400 hover:text-yellow-600 hover:text-xl hover:mr-8">My Profile</a>
          </Link>
        </div>
      </nav>
      <div className="">
      <Component {...pageProps} />
      </div>
    </div>
  );
}

export default NftApp;
