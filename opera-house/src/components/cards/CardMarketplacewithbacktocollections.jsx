import React, { useState, useRef, useEffect } from 'react';
import {Link, useHistory} from 'react-router-dom';
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';
import InfiniteScroll from 'react-infinite-scroll-component'
import {
  NFTContractABI, collectionContractABI
} from '../../constant/contractABI';
import NFTContext from '../../context/NFTContext';
import { config } from "../../constant/config"
import { networkCollections } from "../../constant/collections"
import { useMoralisWeb3Api, useMoralis } from 'react-moralis';
import Web3 from 'web3'
import Image from '../custom/Image';
import Filter from '../custom/Filter';
import AttributeFilter from '../custom/AttributeFilter';
import { ignoreNFT } from '../../constant/ignore';
const defaultCollectionAddress = config.contractAddress;
const address0 = "0x0000000000000000000000000000000000000000";

const sleep = (timeToSleep) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve()
    }, timeToSleep)
  })
}

// const getContractInstance = async (contractABI, contractAddress) => {
//   const currentProvider = await detectEthereumProvider();
//   const web3Instance = new Web3(currentProvider);
//   if (web3Instance) {
//       let contract = new web3Instance.eth.Contract(contractABI, contractAddress);
//       return contract;
//   }
//   else {
//       return null;
//   }
// }

const isIpfs = (uri) => {
  if (uri && uri.includes('ipfs')) {
    return true
  } else {
    return false
  }
}

