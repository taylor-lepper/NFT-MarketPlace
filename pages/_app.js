import "../styles/globals.css";
import Link from "next/link";

function NftApp({ Component, pageProps }) {
  return (
    <div>
      <nav className="border-b p-6">
        <p className="text-4xl font-bold"> Taylor Made Market for NFTs</p>
        <div className="flex mt-4">
          <Link legacyBehavior href="/">
            <a className="mr-6 text-pink-500">Market</a>
          </Link>
          <Link legacyBehavior href="/createNFT">
            <a className="mr-6 text-pink-500">Create NFT</a>
          </Link>
          <Link legacyBehavior href="/myNFTs">
            <a className="mr-6 text-pink-500">My NFTs</a>
          </Link>
          <Link legacyBehavior href="/profilePage">
            <a className="mr-6 text-pink-500">My Profile</a>
          </Link>
        </div>
      </nav>
      <Component {...pageProps} />
    </div>
  );
}

export default NftApp;
