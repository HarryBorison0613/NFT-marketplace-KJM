import React, { useState, useRef, useEffect, useContext, useCallback, useReducer } from 'react';
import {Link, useHistory} from 'react-router-dom';
import { useQuery } from 'react-query'
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';
import InfiniteScroll from 'react-infinite-scroll-component'
import {
  NFTContractABI, collectionContractABI, marketplaceABI, ERC20ABI
} from '../../../constant/contractABI';
import NFTContext from '../../../context/NFTContext';
import { config } from "../../../constant/config"
import { networkCollections } from "../../../constant/collections"
import { useMoralisWeb3Api, useMoralis } from 'react-moralis';
import Web3 from 'web3'
import "@google/model-viewer";
import Image from '../../custom/Image';
import Filter from '../../custom/Filter';
import { ignoreNFT } from '../../../constant/ignore';
import ModelLoader from '../../custom/ModelLoader';
import { getActiveAuctionListItems, getListItemDetail } from '../../../apis/marketplace';
import { toast, ToastContainer } from 'react-toastify';
import CardAuction from '../CardAuction';
import { getItemsData } from '../../../apis/nft';
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

const collectionReducer = (data, action) => {
  switch (action.type) {
    case 'add':
      if (!data.includes(action.data)) {
        return [...data, action.data ]
      } else return data
    case 'set':
      return action.data
    default:
      break;
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
  const [collectionAddresses, collectionAddressesDispatch] = useReducer(collectionReducer ,[])
  const [traitFilterOptions, setTraitFilterOptions] = useState()
  const [showRarity, setShowRarity] = useState(false)
  const [loadEvent, setLoadEvent] = useState(false)
  const [_cardItemsToShow, _setCardItemsToShow] = React.useState([])
  const [updateItem, setUpdateItem] = React.useState()
  const [moreItems, setMoreItems] = React.useState()
  const [likes, setLikes] = useState()
  const [collectionInfo, setCollectionInfo] = React.useState(null);
  const nftsRef = React.useRef([]);
  const stateRef = React.useRef('idle');
  const fetchIndexRef = React.useRef(0)
  const showLengthRef = React.useRef(20)
  const { isInitialized, Moralis, user, isAuthenticated, web3, enableWeb3, isWeb3Enabled, isWeb3EnableLoading, chainId, web3EnableError, auth } = useMoralis();
  const { walletAddress, collections: allCollections } = useContext(NFTContext)

  const { data, isLoading, error } = useQuery('activeAuctionListItems', getActiveAuctionListItems)

  const networkError = (!walletAddress)
  
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

  const handleAcceptBid = useCallback(async (cardItem, highestBid) => {
    try {
      if (!highestBid) {
        toast.error('Do not have highest bidder')
        return
      }
      const { bidder, price } = highestBid
      const { id, collectionAddress, contractType } = cardItem
      const marketplaceInstance = getContractInstance(marketplaceABI, marketplaceAddress)
      let buyFunc = null
      let result = false
      let errorMessage = null
      buyFunc = marketplaceInstance.methods.acceptBid(collectionAddress, contractType, id, bidder, price)
      const estimateResult = await buyFunc.estimateGas(
        {
            from: walletAddress,
        }
      )
      .then(() => true)
      .catch((err) => {
        errorMessage = err.message
        return false
      })
      if (estimateResult) {
        result = await buyFunc.send({ from: walletAddress }).then(() => true).catch(() => false)
      } else {
        if (errorMessage && (errorMessage.includes('Not highest bid') || errorMessage.includes(`Bidder's money is not enough`))) {
          toast.error('Bid is not valid. Please restart auction')
        } else {
          toast.error('Auction is not valid')
        }
      }
      if (result) {
        while (true) {
          let loopState = false
          await sleep(2000)
          await getListItemDetail(collectionAddress, id)
            .then((res) => {
              if (res && res.listItems && res.listItems.length === 0) {
                const newItem = { ...cardItem, isOnSale: false, isNew: true }
                setUpdateItem(newItem)
                loopState = true
              }
            })
            .catch((err) => {
                console.log('get graphql err');
            });
          if (loopState) return
        }
      }
    } catch (err) {
      console.log(err)
    }
  }, [getContractInstance, walletAddress])

  const handleRemoveAuction = React.useCallback(async (item) => {
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
      setUpdateItem({ id, collectionAddress, pending: false })
    } catch(err) {
      console.log(err);
    }
  }, [getContractInstance, walletAddress])

  const handleUpdateAuction = React.useCallback(async (item, priceToUpdate, dayToUpdate, paymentTokenItem) => {
    const { id, collectionAddress } = item
    setUpdateItem({ id, collectionAddress, pending: true, isNew: true })
    try {
    // remove from new marketplace
      const marketplaceInstance = getContractInstance(marketplaceABI, marketplaceAddress)
      // eslint-disable-next-line no-undef
      let price = BigInt(Number(priceToUpdate) * Math.pow(10, paymentTokenItem.decimals)).toString()
      let date = Date.now()
      date += Number((!dayToUpdate || dayToUpdate ==='') ? 1 : Number(dayToUpdate)) * 8.64e+7 ;
      date = Math.round(date/1000)

      const delistFunc = marketplaceInstance.methods.updateListedToken(collectionAddress, id, price, 1, paymentTokenItem.address, false, date)
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

  const getCollectionDetailForNew = useCallback(async (item) => {
    console.log(item)
    const { collectionAddress, id } = item
    const cardItem = { ...item }
    const collectionContractInstance = getContractInstance(collectionContractABI, collectionAddress);
    let ipfsSufix = ''
    let involveId = false
    const collectionInfo = getCollectionWithAddress(collectionAddress)
    if (!collectionInfo || !collectionInfo.sellable) return null
    await collectionContractInstance.methods.ownerOf(id).call()
    .then((result) => {
      if (result) {
        if(walletAddress && result && walletAddress.toLowerCase() === result.toLowerCase()) cardItem.isOwner = true;
        cardItem.tokenOwnerAddress = result.toLowerCase()
      }
    })

    if (isBurned(cardItem.tokenOwnerAddress)) return null
    if (cardItem.seller?.toLowerCase() !== cardItem.tokenOwnerAddress?.toLowerCase()) return null
    if (collectionAddress.toLowerCase() === defaultCollectionAddress.toLocaleLowerCase()) {
      const defaultCollectionInfo = getCollectionWithAddress(defaultCollectionAddress)
      const NFTContractInstance = getContractInstance(NFTContractABI, defaultCollectionAddress);
      let sellable = false
      if (defaultCollectionInfo) {
        sellable = defaultCollectionInfo.sellable
      }
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
      cardItem.sellable = sellable
      cardItem.collectionAddress = defaultCollectionAddress;
      cardItem.id = id;
      cardItem.creater = result.creater;
      cardItem.likes = 0;
      cardItem.avatarImg = '1';
      cardItem.assetURI = getImageURI(result.assetURI);
      cardItem.title = result.title;
      if (defaultCollectionInfo) cardItem.category = defaultCollectionInfo.category
      cardItem.isOwner = isOwner;
      cardItem.tokenOwnerAddress = tokenOwnerAddress
      if (result.assetType && result.assetType !== '') {
        cardItem.assetType = result.assetType
      } else {
        cardItem.assetType = await getAssetType(cardItem.assetURI)
      }
    } else {
      let itemUri = await collectionContractInstance.methods.tokenURI(id).call()
      ipfsSufix = getIPFSSufix(itemUri);
      involveId = isIdInURI(itemUri);

      let uri = itemUri
      let tokenURI = ''
      let p = uri.indexOf('?')
      if (p !== -1) {
        const subStr = uri.slice(p, uri.length)
        if (!subStr.includes('?index='))
          uri = uri.slice(0, p)
      }
      if (collectionInfo?.ipfsUri && ipfsSufix === 'json') {
        tokenURI = collectionInfo.ipfsUri + '/' + id + '.json'
      } else if (!isIpfs(uri) || isBase64(uri)) {
        tokenURI = uri
      } else if (ipfsSufix === 'url') {
        if (uri.includes('Qm') ) {
          let p = uri.indexOf('?')
          if (p !== -1) uri = uri.slice(0, p)
          p = uri.indexOf("Qm");
          let locationQm = ""
          if (p !== -1) locationQm = uri.substring(p)
          tokenURI = 'https://operahouse.mypinata.cloud/ipfs/' + locationQm
        } else {
          tokenURI = uri
        }
      } else {
        let ipfsPos = uri.lastIndexOf('/ipfs/')
        let subUri = uri.substring(ipfsPos + 6)
        while (subUri && subUri.length > 0) {
          const firstCharacter = subUri[0]
          if (!firstCharacter.match(/[a-z]/i)) subUri = subUri.substring(1)
          else break
        }
        tokenURI = getTokenURI(id, collectionInfo.ipfsPrefix, ipfsSufix, involveId, subUri);
      }
    
      let metadata = {}
      const assetType = await getAssetType(tokenURI)
      if (assetType === 'other') {
        let response = await fetch(tokenURI);
        const responseText = await response.text()
        const regex = /\,(?!\s*?[\{\[\"\'\w])/g;
        const correct = responseText.replace(regex, '');
        metadata = JSON.parse(correct)
      }
      cardItem.likes = 0;
      cardItem.avatarImg = '1';
      cardItem.sellable = true
      if (collectionInfo.replacement && collectionInfo.replacementPrefix) {
        cardItem.assetURI = '/img/replacements/' + collectionInfo.replacementPrefix + id + collectionInfo.replacementSubfix;
        cardItem.assetType = await getAssetType(cardItem.assetURI)
      } else {
        if (assetType !== 'other') {
          cardItem.assetURI = getImageURI(tokenURI);
          cardItem.assetType = await getAssetType(cardItem.assetURI)
          cardItem.title = collectionInfo.name + ' ' + ("00" + id).slice(-3);
        } else if (metadata.image) {
          cardItem.assetURI = getImageURI(metadata.image);
        } else if (metadata.animation_url) {
          cardItem.assetURI = getImageURI(metadata.animation_url);
        }
      }
      cardItem.assetType = await getAssetType(cardItem.assetURI)
      cardItem.title = metadata.name;
      if (collectionInfo) cardItem.category = collectionInfo.category
      cardItem.stock = 6;

      if (metadata) {
        const { attributes } = metadata
        if (attributes && Array.isArray(attributes)) {
          cardItem.attributes = attributes
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
          }
        }
      }
    }
    cardItem.isNew = true

    if (cardItem.isOnSale && cardItem.price) {
      setUpdateItem(cardItem)
    } else {
      return null
    }
    return { result: true }
  }, [getCollectionWithAddress, getContractInstance, walletAddress]);

  useEffect(() => {
    (async () => {
      if (!isLoading && !error && data && allCollections?.length) {
        const { listItems } = data
        let items = listItems.map((item) => ({ ...item, id: item.tokenId, collectionAddress: item.nftContract, isOnSale: true }))
        if (items.length) {
          const queryData = items.map(({ collectionAddress, id }) => ({ collectionAddress, id }))
          getItemsData(queryData)
            .then((data) => {
              if (data && data.length) {
                const newItems = items.map((item) => {
                  const itemData = data.find(({ collectionAddress, tokenId}) => (item.collectionAddress.toLowerCase() === collectionAddress && Number(tokenId) === Number(item.id)))
                  if (itemData) {
                    return {
                      ...itemData,
                      ...item
                    }
                  } else return item
                })
                setMoreItems(newItems)
              } else {
                setMoreItems(items)
                items.map((item) => getCollectionDetailForNew(item))
              } 
            })
          .catch(() => {
            setMoreItems(items)
            items.map((item) => getCollectionDetailForNew(item))
          })
          items.forEach(({ collectionAddress}) => {
            collectionAddressesDispatch({ type: 'add', data: collectionAddress })
          })
        }
      }
    }) ()
  }, [data, isLoading, error, getCollectionDetailForNew, allCollections?.length])

  // useEffect(() => {
  //   if (isInitialized && walletAddress) {
  //     (async () => {
  //       try {
  //         const Like = Moralis.Object.extend('LikeNFT')
  //         const query = new Moralis.Query(Like)
  //         query.equalTo('address', walletAddress.toLowerCase())
  //         const response = await query.find()
  //         const likes = response?.map((like) => ({
  //           collectionAddress: like.get('token_address'),
  //           id: like.get('token_id'),
  //         }))
  //         setLikes(likes)
  //       } catch (err) {
  //         console.log(err)
  //       }
  //     }) ()
  //   }
  // }, [Moralis.Object, Moralis.Query, isInitialized, walletAddress])

  // pull NFT data from contract and ipfs
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
          } else if (sort === 'ending_soon') {
            newItems.sort(function(a, b) {
              if (a.expireTimestamp > b.expireTimestamp) return 1
              else if (a.expireTimestamp < b.expireTimestamp) return -1
              else return 0
            })
          } else if (sort === 'ending_latest') {
            newItems.sort(function(a, b) {
              if (a.expireTimestamp < b.expireTimestamp) return 1
              else if (a.expireTimestamp > b.expireTimestamp) return -1
              else return 0
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
    if (collectionAddresses?.length) {
      if (allCollections?.length) {
        let newCollections = collectionAddresses.map((address) => {
          const collection = getCollectionWithAddress(address)
          if (collection) {
            const { name } = collection
            return { name, address }
          } else {
            return null
          }
        })
        newCollections = newCollections.filter((item) => item)
        newCollections.sort(function (a, b) {
          if (a.name > b.name ) return 1
          else if (a.name < b.name) return -1
          else return 0
        })
        setCollections(newCollections)
      }
    }
  }, [collectionAddresses, getCollectionWithAddress, allCollections])

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
    <div>
      <ToastContainer position="top-right" />
      <div className="row mb-50_reset mx-auto text-center">
          {/* banner of collection */}
          {collectionInfo && (
            <div style={{marginTop: "-85px", borderRadius: "30px"}}>
              { getAssetType(collectionInfo.collectionBanner) === 'video' ? (
                <video
                  style={{width: "100%", height: "auto"}}
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
          <div style={{display: 'inline-flex', flexWrap: 'wrap', width: '100%', justifyContent: 'center'}}>
          <Filter
            options={filterOptions}
            setOptions={(options) => setFilterOptions(options)}
            isCollection={false}
            isMarketplace={(true)}
            showRarity={showRarity}
            collections={collections}
            isAuction={true}
          />
          </div>
          <InfiniteScroll
            dataLength={_cardItemsToShow.length}
            next={fetchItemsToShow}
            hasMore={true}
            scrollableTarget="root"
            className="row mb-50_reset mx-auto text-center"
          >
          {_cardItemsToShow.map((cardItem, i) => (
            <CardAuction
              key={`${cardItem.collectionAddress}-${cardItem.id}`}
              cardItem={cardItem}
              handleAcceptBid={handleAcceptBid}
              handleRemoveAuction={handleRemoveAuction}
              handleUpdateAuction={handleUpdateAuction}
              networkError={networkError}
              handleUpdateCard={(item) => setUpdateItem(item)}
            />
          ))}
          </InfiniteScroll>
      </div>
    </div>
  );
}

export default React.memo(CardMarketplace);
