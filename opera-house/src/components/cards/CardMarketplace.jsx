import React, { useState, useRef, useEffect, useContext, useCallback } from 'react';
import {Link, useHistory} from 'react-router-dom';
import { useQuery } from 'react-query'
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';
import InfiniteScroll from 'react-infinite-scroll-component'
import {
  NFTContractABI, collectionContractABI, marketplaceABI, ERC20ABI, ERC1155ABI
} from '../../constant/contractABI';
import NFTContext from '../../context/NFTContext';
import { config } from "../../constant/config"
import { networkCollections } from "../../constant/collections"
import { useMoralisWeb3Api, useMoralis } from 'react-moralis';
import Web3 from 'web3'
import "@google/model-viewer";
import Image from '../custom/Image';
import Filter from '../custom/Filter';
import AttributeFilter from '../custom/AttributeFilter';
import { ignoreNFT } from '../../constant/ignore';
import ModelLoader from '../custom/ModelLoader';
import CardItem from './CardCollectionItem';
import { getListItemDetail, getMarketplaceListItems } from '../../apis/marketplace';
import { getItemData, getItemsData } from '../../apis/nft';
import { toast, ToastContainer } from 'react-toastify';
const defaultCollectionAddress = config.contractAddress;
const marketplaceAddress = config.marketplaceAddress;
const address0 = "0x0000000000000000000000000000000000000000";
const wFTMAddress = '0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83'

const sleep = (timeToSleep) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve()
    }, timeToSleep)
  })
}

const isIpfs = (uri) => {
  if (uri && (uri.includes('/ipfs/') || uri.includes('ipfs://'))) {
    return true
  } else {
    return false
  }
}
const isBurned = (address) => {
  if (address && (address.toLowerCase() === '0x0000000000000000000000000000000000000001' || address.toLowerCase() === '0x000000000000000000000000000000000000dead')) return true
  else return false
}

function isBase64(str) {
  if (str ==='' || str.trim() ===''){ return false; }
  try {
      return btoa(atob(str)) === str;
  } catch (err) {
      return false;
  }
}

const getIPFSSufix = (uri) => {
  const substr = uri.substring(uri.length - 4)
  if(substr === "json") return "json";
  if (uri.includes('http')) return 'url'
  return "";
}

const getImageURI = (uri) => {
  if (isBase64(uri)) return uri
  if (isIpfs(uri)) {
    let ipfsPos = uri.lastIndexOf('ipfs')
    let subUri = uri.substring(ipfsPos + 4)
    while (subUri && subUri.length > 0) {
      const firstCharacter = subUri[0]
      if (!firstCharacter.match(/[a-z]/i)) subUri = subUri.substring(1)
      else break
    }
    return "https://operahouse.mypinata.cloud/ipfs/" + subUri.replaceAll('#', '%23')
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
          if (ipfsPrefix[ipfsPrefix.length - 1] === '/') {
            return ipfsPrefix + name;
          } else {
            return ipfsPrefix + '/' + name;
          }
        } else {
          return "https://operahouse.mypinata.cloud/ipfs/" + locationQm;
        }
      } else if (!ipfsPrefix || ipfsPrefix === '') {
        if (locationQm && locationQm.length > 0 && locationQm[0] === '/') {
          return "https://operahouse.mypinata.cloud/ipfs" + locationQm;
        } else {
          return "https://operahouse.mypinata.cloud/ipfs/" + locationQm;
        }
      } else {
        if ((locationQm && locationQm.length > 0 && locationQm[0] === '/') || (ipfsPrefix && ipfsPrefix.length > 0 && ipfsPrefix[ipfsPrefix.length - 1] === '/')) {
          return ipfsPrefix + locationQm;
        } else {
          return ipfsPrefix + '/' + locationQm;
        }
      }
    } else {
      if (ipfsSufix !== 'url')
        return ipfsPrefix + id + ipfsSufix;
      else return ipfsPrefix + id
    }
  } else{
    if (locationQm && locationQm.length > 0 && locationQm[0] === '/') {
      return "https://operahouse.mypinata.cloud/ipfs" + locationQm;
    } else {
      return "https://operahouse.mypinata.cloud/ipfs/" + locationQm;
    }
  }
}

