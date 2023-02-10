import { useRef, useState, useCallback, useContext, useEffect, useMemo } from 'react'
import {Link, useHistory} from 'react-router-dom'
import Web3 from 'web3'
import Image from '../custom/Image'
import ModelLoader from '../custom/ModelLoader'
import Popup from 'reactjs-popup'
import { config } from "../../constant/config"
import DropdownButton from '../Details/DropDownButton';
import NFTContext from '../../context/NFTContext'
import {
  collectionContractABI, ERC20ABI, ERC1155ABI
} from '../../constant/contractABI';
import MarketplaceContext from '../../context/MarketplaceContext'
import paymentTokens from '../../constant/paymentTokens'
import { useMoralis, useMoralisWeb3Api } from 'react-moralis'
import DropDownSelect from '../Details/DropDownSelect'
import useTokenCompare from '../../hooks/useTokenCompare'
import { maxListingDay, maxAuctionDay } from '../../constant/listingConfig'
import Video from '../custom/Video'
import { sleep } from '../../utils/common'
import TokenPrice from '../custom/TokenPrice'
import TokenPriceWithAmount from '../custom/TokenPriceWithAmount'
import { toast } from 'react-toastify'
const address0 = "0x0000000000000000000000000000000000000000"
const defaultCollectionAddress = config.contractAddress;
const marketplaceAddress = config.marketplaceAddress

const getAbbrWalletAddress = (walletAddress) => {
  if (walletAddress) {
    let abbrWalletAddress = walletAddress.substring(0, 4) + "..." + walletAddress.substring(38, 42);
    return abbrWalletAddress.toLowerCase();
  }
}



