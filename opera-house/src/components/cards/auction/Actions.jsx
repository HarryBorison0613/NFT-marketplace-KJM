import { useRef, useState, useEffect, useCallback, useContext } from 'react';
import { Link } from 'react-router-dom';
import Popup from 'reactjs-popup';
import NFTContext from '../../../context/NFTContext';
import { getAbbrWalletAddress } from '../../../utils/common'

const Actions = ({ bids, paymentTokenItem, cardItem, highestBid, highestBidPrice, handleAcceptBid, handlePlaceBid }) => {
  const ref = useRef()
  const [openBidModal, setOpenBidModal] = useState(false)
  const [bidPrice, setBidPrice] = useState();
  const closeBidModal = () => setOpenBidModal(false);
  const closeTooltip = () => ref.current.close();

  const { walletAddress } = useContext(NFTContext)

  return (
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
                  <h4> Bid History </h4>
                  {bids && bids.map(({ bidder, price }) => (
                    <div className="creator_item creator_card space-x-10">
                      <Link
                        className="color_black txt_bold"
                        to={`profile/${bidder}`}>
                        {getAbbrWalletAddress(bidder)}
                      </Link>
                      <span className="date color_text">
                        {price / Math.pow(10, paymentTokenItem?.decimals ?? 18)} {paymentTokenItem?.symbol ?? 'FTM'} <img src={paymentTokenItem.logoURI} alt="payment logo" width='18' height='18' />
                      </span>
                    </div>
                  ))}
                  {/* <div className="creator_item creator_card space-x-10">
                    <div className="avatars space-x-10">
                      <div className="media">
                        <div className="badge">
                          <img
                            src={`img/icons/Badge.svg`}
                            alt="Badge"
                          />
                        </div>
                        <Link to="profile">
                          <img
                            src={`img/avatars/avatar_1.png`}
                            alt="Avatar"
                            className="avatar avatar-md"
                          />
                        </Link>
                      </div>
                      <div>
                        <p className="color_black">
                          Bid accepted
                          <span className="color_brand">1 ETH</span>
                          by
                          <Link
                            className="color_black txt_bold"
                            to="profile">
                            ayoub
                          </Link>
                        </p>
                        <span className="date color_text">
                          28/06/2021, 12:08
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="creator_item creator_card space-x-10">
                    <div className="avatars space-x-10">
                      <div className="media">
                        <div className="badge">
                          <img
                            src={`img/icons/Badge.svg`}
                            alt="Badge"
                          />
                        </div>
                        <Link to="profile">
                          <img
                            src={`img/avatars/avatar_2.png`}
                            alt="Avatar"
                            className="avatar avatar-md"
                          />
                        </Link>
                      </div>
                      <div>
                        <p className="color_black">
                          Bid accepted
                          <span className="color_brand">3 ETH</span>
                          by
                          <Link
                            className="color_black txt_bold"
                            to="profile">
                            monir
                          </Link>
                        </p>
                        <span className="date color_text">
                          22/05/2021, 12:08
                        </span>
                      </div>
                    </div>
                  </div> */}
                </div>
              </div>
            </div>
          </div>
        </Popup>
      </div>
      { walletAddress?.toLowerCase() !== cardItem?.seller?.toLowerCase() ?
        <>
          <button className="btn btn-sm btn-primary" onClick={() => setOpenBidModal(true)}>
            Place Bid
          </button>
          <Popup
            className="custom"
            open={openBidModal}
            onClose={closeBidModal}
            position="bottom center">
            <div>
              <div
                className="popup"
                id="popup_bid"
                tabIndex={-1}
                role="dialog"
                aria-hidden="true">
                <div>
                  <div className=" space-y-20">
                    <h3>Place Bid</h3>
                    <p>This auction uses {paymentTokenItem?.symbol} <img src={paymentTokenItem.logoURI} alt="payment logo" width='24' height='24' /></p>

                    <input
                      type="text"
                      className="form-control"
                      value={bidPrice}
                      onChange={(e) => setBidPrice(e.target.value)}
                      placeholder={`0 ${paymentTokenItem?.symbol ?? 'FTM'}`}
                    />
                    {/* <p>
                      Enter quantity.
                      <span className="color_green">5 available</span>
                    </p>
                    <input
                      type="text"
                      className="form-control"
                      defaultValue={1}
                    /> */}
                    <div className="hr" />
                    <div className="d-flex justify-content-between">
                    <p>
                      You must bid at Least&nbsp;</p>
                      <span className="text-right color_black txt _bold">
                      {highestBidPrice/Math.pow(10, paymentTokenItem.decimals) + 1}
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
                    <div className="d-flex justify-content-between">
                      <p> Total bid amount:</p>
                      <p className="text-right color_black txt _bold">
                        {bidPrice} {paymentTokenItem?.symbol}
                      </p>
                    </div>

                    <button className="btn btn-primary w-full" onClick={() => handlePlaceBid(bidPrice)}>
                      Place Bid
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
            </div>
          </Popup>
        </> :
        <>
          <button className="btn btn-sm btn-primary" onClick={() => handleAcceptBid(cardItem, highestBid)}>
            Accept Bid
          </button>
        </>
      }
    </div>
  )
}

export default Actions
