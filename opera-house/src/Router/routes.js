import React, { useEffect, useMemo, useState } from "react";
import { QueryClient, QueryClientProvider } from 'react-query'


// All HOME PAGE ROUTES

import Home from "../views/homes/Home"

//  Account inner pages
import ConnectWalllet from "../views/pages/account/ConnectWalllet"
import EditProfile from "../views/pages/account/EditProfile"
import Login from "../views/pages/account/Login"
import Profile from "../views/pages/account/Profile"
import Register from "../views/pages/account/Register"

//  Blog inner pages
import Blog from "../views/pages/blog/Blog"
import Article from "../views/pages/blog/Article"

//  item inner pages

import ItemDetails from "../views/pages/item/ItemDetails"
import Mint from "../views/pages/item/Mint"
import UploadType from "../views/pages/item/UploadType"

// NftPages
import Collections from "../views/pages/NftPages/Collections"
import Creators from "../views/pages/NftPages/Creators"
import LiveAuctions from "../views/pages/NftPages/LiveAuctions"
import Marketplace from "../views/pages/NftPages/Marketplace"
import MostLike from "../views/pages/NftPages/MostLike"
import Ranking from "../views/pages/NftPages/Ranking"
import OfficialPartners from "../views/pages/NftPages/OfficialPartners"

// other pages
import Activity from "../views/pages/others/Activity"
import Newsletter from "../views/pages/others/Newsletter"
import NoResults from "../views/pages/others/NoResults"
import PrivacyPolicy from "../views/pages/others/PrivacyPolicy"
import NotFound from "../views/NotFound"
import Chat from "../views/pages/Support/Chat"
import SubmitCollection from "../views/pages/Support/NewSubmitCollection"
import Faq from "../views/pages/Support/Faq"
import Sponsored from "../views/pages/Support/Sponsored"
import Forum from "../views/pages/forum/Forum"
import NowMinting from "../views/pages/NftPages/NowMinting"
import AuditRequest from "../views/pages/Support/AuditRequest"
import NFTContext from '../context/NFTContext';
import Web3 from 'web3'
import { useMoralis } from "react-moralis";
import useTheme from "../themes/useTheme";

// Route Specific
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import SubmitWeb3Form from "../views/pages/Support/SubmitWeb3Form";
import ThemeContext from "../context/ThemeContext";
import useCollections from "../hooks/useCollections";
import EditCollection from "../views/pages/Support/EditCollection";
import LiveMints from "../components/creators/LiveMints";
import MintingNow from "../views/pages/NftPages/NowMinting";
import Collection from "../views/pages/NftPages/Collection";
import MarketplaceContext from "../context/MarketplaceContext";
import { marketplaceABI } from "../constant/contractABI";
import { config } from "../constant/config";
import LastSold from "../views/pages/NftPages/LastSold";

const queryClient = new QueryClient()

const getContractInstance = (contractABI, contractAddress) => {
  const web3 = new Web3(new Web3.providers.HttpProvider('https://rpc.ftm.tools/'));
  const contract = new web3.eth.Contract(contractABI, contractAddress);
  return contract;
}

