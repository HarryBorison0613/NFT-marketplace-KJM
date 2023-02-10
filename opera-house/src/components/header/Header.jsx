import React, { useCallback, useEffect, useRef } from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import MobileMenu from './Menu/MobileMenu';
import MegaMenu from './Menu/MegaMenu';
// import SocialsSM from './Menu/SocialsSM';
import ProfileSM from './Menu/ProfileSM';
import ResourcesSM from './Menu/ResourcesSM';
import NFTContext from '../../context/NFTContext';
import { networkCollections } from "../../constant/collections"
// import { Input, Dropdown } from 'semantic-ui-react'
import AsyncSelect from 'react-select/async';
import Dropdown from './DropDown'
import { useMoralis } from "react-moralis";
import Connect from './Menu/Connect';
import {
  NFTContractABI, collectionContractABI
} from '../../constant/contractABI';
import Web3 from 'web3'
import { config } from "../../constant/config"
import TokenPrice from "../custom/TokenPrice"
import ThemeContext from '../../context/ThemeContext';
import MobileSearch from './MobileSearch';
const defaultCollectionAddress = config.contractAddress;
const address0 = "0x0000000000000000000000000000000000000000";
const PagesMenu = [
// Set the static menu items to be mapped and rendered.
// Example of how to create a new menu item:
// {
//   title: <b>MENU TITLE</b>,
//  link: 'MENU LINK',
// },
// {
//   title: 'My NFTs',
//   link: '/profile',
// },
{
  title: 'Create',
  link: '/mint',
},
];

function checkAddress(address) {
  if (address && address.length === 42) {
    if (address.substring(0, 2) === '0x') return true
    else return false
  } else return false
}


const colourOptions = []

const filterColors = (inputValue) => {
  return colourOptions.filter((i) =>
    i.label.toLowerCase().includes(inputValue.toLowerCase())
  );
};



