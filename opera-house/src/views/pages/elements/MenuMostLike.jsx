import React from 'react';
import CardMostLike from '../../../components/cards/CardMostLike';

function MenuMostLike(props) {
  return (
    <div className="w-100">
      <div className="container">
        <div className="section mt-30">
            <div>
              <div>
                <div className="d-flex align-items-center">
                  <CardMostLike {...props} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default MenuMostLike;