const CardItem = ({ cardItem, networkError, handleRemoveSellPending, handleSetSellPending, handleTransfer, handleBuyToken, handleUpdateList }) => {
  const isFTMList = cardItem?.paymentToken === address0
  const ref = useRef()
  const [anchorEl, setAnchorEl] = useState(null);
  const loadOrder = useRef(0)
  const [to, setTo] = useState()
  const [isOwner, setIsOwner] = useState(false)
  const [restartPrice, setRestartPrice] = useState()
  const [ownedAmount, setOwnedAmount] = useState(0)
  const [userData, setUserData] = useState()
  const [sellPrice, setSellPrice] = useState()
  const [auctionPrice, setAuctionPrice] = useState()
  const [contractType, setContractType] = useState(null)
  const [buyAmount, setBuyAmount] = useState(Number(cardItem.amount ?? 1))
  const [like, setLike] = useState(false)
  const [likeNum, setLikeNum] = useState(0)
  const [auctionDay, setAuctionDay] = useState();
  const [tokenOwnerAddress, setTokenOwnerAddress] = useState()
  const [openTransferModal, setOpenTransferModal] = useState(false)
  const [openSellModal, setOpenSellModal] = useState(false)
  const [openBuyModal, setOpenBuyModal] = useState(false)
  const [openEditModal, setOpenEditModal] = useState(false)
  const [sellType, setSellType] = useState(true);
  const [sellAmount, setSellAmount] = useState(0);
  const [sellPaymentToken, setSellPaymentToken] = useState(paymentTokens[0]);
  const [restartPaymentToken, setRestartPaymentToken] = useState(paymentTokens[0]);
  const [auctionPaymentToken, setAuctionPaymentToken] = useState(paymentTokens[1]);
  const [approved, setApproved] = useState(false)
  const [nftApproved, setNftApproved] = useState(false)
  const [pendingBuyApprove, setPendingBuyApprove] = useState(false)
  const [pendingNFTApprove, setPendingNFTApprove] = useState(false)
  const [insufficientBalance, setInsufficientBalance] = useState(false)
  const [transferAmount, setTransferAmount] = useState()
  const { walletAddress } = useContext(NFTContext)
  const { serviceFee } = useContext(MarketplaceContext)
  const { Moralis, isInitialized } = useMoralis()
  const [buyPaymentToken, setBuyPaymentToken] = useState()
  const buyTokenAmount = useTokenCompare(cardItem?.paymentToken, buyPaymentToken?.address, cardItem?.price)
  const { web3, isWeb3Enabled } = useMoralis();

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

  const getContractInstance = useCallback((contractABI, contractAddress) => {
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

  const handleApprove = useCallback(async () => {
    setPendingBuyApprove(true)
    try {
      let paymentTokenAddress = buyPaymentToken.address
      const paymentTokenInstance = getContractInstance(ERC20ABI, paymentTokenAddress);
      const allowance = await paymentTokenInstance.methods.allowance(walletAddress, marketplaceAddress).call()
          .catch(() => 0)
      if (Number(allowance) >= Number(buyTokenAmount)) {
        setApproved(true)
      } else {
        await paymentTokenInstance.methods.approve(marketplaceAddress, '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff').send({ from: walletAddress })
        while (true) {
          await sleep(2000)
          const allowance = await paymentTokenInstance.methods.allowance(walletAddress, marketplaceAddress).call().catch(() => 0)
          if (Number(allowance) >= Number(buyTokenAmount)) {
            setApproved(true)
            break
          }
        }
      }
    } catch (err) {
      toast.error(err.message)
    }
    setPendingBuyApprove(false)
  }, [buyPaymentToken, buyTokenAmount, walletAddress, getContractInstance])

  const handleNFTApprove = useCallback(async () => {
    setPendingNFTApprove(true)
    try {
      const contractInstance = getContractInstance(collectionContractABI, cardItem.collectionAddress);
      const isApproved = await contractInstance.methods.isApprovedForAll(walletAddress, marketplaceAddress).call()
          .catch(() => 0)
      if (isApproved) {
        setNftApproved(true)
      } else {
        await contractInstance.methods.setApprovalForAll(marketplaceAddress, true).send({ from: walletAddress })
        let index = 0
        while (true) {
          await sleep(2000)
          const isApproved = await contractInstance.methods.isApprovedForAll(walletAddress, marketplaceAddress).call().catch(() => false)
          .catch(() => 0)
          if (isApproved) {
            setNftApproved(true)
            break
          }
          index ++
          if (index > 20) break
        }
      }
    } catch (err) {}
    setPendingNFTApprove(false)
  }, [getContractInstance, cardItem.collectionAddress, walletAddress])

  useEffect(() => {
    if (cardItem.collectionAddress && cardItem.id) {
      const collectionContractInstance = getContractInstance(collectionContractABI, cardItem.collectionAddress);
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
  }, [cardItem.collectionAddress, cardItem.id, getContractInstance])

  useEffect(() => {
    if (cardItem.collectionAddress && cardItem.id && contractType) {
      if (contractType === 1) {
        (async () => {
          let tokenOwnerAddress = null
          if (!cardItem.tokenOwnerAddress) {
            const collectionContractInstance = getContractInstance(collectionContractABI, cardItem.collectionAddress);
            await collectionContractInstance.methods.ownerOf(cardItem.id).call()
              .then((result) => {
                if (result) {
                  tokenOwnerAddress = result.toLowerCase()
                }
              })
              .catch(async (err) => {
                console.log(err)
              })
          } else {
            tokenOwnerAddress = cardItem.tokenOwnerAddress?.toLowerCase()
          }
          setTokenOwnerAddress(tokenOwnerAddress)
          setUserData({ address: tokenOwnerAddress })
        }) ()
      } else {
        setTokenOwnerAddress('Multi')
        setUserData({ address: 'Multi' })
      }
    }
  }, [cardItem.collectionAddress, cardItem.id, cardItem.tokenOwnerAddress, getContractInstance, contractType])

  useEffect(() => {
    if (isInitialized && walletAddress && cardItem) {
      (async () => {
        try {
          loadOrder.current ++;
          const order = loadOrder.current
          const { collectionAddress, id } = cardItem
          if (tokenOwnerAddress && tokenOwnerAddress !== 'Multi') {
            const Profile = Moralis.Object.extend('Profile')
            const query = new Moralis.Query(Profile)
            query.equalTo('address', tokenOwnerAddress)
            query.first()
            .then((profile) => {
              if (order === loadOrder.current) {
                if (profile) {
                  const { attributes } = profile
                  if (attributes) {
                    setUserData({ ...attributes, address: tokenOwnerAddress })
                  }
                }
              }
            })
          }
          if (collectionAddress && id) {

            const Like = Moralis.Object.extend('LikeNFT')
            const query = new Moralis.Query(Like)
            query.equalTo('address', walletAddress.toLowerCase())
            query.equalTo('token_address', collectionAddress.toLowerCase())
            query.equalTo('token_id', id.toString())
            const response = await query.first()
            if (order === loadOrder.current) {
              if (response) setLike(true)
              else setLike(false)
            }

            const countQuery = new Moralis.Query(Like)
            countQuery.equalTo('token_address', collectionAddress.toLowerCase())
            countQuery.equalTo('token_id', id.toString())
            const count = await countQuery.count()
            if (order === loadOrder.current) {
              setLikeNum(count)
            }
          }
        } catch (err) {
          console.log(err)
        }
      }) ()
    }
  }, [Moralis.Object, Moralis.Query, cardItem, tokenOwnerAddress, isInitialized, walletAddress])

  const paymentTokenItem = useMemo(() => {
      const item = paymentTokens.find(({ address }) => (address.toLowerCase() === cardItem?.paymentToken?.toLowerCase()))
      if (!item) return null
      else return item
  }
  , [cardItem.paymentToken])

  const soldPaymentTokenItem = useMemo(() => {
    if (!cardItem?.soldPaymentToken) return null
    const item = paymentTokens.find(({ address }) => (address.toLowerCase() === cardItem?.soldPaymentToken?.toLowerCase()))
    if (!item) return null
    else return item
}
, [cardItem.soldPaymentToken])

  useEffect(() => {
    if (paymentTokenItem) {
      setBuyPaymentToken(paymentTokenItem)
      setRestartPaymentToken(paymentTokenItem)
    }
  }, [paymentTokenItem])

  useEffect(() => {
    if (walletAddress) {
      if (!buyPaymentToken || buyPaymentToken.address === address0) {
        setApproved(true)
        setInsufficientBalance(false)
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
    if (cardItem.collectionAddress && walletAddress)  {

      if (tokenOwnerAddress !== 'Multi') {
        if (walletAddress?.toLowerCase() === tokenOwnerAddress) {
          setIsOwner(true)
        } else {
          setIsOwner(false)
        }
        const contractInstance = getContractInstance(collectionContractABI, cardItem.collectionAddress);
        contractInstance.methods.isApprovedForAll(walletAddress, marketplaceAddress).call()
          .then((isApproved) => {
            if (isApproved) setNftApproved(true)
          })
          .catch((err) => {})
      } else {
        const contractInstance = getContractInstance(ERC1155ABI, cardItem.collectionAddress);
        contractInstance.methods.balanceOf(walletAddress, cardItem.id).call()
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

        // contractInstance.methods.totalSupply(cardItem.id).call()
        //   .then((result) => {
        //     if (Number(result)) {
        //       setTokenAmount(result)
        //     }
        //   })
        //   .catch((err) => {})
      }
    }
  }, [cardItem, getContractInstance, tokenOwnerAddress, walletAddress])

  useEffect(() => {
    if (!sellType && contractType === 2) {
      setSellAmount(1)
    }
  }, [contractType, sellType])

  const isListing = cardItem.isOnSale && cardItem.sellable

  return (
    <div className="col-xl-3 col-lg-4 col-md-6 col-sm-12" key={cardItem.id + '-' + cardItem.collectionAddress}>
      <div className="card__item four card__item2" style={{borderRadius: "10px"}}>
        <div className="card_body space-y-10">
          <div className="creators space-x-10">
            <div className="avatars space-x-3">
              <Link to={`/profile/${(userData?.paid && userData.displayName) ? userData.displayName : userData?.address}`} className='d-flex align-items-center'>
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
                <span className="txt_sm" style={{color: 'var(--color-text)'}}>{likeNum}</span>
              </Link>
              ) : (
                <Link to="#" className="likes space-x-3" onClick={() => likeNft()}>
                  <i
                    className="ri-heart-line"
                    style={{ fontSize: 20, lineHeight: 1, cursor: 'pointer'}}
                  ></i>
                <span className="txt_sm" style={{color: 'var(--color-text)'}}>{likeNum}</span>
              </Link>
            )}
          </div>
          <div className="card_head text-center center video_card" style={{marginTop: "20px"}}>
            <Link to={"/Item-details/" + cardItem.collectionAddress + "/" + cardItem.id}>
            {(!cardItem.assetType || !cardItem.assetURI) ? (
              <Image
                src="/img/logos/loading.gif"
                placeholderImg="/img/logos/loading.gif"
              /> ):
              <>
                {cardItem.assetType === 'video' && (
                  <Video src={cardItem.assetURI} />
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
          <h6 className="card_title">{cardItem.title}</h6>
          <div className="card_footer d-block space-y-10">
            { (cardItem.soldPrice && soldPaymentTokenItem) && <div className='w-100 d-flex justify-content-end'>
                <div className="txt_xs d-flex align-items-center">
                  <div><p className="txt_xs d-flex align-items-center"><b>Last Sold:</b>&nbsp;</p></div>
                  <span
                    className="color_green txt_xs">
                    {cardItem.soldPrice / Math.pow(10, soldPaymentTokenItem.decimals)} { soldPaymentTokenItem.symbol}
                  </span>
                  <img src={soldPaymentTokenItem.logoURI} alt="payment logo" width='18' height='18' className='mr-2 ml-2'  />
                </div>
              </div>
            }
            <div className="card_footer justify-content-between" style={{fontSize: '0.8rem'}}>
              <div className='txt_xs'>
                Rank: {(cardItem?.rarityRank && Number(cardItem?.rarityRank > 0)) ? Number(cardItem?.rarityRank) : 'Unranked'}
              </div>

              <div>
                {isListing && (
                  <p className="txt_xs d-flex align-items-center">
                    <b>Price:</b>&nbsp;
                    <> { paymentTokenItem ? (
                      <>
                        <span
                          className="color_green txt_xs">
                          {cardItem.price / Math.pow(10, paymentTokenItem.decimals)} { paymentTokenItem.symbol}
                        </span>
                        <img src={paymentTokenItem.logoURI} alt="payment logo" width='18' height='18' className='mr-2 ml-2'  />
                      </>
                    ) : (
                      <span
                        className="color_green txt_xs">
                        {
                          // eslint-disable-next-line no-undef
                          cardItem.price / Math.pow(10, 18)
                        }FTM
                      </span>
                    )}
                    </>
                  </p>
                )}
              </div>
            </div>
            { contractType === 2 ? (
              <div className='d-flex justify-content-between flex-wrap'>
                { (isOwner && Number(ownedAmount)) ? (<div className='d-flex txt_xs justify-content-between'>
                  Owned Amount: {ownedAmount}
                </div> ): null
                }
                { (Number(cardItem?.amount)) ? (
                  <div className='d-flex txt_xs justify-content-between'>
                    Amount for Sale: {cardItem?.amount}
                  </div>)
                  : null
                }
                </div>
             ) : null
            }
            <div className="hr" />
            <div className="d-flex align-items-center space-x-10 justify-content-end">
              { cardItem.pending ? (
                <button
                  className="btn btn-sm btn-primary"
                >
                  Pending
                </button>
              ) : (
                <>
                {isOwner ? (
                  <>
                    {!networkError && (
                      <DropdownButton title="Actions" anchorEl={anchorEl} setAnchorEl={setAnchorEl}>
                        { cardItem.sellable && cardItem.isOnSale &&
                          <>
                            <Link to="#" className="color_text p-2"
                              onClick={(e) => { e.preventDefault(); setAnchorEl(null); setOpenEditModal(true) }}
                            >
                              Edit Price
                            </Link>
                            <Link to="#" className="color_text p-2"
                              onClick={(e) => { e.preventDefault(); setAnchorEl(null); handleRemoveSellPending(cardItem) }}
                            >
                              Remove
                            </Link>
                          </>
                        }
                        { cardItem.sellable && !cardItem.isOnSale &&
                          <Link to="#" className="color_text p-2" onClick={(e) => {
                            e.preventDefault()
                            setAnchorEl(null)
                            setOpenSellModal(true)
                          }}>
                            Sell NFT
                          </Link>
                        }
                        <Link to="#" className="color_text p-2" onClick={(e) => {
                          e.preventDefault()
                          setAnchorEl(null)
                          setOpenTransferModal(true)
                        }}>
                            Transfer
                        </Link>
                      </DropdownButton>
                    )}
                    {cardItem.sellable && !cardItem.isOnSale ? (
                      <Popup
                        className="custom"
                        open={openSellModal}
                        onClose={() => { setAnchorEl(null); setOpenSellModal(false) }}
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
                                      <p>Auction Time Limit (Days)</p>
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
                                    <a href="https://docs.operahouse.online/auctions"target="_blank" style={{marginLeft: "5px", marginRight: "5px"}} rel="noreferrer"><p className="text-left color_black txt _bold"> Auction FAQ</p></a>
                                  </div>
                                )}
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
                                  className="btn btn-primary w-full"
                                  disabled={!nftApproved || cardItem?.pending}
                                  onClick={(e) => { e.preventDefault();
                                    setOpenSellModal(false)
                                    handleSetSellPending(cardItem,
                                      sellType,
                                      sellType ? sellPaymentToken : auctionPaymentToken,
                                      sellType? sellPrice : auctionPrice,
                                      sellType? 0: auctionDay,
                                      contractType !== 2,
                                      sellType? sellAmount: 1
                                    )}}
                                >
                                  List NFT
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </Popup>
                    ) : (
                      <Popup
                        className="custom"
                        open={openEditModal}
                        onClose={() => { setAnchorEl(null); setOpenEditModal(false) }}
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
                                    placeholder={`00.00 ${paymentTokenItem?.symbol ?? 'FTM'}`}
                                    onChange={(e) => setRestartPrice(e.target.value)}
                                  />
                                </div>
                                <div className="hr" />
                                <button className="btn btn-primary w-full" onClick={() => { setOpenEditModal(false); handleUpdateList(cardItem, restartPrice, 1, restartPaymentToken) }}>
                                  Edit Price
                                </button>
                              </div>
                            </div>
                          </div>
                        </Popup>
                    )}
                    <Popup
                      className="custom"
                      open={openTransferModal}
                      onClose={() => { setAnchorEl(null); setOpenTransferModal(false) }}
                      position="bottom center"
                    >
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
                            onClick={() => { setAnchorEl(null); setOpenTransferModal(false) }}>
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
                                  value={transferAmount}
                                  placeholder="Transfer Amount"
                                  onChange={(e) => setTransferAmount(e.target.value)}
                                />
                              </div>
                              }
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
                              onClick={(e) =>handleTransfer(e, cardItem.collectionAddress, cardItem.id, to, contractType, transferAmount)}
                            >
                              Transfer
                            </Link>
                          </div>
                        </div>
                      </div>
                    </Popup>
                  </>
                ) : (
                  <>
                  { isListing ? (
                    <>
                      <Link to="#" className="text-black" onClick={() => { setOpenBuyModal(true); setAnchorEl(null); }}>
                        Buy Now
                      </Link>
                      <Popup
                        className="custom"
                        open={openBuyModal}
                        onClose={() => { setAnchorEl(null); setOpenBuyModal(false); }}
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
                              <div className="space-y-20">
                                <h3>Checkout</h3>
                                <p>
                                  Confirm purchase of&nbsp;
                                  <span className="color_black">{cardItem.title}</span>
                                  &nbsp;from&nbsp;
                                  <span className="color_black">{getAbbrWalletAddress(tokenOwnerAddress)}</span>
                                </p>
                                <div className="space-y-10">
                                  <p>
                                    Please wait for confirmation after purchase.
                                  </p>
                                </div>
                                {cardItem?.isNew &&
                                <div>
                                  <div>
                                    <p>Payment Token</p>
                                    <DropDownSelect item={buyPaymentToken} setItem={setBuyPaymentToken} options={isFTMList ? paymentTokens : paymentTokens.slice(1)}  />
                                  </div>
                                  {(Number(cardItem.amount) && contractType === 2) &&
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
                                          if (Number(e.target.value) > Number(cardItem.amount)) {
                                            setBuyAmount(Number(cardItem.amount))
                                          } else {
                                            setBuyAmount(Number(e.target.value))
                                          }
                                        }}
                                      />
                                    </div>
                                  }
                                  {buyPaymentToken  &&
                                  <div className="d-flex justify-content-start align-items-center flex-wrap">
                                    <p style={{ margin: 0, width: 'fit-content' }}>Estimated Price:&nbsp;</p>
                                    {buyPaymentToken &&<img src={buyPaymentToken?.logoURI} alt="logo" style={{ height: 15 }} /> }
                                    
                                    &nbsp;
                                    <div>{buyTokenAmount ? Math.floor((Number(buyAmount ?? 1) * Number(buyTokenAmount)) / Math.pow(10, buyPaymentToken?.decimals> 0 ? buyPaymentToken?.decimals : 18) * 100)/100 : 0} {buyPaymentToken?.symbol ?? 'FTM'}</div>
                                    {buyPaymentToken.address !== address0 && 
                                    <>
                                      <span>(</span>
                                      <TokenPriceWithAmount
                                        address={buyPaymentToken.address}
                                        chain="ftm"
                                        image={paymentTokens[0].logoURI}
                                        size="15px"
                                        amount={(Number(buyAmount ?? 1) * Number(buyTokenAmount))  / Math.pow(10, buyPaymentToken?.decimals> 0 ? buyPaymentToken?.decimals : 18)}
                                        decimals={buyPaymentToken.decimals}
                                      />
                                      <span>)</span>
                                    </>
                                    }
                                  </div>
                                  }
                                </div>
                                }
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
                                    handleBuyToken({ ...cardItem, tokenOwnerAddress }, buyPaymentToken, buyTokenAmount)
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
                  ) : (
                    <div
                      className="d-flex align-items-center space-x-5">
                        + Details
                    </div>
                  )}
                  </>
                )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CardItem
