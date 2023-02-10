import React, { useState, useRef, useEffect, useContext, useCallback } from 'react';
import {Link, useHistory} from 'react-router-dom';
import 'reactjs-popup/dist/index.css';
import InfiniteScroll from 'react-infinite-scroll-component'
import {
  NFTContractABI, collectionContractABI, marketplaceABI, ERC20ABI, ERC1155ABI
} from '../../constant/contractABI';
import NFTContext from '../../context/NFTContext';
import { config } from "../../constant/config"
import { useMoralis } from 'react-moralis';
import Web3 from 'web3'
import "@google/model-viewer";
import Filter from '../custom/Filter';
import { ignoreNFT } from '../../constant/ignore';
import CardItem from './CardCollectionItem';
import { getAllListItems, getListItemDetail } from '../../apis/marketplace';
import { toast, ToastContainer } from 'react-toastify';
import CardAuction from './CardAuction';
import { getItemsData } from '../../apis/nft';
import { useQuery } from 'react-query';
const defaultCollectionAddress = config.contractAddress;
const marketplaceAddress = config.marketplaceAddress
const address0 = "0x0000000000000000000000000000000000000000";
const wFTMAddress = '0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83'

const sleep = (timeToSleep) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve()
    }, timeToSleep)
  })
}

function CardMostLike() {
  const history = useHistory();
  const [isOwner, setIsOwner] = useState(false)
  const [cardItems, setCardItems] = React.useState([]);
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
  const [collections, setCollections] = useState()
  const [traitFilterOptions, setTraitFilterOptions] = useState()
  const [showRarity, setShowRarity] = useState(false)
  const [loadEvent, setLoadEvent] = useState(false)
  const [_cardItemsToShow, _setCardItemsToShow] = React.useState([])
  const [updateItem, setUpdateItem] = React.useState()
  const [moreItems, setMoreItems] = React.useState()
  const stateRef = React.useRef('idle');
  const fetchIndexRef = React.useRef(0)
  const showLengthRef = React.useRef(20)
  const { isInitialized, Moralis, user, isAuthenticated, web3, enableWeb3, isWeb3Enabled, isWeb3EnableLoading, chainId, web3EnableError, auth } = useMoralis();
  const { walletAddress, collections: allCollections } = useContext(NFTContext)
  const [likeNfts, setLikeNfts] = useState()
  const networkError = (!walletAddress)
  const { data, isLoading, error } = useQuery('marketplaceListItems', getAllListItems, {
    retry: true,
    retryDelay: 1000,
  })
  
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
  
  const getCollectionAddresses = useCallback(() => {
    const addresses = []
    for(let i = 0; i < allCollections.length; i++) {
      addresses.push(allCollections[i].address.toLowerCase())
    }
    return addresses
  }, [allCollections])

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
            const allowance = await erc20Instance.methods.allowance(walletAddress, marketplaceAddress).call().catch(() => 0)
            if (Number(allowance) < Number(buyTokenAmount)) {
              await erc20Instance.methods.approve(marketplaceAddress, '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff').send({ from: walletAddress })
            }
            while (true) {
              const allowance = await erc20Instance.methods.allowance(walletAddress, marketplaceAddress).call().catch(() => 0)
              if (Number(allowance) > Number(buyTokenAmount)) {
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

  const handleSetSellPending = useCallback(async (cardItem, sellType, sellPaymentToken, sellPrice, sellDay, contractType = 1, sellAmount = 1) => {
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

  useEffect(() => {
    if (isInitialized) {
      (async () => {
        fetchIndexRef.current ++
        try {
          const result = await Moralis.Cloud.run('getMostLike', { count: 50 })
          if (result && result.length) {
            const nfts = result.map(({ objectId }) => objectId)
            setLikeNfts(nfts)
          }
        } catch (err) {
          
        }
      })()
    }
  }, [Moralis.Cloud, Moralis.Object, Moralis.Query, isInitialized])

  useEffect(() => {
    if (likeNfts && allCollections?.length) {
      if (!likeNfts.length) {
        setCardItems([])
        return
      }
      (async () => {
        const fetchIndex = fetchIndexRef.current
        if (chainId && Number(chainId) !== 0xfa) {
          setCardItems([])
          return
        } else {
          setCardItems([])
        }
        
        let collections = []
        const queryData = likeNfts.map(({ token_address, token_id}) => ({ id: token_id, collectionAddress: token_address }))
        const nfts = likeNfts.map(({ token_address, token_id, ...other }) => ({ id: token_id, collectionAddress: token_address, ...other }))
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
              setMoreItems(newItems)
            }
          } else {
            setMoreItems(nfts)
          } 
        })
        .catch(() => {
          setMoreItems(nfts)
        })
        const defaultNfts = nfts.filter(({ collectionAddress }) => (collectionAddress?.toLowerCase() === defaultCollectionAddress.toLowerCase()))
        const NFTContractInstance = await getContractInstance(NFTContractABI, defaultCollectionAddress);
        if (defaultNfts && defaultNfts.length) {
          const defaultCollectionInfo = getCollectionWithAddress(defaultCollectionAddress)
          
          let sellable = false
          if (defaultCollectionInfo) {
            sellable = defaultCollectionInfo.sellable
          }
          
          if ( fetchIndexRef.current === fetchIndex) {
            if (defaultNfts?.length) {
              const { address, name } = defaultCollectionInfo
              collections = [ { address, name } ]
              setCollections(collections)
            }
          }
          let startId = 0
          let totalTokenCount = defaultNfts.length

          
          const getDefaultItem = async (id) => {
            try {
              let owner = true;
              let isOwner = false
              if (ignoreNFT.includes(Number(id))) {
                return null
              }
              if (owner) {
                const result = await NFTContractInstance.methods.getMetadata(id).call()
                let cardItem = {};
                cardItem.collectionAddress = defaultCollectionAddress.toLowerCase();
                cardItem.id = id;
                cardItem.likes = 0;
                cardItem.avatarImg = '1';
                cardItem.title = result.title;
                cardItem.sellable = sellable
                cardItem.seller= result.tokenOwner
                if (defaultCollectionInfo) cardItem.category = defaultCollectionInfo.category
                cardItem.price = sellable ? Number(result.price) : 0
                cardItem.isOwner = isOwner;
                if(sellable && result.sellPending) cardItem.isOnSale = true
                else cardItem.isOnSale = false
                if (fetchIndexRef.current === fetchIndex) {
                  setUpdateItem(cardItem)
                }
                return { result: true }
              } else {
                return null
              }
            } catch (err) {
              if (err && err.message && err.message.includes('nonexistent')) return null
              console.log(err, err.message,  err.code, err.message.code)
              return { result: false, data: id }
            }
          }
          let failedItems = []
          while(startId <= totalTokenCount) {
            let promises = []
            let endId = startId + 19
            if (endId > totalTokenCount) endId = totalTokenCount
            for(let id = startId; id < endId; id++) {
              promises.push(getDefaultItem(defaultNfts[id].id))
            }
            const fetchedItems = await Promise.all(promises);
            if (fetchIndexRef.current === fetchIndex) {
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
              failedItems = fetchedItems.filter((item) => (item && !item.result))
            } else {
              clearInterval(timeoutHandler)
            }
          }, 5000)
        }
        let otherNfts = nfts.filter(({ collectionAddress }) => (collectionAddress?.toLowerCase() !== defaultCollectionAddress.toLowerCase()))
        const getItemMetaData = async (data) => {
          try {
            let cardItem = { ...data };
            const collectionInfo = getCollectionWithAddress(data.collectionAddress)
            if (!collectionInfo) return
            const sellable = collectionInfo.sellable
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
            if (fetchIndexRef.current === fetchIndex) {
              setUpdateItem({...cardItem})
              stateRef.current = 'pending'
            } else {
              return
            }
          } catch (err) {
          }
        }
        const collectionAddresses = getCollectionAddresses()
        const collectionAddr = []
        otherNfts = otherNfts?.filter((item) => {
          if (item && item.collectionAddress) {
            if (collectionAddresses.includes(item.collectionAddress.toLowerCase())) {
              if (!collectionAddr.includes(item.collectionAddress)) collectionAddr.push(item.collectionAddress)
              return true
            }
          }
          return false
        })
        const newCollections = collectionAddr.map((address) => {
          const { name } = getCollectionWithAddress(address)
          return { name, address }
        })
        
        const _collections = [...collections, ...newCollections]
        _collections.sort(function (a, b) {
          if (a.name > b.name ) return 1
          else if (a.name < b.name) return -1
          else return 0
        })
        setCollections(_collections)
        for (let index = 0; index < otherNfts.length; index++) {
          const element = otherNfts[index];
          getItemMetaData(element)
        }
      })()
    }
  }, [allCollections, chainId, getContractInstance, getCollectionAddresses, getCollectionWithAddress, likeNfts, walletAddress])

  useEffect(() => {
    if (data) {
      if (data && data.length) {
        const newItems = cardItems.map((cardItem) => {
          const listItem = data.find(({ tokenId, nftContract }) => (
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
        setCardItemsWithNew(cardItems.map((item) => ({ ...item, id: item.tokenId})))
      }
    }
  }, [cardItems, data, error])

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
      <ToastContainer position='top-right' />
        <div className="row mb-50_reset mx-auto text-center">
          <div style={{display: 'inline-flex', flexWrap: 'wrap', width: '100%', justifyContent: 'center'}}>
          <Filter
            options={filterOptions}
            setOptions={(options) => setFilterOptions(options)}
            isCollection={false}
            isMarketplace={false}
            showRarity={showRarity}
            collections={collections}
          />
          </div>
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
            /> 
          ))}
          </InfiniteScroll>
      </div>
    </div>
  );
}

export default React.memo(CardMostLike);
