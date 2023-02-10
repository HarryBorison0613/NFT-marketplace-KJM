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
import DropdownButton from '../Details/DropDownButton';
import { getDateOrTime } from '../../utils/common';
import { toast } from 'react-toastify';
import TokenPriceWithAmount from '../custom/TokenPriceWithAmount';

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

const getAbbrWalletAddress = (walletAddress) => {
  if (walletAddress) {
    let abbrWalletAddress = walletAddress.substring(0, 4) + "..." + walletAddress.substring(38, 42);
    return abbrWalletAddress.toLowerCase();
  }
}

const CardAuction = ({ cardItem, handleAcceptBid, handleRemoveAuction, handleUpdateAuction, handleUpdateCard }) => {
  const ref = useRef();
  const loadOrder = useRef(0)
  const [allowance, setAllowance] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [userData, setUserData] = useState()
  const [highestBid, setHighestBid] = useState()
  const [highestBidPrice, setHighestBidPrice] = useState(cardItem.price)
  const [like, setLike] = useState(false)
  const [likeNum, setLikeNum] = useState(0)
  const [ended, setEnded] = useState()
  const [openBidModal, setOpenBidModal] = useState(false)
  const [openRestartModal, setOpenRestartModal] = useState(false)
  const [bidPrice, setBidPrice] = useState();
  const [bids, setBids] = useState()
  const [restartPrice, setRestartPrice] = useState()
  const [restartDay, setRestartDay] = useState()
  const [timeToLeft, setTimeToLeft] = useState()
  const [anchorEl, setAnchorEl] = React.useState(null);
  const { walletAddress } = useContext(NFTContext)
  const { serviceFee } = useContext(MarketplaceContext)
  const [tokenOwnerAddress, setTokenOwnerAddress] = useState()
  const [buyPaymentToken, setBuyPaymentToken] = useState()
  const { isInitialized, Moralis, web3, isWeb3Enabled, isWeb3EnableLoading, chainId, web3EnableError, auth } = useMoralis();
  const buyTokenAmount = useTokenCompare(cardItem?.paymentToken, buyPaymentToken?.address, cardItem?.price)

  const closeBidModal = () => setOpenBidModal(false);
  const closeRestartModal = () => setOpenRestartModal(false);
  const closeTooltip = () => ref.current.close();

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

  const handleOpenBidModal = async () => {
    setAnchorEl(null)
    let paymentTokenAddress = paymentTokenItem.address
    let decimals = paymentTokenItem.decimals
    let price = Number(bidPrice) * Math.pow(10, decimals)
    const paymentTokenInstance = getContractInstance(ERC20ABI, paymentTokenAddress);
    const balance = await paymentTokenInstance.methods.balanceOf(walletAddress).call()
    if (Number(balance) < Number(price)) {
      toast.error(`You don't have enough ${buyPaymentToken.symbol} balance`)
      return
    }
    setOpenBidModal(true)
  }

  const handleApprove = async () => {
    setIsApproving(true)
    let paymentTokenAddress = paymentTokenItem.address
    let decimals = paymentTokenItem.decimals
    let price = Number(bidPrice) * Math.pow(10, decimals)
    const paymentTokenInstance = getContractInstance(ERC20ABI, paymentTokenAddress);
    const allowance = await paymentTokenInstance.methods.allowance(walletAddress, marketplaceAddress).call()
        .catch(() => 0)
    if (Number(allowance) >= price) {
      setAllowance(allowance)
    } else {
      await paymentTokenInstance.methods.approve(marketplaceAddress, '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff').send({ from: walletAddress })
      let index = 0
      while (true) {
        await sleep(3000)
        const allowance = await paymentTokenInstance.methods.allowance(walletAddress, marketplaceAddress).call()
        if (Number(allowance) >= price) {
          setAllowance(allowance)
          break
        }
        index ++
        if (index > 5) break
      }
    }
    setIsApproving(false)
  }

  const handlePlaceBid = useCallback(async () => {
    try {
      const { collectionAddress, id } = cardItem
      let paymentTokenAddress = paymentTokenItem.address

      let decimals = paymentTokenItem.decimals
      if (Number(bidPrice) < Number(highestBidPrice) / Math.pow(10, decimals) + 1) {
        toast.error('Wrong price')
        return
      }
      let price = Number(bidPrice) * Math.pow(10, decimals)

      const paymentTokenInstance = getContractInstance(ERC20ABI, paymentTokenAddress);
      const balance = await paymentTokenInstance.methods.balanceOf(walletAddress).call()
      if (Number(balance) < Number(price)) {
        toast.error(`You don't have enough ${buyPaymentToken.symbol} balance`)
        return
      }
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
      console.log(err)
    }
  }, [bidPrice, buyPaymentToken, cardItem, getContractInstance, paymentTokenItem, walletAddress])

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
    if (cardItem.collectionAddress && cardItem.id) {
      const collectionContractInstance = getContractInstance(collectionContractABI, cardItem.collectionAddress);
      collectionContractInstance.methods.ownerOf(cardItem.id).call()
        .then((result) => {
          if (result) {
            setTokenOwnerAddress(result.toLowerCase())
            setUserData({
              address: result.toLowerCase()
            })
          }
          return true
        })
        .catch(async (err) => {
          console.log(err)
        })
    }
  }, [cardItem.collectionAddress, cardItem.id, getContractInstance])

  useEffect(() => {
    if (isInitialized && walletAddress && cardItem) {
      (async () => {
        try {
          loadOrder.current ++;
          const order = loadOrder.current
          const { collectionAddress, id } = cardItem
          if (tokenOwnerAddress) {
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
  }, [Moralis.Object, Moralis.Query, cardItem, isInitialized, walletAddress, tokenOwnerAddress])

  useEffect(() => {
    if (paymentTokenItem) {
      (async () => {
        try {
          setBuyPaymentToken(paymentTokenItem)
          const paymentTokenInstance = getContractInstance(ERC20ABI, paymentTokenItem.address);
          const allowance = await paymentTokenInstance.methods.allowance(walletAddress, marketplaceAddress).call().catch(() => 0)
          setAllowance(allowance)
        } catch (err) {}
      }) ()
    }
  }, [getContractInstance, paymentTokenItem, walletAddress])

  useEffect(() => {
    let timer = null
    if (cardItem.expireTimestamp) {
      const result = getDateOrTime(Number(cardItem.expireTimestamp))
      const { type, data } = result
      setTimeToLeft(data)
      if (type === 'end') {
        setEnded(true)
        setTimeToLeft('Ended')
      } else if (type === 'second') {
        setEnded(false)
        timer = setInterval(() => {
          const { data, type } = getDateOrTime(Number(cardItem.expireTimestamp))
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
          const { data, type } = getDateOrTime(Number(cardItem.expireTimestamp))
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
  }, [cardItem.expireTimestamp])

  useEffect(() => {
    let timeIntervalHandler = null
    if (cardItem && ended === false) {
      const { collectionAddress, id, price } = cardItem
      timeIntervalHandler = setInterval(() => {
        try {
          const marketplaceInstance = getContractInstance(marketplaceABI, marketplaceAddress)
          marketplaceInstance.methods.getTokenHighestBid(collectionAddress, id).call()
            .then((result) => {
              const { price: bidPrice } = result
              if (Number(bidPrice) > Number(price)) {
                setHighestBidPrice(bidPrice)
                setHighestBid(result)
              }
              if (handleUpdateCard) {
                handleUpdateCard({
                  collectionAddress,
                  id,
                  price,
                  isOnSale: true,
                  isNew: true
                })
              }
            })
          } catch (err) {
        }
      }, [2000])
    }
    return () => {
      if (timeIntervalHandler) clearInterval(timeIntervalHandler)
    }
  }, [ended, cardItem, getContractInstance, handleUpdateCard])

  const handleRestartAuction = () => {
    handleUpdateAuction(cardItem, restartPrice, restartDay, paymentTokenItem)
    setOpenRestartModal(false)
  }

  useEffect(() => {
    if (cardItem) {
      const { id, collectionAddress, price } = cardItem
      const marketplaceInstance = getContractInstance(marketplaceABI, marketplaceAddress)
      marketplaceInstance.methods.getTokenHighestBid(collectionAddress, id).call()
      .then((result) => {
        const { price: bidPrice } = result
        if (Number(bidPrice) > Number(price)) {
          setHighestBidPrice(bidPrice)
          setHighestBid(result)
        }
      })
      marketplaceInstance.methods.getTokenBids(collectionAddress, id).call()
      .then((bids) => {
        setBids(bids)
      })
    }
  }, [cardItem, getContractInstance, openBidModal])

  const isApproved = !bidPrice || Number(allowance) >= (Number(bidPrice) * Math.pow(10, paymentTokenItem?.decimals?? 18))

  return (
    <div className="col-xl-3 col-lg-4 col-md-6 col-sm-12">
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
            { like ? (
              <Link to="#" className="likes space-x-3" onClick={() => unlikeNft()}>
                <i className="ri-heart-3-fill" style={{ fontSize: 20, lineHeight: 1, cursor: 'pointer'}} />
                <span className="txt_sm" style={{color: "var(--color-text)"}}>{likeNum}</span>
              </Link>
              ) : (
                <Link to="#" className="likes space-x-3" onClick={() => likeNft()}>
                  <i
                    className="ri-heart-line"
                    style={{ fontSize: 20, lineHeight: 1, cursor: 'pointer'}}
                  ></i>
                <span className="txt_sm" style={{color: "var(--color-text)"}}>{likeNum}</span>
              </Link>
            )}
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
          </div>
          {/* =============== */}
          <h6 className="card_title">
            <Link className="color_black" to="item-details">
              {cardItem.title}
            </Link>
          </h6>
          <div className='txt_xs'>
            Rank: {Number(cardItem?.rarityRank > 0) ? Number(cardItem?.rarityRank) : 'Unranked'}
          </div>
          <div className="card_footer d-block space-y-10">
            <div className="card_footer justify-content-between">
              <div className="creators">
                <p className="txt_sm">{timeToLeft}</p>
              </div>
              <div>
                <div className=" color_text txt_sm">
                <Link to="#">
                {cardItem.isOnSale && (
                  <p className="txt_xs d-flex align-items-center">
                    <b>Bid:</b>&nbsp;
                    <> { paymentTokenItem &&
                      <>
                        <span
                          className="color_green txt_xs">
                          {highestBidPrice / Math.pow(10, paymentTokenItem.decimals)} { paymentTokenItem.symbol}
                        </span>
                        <img src={paymentTokenItem.logoURI} alt="payment logo" width='18' height='18' className='mr-2 ml-2'  />
                      </>
                    }
                    </>
                  </p>
                )}
              </Link>
                </div>
              </div>
            </div>
            <div className="hr" />
            <div
              className="d-flex
                align-items-center
                space-x-10
                justify-content-between">
              <div
                className="d-flex align-items-center
              space-x-5">
                <i className="ri-history-line" />

                <Popup
                  className="custom"
                  ref={ref}
                  trigger={<button className="popup_btn">
                  <p
                    className="color_text txt_sm view_history"
                    style={{width: 'auto'}}>
                    View Bids
                  </p>
                </button>}
                  onClose={closeTooltip}
                  position="bottom center">
                  <div
                    className="popup"
                    id="popup_bid"
                    tabIndex={-1}
                    role="dialog"
                    aria-hidden="true">
                    <div>
                      <div className="space-y-20">
                        <h4> Bid History </h4>
                        {bids && bids.map(({ bidder, price }) => (
                          <div className="creator_item creator_card space-x-10">
                            <Link
                              className="color_black txt_bold"
                              to={`profile/${bidder}`}>
                              {getAbbrWalletAddress(bidder)}
                            </Link>
                            <span className="date color_text">
                              <img src={paymentTokenItem.logoURI} alt="payment logo" width='16' height='16' style={{marginTop: "-5px"}}/> {price / Math.pow(10, paymentTokenItem?.decimals ?? 18)} <b>{paymentTokenItem?.symbol ?? 'FTM'}</b>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Popup>
              </div>
              { walletAddress?.toLowerCase() !== cardItem?.seller?.toLowerCase() ?
                <>{!ended &&
                  <>
                  {/* <DropdownButton title="Action" anchorEl={anchorEl} setAnchorEl={setAnchorEl}> */}
                    <Link to="#" className="color_black txt_bold" onClick={handleOpenBidModal}>
                      Place Bid
                    </Link>
                  {/* </DropdownButton> */}
                  <Popup
                    className="custom"
                    open={openBidModal}
                    onClose={closeBidModal}
                    position="bottom center">
                    <div
                      className="popup"
                      id="popup_bid"
                      tabIndex={-1}
                      role="dialog"
                      aria-hidden="true">
                      <div>
                        <div className=" space-y-20">
                          <h3>Place Bid</h3>
                          <p>This item is selling for <img src={paymentTokenItem.logoURI} alt="payment logo" width='16' height='16' style={{marginTop: "-5px"}} /> <b>{paymentTokenItem?.symbol}</b></p>

                          <input
                            type="text"
                            className="form-control"
                            value={bidPrice}
                            onChange={(e) => setBidPrice(e.target.value)}
                            placeholder={`0 ${paymentTokenItem?.symbol ?? 'FTM'}`}
                          />
                          <div className="hr" />
                          <div className="d-flex justify-content-between">
                          <p style={{ width: 'fit-content', margin: 0 }}>
                            You must bid at least:&nbsp;</p>
                            <span className="text-right color_black txt _bold">
                            {Number(highestBidPrice)/Math.pow(10, paymentTokenItem.decimals) + 1}
                            &nbsp;
                            {paymentTokenItem?.symbol}
                            </span>
                          </div>
                          <div className="d-flex justify-content-between">
                            {/* <p> Service Fee:</p>
                            <p className="text-right color_black txt _bold">
                              1%
                            </p> */}
                          </div>
                          <div className="d-flex justify-content-start align-items-center">
                            <p style={{ width: 'fit-content', margin: 0 }}> Bid price:&nbsp;</p>
                            {paymentTokenItem &&<img src={paymentTokenItem?.logoURI} alt="logo" style={{ height: 15 }} /> }
                            &nbsp;
                            <span style={{ width: 'fit-content', margin: 0 }} className="text-right color_black">
                              {(!bidPrice || bidPrice === '') ? 0 : bidPrice} {paymentTokenItem?.symbol}
                            </span>
                            {paymentTokenItem && <>
                              <span>(</span>
                              <TokenPriceWithAmount
                                address={paymentTokenItem.address}
                                chain="ftm"
                                image={paymentTokens[0].logoURI}
                                size="15px"
                                amount={bidPrice}
                                decimals={paymentTokenItem.decimals}
                              />
                              <span>)</span>
                            </>
                            }
                          </div>

                          { !isApproved &&
                            <button className="btn btn-primary w-full" disabled={isApproving} onClick={() => handleApprove()}>
                              { isApproving ? 'Approving' : 'Approve' }
                            </button>
                          }

                          <button className="btn btn-primary w-full" disabled={!isApproved} onClick={() => handlePlaceBid()}>
                            Place Bid
                          </button>
                          <p style={{fontSize: "10pt"}}>* The seller must accept bid to complete the auction.</p>

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
                  </>
                }
                </>:
                <>{ !ended ? (
                    <DropdownButton title="Actions" anchorEl={anchorEl} setAnchorEl={setAnchorEl}>
                      <Link to="#" className="color_text p-2" onClick={() => {
                        setAnchorEl(null)
                        handleAcceptBid(cardItem, highestBid)
                        }
                      }>
                        Accept Bid
                      </Link>
                      <Link to="#" className="color_text p-2" onClick={() => {
                          setAnchorEl(null)
                          handleRemoveAuction(cardItem, highestBid)
                        }
                      }>
                        Cancel Auction
                      </Link>
                    </DropdownButton>
                  ) : (
                    <>
                    <DropdownButton title="Actions" anchorEl={anchorEl} setAnchorEl={setAnchorEl}>
                      <Link to="#" className="color_text p-2" onClick={() => {
                          setAnchorEl(null)
                          handleAcceptBid(cardItem, highestBid)
                          }
                        }>
                        Accept Bid
                      </Link>
                      <Link to="#" className="color_text p-2" onClick={() => {
                        setAnchorEl(null)
                        setOpenRestartModal(true)
                        }
                      }>
                        Restart Auction
                      </Link>
                      <Link to="#" className="color_text p-2" onClick={() => {
                        setAnchorEl(null)
                        handleRemoveAuction(cardItem, highestBid)
                        }
                      }>
                        Cancel Auction
                      </Link>

                    </DropdownButton>
                    <Popup
                      className="custom"
                      open={openRestartModal}
                      onClose={closeRestartModal}
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
                                placeholder={`00.00 ${paymentTokenItem?.symbol ?? 'FTM'}`}
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
                            <button className="btn btn-primary w-full" onClick={() => handleRestartAuction()}>
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
                    </>
                  )}
                </>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CardAuction
