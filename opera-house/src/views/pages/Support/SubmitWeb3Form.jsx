import React, { useCallback, useContext, useEffect, useState } from 'react'
import Popup from 'reactjs-popup';
import {Link, useHistory} from 'react-router-dom';
import { init, send } from '@emailjs/browser';
import Header from '../../../components/header/Header'
import Footer from '../../../components/footer/Footer'
import NFTContext from '../../../context/NFTContext'
import {
  NFTContractABI, collectionContractABI
} from '../../../constant/contractABI';
import { networkCollections } from "../../../constant/collections"
import { useMoralis, useMoralisWeb3Api } from 'react-moralis'
import Web3 from 'web3'
import { ignoreNFT } from '../../../constant/ignore';
import { config } from "../../../constant/config"
import Image from '../../../components/custom/Image'
const defaultCollectionAddress = config.contractAddress;
const emailjs_service = config.emailjs_service
const emailjs_template = config.emailjs_template
const emailjs_userId = config.emailjs_userId

init(emailjs_userId)

const sleep = (timeToSleep) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve()
    }, timeToSleep)
  })
}

const isIpfs = (uri) => {
  if (uri && (uri.includes('/ipfs/') || uri.includes('ipfs://'))) {
    return true
  } else {
    return false
  }
}
const isBurned = (address) => {
  if (address && (address.toLowerCase() === '0x0000000000000000000000000000000000000001' || address.toLowerCase() === '0x000000000000000000000000000000000000dead')) return true
  else return false
}

function isBase64(str) {
  if (str ==='' || str.trim() ===''){ return false; }
  try {
      return btoa(atob(str)) === str;
  } catch (err) {
      return false;
  }
}

const getIPFSSufix = (uri) => {
  const substr = uri.substring(uri.length - 4)
  if(substr === "json") return "json";
  if (uri.includes('http')) return 'url'
  return "";
}



const getImageURI = (uri) => {
  if (isBase64(uri)) return uri
  if (isIpfs(uri)) {
    let ipfsPos = uri.lastIndexOf('ipfs')
    let subUri = uri.substring(ipfsPos + 4)
    while (subUri && subUri.length > 0) {
      const firstCharacter = subUri[0]
      if (!firstCharacter.match(/[a-z]/i)) subUri = subUri.substring(1)
      else break
    }
    return "https://operahouse.mypinata.cloud/ipfs/" + subUri
  } else {
    return uri
  }
}

const isIdInURI = (uri) => {
  let slashCount = 0;
  for(let i = 0; i < uri.length; i++) {
    if(uri[i] === "/") slashCount++;
  }
  if(slashCount <= 2) return false;
  return true;
}
const getTokenURI = (id, ipfsPrefix, ipfsSufix, involveId, locationQm) => {
  if(involveId) {
    if (locationQm.includes('/')) {
      if (ipfsPrefix && ipfsPrefix.includes('Qm')) {
        let arr = locationQm.split('/')
        if (arr && arr.length > 1) {
          let name = arr[1]
          if (ipfsPrefix[ipfsPrefix.length - 1] === '/') {
            return ipfsPrefix + name;
          } else {
            return ipfsPrefix + '/' + name;
          }
        } else {
          return "https://operahouse.mypinata.cloud/ipfs/" + locationQm;
        }
      } else if (!ipfsPrefix || ipfsPrefix === '') {
        if (locationQm && locationQm.length > 0 && locationQm[0] === '/') {
          return "https://operahouse.mypinata.cloud/ipfs" + locationQm;
        } else {
          return "https://operahouse.mypinata.cloud/ipfs/" + locationQm;
        }
      } else {
        if ((locationQm && locationQm.length > 0 && locationQm[0] === '/') || (ipfsPrefix && ipfsPrefix.length > 0 && ipfsPrefix[ipfsPrefix.length - 1] === '/')) {
          return ipfsPrefix + locationQm;
        } else {
          return ipfsPrefix + '/' + locationQm;
        }
      }
    } else {
      if (ipfsSufix !== 'url')
        return ipfsPrefix + id + ipfsSufix;
      else return ipfsPrefix + id
    }
  } else{
    if (locationQm && locationQm.length > 0 && locationQm[0] === '/') {
      return "https://operahouse.mypinata.cloud/ipfs" + locationQm;
    } else {
      return "https://operahouse.mypinata.cloud/ipfs/" + locationQm;
    }
  }
}

const getAssetType = (url) => {
  if (url) {
    if(url.indexOf(".mp4") !== -1) return "video";
    if(url.indexOf(".m4v") !== -1) return "video";
    if(url.indexOf(".avi") !== -1) return "video";
    if(url.indexOf(".mp3") !== -1) return "video";
    if(url.indexOf(".png") !== -1) return "image";
    if(url.indexOf(".jpeg") !== -1) return "image";
    if(url.indexOf(".jpg") !== -1) return "image";
    if(url.indexOf(".gif") !== -1) return "image";
  }
  return "other";
}


const minPrice = config.submitPrice
const adminAddress = config.adminAddress

