import React, { useState, useRef } from 'react';
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
import {
  getDefaultNFTs,
  getCollectionNFTs,
  getCollectionInfo,
  getCollectionNFTsCount
} from '../../apis/contract';

const defaultCollectionAddress = config.contractAddress;
const address0 = "0x0000000000000000000000000000000000000000";

const getContractInstance = async (contractABI, contractAddress) => {
  const currentProvider = await detectEthereumProvider();
  const web3Instance = new Web3(currentProvider);
  if (web3Instance) {
      let contract = new web3Instance.eth.Contract(contractABI, contractAddress);
      return contract;
  }
  else {
      return null;
  }
}

const getIPFSSufix = (uri) => {
  if(uri[uri.length - 1] === "n") return ".json";
  if (uri.includes('http')) return 'url'
  return "";
}

const getIPFSPrefix = (collectionAddress) => {
  for(let i = 0; i < networkCollections["0xfa"].length; i++) {
    const collection = networkCollections["0xfa"][i]
    if(collection.address === collectionAddress) {
      return collection.prefix;
    }
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
    if(uri[i] === "/") slashCount++;
  }
  if(slashCount <= 2) return false;
  return true;
}

const getTokenURI = (id, ipfsPrefix, ipfsSufix, involveId, locationQm) => {
  if(involveId) {
    if (locationQm.includes('/')) {
      if (ipfsPrefix && ipfsPrefix.includes('Qm')) {
        let arr = locationQm.split('/')
        if (arr && arr.length > 1) {
          let name = arr[1]
          return ipfsPrefix + name;
        } else {
          return "https://operahouse.mypinata.cloud/ipfs/" + locationQm;
        }
      } else if (ipfsPrefix) {
        return "https://operahouse.mypinata.cloud/ipfs/" + locationQm;
      } else {
        return ipfsPrefix + locationQm;
      }
    } else {
      if (ipfsSufix !== 'url')
        return ipfsPrefix + id + ipfsSufix;
      else return ipfsPrefix + id
    }
  } else{
    return "https://operahouse.mypinata.cloud/ipfs/" + locationQm;
  }
}

const getAssetType = (url) => {
  if (url) {
    if(url.indexOf("mp4") !== -1) return "video";
    if(url.indexOf("m4v") !== -1) return "video";
    if(url.indexOf("avi") !== -1) return "video";
    if(url.indexOf("mp3") !== -1) return "video";
    if(url.indexOf("png") !== -1) return "image";
    if(url.indexOf("jpeg") !== -1) return "image";
    if(url.indexOf("jpg") !== -1) return "image";
    if(url.indexOf("gif") !== -1) return "image";
  }
  return "other";
}

// const getTokenURIOld = (id, ipfsPrefix, ipfsSufix, involveId, locationQm) => {

//   if(involveId) {
//     return ipfsPrefix + id + ipfsSufix;
//   } else{
//     return "https://operahouse.mypinata.cloud/ipfs/" + locationQm;
//   }
// }

const getCollectionOwner = (collectionAddress) => {
  for(let i = 0; i < networkCollections["0xfa"].length; i++) {
    if(networkCollections["0xfa"][i].address === collectionAddress)
      return networkCollections["0xfa"][i].collecionOwner;
  }
  return "";
}

const getAbbrWalletAddress = (walletAddress) => {
  let abbrWalletAddress = walletAddress.substring(0, 4) + "..." + walletAddress.substring(38, 42);
  return abbrWalletAddress.toLowerCase();
}

const getRoyalty = (collectionAddress) => {
  for(let i = 0; i < networkCollections["0xfa"].length; i++) {
    if(networkCollections["0xfa"][i].address === collectionAddress)
      return networkCollections["0xfa"][i].royalty;
  }
  return "";
}
// const getCollectionInfo = async (collectionAddress) => {
//   const currentProvider = await detectEthereumProvider();
//   const web3Instance = new Web3(currentProvider);
//   let NFTContractInstance = await getContractInstance(NFTContractABI, defaultCollectionAddress);
//   let info = {};
//   for(let i = 0; i < networkCollections["0xfa"].length; i++) {
//     if(networkCollections["0xfa"][i].address === collectionAddress)
//       info = networkCollections["0xfa"][i];
//   }

