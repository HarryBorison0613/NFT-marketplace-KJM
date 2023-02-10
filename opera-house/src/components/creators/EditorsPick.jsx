import React from 'react';
import {Link} from 'react-router-dom';
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
    img: "https://operahouse.mypinata.cloud/ipfs/QmXDH8zGUm98gJJ2L1gYMiCffBamfHeXKX85oMSpXoeJFw",
    name: 'Raiders',
    address:"0x65c4f2619bfe75215459d7e1f351833e7511290c",
    desc:'By Raiders NFTs'
  },
  {
    img: "/img/collectionmain/bobbleheadsfront.jpg",
    name: 'Bobbleheads',
    address:"0x8a89c505d174B056A35faF5d6c712ced921E7B48",
    desc:'By Incepthink'
  },
  {
    img: '/img/collectionmain/gnartist.jpg',
    name: 'The Gnartist',
    address:"0x36448a360e78d333C39d032bfE25572C31097eCF",
    desc:'By Edgetechnician'
  },
  {
    img: 'https://operahouse.mypinata.cloud/ipfs/QmPGeJy9DnjpbfoyAcAvfPwzM6ZBu3PwcZ4PayZyc3he2S',
    name: 'World of Yamaloka',
    address:"0xec24694ff3785e6ebf2754479dab383940cc220e",
    desc:'The art of legendary Fantom artist SEP'
  },

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
function EditorsPick() {
  return (
    <div>
        <br />
        <br />
        <br />
        <br />
        <div className="size-90">
        <div className="mb-30">
        <h3 className="text-center">Editors' Choice</h3>
            <div className="row size-90">
              {CardItems.map((val, i) => (
                <div className="col-lg-3" key={i} >
                   <div className="card__item" style={{height: "430px", borderRadius: "10px"}}>
                    <div className="card_body">
                      <div className="card_head" style={{borderRadius: "10px"}}>
                        <Link to={"collection/" + val.address}>
                          <img
                            src={val.img}
                            alt="Sponsored"
                          />
                        </Link>
                      </div>
                      <br />
                      <h6>{val.name}</h6>
                      <p style={{fontSize: "10pt", fontWeight: "400", marginTop: "0px"}}>{val.desc}</p>
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

export default EditorsPick;
