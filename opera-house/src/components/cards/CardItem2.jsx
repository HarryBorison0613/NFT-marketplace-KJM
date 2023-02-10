import { useRef, useState, useCallback, useContext, useEffect } from 'react'
import {Link, useHistory} from 'react-router-dom'
import Web3 from 'web3'
import Image from '../custom/Image'
import ModelLoader from '../custom/ModelLoader'
import Popup from 'reactjs-popup'
import NFTContext from '../../context/NFTContext';
import { config } from "../../constant/config"
import { useMoralis } from 'react-moralis'
import { NFTContractABI } from '../../constant/contractABI'
const defaultCollectionAddress = config.contractAddress;
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

const getAbbrWalletAddress = (walletAddress) => {
  if (walletAddress) {
    let abbrWalletAddress = walletAddress.substring(0, 4) + "..." + walletAddress.substring(38, 42);
    return abbrWalletAddress.toLowerCase();
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
    return "https://operahouse.mypinata.cloud/ipfs/" + subUri
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

const CardItem = ({ collectionAddress, id, title, assetType, assetURI, price, isOnSale,
  rarityScore, pending, isOwner, sellable, tokenOwnerAddress,
  networkError,
  handleRemoveSellPending, handleSetSellPending, handleTransfer, handleBuyToken }) => {
    console.log(collectionAddress, id, title, assetType, assetURI, price, isOnSale,
      rarityScore, pending, isOwner, sellable, tokenOwnerAddress)
  const ref = useRef()
  const [to, setTo] = useState()
  const [sellPrice, setSellPrice] = useState()
  const closeTooltip = () => ref.current.close();
  const [like, setLike] = useState(false)
  const [likeNum, setLikeNum] = useState(0)
  const { walletAddress } = useContext(NFTContext)
  const { Moralis, isInitialized, isWeb3Enabled, web3,  } = useMoralis()

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

  useEffect(() => {
    if (isInitialized && walletAddress) {
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

  return (
    <div className="col-xl-3 col-lg-4 col-md-6 col-sm-12" key={id + '-' + collectionAddress}>
      <div className="card__item four card__item2">
        <div className="card_body space-y-10">
          <div className="card_head text-center center video_card">
            <Link to={"/Item-details/" + collectionAddress + "/" + id}>
            {(!assetType || !assetURI) ? (
              <Image
                src="/img/logos/loading.gif"
                placeholderImg="/img/logos/loading.gif"
              /> ):
              <>
                {assetType === 'video' && (
                  <video
                    style={{width: "100%", height: "100%", minHeight: "100%", maxWidth: "550px", position: "center", objectFit: "cover"}}
                    loop muted autoPlay playsInline
                  >
                    <source src={assetURI} id="video_here" />
                    Your browser does not support HTML5 video.
                  </video>
                )}
                {assetType === 'image' && (
                  <Image
                    src={assetURI}
                    alt="This NFT has no image."
                    placeholderImg="/img/logos/loading.gif"
                  />
                )}
                {assetType === 'glb' && (
                  <ModelLoader
                    src={assetURI}
                  />
                )}
                {assetType === 'other' && (
                  <Image
                    src={assetURI}
                    placeholderImg="/img/logos/loading.gif"
                    alt="This NFT has no image."
                  />
                )}
              </>
            }
            </Link>
          </div>
          {/* =============== */}
          <h6 className="card_title">{title ?? ''}</h6>
          <div className="card_footer d-block space-y-10">
            <div className="card_footer justify-content-between" style={{fontSize: '0.8rem'}}>
              <Link to="#">
                {!isOnSale ? (
                  <p className="txt_xs">
                    Not for Sale
                  </p>

                ): (
                  
                  <p className="txt_xs">
                    <b>Price:</b>&nbsp;
                    <span
                      className="color_white txt_xs">
                      {price / Math.pow(10, 18)} FTM
                    </span>
                  </p>
                )}
              </Link>
              { (rarityScore !== undefined) &&
                <div className='txt_xs'>
                  Rarity Score: {rarityScore}%
                </div>
              }
              <div className="d-flex align-items-center" style={{cursor: 'pointer', fontSize: 20, userSelect: 'none'}}>
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
            </div>

            <div className="hr" />
            <div className="d-flex align-items-center space-x-10 justify-content-between">
              { pending ? (
                <button
                  className="btn btn-sm btn-primary"
                >
                  Pending
                </button>
              ) : (
                <>
                {isOwner ? (
                  <>
                    {sellable && isOnSale && !networkError && (
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={(e) => { e.preventDefault(); handleRemoveSellPending({ id, collectionAddress }) }}
                      >
                        Remove
                      </button>
                    )}
                    {sellable && isOnSale && networkError && (
                      <Popup
                        className="custom"
                        trigger={
                          <button className="btn btn-sm btn-primary">
                            Remove
                          </button>
                        }
                        position="bottom center"
                      >
                        <p>Please connect wallet or connect FTM network!</p>
                      </Popup>
                    )}
                    {sellable && !isOnSale && (
                      <Popup
                        className="custom"
                        trigger={
                          <button className="btn btn-sm btn-primary">
                            Sell NFT
                          </button>
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
                                {/* <button
                                  type="button"
                                  className="button close"
                                  data-dismiss="modal"
                                  aria-label="Close"
                                  onClick={closeTooltip}>
                                  <span aria-hidden="true">×</span>
                                </button> */}
                                <div className="space-y-20">
                                  <h3>Checkout</h3>
                                  <p>
                                    You are about to list this NFT
                                  </p>
                                  <div className="space-y-10">
                                    <p>Price in FTM</p>
                                    <input
                                      type="text"
                                      onKeyPress={(event) => {
                                        if (!/[0-9 .]/.test(event.key)) {
                                          event.preventDefault();
                                          }
                                        }
                                      }
                                      className="form-control"
                                      value={sellPrice}
                                      onChange={(e) => setSellPrice(e.target.value)}
                                    />
                                  </div>
                                  <div className="hr" />
                                  <div className="d-flex justify-content-between">
                                    <p> Service Fee:</p>
                                    <p className="text-right color_black txt _bold">
                                      1%
                                    </p>
                                  </div>
                                  <Link
                                    to="#"
                                    className="btn btn-primary w-full"
                                    aria-label="Close"
                                    onClick={(e) => { e.preventDefault(); handleSetSellPending({ id, collectionAddress }, sellPrice) }}
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
                      ref={ref}
                      trigger={
                          <button className="btn btn-sm btn-primary">
                            Transfer
                          </button>
                      }
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
                                onClick={(e) =>handleTransfer(e, collectionAddress, id, to)}
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
                  { (sellable && isOnSale) ? (
                    <Popup
                      className="custom"
                      trigger={
                        <button className="btn btn-sm btn-primary">
                          Buy Now
                        </button>
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
                              {/* <button
                                type="button"
                                className="button close"
                                data-dismiss="modal"
                                aria-label="Close"
                                onClick={closeTooltip}>
                                <span aria-hidden="true">×</span>
                              </button> */}
                              <div className="space-y-20">
                                <h3>Checkout</h3>
                                <p>
                                  Confirm purchase of&nbsp;
                                  <span className="color_black">{title?? ''}</span>
                                  &nbsp;from&nbsp;
                                  <span className="color_black">{getAbbrWalletAddress(tokenOwnerAddress)}</span>
                                </p>
                                <div className="space-y-10">
                                  <p>
                                    Please wait for confirmation after purchase.
                                  </p>
                                </div>
                                <div className="hr" />
                                <Link
                                  to="#"
                                  className="btn btn-primary w-full"
                                  aria-label="Close"
                                  onClick={() => handleBuyToken({ id, collectionAddress, price })}
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
