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
      <iframe src="https://novanetwork.io/external/submit-collection/" title="Submit Collection" height="2400px" width="100%">
      </iframe>
      </div>
      <Footer />
    </div>
  );
};

export default SubmitRequest;
