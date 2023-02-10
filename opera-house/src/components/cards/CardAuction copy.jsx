import React, { useRef, useState, useCallback, useContext, useEffect, useMemo } from 'react';
import { Link, useHistory } from 'react-router-dom';
import Web3 from 'web3';
import Popup from 'reactjs-popup';
import {
  wFTMABI, collectionContractABI, marketplaceABI, ERC20ABI
} from '../../constant/contractABI';
import { config } from "../../constant/config"
import 'reactjs-popup/dist/index.css';
import Image from '../custom/Image'
import ModelLoader from '../custom/ModelLoader'
import NFTContext from '../../context/NFTContext'
import MarketplaceContext from '../../context/MarketplaceContext'
import paymentTokens from '../../constant/paymentTokens'
import { useMoralis } from 'react-moralis'
import DropDownSelect from '../Details/DropDownSelect'
import useTokenCompare from '../../hooks/useTokenCompare'
import Detail from './auction/Detail';
import Actions from './auction/Actions';
import { getAbbrWalletAddress } from '../../utils/common';

const marketplaceAddress = config.marketplaceAddress;
const address0 = "0x0000000000000000000000000000000000000000";

const sleep = (timeToSleep) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve()
    }, timeToSleep)
  })
}

const getSecondTime = (time) => {
  const seconds = time % 60
  const minutes = Math.floor(time / 60)
  return `${minutes}:${("00" + seconds).slice(-2)} Time left`
}

const getMinuteTime = (time) => {
  const minutes = time % 60
  const hours = Math.floor(time / 60)
  return `${("00" + hours).slice(-2)}:${("00" + minutes).slice(-2)} Hours left`
}

const getDateTime = (time) => {
  const dates = Math.floor(time / 1440)
  return `${dates} Days left`
}

const getDateOrTime = (timestamp) => {
  const now = Math.floor(Date.now() / 1000)
  if (timestamp < now) return {
    type: 'end'
  }
  const seconds = timestamp - now
  const minutes = Math.floor(seconds / 60)
  if (minutes < 6) {
    return {
      type: 'second',
      data: getSecondTime(seconds)
    }
  } else if (minutes < 1440) {
    return {
      type: 'min',
      data: getMinuteTime(minutes)
    }
  } else {
    return {
      type: 'day',
      data: getDateTime(minutes)
    }
  }
}


