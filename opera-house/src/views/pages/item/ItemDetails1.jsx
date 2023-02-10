import React, { useRef, useState } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import Footer from '../../../components/footer/Footer';
import Header from '../../../components/header/Header';
import {Link} from 'react-router-dom';
import {Tab, Tabs, TabList, TabPanel} from 'react-tabs';
import useDocumentTitle from '../../../components/useDocumentTitle';
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';
import Web3 from 'web3'
import detectEthereumProvider from '@metamask/detect-provider'
import {
  NFTContractABI, collectionContractABI
} from '../../../constant/contractABI';
import { config } from "../../../constant/config"
import { networkCollections } from "../../../constant/collections"

const defaultCollectionAddress = config.contractAddress;

const isIpfs = (uri) => {
  if (uri && uri.includes('ipfs')) {
    return true
  } else {
    return false
  }
}

function isBase64(str) {
  if (str ==='' || str.trim() ===''){ return false; }
  try {
      return btoa(atob(str)) == str;
  } catch (err) {
      return false;
  }
}

const getIPFSSufix = (uri) => {
  if(uri[uri.length - 1] == "n") return ".json";
  if (uri.includes('http')) return 'url'
  return "";
}

const getIPFSPrefix = (collectionAddress) => {
  console.log(networkCollections["0xfa"])
  for(let i = 0; i < networkCollections["0xfa"].length; i++) {
    if(networkCollections["0xfa"][i].address.toLowerCase() == collectionAddress.toLowerCase())
      return networkCollections["0xfa"][i].prefix;
  }
  return "";
}

const getImageURI = (uri) => {
  if (isBase64(uri)) return uri
  if (isIpfs(uri)) {
    let p = uri.indexOf("Qm");
    if (p !== -1)
      return "https://operahouse.mypinata.cloud/ipfs/" + uri.substring(p);
    else return uri
  } else {
    return uri
  }
}

const getAssetType = (url) => {
  if(url.indexOf("mp4") != -1) return "video";
  if(url.indexOf("m4v") != -1) return "video";
  if(url.indexOf("avi") != -1) return "video";
  if(url.indexOf("mp3") != -1) return "video";
  if(url.indexOf("png") != -1) return "image";
  if(url.indexOf("jpeg") != -1) return "image";
  if(url.indexOf("jpg") != -1) return "image";
  if(url.indexOf("gif") != -1) return "image";
  return "other";
}

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

function padPostZeros(num, size) {
    var s = ""+num;
    while (s.length < size) s = s + "0";
    return s;
}