//   let address = collectionAddress === defaultCollectionAddress ? address0 : collectionAddress;
//   let lastSoldTimeStamp = 0;
//   await NFTContractInstance.methods.collectionInfo(address).call()
//     .then((result) => {
//       info.totalVolume = result.totalVolume;
//       info.totalSales = result.totalSales;
//       info.lastSale = result.lastSale;
//       lastSoldTimeStamp = result.lastSold;
//     })
//     .catch((err) => {
//     });
//   let floor = 0;
//   await NFTContractInstance.methods.getFloor(address).call()
//     .then((result) => {
//       console.log("floor=-", result);
//       if(Number(result) === 99999999999999999999999999) floor = 0;
//       else floor = result;
//     })
//     .catch((err) => {
//     });
//   info.floor = floor;

//   let currentTimeStamp = 0;
//   await NFTContractInstance.methods.auctionEndTime(1).call()
//     .then((result) => {
//       currentTimeStamp = result[1];

//     })
//     .catch((err) => {

//     });

//   let period = currentTimeStamp - lastSoldTimeStamp;
//   if(Number(lastSoldTimeStamp) === 0) period = 0;
//   if(period < 60) info.lastSold = period.toString() + " second(s) ago.";
//   else if(period < 60 * 60) info.lastSold = Math.floor(period / 60).toString() + " minute(s) ago.";
//   else if(period < 60 * 60 * 24) info.lastSold = Math.floor(period / 60 / 60).toString() + " hour(s) ago.";
//   else info.lastSold = Math.floor(period / 60 / 60 / 24).toString() + " day(s) ago.";
//   return info;
// }


const getIndexWithAddress = (address) => {
  for(let i = 0; i < networkCollections["0xfa"].length; i++) {
    if(networkCollections["0xfa"][i].address.toLowerCase() === address.toLowerCase()){
      console.log("index=", i)
      return i;
    }
  }
  return -1;
}

