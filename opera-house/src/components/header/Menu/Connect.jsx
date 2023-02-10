import { useContext, useRef, useEffect } from "react";
import { useMoralis } from "react-moralis"
import { Link } from 'react-router-dom';
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';
import NFTContext from "../../../context/NFTContext";

const wallets = [
  {
    title: 'MetaMask',
    p: "Web3 browser extension.",
    popup: 'error',
    icon: 'metamask'
  },
  {
    title: 'WalletConnect',
    p: 'Any wallet, on any device.',
    popup: 'error',
    icon: 'walletconnect'
  }
];

const getAbbrWalletAddress = (walletAddress) => {
  let abbrWalletAddress = walletAddress.substring(0, 4) + "..." + walletAddress.substring(38, 42);
  return abbrWalletAddress.toUpperCase();
}

const Connect = () => {
  const { connectType, setConnectType, walletAddress } = useContext(NFTContext)
  const { isInitialized, isAuthenticated, auth, account, authenticate, logout, enableWeb3 } = useMoralis()
  const ref = useRef()
  const closeTooltip = () => ref.current.close();

  const connectMetamask = async () => {
    if (!isAuthenticated) {
      await authenticate({ signingMessage: "Welcome to Opera House!", onSuccess: () => {
        setConnectType('metamask')
        localStorage.setItem('provider', 'metamask')
      }})
    }
  }

  const connectWalletconnect = async (e) => {
    if (!isAuthenticated) {
      await authenticate({ provider: "walletconnect", chainId: 250,
      mobileLinks: [
        "metamask",
        "trust",
        "rainbow",
        "argent",
        "imtoken",
        "pillar"
      ],
      onSuccess: () => {
        setConnectType('walletconnect')
        localStorage.setItem('provider', 'walletconnect')
      }})
    }
  }

  return (
    <>
    <Popup
      className="custom"
      ref={ref}
      trigger={
        <Link
          to="#"
          className='btn btn-connect btn-m'
        >{(isAuthenticated) ? (
          <>
            <i className="btn-connect" />
            { walletAddress ? getAbbrWalletAddress(walletAddress) :'Authenticating...' }
          </>
          ) : (
            <>
              <i className="btn-connect" />
              Connect Wallet
            </>
          )
        }
        </Link>
      }
      position="bottom center"
    >
      <div>
        <div
          className="popup"
          id="popup_wallet_connect"
          tabIndex={-1}
          role="dialog"
          aria-hidden="true">
          <div>
          { (auth.state === 'authenticating') ? (
            <div>Authenticating...</div>
          ) : (
            <div className="space-y-20">
            { isAuthenticated ? (
              <>
                <div className="text-center"><b>Wallet Address</b></div>
                <div className="text-center" style={{fontSize:"9pt"}}>{walletAddress}</div>
                <button className="btn btn-primary w-full" onClick={() => logout()}>
                  Logout
                </button>
              </>
            ) : (
              <>
              {wallets.map((val, i) => (
                <div className="col-lg-12" key={i}>
                  {val.title !== "MetaMask" &&

                        <button className="box in__wallet w-full" onClick={connectWalletconnect}>
                          <div className="logo m-2 d-flex justify-content-center align-items-center">
                            <img
                              src={`/img/icons/${val.icon}.svg`}
                              width={40}
                              alt="logo_community"
                            />
                            <h5 className="text-center">&nbsp;{val.title}</h5>
                          </div>
                          <p className="text-center">{val.p}</p>
                        </button>

                  }
                  {val.title === "MetaMask" &&
                    <button className="box in__wallet w-full" onClick={connectMetamask}>
                      <div className="logo m-2 d-flex justify-content-center align-items-center">
                        <img
                          src="/img/logos/mm.png"
                          width={40}
                          alt="logo_community"
                        />
                        <h5 className="text-center">&nbsp;{val.title}</h5>
                      </div>
                      <p className="text-center">{val.p}</p>
                    </button>
                  }
                  </div>
                ))}
              </>
              )}
            </div>
          )
          }
          </div>
        </div>
      </div>
    </Popup>
    </>
  )
}

export default Connect
