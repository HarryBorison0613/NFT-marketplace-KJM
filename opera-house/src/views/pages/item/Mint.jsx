import React, { useState, useRef, useContext } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { useMoralisWeb3Api, useMoralis } from 'react-moralis';
import useDocumentTitle from '../../../components/useDocumentTitle';
import Header from '../../../components/header/Header';
import generateBase64Encode from '../../../utils/genBase64Encode';
import { useTheme } from '@material-ui/core/styles';
import CancelIcon from '@material-ui/icons/Cancel';
import { useAvatarFormStyles } from '../../../styles/muiStyles';
import NFTContext from '../../../context/NFTContext';
import Popup from 'reactjs-popup';
import { create } from 'ipfs-http-client';
import Web3 from 'web3'
import detectEthereumProvider from '@metamask/detect-provider'
import {
  NFTContractABI
} from '../../../constant/contractABI';
import $ from "jquery";
import {
  Button,
  IconButton,
  useMediaQuery
} from '@material-ui/core';
import { config } from "../../../constant/config"
import Footer from '../../../components/footer/Footer';

const collectionAddress = config.contractAddress;

const Upload = () => {
  useDocumentTitle('Upload');
  const ref = useRef();
  const history = useHistory();
  const { walletAddress } = useContext(NFTContext);
  const { web3, enableWeb3, isWeb3Enabled } = useMoralis();
  const client = create('https://ipfs.infura.io:5001/api/v0');
  const theme = useTheme();
  const classes = useAvatarFormStyles();
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState('');
  const [assetInput, setAssetInput] = useState('');
  const isMobile = useMediaQuery(theme.breakpoints.down('xs'));
  const [assetURI, setAssetURI] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  // const [networkError, setNetworkError] = useState(false);
  const [royalty, setRoyalty] = useState('10');

  const networkError = (!walletAddress)

  const handleFileInputChange = async (e) => {
    const file = e.target.files[0];
    if(file.type.indexOf("image") != -1) setFileType("image");
    if(file.type.indexOf("video") != -1) setFileType("video");

    setFileName(file.name);
    generateBase64Encode(file, setAssetInput, true);

    try {
      const added = await client.add(file)
      const url = `https://ipfs.infura.io/ipfs/${added.path}`
      setAssetURI(url);
      console.log(url);
    } catch (error) {
      console.log('Error uploading file: ', error)
    }
  };

  const handleFileUploadButtonClick = () => {
    $('#imgUpload').trigger('click')
  }

  const clearfileSelection = () => {
    setAssetInput('');
    setFileName('');
  };

  const getContractInstance = React.useCallback(async (contractABI, contractAddress) => {
    if (isWeb3Enabled && web3) {
        let contract = new web3.eth.Contract(contractABI, contractAddress);
        return contract;
    }
    else {
      const web3 = new Web3(new Web3.providers.HttpProvider('https://rpc.ftm.tools/'));
      const contract = new web3.eth.Contract(contractABI, contractAddress);
      return contract;
    }
  }, [isWeb3Enabled, web3])

  const getTokenId = async () => {
    let tokenCount = 0;
    const NFTContractInstance = await getContractInstance(NFTContractABI, collectionAddress);
    await NFTContractInstance.methods.totalTokenCount().call()
      .then((result) => {
          tokenCount = parseInt(result);
      })
      .catch((err) => {
          console.log('get tokenTotalCount err', err);
      });
    return tokenCount + 1;
  }

  const handleCreateNFT = async () => {
    // if (!assetURI || assetURI === '') return;
    // if (!title || title === '') return;
    const NFTContractInstance = await getContractInstance(NFTContractABI, collectionAddress);
    let tokenId = await getTokenId();
    let Price = 0;

    let metadata = [assetURI, fileType, title, description, Price, false, royalty * 1000, walletAddress, collectionAddress];
    try{
      let result = await NFTContractInstance.methods.mint(tokenId, metadata).send({ from: walletAddress });
      console.log(result);
      const timer = setTimeout(() => {
        history.push("/item-details/" + collectionAddress + "/" + tokenId);
        window.location.reload();
      }, 5000);
    } catch(err) {
      console.log(err);
    }
  }

  // React.useEffect(()=> {
  //   const checkNetwork = async () => {
  //     // const currentProvider = await detectEthereumProvider();
  //     // web3Instance = new Web3(currentProvider);
  //     // let chainId = await web3Instance.eth.getChainId();
  //     // let accounts = await web3Instance.eth.getAccounts();
  //     // console.log("chainId", chainId);
  //     // console.log("accouts", accounts);
  //     // if(chainId !== 250 || !accounts.length) {
  //     //   setNetworkError(true);
  //     //   console.log("error set");
  //     // }
  //     if (!isWeb3Enabled || Number(chainId !== 250)) {
  //       setNetworkError(true)
  //     } else {
  //       setNetworkError(false)
  //     }
  //   }
  //   checkNetwork()
  // }, [isInitialized, isAuthenticated, auth, chainId, isWeb3Enabled])

  return (
    <>
    <div style={{flexGrow: 1}}>
      <Header />

        <div className="container">
          <br />
          <div className="container">
            <div className="box in__upload mb-100">
              <div className="row">
                <div className="col-lg-6">
                {assetInput && (
                  <IconButton
                    onClick={clearfileSelection}
                    color="secondary"
                    size={isMobile ? 'small' : 'medium'}
                    className={classes.clearSelectionBtn}
                    style={{float: "right"}}
                  >
                    <CancelIcon />
                  </IconButton>
                )}
                  {assetURI && assetInput && fileType == "image" && (
                    <div className={classes.imagePreview}>
                      <img alt={fileName} src={assetInput} width={isMobile ? 250 : 350} />
                    </div>
                  )}
                  {assetURI && assetInput && fileType == "video" && (
                    <video width={isMobile ? 250 : 350} controls >
                      <source src={assetInput} id="video_here" />
                      Your browser does not support HTML5 video.
                    </video>
                  )}
                  {!assetInput && (
                    <div className="left__part space-y-40 md:mb-20 upload_file">
                      <div className="space-y-20">
                        <img
                          className="icon"
                          src={`img/logos/oh2.png`}
                          alt="upload"
                        />
                        <h5>Drag and drop your file here.</h5>
                        <p className="color_text">
                          PNG, GIF, WEBP, MP4 or MP3. (Max. 50MB)
                        </p>
                      </div>
                      <div className="space-y-20">
                        <p className="color_text">Or browse for files using the button below.</p>
                        <input
                            type="file"
                            id="imgUpload"
                            accept=".mp4,.m4v,.png,.jpg,.jpeg,.avi,.mp3"
                            hidden
                            onChange={handleFileInputChange}
                          />
                        <Button className="btn btn-primary" onClick={handleFileUploadButtonClick} style={{color: "#FFF", padding: "20px"}}>
                          Browse Files
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="col-lg-6">
                  <div className="form-group space-y-10">
                    <div className="space-y-20">
                      <div className="space-y-10">
                        <span className="nameInput">NFT Name</span>
                        <input
                          type="text"
                          className="form-control"
                          placeholder=""
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                        />
                      </div>
                      <div className="space-y-10">
                        <span className="nameInput">
                          NFT Description
                          <span className="color_text"> (Optional) </span>
                        </span>
                        <input
                          type="text"
                          className="form-control"
                          placeholder=""
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                        />
                      </div>
                      <div className="space-y-10">
                        <span className="nameInput">
                          Royalty
                          <span className="color_text"> (%)</span>
                        </span>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="5"
                          value={royalty}
                          onChange={(e) => setRoyalty(e.target.value)}
                        />
                      </div>
                      <div className="space-y-10">
                        <span className="variationInput">Choose Collection</span>
                        <div className="d-flex flex-column flex-md-row">
                          <div className="choose_collection bg_black  ">
                            <img
                              src={`img/logos/oh.png`}
                              alt="OperaHouse_icon"
                            />

                            <span className="color_white ml-10">
                              Opera House™ Community Collection
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="color_black" style={{marginBottom: "20px"}}>
                    <span className="color_text text-bold"> Service Fee: </span>
                    1%
                  </p>
                  <p><div className="col-md-auto col-12 mb-20">
                    {!networkError && (
                      <Link
                        to="#"
                        className="btn btn-primary"
                        onClick={handleCreateNFT}
                      >
                        Create NFT
                      </Link>
                    )}
                    {networkError && (
                      <Popup
                        className="custom"
                        ref={ref}
                        trigger={
                          <Link
                            to="#"
                            className="btn btn-primary"
                          >
                            Create NFT
                          </Link>
                        }
                        position="bottom center"
                      >
                          <p>Please connect wallet or connect FTM network!</p>
                      </Popup>
                    )}
                  </div></p>
                </div>
              </div>
            </div>
          </div>
      </div>

      {/* <div className="fixed_row bottom-0 left-0 right-0">
        <div className="container">
          <div className="row content justify-content-between mb-20_reset">
            <div className="col-md-auto col-12 mb-20">
            <div className="space-x-10">
              <Link
                to="/home"
                className="text-center mx-auto btn btn-white others_btn" style={{width:"100%"}}>
                Cancel
              </Link>
            </div>
            </div>

          </div>
        </div>
      </div> */}
    </div>
    <Footer />
    </>
  );
};

export default Upload;
