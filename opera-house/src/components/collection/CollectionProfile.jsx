import React from 'react';
import {Link} from 'react-router-dom';
import {
  networkCollections
} from '../../constant/collections';
var CollectionItems = networkCollections["0xfa"];

function CollectionProfile() {
  return (
    <div>
      <div className="row justify-content-center mb-30_reset">
        {CollectionItems.map((val, i) => (
          <div className="col-lg-6 col-md-6 col-sm-8" key={i}>
            <div className="collections space-y-10 mb-30">
              <Link to="collections">
                <div className="collections_item">
                  <Link to="item-details" className="images-box space-y-10">
                    <div className="top_imgs">
                      <img src={`img/items/item_${val.img1}.png`} alt="prv" />
                      <img src={`img/items/item_${val.img2}.png`} alt="prv" />
                      <img src={`img/items/item_${val.img3}.png`} alt="prv" />
                    </div>
                    <img src={`img/items/item_${val.img4}.png`} alt="prv" />
                  </Link>
                </div>
              </Link>
              <div className="collections_footer justify-content-between">
                <h5 className="collection_title">
                  <Link to="profile">{val.title}</Link>
                </h5>
                <Link to="#" className="likes space-x-3">
                  <i className="ri-heart-3-fill" />
                  <span className="txt_md">{val.likes}k</span>
                </Link>
              </div>
              <div className="creators space-x-10">
                <span className="color_text txt_md">
                  {val.stock} items · Created by
                </span>
                <div className="avatars space-x-5">
                  <Link to="profile">
                    <img
                      src={`img/avatars/avatar_${val.avatar_img}.png`}
                      alt="Avatar"
                      className="avatar avatar-sm"
                    />
                  </Link>
                </div>
                <Link to="profile">
                  <p className="avatars_name txt_sm"> @{val.avatar_name}... </p>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CollectionProfile;
