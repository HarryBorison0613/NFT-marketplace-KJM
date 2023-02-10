import React, { useEffect } from 'react';
import {Link} from 'react-router-dom';
import {
  networkCollections
} from '../../constant/collections';
import NFTContext from '../../context/NFTContext';

const getAssetType = (url) => {
  if (url) {
    if(url.indexOf("mp4") != -1) return "video";
    if(url.indexOf("m4v") != -1) return "video";
    if(url.indexOf("avi") != -1) return "video";
    if(url.indexOf("mp3") != -1) return "video";
    if(url.indexOf("png") != -1) return "image";
    if(url.indexOf("jpeg") != -1) return "image";
    if(url.indexOf("jpg") != -1) return "image";
    if(url.indexOf("gif") != -1) return "image";
  }
  return "other";
}

const getSearchItems = (indexArray) => {
  let items = [];
  for(let i = 0; i < indexArray.length; i++) {
    items.push(networkCollections["0xfa"][i]);
  }
  return items;
}

function Collection2() {
  const { searchCollections } = React.useContext(NFTContext);
  const [collections, setCollections] = React.useState([])

 
  useEffect(() => {
    const CollectionItems = getSearchItems(searchCollections);
    setCollections(CollectionItems)
  }, [searchCollections, setCollections])

  return (
    <div>
    <div className="text-center" style={{marginTop:"-50px"}}><h2>Explore Collections</h2></div>
    <br />
      <div className="row justify-content-left mb-20_reset text-center">
        {collections.map((val, i) => (
          <div className="col-lg-3 col-md-3 col-sm-3" key={i}>
          {/* Cards start rendering here.*/}
            <div className="collections space-y-10 mb-20">

                <div className="collections_item card__item">
                  <div className="images-box space-y-5 row justify-content-center">
                      <Link to={"collection/" + val.address}>
                        {getAssetType(val.image) === 'video' ? (
                          <video
                            style={{width: "100%", height: "100%", maxWidth: "500px", maxHeight: "500px"}}
                            controls
                            loop muted autoPlay
                          >
                            <source src={val.image} />
                            Your browser does not support HTML5 video.
                          </video>
                        ) : (
                          <img src={val.image} alt="prv" style={{width: "100%", height: "100%", borderRadius: "10%"}}/>
                        )}
                      </Link>
                    <div className="collections_footer justify-content-center">
                      <div className="collection_title" style={{marginTop: "10px"}}>
                        <Link to={"collection/" + val.address}>{val.name}</Link>
                       </div>
                     </div>
                     <div className="collections_footer justify-content-center">
                     {/* Collection external Links */}
                     <a href={"https://ftmscan.com/token/" + val.address} target="_blank">
                       <span className="col-address-btn" style={{fontSize: "11pt"}}>{(val.addressShort)}</span>
                     </a>
                     <span className="audit-title"><b>&nbsp;&nbsp;{(val.audit)}</b></span>
                       <p />
                      <span className="space-x-5"><a href={val.website} className="website-btn" target="_blank">
                        <i className="ri-home-fill" />
                      </a>

                      <a href={"https://twitter.com/" + val.twitter} className="twitter-btn" target="_blank">
                        <i className="ri-twitter-fill" />
                      </a>
                      <a href={"https://discord.gg/" + val.discord} className="discord-btn" target="_blank">
                        <i className="ri-discord-fill" />
                      </a></span>
             {/* End External Links */}
                    </div>
                  </div>
                </div>



            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Collection2;
