import React, { useState, useRef, useEffect, useContext, useCallback } from 'react';
import {Link, useHistory} from 'react-router-dom';
import { useQuery } from 'react-query'
import 'reactjs-popup/dist/index.css';
import {ToastContainer, toast} from 'react-toastify';
import InfiniteScroll from 'react-infinite-scroll-component'
import {
  NFTContractABI, collectionContractABI, marketplaceABI, ERC20ABI
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
import CardItem from './CardItem';
import { getCollectionListItems, getListItemDetail } from '../../apis/marketplace';
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



function CardCollection(props) {
  const ref = useRef();
  const history = useHistory();
  const [isOwner, setIsOwner] = useState(false)
  const [cardItems, setCardItems] = React.useState([]);
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
  const [collectionInfo, setCollectionInfo] = React.useState(null);
  const nftsRef = React.useRef([]);
  const stateRef = React.useRef('idle');
  const fetchIndexRef = React.useRef(0)
  const showLengthRef = React.useRef(20)
  const [totalNFTs, setTotalNFTs] = React.useState(0);
  const { isInitialized, Moralis, web3, isWeb3Enabled, isWeb3EnableLoading, chainId, web3EnableError, auth } = useMoralis();
  const Web3Api = useMoralisWeb3Api()
  const { walletAddress, collections: allCollections } = useContext(NFTContext)
  const { data, isLoading, error } = useQuery(['collectionListItems', collectionAddress],
      getCollectionListItems
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

  const getCollectionInfo = React.useCallback(async (collectionAddress) => {
    let NFTContractInstance = getContractInstance(NFTContractABI, defaultCollectionAddress);
    let info = {};
    for(let i = 0; i < allCollections.length; i++) {
      if(allCollections[i].address.toLowerCase() === collectionAddress.toLowerCase())
        info = allCollections[i];
    }

    let address = collectionAddress === defaultCollectionAddress ? address0 : collectionAddress;
    let lastSoldTimeStamp = 0;
    while (true) {
      let result = await NFTContractInstance.methods.collectionInfo(address).call()
        // eslint-disable-next-line no-loop-func
        .then((result) => {
          const info = {}
          info.totalVolume = result.totalVolume;
          info.totalSales = result.totalSales;
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

    while (true) {
      let result = await NFTContractInstance.methods.getFloor(address).call()
        .then((result) => {
          if(Number(result) === 99999999999999999999999999) return 0
          else return result
        })
        .catch((err) => {
          return null
        });
      if (result !== null) {
        info.floor = result
        break
      }
    }


    let currentTimeStamp = 0;

    while (true) {
      let result = await NFTContractInstance.methods.auctionEndTime(1).call()
        .then((result) => {
          if (result && result[1] !== undefined) {
            return result[1]
          }
        })
        .catch((err) => {
          return null
        });
      if (result !== null) {
        currentTimeStamp = result
        break
      }
    }

    let period = currentTimeStamp - lastSoldTimeStamp;
    if(Number(lastSoldTimeStamp) === 0) period = 0;
    if(period < 60) info.lastSold = period.toString() + " second(s) ago.";
    else if(period < 60 * 60) info.lastSold = Math.floor(period / 60).toString() + " minute(s) ago.";
    else if(period < 60 * 60 * 24) info.lastSold = Math.floor(period / 60 / 60).toString() + " hour(s) ago.";
    else info.lastSold = Math.floor(period / 60 / 60 / 24).toString() + " day(s) ago.";
    return info;
  }, [getContractInstance, allCollections])

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

  const handleTransfer = React.useCallback(async (e, collectionAddress, tokenId, to) => {
    setUpdateItem({ id: tokenId, collectionAddress, pending: true })
    try {
      e.preventDefault();
      setUpdateItem({ collectionAddress, id: tokenId, pending: true })
      let collectionContractInstance = getContractInstance(collectionContractABI, collectionAddress);
      await collectionContractInstance.methods.safeTransferFrom(walletAddress, to, tokenId).send({ from: walletAddress });
      setTimeout(() => {
        history.go(0);
      }, 10000);
    } catch (err) {
    }
    setUpdateItem({ id: tokenId, collectionAddress, pending: false })
  }, [walletAddress, getContractInstance, history])

  const handleBuyToken = React.useCallback(async (item, buyPaymentToken, buyTokenAmount) => {
    if (item.isNew) {
      const { id, collectionAddress, contractType, paymentToken, amount, price } = item
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
            const allowance = await erc20Instance.methods.allowance(walletAddress, marketplaceAddress).call().catch(() => 0)
            if (Number(allowance) < Number(buyTokenAmount)) {
              await erc20Instance.methods.approve(marketplaceAddress, '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff').send({ from: walletAddress })
            }
            while (true) {
              const allowance = await erc20Instance.methods.allowance(walletAddress, marketplaceAddress).call().catch(() => 0)
              if (Number(allowance) >= Number(buyTokenAmount)) {
                break
              }
              sleep(1000)
            }
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
              console.log(err)
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

  const handleSetSellPending = useCallback(async (cardItem, sellType, sellPaymentToken, sellPrice, sellDay, ) => {
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
      const listFunc = marketplaceInstance.methods.listToken(
        collectionAddress,
        id,
        price,
        tokenAddress,
        sellType,
        date
      )
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
      buyFunc = marketplaceInstance.methods.acceptBid(collectionAddress, contractType, id, bidder, price)
      const estimateResult = await buyFunc.estimateGas(
        {
            from: walletAddress,
        }
      )
      .then(() => true)
      .catch((err) => {
        console.log(err)
        return false
      })
      if (estimateResult) {
        result = await buyFunc.send({ from: walletAddress }).then(() => true).catch(() => false)
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

  const fetchData = React.useCallback(async (fetchIndex) => {
    if (chainId && Number(chainId) !== 0xfa) {
      setCardItems([])
      return
    }
    try {
      if (collectionAddress === null) return
      let ipfsPrefix = getIPFSPrefix(collectionAddress);
      if(collectionAddress) {  //collection page
        getCollectionInfo(collectionAddress)
        .then((collectionInfo) => {
          if (fetchIndex === fetchIndexRef.current) {
            setCollectionInfo(collectionInfo);
          }
        })
        const collectionInfo = getCollectionWithAddress(collectionAddress)
        let sellable = true
        if (collectionInfo) {
          sellable = collectionInfo.sellable
          if (collectionInfo.collecionOwner?.toLowerCase() === walletAddress?.toLowerCase()) setIsOwner(true)
        }
        
        if(collectionAddress.toLowerCase() === defaultCollectionAddress.toLowerCase()) { //about default collection
          let totalTokenCount = 0;
          const NFTContractInstance = await  getContractInstance(NFTContractABI, defaultCollectionAddress);
          while (true) {
            let result = await NFTContractInstance.methods.totalTokenCount().call()
              // eslint-disable-next-line no-loop-func
              .then((result) => {
                totalTokenCount = Number(result);
                setTotalNFTs(totalTokenCount);
                return true
              })
            .catch((err) => {
              return false
            });
            if (result) break
            await sleep(100)
          }

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
              cardItem.sellable = sellable
              cardItem.price = sellable ? Number(result.price) : 0;
              cardItem.stock = 6;
              cardItem.isOwner = false;

              if (result.assetType && result.assetType !== '') {
                cardItem.assetType = result.assetType
              } else {
                cardItem.assetType = await getAssetType(cardItem.assetURI)
              }
              if(sellable && result.sellPending && Number(result.price) > 0) cardItem.isOnSale = true
              else cardItem.isOnSale = false

              await NFTContractInstance.methods.ownerOf(id).call()
                .then((result) => {
                  if (result) {
                    if(walletAddress && walletAddress.toLowerCase() === result.toLowerCase()) cardItem.isOwner = true;
                    cardItem.tokenOwnerAddress = result.toLowerCase()
                    if (isBurned(result)) isBurnedNFT = true
                  }
                })
                .catch((err) => {
                  console.log(err)
                })
              if (!isBurnedNFT)
                return { result: true, data: cardItem };
              else return null
            })
            .catch((err) => {
              console.log(err.message)
              return { result: false, data: id }
            })
          }

          let failedIds = []
          let startId = 1
          let promises = []
          let endId = totalTokenCount > 50 ? 50 : totalTokenCount
          // if (endId > totalTokenCount) endId = totalNFTs + 1
          for(let id = startId; id <= endId; id++) {
            promises.push(getDefaultItem(id))
          }
          const fetchedItems = await Promise.all(promises);
          let nfts = fetchedItems.filter((item) => (item && item.result && item.data && item.data.id && !ignoreNFT.includes(item.data.id )))
          nfts = nfts.map((item) => item.data)
          nfts.sort(function(a,b){return a.id-b.id});
          nftsRef.current = nfts
          setCardItems(nfts)
          const failedItems = fetchedItems.filter((item) => item && !item.result)
          failedIds = failedItems.map((item) => item.data)
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
            const fetchedItems = await Promise.all(promises);
            let nfts = fetchedItems.filter((item) => (item && item.result && item.data && item.data.id && !ignoreNFT.includes(item.data.id )))
            nfts = nfts.map((item) => item.data)
            nfts.sort(function(a,b){return a.id-b.id});
            if (fetchIndexRef.current === fetchIndex) {
              setMoreItems(nfts)
              const failedItems = fetchedItems.filter((item) => item && !item.result)
              const newFailedIds = failedItems.map((item) => item.data)
              failedIds = [...failedIds, ...newFailedIds]
              startId += 200
            } else {
              break
            }
          }
          const timeoutHandler = setInterval(async () => {
              if (fetchIndexRef.current === fetchIndex && failedIds && failedIds.length > 0) {
                const fetchedItems = await Promise.all(failedIds.map((id) => getDefaultItem(id)))
                let nfts = fetchedItems.filter((item) => (item && item.result && item.data && item.data.id && !ignoreNFT.includes(item.data.id )))
                nfts = nfts.map((item) => item.data)
                setMoreItems(nfts)
                const failedItems = fetchedItems.filter((item) => item && !item.result)
                failedIds = failedItems.map((item) => item.data)
              } else {
                clearInterval(timeoutHandler)
              }
          }, 5000)
          stateRef.current = 'resolved'
        } else {    //about other collection
          const collectionContractInstance = getContractInstance(collectionContractABI, collectionAddress);
          const NFTContractInstance = getContractInstance(NFTContractABI, defaultCollectionAddress);
          let index = 0;
          let cardItemsCopy = [];
          // let onSaleIdAndPriceArr = []
          const _traits = []
          let _showRarity = false
          // const getNftIdFromSaleArray = async (id) => {
          //   for(let i = 0; i < 3; i ++) {
          //     const saleItem = await NFTContractInstance.methods.onSaleArray(id).call()
          //     .then(async (result) => {
          //       if(result.sellPending && result.collectionAddress.toLowerCase() === collectionAddress.toLowerCase()) {
          //         let price = 0
          //         while (true) {
          //           const tokenState = await NFTContractInstance.methods.otherTokenStatus(result.collectionAddress, result.id).call()
          //           .catch((err) => {
          //             return null
          //           });
          //           if (tokenState !== null) {
          //             price = tokenState.price
          //             break
          //           }
          //           sleep(10)
          //         }
          //         return {id: result.id, price}
          //       } else {
          //         return null
          //       }
          //     })
          //     .catch((error) => {
          //       return null
          //     })
          //     if (saleItem !== null) {
          //       return saleItem
          //     }
          //     sleep(100)
          //   }
          // }

          // const getSaleArray = async () => {
          //   let onSaleArrayLength = 0;
          //   while (true) {
          //     const result = await NFTContractInstance.methods.getOnSaleArrayLength().call()
          //       .catch((err) => {
          //         return null
          //       });
          //     if (result !== null) {
          //       onSaleArrayLength = result
          //       break
          //     }
          //     await sleep(10)
          //   }

          //   let salePromises = []
          //   for (let i = 0; i <= onSaleArrayLength; i++) {
          //     salePromises.push(getNftIdFromSaleArray(i))
          //   }
          //   let result = []
          //   try {
          //     result = await Promise.all(salePromises)
          //   } catch (er) {
          //   }
          //   onSaleIdAndPriceArr = result.filter((item) => item)
          // }

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
                    return true
                  })
                  .catch(async (err) => {
                    console.log(err)
                    return false
                  })
                if (isBurnedNFT) return { result: true, data: null }

                cardItem.token_uri = token_uri
                cardItem.collectionAddress = collectionAddress;
                cardItem.id = id;
                cardItem.likes = 0;
                cardItem.avatarImg = '1';
                cardItem.title = '';
                cardItem.price = 0;
                cardItem.stock = 6;
                cardItem.isOnSale = false
                return { result: true, data: cardItem}
              } else {
                return { result: true, data: null }
              }
            } catch (err) {
              return { result: false, data }
            }
          }
          const fetchMetadata = async (item) => {
            try {
              const cardItem = { ...item }
              let { id, token_uri, metadata: _metadata } = item

              // if (!isIpfs(token_uri)) {
              await collectionContractInstance.methods.tokenURI(id).call()
                .then((result) => {
                  if (result && result !== '') {
                    token_uri = result
                  }
                })
                .catch(() => {})
              // }

              let uri = token_uri

              let tokenURI = '';
              let metadata = null
              let isImage = false
              const ipfsSufix = getIPFSSufix(uri);
              let p = uri.indexOf('?')
              if (p !== -1) {
                const subStr = uri.slice(p, uri.length)
                if (!subStr.includes('?index='))
                  uri = uri.slice(0, p)
              }
              if (!_metadata) {
                if (collectionInfo?.ipfsUri && ipfsSufix === 'json') {
                  tokenURI = collectionInfo.ipfsUri + '/' + id + '.json'
                } else if (!isIpfs(uri) || isBase64(uri)) {
                  tokenURI = uri
                } else if (ipfsSufix === 'url') {
                  const p = token_uri.indexOf('?')
                  if (p !== -1) uri = token_uri.slice(0, p)
                  if (uri.includes('Qm') ) {
                    let p = uri.indexOf("Qm");
                    let locationQm = ""
                    if (p !== -1) locationQm = uri.substring(p)
                    tokenURI = 'https://operahouse.mypinata.cloud/ipfs/' + locationQm
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
                  tokenURI = getTokenURI(id, ipfsPrefix, ipfsSufix, involveId, subUri);
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
              cardItem.title = metadata?.name
              if (collectionInfo && collectionInfo.replacement && collectionInfo.replacementPrefix) {
                cardItem.assetURI = '/img/replacements/' + collectionInfo.replacementPrefix + id + collectionInfo.replacementSubfix;
                cardItem.assetType = await getAssetType(cardItem.assetURI)
              } else {
                if (isImage) {
                  cardItem.assetURI = getImageURI(tokenURI)
                  cardItem.assetType = await getAssetType(cardItem.assetURI)
                  cardItem.title = collectionInfo.name + ' ' + ("00" + id).slice(-3);
                } else if (metadata.image) {
                  cardItem.assetURI = getImageURI(metadata.image)
                  cardItem.assetType = await getAssetType(cardItem.assetURI)
                } else if (metadata.animation_url){
                  cardItem.assetURI = getImageURI(metadata.animation_url)
                  cardItem.assetType = await getAssetType(cardItem.assetURI)
                } else {
                  cardItem.assetURI = ''
                  cardItem.assetType = 'other'
                }
              }
              
              if (metadata) {
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
                if (sellable) {
                  await NFTContractInstance.methods.otherTokenStatus(collectionAddress, id).call()
                  .then(async (info) => {
                    if (info?.tokenOwner?.toLowerCase() !== cardItem?.tokenOwnerAddress?.toLowerCase() || !info?.sellPending || Number(info.price) === 0) {
                      cardItem.isOnSale = false
                    } else {
                      cardItem.price = Number(info.price);
                      cardItem.isOnSale = true;
                      cardItem.sellable = sellable
                    }
                    
                  })
                  // cardItem.sellable = true
                  // const idAndPrice = onSaleIdAndPriceArr.find((item) => item.id === id)
                  // if (idAndPrice) {
                  //   cardItem.isOnSale = true
                  //   cardItem.price = Number(idAndPrice.price)
                  // } else {
                  //   cardItem.isOnSale = false
                  // }
                }
              }
              setUpdateItem(cardItem)
              return true
            } catch (err) {
              console.log(err)
              return false
            }
          }

          let totalCount = 0
          const optionsFirst = { chain: "0xfa", address: collectionAddress, offset: index, limit: 1 }
          let resultFirst = null
          let failedItems = []
          // await collectionContractInstance.methods.totalSupply().call()
          //   .then((result) => {
          //     totalCount = result;
          //     setTotalNFTs(result);
          //   })
          // if (!totalCount) {
            while (true) {
              const result = await Web3Api.token.getAllTokenIds(optionsFirst)
                .catch((err) => {
                  return null
                })
              if (result !== null) {
                resultFirst = result
                break
              }
              await sleep(100)
            }
            if (resultFirst && resultFirst.result && resultFirst.result.length > 0) {
              const { total } = resultFirst;
              if (fetchIndexRef.current === fetchIndex)
                setTotalNFTs(Number(total));
              totalCount = total
            }

          index = totalCount - 50
          if (index < 0) index = 0
          const options = { chain: "0xfa", address: collectionAddress, offset: index, limit: 50 }
          const result = await Web3Api.token.getAllTokenIds(options)
          if (result && result.result && result.result.length > 0) {
            const { result: nfts, total } = result;
            if (!fetchIndexRef.current === fetchIndex) {
              return
            }
            const fetchedItems = await Promise.all(nfts.map((data) => fetchItemData(data)));
            let newNfts = fetchedItems.filter((item) => item && item.result && item.data)
            newNfts = newNfts.map((item) => item.data)
            newNfts.sort(function(a,b){return a.id-b.id});
            cardItemsCopy = newNfts;
            if (fetchIndexRef.current === fetchIndex) {
              nftsRef.current = cardItemsCopy
              setMoreItems(newNfts)
              // await getSaleArray()
              newNfts.map((item) => fetchMetadata(item))
              stateRef.current = 'pending'

              failedItems = fetchedItems.filter((item) => (item && !item.result))
            } else {
              return
            }
          }
          while (index > 0) {
            try {
              index -= 500
              let limit = 500
              if (index < 0) { limit += index; index = 0; }
              const options = { chain: "0xfa", address: collectionAddress, offset: index, limit }
              let result = null
              while (true) {
                result = await Web3Api.token.getAllTokenIds(options).catch((err) => null)
                if (result) break
                await sleep(100)
              }
              if (result && result.result && result.result.length > 0) {
                const { result: nfts } = result;
                const fetchedItems = await Promise.all(nfts.map((data) => fetchItemData(data)));
                let newNfts = fetchedItems.filter((item) => (item && item.result && item.data))
                newNfts = newNfts.map((item) => (item.data))
                newNfts.sort(function(a,b){return a.id-b.id});
                if (fetchIndexRef.current === fetchIndex) {
                  nftsRef.current = cardItemsCopy
                  setMoreItems(newNfts)
                  newNfts.map((item) => fetchMetadata(item))
                  const newFailedItems = fetchedItems.filter((item) => (item && !item.result))
                  failedItems = [...failedItems, ...newFailedItems]
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

          const timeoutHandler = setInterval(async () => {
            if (fetchIndexRef.current === fetchIndex) {
              const fetchedItems = await Promise.all(failedItems.map(async ({ data }) => {
                const item = await fetchItemData(data)
                return item
              }));
              if (failedItems.length === 0) {
                clearInterval(timeoutHandler)
                return
              }
              let newNfts = fetchedItems.filter((item) => (item && item.result && item.data))
              newNfts = newNfts.map((item) => (item.data))
              setMoreItems(newNfts)
              newNfts.map((item) => fetchMetadata(item))
              failedItems = fetchedItems.filter((item) => (item && !item.result))
            } else {
              clearInterval(timeoutHandler)
            }
          }, 5000)
        }
      }
    } catch (err) {
    }
  }, [chainId, collectionAddress, getCollectionInfo, getCollectionWithAddress, getContractInstance, walletAddress, Web3Api.token])

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
  }, [isInitialized, web3EnableError, isWeb3Enabled, auth, walletAddress, isWeb3EnableLoading, allCollections, collectionAddress])

  useEffect(() => {
    if (error || isLoading || !data) {
      setCardItemsWithNew(cardItems)
    } else {
      if (data.listItems.length) {
        const newItems = cardItems.map((cardItem) => {
          const { id } = cardItem
          const { listItems } = data
          const listItem = listItems.find(({ tokenId }) => (
            Number(tokenId) === Number(id)
          ))
          if (listItem && listItem.seller?.toLowerCase() === cardItem.tokenOwnerAddress?.toLowerCase()) {

            return {
              ...cardItem,
              ...listItem,
              id: listItem.tokenId,
              isOnSale: true,
              sellable: true,
              isNew: true,
            }
          } else {
            return cardItem
          }
        })
        console.log(newItems)
        setCardItemsWithNew(newItems)
      } else {
        setCardItemsWithNew(cardItems)
      }
    }
  }, [cardItems, data, error, isLoading])

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
              if (a.price < b.price) return 1
              else if (a.price > b.price) return -1
              else return 0
            })
          } else if (sort === 'low_price') {
            newItems.sort(function(a, b) {
              if (a.price > b.price) return 1
              else if (a.price < b.price) return -1
              else return 0
            })
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
                    <a href={collectionInfo.website} target="_blank" className="website-btn" style={{marginLeft: "0px", marginRight: "5px"}}><i className="ri-home-fill" /></a>
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
            <div className="text-center card_stats" style={{marginBottom: "90px"}}>
              <b>NFTs:</b> {totalNFTs} &nbsp;|&nbsp;
              &nbsp;<b>Total Volume:</b> {(Number(collectionInfo.totalVolume) / Math.pow(10, 18)).toFixed(2)} FTM &nbsp;|&nbsp;
              &nbsp;<b>Total Sales:</b> {collectionInfo.totalSales} &nbsp;|&nbsp;
              &nbsp;<b>Average Price:</b> {Number(collectionInfo.totalSales) !== 0 ? (Number(collectionInfo.totalVolume) / Number(collectionInfo.totalSales) / Math.pow(10, 18)).toFixed(2): 0} FTM &nbsp;|&nbsp;
              &nbsp;<b>Price Floor:</b> {collectionInfo.floor / Math.pow(10, 18)} FTM &nbsp;|&nbsp;
              &nbsp;<b>Last Sold For:</b> {collectionInfo.lastSale / Math.pow(10, 18)} FTM &nbsp;|&nbsp;
              &nbsp;<b>Last Sold:</b> {collectionInfo.lastSold}
              <br />
            </div>

          )}
          <div style={{display: 'inline-flex', flexWrap: 'wrap', marginTop:"-90px"}}>
          <Filter
            options={filterOptions}
            setOptions={(options) => setFilterOptions(options)}
            isCollection={true}
            isMarketplace={false}
            showRarity={showRarity}
          />
          {(collectionAddress && collectionAddress !== 'profile') && traits && <AttributeFilter traits={traits} filterOptions={traitFilterOptions} setFilterOptions={setTraitFilterOptions}/>}
          </div>
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
            /> 
          ))}
          </InfiniteScroll>
      </div>
    </div>
  );
}

export default React.memo(CardCollection);
