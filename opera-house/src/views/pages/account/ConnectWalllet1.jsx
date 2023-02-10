import React, {useRef} from 'react';
import {Link} from 'react-router-dom';
import Footer from '../../../components/footer/Footer';
import Header from '../../../components/header/Header';
import useDocumentTitle from '../../../components/useDocumentTitle';
import Popup from 'reactjs-popup';
import Web3 from 'web3'
import detectEthereumProvider from '@metamask/detect-provider'
import 'reactjs-popup/dist/index.css';
import NFTContext from '../../../context/NFTContext';

const wallets = [
  {
    title: 'MetaMask',
    p: "A popular Web3 browser extension for decentralised applications.",
    popup: 'error',
  },
];

const ConnectWallet = () => {
  const ref = useRef();
  const closeTooltip = () => ref.current.close();
  const { setWeb3Instance } = React.useContext(NFTContext);

  useDocumentTitle('Wallet');

  const connectMetamask = async () => {
    const currentProvider = await detectEthereumProvider();
    if (currentProvider) {
        let web3InstanceCopy = new Web3(currentProvider);
        setWeb3Instance(web3InstanceCopy);
        console.log(web3InstanceCopy);
        if (!window.ethereum.selectedAddress) {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
        }
        await window.ethereum.enable();
        let currentAddress = window.ethereum.selectedAddress;
        localStorage.setItem('walletAddress', currentAddress);
        console.log("currentAddress", currentAddress);
    } else {
        console.log('Please install MetaMask!');
    }
  }

  return (
    <div className="effect">
      <Header />
      <div className="container">
          <div className="hero__wallets pt-100 pb-50">
            <div className="space-y-20 d-flex flex-column align-items-center">
              <div className="logo">
                <img src={`img/logos/ohminibeta.png`} alt="ImgPreview" />
              </div>
              <p className="text-center">
                Please select one of the available providers below to connect your wallet.
              </p>

          </div>
        </div>

        <div className="row justify-content-center">
          <div className="col-lg-9">
            <div className="wallets">
              <div className="row mb-20_reset">
                {wallets.map((val, i) => (
                  <div className="col-lg-4" key={i}>
                    {val.title !== "MetaMask" &&
                      <Popup
                        className="custom"
                        ref={ref}
                        trigger={
                          <button className="box in__wallet space-y-10">
                            <div className="logo">
                              <img
                                src={`img/icons/${val.title}.svg`}
                                alt="logo_community"
                              />
                            </div>
                            <h5 className="text-center">{val.title}</h5>
                            <p className="text-center">{val.p}</p>
                          </button>
                        }
                        position="bottom center">
                        <div>
                          <div
                            className="popup"
                            id="popup_bid"
                            tabIndex={-1}
                            role="dialog"
                            aria-hidden="true">
                            <div>
                              <button
                                type="button"
                                className="button close"
                                data-dismiss="modal"
                                aria-label="Close"
                                onClick={closeTooltip}>
                                <span aria-hidden="true">×</span>
                              </button>

                              <div className="space-y-20">
                                <h3 className="text-center">Wallet Connected!</h3>
                                <p className="text-center">
                                  You have sucessfully connected your wallet, now
                                  you can start bidding or upload your own art!
                                </p>
                                <div className="d-flex justify-content-center space-x-20">
                                  <Link to="marketplace" className="btn btn-dark">
                                    Discover Assets
                                  </Link>
                                  <Popup
                                    className="custom"
                                    ref={ref}
                                    trigger={
                                      <button className="btn btn-grad">
                                        Create item
                                      </button>
                                    }
                                    position="bottom center">
                                    <div>
                                      <div
                                        className="popup"
                                        id="popup_bid"
                                        tabIndex={-1}
                                        role="dialog"
                                        aria-hidden="true">
                                        <div>
                                          <button
                                            type="button"
                                            className="button close"
                                            data-dismiss="modal"
                                            aria-label="Close"
                                            onClick={closeTooltip}>
                                            <span aria-hidden="true">×</span>
                                          </button>
                                          <div className="space-y-20">
                                            <h3 className="color_red">Error!</h3>
                                            <p>
                                              User rejected the request.. <br />
                                              If the problem persist please
                                              Contact support
                                            </p>
                                            <button
                                              to="#"
                                              className="btn btn-primary">
                                              Try again
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </Popup>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Popup>
                    }
                    {val.title === "MetaMask" &&
                      <button className="box in__wallet space-y-10" onClick={connectMetamask}>
                        <div className="logo">
                          <img
                            src="/img/logos/mm.png "

                            alt="logo_community"
                          />
                        </div>
                        <h5 className="text-center">{val.title}</h5>
                        <p className="text-center">{val.p}</p>
                      </button>
                    }
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ConnectWallet;
