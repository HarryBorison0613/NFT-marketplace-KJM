import React, { useState, useRef } from 'react';
import { Link, useHistory } from 'react-router-dom';
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

const collectionAddress = config.contractAddress;

const Upload = () => {
  useDocumentTitle('Upload');
  const ref = useRef();
  const history = useHistory();
  const walletAddress = localStorage.getItem("walletAddress");
  const client = create('https://ipfs.infura.io:5001/api/v0');
  const theme = useTheme();
  const classes = useAvatarFormStyles();
  const [fileName, setFileName] = useState('');
  const [assetInput, setAssetInput] = useState('');
  const isMobile = useMediaQuery(theme.breakpoints.down('xs'));
  const [assetURI, setAssetURI] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [networkError, setNetworkError] = useState(false);
  const [royalty, setRoyalty] = useState('10');
  const creater = walletAddress;
  var web3Instance = null;

  var NFTContractInstance = null;

  const handleFileInputChange = async (e) => {
    const file = e.target.files[0];
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

  const getContractInstance = (contractABI, contractAddress) => {
    if (web3Instance) {
        let contract = new web3Instance.eth.Contract(contractABI, contractAddress);
        return contract;
    }
    else {
        return null;
    }
  }

  const getTokenId = async () => {
    let tokenCount = 0;
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
    const currentProvider = await detectEthereumProvider();
    console.log("eee", walletAddress);
    web3Instance = new Web3(currentProvider);
    NFTContractInstance = getContractInstance(NFTContractABI, collectionAddress);
    let tokenId = await getTokenId(NFTContractInstance);
    let Price = 0;
    let metadata = [assetURI, title, description, Price, false, royalty,creater, collectionAddress];
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

  React.useEffect(async () => {
    const currentProvider = await detectEthereumProvider();
    web3Instance = new Web3(currentProvider);
    let chainId = await web3Instance.eth.getChainId();
    let accounts = await web3Instance.eth.getAccounts();
    console.log("chainId", chainId);
    console.log("accouts", accounts);
    if(chainId != 250 || !accounts.length) {
      setNetworkError(true);
      console.log("error set");
    }
  })

  return (
    <div>
      <Header />
      <div className="hero__upload">
        <div className="container">
          <div className="space-y-20">
            <h1 className="title">Create single NFT</h1>
          </div>
        </div>
      </div>
      <div className="container">
        <div className="box in__upload mb-120">
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
              {assetInput && (
                <div className={classes.imagePreview}>
                  <img alt={fileName} src={assetInput} width={isMobile ? 250 : 350} />
                </div>
              )}
              {!assetInput && (
                <div className="left__part space-y-40 md:mb-20 upload_file">
                  <div className="space-y-20">
                    <img
                      className="icon"
                      src={`img/logos/oh2.png`}
                      alt="upload"
                    />
                    <h5>Drag and drop your file</h5>
                    <p className="color_text">
                      PNG, GIF, WEBP, MP4 or MP3. Max 100mb.
                    </p>
                  </div>
                  <div className="space-y-20">
                    <p className="color_text">or choose a file</p>
                    <input
                        type="file"
                        id="imgUpload"
                        accept="image/*"
                        hidden
                        onChange={handleFileInputChange}
                      />
                    <Button className="btn btn-white" onClick={handleFileUploadButtonClick}>
                      Browse files
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <div className="col-lg-6">
              <div className="form-group space-y-10">
                <div className="space-y-20">
                  <div className="space-y-10">
                    <span className="nameInput">Title</span>
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
                      Description
                      <span className="color_text">(optional) </span>
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
                      <span className="color_text">(%) </span>
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="10"
                      value={royalty}
                      onChange={(e) => setRoyalty(e.target.value)}
                    />
                  </div>
                  <div className="space-y-10">
                    <span className="variationInput">Choose collection</span>
                    <div className="d-flex flex-column flex-md-row">
                      <div className="choose_collection bg_black  ">
                        <img
                          src={`img/logos/oh.png`}
                          alt="OperaHouse_icon"
                        />

                        <span className="color_white ml-10">
                          OperaHouse Collection
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <p className="color_black">
                <span className="color_text text-bold"> Service fee : </span>
                1%
              </p>
              <p></p>
            </div>
          </div>
        </div>
      </div>
      <div className="fixed_row bottom-0 left-0 right-0">
        <div className="container">
          <div className="row content justify-content-between mb-20_reset">
            <div className="col-md-auto col-12 mb-20">
              <div className="space-x-10">
                <Link
                  to="/home"
                  className="btn btn-white others_btn">
                  Cancel
                </Link>
              </div>
            </div>
            <div className="col-md-auto col-12 mb-20">
              {!networkError && (
                <Link
                  to="#"
                  className="btn btn-grad btn_create"
                  onClick={handleCreateNFT}
                >
                  Create item
                </Link>
              )}
              {networkError && (
                <Popup
                  className="custom"
                  ref={ref}
                  trigger={
                    <Link
                      to="#"
                      className="btn btn-grad btn_create"
                    >
                      Create item
                    </Link>
                  }
                  position="bottom center"
                >
                    <p>Please connect wallet or connect FTM network!</p>
                </Popup>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;
