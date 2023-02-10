import React, { useState, useRef, useEffect, useContext, useCallback, useReducer } from 'react';
import {Link, useHistory} from 'react-router-dom';
import { useQuery } from 'react-query'
import 'reactjs-popup/dist/index.css';
import {ToastContainer, toast} from 'react-toastify';
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
import CardItem from './CardCollectionItem';
import { getCollectionFloorFromBC, getCollectionInfoFromBC, getCollectionListItems, getListItemDetail } from '../../apis/marketplace';
import { getCollectionData } from '../../apis/nft';
import CardAuction from './CardAuction';
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

function checkAddress(address) {
  if (address && address.length === 42) {
    if (address.substring(0, 2) === '0x') return true
    else return false
  } else return false
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

const getTokenURIOld = (id, ipfsPrefix, ipfsSufix, involveId, locationQm) => {

  if(involveId) {
    return ipfsPrefix + id + ipfsSufix;
  } else{
    return "https://operahouse.mypinata.cloud/ipfs/" + locationQm;
  }
}

const getAbbrWalletAddress = (walletAddress) => {
  if (walletAddress) {
    let abbrWalletAddress = walletAddress.substring(0, 4) + "..." + walletAddress.substring(38, 42);
    return abbrWalletAddress.toLowerCase();
  }
}

const oldMarketplaceReducer = (data, action) => {
  switch (action.type) {
    case 'add':
      return [...data, action.data ]
    case 'set':
      return action.data
    default:
      break;
  }
}

const collectionInfoReducer = (data, action) => {
  switch (action.type) {
    case 'update':
      return { ...data, ...action.data }
    case 'set':
      return action.data
    default:
      break;
  }
}


function CardCollection(props) {
  const ref = useRef();
  const history = useHistory();
  const [isOwner, setIsOwner] = useState(false)
  const [cardItems, setCardItems] = React.useState([]);
  const [oldCardItems, oldItemsDispatch] = useReducer(oldMarketplaceReducer, [])
  const [cardItemsWithNew, setCardItemsWithNew] = React.useState([]);
  const [traits, setTraits] = React.useState();
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
  const [collectionAddress, setCollectionAddress] = useState(null)
  const [traitFilterOptions, setTraitFilterOptions] = useState()
  const [showRarity, setShowRarity] = useState(false)
  const [loadEvent, setLoadEvent] = useState(false)
  const [_cardItemsToShow, _setCardItemsToShow] = React.useState([])
  const [updateItem, setUpdateItem] = React.useState()
  const [moreItems, setMoreItems] = React.useState()
  const [collectionInfo, collectionInfoDispatch] = React.useReducer(collectionInfoReducer, null);
  const nftsRef = React.useRef([]);
  const stateRef = React.useRef('idle');
  const fetchIndexRef = React.useRef(0)
  const showLengthRef = React.useRef(20)
  const [totalNFTs, setTotalNFTs] = React.useState(0);
  const { web3, isWeb3Enabled, isWeb3EnableLoading, chainId, web3EnableError, auth } = useMoralis();
  const { walletAddress, collections: allCollections, tokenPrices } = useContext(NFTContext)
  const { data, isLoading, error } = useQuery(['collectionListItems', collectionAddress],
      getCollectionListItems, {
        retry: true,
        retryDelay: 1000,
      }
    )
  const { data: collectionItems, isLoading: isCollectionLoading, error: collectionError } = useQuery(['collectionItems', collectionAddress],
    getCollectionData, {
      retry: true,
      retryDelay: 1000,
    }
  )

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

  const getCollectionInfo = React.useCallback(async (collectionAddress) => {
    let NFTContractInstance = getContractInstance(NFTContractABI, defaultCollectionAddress);
    let info = {};
    for(let i = 0; i < allCollections.length; i++) {
      if(allCollections[i].address.toLowerCase() === collectionAddress.toLowerCase())
        info = allCollections[i];
    }
    let address = collectionAddress === defaultCollectionAddress ? address0 : collectionAddress;
    const result = await getCollectionInfoFromBC(collectionAddress).catch(() => null)
    let lastSoldTimeStamp = 0;
    while (true) {
      let result = await NFTContractInstance.methods.collectionInfo(address).call()
        // eslint-disable-next-line no-loop-func
        .then((result) => {
          const info = {}
          info.totalVolume = Number(result.totalVolume)
          info.totalSales = Number(result.totalSales)
          info.lastSale = result.lastSale;
          lastSoldTimeStamp = result.lastSold;
          return info;
        })
        .catch((err) => {
          return null
        });
      if (result !== null) {
        info = { ...info, ...result }
        break
      }
    }

    if (result && result.volumes?.length) {
      let totalVolume = 0
      result.volumes.forEach(element => {
        const tokenPriceItem = tokenPrices?.find((item) => item.address?.toLowerCase() === element.paymentToken)
        const tokenPrice = tokenPriceItem?.price ?? 1
        totalVolume += tokenPrice * Number(element.volume)
      })
      info.totalVolume += Number(totalVolume)
    }

    if (result && Number(result.totalSale) > 0) {
      info.totalSales = Number(result.totalSale)
    }

    if (result && Number(result.lastSold)) {
      const tokenPriceItem = tokenPrices?.find((item) => item.address?.toLowerCase() === result.lastSoldPaymentToken)
      const tokenPrice = tokenPriceItem?.price ?? 1
      info.lastSale = Number(result.lastSold) * tokenPrice
    }

    if (result && result.lastSoldTime) {
      lastSoldTimeStamp = Number(result.lastSoldTime)
    }

    // while (true) {
    //   let result = await NFTContractInstance.methods.getFloor(address).call()
    //     .then((result) => {
    //       if(Number(result) === 99999999999999999999999999) return 0
    //       else return result
    //     })
    //     .catch((err) => {
    //       return null
    //     });
    //   if (result !== null) {
    //     info.floor = Number(result)
    //     break
    //   }
    // }
    info.floor = 0

    let currentTimeStamp = 0;

    currentTimeStamp = Date.now() / 1000;

    let period = currentTimeStamp - lastSoldTimeStamp;
    if(Number(lastSoldTimeStamp) === 0) period = 0;
    if(period < 60) info.lastSold = period.toString() + " second(s) ago.";
    else if(period < 60 * 60) info.lastSold = Math.floor(period / 60).toString() + " minute(s) ago.";
    else if(period < 60 * 60 * 24) info.lastSold = Math.floor(period / 60 / 60).toString() + " hour(s) ago.";
    else info.lastSold = Math.floor(period / 60 / 60 / 24).toString() + " day(s) ago.";
    return info;
  }, [getContractInstance, allCollections, tokenPrices])

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
            console.log(err)
            return false
          })
          if (estimateResult) {
            result = await buyFunc.send({ from: walletAddress, value: price }).then(() => true).catch(() => false)
          }
        } else {
          const fromToken = buyPaymentToken?.address === address0 ? wFTMAddress : buyPaymentToken?.address
          const erc20Instance = getContractInstance(ERC20ABI, fromToken)
          const balance = await erc20Instance.methods.balanceOf(walletAddress).call()
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
              toast.error(err.message)
              return false
            })
            if (estimateResult) {
              result = await buyFunc.send({ from: walletAddress }).then(() => true).catch(() => false)
              
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
                  console.log('get graphql err');
              });
            if (loopState) return
          }
        }
      } catch (err) {
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

  const handleSetSellPending = useCallback(async (cardItem, sellType, sellPaymentToken, sellPrice, sellDay, contractType = true, sellAmount = 1) => {
    const { id, collectionAddress } = cardItem
    setUpdateItem({ id, collectionAddress, pending: true, isNew: cardItem.isNew })
    const collectionContractInstance = getContractInstance(collectionContractABI, collectionAddress);
    const marketplaceInstance = getContractInstance(marketplaceABI, marketplaceAddress);
    try {
      let isApproved = false;
      const allApproved = await collectionContractInstance.methods.isApprovedForAll(walletAddress, marketplaceAddress).call()
        .catch(() => null)
      if (allApproved) isApproved = true
      else {
        const approvedAddress = await collectionContractInstance.methods.getApproved(id).call()
          .catch(() => null)
        if (approvedAddress && approvedAddress.toLowerCase() === marketplaceAddress.toLowerCase()) {
          isApproved = true
        }
      }
      if (!isApproved) {
        await collectionContractInstance.methods.setApprovalForAll(marketplaceAddress, 1).send({ from: walletAddress })
        while (true) {
          sleep(2000)
          const allApproved = await collectionContractInstance.methods.isApprovedForAll(walletAddress, marketplaceAddress).call()
          .catch(() => null)
          if (allApproved) {
            break
          }
        }
      }
      // eslint-disable-next-line no-undef
      let price = BigInt(Number(sellPrice) * Math.pow(10, sellPaymentToken.decimals)).toString()
      let date = Date.now()
      date += Number((!sellDay || sellDay ==='') ? 1 : Number(sellDay)) * 8.64e+7 ;
      date = Math.round(date/1000)
      const tokenAddress = sellPaymentToken.address
      let listFunc
      if (contractType) {
        listFunc = marketplaceInstance.methods.listToken(
          collectionAddress,
          id,
          price,
          tokenAddress,
          sellType,
          date
        )
      } else {
        listFunc = marketplaceInstance.methods.listTokenERC1155(
          collectionAddress,
          id,
          sellAmount,
          price,
          tokenAddress,
          sellType,
          date
        )
      }
      let preError = null
      await listFunc.estimateGas(
        {
            from: walletAddress
        }
      ).catch((error) => {
        preError = error
      })
      if (!preError) {
        const result = await listFunc.send({ from: walletAddress }).then(() => true)
          .catch((err) => {
            console.log(err)
            return false
          })
        if (result)
        while (true) {
          let loopState = false
          await sleep(3000)
          await getListItemDetail(collectionAddress, id)
          .then((res) => {
            if (res && res.listItems && res.listItems.length > 0) {
              return res.listItems[0]
            } else {
              return null
            }
          })
          .then((result) => {
            if (result) {
              const { tokenId, price, amount, listType, paymentToken, contractType } = result;
              if (Number(amount) > 0 &&
                Number(tokenId) === Number(id)
              ) {
                setUpdateItem({ id, collectionAddress, isOnSale: true, price, amount, listType, paymentToken, contractType, isNew: true, pending: false })
                loopState = true
              }
            }
          })
          .catch((err) => {
              console.log('get Metadata err');
          });
          if (loopState) break
        }
      } else {
        var errorMessageInJson = JSON.parse(
          preError.message.slice(24, preError.message.length)
        );
        console.log(errorMessageInJson.message) // exact error message
      }
    } catch(err) {
      console.log(err);
    }
    setUpdateItem({ id, collectionAddress, pending: false, isNew: cardItem.isNew })
  }, [getContractInstance, walletAddress])

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
              const price = Number(result.price)
              const newItem = { ...item, isOnSale: false, price }
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

  const handleAcceptBid = useCallback(async (cardItem, highestBid) => {
    try {
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
        errorMessage = err?.message
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

  useEffect(() => {
    if (!props.collectionAddress) {
      setCollectionAddress(false)
    } else {
      if (props.collectionAddress === 'profile') {
        setCollectionAddress('profile')
      } else {
        if (checkAddress(props.collectionAddress)) {
          setCollectionAddress(props.collectionAddress)
        } else {
          const collectionName = props.collectionAddress.replaceAll('_', ' ')
          const address = getCollectionAddressWithName(collectionName)
          if (address) {
            setCollectionAddress(address)
          }
        }

      }
    }
  }, [props.collectionAddress, getCollectionAddressWithName])

  useEffect(() => {
    if (collectionAddress && allCollections?.length) {
      getCollectionInfo(collectionAddress)
        .then((collectionInfo) => {
          collectionInfoDispatch({ type: 'set', data: collectionInfo } );
        })
    }
  }, [allCollections, collectionAddress, getCollectionInfo])

  
  useEffect(() => {
    if (collectionInfo) {
      if (collectionInfo.collecionOwner?.toLowerCase() === walletAddress?.toLowerCase()) setIsOwner(true)
      else setIsOwner(false)
    }
  }, [collectionInfo, walletAddress])

  // pull NFT data from contract and ipfs

  useEffect(() => {
    if (collectionItems) {
      setTotalNFTs(collectionItems.length)
      if (collectionInfo?.sellable) {
        if ((data && data.listItems?.length) || oldCardItems.length) {
          const newItems = collectionItems.map((cardItem) => {
            if (data) {
              const { listItems } = data
              const listItem = listItems?.find(({ tokenId }) => (
                Number(tokenId) === Number(cardItem.tokenId)
              ))
              if (listItem) {
                return {
                  ...cardItem,
                  ...listItem,
                  id: cardItem.tokenId,
                  isOnSale: true,
                  sellable: true,
                  isNew: true,
                }
              } 
            }
            if (oldCardItems?.length) {
              const oldItem = oldCardItems.find(({ id }) => (
                Number(id) === Number(cardItem.tokenId)
              ))
              if (oldItem) {
                return {
                  ...cardItem,
                  ...oldItem,
                  id: cardItem.tokenId,
                  isOnSale: true,
                  sellable: true,
                  isNew: false
                }
              } else {
                return {
                  ...cardItem,
                  id: cardItem.tokenId,
                  sellable: true
                }
              }
            } else {
              return {
                ...cardItem,
                id: cardItem.tokenId,
                sellable: true
              }
            }
          })
          setCardItemsWithNew(newItems)
        } else {
          setCardItemsWithNew(collectionItems.map((item) => ({ ...item, id: item.tokenId})))
        }
      } else {
        setCardItemsWithNew(collectionItems.map((item) => ({ ...item, id: item.tokenId})))
      }
    }
  }, [collectionItems, data, oldCardItems, error, collectionInfo, isCollectionLoading, collectionError])

  useEffect(() => {
    if (data?.listItems?.length && collectionInfo && tokenPrices) {
      let floorPrice = Number(collectionInfo.floor)
      let updated = false
      data?.listItems?.forEach(({ paymentToken, price }) => {
        const tokenPriceItem = tokenPrices.find((item) => item.address?.toLowerCase() === paymentToken)
        const tokenPrice = tokenPriceItem?.price ?? 1
        const ftmPrice = Number(price) * tokenPrice
        if (!floorPrice || floorPrice > ftmPrice) {
          floorPrice = ftmPrice
          updated = true
        }
      })
      if (updated) {
        collectionInfoDispatch({ type: 'update', data: { floor: floorPrice }})
      }
    }
  }, [data, collectionInfo, tokenPrices])

  useEffect(() => {
    if (collectionInfo && collectionInfo.sellable && collectionAddress && collectionItems?.length) {
      let NFTContractInstance = getContractInstance(NFTContractABI, defaultCollectionAddress);
      let collectionContractInstance = getContractInstance(collectionContractABI, collectionAddress);
      let fetchMetadata = null
      if (collectionAddress.toLowerCase() === defaultCollectionAddress.toLowerCase()) {
        fetchMetadata = async (id) => {
          let cardItem = {}
          try {
            await NFTContractInstance.methods.getMetadata(id).call()
            .then(async (info) => {
              if (info?.sellPending && Number(info.price) > 0) {
                cardItem.price = Number(info.price);
                cardItem.isOnSale = true;
                cardItem.sellable = collectionInfo.sellable
                oldItemsDispatch({ type: 'add', data: { ...cardItem, collectionAddress, id } })
              }
            })
            
            return true
          } catch (err) {
            console.log(err)
            return false
          }
        }
      } else {
        fetchMetadata = async (id) => {
          let cardItem = {}
          try {
            await NFTContractInstance.methods.otherTokenStatus(collectionAddress, id).call()
            .then(async (info) => {
              if (info?.sellPending && Number(info.price) > 0) {
                cardItem.price = Number(info.price);
                cardItem.isOnSale = true;
                cardItem.sellable = true
                cardItem.seller= info.tokenOwner
                
              }
            })

            const tokenOwnerAddress = await collectionContractInstance.methods.ownerOf(id).call().catch(() => null)
            if (tokenOwnerAddress && tokenOwnerAddress?.toLowerCase() === cardItem.seller?.toLowerCase())
              oldItemsDispatch({ type: 'add', data: { ...cardItem, collectionAddress, id } })
            return true
          } catch (err) {
            console.log(err)
            return false
          }
        }
      }
      collectionItems.forEach((item) => {
        fetchMetadata(item.tokenId)
      })
    }
  }, [collectionItems, collectionInfo, collectionAddress, getContractInstance])

  useEffect(() => {
    if (cardItemsWithNew && cardItemsWithNew.length) {
      const { name, sort, isOnSale, category, minPrice, maxPrice, rarity, collection } = filterOptions;
      let newItems = [...cardItemsWithNew]
      if ((!name || name === '') && (!sort || sort === '') && (!category || category === '') && (!collection || collection === '') && !isOnSale && (!minPrice || minPrice === '') && (!maxPrice || maxPrice === '') && (!rarity || rarity === '') && (!traitFilterOptions)) {
        setFilteredCardItems([...cardItemsWithNew])
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
  }, [cardItemsWithNew, filterOptions, traitFilterOptions])

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
  }, [updateItem])

  return (
    <div className='w-100'>
      <ToastContainer position="top-right" />
        { isOwner &&
          <Link to={`/edit-collection/${collectionAddress}`} className="btn btn-white btn-sm my-40" style={{marginTop: -90, float: 'right'}}>
            Edit Collection
        </Link>
        }
        <div className="row mb-50_reset mx-auto text-center">
          {/* banner of collection */}
          {collectionInfo && (
            <div style={{marginTop: "-85px", borderRadius: "30px"}}>
              { getAssetType(collectionInfo.collectionBanner) === 'video' ? (
                <video
                  style={{width: "100%", height: "auto"}}
                  controls
                  loop muted autoPlay playsInline
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
                    <a href={collectionInfo.website} target="_blank" className="website-btn" style={{marginLeft: "0px", marginRight: "5px"}}><i className="ri-earth-fill" /></a>
                    <a href={"https://twitter.com/" + collectionInfo.twitter} className="twitter-btn" target="_blank" style={{marginLeft: "5px", marginRight: "5px"}}><i className="ri-twitter-fill" /></a>
                    <a href={"https://discord.gg/" + collectionInfo.discord} className="discord-btn" target="_blank" style={{marginLeft: "5px", marginRight: "5px"}}><i className="ri-discord-fill" /></a>
                    <a href={"https://ftmscan.com/token/" + collectionInfo.address} className="website-btn" target="_blank" style={{marginLeft: "5px", marginRight: "5px"}}><i className="ri-search-fill" /></a>
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
            <div className="text-center card_stats" style={{marginBottom: "20px"}}>
              <b>NFTs:</b> {totalNFTs} &nbsp;|&nbsp;
              &nbsp;<b>Total Volume:</b> {(Number(collectionInfo.totalVolume) / Math.pow(10, 18)).toFixed(2)} FTM &nbsp;|&nbsp;
              &nbsp;<b>Total Sales:</b> {collectionInfo.totalSales} &nbsp;|&nbsp;
              &nbsp;<b>Average Price:</b> {Number(collectionInfo.totalSales) !== 0 ? (Number(collectionInfo.totalVolume) / Number(collectionInfo.totalSales) / Math.pow(10, 18)).toFixed(2): 0} FTM &nbsp;|&nbsp;
              &nbsp;<b>Price Floor:</b> {(collectionInfo.floor / Math.pow(10, 18)).toFixed(2)} FTM &nbsp;|&nbsp;
              &nbsp;<b>Last Sold For:</b> {(collectionInfo.lastSale / Math.pow(10, 18)).toFixed(2)} FTM &nbsp;|&nbsp;
              &nbsp;<b>Last Sold:</b> {collectionInfo.lastSold}
              <br />
            </div>

          )}
          <Filter
            options={filterOptions}
            setOptions={(options) => setFilterOptions(options)}
            isCollection={true}
            isMarketplace={false}
            showRarity={showRarity}
          />
          {(collectionAddress && collectionAddress !== 'profile') && traits && <AttributeFilter traits={traits} filterOptions={traitFilterOptions} setFilterOptions={setTraitFilterOptions}/>}
          <InfiniteScroll
            dataLength={_cardItemsToShow.length}
            next={fetchItemsToShow}
            hasMore={true}
            scrollableTarget="root"
            className="row mb-50_reset mx-auto text-center"
          >
          {_cardItemsToShow.map((cardItem, i) => (
            (cardItem.isNew && !cardItem.listType) ? <CardAuction
              cardItem={cardItem}
              networkError={networkError}
              handleAcceptBid={handleAcceptBid}
              handleRemoveAuction={handleRemoveAuction}
              handleUpdateAuction={handleUpdateAuction}
            /> :
            <CardItem
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

export default React.memo(CardCollection);