const isBurned = (address) => {
  if (address.toLowerCase() === '0x0000000000000000000000000000000000000001' || address.toLowerCase() === '0x000000000000000000000000000000000000dead') return true
  else return false
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
  if(uri.substring(uri.length - 4) === ".json") return ".json";
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

const getTokenURIOld = (id, ipfsPrefix, ipfsSufix, involveId, locationQm) => {

  if(involveId) {
    return ipfsPrefix + id + ipfsSufix;
  } else{
    return "https://operahouse.mypinata.cloud/ipfs/" + locationQm;
  }
}

const getCollectionOwner = (collectionAddress) => {
  for(let i = 0; i < networkCollections["0xfa"].length; i++) {
    if(networkCollections["0xfa"][i].address && networkCollections["0xfa"][i].address.toLowerCase() === collectionAddress.toLowerCase())
      return networkCollections["0xfa"][i].collecionOwner.toLowerCase();
  }
  return "";
}

const getAbbrWalletAddress = (walletAddress) => {
  let abbrWalletAddress = walletAddress.substring(0, 4) + "..." + walletAddress.substring(38, 42);
  return abbrWalletAddress.toLowerCase();
}

const getRoyalty = (collectionAddress) => {
  for(let i = 0; i < networkCollections["0xfa"].length; i++) {
    if(networkCollections["0xfa"][i].address.toLowerCase() === collectionAddress.toLowerCase())
      return networkCollections["0xfa"][i].royalty;
  }
  return "";
}



const getIndexWithAddress = (address) => {
  for(let i = 0; i < networkCollections["0xfa"].length; i++) {
    if(networkCollections["0xfa"][i].address.toLowerCase() === address.toLowerCase()){
      return i;
    }
  }
  return -1;
}

const getCollectionWithAddress = (address) => {
  for(let i = 0; i < networkCollections["0xfa"].length; i++) {
    if(networkCollections["0xfa"][i].address.toLowerCase() === address.toLowerCase()){
      return networkCollections["0xfa"][i];
    }
  }
  return null;
}

const getCollectionAddresses = () => {
  const addresses = []
  for(let i = 0; i < networkCollections["0xfa"].length; i++) {
    addresses.push(networkCollections["0xfa"][i].address.toLowerCase())
  }
  return addresses
}

function CardMarketplace(props) {
  const ref = useRef();
  const history = useHistory();
  const [cardItems, setCardItems] = React.useState([]);
  const [traits, setTraits] = React.useState();
  const [filteredCardItems, setFilteredCardItems] = React.useState([]);
  const [filterOptions, setFilterOptions] = React.useState({
    name: '',
    isOnSale: false,
    category: '',
    minPrice: null,
    maxPrice: null,
    rarity: null
  })
  const [traitFilterOptions, setTraitFilterOptions] = useState()
  const [showRarity, setShowRarity] = useState(false)
  const [loadEvent, setLoadEvent] = useState(false)
  const [_cardItemsToShow, _setCardItemsToShow] = React.useState([])
  const [updateItem, setUpdateItem] = React.useState()
  const [moreItems, setMoreItems] = React.useState()
  const [cardItemsToShow, setCardItemsToShow] = React.useState([])
  const [to, setTo] = React.useState("");
  const [collectionInfo, setCollectionInfo] = React.useState(null);
  const nftsRef = React.useRef([]);
  const stateRef = React.useRef('idle');
  const fetchIndexRef = React.useRef(0)
  const showLengthRef = React.useRef(20)
  const [totalNFTs, setTotalNFTs] = React.useState(0);
  const [uriInfo, setUriInfo] = React.useState([]);
  const [sellPrice, setSellPrice] = useState(0);
  const { isInitialized, account: walletAddress, isAuthenticated, web3, enableWeb3, isWeb3Enabled, chainId, web3EnableError, auth } = useMoralis();
  const Web3Api = useMoralisWeb3Api()

  const closeTooltip = () => ref.current.close();
  // const walletAddress = React.useMemo( () => localStorage.getItem("walletAddress"), []);

  // const collectionAddress = config.contractAddress;
  const collectionAddress = props.collectionAddress;
  const networkError = (chainId !== '0xfa' || !walletAddress)

  const getContractInstance = React.useCallback(async (contractABI, contractAddress) => {
    if (web3 && chainId === '0xfa') {
        let contract = new web3.eth.Contract(contractABI, contractAddress);
        return contract;
    }
    else {
      const web3 = new Web3(new Web3.providers.HttpProvider('https://rpc.ftm.tools/'));
      const contract = new web3.eth.Contract(contractABI, contractAddress);
      return contract;
    }
  }, [web3, chainId])

  const getCollectionInfo = React.useCallback(async (collectionAddress) => {
    let NFTContractInstance = await getContractInstance(NFTContractABI, defaultCollectionAddress);
    let info = {};
    for(let i = 0; i < networkCollections["0xfa"].length; i++) {
      if(networkCollections["0xfa"][i].address.toLowerCase() === collectionAddress.toLowerCase())
        info = networkCollections["0xfa"][i];
    }

    let address = collectionAddress === defaultCollectionAddress ? address0 : collectionAddress;
    let lastSoldTimeStamp = 0;
    await NFTContractInstance.methods.collectionInfo(address).call()
      .then((result) => {
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
        if(Number(result) === 99999999999999999999999999) floor = 0;
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
    if(Number(lastSoldTimeStamp) === 0) period = 0;
    if(period < 60) info.lastSold = period.toString() + " second(s) ago.";
    else if(period < 60 * 60) info.lastSold = Math.floor(period / 60).toString() + " minute(s) ago.";
    else if(period < 60 * 60 * 24) info.lastSold = Math.floor(period / 60 / 60).toString() + " hour(s) ago.";
    else info.lastSold = Math.floor(period / 60 / 60 / 24).toString() + " day(s) ago.";
    return info;
  }, [getContractInstance])

  const fetchItemsToShow = async () => {
    const totalLen = filteredCardItems.length
    const curLen = _cardItemsToShow.length
    if (stateRef.current === 'idle' || stateRef.current === 'pending') {
      if (totalLen > curLen) {
        let length = curLen + 20
        if (length > totalLen) length = totalLen
        const newItems = filteredCardItems.slice(0, length)
        _setCardItemsToShow(newItems)
        if (length > showLengthRef.current)
          showLengthRef.current = (length + 20) - length %20
        return true
      } else {
        if (!loadEvent)
          await sleep(3000)
          setLoadEvent(true)
        return false
      }
    } else {
      const currentLength = _cardItemsToShow.length
      let length = currentLength + 12
      if (length > totalLen) length = totalLen
      const newItems = filteredCardItems.slice(0, length)
      _setCardItemsToShow(newItems)
      if (length > showLengthRef.current)
          showLengthRef.current = (length + 20) - length %20
      return true
    }
  }

  const handleTransfer = React.useCallback(async (e, collectionAddress, tokenId) => {
    try {
      e.preventDefault();
      let collectionContractInstance = await getContractInstance(collectionContractABI, collectionAddress);
      await collectionContractInstance.methods.safeTransferFrom(walletAddress, to, tokenId).send({ from: walletAddress });
      setTimeout(() => {
        history.go(0);
      }, 10000);
    } catch (err) {
      console.log(err.message)
    }
  }, [walletAddress, to, getContractInstance, history])

  const handleBuyToken = React.useCallback(async (item) => {
    const NFTContractInstance = await getContractInstance(NFTContractABI, defaultCollectionAddress);
    if(item.collectionAddress === defaultCollectionAddress) {   //default collection NFT buy
      let value = (item.price).toString();
      try{
        await NFTContractInstance.methods.transfer(item.tokenOwnerAddress, item.id).send({ from: walletAddress, value: value });
        while (true) {
          let loopState = false
          await sleep(3000)
          await NFTContractInstance.methods.ownerOf(item.id).call()
          .then((result) => {
            if (result && result.toLowerCase() === walletAddress.toLowerCase()) {
              loopState = true
              const newItem = { ...item, tokenOwnerAddress: walletAddress, isOwner: true, isOnSale: false, price: 0 }
              setUpdateItem(newItem)
            }
          })
          .catch((err) => {
              console.log('get token owner address err');
          });
          if (loopState) break
        }
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

      if(value !== 0) {
        let collectionOwner = getCollectionOwner(item.collectionAddress);
        let Royalty = getRoyalty(item.collectionAddress) * 1000;
        try{
          await NFTContractInstance.methods.transferOther(item.tokenOwnerAddress, item.collectionAddress, item.id, collectionOwner, Royalty).send({ from: walletAddress, value: value });
          const collectionContractInstance = await getContractInstance(collectionContractABI, item.collectionAddress);
          while (true) {
            let loopState = false
            await sleep(3000)
            await collectionContractInstance.methods.ownerOf(item.id).call()
            .then((result) => {
              if (result && result.toLowerCase() === walletAddress.toLowerCase()) {
                loopState = true
                const newItem = { ...item, tokenOwnerAddress: walletAddress, isOwner: true, isOnSale: false, price: 0 }
                setUpdateItem(newItem)
              }
            })
            .catch((err) => {
                console.log('get token owner address err');
            });
            if (loopState) break
          }
        } catch(err) {
          console.log(err);
        }
      }
    }
  }, [walletAddress, getContractInstance])

  const handleSetSellPendingOther = React.useCallback(async (cardItem) => {
    const collectionContractInstance = await getContractInstance(collectionContractABI, cardItem.collectionAddress);
    let isApproved = false;
    try{
      await collectionContractInstance.methods.approve(defaultCollectionAddress, cardItem.id).send({ from: walletAddress });
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
        while (true) {
          let loopState = false
          await sleep(3000)
          await NFTContractInstance.methods.otherTokenStatus(cardItem.collectionAddress, cardItem.id).call()
            .then((result) => {
              if (result.sellPending) {
                loopState = true
                const newItem = { ...cardItem, isOnSale: true }
                setUpdateItem(newItem)
              } else {
              }
            })
            .catch((err) => {
              console.log(err);
            });
          if (loopState) break
        }
      } catch(err) {
        console.log(err);
      }
    }
  }, [sellPrice, getContractInstance, walletAddress])

  const handleSetSellPending = React.useCallback(async (cardItem) => {
    if(cardItem.collectionAddress !== defaultCollectionAddress) {
      handleSetSellPendingOther(cardItem);
      return;
    }
    const NFTContractInstance = await getContractInstance(NFTContractABI, cardItem.collectionAddress);
    try{
      let price = (sellPrice * Math.pow(10, 9)).toString() + "000000000";
      await NFTContractInstance.methods.setSellPending(cardItem.id, true, price).send({ from: walletAddress });
      while (true) {
        let loopState = false
        await sleep(2000)
        await NFTContractInstance.methods.getMetadata(cardItem.id).call()
        .then((result) => {
          if (result.sellPending) {
            const newItem = { ...cardItem, isOnSale: true }
            setUpdateItem(newItem)
            loopState = true
          }
        })
        .catch((err) => {
            console.log('get Metadata err');
        });
        if (loopState) break
      }
    } catch(err) {
      console.log(err);
    }
  }, [handleSetSellPendingOther, sellPrice, getContractInstance, walletAddress])

  const handleRemoveSellPendingOther = React.useCallback(async (item) => {
    const NFTContractInstance = await getContractInstance(NFTContractABI, defaultCollectionAddress);
    try{
      await NFTContractInstance.methods.removeSellPendingOther(item.collectionAddress, item.id, walletAddress).send({ from: walletAddress });
      while (true) {
        console.log('loop')
        let loopState = false
        await sleep(3000)
        await NFTContractInstance.methods.otherTokenStatus(item.collectionAddress, item.id).call()
          .then((result) => {
            if (!result.sellPending) {
              loopState = true
              const newItem = { ...item, isOnSale: false }
              setUpdateItem(newItem)
            }
          })
          .catch((err) => {
            console.log(err);
          });
        if (loopState) break
      }
    } catch(err) {
      console.log(err);
    }
  }, [getContractInstance, walletAddress])

  const handleRemoveSellPending = React.useCallback(async (item) => {
    if(item.collectionAddress.toLowerCase() !== defaultCollectionAddress.toLowerCase()) {
      handleRemoveSellPendingOther(item);
      return;
    }
    const NFTContractInstance = await getContractInstance(NFTContractABI, item.collectionAddress);
    try{
      let price = 0;
      await NFTContractInstance.methods.setSellPending(item.id, false, price).send({ from: walletAddress });
      while (true) {
        let loopState = false
        await sleep(3000)
        await NFTContractInstance.methods.getMetadata(item.id).call()
        .then((result) => {
          if (!result.sellPending) {
            loopState = true
            const newItem = { ...item, isOnSale: false }
            setUpdateItem(newItem)
          }
        })
        .catch((err) => {
            console.log('get Metadata err');
        });
        if (loopState) break
      }
    } catch(err) {
      console.log(err);
    }
  }, [getContractInstance, walletAddress, handleRemoveSellPendingOther])

  useEffect(() => {
    if (isInitialized && enableWeb3) {
      enableWeb3()
    }
  }, [enableWeb3, isInitialized])


  // pull NFT data from contract and ipfs
  React.useEffect(() => {
    const fetchData = async (fetchIndex) => {
      if (chainId && Number(chainId) !== 0xfa) return setCardItems([])
      try {
        let ipfsPrefix = getIPFSPrefix(collectionAddress);
        if(collectionAddress && collectionAddress !== "profile") {  //collection page
          let collectionInfo = await getCollectionInfo(collectionAddress);
          if (fetchIndex === fetchIndexRef.current) {
            setCollectionInfo(collectionInfo);
          }
          if(collectionAddress === defaultCollectionAddress) { //about default collection
            let totalTokenCount = 0;
            const NFTContractInstance = await  getContractInstance(NFTContractABI, defaultCollectionAddress);

            await NFTContractInstance.methods.totalTokenCount().call()
              .then((result) => {
                totalTokenCount = Number(result);
                setTotalNFTs(totalTokenCount);
              })
              .catch((err) => {
              });

            let cardItemsCopy = [];
            const getDefaultItem = (id) => {
              return NFTContractInstance.methods.getMetadata(id).call()
              .then(async (result) => {
                let cardItem = {};
                let isBurnedNFT = false
                cardItem.collectionAddress = collectionAddress;
                cardItem.id = id;
                cardItem.creater = result.creater;
                cardItem.likes = 0;
                cardItem.avatarImg = '1';
                cardItem.assetURI = getImageURI(result.assetURI);
                cardItem.title = result.title;
                cardItem.price = Number(result.price);
                cardItem.stock = 6;
                cardItem.isOwner = false;
                if (result.assetType && result.assetType !== '') {
                  cardItem.assetType = result.assetType
                } else {
                  cardItem.assetType = getAssetType(result.assetURI)
                }
                if(result.sellPending && Number(result.price) > 0) cardItem.isOnSale = true
                else cardItem.isOnSale = false

                await NFTContractInstance.methods.ownerOf(id).call()
                  .then((result) => {
                    if (result) {
                      if(walletAddress.toLowerCase() === result.toLowerCase()) cardItem.isOwner = true;
                      cardItem.tokenOwnerAddress = result.toLowerCase()
                      if (isBurned(result)) isBurnedNFT = true
                    }
                  })
                if (!isBurnedNFT)
                  return cardItem;
                else return null
              })
            }

            let startId = 1
            let promises = []
            let endId = totalTokenCount > 50 ? 50 : totalTokenCount
            // if (endId > totalTokenCount) endId = totalNFTs + 1
            for(let id = startId; id <= endId; id++) {
              promises.push(getDefaultItem(id))
            }
            let nfts = await Promise.all(promises);
            nfts = nfts.filter(({ id }) => !ignoreNFT.includes(id))
            nfts.sort(function(a,b){return a.id-b.id});
            cardItemsCopy = nfts
            nftsRef.current = nfts
            setCardItems(nfts)
            stateRef.current = 'pending'
            showLengthRef.current = 20
            startId = 50
            while (startId <= totalTokenCount) {
              let promises = []
              let endId = startId + 199
              if (endId > totalTokenCount) endId = totalTokenCount
              for(let id = startId; id <= endId; id++) {
                promises.push(getDefaultItem(id))
              }
              let nfts = await Promise.all(promises);
              nfts = nfts.filter(({ id }) => !ignoreNFT.includes(id))

              cardItemsCopy = [...cardItemsCopy, ...nfts]
              if (cardItemsCopy.length < 20) { _setCardItemsToShow([...cardItemsCopy]); showLengthRef.current = nfts.length }
              nftsRef.current = cardItemsCopy
              setCardItems(cardItemsCopy)
              startId += 200
            }
            stateRef.current = 'resolved'
          } else {    //about other collection
            const collectionContractInstance = await  getContractInstance(collectionContractABI, collectionAddress);
            const NFTContractInstance = await getContractInstance(NFTContractABI, defaultCollectionAddress);
            let index = 0;
            let cardItemsCopy = [];
            const _traits = []
            let _showRarity = false
            const getNftIdFromSaleArray = async (id) => {
              return NFTContractInstance.methods.onSaleArray(id).call()
              .then(async (result) => {
                if(result.sellPending && result.collectionAddress.toLowerCase() === collectionAddress.toLowerCase()) {
                  // console.log("collectionAddr", result.collectionAddress);
                  const price = await NFTContractInstance.methods.otherTokenStatus(result.collectionAddress, result.id).call()
                  .then(async (info) => {
                    return info.price;
                  })
                  .catch((err) => {
                  });
                  return {id: result.id, price}
                } else {
                  return null
                }
              })
              .catch(() => null)
            }

            let onSaleArrayLength = 0;
            await NFTContractInstance.methods.getOnSaleArrayLength().call()
              .then(async (result) => {
                onSaleArrayLength = result;
              })
              .catch((err) => {
                console.log(err);
              });

            let salePromises = []
            for (let i = 0; i <= onSaleArrayLength; i++) {
              salePromises.push(getNftIdFromSaleArray(i))
            }
            let onSaleIdAndPriceArr = []
            try {
              onSaleIdAndPriceArr = await Promise.all(salePromises)
            } catch (er) {
            }
            onSaleIdAndPriceArr = onSaleIdAndPriceArr.filter((item) => item)

            const fetchItemData = async (data) => {
              try {
                if (data) {
                  const { token_uri, token_id: id } = data

                  let cardItem = {};
                  let isBurnedNFT = false
                  cardItem.isOwner = false;

                  await collectionContractInstance.methods.ownerOf(id).call()
                    .then((result) => {
                      if (result) {
                        cardItem.tokenOwnerAddress = result.toLowerCase()
                        if(walletAddress && walletAddress.toLowerCase() === result.toLowerCase()) cardItem.isOwner = true;
                        if (isBurned(result)) isBurnedNFT = true
                      }
                    })
                  if (isBurnedNFT) return null
                  
                  if (isIpfs(token_uri)) {
                    cardItem.token_uri = token_uri
                  } else {
                    await collectionContractInstance.methods.tokenURI(id).call()
                      .then((result) => {
                        if (result && result !== '') {
                          cardItem.token_uri = result
                        } else {
                          cardItem.token_uri = token_uri
                        }
                      })
                      .catch(() => cardItem.token_uri = token_uri)
                  }

                  cardItem.collectionAddress = collectionAddress;
                  cardItem.id = id;
                  cardItem.likes = 0;
                  cardItem.avatarImg = '1';
                  cardItem.title = '';
                  cardItem.price = 0;
                  cardItem.stock = 6;
                  // cardItem.token_uri = token_uri

                  const idAndPrice = onSaleIdAndPriceArr.find((item) => item.id === id)
                  if (idAndPrice) {
                    cardItem.isOnSale = true
                    cardItem.price = Number(idAndPrice.price)
                  } else {
                    cardItem.isOnSale = false
                  }

                  return cardItem
                }
              } catch (err) {
                console.log(err.message)
                return null
              }
            }
            const fetchMetadata = async (item) => {
              try {
                const cardItem = { ...item }
                const { id, token_uri, metadata: _metadata } = item
                const p = token_uri.indexOf('?')
                let uri = token_uri
                if (p !== -1) uri = token_uri.slice(0, p)
                let tokenURI = '';
                let metadata = null
                const ipfsSufix = getIPFSSufix(uri);
                if (!_metadata) {
                  if (!isIpfs(uri) || isBase64(uri)) {
                    tokenURI = uri
                  } else if (ipfsSufix === 'url') {
                    if (uri.includes('Qm') ) {
                      let p = uri.indexOf("Qm");
                      let locationQm = ""
                      if (p !== -1) locationQm = uri.substring(p)
                      tokenURI = 'https://operahouse.mypinata.cloud/ipfs/' + locationQm
                    } else {
                      tokenURI = uri
                    }
                  } else {
                    let involveId = isIdInURI(uri);
                    let p = uri.indexOf("Qm");
                    let locationQm = ""
                    if (p !== -1) locationQm = uri.substring(p)
                    tokenURI = getTokenURI(id, ipfsPrefix, ipfsSufix, involveId, locationQm);
                  }

                  try {
                    let response = await fetch(tokenURI);
                    metadata = await response.json();
                  } catch (err) {
                    return null
                  }
                } else {
                  metadata = { ..._metadata }
                }
                cardItem.title = metadata.name
                if (metadata.image) {
                  cardItem.assetURI = getImageURI(metadata.image);
                  cardItem.assetType = getAssetType(metadata.image)
                } else {
                  cardItem.assetURI = ''
                  cardItem.assetType = 'other'
                }
                const { attributes } = metadata
                let _setTrait = false
                if (attributes && Array.isArray(attributes)) {
                  cardItem.attributes = attributes
                  attributes.forEach((trait) => {
                    if (trait && trait.trait_type) {
                      const traitField = _traits.find(({ type }) => (type === trait.trait_type))
                      if (traitField) {
                        const { values } = traitField
                        if (!values.includes(trait.value)) {
                          values.push(trait.value)
                          _setTrait = true
                        }
                      } else {
                        const newTrait = {
                          type: trait.trait_type,
                          values: [trait.value]
                        }
                        _traits.push(newTrait)
                        _setTrait = true
                      }
                    }
                  })
                  if (_setTrait) setTraits([..._traits])
                  const arr = attributes.filter((item) => item.frequency)
                  if (arr && arr.length) {
                    let rarityAttrs = arr.map(({frequency}) => {
                      let value = 0
                      if (frequency.includes('%')) {
                        value = frequency.replace('%', '')
                      }
                      return Number(value)
                    })
                    let sum = 0
                    rarityAttrs.forEach(element => {
                      sum += 1/element
                    })
                    cardItem.rarityScore = Number((rarityAttrs.length / sum).toFixed(2))
                    if (!_showRarity) {
                      setShowRarity(true)
                      _showRarity = true
                    }
                  }
                }
                setUpdateItem(cardItem)
              } catch (err) {
                console.log(err)
              }
            }

            let totalCount = 0
            const optionsFirst = { chain: "0xfa", address: collectionAddress, offset: index, limit: 1 }
            const resultFirst = await Web3Api.token.getAllTokenIds(optionsFirst)
            if (resultFirst && resultFirst.result && resultFirst.result.length > 0) {
              const { total } = resultFirst;
              if (fetchIndexRef.current === fetchIndex)
                setTotalNFTs(Number(total));
              totalCount = total
              // _setCardItemsToShow(cardItemsCopy)
              // if (cardItemsCopy.length)
              //   showLengthRef.current = cardItemsCopy.length
            }
            index = totalCount - 50
            if (index < 0) index = 0
            const options = { chain: "0xfa", address: collectionAddress, offset: index, limit: 50 }
            const result = await Web3Api.token.getAllTokenIds(options)
            if (result && result.result && result.result.length > 0) {
              const { result: nfts, total } = result;
              if (fetchIndexRef.current === fetchIndex) {
                setTotalNFTs(Number(total));
              } else {
                return
              }
              let newNfts = await Promise.all(nfts.map((data) => fetchItemData(data)));
              newNfts = newNfts.filter((item) => item)
              newNfts.sort(function(a,b){return a.id-b.id});
              // newNfts = newNfts.sort((item1, item2) => {
              //   if (Number(item1.id) > Number(item2.id)) return -1
              //   else if (Number(item1.id) < Number(item2.id)) return 1
              //   else return 0
              // })
              cardItemsCopy = newNfts;
              if (fetchIndexRef.current === fetchIndex) {
                nftsRef.current = cardItemsCopy
                setCardItems(cardItemsCopy)
                newNfts.map((item) => fetchMetadata(item))
                stateRef.current = 'pending'
              } else {
                return console.log('previous fetch')
              }
              // _setCardItemsToShow(cardItemsCopy)
              // if (cardItemsCopy.length)
              //   showLengthRef.current = cardItemsCopy.length
            }
            while (index > 0) {
              try {
                index -= 500
                let limit = 500
                if (index < 0) { limit += index; index = 0; }
                const options = { chain: "0xfa", address: collectionAddress, offset: index, limit }
                const result = await Web3Api.token.getAllTokenIds(options).catch((err) => {})
                if (result && result.result && result.result.length > 0) {
                  const { result: nfts } = result;
                  let newNfts = await Promise.all(nfts.map((data) => fetchItemData(data)));
                  newNfts = newNfts.filter((item) => item)
                  newNfts.sort(function(a,b){return a.id-b.id});
                  cardItemsCopy = [...cardItemsCopy, ...newNfts];
                  cardItemsCopy.sort(function(a,b){return a.id-b.id});
                  // if (cardItemsCopy.length < 20) { _setCardItemsToShow([...cardItemsCopy]); showLengthRef.current = cardItemsCopy.length }
                  if (fetchIndexRef.current === fetchIndex) {
                    nftsRef.current = cardItemsCopy
                    // setCardItems(cardItemsCopy)
                    setMoreItems(newNfts)
                    newNfts.map((item) => fetchMetadata(item))
                  } else {
                    return
                  }
                } else {
                  break;
                }
              } catch (err) {
                console.log('other collection error', err.message)
              }
            }
            stateRef.current = 'resolved'
            // if (fetchIndexRef.current === fetchIndex) {
            //   cardItemsCopy.map((item) => fetchMetadata(item))
            // }

          }
        } else {  //profile or marketplace page
          if (fetchIndexRef.current === fetchIndex) {
            setCardItems([]);
          } else {
            return
          }
          let totalTokenCount = 0;
          const NFTContractInstance = await getContractInstance(NFTContractABI, defaultCollectionAddress);
          await NFTContractInstance.methods.totalTokenCount().call()
            .then((result) => {
              totalTokenCount = Number(result);
            })
            .catch((err) => {
            });
          let cardItemsCopy = [];
          let isProfile = (collectionAddress === "profile");
          let isMarketplace = (!collectionAddress);
            console.log('wallet address')
          if (isProfile && !walletAddress) return

          const defaultCollectionInfo = await getCollectionInfo(defaultCollectionAddress)

          const getDefaultItem = async (id) => {
            try {
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
              if (isBurned(tokenOwnerAddress)) return null
              if (owner) {
                return await NFTContractInstance.methods.getMetadata(id).call()
                .then(async (result) => {
                  let cardItem = {};
                  cardItem.collectionAddress = defaultCollectionAddress;
                  cardItem.id = id;
                  cardItem.creater = result.creater;
                  cardItem.likes = 0;
                  cardItem.avatarImg = '1';
                  cardItem.assetURI = getImageURI(result.assetURI);
                  cardItem.title = result.title;
                  if (defaultCollectionInfo) cardItem.category = defaultCollectionInfo.category
                  cardItem.price = Number(result.price);
                  cardItem.stock = 6;
                  cardItem.isOwner = isOwner;
                  cardItem.tokenOwnerAddress = tokenOwnerAddress
                  if (result.assetType && result.assetType !== '') {
                    cardItem.assetType = result.assetType
                  } else {
                    cardItem.assetType = getAssetType(result.assetURI)
                  }
                  if(result.sellPending) cardItem.isOnSale = true
                  else cardItem.isOnSale = false

                  // await NFTContractInstance.methods.ownerOf(id).call()
                  //   .then((result) => {
                  //     if(walletAddress.toLowerCase() === result.toLowerCase()) cardItem.isOwner = true;
                  //   })
                  return cardItem;
                })
                .catch((err) => {
                });
              } else {
                return null
              }
            } catch (err) {
              return null
            }
          }
          //display default collection NFTs

          let startId = 1
          while(startId <= totalTokenCount) {
            let promises = []
            let endId = startId + 19
            if (endId > totalTokenCount) endId = totalTokenCount + 1
            for(let id = startId; id <= endId; id++) {
              promises.push(getDefaultItem(id))
            }
            let nfts = await Promise.all(promises);
            nfts = nfts.filter((item) => {
              if (item) {
                if (ignoreNFT.includes(Number(item.id))) return false
                if((isMarketplace && item.isOnSale) || (isProfile && item.isOwner)) {
                  return true
                }
              }
              return false
            })
            nfts.sort(function(a,b){return a.id-b.id});
            cardItemsCopy = [...cardItemsCopy, ...nfts]
            if (fetchIndexRef.current === fetchIndex) {
              nftsRef.current = cardItemsCopy
              setCardItems(cardItemsCopy)
              stateRef.current = 'pending'
              // if (startId === 1) {
              //   _setCardItemsToShow(cardItemsCopy)
              //   showLengthRef.current = cardItemsCopy.length
              // }
            } else {
              return
            }
            startId += 20
          }

          //display other collection NFTs
          if(isProfile) {
            const failedIds = []
            const getOtherCollectionItems = async (id) => {
              const collectionInfo = networkCollections["0xfa"][id]
              let collectionAddress = collectionInfo.address;
              let ipfsPrefix = getIPFSPrefix(collectionAddress);
              const options = { chain: "0xfa", address: walletAddress, token_address: collectionAddress};

              const result = await Web3Api.account.getNFTsForContract(options)

              if (result && result.total) {
                const { result: nfts, total } = result;
                for (let j = 0; j < total; j++ ) {
                  try {
                    const data = nfts[j]
                    let cardItem = {};
                    let tokenURI = '';
                    
                    let uri = data.token_uri
                    const p = data.token_uri.indexOf('?')
                    
                    if (p !== -1) uri = data.token_uri.slice(0, p)
                    const ipfsSufix = getIPFSSufix(uri);
                    if (!isIpfs(uri) || isBase64(uri)) {
                      tokenURI = uri
                    } else if (ipfsSufix === 'url') {
                      if (uri.includes('ipfs') && uri.includes('Qm') ) {
                        let p = uri.indexOf("Qm");
                        let locationQm = ""
                        if (p !== -1) locationQm = uri.substring(p)
                        tokenURI = 'https://operahouse.mypinata.cloud/ipfs/' + locationQm
                      } else {
                        tokenURI = uri
                      }
                    } else {
                      let involveId = isIdInURI(uri);
                      let p = uri.indexOf("Qm");
                      let locationQm = ""
                      if (p !== -1) locationQm = uri.substring(p)
                      tokenURI = getTokenURI(data.token_id, ipfsPrefix, ipfsSufix, involveId, locationQm);
                    }
                    const response = await fetch(tokenURI);
                    const metadata = await response.json();
                    cardItem.collectionAddress = collectionAddress;
                    cardItem.id = data.token_id;
                    cardItem.likes = 0;
                    cardItem.avatarImg = '1';
                    cardItem.assetURI = getImageURI(metadata.image);
                    cardItem.assetType = getAssetType(metadata.image)
                    cardItem.title = metadata.name;
                    cardItem.category = collectionInfo.category
                    cardItem.price = 0;
                    cardItem.stock = 6;
                    cardItem.isOwner = false;
                    cardItem.isOnSale = true;
                    cardItemsCopy.push(cardItem);
                    cardItem.tokenOwnerAddress = walletAddress.toLowerCase()
                    // let collectionContractInstance = await getContractInstance(collectionContractABI, collectionAddress);
                    // await collectionContractInstance.methods.ownerOf(data.token_id).call()
                    //   .then((result) => {
                    //     if (result) {
                    //       if(walletAddress.toLowerCase() === result.toLowerCase()) cardItem.isOwner = true;
                    //       cardItem.tokenOwnerAddress = result.toLowerCase()
                    //     }
                    //   })

                    // await NFTContractInstance.methods.otherTokenStatus(collectionAddress, data.token_id).call()
                    //   .then(async (info) => {
                    //     if (info && info.sellPending) {
                    //       cardItem.price = Number(info.price);
                    //       cardItem.isOnSale = true
                    //     }
                    //   })
                    //   .catch((err) => {
                    //   });
                    if (fetchIndexRef.current === fetchIndex) {
                      // if (cardItemsCopy.length < 20) { _setCardItemsToShow([...cardItemsCopy]); showLengthRef.current = cardItemsCopy.length }
                      nftsRef.current = [...cardItemsCopy];
                      setCardItems([...cardItemsCopy])
                      stateRef.current = 'pending'
                    } else {
                      return
                    }
                  } catch (err) {
                    failedIds.push(id)
                  }
                }
              }
            }
            const getItemMetaData = async (data) => {
              try {
                let cardItem = {};
                const collectionInfo = getCollectionWithAddress(data.token_address)
                if (!collectionInfo) return
                let tokenURI = '';
                let ipfsPrefix = getIPFSPrefix(data.token_address);

                let uri = data.token_uri
                if (!isIpfs(data.token_uri)) {
                  const collectionContractInstance = await getContractInstance(collectionContractABI, data.token_address);
                  await collectionContractInstance.methods.tokenURI(data.token_id).call()
                    .then((result) => {
                      if (result && result !== '') {
                        uri = result
                      }
                    })
                    .catch(() => {})
                }
                const p = uri.indexOf('?')
                
                if (p !== -1) uri = uri.slice(0, p)
                const ipfsSufix = getIPFSSufix(uri);
                if (!isIpfs(uri) || isBase64(uri)) {
                  tokenURI = uri
                } else if (ipfsSufix === 'url') {
                  if (uri.includes('ipfs') && uri.includes('Qm') ) {
                    let p = uri.indexOf("Qm");
                    let locationQm = ""
                    if (p !== -1) locationQm = uri.substring(p)
                    tokenURI = 'https://operahouse.mypinata.cloud/ipfs/' + locationQm
                  } else {
                    tokenURI = uri
                  }
                } else {
                  let involveId = isIdInURI(uri);
                  let p = uri.indexOf("Qm");
                  let locationQm = ""
                  if (p !== -1) locationQm = uri.substring(p)
                  tokenURI = getTokenURI(data.token_id, ipfsPrefix, ipfsSufix, involveId, locationQm);
                }
                const response = await fetch(tokenURI);
                const metadata = await response.json();
                cardItem.collectionAddress = data.token_address;
                cardItem.id = data.token_id;
                cardItem.likes = 0;
                cardItem.avatarImg = '1';
                cardItem.assetURI = getImageURI(metadata.image);
                cardItem.assetType = getAssetType(metadata.image)
                cardItem.title = metadata.name;
                cardItem.category = collectionInfo.category
                cardItem.price = 0;
                cardItem.stock = 6;
                cardItem.isOwner = true;
                cardItem.isOnSale = false;
                cardItemsCopy.push(cardItem);
                cardItem.tokenOwnerAddress = walletAddress.toLowerCase()
                    // let collectionContractInstance = await getContractInstance(collectionContractABI, collectionAddress);
                    // await collectionContractInstance.methods.ownerOf(data.token_id).call()
                    //   .then((result) => {
                    //     if (result) {
                    //       if(walletAddress.toLowerCase() === result.toLowerCase()) cardItem.isOwner = true;
                    //       cardItem.tokenOwnerAddress = result.toLowerCase()
                    //     }
                    //   })

                await NFTContractInstance.methods.otherTokenStatus(data.token_address, data.token_id).call()
                  .then(async (info) => {
                    if (info && info.sellPending) {
                      cardItem.price = Number(info.price);
                      cardItem.isOnSale = true
                    }
                  })
                  .catch((err) => {
                  });
                  if (fetchIndexRef.current === fetchIndex) {
                    // if (cardItemsCopy.length < 20) { _setCardItemsToShow([...cardItemsCopy]); showLengthRef.current = cardItemsCopy.length }
                    // nftsRef.current = [...cardItemsCopy];
                    // setCardItems([...cardItemsCopy])
                    setUpdateItem({...cardItem})
                    stateRef.current = 'pending'
                  } else {
                    return
                  }
                } catch (err) {
                  console.log(err)
                }
            }
            const options = { address: walletAddress, chain: "0xfa" }
            const { result , total } = await Web3Api.account.getNFTs(options)
            if (total > 0) {
              const collectionAddresses = getCollectionAddresses()
              const nfts = result.filter((item) => {
                if (item && item.token_address) {
                  if (collectionAddresses.includes(item.token_address.toLowerCase())) return true
                }
                return false
              })
              const items = nfts.map(({ token_uri, token_id, token_address }) => ({ id: token_id, isOnSale: false, price: 0, collectionAddress: token_address }));
              setCardItems([...cardItemsCopy, ...items])
              for (let index = 0; index < nfts.length; index++) {
                const element = nfts[index];
                await getItemMetaData(element)
              }
            }
            stateRef.current = 'resolved'
          } else if(isMarketplace) {
            var uriInfoCopy = [];
            for(let i = 0; i < networkCollections["0xfa"].length; i++) {
              let uriInfoOfCollection = {};
              let collectionAddress = networkCollections["0xfa"][i].address;
              let ipfsPrefix = getIPFSPrefix(collectionAddress);
              uriInfoOfCollection.ipfsPrefix = ipfsPrefix;
              uriInfoCopy.push(uriInfoOfCollection);
            }
            if (fetchIndexRef.current === fetchIndex) {
              setUriInfo(uriInfoCopy);
            } else {
              return
            }
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

            const getOtherCollectionItemForSale = (id) => {
              return NFTContractInstance.methods.onSaleArray(id).call()
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

                  await collectionContractInstance.methods.ownerOf(result.id).call()
                  .then((result) => {
                    if (result) {
                      if(walletAddress && result && walletAddress.toLowerCase() === result.toLowerCase()) cardItem.isOwner = true;
                      cardItem.tokenOwnerAddress = result.toLowerCase()
                    }
                  })

                  if (isBurned(cardItem.tokenOwnerAddress)) return null

                  let uri = await collectionContractInstance.methods.tokenURI(result.id).call()
                  .then(async (uri) => {
                    ipfsSufix = getIPFSSufix(uri);
                    involveId = isIdInURI(uri);
                    let p = uri.indexOf("Qm");
                    if (p !== -1) locationQm = uri.substring(p)
                    return uri
                  })
                  .catch((err) => {
                    console.log(err);
                  });
                  const p = uri.indexOf('?')
                  if (p !== -1) uri = uri.slice(0, p)

                  let tokenURI = ''
                  if (!isIpfs(uri) || isBase64(uri)) {
                    tokenURI = uri
                  } else if (ipfsSufix === 'url') {
                    if (uri.includes('Qm') ) {
                      let p = uri.indexOf("Qm");
                      let locationQm = ""
                      if (p !== -1) locationQm = uri.substring(p)
                      tokenURI = 'https://operahouse.mypinata.cloud/ipfs/' + locationQm
                    } else {
                      tokenURI = uri
                    }
                  } else {
                    tokenURI = getTokenURI(result.id, info.ipfsPrefix, ipfsSufix, involveId, locationQm);
                  }
                  // console.log("tokenURI", tokenURI);
                  let response = await fetch(tokenURI);
                  let metadata = await response.json();

                  const collectionInfo = networkCollections['0xfa'].find(({ address }) => address.toLowerCase() === result.collectionAddress.toLowerCase())
                  // console.log("metadata", metadata);
                  cardItem.collectionAddress = result.collectionAddress;
                  cardItem.id = result.id;
                  cardItem.likes = 0;
                  cardItem.avatarImg = '1';
                  cardItem.assetURI = getImageURI(metadata.image);
                  cardItem.assetType = getAssetType(metadata.image)
                  cardItem.title = metadata.name;
                  if (collectionInfo) cardItem.category = collectionInfo.category
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
                    cardItem.price = Number(info.price);
                  })
                  .catch((err) => {
                  });

                  cardItemsCopy.push(cardItem);
                  if (fetchIndexRef.current === fetchIndex) {
                    if (cardItemsCopy.length < 20) { _setCardItemsToShow([...cardItemsCopy]); showLengthRef.current = cardItemsCopy.length }
                    nftsRef.current = cardItemsCopy
                    setCardItems(cardItemsCopy)
                  } else {
                    return
                  }
                }
              })
              .catch((err) => {
                console.log(err);
              });
            }

            const promises = []
            for(let index = 0; index < onSaleArrayLength; index++) {
              promises.push(getOtherCollectionItemForSale(index))
            }

            await Promise.all(promises)
            stateRef.current = 'resolved'
          }
        }
      } catch (err) {
        console.log(err.message)
      }
    }
    if (isInitialized) {
      if (web3EnableError) {
        fetchIndexRef.current ++
        fetchData(fetchIndexRef.current)
      } else {
        if (isWeb3Enabled) {
          if (auth) {
            const { state } = auth
            if (state === 'logging_out' || state === 'error' || state === 'unauthenticated' || state === 'authenticated') {
              fetchIndexRef.current ++
              fetchData(fetchIndexRef.current)
            }
          }
        }
      }
    }
  }, [isInitialized, web3EnableError, isWeb3Enabled, auth, walletAddress])

  useEffect(() => {
    if (cardItems && cardItems.length) {
      const { name, isOnSale, category, minPrice, maxPrice, rarity } = filterOptions;
      let newItems = cardItems
      if ((!name || name === '') && (!category || category === '') && !isOnSale && (!minPrice || minPrice === '') && (!maxPrice || maxPrice === '') && (!rarity || rarity === '') && (!traitFilterOptions)) {
        setFilteredCardItems(cardItems)
      } else {
        if (name && name !== '') {
          newItems = newItems.filter(({ title }) => title.toLowerCase().includes(name))

        }
        if (category && category !== '') {
          newItems = newItems.filter((item) => (item.category && item.category === category))
        }
        if (isOnSale) {
          newItems = newItems.filter(({ isOnSale }) => isOnSale)
        }
        if (minPrice && minPrice !== '') {
          newItems = newItems.filter(({ price }) => (price && Number(price)/ 1000000000000000000 >= Number(minPrice)))
        }
        if (maxPrice && maxPrice !== '') {
          newItems = newItems.filter(({ price }) => (price && Number(price)/ 1000000000000000000 <= Number(maxPrice)))
        }
        if (rarity && rarity !== '') {
          const [minRarity, maxRarity] = rarity.split(',')
          newItems = newItems.filter(({ rarityScore }) => (rarityScore && (rarityScore >= Number(minRarity)) && (rarityScore < Number(maxRarity))))
        }
        if (traitFilterOptions) {
          newItems = newItems.filter(({ attributes }) => {
            if (!attributes) return false
            let result = true
            traitFilterOptions.forEach(({ type, value }) => {
              const attr = attributes.find((item) => {
                if (item && item.trait_type === type && item.value === value) return true
                return false
              })
              if (!attr) {
                result = false
                return result
              }
            })
            return result
          })
        }
        setFilteredCardItems(newItems)
      }
    } else {
      setFilteredCardItems([])
    }
  }, [cardItems, filterOptions, traitFilterOptions])

  useEffect(() => {
    if (showLengthRef.current) {
      const newItems = filteredCardItems.slice(0, showLengthRef.current)
      _setCardItemsToShow(newItems)
    } else {
      _setCardItemsToShow([])
    }
  }, [filteredCardItems])

  useEffect(() => {
    if (moreItems && moreItems.length > 0) {
      setCardItems([...cardItems, ...moreItems])
    }
  }, [moreItems])

  useEffect(() => {
    if (loadEvent) {
      setLoadEvent(false)
      fetchItemsToShow()
    }
  }, [loadEvent])

  useEffect(() => {
    if (updateItem && cardItems) {
      const itemToUpdate = cardItems.find((item) => (item.id === updateItem.id && item.collectionAddress === updateItem.collectionAddress))
      if (itemToUpdate) {
        const newItems = cardItems.map((item) => {
          if (item.id === updateItem.id && item.collectionAddress === updateItem.collectionAddress) {
            return { ...item, ...updateItem }
          } else {
            return item
          }
        })
        setCardItems(newItems)
      }
    }
  }, [updateItem])

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
                <Image src={collectionInfo.collectionBanner}  height="100%" width="100%" alt="Banner Load Error" className="collection-banner"/>
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
                  <div style={{marginLeft: "0px", marginRight: "0px", fontSize: "12pt"}}>
                    <a href={collectionInfo.website} target="_blank" className="website-btn" target="_blank" style={{marginLeft: "0px", marginRight: "5px"}}><i className="ri-home-fill" /></a>
                    <a href={"https://twitter.com/" + collectionInfo.twitter} className="twitter-btn" target="_blank" style={{marginLeft: "5px", marginRight: "5px"}}><i className="ri-twitter-fill" /></a>
                    <a href={"https://discord.gg/" + collectionInfo.discord} className="discord-btn" target="_blank" style={{marginLeft: "5px", marginRight: "5px"}}><i className="ri-discord-fill" /></a>
                    <a href={"https://ftmscan.com/token/" + collectionInfo.address} className="website-btn" target="_blank" style={{marginLeft: "5px", marginRight: "5px"}}><i className="ri-earth-fill" /></a>
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
              &nbsp;<b>Average Price:</b> {Number(collectionInfo.totalSales) !== 0 ? collectionInfo.totalVolume / collectionInfo.totalSales / Math.pow(10, 18): 0} FTM &nbsp;|&nbsp;
              &nbsp;<b>Price Floor:</b> {collectionInfo.floor / Math.pow(10, 18)} FTM &nbsp;|&nbsp;
              &nbsp;<b>Last Sold For:</b> {collectionInfo.lastSale / Math.pow(10, 18)} FTM &nbsp;|&nbsp;
              &nbsp;<b>Last Sold:</b> {collectionInfo.lastSold}
              <br />
            </div>

          )}
          <div style={{display: 'inline-flex', flexWrap: 'nowrap'}}>
          <Filter
            options={filterOptions}
            setOptions={(options) => setFilterOptions(options)}
            isCollection={(collectionAddress && collectionAddress !== 'profile')}
            isMarketplace={(!collectionAddress)}
            showRarity={showRarity}
          />
          {traits && <AttributeFilter traits={traits} filterOptions={traitFilterOptions} setFilterOptions={setTraitFilterOptions}/>}
          </div>
          <InfiniteScroll
            dataLength={_cardItemsToShow.length}
            next={fetchItemsToShow}
            hasMore={true}
            className="row mb-50_reset mx-auto text-center"
          >
          {_cardItemsToShow.map((cardItem, i) => (
            <div className="col-xl-3 col-lg-4 col-md-6 col-sm-12" key={cardItem.id}>
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
                      <Image
                        src={cardItem.assetURI}
                        alt="This NFT has no image."
                        placeholderImg="/img/logos/loading.gif"
                      />
                    )}
                    {cardItem.assetType === 'other' && (
                      <Image
                        src={cardItem.assetURI}
                        placeholderImg="/img/logos/loading.gif"
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
                        {cardItem.price !== 0 && (
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
          </InfiniteScroll>
      </div>
    </div>
  );
}

export default React.memo(CardMarketplace);
