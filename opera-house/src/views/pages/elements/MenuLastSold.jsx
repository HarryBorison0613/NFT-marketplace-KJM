import React from 'react';
import CardLastSold from '../../../components/cards/CardLastSold';

function MenuLastSold(props) {
  return (
    <div className="w-100">
      <div className="container">
        <div className="section mt-30">
            <div>
              <div>
                <div className="d-flex align-items-center">
                  <CardLastSold {...props} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default MenuLastSold;
