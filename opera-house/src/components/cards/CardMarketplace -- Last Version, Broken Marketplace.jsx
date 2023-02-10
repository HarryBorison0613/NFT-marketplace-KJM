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
  const [to, setTo] = React.useState("");
  const [collectionInfo, setCollectionInfo] = React.useState(null);
  const [totalNFTs, setTotalNFTs] = React.useState(0);
  const [uriInfo, setUriInfo] = React.useState([]);
  const address0 = "0x0000000000000000000000000000000000000000";
  const closeTooltip = () => ref.current.close();
  var NFTContractInstance = null;
  var web3Instance = null;
  var walletAddress = localStorage.getItem("walletAddress");

  // const collectionAddress = config.contractAddress;
  const collectionAddress = props.collectionAddress;
  const defaultCollectionAddress = config.contractAddress;
  const getContractInstance = async (contractABI, contractAddress) => {
    const currentProvider = await detectEthereumProvider();
    web3Instance = new Web3(currentProvider);
    if (web3Instance) {
        let contract = new web3Instance.eth.Contract(contractABI, contractAddress);
        return contract;
    }
    else {
        return null;
    }
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

  const getTokenURI = (id, ipfsPrefix, ipfsSufix, involveId, locationQm) => {
    if(involveId) {
      return ipfsPrefix + id + ipfsSufix;
    } else{
      return "https://operahouse.mypinata.cloud/ipfs/" + locationQm;
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

  const getCollectionInfo = async (collectionAddress) => {
    const currentProvider = await detectEthereumProvider();
    web3Instance = new Web3(currentProvider);
    let NFTContractInstance = await getContractInstance(NFTContractABI, defaultCollectionAddress);
    console.log("qq", NFTContractInstance);
    let info = {};
    for(let i = 0; i < networkCollections["0xfa"].length; i++) {
      if(networkCollections["0xfa"][i].address == collectionAddress)
        info = networkCollections["0xfa"][i];
    }

    let address = collectionAddress == defaultCollectionAddress ? address0 : collectionAddress;
    let lastSoldTimeStamp = 0;
    await NFTContractInstance.methods.collectionInfo(address).call()
      .then((result) => {
        console.log(result);
        info.totalVolume = result.totalVolume;
        info.totalSales = result.totalSales;
        info.lastSale = result.lastSale;
        lastSoldTimeStamp = result.lastSold;
      })
      .catch((err) => {
      });
    let floor = 0;
    await NFTContractInstance.methods.getFloor(address).call()
      .then((result) => {
        console.log("floor=-", result);
        if(result == 99999999999999999999999999) floor = 0;
        else floor = result;
      })
      .catch((err) => {
      });
    info.floor = floor;

    let currentTimeStamp = 0;
    await NFTContractInstance.methods.auctionEndTime(1).call()
      .then((result) => {
        currentTimeStamp = result[1];
      })
      .catch((err) => {
      });

    let period = currentTimeStamp - lastSoldTimeStamp;
    if(lastSoldTimeStamp == 0) period = 0;
    if(period < 60) info.lastSold = period.toString() + " second(s) ago.";
    else if(period < 60 * 60) info.lastSold = Math.floor(period / 60).toString() + " minute(s) ago.";
    else if(period < 60 * 60 * 24) info.lastSold = Math.floor(period / 60 / 60).toString() + " hour(s) ago.";
    else info.lastSold = Math.floor(period / 60 / 60 / 24).toString() + " day(s) ago.";

    return info;
  }

  const handleTransfer = async (e, collectionAddress, tokenId) => {
    e.preventDefault();
    const currentProvider = await detectEthereumProvider();
    web3Instance = new Web3(currentProvider);
    console.log(walletAddress, to, tokenId);
    let collectionContractInstance = await getContractInstance(collectionContractABI, collectionAddress);
    console.log(collectionContractInstance);
    let result = await collectionContractInstance.methods.safeTransferFrom(walletAddress, to, tokenId).send({ from: walletAddress });
    console.log(result);
  }

  const getIndexWithAddress = (address) => {
    for(let i = 0; i < networkCollections["0xfa"].length; i++) {
      if(networkCollections["0xfa"][i].address.toLowerCase() == address.toLowerCase())
        return i;
    }
    return -1;
  }

  // pull NFT data from contract and ipfs
  React.useEffect(async () => {
    let ipfsPrefix = getIPFSPrefix(collectionAddress);
    let ipfsSufix = "";
    const currentProvider = await detectEthereumProvider();
    web3Instance = new Web3(currentProvider);
    if(collectionAddress && collectionAddress != "profile") {  //collection page
      let collectionInfo = await getCollectionInfo(collectionAddress);
      setCollectionInfo(collectionInfo);
      if(collectionAddress == defaultCollectionAddress) { //about default collection
        let totalTokenCount = 0;
        NFTContractInstance = await  getContractInstance(NFTContractABI, defaultCollectionAddress);
        await NFTContractInstance.methods.totalTokenCount().call()
          .then((result) => {
            totalTokenCount = result;
            setTotalNFTs(totalTokenCount);
          })
          .catch((err) => {
          });
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

            await NFTContractInstance.methods.ownerOf(id).call()
              .then((result) => {
                if(walletAddress.toLowerCase() == result.toLowerCase()) cardItem.isOwner = true;
              })
            cardItemsCopy.push(cardItem);
          })
      }
        setCardItems(cardItemsCopy);
      } else {    //about other collection
        let collectionContractInstance = await  getContractInstance(collectionContractABI, collectionAddress);
        NFTContractInstance = await getContractInstance(NFTContractABI, defaultCollectionAddress);
        let totalSupply = 0;
        await collectionContractInstance.methods.totalSupply().call()
          .then((result) => {
            console.log("totalsuply", result);
            totalSupply = result;
            setTotalNFTs(result);
          })

        let cardItemsCopy = [];
        for(let id = 0; id < totalSupply; id++) {
          await collectionContractInstance.methods.tokenURI(id).call()
          .then(async (uri) => {
            console.log(id);
            ipfsSufix = getIPFSSufix(uri);
            console.log("uri", uri);
            let involveId = isIdInURI(uri);
            let p = uri.indexOf("Qm");
            let locationQm = uri.substring(p)
            let tokenURI = getTokenURI(id, ipfsPrefix, ipfsSufix, involveId, locationQm);
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
            cardItem.isOwner = false;

            await collectionContractInstance.methods.ownerOf(id).call()
              .then((result) => {
                if(walletAddress.toLowerCase() == result.toLowerCase()) cardItem.isOwner = true;
              })

            cardItemsCopy.push(cardItem);
            setCardItems(cardItems.concat(cardItemsCopy));
            })
          .catch((err) => {
            console.log(err);
          });
        }
      }
    } else {  //profile or marketplace page
      let totalTokenCount = 0;
      NFTContractInstance = await getContractInstance(NFTContractABI, defaultCollectionAddress);
      await NFTContractInstance.methods.totalTokenCount().call()
        .then((result) => {
          totalTokenCount = result;
        })
        .catch((err) => {
        });
      let cardItemsCopy = [];
      let isProfile = (collectionAddress == "profile");
      let isMarketplace = (!collectionAddress);

      //display default collection NFTs
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
          .then(async (result) => {
            console.log(owner, result);
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
            cardItem.isOwner = false;

            await NFTContractInstance.methods.ownerOf(id).call()
              .then((result) => {
                if(walletAddress.toLowerCase() == result.toLowerCase()) cardItem.isOwner = true;
              })

            if(!isMarketplace || result.sellPending) cardItemsCopy.push(cardItem);
            setCardItems(cardItems.concat(cardItem));
          })
          .catch((err) => {
          });
        }
      }

      //display other collection NFTs
      if(isProfile) {
        for(let i = 0; i < networkCollections["0xfa"].length; i++) {
          let collectionAddress = networkCollections["0xfa"][i].address;
          console.log("colls --", collectionAddress);
          let ipfsPrefix = getIPFSPrefix(collectionAddress);
          if(collectionAddress.toLowerCase() == defaultCollectionAddress.toLowerCase()) continue;
          let collectionContractInstance = await getContractInstance(collectionContractABI, collectionAddress);
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
              cardItem.isOwner = false;

              await collectionContractInstance.methods.ownerOf(id).call()
                .then((result) => {
                  if(walletAddress.toLowerCase() == result.toLowerCase()) cardItem.isOwner = true;
                })

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
      }

      if(isMarketplace) {
        var uriInfoCopy = [];
        for(let i = 0; i < networkCollections["0xfa"].length; i++) {
          let uriInfoOfCollection = {};
          let collectionAddress = networkCollections["0xfa"][i].address;
          if(collectionAddress == defaultCollectionAddress) continue;
          let ipfsPrefix = getIPFSPrefix(collectionAddress);
          uriInfoOfCollection.ipfsPrefix = ipfsPrefix;
          let ipfsSufix = "";
          let collectionContractInstance = await getContractInstance(collectionContractABI, collectionAddress);
          if(i == 3) console.log(i, collectionContractInstance);
          console.log(collectionContractInstance);
          await collectionContractInstance.methods.tokenURI(1).call()
          .then(async (uri) => {
            ipfsSufix = getIPFSSufix(uri);
            let involveId = isIdInURI(uri);
            let p = uri.indexOf("Qm");
            let locationQm = uri.substring(p)
            uriInfoOfCollection.ipfsSufix = ipfsSufix;
            uriInfoOfCollection.involveId = involveId;
            uriInfoOfCollection.locationQm = locationQm;
            })
          .catch((err) => {
            console.log(err);
          });
          uriInfoCopy.push(uriInfoOfCollection);
        }
        setUriInfo(uriInfoCopy);

        NFTContractInstance = await getContractInstance(NFTContractABI, defaultCollectionAddress);

        let onSaleArrayLength = 0;
        await NFTContractInstance.methods.getOnSaleArrayLength().call()
          .then(async (result) => {
            onSaleArrayLength = result;
          })
          .catch((err) => {
            console.log(err);
          });

          for(let index = 0; index < onSaleArrayLength; index++) {
          await NFTContractInstance.methods.onSaleArray(index).call()
          .then(async (result) => {
            if(result.sellPending) {
              let info = uriInfoCopy[getIndexWithAddress(result.collectionAddress)];
              let cardItem = {};
              let tokenURI = getTokenURI(result.id, info.ipfsPrefix, info.ipfsSufix, info.involveId, info.locationQm);
              console.log("tokenURI", tokenURI);
              let response = await fetch(tokenURI);
              let metadata = await response.json();
              console.log("metadata", metadata);
              cardItem.collectionAddress = result.collectionAddress;
              cardItem.id = result.id;
              cardItem.likes = 0;
              cardItem.avatarImg = '1';
              cardItem.assetURI = getImageURI(metadata.image);
              cardItem.title = metadata.name;
              cardItem.price = 0;
              cardItem.stock = 6;
              cardItem.isOwner = false;

              let collectionContractInstance = await getContractInstance(collectionContractABI, result.collectionAddress)
              await collectionContractInstance.methods.ownerOf(result.id).call()
                .then((result) => {
                  if(walletAddress.toLowerCase() == result.toLowerCase()) cardItem.isOwner = true;
                })

              await NFTContractInstance.methods.otherTokenStatus(result.collectionAddress, result.id).call()
              .then(async (info) => {
                cardItem.price = info.price / Math.pow(10, 18);
              })
              .catch((err) => {
              });

              cardItemsCopy.push(cardItem);
            }
          })
          .catch((err) => {
            console.log(err);
          });
          setCardItems(cardItems.concat(cardItemsCopy));

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
                      {cardItem.isOwner && (
                        <Popup
                          className="custom"
                          ref={ref}
                          trigger={
                              <button className="btn btn-sm btn-primary">
                                Transfer
                              </button>
                          }
                          position="bottom center"
                        >
                          <div>
                            <div
                              className="popup"
                              id="popup_bid"
                              tabIndex={-1}
                              role="dialog"
                              aria-hidden="true">
                              <div>
                                <button
                                  type="button"
                                  className="button close"
                                  data-dismiss="modal"
                                  aria-label="Close"
                                  onClick={closeTooltip}>
                                  <span aria-hidden="true">×</span>
                                </button>
                                <div className="space-y-20">
                                  <h3>Confirm</h3>
                                  <p>
                                    You are about to transfer NFT
                                  </p>
                                  <div className="space-y-10">
                                    <p>To:</p>
                                    <input
                                      type="text"
                                      className="form-control"
                                      value={to}
                                      onChange={(e) => setTo(e.target.value)}
                                    />
                                  </div>
                                  <div className="space-y-10">
                                    <p>
                                      Wait for blockchain confirmation before refreshing.
                                    </p>
                                  </div>
                                  <div className="hr" />
                                  <Link
                                    to="#"
                                    className="btn btn-primary w-full"
                                    aria-label="Close"
                                    onClick={(e) =>handleTransfer(e, cardItem.collectionAddress, cardItem.id)}
                                  >
                                    Transfer
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Popup>
                      )}

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
