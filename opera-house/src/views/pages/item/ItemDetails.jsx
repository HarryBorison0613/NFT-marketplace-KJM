import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import Footer from '../../../components/footer/Footer';
import Header from '../../../components/header/Header';
import {Link} from 'react-router-dom';
import {Tab, Tabs, TabList, TabPanel} from 'react-tabs';
import {ToastContainer, toast} from 'react-toastify';
import useDocumentTitle from '../../../components/useDocumentTitle';
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';
import { useMoralis, useMoralisWeb3Api } from 'react-moralis';
import Web3 from 'web3';
import "@google/model-viewer";
import ReactThreeFbxViewer from 'react-three-fbx-for-pyt';
import {
  NFTContractABI, collectionContractABI, marketplaceABI, ERC20ABI, wFTMABI, ERC1155ABI
} from '../../../constant/contractABI';
import { config } from "../../../constant/config"
import { networkCollections } from "../../../constant/collections"
import { useContext } from 'react';
import NFTContext from '../../../context/NFTContext';
import MarketplaceContext from '../../../context/MarketplaceContext';
import axios from 'axios'
import Image from '../../../components/custom/Image';
import TextRender from '../../../components/Details/TextRender';
import paymentTokens from '../../../constant/paymentTokens'
import DropDownSelect from '../../../components/Details/DropDownSelect';
import useTokenCompare from '../../../hooks/useTokenCompare';
import { maxAuctionDay, maxListingDay } from '../../../constant/listingConfig';
import { getListItemDetail } from '../../../apis/marketplace';
import { getDateOrTime } from '../../../utils/common';
import { getItemData } from '../../../apis/nft';
import TokenPriceWithAmount from '../../../components/custom/TokenPriceWithAmount';

