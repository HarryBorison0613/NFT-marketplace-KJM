import { useRef, useState, useCallback, useContext, useEffect, useMemo } from 'react'
import {Link, useHistory} from 'react-router-dom'
import Image from '../custom/Image'
import ModelLoader from '../custom/ModelLoader'
import Popup from 'reactjs-popup'
import DropdownButton from '../Details/DropDownButton';
import NFTContext from '../../context/NFTContext'
import MarketplaceContext from '../../context/MarketplaceContext'
import paymentTokens from '../../constant/paymentTokens'
import { useMoralis } from 'react-moralis'
import DropDownSelect from '../Details/DropDownSelect'
import useTokenCompare from '../../hooks/useTokenCompare'
import { maxListingDay, maxAuctionDay } from '../../constant/listingConfig'
const address0 = "0x0000000000000000000000000000000000000000"

const getAbbrWalletAddress = (walletAddress) => {
  if (walletAddress) {
    let abbrWalletAddress = walletAddress.substring(0, 4) + "..." + walletAddress.substring(38, 42);
    return abbrWalletAddress.toLowerCase();
  }
}

const CardItem = ({ cardItem, networkError, handleRemoveSellPending, handleSetSellPending, handleTransfer, handleBuyToken }) => {
  const isFTMList = cardItem?.paymentToken === address0
  const ref = useRef()
  const [anchorEl, setAnchorEl] = useState(null);
  const loadOrder = useRef(0)
  const [to, setTo] = useState()
  const [userData, setUserData] = useState()
  const [sellPrice, setSellPrice] = useState()
  const [auctionPrice, setAuctionPrice] = useState()
  const closeTooltip = () => ref.current.close();
  const [like, setLike] = useState(false)
  const [likeNum, setLikeNum] = useState(0)
  const [sellDay, setSellDay] = useState();
  const [auctionDay, setAuctionDay] = useState();
  const [openBuyModal, setOpenBuyModal] = useState(false)
  const [openTransferModal, setOpenTransferModal] = useState(false)
  const [openSellModal, setOpenSellModal] = useState(false)
  const [sellType, setSellType] = useState(true);
  const [sellPaymentToken, setSellPaymentToken] = useState(paymentTokens[0]);
  const [auctionPaymentToken, setAuctionPaymentToken] = useState(paymentTokens[1]);
  const { walletAddress } = useContext(NFTContext)
  const { serviceFee } = useContext(MarketplaceContext)
  const { Moralis, isInitialized } = useMoralis()
  const [buyPaymentToken, setBuyPaymentToken] = useState()
  const buyTokenAmount = useTokenCompare(cardItem?.paymentToken, buyPaymentToken?.address, cardItem?.price)

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
  }, [Moralis.Object, Moralis.Query, cardItem, isInitialized, walletAddress])

  const paymentTokenItem = useMemo(() => {
      const item = paymentTokens.find(({ address }) => (address.toLowerCase() === cardItem?.paymentToken?.toLowerCase()))
      if (!item) return paymentTokens[0]
      else return item
  }
  , [cardItem.paymentToken])

  useEffect(() => {
    setBuyPaymentToken(paymentTokenItem)
  }, [paymentTokenItem])

  return (
    <div className="col-xl-3 col-lg-4 col-md-6 col-sm-12" key={cardItem.id + '-' + cardItem.collectionAddress}>
      <div className="card__item four card__item2">
        <div className="card_body space-y-10">
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
                <span className="txt_sm">{likeNum}</span>
              </Link>
              ) : (
                <Link to="#" className="likes space-x-3" onClick={() => likeNft()}>
                  <i
                    className="ri-heart-line"
                    style={{ fontSize: 20, lineHeight: 1, cursor: 'pointer'}}
                  ></i>
                <span className="txt_sm">{likeNum}</span>
              </Link>
            )}
          </div>
          <div className="card_head text-center center video_card">
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
          <h6 className="card_title">{cardItem.title}</h6>
          <div className="card_footer d-block space-y-10">
            <div className="card_footer justify-content-between" style={{fontSize: '0.8rem'}}>
               { (cardItem.rarityScore !== undefined) &&
                <div className='txt_xs'>
                  Rarity Score: {cardItem?.rarityScore}
                </div>
              }
              <Link to="#">
                {cardItem.isOnSale && (
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
              </Link>

            </div>

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
                {cardItem.tokenOwnerAddress?.toLowerCase() === walletAddress?.toLowerCase() ? (
                  <>
                    {cardItem.sellable && !networkError && (
                      <DropdownButton title="Actions" anchorEl={anchorEl} setAnchorEl={setAnchorEl}>
                        { cardItem.isOnSale ?
                          <Link to="#" className="color_text p-2"
                            onClick={(e) => { e.preventDefault(); handleRemoveSellPending(cardItem) }}
                          >
                            Remove
                          </Link> :
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
                    {cardItem.sellable && !cardItem.isOnSale && (
                      <Popup
                        className="custom"
                        open={openSellModal}
                        position="bottom center"
                      >
                        {networkError && (
                          <p>Please connect wallet or connect FTM network!</p>
                        )}
                        {!networkError && (
                          <div>
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
                                    <>
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
                                      <div className="space-y-10">
                                        <p>List Days</p>
                                        <input
                                          type="text"
                                          onKeyPress={(event) => {
                                            if (!/[0-9 .]/.test(event.key)) {
                                              event.preventDefault();
                                            }
                                          }}
                                          placeholder={`1 - ${maxListingDay}`}
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
                                        <a href="https://docs.operahouse.online/marketplace"target="_blank" style={{marginLeft: "5px", marginRight: "5px"}}><p className="text-left color_black txt _bold"> Marketplace FAQ</p></a>
                                      </div>
                                    </>
                                  ) : (
                                    <>
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

                                    <a href="https://docs.operahouse.online/auctions"target="_blank" style={{marginLeft: "5px", marginRight: "5px"}}><p className="text-left color_black txt _bold"> Auction FAQ</p></a>
                                     </div>

                                    </>
                                  )}
                                  <div className="hr" />
                                  <div className="d-flex justify-content-between">
                                    <p> Service Fee:</p>
                                    <p className="text-right color_black txt _bold">
                                      {serviceFee - 9}%
                                    </p>
                                  </div>
                                  <Link
                                    to="#"
                                    className="btn btn-primary w-full"
                                    aria-label="Close"
                                    onClick={(e) => { e.preventDefault(); handleSetSellPending(cardItem,
                                      sellType,
                                      sellType ? sellPaymentToken : auctionPaymentToken,
                                      sellType? sellPrice : auctionPrice,
                                      sellType? sellDay: auctionDay
                                    )}}
                                  >
                                    List NFT
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </Popup>
                    )}
                    <Popup
                      className="custom"
                      open={openTransferModal}
                      onClose={() => setAnchorEl(null)}
                      position="bottom center"
                    >
                      <div>
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
                                onClick={(e) =>handleTransfer(e, cardItem.collectionAddress, cardItem.id, to)}
                              >
                                Transfer
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Popup>
                  </>
                ) : (
                  <>
                  { (cardItem.sellable && cardItem.isOnSale) ? (
                    <Popup
                      className="custom"
                      trigger={
                        <Link to="#" className="text-black">
                          Buy Now
                        </Link>
                      }
                      position="bottom center"
                    >
                      {networkError && (
                        <p>Please connect wallet or connect FTM network!</p>
                      )}
                      {!networkError && (
                        <div>
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
                                  <span className="color_black">{getAbbrWalletAddress(cardItem.tokenOwnerAddress)}</span>
                                </p>
                                <div className="space-y-10">
                                  <p>
                                    Please wait for confirmation after purchase.
                                  </p>
                                </div>
                                {cardItem?.isNew &&
                                <>
                                <div>
                                  <p>Payment Token</p>
                                  <DropDownSelect item={buyPaymentToken} setItem={setBuyPaymentToken} options={isFTMList ? paymentTokens : paymentTokens.slice(1)}  />
                                </div>
                                <div className="space-y-10">
                                  <p>Estimated Price:</p>
                                  <div>{buyTokenAmount ? Number(buyTokenAmount) / Math.pow(10, buyPaymentToken?.decimals> 0 ? buyPaymentToken?.decimals : 18) : 0}</div>
                                </div>
                                </>
                                }
                                <div className="hr" />
                                <Link
                                  to="#"
                                  className="btn btn-primary w-full"
                                  aria-label="Close"
                                  onClick={() => handleBuyToken(cardItem, buyPaymentToken, buyTokenAmount)}
                                >
                                  Buy
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </Popup>
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
