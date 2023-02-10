import React from 'react';
import CardMarketplace from '../../../components/cards/CardMarketplace';

function MenuCategoriesMarket(props) {

return (
    <div className="w-100">
      <div className="container">
        <div className="section mt-30">
            <div>
              <div>
                <CardMarketplace {...props} />
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}
export default MenuCategoriesMarket;
