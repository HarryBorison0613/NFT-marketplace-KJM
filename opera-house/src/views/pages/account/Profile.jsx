import React, { useCallback, useContext, useEffect, useReducer, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Sidebar } from 'semantic-ui-react';
import SidebarProfile from '../../../components/sidebars/SidebarProfile';
import Footer from '../../../components/footer/Footer';
import Header from '../../../components/header/Header';
import HeroMarketplace from '../../../components/hero/HeroMarketplace';
import {Tab, Tabs, TabList, TabPanel} from 'react-tabs';
import useDocumentTitle from '../../../components/useDocumentTitle';
import MenuProfile from '../elements/MenuProfile';
import { useMoralis, useMoralisWeb3Api } from 'react-moralis';
import NFTContext from '../../../context/NFTContext';

function checkAddress(address) {
  if (address && address.length === 42) {
    if (address.substring(0, 2) === '0x') return true
    else return false
  } else return false
}

const profileReducer = (data, action) => {
  switch (action.type) {
    case 'update':
      return { ...data, ...action.data }
    case 'set':
      return action.data
    default:
      break;
  }
}
const Profile = () => {
  const { address } = useParams();
  const [paidAccountAddress, setPaidAccountAddress] = useState()
  const { Moralis, isInitialized } = useMoralis()
  const { walletAddress } = useContext(NFTContext)
  const [profile, profileDispatch] = useReducer(profileReducer, {})
  const [follow, setFollow] = useState(null)
  const loadOrder = useRef(0)

  const updateProfile = useCallback((newAttrs) => {
    profileDispatch({ type: 'update', data: newAttrs })
  }, [])

  const handleFollow = useCallback(async (state) => {
    try {
      let accountAddress = null
      if (checkAddress(address)) {
        accountAddress = address.toLowerCase()
      } else if (paidAccountAddress) {
        accountAddress = paidAccountAddress.toLowerCase()
      }
      const Follow = Moralis.Object.extend('Follow')
      const query = new Moralis.Query(Follow)
      query.equalTo('follower_address', accountAddress)
      query.equalTo('following_address', walletAddress.toLowerCase())
      const followObj = await query.first()
      if (followObj) {
        if (!state) {
          await followObj.destroy()
          setFollow(false)
        } else {
          setFollow(true)
        }
      }
      else {
        if (state) {
          const newFollow = new Follow()
          newFollow.set('follower_address', accountAddress)
          newFollow.set('following_address', walletAddress.toLowerCase())
          await newFollow.save()
          setFollow(true)
        } else {
          setFollow(false)
        }
      }
    } catch (err) {
      console.log(err)
    }
  }, [Moralis, walletAddress, address, paidAccountAddress])

  useEffect(() => {
    (async () => {
      if (isInitialized) {
        loadOrder.current ++;
        const order = loadOrder.current
        if (!address && !walletAddress) return
        if (!address || checkAddress(address)) {
          let accountAddress = address ? address : walletAddress
          const Profile = Moralis.Object.extend('Profile')
          const query = new Moralis.Query(Profile)
          query.equalTo('address', accountAddress.toLowerCase())
          query.first()
          .then((profile) => {
            if (order === loadOrder.current) {
              if (profile) {
                const { attributes } = profile
                if (attributes) {
                  const { paid } = attributes
                  updateProfile({ ...attributes, address: accountAddress })
                }
              } else {
                profileDispatch({ type: 'set', data: {}})
              }
            }
          })
        } else {
          let username = address
          username = username.replaceAll('_', ' ')
          const Profile = Moralis.Object.extend('Profile')
          const query = new Moralis.Query(Profile)
          query.matches('displayName', username, 'i')
          query.first()
          .then((profile) => {
            if (order === loadOrder.current) {
              if (profile) {
                const { attributes } = profile
                if (attributes) {
                  const { paid, address } = attributes
                  if (paid) {
                    setPaidAccountAddress(address)
                    updateProfile({ ...attributes })
                  }
                }
              } else {
                profileDispatch({ type: 'set', data: {}})
              }
            }
          })
        }
      }
    }) ()
  }, [isInitialized, address, Moralis, walletAddress, updateProfile])

  useEffect(() => {
    if (isInitialized) {
      let accountAddress = null
      if (checkAddress(address)) {
        accountAddress = address.toLowerCase()
      } else if (paidAccountAddress) {
        accountAddress = paidAccountAddress.toLowerCase()
      }
      if (accountAddress && walletAddress && accountAddress !== walletAddress.toLowerCase()) {
        const Follow = Moralis.Object.extend('Follow')
        const query = new Moralis.Query(Follow)
        query.equalTo('follower_address', accountAddress)
        query.equalTo('following_address', walletAddress.toLowerCase())
        query.first()
        .then((followObj) => {
          if (followObj) setFollow(true)
          else setFollow(false)
        })
      }
    }
    
  }, [address, paidAccountAddress, isInitialized, Moralis, walletAddress])

  useDocumentTitle('Profile ');
  return (
    <>
      <div style={{flexGrow: 1}} className="w-100">
        <Header />
        <SidebarProfile profile={profile} follow={follow} handleFollow={handleFollow}/>
        <HeroMarketplace />
        <div className="w-100 d-flex justify-content-center">
          {(!address || checkAddress(address)) ? (
            <MenuProfile address={address} updateProfile={updateProfile} />
          ) : (
            paidAccountAddress && <MenuProfile address={paidAccountAddress} updateProfile={updateProfile} />
          )}
        </div>
        
      </div>
    <Footer />
    </>
  );
};

export default Profile;