const Routes =  () => {
    const { auth, user, isInitialized, isAuthenticated, authenticate, logout, web3, enableWeb3, isWeb3Enabled, account, chainId , Moralis } = useMoralis()
    const [walletChainId, setWalletChainId] = React.useState(250)
    const [connectType, setConnectType] = React.useState()
    const [walletAddress, setWalletAddress] = useState()
    const { _theme, _setTheme, changeTheme } = useTheme('dark')
    const { collections, tokenPrices } = useCollections()
    const [serviceFee, setServiceFee] = useState(0)
    
    const switchNetwork = React.useCallback(async () => {
        try {
          await web3.currentProvider.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0xfa" }],
          });
        } catch (error) {
          if (error.code === 4902) {
            try {
              await web3.currentProvider.request({
                method: "wallet_addEthereumChain",
                params: [
                  {
                    chainId: 250,
                    chainName: "Fantom Opera",
                    rpcUrls: ["https://rpc.ftm.tools/"],
                    nativeCurrency: {
                      name: "Fantom",
                      symbol: "FTM",
                      decimals: 18,
                    },
                    blockExplorerUrls: ["https://ftmscan.com/"],
                  },
                ],
              });
            } catch (error) {
              alert(error.message);
            }
          }
        }
      }, [web3.currentProvider])

    useEffect(() => {
      const provider = localStorage.getItem('provider')
      if (provider) {
        setConnectType(provider)
      } else {
        setConnectType('idle')
      }
    }, [])
    useEffect(() => {
      (async () => {
        if (isInitialized && connectType && !isWeb3Enabled ) {
          if (connectType === 'metamask') {
            enableWeb3({ chainId: 250 })
          } else if (connectType === 'walletconnect') {
            enableWeb3({ provider: 'walletconnect', chainId: 250 })
          } else {
            enableWeb3({ chainId: 250 })
          }
        }
      }) ()
    }, [enableWeb3, isInitialized, connectType, isWeb3Enabled, isAuthenticated])

    useEffect(() => {
      const marketplaceInstance = getContractInstance(marketplaceABI, config.marketplaceAddress);
      marketplaceInstance.methods.getServiceFee().call()
      .then((result) => {
        if (result) {
          setServiceFee(result)
        }
      })
      .catch((err) => {
          console.log('get Metadata err');
      });
    })

    useEffect(() => {
      if (user) {
        const { attributes } = user
        if (attributes) {
          const {accounts} = attributes
          setWalletAddress(accounts[0])
        }
      }
    }, [user])

    useEffect(() => {
      if (account && connectType === 'metamask') {
        setWalletAddress(account)
      }
    }, [account, connectType])

    const [searchCollections, setSearchCollections] = React.useState([]);

    return (
      <ThemeContext.Provider value={{theme: _theme, setTheme: _setTheme }}>
        <MarketplaceContext.Provider value={{ serviceFee }}>
          <NFTContext.Provider value={{ collections, tokenPrices, searchCollections, setSearchCollections, walletAddress, web3Instance: web3, chainId, isWeb3Enabled, walletChainId, setWalletChainId, connectType, setConnectType }} >
            <QueryClientProvider client={queryClient}>
              <Router>
                  <Switch>
                      <Route exact path="/" component={Home} />
                      <Route path="/home" component={Home} />
                      {/* inner pages */}
                      {/* <Route path="/connect-wallet" component={ConnectWalllet} /> */}
                      {/*<Route path="/login" component={Login} />*/}
                      <Route path="/profile/:address?" component={Profile} />
                      <Route path="/edit-profile" component={EditProfile} />
                      {/*<Route path="/register" component={Register} />*/}
                      {/*<Route path="/blog" component={Blog} />*/}
                      {/*<Route path="/article" component={Article} />*/}
                      <Route path="/item-details/:collectionAddress/:id" component={ItemDetails} />
                      <Route path="/mint" component={Mint} />
                      <Route path="/fantom-watch" component={NowMinting} />
                      {/*<Route path="/upload-type" component={UploadType} />*/}
                      <Route path="/collections" component={Collections} />
                      {/*<Route path="/creators" component={Creators} />*/}
                      <Route path="/auctions" component={LiveAuctions} />
                      <Route path="/marketplace" component={Marketplace} />
                      <Route path="/most-like" component={MostLike} />
                      <Route path="/last-sold" component={LastSold} />
                      <Route path="/collection/:collectionAddress" component={Collection} />
                      {/* <Route path="/ranking" component={Ranking} /> */}
                      <Route path="/official-partners" component={OfficialPartners} />
                      {/*<Route path="/activity" component={Activity} />*/}
                      {/*<Route path="/newsletter" component={Newsletter} />*/}
                      {/* <Route path="/chat" component={Chat} /> */}
                      <Route path="/submit-collection" component={SubmitCollection} />
                      <Route path="/edit-collection/:collectionAddress" component={EditCollection} />
                      <Route path="/encore" component={SubmitWeb3Form} />
                      {/*<Route path="/no-results" component={NoResults} />*/}
                      {/*<Route path="/faq" component={Faq} />*/}
                      {/*<Route path="/sponsored" component={Sponsored} />*/}
                      {/*<Route path="/privacy-policy" component={PrivacyPolicy} />*/}
                      {/*<Route path="/forum" component={Forum} />*/}
                      {/*<Route path="/post-details" component={PostDetails} />*/}
                      <Route path="/audit" component={AuditRequest} />

                      {/* List of Custom Domains (Paid) */}

                      {/* Erebus */}
                      <Route path='/p/erebus' component={() => {
                          window.location.href = '/profile/0x50f2931949c7782c478b45b2BF6cefF3B3aa80A2';
                            return null;
                      }}/>


                      <Route component={NotFound} />



                      {/* Collection Minting Dapps. Just change the path and the folder.*/}

                        Example:
                        {/* <Route path="/URLYOUWANT" component="mintingDapp/MINTINGDAPPFOLDER" /> */}


                  </Switch>
              </Router>
            </QueryClientProvider>
          </NFTContext.Provider>
        </MarketplaceContext.Provider>
      </ThemeContext.Provider>
    );
};

export default Routes;