const SubmitWeb3Form = () => {
  const [name, setName] = useState()
  const [email, setEmail] = useState()
  const [address1, setAddress1] = useState()
  const [address2, setAddress2] = useState()
  const [country, setCountry] = useState()
  const [state, setState] = useState()
  const [collections, setCollections] = useState([])
  const [nfts, setNfts] = useState([])
  const [collection, setCollection] = useState()
  const [nft, setNft] = useState()
  const [selectedNft, setSelectedNFT] = useState()
  const [nftsToShow, setNftsToShow] = useState()
  const [moreItems, setMoreItems] = useState()
  const [size, setSize] = useState()
  const [medium, setMedium] = useState()
  const [paid, setPaid] = useState(false)
  const [paying, setPaying] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [price, setPrice] = useState()
  const { walletAddress, collections: allCollections } = useContext(NFTContext)
  const { Moralis, web3, isWeb3Enabled, isAuthenticated, isInitialized, isWeb3EnableLoading } = useMoralis()
  const Web3Api = useMoralisWeb3Api()

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

  const getIPFSPrefix = useCallback((collectionAddress) => {
    for(let i = 0; i < allCollections.length; i++) {
      const collection = allCollections[i]
      if(collection.address === collectionAddress) {
        return collection.prefix;
      }
    }
    return "";
  }, [allCollections])

  const getCollectionOwner = (collectionAddress) => {
    for(let i = 0; i < allCollections.length; i++) {
      if(allCollections[i].address && allCollections[i].address.toLowerCase() === collectionAddress.toLowerCase())
        return allCollections[i].collecionOwner.toLowerCase();
    }
    return "";
  }

  const getAbbrWalletAddress = (walletAddress) => {
    if (walletAddress) {
      let abbrWalletAddress = walletAddress.substring(0, 4) + "..." + walletAddress.substring(38, 42);
      return abbrWalletAddress.toLowerCase();
    }
  }

  const getRoyalty = (collectionAddress) => {
    for(let i = 0; i < allCollections.length; i++) {
      if(allCollections[i].address.toLowerCase() === collectionAddress.toLowerCase())
        return allCollections[i].royalty;
    }
    return "";
  }



  const getIndexWithAddress = (address) => {
    for(let i = 0; i < allCollections.length; i++) {
      if(allCollections[i].address.toLowerCase() === address.toLowerCase()){
        return i;
      }
    }
    return -1;
  }

  const getCollectionWithAddress = useCallback((address) => {
    for(let i = 0; i < allCollections.length; i++) {
      if(allCollections[i].address.toLowerCase() === address.toLowerCase()){
        return allCollections[i];
      }
    }
    return null;
  }, [allCollections])

  const getCollectionAddresses = useCallback(() => {
    const addresses = []
    for(let i = 0; i < allCollections.length; i++) {
      addresses.push(allCollections[i].address.toLowerCase())
    }
    return addresses
  }, [allCollections])

  const handlePay = () => {
    if (!name || name === '') {
      return;
    }
    if (!email || email === '') {
      return;
    }
    if (!address1 || address1 === '') {
      return;
    }
    if (!country || country === '') {
      return;
    }
    if (!state || state === '') {
      return;
    }
    if (!collection || collection === '') {
      return;
    }
    if (!nft || nft === '') {
      return;
    }
    if (!size || size === '') {
      return;
    }
    if (!medium || medium === '') {
      return;
    }
    const options = { type: 'native', amount: Moralis.Units.ETH(minPrice), receiver: adminAddress }
    setPaying(true)
    Moralis.transfer(options)
    .then((res) => {
      setPaying(false)
      setPaid(true)
    })
    .catch((err) => {
      setPaying(false)
    })
  }

  const handleSubmit = () => {
    if (!name || name === '') {
      return;
    }
    if (!email || email === '') {
      return;
    }
    if (!address1 || address1 === '') {
      return;
    }
    if (!country || country === '') {
      return;
    }
    if (!state || state === '') {
      return;
    }
    if (!collection || collection === '') {
      return;
    }
    if (!nft || nft === '') {
      return;
    }
    if (!size || size === '') {
      return;
    }
    if (!medium || medium === '') {
      return;
    }
    setSubmitting(true)
    const data = { name, email, address1, address2, country, state, collection, nft, size, medium, walletAddress }
    send(emailjs_service, emailjs_template, data)
    .then((res) => {
      setSubmitted(true)
      setSubmitting(false)
    })
    .catch(() => {
      setSubmitting(false)
    })
  }

  useEffect(() => {
    (async () => {
      try {
        if (walletAddress && isInitialized && isAuthenticated && isWeb3Enabled && allCollections?.length) {
          let totalTokenCount = 0;
          const NFTContractInstance = await getContractInstance(NFTContractABI, defaultCollectionAddress);
          let failedItems = []
          while (true) {
            const result = await NFTContractInstance.methods.totalTokenCount().call()
              .catch((err) => {
                return null
              })
            if (result !== null) {
              totalTokenCount = Number(result)
              break
            }
            sleep(100)
          }
          const defaultCollectionInfo = getCollectionWithAddress(defaultCollectionAddress)
          const { address, name } = defaultCollectionInfo
          let collections = []
          const getDefaultItem = async (id) => {
            try {
              let result = await NFTContractInstance.methods.ownerOf(id).call()
                // eslint-disable-next-line no-loop-func
                .then((result) => {
                  if (result) {
                    if(result.toLowerCase() !== walletAddress.toLowerCase()) return false;
                    if (walletAddress && result.toLowerCase() === walletAddress.toLowerCase()) return true
                    return true
                  } else return false
                })
              if (result) {
                const result = await NFTContractInstance.methods.getMetadata(id).call()
                let cardItem = {};
                cardItem.collectionAddress = defaultCollectionAddress;
                cardItem.id = id;
                cardItem.creater = result.creater;
                cardItem.likes = 0;
                cardItem.avatarImg = '1';
                cardItem.assetURI = getImageURI(result.assetURI);
                cardItem.title = result.title;
                if (defaultCollectionInfo) cardItem.category = defaultCollectionInfo.category
                if (result.assetType && result.assetType !== '') {
                  cardItem.assetType = result.assetType
                } else {
                  cardItem.assetType = getAssetType(result.assetURI)
                }
                if(result.sellPending) cardItem.isOnSale = true
                else cardItem.isOnSale = false
                return { result: true, data: cardItem }
              } else {
                return null
              }
            } catch (err) {
              if (err && err.message && err.message.includes('nonexistent')) return null
              return { result: false, data: id }
            }
          }
          let startId = 1
          while(startId <= totalTokenCount) {
            let promises = []
            let endId = startId + 19
            if (endId > totalTokenCount) endId = totalTokenCount + 1
            for(let id = startId; id <= endId; id++) {
              promises.push(getDefaultItem(id))
            }
            const fetchedItems = await Promise.all(promises);
            console.log(ignoreNFT)
            let nfts = fetchedItems.filter((item) => {
              if (item && item.result && item.data) {
                const { data } = item
                if (ignoreNFT.includes(Number(data.id))) return false
                return true
              }
              return false
            })
            nfts = nfts.map(({ data }) => data)
            nfts.sort(function(a,b){return a.id-b.id});
            if (nfts.length > 0) {
              collections = [{address, name}]
              setCollections([{address, name}])
              setMoreItems(nfts)
            }
            failedItems = fetchedItems.filter((item) => (item && !item.result))
            startId += 20
          }
          const timeoutHandler = setInterval(async () => {
            if (failedItems && failedItems.length !== 0) {
              const fetchedItems = await Promise.all(failedItems.map((item) => getDefaultItem(item.data)));
              if (fetchedItems.length === 0) {
                clearInterval(timeoutHandler)
                return
              }
              let nfts = fetchedItems.filter((item) => {
                if (item) {
                  const { data } = item
                  if (ignoreNFT.includes(Number(data.id))) return false
                  if(data.isOwner) {
                    return true
                  }
                }
                return false
              })
              nfts = nfts.map(({ data }) => data)
              nfts.sort(function(a,b){return a.id-b.id});
              setMoreItems(nfts)
              failedItems = fetchedItems.filter((item) => (item && !item.result))
            } else {
              clearInterval(timeoutHandler)
            }
          }, 5000)

          const options = { address: walletAddress, chain: "0xfa" }
          let nfts = null
          let totalItems = 0
          while (true) {
            const response =  await Web3Api.account.getNFTs(options)
            .catch((err) => {
              return null
            })
            if (response !== null) {
              const { result, total } = response
              nfts = result
              totalItems = total
              break
            }
            await sleep(100)
          }
          if (totalItems > 0) {
            const getItemMetaData = async (data) => {
              try {
                let cardItem = {};
                const collectionInfo = getCollectionWithAddress(data.token_address)
                if (!collectionInfo) return
                let tokenURI = '';
                let ipfsPrefix = getIPFSPrefix(data.token_address);

                let uri = data.token_uri
                if (!isIpfs(uri)) {
                  const collectionContractInstance = await getContractInstance(collectionContractABI, data.token_address);
                  const result = await collectionContractInstance.methods.tokenURI(data.token_id).call()
                    .catch(() => null)
                  if (result) uri = result
                }
                try {
                  const p = uri.indexOf('?')
                  if (p !== -1) {
                    const subStr = uri.slice(p, uri.length)
                    if (!subStr.includes('?index='))
                      uri = uri.slice(0, p)
                  }
                  const ipfsSufix = getIPFSSufix(uri);
                  if (!isIpfs(uri) || isBase64(uri)) {
                    tokenURI = uri
                  } else if (ipfsSufix === 'url') {
                    if (uri.includes('ipfs') && uri.includes('Qm') ) {
                      let p = uri.indexOf("Qm");
                      let locationQm = ""
                      if (p !== -1) locationQm = uri.substring(p)
                      tokenURI = 'https://operahouse.mypinata.cloud/ipfs/' + locationQm
                    } else {
                      tokenURI = uri
                    }
                  } else {
                    let involveId = isIdInURI(uri);
                    let ipfsPos = uri.lastIndexOf('/ipfs/')
                    let subUri = uri.substring(ipfsPos + 6)
                    while (subUri && subUri.length > 0) {
                      const firstCharacter = subUri[0]
                      if (!firstCharacter.match(/[a-z]/i)) subUri = subUri.substring(1)
                      else break
                    }
                    tokenURI = getTokenURI(data.token_id, ipfsPrefix, ipfsSufix, involveId, subUri);
                  }
                } catch (err) {

                }
                let metadata = {}
                const assetType = await getAssetType(tokenURI)
                if (assetType === 'other') {
                  try {
                    const response = await fetch(tokenURI);
                    metadata = await response.json();
                  } catch (err) {
                    try {
                      await sleep(100)
                      const response = await fetch(tokenURI);
                      metadata = await response.json();
                    } catch (err) {
                    }
                  }
                }
                cardItem.collectionAddress = data.token_address;
                cardItem.id = data.token_id;
                cardItem.likes = 0;
                cardItem.avatarImg = '1';
                if (collectionInfo.replacement && collectionInfo.replacementPrefix) {
                  cardItem.assetURI = '/img/replacements/' + collectionInfo.replacementPrefix + data.token_id + collectionInfo.replacementSubfix;
                  cardItem.assetType = await getAssetType(cardItem.assetURI)
                  cardItem.title = metadata.name;
                } else {
                  if (assetType !== 'other') {
                    cardItem.assetURI = getImageURI(metadata.image);
                    cardItem.assetType = getAssetType(cardItem.assetURI)
                    cardItem.title = collectionInfo.name + ' ' + ("00" + data.token_id).slice(-3);
                  } else {
                    cardItem.assetURI = getImageURI(metadata.image);
                    cardItem.assetType = getAssetType(cardItem.assetURI)
                    cardItem.title = metadata.name;
                  }
                }
                cardItem.category = collectionInfo.category
                cardItem.price = 0;
                cardItem.stock = 6;
                cardItem.isOwner = true;
                cardItem.isOnSale = false;
                cardItem.tokenOwnerAddress = walletAddress.toLowerCase()

                if (metadata) {
                  const { attributes } = metadata
                  if (attributes && Array.isArray(attributes)) {
                    cardItem.attributes = attributes
                    const arr = attributes.filter((item) => item.frequency)
                    if (arr && arr.length) {
                      let rarityAttrs = arr.map(({frequency}) => {
                        let value = 0
                        if (frequency.includes('%')) {
                          value = frequency.replace('%', '')
                        }
                        return Number(value)
                      })
                      let sum = 0
                      rarityAttrs.forEach(element => {
                        sum += 1/element
                      })
                      cardItem.rarityScore = Number((rarityAttrs.length / sum).toFixed(2))
                    }
                  }
                }

                await NFTContractInstance.methods.otherTokenStatus(data.token_address, data.token_id).call()
                  .then(async (info) => {
                    if (info && info.sellPending) {
                      cardItem.price = Number(info.price);
                      cardItem.isOnSale = true
                    }
                  })
                  .catch((err) => {
                  });
                  setMoreItems([{...cardItem}])
                } catch (err) {
                }
            }
            const collectionAddresses = getCollectionAddresses()
            const collectionAddr = []
            nfts = nfts?.filter((item) => {
              if (item && item.token_address) {
                if (collectionAddresses.includes(item.token_address.toLowerCase())) {
                  if (!collectionAddr.includes(item.token_address)) collectionAddr.push(item.token_address)
                  return true
                }
              }
              return false
            })
            const newCollecitons = collectionAddr.map((address) => {
              const { name } = getCollectionWithAddress(address)
              return { name, address }
            })
            collections = [...collections, ...newCollecitons]
            collections.sort(function (a, b) {
              if (a.name > b.name ) return 1
              else if (a.name < b.name) return -1
              else return 0
            })
            setCollections(collections)
            // setCardItems([...cardItemsCopy, ...items])
            for (let index = 0; index < nfts.length; index++) {
              const element = nfts[index];
              await getItemMetaData(element)
            }
          }
        }
      } catch (err) {
      }
    })()
  }, [walletAddress, getContractInstance, Web3Api.account, isInitialized, isAuthenticated, isWeb3Enabled, allCollections, getCollectionWithAddress, getCollectionAddresses, getIPFSPrefix])

  useEffect(() => {
    if (moreItems && moreItems.length > 0) {
      const _moreItems = moreItems.filter((item) => {
        if (!nfts.some(({ id, collectionAddress }) => (item && item.id === id && item.collectionAddress === collectionAddress))) {
          return true
        } else return false
      })
      setNfts([...nfts, ..._moreItems])
    }
  }, [moreItems])

  useEffect(() => {
    if (collection) {
      const newNfts = nfts.filter(({collectionAddress}) => {
        if (collection === collectionAddress) return true
      })
      setNftsToShow(newNfts)
    }
  }, [collection, nfts])

  useEffect(() => {
    if (collection && nft) {
      const newNft = nfts.find(({ collectionAddress, id }) => (collection === collectionAddress && nft === id))
      setSelectedNFT(newNft)
    }
  }, [collection, nft, nfts])

  return (
    <>
    <div style={{flexGrow: 1}}>
      <Header />
      <div className="requests">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8 col-md-10 requests__content">
              <div className="requests__wrap space-y-20">
                <div className="text-center mx-auto" style={{marginTop:"-55px"}}>
                <img src="/img/logos/oh.png" alt="Opera House"/>
                <br />
                  <h2 className="text-center" style={{marginTop: "20px"}}>Encore Premium</h2>
                  NFT Printing Service
                </div>
                <div className="box is__big" style={{fontWeight: "600", fontSize: "10pt"}}>
                  <div className="space-y-20 mb-0">
                    <div className="space-y-10">
                      <span className="nameInput">What is your full name?</span>
                      <input
                        type="text"
                        className="form-control"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Needs to be your real name..."
                        style={{borderRadius: "100px"}}
                      />
                    </div>
                    <div className="space-y-10">
                      <span className="nameInput">What is your email address?</span>
                      <input
                        type="email"
                        className="form-control"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Needs to be a valid email address.."
                        style={{borderRadius: "100px"}}
                      />
                    </div>
                    <div className="space-y-10">
                      <span className="nameInput">Address Line 1:</span>
                      <input
                        type="text"
                        className="form-control"
                        value={address1}
                        onChange={(e) => setAddress1(e.target.value)}
                        placeholder="Eg. 100 Opera House Street, City and Postal Code"
                        style={{borderRadius: "100px"}}
                      />
                    </div>
                    <div className="space-y-10">
                      <span className="nameInput">Address Line 2</span>
                      <input
                        type="text"
                        className="form-control"
                        value={address2}
                        onChange={(e) => setAddress2(e.target.value)}
                        placeholder="Eg. Opera Fields Villa or APT "
                        style={{borderRadius: "100px"}}
                      />
                    </div>
                    <div className="space-y-10">
                      <span className="nameInput">What is the country for delivery?</span>
                      <select
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="form-select custom-select"
                        style={{borderRadius: "100px"}}
                      >
                        <option value="" hidden>Select Country</option>
                        {/* <option value="AF">Afghanistan</option> */}
                        {/* <option value="AX">Åland Islands</option> */}
                        <option value="AL">Albania</option>
                        {/* <option value="DZ">Algeria</option> */}
                        <option value="AS">American Samoa</option>
                        {/* <option value="AD">Andorra</option> */}
                        {/* <option value="AO">Angola</option> */}
                        {/* <option value="AI">Anguilla</option> */}
                        {/* <option value="AQ">Antarctica</option> */}
                        {/* <option value="AG">Antigua and Barbuda</option> */}
                        <option value="AR">Argentina</option>
                        <option value="AM">Armenia</option>
                        <option value="AW">Aruba</option>
                        <option value="AU">Australia</option>
                        <option value="AT">Austria</option>
                        {/* <option value="AZ">Azerbaijan</option> */}
                        <option value="BS">Bahamas</option>
                        <option value="BH">Bahrain</option>
                        <option value="BD">Bangladesh</option>
                        <option value="BB">Barbados</option>
                        <option value="BY">Belarus</option>
                        <option value="BE">Belgium</option>
                        <option value="BZ">Belize</option>
                        <option value="BJ">Benin</option>
                        <option value="BM">Bermuda</option>
                        {/* <option value="BT">Bhutan</option> */}
                        <option value="BO">Bolivia, Plurinational State of</option>
                        <option value="BQ">Bonaire, Sint Eustatius and Saba</option>
                        {/* <option value="BA">Bosnia and Herzegovina</option> */}
                        {/* <option value="BW">Botswana</option> */}
                        {/* <option value="BV">Bouvet Island</option> */}
                        <option value="BR">Brazil</option>
                        <option value="IO">British Indian Ocean Territory</option>
                        {/* <option value="BN">Brunei Darussalam</option> */}
                        <option value="BG">Bulgaria</option>
                        {/* <option value="BF">Burkina Faso</option> */}
                        {/* <option value="BI">Burundi</option> */}
                        {/* <option value="KH">Cambodia</option> */}
                        {/* <option value="CM">Cameroon</option> */}
                        <option value="CA">Canada</option>
                        {/* <option value="CV">Cape Verde</option> */}
                        <option value="KY">Cayman Islands</option>
                        {/* <option value="CF">Central African Republic</option> */}
                        {/* <option value="TD">Chad</option> */}
                        <option value="CL">Chile</option>
                        <option value="CN">China</option>
                        <option value="CX">Christmas Island</option>
                        {/* <option value="CC">Cocos (Keeling) Islands</option> */}
                        <option value="CO">Colombia</option>
                        {/* <option value="KM">Comoros</option> */}
                        {/* <option value="CG">Congo</option> */}
                        {/* <option value="CD">Congo, the Democratic Republic of the</option> */}
                        <option value="CK">Cook Islands</option>
                        <option value="CR">Costa Rica</option>
                        {/* <option value="CI">Côte d'Ivoire</option> */}
                        <option value="HR">Croatia</option>
                        <option value="CU">Cuba</option>
                        <option value="CW">Curaçao</option>
                        <option value="CY">Cyprus</option>
                        <option value="CZ">Czech Republic</option>
                        <option value="DK">Denmark</option>
                        <option value="DJ">Djibouti</option>
                        <option value="DM">Dominica</option>
                        <option value="DO">Dominican Republic</option>
                        <option value="EC">Ecuador</option>
                        {/* <option value="EG">Egypt</option> */}
                        <option value="SV">El Salvador</option>
                        <option value="GQ">Equatorial Guinea</option>
                        <option value="ER">Eritrea</option>
                        <option value="EE">Estonia</option>
                        {/* <option value="ET">Ethiopia</option> */}
                        <option value="FK">Falkland Islands (Malvinas)</option>
                        <option value="FO">Faroe Islands</option>
                        <option value="FJ">Fiji</option>
                        <option value="FI">Finland</option>
                        <option value="FR">France</option>
                        <option value="GF">French Guiana</option>
                        <option value="PF">French Polynesia</option>
                        <option value="TF">French Southern Territories</option>
                        {/* <option value="GA">Gabon</option> */}
                        {/* <option value="GM">Gambia</option> */}
                        <option value="GE">Georgia</option>
                        <option value="DE">Germany</option>
                        {/* <option value="GH">Ghana</option> */}
                        <option value="GI">Gibraltar</option>
                        <option value="GR">Greece</option>
                        <option value="GL">Greenland</option>
                        <option value="GD">Grenada</option>
                        <option value="GP">Guadeloupe</option>
                        <option value="GU">Guam</option>
                        <option value="GT">Guatemala</option>
                        {/* <option value="GG">Guernsey</option> */}
                        {/* <option value="GN">Guinea</option> */}
                        {/* <option value="GW">Guinea-Bissau</option> */}
                        {/* <option value="GY">Guyana</option> */}
                        <option value="HT">Haiti</option>
                        {/* <option value="HM">Heard Island and McDonald Islands</option> */}
                        {/* <option value="VA">Holy See (Vatican City State)</option> */}
                        <option value="HN">Honduras</option>
                        <option value="HK">Hong Kong</option>
                        <option value="HU">Hungary</option>
                        <option value="IS">Iceland</option>
                        <option value="IN">India</option>
                        <option value="ID">Indonesia</option>
                        {/* <option value="IR">Iran, Islamic Republic of</option> */}
                        <option value="IQ">Iraq</option>
                        <option value="IE">Ireland</option>
                        {/* <option value="IM">Isle of Man</option> */}
                        <option value="IL">Israel</option>
                        <option value="IT">Italy</option>
                        <option value="JM">Jamaica</option>
                        <option value="JP">Japan</option>
                        {/* <option value="JE">Jersey</option> */}
                        {/* <option value="JO">Jordan</option> */}
                        {/* <option value="KZ">Kazakhstan</option> */}
                        {/* <option value="KE">Kenya</option> */}
                        <option value="KI">Kiribati</option>
                        {/* <option value="KP">Korea, Democratic People's Republic of</option> */}
                        <option value="KR">Korea, Republic of</option>
                        <option value="KW">Kuwait</option>
                        <option value="KG">Kyrgyzstan</option>
                        <option value="LA">Lao People's Democratic Republic</option>
                        <option value="LV">Latvia</option>
                        <option value="LB">Lebanon</option>
                        <option value="LS">Lesotho</option>
                        {/* <option value="LR">Liberia</option> */}
                        {/* <option value="LY">Libya</option> */}
                        <option value="LI">Liechtenstein</option>
                        <option value="LT">Lithuania</option>
                        <option value="LU">Luxembourg</option>
                        <option value="MO">Macao</option>
                        <option value="MK">Macedonia, the former Yugoslav Republic of</option>
                        <option value="MG">Madagascar</option>
                        <option value="MW">Malawi</option>
                        <option value="MY">Malaysia</option>
                        <option value="MV">Maldives</option>
                        <option value="ML">Mali</option>
                        <option value="MT">Malta</option>
                        <option value="MH">Marshall Islands</option>
                        {/* <option value="MQ">Martinique</option> */}
                        {/* <option value="MR">Mauritania</option> */}
                        {/* <option value="MU">Mauritius</option> */}
                        {/* <option value="YT">Mayotte</option> */}
                        <option value="MX">Mexico</option>
                        <option value="FM">Micronesia, Federated States of</option>
                        <option value="MD">Moldova, Republic of</option>
                        <option value="MC">Monaco</option>
                        <option value="MN">Mongolia</option>
                        <option value="ME">Montenegro</option>
                        <option value="MS">Montserrat</option>
                        <option value="MA">Morocco</option>
                        {/* <option value="MZ">Mozambique</option> */}
                        <option value="MM">Myanmar</option>
                        {/* <option value="NA">Namibia</option> */}
                        <option value="NR">Nauru</option>
                        <option value="NP">Nepal</option>
                        <option value="NL">Netherlands</option>
                        <option value="NC">New Caledonia</option>
                        <option value="NZ">New Zealand</option>
                        <option value="NI">Nicaragua</option>
                        <option value="NE">Niger</option>
                        {/* <option value="NG">Nigeria</option> */}
                        {/* <option value="NU">Niue</option> */}
                        <option value="NF">Norfolk Island</option>
                        <option value="MP">Northern Mariana Islands</option>
                        <option value="NO">Norway</option>
                        {/* <option value="OM">Oman</option> */}
                        <option value="PK">Pakistan</option>
                        <option value="PW">Palau</option>
                        <option value="PS">Palestinian Territory, Occupied</option>
                        <option value="PA">Panama</option>
                        <option value="PG">Papua New Guinea</option>
                        <option value="PY">Paraguay</option>
                        <option value="PE">Peru</option>
                        <option value="PH">Philippines</option>
                        {/* <option value="PN">Pitcairn</option> */}
                        <option value="PL">Poland</option>
                        <option value="PT">Portugal</option>
                        <option value="PR">Puerto Rico</option>
                        <option value="QA">Qatar</option>
                        {/* <option value="RE">Réunion</option> */}
                        <option value="RO">Romania</option>
                        <option value="RU">Russian Federation</option>
                        {/* <option value="RW">Rwanda</option> */}
                        {/* <option value="BL">Saint Barthélemy</option> */}
                        {/* <option value="SH">Saint Helena, Ascension and Tristan da Cunha</option> */}
                        {/* <option value="KN">Saint Kitts and Nevis</option> */}
                        {/* <option value="LC">Saint Lucia</option> */}
                        {/* <option value="MF">Saint Martin (French part)</option> */}
                        {/* <option value="PM">Saint Pierre and Miquelon</option> */}
                        {/* <option value="VC">Saint Vincent and the Grenadines</option> */}
                        <option value="WS">Samoa</option>
                        {/* <option value="SM">San Marino</option> */}
                        {/* <option value="ST">Sao Tome and Principe</option> */}
                        <option value="SA">Saudi Arabia</option>
                        <option value="SN">Senegal</option>
                        {/* <option value="RS">Serbia</option> */}
                        <option value="SC">Seychelles</option>
                        {/* <option value="SL">Sierra Leone</option> */}
                        <option value="SG">Singapore</option>
                        {/* <option value="SX">Sint Maarten (Dutch part)</option> */}
                        <option value="SK">Slovakia</option>
                        <option value="SI">Slovenia</option>
                        {/* <option value="SB">Solomon Islands</option> */}
                        {/* <option value="SO">Somalia</option> */}
                        <option value="ZA">South Africa</option>
                        {/* <option value="GS">South Georgia and the South Sandwich Islands</option> */}
                        {/* <option value="SS">South Sudan</option> */}
                        <option value="ES">Spain</option>
                        <option value="LK">Sri Lanka</option>
                        {/* <option value="SD">Sudan</option> */}
                        <option value="SR">Suriname</option>
                        {/* <option value="SJ">Svalbard and Jan Mayen</option> */}
                        <option value="SZ">Swaziland</option>
                        <option value="SE">Sweden</option>
                        <option value="CH">Switzerland</option>
                        {/* <option value="SY">Syrian Arab Republic</option> */}
                        <option value="TW">Taiwan, Province of China</option>
                        {/* <option value="TJ">Tajikistan</option> */}
                        {/* <option value="TZ">Tanzania, United Republic of</option> */}
                        <option value="TH">Thailand</option>
                        {/* <option value="TL">Timor-Leste</option> */}
                        {/* <option value="TG">Togo</option> */}
                        {/* <option value="TK">Tokelau</option> */}
                        {/* <option value="TO">Tonga</option> */}
                        {/* <option value="TT">Trinidad and Tobago</option> */}
                        <option value="TN">Tunisia</option>
                        <option value="TR">Turkey</option>
                        {/* <option value="TM">Turkmenistan</option> */}
                        <option value="TC">Turks and Caicos Islands</option>
                        <option value="TV">Tuvalu</option>
                        {/* <option value="UG">Uganda</option> */}
                        <option value="UA">Ukraine</option>
                        <option value="AE">United Arab Emirates</option>
                        <option value="GB">United Kingdom</option>
                        <option value="US">United States</option>
                        <option value="UM">United States Minor Outlying Islands</option>
                        <option value="UY">Uruguay</option>
                        <option value="UZ">Uzbekistan</option>
                        <option value="VU">Vanuatu</option>
                        <option value="VE">Venezuela, Bolivarian Republic of</option>
                        <option value="VN">Viet Nam</option>
                        <option value="VG">Virgin Islands, British</option>
                        <option value="VI">Virgin Islands, U.S.</option>
                        <option value="WF">Wallis and Futuna</option>
                        {/* <option value="EH">Western Sahara</option> */}
                        <option value="YE">Yemen</option>
                        {/* <option value="ZM">Zambia</option> */}
                        {/* <option value="ZW">Zimbabwe</option> */}
                      </select>
                    </div>
                    <div className="space-y-10">
                      <span className="nameInput">What is your state/region/territory?</span>
                      <input
                        type="text"
                        className="form-control"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="State/Territory"
                        style={{borderRadius: "100px"}}
                      />
                    </div>
                    <div className="space-y-10">
                      <span className="nameInput">From which collection you want to pick?</span>
                      <select
                        value={collection}
                        onChange={(e) => setCollection(e.target.value)}
                        className="form-select custom-select"
                        style={{borderRadius: "100px"}}
                      >
                        <option value="" hidden>Select Collection</option>
                        { collections && collections.map(({ name, address }) => (
                          <option key={address} value={address}>{name}</option>
                        ))
                        }
                      </select>
                    </div>
                    <div className="space-y-10">
                      <span className="nameInput">Which NFT do you want to print?</span>
                      <select
                        value={nft}
                        onChange={(e) => setNft(e.target.value)}
                        className="form-select custom-select"
                        style={{borderRadius: "100px"}}
                      >
                        <option value="" hidden>Select NFT</option>
                        { nftsToShow && nftsToShow.map(({ id, title, collectionAddress }) => (
                          <option key={`${id}-${collectionAddress}`} value={id}>{title}</option>
                        ))
                        }
                      </select>
                    </div>
                    { selectedNft &&
                    <div className="space-y-10 d-flex justify-content-center" style={{borderRadius: "30px"}}>
                      <Image
                        src={selectedNft.assetURI}
                        placeholderImg="/img/logos/loading.gif"
                        height={200}
                        style={{borderRadius: "30px"}}
                      />
                    </div>
                    }
                    <div className="space-y-10">
                      <span className="nameInput">Size</span>
                      <select
                        value={size}
                        onChange={(e) => setSize(e.target.value)}
                        className="form-select custom-select"
                        style={{borderRadius: "100px"}}
                      >
                        <option hidden value="">Which size do you want your print?</option>
                        <option value="size 1">12"x12" (~30cm x 30cm)</option>
                        <option value="size 2">12"x16" (~30cm x 40cm)</option>
                        <option value="size 3">16"x16" (~40cm x 40cm)</option>
                        <option value="size 4">16"x20" (~40cm x 50cm)</option>
                        {/* <option value="size 5">18"x24"</option>
                        <option value="size 6">24"x36"</option> */}
                      </select>
                    </div>
                    <div className="space-y-10">
                      <span className="nameInput">Select a print type:</span>
                      <select
                        value={medium}
                        onChange={(e) => setMedium(e.target.value)}
                        className="form-select custom-select"
                        style={{borderRadius: "100px"}}
                      >
                        <option hidden value="">Select Material</option>
                        {/* <option value="size Poster">Poster</option> */}
                        <option value="size Canvas">Standard Canvas</option>
                      </select>
                    </div>
                    <div className="space-y-10 color-black">
                      <p style={{fontSize: "12pt", fontWeight: "600", marginTop: "10px"}}>⚠ Important Information</p>
                      <p style={{fontSize: "10pt", fontWeight: "300", marginBottom: "10px"}}>Make sure all the fields are correct before submitting the form. We might have to manually adjust your NFT print to make it better fit the size you have chosen. Please make sure you have read our <b><a href="https://novanetwork.io/download/OH_tcs.pdf" target="_blank">Terms & Conditions</a></b> and our <b><a href="https://novanetwork.io/download/OH_shipping_policy.pdf" target="_blank">Shipping Policy</a></b> before proceeding.</p>
                      <p style={{fontSize: "10pt", fontWeight: "400"}}>Your payment is <b>non-refundable</b>, and needs to be confirmed before we process your order. (Some exceptions apply)</p>
                      <p style={{fontSize: "10pt", fontWeight: "400"}}>Tracking will be provided via email. Please allow <b>2-4 weeks</b> for delivery. </p>                     
                      <p style={{fontSize: "10pt", marginTop: "20px", marginBottom: "10px", fontWeight: "400"}}><b>Total Order Cost:</b> 75FTM, Shipping Included</p>
                    <Popup
                      className="custom text-center"
                      trigger={
                        <button className="btn btn-sm btn-primary text-center mx-auto" style={{fontSize: "12pt", paddingTop: "15px", paddingBottom: "15px", paddingLeft: "25px", paddingRight: "25px"}}>
                          Place Order
                        </button>
                      }
                      position="bottom center"
                    >
                      <div>
                        <div
                          className="popup"
                          id="popup_bid"
                          tabIndex={-1}
                          role="dialog"
                          aria-hidden="true">
                          <div>
                            <div className="space-y-20">
                              <h3>Checkout</h3>
                              { !paid ?
                              (
                                <>
                                { paying ? (
                                  <>
                                    <p>
                                      Please wait while we process your payment. Don't refresh browser.
                                    </p>
                                  </>
                                ) : (
                                  <>
                                    <p style={{fontSize: "10pt"}}>
                                      {`You are about to pay ${minPrice} FTM to place your order. Click on 'Confirm & Pay' to continue. This payment is non-refundable. `}
                                    </p>
                                    <div className="hr" />
                                    <Link
                                      to="#"
                                      className="btn btn-primary w-full"
                                      aria-label="Close"
                                      onClick={(e) => { e.preventDefault(); handlePay() }}
                                    >
                                      Confirm & Pay
                                    </Link>
                                  </>
                                )}
                                </>
                              ) : (
                                <>{submitted? (
                                    <>
                                      <p>
                                        Your order has been placed! You will hear from us once it's been processed.
                                      </p>
                                      <div className="hr" />
                                      <Link
                                        to="/home"
                                        className="btn btn-primary w-full"
                                        aria-label="Close"
                                      >
                                        Go Back to Home
                                      </Link>
                                    </>
                                  ) : (
                                    <> {
                                      submitting ?
                                      (<>
                                        <p>
                                          Placing Order...
                                        </p>
                                      </>) : (
                                        <>
                                          <p>
                                            Payment confirmed! You can now place your order.
                                          </p>
                                          <div className="hr" />
                                          <Link
                                            to="#"
                                            className="btn btn-primary w-full"
                                            aria-label="Close"
                                            onClick={(e) => { e.preventDefault(); handleSubmit() }}
                                          >
                                            Place Order
                                          </Link>
                                        </>
                                      )
                                    }
                                    </>
                                  )}
                                </>
                              )}
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
          </div>
        </div>
      </div>
    </div>
    <Footer />
    </>
  )
}

export default SubmitWeb3Form