const defaultCollectionAddress = config.contractAddress;
const marketplaceAddress = config.marketplaceAddress;
const wFTMAddress = '0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83'
const address0 = "0x0000000000000000000000000000000000000000";

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
    if(uri.indexOf(".mp3") !== -1) return "audio";
    if(uri.indexOf(".png") !== -1) return "image";
    if(uri.indexOf(".jpeg") !== -1) return "image";
    if(uri.indexOf(".jpg") !== -1) return "image";
    if(uri.indexOf("image") !== -1) return "image";
    if(uri.indexOf(".gif") !== -1) return "image";
    if(uri.indexOf(".glb") !== -1) return "glb";
    if(uri.indexOf(".fbx") !== -1) return "fbx";
    return new Promise((resolve, reject) => {
      var xhr = new XMLHttpRequest();
      xhr.open('HEAD', uri, true);
      xhr.onload = function() {
        var contentType = xhr.getResponseHeader('Content-Type');
        if (contentType.match('video.*')) resolve('video')
        else if (contentType.match('image.*')) resolve('image')
        else if (contentType.match('text/html')) resolve('text')
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

const getAbbrWalletAddress = (walletAddress) => {
  let abbrWalletAddress = walletAddress?.substring(0, 4) + "..." + walletAddress?.substring(38, 42);
  return abbrWalletAddress?.toLowerCase();
}

const isIdInURI = (uri) => {
  let slashCount = 0;
  for(let i = 0; i < uri.length; i++) {
    if(uri[i] === "/") slashCount++;
  }

  console.log("slahsCount", slashCount);
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

const isBurned = (address) => {
  if (!address || address.toLowerCase() === '0x0000000000000000000000000000000000000001' || address.toLowerCase() === '0x000000000000000000000000000000000000dead') return true
  else return false
}

const ItemDetails = () => {
  const ref = useRef();
  const historyHook = useHistory();
  const { web3, enableWeb3, isWeb3Enabled, isAuthenticated, isInitialized, web3EnableError, chainId, auth, Moralis } = useMoralis()
  const { walletAddress, collections } = useContext(NFTContext)
  const { serviceFee } = useContext(MarketplaceContext)
  const [royalty, setRoyalty] = useState(0)
  const closeTooltip = () => ref.current.close();
  const [burnedNFT, setBurnedNFT] = useState(false)
  const [pending, setPending] = useState(false)
  const [like, setLike] = useState(false)
  const [likeNum, setLikeNum] = useState(0)
  const [isOwner, setIsOwner] = useState(false)
  const [seller, setSeller] = useState(null)
  const [ownedAmount, setOwnedAmount] = useState(0)
  const [userData, setUserData] = useState(null)
  const [confirmBurn, setConfirmBurn] = useState(false)
  const [tokenOwnerAddress, setTokenOwnerAddress] = useState("");
  const [collectionAddress, setCollectionAddress] = useState()
  const [contractType, setContractType] = useState(1)
  const [listType, setListType] = useState(1)
  const [amount, setAmount] = useState(1)
  const [metadata, setMetadata] = useState([]);
  const [isNewList, setIsNewList] = useState(false)
  const [sellable, setSellable] = useState()
  const [listPaymentToken, setListPaymentToken] = useState()
  const [sellPrice, setSellPrice] = useState();
  const [sellDay, setSellDay] = useState();
  const [auctionPrice, setAuctionPrice] = useState();
  const [auctionDay, setAuctionDay] = useState();
  const [restartPrice, setRestartPrice] = useState()
  const [restartDay, setRestartDay] = useState()
  const [bidPrice, setBidPrice] = useState();
  const [sellType, setSellType] = useState(true);
  const [sellAmount, setSellAmount] = useState(0)
  const [sellPaymentToken, setSellPaymentToken] = useState(paymentTokens[0]);
  const [auctionPaymentToken, setAuctionPaymentToken] = useState(paymentTokens[1]);
  const [buyPaymentToken, setBuyPaymentToken] = useState();
  const [restartPaymentToken, setRestartPaymentToken] = useState(paymentTokens[0]);
  const [itemPrice, setItemPrice] = useState(0);
  const [isOnSale, setIsOnSale] = useState(false);
  const [history, setHistory] = useState(null);
  const [bids, setBids] = useState()
  const [expireTimestamp, setExpireTimestamp] = useState()
  const [timeToLeft, setTimeToLeft] = useState()
  const [ended, setEnded] = useState()
  const [highestBidPrice, setHighestBidPrice] = useState(0)
  const [highestBid, setHighestBid] = useState()
  const [networkError, setNetworkError] = useState(false);
  const [openBuyModal, setOpenBuyModal] = useState(false)
  const [openSellModal, setOpenSellModal] = useState(false)
  const [approved, setApproved] = useState(false)
  const [buyAmount, setBuyAmount] = useState(1)
  const [nftApproved, setNftApproved] = useState(false)
  const [burnAmount, setBurnAmount] = useState(1)
  const [pendingBuyApprove, setPendingBuyApprove] = useState(false)
  const [pendingNFTApprove, setPendingNFTApprove] = useState(false)
  const { collectionAddress: collectionNameOrAddress, id } = useParams();
  const address0 = "0x0000000000000000000000000000000000000000";
  const Web3Api = useMoralisWeb3Api()
  const buyTokenAmount = useTokenCompare(listPaymentToken?.address, buyPaymentToken?.address, itemPrice)
  const isFTMList = listPaymentToken?.address === address0
  const [isMore, setMore] = useState(false);

  const toggleMore = () => {
    setMore(!isMore);
  };

  const getCollectionWithAddress = useCallback((address) => {
    for(let i = 0; i < collections.length; i++) {
      if(collections[i].address.toLowerCase() === address.toLowerCase()){
        return collections[i];
      }
    }
    return null;
  }, [collections])
  
  const getCollectionAddressWithName = useCallback((name) => {
    for(let i = 0; i < collections.length; i++) {
      if(collections[i].name.replaceAll(' ', '').toLowerCase() === name.replaceAll(' ', '').toLowerCase()){
        return collections[i].address;
      }
    }
    return null;
  }, [collections])
  
  const getCollectionOwner = useCallback((collectionAddress) => {
    for(let i = 0; i < collections.length; i++) {
      if(collections[i].address.toLowerCase() === collectionAddress.toLowerCase())
        return collections[i].collecionOwner;
    }
    return "";
  }, [collections])
  
  const getRoyalty = useCallback((collectionAddress) => {
    for(let i = 0; i < collections.length; i++) {
      if(collections[i].address.toLowerCase() === collectionAddress.toLowerCase())
        return collections[i].royalty / 100;
    }
    return "";
  }, [collections])

  const getName = useCallback((collectionAddress) => {
    for(let i = 0; i < collections.length; i++) {
      if(collections[i].address.toLowerCase() === collectionAddress.toLowerCase())
        return collections[i].name;
    }
    return "Not Listed";
  }, [collections])

  const getIPFSPrefix = useCallback((collectionAddress) => {
    for(let i = 0; i < collections.length; i++) {
      if(collections[i].address.toLowerCase() === collectionAddress.toLowerCase())
        return collections[i].prefix;
    }
    return "";
  }, [collections])

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

  const likeNft = useCallback(async () => {
    try {
      if (walletAddress && collectionAddress && id) {
        const Like = Moralis.Object.extend('LikeNFT')
        const query = new Moralis.Query(Like)
        query.equalTo('address', walletAddress.toLowerCase())
        query.equalTo('token_address', collectionAddress.toLowerCase())
        query.equalTo('token_id', id.toString())
        const likeObj = await query.first()
        if (!likeObj) {
          const likeObj = new Like()
          likeObj.set('address', walletAddress.toLowerCase())
          likeObj.set('token_address', collectionAddress.toLowerCase())
          likeObj.set('token_id', id.toString())
          await likeObj.save()
        }
        const countQuery = new Moralis.Query(Like)
        countQuery.equalTo('token_address', collectionAddress.toLowerCase())
        countQuery.equalTo('token_id', id.toString())
        const count = await countQuery.count()
        setLikeNum(count)
        setLike(true)
      }
      
    } catch (err) {
      console.log(err)
    }
  }, [Moralis.Object, Moralis.Query, collectionAddress, id, walletAddress])

  const unlikeNft = useCallback(async () => {
    try {
      if (walletAddress && collectionAddress && id) {
        const Like = Moralis.Object.extend('LikeNFT')
        const query = new Moralis.Query(Like)
        query.equalTo('address', walletAddress.toLowerCase())
        query.equalTo('token_address', collectionAddress.toLowerCase())
        query.equalTo('token_id', id.toString())
        const likeObj = await query.first()
        if (likeObj) {
          await likeObj.destroy()
        } else {
          console.log("don't exit")
        }
        const countQuery = new Moralis.Query(Like)
        countQuery.equalTo('token_address', collectionAddress.toLowerCase())
        countQuery.equalTo('token_id', id.toString())
        const count = await countQuery.count()
        setLikeNum(count)
        setLike(false)
      }
    } catch (err) {
      console.log('network error')
    }
  }, [Moralis.Object, Moralis.Query, collectionAddress, id, walletAddress])

  const handleApprove = useCallback(async () => {
    setPendingBuyApprove(true)
    let paymentTokenAddress = buyPaymentToken.address
    const paymentTokenInstance = getContractInstance(ERC20ABI, paymentTokenAddress);
    const allowance = await paymentTokenInstance.methods.allowance(walletAddress, marketplaceAddress).call()
        .catch(() => 0)
    if (Number(allowance) >= Number(buyTokenAmount)) {
      setApproved(true)
    } else {
      await paymentTokenInstance.methods.approve(marketplaceAddress, '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff').send({ from: walletAddress })
      .catch(err => {
        console.log(err)
      })
      let index = 0
      while (true) {
        await sleep(2000)
        const allowance = await paymentTokenInstance.methods.allowance(walletAddress, marketplaceAddress).call()
        if (Number(allowance) >= Number(buyTokenAmount)) {
          setApproved(true)
          break
        }
        index ++
        if (index > 5) break
      }
    }
    setPendingBuyApprove(false)
  }, [buyPaymentToken, buyTokenAmount, walletAddress, getContractInstance])

  const handleNFTApprove = useCallback(async () => {
    setPendingNFTApprove(true)
    try {
      const contractInstance = getContractInstance(collectionContractABI, collectionAddress);
      const isApproved = await contractInstance.methods.isApprovedForAll(walletAddress, marketplaceAddress).call()
          .catch(() => 0)
      if (isApproved) {
        setNftApproved(true)
      } else {
        await contractInstance.methods.setApprovalForAll(marketplaceAddress, true).send({ from: walletAddress })
        let index = 0
        while (true) {
          await sleep(2000)
          const isApproved = await contractInstance.methods.isApprovedForAll(walletAddress, marketplaceAddress).call()
          .catch(() => 0)
          if (isApproved) {
            setNftApproved(true)
            break
          }
          index ++
          if (index > 5) break
        }
      }
    } catch (err) {}
    setPendingNFTApprove(false)
  }, [getContractInstance, collectionAddress, walletAddress])

  const handleAcceptBid = useCallback(async () => {
    try {
      if (!highestBid) {
        toast.error('Do not have highest bidder')
        return
      }
      const { bidder, price } = highestBid
      if (!price) toast.error('You have no bids yet')
      setPending(true)
      const marketplaceInstance = getContractInstance(marketplaceABI, marketplaceAddress)
      let buyFunc = null
      let result = false
      buyFunc = marketplaceInstance.methods.acceptBid(collectionAddress, contractType, id, bidder, price)
      let errorMessage = ''
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
                setIsOnSale(false)
                setItemPrice(0)
                setHighestBidPrice(0)
                loopState = true
              }
            })
            .catch((err) => {
                console.log('get graphql err');
            });
          if (loopState) break
        }
      }
    } catch (err) {
      console.log(err)
    }
    setPending(false)
  }, [collectionAddress, contractType, getContractInstance, highestBid, id, walletAddress])

  const handleUpdateItem = React.useCallback(async (priceToUpdate, dayToUpdate) => {
    try {
      setPending(true)
      const marketplaceInstance = getContractInstance(marketplaceABI, marketplaceAddress)
      const paymentToken = listType ? restartPaymentToken : listPaymentToken
      // eslint-disable-next-line no-undef
      let price = BigInt(Number(priceToUpdate) * Math.pow(10, paymentToken.decimals)).toString()
      let date = Date.now()
      date += Number((!dayToUpdate || dayToUpdate ==='') ? 1 : Number(dayToUpdate)) * 8.64e+7 ;
      date = Math.round(date/1000)
      
      const updateFunc = marketplaceInstance.methods.updateListedToken(collectionAddress, id, price, 1, paymentToken?.address, listType, date)
      const estimateResult = await updateFunc.estimateGas(
        {
            from: walletAddress,
        }
      )
      .then(() => true)
      .catch((err) => false)

      if (estimateResult) {
        const result = await updateFunc.send({ from: walletAddress })
        .then(() => true)
        .catch(() => false)
        if (result) {
          while (true) {
            let loopState = false
            await sleep(2000)
            await getListItemDetail(collectionAddress, id)
              .then((res) => {
                if (res && res.listItems && res.listItems.length) {
                  const { tokenId, price, amount, listType, contractType, expireTimestamp } = res.listItems[0];
                  if (Number(amount) > 0 &&
                    Number(tokenId) === Number(id) &&
                    Number(date) === Number(expireTimestamp)
                  ) {
                    setIsOnSale(true)
                    if (listType) setItemPrice(price)
                    else {
                      setHighestBidPrice(price)
                      setExpireTimestamp(expireTimestamp)
                    }
                    setIsNewList(true)
                    setListType(listType)
                    setContractType(contractType)
                    loopState = true
                  }
                }
              })
              .catch((err) => {
                  console.log('get graphql err');
              });
            if (loopState) break
          }
        }
      }
      setPending(false)
    } catch(err) {
      console.log(err);
    }
  }, [collectionAddress, getContractInstance, id, listPaymentToken, listType, restartPaymentToken, walletAddress])

  const fetchData = useCallback(async () => {
    try {
      if(chainId && Number(chainId) !== 250) {
        setNetworkError(true);
      }
      let isBurnedNFT = false
      if (!collectionAddress) return
      const collectionInfo = getCollectionWithAddress(collectionAddress)
      let sellable = false
      if (collectionInfo) sellable = collectionInfo.sellable
      setSellable(sellable)
      const NFTContractInstance = getContractInstance(NFTContractABI, defaultCollectionAddress);
      let collectionContractInstance = getContractInstance(collectionContractABI, collectionAddress);
      let owner = null
      let isNewList = false

      await collectionContractInstance.methods.ownerOf(id).call()
        .then((result) => {
          owner = result.toLowerCase()
          if (isBurned(result)) {
            isBurnedNFT = true
          } else {
            setTokenOwnerAddress(owner);
          }
        })
        .catch((err) => {
            console.log('get token owner address err');
        });
      if (isBurnedNFT) {
        setBurnedNFT(true)
        return
      }

      await getListItemDetail(collectionAddress, id)
        .then((res) => {
          if (res && res.listItems && res.listItems.length) {
            const { tokenId, seller, price, amount, listType, paymentToken, contractType, expireTimestamp } = res.listItems[0];
            if (Number(amount) > 0 &&
              Number(tokenId) === Number(id) &&
              (seller.toLowerCase() === owner || contractType === 2)
            ) {
              const paymentTokenItem = paymentTokens.find(({ address }) => address.toLowerCase() === paymentToken.toLowerCase() )
              if (paymentToken) {
                setListPaymentToken(paymentTokenItem)
                setIsOnSale(true)
                if (listType) setItemPrice(price)
                else {
                  setHighestBidPrice(price)
                  setExpireTimestamp(expireTimestamp)
                }
                isNewList = true
                setIsNewList(true)
                setListType(listType)
                setContractType(contractType)
                setAmount(Number(amount))
              }
            }
          }
        })
        .catch((err) => {
            console.log('get graphql err');
        });
      const marketplaceInstance = getContractInstance(marketplaceABI, marketplaceAddress)
      marketplaceInstance.methods.getTokenHighestBid(collectionAddress, id).call()
        .then((result) => {
          const { price } = result
          if (Number(price) > 0) {
            setHighestBidPrice(price)
            setHighestBid(result)
          }
        })
      marketplaceInstance.methods.getTokenBids(collectionAddress, id).call()
        .then((bids) => {
          setBids(bids)
        })
      let royalty = 0

      if(collectionAddress.toLowerCase() === defaultCollectionAddress.toLowerCase()) {   //metadata default collection
        await NFTContractInstance.methods.getMetadata(id).call()
          .then((result) => {
              const name = getName(collectionAddress)
              setMetadata({...result, name});
              if (!isNewList) {
                if (sellable) {
                  setListPaymentToken(paymentTokens[0])
                  setListType(true)
                  setSellable(true)
                  setItemPrice(result.price);
                  setIsOnSale(result.sellPending);
                } else {
                  setSellable(false)
                }
              }
          })
          .catch((err) => {
              console.log('get Metadata err');
          });

        await NFTContractInstance.methods.getHistory(address0, id).call()
        .then((history) => {
          setHistory(history);
        })
        .catch((err) => {
            console.log('get Metadata err');
        });

      } else {    //metadata for other collection
        const itemData =  await getItemData(collectionAddress, id).catch(() => null)
        if (itemData) {
          const name = getName(collectionAddress)
          let { attributes } = itemData
          if (typeof attributes !== 'object') itemData.attributes = JSON.parse(attributes)
          setMetadata({ ...itemData, name })
        }
          let result = null
          
          const options = { address: collectionAddress, token_id: id, chain: '0xfa' }
          const data = await Web3Api.token.getTokenIdMetadata(options)
          .catch(async () => {
            return null
          })

          if (data) {
            const { token_uri, owner_of } = data
            if (!owner && owner_of) owner = owner_of
            result = token_uri
            if (isBurned(owner)) {
              setBurnedNFT(true)
              return
            }
          }

          await collectionContractInstance.methods.tokenURI(id).call()
            .then((res) => {
              result = res
            })
            .catch(async (err) => {
              try {
                let res = await collectionContractInstance.methods.uri(id).call()
                if (res.includes('{id}')) {
                  res = res.replace('{id}', id.toString())
                }
                result = res
              } catch {}
            });

          

          let ipfsPrefix = getIPFSPrefix(collectionAddress);
          let ipfsSufix = "";
          var tokenURI = "";

          let uri = result
          ipfsSufix = getIPFSSufix(uri);
          if (!isIpfs(uri) || isBase64(uri)) {
            tokenURI = uri
          }
          else if (ipfsSufix === 'url') {
            if (uri.includes('ipfs') && uri.includes('Qm') ) {
              let p = result.indexOf('?')
              if (p !== -1) uri = result.slice(0, p)
              p = uri.indexOf("Qm");
              let locationQm = ""
              if (p !== -1) locationQm = uri.substring(p)
              tokenURI = 'https://operahouse.mypinata.cloud/ipfs/' + locationQm
            } else {
              tokenURI = uri
            }
          } else {
            let p = result.indexOf('?')
            if (p !== -1) uri = result.slice(0, p)
            let involveId = isIdInURI(uri);
            let ipfsPos = uri.lastIndexOf('ipfs')
            let subUri = uri.substring(ipfsPos + 4)
            while (subUri && subUri.length > 0) {
              const firstCharacter = subUri[0]
              if (!firstCharacter.match(/[a-z]/i)) subUri = subUri.substring(1)
              else break
            }
            tokenURI = getTokenURI(id, ipfsPrefix, ipfsSufix, involveId, subUri);
          }

          let response = null;
          let metadata = {};

          const assetType = await getAssetType(tokenURI)

          try {
            if (assetType === 'other') {
              response = await fetch(tokenURI)
              const responseText = await response.text()
              const regex = /\,(?!\s*?[\{\[\"\'\w])/g;
              const correct = responseText.replace(regex, '');
              metadata = JSON.parse(correct)
            }
            let metadataCopy = metadata;
            if (metadata.attributes) metadataCopy.attributes = metadata.attributes;
            let title = metadata?.name
            let assetURI = metadata?.image
            let animation_url = metadata?.animation_url
            let glb = metadata?.glb
            let fbx = metadata?.fbx
            if (metadata?.type === 'object' && metadata?.properties) {
              title = metadata?.properties?.name?.description
              assetURI = metadata?.properties?.image?.description
            }
            metadataCopy.title = title
            if (assetType !== 'other') {
              metadataCopy.assetURI = getImageURI(tokenURI)
              metadataCopy.assetType = await getAssetType(metadataCopy.assetURI)
              metadataCopy.title = (collectionInfo?.name ?? '') + ' ' + ("00" + id).slice(-3);
            } else if (animation_url){
              const url = getImageURI(animation_url);
              const url_type = await getAssetType(url)
              if (url_type === 'audio') {
                metadataCopy.assetURI = getImageURI(animation_url);
                metadataCopy.assetType = await getAssetType(metadataCopy.assetURI)
                metadataCopy.audioURI = url
              } else {
                metadataCopy.assetURI = url
                metadataCopy.assetType = url_type
              }
            } else if (glb){
              const url = getImageURI(glb);
              const url_type = await getAssetType(url)
              if (url_type === 'audio') {
                metadataCopy.assetURI = getImageURI(glb);
                metadataCopy.assetType = await getAssetType(metadataCopy.assetURI)
                metadataCopy.audioURI = url
              } else {
                metadataCopy.assetURI = url
                metadataCopy.assetType = url_type
              }
            } else if (fbx){
              const url = getImageURI(fbx);
              const url_type = await getAssetType(url)
              if (url_type === 'audio') {
                metadataCopy.assetURI = getImageURI(fbx);
                metadataCopy.assetType = await getAssetType(metadataCopy.assetURI)
                metadataCopy.audioURI = url
              } else {
                metadataCopy.assetURI = url
                metadataCopy.assetType = 'fbx'
              }
            } else if (assetURI) {
              metadataCopy.assetURI = getImageURI(assetURI);
              metadataCopy.assetType = await getAssetType(metadataCopy.assetURI)
            } else {
              metadataCopy.assetURI = ''
              metadataCopy.assetType = 'other'
            }
            
            

            metadataCopy.name = getName(collectionAddress);
            if (metadata && !itemData?.attribute) {
              const { attributes } = metadata
              if (attributes) {
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
                  metadataCopy.rarityScore = Number((rarityAttrs.length / sum).toFixed(2))
                }
              }
            }

            setMetadata({...itemData, ...metadataCopy });
          } catch (err){
            console.log(err);
          }
        // }

        await NFTContractInstance.methods.getHistory(collectionAddress, id).call()
        .then((history) => {
          setHistory(history);
        })
        .catch((err) => {
          console.log(err.message)
        });
      }

      // NFTContractInstance = getContractInstance(NFTContractABI, defaultCollectionAddress);
      if(!isNewList && collectionAddress.toLowerCase() !== defaultCollectionAddress.toLowerCase()) {
        await NFTContractInstance.methods.otherTokenStatus(collectionAddress, id).call()
        .then((result) => {
          if (result.sellPending) {
            const { tokenOwner } = result
            if (tokenOwner && tokenOwner?.toLowerCase() === owner?.toLowerCase()) {
              setItemPrice(result.price);
              setListPaymentToken(paymentTokens[0])
              setListType(true)
              setIsOnSale(true);
              royalty = getRoyalty(collectionAddress) * 1000;
              setRoyalty(royalty)
            }
          } else {
            setItemPrice("");
            setIsOnSale(false);
          }
        })
        .catch((err) => {
          console.log(err);
        });
      }
      let royaltyInfo = null
      if (!royalty) {
        try {
          let [_ , _royalty] = await marketplaceInstance.methods.royaltyFromERC2981(collectionAddress, id, 1000).call().catch(() => 0)
          royaltyInfo.feeFraction = _royalty
        } catch (err) {
          console.log(err)
        }
        if (!royaltyInfo) {
          royaltyInfo = await marketplaceInstance.methods.royalty(collectionAddress).call().catch(() => 0)
        }
        setRoyalty(royaltyInfo?.feeFraction)
      }
    } catch (err) {

    }
  }, [chainId, collectionAddress, getCollectionWithAddress, getContractInstance, id, getName, Web3Api.token, getIPFSPrefix, getRoyalty])
  
  const handleBuyToken = React.useCallback(async () => {
    if (isNewList) {
      setPending(true)
      // remove from new marketplace
      try {
        const marketplaceInstance = getContractInstance(marketplaceABI, marketplaceAddress)
        let buyFunc = null
        let result = false
        if (buyPaymentToken?.address === address0 && listPaymentToken?.address === address0) {
          if (contractType !== 2) {
            buyFunc = marketplaceInstance.methods.buyTokenWithETH(collectionAddress, id, 1)
          } else {
            buyFunc = marketplaceInstance.methods.buyTokenWithETH(collectionAddress, id, buyAmount)
          }
          const estimateResult = await buyFunc.estimateGas(
            {
                from: walletAddress,
                value: itemPrice
            }
          )
          .then(() => true)
          .catch((err) => {
            console.log(err)
            return false
          })
          if (estimateResult) {
            result = await buyFunc.send({ from: walletAddress, value: itemPrice }).then(() => true).catch(() => false)
          }
        } else {
          const fromToken = buyPaymentToken?.address === address0 ? wFTMAddress : buyPaymentToken?.address
          const erc20Instance = getContractInstance(ERC20ABI, fromToken)
          const balance = await erc20Instance.methods.balanceOf(walletAddress).call()
          if (Number(balance >= Number(buyTokenAmount))) {
            if (contractType !== 2) {
              buyFunc = marketplaceInstance.methods.buyTokenWithTokens(collectionAddress, id, 1, fromToken, buyTokenAmount)
            } else {
              buyFunc = marketplaceInstance.methods.buyTokenWithTokens(collectionAddress, id, buyAmount, fromToken, buyTokenAmount)
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
            await sleep(3000)
            await marketplaceInstance.methods.getTokenListing(collectionAddress, id).call()
            .then((result) => {
              if (result?.tokenId === '0') {
                loopState = true
                setIsOnSale(false)
              }
            })
            .catch((err) => {
                console.log('get Metadata err');
            });
            if (loopState) break
          }
        }
      } catch (err) {
        console.log(err)
      }
      setPending(false)
    } else {
      const NFTContractInstance = getContractInstance(NFTContractABI, defaultCollectionAddress);
      setPending(true)
      if(collectionAddress.toLowerCase() === defaultCollectionAddress.toLowerCase()) {   //default collection NFT buy
        let value = (metadata.price).toString();
        try{
          await NFTContractInstance.methods.transfer(tokenOwnerAddress, id).send({ from: walletAddress, value: value });
          while (true) {
            let loopState = false
            await sleep(3000)
            await NFTContractInstance.methods.ownerOf(id).call()
            .then((result) => {
              if (result && result.toLowerCase() === walletAddress.toLowerCase()) {
                loopState = true
                setIsOnSale(false)
                setTokenOwnerAddress(result.toLowerCase())
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

        await NFTContractInstance.methods.otherTokenStatus(collectionAddress, id).call()
        .then((result) => {
          // eslint-disable-next-line no-undef
          value = BigInt(result.price).toString();
        })
        .catch((err) => {
        });

        if(value !== 0) {
          let collectionOwner = getCollectionOwner(collectionAddress);
          let Royalty = getRoyalty(collectionAddress) * 1000;
          try{
            await NFTContractInstance.methods.transferOther(tokenOwnerAddress, collectionAddress, id, collectionOwner, Royalty).send({ from: walletAddress, value: value });
            const collectionContractInstance = getContractInstance(collectionContractABI, collectionAddress);
            while (true) {
              let loopState = false
              await sleep(3000)
              await collectionContractInstance.methods.ownerOf(id).call()
              .then((result) => {
                if (result && result.toLowerCase() === walletAddress.toLowerCase()) {
                  loopState = true
                  setIsOnSale(false)
                  setSellPrice(0)
                  setPending(false)
                  setTokenOwnerAddress(result.toLowerCase())
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
      setPending(false)
    }
  }, [isNewList, getContractInstance, buyPaymentToken, listPaymentToken, contractType, walletAddress, itemPrice, collectionAddress, id, buyAmount, buyTokenAmount, metadata, tokenOwnerAddress, getCollectionOwner, getRoyalty])

  const handlePlaceBid = useCallback(async () => {
    try {
      setPending(true)
      // if (!bidPrice || bidPrice < highestBidPrice + 1) {
      //   setPending(false)
      //   toast.error('Wrong bid price')
      //   return
      // }
      let paymentTokenAddress = listPaymentToken.address
      let decimals = listPaymentToken.decimals
      let price = Number(bidPrice) * Math.pow(10, decimals)
      if (paymentTokenAddress === address0) {
        paymentTokenAddress = '0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83' // WFTM
        decimals = 18
        price = Number(bidPrice) * Math.pow(10, decimals)
        const wFTMInstance =  getContractInstance(wFTMABI, paymentTokenAddress);
        const wFTMBalance = await wFTMInstance.methods.balanceOf(walletAddress).call()
        if (Number(wFTMBalance) < price) {
          await wFTMInstance.methods.deposit().send({ from: walletAddress, value: price.toString() })
        }
      }
      price = Number(bidPrice) * Math.pow(10, decimals)
      const paymentTokenInstance = getContractInstance(ERC20ABI, paymentTokenAddress);
      let isApproved = false;
      const allowance = await paymentTokenInstance.methods.allowance(walletAddress, marketplaceAddress).call()
        .catch(() => 0)
      if (Number(allowance) >= price) isApproved = true
      if (!isApproved) {
        await paymentTokenInstance.methods.approve(marketplaceAddress, '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff').send({ from: walletAddress })
        let index = 0
        while (true) {
          await sleep(3000)
          const allowance = await paymentTokenInstance.methods.allowance(walletAddress, marketplaceAddress).call()
          if (Number(allowance) >= price) {
            isApproved = true
            break
          }
          index ++
          if (index > 5) break
        }
      }
      if (isApproved) {
        const marketplaceInstance = getContractInstance(marketplaceABI, marketplaceAddress)
        
        const bidFunc = marketplaceInstance.methods.enterBid(
          collectionAddress,
          id,
          // eslint-disable-next-line no-undef
          BigInt(price).toString()
        )
        await bidFunc.estimateGas(
          {
              from: walletAddress,
          }
        )
        await bidFunc.send({ from: walletAddress })
      }
    } catch (err) {
      if (err?.message?.includes('Insurance money or not approved')) toast.error('Insurance money or not approved')
      else console.log(err)
    }
    setPending(false)
  }, [bidPrice, collectionAddress, getContractInstance, id, listPaymentToken, walletAddress])

  const handleSetSellPending = useCallback(async (e) => {
    e.preventDefault();
    setPending(true)
    const collectionContractInstance = getContractInstance(collectionContractABI, collectionAddress);
    const marketplaceInstance = getContractInstance(marketplaceABI, marketplaceAddress);
    try{
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
            isApproved = true
            break
          }
        }
      }
      const listPrice = sellType ? sellPrice : auctionPrice
      const paymentToken = sellType? sellPaymentToken : auctionPaymentToken
      // eslint-disable-next-line no-undef
      let price = BigInt(Number(listPrice) * Math.pow(10, paymentToken.decimals)).toString();
      let date = 0
      if (!sellType) {
        date = Date.now()
        date += Number((!auctionDay || auctionDay ==='') ? 1 : Number(auctionDay)) * 8.64e+7 ;
        date = Math.round(date/1000)
      }
      const tokenAddress = paymentToken.address
      let listFunc = null
      if (contractType === 1) {
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
          await marketplaceInstance.methods.getTokenListing(collectionAddress, id).call()
          .then((result) => {
            if (result) {
              const { tokenId, seller, price, amount, listType, paymentToken } = result;
              if (Number(amount) > 0 &&
                Number(tokenId) === Number(id)
              ) {
                const paymentTokenItem = paymentTokens.find(({ address }) => address.toLowerCase() === paymentToken.toLowerCase() )
                if (paymentToken) {
                  setListPaymentToken(paymentTokenItem)
                  setIsOnSale(true)
                  setItemPrice(price)
                  setIsNewList(true)
                  setListType(listType)
                  setTokenOwnerAddress(seller)
                  loopState = true
                }
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
    setPending(false)
  }, [auctionDay, auctionPaymentToken, auctionPrice, collectionAddress, contractType, getContractInstance, id, sellAmount, sellPaymentToken, sellPrice, sellType, walletAddress])

  const handleRemoveSellPendingOther = useCallback(async () => {
    const NFTContractInstance = getContractInstance(NFTContractABI, defaultCollectionAddress);
    setPending(true)
    try{
      await NFTContractInstance.methods.removeSellPendingOther(collectionAddress, id, walletAddress).send({ from: walletAddress });
      while (true) {
        console.log('loop')
        let loopState = false
        await sleep(3000)
        await NFTContractInstance.methods.otherTokenStatus(collectionAddress, id).call()
          .then((result) => {
            if (result.sellPending) {
              setItemPrice(result.price);
              setIsOnSale(true);
            } else {
              loopState = true
              setItemPrice("");
              setIsOnSale(false);
            }
          })
          .catch((err) => {
            console.log(err);
          });
        if (loopState) {
          break
        }
      }
    } catch(err) {
      console.log(err);
    }
    setPending(false)
  }, [collectionAddress, getContractInstance, id, walletAddress])

  const handleDelist = useCallback(async () => {
    setPending(true)
    try {
      const marketplaceInstance = getContractInstance(marketplaceABI, marketplaceAddress)
      await marketplaceInstance.methods.delistToken(
        collectionAddress,
        id,
        1
      ).send({ from: walletAddress })
      while (true) {
        let loopState = false
        await sleep(3000)
        await marketplaceInstance.methods.getTokenListing(collectionAddress, id).call()
          .then((result) => {
            if (result) {
              const { amount } = result;
              if (Number(amount) === 0) {
                setIsOnSale(false)
                setItemPrice(0)
                loopState = true
              }
            }
          })
          .catch((err) => {
            console.log(err);
          });
        if (loopState) {
          break
        }
      }
    } catch (error) {
      console.log(error)
    }
    setPending(false)
  }, [collectionAddress, getContractInstance, id, walletAddress])

  const handleRemoveSellPending = useCallback(async (e) => {
    e.preventDefault();
    if (isNewList) {
      handleDelist()
      return
    }
    if(collectionAddress.toLowerCase() !== defaultCollectionAddress.toLowerCase()) {
      handleRemoveSellPendingOther();
      return;
    }
    const NFTContractInstance = getContractInstance(NFTContractABI, collectionAddress);
    setPending(true)
    try{
      let Price = 0;
      await NFTContractInstance.methods.setSellPending(id, false, Price).send({ from: walletAddress });
      while (true) {
        let loopState = false
        await sleep(3000)
        await NFTContractInstance.methods.getMetadata(id).call()
        .then((result) => {
          if (!result.sellPending) {
            const name = getName(collectionAddress);
            setMetadata({...result, name});
            setItemPrice(0);
            setIsOnSale(result.sellPending);
            loopState = true
          }
        })
        .catch((err) => {
            console.log('get Metadata err');
        });
        if (loopState) {
          setPending(false)
          break
        }
      }
    } catch(err) {
      console.log(err);
    }
    setPending(false)
  }, [isNewList, collectionAddress, getContractInstance, handleDelist, handleRemoveSellPendingOther, id, walletAddress, getName])

  const handleBurnNFT = useCallback(async (e) => {
    e.preventDefault();
    let to = '0x000000000000000000000000000000000000dEaD'
    let abi = null
    if(collectionAddress.toLowerCase() === defaultCollectionAddress.toLowerCase()) {
      abi = NFTContractABI
    } else if (contractType === 1){
      abi = collectionContractABI
    } else {
      abi = ERC1155ABI
    }
    let collectionContractInstance = getContractInstance(abi, collectionAddress)
    setPending(true)
    try{
      if (contractType === 2) {
        await collectionContractInstance.methods.safeTransferFrom(walletAddress, to, id, burnAmount, []).send({ from: walletAddress })
        while (true) {
          let loopState = false
          await sleep(2000)
          await collectionContractInstance.methods.balanceOf(walletAddress, id).call()
          .then((result) => {
            if (Number(result) < ownedAmount) {
              window.location.reload();
            }
          })
          .catch((err) => {
              console.log('get Metadata err');
          });
          if (loopState) {
            setTokenOwnerAddress('0x000000000000000000000000000000000000dEaD')
            setBurnedNFT(true)
            break
          }
        }
      } else {
        await collectionContractInstance.methods.safeTransferFrom(walletAddress, to, id).send({ from: walletAddress })
        while (true) {
          let loopState = false
          await sleep(3000)
          await collectionContractInstance.methods.ownerOf(id).call()
          .then((result) => {
            if (isBurned(result)) {
              loopState = true
            }
          })
          .catch((err) => {
              console.log('get Metadata err');
          });
          if (loopState) {
            setTokenOwnerAddress('0x000000000000000000000000000000000000dEaD')
            setBurnedNFT(true)
            break
          }
        }
      }
    } catch(err) {
      console.log(err);
    }
    setPending(false)
  }, [burnAmount, collectionAddress, contractType, getContractInstance, id, ownedAmount, walletAddress])

  useEffect(() => {
    if (collectionNameOrAddress) {
      if (checkAddress(collectionNameOrAddress)) {
        setCollectionAddress(collectionNameOrAddress)
      } else {
        const address = getCollectionAddressWithName(collectionNameOrAddress)
        if (address) setCollectionAddress(address)
      }
    }
  }, [collectionNameOrAddress, getCollectionAddressWithName])

  
  useEffect(() => {
    if (collectionAddress && (id !== null || id !== undefined) && contractType) {
      (async () => {
        if (contractType === 1) {
          let tokenOwnerAddress = null
          if (!tokenOwnerAddress) {
            const collectionContractInstance = getContractInstance(collectionContractABI, collectionAddress);
            await collectionContractInstance.methods.ownerOf(id).call()
              .then((result) => {
                if (result) {
                  tokenOwnerAddress = result.toLowerCase()
                }
              })
              .catch(async (err) => {
                console.log(err)
              })
          } else {
            tokenOwnerAddress = tokenOwnerAddress?.toLowerCase()
          }
          setTokenOwnerAddress(tokenOwnerAddress)
        } else {
          const options = { address: collectionAddress, token_id: id, chain: '0xfa' }
          const data = await Web3Api.token.getTokenIdOwners(options)
          if (data?.result?.length) {
            const owners = []
            data?.result.forEach(({ owner_of }) => {
              if (!owners.includes(owner_of?.toLowerCase())) {
                owners.push(owner_of?.toLowerCase())
              }
            })
            if (owners?.length > 1) {
              setTokenOwnerAddress('Multi')
            } else if (owners?.length === 1) {
              setTokenOwnerAddress(owners[0])
            } else {
              setTokenOwnerAddress('')
            }
          }
        }
      }) ()
    }
  }, [collectionAddress, id, tokenOwnerAddress, getContractInstance, contractType, Web3Api.token])


  useEffect(() => {
    if (isInitialized && walletAddress && collectionAddress && id) {
      (async () => {
        try {
          const Like = Moralis.Object.extend('LikeNFT')
          const query = new Moralis.Query(Like)
          query.equalTo('address', walletAddress.toLowerCase())
          query.equalTo('token_address', collectionAddress.toLowerCase())
          query.equalTo('token_id', id.toString())
          const response = await query.first()
          if (response) setLike(true)
          else setLike(false)

          const countQuery = new Moralis.Query(Like)
          countQuery.equalTo('token_address', collectionAddress.toLowerCase())
          countQuery.equalTo('token_id', id.toString())
          const count = await countQuery.count()
          setLikeNum(count)

        } catch (err) {
          console.log(err)
        }
      }) ()
    }
  }, [Moralis.Object, Moralis.Query, collectionAddress, id, isInitialized, walletAddress])

  React.useEffect(() => {
    if (isInitialized) {
      if (web3EnableError)
        fetchData()
      else {
        if (isWeb3Enabled) {
          if (auth) {
            const { state } = auth
            if (state === 'logging_out' || state === 'error' || state === 'unauthenticated' || state === 'authenticated') {
              fetchData()
            }
          }
        }
      }
    }
  }, [isInitialized, walletAddress, id, isWeb3Enabled, chainId, collectionAddress, web3EnableError, auth, collections]);

  React.useEffect(() => {
    if (tokenOwnerAddress && tokenOwnerAddress !== '') {
      Moralis.Cloud.run('userDataByAddress', {address: tokenOwnerAddress})
      .then((res) => {
        setUserData(res)
      })
      .catch(() => {
      })
    }
  }, [Moralis.Cloud, Moralis.Object, Moralis.Query, tokenOwnerAddress])

  useEffect(() => {
    let timer = null
    if (expireTimestamp) {
      const result = getDateOrTime(Number(expireTimestamp))
      const { type, data } = result
      setTimeToLeft(data)
      if (type === 'end') {
        setEnded(true)
        setTimeToLeft('Ended')
      } else if (type === 'second') {
        setEnded(false)
        timer = setInterval(() => {
          const { data, type } = getDateOrTime(Number(expireTimestamp))
          if (type === 'end') {
            setEnded(true)
            setTimeToLeft('Ended')
          } else {
          setTimeToLeft(data)
          }
        }, 1000)
      } else {
        setEnded(false)
        timer = setInterval(() => {
          const { data, type } = getDateOrTime(Number(expireTimestamp))
          if (type === 'end') {
            setEnded(true)
            setTimeToLeft('Ended')
          } else {
          setTimeToLeft(data)
          }
        }, 60000)
      }
    }
    return () => {
      if (timer) {
        clearInterval(timer)
      }
    }
  }, [expireTimestamp])

  useEffect(() => {
    setBuyPaymentToken(listPaymentToken)
  }, [listPaymentToken])

  useEffect(() => {
    if (isOwner && listPaymentToken) {
      if (listType === true && itemPrice) {
        setRestartPrice(Number(itemPrice) / Math.pow(10, listPaymentToken?.decimals ?? 18))
        setRestartPaymentToken(listPaymentToken)
      }
      if (listType === false && highestBidPrice) setRestartPrice(Number(highestBidPrice) / Math.pow(10, listPaymentToken?.decimals ?? 18))
    }
  }, [listPaymentToken, itemPrice, listType, isOwner, highestBidPrice])

  useEffect(() => {
    if (collectionAddress && (id !== null || id !== undefined)) {
      const collectionContractInstance = getContractInstance(collectionContractABI, collectionAddress);
      collectionContractInstance.methods.supportsInterface('0xd9b67a26').call()
        .then((result) => {
          if (result) {
            setContractType(2)
          } else {
            setContractType(1)
          }
        })
        .catch(async (err) => {
          setContractType(1)
        })
    }
  }, [collectionAddress, getContractInstance, id])

  useEffect(() => {
    if (collectionAddress && walletAddress)  {
      if (tokenOwnerAddress !== 'Multi') {
        if (walletAddress?.toLowerCase() === tokenOwnerAddress) {
          setIsOwner(true)
        } else {
          setIsOwner(false)
        }
        const contractInstance = getContractInstance(collectionContractABI, collectionAddress);
        contractInstance.methods.isApprovedForAll(walletAddress, marketplaceAddress).call()
          .then((isApproved) => {
            if (isApproved) setNftApproved(true)
          })
          .catch((err) => {})
      } else {
        const contractInstance = getContractInstance(ERC1155ABI, collectionAddress);
        contractInstance.methods.balanceOf(walletAddress, id).call()
          .then((result) => {
            if (Number(result)) {
              setIsOwner(true)
              setOwnedAmount(result)
            } else {
              setIsOwner(false)
              setOwnedAmount(0)
            }
          })
          .catch((err) => {
            setIsOwner(false)
            setOwnedAmount(0)
          })
      }
    }
  }, [collectionAddress, getContractInstance, id, tokenOwnerAddress, walletAddress])

  useEffect(() => {
    if (walletAddress && buyPaymentToken) {
      if (!buyPaymentToken || buyPaymentToken.address === address0) {
        setApproved(true)
      } else {
        const paymentTokenInstance = getContractInstance(ERC20ABI, buyPaymentToken.address);
        paymentTokenInstance.methods.allowance(walletAddress, marketplaceAddress).call()
          .then((allowance) => {
            if (Number(allowance) >= Number(buyTokenAmount)) {
              setApproved(true)
            } else {
              setApproved(false)
            }
          })
          .catch(() => 0)
      }
    }
  }, [buyPaymentToken, buyTokenAmount, getContractInstance, openBuyModal, walletAddress])

  useEffect(() => {
    if (collectionAddress && walletAddress && walletAddress?.toLowerCase() === tokenOwnerAddress)  {
      const contractInstance = getContractInstance(collectionContractABI, collectionAddress);
      contractInstance.methods.isApprovedForAll(walletAddress, marketplaceAddress).call()
        .then((isApproved) => {
          if (isApproved) setNftApproved(true)
        })
        .catch((err) => {})
    }
  }, [collectionAddress, getContractInstance, tokenOwnerAddress, walletAddress])

  useDocumentTitle('Item Details');

  return (
    <>
    <div style={{flexGrow: 1}}>
      <Header />
      <ToastContainer position="top-right" />
      <div className="container">
        <Link to={`/marketplace`} className="btn btn-white btn-sm my-40">
          Browse Marketplace
        </Link>
        <div className="item_details">
          <div className="row sm:space-y-20">
            { burnedNFT ? (
              <div style={{textAlign: 'center'}}>This NFT has been burned.</div>
            ) : (
            <>
              <div className="col-lg-6">
                {/* <img
                    className="item_img"
                    src={metadata.assetURI}
                    alt="ImgPreview"
                    style={{width: "100%", height: "auto", maxWidth: "500px", maxHeight: "500px"}}
                  /> */}
                {metadata.assetType === "image" && (
                  <Image
                    className="item_img"
                    src={metadata.assetURI}
                    alt="ImgPreview"
                    style={{height: "auto", width: "100%", borderRadius: "30px"}}
                  />
                )}
                {metadata.assetType === "other" && (
                  <img
                    className="item_img"
                    src={metadata.assetURI}
                    alt="ImgPreview"
                    style={{height: "auto", width: "100%", borderRadius: "30px"}}
                  />
                )}
                {metadata.assetType === "video" && (
                  <div className="video_card">
                  <video
                    style={{height: "auto", width: "100%", borderRadius: "30px"}}
                    controls
                    loop muted autoPlay playsInline
                  >
                    <source src={metadata.assetURI} id="video_here" />
                    Your browser does not support HTML5 video.
                  </video>
                  </div>
                )}
                {metadata.audioURI && (
                  <audio
                    autoPlay playsInline
                  >
                    <source src={metadata.audioURI} id="audio_here" type="audio/mpeg"/>
                  </audio>
                )}
                {metadata.assetType === "glb" && (
                  <div className="video_card">
                  <model-viewer  autoplay camera-controls style={{width: '100%', height: 500}}
                    modes="webxr scene-viewer"
                    src={metadata.assetURI}
                  >
                  </model-viewer>
                  </div>
                )}
                {metadata.assetType === "fbx" && (
                  <div className="video_card" style={{display: 'flex', justifyContent: 'center', overflow: 'hidden' }}>
                    <ReactThreeFbxViewer url={metadata.assetURI} 
                      height="500"
                      width="700"
                      style={{width: '100%', height: 1000}}
                      cameraPosition = {
                        {x: 500, y: 500, z: 500}
                      }
                      near={10}
                      far={10000}
                    />
                  </div>
                )}
                {metadata.assetType === "text" && (
                  <TextRender url={metadata.assetURI} />
                )}
              </div>
              <div className="col-lg-6">
                <div className="space-y-20">
                  <h3>{metadata.title}</h3>
                  <Link to={`/collection/${collectionAddress}`}>
                   <p>
                     {metadata.name}
                      </p>
                   </Link>
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
                          <p style={{fontWeight: "400", fontSize: "10pt"}}>
                            {metadata.description}
                          </p>

                        </TabPanel>
                        <TabPanel className="active">
                          {!metadata.attributes && (
                            <p style={{ fontWeight: "400"}}>
                              This NFT has no attributes.
                            </p>
                          )}
                          {metadata.attributes && (
                            metadata.attributes.map((attribute, i) => (
                              <p key={(attribute && attribute.type) ? attribute.type: i} style={{fontWeight: "400", fontSize: "10pt", lineHeight: "1.8"}}>
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
                        <p style={{fontWeight: "400", fontSize: "10pt", lineHeight: "1.8"}}>
                          {metadata.rarityRank ?
                          <b>Rarity Rank:&nbsp;</b>
                          : <span style={{fontWeight: "600", fontSize: "10pt"}}>UnRanked</span>
                          }
                          {
                          metadata.rarityRank ?
                          <span>{metadata.rarityRank}</span> : null
                          }
                        </p>
                        <p style={{fontWeight: "400", fontSize: "10pt", lineHeight: "1.8"}}>
                          {metadata.rarityScore ?
                          <b>Rarity Score:&nbsp;</b>
                          : <span style={{fontWeight: "600", fontSize: "10pt"}}>No Rarity Score</span>
                          }
                          {
                          metadata.rarityScore ?
                          <span>{metadata.rarityScore?.toFixed(2)}</span> : null
                          }
                        </p>
                        

                        </TabPanel>
                        <TabPanel>
                          {!history && (
                            <p>History tracking.</p>
                          )}
                          {history && (
                            history.map((historyItem, i) => (
                              <p key={i} style={{}}>
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
                    <p>{royalty / 10}% Royalty</p>
                  </div>
                  <div className="d-flex align-items-center" style={{cursor: 'pointer', fontSize: 20, userSelect: 'none'}}>
                  <span>Likes:&nbsp;</span>
                  <span>{likeNum}</span>
                  { like ? (
                    <i
                      onClick={() => unlikeNft()}
                      className="ri-heart-2-fill"
                      style={{color: 'red', cursor: 'pointer'}}
                    ></i>
                  ) : (
                    <i
                      onClick={() => likeNft()}
                      className="ri-heart-line"
                      style={{ fontSize: 20, cursor: 'pointer'}}
                    ></i>
                  )}
                  </div>

                  <div className="numbers">
                    <div className="row">
                      <div className="col-lg-6">
                        <div className="space-y-5">
                          {(sellable && isOnSale && listPaymentToken) && (
                            <>
                            <div className='d-flex align-items-center'>
                              <b>Price:&nbsp;</b>
                              <b>
                                {(listType? itemPrice: highestBidPrice) / Math.pow(10, listPaymentToken?.decimals ?? 18)}
                              </b>
                              <span style={{fontWeight: "300"}}>
                                &nbsp;{listPaymentToken?.symbol ?? 'FTM'}
                              </span>
                              {listPaymentToken.logoURI && <img src={listPaymentToken.logoURI} alt="payment logo" width='20' height='20' className='mr-2 ml-2'  />}
                            </div>
                            <div className="creators">
                              <p className="txt_sm">{timeToLeft}</p>
                            </div>
                            </>
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
                          { userData &&
                            <div>
                              <a href={"https://operahouse.online/profile/" + tokenOwnerAddress } target="_blank" rel="noreferrer" className='d-flex'>
                                {userData.avatar &&
                                  <img alt="Avatar"
                                    className="avatar avatar-sm border-0 mr-2" src={'https://operahouse.mypinata.cloud/ipfs/' + userData.avatar}
                                  />
                                }
                                <p className="avatars_name color_black">
                                  {userData.displayName ? userData.displayName: getAbbrWalletAddress(tokenOwnerAddress)}
                                </p>
                              </a>
                            </div>
                          }
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
                  <div className="d-flex flex-wrap">
                { pending ? (
                  <button className="btn btn-lg btn-primary m-2">
                    Pending
                  </button>
                ) : (
                  <>
                    { sellable && isOwner && isOnSale && !networkError && (
                      <>
                        { !listType ? (
                        <>
                          <Popup
                            className="custom"
                            ref={ref}
                            trigger={
                              <button className="btn btn-lg btn-primary m-2">
                              {'Restart Auction'}
                            </button>}
                            position="bottom center">
                              <div
                                className="popup"
                                id="popup_bid"
                                tabIndex={-1}
                                role="dialog"
                                aria-hidden="true">
                                <div>
                                  <div className=" space-y-20">
                                    <h3>Restart Auction</h3>
                                    <div className="space-y-10">
                                      <p>Price</p>
                                      <input
                                        type="text"
                                        onKeyPress={(event) => {
                                          if (!/[0-9 .]/.test(event.key)) {
                                            event.preventDefault();
                                              }
                                            }}
                                        className="form-control"
                                        value={restartPrice}
                                        placeholder={`00.00 ${listPaymentToken?.symbol ?? 'FTM'}`}
                                        onChange={(e) => setRestartPrice(e.target.value)}
                                      />
                                    </div>
                                    <div className="space-y-10">
                                      <p>List Days</p>
                                      <input
                                        type="text"
                                        onKeyPress={(event) => {
                                          if (!/[0-9 .]/.test(event.key)) {
                                            event.preventDefault();
                                          }
                                        }}
                                        placeholder="1 - 30"
                                        className="form-control"
                                        value={restartDay}
                                        onChange={(e) => setRestartDay(e.target.value)}
                                      />
                                    </div>
                                    <div className="hr" />
                                    <button className="btn btn-primary w-full" onClick={() => handleUpdateItem(restartPrice, restartDay)}>
                                      Restart Auction
                                    </button>
                                    <Popup
                                      className="custom"
                                      open={false}
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
                                              <h3 className="text-center">
                                                Your Bidding Successfully Added
                                              </h3>
                                              <p className="text-center">
                                                your bid
                                                <span
                                                  className="color_text txt_bold">
                                                  (16ETH)
                                                </span>
                                                has been listing to our database
                                              </p>
                                              <Link
                                                to="#"
                                                className="btn btn-dark w-full">
                                                Watch the listings
                                              </Link>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </Popup>
                                  </div>
                                </div>
                              </div>
                          </Popup>
                          <button className="btn btn-lg btn-primary m-2" onClick={(e) =>handleAcceptBid(e)}>
                            {'Accept Auction'}
                          </button>
                        </> ) : (
                          <>
                          <Popup
                            className="custom"
                            ref={ref}
                            trigger={
                              <button className="btn btn-lg btn-primary m-2">
                                Edit Price
                            </button>}
                            position="bottom center">
                              <div
                                className="popup"
                                id="popup_bid"
                                tabIndex={-1}
                                role="dialog"
                                aria-hidden="true">
                                <div>
                                  <div className=" space-y-20">
                                    <h3>Edit Price</h3>
                                    <div>
                                      <p>Payment Token</p>
                                      <DropDownSelect item={restartPaymentToken} setItem={setRestartPaymentToken} options={paymentTokens}  />
                                    </div>
                                    <div className="space-y-10">
                                      <p>Price</p>
                                      <input
                                        type="text"
                                        onKeyPress={(event) => {
                                          if (!/[0-9 .]/.test(event.key)) {
                                            event.preventDefault();
                                              }
                                            }}
                                        className="form-control"
                                        value={restartPrice}
                                        placeholder={`00.00 ${listPaymentToken?.symbol ?? 'FTM'}`}
                                        onChange={(e) => setRestartPrice(e.target.value)}
                                      />
                                    </div>
                                    <div className="hr" />
                                    <button className="btn btn-primary w-full" onClick={() => handleUpdateItem(restartPrice, restartDay)}>
                                      Edit Price
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </Popup>
                          </>
                        )}
                        <button className="btn btn-lg btn-primary m-2" onClick={(e) =>handleRemoveSellPending(e)}>
                          {listType ? 'Remove from Sale' : 'Cancel Auction'}
                        </button>
                      </>
                      )}
                      { sellable && isOwner && !isOnSale && (
                        <>
                          <button className="btn btn-lg btn-primary m-2" onClick={() => setOpenSellModal(true)}>
                            Sell NFT
                          </button>
                          <Popup
                            className="custom"
                            open={openSellModal}
                            onClose={() => setOpenSellModal(false)}
                            position="bottom center"
                          >
                            {networkError && (
                              <p>Please connect wallet or connect FTM network!</p>
                            )}
                            {!networkError && (
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
                                    <h3>Sell NFT</h3>
                                    <p>
                                      <b>You are about to list this NFT</b>
                                      { sellPaymentToken.address === address0 && 
                                        <p>
                                          If this NFT is purchased with ERC-20 tokens (not FTM), you will receive wFTM.
                                        </p>
                                      }
                                    </p>
                                    
                                    <div className="d-flex" style={{flexDirection: 'column'}}>
                                      <p>Sell/Auction</p>
                                      <input
                                        type="checkbox"
                                        id="sell-type-switch"
                                        name='sellType'
                                        checked={!sellType}
                                        onChange={(e) => setSellType(!e.target.checked)}
                                      />
                                      <label htmlFor="sell-type-switch" className='mt-2'>Toggle</label>
                                    </div>
                                    { sellType ? (
                                      <div>
                                        <div>
                                          <p>Payment Token</p>
                                          <DropDownSelect item={sellPaymentToken} setItem={setSellPaymentToken} options={paymentTokens}  />
                                        </div>
                                        <div className="space-y-10">
                                          <p>Price</p>
                                          <input
                                            type="text"
                                            onKeyPress={(event) => {
                                              if (!/[0-9 .]/.test(event.key)) {
                                                event.preventDefault();
                                                  }
                                                }}
                                            className="form-control"
                                            value={sellPrice}
                                            placeholder="Listing Price"
                                            onChange={(e) => setSellPrice(e.target.value)}
                                          />
                                        </div>
                                        {sellPaymentToken?.address !== address0 &&<TokenPriceWithAmount
                                            address={sellPaymentToken.address}
                                            chain="ftm"
                                            image={paymentTokens[0].logoURI}
                                            size="15px"
                                            amount={sellPrice}
                                            decimals={sellPaymentToken.decimals}
                                          />
                                        }
                                        { contractType === 2 &&
                                          <div className="space-y-10">
                                            <p>Amount</p>
                                            <input
                                              type="text"
                                              onKeyPress={(event) => {
                                                if (!/[0-9]/.test(event.key)) {
                                                  event.preventDefault();
                                                    }
                                                  }}
                                              className="form-control"
                                              value={sellAmount}
                                              placeholder="Listing Amount"
                                              onChange={(e) => setSellAmount(e.target.value)}
                                            />
                                          </div>
                                        }
                                        
                                        <a href="https://docs.operahouse.online/marketplace" target="_blank" style={{marginLeft: "5px", marginRight: "5px"}} rel="noreferrer"><p className="text-left color_black txt _bold"> Marketplace FAQ</p></a>
                                      </div>
                                    ) : (
                                      <div>
                                        <div>
                                          <p>Payment Token</p>
                                          <DropDownSelect item={auctionPaymentToken} setItem={setAuctionPaymentToken} options={paymentTokens.slice(1)}  />
                                        </div>
                                        <div className="space-y-10">
                                          <p>Starting Bid</p>
                                          <input
                                            type="text"
                                            onKeyPress={(event) => {
                                              if (!/[0-9 .]/.test(event.key)) {
                                                event.preventDefault();
                                                }
                                              }}
                                            className="form-control"
                                            value={auctionPrice}
                                            placeholder="Starting Bid"
                                            onChange={(e) => setAuctionPrice(e.target.value)}
                                          />
                                        </div>
                                        {auctionPaymentToken?.address !== address0 &&<TokenPriceWithAmount
                                            address={auctionPaymentToken.address}
                                            chain="ftm"
                                            image={paymentTokens[0].logoURI}
                                            size="15px"
                                            amount={auctionPrice}
                                            decimals={auctionPaymentToken.decimals}
                                          />
                                        }
                                        <div className="space-y-10">
                                          <p>Auction Days</p>
                                          <input
                                            type="text"
                                            onKeyPress={(event) => {
                                              if (!/[0-9 .]/.test(event.key)) {
                                                event.preventDefault();
                                              }
                                            }}
                                            placeholder={`1 - ${maxAuctionDay}`}
                                            className="form-control"
                                            value={auctionDay}
                                            onChange={(e) => {
                                              if (e.target.value > maxAuctionDay) {
                                                setAuctionDay(maxAuctionDay)
                                              } else {
                                                setAuctionDay(e.target.value)
                                              }
                                            }}
                                          />
                                        </div>
                                        <div className="space-y-10">
                                          <p>List Days</p>
                                          <input
                                            type="text"
                                            onKeyPress={(event) => {
                                              if (!/[0-9 .]/.test(event.key)) {
                                                event.preventDefault();
                                              }
                                            }}
                                            placeholder="1 - 30"
                                            className="form-control"
                                            value={sellDay}
                                            onChange={(e) => {
                                            if (e.target.value > maxListingDay) {
                                              setSellDay(maxListingDay)
                                            } else {
                                              setSellDay(e.target.value)
                                            }
                                          }}
                                          />
                                        </div>
                                      </div>
                                    )
                                    }
                                    <div className="hr" />
                                    <div className="d-flex justify-content-between">
                                      <p> Service Fee:</p>
                                      <p className="text-right color_black txt _bold">
                                        {serviceFee - 9}%
                                      </p>
                                    </div>
                                    { !nftApproved &&
                                      <button className="btn btn-primary w-full" disabled={pendingNFTApprove} onClick={handleNFTApprove}>
                                        { pendingNFTApprove ? 'Approving' :'Approve' }
                                      </button>
                                    }
                                    <button
                                      to="#"
                                      disabled={!nftApproved || pending}
                                      className="btn btn-primary w-full"
                                      aria-label="Close"
                                      onClick={(e) =>handleSetSellPending(e)}
                                    >
                                      List NFT
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Popup>
                        </>
                      )}

                      { sellable && listType && !isOwner && isOnSale && (
                        <>
                          <button className="btn btn-lg btn-primary m-2" onClick={() => setOpenBuyModal(true)}>
                            Buy Now
                          </button>
                          <Popup
                            className="custom"
                            open={openBuyModal}
                            onClose={() => setOpenBuyModal(false)}
                            position="bottom center"
                          >
                            {networkError && (
                              <p>Please connect wallet or connect FTM network!</p>
                            )}
                            {!networkError && (
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
                                    onClick={() => setOpenBuyModal(false)}>
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
                                    {isNewList &&
                                      <>
                                      <div>
                                        <p>Payment Token</p>
                                        <DropDownSelect item={buyPaymentToken} setItem={setBuyPaymentToken} options={isFTMList ? paymentTokens : paymentTokens.slice(1)}  />
                                      </div>
                                      {amount > 1 && 
                                        <div className="space-y-10">
                                          <p>Amount</p>
                                          <input
                                            type="text"
                                            onKeyPress={(event) => {
                                              if (!/[0-9]/.test(event.key)) {
                                                event.preventDefault();
                                                }
                                              }}
                                            className="form-control"
                                            value={buyAmount}
                                            placeholder="Amount"
                                            onChange={(e) => {
                                              if (Number(e.target.value) > amount) {
                                                setBuyAmount(amount)
                                              } else {
                                                setBuyAmount(Number(e.target.value))
                                              }
                                            }}
                                          />
                                        </div>
                                      }
                                      <div className="d-flex justify-content-start align-items-center flex-wrap">
                                        <p style={{ margin: 0, width: 'fit-content' }}>Estimated Price:&nbsp;</p>
                                        {buyPaymentToken &&<img src={buyPaymentToken?.logoURI} alt="logo" style={{ height: 15 }} /> }
                                          {buyPaymentToken &&
                                          <>
                                          &nbsp;
                                          <div>{buyTokenAmount ? Math.floor((Number(buyAmount) * Number(buyTokenAmount)) / Math.pow(10, buyPaymentToken?.decimals> 0 ? buyPaymentToken?.decimals : 18) * 100)/100 : 0}</div>
                                          {buyPaymentToken.address !== address0 && 
                                            <>
                                            <span>(</span>
                                            <TokenPriceWithAmount
                                              address={buyPaymentToken.address}
                                              chain="ftm"
                                              image={paymentTokens[0].logoURI}
                                              size="15px"
                                              amount={(Number(buyAmount) * Number(buyTokenAmount))  / Math.pow(10, buyPaymentToken?.decimals> 0 ? buyPaymentToken?.decimals : 18)}
                                              decimals={buyPaymentToken.decimals}
                                            />
                                            <span>)</span>
                                            </>
                                          }
                                          </>
                                        }
                                      </div>
                                      </>
                                      }
                                    <div className="space-y-10">
                                      <p>
                                        Please wait for confirmation after purchase.
                                      </p>
                                    </div>
                                    <div className="hr" />
                                    { !approved &&
                                      <button className="btn btn-primary w-full" disabled={pendingBuyApprove} onClick={handleApprove}>
                                        { pendingBuyApprove ? 'Approving' :'Approve' }
                                      </button>
                                    }
                                    <button
                                      className="btn btn-primary w-full"
                                      disabled={!approved || pendingBuyApprove}
                                      onClick={() => {
                                        setOpenBuyModal(false)
                                        handleBuyToken()
                                      }}
                                    >
                                      Buy
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Popup>
                        </>
                      )}
                      { sellable && !listType && !isOwner && isOnSale && !ended && (
                        <Popup
                          className="custom"
                          ref={ref}
                          trigger={
                            <button className="btn btn-lg btn-primary m-2">
                              Place Bid
                            </button>
                          }
                          position="bottom center"
                        >
                          {networkError && (
                            <p>Please connect wallet or connect FTM network!</p>
                          )}
                          {!networkError && (
                            <div
                              className="popup"
                              id="popup_bid"
                              tabIndex={-1}
                              role="dialog"
                              aria-hidden="true">
                              <div className="space-y-20">
                              <h3>Place Bid</h3>
                              <p>This auction uses {listPaymentToken?.symbol} <img src={listPaymentToken.logoURI} alt="payment logo" width='24' height='24' /></p>
                            
                              <input
                                type="text"
                                className="form-control"
                                value={bidPrice}
                                onChange={(e) => setBidPrice(e.target.value)}
                                placeholder={`00 ${listPaymentToken?.symbol ?? 'FTM'}`}
                              />
                              <div className="hr" />
                              <div className="d-flex justify-content-between">
                                <p>You must bid at least&nbsp;</p>
                                <span className="text-right color_black txt _bold">
                                  {highestBidPrice/Math.pow(10, listPaymentToken.decimals) + 1}
                                  &nbsp;
                                  {listPaymentToken?.symbol}
                                </span>
                              </div>
                              <div className="d-flex justify-content-start align-items-center">
                                <p style={{ width: 'fit-content', margin: 0 }}> Bid price:&nbsp;</p>
                                {listPaymentToken &&<img src={listPaymentToken?.logoURI} alt="logo" style={{ height: 15 }} /> }
                                &nbsp;
                                <span style={{ width: 'fit-content', margin: 0 }} className="text-right color_black">
                                  {(!bidPrice || bidPrice === '') ? 0 : bidPrice} {listPaymentToken?.symbol}
                                </span>
                                {listPaymentToken && <>
                                  <span>(</span>
                                  <TokenPriceWithAmount
                                    address={listPaymentToken.address}
                                    chain="ftm"
                                    image={paymentTokens[0].logoURI}
                                    size="15px"
                                    amount={bidPrice}
                                    decimals={listPaymentToken.decimals}
                                  />
                                  <span>)</span>
                                </>
                                }
                              </div>
                              <div className="hr" />
                              <Link
                                to="#"
                                className="btn btn-primary w-full"
                                aria-label="Close"
                                onClick={handlePlaceBid}
                              >
                                Bid
                              </Link>
                              </div>
                            </div>
                          )}
                        </Popup>
                      )}
                      {isOwner && (
                        <Popup
                        className="custom"
                        ref={ref}
                        trigger={
                          <button className="btn btn-lg btn-primary m-2">
                            Burn NFT
                          </button>
                        }
                        position="bottom center"
                      >
                        <div
                          className="popup"
                          id="popup_burn"
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
                            <div className='space-y-20'>
                              <h3>Burn NFT</h3>
                              <div>
                                <p>
                                  Toggle here to enable burn function. Remember you cannot undo this action, once you burn it is gone forever.
                                </p>
                              </div>
                              <div style={{display: 'flex', alignItems: 'center'}}>
                                <input
                                  id="confirm-checkbox"
                                  type="checkbox"
                                  checked={confirmBurn}
                                  onChange={(e) => setConfirmBurn(e.target.checked)}
                                />
                                <label htmlFor="confirm-checkbox" className='m-0'>Toggle</label>
                                <span className='ml-3'>Are you sure to burn this NFT?</span>
                              </div>
                              <div className="hr" />
                              {(confirmBurn && amount && Number(amount) > 1) && <div className="space-y-10">
                                <p>Amount for Burning</p>
                                <input
                                  type="text"
                                  onKeyPress={(event) => {
                                    if (!/[0-9]/.test(event.key)) {
                                      event.preventDefault();
                                    }
                                  }}
                                  placeholder="Amount for burning"
                                  className="form-control"
                                  value={burnAmount}
                                  onChange={(e) => setBurnAmount(e.target.value)}
                                />
                              </div>
                              }
                              <button
                                to="#"
                                className="btn btn-primary w-full"
                                aria-label="Close"
                                disabled={!confirmBurn}
                                onClick={(e) =>handleBurnNFT(e)}
                              >
                                Burn NFT
                              </button>
                            </div>
                          </div>
                        </div>
                      </Popup>
                      )}
                    </>
                  )}
                  </div>
                </div>
              </div>
            </>
            )}
          </div>
        </div>
      </div>
    </div>
    <Footer />
    </>
  );
};
export default ItemDetails;
