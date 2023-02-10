import React, { useEffect, useCallback } from 'react';
import {Link} from 'react-router-dom';
import { styled } from '@material-ui/core';
import Filter from '../custom/CollectionFilter';
import NFTContext from '../../context/NFTContext';

const LogoImg = styled('img')(() => ({
  position: 'absolute',
  top: 1,
  left: 10,
  width: '160px !important'
}))

const getAssetType = (url) => {
  if (url) {
    if(url.indexOf("mp4") !== -1) return "video";
    if(url.indexOf("m4v") !== -1) return "video";
    if(url.indexOf("avi") !== -1) return "video";
    if(url.indexOf("mp3") !== -1) return "video";
    if(url.indexOf("png") !== -1) return "image";
    if(url.indexOf("jpeg") !== -1) return "image";
    if(url.indexOf("jpg") !== -1) return "image";
    if(url.indexOf("gif") !== -1) return "image";
  }
  return "other";
}



const isSearched = (str, substr) => {
  if(str.indexOf(substr) === -1) return false;
  return true;
}

function Collection2() {
  const { searchCollections, setSearchCollections, collections: allCollections } = React.useContext(NFTContext);
  const [filterOptions, setFilterOptions] = React.useState({
    category: ''
  })
  const [collections, setCollections] = React.useState([])
  const [filteredCollections, setFilteredCollections] = React.useState([])

  const getSearchItems = useCallback((indexArray) => {
    let items = [];
    for(let i = 0; i < indexArray.length; i++) {
      items.push(allCollections[i]);
    }
    return items;
  }, [allCollections])

  const getSearchCollections = useCallback((text) => {
    let indexArray = [];
    for(let i = 0; i < allCollections.length; i++) {
      let collectionName = allCollections[i].name;
      if(isSearched(collectionName, text)) indexArray.push(i);
    }
    return indexArray;
  }, [allCollections])

  useEffect(() => {
    let CollectionItems = getSearchItems(searchCollections);
    CollectionItems.sort(function(a,b){
      if (a.name.toLowerCase() > b.name.toLowerCase()) return 1
      else if (a.name.toLowerCase() < b.name.toLowerCase()) return -1
      else return 0
    });
    setCollections(CollectionItems)
  }, [getSearchItems, searchCollections, setCollections])

  React.useEffect(() => {
    if (allCollections && allCollections.length) {
      let collections = getSearchCollections("");
      setSearchCollections(collections);
      let collectionArrayCopy = [];
      for(let i = 0; i < allCollections.length; i++) {
        let collectionName = allCollections.name;
        collectionArrayCopy.push({key: i, text: collectionName});
      }
      collectionArrayCopy.sort(function (a, b) {
        if (a.text > b.text) return 1
        else if (a.text < b.text) return -1
        else return 0
      })
    }
  }, [allCollections, getSearchCollections, setSearchCollections])

  useEffect(() => {
    const { category } = filterOptions
    if (!category || category === '') {
      setFilteredCollections(collections)
    } else {
      let newCollections = collections
      if (category && category !== '') {
        newCollections = newCollections.filter((item) => item.category === category)
      }
      setFilteredCollections(newCollections)
    }
  }, [filterOptions, collections])

  return (
    <div>
    <div className="text-center" style={{marginTop:"-50px"}}><h2>Explore Collections</h2></div>
    <br />
      <div className="row justify-content-left mb-20_reset text-center mx-auto">
        <Filter options={filterOptions} setOptions={setFilterOptions} />
        {filteredCollections.map((val, i) => (
          <div className="col-lg-3 col-md-3 col-sm-3" key={i}>
          {/* Cards start rendering here.*/}
            <div className="collections space-y-10 mb-20">

                <div className="collections_item card__item" style={{borderRadius: "10px"}}>
                  <div className="images-box space-y-5 row justify-content-center" style={{borderRadius: "10px"}}>
                      <a href={"collection/" + val.address} className="relative">
                        {val?.StakingNFT && <a href='https://www.darkmatterdefi.com/nft/mynfts' target="_blank" ><LogoImg className='absolute' src={'/img/logos/stake_logo4.png'} alt="staking-logo" /> </a>}
                        {getAssetType(val.image) === 'video' ? (
                          <video
                            style={{width: "100%", height: "100%", maxWidth: "500px", maxHeight: "500px", borderRadius: "10px"}}
                            controls
                            loop muted autoPlay playsInline
                          >
                            <source src={val.image} />
                            Your browser does not support HTML5 video.
                          </video>
                        ) : (
                          <img src={val.image} alt="prv" style={{width: "100%", height: "100%", borderRadius: "10px"}}/>
                        )}
                      </a>
                    <div className="collections_footer justify-content-center">
                      <div className="collection_title" style={{marginTop: "10px"}}>
                        <Link to={"collection/" + val.address}>{val.name}</Link>
                       </div>
                     </div>
                     <div className="collections_footer justify-content-center">
                     <p style={{fontSize: "10pt", justifyContent: "left"}}>{val?.collectionDescription?.substring(0, 70)}...</p>
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
