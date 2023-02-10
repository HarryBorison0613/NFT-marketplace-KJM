import { Link } from 'react-router-dom';

const Detail = ({ isOnSale, timeToLeft, paymentTokenItem, highestBidPrice }) => {
 
  return (
    <div className="card_footer justify-content-between">
      <div className="creators">
        <p className="txt_sm">{timeToLeft}</p>
      </div>
      <div>
        <div className=" color_text txt_sm">
          <Link to="#">
            {!isOnSale ? (
              <p className="txt_xs">
                Not for Sale
              </p>
            ): (
              <p className="txt_xs d-flex align-items-center">
                <b>Top Bid:</b>&nbsp;
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
  )
}

export default Detail
