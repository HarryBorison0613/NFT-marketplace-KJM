import React from 'react';
import { Link, useHistory } from 'react-router-dom';
import Footer from '../../../components/footer/Footer';
import Header from '../../../components/header/Header';
import useDocumentTitle from '../../../components/useDocumentTitle';
import generateBase64Encode from '../../../utils/genBase64Encode';
import { useAvatarFormStyles } from '../../../styles/muiStyles';
import CancelIcon from '@material-ui/icons/Cancel';
import { ToastContainer, toast } from 'react-toastify';
import $ from "jquery";
import { create } from 'ipfs-http-client';
import NFTContext from '../../../context/NFTContext';
import 'react-toastify/dist/ReactToastify.css';
import Web3 from 'web3'
import detectEthereumProvider from '@metamask/detect-provider'
import {
  Button,
  IconButton,
  useMediaQuery
} from '@material-ui/core';
import {
  NFTContractABI
} from '../../../constant/contractABI';

const SubmitRequest = () => {
  const history = useHistory();
  useDocumentTitle(' Submit Request');
  const sending = () => toast.success("your request has been sent");
  const [fileName, setFileName] = React.useState('');
  const [assetInput, setAssetInput] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [collectionAddress, setCollectionAddress] = React.useState('');
  const [collectionLinks, setCollectionLinks] = React.useState('');
  const [assetURI, setAssetURI] = React.useState('');
  const client = create('https://ipfs.infura.io:5001/api/v0');
  const classes = useAvatarFormStyles();
  const { walletAddress, web3Instance } = React.useContext(NFTContext);
  const tokenAddress = "0xc013909503f568d1db6a46d18df6896a3534bdd6";

  const handleFileInputChange = async (e) => {
    const file = e.target.files[0];
    setFileName(file.name);
    generateBase64Encode(file, setAssetInput, true);
    
    try {
      const added = await client.add(file)
      const url = `https://ipfs.infura.io/ipfs/${added.path}`
      setAssetURI(url);
      console.log("here", url);
    } catch (error) {
      console.log('Error uploading file: ', error)
    }  
  };
    const notify = () => toast.success('We have recieved your collection request.');

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

  const handleSubmitCollection = async () => {
    const currentProvider = await detectEthereumProvider();
    if (currentProvider) {
      if (!window.ethereum.selectedAddress) {
          await window.ethereum.request({ method: 'eth_requestAccounts' });
      }
    }
    let NFTContractInstance = getContractInstance(NFTContractABI, tokenAddress);
    console.log(NFTContractInstance);
    let collection = [assetURI, email, collectionAddress, collectionLinks, "NFT Collectioni"];
    
    try{
      let result = await NFTContractInstance.methods.createCollection(collection).send({ from: walletAddress });
      console.log(result);
      history.push("/marketplace");
    } catch(err) {
      console.log(err);
    }
  }

  return (
    <div>
      <Header />
      <div className="requests">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8 col-md-10 requests__content">
              <div className="requests__wrap space-y-20">
                <div>
                  <h1 className="text-left">Submit a Collection</h1>
                </div>
                <div className="box is__big">
                  <div className="space-y-20 mb-0">
                    <div className="space-y-10">
                      <span className="nameInput">Your email address</span>
                      <input
                        type="email"
                        className="form-control"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Required to make future changes."
                      />
                    </div>
                    <div className="space-y-10">
                      <span className="nameInput">Collection Name</span>
                      <input
                        type="email"
                        className="form-control"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Required for listing collection."
                      />
                    </div>
                    <div className="space-y-10">
                      <span className="nameInput">Collection Address</span>
                      <input type="text" className="form-control"
                          value={collectionAddress}
                          onChange={(e) => setCollectionAddress(e.target.value)}
                          placeholder="Collection Contract Address"
                      />
                    </div>
                    <div className="space-y-10">
                      <span className="nameInput">Collection Links</span>
                      <textarea 
                        style={{minHeight: 110}} 
                        className="mb-0" 
                        placeholder="All relevant links for project, twitter/discord/etc."
                        value={collectionLinks}
                        onChange={(e) => setCollectionLinks(e.target.value)}

                      />
                    </div>
                    <div className="space-y-10">
                      <span className="nameInput">Category</span>
                      <select
                        className="form-select custom-select"
                        aria-label="Default select example">
                        <option>Games</option>
                        <option>Art</option>
                        <option>Trading Cards</option>
                        <option>Music</option>
                        <option>Memes</option>
                        <option>Collectibles</option>
                      </select>
                    </div>

                    <div className="space-y-10">
                      <span className="nameInput">Collection Owner Address</span>
                      <input
                        type="email"
                        className="form-control"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Must match FTMScan."
                      />
                    </div>
                    <div className="space-y-10">
                      <span className="nameInput">Royalty</span>
                      <select
                        className="form-select custom-select"
                        aria-label="Default select example">
                        <option>1%</option>
                        <option>2%</option>
                        <option>3%</option>
                        <option>4%</option>
                        <option>5%</option>
                        <option>6%</option>
                        <option>7%</option>
                        <option>8%</option>
                        <option>9%</option>
                        <option>10%</option>
                      </select>
                    </div>

                    <div className="requests_footer">
                      <div className="Attach_desc space-x-20">
                        <div className="Attach_file">
                          <input
                            type="file"
                            id="imgUpload"
                            accept="image/*"
                            hidden
                            onChange={handleFileInputChange}
                          />
                          <Button
                            className="btn btn-white"
                            style={{minWidth: 'max-content'}}
                            onClick={handleFileUploadButtonClick}
                          >
                            Collection Display Image
                          </Button>
                        </div>
                        <p className="txt_sm">
                          Maximum file size:
                          <span className="color_black">800 MB</span>
                        </p>
                      </div>
                      <div>
                        <Link to="#" className="btn btn-grad" onClick={notify}>
                          Submit Collection Request
                        </Link>
                        <ToastContainer
                          position="bottom-right"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-4 contact__img" style={{marginTop: "185px"}}>
              <div className="img__wrap">
                {assetURI === "" && (
                  <img src="img/logos/ohlarge.png" alt="ImgPreview" style={{ width: "512px", height: "512px" }}/>
                )}
                {assetURI !== "" && (
                  <IconButton
                    onClick={clearfileSelection}
                    color="secondary"
                    size={'small'}
                    className={classes.clearSelectionBtn}
                    style={{float: "right"}}
                  >
                    <CancelIcon />
                  </IconButton>
                )}
                {assetURI !== "" && (
                    <img src={assetInput} alt="ImgPreview"  style={{ width: "460px", height: "650px" }}/>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default SubmitRequest;
