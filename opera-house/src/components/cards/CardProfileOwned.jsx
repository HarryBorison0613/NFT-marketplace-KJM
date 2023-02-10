import React, { useState, useRef, useEffect, useContext, useCallback, useReducer } from 'react';
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
import { getAllListItems, getListItemDetail, getOwnedListItems } from '../../apis/marketplace';
import { toast, ToastContainer } from 'react-toastify';
import CardAuction from './CardAuction';
import { getItemsData } from '../../apis/nft';
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
    // if (locationQm.includes('/')) {
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
    // } else {
    //   if (ipfsSufix !== 'url') {
    //     if (!ipfsPrefix || ipfsPrefix === '')
    //       return "https://operahouse.mypinata.cloud/ipfs/" + id + ipfsSufix;
    //   } else return ipfsPrefix + id
    // }
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
      try {
        var xhr = new XMLHttpRequest();
        xhr.open('HEAD', uri, true);
        xhr.onload = function() {
          var contentType = xhr.getResponseHeader('Content-Type');
          if (contentType?.match('video.*')) resolve('video')
          else if (contentType?.match('image.*')) resolve('image')
          else resolve('other')
        };
        xhr.onerror = function(err) {
          resolve('other')
        }
        xhr.ontimeout = function(err) {
          resolve('other')
        }
        xhr.send();
      } catch (err) {
        resolve('other')
      }
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

const cardItemReducer = (data, action) => {
  switch (action.type) {
    case 'add':
      const moreItems = action.data
      const _moreItems = moreItems.filter((item) => {
        if (!item.collectionAddress || !item.id) return false
        if (!data.some(({ id, collectionAddress }) => (item && item.id === id && item.collectionAddress === collectionAddress))) {
          return true
        } else return false
      })
      if (_moreItems?.length) {
        return [...data, ..._moreItems]
      } else return data
    case 'set':
      return action.data
    default:
      break;
  }
}

