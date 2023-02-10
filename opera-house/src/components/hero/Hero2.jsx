import React from 'react';
import {Link} from 'react-router-dom';
import TopArtist from '../../components/creators/TopArtist';

import {
  networkCollections, address
} from '../../constant/collections';
var CollectionItems = networkCollections["0xfa"];


function Collection2() {
  const getAbbrWalletAddress = (walletAddress) => {
    let abbrWalletAddress = walletAddress.substring(0, 4) + "..." + walletAddress.substring(38, 42);
    return abbrWalletAddress.toUpperCase();
  }
  console.log("eee", CollectionItems);
}


const CardItems = [
  //Sponsored Collections Parameters
  {
    img: "/img/collectionmain/yamaloka.png",
    name: 'World of Yamaloka',
    address:"0xec24694ff3785e6ebf2754479dab383940cc220e",
    link: "https://operahouse.online/collection/0xec24694ff3785e6ebf2754479dab383940cc220e",

    //ends march 31
  },
  {
    img: '/img/collectionmain/EE.png',
    name: 'Egg Emporium (Coming Soon...)',
    address:"0x8F77400a76B38e9A359b60c4cc3C295d80C60A6f",
    link: "https://discord.gg/ZJvMvH5xVA",
    //ends april 18
  },
  {
    img: '/img/collectionmain/hamsteropera.png',
    name: 'Hamsters Of Opera',
    address:"",
    link: "https://operahouse.online/collection/HamstersandOwls",
    //ends april 29
  },
  // {
  //   img: "/img/collectionmain/bitdaemon.jpg",
  //   name: 'Fantom Blobs',
  //   address:"0xC46CF2D62eB6302d588A725871EEE4Cb9684Ac73",
  //   link: "https://operahouse.online/collection/0xC46CF2D62eB6302d588A725871EEE4Cb9684Ac73",

  //   //ends feb 31
  // },
  // {
  //   img: '/img/collectionmain/fantomsquad.jpg',
  //   name: 'Egg Emporium (COMING SOON)',
  //   address:"0x8F77400a76B38e9A359b60c4cc3C295d80C60A6f",
  //   link: "https://discord.gg/ZJvMvH5xVA",
  //   //ends Mar 18
  // },
  // {
  //   img: '/img/collectionmain/fffsponsored.jpg',
  //   name: 'Fantom Fortunate Fox',
  //   address:"0x5B0B061709C1CDFBF83b720d70b336319aDC750c",
  //   link: "https://operahouse.online/collection/0x5B0B061709C1CDFBF83b720d70b336319aDC750c",
  //   //ends feb 21
  // },



];
// Random component
const Completionist = () => <span>auction ending soon now!</span>;
// Renderer callback with condition
const renderer = ({hours, minutes, seconds, completed}) => {
  if (completed) {
    // Render a complete state
    return <Completionist />;
  } else {
    // Render a countdown
    return (
      <span>
        {hours} : {minutes} : {seconds}
      </span>
    );
  }
};
function Hero2() {
  return (
    <div>
      <div className="hero__2">
        <h2 className="hero__title text-center" style={{padding:"10px"}}>Create, discover, and sell amazing NFTs</h2>
        <p className="hero__text text-center"><h6>Welcome to Opera House™</h6></p>
        <br></br><br></br>
        <div className="size-90">
        <div className="mb-30">
        <h2 className="section__title text-center">Featured Collections</h2>
            <div className="row size-90">
              {CardItems.map((val, i) => (
                <div className="col-lg-4" key={i}>
                  <div className="card__item one is__hero">
                    <div className="card_body">
                      {/* ???? =============== */}
                      <div className="card_head" style={{
                        borderRadius: "10px"
                      }}>
                      <a href={val.link}>
                          <img
                            src={val.img}
                            alt="Sponsored"
                          />
                        </a>

                        <div className="details space-x-0 d-flex justify-content-center" style={{borderRadius: "10px", background: "rgba(255,255,255, 0.9)", fontWeight: "600", fontSize: "12pt", color: "#000"}}>
                          {val.name}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="text-center">
      <Link className="btn btn-connect btn-m" to="/collections">
      <i className="btn-connect" />
      Explore Collections
      </Link>

      </div>
      <TopArtist />
    </div>
  );
}



export default Hero2;