const getAssetType = (url) => {
  if (url) {
    let uri = url
    const p = uri.indexOf('?')
    if (p !== -1) {
      const subStr = uri.slice(p, uri.length)
      if (!subStr.includes('?index='))
        uri = uri.slice(0, p)
    }
    if(uri.indexOf(".mp4") !== -1) return "video";
    if(uri.indexOf(".m4v") !== -1) return "video";
    if(uri.indexOf(".avi") !== -1) return "video";
    if(uri.indexOf(".mp3") !== -1) return "video";
    if(uri.indexOf(".png") !== -1) return "image";
    if(uri.indexOf(".jpeg") !== -1) return "image";
    if(uri.indexOf(".jpg") !== -1) return "image";
    if(uri.indexOf("image") !== -1) return "image";
    if(uri.indexOf(".gif") !== -1) return "image";
    if(uri.indexOf(".glb") !== -1) return "glb";
    return new Promise((resolve, reject) => {
      var xhr = new XMLHttpRequest();
      xhr.open('HEAD', uri, true);
      xhr.onload = function() {
        var contentType = xhr.getResponseHeader('Content-Type');
        if (contentType.match('video.*')) resolve('video')
        else if (contentType.match('image.*')) resolve('image')
        else resolve('other')
      };
      xhr.onerror = function(err) {
        console.log(err)
        resolve('other')
      }
      xhr.send();
    })
  } else {
    return 'other'
  }
}

