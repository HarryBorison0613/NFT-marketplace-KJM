import React from 'react';
import { useState } from 'react';
import { Link, useHistory } from 'react-router-dom';
import MobileMenu from './Menu/MobileMenu';
import MegaMenu from './Menu/MegaMenu';
import SocialsSM from './Menu/SocialsSM';
import ResourcesSM from './Menu/ResourcesSM';
import NFTContext from '../../context/NFTContext';
import { networkCollections } from "../../constant/collections"
import { Dropdown } from 'semantic-ui-react'

const PagesMenu = [
// Set the static menu items to be mapped and rendered.
// Example of how to create a new menu item:
// {
//   title: <b>MENU TITLE</b>,
//  link: 'MENU LINK',
// },
{
  title: <b>My NFTs</b>,
  link: '/profile',
},
{
  title: <b>Create</b>,
  link: '/mint',
},
];


const Header = () => {
  const [isActive, setActive] = useState(false);
  const [searchText, setSearchText ] = React.useState("");
  const [collectionArray, setCollectioinArray] = React.useState([]);
  const history = useHistory();
  const { setSearchCollections } = React.useContext(NFTContext);
  var walletAddress = localStorage.getItem("walletAddress");
  if(!walletAddress) walletAddress = "";
  const toggleClass = () => {
  setActive(!isActive);
  };

  
  const getAbbrWalletAddress = (walletAddress) => {
  let abbrWalletAddress = walletAddress.substring(0, 4) + "..." + walletAddress.substring(38, 42);
  return abbrWalletAddress.toUpperCase();
  }

  const isSearched = (str, substr) => {
    console.log("indexOf,", str.indexOf(substr))
    if(str.indexOf(substr) == -1) return false;
    return true;
  }

  const getSearchCollections = (text) => {
    let indexArray = [];
    for(let i = 0; i < networkCollections["0xfa"].length; i++) {
      let collectionName = networkCollections["0xfa"][i].name;
      console.log(collectionName);
      if(isSearched(collectionName, text)) indexArray.push(i);
    }
    console.log(indexArray);
    return indexArray;
  }
  const handleSearchBar = (e) => {
    setSearchText(e.target.value);
    let collections = getSearchCollections(e.target.value);
    setSearchCollections(collections);
  }

  const getCollectionAddressWithName = (name) => {
    for(let i = 0; i < networkCollections["0xfa"].length; i++) {
      if(name == networkCollections["0xfa"][i].name) return networkCollections["0xfa"][i].address;
    }
    return "";
  }

  const handleSearchCollection = (e) => {
    let collectionName = e.target.innerText;

    console.log(e.target.innerText);
    let collectionAddress = getCollectionAddressWithName(collectionName);
    console.log("search address result", "/collection/" + collectionAddress);
    history.push("/collection/" + collectionAddress);
    history.go(0);
  }

  React.useEffect(() => {
    let collections = getSearchCollections("");
    setSearchCollections(collections);
    let collectionArrayCopy = [];
    for(let i = 0; i < networkCollections["0xfa"].length; i++) {
      let collectionName = networkCollections["0xfa"][i].name;
      console.log(collectionName);
      collectionArrayCopy.push({key: i, text: collectionName});
    }
    setCollectioinArray(collectionArrayCopy);
  }, [])

  return (
  <div>
      <header className="header__1">
        <div className="container">
          <div className="wrapper js-header-wrapper">

          {/* Header Logo */}
            <div className="headerLogo">
             <Link to="/home">
             <img
             className="headerLogo"
             id="logo_js"
             src="/img/logos/ohminibeta.png"
             alt="logo"
             />
            </Link>
            </div>

            {/* Search Bar */}
            {/* <div className="header__search">
              <input 
                type="text" 
                placeholder="Search..." 
                value = {searchText} 
                onChange={(e) => handleSearchBar(e)}
              />
              <Link to="no-results" className="header__result">
              <i className="ri-search-line" />
              </Link>
            </div> */}
            <Dropdown
              placeholder='Search Collections'
              fluid
              search
              selection
              options={collectionArray}
              onChange={(e) => handleSearchCollection(e)}
            />

            {/* You can change the <ul className=""> to "menu__popup2" to have the dropdown with two columns instead of one.
                For that you will have to create and map the 'right' menu const inside each dropdown jsx file. */}

                {/* Explore Dropdown */}
                <li className="has_popup">
                  <Link className="color_black hovered" to="/home">
                  <b>Explore</b>
                  </Link>
                  <ul className="menu__popup space-y-15">
                  <MegaMenu />
                  </ul>
                </li>

                {/* Static Menu Mapping  */}
                <div className="header__menu">
                  <ul className="d-flex space-x-115">
                  {PagesMenu.map((val, i) => (
                  <li key={i}>
                  <Link className="color_black" to={val.link}>
                  {val.title}
                  </Link>
                  </li>
                  ))}
                  </ul>
                </div>

                {/* Resources Dropdown */}
                  <li className="has_popup">
                  <Link className="color_black hovered" to="/home">
                  <b>Resources</b>
                  </Link>
                  <ul className="menu__popup space-y-15">
                  <ResourcesSM />
                  </ul>
                </li>

            {/* Connect Wallet Button */}
            <div className="header__btns">
                {walletAddress == "" && (
                <Link className="btn btn-grad btn-sm" to="/connect-wallet">
                <i className="ri-wallet-3-line" />
                Connect Wallet
                </Link>
                )}
                {walletAddress != "" && (
                <Link className="btn btn-grad btn-sm" to="/connect-wallet">
                <i className="ri-wallet-3-line" />
                {getAbbrWalletAddress(walletAddress)}
                </Link>
                )}
            </div>

            {/* Mobile Menu Parameters */}
            <div className="header__burger js-header-burger" onClick={toggleClass}/>
            <div className={` header__mobile js-header-mobile  ${isActive ? 'visible': null} `}>
            <MobileMenu />
            </div>

          </div>
        </div>
      </header>
    </div>
  );
};

export default Header;