const CardAuction = ({ cardItem, handleAcceptBid }) => {
  const ref = useRef();
  const loadOrder = useRef(0)
  const isFTMList = cardItem?.paymentToken === address0
  const [userData, setUserData] = useState()
  const [highestBid, setHighestBid] = useState()
  const [highestBidPrice, setHighestBidPrice] = useState(cardItem.price)
  const [like, setLike] = useState(false)
  const [likeNum, setLikeNum] = useState(0)
  const [bids, setBids] = useState()
  const [timeToLeft, setTimeToLeft] = useState()
  const { walletAddress } = useContext(NFTContext)
  const { isInitialized, Moralis, web3, isWeb3Enabled } = useMoralis();

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

  const paymentTokenItem = useMemo(() => {
    const item = paymentTokens.find(({ address }) => (address.toLowerCase() === cardItem?.paymentToken?.toLowerCase()))
    if (!item) return paymentTokens[0]
    else return item
  }, [cardItem.paymentToken])

  const handlePlaceBid = useCallback(async (bidPrice, bidDay) => {
    try {
      const { collectionAddress, id } = cardItem
      let paymentTokenAddress = paymentTokenItem.address

      let decimals = paymentTokenItem.decimals
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
        
        let date = Date.now()
        date += Number((!bidDay || bidDay ==='') ? 1 : Number(bidDay)) * 8.64e+7 ;
        date = Math.round(date/1000)
        const bidFunc = marketplaceInstance.methods.enterBid(
          collectionAddress,
          id,
          1,
          // eslint-disable-next-line no-undef
          BigInt(price).toString(),
          date
        )
        await bidFunc.estimateGas(
          {
              from: walletAddress,
          }
        )
        await bidFunc.send({ from: walletAddress })
      }
    } catch (err) {
      console.log(err)
    }
  }, [cardItem, getContractInstance, paymentTokenItem, walletAddress])

  const cancelAuction = useCallback(() => {

  }, [])

  const likeNft = useCallback(async () => {
    try {
      const { collectionAddress, id } = cardItem
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
  }, [Moralis.Object, Moralis.Query, cardItem, walletAddress])

  const unlikeNft = useCallback(async () => {
    try {
      const { collectionAddress, id } = cardItem
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
  }, [Moralis.Object, Moralis.Query, cardItem, walletAddress])

  useEffect(() => {
    if (isInitialized && walletAddress && cardItem) {
      (async () => {
        try {
          loadOrder.current ++;
          const order = loadOrder.current
          const { collectionAddress, id, tokenOwnerAddress } = cardItem
          if (tokenOwnerAddress) {
            setUserData({
              address: tokenOwnerAddress
            })
            const Profile = Moralis.Object.extend('Profile')
            const query = new Moralis.Query(Profile)
            query.equalTo('address', tokenOwnerAddress.toLowerCase())
            query.first()
            .then((profile) => {
              if (order === loadOrder.current) {
                if (profile) {
                  const { attributes } = profile
                  if (attributes) {
                    const { paid } = attributes
                    setUserData({ ...attributes, address: tokenOwnerAddress })
                  }
                }
              }
            })
          }
          if (walletAddress && collectionAddress && id) {
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
          }
        } catch (err) {
          console.log(err)
        }
      }) ()
    }
  }, [Moralis.Object, Moralis.Query, cardItem, isInitialized, walletAddress])

  useEffect(() => {
    let timer = null
    if (cardItem.expireTimestamp) {
      const result = getDateOrTime(Number(cardItem.expireTimestamp))
      const { type, data } = result
      setTimeToLeft(data)
      if (type === 'end') {
        setTimeToLeft('Ended')
      } if (type === 'second') {
        timer = setInterval(() => {
          const { data, type } = getDateOrTime(Number(cardItem.expireTimestamp))
          if (type === 'end') {
            setTimeToLeft('Ended')
          } else {
          setTimeToLeft(data)
          }
        }, 1000)
      } else {
        timer = setInterval(() => {
          const { data, type } = getDateOrTime(Number(cardItem.expireTimestamp))
          if (type === 'end') {
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
  }, [cardItem.expireTimestamp])

  useEffect(() => {
    if (cardItem) {
      const { id, collectionAddress } = cardItem
      const marketplaceInstance = getContractInstance(marketplaceABI, marketplaceAddress)
      marketplaceInstance.methods.getTokenHighestBid(collectionAddress, id).call()
      .then((result) => {
        const { price } = result
        if (Number(price) > 0) {
          setHighestBid(result)
          setHighestBidPrice(price)
        }
      })
      marketplaceInstance.methods.getTokenBids(collectionAddress, id).call()
      .then((bids) => {
        setBids(bids)
      })
    }
  }, [cardItem, getContractInstance])

  return (
    <div className="col-xl-3 col-lg-4 col-md-6 col-sm-6">
      <div className="card__item four">
        <div className="card_body space-y-10">
          {/* =============== */}
          <div className="creators space-x-10">
            <div className="avatars space-x-3">
              <Link to={`profile/${(userData?.paid && userData.displayName) ? userData.displayName : userData?.address}`} className='d-flex align-items-center'>
              { userData && userData.avatar ?
                <img
                  src={`https://operahouse.mypinata.cloud/ipfs/${userData.avatar}`}
                  alt="Avatar"
                  className="avatar avatar-sm mr-2"
                /> :
                <img
                  src={`/img/logos/oh.png`}
                  alt="Avatar"
                  className="avatar avatar-sm mr-2"
                /> 
              }
              { userData &&
                <p className="avatars_name txt_xs">{
                  userData.displayName ? (
                    userData.displayName
                  ) : (
                    getAbbrWalletAddress(userData.address)
                  )
                }</p>
              }
              </Link>
            </div>
          </div>
          <div className="card_head">
          <Link to={"/Item-details/" + cardItem.collectionAddress + "/" + cardItem.id}>
            {(!cardItem.assetType || !cardItem.assetURI) ? (
              <Image
                src="/img/logos/loading.gif"
                placeholderImg="/img/logos/loading.gif"
              /> ):
              <>
                {cardItem.assetType === 'video' && (
                  <video
                    style={{width: "100%", height: "100%", minHeight: "100%", maxWidth: "550px", position: "center", objectFit: "cover"}}
                    loop muted autoPlay playsInline
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
                {cardItem.assetType === 'glb' && (
                  <ModelLoader
                    src={cardItem.assetURI}
                  />
                )}
                {cardItem.assetType === 'other' && (
                  <Image
                    src={cardItem.assetURI}
                    placeholderImg="/img/logos/loading.gif"
                    alt="This NFT has no image."
                  />
                )}
              </>
            }
            </Link>
            { like ? (
              <Link to="#" className="likes space-x-3" onClick={() => unlikeNft()}>
                <i className="ri-heart-3-fill" />
                <span className="txt_sm">{likeNum}</span>
              </Link>
              ) : (
                <Link to="#" className="likes space-x-3" onClick={() => likeNft()}>
                  <i
                    className="ri-heart-line"
                    style={{ fontSize: 20, cursor: 'pointer'}}
                  ></i>
                <span className="txt_sm">{likeNum}</span>
              </Link>
            )}
          </div>
          {/* =============== */}
          <h6 className="card_title">
            <Link className="color_black" to="item-details">
              {cardItem.title}
            </Link>
          </h6>
          <div className="card_footer d-block space-y-10">
            <Detail
              timeToLeft={timeToLeft}
              isOnSale={cardItem.isOnSale}
              paymentTokenItem={paymentTokenItem}
              highestBidPrice={highestBidPrice}
            />
            <div className="hr" />
            <Actions
              bids={bids}
              cardItem={cardItem}
              paymentTokenItem={paymentTokenItem}
              highestBid={highestBid}
              highestBidPrice={highestBidPrice}
              handleAcceptBid={handleAcceptBid}
              handlePlaceBid={handlePlaceBid}
              cancelAuction={cancelAuction}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default CardAuction