function CardMarketplace(props) {
  const history = useHistory();
  const [cardItems, setCardItems] = React.useState([]);
  const [filteredCardItems, setFilteredCardItems] = React.useState([]);
  const [filterOptions, setFilterOptions] = React.useState({
    name: '',
    sort: '',
    isOnSale: false,
    category: '',
    collection: null,
    minPrice: null,
    maxPrice: null,
    rarity: null
  })
  const [collections, setCollections] = useState()
  const [traitFilterOptions, setTraitFilterOptions] = useState()
  const [showRarity, setShowRarity] = useState(false)
  const [loadEvent, setLoadEvent] = useState(false)
  const [_cardItemsToShow, _setCardItemsToShow] = React.useState([])
  const [updateItem, setUpdateItem] = React.useState()
  const [moreItems, setMoreItems] = React.useState()
  const [likes, setLikes] = useState()
  const nftsRef = React.useRef([]);
  const stateRef = React.useRef('idle');
  const fetchIndexRef = React.useRef(0)
  const showLengthRef = React.useRef(20)
  const { isInitialized, Moralis, user, isAuthenticated, web3, enableWeb3, isWeb3Enabled, isWeb3EnableLoading, chainId, web3EnableError, auth } = useMoralis();
  const { walletAddress, collections: allCollections } = useContext(NFTContext)

  const { data, isLoading, error } = useQuery('marketplaceListItems', getMarketplaceListItems, {
    retry: true,
    retryDelay: 1000,
  })

  const networkError = (!walletAddress)

  const getCollectionOwner = useCallback((collectionAddress) => {
    for(let i = 0; i < allCollections.length; i++) {
      if(allCollections[i].address && allCollections[i].address.toLowerCase() === collectionAddress.toLowerCase())
        return allCollections[i].collecionOwner.toLowerCase();
    }
    return "";
  }, [allCollections])
  
  const getRoyalty = useCallback((collectionAddress) => {
    for(let i = 0; i < allCollections.length; i++) {
      if(allCollections[i].address.toLowerCase() === collectionAddress.toLowerCase())
        return allCollections[i].royalty;
    }
    return "";
  }, [allCollections])
  
  const getCollectionWithAddress = useCallback((address) => {
    for(let i = 0; i < allCollections.length; i++) {
      if(allCollections[i].address.toLowerCase() === address.toLowerCase()){
        return allCollections[i];
      }
    }
    return null;
  }, [allCollections])
  
  const getCollectionAddressWithName = useCallback((name) => {
    for(let i = 0; i < allCollections.length; i++) {
      if(allCollections[i].name.replaceAll(' ', '').toLowerCase() === name.replaceAll(' ', '').toLowerCase()){
        return allCollections[i].address;
      }
    }
    return null;
  }, [allCollections])
  
  const getContractInstance = React.useCallback((contractABI, contractAddress) => {
    if (isWeb3Enabled && web3) {
        let contract = new web3.eth.Contract(contractABI, contractAddress);
        return contract;
    }
    else {
      const web3 = new Web3(new Web3.providers.HttpProvider('https://rpc.ftm.tools/'));
      const contract = new web3.eth.Contract(contractABI, contractAddress);
      return contract;
    }
  }, [isWeb3Enabled, web3])

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
  const handleTransfer = React.useCallback(async (e, collectionAddress, tokenId, to, contractType = 1, amount = 1) => {
    setUpdateItem({ id: tokenId, collectionAddress, pending: true })
    try {
      
      e.preventDefault();
      setUpdateItem({ collectionAddress, id: tokenId, pending: true })
      if (contractType === 1) {
        const collectionContractInstance = getContractInstance(collectionContractABI, collectionAddress);
        await collectionContractInstance.methods.safeTransferFrom(walletAddress, to, tokenId).send({ from: walletAddress });
      } else {
        const collectionContractInstance = getContractInstance(ERC1155ABI, collectionAddress);
        await collectionContractInstance.methods.safeTransferFrom(walletAddress, to, tokenId, amount, []).send({ from: walletAddress });
      }
      setTimeout(() => {
        history.go(0);
      }, 10000);
    } catch (err) {
      console.log(err)
    }
    setUpdateItem({ id: tokenId, collectionAddress, pending: false })
  }, [getContractInstance, walletAddress, history])


  const handleBuyToken = React.useCallback(async (item, buyPaymentToken, buyTokenAmount, amount = 1) => {
    if (item.isNew) {
      const { id, collectionAddress, contractType, paymentToken, price } = item
      setUpdateItem({ id, collectionAddress, pending: true, isNew: true })
      try {
      // remove from new marketplace
        const marketplaceInstance = getContractInstance(marketplaceABI, marketplaceAddress)
        let buyFunc = null
        let result = false
        if (buyPaymentToken?.address === address0 && paymentToken === address0) {
          if (contractType !== 2) {
            buyFunc = marketplaceInstance.methods.buyTokenWithETH(collectionAddress, id, 1)
          } else {
            buyFunc = marketplaceInstance.methods.buyTokenWithETH(collectionAddress, id, amount)
          }
          const estimateResult = await buyFunc.estimateGas(
            {
                from: walletAddress,
                value: price
            }
          )
          .then(() => true)
          .catch((err) => {
            toast.error(err?.message)
            return false
          })
          if (estimateResult) {
            result = await buyFunc.send({ from: walletAddress, value: price }).then(() => true).catch((err) => {
              if (!err?.message?.includes('User denied')) toast.error('Network error')
              return false
            })
          }
        } else {
          const fromToken = buyPaymentToken?.address === address0 ? wFTMAddress : buyPaymentToken?.address
          const erc20Instance = getContractInstance(ERC20ABI, fromToken)
          const balance = await erc20Instance.methods.balanceOf(walletAddress).call().catch((err) => {
            toast.error(`Cannot not get balance because of network error`)
            return 0
          })
          if (Number(balance >= Number(buyTokenAmount))) {
            if (contractType !== 2) {
              buyFunc = marketplaceInstance.methods.buyTokenWithTokens(collectionAddress, id, 1, fromToken, buyTokenAmount)
            } else {
              buyFunc = marketplaceInstance.methods.buyTokenWithTokens(collectionAddress, id, amount, fromToken, buyTokenAmount)
            }
            const estimateResult = await buyFunc.estimateGas(
              {
                  from: walletAddress,
              }
            )
            .then(() => true)
            .catch((err) => {
              toast.error(err?.message)
              return false
            })
            if (estimateResult) {
              result = await buyFunc.send({ from: walletAddress }).then(() => true).catch((err) => {
                if (!err?.message?.includes('User denied')) toast.error('Network error')
                return false
              })
            }
          } else {
            toast.error(`You don't have enough ${buyPaymentToken.symbol} balance`)
          }
        }
        if (result) {
          while (true) {
            let loopState = false
            await sleep(2000)
            await getListItemDetail(collectionAddress, id)
              .then((res) => {
                if (res && res.listItems && res.listItems.length === 0) {
                  const newItem = { ...item, isOnSale: false, isNew: true }
                  setUpdateItem(newItem)
                  loopState = true
                }
              })
            .catch((err) => {
                console.log('get Metadata err');
            });
            if (loopState) return
          }
        }
      } catch (err) {
        console.log(err)
      }
      setUpdateItem({ id, collectionAddress, pending: false, isNew: true })
    } else {
      const NFTContractInstance = getContractInstance(NFTContractABI, defaultCollectionAddress);
      const { id, collectionAddress } = item
      setUpdateItem({ id, collectionAddress, pending: true })
      if(item.collectionAddress.toLowerCase() === defaultCollectionAddress.toLowerCase()) {   //default collection NFT buy
        // eslint-disable-next-line no-undef
        let value = BigInt(item.price).toString();
        try{
          await NFTContractInstance.methods.transfer(item.tokenOwnerAddress, item.id).send({ from: walletAddress, value: value })
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
            });
            if (loopState) break
          }
        } catch(err) {
        }
      } else {    //other collection NFT buy
        let value = 0;

        await NFTContractInstance.methods.otherTokenStatus(item.collectionAddress, item.id).call()
        .then((result) => {
          // eslint-disable-next-line no-undef
          value = BigInt(result.price).toString();
        })
        .catch((err) => {
        });

        if(value !== 0) {
          let collectionOwner = getCollectionOwner(item.collectionAddress);
          let Royalty = getRoyalty(item.collectionAddress) * 1000;
          try{
            await NFTContractInstance.methods.transferOther(item.tokenOwnerAddress, item.collectionAddress, item.id, collectionOwner, Royalty).send({ from: walletAddress, value: value });
            const collectionContractInstance = getContractInstance(collectionContractABI, item.collectionAddress);
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
      setUpdateItem({ id, collectionAddress, pending: false })
    }
  }, [getContractInstance, walletAddress, getCollectionOwner, getRoyalty])

  const handleSetSellPending = React.useCallback(async (cardItem, sellPrice) => {
  }, [])

  const handleRemoveSellPendingOther = React.useCallback(async (item) => {
    const { id, collectionAddress } = item
    setUpdateItem({ id, collectionAddress, pending: true })
    const NFTContractInstance = getContractInstance(NFTContractABI, defaultCollectionAddress);
    try{
      await NFTContractInstance.methods.removeSellPendingOther(item.collectionAddress, item.id, walletAddress).send({ from: walletAddress });
      while (true) {
        let loopState = false
        await sleep(3000)
        await NFTContractInstance.methods.otherTokenStatus(item.collectionAddress, item.id).call()
          .then((result) => {
            if (!result.sellPending) {
              loopState = true
              const newItem = { ...item, isOnSale: false, price: 0 }
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
    setUpdateItem({ id, collectionAddress, pending: false })
  }, [getContractInstance, walletAddress])

  const handleRemoveSellPending = React.useCallback(async (item) => {
    if (item.isNew) {
      const { id, collectionAddress } = item
      setUpdateItem({ id, collectionAddress, pending: true, isNew: true })
      try {
      // remove from new marketplace
        const marketplaceInstance = getContractInstance(marketplaceABI, marketplaceAddress)

        const delistFunc = marketplaceInstance.methods.delistToken(collectionAddress, id, 1)
        const estimateResult = await delistFunc.estimateGas(
          {
              from: walletAddress,
          }
        )
        .then(() => true)
        .catch((err) => false)

        if (estimateResult) {
          const result = await delistFunc.send({ from: walletAddress })
          .then(() => true)
          .catch(() => false)
          if (result) {
            while (true) {
              let loopState = false
              await sleep(3000)
              await getListItemDetail(collectionAddress, id)
              .then((res) => {
                if (res && res.listItems && res.listItems.length === 0) {
                  const newItem = { ...item, isOnSale: false, isNew: true }
                  setUpdateItem(newItem)
                  loopState = true
                }
              })
              .catch((err) => {
                  console.log('get Metadata err');
              });
              if (loopState) break
            }
          }
        }
      } catch (err) {
        console.log(err)
      }
      setUpdateItem({ id, collectionAddress, pending: false, isNew: true  })
    } else {
      if(item.collectionAddress.toLowerCase() !== defaultCollectionAddress.toLowerCase()) {
        handleRemoveSellPendingOther(item);
        return;
      }
      const NFTContractInstance = getContractInstance(NFTContractABI, item.collectionAddress);
      const { id, collectionAddress } = item
      setUpdateItem({ id, collectionAddress, pending: true })
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
      setUpdateItem({ id, collectionAddress, pending: false })
    }
  }, [getContractInstance, walletAddress, handleRemoveSellPendingOther])

  const handleUpdateList = React.useCallback(async (item, priceToUpdate, dayToUpdate, paymentTokenItem) => {
    const { id, collectionAddress, listType } = item
    setUpdateItem({ id, collectionAddress, pending: true, isNew: true })
    try {
    // remove from new marketplace
      const marketplaceInstance = getContractInstance(marketplaceABI, marketplaceAddress)
      // eslint-disable-next-line no-undef
      let price = BigInt(Number(priceToUpdate) * Math.pow(10, paymentTokenItem.decimals)).toString()
      let date = Date.now()
      date += Number((!dayToUpdate || dayToUpdate ==='') ? 1 : Number(dayToUpdate)) * 8.64e+7 ;
      date = Math.round(date/1000)

      const delistFunc = marketplaceInstance.methods.updateListedToken(collectionAddress, id, price, 1, paymentTokenItem.address, listType, date)
      const estimateResult = await delistFunc.estimateGas(
        {
            from: walletAddress,
        }
      )
      .then(() => true)
      .catch((err) => false)

      if (estimateResult) {
        const result = await delistFunc.send({ from: walletAddress })
        .then(() => true)
        .catch(() => false)
        if (result) {
          while (true) {
            let loopState = false
            await sleep(3000)
            await getListItemDetail(collectionAddress, id)
            .then((res) => {
              if (res && res.listItems && res.listItems.length) {
                const { price, expireTimestamp } = res.listItems[0]
                if (Number(date) === Number(expireTimestamp)) {
                  const newItem = { ...item, isOnSale: true, isNew: true, price, expireTimestamp }
                  setUpdateItem(newItem)
                  loopState = true
                }
              }
            })
            .catch((err) => {
                console.log('get Metadata err');
            });
            if (loopState) break
          }
        }
      }
      setUpdateItem({ id, collectionAddress, pending: false })
    } catch(err) {
      console.log(err);
    }
  }, [getContractInstance, walletAddress])

  const fetchData = React.useCallback(async (fetchIndex) => {
    if (chainId && Number(chainId) !== 0xfa) return setCardItems([])
    try {
        if (fetchIndexRef.current !== fetchIndex) {
          return
        }
        let totalTokenCount = 0;
        const NFTContractInstance = getContractInstance(NFTContractABI, defaultCollectionAddress);
        let failedItems = []
        while (true) {
          const result = await NFTContractInstance.methods.totalTokenCount().call()
            .catch((err) => {
              return null
            })
          if (result !== null) {
            totalTokenCount = Number(result)
            break
          }
        }
        let cardItemsCopy = [];
        const profileAddress = walletAddress
        const defaultCollectionInfo = getCollectionWithAddress(defaultCollectionAddress)
        const collections = allCollections.map(({ address, name }) => ({ address, name }))
        collections.sort(function (a, b) {
          if (a.name > b.name ) return 1
          else if (a.name < b.name) return -1
          else return 0
        })
        setCollections(collections);
        (async () => {
          let sellable = false
          if (defaultCollectionInfo) {
            sellable = defaultCollectionInfo.sellable
          }
          const getDefaultItem = async (id) => {
            try {
              let isOwner = false
              let tokenOwnerAddress = address0;
              if (!sellable) return null
              if (ignoreNFT.includes(Number(id))) return null
              await NFTContractInstance.methods.ownerOf(id).call()
                // eslint-disable-next-line no-loop-func
                .then((result) => {
                  if (result) {
                    if (walletAddress && result.toLowerCase() === walletAddress.toLowerCase()) isOwner = true
                    tokenOwnerAddress = result.toLowerCase()
                    return true
                  } else return false
                })
              if (isBurned(tokenOwnerAddress)) return null
              const result = await NFTContractInstance.methods.getMetadata(id).call()
              let cardItem = {};
              if(sellable && result.sellPending) {
                cardItem.isOnSale = true
                cardItem.sellable = sellable
              }
              else return null
              cardItem.collectionAddress = defaultCollectionAddress;
              cardItem.id = id;
              cardItem.creater = result.creater;
              cardItem.likes = 0;
              cardItem.avatarImg = '1';
              cardItem.assetURI = getImageURI(result.assetURI);
              cardItem.title = result.title;
              if (defaultCollectionInfo) cardItem.category = defaultCollectionInfo.category
              cardItem.price = sellable ? Number(result.price) : 0
              cardItem.stock = 6;
              cardItem.isOwner = isOwner;
              cardItem.tokenOwnerAddress = tokenOwnerAddress
              if (result.assetType && result.assetType !== '') {
                cardItem.assetType = result.assetType
              } else {
                cardItem.assetType = await getAssetType(cardItem.assetURI)
              }
              setMoreItems([cardItem])
              return { result: true, data: cardItem }
            } catch (err) {
              if (err && err.message && err.message.includes('nonexistent')) return null
              return { result: false, data: id }
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
            const fetchedItems = await Promise.all(promises);
            let nfts = fetchedItems.filter((item) => {
              if (item && item.result && item.data) {
                const { data } = item
                if (ignoreNFT.includes(Number(data.id))) return false
                else return true
              }
              return false
            })
            // nfts = nfts.map(({ data }) => data)
            // nfts.sort(function(a,b){return a.id-b.id});
            if (fetchIndexRef.current === fetchIndex) {
              // setMoreItems(nfts)
              stateRef.current = 'pending'
              failedItems = fetchedItems.filter((item) => (item && !item.result))
            } else {
              return
            }
            startId += 20
          }
          const timeoutHandler = setInterval(async () => {
            if (fetchIndexRef.current === fetchIndex && failedItems && failedItems.length !== 0) {
              const fetchedItems = await Promise.all(failedItems.map((item) => getDefaultItem(item.data)));
              if (fetchedItems.length === 0) {
                clearInterval(timeoutHandler)
                return
              }
              let nfts = fetchedItems.filter((item) => {
                if (item) {
                  const { data } = item
                  if (ignoreNFT.includes(Number(data.id))) return false
                  if(data.isOnSale) {
                    return true
                  }
                }
                return false
              })
              nfts = nfts.map(({ data }) => data)
              nfts.sort(function(a,b){return a.id-b.id});
              setMoreItems(nfts)
              failedItems = fetchedItems.filter((item) => (item && !item.result))
            } else {
              clearInterval(timeoutHandler)
            }
          }, 5000)
        }) ()
        //display other collection NFTs
        let onSaleArrayLength = 0;
        while (true) {
          const result = await NFTContractInstance.methods.getOnSaleArrayLength().call()
            .catch((err) => {
            });
          if (result !== null) {
            onSaleArrayLength = result
            break
          }
          await sleep(100)
        }

        const getOtherCollectionItemForSale = (id) => {
          return NFTContractInstance.methods.onSaleArray(id).call()
          .then(async (result) => {
            if(result.sellPending) {
              let price = 0
              let isOnSale = false
              let seller = null
              const item = await getItemData(result.collectionAddress, result.id)
              const collectionInfo = getCollectionWithAddress(result.collectionAddress)
              if (!collectionInfo || !collectionInfo.sellable) return null
              await NFTContractInstance.methods.otherTokenStatus(result.collectionAddress, result.id).call()
              .then(async (info) => {
                price = Number(info.price);
                isOnSale = true;
                seller = info.tokenOwner
              })
              let collectionContractInstance = getContractInstance(collectionContractABI, result.collectionAddress);
              const tokenOwnerAddress = await collectionContractInstance.methods.ownerOf(result.id).call()
              if (!tokenOwnerAddress || tokenOwnerAddress?.toLowerCase() !== seller?.toLowerCase()) {
                return null
              }

              // cardItemsCopy.push(cardItem);
              if (item && fetchIndexRef.current === fetchIndex && isOnSale && price) {
                // if (cardItemsCopy.length < 20) { _setCardItemsToShow([...cardItemsCopy]); showLengthRef.current = cardItemsCopy.length }
                nftsRef.current = cardItemsCopy
                // setCardItems(cardItemsCopy)
                setMoreItems([{ ...item, id: item.tokenId, isOnSale, price, sellable: true }])
              } else {
                return null
              }
              return { result: true }
            } else {
              return null
            }
          })
          .catch((err) => {
            return { result: false, data: id}
          });
        }

        const promises = []
        for(let index = 0; index < onSaleArrayLength; index++) {
          promises.push(getOtherCollectionItemForSale(index))
        }

        const results = await Promise.all(promises)
        const _failedIds = results.filter((_result) => (_result && !_result.result))
        let failedIds = _failedIds.map(({ data }) => data)
        stateRef.current = 'resolved'
        const timeOutHandler = setInterval(async () => {
          if (fetchIndexRef.current === fetchIndex && failedIds && failedIds.length > 0) {
            const results = await Promise.all(failedIds.map((id) => getOtherCollectionItemForSale(id)))
            const _failedIds = results.filter((_result) => (_result && !_result.result))
            failedIds = _failedIds.map(({ data }) => data)
          } else {
            clearInterval(timeOutHandler)
          }
        }, 5000)
    } catch (err) {
      console.log(err.message)
    }
  }, [chainId, getContractInstance, walletAddress, getCollectionWithAddress, allCollections])
  
  useEffect(() => {
    (async () => {
      if (!isLoading && !error && data && data.listItems && allCollections?.length) {
        const { listItems } = data
        let items = listItems?.map((item) => ({ ...item, id: item.tokenId, collectionAddress: item.nftContract, isOnSale: true }))
        items = items.filter(({ collectionAddress }) => {
          const sellable = getCollectionWithAddress(collectionAddress)?.sellable
          if (!sellable) {
            return false
          }
          return sellable
        })
        const queryData = items.map(({ collectionAddress, id }) => ({ collectionAddress, id }))
        let itemsData = null
        while (true) {
          itemsData = await getItemsData(queryData).catch(() => null)
          if (data) break
          await sleep(500)
        }
        if (itemsData && itemsData.length) {
          let newItems = items.map((item) => {
            const itemData = itemsData.find(({ collectionAddress, tokenId}) => (item.collectionAddress.toLowerCase() === collectionAddress && Number(tokenId) === Number(item.id)))
            if (itemData) {
              return {
                ...itemData,
                ...item,
                isOnSale: true,
                sellable: true,
                isNew: true
              }
            } else return item
          })
          setMoreItems(newItems)
        } else {
          setMoreItems(items)
        } 
      }
    }) ()
  }, [data, isLoading, error, allCollections?.length, getCollectionWithAddress])

  useEffect(() => {
    if (isInitialized && walletAddress) {
      (async () => {
        try {
          const Like = Moralis.Object.extend('LikeNFT')
          const query = new Moralis.Query(Like)
          query.equalTo('address', walletAddress.toLowerCase())
          const response = await query.find()
          const likes = response?.map((like) => ({
            collectionAddress: like.get('token_address'),
            id: like.get('token_id'),
          }))
          setLikes(likes)
        } catch (err) {
          console.log(err)
        }
      }) ()
    }
  }, [Moralis.Object, Moralis.Query, isInitialized, walletAddress])

  // pull NFT data from contract and ipfs
  React.useEffect(() => {
    if (isInitialized && allCollections) {
      if (web3EnableError) {
        fetchIndexRef.current ++
        fetchData(fetchIndexRef.current)
      } else {
        if (isWeb3Enabled && !isWeb3EnableLoading) {
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
  }, [isInitialized, web3EnableError, isWeb3Enabled, auth, walletAddress, isWeb3EnableLoading, allCollections])

  useEffect(() => {
    if (cardItems && cardItems.length) {
      const { name, sort, isOnSale, category, minPrice, maxPrice, rarity, collection } = filterOptions;
      let newItems = [...cardItems]
      if ((!name || name === '') && (!sort || sort === '') && (!category || category === '') && (!collection || collection === '') && !isOnSale && (!minPrice || minPrice === '') && (!maxPrice || maxPrice === '') && (!rarity || rarity === '') && (!traitFilterOptions)) {
        setFilteredCardItems([...cardItems])
      } else {
        if (name && name !== '') {
          newItems = newItems?.filter((item) => {
            let result = item && item?.title?.toLowerCase()?.includes(name.toLowerCase())
            return result
          })
        }
        if (category && category !== '') {
          newItems = newItems?.filter((item) => (item.category && item.category === category))
        }
        if (collection && collection !== '') {
          if (collection === 'none') {
            return setFilteredCardItems([])
          }
          else newItems = newItems?.filter((item) => (item.collectionAddress && collection?.includes(item.collectionAddress.toLowerCase())))
        }
        if (isOnSale) {
          newItems = newItems?.filter(({ isOnSale }) => isOnSale)
        }
        if (minPrice && minPrice !== '') {
          newItems = newItems?.filter(({ price }) => (price && Number(price)/ 1000000000000000000 >= Number(minPrice)))
        }
        if (maxPrice && maxPrice !== '') {
          newItems = newItems?.filter(({ price }) => (price && Number(price)/ 1000000000000000000 <= Number(maxPrice)))
        }
        if (rarity && rarity !== '') {
          const [minRarity, maxRarity] = rarity.split(',')
          newItems = newItems?.filter(({ rarityScore }) => (rarityScore && (rarityScore >= Number(minRarity)) && (rarityScore < Number(maxRarity))))
        }
        if (traitFilterOptions) {
          newItems = newItems?.filter(({ attributes }) => {
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
        if (sort && sort !== '') {
          if (sort === 'A-Z') {
            newItems.sort(function(a, b) {
              if (a.title && b.title) {
                if (a.title > b.title) return 1
                else if (a.title < b.title) return -1
                else return 0
              } else return 0
            })
          } else if (sort === 'Z-A') {
            newItems.sort(function(a, b) {
              if (a.title && b.title) {
                if (a.title < b.title) return 1
                else if (a.title > b.title) return -1
                else return 0
              } else return 0
            })
          } else if (sort === 'high_price') {
            newItems.sort(function(a, b) {
              if (a.price || b.price) {
                if (a.price && !b.price) return -1
                else if (!a.price && b.price) return 1
                else {
                  if (Number(a.price) < Number(b.price)) return 1
                  else if (Number(a.price) > Number(b.price)) return -1
                  else return 0
                }
              } else return 0
            })
          } else if (sort === 'low_price') {
            newItems.sort(function(a, b) {
              if (a.price || b.price) {
                if (a.price && !b.price) return 1
                else if (!a.price && b.price) return -1
                else {
                  if (Number(a.price) < Number(b.price)) return -1
                  else if (Number(a.price) > Number(b.price)) return 1
                  else return 0
                }
              } else return 0
            })
          } else if (sort === 'least_rare') {
            const mapped = newItems.map((v, i) => {
              return { i, value: v.rarityRank? v.rarityRank : 99999999999999 };
            })
            
            // sorting the mapped array containing the reduced values
            mapped.sort((a, b) => {
              if (a.value > b.value) {
                return -1;
              }
              if (a.value < b.value) {
                return 1;
              }
              return 0;
            });
            
            newItems = mapped.map(v => newItems[v.i]);
          } else if (sort === 'most_rare') {
            const mapped = newItems.map((v, i) => {
              return { i, value: v.rarityRank? v.rarityRank : 99999999999999 };
            })
            
            // sorting the mapped array containing the reduced values
            mapped.sort((a, b) => {
              if (a.value > b.value) {
                return 1;
              }
              if (a.value < b.value) {
                return -1;
              }
              return 0;
            });
            
            newItems = mapped.map(v => newItems[v.i]);
          }
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
      const _moreItems = moreItems.filter((item) => {
        if (!cardItems.some(({ id, collectionAddress }) => (item && item.id === id && item.collectionAddress === collectionAddress))) {
          return true
        } else return false
      })
      setCardItems([...cardItems, ..._moreItems])
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
      const itemToUpdate = cardItems.find((item) => (Number(item.id) === Number(updateItem.id) && item.collectionAddress?.toLowerCase() === updateItem.collectionAddress?.toLowerCase()))
      if (itemToUpdate) {
        if (updateItem.isOnSale === false) {
          const newItems = cardItems.filter((item) => (Number(item.id)!==Number(updateItem.id) || item.collectionAddress?.toLowerCase()!==updateItem.collectionAddress?.toLowerCase()))
          setCardItems(newItems)
        } else {
          const newItems = cardItems.map((item) => {
            if (Number(item.id) === Number(updateItem.id) && item.collectionAddress?.toLowerCase() === updateItem.collectionAddress?.toLowerCase()) {
              return { ...item, ...updateItem }
            } else {
              return item
            }
          })
          setCardItems(newItems)
        }
      }
    }
  }, [updateItem])


  return (
    <div className='w-100'>
      <ToastContainer position="top-right" />
      <div className="row mb-50_reset mx-auto text-center">
          <Filter
            options={filterOptions}
            setOptions={(options) => setFilterOptions(options)}
            isCollection={false}
            isMarketplace={(true)}
            showRarity={showRarity}
            collections={collections}
          />
          <InfiniteScroll
            dataLength={_cardItemsToShow.length}
            next={fetchItemsToShow}
            hasMore={true}
            scrollableTarget="root"
            className="row mb-50_reset mx-auto text-center"
          >
          {_cardItemsToShow.map((cardItem, i) => (
            <CardItem
              key={`${cardItem.collectionAddress}-${cardItem.id}`}
              cardItem={cardItem}
              networkError={networkError}
              handleRemoveSellPending={handleRemoveSellPending}
              handleSetSellPending={handleSetSellPending}
              handleTransfer={handleTransfer}
              handleBuyToken={handleBuyToken}
              handleUpdateList={handleUpdateList}
            />
          ))}
          </InfiniteScroll>
      </div>
    </div>
  );
}

export default React.memo(CardMarketplace);