function CardMarketplace(props) {
  const ref = useRef();
  const history = useHistory();
  const [cardItems, setCardItems] = React.useState([]);
  const [to, setTo] = React.useState("");
  const [collectionInfo, setCollectionInfo] = React.useState(null);
  const [networkError, setNetworkError] = useState(false);
  const [totalNFTs, setTotalNFTs] = React.useState(0);
  const [uriInfo, setUriInfo] = React.useState([]);
  const [sellPrice, setSellPrice] = useState(0);

  const closeTooltip = () => ref.current.close();
  const walletAddress = React.useMemo( () => localStorage.getItem("walletAddress"), []);

  // const collectionAddress = config.contractAddress;
  const collectionAddress = props.collectionAddress;

  const handleTransfer = React.useCallback(async (e, collectionAddress, tokenId) => {
    try {
      e.preventDefault();
      const currentProvider = await detectEthereumProvider();
      const web3Instance = new Web3(currentProvider);
      let collectionContractInstance = await getContractInstance(collectionContractABI, collectionAddress);
      let result = await collectionContractInstance.methods.safeTransferFrom(walletAddress, to, tokenId).send({ from: walletAddress });
    } catch (err) {
      console.log(err.message)
    }
  }, [walletAddress, to])

  const handleBuyToken = React.useCallback(async (item) => {
    const NFTContractInstance = await getContractInstance(NFTContractABI, defaultCollectionAddress);
    if(item.collectionAddress == defaultCollectionAddress) {   //default collection NFT buy
      let value = (item.price).toString();
      try{
        let result = await NFTContractInstance.methods.transfer(item.tokenOwnerAddress, item.id).send({ from: walletAddress, value: value });
        console.log(result);
      } catch(err) {
        console.log(err);
      }
    } else {    //other collection NFT buy
      let value = 0;

      await NFTContractInstance.methods.otherTokenStatus(item.collectionAddress, item.id).call()
      .then((result) => {
        console.log(result);
        value = (result.price).toString();
      })
      .catch((err) => {
          console.log('get otherTokenStatus err', err);
      });

      if(value != 0) {
        let collectionOwner = getCollectionOwner(item.collectionAddress);
        let Royalty = getRoyalty(item.collectionAddress) * 1000;
        console.log(collectionOwner, Royalty);
        console.log(value, item.tokenOwnerAddress, item.collectionAddress, item.id, collectionOwner, Royalty)
        try{
          let result = await NFTContractInstance.methods.transferOther(item.tokenOwnerAddress, item.collectionAddress, item.id, item.collectionOwner, Royalty).send({ from: walletAddress, value: value });
          console.log(result);
        } catch(err) {
          console.log(err);
        }
      }
    }
  }, [])

  const handleSetSellPendingOther = React.useCallback(async (cardItem) => {
    const NFTContractInstance = await getContractInstance(collectionContractABI, cardItem.collectionAddress);
    let isApproved = false;
    try{
      let result = await NFTContractInstance.methods.approve(defaultCollectionAddress, cardItem.id).send({ from: walletAddress });
      isApproved = true;
    } catch(err) {
      console.log(err);
    }

    if(isApproved) {
      const NFTContractInstance = await getContractInstance(NFTContractABI, defaultCollectionAddress);
      try{
        let price = (sellPrice * Math.pow(10, 9)).toString() + "000000000";
        let result = await NFTContractInstance.methods.setSellPendingOther(cardItem.collectionAddress, cardItem.id, walletAddress, price).send({ from: walletAddress });
        console.log(result);
      } catch(err) {
        console.log(err);
      }

      setInterval(() => {
        history.go(0);
      }, 5000);

    }
  }, [sellPrice])

  const handleSetSellPending = React.useCallback(async (cardItem) => {
    if(cardItem.collectionAddress !== defaultCollectionAddress) {
      handleSetSellPendingOther(cardItem);
      return;
    }
    const NFTContractInstance = await getContractInstance(NFTContractABI, cardItem.collectionAddress);
    try{
      let price = (sellPrice * Math.pow(10, 9)).toString() + "000000000";
      console.log("price", price);
      let result = await NFTContractInstance.methods.setSellPending(cardItem.id, true, price).send({ from: walletAddress });
    } catch(err) {
      console.log(err);
    }

    setInterval(() => {
      history.go(0);
    }, 2000);
  }, [handleSetSellPendingOther, sellPrice])

  const handleRemoveSellPendingOther = React.useCallback(async (item) => {
    const NFTContractInstance = await getContractInstance(NFTContractABI, defaultCollectionAddress);
    console.log("remove other --", item.collectionAddress, item.id, walletAddress);
    try{
      let result = await NFTContractInstance.methods.removeSellPendingOther(item.collectionAddress, item.id, walletAddress).send({ from: walletAddress });
      console.log(result);
    } catch(err) {
      console.log(err);
    }

    setInterval(() => {
      history.go(0);
    }, 15000);
  }, [])

  const handleRemoveSellPending = React.useCallback(async (item) => {
    if(item.collectionAddress.toLowerCase() !== defaultCollectionAddress.toLowerCase()) {
      handleRemoveSellPendingOther();
      return;
    }
    const NFTContractInstance = await getContractInstance(NFTContractABI, item.collectionAddress);
    console.log(item.collectionAddress);
    try{
      let price = 0;
      let result = await NFTContractInstance.methods.setSellPending(item.id, false, price).send({ from: walletAddress });
      console.log(result);
    } catch(err) {
      console.log(err);
    }
    setInterval(() => {
      history.go(0);
    }, 15000);
  }, [])

  // pull NFT data from contract and ipfs
  React.useEffect(() => {
    const fetchNetworkState = async () => {
      try {
        const currentProvider = await detectEthereumProvider();
        const web3Instance = new Web3(currentProvider);
        let chainId = await web3Instance.eth.getChainId();
        let accounts = await web3Instance.eth.getAccounts();
        if(chainId !== 250 || !accounts.length) {
          setNetworkError(true);
        }
      } catch (err) {
        
      }
    }
    const fetchData = async () => {
    try {
      let ipfsPrefix = getIPFSPrefix(collectionAddress);
      let ipfsSufix = "";
      if(collectionAddress && collectionAddress !== "profile") {  //collection page
        getCollectionInfo(collectionAddress)
        .then((response) => {
          if (response && response.data) {
            const { info } = response.data;
            setCollectionInfo(info);
          }
        })
        if(collectionAddress === defaultCollectionAddress) { //about default collection
          getDefaultNFTs()
          .then((response) => {
            if (response && response.data) {
              const { nfts, totalCount } = response.data
              setTotalNFTs(totalCount)
              if (Array.isArray(nfts)) {
                const items = nfts.map((item) => {
                  const isOwner = false
                  if(walletAddress.toLowerCase() === item.tokenOwnerAddress) item.isOwner = true;
                  return { ...item, isOwner };
                })
                setCardItems(items)
              }
            }
          })
        } else {    //about other collection
          const count = await getCollectionNFTsCount(collectionAddress)
            .then((response) => {
              if (response && response.data) {
                const { totalCount } = response.data
                return totalCount
              }
            })
            .catch(() => {
              return 0
            })
          setTotalNFTs(count)
          let countNum = 1
          let itemTmp = []
          while (countNum <= count - 20) {
            await getCollectionNFTs(collectionAddress, countNum, countNum + 19)
            // eslint-disable-next-line no-loop-func
            .then((response) => {
              if (response && response.data) {
                const { nfts } = response.data;
                if (Array.isArray(nfts)) {
                  const items = nfts.map((item) => {
                    const isOwner = false
                    if(walletAddress.toLowerCase() === item.tokenOwnerAddress) item.isOwner = true;
                    return { ...item, isOwner };
                  })
                  if (items.length) {
                    itemTmp = [...itemTmp, ...items]
                    setCardItems([ ...itemTmp ])
                  }
                }
              }
            })
            countNum += 20
          }
          if (count > countNum - 1) {
            getCollectionNFTs(collectionAddress, countNum, count + 1)
            .then((response) => {
              if (response && response.data) {
                const { nfts } = response.data;
                if (Array.isArray(nfts)) {
                  const items = nfts.map((item) => {
                    const isOwner = false
                    if(walletAddress.toLowerCase() === item.tokenOwnerAddress) item.isOwner = true;
                    return { ...item, isOwner };
                  })
                  if (items.length) {
                    itemTmp = [...itemTmp, ...items]
                    setCardItems([ ...itemTmp ])
                  }
                }
              }
            })
          }
        }
      } else {  //profile or marketplace page
        setCardItems([]);
        let totalTokenCount = 0;
        const NFTContractInstance = await getContractInstance(NFTContractABI, defaultCollectionAddress);
        await NFTContractInstance.methods.totalTokenCount().call()
          .then((result) => {
            totalTokenCount = result;
          })
          .catch((err) => {
          });
        let cardItemsCopy = [];
        let isProfile = (collectionAddress === "profile");
        let isMarketplace = (!collectionAddress);

        //display default collection NFTs
        for(let id = 1; id <= totalTokenCount; id++) {
          let owner = true;
          let isOwner = false
          let tokenOwnerAddress = address0;
          await NFTContractInstance.methods.ownerOf(id).call()
            .then((result) => {
              if (result) {
                if(collectionAddress === "profile" && result.toLowerCase() !== walletAddress.toLowerCase()) owner = false;
                if (result.toLowerCase() === walletAddress.toLowerCase()) isOwner = true
                tokenOwnerAddress = result.toLowerCase()
              }
            })
            .catch((err) => {
            });
          if (owner) {
            await NFTContractInstance.methods.getMetadata(id).call()
            .then(async (result) => {
              let cardItem = {};
              cardItem.collectionAddress = defaultCollectionAddress;
              cardItem.id = id;
              cardItem.creater = result.creater;
              cardItem.likes = 0;
              cardItem.avatarImg = '1';
              cardItem.assetURI = getImageURI(result.assetURI);
              cardItem.title = result.title;
              cardItem.price = result.price;
              cardItem.stock = 6;
              cardItem.isOwner = isOwner;
              cardItem.tokenOwnerAddress = tokenOwnerAddress
              cardItem.assetType = result.assetType
              if(result.sellPending) cardItem.isOnSale = true
              else cardItem.isOnSale = false

              // await NFTContractInstance.methods.ownerOf(id).call()
              //   .then((result) => {
              //     if(walletAddress.toLowerCase() === result.toLowerCase()) cardItem.isOwner = true;
              //   })

              if(!isMarketplace || result.sellPending) {
                if (result.sellPending) cardItem.isOnSale = true
                cardItemsCopy.push(cardItem);
              }
              setCardItems([...cardItemsCopy]);
            })
            .catch((err) => {
            });
          }
        }

        //display other collection NFTs
        if(isProfile) {
          for(let i = 0; i < networkCollections["0xfa"].length; i++) {
            let collectionAddress = networkCollections["0xfa"][i].address;
            let ipfsPrefix = getIPFSPrefix(collectionAddress);
            let collectionContractInstance = await getContractInstance(collectionContractABI, collectionAddress);
            try{
              await collectionContractInstance.methods.tokenURI(1).call()
              // eslint-disable-next-line no-loop-func
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
              // eslint-disable-next-line no-loop-func
              .then(async (id) => {
                let cardItem = {};
                response = await fetch(ipfsPrefix + id + ipfsSufix);
                metadata = await response.json();
                cardItem.collectionAddress = collectionAddress;
                cardItem.id = id;
                cardItem.likes = 0;
                cardItem.avatarImg = '1';
                cardItem.assetURI = getImageURI(metadata.image);
                cardItem.assetType = getAssetType(metadata.image)
                cardItem.title = metadata.name;
                cardItem.price = 0;
                cardItem.stock = 6;
                cardItem.isOwner = false;

                await collectionContractInstance.methods.ownerOf(id).call()
                  .then((result) => {
                    if (result) {
                      if(walletAddress.toLowerCase() === result.toLowerCase()) cardItem.isOwner = true;
                      cardItem.tokenOwnerAddress = result.toLowerCase()
                    }
                  })

                await NFTContractInstance.methods.otherTokenStatus(collectionAddress, id).call()
                  .then(async (info) => {
                    cardItem.price = info.price;
                  })
                  .catch((err) => {
                  });

                cardItemsCopy.push(cardItem);
                setCardItems(cardItems.concat(cardItemsCopy));
              })
              // eslint-disable-next-line no-loop-func
              .catch(() => {
                index = -1;
              });
              if(index === -1) break;
              index++;
            }
          }
        }

        if(isMarketplace) {
          var uriInfoCopy = [];
          for(let i = 0; i < networkCollections["0xfa"].length; i++) {
            let uriInfoOfCollection = {};
            let collectionAddress = networkCollections["0xfa"][i].address;
            let ipfsPrefix = getIPFSPrefix(collectionAddress);
            uriInfoOfCollection.ipfsPrefix = ipfsPrefix;
            // let ipfsSufix = "";
            // let collectionContractInstance = await getContractInstance(collectionContractABI, collectionAddress);
            // // if(i === 3) console.log(i, collectionContractInstance);
            // // console.log(collectionContractInstance);
            // await collectionContractInstance.methods.tokenURI(1).call()
            // .then(async (uri) => {
            //   ipfsSufix = getIPFSSufix(uri);
            //   let involveId = isIdInURI(uri);
            //   let p = uri.indexOf("Qm");
            //   let locationQm = ""
            //   if (p !== -1) locationQm = uri.substring(p)
            //   uriInfoOfCollection.ipfsSufix = ipfsSufix;
            //   uriInfoOfCollection.involveId = involveId;
            //   uriInfoOfCollection.locationQm = locationQm;
            //   })
            // .catch((err) => {
            //   console.log(err);
            // });
            uriInfoCopy.push(uriInfoOfCollection);
          }
          setUriInfo(uriInfoCopy);
          // console.log("uriInfoCopy", uriInfoCopy);

          const NFTContractInstance = await getContractInstance(NFTContractABI, defaultCollectionAddress);

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
                // console.log("collectionAddr", result.collectionAddress);
                let info = uriInfoCopy[getIndexWithAddress(result.collectionAddress)];
                // console.log(info);
                let cardItem = {};
                let collectionContractInstance = await getContractInstance(collectionContractABI, result.collectionAddress);
                // if(i === 3) console.log(i, collectionContractInstance);
                // console.log(collectionContractInstance);
                let ipfsSufix = ''
                let involveId = false
                let locationQm = ''
                await collectionContractInstance.methods.tokenURI(result.id).call()
                .then(async (uri) => {
                  ipfsSufix = getIPFSSufix(uri);
                  involveId = isIdInURI(uri);
                  let p = uri.indexOf("Qm");
                  if (p !== -1) locationQm = uri.substring(p)
                })
                .catch((err) => {
                  console.log(err);
                });
                let tokenURI = getTokenURI(result.id, info.ipfsPrefix, ipfsSufix, involveId, locationQm);
                // console.log("tokenURI", tokenURI);
                let response = await fetch(tokenURI);
                let metadata = await response.json();
                // console.log("metadata", metadata);
                cardItem.collectionAddress = result.collectionAddress;
                cardItem.id = result.id;
                cardItem.likes = 0;
                cardItem.avatarImg = '1';
                cardItem.assetURI = getImageURI(metadata.image);
                cardItem.assetType = getAssetType(metadata.image)
                cardItem.title = metadata.name;
                cardItem.price = 0;
                cardItem.stock = 6;
                cardItem.isOwner = false;
                cardItem.isOnSale = true;

                await collectionContractInstance.methods.ownerOf(result.id).call()
                  .then((result) => {
                    if (result) {
                      if(walletAddress.toLowerCase() === result.toLowerCase()) cardItem.isOwner = true;
                      cardItem.tokenOwnerAddress = result.toLowerCase()
                    }
                  })

                await NFTContractInstance.methods.otherTokenStatus(result.collectionAddress, result.id).call()
                .then(async (info) => {
                  cardItem.price = info.price;
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
    } catch (err) {
      console.log(err.message)
    }
  
    }
    fetchNetworkState()
    fetchData()
  }, [])

  return (
    <div>
        <div className="row mb-50_reset mx-auto text-center">
          {/* banner of collection */}
          {collectionInfo && (
            <div style={{marginTop: "-85px", borderRadius: "30px"}}>
              { getAssetType(collectionInfo.collectionBanner) === 'video' ? (
                <video
                  style={{width: "100%", height: "auto", maxWidth: "500px", maxHeight: "500px"}}
                  controls
                  loop muted autoPlay
                >
                  <source src={collectionInfo.collectionBanner} id="video_here" />
                  Your browser does not support HTML5 video.
                </video>
              ) : (
                <img src={collectionInfo.collectionBanner} height="100%" width="100%" alt="Banner Load Error" className="collection-banner"/>
              )}
            </div>
          )}
          {/* name and description of collection */}
          {collectionInfo && (
            <div>
              <div style={{display: "flex", justifyContent: "center", marginTop: "0px", marginBottom: "20px", marginLeft: "5px"}}>
                <div>
                <br />
                <span><h2>{collectionInfo.name}</h2></span>
                <span className="audit-title" style={{marginLeft:"2px"}}>
                <b>Audit Status:</b>  {collectionInfo.audit}
                <span>
                {/* Social Links Begin */}
                  <div style={{marginLeft: "0px", marginRight: "0px"}}>
                    <a href={collectionInfo.website} target="_blank" className="website-btn" style={{marginLeft: "0px", marginRight: "5px"}} rel="noreferrer"><i className="ri-home-fill" /></a>
                    <a href={"https://twitter.com/" + collectionInfo.twitter} target="_blank" className="twitter-btn" style={{marginLeft: "5px", marginRight: "5px"}} rel="noreferrer"><i className="ri-twitter-fill" /></a>
                    <a href={"https://discord.gg/" + collectionInfo.discord} className="discord-btn" target="_blank" style={{marginLeft: "5px", marginRight: "5px"}} rel="noreferrer"><i className="ri-discord-fill" /></a>
                    <a href={"https://ftmscan.com/token/" + collectionInfo.address} className="website-btn" target="_blank" style={{marginLeft: "5px", marginRight: "5px"}} rel="noreferrer"><i className="ri-earth-fill" /></a>
                  </div>
                {/* Social Links End */}
                </span>
                </span>
                </div>
                </div>
              <div></div>
              <div style={{marginLeft: "5px", marginRight: "5px"}}>
                {collectionInfo.collectionDescription}
              </div>
            </div>
          )}
          {collectionInfo && (
            <div style={{}} className="text-center card_stats">
              <b>NFTs:</b> {totalNFTs} &nbsp;|&nbsp;
              &nbsp;<b>Total Volume:</b> {collectionInfo.totalVolume / Math.pow(10, 18)} FTM &nbsp;|&nbsp;
              &nbsp;<b>Total Sales:</b> {collectionInfo.totalSales} &nbsp;|&nbsp;
              &nbsp;<b>Average Price:</b> {Number(collectionInfo.totalSales) !== 0 ? Number(collectionInfo.totalVolume) / Number(collectionInfo.totalSales) / Math.pow(10, 18): 0} FTM &nbsp;|&nbsp;
              &nbsp;<b>Price Floor:</b> {collectionInfo.floor / Math.pow(10, 18)} FTM &nbsp;|&nbsp;
              &nbsp;<b>Last Sold For:</b> {collectionInfo.lastSale / Math.pow(10, 18)} FTM &nbsp;|&nbsp;
              &nbsp;<b>Last Sold:</b> {collectionInfo.lastSold}
              <br />
            </div>
          )}
          {cardItems.map((cardItem, i) => (
            <div className="col-xl-3 col-lg-3 col-md-6 col-sm-12" key={'index-' + i}>
              <div className="card__item four card__item2">
                <div className="card_body space-y-10">
                  <div className="card_head text-center center video_card">
                    <Link to={"/Item-details/" + cardItem.collectionAddress + "/" + cardItem.id}>
                    {cardItem.assetType === 'video' && (
                      <video
                        style={{height: "100%", maxWidth: "550px", maxHeight: "550px"}}
                        controls
                        loop muted autoPlay
                      >
                        <source src={cardItem.assetURI} id="video_here" />
                        Your browser does not support HTML5 video.
                      </video>
                    )}
                    {cardItem.assetType === 'image' && (
                      <img
                        src={cardItem.assetURI}
                        alt="This NFT has no image."
                      />
                    )}
                    {cardItem.assetType === 'other' && (
                      <img
                        src={cardItem.assetURI}
                        alt="This NFT has no image."
                      />
                    )}
                    </Link>
                  </div>
                  {/* =============== */}
                  <h6 className="card_title">{cardItem.title}</h6>
                  <div className="card_footer d-block space-y-10">
                    <div className="card_footer justify-content-between">
                      <Link to="#">
                        {cardItem.price === 0 && (
                          <p className="txt_sm">
                            Not for Sale
                          </p>

                        )}
                        {cardItem.price != 0 && (
                          <p className="txt_sm">
                            <b>Price:</b>&nbsp;
                            <span
                              className="color_green txt_sm">
                              {cardItem.price / Math.pow(10, 18)} FTM
                            </span>
                          </p>
                        )}
                      </Link>
                    </div>

                    <div className="hr" />
                    <div className="d-flex align-items-center space-x-10 justify-content-between">
                      {cardItem.isOwner ? (
                        <>
                          {cardItem.isOnSale && !networkError && (
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={(e) => { e.preventDefault(); handleRemoveSellPending(cardItem) }}
                            >
                              Remove
                            </button>
                          )}
                          {cardItem.isOnSale && networkError && (
                            <Popup
                              className="custom"
                              trigger={
                                <button className="btn btn-sm btn-primary">
                                  Remove
                                </button>
                              }
                              position="bottom center"
                            >
                              <p>Please connect wallet or connect FTM network!</p>
                            </Popup>
                          )}
                          {!cardItem.isOnSale && (
                            <Popup
                              className="custom"
                              trigger={
                                <button className="btn btn-sm btn-primary">
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
                                      {/* <button
                                        type="button"
                                        className="button close"
                                        data-dismiss="modal"
                                        aria-label="Close"
                                        onClick={closeTooltip}>
                                        <span aria-hidden="true">×</span>
                                      </button> */}
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
                                              }
                                            }
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
                                          onClick={(e) => { e.preventDefault(); handleSetSellPending(cardItem) }}
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
                        </>
                      ) : (
                        <>
                        { cardItem.isOnSale ? (
                          <Popup
                            className="custom"
                            trigger={
                              <button className="btn btn-sm btn-primary">
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
                                    {/* <button
                                      type="button"
                                      className="button close"
                                      data-dismiss="modal"
                                      aria-label="Close"
                                      onClick={closeTooltip}>
                                      <span aria-hidden="true">×</span>
                                    </button> */}
                                    <div className="space-y-20">
                                      <h3>Checkout</h3>
                                      <p>
                                        Confirm purchase of&nbsp;
                                        <span className="color_black">{cardItem.title}</span>
                                        &nbsp;from&nbsp;
                                        <span className="color_black">{getAbbrWalletAddress(cardItem.tokenOwnerAddress)}</span>
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
                                        onClick={() => handleBuyToken(cardItem)}
                                      >
                                        Buy
                                      </Link>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Popup>
                        ) : (
                          <div
                            className="d-flex align-items-center space-x-5">
                              + Details
                          </div>
                        )}
                        </>
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

export default React.memo(CardMarketplace);