function CardProfileOwned({ address: ownerAddress, updateProfile }) {
  const ref = useRef();
  const history = useHistory();
  const [isOwner, setIsOwner] = useState(false)
  const [nftCount, setNftCount] = useState(0)
  const [defaultNftCount, setDefaultNftCount] = useState(0)
  const [cardItems, cardItemsDispatch] = React.useReducer(cardItemReducer, [])
  const [cardItemsWithNew, setCardItemsWithNew] = React.useState([]);
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
  const [loading, setLoading] = useState(true)
  const [collectionAddress, setCollectionAddress] = useState(null)
  const [collectionAddresses, collectionAddressesDispatch] = useReducer(collectionReducer ,[])
  const [otherNfts, setOtherNfts] = useState([])
  const [collections, setCollections] = useState()
  const [traitFilterOptions, setTraitFilterOptions] = useState()
  const [showRarity, setShowRarity] = useState(false)
  const [loadEvent, setLoadEvent] = useState(false)
  const [_cardItemsToShow, _setCardItemsToShow] = React.useState([])
  const [updateItem, setUpdateItem] = React.useState()
  const nftsRef = React.useRef([]);
  const stateRef = React.useRef('idle');
  const fetchIndexRef = React.useRef(0)
  const showLengthRef = React.useRef(20)
  const { isInitialized, Moralis, user, isAuthenticated, web3, enableWeb3, isWeb3Enabled, isWeb3EnableLoading, chainId, web3EnableError, auth } = useMoralis();
  const Web3Api = useMoralisWeb3Api()
  const { walletAddress, collections: allCollections } = useContext(NFTContext)
  const profileAddress = ownerAddress ? ownerAddress : walletAddress
  
  const { data: listItems, isLoading, error } = useQuery(['profileListItems', profileAddress], getOwnedListItems, {
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

  const getCollectionAddresses = useCallback(() => {
    const addresses = []
    for(let i = 0; i < allCollections.length; i++) {
      addresses.push(allCollections[i].address.toLowerCase())
    }
    return addresses
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
    const NFTContractInstance = await getContractInstance(NFTContractABI, defaultCollectionAddress);
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

  const fetchDefaultItems = useCallback(async (fetchIndex) => {
    try {
      let cardItemsCopy = [];
      if (!profileAddress) return
      const defaultCollectionInfo = getCollectionWithAddress(defaultCollectionAddress)
      if (!defaultCollectionInfo) return
      let sellable = false
      if (defaultCollectionInfo) {
        sellable = defaultCollectionInfo.sellable
      }
      const NFTContractInstance = await getContractInstance(NFTContractABI, defaultCollectionAddress);
        //display default collection NFTs
      (async () => {
        let totalTokenCount = 0;
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
        const getDefaultItem = async (id) => {
          try {
            let owner = true;
            let isOwner = false
            let tokenOwnerAddress = address0;
            await NFTContractInstance.methods.ownerOf(id).call()
              // eslint-disable-next-line no-loop-func
              .then((result) => {
                if (result) {
                  if(result.toLowerCase() !== profileAddress.toLowerCase()) owner = false;
                  tokenOwnerAddress = result.toLowerCase()
                  return true
                } else return false
              })
            if (isBurned(tokenOwnerAddress)) return null
            if (owner) {
              const result = await NFTContractInstance.methods.getMetadata(id).call()
              let cardItem = {};
              cardItem.collectionAddress = defaultCollectionAddress;
              cardItem.id = id;
              cardItem.creater = result.creater;
              cardItem.likes = 0;
              cardItem.avatarImg = '1';
              cardItem.assetURI = getImageURI(result.assetURI);
              cardItem.title = result.title;
              cardItem.sellable = sellable
              if (defaultCollectionInfo) cardItem.category = defaultCollectionInfo.category
              cardItem.price = sellable ? Number(result.price) : 0
              cardItem.stock = 6;
              cardItem.seller = result.creater
              if (result.assetType && result.assetType !== '') {
                cardItem.assetType = result.assetType
              } else {
                cardItem.assetType = await getAssetType(cardItem.assetURI)
              }
              if(sellable && result.sellPending) cardItem.isOnSale = true
              else cardItem.isOnSale = false
              return { result: true, data: cardItem }
            } else {
              return null
            }
          } catch (err) {
            if (err && err.message && err.message.includes('nonexistent')) return null
            console.log(err, err.message,  err.code, err.message.code)
            return { result: false, data: id }
          }
        }
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
          nfts = nfts.map(({ data }) => data)
          nfts.sort(function(a,b){return a.id-b.id});
          cardItemsCopy = [...cardItemsCopy, ...nfts]
          if (fetchIndexRef.current === fetchIndex && nfts.length) {
            nftsRef.current = cardItemsCopy
            cardItemsDispatch({ type: 'add', data: nfts })
            collectionAddressesDispatch({ type: 'add', data: defaultCollectionAddress })
            setDefaultNftCount(nfts.length)
            stateRef.current = 'pending'
            failedItems = fetchedItems.filter((item) => (item && !item.result))
          } else {
            return
          }
          startId += 20
        }
        const timeoutHandler = setInterval(async () => {
          try {
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
                  if(data.isOwner) {
                    return true
                  }
                }
                return false
              })
              if (nfts.length && fetchIndexRef.current === fetchIndex) {
                nfts = nfts.map(({ data }) => data)
                nfts.sort(function(a,b){return a.id-b.id});
                cardItemsDispatch({ type: 'add', data: nfts })
                failedItems = fetchedItems.filter((item) => (item && !item.result))
                collectionAddressesDispatch({ type: 'add', data: defaultCollectionAddress })
              }
            } else {
              clearInterval(timeoutHandler)
            }
          } catch (err) {
            clearInterval(timeoutHandler)
          }
        }, 5000)
      }) ()
    } catch (err) {}
  }, [getCollectionWithAddress, getContractInstance, profileAddress])

  const fetchData = React.useCallback(async (fetchIndex) => {
    // if (chainId && Number(chainId) !== 0xfa) return setCardItems([])
    try {
      if (fetchIndexRef.current !== fetchIndex) {
        return
      }

      if (!profileAddress) return

      const options = { address: profileAddress, chain: "0xfa", limit: 1 }
      let totalItems = 0
      while (true) {
        const response =  await Web3Api.account.getNFTs(options)
        .catch((err) => {
          return null
        })
        if (response !== null) {
          const { total } = response
          totalItems = total
          setNftCount(total)
          break
        }
      }
      const collectionAddr = []
      if (totalItems > 0) {
        let index = 0
        while (true) {
          if (totalItems - 99 > 0 && index > totalItems - 99) index = totalItems - 99
          const options = { address: profileAddress, chain: "0xfa", limit: 100, offset: index }
          const response =  await Web3Api.account.getNFTs(options)
          .catch((err) => {
            return null
          })
          let nfts = null
          if (response !== null) {
            const { result, total } = response
            nfts = result
          } else {
            continue
          }
          nfts = nfts.map(({ token_address, token_id}) => {
            if (!collectionAddr.includes(token_address)) {
              collectionAddr.push(token_address)
              if (fetchIndexRef.current === fetchIndex) {
                collectionAddressesDispatch({ type: 'add', data: token_address })
              }
            }
            return { id: token_id, collectionAddress: token_address }
          })
          const queryData = nfts.map(({ collectionAddress, id }) => ({ id, collectionAddress }))
          await getItemsData(queryData)
          .then((data) => {
            if (data && data.length) {
              const newItems = nfts.map((item) => {
                const itemData = data.find(({ collectionAddress, tokenId}) => (item.collectionAddress.toLowerCase() === collectionAddress && Number(tokenId) === Number(item.id)))
                if (itemData) {
                  return {
                    ...item,
                    ...itemData,
                    id: item.id
                  }
                } else return item
              })
              if (fetchIndexRef.current === fetchIndex) {
                cardItemsDispatch({ type: 'add', data: nfts })
                setOtherNfts(newItems)
              }
            } else {
              cardItemsDispatch({ type: 'add', data: nfts })
              setOtherNfts(nfts)
            }
          })
          .catch(() => {
            cardItemsDispatch({ type: 'add', data: nfts })
            setOtherNfts(nfts)
          })
          if (index >= totalItems - 99 || totalItems < 99) break
          index += 100
        }

      }
      stateRef.current = 'resolved'
    } catch (err) {
    }
  }, [profileAddress, Web3Api.account])

  useEffect(() => {
    if (profileAddress) {
      cardItemsDispatch({ type: 'set', data: []})
      collectionAddressesDispatch({ type: 'set', data: [] })
    }
  }, [profileAddress])

  useEffect(() => {
    if (collectionAddresses?.length) {
      if (updateProfile) {
        updateProfile({
          collections: collectionAddresses?.length
        })
      }
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
  }, [collectionAddresses, getCollectionWithAddress, allCollections, updateProfile])

  // pull NFT data from contract and ipfs
  React.useEffect(() => {
    if (isInitialized) {
      if (isWeb3Enabled) {
        fetchIndexRef.current ++
        fetchData(fetchIndexRef.current)
      }
    }
  }, [isInitialized, isWeb3Enabled, fetchData])

  useEffect(() => {
    updateProfile({
      ownedNfts: nftCount + defaultNftCount
    })
  }, [nftCount, defaultNftCount, updateProfile])

  React.useEffect(() => {
    fetchDefaultItems(fetchIndexRef.current)
  }, [fetchDefaultItems])

  useEffect(() => {
    if (otherNfts?.length) {
      const fetchMetadata = async (item) => {
        try {
          const cardItem = { ...item }
          let { id, token_uri, metadata: _metadata } = item

          let collectionContractInstance = getContractInstance(collectionContractABI, item.collectionAddress)

          await collectionContractInstance.methods.tokenURI(id).call()
            .then((result) => {
              if (result && result !== '') {
                token_uri = result
              }
            })
            .catch(() => {
              return collectionContractInstance.methods.uri(id).call()
              .then((result) => {
                if (result && result !== '') {
                  if (result.includes('{id}')) {
                    token_uri = result.replace('{id}', id.toString())
                  } else {
                    token_uri = result
                  }
                }
              })
              .catch((err) => {
                token_uri = ''
              })
            })
          // }
        if (token_uri === '') return null

          let uri = token_uri
        if (token_uri && token_uri !== '') {
          let tokenURI = '';
          let metadata = null
          let isImage = false
          const ipfsSufix = getIPFSSufix(uri);
          let p = uri.indexOf('?')
          if (p !== -1) {
            const subStr = uri.slice(p, uri.length)
            if (!subStr.includes('?index=') && !subStr.includes('?tokenId=') && !subStr.includes('?filename='))
              uri = uri.slice(0, p)
          }
          if (!_metadata) {
            if (!isIpfs(uri) || isBase64(uri)) {
              tokenURI = uri
            } else if (ipfsSufix === 'url') {
              const p = token_uri.indexOf('?')
              if (p !== -1) uri = token_uri.slice(0, p)
              if (uri.includes('Qm') ) {
                let p = uri.indexOf("Qm");
                let locationQm = ""
                if (p !== -1) locationQm = uri.substring(p)
                tokenURI = 'https://operahouse.mypinata.cloud/ipfs/' + locationQm
              } else if (isIpfs(uri)) {
                let p = token_uri.indexOf('?')
                if (p !== -1) uri = token_uri.slice(0, p)
                let involveId = isIdInURI(uri);
                let ipfsPos = uri.lastIndexOf('/ipfs/')
                let subUri = uri.substring(ipfsPos + 6)
                while (subUri && subUri.length > 0) {
                  const firstCharacter = subUri[0]
                  if (!firstCharacter.match(/[a-z]/i)) subUri = subUri.substring(1)
                  else break
                }
                tokenURI = getTokenURI(id, null, ipfsSufix, involveId, subUri);
              } else {
                tokenURI = uri
              }
            } else {
              let p = token_uri.indexOf('?')
              if (p !== -1) uri = token_uri.slice(0, p)
              let involveId = isIdInURI(uri);
              let ipfsPos = uri.lastIndexOf('/ipfs/')
              let subUri = uri.substring(ipfsPos + 6)
              while (subUri && subUri.length > 0) {
                const firstCharacter = subUri[0]
                if (!firstCharacter.match(/[a-z]/i)) subUri = subUri.substring(1)
                else break
              }
              tokenURI = getTokenURI(id, 'https://operahouse.mypinata.cloud/ipfs/', ipfsSufix, involveId, subUri);
            }
            const assetType = await getAssetType(tokenURI)
            if (assetType === 'other') {
              try {
                let response = await fetch(tokenURI);
                const responseText = await response.text()
                const regex = /\,(?!\s*?[\{\[\"\'\w])/g;
                const correct = responseText.replace(regex, '');
                metadata = JSON.parse(correct)
              } catch (err) {
                await sleep(100)
                try {
                  let response = await fetch(tokenURI);
                  const responseText = await response.text()
                  const regex = /\,(?!\s*?[\{\[\"\'\w])/g;
                  const correct = responseText.replace(regex, '');
                  metadata = JSON.parse(correct)
                } catch (err) {
                  return null
                }
              }
            } else {
              isImage = true
            }
          } else {
            metadata = { ..._metadata }
          }
          let title = metadata?.name
          let assetURI = metadata?.image
          let animation_url = metadata?.animation_url
          if (metadata?.type === 'object' && metadata?.properties) {
            title = metadata?.properties?.name?.description
            assetURI = metadata?.properties?.image?.description
          }
          cardItem.title = title
          if (isImage) {
            cardItem.assetURI = getImageURI(tokenURI)
            cardItem.assetType = await getAssetType(cardItem.assetURI)
            cardItem.title = ("00" + id).slice(-3);
          } else if (assetURI) {
            cardItem.assetURI = getImageURI(assetURI)
            cardItem.assetType = await getAssetType(cardItem.assetURI)
          } else if (animation_url){
            cardItem.assetURI = getImageURI(animation_url)
            cardItem.assetType = await getAssetType(cardItem.assetURI)
          } else {
            cardItem.assetURI = ''
            cardItem.assetType = 'other'
          }
        }

          setUpdateItem(cardItem)
          return true
        } catch (err) {
          console.log(err)
          return false
        }
      }
      const getItemMetaData = async (data) => {
        try {
          const NFTContractInstance = await getContractInstance(NFTContractABI, defaultCollectionAddress);
          let cardItem = { ...data };
          const collectionInfo = getCollectionWithAddress(data.collectionAddress)
          const sellable = collectionInfo?.sellable
          cardItem.sellable = sellable
          let collectionContractInstance = getContractInstance(collectionContractABI, data.collectionAddress)
          const tokenOwnerAddress = await collectionContractInstance.methods.ownerOf(data.id).call().catch(() => null)
          cardItem.tokenOwnerAddress = tokenOwnerAddress?.toLowerCase()
          if (sellable) {
            await NFTContractInstance.methods.otherTokenStatus(data.collectionAddress, data.id).call()
              .then(async (info) => {
                if (info && info.sellPending && Number(info.price) > 0) {
                  if (tokenOwnerAddress && tokenOwnerAddress?.toLowerCase() === info.tokenOwner?.toLowerCase()) {
                    cardItem.seller = info?.tokenOwner
                    cardItem.price = Number(info.price);
                    cardItem.isOnSale = true
                  }
                }
              })
              .catch((err) => {
              });
          }

          setUpdateItem({...cardItem})
          if (!data.assetURI) {
            return fetchMetadata(data)
          }
        } catch (err) {
          console.log(err)
        }
      }
      for (let index = 0; index < otherNfts.length; index++) {
        const element = otherNfts[index];
        getItemMetaData(element)
      }
    }
  }, [getCollectionWithAddress, getContractInstance, otherNfts])

  useEffect(() => {
    if (listItems) {
      if (listItems && listItems.length) {
        const newItems = cardItems.map((cardItem) => {
          const listItem = listItems.find(({ tokenId, nftContract }) => (
            Number(tokenId) === Number(cardItem.id) &&
            nftContract?.toLowerCase() === cardItem?.collectionAddress?.toLowerCase()
          ))
          if (listItem) {
            return {
              ...cardItem,
              ...listItem,
              id: cardItem.id,
              isOnSale: true,
              sellable: true,
              isNew: true,
            }
          } else {
            return cardItem
          }
        })
        setCardItemsWithNew(newItems)
      } else {
        setCardItemsWithNew(cardItems)
      }
    }
  }, [cardItems, listItems, error])

  useEffect(() => {
    if (cardItemsWithNew && cardItemsWithNew.length) {
      setLoading(false)
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
        cardItemsDispatch({ type: 'set', data: newItems})
      }
    }
  }, [updateItem])

  return (
    <div className='w-100'>
      <ToastContainer position='top-right' />
        <div className="w-100 row mb-50_reset mx-auto text-center">
          {/* <div style={{display: 'inline-flex', flexWrap: 'wrap', justifyContent: 'center', width: '100%'}}> */}
          <Filter
            options={filterOptions}
            setOptions={(options) => setFilterOptions(options)}
            isCollection={false}
            isMarketplace={(!collectionAddress)}
            showRarity={showRarity}
            collections={collections}
          />
          {/* </div> */}
          <>{
            loading ? (
              <Popup
                className="custom"
                open={!isLoading}
                position="bottom center"
              >
              <p>Retrieving data, please wait...</p>
              </Popup>
            ) : (
            <InfiniteScroll
              dataLength={_cardItemsToShow.length}
              next={fetchItemsToShow}
              hasMore={true}
              scrollableTarget="root"
              className="w-100 row mb-50_reset mx-auto text-center"
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
          )}
          </>
      </div>
    </div>
  );
}

export default React.memo(CardProfileOwned);