const Header = () => {
  const [isActive, setActive] = useState(false);
  const { isInitialized, account: walletAddress, isAuthenticated, web3, enableWeb3, isWeb3Enabled, chainId, Moralis, auth } = useMoralis();
  const [totalVolume, setTotalVolume] = useState(0)
  // const [searchText, setSearchText ] = React.useState("");
  const [options, setOptions] = useState([])
  const [collectionArray, setCollectionArray] = React.useState([]);
  const [searchValue, setSearchValue] = useState('')
  const currentSearchValue = useRef('')
  // const history = useHistory();
  const { setSearchCollections, collections: allCollections } = React.useContext(NFTContext);
  const { theme, setTheme } = React.useContext(ThemeContext)
  const toggleClass = () => {
  setActive(!isActive);
  };

  const isSearched = (str, substr) => {
    if(str.indexOf(substr) === -1) return false;
    return true;
  }

  const getContractInstance = React.useCallback(async (contractABI, contractAddress) => {
    if (web3 && chainId === '0xfa') {
        let contract = new web3.eth.Contract(contractABI, contractAddress);
        return contract;
    }
    else {
      const web3 = new Web3(new Web3.providers.HttpProvider('https://rpc.ftm.tools/'));
      const contract = new web3.eth.Contract(contractABI, contractAddress);
      return contract;
    }
  }, [web3, chainId])

  const getCollectionWithName = useCallback((name) => {
    for(let i = 0; i < allCollections.length; i++) {
      if(allCollections[i].name.replaceAll(' ', '').toLowerCase() === name.replaceAll(' ', '').toLowerCase()){
        return allCollections[i];
      }
    }
    return null;
  }, [allCollections])

  
  const getCollectionInfo = React.useCallback(async (collectionAddress) => {
    let NFTContractInstance = await getContractInstance(NFTContractABI, defaultCollectionAddress);
    let info = {};
    for(let i = 0; i < allCollections.length; i++) {
      if(allCollections[i].address === collectionAddress)
        info = allCollections[i];
    }

    let address = collectionAddress === defaultCollectionAddress ? address0 : collectionAddress;
    await NFTContractInstance.methods.collectionInfo(address).call()
      .then((result) => {
        info.totalVolume = result.totalVolume;
      })
      .catch((err) => {
      });
    let floor = 0;

    return info;
  }, [getContractInstance])

  const handleEnter = async (value, type = null) => {
    if (value && type) {
      return window.location.href = `/${type}/` + value;
    }
    if (checkAddress(value)) {
      const collection = collectionArray.find((item) => item.address.toLowerCase() === value.toLowerCase())
      if (collection) {
        window.location.href = "/collection/" + collection.address;
        return
      } else {
        const Profile = Moralis.Object.extend('Profile')
        const query = new Moralis.Query(Profile)
        query.matches('address', value, 'i')
        const profile = await query.first()
        if (profile) {
          window.location.href = "/profile/" + value;
        }
      }
    } else if (value) {
      const collectionName = value.replaceAll('_', ' ')
      const collection = getCollectionWithName(collectionName)
      if (collection) {
        window.location.href = "/collection/" + collection.name;
      } else {
        const username = value.replaceAll('_', ' ')
        const Profile = Moralis.Object.extend('Profile')
        const query = new Moralis.Query(Profile)
        query.matches('displayName', username, 'i')
        const profile = await query.first()
        if (profile && profile.attributes) {
          const { displayName, paid, address } = profile.attributes
          if (paid) {
            window.location.href = "/profile/" + displayName;
          } else {
            window.location.href = "/profile/" + address;
          }
        }
      }
    }
  }

  const handleChangeTheme = (isLight) => {
    if (isLight) {
      setTheme('normal')
    } else {
      setTheme('dark')
    }
  }

  useEffect(() => {
    (async () => {
      try {
        currentSearchValue.current = searchValue
        if (searchValue && searchValue !== '') {
          let collections = []
          let nameCollections = allCollections.filter(({ name }) => name.toLowerCase().includes(searchValue.toLowerCase()))
          if (nameCollections && nameCollections.length) {
            collections = nameCollections.map((item) => ({ label: item.name, value: item.name, type: 'collection' }))
          }
          let addressCollections = allCollections.filter(({ address }) => address.toLowerCase().includes(searchValue.toLowerCase()))
          if (addressCollections && addressCollections.length) {
            addressCollections = addressCollections.map((item) => ({ label: item.address, value: item.address, type: 'collection' }))
            collections = [...collections, ...addressCollections]
          }
          
          const Profile = Moralis.Object.extend('Profile')
          const query = new Moralis.Query(Profile)
          query.matches('address', searchValue, 'i')
          const profiles = await query.find()
          if (profiles) {
            const userAddresses = profiles.map((profile) => ({
              label: profile.get('address'),
              value: profile.get('address'),
              type: 'profile'
            }))
            if (userAddresses && userAddresses.length) {
              collections = [...collections, ...userAddresses]
            }
          }
          const nameQuery = new Moralis.Query(Profile)
          nameQuery.matches('displayName', searchValue, 'i')
          const profilesByName = await nameQuery.find()
          if (profilesByName) {
            const userNames = profilesByName.map((profile) => ({
              label: profile.get('displayName'),
              value: profile.get('paid') ? profile.get('displayName') : profile.get('address'),
              type: 'profile'
            }))
            if (userNames && userNames.length) {
              collections = [...collections, ...userNames]
            }
          }
          if (currentSearchValue.current === searchValue)
            setOptions(collections)
        } else {
          if (currentSearchValue.current === searchValue)
            setOptions(null)
        }
      } catch(err) {

      }
    })()
  }, [Moralis.Object, Moralis.Query, searchValue, allCollections])

  useEffect(() => {
    (async() => {
      let total = 0
      for(let i = 0; i < allCollections.length; i++) {
        let collection = allCollections[i];
        getCollectionInfo(collection.address)
        // eslint-disable-next-line no-loop-func
        .then((result) => {
          if (result) {
            const { totalVolume } = result
            if (totalVolume) {
              total += Number(totalVolume)/ Math.pow(10, 18)
              setTotalVolume(total)
            }
          }
        })
        .catch((err) => {})
      }
    }) ()
  }, [allCollections, getCollectionInfo])

  return (
    <header className="header__1">
      <div className="container">
        <div className="wrapper js-header-wrapper">

        {/* Header Logo */}
        {/* <div>Total Volume: {Number(totalVolume).toFixed(2)} FTM</div> */}
        
          <div>
            <Link to="/home">
              <div className="headerLogo">
                  <img
                  id="logo_js"
                  src="/img/logos/oh.png"
                  alt="logo"
                  style={{marginTop: "-10px"}}
                  />
                  <span style={{fontSize: "20px", fontWeight: "600"}}> Opera House<span style={{fontSize: "10pt"}}>™</span></span>
              </div>
              <div className="headerLogoMobile">
                <img
                id="logo_js"
                src="/img/logos/oh2.png"
                alt="logo"
                style={{marginTop: "-10px"}}
                />
              </div>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="header__search">
            <Dropdown
              value={searchValue}
              setValue={setSearchValue}
              onEnter={handleEnter}
              placeholder='Search collections and accounts...'
              // fluid
              // search={handleSearch}
              // selection
              // selectOnNavigation={false}
              // value={searchValue}
              // // onKeyDown={handleKeyDown}
              options={options}
              // searchQuery={searchQuery}
              // onSearchChange={(e, { searchQuery }) => { setSearchQuery(searchQuery)}}
              // onChange={handleSearchCollection}
            />
          </div>
          
          <div className='d-flex align-items-center'>
          {/* <div className='d-flex m-0 align-items-center'>
            <input
              type="checkbox"
              id="theme-switch"
              name='isOnSale'
              checked={theme === 'normal'}
              onChange={handleChangeTheme}
            />
            <label htmlFor="theme-switch" className='m-0'>Toggle</label>
            <span className="ml-10 text-center"><i className="ri-lightbulb-line"></i></span>
          </div> */}
          <div className="header__search_mobile">
          <MobileSearch
            value={searchValue}
            setValue={setSearchValue}
            onEnter={handleEnter}
            placeholder='Search collections and accounts...'
            // fluid
            // search={handleSearch}
            // selection
            // selectOnNavigation={false}
            // value={searchValue}
            // // onKeyDown={handleKeyDown}
            options={options}
            // searchQuery={searchQuery}
            // onSearchChange={(e, { searchQuery }) => { setSearchQuery(searchQuery)}}
            // onChange={handleSearchCollection}
          />
          </div>
          
          <div className='d-flex align-items-left txt_lg ml-2 mr-4'>
            { theme === 'normal' ? (
              <i class="ri-sun-line" style={{ lineHeight: 1 }} onClick={() => handleChangeTheme(false)}></i>) : (
                <i class="ri-moon-line" style={{ lineHeight: 1 }} onClick={() => handleChangeTheme(true)}></i>
              )
            }
          </div>
          {/* You can change the <ul className=""> to "menu__popup2" to have the dropdown with two columns instead of one.
              For that you will have to create and map the 'right' menu const inside each dropdown jsx file. */}

              {/* Explore Dropdown */}

              {/* Static Menu Mapping  */}
          <div className="header__menu">
            <ul className="d-flex space-x-25">
              <li className="has_popup">
                <Link className="color_black hovered" to="/marketplace">
                Explore
                </Link>
                <ul className="menu__popup space-y-15">
                <MegaMenu />
                </ul>
              </li>
              {PagesMenu.map((val, i) => (
              <li key={i}>
              <Link className="color_black" to={val.link}>
              {val.title}
              </Link>
              </li>
              ))}
                <li className="has_popup">
                <Link className="color_black hovered" to="/profile">
                Profile
                </Link>
                <ul className="menu__popup space-y-15">
                <ProfileSM />
                </ul>
              </li>
              <li className="has_popup">
                <Link className="color_black hovered" to="#">
                Resources
                </Link>
                <ul className="menu__popup space-y-15">
                <ResourcesSM />
                </ul>
              </li>
              <li>
              <TokenPrice
                address="0x69d17c151ef62421ec338a0c92ca1c1202a427ec"
                chain="ftm"
                image="/img/512SNT.png"
                size="20px"
                decimals="18"
              />
              </li>
              <li>
          <a href="https://discord.gg/novanetwork"  className="discord-btn" target="_blank" style={{marginLeft: "5px", marginRight: "5px"}}><i className="ri-discord-fill" /></a> 
              <a href="https://twitter.com/ftmoperahouse" className="twitter-btn" target="_blank" style={{marginLeft: "5px", marginRight: "5px"}}><i className="ri-twitter-fill" /></a>
              </li>
              <li>
                {/* Connect Wallet Button */}
                <Connect />
              </li>
            </ul>
          </div>

              {/* Resources Dropdown */}

          {/* Mobile Menu Parameters */}
          <div className="header__burger js-header-burger" onClick={toggleClass}/>
            <div className={` header__mobile js-header-mobile  ${isActive ? 'visible': null} `}>
              <MobileMenu setActive={setActive} />
            </div>
        </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