const ItemDetails = () => {
  const ref = useRef();
  const historyHook = useHistory();
  const closeTooltip = () => ref.current.close();
  const [isShare, setShare] = useState(false);
  const [tokenOwnerAddress, setTokenOwnerAddress] = useState("");
  const [metadata, setMetadata] = useState([]);
  const [sellPrice, setSellPrice] = useState(0);
  const [itemPrice, setItemPrice] = useState(0);
  const [isOnSale, setIsOnSale] = useState(false);
  const [history, setHistory] = useState(null);
  const [networkError, setNetworkError] = useState(false);
  const { collectionAddress, id } = useParams();
  const address0 = "0x0000000000000000000000000000000000000000";
  var walletAddress = localStorage.getItem("walletAddress");

  var NFTContractInstance = null;
  var web3Instance = null;
  const toggleShare = () => {
    setShare(!isShare);
  };
  const [isMore, setMore] = useState(false);

  const toggleMore = () => {
    setMore(!isMore);
  };

  const getContractInstance = (contractABI, contractAddress) => {
    if (web3Instance) {
        let contract = new web3Instance.eth.Contract(contractABI, contractAddress);
        return contract;
    }
    else {
        return null;
    }
  }

  const connectMetamask = async () => {
    const currentProvider = await detectEthereumProvider();
    if (currentProvider) {
        if (!window.ethereum.selectedAddress) {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
        }
        await window.ethereum.enable();
        let currentAddress = window.ethereum.selectedAddress;
        localStorage.setItem("walletAddress", currentAddress);
        walletAddress = currentAddress;
        console.log("currentAddress", currentAddress);
    } else {
        console.log('Please install MetaMask!');
    }
  }

  const getAbbrWalletAddress = (walletAddress) => {
    let abbrWalletAddress = walletAddress.substring(0, 4) + "..." + walletAddress.substring(38, 42);
    return abbrWalletAddress.toLowerCase();
  }

  const getCollectionOwner = (collectionAddress) => {
    for(let i = 0; i < networkCollections["0xfa"].length; i++) {
      if(networkCollections["0xfa"][i].address.toLowerCase() === collectionAddress.toLowerCase())
        return networkCollections["0xfa"][i].collecionOwner;
    }
    return "";
  }

  const getRoyalty = (collectionAddress) => {
    for(let i = 0; i < networkCollections["0xfa"].length; i++) {
      if(networkCollections["0xfa"][i].address.toLowerCase() === collectionAddress.toLowerCase())
        return networkCollections["0xfa"][i].royalty;
    }
    return "";
  }
  const getName = (collectionAddress) => {
    for(let i = 0; i < networkCollections["0xfa"].length; i++) {
      if(networkCollections["0xfa"][i].address.toLowerCase() === collectionAddress.toLowerCase())
        return networkCollections["0xfa"][i].name;
    }
    return "";
  }



  const handleBuyToken = async () => {
    const currentProvider = await detectEthereumProvider();
    web3Instance = new Web3(currentProvider);
    NFTContractInstance = getContractInstance(NFTContractABI, defaultCollectionAddress);
    if(collectionAddress === defaultCollectionAddress) {   //default collection NFT buy
      let value = (metadata.price).toString();
      try{
        let result = await NFTContractInstance.methods.transfer(tokenOwnerAddress, id).send({ from: walletAddress, value: value });
        console.log(result);
      } catch(err) {
        console.log(err);
      }
    } else {    //other collection NFT buy
      let value = 0;

      await NFTContractInstance.methods.otherTokenStatus(collectionAddress, id).call()
      .then((result) => {
        console.log(result);
        value = (result.price).toString();
      })
      .catch((err) => {
          console.log('get otherTokenStatus err', err);
      });

      if(value !== 0) {
        let collectionOwner = getCollectionOwner(collectionAddress);
        let Royalty = getRoyalty(collectionAddress) * 1000;
        console.log(collectionOwner, Royalty);
        console.log(value, tokenOwnerAddress, collectionAddress, id, collectionOwner, Royalty)
        try{
          let result = await NFTContractInstance.methods.transferOther(tokenOwnerAddress, collectionAddress, id, collectionOwner, Royalty).send({ from: walletAddress, value: value });
          console.log(result);
        } catch(err) {
          console.log(err);
        }
      }
    }
  }

  const handleSetSellPendingOther = async () => {
    const currentProvider = await detectEthereumProvider();
    web3Instance = new Web3(currentProvider);
    NFTContractInstance = getContractInstance(collectionContractABI, collectionAddress);

    let isApproved = false;
    try{
      let result = await NFTContractInstance.methods.approve(defaultCollectionAddress, id).send({ from: walletAddress });
      console.log(result);
      isApproved = true;
    } catch(err) {
      console.log(err);
    }

    if(isApproved) {
      NFTContractInstance = getContractInstance(NFTContractABI, defaultCollectionAddress);
      try{
        let Price = (sellPrice * Math.pow(10, 9)).toString() + "000000000";
        let result = await NFTContractInstance.methods.setSellPendingOther(collectionAddress, id, walletAddress, Price).send({ from: walletAddress });
        console.log(result);
      } catch(err) {
        console.log(err);
      }

      setInterval(() => {
        historyHook.go(0);
      }, 5000);

    }
  }

  const handleSetSellPending = async (e) => {
    e.preventDefault();
    if(collectionAddress !== defaultCollectionAddress) {
      handleSetSellPendingOther();
      return;
    }
    const currentProvider = await detectEthereumProvider();
    web3Instance = new Web3(currentProvider);
    console.log(web3Instance);
    NFTContractInstance = getContractInstance(NFTContractABI, collectionAddress);
    console.log(collectionAddress);
    try{
      let Price = (sellPrice * Math.pow(10, 9)).toString() + "000000000";
      console.log("price", Price);
      let result = await NFTContractInstance.methods.setSellPending(id, true, Price).send({ from: walletAddress });
      console.log(result);
    } catch(err) {
      console.log(err);
    }

    setInterval(() => {
      historyHook.go(0);
    }, 2000);
  }

  const handleRemoveSellPendingOther = async () => {
    const currentProvider = await detectEthereumProvider();
    web3Instance = new Web3(currentProvider);
    NFTContractInstance = getContractInstance(NFTContractABI, defaultCollectionAddress);
    console.log("remove other --", collectionAddress, id, walletAddress);
    try{
      let result = await NFTContractInstance.methods.removeSellPendingOther(collectionAddress, id, walletAddress).send({ from: walletAddress });
      console.log(result);
    } catch(err) {
      console.log(err);
    }

    setInterval(() => {
      historyHook.go(0);
    }, 15000);
  };

  const handleRemoveSellPending = async (e) => {
    e.preventDefault();
    if(collectionAddress.toLowerCase() !== defaultCollectionAddress.toLowerCase()) {
      handleRemoveSellPendingOther();
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
    setInterval(() => {
      historyHook.go(0);
    }, 15000);
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

  // const getTokenURI = (uri, id, ipfsPrefix, ipfsSufix) => {
  //   let involveId = isIdInURI(uri);
  //   if(involveId) {
  //     return ipfsPrefix + id + ipfsSufix;
  //   } else{
  //     let p = uri.indexOf("Qm");
  //     return "https://operahouse.mypinata.cloud/ipfs/" + uri.substring(p);
  //   }
  // }
  const getTokenURI = (id, ipfsPrefix, ipfsSufix, involveId, locationQm) => {
    if(involveId) {
      if (locationQm.includes('/')) {
        if (ipfsPrefix.includes('Qm')) {
          let arr = locationQm.split('/')
          if (arr && arr.length > 1) {
            let name = arr[1]
            return ipfsPrefix + '/' + name;
          } else {
            return "https://operahouse.mypinata.cloud/ipfs/" + locationQm;
          }
        } else {
          if (ipfsPrefix.charAt(ipfsPrefix.length - 1) === '/')
            return ipfsPrefix + locationQm;
          else
          return ipfsPrefix + '/' +  locationQm;
        }
      } else {
        return ipfsPrefix + id + ipfsSufix;
      }
    } else{
      return "https://operahouse.mypinata.cloud/ipfs/" + locationQm;
    }
  }

  React.useEffect(async () => {
    const currentProvider = await detectEthereumProvider();
    web3Instance = new Web3(currentProvider);
    let chainId = await web3Instance.eth.getChainId();
    let accounts = await web3Instance.eth.getAccounts();
    console.log("chainId", chainId);
    console.log("accouts", accounts);
    if(chainId != 250 || !accounts.length) {
      setNetworkError(true);
      console.log("error set");
    }
    NFTContractInstance = getContractInstance(NFTContractABI, defaultCollectionAddress);
    let collectionContractInstance = getContractInstance(collectionContractABI, collectionAddress);

    if(collectionAddress.toLowerCase() == defaultCollectionAddress.toLowerCase()) {   //metadata default collection
      await NFTContractInstance.methods.ownerOf(id).call()
        .then((result) => {
          setTokenOwnerAddress(result.toLowerCase());
        })
        .catch((err) => {
            console.log('get token owner address err');
        });

      await NFTContractInstance.methods.getMetadata(id).call()
        .then((result) => {
            setMetadata(result);
            setItemPrice(result.price / Math.pow(10, 18));
            if(result.sellPending) setIsOnSale(true);
        })
        .catch((err) => {
            console.log('get Metadata err');
        });
      console.log(metadata);

      await NFTContractInstance.methods.getHistory(address0, id).call()
      .then((history) => {
        console.log("history", history);
        setHistory(history);
      })
      .catch((err) => {
          console.log('get Metadata err');
      });

    } else {    //metadata for other collection
      await collectionContractInstance.methods.ownerOf(id).call()
        .then((result) => {
          setTokenOwnerAddress(result.toLowerCase());
        })
        .catch((err) => {
            console.log('get token owner address err');
        });

      let ipfsPrefix = getIPFSPrefix(collectionAddress);
      let ipfsSufix = "";
      var tokenURI = "";
      await collectionContractInstance.methods.tokenURI(id).call()
        .then((result) => {
          ipfsSufix = getIPFSSufix(result);
          if (!isIpfs(result) || isBase64(result)) {
            tokenURI = result
          }
          else if (ipfsSufix === 'url') {
            if (result.includes('ipfs') && result.includes('Qm') ) {
              let p = result.indexOf("Qm");
              let locationQm = ""
              if (p !== -1) locationQm = result.substring(p)
              tokenURI = 'https://operahouse.mypinata.cloud/ipfs/' + locationQm
            } else {
              tokenURI = result
            }
          } else {
            let involveId = isIdInURI(result);
            let p = result.indexOf("Qm");
            let locationQm = ""
            if (p !== -1) locationQm = result.substring(p)
            tokenURI = getTokenURI(id, ipfsPrefix, ipfsSufix, involveId, locationQm);
          }
        })
        .catch((err) => {
        });

      let response = null;
      let metadata = {};

      try {
        response = await fetch(tokenURI);
        metadata = await response.json();
        let metadataCopy = metadata;
        try {
          metadataCopy.attributes = metadata.attributes;
        } catch {
          metadataCopy.attributes = null;
        }
        metadataCopy.assetURI = getImageURI(metadata.image);
        metadataCopy.assetType = getAssetType(metadata.image);
        metadataCopy.title = metadata.name;
        metadataCopy.royalty = getRoyalty(collectionAddress) * 1000;
        metadataCopy.name = getName(collectionAddress);


        setMetadata(metadataCopy);
      } catch (err){
        console.log(id);
      }

      await NFTContractInstance.methods.getHistory(collectionAddress, id).call()
      .then((history) => {
        console.log("history", history);
        setHistory(history);
      })
      .catch((err) => {
          console.log('get Metadata err');
      });
    }

    NFTContractInstance = getContractInstance(NFTContractABI, defaultCollectionAddress);
    if(collectionAddress.toLowerCase() != defaultCollectionAddress.toLowerCase()) {
      let isOnSaleStatus = false;
      let index = 0;
      while(true) {
        await NFTContractInstance.methods.onSaleArray(index).call()
        .then(async (result) => {
          console.log("onsalearray -- ", result);
          if(result.collectionAddress.toLowerCase() == collectionAddress.toLowerCase() && result.id == id && result.sellPending) {
            setIsOnSale(true);
            isOnSaleStatus = true;
            await NFTContractInstance.methods.otherTokenStatus(collectionAddress, id).call()
              .then((result) => {
                console.log(result);
                setItemPrice(result.price / Math.pow(10, 18));
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

      if(!isOnSaleStatus) {
        setItemPrice("Not For Sale");
      }
    }
  }, []);

  useDocumentTitle('Item Details');
  return (
    <div>
      <Header />
      <div className="container">
        <Link to="/collections" className="btn btn-white btn-sm my-40">
          Back to Collections
        </Link>
        <div className="item_details">
          <div className="row sm:space-y-20">
            <div className="col-lg-6">
              {/* <img
                  className="item_img"
                  src={metadata.assetURI}
                  alt="ImgPreview"
                  style={{width: "100%", height: "auto", maxWidth: "500px", maxHeight: "500px"}}
                /> */}
              {metadata.assetType == "image" && (
                <img
                  className="item_img"
                  src={metadata.assetURI}
                  alt="ImgPreview"
                  style={{height: "auto", width: "100%", borderRadius: "30px"}}
                />
              )}
              {metadata.assetType == "other" && (
                <img
                  className="item_img"
                  src={metadata.assetURI}
                  alt="ImgPreview"
                  style={{height: "auto", width: "100%", borderRadius: "30px"}}
                />
              )}
              {metadata.assetType == "video" && (
                <div className="video_card">
                <video
                  style={{height: "auto", width: "100%", borderRadius: "30px"}}
                  controls
                  loop muted autoPlay
                >
                  <source src={metadata.assetURI} id="video_here" />
                  Your browser does not support HTML5 video.
                </video>
                </div>
              )}
            </div>
            <div className="col-lg-6">
              <div className="space-y-20">
                <h3>{metadata.title}</h3>
                 {metadata.name}
                <div className="d-flex justify-content-between">
                  <div className="space-x-10 d-flex align-items-center">

                    </div>
                  <div className="space-x-10 d-flex align-items-center">
                    <div>

                      <div className="more">
                        <div className="icon" onClick={toggleMore}>
                          <i className="ri-more-fill"></i>
                        </div>
                        <div
                          className={`dropdown__popup ${
                            isMore ? 'visible' : null
                          } `}>
                          <ul className="space-y-10">
                            <li>
                              <Popup
                                className="custom"
                                ref={ref}
                                trigger={
                                  <Link
                                    to="#"
                                    className="content space-x-10 d-flex">
                                    <i className="ri-flag-line" />
                                    <span> Report </span>
                                  </Link>
                                }
                                position="bottom center">
                                <div>
                                  <div
                                    className="popup"
                                    id="popup_bid"
                                    tabIndex={-1}
                                    role="dialog"
                                    aria-hidden="true">
                                    <div>
                                      <div className="space-y-20">
                                        <h5>
                                          Coming soon, please contact us directly to report this or any other NFTs.
                                        </h5>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </Popup>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>


                <div className="box">
                  <Tabs className="space-y-20">
                    <div className="d-flex justify-content-between mb-30_reset">
                      <TabList className="d-flex space-x-10 mb-30 nav-tabs">
                        <Tab className="nav-item">
                          <Link
                            className="btn btn-white btn-sm"
                            data-toggle="tab"
                            to="#tabs-1"
                            role="tab">
                            Details
                          </Link>
                        </Tab>
                        <Tab>
                          <Link
                            className="btn btn-white btn-sm"
                            data-toggle="tab"
                            to="#tabs-2"
                            role="tab">
                            Attributes
                          </Link>
                        </Tab>
                        <Tab>
                          <Link
                            className="btn btn-white btn-sm"
                            data-toggle="tab"
                            to="#tabs-2"
                            role="tab">
                            Rarity Score
                          </Link>
                        </Tab>
                        <Tab>
                          <Link
                            className="btn btn-white btn-sm"
                            data-toggle="tab"
                            to="#tabs-3"
                            role="tab">
                            History
                          </Link>
                        </Tab>
                      </TabList>

                    </div>
                    <div className="hr" />
                    <div className="tab-content">
                      <TabPanel className="active">
                        <p style={{color: "#183B56", fontWeight: "400"}}>
                          {metadata.description}
                        </p>

                      </TabPanel>
                      <TabPanel className="active">
                        {!metadata.attributes && (
                          <p style={{color: "#183B56", fontWeight: "400"}}>
                            This NFT has no attributes.
                          </p>
                        )}
                        {metadata.attributes && (
                          metadata.attributes.map((attribute, i) => (
                            <p style={{color: "#183B56", fontWeight: "400", fontSize: "10pt", lineHeight: "1.8"}}>
                              {attribute.trait_type && (
                                <span><b>{attribute.trait_type}:&nbsp;</b></span>
                              )}
                              {attribute.value && (
                                <span>{attribute.value}</span>
                              )}
                              {attribute.frequency && (
                                <span> &nbsp;({attribute.frequency})</span>
                              )}
                            </p>
                          ))
                        )}
                      </TabPanel>
                      <TabPanel className="active">
                        <p style={{color: "#183B56", fontWeight: "600", fontSize: "10pt"}}>
                          COMING SOON
                        </p>

                      </TabPanel>
                      <TabPanel>
                        {!history && (
                          <p>History tracking coming soon.</p>
                        )}
                        {history && (
                          history.map((historyItem, i) => (
                            <p style={{color: "#183B56"}}>
                              <b>From</b> &nbsp;{getAbbrWalletAddress(historyItem.from)}
                              &nbsp;&nbsp;<b>to</b>&nbsp; {getAbbrWalletAddress(historyItem.to)}
                              &nbsp;&nbsp;<b>for</b>&nbsp; {historyItem.price / Math.pow(10, 18)} FTM
                            </p>
                          ))
                        )}
                      </TabPanel>
                      <TabPanel>
                        <div className="space-y-20">

                          <div className="creator_item creator_card space-x-10">
                            <div className="avatars space-x-10">
                              <div className="media">
                              </div>
                              <div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </TabPanel>
                    </div>
                  </Tabs>
                </div>
                <div>
                  <p>{metadata.royalty / 1000}% Royalty</p>
                </div>

                <div className="numbers">
                  <div className="row">
                    <div className="col-lg-6">
                      <div className="space-y-5">
                        Price:&nbsp;
                          {isOnSale && (
                            <b>
                              {itemPrice}
                                <span style={{fontWeight: "300"}}>
                                  &nbsp;FTM
                                </span>
                            </b>


                          )}
                          {!isOnSale && (
                            <h4>
                              Not For Sale
                            </h4>
                          )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="hr2" />
                <div className="creators">
                  <div className="row">
                    <div className="col-lg-6">
                      <div className="avatars space-x-5">
                        <div>

                          <a href={"https://ftmscan.com/address/" + tokenOwnerAddress } target="_blank" >
                            <p className="avatars_name color_black">
                              {getAbbrWalletAddress(tokenOwnerAddress)}
                            </p>
                          </a>
                        </div>
                      </div>
                    </div>
                    <div className="col-lg-6">
                      <div className="avatars space-x-5">
                        <div className="media">
                          <div className="badge">
                            <img
                              className="badge"
                              src="img/icons/Badge.svg"
                              alt="ImgPreview"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="d-flex space-x-20">
              {networkError && (
                <Popup
                  className="custom"
                  ref={ref}
                  trigger={
                    <Link
                      to="#"
                      className="btn btn-grad btn_create"
                    >
                      Create item
                    </Link>
                  }
                  position="bottom center"
                >
                    <p>Please connect wallet or connect FTM network!</p>
                </Popup>
              )}
                  {tokenOwnerAddress == walletAddress && isOnSale && !networkError && (
                    <button className="btn btn-lg btn-primary" onClick={(e) =>handleRemoveSellPending(e)}>
                      Remove from Sale
                    </button>
                  )}
                  {tokenOwnerAddress == walletAddress && isOnSale && networkError && (
                    <Popup
                    className="custom"
                    ref={ref}
                    trigger={
                      <button className="btn btn-lg btn-primary">
                        Remove from Sale
                      </button>
                    }
                    position="bottom center"
                  >
                      <p>Please connect wallet or connect FTM network!</p>
                  </Popup>
                  )}
                  { tokenOwnerAddress == walletAddress && !isOnSale && (
                    <Popup
                      className="custom"
                      ref={ref}
                      trigger={
                        <button className="btn btn-lg btn-primary">
                          Sell NFT
                        </button>
                      }
                      position="bottom center"
                    >
                      {networkError && (
                        <p>Please connect wallet or connect FTM network!</p>
                      )}
                      {!networkError && (
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
                                <h3>Checkout</h3>
                                <p>
                                  You are about to list this NFT
                                </p>
                                <div className="space-y-10">
                                  <p>Price in FTM</p>
                                  <input
                                    type="text"
                                    onKeyPress={(event) => {
                                      if (!/[0-9 .]/.test(event.key)) {
                                        event.preventDefault();
                                          }
                                        }}
                                    className="form-control"
                                    value={sellPrice}
                                    onChange={(e) => setSellPrice(e.target.value)}
                                  />
                                </div>
                                <div className="hr" />
                                <div className="d-flex justify-content-between">
                                  <p> Service Fee:</p>
                                  <p className="text-right color_black txt _bold">
                                    1%
                                  </p>
                                </div>
                                <Link
                                  to="#"
                                  className="btn btn-primary w-full"
                                  aria-label="Close"
                                  onClick={(e) =>handleSetSellPending(e)}
                                >
                                  List NFT
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </Popup>
                  )}

                  { tokenOwnerAddress != walletAddress && isOnSale && (
                    <Popup
                      className="custom"
                      ref={ref}
                      trigger={
                        <button className="btn btn-lg btn-primary">
                          Buy Now
                        </button>
                      }
                      position="bottom center"
                    >
                      {networkError && (
                        <p>Please connect wallet or connect FTM network!</p>
                      )}
                      {!networkError && (
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
                                <h3>Checkout</h3>
                                <p>
                                  Confirm purchase of&nbsp;
                                  <span className="color_black">{metadata.title}</span>
                                  &nbsp;from&nbsp;
                                  <span className="color_black">{getAbbrWalletAddress(tokenOwnerAddress)}</span>
                                </p>
                                <div className="space-y-10">
                                  <p>
                                    Please wait for confirmation after purchase.
                                  </p>
                                </div>
                                <div className="hr" />
                                <Link
                                  to="#"
                                  className="btn btn-primary w-full"
                                  aria-label="Close"
                                  onClick={handleBuyToken}
                                >
                                  Buy
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </Popup>
                  )}

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ItemDetails;
