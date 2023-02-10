import React, { useEffect, useState } from 'react'
import {Link, useHistory} from 'react-router-dom';
import { useMoralis } from 'react-moralis';
import Popup from 'reactjs-popup';
import {ToastContainer, toast} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { styled } from '@material-ui/core';
import Header from '../../../components/header/Header'
import useDocumentTitle from '../../../components/useDocumentTitle'
import { networkCollections } from '../../../constant/collections';
import Footer from '../../../components/footer/Footer';

const HiddenInput = styled('input')(() => ({
  display: 'none'
}))

const ImageInputWrapper = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  '& > *': {
    marginRight: 10
  }
}))

const RoundedImage = styled('img')(() => ({
  borderRadius: 10,
  maxWidth: 200
}))

const ImageInput = ({ title, onChange, imageToPreview }) => {
  const hiddenFileInput = React.useRef(null);
  
  // Programatically click the hidden file input element
  // when the Button component is clicked
  const handleClick = event => {
    hiddenFileInput.current.click();
  };

  return (
    <ImageInputWrapper>
      <div id="profile-container">
        <RoundedImage
          id="profileImage"
          src={imageToPreview ? imageToPreview: "img/avatars/avatar_3.png"}
          alt="Avatar"
          className="avatar avatar-lg border-0"
        />
      </div>
      <Link to="#" onClick={() => handleClick()} className="btn btn-dark">
        {title}
      </Link>
      <HiddenInput
        ref={hiddenFileInput}
        type="file"
        onChange={onChange}
        name="collection_image"
        placeholder="Collection Image"
        accept="image/*"
        required
        capture
      />
    </ImageInputWrapper>
  )
}

