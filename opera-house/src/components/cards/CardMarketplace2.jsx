import React, { useState, useRef, useEffect } from 'react';
import {Link, useHistory} from 'react-router-dom';
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';
import Web3 from 'web3'
import InfiniteScroll from 'react-infinite-scroll-component'
import detectEthereumProvider from '@metamask/detect-provider'
import {
  NFTContractABI, collectionContractABI
} from '../../constant/contractABI';
import { config } from "../../constant/config"
import { networkCollections } from "../../constant/collections"
import { useMoralisWeb3Api, useMoralis } from 'react-moralis';
import Image from '../custom/Image';
import Filter from '../custom/Filter';
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
const getCollectionInfo = async (collectionAddress) => {
  let NFTContractInstance = await getContractInstance(NFTContractABI, defaultCollectionAddress);
  let info = {};
  for(let i = 0; i < networkCollections["0xfa"].length; i++) {
    if(networkCollections["0xfa"][i].address === collectionAddress)
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
      console.log("floor=-", result);
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
}


const getIndexWithAddress = (address) => {
  for(let i = 0; i < networkCollections["0xfa"].length; i++) {
    if(networkCollections["0xfa"][i].address.toLowerCase() === address.toLowerCase()){
      return i;
    }
  }
  return -1;
}

function CardMarketplace(props) {
  const ref = useRef();
  const history = useHistory();
  const [cardItems, setCardItems] = React.useState([]);
  const [filteredCardItems, setFilteredCardItems] = React.useState([]);
  const [filterOptions, setFilterOptions] = React.useState({
    name: '',
    isOnSale: false,
    category: ''
  })
  const [cardItemsToShow, setCardItemsToShow] = React.useState([])
  const [to, setTo] = React.useState("");
  const [collectionInfo, setCollectionInfo] = React.useState(null);
  const [networkError, setNetworkError] = useState(false);
  const nftsRef = React.useRef([]);
  const stateRef = React.useRef('idle');
  const showLengthRef = React.useRef(20)
  const [totalNFTs, setTotalNFTs] = React.useState(0);
  const [uriInfo, setUriInfo] = React.useState([]);
  const [sellPrice, setSellPrice] = useState(0);
  const { Moralis, isInitialized, ...rest } = useMoralis();
  const Web3Api = useMoralisWeb3Api()

  const closeTooltip = () => ref.current.close();
  const walletAddress = React.useMemo( () => localStorage.getItem("walletAddress"), []);

  // const collectionAddress = config.contractAddress;
  const collectionAddress = props.collectionAddress;

  const fetchItemsToShow = async () => {
    const totalLen = filteredCardItems.length
    const curLen = cardItemsToShow.length
    if (stateRef.current === 'idle' || stateRef.current === 'pending') {
      if (totalLen > curLen) {
        let length = curLen + 20
        if (length > totalLen) length = totalLen
        const newItems = filteredCardItems.slice(0, length)
        setCardItemsToShow(newItems)
        if (length > showLengthRef.current)
          showLengthRef.current = (length + 20) - length %20
        return true
      } else {
        while (true) {
          await sleep(3000)
          if (fetchItemsToShow()) break
        }
        return false
      }
    } else {
      const currentLength = cardItemsToShow.length
      let length = currentLength + 12
      if (length > totalLen) length = totalLen
      const newItems = filteredCardItems.slice(0, length)
      setCardItemsToShow(newItems)
      if (length > showLengthRef.current)
          showLengthRef.current = (length + 20) - length %20
      return true
    }
  }

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

      if(value !== 0) {
        let collectionOwner = getCollectionOwner(item.collectionAddress);
        let Royalty = getRoyalty(item.collectionAddress) * 1000;
        console.log(collectionOwner, Royalty);
        console.log(value, item.tokenOwnerAddress, item.collectionAddress, item.id, collectionOwner, Royalty)
        try{
          let result = await NFTContractInstance.methods.transferOther(item.tokenOwnerAddress, item.collectionAddress, item.id, collectionOwner, Royalty).send({ from: walletAddress, value: value });
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
      handleRemoveSellPendingOther(item);
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
      const currentProvider = await detectEthereumProvider();
      const web3Instance = new Web3(currentProvider);
      let chainId = await web3Instance.eth.getChainId();
      let accounts = await web3Instance.eth.getAccounts();
      if(chainId !== 250 || !accounts.length) {
        setNetworkError(true);
      }
    }
    const fetchData = async () => {
      try {
        let ipfsPrefix = getIPFSPrefix(collectionAddress);
        if(collectionAddress && collectionAddress !== "profile") {  //collection page
          let collectionInfo = await getCollectionInfo(collectionAddress);
          setCollectionInfo(collectionInfo);
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
                    }
                  })

                return cardItem;
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
            setCardItemsToShow(nfts);
            showLengthRef.current = nfts.length
            startId = 50
            while(startId < totalTokenCount) {
              let promises = []
              let endId = startId + 199
              if (endId > totalTokenCount) endId = totalTokenCount
              for(let id = startId; id <= endId; id++) {
                promises.push(getDefaultItem(id))
              }
              let nfts = await Promise.all(promises);
              nfts = nfts.filter(({ id }) => !ignoreNFT.includes(id))
              
              cardItemsCopy = [...cardItemsCopy, ...nfts]
              if (cardItemsCopy.length < 20) { setCardItemsToShow([...cardItemsCopy]); showLengthRef.current = nfts.length }
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

            const fetchMetadata = async (data) => {
              try {
                if (data) {
                  const { token_uri: uri, token_id: id } = data
                  let tokenURI = '';
                  const ipfsSufix = getIPFSSufix(uri);
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
                  let cardItem = {};
                  let metadata = {}
                  try {
                    let response = await fetch(tokenURI);
                    metadata = await response.json();
                  } catch (err) {
                    return null
                  }
                  cardItem.collectionAddress = collectionAddress;
                  cardItem.id = id;
                  cardItem.likes = 0;
                  cardItem.avatarImg = '1';
                  if (metadata.image) {
                    cardItem.assetURI = getImageURI(metadata.image);
                    cardItem.assetType = getAssetType(metadata.image)
                  } else {
                    cardItem.assetURI = ''
                    cardItem.assetType = 'other'
                  }
                  cardItem.title = metadata.name;
                  cardItem.price = 0;
                  cardItem.stock = 6;

                  cardItem.isOwner = false;
                  await collectionContractInstance.methods.ownerOf(id).call()
                    .then((result) => {
                      if (result) {
                        cardItem.tokenOwnerAddress = result.toLowerCase()
                        if(walletAddress && walletAddress.toLowerCase() === result.toLowerCase()) cardItem.isOwner = true;
                      }
                    })
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
            let totalCount = 0
            const optionsFirst = { chain: "0xfa", address: collectionAddress, offset: index, limit: 1 }
            const resultFirst = await Web3Api.token.getAllTokenIds(optionsFirst)
            if (resultFirst && resultFirst.result && resultFirst.result.length > 0) {
              const { total } = resultFirst;
              setTotalNFTs(Number(total));
              totalCount = total
              // setCardItemsToShow(cardItemsCopy)
              // if (cardItemsCopy.length)
              //   showLengthRef.current = cardItemsCopy.length
            }
            index = totalCount - 50
            if (index < 0) index = 0
            const options = { chain: "0xfa", address: collectionAddress, offset: index, limit: 50 }
            const result = await Web3Api.token.getAllTokenIds(options)
            if (result && result.result && result.result.length > 0) {
              const { result: nfts, total } = result;
              setTotalNFTs(Number(total));
              let newNfts = await Promise.all(nfts.map((data) => fetchMetadata(data)));
              newNfts = newNfts.filter((item) => item)
              newNfts.sort(function(a,b){return a.id-b.id});
              // newNfts = newNfts.sort((item1, item2) => {
              //   if (Number(item1.id) > Number(item2.id)) return -1
              //   else if (Number(item1.id) < Number(item2.id)) return 1
              //   else return 0
              // })
              cardItemsCopy = newNfts;
              nftsRef.current = cardItemsCopy
              setCardItems(cardItemsCopy)
              stateRef.current = 'pending'
              // setCardItemsToShow(cardItemsCopy)
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
                  let newNfts = await Promise.all(nfts.map((data) => fetchMetadata(data)));
                  newNfts = newNfts.filter((item) => item)
                  newNfts.sort(function(a,b){return a.id-b.id});
                  cardItemsCopy = [...cardItemsCopy, ...newNfts];
                  // if (cardItemsCopy.length < 20) { setCardItemsToShow([...cardItemsCopy]); showLengthRef.current = cardItemsCopy.length }
                  nftsRef.current = cardItemsCopy
                  setCardItems(cardItemsCopy)
                } else {
                  break;
                }
              } catch (err) {
                console.log('other collection error', err.message)
              }
              index -= 500
            }
            stateRef.current = 'resolved'
          }
        } else {  //profile or marketplace page
          setCardItems([]);
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

          if (isProfile && !walletAddress) return history.push('/connect-wallet')

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
          while(startId < totalTokenCount) {
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
            nftsRef.current = cardItemsCopy
            setCardItems(cardItemsCopy)
            stateRef.current = 'pending'
            if (startId === 1) {
              setCardItemsToShow(cardItemsCopy)
              showLengthRef.current = cardItemsCopy.length
            }
            startId += 20
          }

          //display other collection NFTs
          if(isProfile) {
            const getOtherCollectionItems = async (id) => {
              const collectionInfo = networkCollections["0xfa"][id]
              let collectionAddress = collectionInfo.address;
              let ipfsPrefix = getIPFSPrefix(collectionAddress);
              const options = { chain: "0xfa", address: walletAddress, token_address: collectionAddress};
              const result = await Web3Api.account.getNFTsForContract(options)
              let collectionContractInstance = await getContractInstance(collectionContractABI, collectionAddress);

              if (result && result.total) {
                const { result: nfts, total } = result;
                for (let j = 0; j < total; j++ ) {
                  try {
                    const data = nfts[j]
                    let cardItem = {};
                    let tokenURI = '';
                    const ipfsSufix = getIPFSSufix(data.token_uri);
                    if (!isIpfs(data.token_uri) || isBase64(data.token_uri)) {
                      tokenURI = data.token_uri
                    } else if (ipfsSufix === 'url') {
                      if (data.token_uri.includes('ipfs') && data.token_uri.includes('Qm') ) {
                        let p = data.token_uri.indexOf("Qm");
                        let locationQm = ""
                        if (p !== -1) locationQm = data.token_uri.substring(p)
                        tokenURI = 'https://operahouse.mypinata.cloud/ipfs/' + locationQm
                      } else {
                        tokenURI = data.token_uri
                      }
                    } else {
                      let involveId = isIdInURI(data.token_uri);
                      let p = data.token_uri.indexOf("Qm");
                      let locationQm = ""
                      if (p !== -1) locationQm = data.token_uri.substring(p)
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
                    cardItem.isOnSale = false;
                    await collectionContractInstance.methods.ownerOf(data.token_id).call()
                      .then((result) => {
                        if (result) {
                          if(walletAddress.toLowerCase() === result.toLowerCase()) cardItem.isOwner = true;
                          cardItem.tokenOwnerAddress = result.toLowerCase()
                        }
                      })

                    await NFTContractInstance.methods.otherTokenStatus(collectionAddress, data.token_id).call()
                      .then(async (info) => {
                        if (info && info.sellPending) {
                          cardItem.price = Number(info.price);
                          cardItem.isOnSale = true
                        }
                      })
                      .catch((err) => {
                      });
                    cardItemsCopy.push(cardItem);
                    if (cardItemsCopy.length < 20) { setCardItemsToShow([...cardItemsCopy]); showLengthRef.current = cardItemsCopy.length }
                    nftsRef.current = [...cardItemsCopy];
                    setCardItems([...cardItemsCopy])
                    stateRef.current = 'pending'
                  } catch (err) {

                  }
                }
              }
            }
            const promises = []
            for(let i = 0; i < networkCollections["0xfa"].length; i++) {
              promises.push(getOtherCollectionItems(i))
            }
            await Promise.all(promises);
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
                        if(walletAddress && result && walletAddress.toLowerCase() === result.toLowerCase()) cardItem.isOwner = true;
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
                  if (cardItemsCopy.length < 20) { setCardItemsToShow([...cardItemsCopy]); showLengthRef.current = cardItemsCopy.length }
                  nftsRef.current = cardItemsCopy
                  setCardItems(cardItemsCopy)
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
      fetchNetworkState()
      fetchData()
    }
  }, [isInitialized])

  useEffect(() => {
    if (cardItems && cardItems.length) {
      const { name, isOnSale, category } = filterOptions;
      let newItems = cardItems
      if ((!name || name === '') && (!category || category === '') && !isOnSale) {
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
        setFilteredCardItems(newItems)
      }
    }
  }, [cardItems, filterOptions])

  useEffect(() => {
    if (showLengthRef.current) {
      const newItems = filteredCardItems.slice(0, showLengthRef.current)
      setCardItemsToShow(newItems)
    }
  }, [filteredCardItems])

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
              &nbsp;<b>Average Price:</b> {collectionInfo.totalSales !== 0 ? collectionInfo.totalVolume / collectionInfo.totalSales / Math.pow(10, 18): 0} FTM &nbsp;|&nbsp;
              &nbsp;<b>Price Floor:</b> {collectionInfo.floor / Math.pow(10, 18)} FTM &nbsp;|&nbsp;
              &nbsp;<b>Last Sold For:</b> {collectionInfo.lastSale / Math.pow(10, 18)} FTM &nbsp;|&nbsp;
              &nbsp;<b>Last Sold:</b> {collectionInfo.lastSold}
              <br />
            </div>

          )}
          <Filter options={filterOptions} setOptions={(options) => setFilterOptions(options)}
            isCollection={(!collectionAddress || collectionAddress === 'profile')}
          />
          <InfiniteScroll
            dataLength={cardItemsToShow.length}
            next={fetchItemsToShow}
            hasMore={true}
            className="row mb-50_reset mx-auto text-center"
          >
          {cardItemsToShow.map((cardItem, i) => (
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
