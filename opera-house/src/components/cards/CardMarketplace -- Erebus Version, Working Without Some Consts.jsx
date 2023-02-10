import React, {useRef} from 'react';
import {Link, useHistory} from 'react-router-dom';
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';
import Web3 from 'web3'
import detectEthereumProvider from '@metamask/detect-provider'
import {
  NFTContractABI, collectionContractABI
} from '../../constant/contractABI';
import { config } from "../../constant/config"
import { networkCollections } from "../../constant/collections"

function CardMarketplace(props) {
  const ref = useRef();
  const history = useHistory();
  const [cardItems, setCardItems] = React.useState([]);
  const [sellPrice, setSellPrice] = React.useState(0);
  const [collectionInfo, setCollectionInfo] = React.useState(null);
  const [totalNFTs, setTotalNFTs] = React.useState(0);


  const closeTooltip = () => ref.current.close();
  var NFTContractInstance = null;
  var web3Instance = null;
  var walletAddress = localStorage.getItem("walletAddress");

  // const collectionAddress = config.contractAddress;
  const collectionAddress = props.collectionAddress;
  const defaultCollectionAddress = config.contractAddress;
  const getContractInstance = (contractABI, contractAddress) => {


    if (web3Instance) {
        let contract = new web3Instance.eth.Contract(contractABI, contractAddress);
        return contract;
    }
    else {
        return null;
    }
  }

  const getAbbrWalletAddress = (walletAddress) => {
    let abbrWalletAddress = walletAddress.substring(0, 4) + "..." + walletAddress.substring(38, 42);
    return abbrWalletAddress.toUpperCase();
  }

  const getIPFSSufix = (uri) => {
    if(uri[uri.length - 1] == "n") return ".json";
    return "";
  }

  const getIPFSPrefix = (collectionAddress) => {
    for(let i = 0; i < networkCollections["0xfa"].length; i++) {
      if(networkCollections["0xfa"][i].address == collectionAddress)
        return networkCollections["0xfa"][i].prefix;
    }
    return "";
  }

  const getImageURI = (uri) => {
    let p = uri.indexOf("Qm");
    return "https://operahouse.mypinata.cloud/ipfs/" + uri.substring(p);
  }

  const isIdInURI = (uri) => {
    let slashCount = 0;
    for(let i = 0; i < uri.length; i++) {
      if(uri[i] == "/") slashCount++;
    }

    console.log("slahsCount", slashCount);
    if(slashCount <= 2) return false;
    return true;
  }

  const getTokenURI = (uri, id, ipfsPrefix, ipfsSufix) => {
    let involveId = isIdInURI(uri);
    if(involveId) {
      return ipfsPrefix + id + ipfsSufix;
    } else{
      let p = uri.indexOf("Qm");
      return "https://operahouse.mypinata.cloud/ipfs/" + uri.substring(p);
    }
  }

  const getCollectionOwner = (collectionAddress) => {
    for(let i = 0; i < networkCollections["0xfa"].length; i++) {
      if(networkCollections["0xfa"][i].address == collectionAddress)
        return networkCollections["0xfa"][i].collecionOwner;
    }
    return "";
  }

  const getRoyalty = (collectionAddress) => {
    for(let i = 0; i < networkCollections["0xfa"].length; i++) {
      if(networkCollections["0xfa"][i].address == collectionAddress)
        return networkCollections["0xfa"][i].royalty;
    }
    return "";
  }

  const getCollectionInfo = (collectionAddress) => {



    console.log("----", collectionAddress);

    for(let i = 0; i < networkCollections["0xfa"].length; i++) {
      if(networkCollections["0xfa"][i].address == collectionAddress)
        return networkCollections["0xfa"][i];
    }
    return null;
  }

  const handleBuyToken = async (e, collectionAddress, id, price, tokenOwnerAddress) => {
    e.preventDefault();
    console.log(collectionAddress, id);
    const currentProvider = await detectEthereumProvider();
    web3Instance = new Web3(currentProvider);
    NFTContractInstance = getContractInstance(NFTContractABI, defaultCollectionAddress);
    if(collectionAddress == defaultCollectionAddress) {
      let value = (price * Math.pow(10, 18)).toString();
      try{
        let result = await NFTContractInstance.methods.transfer(tokenOwnerAddress, id).send({ from: walletAddress, value: value });

        console.log(result);





      } catch(err) {




        console.log(err);
      }
    } else {
      let value = 0;





      await NFTContractInstance.methods.otherTokenStatus(collectionAddress, id).call()
      .then((result) => {
        console.log(result);
        value = (result.price).toString();
      })
      .catch((err) => {
          console.log('get otherTokenStatus err', err);
      });

      if(value != 0) {
        let collectionOwner = getCollectionOwner(collectionAddress);
        let royalty = getRoyalty(collectionAddress);
        console.log(collectionOwner, royalty);
        console.log(value, tokenOwnerAddress, collectionAddress, id, collectionOwner, royalty)
        try{
          let result = await NFTContractInstance.methods.transferOther(tokenOwnerAddress, collectionAddress, id, collectionOwner, royalty).send({ from: walletAddress, value: value });
          console.log(result);
        } catch(err) {
          console.log(err);
        }
      }
    }
  }

  const handleSetSellPendingOther = async (collectionAddress, id) => {
    const currentProvider = await detectEthereumProvider();
    web3Instance = new Web3(currentProvider);
    let collectionContractInstance = getContractInstance(collectionContractABI, collectionAddress);

    let isApproved = false;
    try{
      let result = await collectionContractInstance.methods.approve(defaultCollectionAddress, id).send({ from: walletAddress });
      console.log(result);
      isApproved = true;
    } catch(err) {
      console.log(err);
    }

    if(isApproved) {
      collectionContractInstance = getContractInstance(NFTContractABI, defaultCollectionAddress);
      try{
        let Price = (sellPrice * Math.pow(10, 18)).toString();
        let result = await collectionContractInstance.methods.setSellPendingOther(collectionAddress, id, walletAddress, Price).send({ from: walletAddress });
        console.log(result);
      } catch(err) {
        console.log(err);
      }

      history.go(0);
    }
  }

  const handleSetSellPending = async (e, collectionAddress, id) => {
    e.preventDefault();
    if(collectionAddress !== defaultCollectionAddress) {
      handleSetSellPendingOther(collectionAddress, id);
      return;
    }
    const currentProvider = await detectEthereumProvider();
    web3Instance = new Web3(currentProvider);

    NFTContractInstance = getContractInstance(NFTContractABI, collectionAddress);
    console.log(collectionAddress);
    try{
      let Price = (sellPrice * Math.pow(10, 18)).toString();
      let result = await NFTContractInstance.methods.setSellPending(id, true, Price).send({ from: walletAddress });
      console.log(result);
    } catch(err) {
      console.log(err);
    }
    setInterval(() => {

    }, 5000);
    history.go(0);
  }

  const handleRemoveSellPendingOther = async (collectionAddress, id) => {
    const currentProvider = await detectEthereumProvider();
    web3Instance = new Web3(currentProvider);
    NFTContractInstance = getContractInstance(NFTContractABI, collectionAddress);
    console.log(collectionAddress);
    try{
      let result = await NFTContractInstance.methods.removeSellPendingOther(collectionAddress, id, walletAddress).send({ from: walletAddress });
      console.log(result);
    } catch(err) {
      console.log(err);
    }
    history.go();
  };

  const handleRemoveSellPending = async (e, collectionAddress, id) => {
    e.preventDefault();
    if(collectionAddress.toLowerCase() !== defaultCollectionAddress.toLowerCase()) {
      handleRemoveSellPendingOther(collectionAddress, id);
      return;
    }
    const currentProvider = await detectEthereumProvider();
    web3Instance = new Web3(currentProvider);
    NFTContractInstance = getContractInstance(NFTContractABI, collectionAddress);
    console.log(collectionAddress);
    try{
      let Price = 0;
      let result = await NFTContractInstance.methods.setSellPending(id, false, Price).send({ from: walletAddress });
      console.log(result);
    } catch(err) {
      console.log(err);
    }
    history.go();
  }

  // pull NFT data from contract and ipfs
  React.useEffect(async () => {
    let ipfsPrefix = getIPFSPrefix(collectionAddress);
    let ipfsSufix = "";
    const currentProvider = await detectEthereumProvider();
    web3Instance = new Web3(currentProvider);
    if(collectionAddress && collectionAddress != "profile") {  //collection page
      let collectionInfo = getCollectionInfo(collectionAddress);
      setCollectionInfo(collectionInfo);
      if(collectionAddress == defaultCollectionAddress) { //about default collection
        let totalTokenCount = 0;
        NFTContractInstance = getContractInstance(NFTContractABI, defaultCollectionAddress);
        try{
          await NFTContractInstance.methods.totalTokenCount().call()
          .then((result) => {
            totalTokenCount = result;
            setTotalNFTs(totalTokenCount);
          })
          .catch((err) => {
          });
        } catch(err) {
          console.log(err);
        }
        let cardItemsCopy = [];
        for(let id = 1; id <= totalTokenCount; id++) {
          await NFTContractInstance.methods.getMetadata(id).call()
          .then(async (result) => {
            let cardItem = {};
            cardItem.collectionAddress = collectionAddress;
            cardItem.id = id;
            cardItem.creater = result.creater;
            cardItem.likes = 0;
            cardItem.avatarImg = '1';
            cardItem.assetURI = result.assetURI;
            cardItem.title = result.title;
            cardItem.price = result.price / Math.pow(10, 18);
            cardItem.stock = 6;
            cardItem.isOwner = false;
            cardItem.sellPending = result.sellPending;
            cardItem.isDefaultCollection = true;
            await NFTContractInstance.methods.ownerOf(id).call()
              .then((ownerAddress) => {
                cardItem.tokenOwnerAddress = ownerAddress;
                if(ownerAddress.toLowerCase() == walletAddress.toLowerCase()) cardItem.isOwner = true;
              })
            console.log(cardItem.isDefaultCollection, cardItem.isOwner, cardItem.sellPending);
            cardItemsCopy.push(cardItem);
          })
      }
        setCardItems(cardItemsCopy);
      } else {    //about other collection
        let collectionContractInstance = getContractInstance(collectionContractABI, collectionAddress);
        NFTContractInstance = getContractInstance(NFTContractABI, defaultCollectionAddress);

        await collectionContractInstance.methods.totalSupply().call()
          .then((result) => {
            console.log("totalsuply", result);

            setTotalNFTs(result);
          })

        let id = 1;
        let cardItemsCopy = [];
        while(true) {
          await collectionContractInstance.methods.tokenURI(id).call()
          .then(async (result) => {
            console.log(id);
            ipfsSufix = getIPFSSufix(result);
            console.log("result", result);



            let tokenURI = getTokenURI(result, id, ipfsPrefix, ipfsSufix);
            console.log("tokenURI", tokenURI);
            let cardItem = {};
            let response = await fetch(tokenURI);
            let metadata = await response.json();
            cardItem.collectionAddress = collectionAddress;
            cardItem.id = id;
            cardItem.likes = 0;
            cardItem.avatarImg = '1';
            cardItem.assetURI = getImageURI(metadata.image);
            cardItem.title = metadata.name;
            cardItem.price = 0;
            cardItem.stock = 6;
            cardItem.sellPending = false;
            cardItem.isOwner = false;
            cardItem.isDefaultCollection = false;

            //sellPending check
            let index = 0;
            while(true) {
              await NFTContractInstance.methods.onSaleArray(index).call()
              .then(async (result) => {
                console.log("onsalearray -- ", result);
                if(result.collectionAddress.toLowerCase() == collectionAddress.toLowerCase() && result.id == id && result.sellPending) {
                  cardItem.sellPending = true;
                  await NFTContractInstance.methods.otherTokenStatus(collectionAddress, id).call()
                    .then((result) => {
                      console.log(result);
                      cardItem.price = result.price / Math.pow(10, 18);
                    })
                    .catch((err) => {
                      console.log(err);
                    });
                }
              })
              .catch((err) => {
                index = -1;
              });
              if(index == -1) break;
              index++;
            }

            //check isOwner
            await collectionContractInstance.methods.ownerOf(id).call()
              .then((ownerAddress) => {
                cardItem.tokenOwnerAddress = ownerAddress;
                if(ownerAddress.toLowerCase() == walletAddress.toLowerCase()) cardItem.isOwner = true;
              })

            cardItemsCopy.push(cardItem);
            setCardItems(cardItems.concat(cardItemsCopy));
            })
          .catch((err) => {
            console.log(err);
            id = -1;
          });
          if(id == -1) break;
          id++;
        }
      }
    } else {  //profile or marketplace page
      let totalTokenCount = 0;
      NFTContractInstance = getContractInstance(NFTContractABI, defaultCollectionAddress);
      await NFTContractInstance.methods.totalTokenCount().call()
        .then((result) => {
          totalTokenCount = result;
        })
        .catch((err) => {
        });
      let cardItemsCopy = [];
      let isProfile = (collectionAddress == "profile");
      let isMarketplace = (!collectionAddress);


      for(let id = 1; id <= totalTokenCount; id++) {
        let owner = true;
        await NFTContractInstance.methods.ownerOf(id).call()
          .then((result) => {
            if(collectionAddress == "profile" && result.toLowerCase() !== walletAddress.toLowerCase()) owner = false;
          })
          .catch((err) => {
          });
        if(owner) {
          await NFTContractInstance.methods.getMetadata(id).call()
          .then((result) => {

            let cardItem = {};
            cardItem.collectionAddress = defaultCollectionAddress;
            cardItem.id = id;
            cardItem.creater = result.creater;
            cardItem.likes = 0;
            cardItem.avatarImg = '1';
            cardItem.assetURI = result.assetURI;
            cardItem.title = result.title;
            cardItem.price = result.price / Math.pow(10, 18);
            cardItem.stock = 6;







            if(!isMarketplace || result.sellPending) cardItemsCopy.push(cardItem);
            cardItems.concat(cardItemsCopy)
          })
          .catch((err) => {
          });
        }
      }
      console.log("isProfile", isProfile);



      for(let i = 0; i < networkCollections["0xfa"].length; i++) {
        let collectionAddress = networkCollections["0xfa"][i].address;
        console.log("colls --", collectionAddress);
        let ipfsPrefix = getIPFSPrefix(collectionAddress);
        if(collectionAddress.toLowerCase() == defaultCollectionAddress.toLowerCase()) continue;
        let collectionContractInstance = getContractInstance(collectionContractABI, collectionAddress);
        try{
          await collectionContractInstance.methods.tokenURI(1).call()
          .then((result) => {
            ipfsSufix = getIPFSSufix(result);
          })
          .catch((err) => {
          });
        } catch(err) {
        }
        let response = null;
        let metadata = {};
        if(isProfile) {
          let index = 0;
          while(true) {
            await collectionContractInstance.methods.tokenOfOwnerByIndex(walletAddress, index).call()
            .then(async (id) => {
              console.log("uri=-", ipfsPrefix + id + ipfsSufix);
              let cardItem = {};
              response = await fetch(ipfsPrefix + id + ipfsSufix);
              metadata = await response.json();
              console.log("metadata", metadata);
              cardItem.collectionAddress = collectionAddress;
              cardItem.id = id;
              cardItem.likes = 0;
              cardItem.avatarImg = '1';
              cardItem.assetURI = getImageURI(metadata.image);
              cardItem.title = metadata.name;
              cardItem.price = 0;
              cardItem.stock = 6;







              await NFTContractInstance.methods.otherTokenStatus(collectionAddress, id).call()
                .then(async (info) => {
                  cardItem.price = info.price / Math.pow(10, 18);
                })
                .catch((err) => {
                });

              cardItemsCopy.push(cardItem);
              setCardItems(cardItems.concat(cardItemsCopy));
            })
            .catch((err) => {
              index = -1;
            });
            if(index == -1) break;
            index++;
          }
        }


        if(isMarketplace) {
          NFTContractInstance = getContractInstance(NFTContractABI, defaultCollectionAddress);




          let index = 0;
          while(true) {
            await NFTContractInstance.methods.onSaleArray(index).call()




            .then(async (result) => {
              console.log("onsalearray --",result);
              if(result.collectionAddress.toLowerCase() == collectionAddress.toLowerCase() && result.sellPending) {





























                let cardItem = {};
                console.log(ipfsPrefix + result.id + ipfsSufix);

                response = await fetch(ipfsPrefix + result.id + ipfsSufix);
                metadata = await response.json();
                console.log("metadata", metadata);
                cardItem.collectionAddress = collectionAddress;
                cardItem.id = result.id;
                cardItem.likes = 0;
                cardItem.avatarImg = '1';
                cardItem.assetURI = getImageURI(metadata.image);
                cardItem.title = metadata.name;
                cardItem.price = 0;
                cardItem.stock = 6;


                await NFTContractInstance.methods.otherTokenStatus(collectionAddress, result.id).call()

                .then(async (info) => {
                  cardItem.price = info.price / Math.pow(10, 18);
                })
                .catch((err) => {





                });









                cardItemsCopy.push(cardItem);
                setCardItems(cardItems.concat(cardItemsCopy));
              }
            })
            .catch((err) => {
              index = -1;
              console.log(err);
            });
            if(index == -1) break;
            index++;
          }
        }
      }
    }
  }, [])

  return (
    <div>
        <div className="row mb-50_reset mx-auto">
          {/* banner of collection */}
          {collectionInfo && (
            <div style={{marginTop: "-85px", borderRadius: "30px"}}>
            <img src={collectionInfo.collectionBanner} height="100%" width="100%" alt="Banner Load Error" class="collection-banner"/>
            </div>


          )}
          {/* name and description of collection */}
          {collectionInfo && (
            <div>
              <div style={{display: "flex", justifyContent: "left", marginTop: "0px", marginBottom: "20px", marginLeft: "5px"}}>
                <p>
                <br />
                <h2>{collectionInfo.name}</h2>
                <div className="audit-title">
                <b>Audit Status:</b>  {collectionInfo.audit}
                </div>
                </p>
                {/* Begin Links */}
                            <div style={{marginLeft: "0px", marginRight: "20px"}}>

                            <a href={collectionInfo.website} className="website-btn" target="_blank" style={{marginLeft: "0px", marginRight: "5px"}}>
                              <i className="ri-earth-fill" />
                            </a>

                            <a href={"https://twitter.com/" + collectionInfo.twitter} className="twitter-btn" target="_blank" style={{marginLeft: "5px", marginRight: "5px"}}>
                              <i className="ri-twitter-fill" />
                            </a>

                            <a href={"https://discord.gg/" + collectionInfo.discord} className="discord-btn" target="_blank" style={{marginLeft: "5px", marginRight: "5px"}}>
                              <i className="ri-discord-fill" />
                            </a>

                            <a href={"https://ftmscan.com/token/" + collectionInfo.address} target="_blank" style={{marginLeft: "5px", marginRight: "5px"}}>
                            </a></div>
                {/* End Links */}


              </div>
              <div></div>
              <div style={{marginLeft: "5px", marginRight: "5px"}}>
                {collectionInfo.collectionDescription}.
              </div>
            </div>
          )}
          {collectionInfo && (
            <div style={{marginLeft: "5px", marginRight: "5px"}}>
              <br />
              <b>NFTs:</b> {totalNFTs} |
              &nbsp;<b>Total Volume:</b> {collectionInfo.totalVolume / Math.pow(10, 18)} FTM |
              &nbsp;<b>Total Sales:</b> {collectionInfo.totalSales} |
              &nbsp;<b>Average Price:</b> {collectionInfo.totalSales != 0 ? collectionInfo.totalVolume / collectionInfo.totalSales / Math.pow(10, 18): 0} FTM |
              &nbsp;<b>Price Floor:</b> {collectionInfo.floor / Math.pow(10, 18)} FTM |
              &nbsp;<b>Last Sold For:</b> {collectionInfo.lastSale / Math.pow(10, 18)} FTM |
              &nbsp;<b>Last Sold:</b> {collectionInfo.lastSold}
            </div>
          )}
          {cardItems.map((cardItem, i) => (
            <div className="col-xl-3 col-lg-3 col-md-2 col-sm-1" key={i}>
              <div className="card__item four card__item2">
                <div className="card_body space-y-10">
                  <div className="card_head">
                    <Link to={"/Item-details/" + cardItem.collectionAddress + "/" + cardItem.id}>
                      <img
                        src={cardItem.assetURI}
                        alt="NFT Load Error"
                      />
                    </Link>
                  </div>
                  {/* =============== */}
                  <h6 className="card_title">{cardItem.title}</h6>
                  <div className="card_footer d-block space-y-10">
                    <div className="card_footer justify-content-between">
                      <Link to="#">
                        <p className="txt_sm">
                          Price:
                          <span
                            className="color_green
                                                  txt_sm">
                            {cardItem.price} FTM
                          </span>
                        </p>

                      </Link>
                    </div>

                    <div className="hr" />
                    <div className="d-flex align-items-center space-x-10 justify-content-between">
                      <div
                        className="d-flex align-items-center space-x-5">
                          + Details
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

export default CardMarketplace;