const SubmitCollection = () => {
  const { Moralis, isInitialized } = useMoralis()
  const [name, setName] = useState()
  const [address, setAddress] = useState()
  const [owner, setOwner] = useState()
  const [banner, setBanner] = useState()
  const [image, setImage] = useState()
  const [description, setDescription] = useState()
  // const [prefix, setPrefix] = useState()
  // const [ipfsUri, setIpfsUri] = useState()
  const [website, setWebsite] = useState()
  const [discord, setDiscord] = useState()
  const [twitter, setTwitter] = useState()
  const [royalty, setRoyalty] = useState()
  const [addressShort, setAddressShort] = useState()
  const [category, setCategory] = useState()
  const [minting, setMinting] = useState()
  const [maxSupply, setMaxSupply] = useState(0)
  const [price, setPrice] = useState(0)
  const [imageFile, setImageFile] = useState()
  const [bannerFile, setBannerFile] = useState()
  

  useDocumentTitle(' Submit Request');

  const handleImageChange = (event) => {
    const file = event.target.files[0]
    if(file?.type.match('image.*')) {
      setImageFile(event.target.files[0])
    } else {
      toast.error('Please select image');
    }
  }

  const handleBannerChange = (event) => {
    const file = event.target.files[0]
    if(file?.type.match('image.*')) {
      setBannerFile(event.target.files[0])
    } else {
      toast.error('Please select image');
    }
  }

  const handleSubmit = async () => {
    if (!name || name ==='') {
      return toast.error('Please insert name');
    }
    if (!address || address ==='') {
      return toast.error('Please insert address');
    }
    if (!addressShort || addressShort ==='') {
      return toast.error('Please insert short address');
    }
    if (!owner || owner ==='') {
      return toast.error('Please insert owner address');
    }
    if (!category || category ==='') {
      return toast.error('Please insert category');
    }

    let moralisImage = undefined
    let moralisBanner = undefined
    if (imageFile) {
      const name = imageFile.name ?? 'collection image'
      moralisImage = new Moralis.File(name, imageFile);
      await moralisImage.save()
        .catch(() => {
          moralisImage = null
        })
    }
    if (bannerFile) {
      const name = bannerFile.name ?? 'collection image'
      moralisBanner = new Moralis.File(name, bannerFile);
      await moralisBanner.save()
        .catch(() => {
          moralisBanner = null
        })
    }
    Moralis.Cloud.run('submitCollection', {
      name,
      address,
      owner,
      addressShort,
      description,
      // prefix,
      // ipfsUri,
      royalty: Number(royalty) > 15 ? 15 : Number(royalty),
      website,
      discord,
      twitter,
      category,
      // audit,
      // minting,
      // maxSupply: minting ? Number(maxSupply) : undefined,
      // price: minting ? Number(price) : undefined,
      image: moralisImage,
      banner: moralisBanner
    })
    .then((response) => {
      if (response && response.result) {
        toast.success('Your collection has been submitted!');
      } else {
        toast.error(response.error ?? 'Submitting failed' );
      }
    })
    .catch(() => {
      toast.error('Submitting failed' );
    })
  }

  // const handleSubmitAll = async () => {
  //   const collections = networkCollections['0xfa']
  //   const submitData = collections.map((item) => {
  //     return {
  //       ...item,
  //       owner: item.collecionOwner,
  //       description: item.collectionDescription,
  //       image: undefined,
  //       banner: undefined,
  //       maxSupply: item.maxSupply? Number(item.maxSupply) : 0,
  //       price: item.price? Number(item.price) : 0,
  //       localImage: item.image,
  //       localBanner: item.collectionBanner
  //     }
  //   })
  //   // const Collection = Moralis.Object.extend('Collection')

  //   for (let i = 0; i < submitData.length; i++ ) {
  //     await Moralis.Cloud.run('submitCollectionByAdmin', submitData[i])
  //   }
  // }

  const imageToPreview = imageFile ?  URL.createObjectURL(imageFile): (image?? null)
  const bannerToPreview = bannerFile ?  URL.createObjectURL(bannerFile): (banner?? null)
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
                  <h2 className="text-center" style={{marginTop: "20px"}}>Submit Collection</h2>
                    NFT Collection
                </div>
                <div className="box is__big" style={{fontWeight: "600", fontSize: "10pt"}}>
                  <div className="space-y-20 mb-0">
                    <div className="space-y-10">
                      <span className="nameInput">What is the collection name?</span>
                      <input
                        type="text"
                        className="form-control"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Needs to be your collections name..."
                        style={{borderRadius: "100px"}}
                      />
                    </div>
                    <div className="space-y-10">
                      <span className="nameInput">What is the collection address?</span>
                      <input
                        type="text"
                        className="form-control"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Needs to be your collections contract address..."
                        style={{borderRadius: "100px"}}
                      />
                    </div>
                    <div className="space-y-10">
                      <span className="nameInput">First 8 of collection address?</span>
                      <input
                        type="text"
                        className="form-control"
                        value={addressShort}
                        onChange={(e) => setAddressShort(e.target.value)}
                        placeholder="Example: 0x1a2b3c..."
                        style={{borderRadius: "100px"}}
                      />
                    </div>
                    <div className="space-y-10">
                      <span className="nameInput">What is collection owners address?</span>
                      <input
                        type="text"
                        className="form-control"
                        value={owner}
                        onChange={(e) => setOwner(e.target.value)}
                        placeholder="Needs to be your collection owners wallet address..."
                        style={{borderRadius: "100px"}}
                      />
                    </div>
                    <div className="space-y-10">
                      <span className="nameInput">Description</span>
                      <textarea
                        type="text"
                        className="form-control custom-select"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Enter Description here..."
                        style={{borderRadius: "100px"}}
                      />
                    </div>
                    {/* <div className="space-y-10">
                      <span className="nameInput">Prefix</span>
                      <textarea
                        type="text"
                        className="form-control"
                        value={prefix}
                        onChange={(e) => setPrefix(e.target.value)}
                        placeholder="Needs to be your collection prefix..."
                        style={{borderRadius: "100px"}}
                      />
                    </div>
                    <div className="space-y-10">
                      <span className="nameInput">IPFS URI</span>
                      <textarea
                        type="text"
                        className="form-control"
                        value={ipfsUri}
                        onChange={(e) => setIpfsUri(e.target.value)}
                        placeholder="Needs to be your collection IPFS Uri..."
                        style={{borderRadius: "100px"}}
                      />
                    </div> */}
                    <div className="space-y-10">
                      <span className="nameInput">Royalty</span>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        className="form-control"
                        value={royalty}
                        onChange = {event => {
                          const { value, min, max } = event.target
                          setRoyalty(Math.max(Number(min), Math.min(Number(max), Number(value))))
                        }}
                        placeholder="Royalty % Maximum of 10%..."
                        style={{borderRadius: "100px"}}
                      />
                    </div>
                    <div className="space-y-10">
                      <span className="nameInput">Website</span>
                      <input
                        type="text"
                        className="form-control"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="Enter Website URL..."
                        style={{borderRadius: "100px"}}
                      />
                    </div>
                    <div className="space-y-10">
                      <span className="nameInput">Discord Invite Code</span>
                      <input
                        type="text"
                        className="form-control"
                        value={discord}
                        onChange={(e) => setDiscord(e.target.value)}
                        placeholder="Enter just the invite code EXAMPLE (Kg95NyZHvd)..."
                        style={{borderRadius: "100px"}}
                      />
                    </div>
                    <div className="space-y-10">
                      <span className="nameInput">Twitter</span>
                      <input
                        type="text"
                        className="form-control"
                        value={twitter}
                        onChange={(e) => setTwitter(e.target.value)}
                        placeholder="Twitter Profile Name..."
                        style={{borderRadius: "100px"}}
                      />
                    </div>
                    <div className="space-y-10">
                      <span className="nameInput">Category</span>
                      <select
                        className="form-select custom-select"
                        aria-label="collection category"
                        name="category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                      >
                        <option disabled selected hidden>Select Category</option>
                        <option value="Art & Photography">Art & Photography</option>
                        <option value="Collectibles">Collectibles</option>
                        <option value="FNS (Fantom Name Server)">FNS (Fantom Name Server)</option>
                        <option value="Games & Virtual Worlds">Games & Virtual Worlds</option>
                        <option value="Memes">Memes</option>
                        <option value="Music">Music</option>
                        <option value="Trading Cards">Trading Cards</option>
                      </select>
                      {/* <input
                        type="text"
                        className="form-control"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="Needs to be your collection short address..."
                        style={{borderRadius: "100px"}}
                      /> */}
                    </div>
                    {/* <div className="space-y-10">
                      <span className="nameInput">Audit</span>
                      <input
                        type="text"
                        id="audit"
                        name="audit"
                        value={audit}
                        onChange={(e) => setAudit(e.target.value)}
                      />
                    </div> */}
                    {/* <div className="space-y-10">
                      <span className="nameInput">Minting</span>
                      <div style={{display: 'flex', whiteSpace: 'nowrap', alignItems: 'center'}}>
                        <span className="mr-10">False</span>
                        <input
                          type="checkbox"
                          id="minting"
                          name="minting"
                          value={minting}
                          onChange={(e) => setMinting(e.target.checked)}
                        />
                        <label htmlFor="minting">Toggle</label>
                        <span className="ml-10">True</span>
                      </div>
                    </div> */}
                    { minting && 
                    <>
                      <div className="space-y-10">
                        <span className="nameInput">Max Supply</span>
                        <input
                          type="number"
                          id="maxSupply"
                          name="maxSupply"
                          value={maxSupply}
                          onChange={(e) => setMaxSupply(e.target.value)}
                        />
                      </div>
                      <div className="space-y-10">
                        <span className="nameInput">Minting Price</span>
                        <input
                          type="number"
                          id="price"
                          name="price"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                        />
                      </div>
                    </>
                    }
                    <div className="space-y-10">
                      <ImageInput
                        title='Collection Image'
                        onChange={handleImageChange}
                        imageToPreview={imageToPreview}
                      />
                       <p>512x512</p>
                    </div>
                    <div className="space-y-10">
                      <ImageInput
                        title='Banner Image'
                        onChange={handleBannerChange}
                        
                        imageToPreview={bannerToPreview}
                      />
                      <p>2640x512</p>
                    </div>
                    <div>
                    <Popup
                      className="custom text-center"
                      trigger={
                        <button className="btn btn-sm btn-primary text-center mx-auto" style={{fontSize: "12pt", paddingTop: "15px", paddingBottom: "15px", paddingLeft: "25px", paddingRight: "25px"}}>
                          Submit collection
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
                              <h3>Submit Collection</h3>
                              <Link
                                to="#"
                                className="btn btn-primary w-full"
                                aria-label="Close"
                                onClick={(e) => { e.preventDefault(); handleSubmit() }}
                              >
                                Submit
                              </Link>
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
      <ToastContainer position="bottom-right" />
      </div>
      <Footer/>
    </>
  )
}

export default SubmitCollection
